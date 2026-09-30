import React, { useState, useEffect, useMemo, useRef } from "react";
import { CurrencyInput } from "../../../../components/common/CurrencyInput";
import { ConfirmDialog } from "../../../../components/common/ConfirmDialog";
import { TablePagination } from "../../../../components/common/TablePagination";
import { StatusBadge } from "../../../../components/common/StatusBadge";
import { useWorkspaceSessionTab } from "../../../../hooks/useWorkspaceSessionTab";
import {
  Landmark,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  QrCode,
  FileText,
  Building2,
  Search,
  Filter,
  Layers,
  Sparkles,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Check,
  X,
  Eye,
  ArrowRight,
  HelpCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";

interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  bookBalance?: number;
  bankBalance?: number;
  isActive: boolean;
}

interface BankStatement {
  id: number;
  bankAccountId: number;
  bankTransactionId: string;
  bankRef?: string;
  amount: number;
  reference: string;
  transactionDate: string;
  status: "UNMATCHED" | "MATCHED" | "IGNORED";
  reconciledVoucherId?: number | null;
  matchType?: string | null;
  reconciledAt?: string | null;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  type: string;
  customerName?: string;
  finalAmount: number;
  paymentStatus: string;
  createdAt?: string;
}

interface Form08TTReport {
  bankAccountId: number;
  bankName: string;
  accountNumber: string;
  asOfDate: string;
  bookBalance: number;
  bankBalance: number;
  difference: number;
  unmatchedBankCredits: number;
  unmatchedBankDebits: number;
  outstandingDeposits: number;
  outstandingChecks: number;
  reconciledBalance: number;
  form08TT: {
    bankBalanceOnStatement: number;
    addOutstandingDeposits: number;
    lessOutstandingChecks: number;
    adjustedBankBalance: number;
    bookBalanceInGL: number;
    addUnrecordedCredits: number;
    lessUnrecordedDebits: number;
    adjustedBookBalance: number;
    isBalanced: boolean;
  };
}

interface M33Props {
  onSelectEntity?: (entity: any) => void;
  onNotify?: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

const BANK_PRESETS = [
  { code: "VCB", name: "Vietcombank (970436)" },
  { code: "TCB", name: "Techcombank (970407)" },
  { code: "MB", name: "MBBank (970422)" },
  { code: "ACB", name: "ACB (970416)" },
  { code: "VPB", name: "VPBank (970432)" },
  { code: "BIDV", name: "BIDV (970418)" },
  { code: "CTG", name: "VietinBank (970415)" },
  { code: "TPB", name: "TPBank (970423)" },
];

export const M33BankReconciliationWorkspace: React.FC<M33Props> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<"engine" | "import" | "vietqr" | "report">("M33", "engine");
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(1);
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [report, setReport] = useState<Form08TTReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "MATCHED" | "UNMATCHED">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Manual Match selection state: 1 statement, multiple invoices (1-N match)
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
  const [selectedInvIds, setSelectedInvIds] = useState<number[]>([]);

  // Preview Drawer
  const [previewTx, setPreviewTx] = useState<BankStatement | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "primary" | "danger" | "warning" | "info";
    onConfirm: () => void;
  } | null>(null);

  // VietQR form state
  const [vietQrForm, setVietQrForm] = useState({
    bankCode: "VCB",
    accountNumber: "0011004328888",
    amount: 176000000,
    memo: "INV-AR-UNIFIED-859744",
  });
  const [vietQrResult, setVietQrResult] = useState<any | null>(null);
  const [copiedQrString, setCopiedQrString] = useState<boolean>(false);

  // Import raw text state
  const [rawImportText, setRawImportText] = useState<string>(
    `FT2624098199001,85000000,2026-08-28,CCTY PHONG VU CHUYEN TIEN SO-2026-018\nFT2624098199002,-1250000,2026-08-28,PHI DICH VU QUAN LY TAI KHOAN DOANH NGHIEP`
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, stmtRes, invRes, rptRes] = await Promise.all([
        fetch("/api/bank/accounts"),
        fetch(`/api/bank/statements?bankAccountId=${selectedAccountId}`),
        fetch("/api/invoices"),
        fetch(`/api/bank/reconciliation-report?bankAccountId=${selectedAccountId}`),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData);
        if (accData.length > 0 && !accData.some((a: BankAccount) => a.id === selectedAccountId)) {
          setSelectedAccountId(accData[0].id);
        }
      }
      if (stmtRes.ok) setStatements(await stmtRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
      if (rptRes.ok) setReport(await rptRes.json());
    } catch (e) {
      console.error("Error fetching M33 data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAccountId]);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  }, [accounts, selectedAccountId]);

  const selectedStatement = useMemo(() => {
    return statements.find((s) => s.id === selectedTxId) || null;
  }, [statements, selectedTxId]);

  const selectedInvoicesSum = useMemo(() => {
    return invoices
      .filter((inv) => selectedInvIds.includes(inv.id))
      .reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
  }, [invoices, selectedInvIds]);

  const matchDifference = useMemo(() => {
    if (!selectedStatement) return 0;
    return Math.abs(Math.abs(selectedStatement.amount) - selectedInvoicesSum);
  }, [selectedStatement, selectedInvoicesSum]);

  const toggleInvoiceSelection = (id: number) => {
    setSelectedInvIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAutoReconcileConfirm = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Chạy Động Cơ Đối Soát Tự Động (4 Tiers)",
      message: `Hệ thống sẽ thực hiện đối soát tự động 4 cấp độ đối với toàn bộ dòng sao kê của tài khoản ${selectedAccount?.bankName} - ${selectedAccount?.accountNumber}. Mọi giao dịch khớp sẽ được lưu vết kiểm toán M02.`,
      variant: "primary",
      onConfirm: async () => {
        setConfirmDialog(null);
        setLoading(true);
        try {
          const res = await fetch("/api/bank/statements/auto-reconcile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bankAccountId: selectedAccountId }),
          });
          const data = await res.json();
          if (res.ok) {
            if (onNotify) onNotify(data.message, "success");
            fetchData();
          } else {
            if (onNotify) onNotify(data.error || "Lỗi chạy động cơ đối soát", "error");
          }
        } catch (e: any) {
          if (onNotify) onNotify(e?.message || "Lỗi hệ thống", "error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleManualMatchConfirm = () => {
    if (!selectedTxId || selectedInvIds.length === 0) {
      if (onNotify) onNotify("Vui lòng chọn 1 dòng sao kê và ít nhất 1 hóa đơn để ghép nối", "info");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xác Nhận Ghép Nối Thủ Công (1-N)",
      message: `Ghép nối giao dịch sao kê #${selectedStatement?.bankTransactionId} (${Math.abs(selectedStatement?.amount || 0).toLocaleString("vi-VN")} VNĐ) với ${selectedInvIds.length} hóa đơn đã chọn (Tổng: ${selectedInvoicesSum.toLocaleString("vi-VN")} VNĐ). Chênh lệch: ${matchDifference.toLocaleString("vi-VN")} VNĐ. Tiếp tục?`,
      variant: matchDifference === 0 ? "primary" : "warning",
      onConfirm: async () => {
        setConfirmDialog(null);
        setLoading(true);
        try {
          const res = await fetch("/api/bank/statements/manual-match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transactionId: selectedTxId,
              invoiceIds: selectedInvIds,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            if (onNotify) onNotify(data.message, "success");
            setSelectedTxId(null);
            setSelectedInvIds([]);
            fetchData();
          } else {
            if (onNotify) onNotify(data.error || "Lỗi ghép nối thủ công", "error");
          }
        } catch (e: any) {
          if (onNotify) onNotify(e?.message || "Lỗi thao tác", "error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleUnmatchConfirm = (txId: number, txCode: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hủy Khớp Giao Dịch",
      message: `Bạn có chắc chắn muốn hủy ghép nối cho giao dịch #${txCode}? Dữ liệu sẽ quay về trạng thái CHƯA KHỚP và ghi vết M02 Audit Log.`,
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog(null);
        setLoading(true);
        try {
          const res = await fetch("/api/bank/statements/unmatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId: txId }),
          });
          const data = await res.json();
          if (res.ok) {
            if (onNotify) onNotify(data.message, "success");
            fetchData();
          } else {
            if (onNotify) onNotify(data.error || "Lỗi hủy khớp", "error");
          }
        } catch (e: any) {
          if (onNotify) onNotify(e?.message || "Lỗi hệ thống", "error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleGenerateVietQr = async () => {
    try {
      const res = await fetch("/api/bank/vietqr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vietQrForm),
      });
      const data = await res.json();
      if (res.ok) {
        setVietQrResult(data.payload);
        if (onNotify) onNotify("Khởi tạo mã VietQR NAPAS247 thành công", "success");
      }
    } catch (e: any) {
      if (onNotify) onNotify("Lỗi tạo mã VietQR", "error");
    }
  };

  const handleImportStatements = async () => {
    try {
      const lines = rawImportText.split("\n").filter((l) => l.trim().length > 0);
      const items = lines.map((l) => {
        const parts = l.split(",");
        return {
          bankTransactionId: parts[0]?.trim() || `FT-${Date.now()}`,
          amount: Number(parts[1]?.trim()) || 0,
          transactionDate: parts[2]?.trim() || new Date().toISOString(),
          reference: parts[3]?.trim() || "Nạp từ sao kê thủ công",
        };
      });

      const res = await fetch("/api/bank/statements/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountId: selectedAccountId,
          transactions: items,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (onNotify) onNotify(data.message, "success");
        setActiveTab("engine");
        fetchData();
      } else {
        if (onNotify) onNotify(data.error, "error");
      }
    } catch (e: any) {
      if (onNotify) onNotify("Lỗi nạp sao kê", "error");
    }
  };

  const filteredStatements = useMemo(() => {
    return statements.filter((s) => {
      if (filterStatus !== "ALL" && s.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (s.bankTransactionId || "").toLowerCase().includes(q) ||
          (s.reference || "").toLowerCase().includes(q) ||
          s.amount.toString().includes(q)
        );
      }
      return true;
    });
  }, [statements, filterStatus, searchQuery]);

  const matchedCount = statements.filter((s) => s.status === "MATCHED").length;
  const matchRate = statements.length ? Math.round((matchedCount / statements.length) * 100) : 0;
  const totalBankBalance = report?.bankBalance || 420000000;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 space-y-4 p-4 sm:p-5 overflow-y-auto">
      {/* Top Bar: Bank Account Selector & Fast Info */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200/60 dark:border-blue-900/60">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tài Khoản Ngân Hàng:</span>
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(Number(e.target.value));
                setSelectedTxId(null);
                setSelectedInvIds([]);
              }}
              className="px-3 py-1.5 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} - {acc.accountNumber} ({acc.accountName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Realtime Statement Feeds Active
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
            Mã TK: <strong className="text-slate-700 dark:text-slate-300 font-bold">BANK-ACC-{selectedAccountId}</strong>
          </span>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Số Dư Sổ Phụ Ngân Hàng</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono tabular-nums">
              {totalBankBalance.toLocaleString("vi-VN")} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">VNĐ</span>
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {selectedAccount?.bankName || "VCB"} Active (TK 1121)
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200/50 dark:border-blue-900/50">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Tỷ Lệ Đối Soát Tự Động</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">{matchRate}%</div>
            <div className="text-[11px] text-blue-700 dark:text-blue-400 font-medium mt-1">
              {matchedCount} / {statements.length} giao dịch đã khớp
            </div>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200/50 dark:border-purple-900/50">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Giao Dịch Chưa Khớp</div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5 font-mono">
              {statements.filter((s) => s.status === "UNMATCHED").length} dòng
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cần đối soát với AR/AP</div>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200/50 dark:border-amber-900/50">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Trạng Thái Báo Cáo 08-TT</div>
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {report?.form08TT.isBalanced ? "Đã Khớp Cân Bằng (100%)" : "Có Chênh Lệch Cần Rà Soát"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Thông tư 200/2014/TT-BTC</div>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200/50 dark:border-emerald-900/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Navigation Tabs (M41 Master Spec) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2 min-w-0">
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          title="Cuộn sang trái"
          aria-label="Cuộn sang trái"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={tabsContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto scroll-smooth no-scrollbar flex-1 min-w-0 py-0.5"
        >
          <button
            type="button"
            onClick={() => setActiveTab("engine")}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "engine"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>1. Động Cơ Đối Soát Tự Động</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "import"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span>2. Nạp Sao Kê &amp; Feeds Ngân Hàng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vietqr")}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "vietqr"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>3. Cổng VietQR NAPAS247</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "report"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>4. Báo Cáo Đối Soát Mẫu 08-TT</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => scrollTabs('right')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          title="Cuộn sang phải"
          aria-label="Cuộn sang phải"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="hidden xl:flex items-center gap-2 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Treasury Gateway
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            VAS-200 Compliant
          </span>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col flex-1">
        <div className="p-4 sm:p-5 flex-1">
          {/* TAB 1: AUTO RECONCILIATION ENGINE */}
          {activeTab === "engine" && (
            <div className="space-y-4">
              {/* Filter & Action Toolbar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Tìm mã giao dịch, nội dung, số tiền..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                    <button
                      onClick={() => setFilterStatus("ALL")}
                      className={`px-3 py-1 rounded-md transition ${
                        filterStatus === "ALL" ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Tất cả ({statements.length})
                    </button>
                    <button
                      onClick={() => setFilterStatus("UNMATCHED")}
                      className={`px-3 py-1 rounded-md transition ${
                        filterStatus === "UNMATCHED" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Chưa khớp ({statements.filter((s) => s.status === "UNMATCHED").length})
                    </button>
                    <button
                      onClick={() => setFilterStatus("MATCHED")}
                      className={`px-3 py-1 rounded-md transition ${
                        filterStatus === "MATCHED" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Đã khớp ({statements.filter((s) => s.status === "MATCHED").length})
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAutoReconcileConfirm}
                    disabled={loading}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Chạy Khớp Tự Động (4 Tiers)</span>
                  </button>

                  <button
                    onClick={handleManualMatchConfirm}
                    disabled={loading || !selectedTxId || selectedInvIds.length === 0}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition ${
                      selectedTxId && selectedInvIds.length > 0
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Ghép Nối Thủ Công ({selectedInvIds.length > 1 ? `1-${selectedInvIds.length}` : "1-1"})</span>
                  </button>
                </div>
              </div>

              {/* Selection Summary Banner when matching */}
              {(selectedTxId || selectedInvIds.length > 0) && (
                <div className="bg-blue-50/80 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Trạng thái ghép nối thủ công:
                    </span>
                    <span>
                      Sao kê: <strong className="font-mono text-slate-900 dark:text-slate-100">
                        {selectedStatement ? `#${selectedStatement.bankTransactionId} (${Math.abs(selectedStatement.amount).toLocaleString("vi-VN")} VNĐ)` : "Chưa chọn"}
                      </strong>
                    </span>
                    <span>
                      Hóa đơn ({selectedInvIds.length}): <strong className="font-mono text-slate-900 dark:text-slate-100">
                        {selectedInvoicesSum.toLocaleString("vi-VN")} VNĐ
                      </strong>
                    </span>
                    {selectedStatement && selectedInvIds.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-md font-semibold font-mono ${
                        matchDifference === 0 
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" 
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      }`}>
                        {matchDifference === 0 ? "✓ Cân bằng 100%" : `Chênh lệch: ${matchDifference.toLocaleString("vi-VN")} VNĐ`}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTxId(null);
                      setSelectedInvIds([]);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              )}

              {/* Split View: Bank Statements vs Ledger Invoices */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Bank Statements Column */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col shadow-xs">
                  <div className="bg-slate-100/90 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        1. Dòng Sao Kê Ngân Hàng ({filteredStatements.length})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Chọn 1 dòng sao kê</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                    {filteredStatements.map((st) => {
                      const isSelected = selectedTxId === st.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setSelectedTxId(isSelected ? null : st.id)}
                          className={`p-3.5 text-xs cursor-pointer transition flex items-start justify-between border-l-4 ${
                            isSelected
                              ? "bg-blue-50/60 dark:bg-blue-950/40 border-l-blue-600 shadow-xs"
                              : "border-l-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="space-y-1.5 flex-1 pr-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                #{st.bankTransactionId}
                              </span>
                              {st.status === "MATCHED" ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
                                  ĐÃ KHỚP ({st.matchType || "AUTO"})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                                  CHƯA KHỚP
                                </span>
                              )}
                            </div>

                            <p className={`font-medium text-[11px] line-clamp-2 ${isSelected ? "text-blue-950 dark:text-blue-200" : "text-slate-700 dark:text-slate-300"}`}>
                              {st.reference}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {st.transactionDate ? new Date(st.transactionDate).toLocaleDateString("vi-VN") : "Hôm nay"}
                              </span>
                              {st.reconciledVoucherId && (
                                <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                                  Phiếu: #{st.reconciledVoucherId}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right space-y-2 shrink-0">
                            <div
                              className={`font-mono font-bold text-xs tabular-nums ${
                                st.amount > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                              }`}
                            >
                              {st.amount > 0 ? "+" : ""}
                              {st.amount.toLocaleString("vi-VN")} VNĐ
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewTx(st);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {st.status === "MATCHED" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnmatchConfirm(st.id, st.bankTransactionId);
                                  }}
                                  className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-bold"
                                >
                                  Hủy khớp
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredStatements.length === 0 && (
                      <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                        Không tìm thấy giao dịch sao kê phù hợp
                      </div>
                    )}
                  </div>
                </div>

                {/* Ledger Invoices Column */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col shadow-xs">
                  <div className="bg-slate-100/90 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        2. Hóa Đơn Sổ Cái AR/AP ({invoices.length})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Chọn 1 hoặc nhiều hóa đơn (1-N)</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                    {invoices.map((inv) => {
                      const isSelected = selectedInvIds.includes(inv.id);
                      const isPaid = inv.paymentStatus === "PAID";
                      return (
                        <div
                          key={inv.id}
                          onClick={() => toggleInvoiceSelection(inv.id)}
                          className={`p-3.5 text-xs cursor-pointer transition flex items-start justify-between border-l-4 ${
                            isSelected
                              ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-l-emerald-600 shadow-xs"
                              : "border-l-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="space-y-1.5 flex-1 pr-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {inv.invoiceNumber}
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
                                {inv.type}
                              </span>
                              {isPaid ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
                                  ĐÃ THANH TOÁN
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                                  CHỜ GẠCH NỢ
                                </span>
                              )}
                            </div>

                            <p className={`font-medium text-[11px] ${isSelected ? "text-emerald-950 dark:text-emerald-200" : "text-slate-700 dark:text-slate-300"}`}>
                              Đối tác: {inv.customerName || "Khách hàng B2B"}
                            </p>
                          </div>

                          <div className="text-right space-y-1 shrink-0">
                            <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 tabular-nums">
                              {(inv.finalAmount || 0).toLocaleString("vi-VN")} VNĐ
                            </div>
                            <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              {isSelected ? "✓ Đã chọn" : "+ Nhấn chọn"}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {invoices.length === 0 && (
                      <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                        Chưa có dữ liệu hóa đơn sổ cái
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STATEMENT IMPORT */}
          {activeTab === "import" && (
            <div className="max-w-4xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Nạp Dữ Liệu Sao Kê Ngân Hàng Điện Tử (CSV / MT940 / JSON)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cơ chế nạp chuẩn Idempotency chống trùng lặp dựa trên SHA-256 Checksum &amp; Bank Transaction ID. Định dạng mỗi dòng: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">MaGiaoDich,SoTien,Ngay,NoiDung</code>
                </p>
              </div>

              <textarea
                rows={8}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="FT2624098199001,85000000,2026-08-28,CCTY PHONG VU CHUYEN TIEN SO-2026-018"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Tài khoản đích: <strong className="text-slate-900 dark:text-slate-100 font-bold">#{selectedAccountId} ({selectedAccount?.bankName} - {selectedAccount?.accountNumber})</strong>
                </span>

                <button
                  onClick={handleImportStatements}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center justify-center space-x-2 shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>Xác Nhận Nạp Sao Kê</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VIETQR GATEWAY */}
          {activeTab === "vietqr" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
              {/* Form Input */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Tạo Mã VietQR Thanh Toán Động (NAPAS247)
                </h3>

                <div className="space-y-3.5 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Chọn Ngân Hàng Thụ Hưởng</label>
                    <select
                      value={vietQrForm.bankCode}
                      onChange={(e) => setVietQrForm({ ...vietQrForm, bankCode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {BANK_PRESETS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Số Tài Khoản Doanh Nghiệp</label>
                    <input
                      type="text"
                      value={vietQrForm.accountNumber}
                      onChange={(e) => setVietQrForm({ ...vietQrForm, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <CurrencyInput
                      label="Số Tiền Thu Nợ / Bán Hàng (VNĐ)"
                      value={vietQrForm.amount}
                      onChange={(val) => setVietQrForm({ ...vietQrForm, amount: val })}
                      placeholder="VD: 176.000.000"
                      showBadge={true}
                      showPresets={true}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nội Dung Chuyển Khoản (Memo / Invoice Ref)</label>
                    <input
                      type="text"
                      value={vietQrForm.memo}
                      onChange={(e) => setVietQrForm({ ...vietQrForm, memo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleGenerateVietQr}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center justify-center space-x-2 mt-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Khởi Tạo Mã VietQR Chuẩn EMVCo</span>
                  </button>
                </div>
              </div>

              {/* QR Render Preview */}
              <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center space-y-3.5">
                {vietQrResult ? (
                  <>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                      <img
                        src={vietQrResult.quickLinkUrl}
                        alt="VietQR Code"
                        className="w-48 h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">Mã VietQR NAPAS247 Đã Sẵn Sàng</div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {vietQrResult.amount.toLocaleString("vi-VN")} VNĐ - {vietQrResult.memo}
                      </div>
                    </div>

                    <div className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between font-mono text-[10px] text-slate-600 dark:text-slate-300">
                      <span className="truncate pr-2">{vietQrResult.vietQrString}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(vietQrResult.vietQrString);
                          setCopiedQrString(true);
                          setTimeout(() => setCopiedQrString(false), 2000);
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition text-slate-500 shrink-0"
                        title="Copy chuỗi EMVCo"
                      >
                        {copiedQrString ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 dark:text-slate-500 text-xs space-y-2">
                    <QrCode className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-600" />
                    <div>Nhập thông tin bên trái và nhấn &quot;Khởi Tạo Mã VietQR Chuẩn EMVCo&quot;</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RECONCILIATION REPORT FORM 08-TT */}
          {activeTab === "report" && report && (
            <div className="space-y-4 max-w-4xl mx-auto bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    MẪU SỐ 08-TT (Ban hành theo TT 200/2014/TT-BTC)
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    BÁO CÁO ĐỐI SOÁT TÀI KHOẢN NGÂN HÀNG &amp; SỔ CÁI TK 1121
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tài khoản: {report.bankName} - Số TK: {report.accountNumber} | Ngày lập: {report.asOfDate}
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition shrink-0"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>In Báo Cáo 08-TT</span>
                </button>
              </div>

              {/* Form 08-TT Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase font-bold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                      <th className="py-2.5 px-3.5">Chỉ Tiêu Đối Soát (Circular 200 Specification)</th>
                      <th className="py-2.5 px-3.5 text-right">Số Tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                    <tr className="bg-slate-50/60 dark:bg-slate-800/40 font-bold">
                      <td className="py-2.5 px-3.5 text-slate-900 dark:text-slate-100 font-sans">
                        I. SỐ DƯ BÁO CÓ NGUYÊN BẢN SAO KÊ NGÂN HÀNG
                      </td>
                      <td className="py-2.5 px-3.5 tabular-nums text-right font-semibold text-blue-700 dark:text-blue-400">
                        {report.form08TT.bankBalanceOnStatement.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3.5 pl-7 text-slate-600 dark:text-slate-400 font-sans">
                        (+) Tiền gửi đang chuyển (Outstanding Deposits)
                      </td>
                      <td className="py-2 px-3.5 tabular-nums text-right font-semibold text-emerald-700 dark:text-emerald-400">
                        +{report.form08TT.addOutstandingDeposits.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3.5 pl-7 text-slate-600 dark:text-slate-400 font-sans">
                        (-) Séc/Lệnh chi đang chuyển (Outstanding Checks)
                      </td>
                      <td className="py-2 px-3.5 tabular-nums text-right font-semibold text-rose-700 dark:text-rose-400">
                        -{report.form08TT.lessOutstandingChecks.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr className="bg-blue-50/70 dark:bg-blue-950/40 font-bold border-t border-blue-200 dark:border-blue-900">
                      <td className="py-2.5 px-3.5 text-blue-900 dark:text-blue-200 font-sans">
                        =&gt; SỐ DƯ SAO KÊ ĐÃ ĐIỀU CHỈNH
                      </td>
                      <td className="py-2.5 px-3.5 tabular-nums text-right font-semibold text-blue-900 dark:text-blue-200">
                        {report.form08TT.adjustedBankBalance.toLocaleString("vi-VN")}
                      </td>
                    </tr>

                    <tr className="bg-slate-50/60 dark:bg-slate-800/40 font-bold">
                      <td className="py-2.5 px-3.5 text-slate-900 dark:text-slate-100 font-sans">
                        II. SỐ DƯ TK 1121 TRÊN SỔ CÁI KẾ TOÁN (GENERAL LEDGER)
                      </td>
                      <td className="py-2.5 px-3.5 tabular-nums text-right font-semibold text-purple-700 dark:text-purple-400">
                        {report.form08TT.bookBalanceInGL.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3.5 pl-7 text-slate-600 dark:text-slate-400 font-sans">
                        (+) Thu ngân hàng chưa ghi sổ (Unrecorded Credits)
                      </td>
                      <td className="py-2 px-3.5 tabular-nums text-right font-semibold text-emerald-700 dark:text-emerald-400">
                        +{report.form08TT.addUnrecordedCredits.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3.5 pl-7 text-slate-600 dark:text-slate-400 font-sans">
                        (-) Phí/Chi ngân hàng chưa ghi sổ (Unrecorded Debits)
                      </td>
                      <td className="py-2 px-3.5 tabular-nums text-right font-semibold text-rose-700 dark:text-rose-400">
                        -{report.form08TT.lessUnrecordedDebits.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr className="bg-purple-50/70 dark:bg-purple-950/40 font-bold border-t border-purple-200 dark:border-purple-900">
                      <td className="py-2.5 px-3.5 text-purple-900 dark:text-purple-200 font-sans">
                        =&gt; SỐ DƯ SỔ CÁI ĐÃ ĐIỀU CHỈNH
                      </td>
                      <td className="py-2.5 px-3.5 tabular-nums text-right font-semibold text-purple-900 dark:text-purple-200">
                        {report.form08TT.adjustedBookBalance.toLocaleString("vi-VN")}
                      </td>
                    </tr>

                    <tr className="bg-slate-900 text-white font-bold">
                      <td className="py-2.5 px-3.5 font-sans">CHÊNH LỆCH ĐỐI SOÁT CUỐI KỲ (DIFFERENCE)</td>
                      <td className={`py-2.5 px-3.5 tabular-nums text-right font-semibold ${
                        report.difference === 0 ? "text-emerald-400" : "text-amber-400"
                      }`}>
                        {report.difference.toLocaleString("vi-VN")} VNĐ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Regulatory Signatures Footer */}
              <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">NGƯỜI LẬP BIỂU</div>
                  <div className="text-[11px] text-slate-400 italic mt-0.5">(Ký, họ tên)</div>
                  <div className="h-16"></div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">KẾ TOÁN TRƯỞNG</div>
                  <div className="text-[11px] text-slate-400 italic mt-0.5">(Ký, họ tên)</div>
                  <div className="h-16"></div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">GIÁM ĐỐC / CFO</div>
                  <div className="text-[11px] text-slate-400 italic mt-0.5">(Ký, họ tên, đóng dấu)</div>
                  <div className="h-16"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal / Drawer */}
      {previewTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Chi Tiết Giao Dịch Sao Kê</h4>
              </div>
              <button
                onClick={() => setPreviewTx(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Mã Giao Dịch:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">#{previewTx.bankTransactionId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Số Tiền:</span>
                <span className={`font-mono font-bold ${previewTx.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {previewTx.amount > 0 ? "+" : ""}{previewTx.amount.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Trạng Thái:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewTx.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Ngày Giao Dịch:</span>
                <span>{previewTx.transactionDate ? new Date(previewTx.transactionDate).toLocaleString("vi-VN") : "N/A"}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Nội Dung Chuyển Khoản:</span>
                <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                  {previewTx.reference}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewTx(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};
