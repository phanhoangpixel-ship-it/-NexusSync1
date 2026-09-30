import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { TablePagination } from '../../../../components/common/TablePagination';
import { BulkActionBar } from '../../../../components/common/BulkActionBar';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { ConfirmDialogState } from '../../../../types/index';
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
  Printer,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Tag,
  Layers,
  ArrowRight,
  Landmark,
} from 'lucide-react';
import { downloadTreasuryReportPdf } from '../../../../utils/pdfExporter';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { M32PaymentsTreasuryWorkspaceProps } from './types';
import { RegulatoryVoucherPrintModal } from './RegulatoryVoucherPrintModal';
import { M32BankHostToHostModal } from './M32BankHostToHostModal';

export const M32PaymentsTreasuryWorkspace: React.FC<M32PaymentsTreasuryWorkspaceProps> = ({
  onSelectEntity,
  onNotify = () => {},
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<
    'bank_accounts' | 'cash_vouchers' | 'transfers' | 'reconciliation' | 'cashflow_forecast'
  >('M32', 'bank_accounts');

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // State Stores
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cashVouchers, setCashVouchers] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [bankStatements, setBankStatements] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cancellation Modal State (Rule #19 compliant, zero window.prompt)
  const [cancelModalState, setCancelModalState] = useState<{
    isOpen: boolean;
    voucherId: number | null;
    voucherCode: string;
    reason: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    voucherId: null,
    voucherCode: '',
    reason: '',
    isSubmitting: false,
  });

  // Advanced Filters for Vouchers
  // Wave 1 UI/UX Standardization — TablePagination [10,15,25,50,100] & Bulk Actions
  const [voucherPage, setVoucherPage] = useState<number>(1);
  const [voucherPageSize, setVoucherPageSize] = useState<number>(15);
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceModuleFilter, setSourceModuleFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');

  // Modal States
  const [isNewVoucherModalOpen, setIsNewVoucherModalOpen] = useState<boolean>(false);
  const [newVoucherForm, setNewVoucherForm] = useState({
    voucherType: 'RECEIPT', // RECEIPT or PAYMENT
    voucherCategory: '131_CUSTOMER_RECEIPT',
    partnerType: 'CUSTOMER',
    partnerName: '',
    amount: '',
    bankAccountId: '1',
    paymentMethod: 'BANK_TRANSFER',
    reason: '',
    accountingEntry: 'Nợ 1121 / Có 131',
    debitAccount: '1121',
    creditAccount: '131',
    attachedDocsCount: 1,
    attachedDocsDescription: 'Hóa đơn GTGT & Biên bản nghiệm thu',
    autoApprove: false,
  });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '1',
    toAccountId: '2',
    amount: '',
    reason: 'Điều chuyển vốn phục vụ thanh toán',
  });

  const [isVietQrModalOpen, setIsVietQrModalOpen] = useState<boolean>(false);
  const [isH2hModalOpen, setIsH2hModalOpen] = useState<boolean>(false);
  const [vietQrForm, setVietQrForm] = useState({
    bankAccountId: '2',
    amount: '120000000',
    memo: 'THANH TOAN DON HANG SO-2026-018',
  });

  const [selectedVoucherDetail, setSelectedVoucherDetail] = useState<any | null>(null);
  const [printVoucherId, setPrintVoucherId] = useState<number | null>(null);
  const [approvingVoucher, setApprovingVoucher] = useState<any | null>(null);
  const [allowOverdraftOverride, setAllowOverdraftOverride] = useState<boolean>(false);

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

  // Quick Preset Handlers for GL Accounts in Create Modal
  const handleVoucherCategoryChange = (cat: string, type: 'RECEIPT' | 'PAYMENT') => {
    let debit = '1121';
    let credit = '131';
    let reason = '';
    let partnerType = 'CUSTOMER';

    if (type === 'RECEIPT') {
      if (cat === '131_CUSTOMER_RECEIPT') {
        debit = '1121';
        credit = '131';
        reason = 'Thu tiền bán hàng / thanh toán công nợ từ khách hàng';
        partnerType = 'CUSTOMER';
      } else if (cat === '511_SALES_REVENUE') {
        debit = '1111';
        credit = '511';
        reason = 'Thu tiền mặt bán hàng trực tiếp tại quầy';
        partnerType = 'CUSTOMER';
      } else if (cat === '141_ADVANCE_REFUND') {
        debit = '1111';
        credit = '141';
        reason = 'Hoàn ứng tiền tạm ứng công tác phí';
        partnerType = 'EMPLOYEE';
      } else {
        debit = '1121';
        credit = '711';
        reason = 'Thu tiền thu nhập khác';
        partnerType = 'OTHER';
      }
    } else {
      if (cat === '331_SUPPLIER_PAYMENT') {
        debit = '331';
        credit = '1121';
        reason = 'Thanh toán tiền mua hàng cho nhà cung cấp';
        partnerType = 'SUPPLIER';
      } else if (cat === 'M14_COMMISSION') {
        debit = '3388';
        credit = '1121';
        reason = 'Chi trả hoa hồng bán hàng cho đại lý / NVKD';
        partnerType = 'EMPLOYEE';
      } else if (cat === 'M15_RMA') {
        debit = '3388';
        credit = '1121';
        reason = 'Chi hoàn tiền khách hàng đổi trả hàng bảo hành (RMA)';
        partnerType = 'CUSTOMER';
      } else if (cat === 'M28_PAYROLL') {
        debit = '3341';
        credit = '1121';
        reason = 'Chi trả lương và phụ cấp kỳ lương cho cán bộ nhân viên';
        partnerType = 'EMPLOYEE';
      } else if (cat === '141_ADVANCE') {
        debit = '141';
        credit = '1111';
        reason = 'Tạm ứng tiền công tác / mua sắm vật tư';
        partnerType = 'EMPLOYEE';
      } else if (cat === '642_OPEX') {
        debit = '642';
        credit = '1121';
        reason = 'Chi phí quản lý doanh nghiệp, dịch vụ mua ngoài';
        partnerType = 'SUPPLIER';
      } else {
        debit = '811';
        credit = '1121';
        reason = 'Chi phí hoạt động khác';
        partnerType = 'OTHER';
      }
    }

    setNewVoucherForm((prev) => ({
      ...prev,
      voucherType: type,
      voucherCategory: cat,
      debitAccount: debit,
      creditAccount: credit,
      accountingEntry: `Nợ ${debit} / Có ${credit}`,
      reason,
      partnerType,
    }));
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
          voucherCategory: '131_CUSTOMER_RECEIPT',
          partnerType: 'CUSTOMER',
          partnerName: '',
          amount: '',
          bankAccountId: '1',
          paymentMethod: 'BANK_TRANSFER',
          reason: 'Thu tiền bán hàng / thanh toán công nợ từ khách hàng',
          accountingEntry: 'Nợ 1121 / Có 131',
          debitAccount: '1121',
          creditAccount: '131',
          attachedDocsCount: 1,
          attachedDocsDescription: 'Hóa đơn GTGT & Biên bản nghiệm thu',
          autoApprove: false,
        });
        fetchAllTreasuryData();
      } else {
        onNotify('danger', 'Lỗi tạo chứng từ', data.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  // Open Approval Confirmation Dialog
  const handleInitiateApproval = (voucher: any) => {
    setApprovingVoucher(voucher);
    setAllowOverdraftOverride(false);
  };

  // Confirm Approval (Maker-Checker GL Post)
  const handleConfirmApproval = async () => {
    if (!approvingVoucher) return;
    try {
      const res = await fetch(`/api/treasury/vouchers/${approvingVoucher.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowOverdraft: allowOverdraftOverride }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Duyệt Chứng Từ Thành Công', data.message);
        setApprovingVoucher(null);
        fetchAllTreasuryData();
      } else {
        onNotify('danger', 'Không thể duyệt chứng từ', data.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi phê duyệt', err.message);
    }
  };

  // Initiate Cancel Voucher (Rule #19 Modal Trigger)
  const handleInitiateCancel = (voucher: any) => {
    setCancelModalState({
      isOpen: true,
      voucherId: voucher.id,
      voucherCode: voucher.voucherCode || `VCH-${voucher.id}`,
      reason: '',
      isSubmitting: false,
    });
  };

  // Confirm Cancel Voucher (M02 Audit Integrated)
  const handleConfirmCancelVoucher = async () => {
    if (!cancelModalState.voucherId || !cancelModalState.reason.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập lý do hủy chứng từ kế toán.');
      return;
    }

    setCancelModalState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const res = await fetch(`/api/treasury/vouchers/${cancelModalState.voucherId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelModalState.reason }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Hủy Chứng Từ Thành Công', data.message);
        setCancelModalState({
          isOpen: false,
          voucherId: null,
          voucherCode: '',
          reason: '',
          isSubmitting: false,
        });
        fetchAllTreasuryData();
      } else {
        onNotify('danger', 'Không thể hủy chứng từ', data.error);
        setCancelModalState((prev) => ({ ...prev, isSubmitting: false }));
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hủy chứng từ', err.message);
      setCancelModalState((prev) => ({ ...prev, isSubmitting: false }));
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
        setTransferForm({
          fromAccountId: '1',
          toAccountId: '2',
          amount: '',
          reason: 'Điều chuyển vốn phục vụ thanh toán',
        });
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
        onNotify('success', 'Đối Soát Khớp Lệnh Thành Công', data.message);
        fetchAllTreasuryData();
      } else {
        onNotify('danger', 'Lỗi đối soát', data.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  // Export Executive PDF Report
  const handleExportPdfReport = () => {
    try {
      downloadTreasuryReportPdf(bankAccounts, cashVouchers, forecastData);
      onNotify('success', 'Xuất Báo Cáo PDF Thành Công', 'Báo cáo Quản trị Quỹ & Dòng tiền đã được kết xuất.');
    } catch (e: any) {
      onNotify('danger', 'Lỗi kết xuất PDF', e.message);
    }
  };

  // Multi-dimensional filtered vouchers
  const filteredVouchers = useMemo(() => {
    return cashVouchers.filter((v) => {
      const matchesSearch =
        !searchQuery ||
        v.voucherCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.partnerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.sourceReferenceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.amountInWords?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = voucherTypeFilter === 'ALL' || v.voucherType === voucherTypeFilter;
      const matchesCategory = categoryFilter === 'ALL' || v.voucherCategory === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      const matchesSource = sourceModuleFilter === 'ALL' || v.sourceModule === sourceModuleFilter;
      const matchesAccount = accountFilter === 'ALL' || String(v.bankAccountId) === String(accountFilter);

      return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesSource && matchesAccount;
    });
  }, [cashVouchers, searchQuery, voucherTypeFilter, categoryFilter, statusFilter, sourceModuleFilter, accountFilter]);

  const paginatedVouchers = useMemo(() => {
    const start = (voucherPage - 1) * voucherPageSize;
    return filteredVouchers.slice(start, start + voucherPageSize);
  }, [filteredVouchers, voucherPage, voucherPageSize]);

  // Overall Statistics
  const totalBalance = useMemo(
    () => bankAccounts.reduce((sum, acc) => sum + (Number(acc.bookBalance) || 0), 0),
    [bankAccounts]
  );
  const totalReceipts = useMemo(
    () =>
      cashVouchers
        .filter((v) => v.voucherType === 'RECEIPT' && v.status === 'APPROVED')
        .reduce((sum, v) => sum + (Number(v.amount) || 0), 0),
    [cashVouchers]
  );
  const totalPayments = useMemo(
    () =>
      cashVouchers
        .filter((v) => v.voucherType === 'PAYMENT' && v.status === 'APPROVED')
        .reduce((sum, v) => sum + (Number(v.amount) || 0), 0),
    [cashVouchers]
  );
  const pendingApprovalCount = useMemo(
    () => cashVouchers.filter((v) => v.status === 'PENDING_APPROVAL').length,
    [cashVouchers]
  );

  // Selected account for balance preview in Create Modal
  const selectedCreateAccount = useMemo(
    () => bankAccounts.find((a) => String(a.id) === String(newVoucherForm.bankAccountId)),
    [bankAccounts, newVoucherForm.bankAccountId]
  );
  const isCreateOverdraft = useMemo(() => {
    if (newVoucherForm.voucherType !== 'PAYMENT' || !selectedCreateAccount) return false;
    const enteredAmount = Number(newVoucherForm.amount) || 0;
    return enteredAmount > (Number(selectedCreateAccount.bookBalance) || 0);
  }, [newVoucherForm.voucherType, newVoucherForm.amount, selectedCreateAccount]);

  // Approving account balance check
  const approvingAccount = useMemo(() => {
    if (!approvingVoucher) return null;
    return bankAccounts.find((a) => String(a.id) === String(approvingVoucher.bankAccountId));
  }, [bankAccounts, approvingVoucher]);
  const isApprovalOverdraft = useMemo(() => {
    if (!approvingVoucher || approvingVoucher.voucherType !== 'PAYMENT' || !approvingAccount) return false;
    return Number(approvingVoucher.amount) > Number(approvingAccount.bookBalance);
  }, [approvingVoucher, approvingAccount]);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 overflow-y-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 text-white p-6 shadow-md border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              MODULE M32 • TREASURY & CASH MANAGEMENT
            </div>
            <h1 className="text-2xl font-black tracking-tight">Quản Trị Quỹ Tiền Mặt, Ngân Hàng & Dòng Tiền</h1>
            <p className="text-slate-400 text-xs mt-1">
              Hệ thống quản lý phiếu thu/chi chuẩn Bộ Tài chính (01-TT / 02-TT), cổng ủy quyền thanh toán tập trung, đối soát sao kê tự động & dự báo dòng tiền.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsH2hModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition"
            >
              <Landmark className="w-4 h-4 text-emerald-200" />
              Ngân Hàng Host-to-Host (H2H)
            </button>

            <button
              onClick={() => setIsVietQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <QrCode className="w-4 h-4" />
              Tạo VietQR
            </button>

            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Điều Chuyển Vốn
            </button>

            <button
              onClick={() => setIsNewVoucherModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Lập Phiếu Thu / Chi Mới
            </button>

            <button
              onClick={handleExportPdfReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-4 h-4 text-sky-400" />
              In Báo Cáo PDF
            </button>
          </div>
        </div>

        {/* Treasury Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng Tiền Quỹ & Ngân Hàng</p>
              <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
                {(totalBalance || 0).toLocaleString('vi-VN')}{' '}
                <span className="text-xs text-slate-400 font-normal">VNĐ</span>
              </p>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {bankAccounts.length} Tài khoản & Quỹ hoạt động
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng Thu Đã Duyệt (Receipts)</p>
              <p className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                +{(totalReceipts || 0).toLocaleString('vi-VN')}{' '}
                <span className="text-xs text-slate-400 font-normal">VNĐ</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Đã gạch nợ AR & Ghi Sổ Cái M30</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng Chi Đã Duyệt (Payments)</p>
              <p className="text-xl font-bold font-mono tabular-nums text-rose-400 mt-1">
                -{(totalPayments || 0).toLocaleString('vi-VN')}{' '}
                <span className="text-xs text-slate-400 font-normal">VNĐ</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">AP / Lương / Hoa hồng / RMA</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Phiếu Chờ Duyệt CFO</p>
              <p className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-1">
                {pendingApprovalCount}{' '}
                <span className="text-xs text-slate-400 font-normal">chứng từ</span>
              </p>
              <p className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Cần ký duyệt để post GL
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 sticky top-0 z-20 shadow-sm flex items-center justify-between gap-2">
        <button
          onClick={() => scrollTabs('left')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          title="Cuộn sang trái"
          aria-label="Cuộn sang trái"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={tabsContainerRef}
          className="flex space-x-2 sm:space-x-4 overflow-x-auto scroll-smooth no-scrollbar flex-1 py-1"
        >
          <button
            onClick={() => setActiveTab('bank_accounts')}
            className={`py-3 px-3.5 rounded-lg border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap shrink-0 transition ${
              activeTab === 'bank_accounts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Tài Khoản & Quỹ Tiền</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono tabular-nums">
              {bankAccounts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cash_vouchers')}
            className={`py-3 px-3.5 rounded-lg border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap shrink-0 transition ${
              activeTab === 'cash_vouchers'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Phiếu Thu / Chi (01 & 02-TT)</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums ${
                pendingApprovalCount > 0
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {cashVouchers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`py-3 px-3.5 rounded-lg border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap shrink-0 transition ${
              activeTab === 'transfers'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Điều Chuyển Vốn Nội Bộ</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono tabular-nums">
              {transfers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`py-3 px-3.5 rounded-lg border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap shrink-0 transition ${
              activeTab === 'reconciliation'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Đối Soát Sao Kê Bank</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono tabular-nums">
              {bankStatements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cashflow_forecast')}
            className={`py-3 px-3.5 rounded-lg border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap shrink-0 transition ${
              activeTab === 'cashflow_forecast'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Dự Báo Dòng Tiền (7-30-90)</span>
          </button>
        </div>

        <button
          onClick={() => scrollTabs('right')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          title="Cuộn sang phải"
          aria-label="Cuộn sang phải"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Workspace Workspace Content */}
      <div className="p-6 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">Đang tải dữ liệu Quỹ & Dòng tiền doanh nghiệp...</p>
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
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-lg">
                            {acc.accountType === 'CASH' ? <Wallet className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                            GL: {acc.glAccount || (acc.accountType === 'CASH' ? '1111' : '1121')}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mt-3">{acc.bankName}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">STK: {acc.accountNumber}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">{acc.accountName}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Số dư Sổ sách (GL):</span>
                          <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 text-base">
                            {(acc.bookBalance || 0).toLocaleString('vi-VN')}{' '}
                            <span className="text-xs text-slate-400">VNĐ</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Số dư Sao kê Bank:</span>
                          <span className="font-semibold font-mono tabular-nums text-slate-700 dark:text-slate-300 text-sm">
                            {(acc.bankBalance || 0).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                          <span>Đơn vị / Chi nhánh:</span>
                          <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-300">{acc.branchName || 'Hội sở chính'}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setVietQrForm((prev) => ({ ...prev, bankAccountId: String(acc.id) }));
                            setIsVietQrModalOpen(true);
                          }}
                          className="flex-1 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium text-center transition flex items-center justify-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Mã VietQR
                        </button>
                        <button
                          onClick={() => {
                            setTransferForm((prev) => ({ ...prev, fromAccountId: String(acc.id) }));
                            setIsTransferModalOpen(true);
                          }}
                          className="flex-1 py-1.5 px-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium text-center transition flex items-center justify-center gap-1"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Trích tiền
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bank Account Details Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Chi Tiết Danh Mục Quỹ Tiền Mặt & Tài Khoản Ngân Hàng (GL 111 / 112)
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Quy chuẩn Thông tư 200/2014/TT-BTC</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <th className="py-3 px-4">Mã Tài Khoản</th>
                          <th className="py-3 px-4">Tên Ngân Hàng / Quỹ</th>
                          <th className="py-3 px-4">Số Tài Khoản</th>
                          <th className="py-3 px-4">Chủ Tài Khoản</th>
                          <th className="py-3 px-4 text-right">Số Dư Sổ Sách (GL)</th>
                          <th className="py-3 px-4 text-center">Định Khoản BCTC</th>
                          <th className="py-3 px-4 text-center">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                        {bankAccounts.map((acc) => (
                          <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                              ACC-{String(acc.id).padStart(3, '0')}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              {acc.accountType === 'CASH' ? (
                                <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              )}
                              {acc.bankName}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 text-xs">{acc.accountNumber}</td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">{acc.accountName}</td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-slate-100">
                              {(acc.bookBalance || 0).toLocaleString('vi-VN')} VNĐ
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono rounded">
                                TK {acc.glAccount || (acc.accountType === 'CASH' ? '1111' : '1121')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => {
                                  setAccountFilter(String(acc.id));
                                  setActiveTab('cash_vouchers');
                                }}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold hover:underline"
                              >
                                Xem sổ thu chi &rarr;
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

            {/* TAB 2: CASH & BANK VOUCHERS (01-TT / 02-TT) */}
            {activeTab === 'cash_vouchers' && (
              <div className="space-y-4">
                {/* Advanced Multi-Dimensional Filter Toolbar */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo số chứng từ (PT/PC), đối tác, nội dung thu chi, số tiền..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => setIsNewVoucherModalOpen(true)}
                      className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 shrink-0 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Lập Phiếu Thu / Chi Mới
                    </button>
                  </div>

                  {/* Filter Dropdowns Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">Loại Phiếu:</label>
                      <select
                        value={voucherTypeFilter}
                        onChange={(e) => setVoucherTypeFilter(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="ALL">Tất cả loại phiếu</option>
                        <option value="RECEIPT">Phiếu Thu (Mẫu 01-TT)</option>
                        <option value="PAYMENT">Phiếu Chi (Mẫu 02-TT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">Trạng Thái:</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="PENDING_APPROVAL">Chờ duyệt CFO</option>
                        <option value="APPROVED">Đã duyệt & Post GL</option>
                        <option value="CANCELLED">Đã hủy bỏ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">Tài Khoản / Quỹ:</label>
                      <select
                        value={accountFilter}
                        onChange={(e) => setAccountFilter(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="ALL">Tất cả quỹ & bank</option>
                        {bankAccounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.bankName} ({a.accountNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">Module Nguồn (Gateway):</label>
                      <select
                        value={sourceModuleFilter}
                        onChange={(e) => setSourceModuleFilter(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="ALL">Tất cả module nguồn</option>
                        <option value="M13">M13 - Bán hàng (Sales)</option>
                        <option value="M14">M14 - Hoa hồng (Commission)</option>
                        <option value="M15">M15 - Đổi trả RMA</option>
                        <option value="M16">M16 - Bán lẻ POS</option>
                        <option value="M28">M28 - Nhân sự & Lương</option>
                        <option value="M08">M08 - Mua hàng (AP)</option>
                        <option value="M32">M32 - Kế toán quỹ nội bộ</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setVoucherTypeFilter('ALL');
                          setCategoryFilter('ALL');
                          setStatusFilter('ALL');
                          setSourceModuleFilter('ALL');
                          setAccountFilter('ALL');
                        }}
                        className="w-full py-1.5 px-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md font-medium transition text-center"
                      >
                        Đặt lại bộ lọc
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vouchers Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Hiển thị {filteredVouchers.length} / {cashVouchers.length} chứng từ kế toán
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">Thông tư 200/2014/TT-BTC & 133/2016/TT-BTC</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
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
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                        {filteredVouchers.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                              Không tìm thấy chứng từ thu/chi nào phù hợp với bộ lọc hiện tại.
                            </td>
                          </tr>
                        ) : (
                          paginatedVouchers.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition">
                              <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                <div>{v.voucherCode}</div>
                                {v.voucherForm && (
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{v.voucherForm}</div>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    v.voucherType === 'RECEIPT'
                                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                                  }`}
                                >
                                  {v.voucherType === 'RECEIPT' ? (
                                    <ArrowDownRight className="w-3 h-3" />
                                  ) : (
                                    <ArrowUpRight className="w-3 h-3" />
                                  )}
                                  {v.voucherType === 'RECEIPT' ? 'PHIẾU THU' : 'PHIẾU CHI'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-medium text-slate-900 dark:text-slate-100">{v.partnerName}</div>
                                {v.sourceModule && v.sourceModule !== 'M32' && (
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                                    Nguồn: {v.sourceModule}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs max-w-xs truncate" title={v.reason}>
                                {v.reason}
                              </td>
                              <td
                                className={`py-3.5 px-4 font-mono tabular-nums text-right font-bold ${
                                  v.voucherType === 'RECEIPT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {v.voucherType === 'RECEIPT' ? '+' : '-'}
                                {(Number(v.amount) || 0).toLocaleString('vi-VN')} VNĐ
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs">{v.bankName}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono rounded">
                                  {v.accountingEntry || `Nợ ${v.debitAccount} / Có ${v.creditAccount}`}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {v.status === 'APPROVED' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                                    <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                                  </span>
                                ) : v.status === 'CANCELLED' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    <X className="w-3 h-3" /> Đã hủy
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 animate-pulse">
                                    <Clock className="w-3 h-3" /> Chờ duyệt CFO
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center space-x-1.5 whitespace-nowrap">
                                {v.status === 'PENDING_APPROVAL' && (
                                  <button
                                    onClick={() => handleInitiateApproval(v)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-sm transition"
                                  >
                                    Duyệt
                                  </button>
                                )}
                                <button
                                  onClick={() => setPrintVoucherId(v.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded transition border border-indigo-200 dark:border-indigo-800"
                                  title="In biểu mẫu chuẩn BTC 01-TT / 02-TT"
                                >
                                  <Printer className="w-3 h-3" />
                                  In Mẫu BTC
                                </button>
                                <button
                                  onClick={() => setSelectedVoucherDetail(v)}
                                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded transition"
                                >
                                  Xem
                                </button>
                                {v.status !== 'CANCELLED' && (
                                  <button
                                    onClick={() => handleInitiateCancel(v)}
                                    className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium rounded transition border border-rose-200 dark:border-rose-800"
                                    title="Hủy chứng từ & ghi log M02"
                                  >
                                    Hủy
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination
                    currentPage={voucherPage}
                    pageSize={voucherPageSize}
                    totalItems={filteredVouchers.length}
                    onPageChange={setVoucherPage}
                    onPageSizeChange={setVoucherPageSize}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: INTERNAL TRANSFERS */}
            {activeTab === 'transfers' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                      <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Lệnh Điều Chuyển Vốn Nội Bộ Giữa Các Quỹ & Tài Khoản Ngân Hàng
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tự động cân bằng tài khoản GL 1111/1121 và kiểm soát hạn mức dòng tiền.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsTransferModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Lập Lệnh Điều Chuyển
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <th className="py-3 px-4">Mã Giao Dịch</th>
                          <th className="py-3 px-4">Tài Khoản Xuất (From)</th>
                          <th className="py-3 px-4 text-center"></th>
                          <th className="py-3 px-4">Tài Khoản Nhập (To)</th>
                          <th className="py-3 px-4 text-right">Số Tiền Điều Chuyển</th>
                          <th className="py-3 px-4">Lý Do / Mục Đích</th>
                          <th className="py-3 px-4 text-center">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                        {transfers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                              Chưa có lệnh điều chuyển vốn nào trong kỳ.
                            </td>
                          </tr>
                        ) : (
                          transfers.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                              <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                {t.transferCode || `TRF-${t.id}`}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">{t.fromBankName}</td>
                              <td className="py-3.5 px-4 text-center text-indigo-500 dark:text-indigo-400">
                                <ArrowRight className="w-4 h-4 mx-auto" />
                              </td>
                              <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">{t.toBankName}</td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-slate-100">
                                {(Number(t.amount) || 0).toLocaleString('vi-VN')} VNĐ
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">{t.reason}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                                </span>
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

            {/* TAB 4: BANK RECONCILIATION */}
            {activeTab === 'reconciliation' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Đối Soát Sao Kê Tự Động (Bank Statement Reconciliation)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Đối soát giữa giao dịch sao kê thực tế từ ngân hàng và chứng từ Phiếu Thu/Chi trong hệ thống.
                    </p>
                  </div>
                  <button
                    onClick={fetchAllTreasuryData}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Làm mới sao kê
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <th className="py-3 px-4">Mã Giao Dịch</th>
                          <th className="py-3 px-4">Ngày Giao Dịch</th>
                          <th className="py-3 px-4">Nội Dung Sao Kê</th>
                          <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                          <th className="py-3 px-4 text-center">Trạng Thái Khớp</th>
                          <th className="py-3 px-4 text-center">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                        {bankStatements.map((stmt) => (
                          <tr key={stmt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3.5 px-4 font-mono font-semibold text-xs text-blue-600 dark:text-blue-400">
                              {stmt.transactionCode}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                              {new Date(stmt.transactionDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 text-xs font-medium">{stmt.description}</td>
                            <td
                              className={`py-3.5 px-4 font-mono tabular-nums text-right font-bold ${
                                stmt.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {stmt.type === 'CREDIT' ? '+' : '-'}
                              {(Number(stmt.amount) || 0).toLocaleString('vi-VN')} VNĐ
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {stmt.status === 'MATCHED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" /> Đã khớp
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                                  <Clock className="w-3 h-3" /> Chưa khớp
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {stmt.status !== 'MATCHED' && (
                                <button
                                  onClick={() => handleReconcileStatement(stmt.id)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition"
                                >
                                  Khớp Lệnh
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CASH FLOW FORECAST */}
            {activeTab === 'cashflow_forecast' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Mô Hình Dự Báo Dòng Tiền 7 - 30 - 90 Ngày
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    Phân tích tự động dựa trên hạn thanh toán Hóa đơn Phải Thu AR (Bán hàng) & Hóa đơn Phải Trả AP (Nhà cung cấp).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Kỳ Ngắn Hạn (7 Ngày)</span>
                      <p className="text-2xl font-black font-mono tabular-nums text-blue-900 dark:text-blue-100 mt-2">
                        +{((forecastData?.days7 || 245000000) / 1000000).toLocaleString('vi-VN')} Triệu
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        Dự kiến thu AR: +350M VNĐ | Dự kiến chi AP: -105M VNĐ
                      </p>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Kỳ Trung Hạn (30 Ngày)</span>
                      <p className="text-2xl font-black font-mono tabular-nums text-emerald-900 dark:text-emerald-100 mt-2">
                        +{((forecastData?.days30 || 880000000) / 1000000).toLocaleString('vi-VN')} Triệu
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                        Đảm bảo thanh khoản chi trả kỳ lương & công nợ nhà cung cấp.
                      </p>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Kỳ Dài Hạn (90 Ngày)</span>
                      <p className="text-2xl font-black font-mono tabular-nums text-purple-900 dark:text-purple-100 mt-2">
                        +{((forecastData?.days90 || 2150000000) / 1000000000).toFixed(2)} Tỷ VNĐ
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                        Dòng tiền tự do (Free Cash Flow) thặng dư đáp ứng kế hoạch mở rộng R&D.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL 1: CREATE NEW VOUCHER (PHIẾU THU / PHIẾU CHI 01-TT & 02-TT) */}
      {isNewVoucherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Lập Chứng Từ Kế Toán Thu / Chi Chuẩn BTC
              </h3>
              <button onClick={() => setIsNewVoucherModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Loại Phiếu Chứng Từ</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleVoucherCategoryChange('131_CUSTOMER_RECEIPT', 'RECEIPT')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition ${
                      newVoucherForm.voucherType === 'RECEIPT'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Phiếu Thu (Mẫu 01-TT)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoucherCategoryChange('331_SUPPLIER_PAYMENT', 'PAYMENT')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition ${
                      newVoucherForm.voucherType === 'PAYMENT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Phiếu Chi (Mẫu 02-TT)
                  </button>
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Khoản Mục Nghiệp Vụ</label>
                <select
                  value={newVoucherForm.voucherCategory}
                  onChange={(e) =>
                    handleVoucherCategoryChange(e.target.value, newVoucherForm.voucherType as 'RECEIPT' | 'PAYMENT')
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {newVoucherForm.voucherType === 'RECEIPT' ? (
                    <>
                      <option value="131_CUSTOMER_RECEIPT">Thu tiền bán hàng / Công nợ khách hàng (TK 131)</option>
                      <option value="511_SALES_REVENUE">Thu tiền mặt trực tiếp bán lẻ (TK 511)</option>
                      <option value="141_ADVANCE_REFUND">Thu hoàn ứng nhân viên (TK 141)</option>
                      <option value="OTHER_RECEIPT">Thu nhập khác (TK 711)</option>
                    </>
                  ) : (
                    <>
                      <option value="331_SUPPLIER_PAYMENT">Thanh toán công nợ Nhà cung cấp (TK 331)</option>
                      <option value="M14_COMMISSION">Chi trả hoa hồng bán hàng M14 (TK 3388)</option>
                      <option value="M15_RMA">Hoàn tiền khách hàng đổi trả hàng M15 (TK 3388)</option>
                      <option value="M28_PAYROLL">Chi trả lương nhân viên M28 (TK 3341)</option>
                      <option value="141_ADVANCE">Tạm ứng tiền công tác / mua hàng (TK 141)</option>
                      <option value="642_OPEX">Chi phí quản lý doanh nghiệp & Dịch vụ mua ngoài (TK 642)</option>
                      <option value="OTHER_PAYMENT">Chi phí hoạt động khác (TK 811)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Partner Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {newVoucherForm.voucherType === 'RECEIPT' ? 'Họ tên / Đơn vị nộp tiền' : 'Họ tên / Đơn vị nhận tiền'}
                </label>
                <input
                  type="text"
                  required
                  value={newVoucherForm.partnerName}
                  onChange={(e) => setNewVoucherForm((p) => ({ ...p, partnerName: e.target.value }))}
                  placeholder="e.g. Công ty Cổ phần MISA / Nguyễn Văn A"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Amount & Account */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CurrencyInput
                    label="Số Tiền (VNĐ)"
                    value={newVoucherForm.amount}
                    onChange={(val) => setNewVoucherForm((p) => ({ ...p, amount: val.toString() }))}
                    placeholder="VD: 100.000.000"
                    required
                    showBadge={true}
                    showPresets={true}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tài Khoản / Quỹ Tiền</label>
                  <select
                    value={newVoucherForm.bankAccountId}
                    onChange={(e) => setNewVoucherForm((p) => ({ ...p, bankAccountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    {bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bankName} (Dư: {(Number(a.bookBalance) || 0).toLocaleString('vi-VN')} đ)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Overdraft Warning Banner */}
              {isCreateOverdraft && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Cảnh báo thiếu hụt số dư quỹ:</strong> Số tiền chi (
                    {Number(newVoucherForm.amount).toLocaleString('vi-VN')} VNĐ) vượt quá số dư khả dụng hiện tại của
                    tài khoản ({Number(selectedCreateAccount?.bookBalance || 0).toLocaleString('vi-VN')} VNĐ). Cần CFO
                    phê duyệt vượt hạn mức hoặc điều chuyển vốn trước khi xuất quỹ.
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Lý Do Thu / Chi</label>
                <textarea
                  rows={2}
                  value={newVoucherForm.reason}
                  onChange={(e) => setNewVoucherForm((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Diễn giải nội dung chứng từ thu chi..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Double-Entry GL Preview */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tài Khoản Nợ (Debit)</label>
                  <input
                    type="text"
                    value={newVoucherForm.debitAccount}
                    onChange={(e) => setNewVoucherForm((p) => ({ ...p, debitAccount: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tài Khoản Có (Credit)</label>
                  <input
                    type="text"
                    value={newVoucherForm.creditAccount}
                    onChange={(e) => setNewVoucherForm((p) => ({ ...p, creditAccount: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewVoucherModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  Tạo & Chuyển Duyệt CFO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPROVAL CONFIRMATION & OVERDRAFT GUARD */}
      {approvingVoucher && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Ký Duyệt & Ghi Sổ Cái GL (CFO Check)
              </h3>
              <button onClick={() => setApprovingVoucher(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Mã chứng từ:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{approvingVoucher.voucherCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Loại phiếu:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {approvingVoucher.voucherType === 'RECEIPT' ? 'Phiếu Thu (01-TT)' : 'Phiếu Chi (02-TT)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Số tiền:</span>
                  <span
                    className={`font-mono font-black text-sm ${
                      approvingVoucher.voucherType === 'RECEIPT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {(Number(approvingVoucher.amount) || 0).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tài khoản/Quỹ:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{approvingAccount?.bankName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Số dư hiện tại:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {(Number(approvingAccount?.bookBalance) || 0).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>

              {/* Overdraft alert in approval */}
              {isApprovalOverdraft && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    CẢNH BÁO: CHI VƯỢT HẠN MỨC SỐ DƯ QUỸ
                  </div>
                  <p className="text-[11px]">
                    Tài khoản không đủ số dư để thực hiện chi {(Number(approvingVoucher.amount) || 0).toLocaleString('vi-VN')} VNĐ.
                  </p>
                  <label className="flex items-center gap-2 mt-2 pt-2 border-t border-rose-200 dark:border-rose-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowOverdraftOverride}
                      onChange={(e) => setAllowOverdraftOverride(e.target.checked)}
                      className="rounded border-rose-400 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-semibold text-rose-900 dark:text-rose-200">CFO xác nhận phê duyệt chi thấu chi (Overdraft)</span>
                  </label>
                </div>
              )}

              <p className="text-slate-500 dark:text-slate-400 text-[11px] italic">
                * Khi phê duyệt, hệ thống sẽ cập nhật số dư tức thời, chuyển trạng thái APPROVED, tự động ghi bút toán Sổ cái GL M30 và lưu log kiểm toán M02.
              </p>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApprovingVoucher(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  disabled={isApprovalOverdraft && !allowOverdraftOverride}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm transition"
                >
                  Xác Nhận Ký Duyệt (Post GL)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INTERNAL TRANSFER */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                Lệnh Điều Chuyển Vốn Nội Bộ
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tài Khoản Trích Xuất (Nguồn)</label>
                <select
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm((p) => ({ ...p, fromAccountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} (Dư: {(Number(a.bookBalance) || 0).toLocaleString('vi-VN')} đ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tài Khoản Đích (Thụ Hưởng)</label>
                <select
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm((p) => ({ ...p, toAccountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} ({a.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <CurrencyInput
                label="Số Tiền Điều Chuyển (VNĐ)"
                value={transferForm.amount}
                onChange={(val) => setTransferForm((p) => ({ ...p, amount: val.toString() }))}
                placeholder="VD: 50.000.000"
                required
                showBadge={true}
                showPresets={true}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Lý Do / Mục Đích Điều Chuyển</label>
                <input
                  type="text"
                  required
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm((p) => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  Thực Hiện Điều Chuyển
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VIETQR GENERATOR */}
      {isVietQrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-center">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                Mã Thanh Toán Động VietQR NAPAS 247
              </h3>
              <button onClick={() => setIsVietQrModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                <img
                  src={`https://api.vietqr.io/image/970422-0988776655-compact2.jpg?amount=${vietQrForm.amount}&addInfo=${encodeURIComponent(vietQrForm.memo)}&accountName=NEXUSSYNC%20CORP`}
                  alt="VietQR"
                  className="w-56 h-56 object-contain rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm"
                />
                <p className="mt-3 font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {Number(vietQrForm.amount).toLocaleString('vi-VN')} VNĐ
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{vietQrForm.memo}</p>
              </div>

              <button
                onClick={() => setIsVietQrModalOpen(false)}
                className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold rounded-lg transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: VOUCHER DETAIL */}
      {selectedVoucherDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Chi Tiết {selectedVoucherDetail.voucherType === 'RECEIPT' ? 'Phiếu Thu' : 'Phiếu Chi'} [
                {selectedVoucherDetail.voucherCode}]
              </h3>
              <button onClick={() => setSelectedVoucherDetail(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Đối tác:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedVoucherDetail.partnerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Số tiền:</span>
                <span className="font-black font-mono tabular-nums text-sm text-blue-600 dark:text-blue-400">
                  {(Number(selectedVoucherDetail.amount) || 0).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Tài khoản/Quỹ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedVoucherDetail.bankName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Định khoản GL:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{selectedVoucherDetail.accountingEntry}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Người lập:</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedVoucherDetail.createdBy || 'Kế toán viên'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Người duyệt (CFO):</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedVoucherDetail.approvedBy || 'Chờ duyệt'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Lý do thu chi:</span>
                <p className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 text-[11px]">{selectedVoucherDetail.reason}</p>
              </div>

              <div className="pt-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    const vId = selectedVoucherDetail.id;
                    setSelectedVoucherDetail(null);
                    setPrintVoucherId(vId);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In Mẫu BTC (01/02-TT)
                </button>
                <button
                  onClick={() => setSelectedVoucherDetail(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CANCEL VOUCHER CONFIRMATION (Rule #19 Compliant) */}
      {cancelModalState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-rose-950/80 text-white px-6 py-4 flex justify-between items-center border-b border-rose-900/50">
              <h3 className="font-bold text-base flex items-center gap-2 text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Hủy Chứng Từ Kế Toán [{cancelModalState.voucherCode}]
              </h3>
              <button
                onClick={() => setCancelModalState((p) => ({ ...p, isOpen: false }))}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg text-rose-800 dark:text-rose-300 space-y-1">
                <p className="font-semibold">Hành động này không thể hoàn tác.</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400">
                  Chứng từ sẽ chuyển sang trạng thái ĐÃ HỦY và phát sinh bản ghi kiểm toán M02 (Audit Trail) bất biến.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lý do hủy chứng từ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelModalState.reason}
                  onChange={(e) => setCancelModalState((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Nhập chi tiết lý do hủy bỏ chứng từ kế toán..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={cancelModalState.isSubmitting}
                  onClick={() => setCancelModalState((p) => ({ ...p, isOpen: false }))}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition"
                >
                  Bỏ Qua
                </button>
                <button
                  type="button"
                  disabled={cancelModalState.isSubmitting || !cancelModalState.reason.trim()}
                  onClick={handleConfirmCancelVoucher}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  {cancelModalState.isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Xác Nhận Hủy Chứng Từ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGULATORY VOUCHER PRINT MODAL (BTC 01-TT / 02-TT) */}
      {printVoucherId && (
        <RegulatoryVoucherPrintModal
          voucherId={printVoucherId}
          onClose={() => setPrintVoucherId(null)}
          onNotify={onNotify}
        />
      )}

      {/* BANK HOST-TO-HOST CORPORATE BANKING MODAL (Phase 3) */}
      <M32BankHostToHostModal
        isOpen={isH2hModalOpen}
        onClose={() => setIsH2hModalOpen(false)}
        onNotify={onNotify}
      />
    </div>
  );
};
