import React, { useState, useEffect } from 'react';
import { CurrencyInput } from '../common/CurrencyInput';
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
  FileCode
} from 'lucide-react';
import { downloadInvoiceArApReportPdf, downloadVatElectronicInvoicePdf } from '../../utils/pdfExporter';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { RedirectPanel } from '../common/RedirectPanel';
import { DeepLinkBanner } from '../common/DeepLinkBanner';

interface M31InvoicesArApWorkspaceProps {
  onSelectEntity?: (entity: any) => void;
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message?: string) => void;
}

export const M31InvoicesArApWorkspace: React.FC<M31InvoicesArApWorkspaceProps> = ({
  onSelectEntity,
  onNotify = () => {},
}) => {
  // 6 Main Sub-Module Workspace Tabs according to Finance & Accounting Architecture
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'ar' | 'ap' | 'vat' | 'payments' | 'gl' | 'reports'>('M31', 'ar');

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

  // Dynamic Early Payment Discount State
  const [earlyDiscounts, setEarlyDiscounts] = useState<any>(null);
  const [isDiscountLoading, setIsDiscountLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchInvoicesAndData();
    fetchEarlyDiscountSuggestions();
  }, []);

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

  const handleOpenDunningModal = async (inv: any) => {
    setSelectedDunningInvoice(inv);
    setIsDunningLoading(true);
    setIsDunningModalOpen(true);
    try {
      const res = await fetch('/api/invoices/dunning-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: inv.id, channel: 'EMAIL_ZALO' }),
      });
      const data = await res.json();
      if (data.success) {
        setDunningData(data);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo nhắc nợ VietQR', err.message);
    } finally {
      setIsDunningLoading(false);
    }
  };

  const handleOpenEtaxModal = () => {
    setEtaxResult(null);
    setIsEtaxModalOpen(true);
  };

  const handleSubmitEtax = async () => {
    setIsEtaxLoading(true);
    try {
      const res = await fetch('/api/invoices/etax-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxPeriod: 'Q3/2026', declareType: 'CHINH_THUC' }),
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
  };

  const handleOpenPaymentModal = (invoice: any) => {
    setSelectedInvoiceForPay(invoice);
    setPaymentForm({
      amountPaid: String(invoice.finalAmount || 0),
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: `REF-PAY-${Date.now().toString().slice(-6)}`,
      notes: `Gạch nợ thanh toán cho Hóa đơn ${invoice.invoiceNumber}`,
    });
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;

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

  const handleIssueVatInvoice = async (invoice: any) => {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 space-y-6">
      {/* Top Header & Actions Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                FINANCE & ACCOUNTING SUITE
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Unified FICO Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý Phải thu (AR), Phải trả (AP), Thuế VAT Engine Authority, Payments & Sổ cái GL (TT200/2014)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsOcrModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI OCR Nhập Hóa Đơn</span>
          </button>

          <button
            onClick={handleOpenEtaxModal}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kê Khai eTax CQT</span>
          </button>

          <button
            onClick={fetchInvoicesAndData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>In Báo Cáo PDF</span>
          </button>
        </div>
      </div>

      {/* 4 Quick Stat Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng Phải Thu (AR - TK 131)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 font-mono">
            {totalArAmount.toLocaleString('vi-VN')} <span className="text-xs text-slate-500 font-normal">VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Chờ thu nợ:</span>
            <span className="font-bold text-emerald-700 font-mono">{totalArUnpaid.toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng Phải Trả (AP - TK 331)</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 font-mono">
            {totalApAmount.toLocaleString('vi-VN')} <span className="text-xs text-slate-500 font-normal">VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Chờ thanh toán:</span>
            <span className="font-bold text-rose-700 font-mono">{totalApUnpaid.toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Nghĩa Vụ Thuế GTGT (VAT Position)</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-purple-700 mt-2 font-mono">
            {netVatPayable.toLocaleString('vi-VN')} <span className="text-xs text-slate-500 font-normal">VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-mono">
            <span>Đầu ra: {totalVatOutput.toLocaleString('vi-VN')}</span>
            <span>Đầu vào: {totalVatInput.toLocaleString('vi-VN')}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Financial Events Stream</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-blue-700 mt-2 font-mono">
            {accountingEvents.length} <span className="text-xs text-slate-500 font-normal">Bút toán Event</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Trạng thái GL:</span>
            <span className="font-bold text-emerald-700">100% Single Writer GL</span>
          </div>
        </div>
      </div>

      {/* 6 Unified Workspace Sub-Module Tabs (M41 Master Spec) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('ar')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'ar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>01. AR — Phải Thu</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'ar'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {arInvoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ap')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'ap'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-4 h-4 shrink-0" />
            <span>02. AP — Phải Trả</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'ap'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {apInvoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vat')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'vat'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span>03. Thuế &amp; VAT Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>04. Thanh Toán &amp; Thu Chi</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'payments'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {payments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gl')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'gl'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>05. GL Posting Boundary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4 shrink-0" />
            <span>06. Báo Cáo Tài Chính</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            AR / AP Authority
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            VAS TT200 e-Invoice
          </span>
        </div>
      </div>

      {/* SEARCH & ACTION TOOLBAR */}
      {(activeTab === 'ar' || activeTab === 'ap') && (
        <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã HĐ, khách hàng, MST, mã CQT..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Payment Status Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-slate-500">Gạch nợ:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả thanh toán</option>
                  <option value="ISSUED">Phát hành (Issued)</option>
                  <option value="UNPAID">Chưa thanh toán</option>
                  <option value="PARTIAL">Thanh toán 1 phần</option>
                  <option value="PAID">Đã gạch nợ (Paid)</option>
                </select>
              </div>

              {/* VAT Invoice Status Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-slate-500">Xuất HĐ VAT:</span>
                <select
                  value={vatStatusFilter}
                  onChange={(e) => setVatStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả trạng thái VAT</option>
                  <option value="ISSUED">Đã xuất VAT (Cấp mã CQT)</option>
                  <option value="PENDING">Chờ xuất VAT (Chờ ký số)</option>
                  <option value="ERROR">Đơn lỗi VAT (Cần sửa)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
              {activeTab === 'ar' && (
                <button
                  onClick={() => setIsCreditNoteModalOpen(true)}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  <span>Credit Note (RMA)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setNewInvoiceForm((prev) => ({ ...prev, type: activeTab === 'ar' ? 'AR' : 'AP' }));
                  setIsNewInvoiceModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center space-x-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Hóa Đơn {activeTab.toUpperCase()} Mới</span>
              </button>
            </div>
          </div>

          {/* Quick VAT Filter Badges Bar */}
          {activeTab === 'ar' && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Phân loại xuất HĐ VAT (Nghị định 123/2020):
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setVatStatusFilter('ALL')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer border ${
                      vatStatusFilter === 'ALL'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({arInvoices.length})
                  </button>
                  <button
                    onClick={() => setVatStatusFilter('ISSUED')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                      vatStatusFilter === 'ISSUED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đã xuất ({arVatIssuedCount})
                  </button>
                  <button
                    onClick={() => setVatStatusFilter('PENDING')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                      vatStatusFilter === 'PENDING'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-amber-600" />
                    Chờ xử lý ({arVatPendingCount})
                  </button>
                  <button
                    onClick={() => setVatStatusFilter('ERROR')}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                      vatStatusFilter === 'ERROR'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    Đơn lỗi ({arVatErrorCount})
                  </button>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Khớp kết quả: <strong className="text-slate-800 font-mono">{filteredArInvoices.length}</strong> hóa đơn
              </span>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: AR — ACCOUNTS RECEIVABLE */}
      {activeTab === 'ar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Danh Sách Hóa Đơn Phải Thu Khách Hàng (AR - TK 131)</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Hiển thị {filteredArInvoices.length} chứng từ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-4 py-3.5">Mã Hóa Đơn</th>
                    <th className="px-4 py-3.5">Khách Hàng & MST</th>
                    <th className="px-4 py-3.5 text-right">Tiền Hàng</th>
                    <th className="px-4 py-3.5 text-right">Thuế GTGT</th>
                    <th className="px-4 py-3.5 text-right">Tổng Nợ AR</th>
                    <th className="px-4 py-3.5">Trạng Thái Thu Nợ</th>
                    <th className="px-4 py-3.5">
                      <div className="flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Trạng Thái Xuất VAT</span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredArInvoices.map((inv) => {
                    const currentVatStatus = inv.vatStatus || inv.status || 'PENDING';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-4 font-bold text-blue-700 font-mono">
                          {inv.invoiceNumber}
                          <div className="text-[10px] text-slate-500 font-sans font-normal">{inv.issueDate || '28/08/2026'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">{inv.customerName || inv.companyName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">MST: {inv.taxCode || '0315894231'}</div>
                        </td>
                        <td className="px-4 py-4 font-mono tabular-nums text-right font-semibold text-slate-700">
                          {(inv.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-4 font-mono tabular-nums text-right font-semibold text-purple-700">
                          {(inv.taxAmount || 0).toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-4 font-mono tabular-nums text-right font-semibold text-emerald-700">
                          {(inv.finalAmount || 0).toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              inv.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : inv.paymentStatus === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {inv.paymentStatus === 'PAID' ? 'Đã gạch nợ' : inv.paymentStatus === 'PARTIAL' ? 'Thanh toán 1 phần' : 'Chưa thu tiền'}
                          </span>
                        </td>

                        {/* VAT INVOICE STATUS COLUMN WITH 3 COLOR-CODED LABELS */}
                        <td className="px-4 py-4">
                          {currentVatStatus === 'ISSUED' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Đã xuất VAT</span>
                              </span>
                              <div className="text-[10px] font-mono text-emerald-700 font-semibold pl-1">
                                {inv.vatInvoiceNumber ? `Số: ${inv.vatInvoiceNumber}` : 'Ký số HSM CQT'}
                              </div>
                              {inv.cqtCode && (
                                <div className="text-[9px] font-mono text-slate-500 pl-1 truncate max-w-[130px]" title={`Mã CQT: ${inv.cqtCode}`}>
                                  CQT: {inv.cqtCode}
                                </div>
                              )}
                            </div>
                          ) : currentVatStatus === 'ERROR' || currentVatStatus === 'REJECTED' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-800 border-rose-200 shadow-2xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Lỗi xuất VAT</span>
                              </span>
                              <div className="text-[10px] font-medium text-rose-700 pl-1 max-w-[150px] truncate" title={inv.vatErrorReason || inv.rejectionReason || 'CQT từ chối cấp mã'}>
                                {inv.vatErrorReason || 'Lỗi cấp mã CQT'}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-200 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Chờ xử lý</span>
                              </span>
                              <div className="text-[10px] font-medium text-amber-700 pl-1">
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
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 text-[11px] font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                                title="Tải Hóa Đơn Điện Tử VAT có mã CQT (PDF)"
                              >
                                <Download className="w-3 h-3 text-emerald-700" />
                                <span>In HĐ VAT</span>
                              </button>
                            ) : currentVatStatus === 'ERROR' || currentVatStatus === 'REJECTED' ? (
                              <button
                                onClick={() => handleOpenRetryVatModal(inv)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg border border-rose-300 text-[11px] font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                                title="Sửa thông tin MST & Thử cấp lại mã CQT"
                              >
                                <RefreshCw className="w-3 h-3 text-rose-700" />
                                <span>Sửa & Thử lại</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleIssueVatInvoice(inv)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                                title="Ký số Cloud HSM & Lấy mã CQT"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Xuất HĐ VAT</span>
                              </button>
                            )}

                            {/* View Detail Modal Button */}
                            <button
                              onClick={() => handleOpenDetailModal(inv)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
                              title="Xem chi tiết hóa đơn & Thông số CQT"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Payment Settlement Button */}
                            {inv.paymentStatus !== 'PAID' && (
                              <button
                                onClick={() => handleOpenPaymentModal(inv)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 text-[11px] font-bold transition cursor-pointer shadow-xs"
                                title="Gạch nợ phải thu AR"
                              >
                                Gạch nợ
                              </button>
                            )}

                            {/* Dunning VietQR Button */}
                            <button
                              onClick={() => handleOpenDunningModal(inv)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
                              title="Tạo VietQR & Nhắc nợ"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Credit Notes (RMA Linked) Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Credit Notes — Giảm Trừ Nợ AR (RMA Returns)</h3>
              </div>
              <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">Credit Note Engine Authority</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="px-4 py-2.5">Mã Credit Note</th>
                    <th className="px-4 py-2.5">Hóa Đơn Gốc</th>
                    <th className="px-4 py-2.5">Mã RMA / Lý Do</th>
                    <th className="px-4 py-2.5">Khách Hàng</th>
                    <th className="px-4 py-2.5 text-right">Giá Trị Giảm</th>
                    <th className="px-4 py-2.5">Định Khoản GL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {creditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-amber-700">{cn.creditNoteNumber}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{cn.originalInvoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-700 font-sans">
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] mr-1.5 font-mono font-bold">
                          {cn.rmaCode}
                        </span>
                        {cn.reason}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-sans font-semibold">{cn.customerName}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-700">
                        -{(cn.finalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px] font-semibold">{cn.accountingEntry}</td>
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
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Thuật Toán Tối Ưu Chiết Khấu Thanh Toán Sớm AP (2/10 Net 30)</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Tiềm năng tiết kiệm thanh toán ngay: <span className="font-bold text-emerald-700">{earlyDiscounts.totalPotentialSavingsAP?.toLocaleString('vi-VN')} VNĐ</span>
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Dynamic AP Engine
                </span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Danh Sách Hóa Đơn Phải Trả Nhà Cung Cấp (AP - TK 331)</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Hiển thị {filteredApInvoices.length} chứng từ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-4 py-3.5">Mã Hóa Đơn AP</th>
                    <th className="px-4 py-3.5">Nhà Cung Cấp & MST</th>
                    <th className="px-4 py-3.5 text-right">Tiền Hàng</th>
                    <th className="px-4 py-3.5 text-right">Thuế Đầu Vào</th>
                    <th className="px-4 py-3.5 text-right">Nợ AP Phải Trả</th>
                    <th className="px-4 py-3.5">Trạng Thái Thanh Toán</th>
                    <th className="px-4 py-3.5">Hóa Đơn VAT Đầu Vào</th>
                    <th className="px-4 py-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredApInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-4 font-bold text-rose-700 font-mono">
                        {inv.invoiceNumber}
                        <div className="text-[10px] text-slate-500 font-sans font-normal">{inv.issueDate || '28/08/2026'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{inv.customerName || inv.companyName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">MST: {inv.taxCode || '0109988776'}</div>
                      </td>
                      <td className="px-4 py-4 font-mono tabular-nums text-right font-semibold text-slate-700">
                        {(inv.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-4 font-mono tabular-nums text-right font-semibold text-purple-700">
                        {(inv.taxAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-4 font-mono tabular-nums text-right font-semibold text-rose-700">
                        {(inv.finalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            inv.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {inv.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ trả tiền'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          <span>Hợp lệ CQT (TK 133)</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {inv.paymentStatus !== 'PAID' && (
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-300 text-[11px] font-bold transition cursor-pointer shadow-xs"
                            >
                              Lập Lệnh Chi AP
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetailModal(inv)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
                            title="Xem chi tiết hóa đơn đầu vào"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Debit Notes (Purchase Return Linked) Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Debit Notes — Giảm Trừ Nợ AP (Purchase Returns)</h3>
              </div>
              <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">Purchase Return Boundary</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="px-4 py-2.5">Mã Debit Note</th>
                    <th className="px-4 py-2.5">Hóa Đơn AP Gốc</th>
                    <th className="px-4 py-2.5">Mã Trả Hàng PO</th>
                    <th className="px-4 py-2.5">Nhà Cung Cấp</th>
                    <th className="px-4 py-2.5 text-right">Số Tiền Giảm</th>
                    <th className="px-4 py-2.5">Định Khoản GL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {debitNotes.map((dn) => (
                    <tr key={dn.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-blue-700">{dn.debitNoteNumber}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{dn.originalInvoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-700 font-sans">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 text-[10px] mr-1.5 font-mono font-bold">
                          {dn.purchaseReturnCode}
                        </span>
                        {dn.reason}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-sans font-semibold">{dn.supplierName}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        -{(dn.finalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px] font-semibold">{dn.accountingEntry}</td>
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
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">CENTRAL TAX / VAT ENGINE AUTHORITY</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Cơ quan tính toán và kiểm soát nghĩa vụ thuế GTGT tập trung (Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC)
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authority Status: ACTIVE</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500">Thuế GTGT Đầu Ra (Output VAT - Sales/POS)</div>
                <div className="text-lg font-bold text-emerald-700 mt-1 font-mono">
                  {totalVatOutput.toLocaleString('vi-VN')} VNĐ
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Tài khoản hạch toán: <span className="font-mono font-bold text-slate-700">TK 3331</span></div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500">Thuế GTGT Đầu Vào Khấu Trừ (Input VAT - Purchase)</div>
                <div className="text-lg font-bold text-blue-700 mt-1 font-mono">
                  {totalVatInput.toLocaleString('vi-VN')} VNĐ
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Tài khoản hạch toán: <span className="font-mono font-bold text-slate-700">TK 1331</span></div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500">Nghĩa Vụ Thuế GTGT Ròng (Net VAT Position)</div>
                <div className="text-lg font-bold text-purple-700 mt-1 font-mono">
                  {netVatPayable.toLocaleString('vi-VN')} VNĐ
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">Output VAT - Input VAT = Phải Nộp</div>
              </div>
            </div>
          </div>

          {/* Interactive Tax Calculation Workbench */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Calculator className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-bold text-slate-900">Thử Nghiệm Tax Engine Calculation API</h4>
              </div>

              <form onSubmit={handleTestTaxEngine} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số Tiền Chưa Thuế (Subtotal)</label>
                  <input
                    type="number"
                    value={taxCalcForm.amount}
                    onChange={(e) => setTaxCalcForm({ ...taxCalcForm, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Thuế GTGT (VAT Code)</label>
                    <select
                      value={taxCalcForm.vatCode}
                      onChange={(e) => setTaxCalcForm({ ...taxCalcForm, vatCode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold"
                    >
                      <option value="V10">V10 - Thuế suất 10% Phổ thông</option>
                      <option value="V8">V8 - Thuế suất 8% Ưu đãi</option>
                      <option value="V5">V5 - Thuế suất 5% Nông sản/Y tế</option>
                      <option value="V0">V0 - Thuế suất 0% Xuất khẩu</option>
                      <option value="VE">VE - Miễn Thuế GTGT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng Thái Miễn Thuế</label>
                    <select
                      value={taxCalcForm.isExempt ? 'TRUE' : 'FALSE'}
                      onChange={(e) => setTaxCalcForm({ ...taxCalcForm, isExempt: e.target.value === 'TRUE' })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold"
                    >
                      <option value="FALSE">Chịu Thuế Bình Thường</option>
                      <option value="TRUE">Miễn Thuế theo Luật</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isTaxCalcLoading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{isTaxCalcLoading ? 'Đang tính toán...' : 'Tính Toán Qua Tax Engine Authority'}</span>
                </button>
              </form>
            </div>

            {/* Tax Engine Authority Result Box */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">Kết Quả Xác Định Thuế (Tax Determination)</h4>
                </div>
                <span className="text-xs font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Authority Output</span>
              </div>

              {taxCalcResult ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-slate-500 font-sans text-[11px]">Cơ sở pháp lý & Quy tắc:</div>
                    <div className="text-emerald-800 font-sans font-bold">{taxCalcResult.taxRuleApplied}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-700 font-semibold">
                    <div>Mã Thuế: <span className="font-bold text-slate-900">{taxCalcResult.vatCode}</span></div>
                    <div>Thuế Suất: <span className="font-bold text-purple-700">{taxCalcResult.vatRateText}</span></div>
                    <div>Tiền Hàng: <span className="font-bold text-slate-900">{taxCalcResult.subtotal.toLocaleString('vi-VN')} VNĐ</span></div>
                    <div>Tiền Thuế GTGT: <span className="font-bold text-purple-700">{taxCalcResult.vatAmount.toLocaleString('vi-VN')} VNĐ</span></div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-950 font-bold text-sm flex justify-between">
                    <span>Tổng Tiền Thanh Toán:</span>
                    <span>{taxCalcResult.totalWithVat.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Chưa thực hiện tính toán. Nhấn nút "Tính Toán Qua Tax Engine Authority" ở bảng bên trái.
                </div>
              )}
            </div>
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

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Nhật Ký Gạch Nợ & Thanh Toán (Payment Allocation Logs)</h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">Tích hợp Module M32 Payments</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="px-4 py-2.5">Mã Giao Dịch</th>
                    <th className="px-4 py-2.5">Mã Hóa Đơn</th>
                    <th className="px-4 py-2.5">Hình Thức</th>
                    <th className="px-4 py-2.5">Số Tham Chiếu Bank</th>
                    <th className="px-4 py-2.5 text-right">Số Tiền Gạch Nợ</th>
                    <th className="px-4 py-2.5">Ngày Thực Hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-emerald-700 font-bold">PAY-{p.id}</td>
                      <td className="px-4 py-3 text-blue-700 font-semibold">INV-{p.invoiceId}</td>
                      <td className="px-4 py-3 text-slate-800 font-sans font-medium">{p.paymentMethod}</td>
                      <td className="px-4 py-3 text-slate-600">{p.referenceNo || 'REF-889123'}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {(p.amountPaid || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-sans">{p.paymentDate || '28/08/2026'}</td>
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

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Financial Events Stream & Single Writer GL Boundary</h3>
              </div>
              <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">System Boundary Stream</span>
            </div>

            <p className="text-xs text-slate-600">
              Quy tắc ranh giới hệ thống: AR, AP và Tax/VAT phát sinh sự kiện tài chính (Financial Event). Accounting Engine độc quyền chuyển dịch sang các bút toán Single Writer GL.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="px-4 py-2.5">Event ID</th>
                    <th className="px-4 py-2.5">Nguồn Phát Sinh</th>
                    <th className="px-4 py-2.5">Loại Sự Kiện</th>
                    <th className="px-4 py-2.5">Chứng Từ Gốc</th>
                    <th className="px-4 py-2.5 text-right">Tổng Tiền</th>
                    <th className="px-4 py-2.5">Định Khoản GL Rules</th>
                    <th className="px-4 py-2.5">Mã GL Journal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {accountingEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-blue-700 font-bold">{ev.eventId}</td>
                      <td className="px-4 py-3 text-slate-800 font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-semibold">
                          {ev.sourceModule}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">{ev.eventType}</td>
                      <td className="px-4 py-3 text-slate-700">{ev.invoiceNumber}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {(ev.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-purple-700 font-semibold text-[11px]">{ev.entryRules}</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">{ev.glJournalId}</td>
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
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                Báo Cáo Phân Tích Tuổi Nợ (AR/AP Aging Analysis)
              </h4>
              <p className="text-xs text-slate-500">
                Phân lớp công nợ theo chu kỳ 0-30 ngày, 31-60 ngày, 61-90 ngày và trên 90 ngày.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">Trong hạn (0-30 ngày):</span>
                  <span className="font-mono text-emerald-700 font-bold">850,000,000 VNĐ (72%)</span>
                </div>
                <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">Quá hạn 31-60 ngày:</span>
                  <span className="font-mono text-amber-700 font-bold">210,000,000 VNĐ (18%)</span>
                </div>
                <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">Quá hạn 61-90 ngày:</span>
                  <span className="font-mono text-orange-700 font-bold">85,000,000 VNĐ (7%)</span>
                </div>
                <div className="flex justify-between text-xs py-1.5">
                  <span className="text-slate-700 font-medium">Nợ xấu (&gt;90 ngày):</span>
                  <span className="font-mono text-rose-700 font-bold">35,000,000 VNĐ (3%)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Bảng Cân Đối & Báo Cáo KQKD (Financial Statements)
              </h4>
              <p className="text-xs text-slate-500">
                Tự động tổng hợp dữ liệu từ GL để xuất Báo cáo Tài chính chuẩn Thông tư 200.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleExportPdf}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">AI OCR Supplier Invoice Parsing Workbench</h3>
              </div>
              <button onClick={() => setIsOcrModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Dán Văn Bản / Mã Thẻ Hóa Đơn Điện Tử (XML / Text Parser):
              </label>
              <textarea
                rows={6}
                value={ocrInputText}
                onChange={(e) => setOcrInputText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            {ocrResult && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-2">
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>AI Trích Xuất Thành Công ({ocrResult.aiEngine})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 font-mono font-medium">
                  <div>Số Hóa Đơn: <span className="text-slate-900 font-bold">{ocrResult.extractedData.invoiceNumber}</span></div>
                  <div>MST Đối Tác: <span className="text-slate-900 font-bold">{ocrResult.extractedData.partnerTaxCode}</span></div>
                  <div>Tiền Chưa Thuế: <span className="text-emerald-700 font-bold">{(ocrResult.extractedData.subtotal || 0).toLocaleString('vi-VN')} VNĐ</span></div>
                  <div>Thuế GTGT ({ocrResult.extractedData.vatRate}%): <span className="text-purple-700 font-bold">{(ocrResult.extractedData.taxAmount || 0).toLocaleString('vi-VN')} VNĐ</span></div>
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
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tạo Hóa Đơn Mới ({newInvoiceForm.type})</h3>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại Hóa Đơn</label>
                  <select
                    value={newInvoiceForm.type}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                  >
                    <option value="AR">Hóa đơn Phải Thu AR (Khách hàng)</option>
                    <option value="AP">Hóa đơn Phải Trả AP (Nhà cung cấp)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Hóa Đơn</label>
                  <input
                    type="text"
                    value={newInvoiceForm.invoiceNumber}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, invoiceNumber: e.target.value })}
                    placeholder="HD-AR-2026-001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Đối Tác</label>
                <input
                  type="text"
                  value={newInvoiceForm.customerName}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerName: e.target.value })}
                  placeholder="Công ty Cổ phần MISA"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Số Thuế (MST)</label>
                  <input
                    type="text"
                    value={newInvoiceForm.taxCode}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, taxCode: e.target.value })}
                    placeholder="0101234567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thuế Suất GTGT (%)</label>
                  <select
                    value={newInvoiceForm.taxRate}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, taxRate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
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
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md cursor-pointer"
                >
                  Lưu & Hạch Toán Sự Kiện GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREDIT NOTE (RMA RETURN LINKAGE) */}
      {isCreditNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Lập Credit Note (RMA Return Linkage)</h3>
              </div>
              <button onClick={() => setIsCreditNoteModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCreditNote} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã Hóa Đơn AR Gốc</label>
                <input
                  type="text"
                  value={creditNoteForm.originalInvoiceNumber}
                  onChange={(e) => setCreditNoteForm({ ...creditNoteForm, originalInvoiceNumber: e.target.value })}
                  placeholder="HD-AR-2026-042"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Khách Hàng</label>
                <input
                  type="text"
                  value={creditNoteForm.customerName}
                  onChange={(e) => setCreditNoteForm({ ...creditNoteForm, customerName: e.target.value })}
                  placeholder="Công ty Cổ phần MISA"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã RMA Liên Kết</label>
                  <input
                    type="text"
                    value={creditNoteForm.rmaCode}
                    onChange={(e) => setCreditNoteForm({ ...creditNoteForm, rmaCode: e.target.value })}
                    placeholder="RMA-2026-008"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-medium"
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
                <label className="block font-semibold text-slate-700 mb-1">Lý Do Điều Chỉnh</label>
                <input
                  type="text"
                  value={creditNoteForm.reason}
                  onChange={(e) => setCreditNoteForm({ ...creditNoteForm, reason: e.target.value })}
                  placeholder="Hàng lỗi kỹ thuật đợt giao 25/08 - Giảm trừ công nợ AR"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
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

      {/* MODAL: PAYMENT SETTLEMENT (GẠCH NỢ) */}
      {isPaymentModalOpen && selectedInvoiceForPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Gạch Nợ Hóa Đơn ({selectedInvoiceForPay.invoiceNumber})</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3.5 text-xs">
              <div>
                <CurrencyInput
                  label="Số Tiền Thanh Toán (VNĐ)"
                  value={paymentForm.amountPaid}
                  onChange={(val) => setPaymentForm({ ...paymentForm, amountPaid: val.toString() })}
                  placeholder="VD: 50.000.000"
                  showBadge={true}
                  showPresets={true}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hình Thức Thanh Toán</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                >
                  <option value="BANK_TRANSFER">Chuyển Khoản Ngân Hàng (Bank Transfer)</option>
                  <option value="CASH">Tiền Mặt (Cash Fund)</option>
                  <option value="CREDIT_CARD">Thẻ Tín Dụng Doanh Nghiệp</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số Tham Chiếu Giao Dịch Ngân Hàng</label>
                <input
                  type="text"
                  value={paymentForm.referenceNo}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-medium"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md cursor-pointer"
                >
                  Xác Nhận Gạch Nợ & Tạo Phí/Thu Quỹ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ETAX CQT SUBMISSION */}
      {isEtaxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Nộp Tờ Khai Thuế GTGT eTax (CQT Portal Direct)</h3>
              </div>
              <button onClick={() => setIsEtaxModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-slate-600">Kỳ Kê Khai Thuế: <span className="text-slate-900 font-bold">Q3/2026 (Tháng 07, 08, 09)</span></div>
                <div className="text-slate-600">Mẫu Tờ Khai: <span className="text-emerald-700 font-bold">Mẫu 01/GTGT (Thông tư 80/2021/TT-BTC)</span></div>
                <div className="text-slate-600">Chữ Ký Số HSM: <span className="text-blue-700 font-mono font-semibold">SHA256-RSA-NEXUSSYNC-SECURE-KEY (ACTIVE)</span></div>
              </div>

              {etaxResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Cơ Quan Thuế Đã Tiếp Nhận Thành Công!</span>
                  </div>
                  <div className="font-mono text-slate-700">Mã Giao Dịch CQT: <span className="text-emerald-800 font-bold">{etaxResult.cqtReceiptId}</span></div>
                  <div className="font-mono text-slate-700">Trạng Thái: <span className="text-slate-900 font-bold">{etaxResult.summary?.statusText}</span></div>
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

      {/* MODAL: DUNNING VIETQR REMINDER */}
      {isDunningModalOpen && selectedDunningInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Mã VietQR & Nhắc Nợ AR Tự Động</h3>
              </div>
              <button onClick={() => setIsDunningModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {dunningData ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl flex flex-col items-center justify-center border border-slate-200">
                  <img src={dunningData.vietQrUrl} alt="VietQR" className="w-48 h-48 object-contain rounded-lg border border-slate-200 bg-white p-2" />
                  <div className="text-[11px] font-bold text-slate-900 mt-2 font-mono">CÚ PHÁP: {dunningData.paymentMemo}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono text-slate-700">
                  <div>Ngân Hàng: <span className="text-slate-900 font-bold">{dunningData.bankInfo?.bankName}</span></div>
                  <div>Số Tài Khoản: <span className="text-emerald-700 font-bold">{dunningData.bankInfo?.accountNumber}</span></div>
                  <div>Chủ Tài Khoản: <span className="text-slate-900 font-bold">{dunningData.bankInfo?.accountName}</span></div>
                  <div>Số Tiền Cần Thu: <span className="text-emerald-700 font-bold">{(dunningData.invoice?.finalAmount || 0).toLocaleString('vi-VN')} VNĐ</span></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Đang tạo mã VietQR...
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ELECTRONIC VAT INVOICE DETAIL VIEWER */}
      {isDetailModalOpen && selectedInvoiceDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Chi Tiết Hóa Đơn Điện Tử VAT — {selectedInvoiceDetail.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CQT Authentication Badge Header */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-blue-900 uppercase">Cơ Quan Thuế (CQT) Cấp Mã:</span>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {selectedInvoiceDetail.cqtCode || 'T26-0001-A9F32E-78'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Mẫu số: <strong className="font-mono text-slate-800">1C26TAA</strong> • Ký hiệu: <strong className="font-mono text-slate-800">{selectedInvoiceDetail.vatSeries || '1C26TAA'}</strong> • Số: <strong className="font-mono text-blue-700">{selectedInvoiceDetail.vatInvoiceNumber || selectedInvoiceDetail.invoiceNumber}</strong>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hợp Lệ CQT</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Nghị định 123/2020</span>
              </div>
            </div>

            {/* Seller & Buyer Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đơn Vị Bán Hàng (Seller)</span>
                </div>
                <div className="font-semibold text-slate-800">CÔNG TY CỔ PHẦN CÔNG NGHỆ & GIẢI PHÁP NEXUSSYNC ERP</div>
                <div className="text-slate-600 font-mono">MST: <strong className="text-slate-900">0108899888</strong></div>
                <div className="text-slate-500 text-[11px]">Địa chỉ: Tòa nhà NexusSync Tower, 88 Phố Duy Tân, Cầu Giấy, Hà Nội</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đơn Vị Mua Hàng (Buyer)</span>
                </div>
                <div className="font-semibold text-slate-800">{selectedInvoiceDetail.customerName || selectedInvoiceDetail.companyName || 'Công ty TNHH Công Nghệ Thiên Nam'}</div>
                <div className="text-slate-600 font-mono">MST: <strong className="text-slate-900">{selectedInvoiceDetail.taxCode || '0315894231'}</strong></div>
                <div className="text-slate-500 text-[11px]">Địa chỉ: {selectedInvoiceDetail.address || 'Số 45 Lê Duẩn, Quận 1, TP. Hồ Chí Minh'}</div>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Chi Tiết Tiền Hàng & Nghĩa Vụ Thuế GTGT (TT200)
              </div>
              <div className="p-4 space-y-2.5 bg-white">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tiền hàng (Chưa bao gồm thuế GTGT):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {(selectedInvoiceDetail.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Thuế suất GTGT áp dụng:</span>
                  <span className="font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {selectedInvoiceDetail.taxRate || 10}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tiền thuế GTGT đầu ra (TK 33311):</span>
                  <span className="font-mono font-bold text-purple-700">
                    {(selectedInvoiceDetail.taxAmount || Math.round((selectedInvoiceDetail.totalAmount || 0) * 0.1)).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Tổng tiền thanh toán (Đã gồm GTGT):</span>
                  <span className="font-mono text-base text-emerald-700">
                    {(selectedInvoiceDetail.finalAmount || (selectedInvoiceDetail.totalAmount || 0) + (selectedInvoiceDetail.taxAmount || 0)).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Digital HSM Certificate Information */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-600">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-slate-500" />
                <span>Chữ ký số: Viettel-CA Cloud HSM Sub-CA v3 | Ký ngày: {selectedInvoiceDetail.issueDate || '28/08/2026'}</span>
              </div>
              <span className="text-emerald-700 font-bold">XML Signed (SHA256)</span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Tra cứu hóa đơn: <a href="https://hoadondientu.gdt.gov.vn" target="_blank" rel="noreferrer" className="text-blue-600 underline">hoadondientu.gdt.gov.vn</a>
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer text-xs"
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
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Khắc Phục Lỗi Xuất HĐ VAT — {selectedVatErrorInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsRetryVatModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Nguyên nhân CQT từ chối cấp mã:</span>
              </div>
              <div className="text-rose-700 pl-5 font-medium">
                {retryVatForm.errorReason}
              </div>
            </div>

            <form onSubmit={handleRetryVat} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã Số Thuế Đúng Của Người Mua (MST)</label>
                <input
                  type="text"
                  value={retryVatForm.taxCode}
                  onChange={(e) => setRetryVatForm({ ...retryVatForm, taxCode: e.target.value })}
                  placeholder="0315894231 (10 hoặc 13 số hợp lệ)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-medium focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Doanh Nghiệp Người Mua (Đúng ĐKKD)</label>
                <input
                  type="text"
                  value={retryVatForm.customerName}
                  onChange={(e) => setRetryVatForm({ ...retryVatForm, customerName: e.target.value })}
                  placeholder="Công ty Cổ phần Đầu tư Công nghệ Toàn Cầu"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Đăng Ký Thuế</label>
                <input
                  type="text"
                  value={retryVatForm.address}
                  onChange={(e) => setRetryVatForm({ ...retryVatForm, address: e.target.value })}
                  placeholder="Số 88 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRetryVatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Ký Số Lại & Gửi Cấp Mã CQT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
