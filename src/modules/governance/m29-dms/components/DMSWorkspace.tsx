import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types';
import { useWorkspaceAction } from '../../../../components/shell/DomainWorkspaceShell';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { TablePagination } from '../../../../components/common/TablePagination';
import { BulkActionBar } from '../../../../components/common/BulkActionBar';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import {
  Folder, FileText, ShieldCheck, UploadCloud, CheckCircle2, RefreshCw, Search,
  KeyRound, FileCode, Tag, ArrowRight, Layers, Lock, Download, Plus, X,
  FileSpreadsheet, History, CheckSquare, Eye, Shield, FileCheck, Fingerprint,
  Info, Building, AlertTriangle, Clock, GitCommit, HardDrive, Check, Zap, Server, Trash2,
  Paperclip, AlertOctagon, FileWarning, ExternalLink, ShieldAlert
} from 'lucide-react';
import { 
  DmsSubTab, DmsStatus, DmsClassification, DmsDocument, 
  MissingAttachmentReportItem, RetentionPolicy, ESignatureRecord 
} from '../types';

interface DMSWorkspaceProps {
  onSelectEntity?: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const DMSWorkspace: React.FC<DMSWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<DmsSubTab>('M29', 'vault');

  // Documents State
  const [documents, setDocuments] = useState<DmsDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<DmsDocument | null>(null);

  // Additional Subtab States
  const [missingReports, setMissingReports] = useState<MissingAttachmentReportItem[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [signatures, setSignatures] = useState<ESignatureRecord[]>([]);
  const [batchVerifying, setBatchVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // ConfirmDialog State (Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'CONTRACT',
    categoryName: 'Hợp đồng Kinh tế',
    fileSize: '0 KB',
    format: 'PDF',
    securityLevel: DmsClassification.INTERNAL,
    linkedModule: 'M08_PO',
    refDocNo: '',
    entityType: 'M08_PO',
    entityId: '',
    retentionYears: 5,
    supersedesId: '',
    fileContent: '',
  });

  // Primary Action Binding
  useEffect(() => {
    setPrimaryAction(() => () => setIsUploadModalOpen(true), 'Tải lên chứng từ');
    return () => setPrimaryAction(undefined, undefined);
  }, [setPrimaryAction]);

  // Fetch Documents
  const fetchDocuments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/dms/documents');
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading DMS docs:', err);
      if (!silent) onNotify('danger', 'Lỗi tải tài liệu', 'Không thể kết nối máy chủ DMS.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [onNotify]);

  // Fetch Auxiliary Data
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [polRes, repRes, sigRes] = await Promise.all([
        fetch('/api/dms/retention-policies'),
        fetch('/api/dms/reports/missing-attachments'),
        fetch('/api/dms/signatures'),
      ]);
      if (polRes.ok) setRetentionPolicies(await polRes.json());
      if (repRes.ok) {
        const repData = await repRes.json();
        setMissingReports(repData.items || []);
      }
      if (sigRes.ok) setSignatures(await sigRes.json());
    } catch (err) {
      console.warn('Error loading auxiliary DMS data:', err);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchAuxiliaryData();
  }, [fetchDocuments, fetchAuxiliaryData]);

  // KPI Counts
  const signedDocsCount = useMemo(() => documents.filter(d => d.status === DmsStatus.SEALED || d.status === DmsStatus.SIGNED).length, [documents]);
  const legalHoldCount = useMemo(() => documents.filter(d => d.legalHold).length, [documents]);
  const missingCount = useMemo(() => missingReports.length, [missingReports]);
  const coldGlacierCount = useMemo(() => documents.filter(d => d.storageTier === 'COLD_GLACIER').length, [documents]);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
      const matchesStatus = selectedStatus === 'ALL' || doc.status === selectedStatus;
      const matchesClassification = selectedClassification === 'ALL' || doc.classification === selectedClassification;
      const matchesSearch = !searchQuery || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.docCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.refDocNo && doc.refDocNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.sha256Hash && doc.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase()));

      // Subtab filtering
      if (activeTab === 'attachments') {
        return matchesSearch && doc.entityType && (matchesCategory && matchesStatus);
      }
      if (activeTab === 'retention_hold') {
        return matchesSearch && (doc.legalHold || (doc.retentionYears && doc.retentionYears > 0));
      }
      if (activeTab === 'signing_seal') {
        return matchesSearch && (doc.status === DmsStatus.DRAFT || doc.status === DmsStatus.APPROVED || doc.status === DmsStatus.SEALED);
      }
      if (activeTab === 'integrity_audit') {
        return matchesSearch;
      }
      
      return matchesCategory && matchesStatus && matchesClassification && matchesSearch;
    });
  }, [documents, selectedCategory, selectedStatus, selectedClassification, searchQuery, activeTab]);

  // Handle Select Document -> Global Context Bar
  const handleSelectDoc = (doc: DmsDocument) => {
    if (onSelectEntity) {
      onSelectEntity({
        type: 'DMS_DOCUMENT',
        id: doc.id,
        code: doc.docCode,
        title: `${doc.title} (${doc.version})`,
        status: doc.status,
        lineage: [
          { id: `doc-${doc.id}`, type: 'DMS Document', code: doc.docCode, relation: 'ROOT', status: doc.status },
          { id: `ref-${doc.entityId}`, type: doc.entityType || 'REF', code: doc.entityId || 'N/A', relation: 'SOURCE', status: 'VERIFIED' }
        ],
        auditTrail: [
          { id: 1, action: 'VAULT_STORE', timestamp: String(doc.createdAt || new Date().toISOString()), user: 'System', sha256Checksum: doc.sha256Hash || '' }
        ]
      });
    }
    onNotify('info', 'Đã nạp ngữ cảnh', `Tài liệu ${doc.docCode} đã được liên kết với thanh điều hướng L1.`);
  };

  // Upload Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const idempotencyKey = `dms-vault-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const res = await fetch('/api/dms/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...uploadForm, 
          idempotencyKey,
          content: uploadForm.fileContent || `NexusSync Document Content for ${uploadForm.title} - ${Date.now()}`
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Lưu tài liệu thất bại');
      
      onNotify('success', 'Đã lưu chứng từ', `Tài liệu ${data.document.docCode} đã được băm SHA-256 máy chủ và niêm phong.`);
      setIsUploadModalOpen(false);
      fetchDocuments(true);
      fetchAuxiliaryData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải lên', err.message);
    }
  };

  // Sign & Seal Document (Rule #19)
  const triggerSignDocument = (doc: DmsDocument) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Ký số & Niêm phong Mật mã (PKI/HSM)',
      message: `Xác nhận ký số và niêm phong tài liệu "${doc.title}" (${doc.docCode}). Hành động này sẽ cố định mã băm SHA-256 và phát hành sự kiện giao dịch dms.document.sealed.v1.`,
      confirmText: 'Ký số & Niêm phong',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/dms/documents/${doc.id}/sign`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signatureType: 'INTERNAL' })
          });
          if (!res.ok) throw new Error('Ký số thất bại');
          onNotify('success', 'Niêm phong hoàn tất', `Chứng từ ${doc.docCode} đã được niêm phong bất biến.`);
          fetchDocuments(true);
          fetchAuxiliaryData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi ký số', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Toggle Legal Hold (Rule #19)
  const triggerToggleLegalHold = (doc: DmsDocument) => {
    const nextState = !doc.legalHold;
    setConfirmDialog({
      isOpen: true,
      title: nextState ? 'Áp dụng Lệnh Giữ Pháp Lý (Legal Hold)' : 'Gỡ bỏ Lệnh Giữ Pháp Lý',
      message: nextState 
        ? `Tài liệu "${doc.docCode}" sẽ bị KHÓA BẢO VỆ hoàn toàn. Tuyệt đối không ai (kể cả Admin) được phép yêu cầu tiêu hủy tài liệu này khi đang trong Legal Hold.`
        : `Xác nhận gỡ bỏ trạng thái Giữ Pháp Lý cho tài liệu "${doc.docCode}".`,
      confirmText: nextState ? 'Khóa Legal Hold' : 'Xác nhận gỡ bỏ',
      variant: nextState ? 'warning' : 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch('/api/dms/retention', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ docId: doc.id, legalHold: nextState, reason: 'Quyết định Pháp chế nội bộ' })
          });
          if (!res.ok) throw new Error('Cập nhật Legal Hold thất bại');
          onNotify('success', 'Cập nhật thành công', `Đã ${nextState ? 'kích hoạt' : 'gỡ bỏ'} Legal Hold cho ${doc.docCode}.`);
          fetchDocuments(true);
        } catch (err: any) {
          onNotify('danger', 'Lỗi cập nhật', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Request Disposal (Rule #19)
  const triggerRequestDisposal = (doc: DmsDocument) => {
    if (doc.legalHold) {
      onNotify('danger', 'Bị từ chối', 'Tài liệu đang chịu Lệnh Giữ Pháp Lý (Legal Hold). Không thể tiêu hủy.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Trình duyệt Tiêu hủy Tài liệu (M28 Governance)',
      message: `Tài liệu "${doc.title}" (${doc.docCode}) sẽ được trình Hội đồng Thẩm quyền M28 phê duyệt tiêu hủy. Sau khi hoàn tất sẽ để lại bia vết (Tombstone) kiểm toán vĩnh viễn.`,
      confirmText: 'Trình duyệt M28',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/dms/documents/${doc.id}/request-disposal`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Hết thời hạn lưu trữ pháp định theo quy định kho tài liệu.' })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Yêu cầu thất bại');
          onNotify('warning', 'Đã trình duyệt', data.message || 'Yêu cầu tiêu hủy đã gửi tới M28.');
          fetchDocuments(true);
        } catch (err: any) {
          onNotify('danger', 'Lỗi tiêu hủy', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Single Integrity Verify
  const handleVerifyIntegrity = async (docId: number) => {
    try {
      const res = await fetch(`/api/dms/documents/${docId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.checksumMatches) {
        onNotify('success', 'Toàn vẹn 100%', data.message);
      } else {
        onNotify('danger', 'Cảnh báo sai lệch', data.message);
      }
    } catch (err) {
      onNotify('danger', 'Lỗi kiểm tra', 'Không thể kết nối tới dịch vụ xác thực.');
    }
  };

  // Batch Verify All
  const handleBatchVerify = async () => {
    setBatchVerifying(true);
    try {
      const res = await fetch('/api/dms/documents/batch-verify', { method: 'POST' });
      const data = await res.json();
      setVerificationResult(data);
      if (data.failed === 0) {
        onNotify('success', 'Kiểm toán toàn vẹn hoàn tất', `Toàn bộ ${data.total} tài liệu đều khớp mã băm SHA-256.`);
      } else {
        onNotify('warning', 'Phát hiện sai lệch', `Có ${data.failed}/${data.total} tài liệu phát hiện dấu hiệu can thiệp!`);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi kiểm toán hàng loạt', err.message);
    } finally {
      setBatchVerifying(false);
    }
  };

  // Quick Attach from Missing Report
  const handleQuickAttach = (item: MissingAttachmentReportItem) => {
    setUploadForm({
      ...uploadForm,
      title: `Đính kèm: ${item.title}`,
      category: item.recommendedCategory,
      categoryName: item.recommendedCategory === 'INVOICE' ? 'Hóa đơn & Kế toán' : 'Hợp đồng Kinh tế',
      linkedModule: item.module,
      refDocNo: item.docNumber,
      entityType: item.entityType,
      entityId: item.entityId,
    });
    setIsUploadModalOpen(true);
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case DmsStatus.SEALED:
      case DmsStatus.SIGNED:
        return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">NIÊM PHONG</span>;
      case DmsStatus.APPROVED:
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">ĐÃ DUYỆT</span>;
      case DmsStatus.DISPOSED:
        return <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">ĐÃ TIÊU HỦY</span>;
      case DmsStatus.SUPERSEDED:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">HẾT HIỆU LỰC</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">NHÁP</span>;
    }
  };

  // Render Security Badge
  const renderSecurityBadge = (level: string) => {
    const colors: Record<string, string> = {
      [DmsClassification.RESTRICTED]: 'bg-rose-50 text-rose-700 border-rose-200',
      [DmsClassification.CONFIDENTIAL]: 'bg-amber-50 text-amber-700 border-amber-200',
      [DmsClassification.INTERNAL]: 'bg-blue-50 text-blue-700 border-blue-200',
      [DmsClassification.PUBLIC]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${colors[level] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Executive Status Header & KPI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">M29 — DMS Digital Documents Vault</h1>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">WS28_DMS</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Kho số hóa tập trung • Niêm phong SHA-256 Server-side • Chống trùng lặp • Liên kết chứng từ Kế toán–Kho
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 text-center min-w-[110px]">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Đã Niêm Phong</p>
            <p className="text-lg font-mono tabular-nums font-bold text-emerald-400">{signedDocsCount}</p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 text-center min-w-[110px]">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Legal Hold</p>
            <p className="text-lg font-mono tabular-nums font-bold text-amber-400">{legalHoldCount}</p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 text-center min-w-[110px]">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Thiếu Đính Kèm</p>
            <p className="text-lg font-mono tabular-nums font-bold text-rose-400">{missingCount}</p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 text-center min-w-[110px]">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Kho Lạnh Glacier</p>
            <p className="text-lg font-mono tabular-nums font-bold text-cyan-400">{coldGlacierCount}</p>
          </div>
        </div>
      </div>

      {/* 2. Workspace Navigation Tabs (6 Standard Tabs) */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar shadow-sm">
        {[
          { id: 'vault', label: 'Kho Tài Liệu', icon: Folder, count: documents.length },
          { id: 'attachments', label: 'Đính Kèm Theo Chứng Từ', icon: Paperclip },
          { id: 'retention_hold', label: 'Lưu Trữ & Legal Hold', icon: Clock, badge: legalHoldCount },
          { id: 'signing_seal', label: 'Ký & Niêm Phong', icon: KeyRound },
          { id: 'integrity_audit', label: 'Toàn Vẹn & Kiểm Toán', icon: ShieldCheck },
          { id: 'missing_reports', label: 'Báo Cáo Thiếu Chứng Từ', icon: FileWarning, badge: missingCount, badgeColor: 'bg-rose-500 text-white' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DmsSubTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${tab.badgeColor || (activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700')}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 3. Operational Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã tài liệu, Tên tài liệu, Mã chứng từ tham chiếu (PO, INV, SO...), SHA-256..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
              Xóa
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="CONTRACT">Hợp đồng Kinh tế</option>
            <option value="INVOICE">Hóa đơn điện tử</option>
            <option value="FINANCIAL">Báo cáo Tài chính</option>
            <option value="TECH_SPEC">Hồ sơ Kỹ thuật / R&D</option>
            <option value="CERTIFICATE">Chứng nhận COA / QMS</option>
            <option value="GENERAL">Tài liệu chung</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value={DmsStatus.SEALED}>Niêm phong (Sealed)</option>
            <option value={DmsStatus.APPROVED}>Đã duyệt (Approved)</option>
            <option value={DmsStatus.DRAFT}>Bản nháp (Draft)</option>
            <option value={DmsStatus.DISPOSED}>Đã tiêu hủy (Disposed)</option>
            <option value={DmsStatus.SUPERSEDED}>Hết hiệu lực (Superseded)</option>
          </select>

          <select
            value={selectedClassification}
            onChange={e => setSelectedClassification(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
          >
            <option value="ALL">Tất cả bảo mật</option>
            <option value={DmsClassification.PUBLIC}>PUBLIC</option>
            <option value={DmsClassification.INTERNAL}>INTERNAL</option>
            <option value={DmsClassification.CONFIDENTIAL}>CONFIDENTIAL</option>
            <option value={DmsClassification.RESTRICTED}>RESTRICTED</option>
          </select>

          <button
            onClick={() => { fetchDocuments(); fetchAuxiliaryData(); }}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Tab Views */}
      {/* TAB 1: KHO TÀI LIỆU & TAB 2: ĐÍNH KÈM CHỨNG TỪ & TAB 4: KÝ & NIÊM PHONG */}
      {(activeTab === 'vault' || activeTab === 'attachments' || activeTab === 'signing_seal') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-3">Mã tài liệu</th>
                  <th className="px-4 py-3">Tiêu đề & Phiên bản</th>
                  <th className="px-4 py-3">Chứng từ liên kết</th>
                  <th className="px-4 py-3">Bảo mật</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Dung lượng</th>
                  <th className="px-4 py-3">Mã băm SHA-256</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Folder className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                      <p className="font-medium text-slate-500">Không tìm thấy tài liệu phù hợp.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Hãy thử đổi điều kiện lọc hoặc tải lên tài liệu mới.</p>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map(doc => (
                    <tr 
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors ${
                        selectedDocForDetail?.id === doc.id ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {doc.docCode}
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{doc.title}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="font-mono">{doc.version}</span>
                          <span>•</span>
                          <span>{doc.categoryName || doc.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {doc.entityType ? (
                          <div className="flex flex-col">
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                              {doc.refDocNo || doc.entityId}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">{doc.entityType}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa gắn</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {renderSecurityBadge(doc.classification || DmsClassification.INTERNAL)}
                      </td>
                      <td className="px-4 py-3">
                        {renderStatusBadge(doc.status)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {doc.fileSize}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 max-w-[160px] truncate" title={doc.sha256Hash || ''}>
                        {doc.sha256Hash ? `${doc.sha256Hash.slice(0, 10)}...${doc.sha256Hash.slice(-6)}` : 'Chưa băm'}
                      </td>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedDocForDetail(doc)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVerifyIntegrity(doc.id)}
                            className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 rounded-lg transition-colors"
                            title="Kiểm tra toàn vẹn SHA-256"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          {doc.status !== DmsStatus.SEALED && doc.status !== DmsStatus.DISPOSED && (
                            <button
                              onClick={() => triggerSignDocument(doc)}
                              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 rounded-lg transition-colors"
                              title="Ký & Niêm phong"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => triggerToggleLegalHold(doc)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              doc.legalHold ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100 text-slate-400'
                            }`}
                            title={doc.legalHold ? 'Đang bật Legal Hold' : 'Áp dụng Legal Hold'}
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LƯU TRỮ & LEGAL HOLD */}
      {activeTab === 'retention_hold' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Chính Sách Lưu Trữ & Danh Sách Lệnh Giữ Pháp Lý (Legal Hold)</span>
              </h2>
              <span className="text-xs text-slate-400">Tuân thủ Chuẩn VAS / ISO 27001</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                    <th className="px-3 py-2.5">Mã hồ sơ</th>
                    <th className="px-3 py-2.5">Tiêu đề</th>
                    <th className="px-3 py-2.5 text-center">Năm lưu trữ</th>
                    <th className="px-3 py-2.5 text-center">Hạn lưu trữ</th>
                    <th className="px-3 py-2.5 text-center">Legal Hold</th>
                    <th className="px-3 py-2.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-600">{doc.docCode}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-100">{doc.title}</td>
                      <td className="px-3 py-2.5 text-center font-mono tabular-nums">{doc.retentionYears || 5} năm</td>
                      <td className="px-3 py-2.5 text-center font-mono tabular-nums text-slate-500">
                        {doc.retentionUntil ? new Date(doc.retentionUntil).toLocaleDateString('vi-VN') : (doc.expireDate || 'N/A')}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {doc.legalHold ? (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            LOCKED HOLD
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Bình thường</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => triggerToggleLegalHold(doc)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                          >
                            {doc.legalHold ? 'Mở Khóa' : 'Khóa Giữ'}
                          </button>
                          <button
                            onClick={() => triggerRequestDisposal(doc)}
                            disabled={doc.legalHold}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                              doc.legalHold ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                          >
                            Tiêu Hủy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Chính Sách Mẫu Hệ Thống</h3>
            <div className="space-y-3">
              {retentionPolicies.map(pol => (
                <div key={pol.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{pol.name}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px]">
                      {pol.retentionYears} năm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{pol.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TOÀN VẸN & KIỂM TOÁN */}
      {activeTab === 'integrity_audit' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-emerald-600" />
                <span>Kiểm Toán Toàn Vẹn Mật Mã SHA-256 Chống Can Thiệp</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tất cả chứng từ niêm phong đều được đối soát với chuỗi băm gốc lúc khởi tạo theo chuẩn kiểm toán M02.
              </p>
            </div>
            <button
              onClick={handleBatchVerify}
              disabled={batchVerifying}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${batchVerifying ? 'animate-spin' : ''}`} />
              <span>{batchVerifying ? 'Đang kiểm toán...' : 'Quét Toàn Bộ Kho DMS'}</span>
            </button>
          </div>

          {verificationResult && (
            <div className={`p-4 rounded-xl border ${verificationResult.failed === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">Kết Quả Kiểm Toán Toàn Vẹn:</span>
                <span className="font-mono text-xs">{verificationResult.verifiedAt}</span>
              </div>
              <p className="text-xs mt-1">
                Tổng số hồ sơ: <span className="font-mono font-bold">{verificationResult.total}</span> | 
                Khớp chuẩn: <span className="font-mono font-bold text-emerald-600">{verificationResult.passed}</span> | 
                Sai lệch: <span className="font-mono font-bold text-rose-600">{verificationResult.failed}</span>
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lịch Sử Ký Số Điện Tử (e-Signatures)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                    <th className="px-3 py-2.5">ID Chứng Từ</th>
                    <th className="px-3 py-2.5">Người Ký</th>
                    <th className="px-3 py-2.5">Loại Ký Số</th>
                    <th className="px-3 py-2.5">Chứng Thư Serial</th>
                    <th className="px-3 py-2.5">Giá Trị Băm (Hash Value)</th>
                    <th className="px-3 py-2.5 text-right">Thời Điểm Ký</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-mono text-[11px]">
                  {signatures.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">Chưa có bản ghi ký số nào.</td>
                    </tr>
                  ) : (
                    signatures.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-3 py-2.5 text-blue-600 font-bold">#{s.docId}</td>
                        <td className="px-3 py-2.5 font-sans font-medium text-slate-800 dark:text-slate-100">{s.signerName}</td>
                        <td className="px-3 py-2.5 font-sans">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold">
                            {s.signatureType}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{s.certificateSerial || 'INTERNAL_TOKEN'}</td>
                        <td className="px-3 py-2.5 text-slate-400 truncate max-w-[180px]" title={s.hashValue}>
                          {s.hashValue}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                          {new Date(s.signedAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: BÁO CÁO THIẾU CHỨNG TỪ (F11) */}
      {activeTab === 'missing_reports' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-rose-600" />
                <span>Báo Cáo Chứng Từ Kế Toán & Kho Chưa Đính Kèm Tệp Số Hóa</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Quét tự động từ Hóa đơn M31, Đơn mua M08, và Phiếu thu chi M32. Mục đích kiểm toán, không chặn nghiệp vụ cốt lõi.
              </p>
            </div>
            <button
              onClick={fetchAuxiliaryData}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Quét lại</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 py-2.5">Phân Hệ</th>
                  <th className="px-3 py-2.5">Số Chứng Từ Gốc</th>
                  <th className="px-3 py-2.5">Mô Tả / Đối Tượng</th>
                  <th className="px-3 py-2.5 text-right">Giá Trị</th>
                  <th className="px-3 py-2.5 text-center">Mức Độ Cần Thiết</th>
                  <th className="px-3 py-2.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {missingReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-bold text-slate-700 dark:text-slate-200">Xuất sắc! Toàn bộ chứng từ phát sinh đều đã được số hóa đính kèm.</p>
                    </td>
                  </tr>
                ) : (
                  missingReports.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                          {item.moduleName}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-600">{item.docNumber}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">{item.title}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {item.amount ? `${item.amount.toLocaleString('vi-VN')} ₫` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.urgency === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.urgency}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => handleQuickAttach(item)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Số Hóa Ngay
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Detail Modal */}
      {selectedDocForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDocForDetail(null)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{selectedDocForDetail.docCode}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{selectedDocForDetail.title}</h3>
              </div>
              <button onClick={() => setSelectedDocForDetail(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Phân Loại & Bảo Mật</span>
                  <div className="mt-1 flex items-center gap-2">
                    {renderSecurityBadge(selectedDocForDetail.classification || DmsClassification.INTERNAL)}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedDocForDetail.categoryName}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Phiên Bản & Kích Thước</span>
                  <div className="mt-1 font-mono font-bold text-slate-700 dark:text-slate-200">
                    {selectedDocForDetail.version} • {selectedDocForDetail.fileSize}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Mã Băm Bảo Mật (SHA-256 Checksum)</span>
                <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all select-all">
                  {selectedDocForDetail.sha256Hash || 'Chưa băm'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Chứng Từ Gốc Tham Chiếu</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {selectedDocForDetail.refDocNo || selectedDocForDetail.entityId || 'N/A'}
                  </p>
                  <span className="text-[10px] text-slate-400">{selectedDocForDetail.entityType || 'Chưa liên kết'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Lưu Trữ Pháp Lý</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {selectedDocForDetail.retentionYears || 5} Năm (Đến: {selectedDocForDetail.expireDate || 'N/A'})
                  </p>
                  <span className="text-[10px] text-slate-400">Legal Hold: {selectedDocForDetail.legalHold ? 'ĐANG KHÓA' : 'Không'}</span>
                </div>
              </div>

              {selectedDocForDetail.fileContentBase64 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
                  <span>Tệp tin gốc được lưu trữ an toàn trong SQLite (Base64 Encoded).</span>
                  <span className="font-mono font-bold">Bền vững 100% sau restart</span>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => handleVerifyIntegrity(selectedDocForDetail.id)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Kiểm Tra Toàn Vẹn
              </button>
              {selectedDocForDetail.status !== DmsStatus.SEALED && (
                <button
                  onClick={() => triggerSignDocument(selectedDocForDetail)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Ký & Niêm Phong
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <form onSubmit={handleUploadSubmit}>
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" />
                  <span>Số Hóa & Lưu Trữ Vào Kho DMS</span>
                </h3>
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tiêu đề tài liệu</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Hợp đồng mua bán thiết bị server 2026..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={uploadForm.title}
                    onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Danh mục</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={uploadForm.category}
                      onChange={e => {
                        const val = e.target.value;
                        const nameMap: Record<string, string> = { 
                          CONTRACT: 'Hợp đồng Kinh tế', 
                          INVOICE: 'Hóa đơn điện tử',
                          FINANCIAL: 'Báo cáo Tài chính', 
                          TECH_SPEC: 'Bản vẽ Kỹ thuật / R&D', 
                          CERTIFICATE: 'Chứng chỉ & COA' 
                        };
                        setUploadForm({ ...uploadForm, category: val, categoryName: nameMap[val] || 'Tài liệu' });
                      }}
                    >
                      <option value="CONTRACT">Hợp đồng Kinh tế</option>
                      <option value="INVOICE">Hóa đơn điện tử</option>
                      <option value="FINANCIAL">Báo cáo Tài chính</option>
                      <option value="TECH_SPEC">Bản vẽ Kỹ thuật / R&D</option>
                      <option value="CERTIFICATE">Chứng chỉ & COA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phân loại bảo mật</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={uploadForm.securityLevel}
                      onChange={e => setUploadForm({ ...uploadForm, securityLevel: e.target.value as DmsClassification })}
                    >
                      <option value={DmsClassification.INTERNAL}>INTERNAL (Nội bộ)</option>
                      <option value={DmsClassification.CONFIDENTIAL}>CONFIDENTIAL (Mật)</option>
                      <option value={DmsClassification.RESTRICTED}>RESTRICTED (Tuyệt mật)</option>
                      <option value={DmsClassification.PUBLIC}>PUBLIC (Công khai)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Chứng từ chủ (Module)</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={uploadForm.entityType}
                      onChange={e => setUploadForm({ ...uploadForm, entityType: e.target.value })}
                    >
                      <option value="M08_PO">M08 - Đơn Mua Hàng (PO)</option>
                      <option value="M31_INVOICE">M31 - Hóa Đơn AR/AP</option>
                      <option value="M13_ORDER">M13 - Đơn Bán Hàng (SO)</option>
                      <option value="M32_PAYMENT">M32 - Thu Chi Ngân Quỹ</option>
                      <option value="M17_STOCK">M17 - Phiếu Nhập Xuất Kho</option>
                      <option value="M35_PROJECT">M35 - Dự Án & Nghiệm Thu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mã chứng từ gốc</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: PO-2026-001 hoặc INV-2026-002"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={uploadForm.entityId}
                      onChange={e => setUploadForm({ ...uploadForm, entityId: e.target.value, refDocNo: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nội dung tệp / Ghi chú số hóa</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập nội dung trích xuất hoặc ghi chú tài liệu để băm SHA-256..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={uploadForm.fileContent}
                    onChange={e => setUploadForm({ ...uploadForm, fileContent: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer">
                  Hủy
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer">
                  Băm SHA-256 & Lưu Trữ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. ConfirmDialog (Rule #19) */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
          variant={confirmDialog.variant}
        />
      )}
    </div>
  );
};
