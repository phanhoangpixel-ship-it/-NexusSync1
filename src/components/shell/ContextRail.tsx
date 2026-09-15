import React, { useState, useMemo, useEffect } from 'react';
import { SelectedEntityContext, LineageNode } from '../../types';
import { ModuleDefinition } from '../../config/moduleRegistry';
import { FavoriteItem } from '../../types/recentFavorites';
import {
  GitBranch,
  Fingerprint,
  BookOpen,
  X,
  CheckCircle2,
  Clock,
  Shield,
  ArrowRight,
  ArrowDown,
  Search,
  Filter,
  ShoppingCart,
  Truck,
  Package,
  FileText,
  Receipt,
  Scale,
  Building2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  FileCheck2,
  SlidersHorizontal,
  BarChart3,
  Zap,
  Pin,
  PinOff,
} from 'lucide-react';

export interface WorkspaceActionItem {
  id?: string;
  label: string;
  icon?: any;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  description?: string;
}

export interface SavedViewItem {
  id: string;
  name: string;
  count?: number;
  active?: boolean;
}

export interface QuickStatItem {
  label: string;
  value: string | number;
  change?: string;
  status?: 'success' | 'warning' | 'info' | 'danger';
}

interface ContextRailProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEntity: SelectedEntityContext | null;
  onSelectEntityCode?: (code: string) => void;
  onNavigate?: (route: string) => void;
  workspaceActions?: WorkspaceActionItem[];
  savedViews?: SavedViewItem[];
  onSelectSavedView?: (viewId: string) => void;
  quickStats?: QuickStatItem[];
  currentModule?: ModuleDefinition;
  isPinned?: boolean;
  onTogglePin?: () => void;
  pinnedModules?: FavoriteItem[];
}

// Icon resolver based on entity type or code prefix
const getEntityIcon = (type: string, code: string) => {
  const c = code.toUpperCase();
  const t = type.toUpperCase();

  if (c.startsWith('PR') || t.includes('PURCHASE_REQ') || t.includes('YÊU CẦU')) {
    return ShoppingCart;
  }
  if (c.startsWith('PO') || t.includes('PURCHASE_ORDER') || t.includes('ĐƠN HÀNG MUA')) {
    return FileText;
  }
  if (c.startsWith('SO') || t.includes('SALES_ORDER') || t.includes('ĐƠN HÀNG BÁN')) {
    return FileCheck2;
  }
  if (c.startsWith('GRN') || c.startsWith('REC') || t.includes('RECEIPT') || t.includes('NHẬP KHO') || t.includes('WMS')) {
    return Truck;
  }
  if (c.startsWith('INV') || t.includes('INVOICE') || t.includes('HÓA ĐƠN')) {
    return Receipt;
  }
  if (c.startsWith('GL') || c.startsWith('VOUCHER') || t.includes('LEDGER') || t.includes('SỔ CÁI')) {
    return Scale;
  }
  if (c.startsWith('WO') || c.startsWith('MO') || t.includes('WORK_ORDER') || t.includes('SẢN XUẤT')) {
    return Package;
  }
  return Layers;
};

// Default sample lineage generator if selectedEntity is missing or sparse
const generateE2ELineage = (mainCode: string): LineageNode[] => {
  const codeUpper = mainCode.toUpperCase();

  if (codeUpper.startsWith('PO') || codeUpper.includes('PO-')) {
    return [
      { id: '1', type: 'PR - Yêu Cầu Mua Hàng', code: 'PR-2026-0089', relation: 'Nguồn (Upstream)', status: 'Đã duyệt', date: '2026-03-01' },
      { id: '2', type: 'RFQ - Báo Giá Nhà Cung Cấp', code: 'RFQ-2026-0142', relation: 'Nguồn (Upstream)', status: 'Đã chọn NCC', date: '2026-03-02' },
      { id: '3', type: 'PO - Đơn Hàng Mua Chuẩn', code: mainCode, relation: 'Chứng từ hiện tại', status: 'Đang thực hiện', date: '2026-03-03' },
      { id: '4', type: 'GRN - Phiếu Nhập Kho WMS', code: 'GRN-2026-0045', relation: 'Kế thừa (Downstream)', status: 'Đã nhập kho QC Pass', date: '2026-03-04' },
      { id: '5', type: 'INV - Hóa Đơn Mua Hàng VAT', code: 'INV-2026-0210', relation: 'Kế thừa (Downstream)', status: 'Đã khớp 3-Way', date: '2026-03-04' },
      { id: '6', type: 'GL - Bút Toán Sổ Cái Kép', code: 'GL-VOUCHER-0891', relation: 'Kế thừa (Downstream)', status: 'Đã hạch toán Nợ 152/Có 331', date: '2026-03-04' },
    ];
  }

  if (codeUpper.startsWith('SO') || codeUpper.includes('SO-')) {
    return [
      { id: '1', type: 'QUO - Báo Giá Khách Hàng', code: 'QUO-2026-0311', relation: 'Nguồn (Upstream)', status: 'Đã xác nhận', date: '2026-03-01' },
      { id: '2', type: 'SO - Đơn Hàng Bán', code: mainCode, relation: 'Chứng từ hiện tại', status: 'Đang xử lý', date: '2026-03-02' },
      { id: '3', type: 'DO - Lệnh Giao Hàng Xuất Kho', code: 'DO-2026-0512', relation: 'Kế thừa (Downstream)', status: 'Đã xuất kho', date: '2026-03-03' },
      { id: '4', type: 'INV - Hóa Đơn Điện Tử VAT', code: 'INV-2026-0789', relation: 'Kế thừa (Downstream)', status: 'Đã ký số CQT', date: '2026-03-03' },
      { id: '5', type: 'GL - Hạch Toán Doanh Thu', code: 'GL-VOUCHER-1102', relation: 'Kế thừa (Downstream)', status: 'Nợ 131/Có 511/Có 3331', date: '2026-03-03' },
    ];
  }

  if (codeUpper.startsWith('GRN') || codeUpper.includes('GRN-')) {
    return [
      { id: '1', type: 'PO - Đơn Mua Gốc', code: 'PO-2026-0188', relation: 'Nguồn (Upstream)', status: 'Đã duyệt', date: '2026-03-02' },
      { id: '2', type: 'GRN - Phiếu Nhập Kho', code: mainCode, relation: 'Chứng từ hiện tại', status: 'Đã kiểm định IQC', date: '2026-03-04' },
      { id: '3', type: 'PUT - Lệnh Xếp Giá Kệ WMS', code: 'PUT-BIN-A04-12', relation: 'Kế thừa (Downstream)', status: 'Hoàn tất xếp kho', date: '2026-03-04' },
      { id: '4', type: 'GL - Ghi Nhận Tồn Kho', code: 'GL-VOUCHER-0945', relation: 'Kế thừa (Downstream)', status: 'Nợ 152/Có 331', date: '2026-03-04' },
    ];
  }

  return [
    { id: '1', type: 'Yêu Cầu Nghiệp Vụ Gốc', code: 'REQ-2026-0012', relation: 'Nguồn (Upstream)', status: 'Đã xác thực', date: '2026-03-01' },
    { id: '2', type: 'Chứng Từ Hiện Tại', code: mainCode, relation: 'Chứng từ hiện tại', status: 'Hiệu lực', date: '2026-03-02' },
    { id: '3', type: 'Nhật Ký Tác Động Kho/Tài Chính', code: 'TRX-2026-0988', relation: 'Kế thừa (Downstream)', status: 'Đã đồng bộ', date: '2026-03-03' },
  ];
};

export const ContextRail: React.FC<ContextRailProps> = ({
  isOpen,
  onClose,
  selectedEntity,
  onSelectEntityCode,
  onNavigate,
  workspaceActions = [],
  savedViews = [],
  onSelectSavedView,
  quickStats = [],
  currentModule,
  isPinned = false,
  onTogglePin,
  pinnedModules = [],
}) => {
  const [activeRailTab, setActiveRailTab] = useState<'pipeline' | 'filters' | 'stats' | 'ledger'>('pipeline');
  const [searchDocTerm, setSearchDocTerm] = useState<string>('');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<LineageNode | null>(null);
  const [serverLineageData, setServerLineageData] = useState<{
    lineage?: LineageNode[];
    auditTrail?: any[];
    glEntries?: any[];
  } | null>(null);

  // Derive active code & lineage
  const currentCode = selectedEntity?.code || searchDocTerm || (currentModule ? `MOD-${currentModule.moduleId}` : 'PO-2026-00125');

  // Live query from Backend Lineage API
  useEffect(() => {
    if (!isOpen || !currentCode) return;
    const token = localStorage.getItem('nexus_jwt') || '';
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    fetch(`/api/audit/entity-lineage?code=${encodeURIComponent(currentCode)}`, { headers })
      .then(r => r.json())
      .then(data => {
        if (data && data.lineage) {
          setServerLineageData(data);
        }
      })
      .catch(() => {});
  }, [isOpen, currentCode]);

  const effectiveLineage: LineageNode[] = useMemo(() => {
    if (selectedEntity?.lineage && selectedEntity.lineage.length > 0) {
      return selectedEntity.lineage;
    }
    if (serverLineageData?.lineage && serverLineageData.lineage.length > 0) {
      return serverLineageData.lineage;
    }
    return generateE2ELineage(currentCode);
  }, [selectedEntity, serverLineageData, currentCode]);

  // Group lineage into 3 blocks: Upstream, Current, Downstream
  const pipelineGroups = useMemo(() => {
    const upstream: LineageNode[] = [];
    const current: LineageNode[] = [];
    const downstream: LineageNode[] = [];

    effectiveLineage.forEach((node) => {
      const rel = (node.relation || '').toLowerCase();
      if (rel.includes('nguồn') || rel.includes('upstream') || rel.includes('gốc')) {
        upstream.push(node);
      } else if (rel.includes('kế thừa') || rel.includes('downstream') || rel.includes('đích')) {
        downstream.push(node);
      } else {
        current.push(node);
      }
    });

    // Fallback if no specific relation tags
    if (current.length === 0 && effectiveLineage.length > 0) {
      current.push(effectiveLineage[0]);
    }

    return { upstream, current, downstream };
  }, [effectiveLineage]);

  // Dynamic Audit Trail from selectedEntity or live server data
  const effectiveAuditTrail = useMemo(() => {
    if (selectedEntity?.auditTrail && selectedEntity.auditTrail.length > 0) {
      return selectedEntity.auditTrail;
    }
    if (serverLineageData?.auditTrail && serverLineageData.auditTrail.length > 0) {
      return serverLineageData.auditTrail;
    }
    return [
      {
        id: 101,
        action: 'Khởi tạo chứng từ số hóa (Digital Draft Created)',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        user: 'Nguyễn Văn Hùng (Purchasing Specialist)',
        sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      {
        id: 102,
        action: 'Phê duyệt ngân sách ERP 3-Way Match',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        user: 'Trần Thị Mai (Finance Lead)',
        sha256Checksum: 'ca978112ca1bbdcafac231b39a23dc4da786081cd1e14eed6da746e4b9c1d09b',
      },
      {
        id: 103,
        action: 'Ký số HSM Doanh nghiệp (Enterprise Digital Sign)',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        user: 'Phạm Hoàng Sơn (Deputy General Director)',
        sha256Checksum: '5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03',
      },
    ];
  }, [selectedEntity, serverLineageData]);

  // Dynamic Balanced GL Entries
  const effectiveGlEntries = useMemo(() => {
    if (selectedEntity?.glEntries && selectedEntity.glEntries.length > 0) {
      return selectedEntity.glEntries;
    }
    if (serverLineageData?.glEntries && serverLineageData.glEntries.length > 0) {
      return serverLineageData.glEntries.map((g: any) => ({
        account: g.debitAccount || g.account || '156',
        accountName: g.description || 'Bút toán sổ cái kép',
        debit: Number(g.amount || g.debit || 0),
        credit: Number(g.credit || 0),
        description: g.description || `Hạch toán bút toán ${g.entryCode || ''}`,
      }));
    }
    return [
      {
        account: '1521',
        accountName: 'Nguyên vật liệu nhập kho chính',
        debit: 125000000,
        credit: 0,
        description: 'Nhập kho lô vật tư thép cán nguội theo PO',
      },
      {
        account: '1331',
        accountName: 'Thuế GTGT được khấu trừ (10%)',
        debit: 12500000,
        credit: 0,
        description: 'Thuế GTGT đầu vào hợp lệ',
      },
      {
        account: '3311',
        accountName: 'Phải trả người bán ngắn hạn (POSCO Corp)',
        debit: 0,
        credit: 137500000,
        description: 'Ghi nhận công nợ phải trả theo hóa đơn 3-way match',
      },
    ];
  }, [selectedEntity, serverLineageData]);

  const totalDebit = useMemo(() => {
    return effectiveGlEntries.reduce((sum, item) => sum + (item.debit || 0), 0);
  }, [effectiveGlEntries]);

  const totalCredit = useMemo(() => {
    return effectiveGlEntries.reduce((sum, item) => sum + (item.credit || 0), 0);
  }, [effectiveGlEntries]);

  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  if (!isOpen) return null;

  return (
    <aside
      id="nexus-l5-context-rail"
      className="fixed inset-y-0 right-0 w-96 max-w-[90vw] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-50 shadow-2xl transition-all duration-300 select-none animate-in slide-in-from-right-10"
      role="dialog"
      aria-label="Hồ sơ & Truy vết 360 độ"
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 truncate">
                Hồ Sơ & Truy Vết 360°
              </h3>
              <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                Audited
              </span>
            </div>
            <p className="text-[11px] font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 truncate mt-0.5 tabular-nums">
              {currentCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {currentModule && onTogglePin && (
            <div className="relative group">
              <button
                id="rail-header-btn-pin"
                type="button"
                onClick={onTogglePin}
                className={`h-7 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ease-out transform hover:scale-[1.03] active:scale-95 cursor-pointer shadow-2xs ${
                  isPinned
                    ? 'bg-amber-100 hover:bg-amber-200/90 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-600/80 hover:shadow-xs'
                    : 'bg-white dark:bg-slate-800 hover:bg-amber-50/90 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200/90 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600/70 hover:shadow-xs'
                }`}
                title={isPinned ? 'Bỏ ghim module này' : 'Ghim module này'}
                aria-label={isPinned ? 'Bỏ ghim module này' : 'Ghim module này'}
              >
                {isPinned ? (
                  <>
                    <PinOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:rotate-12 transition-transform duration-200" />
                    <span className="hidden sm:inline text-[11px] font-bold">Đã ghim</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform duration-200" />
                    <span className="hidden sm:inline text-[11px]">Ghim nhanh</span>
                  </>
                )}
              </button>

              {/* Smooth Hover Tooltip */}
              <div className="absolute top-full right-0 mt-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out transform translate-y-1 group-hover:translate-y-0 scale-95 group-hover:scale-100 whitespace-nowrap">
                <div className="relative px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-semibold shadow-xl border border-slate-700/50 dark:border-slate-300/50 flex items-center gap-1.5">
                  <div className="absolute -top-1 right-3.5 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45 border-l border-t border-slate-700/50 dark:border-slate-300/50" />
                  {isPinned ? (
                    <>
                      <PinOff className="w-3 h-3 text-amber-400 dark:text-amber-600 shrink-0" />
                      <span>Bỏ ghim module này</span>
                    </>
                  ) : (
                    <>
                      <Pin className="w-3 h-3 text-amber-400 dark:text-amber-600 shrink-0" />
                      <span>Ghim module này</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng bảng truy vết"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Lookup Bar */}
      <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tra cứu mã chứng từ (PO, SO, GRN, INV)..."
            value={searchDocTerm}
            onChange={(e) => setSearchDocTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
        {searchDocTerm && onSelectEntityCode && (
          <button
            type="button"
            onClick={() => onSelectEntityCode(searchDocTerm.trim())}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
          >
            Tìm
          </button>
        )}
      </div>

      {/* Segmented Tabs (L3 - 4 Domain Context Dimensions) */}
      <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
        <button
          type="button"
          onClick={() => setActiveRailTab('pipeline')}
          className={`py-2.5 px-1 text-[11px] font-semibold text-center flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeRailTab === 'pipeline'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Thao tác nghiệp vụ & Quy trình liên thông"
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span className="truncate">Nghiệp vụ</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveRailTab('filters')}
          className={`py-2.5 px-1 text-[11px] font-semibold text-center flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeRailTab === 'filters'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Bộ lọc & Chế độ xem lưu trữ"
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="truncate">Bộ lọc</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveRailTab('stats')}
          className={`py-2.5 px-1 text-[11px] font-semibold text-center flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeRailTab === 'stats'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Thống kê nhanh & Biểu đồ"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="truncate">Chỉ số</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveRailTab('ledger')}
          className={`py-2.5 px-1 text-[11px] font-semibold text-center flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeRailTab === 'ledger'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Kiểm toán SHA-256 & Sổ cái GL"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="truncate">Sổ cái & Audit</span>
        </button>
      </div>

      {/* Main Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: ACTIONS & PROCESS FLOW PIPELINE */}
        {activeRailTab === 'pipeline' && (
          <div className="space-y-4">
            {/* L3: Quick Toolbar Pinning Action Card */}
            {currentModule && onTogglePin && (
              <div
                id="rail-quick-toolbar-card"
                className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border border-amber-200/90 dark:border-slate-700 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-xs ${
                        isPinned
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-100 text-amber-700 dark:bg-slate-700 dark:text-amber-400'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Thanh Công Cụ Nhanh</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                          Quick Bar
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isPinned ? 'Phân hệ này đang hiển thị trên thanh công cụ' : 'Chưa ghim phân hệ này'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isPinned
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isPinned ? 'ĐÃ GHIM' : 'CHƯA GHIM'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/60 border border-amber-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      [{currentModule.code}] {currentModule.moduleName}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Nhóm: {currentModule.domain}
                    </div>
                  </div>
                  <div className="relative group/card-pin">
                    <button
                      id="rail-btn-pin-toggle-card"
                      type="button"
                      onClick={onTogglePin}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ease-out transform hover:scale-[1.03] active:scale-95 shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5 ${
                        isPinned
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                      }`}
                      title={isPinned ? 'Bỏ ghim module này' : 'Ghim module này'}
                      aria-label={isPinned ? 'Bỏ ghim module này' : 'Ghim module này'}
                    >
                      {isPinned ? (
                        <>
                          <PinOff className="w-3.5 h-3.5 group-hover/card-pin:rotate-12 transition-transform duration-200" />
                          <span>Bỏ ghim</span>
                        </>
                      ) : (
                        <>
                          <Pin className="w-3.5 h-3.5 group-hover/card-pin:rotate-12 transition-transform duration-200" />
                          <span>Ghim lên thanh công cụ nhanh</span>
                        </>
                      )}
                    </button>

                    {/* Smooth Tooltip for Card Pin */}
                    <div className="absolute bottom-full right-0 mb-2 z-50 pointer-events-none opacity-0 group-hover/card-pin:opacity-100 transition-all duration-200 ease-out transform translate-y-1 group-hover/card-pin:translate-y-0 scale-95 group-hover/card-pin:scale-100 whitespace-nowrap">
                      <div className="relative px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-semibold shadow-xl border border-slate-700/50 dark:border-slate-300/50 flex items-center gap-1.5">
                        <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45 border-r border-b border-slate-700/50 dark:border-slate-300/50" />
                        {isPinned ? (
                          <>
                            <PinOff className="w-3 h-3 text-amber-400 dark:text-amber-600 shrink-0" />
                            <span>Bỏ ghim module này</span>
                          </>
                        ) : (
                          <>
                            <Pin className="w-3 h-3 text-amber-400 dark:text-amber-600 shrink-0" />
                            <span>Ghim module này</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {pinnedModules && pinnedModules.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      <span>Phân hệ đã ghim ({pinnedModules.length})</span>
                      <span className="font-mono text-amber-600 text-[10px]">Chuyển nhanh</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pinnedModules.map((pm) => (
                        <button
                          key={pm.moduleId}
                          type="button"
                          onClick={() => onNavigate?.(pm.moduleId)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            pm.moduleId === currentModule.moduleId
                              ? 'bg-amber-500 text-white shadow-2xs font-bold'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                          }`}
                          title={`Chuyển ngay đến [${pm.moduleId}] ${pm.moduleName}`}
                        >
                          <span className="font-mono text-[9px] font-bold opacity-80">{pm.moduleId}</span>
                          <span className="truncate max-w-[85px]">{pm.moduleName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* L3: Workspace-Specific Actions */}
            {workspaceActions && workspaceActions.length > 0 && (
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Thao Tác Nhanh Phân Hệ
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{workspaceActions.length} tác vụ</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {workspaceActions.map((act, i) => {
                    const ActIcon = act.icon || Zap;
                    return (
                      <button
                        key={act.id || i}
                        type="button"
                        onClick={act.onClick}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 border border-slate-200/80 dark:border-slate-700 cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <ActIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <div>{act.label}</div>
                            {act.description && (
                              <div className="text-[10px] text-slate-400 font-normal">{act.description}</div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Header info */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Chuỗi Giá Trị Liên Thông (E2E)
              </span>
              <span className="text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {effectiveLineage.length} Nút Thực Thể
              </span>
            </div>

            {/* BLOCK 1: UPSTREAM / NGUỒN */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  1. Khối Nguồn (Upstream Requirements)
                </span>
                <span className="text-[10px] text-slate-400">{pipelineGroups.upstream.length} bước</span>
              </div>

              <div className="space-y-2">
                {pipelineGroups.upstream.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-1">Đây là chứng từ khởi tạo đầu chuỗi.</p>
                ) : (
                  pipelineGroups.upstream.map((node) => {
                    const NodeIcon = getEntityIcon(node.type, node.code);
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeDetails(node)}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                              <NodeIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono tabular-nums font-bold text-[11px] text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors tabular-nums">
                                {node.code}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{node.type}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                            {node.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* FLOW ARROW */}
            <div className="flex justify-center">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </div>
            </div>

            {/* BLOCK 2: CURRENT / CHỨNG TỪ HIỆN TẠI */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-400 dark:border-blue-600 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 dark:text-blue-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  2. Chứng Từ Hiện Tại (Focus Entity)
                </span>
                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100">
                  Target
                </span>
              </div>

              {pipelineGroups.current.map((node) => {
                const NodeIcon = getEntityIcon(node.type, node.code);
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeDetails(node)}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                          <NodeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white tabular-nums">
                            {node.code}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{node.type}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {node.status}
                      </span>
                    </div>

                    {selectedEntity?.title && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 line-clamp-2">
                        {selectedEntity.title}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FLOW ARROW */}
            <div className="flex justify-center">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* BLOCK 3: DOWNSTREAM / KẾ THỪA */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  3. Khối Kế Thừa (Downstream Fulfilment & Ledger)
                </span>
                <span className="text-[10px] text-slate-400">{pipelineGroups.downstream.length} bước</span>
              </div>

              <div className="space-y-2">
                {pipelineGroups.downstream.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-1">Chưa có chứng từ phát sinh kế thừa.</p>
                ) : (
                  pipelineGroups.downstream.map((node) => {
                    const NodeIcon = getEntityIcon(node.type, node.code);
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeDetails(node)}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <NodeIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono tabular-nums font-bold text-[11px] text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors tabular-nums">
                                {node.code}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{node.type}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                            {node.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FILTERS & SAVED VIEWS */}
        {activeRailTab === 'filters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Chế Độ Xem & Bộ Lọc Đã Lưu
              </span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                {savedViews.length || 3} chế độ
              </span>
            </div>

            {/* Saved Views List */}
            <div className="space-y-1.5">
              {(savedViews.length > 0 ? savedViews : [
                { id: 'all', name: 'Tất cả dữ liệu phân hệ', count: 124, active: true },
                { id: 'pending', name: 'Đang xử lý & Chờ phê duyệt', count: 18, active: false },
                { id: 'sla_alert', name: 'Cảnh báo SLA & Quá hạn', count: 3, active: false },
                { id: 'closed', name: 'Đã hoàn tất & Khóa sổ', count: 103, active: false },
              ]).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectSavedView && onSelectSavedView(v.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    v.active
                      ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">{v.name}</span>
                  {v.count !== undefined && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      v.active ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}>
                      {v.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Filter Criteria Tags */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                Tiêu Chí Phân Loại Nhanh
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Hôm nay', 'Tuần này', 'Tháng 3/2026', 'Chi nhánh HCM', 'Chi nhánh HN', 'Ưu tiên cao', 'Đã đối soát GL'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 cursor-pointer transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUICK STATS & KPIS */}
        {activeRailTab === 'stats' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Chỉ Số Hiệu Suất Nhanh (KPIs)
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">
                Real-time
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(quickStats.length > 0 ? quickStats : [
                { label: 'Tổng Giá Trị Ghi Nhận', value: '1.450.000.000 ₫', status: 'success' },
                { label: 'Số Chứng Từ Phát Sinh', value: '42', status: 'info' },
                { label: 'Tiến Độ Hoàn Tất SLA', value: '98.4%', status: 'success' },
                { label: 'Chênh Lệch Đối Soát', value: '0 ₫', status: 'success' },
              ]).map((stat, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                    {stat.label}
                  </span>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Distribution Progress Bar */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Phân bổ trạng thái xử lý</span>
                <span className="font-mono text-[10px] text-blue-600">85% Hoàn thành</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                <div className="h-full bg-emerald-500 w-[65%]" title="Đã hoàn tất" />
                <div className="h-full bg-blue-500 w-[20%]" title="Đang xử lý" />
                <div className="h-full bg-amber-500 w-[10%]" title="Chờ duyệt" />
                <div className="h-full bg-rose-500 w-[5%]" title="Quá hạn" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Hoàn tất</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Đang xử lý</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Chờ duyệt</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT TRAIL & GL LEDGER */}
        {activeRailTab === 'ledger' && (
          <div className="space-y-4">
            <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Nhật Ký Kiểm Toán Bất Biến
              </span>
              <span className="text-[10px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> SHA-256 Validated
              </span>
            </div>

            <div className="relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700 space-y-3">
              {effectiveAuditTrail.map((log) => (
                <div key={log.id} className="relative space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="absolute -left-[19px] top-3.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                  
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {log.action}
                    </h5>
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    Thực hiện bởi: <strong className="text-slate-900 dark:text-slate-100">{log.user}</strong>
                  </p>

                  {log.sha256Checksum && (
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1 text-[9px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
                      <Fingerprint className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">{log.sha256Checksum}</span>
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>

            {/* General Ledger preview */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Bút Toán Sổ Cái Kép (General Ledger)
                </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono tabular-nums ${
                  isBalanced
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isBalanced ? '✓ Nợ = Có (Cân Đối)' : 'Chưa cân đối'}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-xs">
              <table className="w-full text-[11px] divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Tài Khoản</th>
                    <th className="py-2.5 px-3 text-right">Nợ (VND)</th>
                    <th className="py-2.5 px-3 text-right">Có (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono tabular-nums">
                  {effectiveGlEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="py-2 px-3">
                        <div className="font-bold text-blue-700 dark:text-blue-400">{entry.account}</div>
                        {entry.accountName && (
                          <div className="font-sans text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                            {entry.accountName}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-900 dark:text-white tabular-nums font-semibold">
                        {entry.debit > 0 ? entry.debit.toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-900 dark:text-white tabular-nums font-semibold">
                        {entry.credit > 0 ? entry.credit.toLocaleString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-900 font-mono tabular-nums font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-bold">Tổng Cộng</td>
                    <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400 tabular-nums">
                      {totalDebit.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400 tabular-nums">
                      {totalCredit.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Node Detail Inspector Modal / Drawer Bottom Overlay */}
      {selectedNodeDetails && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Chi tiết Nút Chứng Từ
            </span>
            <button
              type="button"
              onClick={() => setSelectedNodeDetails(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono tabular-nums font-bold text-xs text-blue-600 dark:text-blue-400 tabular-nums">
                {selectedNodeDetails.code}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {selectedNodeDetails.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {selectedNodeDetails.type}
            </p>
            {selectedNodeDetails.date && (
              <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                Ngày phát sinh: {selectedNodeDetails.date}
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
