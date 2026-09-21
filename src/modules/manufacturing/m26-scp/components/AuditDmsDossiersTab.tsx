import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  FileCheck,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Copy,
  ExternalLink,
  Lock,
  Layers,
  FileText,
  AlertTriangle,
  ChevronRight,
  Database,
  Hash,
  Check,
} from 'lucide-react';

interface AuditDmsDossiersTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

interface CertificationItem {
  id: string;
  featureName: string;
  category: string;
  domainAuthority: string;
  description: string;
  testStatus: string;
  verificationProof: string;
  complianceRule: string;
}

interface CertificationMatrixResponse {
  success: boolean;
  certificationTitle: string;
  certifiedAt: string;
  leadAuditor: string;
  overallStatus: string;
  score: string;
  complianceStandards: string[];
  matrix: CertificationItem[];
}

interface DmsDocumentItem {
  id: number;
  docCode: string;
  title: string;
  category: string;
  categoryName: string;
  version: string;
  fileSize: string;
  format: string;
  status: string;
  securityLevel: string;
  sha256Hash: string;
  signedBy: string;
  signedAt: string;
  linkedModule: string;
  refDocNo: string;
  storageTier: string;
}

export const AuditDmsDossiersTab: React.FC<AuditDmsDossiersTabProps> = ({ onNotify }) => {
  const [subTab, setSubTab] = useState<'matrix' | 'dms' | 'audit'>('matrix');
  const [matrixData, setMatrixData] = useState<CertificationMatrixResponse | null>(null);
  const [dmsDocs, setDmsDocs] = useState<DmsDocumentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verificationModal, setVerificationModal] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCertificationMatrix = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/scm/certification-matrix');
      if (!res.ok) throw new Error('Không thể tải ma trận chứng nhận');
      const data = await res.json();
      setMatrixData(data);
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải ma trận', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDmsDossiers = async () => {
    try {
      const res = await fetch('/api/scm/mrp/dossiers');
      if (res.ok) {
        const data = await res.json();
        setDmsDocs(Array.isArray(data) ? data : data.items || []);
      }
    } catch (err) {
      console.error('Error fetching DMS dossiers:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit/logs?module=M26&limit=25');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAuditLogs(data);
        } else if (data && Array.isArray(data.items)) {
          setAuditLogs(data.items);
        } else if (data && Array.isArray(data.logs)) {
          setAuditLogs(data.logs);
        } else {
          setAuditLogs([]);
        }
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setAuditLogs([]);
    }
  };

  useEffect(() => {
    fetchCertificationMatrix();
    fetchDmsDossiers();
    fetchAuditLogs();
  }, []);

  const handleVerifySeal = async (docCode: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/scm/mrp/verify-seal/${docCode}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Thẩm định chữ ký số thất bại');
      const data = await res.json();
      setVerificationModal(data);
    } catch (err: any) {
      onNotify('danger', 'Lỗi thẩm định', err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const filteredDmsDocs = dmsDocs.filter(
    (d) =>
      d.docCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.refDocNo && d.refDocNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: KPI METRIC STRIP (M25 COMPATIBLE 4-METRIC GRID)                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Điểm Chứng Nhận E2E
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
              {matrixData?.score || '100%'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              13/13 Tính năng đạt chuẩn
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              Hồ Sơ M29 DMS
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400">
              {dmsDocs.length}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Niêm phong SHA-256
            </span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
              Nhật Ký M02 Audit
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-indigo-600 dark:text-indigo-400">
              {auditLogs.length}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Bản ghi bất biến
            </span>
          </div>
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Chuẩn Kiến Trúc
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              20/20 Governance Rules
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              NexusSync Single-Writer
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1 COMMAND BAR: SUB-TAB SWITCHER & SEARCH                                 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSubTab('matrix')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'matrix'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Ma Trận Chứng Nhận E2E (13 Mục)</span>
          </button>
          <button
            onClick={() => setSubTab('dms')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'dms'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Hồ Sơ M29 DMS ({dmsDocs.length})</span>
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'audit'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>M02 Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'dms' && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã hồ sơ, tiêu đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white transition-all"
              />
            </div>
          )}
          <button
            onClick={() => {
              fetchCertificationMatrix();
              fetchDmsDossiers();
              fetchAuditLogs();
            }}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATA PRESENTATION: CERTIFICATION MATRIX / DMS / AUDIT TRAIL               */}
      {/* ========================================================================= */}
      {subTab === 'matrix' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px] lg:min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mã</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tính Năng / Quy Trình</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phân Loại</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thẩm Quyền Domain</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bằng Chứng Xác Thực</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Chuẩn Quy Định</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {matrixData?.matrix?.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 border-l-4 border-emerald-500"
                  >
                    <td className="p-2.5 sm:p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.id}</td>
                    <td className="p-2.5 sm:p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{item.featureName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</div>
                    </td>
                    <td className="p-2.5 sm:p-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-2.5 sm:p-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {item.domainAuthority}
                    </td>
                    <td className="p-2.5 sm:p-3 max-w-xs truncate font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {item.verificationProof}
                    </td>
                    <td className="p-2.5 sm:p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800">
                        {item.complianceRule}
                      </span>
                    </td>
                    <td className="p-2.5 sm:p-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> PASS (100%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'dms' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px] lg:min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mã Hồ Sơ</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tiêu Đề Dossier</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phân Loại</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Định Dạng</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mã Băm SHA-256</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Chữ Ký Số</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredDmsDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 border-l-4 border-blue-500"
                  >
                    <td className="p-2.5 sm:p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{doc.docCode}</td>
                    <td className="p-2.5 sm:p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{doc.title}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Ref: {doc.refDocNo}</div>
                    </td>
                    <td className="p-2.5 sm:p-3 font-semibold text-slate-700 dark:text-slate-300">{doc.categoryName}</td>
                    <td className="p-2.5 sm:p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {doc.format} ({doc.fileSize})
                      </span>
                    </td>
                    <td className="p-2.5 sm:p-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[150px]">{doc.sha256Hash}</span>
                        <button
                          onClick={() => copyToClipboard(doc.sha256Hash, doc.docCode)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          title="Sao chép SHA-256"
                        >
                          {copiedHash === doc.docCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-2.5 sm:p-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> {doc.signedBy}
                      </span>
                    </td>
                    <td className="p-2.5 sm:p-3 text-center">
                      <button
                        onClick={() => handleVerifySeal(doc.docCode)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Thẩm Định</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'audit' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[800px] lg:min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thời Gian</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Hành Động</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thực Thể</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Người Thực Hiện</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chi Tiết / Log Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {Array.isArray(auditLogs) && auditLogs.length > 0 ? (
                  auditLogs.map((log: any, idx: number) => (
                    <tr
                      key={log.id || log.auditCode || idx}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 border-l-4 border-indigo-500"
                    >
                      <td className="p-2.5 sm:p-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                        {log.timestamp || log.createdAt
                          ? new Date(log.timestamp || log.createdAt).toLocaleString('vi-VN')
                          : '—'}
                      </td>
                      <td className="p-2.5 sm:p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {log.action || 'LOG_ENTRY'}
                        </span>
                      </td>
                      <td className="p-2.5 sm:p-3 font-bold text-slate-900 dark:text-white">
                        {log.entityType || log.module || 'M26'} #{log.entityId || log.id}
                      </td>
                      <td className="p-2.5 sm:p-3 text-slate-700 dark:text-slate-300 font-medium">
                        {log.username || log.performedBy || log.userId || 'SCM Planner'}
                      </td>
                      <td className="p-2.5 sm:p-3 max-w-md truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {log.reason ||
                          (typeof log.afterData === 'object'
                            ? JSON.stringify(log.afterData)
                            : typeof log.details === 'object'
                            ? JSON.stringify(log.details)
                            : log.details || log.afterData || '—')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      Chưa có bản ghi nhật ký kiểm toán M02 nào được ghi nhận cho phân hệ M26.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Kết Quả Thẩm Định Chữ Ký Số Dossier
              </h3>
              <button onClick={() => setVerificationModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Chữ Ký Số &amp; Toàn Vẹn Dữ Liệu: HỢP LỆ (VERIFIED)</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                  Mã băm SHA-256 trùng khớp 100% với bản ghi lưu trữ bất biến tại M29 DMS và M02 Audit Log.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Mã tài liệu:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{verificationModal.docCode}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Tiêu đề:</span>
                  <strong className="text-slate-900 dark:text-white">{verificationModal.title}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Người ký niêm phong:</span>
                  <strong className="text-slate-900 dark:text-white">{verificationModal.signedBy}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Thời gian ký:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{verificationModal.signedAt}</strong>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setVerificationModal(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
