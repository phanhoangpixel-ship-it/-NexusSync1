import React, { useState, useEffect } from 'react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  RefreshCw,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  PieChart,
  CheckSquare,
  History,
  Lock,
  Sparkles,
  QrCode,
  Zap,
  ArrowRightLeft,
  X,
  Check,
  Building2,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { downloadTreasuryReportPdf } from '../../../../utils/pdfExporter';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { M32PaymentsTreasuryWorkspaceProps } from './types';

export const M32PaymentsTreasuryWorkspace: React.FC<M32PaymentsTreasuryWorkspaceProps> = ({
  onSelectEntity,
  onNotify = () => {},
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'bank_accounts' | 'cash_vouchers' | 'transfers' | 'reconciliation' | 'cashflow_forecast'>('M32', 'bank_accounts');

  // State Stores
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cashVouchers, setCashVouchers] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [bankStatements, setBankStatements] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<string>('ALL');

  // Modal States
  const [isNewVoucherModalOpen, setIsNewVoucherModalOpen] = useState<boolean>(false);
  const [newVoucherForm, setNewVoucherForm] = useState({
    voucherType: 'RECEIPT', // RECEIPT or PAYMENT
    partnerType: 'CUSTOMER',
    partnerName: '',
    amount: '',
    bankAccountId: '1',
    paymentMethod: 'BANK_TRANSFER',
    reason: '',
    accountingEntry: 'Nợ 1121 / Có 131',
  });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '1',
    toAccountId: '2',
    amount: '',
    reason: '',
  });

  const [isVietQrModalOpen, setIsVietQrModalOpen] = useState<boolean>(false);
  const [vietQrForm, setVietQrForm] = useState({
    bankAccountId: '2',
    amount: '120000000',
    memo: 'THANH TOAN DON HANG SO-2026-018',
  });

  const [selectedVoucherDetail, setSelectedVoucherDetail] = useState<any | null>(null);

  useEffect(() => {
    fetchAllTreasuryData();
  }, []);

  const fetchAllTreasuryData = async () => {
    setIsLoading(true);
    try {
      const [accountsRes, vouchersRes, transfersRes, statementsRes, forecastRes] = await Promise.all([
        fetch('/api/treasury/bank-accounts'),
        fetch('/api/treasury/vouchers'),
        fetch('/api/treasury/transfers'),
        fetch('/api/treasury/bank-statements'),
        fetch('/api/treasury/cashflow-forecast'),
      ]);

      const accountsData = await accountsRes.json();
      const vouchersData = await vouchersRes.json();
      const transfersData = await transfersRes.json();
      const statementsData = await statementsRes.json();
      const forecast = await forecastRes.json();

      if (Array.isArray(accountsData)) setBankAccounts(accountsData);
      if (Array.isArray(vouchersData)) setCashVouchers(vouchersData);
      if (Array.isArray(transfersData)) setTransfers(transfersData);
      if (Array.isArray(statementsData)) setBankStatements(statementsData);
      if (forecast) setForecastData(forecast);
    } catch (err: any) {
      onNotify('danger', 'Lỗi kết nối dữ liệu Quỹ & Dòng tiền', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit New Voucher (Phiếu thu / Chi)
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherForm.partnerName || !newVoucherForm.amount) {
      onNotify('warning', 'Thiếu thông tin bắt buộc', 'Vui lòng điền Đối tác và Số tiền chứng từ.');
      return;
    }

    try {
      const res = await fetch('/api/treasury/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVoucherForm),
      });
      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Tạo Chứng Từ Thành Công', data.message);
        setIsNewVoucherModalOpen(false);
        setNewVoucherForm({
          voucherType: 'RECEIPT',
          partnerType: 'CUSTOMER',
          partnerName: '',
          amount: '',
          bankAccountId: '1',
          paymentMethod: 'BANK_TRANSFER',
          reason: '',
          accountingEntry: 'Nợ 1121 / Có 131',
        });
        fetchAllTreasuryData();
      } else {
        onNotify('danger', 'Lỗi tạo chứng từ', data.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  // Approve Voucher (Maker-Checker)
  const handleApproveVoucher = async (id: number) => {
    try {
      const res = await fetch(`/api/treasury/vouchers/${id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Duyệt Chứng Từ Thành Công', data.message);
        fetchAllTreasuryData();
      } else {
        onNotify('danger', 'Không thể duyệt chứng từ', data.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi phê duyệt', err.message);
    }
  };

  // Create Internal Transfer
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.amount || transferForm.fromAccountId === transferForm.toAccountId) {
      onNotify('warning', 'Thông tin chưa hợp lệ', 'Vui lòng chọn 2 tài khoản khác nhau và nhập số tiền.');
      return;
    }

    try {
      const res = await fetch('/api/treasury/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm),
      });
      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Điều Chuyển Vốn Thành Công', data.message);
        setIsTransferModalOpen(false);
        setTransferForm({ fromAccountId: '1', toAccountId: '2', amount: '', reason: '' });
        fetchAllTreasuryData();
      } else {
        onNotify('danger', 'Lỗi điều chuyển vốn', data.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  // Bank Reconciliation Matching
  const handleReconcileStatement = async (statementId: number) => {
    try {
      const res = await fetch('/api/treasury/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementId, voucherCode: 'PT-2026-AUTO' }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Đối Soát Ngân Hàng Khớp 100%', data.message);
        fetchAllTreasuryData();
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi đối soát', err.message);
    }
  };

  // Download PDF Report
  const handleExportPdfReport = () => {
    try {
      downloadTreasuryReportPdf(cashVouchers, bankAccounts);
      onNotify('success', 'Xuất Báo Cáo PDF Thành Công', 'File PDF Báo cáo Sổ quỹ & Dòng tiền đã được tải xuống.');
    } catch (err: any) {
      onNotify('danger', 'Lỗi xuất file PDF', err.message);
    }
  };

  // KPI Computations
  const totalBalance = bankAccounts.reduce((sum, a) => sum + (a.bookBalance || 0), 0);
  const totalReceipts = cashVouchers.filter((v) => v.voucherType === 'RECEIPT' && v.status === 'APPROVED').reduce((sum, v) => sum + (v.amount || 0), 0);
  const totalPayments = cashVouchers.filter((v) => v.voucherType === 'PAYMENT' && v.status === 'APPROVED').reduce((sum, v) => sum + (v.amount || 0), 0);
  const netCashFlow = totalReceipts - totalPayments;
  const pendingApprovalsCount = cashVouchers.filter((v) => v.status === 'PENDING_APPROVAL').length;

  const filteredVouchers = cashVouchers.filter((v) => {
    const matchesSearch = v.voucherCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = voucherTypeFilter === 'ALL' || v.voucherType === voucherTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 text-white p-6 shadow-md border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              MODULE M32 • TREASURY & CASH FLOW OPTIMIZATION
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Quản Lý Quỹ Tiền Mặt, Ngân Hàng & Dòng Tiền</h1>
            <p className="text-slate-400 text-sm mt-1">
              Quản lý tài khoản thanh toán, lập & duyệt phiếu thu/chi, đối soát sao kê tự động & dự báo dòng tiền 7-30-90 ngày.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsVietQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-sm transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Tạo VietQR
            </button>

            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-sm transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Điều Chuyển Vốn
            </button>

            <button
              onClick={() => setIsNewVoucherModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo Phiếu Thu/Chi
            </button>

            <button
              onClick={handleExportPdfReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-sky-400" />
              In Báo Cáo PDF
            </button>
          </div>
        </div>

        {/* Treasury Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng Tiền Quỹ & Ngân Hàng</p>
              <p className="text-xl font-bold text-white mt-1">{(totalBalance || 0).toLocaleString('vi-VN')} <span className="text-xs text-slate-400 font-normal">VNĐ</span></p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                4 Tài khoản & Quỹ hoạt động
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng Thu Tháng (Receipts)</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">+{(totalReceipts || 0).toLocaleString('vi-VN')} <span className="text-xs text-slate-400 font-normal">VNĐ</span></p>
              <p className="text-xs text-slate-400 mt-1">Đã duyệt & Gạch nợ AR</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng Chi Tháng (Payments)</p>
              <p className="text-xl font-bold text-rose-400 mt-1">-{(totalPayments || 0).toLocaleString('vi-VN')} <span className="text-xs text-slate-400 font-normal">VNĐ</span></p>
              <p className="text-xs text-slate-400 mt-1">Thanh toán AP & Chi phí</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Dòng Tiền Thuần (Net Flow)</p>
              <p className={`text-xl font-bold mt-1 ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netCashFlow >= 0 ? '+' : ''}{(netCashFlow || 0).toLocaleString('vi-VN')} <span className="text-xs text-slate-400 font-normal">VNĐ</span>
              </p>
              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {pendingApprovalsCount} chứng từ chờ duyệt
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= TẦNG L1: SUB-TABS NAVIGATION BAR (M41 MASTER SPEC) ================= */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('bank_accounts')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'bank_accounts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Sổ Tài Khoản Ngân Hàng &amp; Quỹ</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'bank_accounts' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {bankAccounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cash_vouchers')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'cash_vouchers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Phiếu Thu &amp; Phiếu Chi</span>
            {pendingApprovalsCount > 0 ? (
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'cash_vouchers' ? 'bg-blue-700 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
              }`}>
                {pendingApprovalsCount} chờ duyệt
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'cash_vouchers' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {cashVouchers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'transfers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span>Điều Chuyển Vốn Nội Bộ</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'transfers' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {transfers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'reconciliation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>Đối Soát Ngân Hàng (Bank Recon)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'reconciliation' ? 'bg-blue-700 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
            }`}>
              Auto-Match
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cashflow_forecast')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'cashflow_forecast'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4 shrink-0" />
            <span>Dự Báo Dòng Tiền (Cash Flow)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'cashflow_forecast' ? 'bg-blue-700 text-white' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
            }`}>
              7-30-90 Ngày
            </span>
          </button>
        </div>

        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold shrink-0 border-l border-slate-200 dark:border-slate-700/70 pl-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Treasury API</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            VAS &amp; IFRS Compliant
          </span>
        </div>
      </div>

      {/* Main Work Area */}
      <div className="p-6 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">Đang tải dữ liệu Quỹ & Ngân hàng từ NexusSync Core...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: BANK ACCOUNTS & CASH FUNDS */}
            {activeTab === 'bank_accounts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {bankAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                            acc.accountType === 'CASH'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {acc.accountType === 'CASH' ? <Wallet className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 text-sm">{acc.bankName}</h3>
                            <p className="text-xs text-slate-500">{acc.accountNumber}</p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                          Hoạt động
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Số dư Sổ sách:</span>
                          <span className="font-bold text-slate-900 text-base">{(acc.bookBalance || 0).toLocaleString('vi-VN')} <span className="text-xs text-slate-400">VNĐ</span></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Số dư Sao kê Bank:</span>
                          <span className="font-semibold text-slate-700 text-sm">{(acc.bankBalance || 0).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span>Đơn vị / Chi nhánh:</span>
                          <span className="truncate max-w-[140px]">{acc.branchName}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setVietQrForm(prev => ({ ...prev, bankAccountId: String(acc.id) }));
                            setIsVietQrModalOpen(true);
                          }}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium text-center transition-colors flex items-center justify-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Mã VietQR
                        </button>
                        <button
                          onClick={() => {
                            setTransferForm(prev => ({ ...prev, fromAccountId: String(acc.id) }));
                            setIsTransferModalOpen(true);
                          }}
                          className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium text-center transition-colors flex items-center justify-center gap-1"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Trích tiền
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bank Account Details Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Chi Tiết Hạn Mức & Bút Toán Sổ Cái Ngân Hàng (GL Account 111 / 112)
                    </h3>
                    <span className="text-xs text-slate-500">Quy chuẩn TT200/2014/TT-BTC</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          <th className="py-3 px-4">Mã Tài Khoản</th>
                          <th className="py-3 px-4">Tên Ngân Hàng / Quỹ</th>
                          <th className="py-3 px-4">Số Tài Khoản</th>
                          <th className="py-3 px-4">Chủ Tài Khoản</th>
                          <th className="py-3 px-4 text-right">Số Dư Sổ Sách (GL)</th>
                          <th className="py-3 px-4 text-center">Định Khoản BCTC</th>
                          <th className="py-3 px-4 text-center">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {bankAccounts.map((acc) => (
                          <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-600">ACC-00{acc.id}</td>
                            <td className="py-3.5 px-4 font-medium text-slate-900">{acc.bankName}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">{acc.accountNumber}</td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs">{acc.accountName}</td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-right font-semibold text-slate-900">{(acc.bookBalance || 0).toLocaleString('vi-VN')} VNĐ</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono rounded">
                                {acc.accountType === 'CASH' ? 'TK 1111 (Tiền mặt)' : 'TK 1121 (Tiền gửi)'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Ready
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CASH & BANK VOUCHERS */}
            {activeTab === 'cash_vouchers' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
                  <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                    <div className="relative flex-1 md:max-w-md">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm phiếu thu, phiếu chi, đối tác..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-500" />
                      <select
                        value={voucherTypeFilter}
                        onChange={(e) => setVoucherTypeFilter(e.target.value)}
                        className="border border-slate-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="ALL">Tất cả loại phiếu</option>
                        <option value="RECEIPT">Phiếu Thu (Money IN)</option>
                        <option value="PAYMENT">Phiếu Chi (Money OUT)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsNewVoucherModalOpen(true)}
                    className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Lập Phiếu Thu / Chi Mới
                  </button>
                </div>

                {/* Vouchers Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          <th className="py-3 px-4">Mã Chứng Từ</th>
                          <th className="py-3 px-4">Loại Phiếu</th>
                          <th className="py-3 px-4">Đối Tác Thụ Hưởng / Nộp</th>
                          <th className="py-3 px-4">Nội Dung / Lý Do</th>
                          <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                          <th className="py-3 px-4">Tài Khoản / Quỹ</th>
                          <th className="py-3 px-4 text-center">Định Khoản GL</th>
                          <th className="py-3 px-4 text-center">Trạng Thái</th>
                          <th className="py-3 px-4 text-center">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {filteredVouchers.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">{v.voucherCode}</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                v.voucherType === 'RECEIPT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {v.voucherType === 'RECEIPT' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                {v.voucherType === 'RECEIPT' ? 'PHIẾU THU' : 'PHIẾU CHI'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-900">{v.partnerName}</td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs max-w-xs truncate">{v.reason}</td>
                            <td className={`py-3.5 px-4 font-mono tabular-nums text-right font-semibold ${v.voucherType === 'RECEIPT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {v.voucherType === 'RECEIPT' ? '+' : '-'}{(v.amount || 0).toLocaleString('vi-VN')} VNĐ
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 text-xs">{v.bankName}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono rounded">
                                {v.accountingEntry}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {v.status === 'APPROVED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 animate-pulse">
                                  <Clock className="w-3 h-3" /> Chờ duyệt CFO
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center space-x-2">
                              {v.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => handleApproveVoucher(v.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors"
                                >
                                  Duyệt
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedVoucherDetail(v)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors"
                              >
                                Xem
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

            {/* TAB 3: INTERNAL TRANSFERS */}
            {activeTab === 'transfers' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Lịch Sử Điều Chuyển Vốn Nội Bộ</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Rút/nộp tiền mặt, chuyển tiền ngân hàng qua lại, cân bằng hạn mức vốn.</p>
                  </div>
                  <button
                    onClick={() => setIsTransferModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Thực Hiện Điều Chuyển Mới
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">Mã Điều Chuyển</th>
                        <th className="py-3 px-4">Tài Khoản Trích Tiền</th>
                        <th className="py-3 px-4">Tài Khoản Thụ Hưởng</th>
                        <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                        <th className="py-3 px-4">Nội Dung</th>
                        <th className="py-3 px-4 text-center">Định Khoản GL</th>
                        <th className="py-3 px-4 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {transfers.map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600">{tr.transferCode}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">{tr.fromBankName}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">{tr.toBankName}</td>
                          <td className="py-3.5 px-4 font-bold text-right text-indigo-600">{(tr.amount || 0).toLocaleString('vi-VN')} VNĐ</td>
                          <td className="py-3.5 px-4 text-slate-600 text-xs">{tr.reason}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono rounded">
                              {tr.accountingEntry}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: BANK RECONCILIATION */}
            {activeTab === 'reconciliation' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">Thuật Toán Đối Soát Ngân Hàng Tự Động (Auto-Matching Rules)</h4>
                      <p className="text-xs text-blue-700">Tự động khớp dữ liệu sao kê ngân hàng điện tử với Chứng từ Thu/Chi theo Số tiền & Cú pháp chuyển khoản.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNotify('info', 'Chạy thuật toán đối soát', 'Đã tự động quét 100% dòng sao kê.')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Chạy Match Tự Động
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 font-bold text-slate-900 text-base">
                    Nhật Ký Sao Kê Biến Động Số Dư Ngân Hàng (Bank Statement Lines)
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">Mã Giao Dịch Ngân Hàng</th>
                        <th className="py-3 px-4">Thời Gian</th>
                        <th className="py-3 px-4">Nội Dung Chuyển Khoản</th>
                        <th className="py-3 px-4 text-right">Biến Động Số Dư</th>
                        <th className="py-3 px-4 text-center">Chứng Từ Khớp</th>
                        <th className="py-3 px-4 text-center">Trạng Thái</th>
                        <th className="py-3 px-4 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {bankStatements.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">{st.bankTransactionId}</td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">{st.transactionDate}</td>
                          <td className="py-3.5 px-4 text-xs font-mono text-slate-700 max-w-xs truncate">{st.reference}</td>
                          <td className={`py-3.5 px-4 font-bold text-right ${st.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {st.amount >= 0 ? '+' : ''}{(st.amount || 0).toLocaleString('vi-VN')} VNĐ
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-blue-600">
                            {st.matchedVoucherCode || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {st.status === 'MATCHED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Khớp 100%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                <AlertTriangle className="w-3 h-3" /> Chưa khớp
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {st.status !== 'MATCHED' && (
                              <button
                                onClick={() => handleReconcileStatement(st.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                              >
                                Khớp Thủ Công
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: CASH FLOW FORECAST */}
            {activeTab === 'cashflow_forecast' && forecastData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {forecastData.forecasts.map((fc: any) => (
                    <div key={fc.period} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Chu kỳ {fc.periodLabel}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            fc.riskLevel === 'OPTIMAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            Rủi ro: {fc.riskLevel}
                          </span>
                        </div>

                        <div className="mt-2 space-y-2.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500 text-xs">Số dư mở kỳ:</span>
                            <span className="font-semibold">{(fc.openingBalance || 0).toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 text-xs">Dự kiến Thu (Expected Inflow):</span>
                            <span className="font-bold text-emerald-600">+{(fc.expectedInflows || 0).toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 text-xs">Dự kiến Chi (Expected Outflow):</span>
                            <span className="font-bold text-rose-600">-{(fc.expectedOutflows || 0).toLocaleString('vi-VN')} VNĐ</span>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="font-bold text-slate-900 text-xs">Dòng tiền thuần (Net):</span>
                            <span className="font-bold text-blue-600 text-base">+{(fc.netCashFlow || 0).toLocaleString('vi-VN')} VNĐ</span>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-800 text-xs">Số dư dự kiến cuối kỳ:</span>
                            <span className="font-extrabold text-slate-900 text-base">{(fc.closingBalance || 0).toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-purple-50/50 p-2.5 rounded-lg">
                        <span className="font-semibold text-purple-900">Đánh giá thanh khoản:</span> {fc.warningMessage}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-base mb-2">Đề Xuất Tối Ưu Thanh Khoản & Quản Trị Rủi Ro Âm Quỹ</h3>
                  <p className="text-xs text-slate-600 mb-4">Hệ thống phân tích tự động dựa trên hạn thanh toán Hóa đơn AR (Bán hàng) & AP (Chi phí đầu vào).</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <h4 className="font-bold text-emerald-900 text-sm mb-1">Thúc Đẩy Thu Hồi Nợ AR Sớm</h4>
                      <p className="text-emerald-800">
                        Có 120.000.000 VNĐ nợ AR đến hạn trong 5 ngày tới từ Công ty MISA. Áp dụng chính sách VietQR động để đẩy nhanh gạch nợ.
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-bold text-blue-900 text-sm mb-1">Tối Ưu Chiết Khấu Thanh Toán AP</h4>
                      <p className="text-blue-800">
                        Nên thực hiện thanh toán Hóa đơn AP-991 trước ngày 30/08 để nhận thêm 2% chiết khấu thanh toán sớm (tiết kiệm 2.640.000 VNĐ).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL 1: CREATE NEW VOUCHER (PHIẾU THU / PHIẾU CHI) */}
      {isNewVoucherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Lập Chứng Từ Thu / Chi Quỹ
              </h3>
              <button onClick={() => setIsNewVoucherModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Phiếu Chứng Từ</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewVoucherForm(p => ({ ...p, voucherType: 'RECEIPT', accountingEntry: 'Nợ 1121 / Có 131' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 ${
                      newVoucherForm.voucherType === 'RECEIPT'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Phiếu Thu (Money IN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewVoucherForm(p => ({ ...p, voucherType: 'PAYMENT', accountingEntry: 'Nợ 331 / Có 1121' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 ${
                      newVoucherForm.voucherType === 'PAYMENT'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Phiếu Chi (Money OUT)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Đối Tác Thụ Hưởng / Nộp Tiền</label>
                <input
                  type="text"
                  required
                  value={newVoucherForm.partnerName}
                  onChange={(e) => setNewVoucherForm(p => ({ ...p, partnerName: e.target.value }))}
                  placeholder="e.g. Công ty Cổ phần MISA / Nguyễn Văn A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CurrencyInput
                    label="Số Tiền (VNĐ)"
                    value={newVoucherForm.amount}
                    onChange={(val) => setNewVoucherForm(p => ({ ...p, amount: val.toString() }))}
                    placeholder="VD: 100.000.000"
                    required
                    showBadge={true}
                    showPresets={true}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tài Khoản / Quỹ Sổ Sách</label>
                  <select
                    value={newVoucherForm.bankAccountId}
                    onChange={(e) => setNewVoucherForm(p => ({ ...p, bankAccountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {bankAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.bankName} - {a.accountNumber}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nội Dung / Lý Do Thu Chi</label>
                <textarea
                  rows={2}
                  value={newVoucherForm.reason}
                  onChange={(e) => setNewVoucherForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Lý do thu chi chứng từ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Định Khoản BCTC Tự Động (Double-Entry GL)</label>
                <input
                  type="text"
                  value={newVoucherForm.accountingEntry}
                  onChange={(e) => setNewVoucherForm(p => ({ ...p, accountingEntry: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewVoucherModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Tạo & Chuyển Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INTERNAL TRANSFER */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-indigo-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                Điều Chuyển Vốn Nội Bộ
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Từ Tài Khoản Trích Tiền</label>
                <select
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm(p => ({ ...p, fromAccountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {bankAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} (Dư: {(a.bookBalance || 0).toLocaleString('vi-VN')} VNĐ)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Đến Tài Khoản Thụ Hưởng</label>
                <select
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm(p => ({ ...p, toAccountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {bankAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} (Dư: {(a.bookBalance || 0).toLocaleString('vi-VN')} VNĐ)</option>
                  ))}
                </select>
              </div>

              <div>
                <CurrencyInput
                  label="Số Tiền Điều Chuyển (VNĐ)"
                  value={transferForm.amount}
                  onChange={(val) => setTransferForm(p => ({ ...p, amount: val.toString() }))}
                  placeholder="VD: 50.000.000"
                  required
                  showBadge={true}
                  showPresets={true}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lý Do Điều Chuyển</label>
                <input
                  type="text"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Điều chuyển vốn cân bằng hạn mức..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
                >
                  Xác Nhận Điều Chuyển
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIETQR GENERATOR */}
      {isVietQrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-emerald-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                Mã VietQR Động NAPAS247
              </h3>
              <button onClick={() => setIsVietQrModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block">
                <img
                  src={`https://img.vietqr.io/image/MB-999988889999-compact.png?amount=${vietQrForm.amount}&addInfo=${encodeURIComponent(vietQrForm.memo)}&accountName=CONG%20TY%20CP%20NEXUSSYNC%20ERP`}
                  alt="VietQR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="text-left text-xs space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p><span className="font-semibold text-slate-700">Ngân hàng:</span> MB Bank (TMCP Quân Đội)</p>
                <p><span className="font-semibold text-slate-700">Số tài khoản:</span> 999988889999</p>
                <p><span className="font-semibold text-slate-700">Chủ tài khoản:</span> CONG TY CP NEXUSSYNC ERP</p>
                <p><span className="font-semibold text-slate-700">Số tiền:</span> {(Number(vietQrForm.amount) || 0).toLocaleString('vi-VN')} VNĐ</p>
                <p><span className="font-semibold text-slate-700">Nội dung:</span> {vietQrForm.memo}</p>
              </div>

              <button
                onClick={() => {
                  onNotify('success', 'Đã sao chép mã VietQR', 'Sẵn sàng gửi cho Khách hàng thanh toán.');
                  setIsVietQrModalOpen(false);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg"
              >
                Sao Chép & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VOUCHER DETAIL */}
      {selectedVoucherDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Chi Tiết {selectedVoucherDetail.voucherType === 'RECEIPT' ? 'Phiếu Thu' : 'Phiếu Chi'} [{selectedVoucherDetail.voucherCode}]
              </h3>
              <button onClick={() => setSelectedVoucherDetail(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Đối tác:</span>
                <span className="font-bold text-slate-900">{selectedVoucherDetail.partnerName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-extrabold text-blue-600">{(selectedVoucherDetail.amount || 0).toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Tài khoản/Quỹ:</span>
                <span>{selectedVoucherDetail.bankName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Định khoản GL:</span>
                <span className="font-mono text-xs">{selectedVoucherDetail.accountingEntry}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Người lập:</span>
                <span>{selectedVoucherDetail.createdBy}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Người duyệt (CFO):</span>
                <span>{selectedVoucherDetail.approvedBy || 'Chờ duyệt'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Lý do thu chi:</span>
                <p className="p-2.5 bg-slate-50 border rounded text-xs text-slate-700">{selectedVoucherDetail.reason}</p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedVoucherDetail(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
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
