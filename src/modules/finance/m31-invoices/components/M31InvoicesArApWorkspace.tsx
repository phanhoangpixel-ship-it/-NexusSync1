import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';
import { MoneyCell } from '../../../../components/common/MoneyCell';
import { QtyCell } from '../../../../components/common/QtyCell';
import {
  Receipt,
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
  Building,
  Calendar,
  ShieldCheck,
  HelpCircle,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  CreditCard,
  PieChart,
  CheckSquare,
  History,
  Lock,
  Percent,
  Sparkles,
  QrCode,
  Zap,
  BrainCircuit,
  Copy,
  Check,
  Scale,
  Calculator,
  BookOpen,
  Landmark,
  Layers,
  Activity,
  ArrowLeftRight,
  FileCheck2,
  AlertTriangle,
  Eye,
  ShieldAlert,
  FileCode,
  FileX,
  Printer,
  FileSpreadsheet,
  Archive,
  FolderArchive,
  HardDrive,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { TablePagination } from '../../../../components/common/TablePagination';
import { BulkActionBar } from '../../../../components/common/BulkActionBar';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { downloadInvoiceArApReportPdf, downloadVatElectronicInvoicePdf } from '../../../../utils/pdfExporter';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from '../../../../components/shell/DomainWorkspaceShell';
import { RedirectPanel } from '../../../../components/common/RedirectPanel';
import { DeepLinkBanner } from '../../../../components/common/DeepLinkBanner';
import { M31InvoicesArApWorkspaceProps } from './types';

export const M31InvoicesArApWorkspace: React.FC<M31InvoicesArApWorkspaceProps> = ({
  onSelectEntity,
  onNotify = () => {},
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  // Confirm Dialog State (Rule #19 WCAG AA / No window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<any>(null);
  // 6 Main Sub-Module Workspace Tabs according to Finance & Accounting Architecture
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'ar' | 'ap' | 'vat' | 'payments' | 'gl' | 'reports'>('M31', 'ar');

  // Tabs scrolling container ref & state
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

  // Core Data Collections
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [debitNotes, setDebitNotes] = useState<any[]>([]);
  const [accountingEvents, setAccountingEvents] = useState<any[]>([]);
  const [vatSummary, setVatSummary] = useState<any>(null);
  const [agingData, setAgingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [vatStatusFilter, setVatStatusFilter] = useState<string>('ALL');

  // Wave 1 UI/UX Standardization — TablePagination [10,15,25,50,100] & Bulk Actions
  const [arPage, setArPage] = useState<number>(1);
  const [arPageSize, setArPageSize] = useState<number>(15);
  const [apPage, setApPage] = useState<number>(1);
  const [apPageSize, setApPageSize] = useState<number>(15);
  const [vatPage, setVatPage] = useState<number>(1);
  const [vatPageSize, setVatPageSize] = useState<number>(15);

  const [selectedArIds, setSelectedArIds] = useState<number[]>([]);
  const [selectedApIds, setSelectedApIds] = useState<number[]>([]);
  const [selectedVatIds, setSelectedVatIds] = useState<number[]>([]);

  // Modals
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState<boolean>(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    invoiceNumber: '',
    type: 'AR',
    customerName: '',
    taxCode: '',
    address: '',
    billingEmail: '',
    totalAmount: '',
    discount: '0',
    taxRate: '10',
    paymentMethod: 'BANK_TRANSFER',
    dueDate: '',
  });

  // Credit Note Modal (RMA Return Linkage)
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState<boolean>(false);
  const [creditNoteForm, setCreditNoteForm] = useState({
    originalInvoiceNumber: '',
    customerName: '',
    amount: '',
    vatAmount: '',
    rmaCode: '',
    reason: '',
  });

  // Payment Settlement Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '',
    paymentMethod: 'BANK_TRANSFER',
    referenceNo: '',
    notes: '',
  });

  // 3-Way Match Modal (M08 PO ↔ M17 GRN ↔ M31 AP Invoice)
  const [isThreeWayMatchModalOpen, setIsThreeWayMatchModalOpen] = useState<boolean>(false);
  const [selectedInvoiceForMatch, setSelectedInvoiceForMatch] = useState<any | null>(null);
  const [threeWayMatchDossier, setThreeWayMatchDossier] = useState<any | null>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState<boolean>(false);
  const [matchTolerance, setMatchTolerance] = useState<number>(2);
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [availablePos, setAvailablePos] = useState<any[]>([]);

  // Credit Note Offset Modal (M15 RMA Returns)
  const [isOffsetCreditNoteModalOpen, setIsOffsetCreditNoteModalOpen] = useState<boolean>(false);
  const [selectedInvoiceForOffset, setSelectedInvoiceForOffset] = useState<any | null>(null);
  const [availableCreditNotesForOffset, setAvailableCreditNotesForOffset] = useState<any[]>([]);
  const [offsetForm, setOffsetForm] = useState({
    creditNoteNumber: '',
    rmaCode: '',
    offsetAmount: '',
    notes: '',
  });
  const [isOffsetLoading, setIsOffsetLoading] = useState<boolean>(false);

  // Selected Invoice Detail Modal
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Retry / Fix Error VAT Modal
  const [isRetryVatModalOpen, setIsRetryVatModalOpen] = useState<boolean>(false);
  const [selectedVatErrorInvoice, setSelectedVatErrorInvoice] = useState<any | null>(null);
  const [retryVatForm, setRetryVatForm] = useState({
    taxCode: '',
    customerName: '',
    address: '',
    errorReason: '',
  });

  // AI OCR State
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [ocrInputText, setOcrInputText] = useState<string>(
    `CÔNG TY TNHH THIẾT BỊ CÔNG NGHỆ VIỆT NAM\nMST: 0109988776\nĐịa chỉ: Số 88 Lê Văn Lương, Hà Nội\nSố hóa đơn: HD-AP-2026-991\nNgày lập: 28/08/2026\nItem: Máy chủ Dell PowerEdge R750 x 2 cái = 120,000,000 VNĐ\nThuế GTGT 10%: 12,000,000 VNĐ\nTổng tiền thanh toán: 132,000,000 VNĐ`
  );
  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  // Dunning & VietQR State
  const [isDunningModalOpen, setIsDunningModalOpen] = useState<boolean>(false);
  const [selectedDunningInvoice, setSelectedDunningInvoice] = useState<any | null>(null);
  const [dunningData, setDunningData] = useState<any | null>(null);
  const [isDunningLoading, setIsDunningLoading] = useState<boolean>(false);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);

  // eTax CQT Submission State
  const [isEtaxModalOpen, setIsEtaxModalOpen] = useState<boolean>(false);
  const [etaxResult, setEtaxResult] = useState<any | null>(null);
  const [isEtaxLoading, setIsEtaxLoading] = useState<boolean>(false);

  // Tax Engine Test Workbench
  const [taxCalcForm, setTaxCalcForm] = useState({
    amount: '100000000',
    vatCode: 'V10',
    itemType: 'STANDARD',
    isExempt: false,
  });
  const [taxCalcResult, setTaxCalcResult] = useState<any | null>(null);
  const [isTaxCalcLoading, setIsTaxCalcLoading] = useState<boolean>(false);

  // Decree 123/2020 Cancellation Protocol State
  const [selectedCancellationProtocol, setSelectedCancellationProtocol] = useState<any | null>(null);
  const [isCancellationProtocolModalOpen, setIsCancellationProtocolModalOpen] = useState<boolean>(false);
  const [isCancellationFormModalOpen, setIsCancellationFormModalOpen] = useState<boolean>(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<any | null>(null);
  const [cancelForm, setCancelForm] = useState({
    reason: 'Sai sót đơn giá và thông tin người mua theo thỏa thuận hai bên (Nghị định 123/2020/NĐ-CP)',
    protocolNumber: '',
    buyerRepresentative: '',
    sellerRepresentative: 'Trần Văn Kế Toán (KTT)',
    sendNotice04ToCqt: true,
  });
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Central VAT Tax Report (Circular 80/2021/TT-BTC Mẫu 01/GTGT)
  const [vatReportPeriod, setVatReportPeriod] = useState<string>('Q3/2026');
  const [carriedForwardInput, setCarriedForwardInput] = useState<string>('0');
  const [fullTaxReportData, setFullTaxReportData] = useState<any | null>(null);
  const [isTaxReportLoading, setIsTaxReportLoading] = useState<boolean>(false);

  // Dunning & VietQR Engine Options
  const [dunningReminderLevel, setDunningReminderLevel] = useState<number>(1);
  const [dunningInterestRate, setDunningInterestRate] = useState<string>('10.5');
  const [copiedLetter, setCopiedLetter] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Dynamic Early Payment Discount State
  const [earlyDiscounts, setEarlyDiscounts] = useState<any>(null);
  const [isDiscountLoading, setIsDiscountLoading] = useState<boolean>(false);

  // M29 DMS Vault & M02 Audit Log State (Phase 10)
  const [selectedDmsInvoice, setSelectedDmsInvoice] = useState<any | null>(null);
  const [dmsVaultData, setDmsVaultData] = useState<any | null>(null);
  const [isDmsModalOpen, setIsDmsModalOpen] = useState<boolean>(false);
  const [isDmsLoading, setIsDmsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchInvoicesAndData();
    fetchEarlyDiscountSuggestions();
    fetchTaxReport('Q3/2026', '0');
  }, []);

  const fetchTaxReport = async (period = vatReportPeriod, carriedForward = carriedForwardInput) => {
    setIsTaxReportLoading(true);
    try {
      const res = await fetch(`/api/invoices/vat-declaration/form01?period=${encodeURIComponent(period)}&carriedForward=${carriedForward}`);
      if (res.ok) {
        const data = await res.json();
        setFullTaxReportData(data);
      }
    } catch (err: any) {
      console.error('Failed to load full tax report:', err);
    } finally {
      setIsTaxReportLoading(false);
    }
  };

  const fetchInvoicesAndData = async () => {
    setIsLoading(true);
    try {
      const [invRes, payRes, vatRes, agingRes, cnRes, dnRes, eventRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/payments'),
        fetch('/api/invoices/vat-summary'),
        fetch('/api/invoices/aging-report'),
        fetch('/api/finance/ar/credit-notes'),
        fetch('/api/finance/ap/debit-notes'),
        fetch('/api/finance/accounting-events'),
      ]);

      const invData = await invRes.json();
      const payData = await payRes.json();
      const vatData = await vatRes.json();
      const aging = await agingRes.json();
      const cnData = await cnRes.json();
      const dnData = await dnRes.json();
      const eventData = await eventRes.json();

      if (Array.isArray(invData)) setInvoices(invData);
      if (Array.isArray(payData)) setPayments(payData);
      if (vatData) setVatSummary(vatData);
      if (aging) setAgingData(aging);
      if (Array.isArray(cnData)) setCreditNotes(cnData);
      if (Array.isArray(dnData)) setDebitNotes(dnData);
      if (Array.isArray(eventData)) setAccountingEvents(eventData);
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải dữ liệu Finance & Accounting', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEarlyDiscountSuggestions = async () => {
    setIsDiscountLoading(true);
    try {
      const res = await fetch('/api/invoices/early-discount-suggestions');
      const data = await res.json();
      if (data.success) {
        setEarlyDiscounts(data);
      }
    } catch (err) {
      console.error('Lỗi tải gợi ý chiết khấu:', err);
    } finally {
      setIsDiscountLoading(false);
    }
  };

  // Handlers
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceForm.invoiceNumber || !newInvoiceForm.customerName || !newInvoiceForm.totalAmount) {
      onNotify('warning', 'Chưa nhập đủ thông tin', 'Vui lòng điền mã hóa đơn, tên đối tác và tổng số tiền.');
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoiceForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi hệ thống khi tạo hóa đơn');
      }

      const created = await res.json();
      onNotify('success', 'Tạo Hóa Đơn Thành Công', `Đã ghi nhận Hóa đơn [${created.invoiceNumber || newInvoiceForm.invoiceNumber}] và tự động hạch toán GL.`);
      setIsNewInvoiceModalOpen(false);
      setNewInvoiceForm({
        invoiceNumber: '',
        type: 'AR',
        customerName: '',
        taxCode: '',
        address: '',
        billingEmail: '',
        totalAmount: '',
        discount: '0',
        taxRate: '10',
        paymentMethod: 'BANK_TRANSFER',
        dueDate: '',
      });
      fetchInvoicesAndData();
      fetchEarlyDiscountSuggestions();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo hóa đơn', err.message);
    }
  };

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNoteForm.originalInvoiceNumber || !creditNoteForm.customerName || !creditNoteForm.amount) {
      onNotify('warning', 'Chưa nhập đủ thông tin', 'Vui lòng điền hóa đơn gốc, đối tác và số tiền giảm.');
      return;
    }

    try {
      const res = await fetch('/api/finance/ar/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creditNoteForm),
      });

      const data = await res.json();
      if (data.success) {
        onNotify('success', 'Khởi Tạo Credit Note Thành Công', data.message);
        setIsCreditNoteModalOpen(false);
        setCreditNoteForm({
          originalInvoiceNumber: '',
          customerName: '',
          amount: '',
          vatAmount: '',
          rmaCode: '',
          reason: '',
        });
        fetchInvoicesAndData();
      } else {
        throw new Error(data.error || 'Lỗi khởi tạo Credit Note');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi Credit Note', err.message);
    }
  };

  const handleTestTaxEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTaxCalcLoading(true);
    try {
      const res = await fetch('/api/finance/tax-engine/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxCalcForm),
      });
      const data = await res.json();
      if (data.success) {
        setTaxCalcResult(data);
        onNotify('info', 'Tax Engine Authority Calculated', `Thuế GTGT: ${data.vatAmount.toLocaleString('vi-VN')} VNĐ (${data.vatRateText})`);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi Tax Engine', err.message);
    } finally {
      setIsTaxCalcLoading(false);
    }
  };

  const handleRunOcr = async () => {
    if (!ocrInputText.trim()) {
      onNotify('warning', 'Chưa nhập văn bản', 'Vui lòng dán nội dung hóa đơn điện tử.');
      return;
    }
    setIsOcrLoading(true);
    try {
      const res = await fetch('/api/invoices/ocr-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceText: ocrInputText }),
      });
      const data = await res.json();
      if (data.success) {
        setOcrResult(data);
        onNotify('success', 'AI OCR Phân Tích Thành Công', `${data.message} (${data.aiEngine})`);
      } else {
        throw new Error(data.error || 'Không thể trích xuất hóa đơn.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi AI OCR Parser', err.message);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleApplyOcrToForm = () => {
    if (!ocrResult || !ocrResult.extractedData) return;
    const ex = ocrResult.extractedData;
    setNewInvoiceForm({
      invoiceNumber: ex.invoiceNumber || `HD-AP-${Date.now().toString().slice(-6)}`,
      type: 'AP',
      customerName: ex.partnerName || '',
      taxCode: ex.partnerTaxCode || '',
      address: ex.partnerAddress || 'Hà Nội, Việt Nam',
      billingEmail: 'ap-billing@partner.com',
      totalAmount: String(ex.subtotal || 0),
      discount: '0',
      taxRate: String(ex.vatRate || 10),
      paymentMethod: 'BANK_TRANSFER',
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    });
    setIsOcrModalOpen(false);
    setIsNewInvoiceModalOpen(true);
    onNotify('info', 'Đã điền tự động hóa đơn', 'Dữ liệu trích xuất từ AI OCR đã được điền vào biểu mẫu.');
  };

  const handleOpenDunningModal = async (inv: any, level = dunningReminderLevel, interest = dunningInterestRate) => {
    setSelectedDunningInvoice(inv);
    setDunningReminderLevel(level);
    setDunningInterestRate(interest);
    setIsDunningLoading(true);
    setIsDunningModalOpen(true);
    setCopiedLetter(false);
    setCopiedPayload(false);
    setCopiedMemo(false);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/dunning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderLevel: level,
          interestRate: Number(interest),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDunningData(data);
      } else {
        throw new Error(data.error || 'Lỗi tạo dữ liệu VietQR');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo nhắc nợ VietQR', err.message);
    } finally {
      setIsDunningLoading(false);
    }
  };

  const handleDownloadTaxXml = () => {
    if (!fullTaxReportData?.xmlContent) return;
    const blob = new Blob([fullTaxReportData.xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ToKhaiThueGTGT_01_${(fullTaxReportData.period || 'Q3_2026').replace(/[\/\\]/g, '_')}_TT80.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify('success', 'Đã Tải Tệp XML Tờ Khai', 'Tệp XML Mẫu 01/GTGT theo Thông tư 80/2021/TT-BTC sẵn sàng gửi cơ quan thuế.');
  };

  const handleOpenEtaxModal = () => {
    setEtaxResult(null);
    setIsEtaxModalOpen(true);
  };

  const handleSubmitEtax = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Ký Số HSM & Nộp CQT',
      message: `Bạn có chắc chắn muốn ký số chứng thư số Viettel-CA Cloud HSM và truyền tệp XML Tờ khai thuế GTGT Mẫu 01/GTGT kỳ ${vatReportPeriod} trực tiếp đến Cổng thông tin eTax của Tổng cục Thuế?`,
      variant: 'primary',
      confirmText: 'Ký Số & Nộp eTax',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsEtaxLoading(true);
        try {
          const res = await fetch('/api/invoices/etax-submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taxPeriod: vatReportPeriod, declareType: 'CHINH_THUC' }),
          });
          const data = await res.json();
          if (data.success) {
            setEtaxResult(data);
            onNotify('success', 'Nộp Tờ Khai Thuế eTax Thành Công', `Mã giao dịch CQT: ${data.cqtReceiptId}`);
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi truyền nhận eTax CQT', err.message);
        } finally {
          setIsEtaxLoading(false);
        }
      },
    });
  };

  const handleOpenPaymentModal = (invoice: any) => {
    setSelectedInvoiceForPay(invoice);
    const remAmt = invoice.remainingAmount !== undefined ? invoice.remainingAmount : (invoice.finalAmount - (invoice.paidAmount || 0));
    setPaymentForm({
      amountPaid: String(remAmt > 0 ? remAmt : invoice.finalAmount || 0),
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: `REF-PAY-${Date.now().toString().slice(-6)}`,
      notes: `Gạch nợ thanh toán cho Hóa đơn ${invoice.invoiceNumber}`,
    });
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;

    const payAmt = Number(paymentForm.amountPaid) || 0;
    if (payAmt <= 0) {
      onNotify('warning', 'Số tiền không hợp lệ', 'Vui lòng nhập số tiền thanh toán lớn hơn 0');
      return;
    }

    const remAmt = selectedInvoiceForPay.remainingAmount !== undefined 
      ? selectedInvoiceForPay.remainingAmount 
      : (selectedInvoiceForPay.finalAmount - (selectedInvoiceForPay.paidAmount || 0));
    if (payAmt > remAmt && remAmt > 0) {
      onNotify('warning', 'Vượt quá dư nợ', `Số tiền thanh toán (${payAmt.toLocaleString('vi-VN')} VNĐ) không được vượt quá số dư còn lại (${remAmt.toLocaleString('vi-VN')} VNĐ)`);
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${selectedInvoiceForPay.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi gạch nợ hóa đơn');
      }

      const data = await res.json();
      onNotify('success', 'Gạch Nợ Thành Công', data.message);
      setIsPaymentModalOpen(false);
      fetchInvoicesAndData();
      fetchEarlyDiscountSuggestions();
    } catch (err: any) {
      onNotify('danger', 'Lỗi gạch nợ', err.message);
    }
  };

  // 3-Way Match Handlers (M08 PO ↔ M17 GRN ↔ M31 AP Invoice)
  const handleOpenThreeWayMatch = async (invoice: any) => {
    setSelectedInvoiceForMatch(invoice);
    setIsThreeWayMatchModalOpen(true);
    setIsMatchingLoading(true);
    try {
      // 1. Fetch available POs
      const poRes = await fetch('/api/purchase-orders');
      if (poRes.ok) {
        const poData = await poRes.json();
        setAvailablePos(Array.isArray(poData) ? poData : []);
      }

      // 2. Fetch match dossier
      const matchRes = await fetch(`/api/invoices/${invoice.id}/3way-match?tolerancePercent=${matchTolerance}`);
      if (matchRes.ok) {
        const dossier = await matchRes.json();
        setThreeWayMatchDossier(dossier);
        if (dossier.poCode && dossier.poCode !== 'N/A') {
          setSelectedPoId(dossier.poCode);
        }
      }
    } catch (err: any) {
      onNotify('warning', 'Lưu ý đối soát', err.message);
    } finally {
      setIsMatchingLoading(false);
    }
  };

  const handleExecuteThreeWayMatch = async (overrideTolerance?: number, overridePoId?: string) => {
    if (!selectedInvoiceForMatch) return;
    setIsMatchingLoading(true);
    const tol = overrideTolerance !== undefined ? overrideTolerance : matchTolerance;
    const po = overridePoId !== undefined ? overridePoId : selectedPoId;
    try {
      const res = await fetch(`/api/invoices/${selectedInvoiceForMatch.id}/3way-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poId: po || undefined,
          tolerancePercent: tol,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi đối soát 3 chiều');
      }
      setThreeWayMatchDossier(data);
      if (data.isApprovedForPayment) {
        onNotify('success', 'Đối Soát 3 Chiều Hợp Lệ', data.message);
      } else {
        onNotify('warning', 'Phát Hiện Chênh Lệch Đối Soát', data.message);
      }
      fetchInvoicesAndData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi đối soát', err.message);
    } finally {
      setIsMatchingLoading(false);
    }
  };

  // Credit Note Offset Handlers (M15 RMA Returns)
  const handleOpenOffsetCreditNoteModal = async (invoice: any) => {
    setSelectedInvoiceForOffset(invoice);
    setIsOffsetCreditNoteModalOpen(true);
    const remAmt = invoice.remainingAmount !== undefined ? invoice.remainingAmount : (invoice.finalAmount - (invoice.paidAmount || 0));
    setOffsetForm({
      creditNoteNumber: '',
      rmaCode: '',
      offsetAmount: String(remAmt > 0 ? remAmt : 0),
      notes: `Cấn trừ Credit Note cho Hóa đơn AR ${invoice.invoiceNumber}`,
    });
    try {
      const url = invoice.customerId 
        ? `/api/invoices/credit-notes/available?customerId=${invoice.customerId}`
        : `/api/invoices/credit-notes/available`;
      const res = await fetch(url);
      if (res.ok) {
        const list = await res.json();
        setAvailableCreditNotesForOffset(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      setAvailableCreditNotesForOffset([]);
    }
  };

  const handleProcessOffsetCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForOffset) return;
    const offsetAmt = Number(offsetForm.offsetAmount) || 0;
    if (offsetAmt <= 0) {
      onNotify('warning', 'Số tiền không hợp lệ', 'Số tiền cấn trừ phải lớn hơn 0');
      return;
    }
    const remAmt = selectedInvoiceForOffset.remainingAmount !== undefined 
      ? selectedInvoiceForOffset.remainingAmount 
      : (selectedInvoiceForOffset.finalAmount - (selectedInvoiceForOffset.paidAmount || 0));
    if (offsetAmt > remAmt && remAmt > 0) {
      onNotify('warning', 'Vượt quá dư nợ', `Số tiền cấn trừ (${offsetAmt.toLocaleString('vi-VN')} VNĐ) không được vượt quá số dư công nợ (${remAmt.toLocaleString('vi-VN')} VNĐ)`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Cấn Trừ Công Nợ Bằng Credit Note',
      message: `Bạn có chắc chắn muốn cấn trừ số tiền ${offsetAmt.toLocaleString('vi-VN')} VNĐ từ Credit Note cho hóa đơn [${selectedInvoiceForOffset.invoiceNumber}]? Nghiệp vụ này sẽ tự động giảm trừ công nợ phải thu (TK 131).`,
      variant: 'primary',
      confirmText: 'Xác Nhận Cấn Trừ',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsOffsetLoading(true);
        try {
          const res = await fetch(`/api/invoices/${selectedInvoiceForOffset.id}/offset-credit-note`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creditNoteNumber: offsetForm.creditNoteNumber || undefined,
              rmaCode: offsetForm.rmaCode || undefined,
              offsetAmount: offsetAmt,
              notes: offsetForm.notes,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Lỗi cấn trừ Credit Note');
          }
          onNotify('success', 'Cấn Trừ Thành Công', data.message);
          setIsOffsetCreditNoteModalOpen(false);
          fetchInvoicesAndData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi cấn trừ Credit Note', err.message);
        } finally {
          setIsOffsetLoading(false);
        }
      },
    });
  };

  // -------------------------------------------------------------------------
  // M29 DMS Secure Vault & Digital Archival Handlers (Phase 10 & 11)
  // -------------------------------------------------------------------------
  const handleArchiveToDms = (invoice: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Niêm Phong Lưu Trữ M29 Secure Vault',
      message: `Bạn có chắc chắn muốn xuất tệp XML/PDF có chữ ký số HSM của hóa đơn [${invoice.invoiceNumber}] và niêm phong mật mã SHA-256 vào Kho lưu trữ tài liệu M29 DMS với thời hạn bảo quản 10 năm theo Luật Kế toán & Nghị định 123/2020?`,
      variant: 'primary',
      confirmText: 'Niêm Phong M29 Ngay',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsDmsLoading(true);
        try {
          const res = await fetch(`/api/invoices/${invoice.id}/archive-dms`, { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi lưu trữ M29 DMS');
          onNotify('success', 'Đã Lưu Trữ M29 DMS & Ghi Nhận M02', `Hồ sơ ${data.docCode || invoice.invoiceNumber} đã được niêm phong với SHA-256: ${data.sha256Hash?.substring(0, 16)}...`);
          handleViewDmsVault(invoice);
          fetchInvoicesAndData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi niêm phong M29', err.message);
        } finally {
          setIsDmsLoading(false);
        }
      },
    });
  };

  const handleBatchArchiveDms = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Niêm Phong Toàn Bộ Hóa Đơn ISSUED Vào M29 DMS',
      message: 'Hệ thống sẽ quét tất cả hóa đơn đã phát hành (ISSUED), tính toán mã băm mật mã SHA-256 bất biến cho từng chứng từ XML/PDF và lưu trữ vĩnh viễn vào Kho chứng từ số M29, đồng thời ghi log sự kiện BATCH_ARCHIVE_DMS vào M02 Audit Trail. Bạn có muốn tiếp tục?',
      variant: 'primary',
      confirmText: 'Niêm Phong Hàng Loạt',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsDmsLoading(true);
        try {
          const res = await fetch('/api/invoices/batch-archive-dms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi niêm phong hàng loạt M29');
          onNotify('success', 'Niêm Phong M29 Hoàn Tất', data.message);
          fetchInvoicesAndData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi niêm phong hàng loạt', err.message);
        } finally {
          setIsDmsLoading(false);
        }
      },
    });
  };

  const handleViewDmsVault = async (invoice: any) => {
    setSelectedDmsInvoice(invoice);
    setIsDmsLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/dms-vault`);
      const data = await res.json();
      setDmsVaultData(data);
      setIsDmsModalOpen(true);
    } catch (err: any) {
      onNotify('warning', 'M29 DMS Vault', err.message);
    } finally {
      setIsDmsLoading(false);
    }
  };

  const handleDownloadInvoiceXml = (invoice: any) => {
    try {
      const issueDateStr = invoice.issueDate
        ? new Date(invoice.issueDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      const formCode = invoice.formCode || '1';
      const serialNo = invoice.serialNo || invoice.vatSeries || '1C26TAA';
      const invNum = invoice.invoiceNumber || 'INV-2026-AR-001';
      const cqt = invoice.taxAuthorityCode || invoice.cqtCode || 'CQT-2026-V10-98231';
      const total = invoice.totalAmount || 0;
      const tax = invoice.taxAmount || Math.round(total * 0.1);
      const final = invoice.finalAmount || (total + tax);
      const custName = invoice.customerName || invoice.companyName || 'Khách Hàng Doanh Nghiệp';
      const custTax = invoice.taxCode || '0315894231';

      const xmlText = `<?xml version="1.0" encoding="UTF-8"?>
<HDon xmlns="http://hoadondientu.gdt.gov.vn/2020/01/nd123">
  <DLHDon Id="DLHDon_${invoice.id}">
    <TTChung>
      <PBan>2.0.0</PBan>
      <THDon>Hóa đơn giá trị gia tăng</THDon>
      <KHMSHDon>${formCode}</KHMSHDon>
      <KHHDon>${serialNo}</KHHDon>
      <SHDon>${invNum}</SHDon>
      <NLap>${issueDateStr}</NLap>
      <DVTTe>VND</DVTTe>
      <TGia>1.0</TGia>
      <HTTToan>Chuyển khoản / VietQR</HTTToan>
      <MSTTCGP>0108899888</MSTTCGP>
      <MCCQT>${cqt}</MCCQT>
    </TTChung>
    <NDHDon>
      <NBan>
        <Ten>CÔNG TY CỔ PHẦN CÔNG NGHỆ &amp; GIẢI PHÁP NEXUSSYNC ERP</Ten>
        <MST>0108899888</MST>
        <DChi>Tòa nhà Nexus, Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh</DChi>
        <SDThoai>1900-8888-NEXUS</SDThoai>
        <DCTDTu>finance@nexussync.vn</DCTDTu>
        <STKNHang>97042299888888</STKNHang>
        <TNHang>MB Bank - Hội sở Hà Nội</TNHang>
      </NBan>
      <NMua>
        <Ten>${custName.replace(/&/g, '&amp;')}</Ten>
        <MST>${custTax}</MST>
        <DChi>${(invoice.address || 'Hồ Chí Minh, Việt Nam').replace(/&/g, '&amp;')}</DChi>
        <HTTToan>Chuyển khoản</HTTToan>
      </NMua>
      <DSHHDVu>
        <HHDVu>
          <STT>1</STT>
          <TChat>1</TChat>
          <THHDVu>Hàng hóa / Dịch vụ cung cấp theo HĐ ${invNum}</THHDVu>
          <DVTinh>Gói</DVTinh>
          <SLuong>1</SLuong>
          <DGia>${total}</DGia>
          <Tien>${total}</Tien>
          <TSuat>${invoice.taxRate || 10}%</TSuat>
          <TThue>${tax}</TThue>
          <ThTien>${final}</ThTien>
        </HHDVu>
      </DSHHDVu>
      <TToan>
        <TgTCThue>${total}</TgTCThue>
        <TgTThue>${tax}</TgTThue>
        <TgTTTBSo>${final}</TgTTTBSo>
        <TgTTTBChu>Một trăm ba mươi hai triệu đồng chẵn</TgTTTBChu>
      </TToan>
    </NDHDon>
    <DSCKS>
      <KSCN>
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo>
            <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
            <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
          </SignedInfo>
          <SignatureValue>VIETTEL_CA_CLOUD_HSM_SIGNATURE_SHA256_VERIFIED</SignatureValue>
          <KeyInfo>
            <X509Data>
              <X509SubjectName>CN=CONG TY CP CONG NGHE NEXUSSYNC, OID.2.5.4.97=MST:0108899888, C=VN</X509SubjectName>
              <X509IssuerName>CN=Viettel-CA Cloud HSM Sub-CA v3, O=Viettel Telecom, C=VN</X509IssuerName>
            </X509Data>
          </KeyInfo>
        </Signature>
      </KSCN>
    </DSCKS>
  </DLHDon>
</HDon>`;

      const blob = new Blob([xmlText], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HOADON_${invNum}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotify('success', 'Đã tải tệp XML', `Đã tải xuống tệp XML hóa đơn điện tử [${invNum}] chuẩn Nghị định 123/2020.`);
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải XML', err.message);
    }
  };

  const handleIssueVatInvoice = (invoice: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Ký Số Cloud HSM & Phát Hành HĐ VAT',
      message: `Bạn có chắc chắn muốn thực hiện ký số điện tử Cloud HSM và truyền dữ liệu cấp mã Cơ quan Thuế cho hóa đơn [${invoice.invoiceNumber}] với tổng tiền ${formatCurrency(invoice.finalAmount)}? Hóa đơn sau khi phát hành sẽ trở nên bất biến theo Nghị định 123/2020/NĐ-CP.`,
      variant: 'primary',
      confirmText: 'Ký Số & Phát Hành',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/invoices/${invoice.id}/issue`, {
            method: 'POST',
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Lỗi phát hành Hóa đơn Điện tử');
          }

          const data = await res.json();
          onNotify('success', 'Phát Hành HĐ VAT Thành Công', `Đã ký số Cloud HSM & cấp mã CQT [${data.taxAuthorityCode}] cho hóa đơn ${invoice.invoiceNumber}`);
          fetchInvoicesAndData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi Phát Hành HĐ VAT', err.message);
        }
      },
    });
  };

  const handleOpenRetryVatModal = (inv: any) => {
    setSelectedVatErrorInvoice(inv);
    setRetryVatForm({
      taxCode: inv.taxCode || '',
      customerName: inv.customerName || inv.companyName || '',
      address: inv.address || '',
      errorReason: inv.vatErrorReason || inv.rejectionReason || 'CQT từ chối cấp mã: Sai định dạng MST người mua hoặc sai sót tiền thuế GTGT',
    });
    setIsRetryVatModalOpen(true);
  };

  const handleRetryVat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVatErrorInvoice) return;
    try {
      const res = await fetch(`/api/invoices/${selectedVatErrorInvoice.id}/retry-vat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedTaxCode: retryVatForm.taxCode,
          updatedCustomerName: retryVatForm.customerName,
          updatedAddress: retryVatForm.address,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi cấp lại mã CQT');
      }

      const data = await res.json();
      onNotify('success', 'Khắc Phục & Cấp Mã CQT Thành Công', `Hóa đơn [${selectedVatErrorInvoice.invoiceNumber}] đã được cấp mã CQT hợp lệ: ${data.taxAuthorityCode}`);
      setIsRetryVatModalOpen(false);
      fetchInvoicesAndData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi cấp lại HĐ VAT', err.message);
    }
  };

  const handlePostGL = async (inv: any) => {
    try {
      const res = await fetch(`/api/invoices/${inv.id}/post-gl`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi hạch toán Sổ Cái GL');
      }
      const data = await res.json();
      onNotify('success', 'Đã Hạch Toán Sổ Cái (M30 GL)', data.message || `Đã chuyển hạch toán hóa đơn ${inv.invoiceNumber} sang Sổ Cái M30`);
      fetchInvoicesAndData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi chuyển Sổ Cái GL', err.message);
    }
  };

  const handleOpenCancelModal = (inv: any) => {
    setInvoiceToCancel(inv);
    setCancelForm({
      reason: 'Sai sót thông tin người mua và đơn giá theo thỏa thuận hai bên (Nghị định 123/2020/NĐ-CP)',
      protocolNumber: `BBH-2026-${inv.invoiceNumber}`,
      buyerRepresentative: inv.customerName || inv.companyName || 'Đại diện hợp pháp Bên Mua',
      sellerRepresentative: 'Trần Văn Kế Toán (Kế toán trưởng)',
      sendNotice04ToCqt: true,
    });
    setIsCancellationFormModalOpen(true);
  };

  const handleSubmitCancelInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceToCancel) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Hủy Hóa Đơn & Đảo Sổ Cái M30',
      message: `Hóa đơn [${invoiceToCancel.invoiceNumber}] sẽ bị HỦY VĨNH VIỄN theo Nghị định 123/2020. Hệ thống sẽ sinh Biên bản hủy hai bên và tự động ghi sổ bút toán đảo (Reversal Entry) trong Sổ Cái M30. Hành động này không thể hoàn tác!`,
      variant: 'danger',
      confirmText: 'Xác Nhận Hủy Ngay',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsCancelling(true);
        try {
          const res = await fetch(`/api/invoices/${invoiceToCancel.id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason: cancelForm.reason,
              protocolNumber: cancelForm.protocolNumber,
              buyerRepresentative: cancelForm.buyerRepresentative,
              sellerRepresentative: cancelForm.sellerRepresentative,
              sendNotice04ToCqt: cancelForm.sendNotice04ToCqt,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Lỗi hủy hóa đơn');
          }
          setIsCancellationFormModalOpen(false);
          onNotify('success', 'Đã Hủy Hóa Đơn & Sinh Bút Toán Đảo Reversal M30', data.message || `Hóa đơn [${invoiceToCancel.invoiceNumber}] đã bị hủy kèm Biên bản hủy.`);
          if (data.cancellationProtocol) {
            setSelectedCancellationProtocol(data.cancellationProtocol);
            setIsCancellationProtocolModalOpen(true);
          }
          fetchInvoicesAndData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi hủy hóa đơn', err.message);
        } finally {
          setIsCancelling(false);
        }
      },
    });
  };

  const handleViewCancellationProtocol = async (inv: any) => {
    try {
      const res = await fetch(`/api/invoices/${inv.id}/cancellation-protocol`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Chưa tìm thấy biên bản hủy');
      }
      setSelectedCancellationProtocol(data.cancellationProtocol);
      setIsCancellationProtocolModalOpen(true);
    } catch (err: any) {
      onNotify('warning', 'Biên bản hủy NĐ 123', err.message);
    }
  };

  const handleCancelInvoice = (inv: any) => {
    handleOpenCancelModal(inv);
  };

  const handleDownloadVatPdf = (inv: any) => {
    try {
      const enrichedInv = {
        invoiceNumber: inv.vatInvoiceNumber || inv.invoiceNumber,
        formCode: inv.vatSeries || '1C26TAA',
        serialNo: inv.vatSeries || '1C26TAA',
        date: inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
        customerName: inv.customerName || inv.companyName || 'Công ty TNHH Công Nghệ Thiên Nam',
        taxCode: inv.taxCode || '0315894231',
        address: inv.address || 'Số 45 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
        billingEmail: inv.billingEmail || 'contact@client.vn',
        paymentMethod: inv.paymentMethod === 'CASH' ? 'Tiền mặt (Cash Fund)' : 'Chuyển khoản (Bank Transfer)',
        subtotalAmount: inv.totalAmount || (inv.finalAmount - (inv.taxAmount || 0)),
        taxRate: inv.taxRate || 10,
        taxAmount: inv.taxAmount || Math.round((inv.totalAmount || 0) * 0.1),
        totalAmount: inv.finalAmount || (inv.totalAmount || 0) + (inv.taxAmount || 0),
        cqtCode: inv.cqtCode || `T26-000${inv.id}-A9F32E-78`,
        lookupCode: `NX${(inv.id * 8923).toString(16).toUpperCase()}2026`,
        lookupUrl: 'https://hoadondientu.gdt.gov.vn',
        signerName: 'Viettel-CA Cloud HSM Sub-CA v3',
        companyName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ & GIẢI PHÁP NEXUSSYNC ERP',
        companyTaxCode: '0108899888',
        companyAddress: 'Tòa nhà NexusSync Tower, 88 Phố Duy Tân, Cầu Giấy, Hà Nội',
        items: [
          {
            name: `Hàng hóa & Dịch vụ giải pháp theo Hóa đơn ${inv.invoiceNumber}`,
            uop: 'Gói',
            qty: 1,
            price: inv.totalAmount || (inv.finalAmount - (inv.taxAmount || 0)),
            amount: inv.totalAmount || (inv.finalAmount - (inv.taxAmount || 0)),
          }
        ],
      };
      downloadVatElectronicInvoicePdf(enrichedInv);
      onNotify('success', 'Đã xuất Hóa Đơn VAT Điện Tử', `Hóa đơn điện tử có mã CQT [${enrichedInv.cqtCode}] đã được tạo và tải về thành công.`);
    } catch (err: any) {
      onNotify('danger', 'Lỗi xuất Hóa Đơn VAT PDF', err.message);
    }
  };

  const handleOpenDetailModal = (inv: any) => {
    setSelectedInvoiceDetail(inv);
    setIsDetailModalOpen(true);
  };

  const handleExportPdf = () => {
    try {
      downloadInvoiceArApReportPdf(invoices, vatSummary);
      onNotify('success', 'Đã xuất PDF Báo cáo', 'Báo cáo Hóa đơn AR/AP & Thuế GTGT đã được tải về.');
    } catch (err: any) {
      onNotify('danger', 'Lỗi xuất PDF', err.message);
    }
  };

  // Calculations
  const arInvoices = invoices.filter((i) => i.type === 'AR' || i.type === 'RETAIL' || i.type === 'VAT');
  const apInvoices = invoices.filter((i) => i.type === 'AP' || i.type === 'PURCHASE');

  const totalArAmount = arInvoices.reduce((sum, i) => sum + (i.finalAmount || 0), 0);
  const totalArUnpaid = arInvoices.filter((i) => i.paymentStatus !== 'PAID').reduce((sum, i) => sum + (i.finalAmount || 0), 0);

  const totalApAmount = apInvoices.reduce((sum, i) => sum + (i.finalAmount || 0), 0);
  const totalApUnpaid = apInvoices.filter((i) => i.paymentStatus !== 'PAID').reduce((sum, i) => sum + (i.finalAmount || 0), 0);

  const totalVatOutput = arInvoices.reduce((sum, i) => sum + (i.taxAmount || 0), 0);
  const totalVatInput = apInvoices.reduce((sum, i) => sum + (i.taxAmount || 0), 0);
  const netVatPayable = totalVatOutput - totalVatInput;

  // VAT Status Counts for AR
  const arVatIssuedCount = arInvoices.filter((i) => (i.vatStatus || i.status) === 'ISSUED').length;
  const arVatPendingCount = arInvoices.filter((i) => (i.vatStatus || i.status) === 'PENDING').length;
  const arVatErrorCount = arInvoices.filter((i) => (i.vatStatus || i.status) === 'ERROR' || (i.vatStatus || i.status) === 'REJECTED').length;

  // Filtered lists
  const filteredArInvoices = arInvoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.taxCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.cqtCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.vatInvoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;
    const invVatStatus = inv.vatStatus || inv.status || 'PENDING';
    const matchesVatStatus = vatStatusFilter === 'ALL' || invVatStatus === vatStatusFilter;
    return matchesSearch && matchesStatus && matchesVatStatus;
  });

  const filteredApInvoices = apInvoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.taxCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.cqtCode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;
    const invVatStatus = inv.vatStatus || inv.status || 'PENDING';
    const matchesVatStatus = vatStatusFilter === 'ALL' || invVatStatus === vatStatusFilter;
    return matchesSearch && matchesStatus && matchesVatStatus;
  });

  const paginatedArInvoices = useMemo(() => {
    const start = (arPage - 1) * arPageSize;
    return filteredArInvoices.slice(start, start + arPageSize);
  }, [filteredArInvoices, arPage, arPageSize]);

  const paginatedApInvoices = useMemo(() => {
    const start = (apPage - 1) * apPageSize;
    return filteredApInvoices.slice(start, start + apPageSize);
  }, [filteredApInvoices, apPage, apPageSize]);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      tabsContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

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
  }, [checkScroll, invoices.length]);

  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeEl = tabsContainerRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      checkScroll();
    }
  }, [activeTab, checkScroll]);

  // Primary Action Hook per active tab
  useEffect(() => {
    switch (activeTab) {
      case 'ar':
        setPrimaryAction(() => () => {
          setNewInvoiceForm((prev) => ({ ...prev, type: 'AR' }));
          setIsNewInvoiceModalOpen(true);
        }, 'Tạo Hóa Đơn AR');
        break;
      case 'ap':
        setPrimaryAction(() => () => {
          setNewInvoiceForm((prev) => ({ ...prev, type: 'AP' }));
          setIsNewInvoiceModalOpen(true);
        }, 'Nhập Hóa Đơn AP');
        break;
      case 'vat':
        setPrimaryAction(() => handleOpenEtaxModal, 'Kê Khai eTax CQT');
        break;
      case 'payments':
        setPrimaryAction(() => () => {
          setNewInvoiceForm((prev) => ({ ...prev, type: 'AR' }));
          setIsNewInvoiceModalOpen(true);
        }, 'Ghi Nhận Thu Chi');
        break;
      case 'gl':
        setPrimaryAction(() => handleExportPdf, 'In Báo Cáo Kế Toán');
        break;
      case 'reports':
        setPrimaryAction(() => handleExportPdf, 'In Báo Cáo PDF');
        break;
    }
  }, [activeTab, setPrimaryAction]);

  const TABS: Array<{ id: 'ar' | 'ap' | 'vat' | 'payments' | 'gl' | 'reports'; label: string; icon: React.FC<{ className?: string }>; badge?: number }> = [
    { id: 'ar', label: '01. AR — Phải Thu Khách Hàng', icon: Receipt, badge: arInvoices.length },
    { id: 'ap', label: '02. AP — Phải Trả & 3-Way Match', icon: Building, badge: apInvoices.length },
    { id: 'vat', label: '03. Thuế & VAT Engine', icon: Scale },
    { id: 'payments', label: '04. Thanh Toán & Thu Chi', icon: CreditCard, badge: payments.length },
    { id: 'gl', label: '05. GL Posting Boundary', icon: BookOpen, badge: accountingEvents.length },
    { id: 'reports', label: '06. Báo Cáo Tài Chính & Aging', icon: PieChart },
  ];

  return (
    <div className="space-y-6" id="nexus-l4-main">
      {/* 1. Top Header & Actions Banner (M35 Standard) */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                FINANCE &amp; ACCOUNTING SUITE
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Unified FICO Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quản lý Phải thu (AR), Phải trả (AP), Thuế VAT Engine Authority, Payments &amp; Sổ cái GL (TT200/2014)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsOcrModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>AI OCR Nhập Hóa Đơn</span>
          </button>

          <button
            onClick={handleOpenEtaxModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Kê Khai eTax CQT</span>
          </button>

          <button
            onClick={fetchInvoicesAndData}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>In Báo Cáo PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Quick KPI Summary Cards (M35 1:1 Metric Card Pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: AR */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tổng Phải Thu (AR - TK 131)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
              {totalArAmount.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Chờ thu nợ:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {totalArUnpaid.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </div>

        {/* Card 2: AP */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tổng Phải Trả (AP - TK 331)</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
              {totalApAmount.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Chờ thanh toán:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
              {totalApUnpaid.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </div>

        {/* Card 3: Net VAT */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Nghĩa Vụ Thuế GTGT (VAT)</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-purple-700 dark:text-purple-400 tabular-nums">
              {netVatPayable.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 font-mono">
            <span>Ra: {totalVatOutput.toLocaleString('vi-VN')}</span>
            <span>Vào: {totalVatInput.toLocaleString('vi-VN')}</span>
          </div>
        </div>

        {/* Card 4: Single Writer GL Stream */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Financial Events Stream</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums">
              {accountingEvents.length}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">Bút toán Event</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Trạng thái GL:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Single Writer GL</span>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Scrollable Navigation Tabs Track (M35 Exact Pattern) */}
      <div className="relative group">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScrollTabs('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition"
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Track Container */}
        <div
          ref={tabsContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-active={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScrollTabs('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition"
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4. Search & Filter Bar (M35 Layout & Style) */}
      {(activeTab === 'ar' || activeTab === 'ap') && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã HĐ, đối tác, MST, mã CQT..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Payment Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Tất cả thanh toán</option>
                <option value="ISSUED">Phát hành (Issued)</option>
                <option value="UNPAID">Chưa thanh toán</option>
                <option value="PARTIAL">Thanh toán 1 phần</option>
                <option value="PAID">Đã gạch nợ (Paid)</option>
              </select>

              {/* VAT Invoice Status Filter */}
              <select
                value={vatStatusFilter}
                onChange={(e) => setVatStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái VAT</option>
                <option value="ISSUED">Đã xuất VAT (Cấp mã CQT)</option>
                <option value="PENDING">Chờ xuất VAT (Chờ ký số)</option>
                <option value="ERROR">Đơn lỗi VAT (Cần sửa)</option>
              </select>

              {activeTab === 'ar' && (
                <button
                  onClick={() => setIsCreditNoteModalOpen(true)}
                  className="px-3 py-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Credit Note (RMA)</span>
                </button>
              )}

              {activeTab === 'ar' && (
                <button
                  onClick={handleBatchArchiveDms}
                  className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  title="Niêm phong số mật mã SHA-256 toàn bộ HĐ đã phát hành vào Kho chứng từ số M29 DMS"
                >
                  <FolderArchive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Niêm Phong M29 DMS</span>
                </button>
              )}

              <button
                onClick={() => {
                  setNewInvoiceForm((prev) => ({ ...prev, type: activeTab === 'ar' ? 'AR' : 'AP' }));
                  setIsNewInvoiceModalOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Hóa Đơn {activeTab.toUpperCase()} Mới</span>
              </button>
            </div>
          </div>

          {/* Quick VAT Filter Badges Bar */}
          {activeTab === 'ar' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Phân loại xuất HĐ VAT (NĐ 123/2020):
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setVatStatusFilter('ALL')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer border ${
                      vatStatusFilter === 'ALL'
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Tất cả ({arInvoices.length})
                  </button>
                  <button
                    onClick={() => setVatStatusFilter('ISSUED')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                      vatStatusFilter === 'ISSUED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Đã xuất ({arVatIssuedCount})
                  </button>
                  <button
                    onClick={() => setVatStatusFilter('PENDING')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                      vatStatusFilter === 'PENDING'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Chờ xử lý ({arVatPendingCount})
                  </button>
                  <button
                    onClick={() => setVatStatusFilter('ERROR')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                      vatStatusFilter === 'ERROR'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    Đơn lỗi ({arVatErrorCount})
                  </button>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Khớp kết quả: <strong className="text-slate-800 dark:text-slate-200 font-mono">{filteredArInvoices.length}</strong> hóa đơn
              </span>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: AR — ACCOUNTS RECEIVABLE */}
      {activeTab === 'ar' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Danh Sách Hóa Đơn Phải Thu Khách Hàng (AR - TK 131)</h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hiển thị {filteredArInvoices.length} chứng từ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <th className="px-4 py-3.5">Mã Hóa Đơn</th>
                    <th className="px-4 py-3.5">Khách Hàng &amp; MST</th>
                    <th className="px-4 py-3.5 text-right">Tiền Hàng</th>
                    <th className="px-4 py-3.5 text-right">Thuế GTGT</th>
                    <th className="px-4 py-3.5 text-right">Tổng Nợ AR</th>
                    <th className="px-4 py-3.5">Trạng Thái Thu Nợ</th>
                    <th className="px-4 py-3.5">
                      <div className="flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Trạng Thái Xuất VAT</span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {paginatedArInvoices.map((inv) => {
                    const currentVatStatus = inv.vatStatus || inv.status || 'PENDING';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-4 py-4 font-bold text-blue-700 dark:text-blue-400 font-mono">
                          {inv.invoiceNumber}
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-normal">{inv.issueDate || '28/08/2026'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{inv.customerName || inv.companyName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">MST: {inv.taxCode || '0315894231'}</div>
                        </td>
                        <td className="px-4 py-4 font-mono tabular-nums text-right font-semibold text-slate-700 dark:text-slate-300">
                          {(inv.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-4 font-mono tabular-nums text-right font-semibold text-purple-700 dark:text-purple-400">
                          {(inv.taxAmount || 0).toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                            {(inv.finalAmount || 0).toLocaleString('vi-VN')} VNĐ
                          </div>
                          {(Number(inv.paidAmount) > 0) && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Đã thu: {Number(inv.paidAmount).toLocaleString('vi-VN')}
                            </div>
                          )}
                          {inv.remainingAmount !== undefined && Number(inv.remainingAmount) < (inv.finalAmount || 0) && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                              Còn nợ: {Number(inv.remainingAmount).toLocaleString('vi-VN')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                              inv.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : inv.paymentStatus === 'PARTIAL'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {inv.paymentStatus === 'PAID' ? 'Đã thu đủ' : inv.paymentStatus === 'PARTIAL' ? 'Thu 1 phần' : 'Chưa thu tiền'}
                          </span>
                          {inv.overdueDays > 0 && inv.paymentStatus !== 'PAID' && (
                            <div className="text-[9px] text-rose-600 dark:text-rose-400 font-bold mt-1 flex items-center gap-0.5">
                              <Clock className="w-3 h-3 text-rose-500 dark:text-rose-400 inline" />
                              Quá hạn {inv.overdueDays} ngày
                            </div>
                          )}
                        </td>

                        {/* VAT INVOICE STATUS COLUMN WITH 3 COLOR-CODED LABELS */}
                        <td className="px-4 py-4">
                          {currentVatStatus === 'ISSUED' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Đã xuất VAT</span>
                              </span>
                              <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold pl-1">
                                {inv.vatInvoiceNumber ? `Số: ${inv.vatInvoiceNumber}` : 'Ký số HSM CQT'}
                              </div>
                              {inv.cqtCode && (
                                <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 pl-1 truncate max-w-[130px]" title={`Mã CQT: ${inv.cqtCode}`}>
                                  CQT: {inv.cqtCode}
                                </div>
                              )}
                            </div>
                          ) : currentVatStatus === 'ERROR' || currentVatStatus === 'REJECTED' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-2xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                <span>Lỗi xuất VAT</span>
                              </span>
                              <div className="text-[10px] font-medium text-rose-700 dark:text-rose-300 pl-1 max-w-[150px] truncate" title={inv.vatErrorReason || inv.rejectionReason || 'CQT từ chối cấp mã'}>
                                {inv.vatErrorReason || 'Lỗi cấp mã CQT'}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>Chờ xử lý</span>
                              </span>
                              <div className="text-[10px] font-medium text-amber-700 dark:text-amber-300 pl-1">
                                {inv.pendingReason || 'Chờ ký số HSM'}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* TABLE ACTIONS */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* VAT Action Button */}
                            {currentVatStatus === 'ISSUED' ? (
                              <button
                                onClick={() => handleDownloadVatPdf(inv)}
                                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                title="Tải Hóa Đơn Điện Tử VAT có mã CQT (PDF)"
                              >
                                <Download className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                                <span>In HĐ VAT</span>
                              </button>
                            ) : currentVatStatus === 'ERROR' || currentVatStatus === 'REJECTED' ? (
                              <button
                                onClick={() => handleOpenRetryVatModal(inv)}
                                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 rounded-lg border border-rose-300 dark:border-rose-800 text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                title="Sửa thông tin MST & Thử cấp lại mã CQT"
                              >
                                <RefreshCw className="w-3 h-3 text-rose-700 dark:text-rose-400" />
                                <span>Sửa &amp; Thử lại</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleIssueVatInvoice(inv)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                title="Ký số Cloud HSM & Lấy mã CQT"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Xuất HĐ VAT</span>
                              </button>
                            )}

                            {/* View Detail Modal Button */}
                            <button
                              onClick={() => handleOpenDetailModal(inv)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer active:scale-95"
                              title="Xem chi tiết hóa đơn & Thông số CQT"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Payment Settlement Button */}
                            {inv.paymentStatus !== 'PAID' && (
                              <button
                                onClick={() => handleOpenPaymentModal(inv)}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold transition cursor-pointer shadow-2xs active:scale-95"
                                title="Gạch nợ phải thu AR"
                              >
                                Gạch nợ
                              </button>
                            )}

                            {/* Credit Note Offset Button (M15 RMA Returns) */}
                            {inv.paymentStatus !== 'PAID' && (
                              <button
                                onClick={() => handleOpenOffsetCreditNoteModal(inv)}
                                className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-300 dark:border-amber-800 text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                title="Cấn trừ công nợ AR bằng Credit Note RMA"
                              >
                                <FileCheck2 className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                                <span>Cấn trừ CN</span>
                              </button>
                            )}

                            {/* Dunning VietQR Button (AR only) */}
                            {inv.status !== 'CANCELLED' && inv.paymentStatus !== 'PAID' && (
                              <button
                                onClick={() => handleOpenDunningModal(inv, 1, '10.5')}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer active:scale-95"
                                title="Tạo mã VietQR NAPAS 247 & Công văn nhắc nợ quá hạn"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Export Signed XML (Decree 123/2020) */}
                            {currentVatStatus === 'ISSUED' && (
                              <button
                                onClick={() => handleDownloadInvoiceXml(inv)}
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition cursor-pointer active:scale-95"
                                title="Tải tệp XML Hóa Đơn Điện Tử có CKS HSM (Nghị định 123/2020)"
                              >
                                <FileCode className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                              </button>
                            )}

                            {/* M29 DMS Secure Vault Archiving */}
                            {inv.status === 'ISSUED' && (
                              <button
                                onClick={() => handleArchiveToDms(inv)}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer active:scale-95"
                                title="Niêm phong số hóa đơn vào Kho lưu trữ M29 DMS & Ghi log M02"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Decree 123 Cancellation or Protocol View */}
                            {inv.status === 'CANCELLED' ? (
                              <button
                                onClick={() => handleViewCancellationProtocol(inv)}
                                className="px-2 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-300 dark:border-rose-800 text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                title="Xem Biên bản hủy hóa đơn điện tử (Nghị định 123/2020/NĐ-CP)"
                              >
                                <FileX className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                <span>Biên bản hủy</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenCancelModal(inv)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 transition cursor-pointer active:scale-95"
                                title="Hủy hóa đơn kèm Biên bản thỏa thuận & Bút toán đảo Sổ Cái M30 (NĐ 123/2020)"
                              >
                                <FileX className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={arPage}
              pageSize={arPageSize}
              totalItems={filteredArInvoices.length}
              onPageChange={setArPage}
              onPageSizeChange={setArPageSize}
            />
          </div>

          {/* Credit Notes (RMA Linked) Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Credit Notes — Giảm Trừ Nợ AR (RMA Returns)</h3>
              </div>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-mono">Credit Note Engine Authority</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    <th className="px-4 py-2.5">Mã Credit Note</th>
                    <th className="px-4 py-2.5">Hóa Đơn Gốc</th>
                    <th className="px-4 py-2.5">Mã RMA / Lý Do</th>
                    <th className="px-4 py-2.5">Khách Hàng</th>
                    <th className="px-4 py-2.5 text-right">Giá Trị Giảm</th>
                    <th className="px-4 py-2.5">Định Khoản GL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                  {creditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-bold text-amber-700 dark:text-amber-400">{cn.creditNoteNumber}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{cn.originalInvoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-sans">
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10px] mr-1.5 font-mono font-bold">
                          {cn.rmaCode}
                        </span>
                        {cn.reason}
                      </td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-sans font-semibold">{cn.customerName}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-700 dark:text-rose-400">
                        -{(cn.finalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">{cn.accountingEntry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AP — ACCOUNTS PAYABLE */}
      {activeTab === 'ap' && (
        <div className="space-y-6">
          {/* Early Payment Discount Banner (2/10 Net 30) */}
          {earlyDiscounts && earlyDiscounts.suggestions && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Thuật Toán Tối Ưu Chiết Khấu Thanh Toán Sớm AP (2/10 Net 30)</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Tiềm năng tiết kiệm thanh toán ngay: <span className="font-bold text-emerald-700 dark:text-emerald-400">{earlyDiscounts.totalPotentialSavingsAP?.toLocaleString('vi-VN')} VNĐ</span>
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Dynamic AP Engine
                </span>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Danh Sách Hóa Đơn Phải Trả Nhà Cung Cấp (AP - TK 331)</h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hiển thị {filteredApInvoices.length} chứng từ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <th className="px-4 py-3.5">Mã Hóa Đơn AP</th>
                    <th className="px-4 py-3.5">Nhà Cung Cấp &amp; MST</th>
                    <th className="px-4 py-3.5 text-right">Tiền Hàng</th>
                    <th className="px-4 py-3.5 text-right">Thuế Đầu Vào</th>
                    <th className="px-4 py-3.5 text-right">Nợ AP Phải Trả</th>
                    <th className="px-4 py-3.5">Trạng Thái Thanh Toán</th>
                    <th className="px-4 py-3.5">3-Way Match &amp; HĐ CQT</th>
                    <th className="px-4 py-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {paginatedApInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-4 py-4 font-bold text-rose-700 dark:text-rose-400 font-mono">
                        {inv.invoiceNumber}
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-normal">{inv.issueDate || '28/08/2026'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{inv.customerName || inv.companyName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">MST: {inv.taxCode || '0109988776'}</div>
                      </td>
                      <td className="px-4 py-4 font-mono tabular-nums text-right font-semibold text-slate-700 dark:text-slate-300">
                        {(inv.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-4 font-mono tabular-nums text-right font-semibold text-purple-700 dark:text-purple-400">
                        {(inv.taxAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-mono tabular-nums font-bold text-rose-700 dark:text-rose-400">
                          {(inv.finalAmount || 0).toLocaleString('vi-VN')} VNĐ
                        </div>
                        {(Number(inv.paidAmount) > 0) && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Đã chi: {Number(inv.paidAmount).toLocaleString('vi-VN')}
                          </div>
                        )}
                        {inv.remainingAmount !== undefined && Number(inv.remainingAmount) < (inv.finalAmount || 0) && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                            Còn nợ: {Number(inv.remainingAmount).toLocaleString('vi-VN')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                            inv.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : inv.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {inv.paymentStatus === 'PAID' ? 'Đã chi đủ' : inv.paymentStatus === 'PARTIAL' ? 'Chi 1 phần' : 'Chờ trả tiền'}
                        </span>
                        {inv.overdueDays > 0 && inv.paymentStatus !== 'PAID' && (
                          <div className="text-[9px] text-rose-600 dark:text-rose-400 font-bold mt-1 flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-rose-500 dark:text-rose-400 inline" />
                            Quá hạn {inv.overdueDays} ngày
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {inv.threeWayMatchStatus === 'MATCHED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Khớp 3-Way</span>
                            </span>
                          ) : inv.threeWayMatchStatus === 'TOLERANCE_MATCHED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                              <Scale className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>Dung sai ≤2%</span>
                            </span>
                          ) : inv.threeWayMatchStatus === 'PENDING_GOODS_RECEIPT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>Chờ nhập kho</span>
                            </span>
                          ) : inv.threeWayMatchStatus === 'PRICE_MISMATCH' || inv.threeWayMatchStatus === 'QTY_MISMATCH' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs">
                              <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                              <span>Lệch PO/GRN</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              <Scale className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                              <span>Chưa đối soát</span>
                            </span>
                          )}
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono pl-0.5">TK 133 / TK 331</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* 3-Way Match Button */}
                          <button
                            onClick={() => handleOpenThreeWayMatch(inv)}
                            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-300 dark:border-indigo-800 text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                            title="Đối soát 3 chiều AP Invoice ↔ PO (M08) ↔ Phiếu Nhập Kho GRN"
                          >
                            <Scale className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            <span>Đối soát 3-Way</span>
                          </button>

                          {inv.paymentStatus !== 'PAID' && (
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-300 dark:border-rose-800 text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                              title="Lập Lệnh Chi Giải Ngân AP"
                            >
                              <DollarSign className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              <span>Chi AP</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetailModal(inv)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer active:scale-95"
                            title="Xem chi tiết hóa đơn đầu vào"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* M29 DMS Secure Vault Archiving */}
                          <button
                            onClick={() => handleArchiveToDms(inv)}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer active:scale-95"
                            title="Niêm phong số hóa đơn vào Kho lưu trữ M29 DMS & Ghi log M02"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>

                          {/* Decree 123 Cancellation or Protocol View */}
                          {inv.status === 'CANCELLED' ? (
                            <button
                              onClick={() => handleViewCancellationProtocol(inv)}
                              className="px-2 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-300 dark:border-rose-800 text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                              title="Xem Biên bản hủy hóa đơn điện tử (Nghị định 123/2020/NĐ-CP)"
                            >
                              <FileX className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              <span>Biên bản hủy</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenCancelModal(inv)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 transition cursor-pointer active:scale-95"
                              title="Hủy hóa đơn đầu vào kèm Biên bản thỏa thuận & Bút toán đảo Sổ Cái M30"
                            >
                              <FileX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={apPage}
              pageSize={apPageSize}
              totalItems={filteredApInvoices.length}
              onPageChange={setApPage}
              onPageSizeChange={setApPageSize}
            />
          </div>

          {/* Debit Notes (Purchase Return Linked) Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Debit Notes — Giảm Trừ Nợ AP (Purchase Returns)</h3>
              </div>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-mono">Purchase Return Boundary</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    <th className="px-4 py-2.5">Mã Debit Note</th>
                    <th className="px-4 py-2.5">Hóa Đơn AP Gốc</th>
                    <th className="px-4 py-2.5">Mã Trả Hàng PO</th>
                    <th className="px-4 py-2.5">Nhà Cung Cấp</th>
                    <th className="px-4 py-2.5 text-right">Số Tiền Giảm</th>
                    <th className="px-4 py-2.5">Định Khoản GL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                  {debitNotes.map((dn) => (
                    <tr key={dn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-bold text-blue-700 dark:text-blue-400">{dn.debitNoteNumber}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{dn.originalInvoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-sans">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-[10px] mr-1.5 font-mono font-bold">
                          {dn.purchaseReturnCode}
                        </span>
                        {dn.reason}
                      </td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-sans font-semibold">{dn.supplierName}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                        -{(dn.finalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">{dn.accountingEntry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TAX / VAT ENGINE AUTHORITY */}
      {activeTab === 'vat' && (
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">CENTRAL TAX / VAT ENGINE AUTHORITY</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Cơ quan tính toán và kiểm soát nghĩa vụ thuế GTGT tập trung (Nghị định 123/2020/NĐ-CP &amp; Thông tư 78/2021/TT-BTC)
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Authority Status: ACTIVE</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Thuế GTGT Đầu Ra (Output VAT - Sales/POS)</div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-mono tabular-nums">
                  {totalVatOutput.toLocaleString('vi-VN')} VNĐ
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tài khoản hạch toán: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">TK 3331</span></div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Thuế GTGT Đầu Vào Khấu Trừ (Input VAT - Purchase)</div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-1 font-mono tabular-nums">
                  {totalVatInput.toLocaleString('vi-VN')} VNĐ
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tài khoản hạch toán: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">TK 1331</span></div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nghĩa Vụ Thuế GTGT Ròng (Net VAT Position)</div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-400 mt-1 font-mono tabular-nums">
                  {netVatPayable.toLocaleString('vi-VN')} VNĐ
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">Output VAT - Input VAT = Phải Nộp</div>
              </div>
            </div>
          </div>

          {/* Interactive Tax Calculation Workbench */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Thử Nghiệm Tax Engine Calculation API</h4>
              </div>

              <form onSubmit={handleTestTaxEngine} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số Tiền Chưa Thuế (Subtotal)</label>
                  <input
                    type="number"
                    value={taxCalcForm.amount}
                    onChange={(e) => setTaxCalcForm({ ...taxCalcForm, amount: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Thuế GTGT (VAT Code)</label>
                    <select
                      value={taxCalcForm.vatCode}
                      onChange={(e) => setTaxCalcForm({ ...taxCalcForm, vatCode: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="V10">V10 - Thuế suất 10% Phổ thông</option>
                      <option value="V8">V8 - Thuế suất 8% Ưu đãi</option>
                      <option value="V5">V5 - Thuế suất 5% Nông sản/Y tế</option>
                      <option value="V0">V0 - Thuế suất 0% Xuất khẩu</option>
                      <option value="VE">VE - Miễn Thuế GTGT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Trạng Thái Miễn Thuế</label>
                    <select
                      value={taxCalcForm.isExempt ? 'TRUE' : 'FALSE'}
                      onChange={(e) => setTaxCalcForm({ ...taxCalcForm, isExempt: e.target.value === 'TRUE' })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="FALSE">Chịu Thuế Bình Thường</option>
                      <option value="TRUE">Miễn Thuế theo Luật</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isTaxCalcLoading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{isTaxCalcLoading ? 'Đang tính toán...' : 'Tính Toán Qua Tax Engine Authority'}</span>
                </button>
              </form>
            </div>

            {/* Tax Engine Authority Result Box */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Kết Quả Xác Định Thuế (Tax Determination)</h4>
                </div>
                <span className="text-xs font-mono text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">Authority Output</span>
              </div>

              {taxCalcResult ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-slate-500 dark:text-slate-400 font-sans text-[11px]">Cơ sở pháp lý &amp; Quy tắc:</div>
                    <div className="text-emerald-800 dark:text-emerald-300 font-sans font-bold">{taxCalcResult.taxRuleApplied}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                    <div>Mã Thuế: <span className="font-bold text-slate-900 dark:text-white">{taxCalcResult.vatCode}</span></div>
                    <div>Thuế Suất: <span className="font-bold text-purple-700 dark:text-purple-400">{taxCalcResult.vatRateText}</span></div>
                    <div>Tiền Hàng: <span className="font-bold text-slate-900 dark:text-white">{taxCalcResult.subtotal.toLocaleString('vi-VN')} VNĐ</span></div>
                    <div>Tiền Thuế GTGT: <span className="font-bold text-purple-700 dark:text-purple-400">{taxCalcResult.vatAmount.toLocaleString('vi-VN')} VNĐ</span></div>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 font-bold text-sm flex justify-between">
                    <span>Tổng Tiền Thanh Toán:</span>
                    <span className="tabular-nums">{taxCalcResult.totalWithVat.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                  Chưa thực hiện tính toán. Nhấn nút "Tính Toán Qua Tax Engine Authority" ở bảng bên trái.
                </div>
              )}
            </div>
          </div>

          {/* TỜ KHAI THUẾ GTGT ĐỊNH KỲ - MẪU 01/GTGT (THÔNG TƯ 80/2021/TT-BTC) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Tờ Khai Thuế GTGT Mẫu 01/GTGT (Thông Tư 80/2021/TT-BTC)
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 uppercase">
                      Hợp Lệ CQT
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hệ thống tự động bù trừ TK 3331 (Đầu ra) và TK 1331 (Đầu vào) kết chuyển nghĩa vụ thuế theo quy chuẩn Tổng cục Thuế
                  </p>
                </div>
              </div>

              {/* Action Buttons for Tax Declaration */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTaxXml}
                  disabled={!fullTaxReportData?.xmlContent}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Xuất file XML chuẩn nộp qua iHTKK hoặc eTax của Tổng Cục Thuế"
                >
                  <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Xuất XML eTax / HTKK</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenEtaxModal}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ký Số &amp; Nộp Trực Tiếp CQT</span>
                </button>
              </div>
            </div>

            {/* Filter and Period Selection Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Kỳ Kê Khai:</label>
                  <select
                    value={vatReportPeriod}
                    onChange={(e) => {
                      setVatReportPeriod(e.target.value);
                      fetchTaxReport(e.target.value, carriedForwardInput);
                    }}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Q3/2026">Quý 3/2026 (01/07 - 30/09/2026)</option>
                    <option value="Q2/2026">Quý 2/2026 (01/04 - 30/06/2026)</option>
                    <option value="Q1/2026">Quý 1/2026 (01/01 - 31/03/2026)</option>
                    <option value="Tháng 08/2026">Tháng 08/2026</option>
                    <option value="Tháng 09/2026">Tháng 09/2026</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300" title="Chỉ tiêu [22] trên Tờ khai 01/GTGT">
                    Thuế GTGT khấu trừ kỳ trước chuyển sang [22]:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={carriedForwardInput}
                      onChange={(e) => setCarriedForwardInput(e.target.value)}
                      placeholder="0"
                      className="w-32 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono font-bold"
                    />
                    <span className="text-slate-500 dark:text-slate-400 font-medium">VNĐ</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchTaxReport(vatReportPeriod, carriedForwardInput)}
                disabled={isTaxReportLoading}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTaxReportLoading ? 'animate-spin' : ''}`} />
                <span>{isTaxReportLoading ? 'Đang tính toán...' : 'Cập Nhật Tờ Khai'}</span>
              </button>
            </div>

            {/* Mẫu 01/GTGT Indicators Table */}
            {fullTaxReportData?.form01VatDeclaration ? (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                        <th className="px-3 py-2.5 text-center w-14">Chỉ Tiêu</th>
                        <th className="px-4 py-2.5">Nội Dung Chỉ Tiêu (Theo Thông tư 80/2021/TT-BTC)</th>
                        <th className="px-4 py-2.5 text-right w-44">Doanh Thu / Giá Trị (VNĐ)</th>
                        <th className="px-4 py-2.5 text-right w-44">Tiền Thuế GTGT (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">[21]</td>
                        <td className="px-4 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">Không phát sinh hoạt động mua, bán trong kỳ</td>
                        <td className="px-4 py-2 text-right text-slate-400 font-sans">-</td>
                        <td className="px-4 py-2 text-right font-sans font-semibold text-slate-600 dark:text-slate-400">{fullTaxReportData.form01VatDeclaration.box21 ? 'Có' : 'Không'}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-blue-50/30 dark:bg-blue-950/20">
                        <td className="px-3 py-2 text-center font-bold text-blue-700 dark:text-blue-400">[22]</td>
                        <td className="px-4 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">Thuế GTGT còn được khấu trừ kỳ trước chuyển sang</td>
                        <td className="px-4 py-2 text-right text-slate-400 font-sans">-</td>
                        <td className="px-4 py-2 text-right font-bold text-blue-700 dark:text-blue-400 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box22 || 0).toLocaleString('vi-VN')}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">[23]</td>
                        <td className="px-4 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">Giá trị và thuế GTGT của hàng hóa, dịch vụ mua vào</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box23 || 0).toLocaleString('vi-VN')}</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box24 || 0).toLocaleString('vi-VN')} <span className="text-[10px] text-slate-400 font-sans">[24]</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-slate-50 dark:bg-slate-800/40">
                        <td className="px-3 py-2 text-center font-bold text-indigo-700 dark:text-indigo-400">[25]</td>
                        <td className="px-4 py-2 font-sans font-semibold text-indigo-900 dark:text-indigo-300">Tổng số thuế GTGT của HHDV mua vào được khấu trừ kỳ này (TK 1331)</td>
                        <td className="px-4 py-2 text-right text-slate-400 font-sans">-</td>
                        <td className="px-4 py-2 text-right font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box25 || 0).toLocaleString('vi-VN')}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">[26]</td>
                        <td className="px-4 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">Hàng hóa, dịch vụ bán ra không chịu thuế GTGT</td>
                        <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-300 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box26 || 0).toLocaleString('vi-VN')}</td>
                        <td className="px-4 py-2 text-right text-slate-400 font-sans">-</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">[27]</td>
                        <td className="px-4 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">Hàng hóa, dịch vụ bán ra chịu thuế suất 0%</td>
                        <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-300 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box27 || 0).toLocaleString('vi-VN')}</td>
                        <td className="px-4 py-2 text-right text-slate-400 font-sans">-</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">[29]</td>
                        <td className="px-4 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">Hàng hóa, dịch vụ bán ra chịu thuế suất 5%</td>
                        <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-300 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box28 || 0).toLocaleString('vi-VN')} <span className="text-[10px] text-slate-400 font-sans">[28]</span></td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box29 || 0).toLocaleString('vi-VN')}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">[31]</td>
                        <td className="px-4 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">Hàng hóa, dịch vụ bán ra chịu thuế suất 8% (Nghị quyết Quốc hội)</td>
                        <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-300 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box30 || 0).toLocaleString('vi-VN')} <span className="text-[10px] text-slate-400 font-sans">[30]</span></td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box31 || 0).toLocaleString('vi-VN')}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">[33]</td>
                        <td className="px-4 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">Hàng hóa, dịch vụ bán ra chịu thuế suất 10%</td>
                        <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-300 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box32 || 0).toLocaleString('vi-VN')} <span className="text-[10px] text-slate-400 font-sans">[32]</span></td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box33 || 0).toLocaleString('vi-VN')}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-slate-50 dark:bg-slate-800/50 font-bold">
                        <td className="px-3 py-2 text-center font-bold text-purple-700 dark:text-purple-400">[35]</td>
                        <td className="px-4 py-2 font-sans text-purple-950 dark:text-purple-200">Tổng doanh thu và thuế GTGT của HHDV bán ra (TK 3331)</td>
                        <td className="px-4 py-2 text-right text-purple-900 dark:text-purple-300 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box34 || 0).toLocaleString('vi-VN')} <span className="text-[10px] text-slate-400 font-sans">[34]</span></td>
                        <td className="px-4 py-2 text-right text-purple-700 dark:text-purple-400 text-sm tabular-nums">{(fullTaxReportData.form01VatDeclaration.box35 || 0).toLocaleString('vi-VN')}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-purple-50/50 dark:bg-purple-950/30">
                        <td className="px-3 py-2 text-center font-bold text-purple-700 dark:text-purple-400">[36]</td>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900 dark:text-white">Thuế GTGT phát sinh trong kỳ ([35] - [25])</td>
                        <td className="px-4 py-2 text-right text-slate-400 font-sans">-</td>
                        <td className="px-4 py-2 text-right font-bold text-purple-800 dark:text-purple-300 tabular-nums">{(fullTaxReportData.form01VatDeclaration.box36 || 0).toLocaleString('vi-VN')}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 border-t-2 border-emerald-300 dark:border-emerald-700">
                        <td className="px-3 py-2.5 text-center font-bold text-emerald-800 dark:text-emerald-300 text-sm">[40]</td>
                        <td className="px-4 py-2.5 font-sans font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                          THUẾ GTGT PHẢI NỘP VÀO NGÂN SÁCH NHÀ NƯỚC KỲ NÀY ([36] - [22])
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-400 font-sans">-</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-800 dark:text-emerald-300 text-base tabular-nums">
                          {(fullTaxReportData.form01VatDeclaration.box40 || 0).toLocaleString('vi-VN')} VNĐ
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-blue-50/80 dark:bg-blue-950/40">
                        <td className="px-3 py-2.5 text-center font-bold text-blue-800 dark:text-blue-300 text-sm">[43]</td>
                        <td className="px-4 py-2.5 font-sans font-bold text-blue-950 dark:text-blue-200 text-sm">
                          THUẾ GTGT CÒN ĐƯỢC KHẤU TRỪ CHUYỂN KỲ SAU
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-400 font-sans">-</td>
                        <td className="px-4 py-2.5 text-right font-bold text-blue-800 dark:text-blue-300 text-base tabular-nums">
                          {(fullTaxReportData.form01VatDeclaration.box43 || 0).toLocaleString('vi-VN')} VNĐ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Sub-Schedules: Annex 01-1 and 01-2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                  {/* Annex 01-1: Output Invoices */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                        <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Phụ Lục 01-1/GTGT: Bảng Kê Bán Ra ({fullTaxReportData.annex01_1_Sales?.length || 0} HĐ)</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">TK 3331</span>
                    </div>
                    <div className="overflow-y-auto max-h-48 divide-y divide-slate-200 dark:divide-slate-700 text-[11px] font-mono">
                      {fullTaxReportData.annex01_1_Sales?.map((item: any, idx: number) => (
                        <div key={idx} className="py-2 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white font-sans">{item.customerName}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">HĐ: {item.invoiceNumber} • MST: {item.taxCode || 'N/A'} • Thuế {item.taxRate}%</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{item.taxAmount?.toLocaleString('vi-VN')} VNĐ</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">{item.subtotal?.toLocaleString('vi-VN')} chưa thuế</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Annex 01-2: Input Invoices */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                        <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Phụ Lục 01-2/GTGT: Bảng Kê Mua Vào ({fullTaxReportData.annex01_2_Purchases?.length || 0} HĐ)</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-400">TK 1331</span>
                    </div>
                    <div className="overflow-y-auto max-h-48 divide-y divide-slate-200 dark:divide-slate-700 text-[11px] font-mono">
                      {fullTaxReportData.annex01_2_Purchases?.map((item: any, idx: number) => (
                        <div key={idx} className="py-2 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white font-sans">{item.supplierName}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">HĐ: {item.invoiceNumber} • MST: {item.taxCode || 'N/A'} • Thuế {item.taxRate}%</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-700 dark:text-blue-400 tabular-nums">{item.taxAmount?.toLocaleString('vi-VN')} VNĐ</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">{item.purchaseValue?.toLocaleString('vi-VN')} chưa thuế</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-xs">
                Đang tải dữ liệu tờ khai thuế GTGT Mẫu 01/GTGT...
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS & TREASURY */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <RedirectPanel
            targetModule="M32"
            targetRoute="/payments"
            title="Trung Tâm Quản Lý Thu Chi & Kho Bạc (Treasury & Cash Management)"
            description="Toàn bộ luồng tạo lệnh chi, ủy nhiệm chi (UNC), đối soát sổ phụ ngân hàng (Bank Reconciliation) và phê duyệt thanh toán thuộc thẩm quyền Single Writer của Module M32 Payments."
            badgeText="M32 TREASURY AUTHORITY"
            suggestedActions={[
              'Lập lệnh chi thanh toán nhà cung cấp (AP)',
              'Đối soát giao dịch ngân hàng tự động',
              'Quản lý số dư tài khoản quỹ và tiền gửi'
            ]}
          />

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nhật Ký Gạch Nợ &amp; Thanh Toán (Payment Allocation Logs)</h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Tích hợp Module M32 Payments</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    <th className="px-4 py-2.5">Mã Giao Dịch</th>
                    <th className="px-4 py-2.5">Mã Hóa Đơn</th>
                    <th className="px-4 py-2.5">Hình Thức</th>
                    <th className="px-4 py-2.5">Số Tham Chiếu Bank</th>
                    <th className="px-4 py-2.5 text-right">Số Tiền Gạch Nợ</th>
                    <th className="px-4 py-2.5">Ngày Thực Hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400 font-bold">PAY-{p.id}</td>
                      <td className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold">INV-{p.invoiceId}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-sans font-medium">{p.paymentMethod}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.referenceNo || 'REF-889123'}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {(p.amountPaid || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-sans">{p.paymentDate || '28/08/2026'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GENERAL LEDGER BOUNDARY */}
      {activeTab === 'gl' && (
        <div className="space-y-6">
          <RedirectPanel
            targetModule="M30"
            targetRoute="/finance"
            title="Sổ Cái Kế Toán Tổng Hợp Độc Quyền (Single-Writer General Ledger - M30)"
            description="Module M30 Finance & GL (General Ledger) là trung tâm duy nhất ghi nhận bút toán Nợ/Có (Debits/Credits), kết chuyển doanh thu - chi phí và chốt sổ tài chính (Financial Closing). Phân hệ M31 chỉ phát tín hiệu Financial Events."
            badgeText="M30 GL SINGLE WRITER"
            suggestedActions={[
              'Xem Sổ Nhật Ký Chung (General Journal)',
              'Tra cứu Bảng Cân Đối Số Phát Sinh (Trial Balance)',
              'Kiểm toán bút toán kế toán tài chính chi tiết'
            ]}
          />

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Financial Events Stream &amp; Single Writer GL Boundary</h3>
              </div>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-mono">System Boundary Stream</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Quy tắc ranh giới hệ thống: AR, AP và Tax/VAT phát sinh sự kiện tài chính (Financial Event). Accounting Engine độc quyền chuyển dịch sang các bút toán Single Writer GL.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    <th className="px-4 py-2.5">Event ID</th>
                    <th className="px-4 py-2.5">Nguồn Phát Sinh</th>
                    <th className="px-4 py-2.5">Loại Sự Kiện</th>
                    <th className="px-4 py-2.5">Chứng Từ Gốc</th>
                    <th className="px-4 py-2.5 text-right">Tổng Tiền</th>
                    <th className="px-4 py-2.5">Định Khoản GL Rules</th>
                    <th className="px-4 py-2.5">Mã GL Journal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                  {accountingEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3 text-blue-700 dark:text-blue-400 font-bold">{ev.eventId}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                          {ev.sourceModule}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400 font-semibold">{ev.eventType}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{ev.invoiceNumber}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {(ev.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-purple-700 dark:text-purple-400 font-semibold text-[11px]">{ev.entryRules}</td>
                      <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400 font-bold">{ev.glJournalId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FINANCIAL REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Báo Cáo Phân Tích Tuổi Nợ (AR/AP Aging Analysis)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân lớp công nợ theo chu kỳ 0-30 ngày, 31-60 ngày, 61-90 ngày và trên 90 ngày.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Trong hạn (0-30 ngày):</span>
                  <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">850,000,000 VNĐ (72%)</span>
                </div>
                <div className="flex justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Quá hạn 31-60 ngày:</span>
                  <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400 font-bold">210,000,000 VNĐ (18%)</span>
                </div>
                <div className="flex justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Quá hạn 61-90 ngày:</span>
                  <span className="font-mono tabular-nums text-orange-700 dark:text-orange-400 font-bold">85,000,000 VNĐ (7%)</span>
                </div>
                <div className="flex justify-between text-xs py-1.5">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Nợ xấu (&gt;90 ngày):</span>
                  <span className="font-mono tabular-nums text-rose-700 dark:text-rose-400 font-bold">35,000,000 VNĐ (3%)</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Bảng Cân Đối &amp; Báo Cáo KQKD (Financial Statements)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động tổng hợp dữ liệu từ GL để xuất Báo cáo Tài chính chuẩn Thông tư 200.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleExportPdf}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Báo Cáo Tài Chính Tổng Hợp (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI OCR SCAN SUPPLIER INVOICE */}
      {isOcrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">AI OCR Supplier Invoice Parsing Workbench</h3>
              </div>
              <button onClick={() => setIsOcrModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dán Văn Bản / Mã Thẻ Hóa Đơn Điện Tử (XML / Text Parser):
              </label>
              <textarea
                rows={6}
                value={ocrInputText}
                onChange={(e) => setOcrInputText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>

            {ocrResult && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-xl text-xs space-y-2">
                <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>AI Trích Xuất Thành Công ({ocrResult.aiEngine})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-mono font-medium">
                  <div>Số Hóa Đơn: <span className="text-slate-900 dark:text-white font-bold">{ocrResult.extractedData.invoiceNumber}</span></div>
                  <div>MST Đối Tác: <span className="text-slate-900 dark:text-white font-bold">{ocrResult.extractedData.partnerTaxCode}</span></div>
                  <div>Tiền Chưa Thuế: <span className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">{(ocrResult.extractedData.subtotal || 0).toLocaleString('vi-VN')} VNĐ</span></div>
                  <div>Thuế GTGT ({ocrResult.extractedData.vatRate}%): <span className="text-purple-700 dark:text-purple-400 font-bold tabular-nums">{(ocrResult.extractedData.taxAmount || 0).toLocaleString('vi-VN')} VNĐ</span></div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={handleRunOcr}
                disabled={isOcrLoading}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isOcrLoading ? 'Đang phân tích...' : 'Chạy AI OCR Trích Xuất'}</span>
              </button>
              {ocrResult && (
                <button
                  onClick={handleApplyOcrToForm}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Điền Tự Động Vào Form Hóa Đơn AP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW INVOICE */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tạo Hóa Đơn Mới ({newInvoiceForm.type})</h3>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại Hóa Đơn</label>
                  <select
                    value={newInvoiceForm.type}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="AR">Hóa đơn Phải Thu AR (Khách hàng)</option>
                    <option value="AP">Hóa đơn Phải Trả AP (Nhà cung cấp)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Hóa Đơn</label>
                  <input
                    type="text"
                    value={newInvoiceForm.invoiceNumber}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, invoiceNumber: e.target.value })}
                    placeholder="HD-AR-2026-001"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Đối Tác</label>
                <input
                  type="text"
                  value={newInvoiceForm.customerName}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerName: e.target.value })}
                  placeholder="Công ty Cổ phần MISA"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Số Thuế (MST)</label>
                  <input
                    type="text"
                    value={newInvoiceForm.taxCode}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, taxCode: e.target.value })}
                    placeholder="0101234567"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Thuế Suất GTGT (%)</label>
                  <select
                    value={newInvoiceForm.taxRate}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, taxRate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="10">10% (Phổ thông)</option>
                    <option value="8">8% (Ưu đãi)</option>
                    <option value="5">5% (Nông sản)</option>
                    <option value="0">0% (Xuất khẩu)</option>
                  </select>
                </div>
              </div>

              <div>
                <CurrencyInput
                  label="Tổng Số Tiền Chưa Thuế (VNĐ)"
                  value={newInvoiceForm.totalAmount}
                  onChange={(val) => setNewInvoiceForm({ ...newInvoiceForm, totalAmount: val.toString() })}
                  placeholder="VD: 100.000.000"
                  showBadge={true}
                  showPresets={true}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md cursor-pointer"
                >
                  Lưu &amp; Hạch Toán Sự Kiện GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREDIT NOTE (RMA RETURN LINKAGE) */}
      {isCreditNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Lập Credit Note (RMA Return Linkage)</h3>
              </div>
              <button onClick={() => setIsCreditNoteModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCreditNote} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Hóa Đơn AR Gốc</label>
                <input
                  type="text"
                  value={creditNoteForm.originalInvoiceNumber}
                  onChange={(e) => setCreditNoteForm({ ...creditNoteForm, originalInvoiceNumber: e.target.value })}
                  placeholder="HD-AR-2026-042"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Khách Hàng</label>
                <input
                  type="text"
                  value={creditNoteForm.customerName}
                  onChange={(e) => setCreditNoteForm({ ...creditNoteForm, customerName: e.target.value })}
                  placeholder="Công ty Cổ phần MISA"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã RMA Liên Kết</label>
                  <input
                    type="text"
                    value={creditNoteForm.rmaCode}
                    onChange={(e) => setCreditNoteForm({ ...creditNoteForm, rmaCode: e.target.value })}
                    placeholder="RMA-2026-008"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono font-medium"
                  />
                </div>
                <div>
                  <CurrencyInput
                    label="Số Tiền Giảm Chưa Thuế"
                    value={creditNoteForm.amount}
                    onChange={(val) => setCreditNoteForm({ ...creditNoteForm, amount: val.toString() })}
                    placeholder="VD: 15.000.000"
                    showBadge={true}
                    showPresets={true}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lý Do Điều Chỉnh</label>
                <input
                  type="text"
                  value={creditNoteForm.reason}
                  onChange={(e) => setCreditNoteForm({ ...creditNoteForm, reason: e.target.value })}
                  placeholder="Hàng lỗi kỹ thuật đợt giao 25/08 - Giảm trừ công nợ AR"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 shadow-md cursor-pointer"
                >
                  Phát Hành Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYMENT SETTLEMENT (GẠCH NỢ TỪNG PHẦN / TOÀN PHẦN - M32/M30 INTEGRATION) */}
      {isPaymentModalOpen && selectedInvoiceForPay && (() => {
        const finalAmt = Number(selectedInvoiceForPay.finalAmount) || 0;
        const paidAmt = Number(selectedInvoiceForPay.paidAmount) || 0;
        const remainingAmt = selectedInvoiceForPay.remainingAmount !== undefined
          ? Number(selectedInvoiceForPay.remainingAmount)
          : Math.max(0, finalAmt - paidAmt);
        const percentPaid = finalAmt > 0 ? Math.min(100, Math.round((paidAmt / finalAmt) * 100)) : 0;
        const invoicePayments = selectedInvoiceForPay.payments || [];

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedInvoiceForPay.type === 'AP' ? 'Lệnh Chi Trả Tiền Hóa Đơn AP' : 'Gạch Nợ Thu Tiền Hóa Đơn AR'}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Mã HĐ: <span className="font-bold text-blue-700 dark:text-blue-400">{selectedInvoiceForPay.invoiceNumber}</span> • {selectedInvoiceForPay.customerName || selectedInvoiceForPay.companyName}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Debt Tracking Cards & Progress */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Tổng Hóa Đơn</span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">{finalAmt.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Đã Thanh Toán</span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{paidAmt.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Số Dư Còn Lại</span>
                    <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">{remainingAmt.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-1">
                    <span>Tiến độ thanh toán:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{percentPaid}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Past Payment History (if any) */}
              {invoicePayments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Lịch sử các đợt thanh toán ({invoicePayments.length}):
                  </span>
                  <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {invoicePayments.map((p: any, idx: number) => (
                      <div key={idx} className="p-2 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{Number(p.amount || 0).toLocaleString('vi-VN')} đ</span>
                          <span className="text-slate-500 dark:text-slate-400 ml-2 font-mono text-[10px]">{p.paymentMethod}</span>
                          {p.referenceNo && <span className="text-slate-400 ml-1 text-[10px]">({p.referenceNo})</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleProcessPayment} className="space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Số Tiền Thanh Toán Đợt Này (VNĐ)</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPaymentForm({ ...paymentForm, amountPaid: String(remainingAmt) })}
                        className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[10px] font-bold border border-blue-200 dark:border-blue-800 cursor-pointer"
                      >
                        100% còn lại
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentForm({ ...paymentForm, amountPaid: String(Math.round(remainingAmt * 0.5)) })}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[10px] font-medium border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        50%
                      </button>
                    </div>
                  </div>
                  <CurrencyInput
                    value={paymentForm.amountPaid}
                    onChange={(val) => setPaymentForm({ ...paymentForm, amountPaid: val.toString() })}
                    placeholder="VD: 50.000.000"
                    showBadge={true}
                    showPresets={false}
                  />
                  {Number(paymentForm.amountPaid) > remainingAmt && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">
                      Lưu ý: Số tiền nhập lớn hơn số nợ còn lại ({remainingAmt.toLocaleString('vi-VN')} đ)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hình Thức Thanh Toán</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="BANK_TRANSFER">Chuyển Khoản (Bank Transfer)</option>
                      <option value="CASH">Tiền Mặt (Cash Fund)</option>
                      <option value="CREDIT_CARD">Thẻ Tín Dụng Doanh Nghiệp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Tham Chiếu Giao Dịch</label>
                    <input
                      type="text"
                      value={paymentForm.referenceNo}
                      onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi Chú Hạch Toán</label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Xác Nhận Thanh Toán &amp; Hạch Toán GL</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: 3-WAY MATCH AP INVOICE ↔ PO (M08) ↔ GRN (WMS) */}
      {isThreeWayMatchModalOpen && selectedInvoiceForMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Đối Soát 3 Chiều AP Invoice ↔ PO (M08) ↔ Phiếu Nhập Kho GRN (WMS)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Hóa đơn: <strong className="text-rose-700 dark:text-rose-400">{selectedInvoiceForMatch.invoiceNumber}</strong> • {selectedInvoiceForMatch.customerName || selectedInvoiceForMatch.companyName}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsThreeWayMatchModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls Bar: PO Selection & Tolerance */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Liên Kết Đơn Mua Hàng PO (M08)</label>
                <select
                  value={selectedPoId}
                  onChange={(e) => {
                    setSelectedPoId(e.target.value);
                    handleExecuteThreeWayMatch(matchTolerance, e.target.value);
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono font-medium text-slate-900 dark:text-white"
                >
                  <option value="">-- Tự động tìm theo Order ID --</option>
                  {availablePos.map((p: any) => (
                    <option key={p.id} value={p.poCode || p.id}>
                      {p.poCode || `PO-#${p.id}`} - {(p.totalAmount || 0).toLocaleString('vi-VN')} đ
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngưỡng Sai Lệch Cho Phép (Tolerance)</label>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 5].map((tol) => (
                    <button
                      key={tol}
                      type="button"
                      onClick={() => {
                        setMatchTolerance(tol);
                        handleExecuteThreeWayMatch(tol, selectedPoId);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer border transition ${
                        matchTolerance === tol
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tol}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 md:pt-0">
                <button
                  type="button"
                  onClick={() => handleExecuteThreeWayMatch(matchTolerance, selectedPoId)}
                  disabled={isMatchingLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isMatchingLoading ? 'animate-spin' : ''}`} />
                  <span>Đối Soát Lại</span>
                </button>
              </div>
            </div>

            {/* Match Status Banner */}
            {threeWayMatchDossier && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  threeWayMatchDossier.isApprovedForPayment
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : threeWayMatchDossier.matchStatus === 'PENDING_GOODS_RECEIPT'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {threeWayMatchDossier.isApprovedForPayment ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold">
                      {threeWayMatchDossier.isApprovedForPayment
                        ? '3-WAY MATCH HỢP LỆ — ĐỦ ĐIỀU KIỆN GIẢI NGÂN AP'
                        : `CHƯA ĐỦ ĐIỀU KIỆN GIẢI NGÂN (${threeWayMatchDossier.matchStatus})`}
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90">{threeWayMatchDossier.message}</p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-slate-600 dark:text-slate-400">Đơn hàng PO: <strong className="text-slate-900 dark:text-white">{threeWayMatchDossier.poCode}</strong></div>
                  <div className="text-slate-600 dark:text-slate-400">Phiếu nhập kho: <strong className="text-slate-900 dark:text-white">{threeWayMatchDossier.grnCode}</strong></div>
                </div>
              </div>
            )}

            {/* Line Matching Table */}
            {threeWayMatchDossier && threeWayMatchDossier.lineMatches && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Đối Soát Chi Tiết Từng Dòng Hàng Hóa ({threeWayMatchDossier.lineMatches.length} mặt hàng):
                </span>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 text-[11px] uppercase">
                        <th className="px-3 py-2.5">Sản Phẩm / SKU</th>
                        <th className="px-3 py-2.5 text-center">SL Hóa Đơn</th>
                        <th className="px-3 py-2.5 text-center">SL Đặt PO</th>
                        <th className="px-3 py-2.5 text-center">SL Thực Nhập GRN</th>
                        <th className="px-3 py-2.5 text-right">Giá Hóa Đơn</th>
                        <th className="px-3 py-2.5 text-right">Giá PO</th>
                        <th className="px-3 py-2.5 text-center">Lệch Giá</th>
                        <th className="px-3 py-2.5 text-center">Kết Quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                      {threeWayMatchDossier.lineMatches.map((line: any, idx: number) => {
                        const isLineOk = line.status === 'MATCHED' || line.status === 'TOLERANCE_MATCHED';
                        return (
                          <tr key={idx} className={isLineOk ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60' : 'bg-rose-50/30 dark:bg-rose-950/20'}>
                            <td className="px-3 py-2.5 font-sans">
                              <div className="font-semibold text-slate-900 dark:text-white">{line.productName || `SP #${line.productId}`}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{line.sku || 'N/A'}</div>
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-800 dark:text-slate-200">{line.invoiceQty}</td>
                            <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-400">{line.poQty}</td>
                            <td className="px-3 py-2.5 text-center font-bold text-blue-700 dark:text-blue-400">{line.grnReceivedQty}</td>
                            <td className="px-3 py-2.5 text-right text-slate-800 dark:text-slate-200 tabular-nums">{(line.invoiceUnitPrice || 0).toLocaleString('vi-VN')} đ</td>
                            <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-400 tabular-nums">{(line.poUnitPrice || 0).toLocaleString('vi-VN')} đ</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={line.priceVariancePercent > 2 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                                {line.priceVariancePercent}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  line.status === 'MATCHED'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : line.status === 'TOLERANCE_MATCHED'
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                    : line.status === 'PRICE_MISMATCH'
                                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {line.status === 'MATCHED'
                                  ? 'Khớp 100%'
                                  : line.status === 'TOLERANCE_MATCHED'
                                  ? 'Dung sai'
                                  : line.status === 'PRICE_MISMATCH'
                                  ? 'Lệch giá'
                                  : line.status === 'QTY_MISMATCH'
                                  ? 'Lệch SL'
                                  : 'Chưa nhập kho'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Ngưỡng dung sai áp dụng: <strong className="text-indigo-700 dark:text-indigo-400">{matchTolerance}%</strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsThreeWayMatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Đóng
                </button>
                {threeWayMatchDossier?.isApprovedForPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsThreeWayMatchModalOpen(false);
                      handleOpenPaymentModal(selectedInvoiceForMatch);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Duyệt Giải Ngân &amp; Mở Lệnh Chi AP</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OFFSET CREDIT NOTE TO AR INVOICE (M15 RMA RETURN DEBT REDUCTION) */}
      {isOffsetCreditNoteModalOpen && selectedInvoiceForOffset && (() => {
        const finalAmt = Number(selectedInvoiceForOffset.finalAmount) || 0;
        const paidAmt = Number(selectedInvoiceForOffset.paidAmount) || 0;
        const remainingAmt = selectedInvoiceForOffset.remainingAmount !== undefined
          ? Number(selectedInvoiceForOffset.remainingAmount)
          : Math.max(0, finalAmt - paidAmt);
        const offsetAmt = Number(offsetForm.offsetAmount) || 0;
        const estimatedRemainingAfter = Math.max(0, remainingAmt - offsetAmt);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FileCheck2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Cấn Trừ Công Nợ Bằng Credit Note</h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Hóa đơn AR: <strong className="text-blue-700 dark:text-blue-400">{selectedInvoiceForOffset.invoiceNumber}</strong>
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsOffsetCreditNoteModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Debt Info Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Khách hàng:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedInvoiceForOffset.customerName || selectedInvoiceForOffset.companyName}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Số dư công nợ hiện tại:</span>
                  <span className="font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">{remainingAmt.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1">
                  <span>Dư nợ sau cấn trừ dự kiến:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{estimatedRemainingAfter.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <form onSubmit={handleProcessOffsetCreditNote} className="space-y-3.5 text-xs">
                {/* Available Credit Notes Selector */}
                {availableCreditNotesForOffset.length > 0 ? (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chọn Credit Note Khả Dụng</label>
                    <select
                      onChange={(e) => {
                        const chosen = availableCreditNotesForOffset.find((cn: any) => cn.creditNoteNumber === e.target.value);
                        if (chosen) {
                          const maxCanOffset = Math.min(remainingAmt, Number(chosen.finalAmount || chosen.amount || 0));
                          setOffsetForm({
                            ...offsetForm,
                            creditNoteNumber: chosen.creditNoteNumber,
                            rmaCode: chosen.rmaCode || '',
                            offsetAmount: String(maxCanOffset),
                            notes: `Cấn trừ ${chosen.creditNoteNumber} theo đơn trả hàng RMA ${chosen.rmaCode || ''}`,
                          });
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="">-- Chọn chứng từ Credit Note --</option>
                      {availableCreditNotesForOffset.map((cn: any) => (
                        <option key={cn.id} value={cn.creditNoteNumber}>
                          {cn.creditNoteNumber} - {Number(cn.finalAmount || cn.amount || 0).toLocaleString('vi-VN')} đ ({cn.rmaCode || 'RMA'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Credit Note (CN)</label>
                      <input
                        type="text"
                        value={offsetForm.creditNoteNumber}
                        onChange={(e) => setOffsetForm({ ...offsetForm, creditNoteNumber: e.target.value })}
                        placeholder="CN-2026-001"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã RMA Trả Hàng</label>
                      <input
                        type="text"
                        value={offsetForm.rmaCode}
                        onChange={(e) => setOffsetForm({ ...offsetForm, rmaCode: e.target.value })}
                        placeholder="RMA-2026-004"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Số Tiền Cấn Trừ (VNĐ)</label>
                    <button
                      type="button"
                      onClick={() => setOffsetForm({ ...offsetForm, offsetAmount: String(remainingAmt) })}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Cấn trừ tối đa ({remainingAmt.toLocaleString('vi-VN')} đ)
                    </button>
                  </div>
                  <CurrencyInput
                    value={offsetForm.offsetAmount}
                    onChange={(val) => setOffsetForm({ ...offsetForm, offsetAmount: val.toString() })}
                    placeholder="VD: 15.000.000"
                    showBadge={true}
                    showPresets={false}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lý Do / Diễn Giải Cấn Trừ</label>
                  <input
                    type="text"
                    value={offsetForm.notes}
                    onChange={(e) => setOffsetForm({ ...offsetForm, notes: e.target.value })}
                    placeholder="Cấn trừ công nợ khách hàng theo chứng từ trả hàng RMA"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsOffsetCreditNoteModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isOffsetLoading}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isOffsetLoading ? 'Đang hạch toán...' : 'Xác Nhận Cấn Trừ & Giảm Nợ (TK 521 / TK 131)'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: ETAX CQT SUBMISSION */}
      {isEtaxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Nộp Tờ Khai Thuế GTGT eTax (CQT Portal Direct)</h3>
              </div>
              <button onClick={() => setIsEtaxModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="text-slate-600 dark:text-slate-400">Kỳ Kê Khai Thuế: <span className="text-slate-900 dark:text-white font-bold">Q3/2026 (Tháng 07, 08, 09)</span></div>
                <div className="text-slate-600 dark:text-slate-400">Mẫu Tờ Khai: <span className="text-emerald-700 dark:text-emerald-400 font-bold">Mẫu 01/GTGT (Thông tư 80/2021/TT-BTC)</span></div>
                <div className="text-slate-600 dark:text-slate-400">Chữ Ký Số HSM: <span className="text-blue-700 dark:text-blue-400 font-mono font-semibold">SHA256-RSA-NEXUSSYNC-SECURE-KEY (ACTIVE)</span></div>
              </div>

              {etaxResult && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-2">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Cơ Quan Thuế Đã Tiếp Nhận Thành Công!</span>
                  </div>
                  <div className="font-mono text-slate-700 dark:text-slate-300">Mã Giao Dịch CQT: <span className="text-emerald-800 dark:text-emerald-300 font-bold">{etaxResult.cqtReceiptId}</span></div>
                  <div className="font-mono text-slate-700 dark:text-slate-300">Trạng Thái: <span className="text-slate-900 dark:text-white font-bold">{etaxResult.summary?.statusText}</span></div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                onClick={handleSubmitEtax}
                disabled={isEtaxLoading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isEtaxLoading ? 'Đang truyền nhận eTax...' : 'Ký Số HSM & Nộp CQT'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DUNNING VIETQR REMINDER & COMMERCIAL LAW ARTICLE 306 ENGINE */}
      {isDunningModalOpen && selectedDunningInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Mã VietQR Chuẩn NAPAS 247 &amp; Công Văn Nhắc Nợ Quá Hạn</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tự động tính lãi phạt theo Điều 306 Luật Thương mại 2005 &amp; Thể thức văn bản NĐ 30/2020/NĐ-CP
                  </p>
                </div>
              </div>
              <button onClick={() => setIsDunningModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dunning Level Selector */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Cấp độ đôn đốc:</span>
                <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleOpenDunningModal(selectedDunningInvoice, 1, dunningInterestRate)}
                    className={`px-3 py-1.5 rounded-md font-semibold text-xs transition cursor-pointer ${dunningReminderLevel === 1 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    Lần 1 (Thiện chí)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDunningModal(selectedDunningInvoice, 2, dunningInterestRate)}
                    className={`px-3 py-1.5 rounded-md font-semibold text-xs transition cursor-pointer ${dunningReminderLevel === 2 ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    Lần 2 (Cảnh báo tín dụng)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDunningModal(selectedDunningInvoice, 3, dunningInterestRate)}
                    className={`px-3 py-1.5 rounded-md font-semibold text-xs transition cursor-pointer ${dunningReminderLevel === 3 ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    Lần 3 (Khởi kiện Điều 306)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Lãi suất quá hạn (%/năm):</span>
                <input
                  type="number"
                  step="0.1"
                  value={dunningInterestRate}
                  onChange={(e) => {
                    setDunningInterestRate(e.target.value);
                    handleOpenDunningModal(selectedDunningInvoice, dunningReminderLevel, e.target.value);
                  }}
                  className="w-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            {dunningData ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                {/* Left Column: VietQR Code & Bank Info */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
                    <div className="relative group bg-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                      <img
                        src={dunningData.vietQrUrl}
                        alt="NAPAS 247 VietQR"
                        className="w-52 h-52 object-contain"
                      />
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                        NAPAS 247
                      </div>
                    </div>

                    <div className="w-full mt-3 space-y-2">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Cú pháp:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{dunningData.paymentMemo}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(dunningData.paymentMemo);
                              setCopiedMemo(true);
                              setTimeout(() => setCopiedMemo(false), 2000);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                            title="Copy cú pháp"
                          >
                            {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {dunningData.qrPayload && (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Chuỗi EMVCo:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{dunningData.qrPayload}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(dunningData.qrPayload);
                                setCopiedPayload(true);
                                setTimeout(() => setCopiedPayload(false), 2000);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                              title="Copy mã QR payload"
                            >
                              {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank & Financial Settlement Summary */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Ngân Hàng Thụ Hưởng:</span>
                      <span className="text-slate-900 dark:text-white font-bold">{dunningData.bankInfo?.bankName} (BIN {dunningData.bankInfo?.bin})</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Số Tài Khoản:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold text-sm">{dunningData.bankInfo?.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Chủ Tài Khoản:</span>
                      <span className="text-slate-900 dark:text-white font-semibold">{dunningData.bankInfo?.accountName}</span>
                    </div>

                    {/* Interest details */}
                    <div className="bg-amber-50/60 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 space-y-1 mt-2">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Nợ gốc quá hạn ({dunningData.calculation?.overdueDays || 0} ngày):</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">{(dunningData.calculation?.principalAmount || 0).toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Lãi phạt chậm trả (Đ.306 LTM):</span>
                        <span className="font-mono font-semibold text-rose-700 dark:text-rose-400 tabular-nums">+{(dunningData.calculation?.interestPenalty || 0).toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                      <div className="flex justify-between text-slate-900 dark:text-white font-bold border-t border-amber-200 dark:border-amber-800 pt-1 text-xs">
                        <span>Tổng tiền cần thanh toán:</span>
                        <span className="font-mono text-emerald-800 dark:text-emerald-400 text-sm tabular-nums">{(dunningData.calculation?.totalDue || 0).toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Formal Administrative Dunning Notice Dispatch */}
                <div className="lg:col-span-7 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>Công Văn Nhắc Nợ Chính Thức (Số {dunningData.dispatchNumber || 'CV-2026/NN'})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (dunningData.dunningLetter) {
                          navigator.clipboard.writeText(dunningData.dunningLetter);
                          setCopiedLetter(true);
                          setTimeout(() => setCopiedLetter(false), 2000);
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLetter ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
                    </button>
                  </div>

                  <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 overflow-y-auto max-h-[380px] whitespace-pre-wrap select-all">
                    {dunningData.dunningLetter}
                  </div>

                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300 text-[11px] flex items-center justify-between">
                    <span>Hạn chót thanh toán ấn định: <strong className="text-slate-900 dark:text-white">{dunningData.deadlineDate || 'Trong vòng 05 ngày làm việc'}</strong></span>
                    <span className="text-blue-700 dark:text-blue-400 font-semibold">Tự động khóa cấp tín dụng sau hạn</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                Đang tạo mã VietQR và dự thảo công văn nhắc nợ...
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DECREE 123 CANCELLATION REQUEST FORM */}
      {isCancellationFormModalOpen && invoiceToCancel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                <FileX className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Lập Biên Bản Hủy Hóa Đơn (Nghị Định 123/2020)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCancellationFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Quy trình hủy hóa đơn theo Điều 19 Nghị định 123/2020/NĐ-CP</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Khi hủy hóa đơn điện tử đã phát hành, hệ thống sẽ tự động lập Biên bản hủy kèm chữ ký số hai bên, đồng thời sinh <strong>Bút toán đảo (Reversal) trên Sổ cái M30 (GL)</strong> để triệt tiêu doanh thu &amp; thuế đã ghi nhận.
              </p>
            </div>

            <form onSubmit={handleSubmitCancelInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số Biên Bản Hủy</label>
                <input
                  type="text"
                  value={cancelForm.protocolNumber}
                  onChange={(e) => setCancelForm({ ...cancelForm, protocolNumber: e.target.value })}
                  placeholder="BBH-2026-HD001"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lý Do Hủy Hóa Đơn</label>
                <textarea
                  rows={2}
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                  placeholder="Sai sót về đơn giá, số lượng hoặc thông tin đối tác theo thỏa thuận..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đại Diện Bên Bán</label>
                  <input
                    type="text"
                    value={cancelForm.sellerRepresentative}
                    onChange={(e) => setCancelForm({ ...cancelForm, sellerRepresentative: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đại Diện Bên Mua</label>
                  <input
                    type="text"
                    value={cancelForm.buyerRepresentative}
                    onChange={(e) => setCancelForm({ ...cancelForm, buyerRepresentative: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cancelForm.sendNotice04ToCqt}
                    onChange={(e) => setCancelForm({ ...cancelForm, sendNotice04ToCqt: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                    Sinh Thông báo 04/SS-HĐĐT gửi Cơ Quan Thuế để giải trình sai sót
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCancellationFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <FileX className="w-4 h-4" />
                  <span>{isCancelling ? 'Đang hủy & đảo sổ...' : 'Xác Nhận Hủy & Đảo Sổ GL'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DECREE 123 FORMAL CANCELLATION PROTOCOL VIEWER */}
      {isCancellationProtocolModalOpen && selectedCancellationProtocol && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                <FileX className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Biên Bản Hủy Hóa Đơn Điện Tử (Nghị Định 123/2020/NĐ-CP)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCancellationProtocolModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formal Legal Document Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
              <div className="text-center space-y-1 border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-sm">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-medium">Độc lập - Tự do - Hạnh phúc</div>
                <div className="font-bold text-slate-900 dark:text-white pt-2 text-base">
                  BIÊN BẢN HỦY HÓA ĐƠN ĐIỆN TỬ
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono">
                  Số: <strong>{selectedCancellationProtocol.protocolNumber}</strong> • Ngày lập: {new Date(selectedCancellationProtocol.cancellationDate || Date.now()).toLocaleDateString('vi-VN')}
                </div>
              </div>

              <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Căn cứ <strong>Nghị định 123/2020/NĐ-CP</strong> ngày 19/10/2020 của Chính phủ quy định về hóa đơn, chứng từ;<br />
                Căn cứ <strong>Thông tư 78/2021/TT-BTC</strong> hướng dẫn thực hiện một số điều của Luật Quản lý thuế;<br />
                Hôm nay, hai bên thống nhất lập biên bản hủy hóa đơn điện tử với các nội dung sau:
              </div>

              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1 text-slate-800 dark:text-slate-200">
                  <div className="font-bold text-blue-900 dark:text-blue-400 uppercase">BÊN BÁN (BÊN A)</div>
                  <div>Đơn vị: <strong>{selectedCancellationProtocol.seller?.companyName || 'CÔNG TY CỔ PHẦN CÔNG NGHỆ & GIẢI PHÁP NEXUSSYNC ERP'}</strong></div>
                  <div>MST: <strong className="font-mono">{selectedCancellationProtocol.seller?.taxCode || '0108899888'}</strong></div>
                  <div>Đại diện: <strong>{selectedCancellationProtocol.seller?.representative}</strong></div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1 text-slate-800 dark:text-slate-200">
                  <div className="font-bold text-emerald-900 dark:text-emerald-400 uppercase">BÊN MUA (BÊN B)</div>
                  <div>Đơn vị: <strong>{selectedCancellationProtocol.buyer?.companyName}</strong></div>
                  <div>MST: <strong className="font-mono">{selectedCancellationProtocol.buyer?.taxCode}</strong></div>
                  <div>Đại diện: <strong>{selectedCancellationProtocol.buyer?.representative}</strong></div>
                </div>
              </div>

              {/* Cancelled Invoice Details */}
              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[11px]">
                <div className="font-bold text-slate-800 dark:text-slate-200 font-sans text-xs border-b border-slate-200 dark:border-slate-700 pb-1">
                  THÔNG TIN HÓA ĐƠN BỊ HỦY:
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>Số Hóa Đơn: <strong className="text-slate-900 dark:text-white">{selectedCancellationProtocol.invoice?.invoiceNumber}</strong></div>
                  <div>Ký hiệu (Serial): <strong className="text-slate-900 dark:text-white">{selectedCancellationProtocol.invoice?.serialNo}</strong></div>
                  <div>Mẫu số: <strong className="text-slate-900 dark:text-white">{selectedCancellationProtocol.invoice?.formCode}</strong></div>
                  <div>Mã CQT: <strong className="text-blue-700 dark:text-blue-400">{selectedCancellationProtocol.invoice?.cqtCode}</strong></div>
                  <div>Tổng tiền hóa đơn: <strong className="text-slate-900 dark:text-white tabular-nums">{(selectedCancellationProtocol.invoice?.totalAmount || 0).toLocaleString('vi-VN')} VNĐ</strong></div>
                  <div>Thuế GTGT: <strong className="text-slate-900 dark:text-white tabular-nums">{(selectedCancellationProtocol.invoice?.taxAmount || 0).toLocaleString('vi-VN')} VNĐ</strong></div>
                </div>
                <div className="pt-2 font-sans">
                  <strong>Lý do hủy:</strong> <span className="text-rose-700 dark:text-rose-400 font-semibold">{selectedCancellationProtocol.reason}</span>
                </div>
              </div>

              {/* Reversal Accounting Verification Badge */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Xác Nhận Hạch Toán Bút Toán Đảo Reversal Sổ Cái GL (M30)</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    Chứng từ kế toán đảo: {selectedCancellationProtocol.reversalJournalId || `REV-GL-${selectedCancellationProtocol.invoice?.invoiceNumber}`} • Nợ TK 511/3331 / Có TK 131/112
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700">
                  ĐÃ ĐẢO SỔ
                </span>
              </div>

              {/* Digital Signature Confirmation */}
              <div className="grid grid-cols-2 gap-4 pt-2 text-center text-xs">
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1 font-mono">
                  <div className="font-bold font-sans text-slate-700 dark:text-slate-300">ĐẠI DIỆN BÊN BÁN</div>
                  <div className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] py-2">
                    [ĐÃ KÝ ĐIỆN TỬ - VIETTEL-CA HSM]
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">{selectedCancellationProtocol.seller?.representative}</div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1 font-mono">
                  <div className="font-bold font-sans text-slate-700 dark:text-slate-300">ĐẠI DIỆN BÊN MUA</div>
                  <div className="text-blue-700 dark:text-blue-400 font-bold text-[10px] py-2">
                    [ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ]
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">{selectedCancellationProtocol.buyer?.representative}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Lưu trữ hồ sơ chứng từ điện tử theo quy định Luật Kế toán &amp; NĐ 123/2020
              </span>
              <button
                type="button"
                onClick={() => setIsCancellationProtocolModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ELECTRONIC VAT INVOICE DETAIL VIEWER */}
      {isDetailModalOpen && selectedInvoiceDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Chi Tiết Hóa Đơn Điện Tử VAT — {selectedInvoiceDetail.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CQT Authentication Badge Header */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">Cơ Quan Thuế (CQT) Cấp Mã:</span>
                  <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                    {selectedInvoiceDetail.cqtCode || 'T26-0001-A9F32E-78'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Mẫu số: <strong className="font-mono text-slate-800 dark:text-slate-200">1C26TAA</strong> • Ký hiệu: <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedInvoiceDetail.vatSeries || '1C26TAA'}</strong> • Số: <strong className="font-mono text-blue-700 dark:text-blue-400">{selectedInvoiceDetail.vatInvoiceNumber || selectedInvoiceDetail.invoiceNumber}</strong>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hợp Lệ CQT</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">Nghị định 123/2020</span>
              </div>
            </div>

            {/* Seller & Buyer Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Đơn Vị Bán Hàng (Seller)</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">CÔNG TY CỔ PHẦN CÔNG NGHỆ &amp; GIẢI PHÁP NEXUSSYNC ERP</div>
                <div className="text-slate-600 dark:text-slate-400 font-mono">MST: <strong className="text-slate-900 dark:text-white">0108899888</strong></div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Địa chỉ: Tòa nhà NexusSync Tower, 88 Phố Duy Tân, Cầu Giấy, Hà Nội</div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Đơn Vị Mua Hàng (Buyer)</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedInvoiceDetail.customerName || selectedInvoiceDetail.companyName || 'Công ty TNHH Công Nghệ Thiên Nam'}</div>
                <div className="text-slate-600 dark:text-slate-400 font-mono">MST: <strong className="text-slate-900 dark:text-white">{selectedInvoiceDetail.taxCode || '0315894231'}</strong></div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Địa chỉ: {selectedInvoiceDetail.address || 'Số 45 Lê Duẩn, Quận 1, TP. Hồ Chí Minh'}</div>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Chi Tiết Tiền Hàng &amp; Nghĩa Vụ Thuế GTGT (TT200)
              </div>
              <div className="p-4 space-y-2.5 bg-white dark:bg-slate-900">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Tiền hàng (Chưa bao gồm thuế GTGT):</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {(selectedInvoiceDetail.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Thuế suất GTGT áp dụng:</span>
                  <span className="font-mono font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    {selectedInvoiceDetail.taxRate || 10}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Tiền thuế GTGT đầu ra (TK 33311):</span>
                  <span className="font-mono font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                    {(selectedInvoiceDetail.taxAmount || Math.round((selectedInvoiceDetail.totalAmount || 0) * 0.1)).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>Tổng tiền thanh toán (Đã gồm GTGT):</span>
                  <span className="font-mono text-base text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {(selectedInvoiceDetail.finalAmount || (selectedInvoiceDetail.totalAmount || 0) + (selectedInvoiceDetail.taxAmount || 0)).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Digital HSM Certificate Information */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Chữ ký số: Viettel-CA Cloud HSM Sub-CA v3 | Ký ngày: {selectedInvoiceDetail.issueDate || '28/08/2026'}</span>
              </div>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">XML Signed (SHA256)</span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Tra cứu hóa đơn: <a href="https://hoadondientu.gdt.gov.vn" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">hoadondientu.gdt.gov.vn</a>
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-xs"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadVatPdf(selectedInvoiceDetail);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Hóa Đơn PDF CQT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RETRY / FIX VAT ERROR */}
      {isRetryVatModalOpen && selectedVatErrorInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Khắc Phục Lỗi Xuất HĐ VAT — {selectedVatErrorInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsRetryVatModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Nguyên nhân CQT từ chối cấp mã:</span>
              </div>
              <div className="text-rose-700 dark:text-rose-300 pl-5 font-medium">
                {retryVatForm.errorReason}
              </div>
            </div>

            <form onSubmit={handleRetryVat} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Số Thuế Đúng Của Người Mua (MST)</label>
                <input
                  type="text"
                  value={retryVatForm.taxCode}
                  onChange={(e) => setRetryVatForm({ ...retryVatForm, taxCode: e.target.value })}
                  placeholder="0315894231 (10 hoặc 13 số hợp lệ)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono font-medium focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Doanh Nghiệp Người Mua (Đúng ĐKKD)</label>
                <input
                  type="text"
                  value={retryVatForm.customerName}
                  onChange={(e) => setRetryVatForm({ ...retryVatForm, customerName: e.target.value })}
                  placeholder="Công ty Cổ phần Đầu tư Công nghệ Toàn Cầu"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Địa Chỉ Đăng Ký Thuế</label>
                <input
                  type="text"
                  value={retryVatForm.address}
                  onChange={(e) => setRetryVatForm({ ...retryVatForm, address: e.target.value })}
                  placeholder="Số 88 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRetryVatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Ký Số Lại &amp; Gửi Cấp Mã CQT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: M29 DMS SECURE VAULT & M02 AUDIT TRAIL VIEWER (Phase 10 & 11) */}
      {isDmsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400">
                  <FolderArchive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Kho Lưu Trữ Số M29 DMS &amp; Nhật Ký Kiểm Toán M02</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                      SECURE VAULT
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Hồ sơ chứng từ điện tử bảo quản 10 năm theo Luật Kế toán 2015 &amp; Nghị định 123/2020/NĐ-CP
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDmsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Overview Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Thông Tin Hồ Sơ Lưu Trữ</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ĐÃ NIÊM PHONG SỐ
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Mã Hồ Sơ DMS:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {dmsVaultData?.dmsDoc?.docCode || `DMS-INV-2026-${selectedDmsInvoice?.id || '001'}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Số Hóa Đơn:</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                    {selectedDmsInvoice?.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Cấp Lưu Trữ (Tier):</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                    {dmsVaultData?.dmsDoc?.storageTier || 'ACTIVE_VAULT_HOT'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Thời Hạn Bảo Quản:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    10 Năm ({new Date().getFullYear()} – {new Date().getFullYear() + 10})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Phân Loại Bảo Mật:</span>
                  <span className="font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-700 text-[11px]">
                    {dmsVaultData?.dmsDoc?.classification || 'CONFIDENTIAL_FINANCIAL'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Chữ Ký Số Pháp Lý:</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    Viettel-CA Cloud HSM Sub-CA v3
                  </span>
                </div>
              </div>

              {/* SHA-256 Cryptographic Hash */}
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Mã Băm Mật Mã Bất Biến (SHA-256 Cryptographic Checksum):
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                    Chuỗi Bất Biến Verified
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200 flex items-center justify-between break-all">
                  <span>{dmsVaultData?.dmsDoc?.sha256Hash || dmsVaultData?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(dmsVaultData?.dmsDoc?.sha256Hash || dmsVaultData?.sha256Hash || '');
                      onNotify('success', 'Đã sao chép SHA-256', 'Mã băm mật mã đã lưu vào bộ nhớ tạm.');
                    }}
                    className="ml-2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 cursor-pointer"
                    title="Sao chép SHA-256 Hash"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Workflow Pipeline Steps */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Quy Trình Kiểm Tra &amp; Niêm Phong 3 Bước (3-Step Enterprise Pipeline)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>1. Lập Hóa Đơn M31</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Khởi tạo chứng từ số, kiểm tra tính toàn vẹn dữ liệu thuế &amp; công nợ.</p>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>2. Ký Số Cloud HSM</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Ký số máy chủ HSM, truyền CQT nhận mã xác thực theo Nghị định 123/2020.</p>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>3. Niêm Phong M29 DMS</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Băm SHA-256, gắn thẻ siêu dữ liệu và ghi nhận chuỗi kiểm toán M02.</p>
                </div>
              </div>
            </div>

            {/* Document Export Actions & XML Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Tải Về Tệp Hồ Sơ Lưu Trữ (XML / PDF)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownloadInvoiceXml(selectedDmsInvoice)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Tải XML Ký Số (NĐ 123)</span>
                  </button>
                  <button
                    onClick={() => handleDownloadVatPdf(selectedDmsInvoice)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Bản Thể Hiện PDF</span>
                  </button>
                </div>
              </div>

              {/* Collapsible XML Content Preview */}
              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] max-h-40 overflow-y-auto space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                  <span>XML Schema: hoadondientu.gdt.gov.vn/2020/01/nd123</span>
                  <span className="text-emerald-400">XMLDSig RSA-SHA256</span>
                </div>
                <pre className="text-slate-300 overflow-x-auto whitespace-pre">
{`<?xml version="1.0" encoding="UTF-8"?>
<HDon xmlns="http://hoadondientu.gdt.gov.vn/2020/01/nd123">
  <DLHDon Id="DLHDon_${selectedDmsInvoice?.id}">
    <TTChung>
      <PBan>2.0.0</PBan>
      <THDon>Hóa đơn giá trị gia tăng</THDon>
      <KHMSHDon>${selectedDmsInvoice?.formCode || '1'}</KHMSHDon>
      <KHHDon>${selectedDmsInvoice?.serialNo || selectedDmsInvoice?.vatSeries || '1C26TAA'}</KHHDon>
      <SHDon>${selectedDmsInvoice?.invoiceNumber}</SHDon>
      <MCCQT>${selectedDmsInvoice?.cqtCode || 'T26-000-A9F32E'}</MCCQT>
    </TTChung>
    <NDHDon>
      <NMua><Ten>${selectedDmsInvoice?.customerName || selectedDmsInvoice?.companyName}</Ten><MST>${selectedDmsInvoice?.taxCode || '0315894231'}</MST></NMua>
      <TToan><TgTTTBSo>${(selectedDmsInvoice?.finalAmount || 0).toLocaleString('vi-VN')} VNĐ</TgTTTBSo></TToan>
    </NDHDon>
    <DSCKS><SignatureValue>VIETTEL_CA_CLOUD_HSM_VERIFIED_${selectedDmsInvoice?.id}</SignatureValue></DSCKS>
  </DLHDon>
</HDon>`}
                </pre>
              </div>
            </div>

            {/* M02 Audit Trail Entries */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  Nhật Ký Kiểm Toán M02 Audit Trail (Bất Biến)
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Mô-đun: M02-AUDIT</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-mono">
                        ARCHIVE_DMS
                      </span>
                      <span>Niêm phong số vào Kho tài liệu M29 DMS</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Người thực hiện: ke_toan_truong (Kế toán trưởng) • IP: 192.168.1.104 • SHA-256 Validated
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    THÀNH CÔNG
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-mono">
                        ISSUE_VAT
                      </span>
                      <span>Ký số Cloud HSM &amp; Cấp mã CQT Nghị định 123</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Người thực hiện: ke_toan_truong • Nhà cung cấp: Viettel-CA Cloud HSM
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    HỢP LỆ
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDmsModalOpen(false)}
                className="px-5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Confirm Dialog (Rule #19) */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
