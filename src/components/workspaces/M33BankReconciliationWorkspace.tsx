import React, { useState, useEffect } from "react";
import { CurrencyInput } from "../common/CurrencyInput";
import { useWorkspaceSessionTab } from "../../hooks/useWorkspaceSessionTab";
import {
  Landmark,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  QrCode,
  FileText,
  Building2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
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
} from "lucide-react";

interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  isActive: boolean;
}

interface BankStatement {
  id: number;
  bankAccountId: number;
  bankTransactionId: string;
  amount: number;
  reference: string;
  transactionDate: string;
  status: "UNMATCHED" | "MATCHED" | "IGNORED";
  reconciledInvoiceId?: number | null;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  type: string;
  customerName?: string;
  finalAmount: number;
  paymentStatus: string;
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
  onNotify?: any;
}

export const M33BankReconciliationWorkspace: React.FC<M33Props> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<"engine" | "import" | "vietqr" | "report">("M33", "engine");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(1);
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [report, setReport] = useState<Form08TTReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "MATCHED" | "UNMATCHED">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Manual Match selection state
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
  const [selectedInvId, setSelectedInvId] = useState<number | null>(null);

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

      if (accRes.ok) setAccounts(await accRes.json());
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

  const handleAutoReconcile = async () => {
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
  };

  const handleManualMatch = async () => {
    if (!selectedTxId || !selectedInvId) {
      if (onNotify) onNotify("Vui lòng chọn 1 dòng sao kê và 1 hóa đơn để ghép nối", "info");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bank/statements/manual-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: selectedTxId,
          invoiceId: selectedInvId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (onNotify) onNotify(data.message, "success");
        setSelectedTxId(null);
        setSelectedInvId(null);
        fetchData();
      } else {
        if (onNotify) onNotify(data.error || "Lỗi ghép nối thủ công", "error");
      }
    } catch (e: any) {
      if (onNotify) onNotify(e?.message || "Lỗi thao tác", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatch = async (txId: number) => {
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
        if (onNotify) onNotify(data.error, "error");
      }
    } catch (e: any) {
      if (onNotify) onNotify(e?.message, "error");
    } finally {
      setLoading(false);
    }
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

  const filteredStatements = statements.filter((s) => {
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

  const matchedCount = statements.filter((s) => s.status === "MATCHED").length;
  const matchRate = statements.length ? Math.round((matchedCount / statements.length) * 100) : 0;
  const totalBankBalance = report?.bankBalance || 420000000;
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  return (
    <div className="flex flex-col h-full bg-slate-50/60 text-slate-800 space-y-5 p-5 overflow-y-auto">
      {/* Top Bar: Bank Account Selector & Fast Info */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Tài Khoản Ngân Hàng:</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
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
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-medium rounded-md border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Realtime Statement Sync
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            ID: <strong className="text-slate-700">BANK-ACC-{selectedAccountId}</strong>
          </span>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Số Dư Sổ Phụ</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
              {totalBankBalance.toLocaleString("vi-VN")} <span className="text-xs text-slate-500 font-normal">VNĐ</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {selectedAccount?.bankName || "VCB"} Active
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Tỷ Lệ Đối Soát Tự Động</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">{matchRate}%</div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">
              {matchedCount} / {statements.length} giao dịch đã khớp
            </div>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Giao Dịch Chưa Khớp</div>
            <div className="text-lg font-bold text-amber-600 mt-0.5 font-mono">
              {statements.filter((s) => s.status === "UNMATCHED").length} dòng
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Cần ghép nối AR/AP</div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Báo Cáo Form 08-TT</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">
              {report?.form08TT.isBalanced ? "Đã Cân Bằng (100%)" : "Cần Rà Soát Dòng Tiền"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Chuẩn VAS / Bộ Tài Chính</div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Navigation Tabs (M41 Master Spec) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("engine")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
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
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
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
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
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
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "report"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>4. Báo Cáo Đối Soát Form 08-TT</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Treasury Reconciled
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            OpenBanking AI
          </span>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col flex-1">
        {/* Tab Body */}
        <div className="p-5 flex-1">
          {/* TAB 1: AUTO RECONCILIATION ENGINE */}
          {activeTab === "engine" && (
            <div className="space-y-4">
              {/* Filter & Action Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Tìm mã FT, nội dung, số tiền..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-60 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                    <button
                      onClick={() => setFilterStatus("ALL")}
                      className={`px-3 py-1 rounded transition ${
                        filterStatus === "ALL" ? "bg-purple-50 text-purple-700 font-bold" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilterStatus("UNMATCHED")}
                      className={`px-3 py-1 rounded transition ${
                        filterStatus === "UNMATCHED" ? "bg-amber-50 text-amber-700 font-bold" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Chưa khớp ({statements.filter((s) => s.status === "UNMATCHED").length})
                    </button>
                    <button
                      onClick={() => setFilterStatus("MATCHED")}
                      className={`px-3 py-1 rounded transition ${
                        filterStatus === "MATCHED" ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Đã khớp ({statements.filter((s) => s.status === "MATCHED").length})
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAutoReconcile}
                    disabled={loading}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-2xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Chạy Khớp Tự Động</span>
                  </button>

                  <button
                    onClick={handleManualMatch}
                    disabled={loading || !selectedTxId || !selectedInvId}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition ${
                      selectedTxId && selectedInvId
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-2xs"
                        : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Ghép Nối Thủ Công (1-1)</span>
                  </button>
                </div>
              </div>

              {/* Split View: Bank Statements vs Ledger Invoices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bank Statements Column */}
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col">
                  <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Landmark className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-slate-800">
                        1. Sổ Phụ Ngân Hàng ({filteredStatements.length})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">Click chọn 1 dòng</span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
                    {filteredStatements.map((st) => {
                      const isSelected = selectedTxId === st.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setSelectedTxId(isSelected ? null : st.id)}
                          className={`p-3 text-xs cursor-pointer transition flex items-start justify-between border ${
                            isSelected
                              ? "bg-purple-50/40 border-purple-200 shadow-xs"
                              : "border-transparent hover:bg-slate-50/80"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-800">
                                #{st.bankTransactionId}
                              </span>
                              {st.status === "MATCHED" ? (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-900 rounded-full">
                                  ĐÃ KHỚP
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-900 rounded-full">
                                  CHƯA KHỚP
                                </span>
                              )}
                            </div>

                            <p className={`font-medium text-[11px] line-clamp-2 ${isSelected ? "text-purple-950" : "text-slate-700"}`}>
                              {st.reference}
                            </p>

                            <div className={`text-[10px] ${isSelected ? "text-purple-700" : "text-slate-500"}`}>
                              {st.transactionDate ? new Date(st.transactionDate).toLocaleDateString("vi-VN") : "Hôm nay"}
                            </div>
                          </div>

                          <div className="text-right space-y-1.5">
                            <div
                              className={`font-mono font-bold text-xs ${
                                st.amount > 0 ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {st.amount > 0 ? "+" : ""}
                              {st.amount.toLocaleString("vi-VN")} VNĐ
                            </div>

                            {st.status === "MATCHED" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnmatch(st.id);
                                }}
                                className="text-[10px] text-slate-400 hover:text-rose-600 underline font-semibold block ml-auto"
                              >
                                Hủy khớp
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredStatements.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        Không tìm thấy giao dịch sao kê phù hợp
                      </div>
                    )}
                  </div>
                </div>

                {/* Ledger Invoices Column */}
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col">
                  <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">
                        2. Hóa Đơn Sổ Cái AR/AP ({invoices.length})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">Click chọn 1 hóa đơn</span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
                    {invoices.map((inv) => {
                      const isSelected = selectedInvId === inv.id;
                      const isPaid = inv.paymentStatus === "PAID";
                      return (
                        <div
                          key={inv.id}
                          onClick={() => setSelectedInvId(isSelected ? null : inv.id)}
                          className={`p-3 text-xs cursor-pointer transition flex items-start justify-between border ${
                            isSelected
                              ? "bg-emerald-50/40 border-emerald-200 shadow-xs"
                              : "border-transparent hover:bg-slate-50/80"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-800">
                                {inv.invoiceNumber}
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded">
                                {inv.type}
                              </span>
                              {isPaid ? (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-900 rounded-full">
                                  ĐÃ THANH TOÁN
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-900 rounded-full">
                                  CHỜ GẠCH NỢ
                                </span>
                              )}
                            </div>

                            <p className={`font-medium text-[11px] ${isSelected ? "text-emerald-950" : "text-slate-700"}`}>
                              Đối tác: {inv.customerName || "Khách hàng B2B"}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-bold text-xs text-slate-900">
                              {(inv.finalAmount || 0).toLocaleString("vi-VN")} VNĐ
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {invoices.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs">
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
            <div className="max-w-3xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-600" />
                  Nạp Dữ Liệu Sao Kê Ngân Hàng Điện Tử (CSV / MT940 / JSON)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Định dạng chuẩn mỗi dòng: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-800">MaGiaoDich,SoTien,Ngay,NoiDung</code>
                </p>
              </div>

              <textarea
                rows={7}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-600">
                  Tài khoản đích: <strong className="text-slate-900">#{selectedAccountId} ({selectedAccount?.bankName})</strong>
                </span>

                <button
                  onClick={handleImportStatements}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center space-x-2"
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
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-purple-600" />
                  Tạo Mã VietQR Thanh Toán Động (NAPAS247)
                </h3>

                <div className="space-y-3 text-xs bg-slate-50/60 p-4 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Mã Ngân Hàng (Bank Code)</label>
                    <input
                      type="text"
                      value={vietQrForm.bankCode}
                      onChange={(e) => setVietQrForm({ ...vietQrForm, bankCode: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Số Tài Khoản Doanh Nghiệp</label>
                    <input
                      type="text"
                      value={vietQrForm.accountNumber}
                      onChange={(e) => setVietQrForm({ ...vietQrForm, accountNumber: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <CurrencyInput
                      label="Số Tiền (VNĐ)"
                      value={vietQrForm.amount}
                      onChange={(val) => setVietQrForm({ ...vietQrForm, amount: val })}
                      placeholder="VD: 120.000.000"
                      showBadge={true}
                      showPresets={true}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Nội Dung Chuyển Khoản (Memo / Invoice Ref)</label>
                    <input
                      type="text"
                      value={vietQrForm.memo}
                      onChange={(e) => setVietQrForm({ ...vietQrForm, memo: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    onClick={handleGenerateVietQr}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-md shadow-2xs transition flex items-center justify-center space-x-2 mt-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Khởi Tạo Mã VietQR</span>
                  </button>
                </div>
              </div>

              {/* QR Render Preview */}
              <div className="border border-slate-200 p-5 rounded-lg bg-slate-50 flex flex-col items-center justify-center text-center space-y-3">
                {vietQrResult ? (
                  <>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <img
                        src={vietQrResult.quickLinkUrl}
                        alt="VietQR Code"
                        className="w-48 h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>

                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold text-slate-900">Mã VietQR NAPAS247 Đã Sẵn Sàng</div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        {vietQrResult.amount.toLocaleString("vi-VN")} VNĐ - {vietQrResult.memo}
                      </div>
                    </div>

                    <div className="w-full bg-white p-2 rounded border border-slate-200 flex items-center justify-between font-mono text-[10px] text-slate-600">
                      <span className="truncate pr-2">{vietQrResult.vietQrString}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(vietQrResult.vietQrString);
                          setCopiedQrString(true);
                          setTimeout(() => setCopiedQrString(false), 2000);
                        }}
                        className="p-1 hover:bg-slate-100 rounded transition text-slate-500 shrink-0"
                      >
                        {copiedQrString ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-xs space-y-2">
                    <QrCode className="w-10 h-10 mx-auto stroke-1 text-slate-300" />
                    <div>Nhập thông tin bên trái & bấm "Khởi Tạo Mã VietQR"</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RECONCILIATION REPORT FORM 08-TT */}
          {activeTab === "report" && report && (
            <div className="space-y-4 max-w-4xl mx-auto bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    BÁO CÁO ĐỐI SOÁT TÀI KHOẢN NGÂN HÀNG (FORM 08-TT)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tài khoản: {report.bankName} - Số TK: {report.accountNumber} | Ngày chốt: {report.asOfDate}
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>In Báo Cáo</span>
                </button>
              </div>

              {/* Form 08-TT Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-y border-slate-300 text-[11px]">
                      <th className="py-2.5 px-3">Chỉ Tiêu Báo Cáo</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    <tr className="bg-slate-50/50 font-bold">
                      <td className="py-2 px-3 text-slate-900">A. DƯ BÁO CÓ NGUYÊN BẢN SAO KÊ NGÂN HÀNG</td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-purple-700">
                        {report.form08TT.bankBalanceOnStatement.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 pl-6 text-slate-600">
                        + Khoản tiền gửi đang chuyển (Outstanding Deposits)
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-emerald-600">
                        +{report.form08TT.addOutstandingDeposits.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 pl-6 text-slate-600">
                        - Séc/Sổ chi đang chuyển (Outstanding Checks)
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-rose-600">
                        -{report.form08TT.lessOutstandingChecks.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr className="bg-purple-50/70 font-bold border-t border-purple-200">
                      <td className="py-2 px-3 text-purple-900">=&gt; SỐ DƯ SAO KÊ ĐÃ ĐIỀU CHỈNH</td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-purple-900">
                        {report.form08TT.adjustedBankBalance.toLocaleString("vi-VN")}
                      </td>
                    </tr>

                    <tr className="bg-slate-50/50 font-bold">
                      <td className="py-2 px-3 text-slate-900">B. SỐ DƯ TK 1121 TRÊN SỔ CÁI KẾ TOÁN (GL)</td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-blue-700">
                        {report.form08TT.bookBalanceInGL.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 pl-6 text-slate-600">
                        + Thu ngân hàng chưa ghi sổ (Unrecorded Credits)
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-emerald-600">
                        +{report.form08TT.addUnrecordedCredits.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 pl-6 text-slate-600">
                        - Phí/Chi ngân hàng chưa ghi sổ (Unrecorded Debits)
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-rose-600">
                        -{report.form08TT.lessUnrecordedDebits.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                    <tr className="bg-blue-50/70 font-bold border-t border-blue-200">
                      <td className="py-2 px-3 text-blue-900">=&gt; SỐ DƯ SỔ CÁI ĐÃ ĐIỀU CHỈNH</td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-blue-900">
                        {report.form08TT.adjustedBookBalance.toLocaleString("vi-VN")}
                      </td>
                    </tr>

                    <tr className="bg-slate-900 text-white font-bold">
                      <td className="py-2.5 px-3">CHÊNH LỆCH ĐỐI SOÁT CUỐI KỲ</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-emerald-400">
                        {report.difference.toLocaleString("vi-VN")} VNĐ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
