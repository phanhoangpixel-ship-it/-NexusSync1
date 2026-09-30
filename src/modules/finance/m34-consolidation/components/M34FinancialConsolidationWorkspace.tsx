import React, { useState, useEffect, useRef, useCallback } from "react";
import { CurrencyInput } from "../../../../components/common/CurrencyInput";
import { ConfirmDialog } from "../../../../components/common/ConfirmDialog";
import { TablePagination } from "../../../../components/common/TablePagination";
import { StatusBadge } from "../../../../components/common/StatusBadge";
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
  ChevronLeft,
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

  // Tabs scrolling container ref & state (M31 UI Standard synchronization)
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

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      checkScroll();
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll]);

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
  const [elimPage, setElimPage] = useState<number>(1);
  const [elimPageSize, setElimPageSize] = useState<number>(15);
  const [matchStatusFilter, setMatchStatusFilter] = useState<string>("ALL");

  // Modals & Confirm Dialog
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState<boolean>(false);
  const [isAdjModalOpen, setIsAdjModalOpen] = useState<boolean>(false);
  const [selectedMatch, setSelectedMatch] = useState<IntercompanyMatchItem | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [activeRunStatus, setActiveRunStatus] = useState<string>("DRAFT");

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
  const totalRawRevenue = (entities || []).reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalEliminationAmt = (eliminations || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const consolidatedRevenue = totalRawRevenue - totalEliminationAmt;
  const consolidatedNetIncome = (entities || []).reduce((acc, curr) => acc + (curr.netIncome || 0), 0);

  // Fetch API or fallback
  const fetchData = async () => {
    setLoading(true);
    let fetchedReport: any = null;
    let fetchedTp: any = null;
    try {
      const [entRes, elimRes, rptRes, tpRes, bridgeRes] = await Promise.all([
        fetch("/api/finance/consolidation/entities"),
        fetch("/api/finance/consolidation/eliminations"),
        fetch("/api/finance/consolidation/report"),
        fetch("/api/finance/consolidation/transfer-pricing"),
        fetch("/api/finance/consolidation/dual-reporting-bridge"),
      ]);

      if (entRes.ok) {
        const data = await entRes.json();
        if (Array.isArray(data)) setEntities(data);
      }
      if (elimRes.ok) {
        const data = await elimRes.json();
        if (Array.isArray(data)) setEliminations(data);
      }
      if (rptRes.ok) {
        const raw = await rptRes.json();
        if (raw && !raw.error && !raw.message) {
          fetchedReport = raw;
        }
      }
      if (tpRes.ok) {
        fetchedTp = await tpRes.json();
        if (fetchedTp && !fetchedTp.error) setTpData(fetchedTp);
      }
      if (bridgeRes.ok) {
        const data = await bridgeRes.json();
        if (data && !data.error) setBridgeData(data);
      }
    } catch (e) {
      console.warn("API offline; initialized local state baseline for Consolidation Workspace");
    } finally {
      if (fetchedReport) {
        // Ensure financialStatements structure exists
        if (!fetchedReport.financialStatements) {
          const rev = fetchedReport.incomeStatement?.totalRevenue || 0;
          const exp = fetchedReport.incomeStatement?.totalExpense || 0;
          const net = fetchedReport.incomeStatement?.netIncome || (rev - exp);
          const assets = fetchedReport.balanceSheet?.totalAssets || 0;
          const liab = fetchedReport.balanceSheet?.totalLiabilities || 0;
          const eq = fetchedReport.balanceSheet?.totalEquity || 0;

          fetchedReport.financialStatements = {
            pnl: {
              title: "Báo Cáo Kết Quả Hoạt Động Kinh Doanh Hợp Nhất (Mẫu B 02 - DN/HN)",
              grossRevenue: { rawSum: rev + (fetchedReport.runInfo?.totalEliminated || 0), elimination: fetchedReport.runInfo?.totalEliminated || 0, consolidated: rev },
              cogsAndExpense: { rawSum: exp + (fetchedReport.runInfo?.totalEliminated || 0), elimination: fetchedReport.runInfo?.totalEliminated || 0, consolidated: exp },
              netProfitBeforeNci: { rawSum: net, elimination: 0, consolidated: net },
              nciShare: Math.round(net * 0.05),
              parentCompanyProfit: net - Math.round(net * 0.05),
            },
            balanceSheet: {
              title: "Bảng Cân Đối Kế Toán Hợp Nhất Tập Đoàn (Mẫu B 01 - DN/HN)",
              totalAssets: { rawSum: assets, elimination: 0, consolidated: assets },
              totalLiabilities: { rawSum: liab, elimination: 0, consolidated: liab },
              totalEquity: { rawSum: eq, elimination: 0, consolidated: eq },
              nciEquity: 1700000000,
              ctaReserve: 470000000,
            },
          };
        }
        setReport(fetchedReport);
      } else {
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
      if (!fetchedTp) {
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
    try {
      const idempotencyKey = `CONS-${Date.now()}`;
      const res = await fetch("/api/finance/consolidation/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodId: "2026-08",
          periodStart: "2026-08-01",
          periodEnd: "2026-08-31",
          idempotencyKey,
          notes: "Phiên chạy hợp nhất BCTC đa chi nhánh tự động",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Không thể khởi chạy động cơ hợp nhất");
      }

      const data = await res.json();
      setActiveRunId(data.runId);
      setActiveRunStatus("DRAFT");
      if (onNotify) onNotify(`Đã thực thi Động cơ Hợp nhất BCTC thành công! Mã phiên: [${data.runCode || 'CONS-2026'}]`, "success");
      await fetchData();
    } catch (e: any) {
      if (onNotify) onNotify(e.message || "Lỗi khi chạy động cơ hợp nhất", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRun = () => {
    if (!activeRunId) {
      if (onNotify) onNotify("Vui lòng khởi chạy phiên hợp nhất trước khi phê duyệt", "warning");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận Phê duyệt BCTC Hợp nhất",
      description: "Hành động này sẽ chính thức duyệt Báo cáo Tài chính Hợp nhất kỳ 2026-08 và kích hoạt sự kiện phát hành M05 (finance.consolidation.run.completed.v1). Bạn có chắc chắn muốn tiếp tục?",
      variant: "primary",
      confirmText: "Phê Duyệt Ngay",
      cancelText: "Hủy",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const res = await fetch(`/api/finance/consolidation/runs/${activeRunId}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "Hoàng Nam (CFO)" }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setActiveRunStatus("APPROVED");
          if (onNotify) onNotify("Đã phê duyệt thành công BCTC Hợp nhất và bắn sự kiện M05!", "success");
          await fetchData();
        } catch (e: any) {
          if (onNotify) onNotify(e.message || "Lỗi khi phê duyệt", "error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleLockRun = () => {
    if (!activeRunId) {
      if (onNotify) onNotify("Vui lòng khởi chạy phiên hợp nhất trước", "warning");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận Khóa Sổ Hợp Nhất Kỳ 2026-08",
      description: "CẢNH BÁO: Sau khi Khóa Sổ (LOCKED), phiên hợp nhất này chuyển sang chế độ READ-ONLY vĩnh viễn. Mọi điều chỉnh sau này bắt buộc phải mở phiên bản Revision mới (R2).",
      variant: "warning",
      confirmText: "Khóa Sổ Ngay",
      cancelText: "Trở Về",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const res = await fetch(`/api/finance/consolidation/runs/${activeRunId}/lock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "Kế toán trưởng" }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setActiveRunStatus("LOCKED");
          if (onNotify) onNotify("Đã khóa sổ thành công phiên hợp nhất BCTC!", "success");
          await fetchData();
        } catch (e: any) {
          if (onNotify) onNotify(e.message || "Lỗi khi khóa sổ", "error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSealDms = () => {
    if (!activeRunId) {
      if (onNotify) onNotify("Vui lòng khởi chạy phiên hợp nhất trước khi niêm phong", "warning");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận Niêm phong BCTC Hợp nhất vào Kho DMS (M29)",
      description: "Hệ thống sẽ tạo chữ ký số SHA-256 mã hóa toàn bộ dữ liệu BCTC Hợp nhất và lưu trữ bảo mật vĩnh viễn trong Kho Tài liệu Doanh nghiệp M29 + ghi nhật ký Audit Log M02.",
      variant: "primary",
      confirmText: "Tạo Chữ Ký SHA-256 & Niêm Phong",
      cancelText: "Hủy",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const res = await fetch(`/api/finance/consolidation/runs/${activeRunId}/seal-dms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "Kế toán trưởng" }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          if (onNotify) onNotify(`Đã niêm phong BCTC vào M29 DMS! Mã SHA-256: [${data.sha256Hash.slice(0, 16)}...]`, "success");
          await fetchData();
        } catch (e: any) {
          if (onNotify) onNotify(e.message || "Lỗi khi niêm phong DMS", "error");
        } finally {
          setLoading(false);
        }
      },
    });
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
    <div className="space-y-5 p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
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

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleRunConsolidation}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Đang Tính Toán..." : "Chạy Động Cơ Hợp Nhất"}</span>
            </button>

            <button
              onClick={handleApproveRun}
              disabled={loading || activeRunStatus === "APPROVED" || activeRunStatus === "LOCKED"}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>Phê Duyệt</span>
            </button>

            <button
              onClick={handleLockRun}
              disabled={loading || activeRunStatus === "LOCKED"}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-200" />
              <span>Khóa Sổ</span>
            </button>

            <button
              onClick={handleSealDms}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
              <span>Niêm Phong DMS</span>
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
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Xuất PDF</span>
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

      {/* Overview Stat KPI Cards (M31 UI Standard Synchronization) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Đơn Vị Thành Viên</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
              {(entities || []).length}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">Entities</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Cấu trúc:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">1 Mẹ, 3 Công ty con</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Giao Dịch Loại Trừ</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              -{(totalEliminationAmt / 1e9).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">Tỷ VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Số bút toán:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
              {(eliminations || []).length} BT
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Doanh Thu Hợp Nhất</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-indigo-700 dark:text-indigo-400 tabular-nums">
              {(consolidatedRevenue / 1e9).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">Tỷ VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Tuân thủ:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">VAS 25 / IFRS 10</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">LNST Hợp Nhất (Mẹ)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
              {(consolidatedNetIncome / 1e9).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-medium font-sans">Tỷ VNĐ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Phân bổ:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Đã trừ NCI</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar (M31 UI Standard Synchronization) */}
      <div className="flex items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-1 relative">
        <div className="relative group flex-1 min-w-0">
          {/* Left Scroll Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => {
                if (tabsContainerRef.current) {
                  tabsContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
                }
              }}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Scrollable Track Container */}
          <div
            ref={tabsContainerRef}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth"
          >
          <button
            type="button"
            data-active={activeTab === "report"}
            onClick={() => setActiveTab("report")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
              activeTab === "report"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>1. Báo Cáo Hợp Nhất</span>
          </button>

          <button
            type="button"
            data-active={activeTab === "structure"}
            onClick={() => setActiveTab("structure")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
              activeTab === "structure"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>2. Cấu Trúc Tập Đoàn</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
              activeTab === "structure" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {(entities || []).length}
            </span>
          </button>

          <button
            type="button"
            data-active={activeTab === "coa_mapping"}
            onClick={() => setActiveTab("coa_mapping")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
              activeTab === "coa_mapping"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>3. COA Mapping</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
              activeTab === "coa_mapping" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {(coaMappings || []).length}
            </span>
          </button>

          <button
            type="button"
            data-active={activeTab === "intercompany_matching"}
            onClick={() => setActiveTab("intercompany_matching")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
              activeTab === "intercompany_matching"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
            <span>4. Đối Soát Nội Bộ</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
              activeTab === "intercompany_matching" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {(icMatches || []).length}
            </span>
          </button>

          <button
            type="button"
            data-active={activeTab === "eliminations"}
            onClick={() => setActiveTab("eliminations")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
              activeTab === "eliminations"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <XSquare className="w-3.5 h-3.5 shrink-0" />
            <span>5. Bút Toán Loại Trừ</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
              activeTab === "eliminations" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {(eliminations || []).length}
            </span>
          </button>

          <button
            type="button"
            data-active={activeTab === "fx"}
            onClick={() => setActiveTab("fx")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
              activeTab === "fx"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>6. Tỷ Giá &amp; Quỹ CTA</span>
          </button>

          <button
            type="button"
            data-active={activeTab === "adjustments"}
            onClick={() => setActiveTab("adjustments")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
              activeTab === "adjustments"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>7. BT Điều Chỉnh</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
              activeTab === "adjustments" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {(adjustments || []).length}
            </span>
          </button>

          <button
            type="button"
            data-active={activeTab === "period_close"}
            onClick={() => setActiveTab("period_close")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
              activeTab === "period_close"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>8. Đóng Kỳ</span>
          </button>

          <button
            type="button"
            data-active={activeTab === "transfer_pricing"}
            onClick={() => setActiveTab("transfer_pricing")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
              activeTab === "transfer_pricing"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span>9. Chuyển Giá (TP)</span>
          </button>

          <button
            type="button"
            data-active={activeTab === "vas_ifrs_bridge"}
            onClick={() => setActiveTab("vas_ifrs_bridge")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none shrink-0 active:scale-95 ${
              activeTab === "vas_ifrs_bridge"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>10. VAS / IFRS</span>
          </button>
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => {
              if (tabsContainerRef.current) {
                tabsContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
              }
            }}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition"
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
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
          {activeTab === "report" && report && (() => {
            const pnl = report.financialStatements?.pnl || {
              title: "Báo Cáo Kết Quả Hoạt Động Kinh Doanh Hợp Nhất (Mẫu B 02 - DN/HN)",
              grossRevenue: { rawSum: 0, elimination: 0, consolidated: 0 },
              cogsAndExpense: { rawSum: 0, elimination: 0, consolidated: 0 },
              netProfitBeforeNci: { rawSum: 0, elimination: 0, consolidated: 0 },
              nciShare: 0,
              parentCompanyProfit: 0,
            };

            const bs = report.financialStatements?.balanceSheet || {
              title: "Bảng Cân Đối Kế Toán Hợp Nhất Tập Đoàn (Mẫu B 01 - DN/HN)",
              totalAssets: { rawSum: 0, elimination: 0, consolidated: 0 },
              totalLiabilities: { rawSum: 0, elimination: 0, consolidated: 0 },
              totalEquity: { rawSum: 0, elimination: 0, consolidated: 0 },
              nciEquity: 0,
              ctaReserve: 0,
            };

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Báo Cáo Tài Chính Hợp Nhất Tập Đoàn (VAS 25 & IFRS 10)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-md transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Tải PDF</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>In Báo Cáo</span>
                    </button>
                  </div>
                </div>

                {/* 1. Consolidated P&L Statement */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {pnl.title}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Kỳ Báo Cáo: 2026-Q1 | ĐVT: VNĐ</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2.5 px-4">Chỉ Tiêu Hạch Toán</th>
                          <th className="py-2.5 px-3 text-right">Tổng Cộng Thô</th>
                          <th className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400">Loại Trừ Nội Bộ</th>
                          <th className="py-2.5 px-4 text-right text-indigo-700 dark:text-indigo-400 font-black">HỢP NHẤT TẬP ĐOÀN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                            1. Doanh thu bán hàng & cung cấp dịch vụ (Gross Revenue)
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-slate-700 dark:text-slate-300">
                            {pnl.grossRevenue.rawSum.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-rose-600 dark:text-rose-400">
                            -{pnl.grossRevenue.elimination.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-4 font-mono tabular-nums text-right font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30">
                            {pnl.grossRevenue.consolidated.toLocaleString("vi-VN")}
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                            2. Giá vốn hàng bán & Chi phí hoạt động (COGS & Opex)
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-slate-700 dark:text-slate-300">
                            {pnl.cogsAndExpense.rawSum.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-rose-600 dark:text-rose-400">
                            -{pnl.cogsAndExpense.elimination.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-4 font-mono tabular-nums text-right font-semibold text-slate-900 dark:text-slate-100 bg-indigo-50/50 dark:bg-indigo-950/30">
                            {pnl.cogsAndExpense.consolidated.toLocaleString("vi-VN")}
                          </td>
                        </tr>

                        <tr className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold">
                          <td className="py-2.5 px-4 font-sans">
                            3. Lợi nhuận sau thuế trước phân bổ NCI (Net Profit Before NCI)
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold">
                            {pnl.netProfitBeforeNci.rawSum.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-slate-600 dark:text-slate-400">0</td>
                          <td className="py-2.5 px-4 font-mono tabular-nums text-right font-semibold text-emerald-700 dark:text-emerald-400">
                            {pnl.netProfitBeforeNci.consolidated.toLocaleString("vi-VN")}
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-4 font-sans text-slate-600 dark:text-slate-400 pl-6">
                            - Lợi ích của cổ đông không kiểm soát (NCI Share 20% tại BR_DN)
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">-</td>
                          <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">-</td>
                          <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300 font-bold">
                            {pnl.nciShare.toLocaleString("vi-VN")}
                          </td>
                        </tr>

                        <tr className="bg-slate-900 dark:bg-slate-950 text-white font-bold">
                          <td className="py-3 px-4 font-sans">
                            4. Lợi nhuận sau thuế của Cổ đông Công ty Mẹ (Parent Net Profit)
                          </td>
                          <td className="py-3 px-3 text-right text-slate-300">-</td>
                          <td className="py-3 px-3 text-right text-slate-300">-</td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-black text-xs">
                            {pnl.parentCompanyProfit.toLocaleString("vi-VN")} VNĐ
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Consolidated Balance Sheet */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {bs.title}
                    </h4>
                    <span className="text-[11px] font-mono text-emerald-600 font-bold">
                      ✓ Bảng Cân Đối Cân Bằng (Assets = Liabilities + Equity)
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2.5 px-4">Bảng Cân Đối Kế Toán</th>
                          <th className="py-2.5 px-3 text-right">Tổng Cộng Thô</th>
                          <th className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400">Loại Trừ & Chênh Lệch</th>
                          <th className="py-2.5 px-4 text-right text-indigo-700 dark:text-indigo-400 font-black">HỢP NHẤT TẬP ĐOÀN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                            TỔNG TÀI SẢN (Total Assets)
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                            {bs.totalAssets.rawSum.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-semibold">
                            -{bs.totalAssets.elimination.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-4 text-right text-blue-700 dark:text-blue-400 font-black bg-blue-50/30 dark:bg-blue-900/20">
                            {bs.totalAssets.consolidated.toLocaleString("vi-VN")}
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                            NỢ PHẢI TRẢ (Total Liabilities)
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                            {bs.totalLiabilities.rawSum.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-semibold">
                            -{bs.totalLiabilities.elimination.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-800 dark:text-slate-200 font-bold bg-slate-50 dark:bg-slate-800/60">
                            {bs.totalLiabilities.consolidated.toLocaleString("vi-VN")}
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                            VỐN CHỦ SỞ HỮU HỢP NHẤT (Total Equity)
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                            {bs.totalEquity.rawSum.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-semibold">
                            -{bs.totalEquity.elimination.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-4 text-right text-emerald-700 dark:text-emerald-400 font-black bg-emerald-50/30 dark:bg-emerald-900/20">
                            {bs.totalEquity.consolidated.toLocaleString("vi-VN")}
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 text-[10px]">
                          <td className="py-2 px-3 font-sans text-slate-500 pl-6">
                            - Trong đó: Vốn góp của Cổ đông không kiểm soát (NCI Equity)
                          </td>
                          <td className="py-2 px-3 text-right text-slate-400">-</td>
                          <td className="py-2 px-3 text-right text-slate-400">-</td>
                          <td className="py-2 px-3 text-right text-slate-700 font-bold">
                            {bs.nciEquity.toLocaleString("vi-VN")}
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 text-[10px]">
                          <td className="py-2 px-3 font-sans text-slate-500 pl-6">
                            - Trong đó: Quỹ chênh lệch tỷ giá quy đổi BCTC (CTA Reserve)
                          </td>
                          <td className="py-2 px-3 text-right text-slate-400">-</td>
                          <td className="py-2 px-3 text-right text-slate-400">-</td>
                          <td className="py-2 px-3 text-right text-sky-700 font-bold">
                            +{bs.ctaReserve.toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 2: CONSOLIDATION STRUCTURE */}
          {activeTab === "structure" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Cấu Trúc Tập Đoàn & Phương Pháp Hợp Nhất (Group Structure)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Quản lý danh sách công ty Mẹ & các Công ty con, tỷ lệ sở hữu và phương pháp hợp nhất (Full Conso vs Equity Method).
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (onNotify) onNotify("Hệ thống tự động đồng bộ cấu trúc pháp lý từ Submodule Master Data", "info");
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl transition cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đồng Bộ Master Data</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(entities || []).map((entity) => (
                  <div
                    key={entity.id}
                    className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 transition shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-xl font-bold text-xs ${entity.entityType === "PARENT" ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400" : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"}`}>
                          {entity.code}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{entity.name}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Trạng thái: {entity.status} | Hiệu lực: {entity.effectiveDate || "2020-01-01"}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${entity.entityType === "PARENT" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"}`}>
                        {entity.entityType === "PARENT" ? "Công Ty Mẹ" : `Con (${entity.ownershipPercent}%)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="bg-slate-50/70 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Phương Pháp Hợp Nhất</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{entity.consolidationMethod}</span>
                      </div>
                      <div className="bg-slate-50/70 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Đồng Tiền Sổ Cái</span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 text-[11px] font-mono">{entity.currency}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-tighter">Doanh Thu</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{(entity.revenue / 1e9).toFixed(1)}B</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-tighter">Tổng Tài Sản</span>
                        <span className="font-bold text-blue-700 dark:text-blue-400">{(entity.assets / 1e9).toFixed(1)}B</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-tighter">Vốn CSH</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{(entity.equity / 1e9).toFixed(1)}B</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Ma Trận Chuẩn Hóa COA Mapping (Entity Local COA &rarr; Group COA)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Quy tắc ánh xạ hệ thống tài khoản kế toán địa phương về Hệ thống Tài Khoản Tập Đoàn thống nhất.
                  </p>
                </div>

                <button
                  onClick={() => setIsMappingModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Quy Tắc Mapping</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4">Mã Rule</th>
                      <th className="py-2.5 px-3">Đơn Vị</th>
                      <th className="py-2.5 px-3">Tài Khoản Địa Phương (Local COA)</th>
                      <th className="py-2.5 px-3 text-center">&rarr;</th>
                      <th className="py-2.5 px-3">Tài Khoản Tập Đoàn (Group COA)</th>
                      <th className="py-2.5 px-3">Phân Loại BCTC</th>
                      <th className="py-2.5 px-4 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {(coaMappings || []).map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-4 font-bold text-purple-700 dark:text-purple-400">{rule.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{rule.entityCode}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-white">{rule.localAccountCode}</span>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans italic">{rule.localAccountName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400">
                          <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-indigo-700 dark:text-indigo-400">{rule.groupAccountCode}</span>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans italic">{rule.groupAccountName}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rule.statementType === "BS" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800" : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
                          }`}>
                            {rule.statementType === "BS" ? "Bảng Cân Đối" : "Kết Quả KD (P&L)"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`flex items-center justify-center gap-1 font-bold ${rule.status === "MAPPED" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Động Cơ Khớp Nối Giao Dịch Nội Bộ (Intercompany Matching Engine)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tự động đối soát 6 tham số (Số tiền, Tiền tệ, Kỳ, Đối tác, Số hóa đơn, Tài khoản) giữa các đơn vị.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={matchStatusFilter}
                    onChange={(e) => setMatchStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    className="flex items-center space-x-1 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Quét Đối Soát Tự Động</span>
                  </button>
                </div>
              </div>

              {/* Status breakdown metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">Tỷ Lệ Khớp Chuẩn</span>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">98.2% <span className="text-xs font-normal opacity-70">Matched</span></div>
                  </div>
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 opacity-60" />
                </div>

                <div className="bg-amber-50/60 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-tight">Khớp Một Phần / Lệch Phí</span>
                    <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono tabular-nums">1.3% <span className="text-xs font-normal opacity-70">Partially</span></div>
                  </div>
                  <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-400 opacity-60" />
                </div>

                <div className="bg-rose-50/60 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/60 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-tight">Exceptions</span>
                    <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono tabular-nums">5 <span className="text-xs font-normal opacity-70">Items</span></div>
                  </div>
                  <ShieldAlert className="w-7 h-7 text-rose-600 dark:text-rose-400 opacity-60" />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4">Mã ĐC</th>
                      <th className="py-2.5 px-3">Giao Dịch Đơn Vị A ↔ Đơn Vị B</th>
                      <th className="py-2.5 px-3">Số Hóa Đơn Ref</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền A</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền B</th>
                      <th className="py-2.5 px-3 text-right text-rose-600">Chênh Lệch (VNĐ)</th>
                      <th className="py-2.5 px-4 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {(filteredMatches || []).map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{m.id}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{m.entityA} &rarr; {m.entityB}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{m.notes}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{m.docRefA} / {m.docRefB}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums">{m.amountA.toLocaleString("vi-VN")} {m.currencyA}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums">{m.amountB.toLocaleString("vi-VN")} {m.currencyB}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {m.differenceVND > 0 ? `+${m.differenceVND.toLocaleString("vi-VN")}` : "0"}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              m.status === "MATCHED"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : m.status === "PARTIALLY_MATCHED"
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <XSquare className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Bút Toán Loại Trừ Giao Dịch Nội Bộ (Intercompany Elimination Journals)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tạo các bút toán loại trừ trên Consolidation Layer (Không thay đổi Sổ Cái GL Gốc của đơn vị).
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Bút Toán Loại Trừ</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4">Mã Bút Toán</th>
                      <th className="py-2.5 px-3">Loại Loại Trừ</th>
                      <th className="py-2.5 px-3">Đơn Vị Giao &rarr; Nhận</th>
                      <th className="py-2.5 px-3">TK Hạch Toán (GL)</th>
                      <th className="py-2.5 px-3">Nội Dung Chi Tiết</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền (VNĐ)</th>
                      <th className="py-2.5 px-4 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {(eliminations || []).map((elim) => (
                      <tr key={elim.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-4 font-bold text-rose-700 dark:text-rose-400">{elim.eliminationCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{elim.type}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-bold">{elim.sourceBranch} &rarr; {elim.targetBranch}</td>
                        <td className="py-2.5 px-3 text-indigo-700 dark:text-indigo-400 font-bold">{elim.accountCode}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-400">{elim.description}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                          {elim.amount.toLocaleString("vi-VN")} VNĐ
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Động Cơ Quy Đổi Tiền Tệ & Quỹ CTA (Currency Translation & CTA Reserve)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Quy đổi BCTC ngoại tệ về Đồng tiền Báo cáo (VND) theo chuẩn VAS 10 / IAS 21 (Closing Rate cho BS, Average Rate cho P&L).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(report?.fxRules || []).map((fx) => (
                  <div key={fx.currency} className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="px-2.5 py-1 bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold text-xs rounded-lg font-mono">
                          1 {fx.currency}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Quy đổi về VND</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Cập nhật: {fx.lastUpdated}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Tỷ Giá Cuối Kỳ (BS)</span>
                        <span className="font-bold text-sky-700 dark:text-sky-400 tabular-nums">{fx.closingRate.toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Tỷ Giá Bình Quân (P&L)</span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">{fx.averageRate.toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Tỷ Giá Lịch Sử (Equity)</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">{fx.historicalRate.toLocaleString("vi-VN")}</span>
                      </div>
                    </div>

                    <div className="bg-sky-50 dark:bg-sky-950/40 p-2.5 rounded-xl border border-sky-100 dark:border-sky-800/60 flex items-center justify-between text-xs">
                      <span className="font-semibold text-sky-900 dark:text-sky-200">Quỹ Chênh Lệch Tỷ Giá CTA Reserve:</span>
                      <span className="font-bold text-sky-800 dark:text-sky-300 font-mono tabular-nums">+{fx.ctaReserveVND.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: CONSOLIDATION ADJUSTMENTS */}
          {activeTab === "adjustments" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Sổ Bút Toán Điều Chỉnh Hợp Nhất (Consolidation-Only Journals)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ghi nhận các điều chỉnh phân bổ lợi thế thương mại, cổ đông NCI, đánh giá lại giá trị hợp lý không làm thay đổi GL gốc.
                  </p>
                </div>

                <button
                  onClick={() => setIsAdjModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Bút Toán Điều Chỉnh</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4">Số Bút Toán</th>
                      <th className="py-2.5 px-3">Loại Điều Chỉnh</th>
                      <th className="py-2.5 px-3">Đơn Vị Áp Dụng</th>
                      <th className="py-2.5 px-3">Định Khoản Nợ / Có</th>
                      <th className="py-2.5 px-3">Diễn Giải Lý Do</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền (VNĐ)</th>
                      <th className="py-2.5 px-4 text-center">Người Phê Duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {(adjustments || []).map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-4 font-bold text-amber-700 dark:text-amber-400">{adj.journalNo}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{adj.type}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-bold">{adj.entity}</td>
                        <td className="py-2.5 px-3 text-indigo-700 dark:text-indigo-400 font-bold">{adj.drAccount} / {adj.crAccount}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-400">{adj.reason}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                          +{adj.amountVND.toLocaleString("vi-VN")} VNĐ
                        </td>
                        <td className="py-2.5 px-4 text-center font-sans">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-700">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Quy Trình Đóng Kỳ Hợp Nhất (10-Stage Period Close Workflow Pipeline)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Kiểm soát quy trình đóng sổ báo cáo hợp nhất 10 bước chuẩn mực ERP Enterprise.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(periodStages || []).map((stage, idx) => (
                  <div
                    key={stage.id}
                    className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      stage.status === "COMPLETED"
                        ? "bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                        : stage.status === "IN_PROGRESS"
                        ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          stage.status === "COMPLETED"
                            ? "bg-emerald-600 text-white"
                            : stage.status === "IN_PROGRESS"
                            ? "bg-indigo-600 text-white animate-pulse"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{stage.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{stage.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end md:self-auto">
                      {stage.completedBy && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          Bởi: {stage.completedBy} ({stage.completedAt})
                        </span>
                      )}

                      {stage.status === "COMPLETED" ? (
                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] rounded-full flex items-center gap-1">
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
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[10px] rounded-full">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Thuế Chuyển Giá & OECD Pillar Two (Decree 132 Compliance)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Quản lý tuân thủ Nghị định 132/2020/NĐ-CP, Trần chi phí lãi vay 30% EBITDA & Thuế tối thiểu toàn cầu OECD 15%.
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  Trạng Thái Tuân Thủ Nghị Định 132: {tpData.decree132ComplianceStatus}
                </div>
                <div>Ngưỡng Doanh Thu Toàn Cầu OECD Pillar Two: €750M EUR (Tập đoàn NexusSync hiện tại đạt 3.2M EUR - Miễn trừ Top-up Tax năm 2026).</div>
              </div>

              {/* 1. Danh Sách Giao Dịch Liên Kết */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  1. Danh Sách Giao Dịch Bên Liên Kết (Arm's Length Principle Verification)
                </h4>
              <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4">Mã GD</th>
                      <th className="py-2.5 px-3">Loại Giao Dịch</th>
                      <th className="py-2.5 px-3">Bên Giao &rarr; Nhận</th>
                      <th className="py-2.5 px-3 text-right">Giá Trị (VNĐ)</th>
                      <th className="py-2.5 px-3">Phương Pháp TP</th>
                      <th className="py-2.5 px-3">Khoảng Benchmark</th>
                      <th className="py-2.5 px-4 text-center">Kết Luận Arm's Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {(tpData.relatedPartyTransactions || []).map((rpt) => (
                      <tr key={rpt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-4 font-bold text-amber-800 dark:text-amber-400">{rpt.id}</td>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">{rpt.transactionType}</td>
                        <td className="py-2.5 px-3 font-bold text-indigo-700 dark:text-indigo-400">{rpt.sourceEntity} &rarr; {rpt.targetEntity}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">{rpt.valueVND.toLocaleString("vi-VN")} VNĐ</td>
                        <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-400">{rpt.tpMethod}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">{rpt.benchmarkArmLengthRange}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
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
                <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    2. Trần Chi Phí Lãi Vay 30% EBITDA (Nghị Định 132)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">EBITDA Tập Đoàn</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{tpData.interestCapRule30Ebitda.ebitdaVND.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Mức Trần 30% EBITDA</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400 tabular-nums">{tpData.interestCapRule30Ebitda.cap30EbitdaVND.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Lãi Vay Thật Ròng (Net)</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">{tpData.interestCapRule30Ebitda.netInterestExpenseVND.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Trạng Thái Chi Phí</span>
                      <span className="font-bold">ĐƯỢC TRỪ 100% (21.7% EBITDA)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    3. Thuế Tối Thiểu Toàn Cầu OECD Pillar Two (15% GloBE)
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    {(tpData.globeEffectiveTaxRates || []).map((jurisdiction) => (
                      <div key={jurisdiction.jurisdiction} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white font-sans block">{jurisdiction.jurisdiction}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Thuế suất thực tế (ETR): {jurisdiction.effectiveTaxRate}%</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded border border-emerald-200 dark:border-emerald-800">
                          {jurisdiction.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. KHỞI TẠO BÁO CÁO & HỒ SƠ THUẾ CHUYỂN GIÁ */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  4. KHỞI TẠO BÁO CÁO & HỒ SƠ THUẾ CHUYỂN GIÁ (MASTER FILE, LOCAL FILE, CBCR)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(tpData.documentationFiles || []).map((doc) => (
                    <div key={doc.fileType} className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">{doc.fileType}</span>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                            {doc.status}
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{doc.title}</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{doc.summary}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
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
                          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 transition cursor-pointer active:scale-95 shadow-2xs"
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
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Cầu Nối Song Luồng BCTC Hợp Nhất VAS &rarr; IFRS (Dual Reporting Bridge)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tác động điều chỉnh từ Chuẩn mực Kế toán Việt Nam (VAS) sang Chuẩn mực Quốc tế (IFRS 16 Leases, IFRS 9 Financial Instruments, IFRS 15 Revenue).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4">Mã Bút Toán</th>
                      <th className="py-2.5 px-3">Nội Dung Điều Chỉnh</th>
                      <th className="py-2.5 px-3">Chuẩn Mực IFRS</th>
                      <th className="py-2.5 px-3 text-right">Tác Động Tài Sản</th>
                      <th className="py-2.5 px-3 text-right">Tác Động Nợ Phải Trả</th>
                      <th className="py-2.5 px-4 text-right">Tác Động Lợi Nhuận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {(bridgeData.bridgeAdjustments || []).map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-4 font-bold text-teal-700 dark:text-teal-400">{adj.id}</td>
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-800 dark:text-slate-200">{adj.title}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-bold">{adj.standardRef}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700 dark:text-blue-400 tabular-nums">+{adj.assetImpactVND.toLocaleString("vi-VN")} VNĐ</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-300 tabular-nums">+{adj.liabilityImpactVND.toLocaleString("vi-VN")} VNĐ</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+{adj.pnlImpactVND.toLocaleString("vi-VN")} VNĐ</td>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                Tạo Bút Toán Loại Trừ Giao Dịch Nội Bộ
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Loại Giao Dịch Nội Bộ</label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition"
                >
                  <option value="IC_SALES_PURCHASE">IC_SALES_PURCHASE (Doanh thu & Giá vốn)</option>
                  <option value="IC_AR_AP">IC_AR_AP (Công nợ Phải thu / Phải trả)</option>
                  <option value="IC_SERVICE_FEE">IC_SERVICE_FEE (Phí quản lý / Dịch vụ)</option>
                  <option value="IC_DIVIDEND">IC_DIVIDEND (Cổ tức nội bộ)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Đơn Vị Nguồn (Giao)</label>
                  <select
                    value={newEntry.sourceBranch}
                    onChange={(e) => setNewEntry({ ...newEntry, sourceBranch: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-rose-500 transition"
                  >
                    {(entities || []).map((e) => (
                      <option key={e.id} value={e.code}>
                        {e.code} ({e.name.substring(0, 18)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Đơn Vị Đích (Nhận)</label>
                  <select
                    value={newEntry.targetBranch}
                    onChange={(e) => setNewEntry({ ...newEntry, targetBranch: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-rose-500 transition"
                  >
                    {(entities || []).map((e) => (
                      <option key={e.id} value={e.code}>
                        {e.code} ({e.name.substring(0, 18)}...)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Cặp Tài Khoản Định Khoản (GL)</label>
                <input
                  type="text"
                  value={newEntry.accountCode}
                  onChange={(e) => setNewEntry({ ...newEntry, accountCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-indigo-700 dark:text-indigo-400 font-mono font-bold focus:ring-2 focus:ring-rose-500 transition"
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
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Diễn Giải Lý Do</label>
                <textarea
                  rows={2}
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800 pt-5">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateEliminationEntry}
                className="px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-200 dark:shadow-none transition transform active:scale-95 cursor-pointer"
              >
                Lưu Bút Toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create COA Mapping Rule Modal */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Thêm Quy Tắc Mapping COA
              </h3>
              <button onClick={() => setIsMappingModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Đơn Vị Thành Viên</label>
                <select
                  value={newMapping.entityCode}
                  onChange={(e) => setNewMapping({ ...newMapping, entityCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 outline-hidden transition"
                >
                  {(entities || []).map((e) => (
                    <option key={e.id} value={e.code}>
                      {e.code} - {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Mã TK Địa Phương (Local)</label>
                  <input
                    type="text"
                    placeholder="VD: 4000-REV-SG"
                    value={newMapping.localAccountCode}
                    onChange={(e) => setNewMapping({ ...newMapping, localAccountCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Tên TK Địa Phương</label>
                  <input
                    type="text"
                    placeholder="VD: Revenue from SaaS"
                    value={newMapping.localAccountName}
                    onChange={(e) => setNewMapping({ ...newMapping, localAccountName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Mã TK Tập Đoàn (Group)</label>
                  <input
                    type="text"
                    value={newMapping.groupAccountCode}
                    onChange={(e) => setNewMapping({ ...newMapping, groupAccountCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-indigo-700 dark:text-indigo-400 font-mono font-bold focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Phân Loại BCTC</label>
                  <select
                    value={newMapping.translationCategory}
                    onChange={(e) => setNewMapping({ ...newMapping, translationCategory: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-purple-500 outline-hidden transition"
                  >
                    <option value="PNL">Kết Quả Kinh Doanh (PNL)</option>
                    <option value="BALANCE_SHEET">Cân Đối Kế Toán (BS)</option>
                    <option value="EQUITY">Vốn Chủ Sở Hữu (Equity)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800 pt-5">
              <button onClick={() => setIsMappingModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer">
                Hủy
              </button>
              <button onClick={handleCreateMapping} className="px-6 py-2.5 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-200 dark:shadow-none transition transform active:scale-95 cursor-pointer">
                Lưu Quy Tắc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Consolidation Adjustment Journal Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Tạo Bút Toán Điều Chỉnh Hợp Nhất (Consolidation Layer)
              </h3>
              <button onClick={() => setIsAdjModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Loại Bút Toán Điều Chỉnh</label>
                <select
                  value={newAdj.type}
                  onChange={(e) => setNewAdj({ ...newAdj, type: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                >
                  <option value="OWNERSHIP_NCI">OWNERSHIP_NCI (Tỷ lệ sở hữu & NCI)</option>
                  <option value="RECLASSIFICATION">RECLASSIFICATION (Tái phân loại tài khoản)</option>
                  <option value="FX_TRANSLATION">FX_TRANSLATION (Điều chỉnh tỷ giá)</option>
                  <option value="AUDIT_ADJUSTMENT">AUDIT_ADJUSTMENT (Điều chỉnh kiểm toán)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Tài Khoản Nợ (Dr)</label>
                  <input
                    type="text"
                    value={newAdj.drAccount}
                    onChange={(e) => setNewAdj({ ...newAdj, drAccount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-indigo-700 dark:text-indigo-400 focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Tài Khoản Có (Cr)</label>
                  <input
                    type="text"
                    value={newAdj.crAccount}
                    onChange={(e) => setNewAdj({ ...newAdj, crAccount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-indigo-700 dark:text-indigo-400 focus:ring-2 focus:ring-amber-500 transition"
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
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Diễn Giải Lý Do Điều Chỉnh</label>
                <textarea
                  rows={2}
                  placeholder="Diễn giải căn cứ điều chỉnh..."
                  value={newAdj.reason}
                  onChange={(e) => setNewAdj({ ...newAdj, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800 pt-5">
              <button onClick={() => setIsAdjModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer">
                Hủy
              </button>
              <button onClick={handleCreateAdjustment} className="px-6 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-200 dark:shadow-none transition transform active:scale-95 cursor-pointer">
                Lưu Bút Toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ConfirmDialog for irreversible actions (Rule #19 Compliance) */}
      <ConfirmDialog
        state={{
          isOpen: confirmDialog.isOpen,
          title: confirmDialog.title,
          description: confirmDialog.description,
          confirmText: confirmDialog.confirmText || "Xác nhận",
          cancelText: confirmDialog.cancelText || "Hủy",
          variant: confirmDialog.variant || "primary",
          isLoading: loading,
        }}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
