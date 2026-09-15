import React, { useState, useEffect, useCallback } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types';
import { downloadDmsDocumentPdf } from '../../../../utils/pdfExporter';
import { useWorkspaceAction } from '../../../../components/shell/DomainWorkspaceShell';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import {
  Folder,
  FileText,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Search,
  KeyRound,
  FileCode,
  Tag,
  ArrowRight,
  Layers,
  Lock,
  Download,
  Plus,
  X,
  FileSpreadsheet,
  History,
  CheckSquare,
  Eye,
  Shield,
  FileCheck,
  Fingerprint,
  Info,
  Building,
  AlertTriangle,
  Clock,
  GitCommit,
  HardDrive,
  Check,
  Zap,
  Server
} from 'lucide-react';

export type DmsSubTab = 'documents' | 'signing_queue' | 'archive_vault' | 'audit_ledger';

interface DMSWorkspaceProps {
  onSelectEntity?: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const DMSWorkspace: React.FC<DMSWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<DmsSubTab>('M29', 'documents');

  // Document states
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<any | null>(null);

  // ConfirmDialog State (Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'CONTRACT',
    categoryName: 'Hợp đồng Kinh tế',
    fileSize: '2.1 MB',
    format: 'PDF',
    securityLevel: 'CONFIDENTIAL',
    linkedModule: 'M04 Sales Orders',
    refDocNo: 'SO-2026-0099',
  });

  // Primary Action Binding in Workspace Shell
  useEffect(() => {
    setPrimaryAction(() => () => setIsUploadModalOpen(true), 'Tải lên chứng từ mới');
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
      if (!silent) {
        onNotify('danger', 'Lỗi tải tài liệu', 'Không thể kết nối máy chủ DMS e-Archive.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle Select Document -> Global Context Bar
  const handleSelectDoc = (doc: any) => {
    if (onSelectEntity) {
      onSelectEntity({
        type: 'DMS_DOCUMENT',
        id: doc.id,
        code: doc.docCode ?? '',
        title: `${doc.title ?? ''} (${doc.version ?? 'v1.0'})`,
        status: doc.status ?? 'DRAFT',
        lineage: [
          { id: `doc-${doc.id}`, type: 'Chứng từ Số hóa DMS', code: doc.docCode ?? '', relation: 'ROOT_DOCUMENT', status: doc.status ?? 'ACTIVE' },
          { id: `mod-${doc.linkedModule ?? 'ERP'}`, type: 'Phân hệ ERP liên kết', code: doc.linkedModule ?? '', relation: 'ERP_SOURCE_LINK', status: 'ACTIVE' },
          { id: `ref-${doc.refDocNo ?? 'REF'}`, type: 'Mã chứng từ gốc', code: doc.refDocNo ?? '', relation: 'TRANSACTION_REF', status: 'VERIFIED' },
        ],
        auditTrail: [
          { id: 1, action: 'Khởi tạo & Tải lên tài liệu gốc', timestamp: '2026-08-20 10:00:00', user: 'Admin DMS', sha256Checksum: doc.sha256Hash ?? '' },
          { id: 2, action: doc.signedAt ? `Ký số CA điện tử bởi ${doc.signedBy}` : 'Chờ chứng thực chữ ký số', timestamp: doc.signedAt ?? '2026-08-20 14:30:00', user: doc.signedBy ?? 'Hệ thống Token HSM', sha256Checksum: doc.sha256Hash ?? '' },
        ],
        glEntries: [
          { account: 'TK-ARCHIVE', accountName: 'Kho Lưu Trữ Chứng Từ Số Hóa An Toàn', debit: 0, credit: 0, description: `Tài liệu điện tử toàn vẹn - Checksum: ${(doc.sha256Hash ?? '').slice(0, 16)}...` },
        ],
      });
    }
    onNotify('info', 'Đã tải chứng từ', `Đã nạp tài liệu ${doc.docCode ?? ''} vào Thanh Ngữ Cảnh.`);
  };

  // Upload Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/dms/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload tài liệu thất bại');
      onNotify('success', 'Tải lên tài liệu thành công', `Tài liệu mã ${data.docCode ?? ''} đã được lưu vào kho số.`);
      setIsUploadModalOpen(false);
      fetchDocuments(true);
    } catch (err: any) {
      onNotify('danger', 'Lỗi upload tài liệu', err.message ?? 'Không thể tải lên tài liệu');
    }
  };

  // Sign Document with ConfirmDialog
  const triggerSignDocument = (docId: number, docTitle?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Ký Số Điện Tử CA / Token HSM',
      message: `Bạn chuẩn bị thực hiện ký số điện tử có giá trị pháp lý cho tài liệu "${docTitle ?? `ID #${docId}`}". Chứng thư số Viettel HSM sẽ được áp dụng kèm dấu thời gian TSA và mã băm toàn vẹn SHA-256.`,
      confirmText: 'Xác nhận ký số',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/dms/documents/${docId}/sign`, { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? 'Ký số thất bại');
          onNotify('success', 'Ký số điện tử CA/HSM thành công', 'Đã cấp dấu thời gian Timestamp TSA và mã băm SHA-256.');
          fetchDocuments(true);
          if (selectedDocForDetail && selectedDocForDetail.id === docId) {
            setSelectedDocForDetail(data.document);
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi ký số', err.message ?? 'Không thể hoàn tất ký số');
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Upgrade Version with ConfirmDialog
  const triggerUpgradeVersion = (docId: number, currentVer?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Nâng Phiên Bản Tài Liệu',
      message: `Bạn chuẩn bị nâng phiên bản từ ${currentVer ?? 'v1.0'} lên phiên bản kế tiếp (+0.1). Trạng thái tài liệu sẽ chuyển về DRAFT và tái khởi động luồng trình ký 3 cấp.`,
      confirmText: 'Nâng phiên bản',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/dms/documents/${docId}/version`, { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? 'Nâng phiên bản thất bại');
          onNotify('info', 'Đã Nâng Phiên Bản Tài Liệu', data.message ?? 'Phiên bản mới đã được khởi tạo.');
          fetchDocuments(true);
          if (selectedDocForDetail && selectedDocForDetail.id === docId) {
            setSelectedDocForDetail(data.document);
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi cập nhật phiên bản', err.message ?? 'Không thể nâng phiên bản');
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Verify Checksum
  const handleVerifyChecksum = async (docId: number) => {
    try {
      const res = await fetch(`/api/dms/documents/${docId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Xác thực thất bại');
      onNotify('success', 'Xác Thực Kiểm Toán SHA-256', data.message ?? 'Mã băm toàn vẹn.');
    } catch (err: any) {
      onNotify('danger', 'Lỗi xác thực', err.message ?? 'Không thể kiểm tra mã băm');
    }
  };

  // OCR Scan with AI Gemini
  const handleOcrScan = async () => {
    try {
      const res = await fetch('/api/dms/documents/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: uploadForm.title || 'HD_Viettel_Post_2026.pdf' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Trích xuất OCR thất bại');
      const ocr = data.ocrData ?? {};
      setUploadForm({
        ...uploadForm,
        title: ocr.title ?? uploadForm.title,
        category: ocr.category ?? uploadForm.category,
        categoryName: ocr.categoryName ?? uploadForm.categoryName,
        linkedModule: ocr.linkedModule ?? uploadForm.linkedModule,
        refDocNo: ocr.refDocNo ?? uploadForm.refDocNo,
        securityLevel: ocr.securityLevel ?? uploadForm.securityLevel,
      });
      onNotify('success', 'AI Gemini OCR Trích Xuất Thành Công', data.message ?? 'Đã nhận dạng metadata chứng từ.');
    } catch (err: any) {
      onNotify('danger', 'Lỗi trích xuất OCR', err.message ?? 'Lỗi dịch vụ Gemini OCR');
    }
  };

  // Workflow Sign Stage (Legal / CFO)
  const handleWorkflowSign = async (docId: number, stage: number) => {
    try {
      const res = await fetch(`/api/dms/documents/${docId}/workflow-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Thẩm định/Ký số thất bại');
      onNotify('success', 'Cập nhật Luồng Trình Ký', data.message ?? 'Đã hoàn tất ký duyệt.');
      fetchDocuments(true);
      if (selectedDocForDetail && selectedDocForDetail.id === docId) {
        setSelectedDocForDetail(data.document);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi trình ký', err.message ?? 'Không thể cập nhật luồng trình ký');
    }
  };

  // Toggle Storage Tier with ConfirmDialog
  const triggerToggleArchive = (docId: number, currentTier?: string) => {
    const isCurrentlyCold = currentTier === 'COLD_GLACIER';
    setConfirmDialog({
      isOpen: true,
      title: isCurrentlyCold ? 'Xác Nhận Rã Đông Tài Liệu Về Active Vault' : 'Xác Nhận Đóng Băng & Chuyển Kho Lạnh Glacier',
      message: isCurrentlyCold
        ? 'Tài liệu sẽ được chuyển từ kho băng từ S3 Glacier Vault về kho lưu trữ truy cập nhanh Active Vault (S3 Standard).'
        : 'Tài liệu sẽ được niêm phong lưu trữ 10 năm tại Kho lạnh S3 Glacier Vault để phục vụ lưu trữ vĩnh viễn và kiểm toán.',
      confirmText: isCurrentlyCold ? 'Rã đông về Active' : 'Chuyển Kho Lạnh',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/dms/documents/${docId}/archive`, { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? 'Thao tác kho lưu trữ thất bại');
          onNotify('info', 'Phân Tầng Kho Lưu Trữ (Storage Tiering)', data.message ?? 'Đã cập nhật tầng lưu trữ.');
          fetchDocuments(true);
          if (selectedDocForDetail && selectedDocForDetail.id === docId) {
            setSelectedDocForDetail(data.document);
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi kho lưu trữ', err.message ?? 'Không thể chuyển tầng lưu trữ');
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Download PDF
  const handleDownloadPdf = (doc: any) => {
    try {
      const fileName = downloadDmsDocumentPdf(doc);
      onNotify('success', 'Tải Xuống PDF Thành Công', `Đã xuất tệp chứng từ điện tử ${fileName}`);
    } catch (err) {
      onNotify('danger', 'Lỗi xuất PDF', 'Không thể tạo tệp PDF chứng từ.');
    }
  };

  // Filtered Documents
  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || doc.status === selectedStatus;
    const matchesSearch =
      (doc.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.docCode ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.categoryName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.refDocNo ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesStatus && matchesSearch;
  });

  // Security Badge Renderer (WCAG AA Compliant)
  const renderSecurityBadge = (level: string) => {
    switch (level) {
      case 'CONFIDENTIAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-950 dark:bg-rose-950/90 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
            Bảo Mật
          </span>
        );
      case 'RESTRICTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-950 dark:bg-amber-950/90 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
            Giới Hạn
          </span>
        );
      case 'PUBLIC':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-950 dark:bg-emerald-950/90 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
            Công Khai
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-950 dark:bg-indigo-950/90 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
            Nội Bộ
          </span>
        );
    }
  };

  // Status Badge Renderer (WCAG AA Compliant)
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED':
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full border">
            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
            Đã Ký CA / HSM
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 text-xs font-bold rounded-full border">
            <CheckCircle2 className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />
            Đã Phê Duyệt
          </span>
        );
      case 'RELEASED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700 text-xs font-bold rounded-full border">
            <Tag className="w-3 h-3 mr-1 text-purple-600 dark:text-purple-400" />
            Đã Ban Hành
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 text-xs font-bold rounded-full border">
            <Clock className="w-3 h-3 mr-1 text-amber-600 dark:text-amber-400" />
            Chưa Ký Số (DRAFT)
          </span>
        );
    }
  };

  // Derived counts
  const signedDocsCount = documents.filter((d) => d.status === 'SIGNED' || d.status === 'VERIFIED').length;
  const pendingSignCount = documents.filter((d) => d.status !== 'SIGNED' && d.status !== 'VERIFIED').length;
  const coldGlacierCount = documents.filter((d) => d.storageTier === 'COLD_GLACIER').length;
  const techDocsCount = documents.filter((d) => d.category === 'TECH_SPEC').length;

  return (
    <div id="dms-workspace" className="space-y-4 max-w-full pb-8">
      {/* ========================================================================= */}
      {/* TẦNG L0: WORKSPACE BANNER & GOVERNANCE IDENTITY (CHUẨN M41 MASTER SPEC)    */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30">
                M29 • DIGITAL DOCUMENT VAULT &amp; E-SIGNATURE
              </span>
              <span className="text-xs text-slate-300 font-mono hidden sm:inline">
                ISO 27001 • PKI Viettel HSM • SHA-256 Audit Trail
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Hệ Thống Quản Lý Tài Liệu Số Hóa &amp; Ký Số Điện Tử (DMS e-Archive)
            </h1>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl">
              Kho lưu trữ chứng từ số hóa doanh nghiệp phân tầng S3 Vault / Cold Glacier, luồng ký số đa cấp Maker-Checker, trích xuất thông minh AI Gemini OCR và xác thực toàn vẹn mã băm bất biến.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-blue-400" />
            <span>Tải Lên Chứng Từ</span>
          </button>

          <button
            onClick={() => setActiveTab('signing_queue')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Hàng Đợi Trình Ký ({pendingSignCount})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TẦNG L2: KPI SUMMARY STRIP (CHUẨN M41 MASTER SPEC)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div id="kpi-total-docs" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tổng Tài Liệu Số Hóa</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
            {documents.length}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Lưu trữ trên Cloud S3 &amp; Vault</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div id="kpi-signed-docs" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Đã Ký Số CA / HSM</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {signedDocsCount}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Toàn vẹn mã băm SHA-256</span>
          </p>
        </div>

        {/* KPI 3 */}
        <div id="kpi-tech-drawings" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bản Vẽ &amp; Kỹ Thuật BOM</span>
            <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400 mt-1">
            {techDocsCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Liên kết MES / BOM M25</span>
          </p>
        </div>

        {/* KPI 4 */}
        <div id="kpi-audit-integrity" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Độ Toàn Vẹn Audit</span>
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 mt-1">
            100%
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Không sửa đổi trái phép</span>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TẦNG L1: SUB-TABS NAVIGATION BAR (CHUẨN M41 MASTER SPEC)                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Tab 1: Kho Chứng Từ Số Hóa */}
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Kho Chứng Từ Số Hóa (Vault)</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'documents' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {documents.length}
            </span>
          </button>

          {/* Tab 2: Hàng Đợi Trình Ký */}
          <button
            onClick={() => setActiveTab('signing_queue')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'signing_queue'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Hàng Đợi Trình Ký &amp; Duyệt CA</span>
            {pendingSignCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500 text-white">
                {pendingSignCount}
              </span>
            )}
          </button>

          {/* Tab 3: Phân Tầng Kho Lưu Trữ */}
          <button
            onClick={() => setActiveTab('archive_vault')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'archive_vault'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Phân Tầng Kho Lưu Trữ (Storage Tiering)</span>
            {coldGlacierCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500 text-white">
                {coldGlacierCount} Cold
              </span>
            )}
          </button>

          {/* Tab 4: Sổ Cái Kiểm Toán Toàn Vẹn */}
          <button
            onClick={() => setActiveTab('audit_ledger')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'audit_ledger'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sổ Cái Kiểm Toán &amp; SHA-256</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Mã hóa AES-256 GCM</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            DMS Tier 3 Vault
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KHO CHỨNG TỪ SỐ HÓA (MASTER DOCUMENTS & CATEGORY TREE)             */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Cột Trái: Cây Thư Mục & Bộ Lọc Nhanh */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-2xs h-fit space-y-3">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Thư Mục Chứng Từ Số
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-blue-500" />
                  <span>Tất cả tài liệu</span>
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono font-medium">
                  {documents.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('CONTRACT')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  selectedCategory === 'CONTRACT'
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Hợp đồng Kinh tế</span>
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono font-medium">
                  {documents.filter((d) => d.category === 'CONTRACT').length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('FINANCIAL')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  selectedCategory === 'FINANCIAL'
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Hóa đơn &amp; Kế toán</span>
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono font-medium">
                  {documents.filter((d) => d.category === 'FINANCIAL').length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('TECH_SPEC')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  selectedCategory === 'TECH_SPEC'
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-500" />
                  <span>Bản vẽ Kỹ thuật BOM</span>
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono font-medium">
                  {documents.filter((d) => d.category === 'TECH_SPEC').length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('CERTIFICATE')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  selectedCategory === 'CERTIFICATE'
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>Chứng chỉ &amp; ISO</span>
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono font-medium">
                  {documents.filter((d) => d.category === 'CERTIFICATE').length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('OPERATION')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  selectedCategory === 'OPERATION'
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-500" />
                  <span>Quy trình Vận hành SOP</span>
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono font-medium">
                  {documents.filter((d) => d.category === 'OPERATION').length}
                </span>
              </button>
            </div>

            {/* Bộ Lọc Trạng Thái */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-1">
                Trạng Thái Chứng Từ
              </div>
              {[
                { id: 'ALL', label: 'Tất cả trạng thái' },
                { id: 'SIGNED', label: 'Đã Ký Số CA / HSM' },
                { id: 'APPROVED', label: 'Đã Phê Duyệt' },
                { id: 'DRAFT', label: 'DRAFT Nháp' },
                { id: 'RELEASED', label: 'Đã Ban Hành' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedStatus === st.id
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cột Phải: Thanh Công Cụ & Bảng Master Data Table */}
          <div className="lg:col-span-3 space-y-3.5">
            {/* Filter & Command Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã DMS, tên tài liệu, SO/PO/BOM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-upload-dms"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Tải Lên Chứng Từ Mới</span>
                </button>

                <button
                  onClick={() => fetchDocuments()}
                  title="Làm mới danh mục"
                  className="p-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Master Data Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="py-3 px-4">Mã DMS &amp; Phân Loại</th>
                      <th className="py-3 px-4">Tiêu Đề Chứng Từ Số</th>
                      <th className="py-3 px-4">Bảo Mật &amp; Phiên Bản</th>
                      <th className="py-3 px-4">Liên Kết ERP Gốc</th>
                      <th className="py-3 px-4">Trạng Thái Ký Số CA</th>
                      <th className="py-3 px-4 text-right">Thao Tác Quản Trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                    {filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                          Không tìm thấy tài liệu nào khớp với điều kiện lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredDocs.map((doc) => (
                        <tr
                          key={doc.id}
                          onClick={() => handleSelectDoc(doc)}
                          className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer group"
                        >
                          {/* Col 1: Mã DMS & Category */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 block w-fit">
                              {doc.docCode}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium mt-1 inline-block">
                              {doc.categoryName ?? 'Tài liệu Chung'}
                            </span>
                          </td>

                          {/* Col 2: Title & Format */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {doc.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-slate-500 dark:text-slate-400 text-[11px]">
                              <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-medium rounded border border-purple-200 dark:border-purple-700">
                                {doc.format ?? 'PDF'}
                              </span>
                              <span>•</span>
                              <span className="font-mono font-medium">{doc.fileSize ?? '1.5 MB'}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                                doc.storageTier === 'COLD_GLACIER'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                              }`}>
                                {doc.storageTier === 'COLD_GLACIER' ? 'Glacier Cold' : 'Active Vault'}
                              </span>
                            </div>
                          </td>

                          {/* Col 3: Security & Version */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 mb-1">
                              {renderSecurityBadge(doc.securityLevel)}
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                                {doc.version ?? 'v1.0'}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[130px]" title={doc.sha256Hash}>
                              SHA: {(doc.sha256Hash ?? '').slice(0, 12)}...
                            </div>
                          </td>

                          {/* Col 4: ERP Source Link */}
                          <td className="py-3 px-4">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {doc.linkedModule ?? 'ERP System'}
                            </div>
                            <div className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                              {doc.refDocNo ?? 'N/A'}
                            </div>
                          </td>

                          {/* Col 5: Status */}
                          <td className="py-3 px-4">
                            {renderStatusBadge(doc.status)}
                          </td>

                          {/* Col 6: Actions */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {doc.status !== 'SIGNED' && doc.status !== 'VERIFIED' && (
                                <button
                                  onClick={() => triggerSignDocument(doc.id, doc.title)}
                                  title="Ký số CA điện tử"
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                >
                                  <KeyRound className="w-3 h-3" />
                                  <span>Ký Số</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleDownloadPdf(doc)}
                                title="Tải tệp PDF chứng từ"
                                className="p-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              </button>

                              <button
                                onClick={() => setSelectedDocForDetail(doc)}
                                className="px-2.5 py-1 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Chi Tiết</span>
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HÀNG ĐỢI TRÌNH KÝ & DUYỆT CA (MAKER-CHECKER WORKFLOW PIPELINE)       */}
      {/* ========================================================================= */}
      {activeTab === 'signing_queue' && (
        <div className="space-y-4">
          {/* Governance Banner */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl text-xs flex items-start gap-3 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                Quy Trình Trình Ký 3 Cấp &amp; Phân Định Trách Nhiệm Độc Lập (Segregation of Duties - SoD)
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Tài liệu khởi tạo bởi Chuyên viên kinh doanh/DMS (Maker) $\rightarrow$ Thẩm định tính hợp lệ pháp lý bởi Phòng Pháp chế (Stage 2) $\rightarrow$ Ký số điện tử cấp quyền chi / phê duyệt bởi Kế toán trưởng CFO qua Token Viettel HSM (Checker).
              </p>
            </div>
          </div>

          {/* Grid Approval Requests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.filter((d) => d.status !== 'SIGNED' && d.status !== 'VERIFIED').length === 0 ? (
              <div className="col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-900 dark:text-white">Không có chứng từ nào chờ ký số</p>
                <p className="text-xs mt-1">Tất cả tài liệu số hóa đã được thẩm định và ký duyệt hoàn tất.</p>
              </div>
            ) : (
              documents
                .filter((d) => d.status !== 'SIGNED' && d.status !== 'VERIFIED')
                .map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs space-y-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {doc.docCode}
                          </span>
                          {renderSecurityBadge(doc.securityLevel)}
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1.5">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {doc.categoryName} • Liên kết: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{doc.refDocNo}</span> ({doc.linkedModule})
                        </p>
                      </div>
                      {renderStatusBadge(doc.status)}
                    </div>

                    {/* Progress Pipeline */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <span>Tiến Độ Trình Ký</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          Cấp {doc.workflowStage ?? 1}/3
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        {/* Step 1 */}
                        <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                          <div className="font-bold flex items-center justify-between">
                            <span>1. Khởi tạo</span>
                            <Check className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-[9px] text-slate-500 block">Requester</span>
                        </div>

                        {/* Step 2 */}
                        <div className={`p-2 rounded border ${
                          (doc.workflowStage ?? 1) >= 2
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                        }`}>
                          <div className="font-bold flex items-center justify-between">
                            <span>2. Pháp chế</span>
                            {(doc.workflowStage ?? 1) >= 2 ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 block">Thẩm định</span>
                        </div>

                        {/* Step 3 */}
                        <div className={`p-2 rounded border ${
                          (doc.workflowStage ?? 1) >= 3
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          <div className="font-bold flex items-center justify-between">
                            <span>3. Ký CFO</span>
                            {(doc.workflowStage ?? 1) >= 3 ? (
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Lock className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 block">Token HSM</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setSelectedDocForDetail(doc)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Chi Tiết Chứng Từ</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {(doc.workflowStage ?? 1) < 2 && (
                          <button
                            onClick={() => handleWorkflowSign(doc.id, 2)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Pháp Chế Duyệt
                          </button>
                        )}

                        <button
                          onClick={() => triggerSignDocument(doc.id, doc.title)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Ký Số CA / HSM</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PHÂN TẦNG KHO LƯU TRỮ (STORAGE TIERING & GLACIER COLD VAULT)        */}
      {/* ========================================================================= */}
      {activeTab === 'archive_vault' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Vault Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Kho Truy Cập Nhanh (Active Vault S3 Standard)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Độ trễ mili-giây, phục vụ tra cứu tức thì trên các phân hệ ERP M04/M05/M15/M30.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {documents.filter((d) => d.storageTier !== 'COLD_GLACIER').length}
                </span>
              </div>
            </div>

            {/* Cold Glacier Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Kho Băng Từ Lạnh (S3 Glacier Vault 10 Năm)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Lưu trữ vĩnh viễn, niêm phong chống sửa đổi, tiết kiệm 80% chi phí hạ tầng.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                  {coldGlacierCount}
                </span>
              </div>
            </div>
          </div>

          {/* Table of Storage Tier Management */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Danh Mục Tài Liệu &amp; Vòng Đời Lưu Trữ (Retention Lifecycle)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-4">Mã DMS</th>
                    <th className="py-3 px-4">Tiêu Đề Chứng Từ</th>
                    <th className="py-3 px-4">Tầng Lưu Trữ Hiện Tại</th>
                    <th className="py-3 px-4">Thời Hạn Lưu Trữ</th>
                    <th className="py-3 px-4 text-right">Điều Phối Tầng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {doc.docCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {doc.title}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                          doc.storageTier === 'COLD_GLACIER'
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                            : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                        }`}>
                          {doc.storageTier === 'COLD_GLACIER' ? 'Glacier Cold Vault' : 'Active Vault S3'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {doc.retentionYears ?? 5} Năm (Đến {doc.expireDate ?? '2031-08-28'})
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => triggerToggleArchive(doc.id, doc.storageTier)}
                          className="px-3 py-1 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          {doc.storageTier === 'COLD_GLACIER' ? 'Rã đông về Active' : 'Chuyển Glacier Cold'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SỔ CÁI KIỂM TOÁN & TOÀN VẸN SHA-256 (AUDIT LEDGER & INTEGRITY)       */}
      {/* ========================================================================= */}
      {activeTab === 'audit_ledger' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Sổ Cái Kiểm Toán Bất Biến &amp; Dấu Vết Toàn Vẹn Mã Băm (Immutable Audit Ledger)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Ghi nhận toàn bộ thao tác ký số, thẩm định, cấp dấu thời gian Timestamp TSA và mã băm SHA-256 đối chiếu chuẩn ISO 27001.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-4">Thời Điểm &amp; Mã DMS</th>
                    <th className="py-3 px-4">Tên Chứng Từ &amp; Phiên Bản</th>
                    <th className="py-3 px-4">Người Thực Hiện &amp; Chức Danh</th>
                    <th className="py-3 px-4">Mã Băm SHA-256 Checksum</th>
                    <th className="py-3 px-4 text-right">Kiểm Tra Toàn Vẹn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block">
                          {doc.signedAt ?? '2026-08-20 10:00:00'}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {doc.docCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{doc.title}</div>
                        <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                          {doc.version ?? 'v1.0'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {doc.signedBy ?? 'Admin DMS'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all bg-slate-50 dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700 block max-w-xs">
                          {doc.sha256Hash}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleVerifyChecksum(doc.id)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Fingerprint className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Đối Chiếu SHA</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XEM CHI TIẾT CHỨNG TỪ 360° (DOCUMENT DETAIL MODAL)                 */}
      {/* ========================================================================= */}
      {selectedDocForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
            {/* Dynamic Security Watermark Overlay */}
            {(selectedDocForDetail.securityLevel === 'CONFIDENTIAL' || selectedDocForDetail.securityLevel === 'RESTRICTED') && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 rotate-[-25deg] select-none z-0">
                <div className="text-center font-mono font-black text-rose-900 dark:text-rose-200 text-xl tracking-widest space-y-2">
                  <p>SECURITY LEVEL: {selectedDocForDetail.securityLevel}</p>
                  <p>USER: ADMIN DMS • IP 192.168.1.105</p>
                  <p>NEXUSSYNC CONFIDENTIAL - DO NOT DISTRIBUTE</p>
                </div>
              </div>
            )}

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/80 rounded border border-blue-200 dark:border-blue-800">
                      {selectedDocForDetail.docCode}
                    </span>
                    {renderSecurityBadge(selectedDocForDetail.securityLevel)}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                      selectedDocForDetail.storageTier === 'COLD_GLACIER'
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                        : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                    }`}>
                      {selectedDocForDetail.storageTier === 'COLD_GLACIER' ? 'Glacier Cold Vault' : 'Active Vault S3'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {selectedDocForDetail.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative z-10">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase block mb-1 text-[11px]">Phân loại &amp; Định dạng</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedDocForDetail.categoryName} ({selectedDocForDetail.format ?? 'PDF'})</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Dung lượng: {selectedDocForDetail.fileSize ?? '1.5 MB'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase block mb-1 text-[11px]">Phiên bản &amp; Trạng thái</span>
                <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedDocForDetail.version ?? 'v1.0'} — <span className="text-emerald-600 dark:text-emerald-400">{selectedDocForDetail.status}</span></p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Người ký: {selectedDocForDetail.signedBy ?? 'Chưa ký số'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase block mb-1 text-[11px]">Liên kết ERP &amp; Mã Tham Chiếu</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedDocForDetail.linkedModule ?? 'ERP System'}</p>
                <p className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{selectedDocForDetail.refDocNo ?? 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase block mb-1 text-[11px]">Mã Băm SHA-256 Checksum</span>
                <p className="font-mono text-[10px] text-slate-700 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                  {selectedDocForDetail.sha256Hash}
                </p>
              </div>
            </div>

            {/* Multi-Stage Approval Pipeline */}
            <div className="space-y-2 relative z-10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Luồng Trình Ký Đa Cấp (Maker-Checker Pipeline)</span>
                </span>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  Cấp độ {selectedDocForDetail.workflowStage ?? 1}/3
                </span>
              </h4>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Stage 1 */}
                <div className="p-2.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>1. Khởi tạo</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">Sales / Requester</p>
                  <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 mt-1">Đã trình duyệt</p>
                </div>

                {/* Stage 2 */}
                <div className={`p-2.5 rounded-lg border ${
                  (selectedDocForDetail.workflowStage ?? 1) >= 2
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                }`}>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>2. Pháp chế</span>
                    {(selectedDocForDetail.workflowStage ?? 1) >= 2 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <button
                        onClick={() => handleWorkflowSign(selectedDocForDetail.id, 2)}
                        className="text-[10px] px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer"
                      >
                        Duyệt ngay
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">Pháp chế Doanh nghiệp</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    {(selectedDocForDetail.workflowStage ?? 1) >= 2 ? 'Đã thẩm định' : 'Chờ kiểm duyệt'}
                  </p>
                </div>

                {/* Stage 3 */}
                <div className={`p-2.5 rounded-lg border ${
                  (selectedDocForDetail.workflowStage ?? 1) >= 3
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>3. Ký số CFO</span>
                    {(selectedDocForDetail.workflowStage ?? 1) >= 3 ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <button
                        onClick={() => triggerSignDocument(selectedDocForDetail.id, selectedDocForDetail.title)}
                        disabled={(selectedDocForDetail.workflowStage ?? 1) < 2}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          (selectedDocForDetail.workflowStage ?? 1) < 2
                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        }`}
                      >
                        Ký CA
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">Kế toán trưởng (CFO)</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    {(selectedDocForDetail.workflowStage ?? 1) >= 3 ? 'Niêm phong chữ ký' : 'Chờ ký CFO'}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Trail Lineage */}
            <div className="space-y-2 relative z-10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Lịch Sử Thao Tác &amp; Dấu Vết Kiểm Toán (Audit Lineage)</span>
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-xs">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Khởi tạo &amp; Tải lên tệp chứng từ gốc</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Tác giả: Admin DMS • Cloud Vault S3</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">2026-08-20 10:00:00</span>
                </div>
                {selectedDocForDetail.signedAt && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/80 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <div>
                        <p className="font-semibold">Ký số CA/HSM &amp; Niêm phong chữ ký số</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Người ký: {selectedDocForDetail.signedBy}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">{selectedDocForDetail.signedAt}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 relative z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVerifyChecksum(selectedDocForDetail.id)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Đối Chiếu SHA</span>
                </button>

                <button
                  onClick={() => triggerUpgradeVersion(selectedDocForDetail.id, selectedDocForDetail.version)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Tăng Ver</span>
                </button>

                <button
                  onClick={() => triggerToggleArchive(selectedDocForDetail.id, selectedDocForDetail.storageTier)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                  <span>{selectedDocForDetail.storageTier === 'COLD_GLACIER' ? 'Glacier Cold' : 'Chuyển Glacier'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(selectedDocForDetail)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất File PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TẢI LÊN CHỨNG TỪ MỚI & AI GEMINI OCR                                */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Tải Lên Chứng Từ Số Hóa Mới (DMS)</span>
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                    Tên Tài Liệu / Tiêu Đề Chứng Từ
                  </label>
                  <button
                    type="button"
                    onClick={handleOcrScan}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>AI Gemini OCR Trích Xuất</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hợp đồng phân phối thiết bị IT 2026..."
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[11px] mb-1">
                    Loại Danh Mục
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const catMap: Record<string, string> = {
                        CONTRACT: 'Hợp đồng Kinh tế',
                        FINANCIAL: 'Hóa đơn & Kế toán',
                        TECH_SPEC: 'Bản vẽ Kỹ thuật BOM',
                        CERTIFICATE: 'Chứng chỉ & ISO',
                        OPERATION: 'Quy trình Vận hành SOP',
                      };
                      setUploadForm({ ...uploadForm, category: cat, categoryName: catMap[cat] ?? 'Tài liệu Chung' });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="CONTRACT">Hợp đồng Kinh tế</option>
                    <option value="FINANCIAL">Hóa đơn &amp; Kế toán</option>
                    <option value="TECH_SPEC">Bản vẽ Kỹ thuật &amp; BOM</option>
                    <option value="CERTIFICATE">Chứng chỉ &amp; Tiêu chuẩn ISO</option>
                    <option value="OPERATION">Quy trình Vận hành Chuẩn</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[11px] mb-1">
                    Mức Độ Bảo Mật
                  </label>
                  <select
                    value={uploadForm.securityLevel}
                    onChange={(e) => setUploadForm({ ...uploadForm, securityLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="CONFIDENTIAL">CONFIDENTIAL (Bảo mật cao)</option>
                    <option value="RESTRICTED">RESTRICTED (Giới hạn truy cập)</option>
                    <option value="INTERNAL">INTERNAL (Nội bộ doanh nghiệp)</option>
                    <option value="PUBLIC">PUBLIC (Công khai)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[11px] mb-1">
                    Phân Hệ ERP Liên Kết
                  </label>
                  <select
                    value={uploadForm.linkedModule}
                    onChange={(e) => setUploadForm({ ...uploadForm, linkedModule: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="M04 Sales Orders">M04 Đơn bán hàng SO</option>
                    <option value="M05 Purchase Orders">M05 Đơn mua hàng PO</option>
                    <option value="M15 Manufacturing MES">M15 Lệnh sản xuất MO</option>
                    <option value="M22 Invoices AR/AP">M22 Hóa đơn GTGT</option>
                    <option value="M37 Quality QMS">M37 Chứng thư CO/CQ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-[11px] mb-1">
                    Số Hiệu Chứng Từ Gốc
                  </label>
                  <input
                    type="text"
                    placeholder="SO-2026-00123"
                    value={uploadForm.refDocNo}
                    onChange={(e) => setUploadForm({ ...uploadForm, refDocNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                <UploadCloud className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Kéo thả file chứng từ vào đây hoặc nhấp để chọn tệp
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Hỗ trợ PDF, DWG, XLSX, DOCX tối đa 50MB. Tự động mã hóa SHA-256.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  Lưu &amp; Cấp Mã DMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (RULE #19 ENTERPRISE STANDARD)                              */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={confirmDialog?.isOpen ?? false}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        variant={confirmDialog?.variant}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={confirmDialog?.onCancel}
        onClose={confirmDialog?.onCancel}
      />
    </div>
  );
};
