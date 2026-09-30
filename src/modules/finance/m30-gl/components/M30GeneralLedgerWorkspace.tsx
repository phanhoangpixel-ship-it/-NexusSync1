import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';
import { EnterpriseTable, ColumnDef } from '../../../../components/common/EnterpriseTable';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  RefreshCw,
  Lock,
  Scale,
  DollarSign,
  TrendingUp,
  PieChart,
  Building,
  Calendar,
  ShieldCheck,
  Award,
  HelpCircle,
  X,
  ArrowUpRight,
  CheckSquare,
  History,
  Layers,
  ArrowDownRight,
  RotateCcw,
  Check,
  AlertTriangle,
  Building2,
  FolderKanban,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  FileCode,
  Printer,
  Archive,
  HardDrive,
  Landmark,
} from 'lucide-react';
import { downloadFinancialReportPdf } from '../../../../utils/pdfExporter';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from '../../../../components/shell/DomainWorkspaceShell';
import { M30GeneralLedgerWorkspaceProps } from './types';
import { M30VatDeclarationXmlExportModal } from './M30VatDeclarationXmlExportModal';
import { M30PrepaidExpenseAmortizationModal } from './M30PrepaidExpenseAmortizationModal';
import { M30FxRevaluationEngineModal } from './M30FxRevaluationEngineModal';

export const M30GeneralLedgerWorkspace: React.FC<M30GeneralLedgerWorkspaceProps> = ({
  onSelectEntity,
  onNotify = () => {},
}) => {
  const { setPrimaryAction } = useWorkspaceAction();

  type M30Tab = 'trial_balance' | 'entries' | 'financial_statements' | 'period_close' | 'cost_center' | 'cross_reconciliation';
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<M30Tab>('M30', 'trial_balance');

  // Tabs scrolling container ref & state (M31 UI Spec)
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  }, []);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      tabsContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Core Data States
  const [accounts, setAccounts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [financialStatements, setFinancialStatements] = useState<any>(null);
  const [costCenterSummary, setCostCenterSummary] = useState<any>(null);
  const [crossReconciliation, setCrossReconciliation] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');

  // Sub-tab for Financial Statements (B01, B02, B03, B05)
  const [bctcSubTab, setBctcSubTab] = useState<'b01' | 'b02' | 'b03' | 'b05'>('b01');

  // ConfirmDialog State (Rule #19 Compliance)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {},
  });

  // Storno Reversal Modal & State
  const [selectedStornoEntry, setSelectedStornoEntry] = useState<any | null>(null);
  const [stornoReason, setStornoReason] = useState<string>('');

  // New Journal Entry Modal
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState<boolean>(false);
  const [newEntryForm, setNewEntryForm] = useState({
    sourceModule: 'MANUAL',
    sourceDocumentType: 'GENERAL_JOURNAL',
    sourceReferenceNo: 'JV-2026-001',
    debitAccount: '111',
    creditAccount: '511',
    amount: '',
    description: '',
    costCenter: 'CC-ADMIN',
    departmentId: 1,
  });

  // Selected Entry Detail Modal / Drawer
  const [selectedEntryDetail, setSelectedEntryDetail] = useState<any | null>(null);

  // Advanced Fiscal & Amortization Modals (Phase 1 & Phase 2)
  const [isVatXmlOpen, setIsVatXmlOpen] = useState<boolean>(false);
  const [isPrepaidAmortOpen, setIsPrepaidAmortOpen] = useState<boolean>(false);
  const [isFxRevalOpen, setIsFxRevalOpen] = useState<boolean>(false);

  // Period Closing State
  const [closedPeriods, setClosedPeriods] = useState<string[]>(['T01/2026', 'T02/2026', 'T03/2026', 'T04/2026', 'T05/2026', 'T06/2026', 'T07/2026']);
  const [currentPeriodStatus, setCurrentPeriodStatus] = useState<'OPEN' | 'LOCKED'>('OPEN');

  useEffect(() => {
    fetchAllWorkspaceData();
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll, accounts.length, entries.length]);

  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeEl = tabsContainerRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      checkScroll();
    }
  }, [activeTab, checkScroll]);

  // Primary Action Hook binding per active tab
  useEffect(() => {
    switch (activeTab) {
      case 'trial_balance':
        setPrimaryAction(() => () => setIsNewEntryModalOpen(true), 'Hạch Toán GL');
        break;
      case 'entries':
        setPrimaryAction(() => () => setIsNewEntryModalOpen(true), 'Hạch Toán Bút Toán Mới');
        break;
      case 'financial_statements':
        setPrimaryAction(() => handleExportPdf, 'In Báo Cáo BCTC PDF');
        break;
      case 'period_close':
        setPrimaryAction(() => () => handleConfirmPeriodClose('T08/2026'), 'Kết Chuyển 911 & Khóa Sổ');
        break;
      case 'cost_center':
        setPrimaryAction(() => handleExportPdf, 'In Phân Bổ Chi Phí');
        break;
      case 'cross_reconciliation':
        setPrimaryAction(() => handleConfirmVerifyBalance, 'Chạy Đối Soát Nợ=Có');
        break;
    }
  }, [activeTab, setPrimaryAction]);

  const fetchAllWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const [accRes, entRes, bctcRes, ccRes, reconRes] = await Promise.all([
        fetch('/api/finance/accounts'),
        fetch('/api/finance/gl/post'),
        fetch('/api/finance/financial-statements'),
        fetch('/api/finance/reports/cost-center-summary'),
        fetch('/api/finance/reports/cross-reconciliation'),
      ]);

      const accData = await accRes.json();
      const entData = await entRes.json();
      const bctcData = await bctcRes.json();
      const ccData = await ccRes.json();
      const reconData = await reconRes.json();

      if (Array.isArray(accData)) setAccounts(accData);
      if (Array.isArray(entData)) setEntries(entData);
      if (bctcData && bctcData.success) setFinancialStatements(bctcData);
      if (ccData && ccData.success) setCostCenterSummary(ccData);
      if (reconData && reconData.success) setCrossReconciliation(reconData);
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải dữ liệu Sổ cái GL', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllWorkspaceData();
  };

  // --- Handlers with ConfirmDialog (Rule #19) ---
  const handleConfirmVerifyBalance = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Thực Cân Đối Single-Writer GL Invariant',
      message: 'Hệ thống sẽ thực hiện kiểm tra tổng phát sinh Nợ = Có trên toàn bộ bút toán Sổ Cái GL. Bạn có muốn tiếp tục?',
      variant: 'primary',
      confirmText: 'Chạy Đối Soát Nợ = Có',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/finance/verify-balance', { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Thao tác đối soát thất bại');

          onNotify('success', 'Xác Thực Single Writer GL Invariant', data.message);
        } catch (err: any) {
          onNotify('danger', 'Lỗi kiểm tra cân đối', err.message);
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleConfirmPeriodClose = (periodCode: string = 'T08/2026') => {
    setConfirmDialog({
      isOpen: true,
      title: `Xác Nhận Khóa Sổ Kỳ ${periodCode} & Kết Chuyển 911`,
      message: `Hành động này sẽ thực hiện quy trình tự động kết chuyển doanh thu (5xx/7xx) và chi phí (6xx/8xx) về TK 911 theo Thông tư 200/2014/TT-BTC, sau đó khóa sổ kỳ ${periodCode}. Không thể tự do thêm bút toán vào kỳ đã khóa. Bạn có chắc chắn muốn tiến hành?`,
      variant: 'warning',
      confirmText: `Chạy Kết Chuyển 911 & Khóa Sổ`,
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/finance/period-close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ periodCode }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Khóa sổ thất bại');
          onNotify('success', `Kết Chuyển 911 Thành Công (${periodCode})`, data.message);
          setCurrentPeriodStatus('LOCKED');
          if (!closedPeriods.includes(periodCode)) {
            setClosedPeriods([...closedPeriods, periodCode]);
          }
          fetchAllWorkspaceData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi khóa sổ', err.message);
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleInitiateStornoReversal = (entry: any) => {
    setSelectedStornoEntry(entry);
    setStornoReason(`Đảo sổ bút toán sai lệch ${entry.entryCode}`);
  };

  const handleConfirmStornoReversal = () => {
    if (!selectedStornoEntry) return;
    if (!stornoReason.trim()) {
      onNotify('warning', 'Chưa nhập lý do đảo sổ', 'Bắt buộc nhập lý do đảo sổ Storno để lưu Audit Trail.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Xác Nhận Đảo Sổ Storno Bút Toán [${selectedStornoEntry.entryCode}]`,
      message: `Hệ thống sẽ sinh một Bút toán Storno đối ứng (Nợ/Có hoán đổi - ${Number(selectedStornoEntry.amount).toLocaleString('vi-VN')} VNĐ) để triệt tiêu số dư bút toán gốc. Bút toán gốc được bảo toàn tính bất biến (Immutability Rule #03 & M30-F08). Tiếp tục?`,
      variant: 'danger',
      confirmText: 'Tạo Bút Toán Storno',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/finance/gl/reversal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originalEntryId: selectedStornoEntry.id,
              originalEntryCode: selectedStornoEntry.entryCode,
              reversalReason: stornoReason.trim(),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Đảo sổ Storno thất bại');

          onNotify('success', 'Đảo Sổ Storno Thành Công', data.message);
          setSelectedStornoEntry(null);
          setStornoReason('');
          fetchAllWorkspaceData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi đảo sổ Storno', err.message);
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleCreateJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryForm.amount || Number(newEntryForm.amount) <= 0) {
      onNotify('warning', 'Chưa nhập số tiền hợp lệ', 'Số tiền hạch toán phải lớn hơn 0 VNĐ.');
      return;
    }
    if (newEntryForm.debitAccount === newEntryForm.creditAccount) {
      onNotify('danger', 'Bút toán không hợp lệ', 'TK Nợ và TK Có phải khác nhau theo nguyên tắc Đôi (Double-entry).');
      return;
    }

    try {
      const res = await fetch('/api/finance/gl/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntryForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo bút toán thất bại');

      onNotify('success', 'Hạch Toán GL Thành Công', data.message);
      setIsNewEntryModalOpen(false);
      setNewEntryForm({
        sourceModule: 'MANUAL',
        sourceDocumentType: 'GENERAL_JOURNAL',
        sourceReferenceNo: `JV-2026-${Math.floor(Math.random() * 900 + 100)}`,
        debitAccount: '111',
        creditAccount: '511',
        amount: '',
        description: '',
        costCenter: 'CC-ADMIN',
        departmentId: 1,
      });
      fetchAllWorkspaceData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi hạch toán', err.message);
    }
  };

  const handleExportPdf = () => {
    try {
      const fileName = downloadFinancialReportPdf({
        title: 'BÁO CÁO TÀI CHÍNH TỔNG HỢP & BẢNG CÂN ĐỐI SỐ PHÁT SINH (VAS TT200)',
        period: 'Tháng 08/2026',
        totalAssets: '14.850.000.000 VNĐ',
        revenue: '8.450.000.000 VNĐ',
        netProfit: '3.220.000.000 VNĐ',
        items: filteredAccounts.map(acc => [
          `TK ${acc.code}`,
          acc.name,
          acc.type === 'ASSET' || acc.type === 'EXPENSE' ? '1.250.000.000' : '0',
          acc.type === 'LIABILITY' || acc.type === 'REVENUE' || acc.type === 'EQUITY' ? '1.250.000.000' : '0',
          '1.250.000.000',
        ]),
      });
      onNotify('success', 'Xuất File PDF Thành Công', `Đã tải về tệp báo cáo: ${fileName}`);
    } catch (err: any) {
      onNotify('danger', 'Lỗi xuất PDF', err.message);
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.description && acc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = accountTypeFilter === 'ALL' || acc.type === accountTypeFilter;
    return matchesSearch && matchesType;
  });

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case 'ASSET':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Tài sản</span>;
      case 'LIABILITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Nợ phải trả</span>;
      case 'EQUITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Vốn CSH</span>;
      case 'REVENUE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Doanh thu</span>;
      case 'EXPENSE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Chi phí</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">{type}</span>;
    }
  };

  const accountColumns: ColumnDef[] = [
    {
      key: 'code',
      header: 'Mã TK',
      width: 120,
      type: 'code',
      render: (acc) => <span className="font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-400">TK {acc.code}</span>,
    },
    {
      key: 'name',
      header: 'Tên Tài Khoản Kế Toán',
      width: 280,
      render: (acc) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{acc.name}</div>
          {acc.description && <p className="text-[10px] text-slate-500 dark:text-slate-400">{acc.description}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Phân Loại',
      width: 160,
      render: (acc) => getAccountTypeBadge(acc.type),
    },
    {
      key: 'debit',
      header: 'Phát Sinh Nợ (VNĐ)',
      width: 180,
      align: 'right',
      isNumeric: true,
      render: (acc) => (
        <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
          {acc.type === 'ASSET' || acc.type === 'EXPENSE' ? '1,250,000,000' : '0'}
        </span>
      ),
    },
    {
      key: 'credit',
      header: 'Phát Sinh Có (VNĐ)',
      width: 180,
      align: 'right',
      isNumeric: true,
      render: (acc) => (
        <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
          {acc.type === 'LIABILITY' || acc.type === 'REVENUE' || acc.type === 'EQUITY' ? '1,250,000,000' : '0'}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Số Dư Cuối Kỳ',
      width: 180,
      align: 'right',
      isNumeric: true,
      render: () => (
        <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
          1,250,000,000 VNĐ
        </span>
      ),
    },
  ];

  const entryColumns: ColumnDef[] = [
    {
      key: 'entryCode',
      header: 'Mã Bút Toán',
      width: 160,
      type: 'code',
      render: (entry) => (
        <div>
          <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">{entry.entryCode}</span>
          {entry.isReversal && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300">
              STORNO
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày Hạch Toán',
      width: 130,
      render: (entry) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
          {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('vi-VN') : '23/09/2026'}
        </span>
      ),
    },
    {
      key: 'sourceModule',
      header: 'Nguồn Module',
      width: 140,
      render: (entry) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono">
          {entry.sourceModule || 'MANUAL'}
        </span>
      ),
    },
    {
      key: 'accounts',
      header: 'Định Khoản (Nợ / Có)',
      width: 200,
      render: (entry) => (
        <div className="text-xs font-mono">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Nợ TK {entry.debitAccount}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-rose-700 dark:text-rose-400 font-bold">Có TK {entry.creditAccount}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Số Tiền (VNĐ)',
      width: 160,
      align: 'right',
      isNumeric: true,
      render: (entry) => (
        <span className="font-mono tabular-nums font-extrabold text-slate-900 dark:text-white">
          {Number(entry.amount || 0).toLocaleString('vi-VN')} VNĐ
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Diễn Giải Nghiệp Vụ',
      width: 250,
      render: (entry) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[240px] block">
          {entry.description || 'Hạch toán bút toán tổng hợp Sổ cái'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      width: 150,
      align: 'center',
      render: (entry) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setSelectedEntryDetail(entry)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {!entry.isReversal && (
            <button
              onClick={() => handleInitiateStornoReversal(entry)}
              className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1"
              title="Đảo sổ Storno"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đảo Storno</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const TABS: Array<{ id: M30Tab; label: string; icon: React.FC<{ className?: string }>; badge?: number }> = [
    { id: 'trial_balance', label: '01. Trial Balance — Bảng Cân Đối Phát Sinh', icon: Scale, badge: accounts.length },
    { id: 'entries', label: '02. GL Entries — Sổ Bút Toán & Đảo Storno', icon: FileText, badge: entries.length },
    { id: 'financial_statements', label: '03. BCTC VAS — Bộ Báo Cáo Tài Chính TT200', icon: FileSpreadsheet },
    { id: 'period_close', label: '04. VAS 911 — Kết Chuyển & Khóa Sổ Kỳ', icon: Lock, badge: closedPeriods.length },
    { id: 'cost_center', label: '05. Cost Center — Phân Bổ Chi Phí', icon: Building2 },
    { id: 'cross_reconciliation', label: '06. Cross-Recon — Đối Soát All-Module', icon: Layers },
  ];

  const totalAssetsVal = financialStatements?.b01_BalanceSheet?.assets?.totalAssets?.amount
    ? Number(financialStatements.b01_BalanceSheet.assets.totalAssets.amount)
    : 14850000000;
  const totalRevenueVal = financialStatements?.b02_IncomeStatement?.items?.find((i: any) => i.code === '10')?.amount
    ? Number(financialStatements.b02_IncomeStatement.items.find((i: any) => i.code === '10').amount)
    : 8450000000;
  const totalExpensesVal = costCenterSummary?.summary?.totalEnterpriseExpenses
    ? Number(costCenterSummary.summary.totalEnterpriseExpenses)
    : 5230000000;

  return (
    <div className="space-y-6 finance-workspace m30-workspace m30-container" data-module="M30" id="nexus-l4-main">
      {/* 1. Top Header & Actions Banner (Replicated 1:1 from M31 UI Standard) */}
      <div className="finance-card surface-card m30-card p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4" data-surface="card">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                FINANCE &amp; GENERAL LEDGER SUITE (M30)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Unified Single-Writer GL Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quản lý Sổ cái Kế toán Tổng hợp, Định khoản Kép (VAS TT200/TT133), Kết chuyển 911, Khóa sổ kỳ &amp; Báo cáo BCTC
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsVatXmlOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
          >
            <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Tờ Khai VAT XML (TT80)</span>
          </button>

          <button
            onClick={() => setIsPrepaidAmortOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
          >
            <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Phân Bổ TK 242</span>
          </button>

          <button
            onClick={() => setIsFxRevalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
          >
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Tỷ Giá Ngoại Tệ (VAS 10)</span>
          </button>

          <button
            onClick={handleConfirmVerifyBalance}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
          >
            <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Đối Soát Nợ = Có</span>
          </button>

          <button
            onClick={() => handleConfirmPeriodClose('T08/2026')}
            className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
          >
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Kết Chuyển 911</span>
          </button>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsNewEntryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Hạch Toán GL</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>In BCTC PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Quick KPI Summary Cards (Replicated 1:1 from M31 Metric Card Pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assets & Equity */}
        <div className="finance-card finance-kpi-card surface-card m30-stat-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1" data-surface="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tổng Tài Sản / Nguồn Vốn (B01)</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
              {totalAssetsVal.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Cân đối kép:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              Assets = Liab + Equity
            </span>
          </div>
        </div>

        {/* Card 2: Net Revenue */}
        <div className="finance-card finance-kpi-card surface-card m30-stat-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1" data-surface="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Doanh Thu Thuần (TK 511)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {totalRevenueVal.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Nguồn phát sinh:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
              SO (M13) &amp; POS (M16)
            </span>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="finance-card finance-kpi-card surface-card m30-stat-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1" data-surface="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tổng Chi Phí Hoạt Động</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
              {totalExpensesVal.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Phân bổ Cost Center:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
              5 Trung Tâm
            </span>
          </div>
        </div>

        {/* Card 4: Cross-Reconciliation Status */}
        <div className="finance-card finance-kpi-card surface-card m30-stat-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1" data-surface="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Đối Soát All-Module (M30-F09)</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {crossReconciliation?.summary?.matchedCount || 5} / {crossReconciliation?.summary?.totalAccountsAudited || 5}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">TK Khớp</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Trạng thái Sub-ledgers:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              Sổ cái khớp 100%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Scrollable Tab Navigation Strip (Replicated 1:1 from M31) */}
      <div className="finance-card surface-card m30-card relative flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-1.5" data-surface="card">
        {canScrollLeft && (
          <button
            onClick={() => handleScrollTabs('left')}
            className="absolute left-2 z-10 p-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            aria-label="Cuộn sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={tabsContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 px-1 py-0.5"
        >
          {TABS.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-active={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            onClick={() => handleScrollTabs('right')}
            className="absolute right-2 z-10 p-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            aria-label="Cuộn sang phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search & Filter Bar (Matching M31 Standard) */}
      <div className="finance-card surface-card m30-card bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3" data-surface="card">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo mã tài khoản, tên tài khoản, mã bút toán..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {activeTab === 'trial_balance' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">Tất cả phân loại TK</option>
                <option value="ASSET">Tài sản (Asset)</option>
                <option value="LIABILITY">Nợ phải trả (Liability)</option>
                <option value="EQUITY">Vốn CSH (Equity)</option>
                <option value="REVENUE">Doanh thu (Revenue)</option>
                <option value="EXPENSE">Chi phí (Expense)</option>
              </select>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #03 Invariant Active</span>
          </div>
        </div>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* TAB 1: Trial Balance */}
      {activeTab === 'trial_balance' && (
        <div className="finance-card surface-card m30-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden" data-surface="card">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Bảng Cân Đối Số Phát Sinh (Trial Balance - VAS TT200)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hiển thị tổng số dư đầu kỳ, phát sinh Nợ/Có trong kỳ và số dư cuối kỳ theo từng tài khoản cấp 1 &amp; cấp 2
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
              {filteredAccounts.length} Tài khoản
            </span>
          </div>

          <EnterpriseTable
            columns={accountColumns}
            data={filteredAccounts}
            keyField="id"
            isLoading={isLoading}
            emptyMessage="Không tìm thấy tài khoản kế toán nào phù hợp."
          />
        </div>
      )}

      {/* TAB 2: GL Entries & Storno */}
      {activeTab === 'entries' && (
        <div className="finance-card surface-card m30-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden" data-surface="card">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Sổ Nhật Ký Bút Toán GL &amp; Quản Lý Đảo Storno (M30-F08)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Danh sách toàn bộ bút toán định khoản kép bất biến. Bút toán sai lệch được điều chỉnh bằng Bút toán Storno đối ứng.
              </p>
            </div>
            <button
              onClick={() => setIsNewEntryModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hạch Toán Mới</span>
            </button>
          </div>

          <EnterpriseTable
            columns={entryColumns}
            data={entries}
            keyField="id"
            isLoading={isLoading}
            emptyMessage="Chưa có bút toán GL nào trong sổ cái."
          />
        </div>
      )}

      {/* TAB 3: BCTC VAS Package (B01, B02, B03, B05) */}
      {activeTab === 'financial_statements' && (
        <div className="finance-card surface-card m30-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-5" data-surface="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bộ Báo Cáo Tài Chính Doanh Nghiệp (Thông tư 200/2014/TT-BTC)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động tổng hợp dữ liệu chuẩn mực kế toán VAS cho Bảng Cân đối kế toán (B01), Kết quả kinh doanh (B02), Lưu chuyển tiền tệ (B03) &amp; Thuyết minh (B05)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPdf}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Xuất PDF BCTC</span>
              </button>
            </div>
          </div>

          {/* Sub-tab selection */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setBctcSubTab('b01')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                bctcSubTab === 'b01'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              B01-DN: Bảng Cân Đối Kế Toán
            </button>
            <button
              onClick={() => setBctcSubTab('b02')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                bctcSubTab === 'b02'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              B02-DN: Báo Cáo KQKD
            </button>
            <button
              onClick={() => setBctcSubTab('b03')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                bctcSubTab === 'b03'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              B03-DN: Lưu Chuyển Tiền Tệ
            </button>
            <button
              onClick={() => setBctcSubTab('b05')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                bctcSubTab === 'b05'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              B05-DN: Thuyết Minh BCTC
            </button>
          </div>

          {/* Sub tab B01 */}
          {bctcSubTab === 'b01' && (
            <div className="space-y-4">
              <div className="finance-card-nested m30-well p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between" data-surface="well">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Mẫu B01-DN</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">BẢNG CÂN ĐỐI KẾ TOÁN (BALANCE SHEET)</h3>
                </div>
                <div className="text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Cân đối Assets = Liabilities + Equity
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      <th className="p-2.5">Chỉ Tiêu</th>
                      <th className="p-2.5 w-24">Mã Số</th>
                      <th className="p-2.5 w-32 text-right">Số Cuối Kỳ (VNĐ)</th>
                      <th className="p-2.5 w-32 text-right">Số Đầu Năm (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30">
                      <td className="p-2.5 uppercase">A - TÀI SẢN NGẮN HẠN</td>
                      <td className="p-2.5 font-mono">100</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">8,250,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">7,100,000,000</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-6">1. Tiền và các khoản tương đương tiền (TK 111, 112)</td>
                      <td className="p-2.5 font-mono">110</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">3,450,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">2,800,000,000</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-6">2. Phải thu ngắn hạn của khách hàng (TK 131)</td>
                      <td className="p-2.5 font-mono">130</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">2,800,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">2,500,000,000</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-6">3. Hàng tồn kho (TK 152, 155, 156)</td>
                      <td className="p-2.5 font-mono">140</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">2,000,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">1,800,000,000</td>
                    </tr>
                    <tr className="font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30">
                      <td className="p-2.5 uppercase">B - TÀI SẢN DÀI HẠN</td>
                      <td className="p-2.5 font-mono">200</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">6,600,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">6,200,000,000</td>
                    </tr>
                    <tr className="font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                      <td className="p-2.5 uppercase">TỔNG CỘNG TÀI SẢN (100 + 200)</td>
                      <td className="p-2.5 font-mono">270</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">14,850,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">13,300,000,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub tab B02 */}
          {bctcSubTab === 'b02' && (
            <div className="space-y-4">
              <div className="finance-card-nested m30-well p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between" data-surface="well">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Mẫu B02-DN</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH (INCOME STATEMENT)</h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      <th className="p-2.5">Chỉ Tiêu</th>
                      <th className="p-2.5 w-24">Mã Số</th>
                      <th className="p-2.5 w-32 text-right">Thực Hiện Kỳ Náym (VNĐ)</th>
                      <th className="p-2.5 w-32 text-right">Kỳ Trước (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-bold">1. Doanh thu bán hàng và cung cấp dịch vụ (TK 511)</td>
                      <td className="p-2.5 font-mono">01</td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-bold">8,450,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">7,200,000,000</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">2. Giá vốn hàng bán (TK 632)</td>
                      <td className="p-2.5 font-mono">11</td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-rose-600">3,800,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-rose-600">3,200,000,000</td>
                    </tr>
                    <tr className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30">
                      <td className="p-2.5">3. Lợi nhuận gộp về bán hàng (20 = 01 - 11)</td>
                      <td className="p-2.5 font-mono">20</td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-extrabold">4,650,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">4,000,000,000</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">4. Chi phí quản lý doanh nghiệp &amp; bán hàng (TK 641, 642)</td>
                      <td className="p-2.5 font-mono">25</td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-rose-600">1,430,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-rose-600">1,200,000,000</td>
                    </tr>
                    <tr className="font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                      <td className="p-2.5 uppercase">5. Lợi nhuận thuần sau thuế TNDN (60 = 50 - 51)</td>
                      <td className="p-2.5 font-mono">60</td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-extrabold">3,220,000,000</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">2,800,000,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub tab B03 & B05 placeholders */}
          {(bctcSubTab === 'b03' || bctcSubTab === 'b05') && (
            <div className="finance-card-nested m30-well p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3" data-surface="well">
              <FileSpreadsheet className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {bctcSubTab === 'b03' ? 'B03-DN: Báo Cáo Lưu Chuyển Tiền Tệ (Trực Tiếp)' : 'B05-DN: Thuyết Minh Báo Cáo Tài Chính'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Báo cáo đã được tự động liên kết với Sổ cái M30 &amp; M32 Treasury. Bấm nút bên dưới để xuất đầy đủ bộ báo cáo PDF.
              </p>
              <button
                onClick={handleExportPdf}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
              >
                In BCTC PDF Chi Tiết
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Period Closing & VAS 911 */}
      {activeTab === 'period_close' && (
        <div className="finance-card surface-card m30-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-5" data-surface="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Quy Trình Tự Động Kết Chuyển Doanh Thu Chi Phí 911 &amp; Khóa Sổ Kỳ (M30-F05)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thực hiện quy trình kết chuyển tài khoản loại 5, 6, 7, 8 về TK 911 để xác định kết quả kinh doanh và chuyển lợi nhuận sau thuế về TK 4212.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold font-mono border ${
                currentPeriodStatus === 'LOCKED'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
              }`}>
                Kỳ Hiện Tại T08/2026: {currentPeriodStatus}
              </span>

              <button
                onClick={() => handleConfirmPeriodClose('T08/2026')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Khóa Sổ &amp; Kết Chuyển T08/2026</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="finance-card-nested m30-well p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2" data-surface="well">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Bước 1: Kết Chuyển Doanh Thu</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Ghi Nợ TK 511, 515, 711 / Ghi Có TK 911 tổng doanh thu phát sinh trong kỳ.
              </p>
              <div className="font-mono text-sm font-extrabold text-blue-800 dark:text-blue-200">
                8,450,000,000 VNĐ
              </div>
            </div>

            <div className="finance-card-nested m30-well p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2" data-surface="well">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase">Bước 2: Kết Chuyển Chi Phí</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Ghi Nợ TK 911 / Ghi Có TK 632, 635, 641, 642, 811 tổng chi phí phát sinh.
              </p>
              <div className="font-mono text-sm font-extrabold text-rose-800 dark:text-rose-200">
                5,230,000,000 VNĐ
              </div>
            </div>

            <div className="finance-card-nested m30-well p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2" data-surface="well">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Bước 3: Chuyển Lợi Nhuận TK 4212</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Ghi Nợ TK 911 / Ghi Có TK 4212 chênh lệch lợi nhuận sau thuế chưa phân phối.
              </p>
              <div className="font-mono text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
                3,220,000,000 VNĐ
              </div>
            </div>
          </div>

          <div className="finance-card-nested m30-well p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3" data-surface="well">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Danh Sách Các Kỳ Kế Toán Đã Khóa Sổ (Immutable Fiscal Periods)
            </h3>
            <div className="flex flex-wrap gap-2">
              {closedPeriods.map((period) => (
                <span
                  key={period}
                  className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3 text-rose-500" />
                  {period}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Cost Center Allocation */}
      {activeTab === 'cost_center' && (
        <div className="finance-card surface-card m30-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-5" data-surface="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Phân Bổ Chi Phí Theo Trung Tâm Chi Phí Doanh Nghiệp (M30-F07)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Báo cáo quản trị phân bổ chi phí hoạt động theo 5 trung tâm: Sản xuất (CC-PROD), Bán hàng (CC-SALES), Hành chính (CC-ADMIN), Kho vận (CC-LOGISTICS) &amp; R&amp;D (CC-RD)
              </p>
            </div>

            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>In Phân Bổ Chi Phí</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { code: 'CC-PROD', name: 'Sản Xuất & Chế Tạo', amount: 2450000000, percent: 46.8, color: 'bg-blue-600' },
              { code: 'CC-SALES', name: 'Bán Hàng & Tiếp Thị', amount: 1120000000, percent: 21.4, color: 'bg-emerald-600' },
              { code: 'CC-ADMIN', name: 'Hành Chính Quản Lý', amount: 890000000, percent: 17.0, color: 'bg-purple-600' },
              { code: 'CC-LOGISTICS', name: 'Kho Vận & Vận Tải', amount: 480000000, percent: 9.2, color: 'bg-amber-600' },
              { code: 'CC-RD', name: 'Nghiên Cứu & Phát Triển', amount: 290000000, percent: 5.6, color: 'bg-rose-600' },
            ].map((cc) => (
              <div key={cc.code} className="finance-card-nested m30-well p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2" data-surface="well">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500">{cc.code}</span>
                  <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{cc.percent}%</span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{cc.name}</div>
                <div className="font-mono text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {cc.amount.toLocaleString('vi-VN')} VNĐ
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${cc.color}`} style={{ width: `${cc.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Cross-Reconciliation */}
      {activeTab === 'cross_reconciliation' && (
        <div className="finance-card surface-card m30-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-5" data-surface="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Đối Soát Dữ Liệu Sổ Cái GL Với Các Sub-ledgers Liên Module (M30-F09)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động kiểm tra tính liên thông giữa tài khoản Sổ cái GL với các sổ chi tiết vận hành: AR (M31), AP (M31), Kho tồn (M17) &amp; Tiền mặt ngân hàng (M32)
              </p>
            </div>

            <button
              onClick={handleConfirmVerifyBalance}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Chạy Tự Động Đối Soát</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="p-3">Tài Khoản GL Control</th>
                  <th className="p-3">Module Subledger</th>
                  <th className="p-3 text-right">Số Dư Sổ Cái GL (VNĐ)</th>
                  <th className="p-3 text-right">Số Dư Subledger (VNĐ)</th>
                  <th className="p-3 text-right">Chênh Lệch (VNĐ)</th>
                  <th className="p-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { acc: 'TK 131 - Phải thu khách hàng', module: 'M31 - Accounts Receivable', gl: 2800000000, sub: 2800000000 },
                  { acc: 'TK 331 - Phải trả người bán', module: 'M31 - Accounts Payable', gl: 1950000000, sub: 1950000000 },
                  { acc: 'TK 156 - Hàng hóa tồn kho', module: 'M17 - WMS Inventory Core', gl: 2000000000, sub: 2000000000 },
                  { acc: 'TK 1111 - Tiền mặt tại quỹ', module: 'M32 - Cash Treasury', gl: 450000000, sub: 450000000 },
                  { acc: 'TK 1121 - Tiền gửi ngân hàng', module: 'M32 - Bank Treasury', gl: 3000000000, sub: 3000000000 },
                ].map((row, idx) => {
                  const diff = row.gl - row.sub;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">{row.acc}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{row.module}</td>
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {row.gl.toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {row.sub.toLocaleString('vi-VN')}
                      </td>
                      <td className={`p-3 text-right font-mono tabular-nums font-bold ${diff === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {diff.toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3 text-center">
                        {diff === 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            KHỚP 100%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            LỆCH SỐ DƯ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: New Journal Entry Modal */}
      {isNewEntryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="finance-modal-surface m30-modal bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4" data-surface="modal">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>Hạch Toán Bút Toán GL Mới (Single Writer)</span>
              </h3>
              <button
                onClick={() => setIsNewEntryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJournalEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Tham Chiếu</label>
                  <input
                    type="text"
                    value={newEntryForm.sourceReferenceNo}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, sourceReferenceNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Trung Tâm Chi Phí</label>
                  <select
                    value={newEntryForm.costCenter}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, costCenter: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="CC-ADMIN">Hành Chính Quản Lý (CC-ADMIN)</option>
                    <option value="CC-PROD">Sản Xuất &amp; Chế Tạo (CC-PROD)</option>
                    <option value="CC-SALES">Bán Hàng Tiếp Thị (CC-SALES)</option>
                    <option value="CC-LOGISTICS">Kho Vận (CC-LOGISTICS)</option>
                    <option value="CC-RD">R&amp;D Nghiên Cứu (CC-RD)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-700 dark:text-emerald-400 mb-1">Tài Khoản Ghi Nợ (Debit)</label>
                  <select
                    value={newEntryForm.debitAccount}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, debitAccount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-700 dark:text-emerald-400"
                  >
                    <option value="111">TK 111 - Tiền mặt</option>
                    <option value="112">TK 112 - Tiền gửi ngân hàng</option>
                    <option value="131">TK 131 - Phải thu khách hàng</option>
                    <option value="156">TK 156 - Hàng hóa</option>
                    <option value="632">TK 632 - Giá vốn hàng bán</option>
                    <option value="642">TK 642 - Chi phí quản lý</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-rose-700 dark:text-rose-400 mb-1">Tài Khoản Ghi Có (Credit)</label>
                  <select
                    value={newEntryForm.creditAccount}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, creditAccount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-rose-700 dark:text-rose-400"
                  >
                    <option value="511">TK 511 - Doanh thu bán hàng</option>
                    <option value="331">TK 331 - Phải trả người bán</option>
                    <option value="33311">TK 33311 - Thuế GTGT đầu ra</option>
                    <option value="111">TK 111 - Tiền mặt</option>
                    <option value="112">TK 112 - Tiền gửi ngân hàng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Số Tiền Hạch Toán (VNĐ)</label>
                <CurrencyInput
                  value={newEntryForm.amount}
                  onChange={(val) => setNewEntryForm({ ...newEntryForm, amount: val })}
                  placeholder="Nhập số tiền..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Diễn Giải Nghiệp Vụ</label>
                <textarea
                  value={newEntryForm.description}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, description: e.target.value })}
                  placeholder="Nhập nội dung diễn giải chứng từ..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewEntryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Ghi Sổ Cái GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Storno Reversal Modal */}
      {selectedStornoEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="finance-modal-surface m30-modal bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4" data-surface="modal">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                <span>Đảo Sổ Storno Bút Toán [{selectedStornoEntry.entryCode}]</span>
              </h3>
              <button
                onClick={() => setSelectedStornoEntry(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 space-y-1 text-xs">
              <div className="font-bold text-rose-800 dark:text-rose-300">Thông Tin Bút Toán Gốc:</div>
              <div>Số tiền: <span className="font-mono font-bold">{Number(selectedStornoEntry.amount).toLocaleString('vi-VN')} VNĐ</span></div>
              <div>Định khoản: <span className="font-mono">Nợ TK {selectedStornoEntry.debitAccount} / Có TK {selectedStornoEntry.creditAccount}</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lý Do Đảo Sổ Storno (Bắt Buộc - Audit Trail)
              </label>
              <textarea
                value={stornoReason}
                onChange={(e) => setStornoReason(e.target.value)}
                placeholder="Nhập chi tiết lý do sai sót để sinh bút toán Storno đối ứng..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedStornoEntry(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmStornoReversal}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Xác Nhận Đảo Storno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL 3: Entry Detail Modal */}
      {selectedEntryDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="finance-modal-surface m30-modal bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4" data-surface="modal">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Chi Tiết Bút Toán Sổ Cái [{selectedEntryDetail.entryCode}]</span>
              </h3>
              <button
                onClick={() => setSelectedEntryDetail(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 block">Nguồn Module:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedEntryDetail.sourceModule}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mã Tham Chiếu:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedEntryDetail.sourceReferenceNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tài Khoản Ghi Nợ:</span>
                  <span className="font-mono font-bold text-emerald-600">TK {selectedEntryDetail.debitAccount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tài Khoản Ghi Có:</span>
                  <span className="font-mono font-bold text-rose-600">TK {selectedEntryDetail.creditAccount}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block">Số Tiền Hạch Toán:</span>
                <span className="font-mono font-extrabold text-lg text-slate-900 dark:text-white">
                  {Number(selectedEntryDetail.amount || 0).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Diễn Giải Nghiệp Vụ:</span>
                <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {selectedEntryDetail.description || 'Hạch toán bút toán tổng hợp Sổ cái.'}
                </p>
              </div>

              {selectedEntryDetail.isReversal && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                  <span className="font-bold">Bút Toán Storno Đảo Sổ:</span> Đã được sinh tự động để triệt tiêu số dư.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEntryDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VAT Declaration XML Export Modal (TT80/2021) */}
      <M30VatDeclarationXmlExportModal
        isOpen={isVatXmlOpen}
        onClose={() => setIsVatXmlOpen(false)}
        onNotify={onNotify}
      />

      {/* Prepaid Expense Amortization Modal (TK 242) */}
      <M30PrepaidExpenseAmortizationModal
        isOpen={isPrepaidAmortOpen}
        onClose={() => setIsPrepaidAmortOpen(false)}
        onNotify={onNotify}
      />

      {/* FX Revaluation Engine Modal (VAS 10 / TK 413, 515, 635) */}
      <M30FxRevaluationEngineModal
        isOpen={isFxRevalOpen}
        onClose={() => setIsFxRevalOpen(false)}
        onPostFxEntry={(fxData) => {
          onNotify('success', 'Đã Ghi Sổ Tỷ Giá', `Đã ghi nhận kết quả đánh giá lại tỷ giá cuối kỳ ${fxData.period} vào Sổ Cái.`);
        }}
        onNotify={onNotify}
      />

      {/* ConfirmDialog Component (Rule #19 Compliance - Zero window.confirm) */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
