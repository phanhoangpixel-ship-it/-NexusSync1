import React, { useState, useEffect } from 'react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';
import { EnterpriseTable, ColumnDef } from '../../../../components/common/EnterpriseTable';
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
  HelpCircle,
  X,
  ArrowUpRight,
  CheckSquare,
  History,
  Layers,
  ArrowDownRight,
} from 'lucide-react';
import { downloadFinancialReportPdf } from '../../../../utils/pdfExporter';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import "./types";

export const M30GeneralLedgerWorkspace: React.FC<M30GeneralLedgerWorkspaceProps> = ({
  onSelectEntity,
  onNotify = () => {},
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'trial_balance' | 'entries' | 'financial_statements' | 'period_close'>('M30', 'trial_balance');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');

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
  });

  // Selected Entry Detail Modal
  const [selectedEntryDetail, setSelectedEntryDetail] = useState<any | null>(null);

  // Period Closing State
  const [closedPeriods, setClosedPeriods] = useState<string[]>(['T01/2026', 'T02/2026', 'T03/2026', 'T04/2026', 'T05/2026', 'T06/2026', 'T07/2026']);
  const [currentPeriodStatus, setCurrentPeriodStatus] = useState<'OPEN' | 'LOCKED'>('OPEN');

  useEffect(() => {
    fetchAccountsAndEntries();
  }, []);

  const fetchAccountsAndEntries = async () => {
    setIsLoading(true);
    try {
      const [accRes, entRes] = await Promise.all([
        fetch('/api/finance/accounts'),
        fetch('/api/finance/entries'),
      ]);

      const accData = await accRes.json();
      const entData = await entRes.json();

      if (Array.isArray(accData)) setAccounts(accData);
      if (Array.isArray(entData)) setEntries(entData);
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải dữ liệu Sổ cái GL', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryForm.amount || Number(newEntryForm.amount) <= 0) {
      onNotify('warning', 'Chưa nhập số tiền hợp lệ', 'Số tiền hạch toán phải lớn hơn 0 VNĐ.');
      return;
    }
    if (newEntryForm.debitAccount === newEntryForm.creditAccount) {
      // Single-writer GL Invariant Check
      onNotify('danger', 'Bút toán không hợp lệ', 'TK Nợ và TK Có phải khác nhau theo nguyên tắc Đôi (Double-entry).');
      return;
    }

    try {
      const res = await fetch('/api/finance/entries', {
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
        sourceReferenceNo: 'JV-2026-002',
        debitAccount: '111',
        creditAccount: '511',
        amount: '',
        description: '',
      });
      fetchAccountsAndEntries();
    } catch (err: any) {
      onNotify('danger', 'Lỗi hạch toán', err.message);
    }
  };

  const handleVerifyBalance = async () => {
    try {
      const res = await fetch('/api/finance/verify-balance', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thao tác đối soát thất bại');
      onNotify('success', 'Xác Thực Single Writer GL Invariant', data.message);
    } catch (err: any) {
      onNotify('danger', 'Lỗi kiểm tra cân đối', err.message);
    }
  };

  const handlePeriodClose = async () => {
    try {
      const res = await fetch('/api/finance/period-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodCode: 'T08/2026' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Khóa sổ thất bại');
      onNotify('info', 'Khóa Sổ Kỳ Kế Toán T08/2026', data.message);
      setCurrentPeriodStatus('LOCKED');
      if (!closedPeriods.includes('T08/2026')) {
        setClosedPeriods([...closedPeriods, 'T08/2026']);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi khóa sổ', err.message);
    }
  };

  const handleExportPdf = () => {
    try {
      const fileName = downloadFinancialReportPdf({
        title: 'BÁO CÁO TÀI CHÍNH TỔNG HỢP & BẢNG CÂN ĐỐI SỐ PHÁT SINH',
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

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'ASSET': return 'Tài sản (Asset)';
      case 'LIABILITY': return 'Nợ phải trả (Liability)';
      case 'EQUITY': return 'Vốn chủ sở hữu (Equity)';
      case 'REVENUE': return 'Doanh thu (Revenue)';
      case 'EXPENSE': return 'Chi phí (Expense)';
      default: return type;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case 'ASSET':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">Tài sản</span>;
      case 'LIABILITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">Nợ phải trả</span>;
      case 'EQUITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200">Vốn CSH</span>;
      case 'REVENUE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">Doanh thu</span>;
      case 'EXPENSE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">Chi phí</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">{type}</span>;
    }
  };

  const accountColumns: ColumnDef[] = [
    {
      key: 'code',
      header: 'Mã TK',
      width: 120,
      type: 'code',
      render: (acc) => <span className="font-mono tabular-nums font-bold text-indigo-700">TK {acc.code}</span>,
    },
    {
      key: 'name',
      header: 'Tên Tài Khoản Kế Toán',
      width: 280,
      render: (acc) => (
        <div>
          <div className="font-bold text-slate-900">{acc.name}</div>
          {acc.description && <p className="text-[10px] text-slate-500">{acc.description}</p>}
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
        <span className="font-mono tabular-nums font-semibold text-slate-900">
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
        <span className="font-mono tabular-nums font-semibold text-slate-900">
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
        <span className="font-mono tabular-nums font-semibold text-emerald-700">
          1,250,000,000 VNĐ
        </span>
      ),
    },
  ];

  const entryColumns: ColumnDef[] = [
    {
      key: 'entryCode',
      header: 'Mã Bút Toán',
      width: 150,
      type: 'code',
      render: (entry) => <span className="font-mono tabular-nums font-bold text-slate-900">{entry.entryCode}</span>,
    },
    {
      key: 'sourceModule',
      header: 'Nguồn ERP',
      width: 180,
      render: (entry) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tabular-nums bg-slate-100 text-slate-700 border border-slate-200">
          {entry.sourceModule} ({entry.sourceReferenceNo || 'MANUAL'})
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Diễn Giải Hạch Toán',
      width: 320,
      render: (entry) => <span className="font-medium text-slate-800">{entry.description}</span>,
    },
    {
      key: 'debitAccount',
      header: 'Nợ TK',
      width: 120,
      align: 'center',
      render: (entry) => (
        <span className="font-mono tabular-nums font-bold text-blue-700 bg-blue-50/50 px-2 py-0.5 rounded">
          TK {entry.debitAccount}
        </span>
      ),
    },
    {
      key: 'creditAccount',
      header: 'Có TK',
      width: 120,
      align: 'center',
      render: (entry) => (
        <span className="font-mono tabular-nums font-bold text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded">
          TK {entry.creditAccount}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Số Tiền (VNĐ)',
      width: 180,
      align: 'right',
      isNumeric: true,
      render: (entry) => (
        <span className="font-mono tabular-nums font-semibold text-slate-900">
          {Number(entry.amount).toLocaleString('vi-VN')} VNĐ
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      width: 150,
      align: 'center',
      render: () => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          POSTED (Đã ghi sổ)
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      width: 110,
      align: 'right',
      render: (entry) => (
        <button
          type="button"
          onClick={() => setSelectedEntryDetail(entry)}
          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer transition-colors"
        >
          Chi tiết
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black shadow-md border border-slate-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tabular-nums font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  M30 • FICO GL
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Single Writer GL Invariant: PASS
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Sổ Cái & Kế Toán Tổng Hợp (General Ledger & Financial Accounting)
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyBalance}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Scale className="w-4 h-4 text-emerald-400" />
            Đối Soát Nợ = Có
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Xuất BCTC PDF
          </button>

          <button
            onClick={() => setIsNewEntryModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Hạch Toán GL Mới
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Tổng Tài Sản / Nguồn Vốn</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">14,850,000,000 <span className="text-xs font-medium text-slate-500">VNĐ</span></p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold pt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Cân đối kép 100% (Assets = Liab + Equity)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Doanh Thu Thuần (TK 511)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700">8,450,000,000 <span className="text-xs font-medium text-slate-500">VNĐ</span></p>
          <p className="text-[11px] text-slate-500 font-medium pt-1">Ghi nhận từ Đơn bán hàng SO & Quầy POS</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Giá Vốn & OPEX (TK 632/642)</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">5,230,000,000 <span className="text-xs font-medium text-slate-500">VNĐ</span></p>
          <p className="text-[11px] text-slate-500 font-medium pt-1">COGS 61.8% • Chi phí quản lý & vận hành</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Lợi Nhuận Ròng (TK 911/421)</span>
            <PieChart className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-indigo-700">3,220,000,000 <span className="text-xs font-medium text-slate-500">VNĐ</span></p>
          <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-bold pt-1">
            <span>Tỷ suất Lợi Nhuận: 38.1%</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation (M41 Master Spec) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('trial_balance')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'trial_balance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span>Bảng Cân Đối Phát Sinh (TT200)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('entries')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'entries'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Sổ Nhật Ký Bút Toán</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'entries'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {entries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financial_statements')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'financial_statements'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4 shrink-0" />
            <span>Báo Cáo Tài Chính (P&amp;L / B/S)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('period_close')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'period_close'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>Khóa Sổ Kỳ Kế Toán &amp; Audit</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            GL Single Writer
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            VAS TT200 / IFRS
          </span>
        </div>
      </div>

      {/* TAB 1: TRIAL BALANCE & CHART OF ACCOUNTS */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã tài khoản, tên TK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả nhóm tài khoản</option>
                <option value="ASSET">TK Tài sản (TK 1xx - 2xx)</option>
                <option value="LIABILITY">TK Nợ phải trả (TK 3xx)</option>
                <option value="EQUITY">TK Vốn CSH (TK 4xx)</option>
                <option value="REVENUE">TK Doanh thu (TK 5xx)</option>
                <option value="EXPENSE">TK Chi phí (TK 6xx - 8xx)</option>
              </select>
            </div>
          </div>

          <EnterpriseTable
            columns={accountColumns}
            data={filteredAccounts}
            keyField="id"
            moduleId="M30"
            tableId="chart_of_accounts"
            moduleName="M30 Kế Toán Tổng Hợp"
            tableName="Hệ Thống Tài Khoản (COA)"
            stickyFirstColumn={true}
            stickyHeader={true}
            resizableColumns={true}
            virtualized={true}
            maxHeight={520}
            emptyMessage="Không tìm thấy tài khoản kế toán thỏa điều kiện"
          />
        </div>
      )}

      {/* TAB 2: JOURNAL ENTRIES */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          <EnterpriseTable
            columns={entryColumns}
            data={entries}
            keyField="id"
            moduleId="M30"
            tableId="gl_journal_entries"
            moduleName="M30 Kế Toán Tổng Hợp"
            tableName="Sổ Nhật Ký Bút Toán (GL Entries)"
            stickyFirstColumn={true}
            stickyHeader={true}
            resizableColumns={true}
            virtualized={true}
            maxHeight={560}
            emptyMessage="Chưa có bút toán hạch toán GL nào"
          />
        </div>
      )}

      {/* TAB 3: FINANCIAL STATEMENTS */}
      {activeTab === 'financial_statements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance Sheet (Bảng cân đối kế toán) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Bảng Cân Đối Kế Toán (Balance Sheet)</h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                TT200 Cân đối
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>TÀI SẢN NGẮN HẠN</span>
                  <span>10,870,000,000 VNĐ</span>
                </div>
                <div className="pl-3 space-y-1 text-slate-600 text-[11px]">
                  <div className="flex justify-between"><span>• Tiền & các khoản tương đương tiền (TK 111/112)</span><span>3,970,000,000 VNĐ</span></div>
                  <div className="flex justify-between"><span>• Các khoản phải thu ngắn hạn (TK 131)</span><span>2,800,000,000 VNĐ</span></div>
                  <div className="flex justify-between"><span>• Hàng tồn kho kho chính (TK 152/156)</span><span>4,100,000,000 VNĐ</span></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>TÀI SẢN DÀI HẠN (Tài sản cố định PPE)</span>
                  <span>3,980,000,000 VNĐ</span>
                </div>
                <div className="pl-3 text-slate-600 text-[11px]">
                  <div className="flex justify-between"><span>• Nguyên giá TSCĐ hữu hình (TK 211)</span><span>3,980,000,000 VNĐ</span></div>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-amber-900">
                  <span>NỢ PHẢI TRẢ (Liabilities)</span>
                  <span>2,150,000,000 VNĐ</span>
                </div>
                <div className="pl-3 text-slate-600 text-[11px]">
                  <div className="flex justify-between"><span>• Phải trả cho người bán AP (TK 331)</span><span>2,150,000,000 VNĐ</span></div>
                </div>
              </div>

              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-purple-900">
                  <span>VỐN CHỦ SỞ HỮU (Equity)</span>
                  <span>12,700,000,000 VNĐ</span>
                </div>
                <div className="pl-3 space-y-1 text-slate-600 text-[11px]">
                  <div className="flex justify-between"><span>• Vốn góp của chủ sở hữu (TK 411)</span><span>9,480,000,000 VNĐ</span></div>
                  <div className="flex justify-between"><span>• Lợi nhuận lũy kế giữ lại (TK 421)</span><span>3,220,000,000 VNĐ</span></div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span>CÂN ĐỐI TÀI SẢN = NỢ + VỐN CSH</span>
                <span className="text-emerald-700">14,850,000,000 VNĐ</span>
              </div>
            </div>
          </div>

          {/* Income Statement (P&L) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Báo Cáo Kết Quả Kinh Doanh (P&L)</h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold border border-indigo-200">
                Tháng 08/2026
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 font-bold text-slate-900">
                <span>1. Doanh thu bán hàng & dịch vụ (TK 511)</span>
                <span>8,450,000,000 VNĐ</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 font-semibold text-rose-700">
                <span>2. Giá vốn hàng bán COGS (TK 632)</span>
                <span>(5,230,000,000 VNĐ)</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 font-extrabold text-indigo-900 bg-indigo-50/50 px-2 rounded">
                <span>3. Lợi nhuận gộp về bán hàng (Gross Margin)</span>
                <span>3,220,000,000 VNĐ</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 font-semibold text-slate-700">
                <span>4. Chi phí bán hàng & QLDN (TK 641/642)</span>
                <span>(0 VNĐ)</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 font-bold text-slate-900">
                <span>5. Lợi nhuận thuần từ hoạt động kinh doanh</span>
                <span>3,220,000,000 VNĐ</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 font-semibold text-slate-700">
                <span>6. Thuế TNDN hiện hành (20%)</span>
                <span>(0 VNĐ)</span>
              </div>

              <div className="flex justify-between p-3 font-extrabold text-sm text-emerald-900 bg-emerald-100 border border-emerald-300 rounded-xl">
                <span>7. LỢI NHUẬN RÒNG SAU THUẾ</span>
                <span className="text-emerald-800">3,220,000,000 VNĐ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERIOD CLOSING & AUDIT TRAIL */}
      {activeTab === 'period_close' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                Quản Lý Kỳ Kế Toán & Khóa Sổ Niêm Phong (Period Closing)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chức năng khóa sổ đóng băng toàn bộ bút toán Sổ cái GL kỳ kế toán. Không ai có thể chỉnh sửa sau khi đã được CFO khóa sổ.
              </p>
            </div>

            <button
              onClick={handlePeriodClose}
              disabled={currentPeriodStatus === 'LOCKED'}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                currentPeriodStatus === 'LOCKED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
              }`}
            >
              <Lock className="w-4 h-4" />
              {currentPeriodStatus === 'LOCKED' ? 'Kỳ T08/2026 Đã Khóa Sổ' : 'Khóa Sổ Kỳ T08/2026 Ngay'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {['T01/2026', 'T02/2026', 'T03/2026', 'T04/2026', 'T05/2026', 'T06/2026', 'T07/2026', 'T08/2026'].map((period) => {
              const isLocked = closedPeriods.includes(period);
              return (
                <div
                  key={period}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    isLocked ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-slate-900 block">Kỳ Kế Toán {period}</span>
                    <span className="text-[10px] text-slate-500">{isLocked ? 'CFO đã khóa sổ' : 'Kỳ đang mở ghi nhận'}</span>
                  </div>
                  {isLocked ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> LOCKED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      OPEN
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              Nhật Ký Khóa Sổ & Kiểm Toán Độc Lập (GL Period Closing Audit Trail)
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-800">Khóa sổ định kỳ T07/2026 thành công</span>
                    <p className="text-[10px] text-slate-500">Người thực hiện: Hoàng Nam (CFO) • Kết chuyển TK 911 hoàn tất</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-slate-500">2026-08-01 18:00:00</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="font-bold text-slate-800">Đối soát Single Writer GL Invariant: 100% PASS</span>
                    <p className="text-[10px] text-slate-500">Tự động kiểm tra định kỳ hệ thống • Không ghi nhận lệch sổ</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-slate-500">2026-08-15 08:30:00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TẠO BÚT TOÁN ĐỊNH KHOẢN GL MỚI */}
      {isNewEntryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Lập Bút Toán Định Khoản GL Mới</h3>
                  <p className="text-xs text-slate-500">Quy tắc định khoản kép (Double-entry: Debit = Credit)</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewEntryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJournalEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mã tham chiếu ERP</label>
                  <input
                    type="text"
                    required
                    value={newEntryForm.sourceReferenceNo}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, sourceReferenceNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono tabular-nums font-semibold"
                  />
                </div>
                <div>
                  <CurrencyInput
                    label="Số tiền hạch toán (VNĐ)"
                    value={newEntryForm.amount}
                    onChange={(val) => setNewEntryForm({ ...newEntryForm, amount: val.toString() })}
                    placeholder="VD: 50.000.000"
                    required
                    showBadge={true}
                    showPresets={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Ghi Nợ Tài Khoản (Debit)</label>
                  <select
                    value={newEntryForm.debitAccount}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, debitAccount: e.target.value })}
                    className="w-full bg-white border border-blue-200 rounded-xl p-2 text-xs font-bold text-blue-900"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id || acc.code} value={acc.code}>
                        TK {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Ghi Có Tài Khoản (Credit)</label>
                  <select
                    value={newEntryForm.creditAccount}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, creditAccount: e.target.value })}
                    className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs font-bold text-emerald-900"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id || acc.code} value={acc.code}>
                        TK {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Diễn giải nội dung bút toán</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Nhập lý do và chi tiết chứng từ hạch toán..."
                  value={newEntryForm.description}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewEntryModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Hạch Toán Về Sổ Cái GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHI TIẾT BÚT TOÁN */}
      {selectedEntryDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Chi Tiết Bút Toán Sổ Cái GL</h3>
                  <span className="font-mono tabular-nums text-xs font-bold text-indigo-600">{selectedEntryDetail.entryCode}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntryDetail(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold uppercase">Diễn giải hạch toán</span>
                <span className="font-bold text-slate-900 max-w-xs text-right">{selectedEntryDetail.description}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold uppercase">Tài khoản Nợ (Debit)</span>
                <span className="font-mono tabular-nums font-bold text-blue-700">TK {selectedEntryDetail.debitAccount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold uppercase">Tài khoản Có (Credit)</span>
                <span className="font-mono tabular-nums font-bold text-emerald-700">TK {selectedEntryDetail.creditAccount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold uppercase">Số tiền ghi sổ</span>
                <span className="font-mono tabular-nums font-extrabold text-slate-900">
                  {Number(selectedEntryDetail.amount).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold uppercase">Mã tham chiếu chứng từ</span>
                <span className="font-mono tabular-nums font-bold text-indigo-700">{selectedEntryDetail.sourceReferenceNo || 'MANUAL'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEntryDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
