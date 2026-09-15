import React, { useState, useEffect } from "react";
import { CurrencyInput } from "../../../../components/common/CurrencyInput";
import { useWorkspaceSessionTab } from "../../../../hooks/useWorkspaceSessionTab";
import {
  GitMerge,
  Building2,
  DollarSign,
  Layers,
  Sparkles,
  Printer,
  Copy,
  Plus,
  ArrowRightLeft,
  ShieldCheck,
  TrendingUp,
  FileText,
  RefreshCw,
  Globe,
  AlertCircle,
  CheckCircle2,
  Zap,
  Scale,
  FileCheck2,
  PieChart,
  BookOpen,
  ArrowRight,
  Download,
  Lock,
  Unlock,
  Sliders,
  CheckSquare,
  XSquare,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  History,
  FileSpreadsheet,
  Filter,
  Search,
  Settings,
} from "lucide-react";
import { downloadModuleReportPdf, downloadTransferPricingReportPdf } from "../../../../utils/pdfExporter";
import { ConsolidationEntity, IntercompanyElimination, FxRule, GroupStructureNode, CoaMappingRule, IntercompanyMatchItem, ConsolidationAdjustmentJournal, PeriodCloseStage, ConsolidationReport, TransferPricingData, DualReportingBridgeData } from "./types";
import { INITIAL_ENTITIES, INITIAL_ELIMINATIONS, INITIAL_COA_MAPPINGS, INITIAL_IC_MATCHES, INITIAL_ADJUSTMENT_JOURNALS, INITIAL_PERIOD_CLOSE_STAGES, INITIAL_TRANSFER_PRICING } from "./mockData";

const formatAmountInWordsShort = (num: number): string => {
  if (!num || num <= 0) return "0 VNĐ";
  if (num >= 1000000000) {
    const ty = num / 1000000000;
    return `${Number.isInteger(ty) ? ty : ty.toFixed(2)} Tỷ VNĐ`;
  }
  if (num >= 1000000) {
    const trieu = num / 1000000;
    return `${Number.isInteger(trieu) ? trieu : trieu.toFixed(2)} Triệu VNĐ`;
  }
  if (num >= 1000) {
    const nghin = num / 1000;
    return `${Number.isInteger(nghin) ? nghin : nghin.toFixed(2)} Nghìn VNĐ`;
  }
  return `${num.toLocaleString("vi-VN")} VNĐ`;
};

// Initial Enterprise Master Data Baseline
export const M34FinancialConsolidationWorkspace: React.FC<M34Props> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<
    | "report"
    | "structure"
    | "coa_mapping"
    | "intercompany_matching"
    | "eliminations"
    | "fx"
    | "adjustments"
    | "period_close"
    | "transfer_pricing"
    | "vas_ifrs_bridge"
  >("M34", "report");

  // Core States
  const [entities, setEntities] = useState<ConsolidationEntity[]>(INITIAL_ENTITIES);
  const [eliminations, setEliminations] = useState<IntercompanyElimination[]>(INITIAL_ELIMINATIONS);
  const [coaMappings, setCoaMappings] = useState<CoaMappingRule[]>(INITIAL_COA_MAPPINGS);
  const [icMatches, setIcMatches] = useState<IntercompanyMatchItem[]>(INITIAL_IC_MATCHES);
  const [adjustments, setAdjustments] = useState<ConsolidationAdjustmentJournal[]>(INITIAL_ADJUSTMENT_JOURNALS);
  const [periodStages, setPeriodStages] = useState<PeriodCloseStage[]>(INITIAL_PERIOD_CLOSE_STAGES);

  const [report, setReport] = useState<ConsolidationReport | null>(null);
  const [tpData, setTpData] = useState<TransferPricingData | null>(null);
  const [bridgeData, setBridgeData] = useState<DualReportingBridgeData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [matchStatusFilter, setMatchStatusFilter] = useState<string>("ALL");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState<boolean>(false);
  const [isAdjModalOpen, setIsAdjModalOpen] = useState<boolean>(false);
  const [selectedMatch, setSelectedMatch] = useState<IntercompanyMatchItem | null>(null);

  // Form States
  const [newEntry, setNewEntry] = useState({
    type: "IC_SALES_PURCHASE",
    sourceBranch: "BR_HO",
    targetBranch: "BR_HCM",
    accountCode: "5111 / 6321",
    description: "Loại trừ doanh thu & giá vốn nội bộ bán hàng phát sinh",
    amount: 500000000,
  });

  const [newMapping, setNewMapping] = useState({
    entityCode: "BR_SG_GLOBAL",
    localAccountCode: "",
    localAccountName: "",
    groupAccountCode: "5111-GROUP",
    groupAccountName: "Doanh thu hợp nhất",
    translationCategory: "PNL" as "BALANCE_SHEET" | "PNL" | "EQUITY",
  });

  const [newAdj, setNewAdj] = useState({
    type: "RECLASSIFICATION" as "RECLASSIFICATION" | "ELIMINATION" | "FX_TRANSLATION" | "OWNERSHIP_NCI" | "AUDIT_ADJUSTMENT",
    reason: "",
    entity: "BR_HO",
    drAccount: "5111",
    crAccount: "6321",
    amountVND: 100000000,
  });

  // Calculate Aggregates
  const totalRawRevenue = entities.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalEliminationAmt = eliminations.reduce((acc, curr) => acc + curr.amount, 0);
  const consolidatedRevenue = totalRawRevenue - totalEliminationAmt;
  const consolidatedNetIncome = entities.reduce((acc, curr) => acc + curr.netIncome, 0);

  // Fetch API or fallback
  const fetchData = async () => {
    setLoading(true);
    try {
      const [entRes, elimRes, rptRes, tpRes, bridgeRes] = await Promise.all([
        fetch("/api/finance/consolidation/entities"),
        fetch("/api/finance/consolidation/eliminations"),
        fetch("/api/finance/consolidation/report"),
        fetch("/api/finance/consolidation/transfer-pricing"),
        fetch("/api/finance/consolidation/dual-reporting-bridge"),
      ]);

      if (entRes.ok) setEntities(await entRes.json());
      if (elimRes.ok) setEliminations(await elimRes.json());
      if (rptRes.ok) setReport(await rptRes.json());
      if (tpRes.ok) setTpData(await tpRes.json());
      if (bridgeRes.ok) setBridgeData(await bridgeRes.json());
    } catch (e) {
      console.warn("API offline; initialized local state baseline for Consolidation Workspace");
    } finally {
      // Build default report object if null
      if (!report) {
        setReport({
          asOfDate: "2026-02-28",
          currency: "VND",
          entities: INITIAL_ENTITIES,
          eliminationsList: INITIAL_ELIMINATIONS,
          fxRules: [
            { currency: "USD", closingRate: 25400, averageRate: 25250, historicalRate: 24800, ctaReserveVND: 350000000, lastUpdated: "2026-02-28" },
            { currency: "EUR", closingRate: 27500, averageRate: 27200, historicalRate: 26900, ctaReserveVND: 120000000, lastUpdated: "2026-02-28" },
          ],
          financialStatements: {
            pnl: {
              title: "Báo Cáo Kết Quả Hoạt Động Kinh Doanh Hợp Nhất (Mẫu B 02 - DN/HN)",
              grossRevenue: { rawSum: 84380000000, elimination: 1650000000, consolidated: 82730000000 },
              cogsAndExpense: { rawSum: 62360000000, elimination: 1650000000, consolidated: 60710000000 },
              netProfitBeforeNci: { rawSum: 22020000000, elimination: 0, consolidated: 22020000000 },
              nciShare: 480000000,
              parentCompanyProfit: 21540000000,
            },
            balanceSheet: {
              title: "Bảng Cân Đối Kế Toán Hợp Nhất Tập Đoàn (Mẫu B 01 - DN/HN)",
              totalAssets: { rawSum: 148000000000, elimination: 11800000000, consolidated: 136200000000 },
              totalLiabilities: { rawSum: 56500000000, elimination: 1250000000, consolidated: 55250000000 },
              totalEquity: { rawSum: 91500000000, elimination: 10550000000, consolidated: 80950000000 },
              nciEquity: 1700000000,
              ctaReserve: 470000000,
            },
          },
        });
      }
      if (!tpData) {
        setTpData(INITIAL_TRANSFER_PRICING);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunConsolidation = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onNotify) onNotify("Đã thực thi Động Cơ Hợp Nhất Báo Cáo Tài Chính Tập Đoàn thành công! (NCI & Elimination Checked)", "success");
    }, 600);
  };

  const handleCreateEliminationEntry = () => {
    if (!newEntry.amount || newEntry.amount <= 0) {
      if (onNotify) onNotify("Vui lòng nhập số tiền loại trừ hợp lệ", "error");
      return;
    }
    const created: IntercompanyElimination = {
      id: eliminations.length + 1,
      eliminationCode: `ELIM-2026-00${eliminations.length + 1}`,
      type: newEntry.type,
      sourceBranch: newEntry.sourceBranch,
      targetBranch: newEntry.targetBranch,
      accountCode: newEntry.accountCode,
      description: newEntry.description,
      amount: newEntry.amount,
      status: "POSTED",
      date: new Date().toISOString().split("T")[0],
    };
    setEliminations([created, ...eliminations]);
    setIsModalOpen(false);
    if (onNotify) onNotify(`Đã tạo bút toán loại trừ [${created.eliminationCode}] thành công!`, "success");
  };

  const handleCreateMapping = () => {
    if (!newMapping.localAccountCode || !newMapping.localAccountName) {
      if (onNotify) onNotify("Vui lòng điền mã và tên tài khoản local", "error");
      return;
    }
    const createdRule: CoaMappingRule = {
      id: `MAP-${Math.floor(100 + Math.random() * 900)}`,
      entityCode: newMapping.entityCode,
      localAccountCode: newMapping.localAccountCode,
      localAccountName: newMapping.localAccountName,
      groupAccountCode: newMapping.groupAccountCode,
      groupAccountName: newMapping.groupAccountName,
      translationCategory: newMapping.translationCategory,
      mappingType: "DIRECT",
      status: "MAPPED",
    };
    setCoaMappings([...coaMappings, createdRule]);
    setIsMappingModalOpen(false);
    setNewMapping({ entityCode: "BR_SG_GLOBAL", localAccountCode: "", localAccountName: "", groupAccountCode: "5111-GROUP", groupAccountName: "Doanh thu hợp nhất", translationCategory: "PNL" });
    if (onNotify) onNotify(`Đã tạo quy tắc COA Mapping [${createdRule.id}] thành công!`, "success");
  };

  const handleCreateAdjustment = () => {
    if (!newAdj.reason) {
      if (onNotify) onNotify("Vui lòng điền diễn giải lý do điều chỉnh", "error");
      return;
    }
    const journal: ConsolidationAdjustmentJournal = {
      id: `CAJ-2026-0${adjustments.length + 1}`,
      journalNo: `CONSO-ADJ-00${adjustments.length + 1}`,
      period: "2026-Q1",
      type: newAdj.type,
      reason: newAdj.reason,
      entity: newAdj.entity,
      drAccount: newAdj.drAccount,
      crAccount: newAdj.crAccount,
      amountVND: newAdj.amountVND,
      createdBy: "Hoàng Nam (CFO)",
      approvedBy: "Trần Đức (Audit Lead)",
      status: "POSTED",
      auditTrail: `SHA256: ${Math.random().toString(36).substring(2, 10)}... (Consolidation Layer)`,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };
    setAdjustments([journal, ...adjustments]);
    setIsAdjModalOpen(false);
    if (onNotify) onNotify(`Đã ghi nhận Bút toán Điều chỉnh Hợp nhất [${journal.journalNo}] thành công!`, "success");
  };

  const handleAdvanceStage = (stageCode: string) => {
    setPeriodStages((prev) =>
      prev.map((stg) => {
        if (stg.stageCode === stageCode) {
          return { ...stg, status: "COMPLETED", completedBy: "Hoàng Nam (CFO)", completedAt: new Date().toISOString().split("T")[0] };
        }
        return stg;
      })
    );
    if (onNotify) onNotify(`Đã xác nhận hoàn tất bước [${stageCode}] trong quy trình đóng kỳ hợp nhất`, "success");
  };

  const filteredMatches = icMatches.filter((m) => {
    const matchesSearch =
      (m.entityA || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.entityB || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.docRefA || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.docRefB || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = matchStatusFilter === "ALL" || m.status === matchStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 p-4 md:p-6 bg-slate-50/50 min-h-screen">
      {/* Top Domain & Authority Boundary Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
              <GitMerge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded uppercase tracking-wider border border-indigo-500/30">
                  Finance & Accounting Domain
                </span>
                <span className="text-slate-400 text-xs">| Submodule: M34</span>
              </div>
              <h1 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                Financial Consolidation Engine — Hợp Nhất Tài Chính Tập Đoàn
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleRunConsolidation}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Đang Tính Toán..." : "Chạy Động Cơ Hợp Nhất"}</span>
            </button>

            <button
              onClick={() => {
                try {
                  const fileName = downloadModuleReportPdf(
                    { code: "M34", moduleId: "M34", moduleName: "Financial Consolidation" },
                    { name: "Hoàng Nam (Admin)", role: "SUPER_ADMIN" }
                  );
                  if (onNotify) onNotify(`Đã xuất file PDF báo cáo [${fileName}] thành công!`, "success");
                } catch (e) {
                  if (onNotify) onNotify("Lỗi khi tạo file PDF báo cáo", "error");
                }
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Xuất PDF Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* Authority Boundary Banner */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="flex items-center space-x-2 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">Layer Hợp Nhất Độc Lập:</span>{" "}
              <span className="text-slate-400 text-[11px]">Bảo toàn sổ cái GL gốc của các Công ty thành viên.</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <FileCheck2 className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">Quyền Đọc Dữ Liệu:</span>{" "}
              <span className="text-slate-400 text-[11px]">Entity GL, AR/AP, Tax, Intercompany Matching.</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">Giới Hạn Thẩm Quyền:</span>{" "}
              <span className="text-slate-400 text-[11px]">Tuyệt đối không ghi đè sổ cái gốc của công ty con.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Đơn Vị Thành Viên Tập Đoàn</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
              {entities.length} <span className="text-xs text-slate-500 font-normal">Entities</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">1 Mẹ, 3 Công ty con (Full Conso)</div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Tổng Giao Dịch Loại Trừ</div>
            <div className="text-lg font-bold text-rose-600 mt-0.5 font-mono">
              -{(totalEliminationAmt / 1e9).toFixed(2)} <span className="text-xs text-slate-500 font-normal">Tỷ VNĐ</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{eliminations.length} Bút toán loại trừ nội bộ</div>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Doanh Thu Hợp Nhất Tập Đoàn</div>
            <div className="text-lg font-bold text-indigo-700 mt-0.5 font-mono">
              {(consolidatedRevenue / 1e9).toFixed(2)} <span className="text-xs text-slate-500 font-normal">Tỷ VNĐ</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Chuẩn VAS 25 / IFRS 10 Verified
            </div>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Lợi Nhuận Sau Thuế Hợp Nhất</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5 font-mono">
              {(consolidatedNetIncome / 1e9).toFixed(2)} <span className="text-xs text-slate-500 font-normal">Tỷ VNĐ</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Đã tính phần Cổ đông NCI</div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar (M41 Master Spec) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0 mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
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
            <span>1. Báo Cáo Hợp Nhất</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("structure")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "structure"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>2. Cấu Trúc Tập Đoàn</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === "structure" ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {entities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("coa_mapping")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "coa_mapping"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>3. COA Mapping</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === "coa_mapping" ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {coaMappings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("intercompany_matching")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "intercompany_matching"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span>4. Đối Soát Nội Bộ</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === "intercompany_matching" ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {icMatches.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("eliminations")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "eliminations"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <XSquare className="w-4 h-4 shrink-0" />
            <span>5. Bút Toán Loại Trừ</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === "eliminations" ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {eliminations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fx")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "fx"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>6. Tỷ Giá &amp; Quỹ CTA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("adjustments")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "adjustments"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>7. BT Điều Chỉnh</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === "adjustments" ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {adjustments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("period_close")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "period_close"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>8. Đóng Kỳ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("transfer_pricing")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "transfer_pricing"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span>9. Chuyển Giá (TP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vas_ifrs_bridge")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === "vas_ifrs_bridge"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>10. VAS / IFRS</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Consolidation Authority
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            IFRS 10 / VAS 25
          </span>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col min-w-0">

        {/* Tab Content Body */}
        <div className="p-5 min-w-0">
          {/* TAB 1: CONSOLIDATED FINANCIAL REPORTS */}
          {activeTab === "report" && report && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Báo Cáo Tài Chính Hợp Nhất Tập Đoàn (VAS 25 & IFRS 10)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đã bao gồm điều chỉnh loại trừ giao dịch nội bộ và phân bổ lợi ích cổ đông không kiểm soát (NCI).
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      try {
                        const fileName = downloadModuleReportPdf(
                          { code: "M34", moduleId: "M34", moduleName: "Financial Consolidation" },
                          { name: "Hoàng Nam (Admin)", role: "SUPER_ADMIN" }
                        );
                        if (onNotify) onNotify(`Đã tải file PDF báo cáo [${fileName}] thành công!`, "success");
                      } catch (e) {
                        if (onNotify) onNotify("Lỗi khi tải file PDF báo cáo", "error");
                      }
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-md transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tải PDF</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>In Báo Cáo</span>
                  </button>
                </div>
              </div>

              {/* 1. Consolidated P&L Statement */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-indigo-600" />
                    {report.financialStatements.pnl.title}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">Kỳ Báo Cáo: 2026-Q1 | ĐVT: VNĐ</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                        <th className="py-2.5 px-3">Chỉ Tiêu Hạch Toán</th>
                        <th className="py-2.5 px-3 text-right">Tổng Cộng Thô</th>
                        <th className="py-2.5 px-3 text-right text-rose-600">Loại Trừ Nội Bộ</th>
                        <th className="py-2.5 px-3 text-right text-indigo-700 font-black">HỢP NHẤT TẬP ĐOÀN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                          1. Doanh thu bán hàng & cung cấp dịch vụ (Gross Revenue)
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-slate-700">
                          {report.financialStatements.pnl.grossRevenue.rawSum.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-rose-600">
                          -{report.financialStatements.pnl.grossRevenue.elimination.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-indigo-700 bg-indigo-50/50">
                          {report.financialStatements.pnl.grossRevenue.consolidated.toLocaleString("vi-VN")}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                          2. Giá vốn hàng bán & Chi phí hoạt động (COGS & Opex)
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-slate-700">
                          {report.financialStatements.pnl.cogsAndExpense.rawSum.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-rose-600">
                          -{report.financialStatements.pnl.cogsAndExpense.elimination.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-slate-900 bg-indigo-50/50">
                          {report.financialStatements.pnl.cogsAndExpense.consolidated.toLocaleString("vi-VN")}
                        </td>
                      </tr>

                      <tr className="bg-emerald-50 text-emerald-900 font-bold">
                        <td className="py-2.5 px-3 font-sans">
                          3. Lợi nhuận sau thuế trước phân bổ NCI (Net Profit Before NCI)
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold">
                          {report.financialStatements.pnl.netProfitBeforeNci.rawSum.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-slate-600">0</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-emerald-700">
                          {report.financialStatements.pnl.netProfitBeforeNci.consolidated.toLocaleString("vi-VN")}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-sans text-slate-600 pl-6">
                          - Lợi ích của cổ đông không kiểm soát (NCI Share 20% tại BR_DN)
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">-</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">-</td>
                        <td className="py-2.5 px-3 text-right text-slate-700 font-bold">
                          {report.financialStatements.pnl.nciShare.toLocaleString("vi-VN")}
                        </td>
                      </tr>

                      <tr className="bg-slate-900 text-white font-bold">
                        <td className="py-3 px-3 font-sans">
                          4. Lợi nhuận sau thuế của Cổ đông Công ty Mẹ (Parent Net Profit)
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">-</td>
                        <td className="py-3 px-3 text-right text-slate-300">-</td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-black text-xs">
                          {report.financialStatements.pnl.parentCompanyProfit.toLocaleString("vi-VN")} VNĐ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Consolidated Balance Sheet */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    {report.financialStatements.balanceSheet.title}
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-600 font-bold">
                    ✓ Bảng Cân Đối Cân Bằng (Assets = Liabilities + Equity)
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                        <th className="py-2.5 px-3">Bảng Cân Đối Kế Toán</th>
                        <th className="py-2.5 px-3 text-right">Tổng Cộng Thô</th>
                        <th className="py-2.5 px-3 text-right text-rose-600">Loại Trừ & Chênh Lệch</th>
                        <th className="py-2.5 px-3 text-right text-indigo-700 font-black">HỢP NHẤT TẬP ĐOÀN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                          TỔNG TÀI SẢN (Total Assets)
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          {report.financialStatements.balanceSheet.totalAssets.rawSum.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">
                          -{report.financialStatements.balanceSheet.totalAssets.elimination.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 text-right text-blue-700 font-black bg-blue-50/50">
                          {report.financialStatements.balanceSheet.totalAssets.consolidated.toLocaleString("vi-VN")}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                          NỢ PHẢI TRẢ (Total Liabilities)
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          {report.financialStatements.balanceSheet.totalLiabilities.rawSum.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">
                          -{report.financialStatements.balanceSheet.totalLiabilities.elimination.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-800 font-bold bg-slate-100/50">
                          {report.financialStatements.balanceSheet.totalLiabilities.consolidated.toLocaleString("vi-VN")}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                          VỐN CHỦ SỞ HỮU HỢP NHẤT (Total Equity)
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          {report.financialStatements.balanceSheet.totalEquity.rawSum.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">
                          -{report.financialStatements.balanceSheet.totalEquity.elimination.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-black bg-emerald-50/50">
                          {report.financialStatements.balanceSheet.totalEquity.consolidated.toLocaleString("vi-VN")}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 text-[10px]">
                        <td className="py-2 px-3 font-sans text-slate-500 pl-6">
                          - Trong đó: Vốn góp của Cổ đông không kiểm soát (NCI Equity)
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-700 font-bold">
                          {report.financialStatements.balanceSheet.nciEquity.toLocaleString("vi-VN")}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 text-[10px]">
                        <td className="py-2 px-3 font-sans text-slate-500 pl-6">
                          - Trong đó: Quỹ chênh lệch tỷ giá quy đổi BCTC (CTA Reserve)
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-sky-700 font-bold">
                          +{report.financialStatements.balanceSheet.ctaReserve.toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSOLIDATION STRUCTURE */}
          {activeTab === "structure" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Cấu Trúc Tập Đoàn & Phương Pháp Hợp Nhất (Group Structure)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản lý danh sách công ty Mẹ & các Công ty con, tỷ lệ sở hữu và phương pháp hợp nhất (Full Conso vs Equity Method).
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (onNotify) onNotify("Hệ thống tự động đồng bộ cấu trúc pháp lý từ Submodule Master Data", "info");
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đồng Bộ Master Data</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entities.map((entity) => (
                  <div
                    key={entity.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-lg font-bold text-xs ${entity.entityType === "PARENT" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"}`}>
                          {entity.code}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{entity.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">Trạng thái: {entity.status} | Ngày hiệu lực: {entity.effectiveDate || "2020-01-01"}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${entity.entityType === "PARENT" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                        {entity.entityType === "PARENT" ? "Công Ty Mẹ" : `Con (${entity.ownershipPercent}%)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-500 block">Phương Pháp Hợp Nhất</span>
                        <span className="font-bold text-slate-800 text-[11px]">{entity.consolidationMethod}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-500 block">Đồng Tiền Sổ Cái</span>
                        <span className="font-bold text-indigo-700 text-[11px] font-mono">{entity.currency}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Doanh Thu</span>
                        <span className="font-bold text-slate-800">{(entity.revenue / 1e9).toFixed(1)}B</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Tổng Tài Sản</span>
                        <span className="font-bold text-blue-700">{(entity.assets / 1e9).toFixed(1)}B</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Vốn CSH</span>
                        <span className="font-bold text-emerald-700">{(entity.equity / 1e9).toFixed(1)}B</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COA MAPPING */}
          {activeTab === "coa_mapping" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-600" />
                    Ma Trận Chuẩn Hóa COA Mapping (Entity Local COA &rarr; Group COA)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quy tắc ánh xạ hệ thống tài khoản kế toán địa phương về Hệ thống Tài Khoản Tập Đoàn thống nhất.
                  </p>
                </div>

                <button
                  onClick={() => setIsMappingModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Quy Tắc Mapping</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Mã Rule</th>
                      <th className="py-2.5 px-3">Đơn Vị</th>
                      <th className="py-2.5 px-3">Tài Khoản Địa Phương (Local COA)</th>
                      <th className="py-2.5 px-3 text-center">&rarr;</th>
                      <th className="py-2.5 px-3">Tài Khoản Tập Đoàn (Group COA)</th>
                      <th className="py-2.5 px-3">Phân Loại BCTC</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {coaMappings.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-purple-700">{rule.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{rule.entityCode}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900">{rule.localAccountCode}</span>
                          <span className="text-[10px] text-slate-500 block font-sans">{rule.localAccountName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">&rarr;</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-indigo-700">{rule.groupAccountCode}</span>
                          <span className="text-[10px] text-slate-500 block font-sans">{rule.groupAccountName}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                            {rule.translationCategory}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${rule.status === "MAPPED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                            {rule.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: INTERCOMPANY MATCHING ENGINE */}
          {activeTab === "intercompany_matching" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                    Động Cơ Khớp Nối Giao Dịch Nội Bộ (Intercompany Matching Engine)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tự động đối soát 6 tham số (Số tiền, Tiền tệ, Kỳ, Đối tác, Số hóa đơn, Tài khoản) giữa các đơn vị.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={matchStatusFilter}
                    onChange={(e) => setMatchStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ALL">Tất cả Trạng thái</option>
                    <option value="MATCHED">Khớp Hoàn Toàn (MATCHED)</option>
                    <option value="PARTIALLY_MATCHED">Khớp Một Phần (PARTIAL)</option>
                    <option value="EXCEPTION">Sự Cố Lệch (EXCEPTION)</option>
                  </select>

                  <button
                    onClick={() => {
                      if (onNotify) onNotify("Đã kích hoạt quét tự động Intercompany Matching Engine!", "success");
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Quét Đối Soát Tự Động</span>
                  </button>
                </div>
              </div>

              {/* Status breakdown metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase">Tỷ Lệ Khớp Chuẩn</span>
                    <div className="text-lg font-bold text-emerald-700 font-mono">98.2% <span className="text-xs font-normal">Matched</span></div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>

                <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 uppercase">Khớp Một Phần / Lệch Phí</span>
                    <div className="text-lg font-bold text-amber-700 font-mono">1.3% <span className="text-xs font-normal">Partially</span></div>
                  </div>
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>

                <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-rose-800 uppercase">Hàng Đang Đi Đường / Exceptions</span>
                    <div className="text-lg font-bold text-rose-700 font-mono">5 items <span className="text-xs font-normal">Exceptions</span></div>
                  </div>
                  <ShieldAlert className="w-6 h-6 text-rose-600" />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Mã ĐC</th>
                      <th className="py-2.5 px-3">Giao Dịch Đơn Vị A ↔ Đơn Vị B</th>
                      <th className="py-2.5 px-3">Số Hóa Đơn Ref</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền A</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền B</th>
                      <th className="py-2.5 px-3 text-right text-rose-600">Chênh Lệch (VNĐ)</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {filteredMatches.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{m.id}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-bold text-slate-800">{m.entityA} &rarr; {m.entityB}</div>
                          <div className="text-[10px] text-slate-500">{m.notes}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{m.docRefA} / {m.docRefB}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{m.amountA.toLocaleString("vi-VN")} {m.currencyA}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{m.amountB.toLocaleString("vi-VN")} {m.currencyB}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          {m.differenceVND > 0 ? `+${m.differenceVND.toLocaleString("vi-VN")}` : "0"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              m.status === "MATCHED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : m.status === "PARTIALLY_MATCHED"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: INTERCOMPANY ELIMINATIONS */}
          {activeTab === "eliminations" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <XSquare className="w-4 h-4 text-rose-600" />
                    Bút Toán Loại Trừ Giao Dịch Nội Bộ (Intercompany Elimination Journals)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tạo các bút toán loại trừ trên Consolidation Layer (Không thay đổi Sổ Cái GL Gốc của đơn vị).
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Bút Toán Loại Trừ</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Mã Bút Toán</th>
                      <th className="py-2.5 px-3">Loại Loại Trừ</th>
                      <th className="py-2.5 px-3">Đơn Vị Giao &rarr; Nhận</th>
                      <th className="py-2.5 px-3">TK Hạch Toán (GL)</th>
                      <th className="py-2.5 px-3">Nội Dung Chi Tiết</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền (VNĐ)</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {eliminations.map((elim) => (
                      <tr key={elim.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-rose-700">{elim.eliminationCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{elim.type}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-bold">{elim.sourceBranch} &rarr; {elim.targetBranch}</td>
                        <td className="py-2.5 px-3 text-indigo-700 font-bold">{elim.accountCode}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-700">{elim.description}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 font-mono">
                          {elim.amount.toLocaleString("vi-VN")} VNĐ
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                            {elim.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CURRENCY TRANSLATION & CTA RESERVE */}
          {activeTab === "fx" && report && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-600" />
                    Động Cơ Quy Đổi Tiền Tệ & Quỹ CTA (Currency Translation & CTA Reserve)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quy đổi BCTC ngoại tệ về Đồng tiền Báo cáo (VND) theo chuẩn VAS 10 / IAS 21 (Closing Rate cho BS, Average Rate cho P&L).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.fxRules.map((fx) => (
                  <div key={fx.currency} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="px-2.5 py-1 bg-sky-100 text-sky-800 font-bold text-xs rounded-lg font-mono">
                          1 {fx.currency}
                        </div>
                        <span className="text-xs font-bold text-slate-800">Quy đổi về VND</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Cập nhật: {fx.lastUpdated}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-500 block">Tỷ Giá Cuối Kỳ (BS)</span>
                        <span className="font-bold text-sky-700">{fx.closingRate.toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-500 block">Tỷ Giá Bình Quân (P&L)</span>
                        <span className="font-bold text-indigo-700">{fx.averageRate.toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-500 block">Tỷ Giá Lịch Sử (Equity)</span>
                        <span className="font-bold text-slate-700">{fx.historicalRate.toLocaleString("vi-VN")}</span>
                      </div>
                    </div>

                    <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-sky-900">Quỹ Chênh Lệch Tỷ Giá CTA Reserve:</span>
                      <span className="font-bold text-sky-800 font-mono">+{fx.ctaReserveVND.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: CONSOLIDATION ADJUSTMENTS */}
          {activeTab === "adjustments" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    Sổ Bút Toán Điều Chỉnh Hợp Nhất (Consolidation-Only Journals)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ghi nhận các điều chỉnh phân bổ lợi thế thương mại, cổ đông NCI, đánh giá lại giá trị hợp lý không làm thay đổi GL gốc.
                  </p>
                </div>

                <button
                  onClick={() => setIsAdjModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Bút Toán Điều Chỉnh</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Số Bút Toán</th>
                      <th className="py-2.5 px-3">Loại Điều Chỉnh</th>
                      <th className="py-2.5 px-3">Đơn Vị Áp Dụng</th>
                      <th className="py-2.5 px-3">Định Khoản Nợ / Có</th>
                      <th className="py-2.5 px-3">Diễn Giải Lý Do</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền (VNĐ)</th>
                      <th className="py-2.5 px-3 text-center">Người Phê Duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {adjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-amber-700">{adj.journalNo}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{adj.type}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-bold">{adj.entity}</td>
                        <td className="py-2.5 px-3 text-indigo-700 font-bold">{adj.drAccount} / {adj.crAccount}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-700">{adj.reason}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          +{adj.amountVND.toLocaleString("vi-VN")} VNĐ
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded">
                            {adj.approvedBy}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: PERIOD CLOSE PIPELINE WORKFLOW */}
          {activeTab === "period_close" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    Quy Trình Đóng Kỳ Hợp Nhất (10-Stage Period Close Workflow Pipeline)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kiểm soát quy trình đóng sổ báo cáo hợp nhất 10 bước chuẩn mực ERP Enterprise.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {periodStages.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      stage.status === "COMPLETED"
                        ? "bg-emerald-50/40 border-emerald-200"
                        : stage.status === "IN_PROGRESS"
                        ? "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 opacity-70"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          stage.status === "COMPLETED"
                            ? "bg-emerald-600 text-white"
                            : stage.status === "IN_PROGRESS"
                            ? "bg-indigo-600 text-white animate-pulse"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{stage.name}</h4>
                        <p className="text-[11px] text-slate-500">{stage.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end md:self-auto">
                      {stage.completedBy && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Bởi: {stage.completedBy} ({stage.completedAt})
                        </span>
                      )}

                      {stage.status === "COMPLETED" ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Hoàn Tất
                        </span>
                      ) : stage.status === "IN_PROGRESS" ? (
                        <button
                          onClick={() => handleAdvanceStage(stage.stageCode)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-md transition shadow-xs cursor-pointer"
                        >
                          Xác Nhận Hoàn Thành Bước Này
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-semibold text-[10px] rounded-full">
                          Chờ Thực Hiện
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: TRANSFER PRICING & COMPLIANCE */}
          {activeTab === "transfer_pricing" && tpData && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" />
                    Thuế Chuyển Giá & OECD Pillar Two (Decree 132 Compliance)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản lý tuân thủ Nghị định 132/2020/NĐ-CP, Trần chi phí lãi vay 30% EBITDA & Thuế tối thiểu toàn cầu OECD 15%.
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Trạng Thái Tuân Thủ Nghị Định 132: {tpData.decree132ComplianceStatus}
                </div>
                <div>Ngưỡng Doanh Thu Toàn Cầu OECD Pillar Two: €750M EUR (Tập đoàn NexusSync hiện tại đạt 3.2M EUR - Miễn trừ Top-up Tax năm 2026).</div>
              </div>

              {/* 1. Danh Sách Giao Dịch Liên Kết */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                  1. Danh Sách Giao Dịch Bên Liên Kết (Arm's Length Principle Verification)
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                        <th className="py-2.5 px-3">Mã GD</th>
                        <th className="py-2.5 px-3">Loại Giao Dịch</th>
                        <th className="py-2.5 px-3">Bên Giao &rarr; Nhận</th>
                        <th className="py-2.5 px-3 text-right">Giá Trị (VNĐ)</th>
                        <th className="py-2.5 px-3">Phương Pháp TP</th>
                        <th className="py-2.5 px-3">Khoảng Benchmark</th>
                        <th className="py-2.5 px-3 text-center">Kết Luận Arm's Length</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {tpData.relatedPartyTransactions.map((rpt) => (
                        <tr key={rpt.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-amber-800">{rpt.id}</td>
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-800">{rpt.transactionType}</td>
                          <td className="py-2.5 px-3 font-bold text-indigo-700">{rpt.sourceEntity} &rarr; {rpt.targetEntity}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">{rpt.valueVND.toLocaleString("vi-VN")} VNĐ</td>
                          <td className="py-2.5 px-3 font-sans text-slate-700">{rpt.tpMethod}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-600">{rpt.benchmarkArmLengthRange}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                              ✓ ĐẠT CHUẨN
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2 & 3: EBITDA Interest Cap & OECD Pillar Two */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    2. Trần Chi Phí Lãi Vay 30% EBITDA (Nghị Định 132)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">EBITDA Tập Đoàn</span>
                      <span className="font-bold text-slate-800">{tpData.interestCapRule30Ebitda.ebitdaVND.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">Mức Trần 30% EBITDA</span>
                      <span className="font-bold text-amber-700">{tpData.interestCapRule30Ebitda.cap30EbitdaVND.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">Lãi Vay Thật Ròng (Net)</span>
                      <span className="font-bold text-indigo-700">{tpData.interestCapRule30Ebitda.netInterestExpenseVND.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-800">
                      <span className="text-[10px] text-emerald-600 block">Trạng Thái Chi Phí</span>
                      <span className="font-bold">ĐƯỢC TRỪ 100% (21.7% EBITDA)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-600" />
                    3. Thuế Tối Thiểu Toàn Cầu OECD Pillar Two (15% GloBE)
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    {tpData.globeEffectiveTaxRates.map((jurisdiction) => (
                      <div key={jurisdiction.jurisdiction} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                        <div>
                          <span className="font-bold text-slate-900 font-sans block">{jurisdiction.jurisdiction}</span>
                          <span className="text-[10px] text-slate-500">Thuế suất thực tế (ETR): {jurisdiction.effectiveTaxRate}%</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                          {jurisdiction.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. KHỞI TẠO BÁO CÁO & HỒ SƠ THUẾ CHUYỂN GIÁ */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  4. KHỞI TẠO BÁO CÁO & HỒ SƠ THUẾ CHUYỂN GIÁ (MASTER FILE, LOCAL FILE, CBCR)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tpData.documentationFiles.map((doc) => (
                    <div key={doc.fileType} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-mono font-bold text-xs text-slate-800 uppercase tracking-wide">{doc.fileType}</span>
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                            doc.status === "FILED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {doc.status}
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-slate-900 leading-snug">{doc.title}</h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{doc.summary}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[10px] font-mono text-slate-400">
                          {doc.fileSize} &nbsp;|&nbsp; {doc.lastUpdated}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const downloadedFile = downloadTransferPricingReportPdf(doc.fileType, doc.title);
                              if (onNotify) {
                                onNotify(`Đã xuất thành công báo cáo [${doc.title}] (${downloadedFile})!`, "success");
                              }
                            } catch (e) {
                              console.error(e);
                              if (onNotify) onNotify("Lỗi khi tạo file PDF báo cáo thuế chuyển giá", "error");
                            }
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-lg border border-indigo-200 transition cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Xuất File Báo Cáo</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: VAS VS IFRS DUAL REPORTING BRIDGE */}
          {activeTab === "vas_ifrs_bridge" && bridgeData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600" />
                    Cầu Nối Song Luồng BCTC Hợp Nhất VAS &rarr; IFRS (Dual Reporting Bridge)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tác động điều chỉnh từ Chuẩn mực Kế toán Việt Nam (VAS) sang Chuẩn mực Quốc tế (IFRS 16 Leases, IFRS 9 Financial Instruments, IFRS 15 Revenue).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Mã Bút Toán</th>
                      <th className="py-2.5 px-3">Nội Dung Điều Chỉnh</th>
                      <th className="py-2.5 px-3">Chuẩn Mực IFRS</th>
                      <th className="py-2.5 px-3 text-right">Tác Động Tài Sản</th>
                      <th className="py-2.5 px-3 text-right">Tác Động Nợ Phải Trả</th>
                      <th className="py-2.5 px-3 text-right">Tác Động Lợi Nhuận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {bridgeData.bridgeAdjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-teal-700">{adj.id}</td>
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-800">{adj.title}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-bold">{adj.standardRef}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700">+{adj.assetImpactVND.toLocaleString("vi-VN")} VNĐ</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">+{adj.liabilityImpactVND.toLocaleString("vi-VN")} VNĐ</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">+{adj.pnlImpactVND.toLocaleString("vi-VN")} VNĐ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Manual Elimination Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-600" />
                Tạo Bút Toán Loại Trừ Giao Dịch Nội Bộ
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Loại Giao Dịch Nội Bộ</label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="IC_SALES_PURCHASE">IC_SALES_PURCHASE (Doanh thu & Giá vốn)</option>
                  <option value="IC_AR_AP">IC_AR_AP (Công nợ Phải thu / Phải trả)</option>
                  <option value="IC_SERVICE_FEE">IC_SERVICE_FEE (Phí quản lý / Dịch vụ)</option>
                  <option value="IC_DIVIDEND">IC_DIVIDEND (Cổ tức nội bộ)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Đơn Vị Nguồn (Giao)</label>
                  <select
                    value={newEntry.sourceBranch}
                    onChange={(e) => setNewEntry({ ...newEntry, sourceBranch: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-xs"
                  >
                    {entities.map((e) => (
                      <option key={e.id} value={e.code}>
                        {e.code} ({e.name.substring(0, 18)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Đơn Vị Đích (Nhận)</label>
                  <select
                    value={newEntry.targetBranch}
                    onChange={(e) => setNewEntry({ ...newEntry, targetBranch: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-xs"
                  >
                    {entities.map((e) => (
                      <option key={e.id} value={e.code}>
                        {e.code} ({e.name.substring(0, 18)}...)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Cặp Tài Khoản Định Khoản (GL)</label>
                <input
                  type="text"
                  value={newEntry.accountCode}
                  onChange={(e) => setNewEntry({ ...newEntry, accountCode: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-xs font-bold text-indigo-700"
                />
              </div>

              <div>
                <CurrencyInput
                  label="Số Tiền Loại Trừ (VNĐ)"
                  value={newEntry.amount}
                  onChange={(val) => setNewEntry({ ...newEntry, amount: val })}
                  placeholder="Nhập số tiền (vd: 500.000.000)"
                  showBadge={true}
                  showPresets={true}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Diễn Giải Lý Do</label>
                <textarea
                  rows={2}
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateEliminationEntry}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-md shadow-xs cursor-pointer"
              >
                Lưu Bút Toán Loại Trừ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create COA Mapping Rule Modal */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600" />
                Thêm Quy Tắc Mapping COA Địa Phương &rarr; Tập Đoàn
              </h3>
              <button onClick={() => setIsMappingModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Đơn Vị Thành Viên</label>
                <select
                  value={newMapping.entityCode}
                  onChange={(e) => setNewMapping({ ...newMapping, entityCode: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-xs"
                >
                  {entities.map((e) => (
                    <option key={e.id} value={e.code}>
                      {e.code} - {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Mã TK Địa Phương (Local)</label>
                  <input
                    type="text"
                    placeholder="VD: 4000-REV-SG"
                    value={newMapping.localAccountCode}
                    onChange={(e) => setNewMapping({ ...newMapping, localAccountCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tên TK Địa Phương</label>
                  <input
                    type="text"
                    placeholder="VD: Revenue from SaaS"
                    value={newMapping.localAccountName}
                    onChange={(e) => setNewMapping({ ...newMapping, localAccountName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Mã TK Tập Đoàn (Group)</label>
                  <input
                    type="text"
                    value={newMapping.groupAccountCode}
                    onChange={(e) => setNewMapping({ ...newMapping, groupAccountCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-xs font-bold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phân Loại BCTC</label>
                  <select
                    value={newMapping.translationCategory}
                    onChange={(e) => setNewMapping({ ...newMapping, translationCategory: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs font-semibold"
                  >
                    <option value="PNL">Kết Quả Kinh Doanh (PNL)</option>
                    <option value="BALANCE_SHEET">Cân Đối Kế Toán (BS)</option>
                    <option value="EQUITY">Vốn Chủ Sở Hữu (Equity)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t border-slate-200 pt-3">
              <button onClick={() => setIsMappingModalOpen(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer">
                Hủy
              </button>
              <button onClick={handleCreateMapping} className="px-4 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-md shadow-xs cursor-pointer">
                Lưu Quy Tắc Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Consolidation Adjustment Journal Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" />
                Tạo Bút Toán Điều Chỉnh Hợp Nhất (Consolidation Layer)
              </h3>
              <button onClick={() => setIsAdjModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Loại Bút Toán Điều Chỉnh</label>
                <select
                  value={newAdj.type}
                  onChange={(e) => setNewAdj({ ...newAdj, type: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-xs"
                >
                  <option value="OWNERSHIP_NCI">OWNERSHIP_NCI (Tỷ lệ sở hữu & NCI)</option>
                  <option value="RECLASSIFICATION">RECLASSIFICATION (Tái phân loại tài khoản)</option>
                  <option value="FX_TRANSLATION">FX_TRANSLATION (Điều chỉnh tỷ giá)</option>
                  <option value="AUDIT_ADJUSTMENT">AUDIT_ADJUSTMENT (Điều chỉnh kiểm toán)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tài Khoản Nợ (Dr)</label>
                  <input
                    type="text"
                    value={newAdj.drAccount}
                    onChange={(e) => setNewAdj({ ...newAdj, drAccount: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-xs font-bold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tài Khoản Có (Cr)</label>
                  <input
                    type="text"
                    value={newAdj.crAccount}
                    onChange={(e) => setNewAdj({ ...newAdj, crAccount: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-xs font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <CurrencyInput
                  label="Số Tiền Điều Chỉnh (VNĐ)"
                  value={newAdj.amountVND}
                  onChange={(val) => setNewAdj({ ...newAdj, amountVND: val })}
                  placeholder="Nhập số tiền điều chỉnh (vd: 50.000.000)"
                  showBadge={true}
                  showPresets={true}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Diễn Giải Lý Do Điều Chỉnh</label>
                <textarea
                  rows={2}
                  placeholder="Diễn giải căn cứ điều chỉnh..."
                  value={newAdj.reason}
                  onChange={(e) => setNewAdj({ ...newAdj, reason: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t border-slate-200 pt-3">
              <button onClick={() => setIsAdjModalOpen(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer">
                Hủy
              </button>
              <button onClick={handleCreateAdjustment} className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-md shadow-xs cursor-pointer">
                Lưu Bút Toán Điều Chỉnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
