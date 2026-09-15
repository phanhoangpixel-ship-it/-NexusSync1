import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SelectedEntityContext, UserSession } from '../../types';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { useWorkspaceContextSync } from '../../hooks/useWorkspaceContextSync';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ScorecardTabPanel } from '../common/ScorecardTabPanel';
import { PaginationControl } from '../common/PaginationControl';
import { formatCurrency } from '../../utils/currencyFormatter';
import { Supplier360Modal } from '../srm/Supplier360Modal';
import { SupplierEvaluationModal } from '../srm/SupplierEvaluationModal';
import { SupplierTermsTab } from '../srm/SupplierTermsTab';
import { SupplierSpendAnalyticsTab } from '../srm/SupplierSpendAnalyticsTab';
import {
  Truck,
  Building2,
  FileText,
  DollarSign,
  ShieldCheck,
  Plus,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
  Star,
  Award,
  ExternalLink,
  Eye,
  TrendingUp,
  BarChart3,
  Lock,
  Search,
  Filter,
  Settings,
  Clock,
  Send,
  Info,
  ShoppingBag
} from 'lucide-react';

interface M09SuppliersSRMWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  currentUser?: UserSession;
  allowedModules?: string[];
}

export const M09SuppliersSRMWorkspace: React.FC<M09SuppliersSRMWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
  currentUser,
  allowedModules,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'suppliers' | 'terms' | 'evaluation' | 'analytics'>('M09', 'suppliers');
  const [selectedEvaluationSupplierId, setSelectedEvaluationSupplierId] = useState<string>('SUPP-001');

  // Search & Filter state for Suppliers Tab
  const [supplierSearchTerm, setSupplierSearchTerm] = useState<string>('');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<string>('ALL');

  // Pagination state for Suppliers Table
  const [supplierPage, setSupplierPage] = useState<number>(1);
  const [supplierPageSize, setSupplierPageSize] = useState<number>(10);

  // Pagination state for Scorecard Comparison Table
  const [evalPage, setEvalPage] = useState<number>(1);
  const [evalPageSize, setEvalPageSize] = useState<number>(10);

  // Search & Filter state for Evaluation & Scorecards Tab (M19 Protocol)
  const [evalSearchTerm, setEvalSearchTerm] = useState<string>('');
  const [evalTierFilter, setEvalTierFilter] = useState<string>('ALL');
  const [evalStatusFilter, setEvalStatusFilter] = useState<string>('ALL');

  // Progressive On-Demand / Lazy-loading for evaluation tab
  const [evaluationLoading, setEvaluationLoading] = useState<boolean>(false);
  const [evaluationLoaded, setEvaluationLoaded] = useState<boolean>(false);

  // Tab-level RBAC check: Only users with M11 permission or SUPER_ADMIN / ADMIN can manage scorecards
  const canManageM11 = Boolean(
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.permissions?.includes('*') ||
    currentUser?.permissions?.includes('srm.scorecard.manage') ||
    allowedModules?.includes('*') ||
    allowedModules?.includes('M11')
  );

  useEffect(() => {
    if (activeTab === 'evaluation' && !evaluationLoaded) {
      setEvaluationLoading(true);
      const timer = setTimeout(() => {
        setEvaluationLoading(false);
        setEvaluationLoaded(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [activeTab, evaluationLoaded]);

  useWorkspaceContextSync(useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 200);
  }, []));

  // Suppliers State with integrated scorecard metrics
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Rule #19 ConfirmDialog state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'primary' | 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {}
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${currentUser?.token || ''}`
        }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
           throw new Error('Unauthorized or Forbidden access');
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFetchError(err.message);
      onNotify('danger', 'Lỗi tải dữ liệu', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Selected Supplier Detail Modal State (Hồ sơ 360°)
  const [selectedSupplierForModal, setSelectedSupplierForModal] = useState<any | null>(null);

  // SRM Evaluation Modal State
  const [evaluationModalSupplier, setEvaluationModalSupplier] = useState<any | null>(null);

  // Navigate to M08 Purchase Orders with supplier context
  const handleNavigateToPO = (supplierId?: string | number) => {
    window.dispatchEvent(new CustomEvent('nexus-navigate', {
      detail: {
        route: '/purchase-orders',
        moduleId: 'M08',
        supplierId: supplierId ? String(supplierId) : undefined
      }
    }));
    onNotify('info', 'Liên Kết M08 Purchase Orders', 'Đang chuyển hướng tới Phân hệ Đơn Mua Hàng M08.');
  };

  // New Supplier Form States
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppTax, setNewSuppTax] = useState('');
  const [newSuppTerm, setNewSuppTerm] = useState('Net 30 Days');
  const [newSuppLimit, setNewSuppLimit] = useState('2,000,000,000 VND');

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch = supplierSearchTerm.trim() === '' ||
        (s.code && s.code.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
        (s.name && s.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
        (s.taxCode && s.taxCode.toLowerCase().includes(supplierSearchTerm.toLowerCase()));

      const matchStatus = supplierStatusFilter === 'ALL' || s.status === supplierStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [suppliers, supplierSearchTerm, supplierStatusFilter]);

  // Paginated suppliers
  const paginatedSuppliers = useMemo(() => {
    const start = (supplierPage - 1) * supplierPageSize;
    return filteredSuppliers.slice(start, start + supplierPageSize);
  }, [filteredSuppliers, supplierPage, supplierPageSize]);

  // Filtered evaluation suppliers (M19 SRM Protocol)
  const filteredEvalSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch = evalSearchTerm.trim() === '' ||
        (s.code && s.code.toLowerCase().includes(evalSearchTerm.toLowerCase())) ||
        (s.name && s.name.toLowerCase().includes(evalSearchTerm.toLowerCase())) ||
        (s.id && s.id.toLowerCase().includes(evalSearchTerm.toLowerCase()));

      const matchStatus = evalStatusFilter === 'ALL' || s.status === evalStatusFilter;

      let matchTier = true;
      const rating = Number(s.rating) || 4.5;
      if (evalTierFilter === 'TIER_A') {
        matchTier = s.performanceTier === 'Tier A' || s.performanceTier === 'Strategic' || rating >= 4.5;
      } else if (evalTierFilter === 'TIER_B') {
        matchTier = s.performanceTier === 'Tier B' || (rating >= 4.0 && rating < 4.5);
      } else if (evalTierFilter === 'TIER_C') {
        matchTier = s.performanceTier === 'Tier C' || rating < 4.0;
      }

      return matchSearch && matchStatus && matchTier;
    });
  }, [suppliers, evalSearchTerm, evalStatusFilter, evalTierFilter]);

  // Paginated evaluation suppliers
  const paginatedEvalSuppliers = useMemo(() => {
    const start = (evalPage - 1) * evalPageSize;
    return filteredEvalSuppliers.slice(start, start + evalPageSize);
  }, [filteredEvalSuppliers, evalPage, evalPageSize]);

  // Metrics for KPI strip using nullish coalescing
  const strategicPartnersCount = useMemo(() => {
    return suppliers.filter(s => s.performanceTier === 'Tier A' || s.performanceTier === 'Strategic' || (s.rating && Number(s.rating) >= 4.5)).length || 2;
  }, [suppliers]);

  const watchlistPartnersCount = useMemo(() => {
    return suppliers.filter(s => s.status === 'WATCHLIST' || s.status === 'PENDING' || (s.rating && Number(s.rating) < 4.0)).length || 1;
  }, [suppliers]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!newSuppName.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên nhà cung cấp.');
      return;
    }
    setIsSubmitting(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token || ''}`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          code: newSuppTax || `SUP-${Date.now().toString().slice(-6)}`,
          name: newSuppName,
          taxCode: newSuppTax,
          paymentTerms: newSuppTerm,
          creditLimit: parseInt(newSuppLimit.replace(/\D/g, '')) || 0,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }
      onNotify('success', 'Thành công', `Đã tạo nhà cung cấp: ${data.data?.name ?? newSuppName}`);
      setNewSuppName('');
      setNewSuppTax('');
      fetchSuppliers();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo NCC', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveSupplier = async (id: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || ''}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }
      onNotify('success', 'Thành công', 'Đã lưu trữ nhà cung cấp.');
      fetchSuppliers();
    } catch (err: any) {
      onNotify('danger', 'Lỗi lưu trữ', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rule #19: Protected Archive with ConfirmDialog
  const requestArchiveSupplier = (supplier: any) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận Lưu trữ Nhà cung cấp',
      message: `Bạn có chắc chắn muốn lưu trữ đối tác cung ứng "${supplier.name}" (${supplier.code})? Nhà cung cấp này sẽ chuyển sang trạng thái ARCHIVED và không còn xuất hiện trong danh sách lựa chọn đặt hàng PO mới.`,
      variant: 'warning',
      confirmText: 'Lưu trữ đối tác',
      cancelText: 'Hủy bỏ',
      onConfirm: () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        handleArchiveSupplier(supplier.id);
      }
    });
  };

  const handleSelectSupplier = (supp: any) => {
    setSelectedSupplierForModal(supp);
    onSelectEntity({
      type: 'SUPPLIER_SRM',
      id: supp.id,
      code: supp.id,
      title: supp.name,
      status: supp.status,
      lineage: [
        { id: supp.id, type: 'Nhà cung cấp SRM', code: supp.id, relation: 'CURRENT_SUPPLIER', status: supp.status },
        { id: 'M09-SRM', type: 'Phân hệ M09', code: 'M09_SUPPLIERS', relation: 'PARENT_MODULE', status: 'ACTIVE' }
      ],
      auditTrail: [
        { id: 1, action: 'INSPECT_SUPPLIER_PROFILE', timestamp: new Date().toISOString(), user: 'admin', sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
      ],
      glEntries: []
    });
    onNotify('info', 'Đã tải chi tiết nhà cung cấp', `Đã chọn nhà cung cấp ${supp.name} vào Thanh Ngữ cảnh Đối Tượng.`);
  };

  const handleExportCSV = () => {
    const csvHeader = "ID,SupplierName,TaxCode,PaymentTerm,CreditLimit,Rating,OTIF,Quality,Compliance,Status\n";
    const csvRows = suppliers.map(s => `"${s.code ?? ''}","${s.name ?? ''}","${s.taxCode ?? ''}","${s.paymentTerms ?? ''}","${s.creditLimit ?? 0}","${s.performanceTier ?? ''}","${s.otifRate ?? ''}","${s.qualityScore ?? ''}","${s.complianceScore ?? ''}","${s.status ?? ''}"`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `suppliers_srm_directory_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', 'Đã tải xuống tệp CSV danh mục nhà cung cấp SRM.');
  };

  // Evaluation Metric Aggregations (M19 Protocol)
  const avgOtifRate = useMemo(() => {
    if (suppliers.length === 0) return '96.8%';
    const total = suppliers.reduce((acc, s) => {
      const val = parseFloat(String(s.otifRate ?? '96.8').replace('%', ''));
      return acc + (isNaN(val) ? 96.8 : val);
    }, 0);
    return (total / suppliers.length).toFixed(1) + '%';
  }, [suppliers]);

  const avgQualityScore = useMemo(() => {
    if (suppliers.length === 0) return '99.0%';
    const total = suppliers.reduce((acc, s) => {
      const val = parseFloat(String(s.qualityScore ?? '99.0').replace('%', ''));
      return acc + (isNaN(val) ? 99.0 : val);
    }, 0);
    return (total / suppliers.length).toFixed(1) + '%';
  }, [suppliers]);

  const avgComplianceScore = useMemo(() => {
    if (suppliers.length === 0) return '99.5%';
    const total = suppliers.reduce((acc, s) => {
      const val = parseFloat(String(s.complianceScore ?? '100').replace('%', ''));
      return acc + (isNaN(val) ? 100 : val);
    }, 0);
    return (total / suppliers.length).toFixed(1) + '%';
  }, [suppliers]);

  const slaCompliantCount = useMemo(() => {
    return suppliers.filter(s => {
      const val = parseFloat(String(s.otifRate ?? '96.8').replace('%', ''));
      return val >= 95.0;
    }).length || suppliers.length;
  }, [suppliers]);

  const handleExportEvalCSV = () => {
    const csvHeader = "Mã NCC,Tên Nhà Cung Cấp,OTIF Đúng Hạn,Chất Lượng GR,Tuân Thủ Pháp Lý,Điểm Đánh Giá,Phân Hạng,Trạng Thái\n";
    const csvRows = filteredEvalSuppliers.map(s => {
      const ratingNum = Number(s.rating) || 4.5;
      const tier = s.performanceTier ?? (ratingNum >= 4.5 ? 'Tier A (Chiến lược)' : ratingNum >= 4.0 ? 'Tier B (Ưu tiên)' : 'Tier C (Theo dõi)');
      return `"${s.id ?? s.code ?? ''}","${s.name ?? ''}","${s.otifRate ?? '98.5%'}","${s.qualityScore ?? '99.0%'}","${s.complianceScore ?? '100%'}","${s.rating ?? '4.8'}","${tier}","${s.status ?? 'ACTIVE'}"`;
    }).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `srm_vendor_evaluation_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất bảng xếp hạng thành công', 'Đã tải xuống tệp CSV Ma trận Đánh giá & Xếp hạng NCC.');
  };

  const currentEvalSupplier = suppliers.find(s => s.id === selectedEvaluationSupplierId) || suppliers[0] || null;

  return (
    <div className="space-y-3.5 max-w-full pb-8">
      
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (M19 STANDARD)                       */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M09 • SUPPLIERS SRM
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Single Source of Truth • Payment Terms &amp; Scorecards
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              Danh Mục Nhà Cung Cấp &amp; Quản Trị Quan Hệ SRM
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/srm-scorecard', moduleId: 'M11' } }));
              onNotify('info', 'Chuyển Hướng', 'Đang mở Phân hệ M11 Quản trị Thẻ điểm & Đánh giá Nhà cung cấp.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">M11 Scorecards</span>
          </button>
          
          <button
            type="button"
            onClick={() => { fetchSuppliers(); onNotify('info', 'Làm mới', 'Đã đồng bộ dữ liệu M09.'); }}
            className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 px-2.5"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L0: SRM LIFECYCLE PIPELINE OVERVIEW BANNER                                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Tiến Trình Phát Triển &amp; Quản Trị Nhà Cung Cấp (SRM Pipeline)
            </h3>
          </div>
          <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 font-semibold border border-blue-200 dark:border-blue-700">
            SRM Evaluation: Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-0.5">
          {[
            { step: '1', title: 'Thẩm Định Hồ Sơ', desc: 'Đánh giá pháp lý, mã số thuế, năng lực sản xuất & phê duyệt hồ sơ', tag: `${suppliers.length} Đối tác` },
            { step: '2', title: 'Hợp Đồng & Khung Giá', desc: 'Thỏa thuận khung (BPA), điều khoản thanh toán & hạn mức tín dụng nợ', tag: 'Net 30-45' },
            { step: '3', title: 'Giao Hàng & OTIF', desc: 'Kiểm đếm kho Inbound, đo lường tỷ lệ lỗi hàng & tiến độ giao hàng đúng hạn', tag: 'Live Sync' },
            { step: '4', title: 'Thẻ Điểm & Xếp Hạng', desc: 'Chấm điểm định kỳ Q3/2026, phân hạng đối tác chiến lược & thanh tra M11', tag: 'Quarterly' },
          ].map((s) => (
            <div 
              key={s.step} 
              className="p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono tabular-nums font-bold text-slate-400 dark:text-slate-500">GIAI ĐOẠN {s.step}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">{s.tag}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{s.title}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: SUB-TABS NAVIGATION STRIP (M41 MASTER SPEC)                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'suppliers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span>Danh sách Nhà cung cấp</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'suppliers' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {suppliers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'terms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Điều khoản Thanh toán (Payment Terms)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evaluation')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'evaluation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Star className="w-4 h-4 shrink-0" />
            <span>Đánh giá &amp; Xếp hạng (SRM Rating)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Phân tích Chuỗi Cung ứng (SRM Analytics)</span>
          </button>
        </div>

        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold shrink-0 border-l border-slate-200 dark:border-slate-700/70 pl-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SRM Master Vendor Directory</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            M09 Certified
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI METRIC STRIP (M19 STANDARD METRIC CARD ARCHITECTURE)              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng Nhà Cung Cấp</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
            {suppliers.length} Đối tác
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" /> 
            <span>100% hồ sơ đã định danh</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Đối Tác Chiến Lược (Tier A)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
            {strategicPartnersCount} Nhà cung cấp
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Chiếm 78% tổng kim ngạch mua</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Đang Theo Dõi / Rủi Ro</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400">
            {watchlistPartnersCount} Đối tác
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
            <span>Áp dụng thanh toán COD/Advance</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chỉ Số OTIF Trung Bình</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-indigo-600 dark:text-indigo-400">
            96.8%
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
            <span>Vượt mục tiêu SLA (≥95%)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SUB-TAB RENDER                                                     */}
      {/* ========================================================================= */}

      {/* TAB 1: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Main Suppliers Table (2/3 width) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
              
              {/* L1 Command Bar: Search & Filter */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={supplierSearchTerm}
                    onChange={(e) => { setSupplierSearchTerm(e.target.value); setSupplierPage(1); }}
                    placeholder="Tìm mã NCC, tên, MST..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Lọc:</span>
                  </div>
                  <select
                    value={supplierStatusFilter}
                    onChange={(e) => { setSupplierStatusFilter(e.target.value); setSupplierPage(1); }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">ACTIVE (Hoạt động)</option>
                    <option value="PENDING">PENDING (Chờ duyệt)</option>
                    <option value="ARCHIVED">ARCHIVED (Đã lưu trữ)</option>
                  </select>
                </div>
              </div>

              {/* L3 Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Mã NCC</th>
                      <th className="py-2.5 px-3">Tên Nhà cung cấp</th>
                      <th className="py-2.5 px-3">Điều khoản</th>
                      <th className="py-2.5 px-3 text-right">Hạn mức Tín dụng</th>
                      <th className="py-2.5 px-3 text-right">Chi tiêu POs</th>
                      <th className="py-2.5 px-3 text-center">Xếp hạng</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                    {paginatedSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                          Không tìm thấy nhà cung cấp nào phù hợp với điều kiện lọc.
                        </td>
                      </tr>
                    ) : (
                      paginatedSuppliers.map((s) => (
                        <tr 
                          key={s.id} 
                          className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${
                            s.status === 'ACTIVE' 
                              ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10' 
                              : s.status === 'ARCHIVED'
                              ? 'border-l-4 border-slate-400 bg-slate-50/20 dark:bg-slate-900/20 opacity-75'
                              : 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
                          }`}
                        >
                          <td className="py-3 px-3 font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">
                            {s.code ?? s.id}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            <div>{s.name}</div>
                            {s.taxCode && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">MST: {s.taxCode}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                            {s.paymentTerms ?? 'Net 30 Days'}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white">
                            {typeof s.creditLimit === 'number' ? formatCurrency(s.creditLimit) : `${s.creditLimit ?? '2,000,000,000'} ${s.currency || 'VND'}`}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-right font-bold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(s.totalSpend || 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              {s.performanceTier ?? 'Tier A'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleNavigateToPO(s.id)}
                                className="px-2 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                title="Lập đơn mua hàng PO mới cho nhà cung cấp này tại M08"
                              >
                                <ShoppingBag className="w-2.5 h-2.5" />
                                <span>Tạo PO</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectSupplier(s)}
                                className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-blue-600 text-slate-700 rounded-md transition-all cursor-pointer"
                              >
                                Hồ Sơ 360°
                              </button>
                              <button
                                type="button"
                                onClick={() => requestArchiveSupplier(s)}
                                disabled={s.status === 'ARCHIVED'}
                                className="px-2 py-1 text-[10px] font-semibold bg-rose-50 hover:bg-rose-600 text-rose-800 hover:text-white dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white rounded-md transition-all disabled:opacity-40 cursor-pointer"
                                title="Lưu trữ nhà cung cấp (Rule #19 ConfirmDialog)"
                              >
                                Lưu trữ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* L4 Pagination Control */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                <PaginationControl
                  currentPage={supplierPage}
                  totalPages={Math.ceil(filteredSuppliers.length / supplierPageSize) || 1}
                  pageSize={supplierPageSize}
                  totalItems={filteredSuppliers.length}
                  startIndex={(supplierPage - 1) * supplierPageSize + 1}
                  endIndex={Math.min(supplierPage * supplierPageSize, filteredSuppliers.length)}
                  onPageChange={(p) => setSupplierPage(p)}
                  onPageSizeChange={(s) => { setSupplierPageSize(s); setSupplierPage(1); }}
                />
              </div>
            </div>
          </div>

          {/* New Supplier Form (1/3 width) */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Đăng ký Nhà cung cấp SRM Mới
                </h3>
              </div>

              <form onSubmit={handleCreateSupplier} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Doanh nghiệp / Nhà cung cấp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Công ty TNHH Linh kiện Công nghệ"
                    value={newSuppName}
                    onChange={(e) => setNewSuppName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã số thuế (Tax Code)
                  </label>
                  <input
                    type="text"
                    placeholder="031xxxxxxx"
                    value={newSuppTax}
                    onChange={(e) => setNewSuppTax(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Điều khoản thanh toán
                  </label>
                  <input
                    type="text"
                    value={newSuppTerm}
                    onChange={(e) => setNewSuppTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn mức tín dụng mua hàng
                  </label>
                  <input
                    type="text"
                    value={newSuppLimit}
                    onChange={(e) => setNewSuppLimit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200/60 dark:border-blue-800/60 text-[10px] text-blue-900 dark:text-blue-200 leading-relaxed">
                  <span className="font-bold block mb-0.5">💡 Single Source of Truth:</span>
                  Nhà cung cấp mới đăng ký sẽ lập tức được ghi nhận vào kho dữ liệu tập trung M09 để dùng chung cho M08 (PO), M10 (Nhập kho), M11 (Đánh giá) và M16 (Công nợ AP).
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang lưu...' : 'Đăng ký Hồ sơ SRM'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT TERMS & CREDIT FACILITY (M09 ENHANCED) */}
      {activeTab === 'terms' && (
        <SupplierTermsTab
          suppliers={suppliers}
          onNotify={onNotify}
          userToken={currentUser?.token}
          onRefresh={fetchSuppliers}
        />
      )}

      {/* TAB 3: EVALUATION & SCORECARDS (100% M19 PROTOCOL SYNCHRONIZED) */}
      {activeTab === 'evaluation' && (
        <div className="space-y-4">
          {/* Skeleton Loader during On-Demand Lazy Fetching */}
          {evaluationLoading ? (
            <div className="space-y-4 animate-pulse" id="m09-evaluation-skeleton">
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-40"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-44"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-36"></div>
                </div>
              </div>

              <div className="h-60 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
                <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded-lg"></div>
                <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded-lg"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Tab-Level RBAC Guard Banner */}
              {!canManageM11 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <div>
                      <strong className="text-amber-950 dark:text-amber-100 font-semibold">Chế độ Chỉ Đọc (Read-Only):</strong>{' '}
                      <span className="text-amber-900 dark:text-amber-200">
                        Tài khoản hiện tại có quyền xem Thẻ điểm đối tác (M09). Cần phân quyền Quản trị SRM (M11) để cập nhật tiêu chí, trọng số KPI hoặc phát hành chấm điểm mới.
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-200/70 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-mono font-bold text-[10px] shrink-0 border border-amber-300 dark:border-amber-700">
                    RBAC: M09_READ_ONLY
                  </span>
                </div>
              )}

              {/* L1 Command Bar: Search, Filter Tier, Filter Status, and Export */}
              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={evalSearchTerm}
                    onChange={(e) => { setEvalSearchTerm(e.target.value); setEvalPage(1); }}
                    placeholder="Tìm NCC trong ma trận SRM theo mã, tên..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Lọc:</span>
                  </div>
                  
                  {/* Tier Filter */}
                  <select
                    value={evalTierFilter}
                    onChange={(e) => { setEvalTierFilter(e.target.value); setEvalPage(1); }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Tất cả phân hạng Tier</option>
                    <option value="TIER_A">Tier A - Chiến lược (≥4.5 ★)</option>
                    <option value="TIER_B">Tier B - Ưu tiên (4.0 - 4.4 ★)</option>
                    <option value="TIER_C">Tier C - Cảnh báo / Theo dõi (&lt;4.0 ★)</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={evalStatusFilter}
                    onChange={(e) => { setEvalStatusFilter(e.target.value); setEvalPage(1); }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">ACTIVE (Hoạt động)</option>
                    <option value="PENDING">PENDING (Chờ duyệt)</option>
                  </select>

                  {/* Refresh Button */}
                  <button
                    type="button"
                    onClick={fetchSuppliers}
                    disabled={loading}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    title="Làm mới ma trận đánh giá"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>

                  {/* Export Evaluation Matrix CSV Button */}
                  <button
                    type="button"
                    onClick={handleExportEvalCSV}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Xuất Ma Trận SRM</span>
                  </button>
                </div>
              </div>

              {/* L2 Evaluation KPI Metric Strip (4 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Chỉ Số OTIF Bình Quân
                    </span>
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
                    {avgOtifRate}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>On-Time In-Full • Vượt SLA (≥95%)</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Chất Lượng Nghiệm Thu GR
                    </span>
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400">
                    {avgQualityScore}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    <span>Tỷ lệ đạt nghiệm thu IQC kho</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tuân Thủ Pháp Lý &amp; CO/CQ
                    </span>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-2xl text-indigo-600 dark:text-indigo-400">
                    {avgComplianceScore}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    <span>100% chứng chỉ hợp chuẩn hợp quy</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Đối Tác Đạt Chuẩn SLA
                    </span>
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400">
                    {slaCompliantCount} / {suppliers.length} NCC
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                    <span>{Math.round((slaCompliantCount / (suppliers.length || 1)) * 100)}% toàn mạng lưới đạt tiêu chuẩn</span>
                  </div>
                </div>
              </div>

              {/* Supplier Selector Pills */}
              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Chọn Nhà Cung Cấp Phân Tích Thẻ Điểm Chuyên Sâu:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-700 font-bold">
                      Đang chọn: {currentEvalSupplier?.name ?? 'Chưa chọn'}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {suppliers.map(s => {
                    const isSelected = currentEvalSupplier?.id === s.id;
                    const rating = Number(s.rating) || 4.8;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedEvaluationSupplierId(s.id);
                          onNotify('info', 'Xem Thẻ Điểm', `Đã chọn thẻ điểm của ${s.name}`);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs border-blue-600 ring-2 ring-blue-500/30'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className={`font-mono text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {s.id}
                        </span>
                        <span>{s.name}</span>
                        <span className="flex items-center gap-0.5 text-[10px]">
                          <Star className={`w-3 h-3 ${isSelected ? 'text-amber-300 fill-amber-300' : 'text-amber-500 fill-amber-500'}`} />
                          <span className="font-mono font-bold">{rating}</span>
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          isSelected 
                            ? 'bg-blue-700/80 text-white' 
                            : s.status === 'ACTIVE' 
                              ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200' 
                              : 'bg-amber-100 text-amber-950 dark:bg-amber-950/80 dark:text-amber-200'
                        }`}>
                          {s.otifRate ?? '98%'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Embedded ScorecardTabPanel for selected supplier */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Thẻ Điểm Chi Tiết &amp; Lịch Sử Đánh Giá: <span className="text-blue-600 dark:text-blue-400">{currentEvalSupplier?.name}</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                      MÃ: {currentEvalSupplier?.id}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                      HẠNG: {currentEvalSupplier?.performanceTier ?? 'Tier A (Chiến lược)'}
                    </span>
                    {canManageM11 && (
                      <button
                        type="button"
                        onClick={() => setEvaluationModalSupplier(currentEvalSupplier)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-1"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>+ Chấm Điểm Thẻ Điểm Mới</span>
                      </button>
                    )}
                  </div>
                </div>

                {currentEvalSupplier ? (
                  <ScorecardTabPanel
                    supplierId={currentEvalSupplier.id}
                    supplierName={currentEvalSupplier.name}
                    scorecards={currentEvalSupplier.scorecards || []}
                    canManage={canManageM11}
                    onNotify={onNotify}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <p className="text-sm">Chưa có dữ liệu nhà cung cấp</p>
                  </div>
                )}
              </div>

              {/* Consolidated Vendor Scorecard Comparison Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Bảng Tổng Hợp So Sánh Hiệu Suất NCC Toàn Hệ Thống (SRM Matrix)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Hiển thị {filteredEvalSuppliers.length} nhà cung cấp được đối soát chỉ số định kỳ
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tabular-nums text-emerald-900 bg-emerald-50 dark:bg-emerald-950/80 dark:text-emerald-200 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-700 font-bold">
                      Live Evaluated
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Mã NCC</th>
                        <th className="py-2.5 px-3">Tên Doanh Nghiệp</th>
                        <th className="py-2.5 px-3 text-right">OTIF (Đúng hạn)</th>
                        <th className="py-2.5 px-3 text-right">Chất Lượng GR</th>
                        <th className="py-2.5 px-3 text-right">Tuân Thủ Pháp Lý</th>
                        <th className="py-2.5 px-3 text-center">Điểm Đánh Giá</th>
                        <th className="py-2.5 px-3 text-center">Phân Hạng Tier</th>
                        <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                        <th className="py-2.5 px-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                      {paginatedEvalSuppliers.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Search className="w-8 h-8 opacity-40 text-slate-400" />
                              <p className="text-xs font-semibold">Không tìm thấy nhà cung cấp nào phù hợp bộ lọc</p>
                              <button
                                type="button"
                                onClick={() => { setEvalSearchTerm(''); setEvalTierFilter('ALL'); setEvalStatusFilter('ALL'); }}
                                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                              >
                                Đặt lại bộ lọc
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedEvalSuppliers.map((s) => {
                          const ratingNum = Number(s.rating) || 4.5;
                          const isSelected = currentEvalSupplier?.id === s.id;
                          const tier = s.performanceTier ?? (ratingNum >= 4.5 ? 'Tier A (Chiến lược)' : ratingNum >= 4.0 ? 'Tier B (Ưu tiên)' : 'Tier C (Theo dõi)');
                          
                          const borderClass = 
                            tier.includes('Tier A') || ratingNum >= 4.5
                              ? 'border-l-4 border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10'
                              : tier.includes('Tier B') || ratingNum >= 4.0
                                ? 'border-l-4 border-blue-500 bg-blue-50/10 dark:bg-blue-950/10'
                                : 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10';

                          return (
                            <tr 
                              key={s.id} 
                              onClick={() => {
                                setSelectedEvaluationSupplierId(s.id);
                                onNotify('info', 'Xem Thẻ Điểm', `Đang xem thẻ điểm của ${s.name}`);
                              }}
                              className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${borderClass} ${
                                isSelected ? 'ring-2 ring-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20' : ''
                              }`}
                            >
                              <td className="py-3 px-3 font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">
                                {s.id}
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                <div className="flex items-center gap-1.5">
                                  <span>{s.name}</span>
                                  {isSelected && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                      ACTIVE VIEW
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-right">
                                {s.otifRate ?? '98.5%'}
                              </td>
                              <td className="py-3 px-3 font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 text-right">
                                {s.qualityScore ?? '99.0%'}
                              </td>
                              <td className="py-3 px-3 font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 text-right">
                                {s.complianceScore ?? '100%'}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                  <span>{s.rating ?? '4.8'}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                  tier.includes('Tier A')
                                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                                    : tier.includes('Tier B')
                                      ? 'bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700'
                                      : 'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                                }`}>
                                  {tier}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                  s.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                                    : 'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                                }`}>
                                  {s.status ?? 'ACTIVE'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvaluationSupplierId(s.id);
                                    onNotify('info', 'Xem Thẻ Điểm', `Đang xem thẻ điểm của ${s.name}`);
                                  }}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ml-auto ${
                                    isSelected
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white'
                                  }`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{isSelected ? 'Đang Xem' : 'Xem Thẻ Điểm'}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for Evaluation Table */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                  <PaginationControl
                    currentPage={evalPage}
                    totalPages={Math.ceil(filteredEvalSuppliers.length / evalPageSize) || 1}
                    pageSize={evalPageSize}
                    totalItems={filteredEvalSuppliers.length}
                    startIndex={(evalPage - 1) * evalPageSize + (filteredEvalSuppliers.length > 0 ? 1 : 0)}
                    endIndex={Math.min(evalPage * evalPageSize, filteredEvalSuppliers.length)}
                    onPageChange={(p) => setEvalPage(p)}
                    onPageSizeChange={(s) => { setEvalPageSize(s); setEvalPage(1); }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: SPEND & SRM ANALYTICS (M09 ENHANCED) */}
      {activeTab === 'analytics' && (
        <SupplierSpendAnalyticsTab
          userToken={currentUser?.token}
          onNotify={onNotify}
          onNavigateToPO={handleNavigateToPO}
          onSelectSupplier={handleSelectSupplier}
        />
      )}

      {/* ========================================================================= */}
      {/* MODALS & DIALOGS (RULE #19 COMPLIANT)                                      */}
      {/* ========================================================================= */}

      {/* 1. Rule #19 Centralized ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 2. Supplier 360° Profile Modal (Rule #19 Compliant with Contacts & Bank Accounts) */}
      {selectedSupplierForModal && (
        <Supplier360Modal
          supplier={selectedSupplierForModal}
          onClose={() => setSelectedSupplierForModal(null)}
          onNavigateToPO={handleNavigateToPO}
          onOpenScorecard={(suppId) => {
            setSelectedEvaluationSupplierId(String(suppId));
            setActiveTab('evaluation');
            setSelectedSupplierForModal(null);
          }}
          onNotify={onNotify}
          userToken={currentUser?.token}
          onReloadSupplier={fetchSuppliers}
        />
      )}

      {/* 3. Supplier Evaluation Modal (Rule #19 Compliant) */}
      {evaluationModalSupplier && (
        <SupplierEvaluationModal
          supplier={evaluationModalSupplier}
          onClose={() => setEvaluationModalSupplier(null)}
          onCompleted={() => {
            fetchSuppliers();
            if (activeTab === 'evaluation') {
              fetchEvaluationSupplier(evaluationModalSupplier.id);
            }
          }}
          onNotify={onNotify}
          userToken={currentUser?.token}
        />
      )}

    </div>
  );
};

export default M09SuppliersSRMWorkspace;
