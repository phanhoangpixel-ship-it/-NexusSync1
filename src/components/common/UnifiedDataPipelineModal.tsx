import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Database,
  Layers,
  ShoppingBag,
  PackageCheck,
  Factory,
  Receipt,
  RotateCcw,
  Calculator,
  QrCode,
  Users,
  FileSpreadsheet,
  Sparkles,
  TrendingUp,
  Activity,
  ShieldCheck,
} from "lucide-react";

interface PipelineStep {
  stepId: number;
  stepCode: string;
  module: string;
  title: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  recordReference: string;
  details: string;
  timestamp: string;
}

interface PipelineSummary {
  executionId: string;
  startedAt: string;
  completedAt: string;
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  totalSteps: number;
  successSteps: number;
  correlationId: string;
  steps: PipelineStep[];
  impactSummary: {
    procurementAmount: number;
    salesAmount: number;
    inputVat: number;
    outputVat: number;
    netVatPayable: number;
    glEntriesCreated: number;
    inventoryAdjustedUnits: number;
  };
}

interface UnifiedDataPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedDataPipelineModal: React.FC<UnifiedDataPipelineModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/unified-pipeline/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: PipelineSummary = await res.json();
      setSummary(data);
    } catch (err: any) {
      console.error("Failed to run pipeline:", err);
      setErrorMsg(err?.message || "Lỗi kết nối khi chạy luồng dữ liệu.");
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (moduleName: string) => {
    switch (moduleName) {
      case "CRM & SRM Master Data": return <Database className="w-4 h-4 text-blue-400" />;
      case "Procurement & AP": return <ShoppingBag className="w-4 h-4 text-amber-400" />;
      case "Warehouse & Inventory": return <PackageCheck className="w-4 h-4 text-emerald-400" />;
      case "Manufacturing (MES)": return <Factory className="w-4 h-4 text-purple-400" />;
      case "Sales & AR": return <Receipt className="w-4 h-4 text-cyan-400" />;
      case "Returns & RMA": return <RotateCcw className="w-4 h-4 text-rose-400" />;
      case "Central Tax Authority": return <Calculator className="w-4 h-4 text-indigo-400" />;
      case "Payments & Treasury": return <QrCode className="w-4 h-4 text-emerald-400" />;
      case "HR & Payroll": return <Users className="w-4 h-4 text-orange-400" />;
      case "General Ledger & Audit": return <FileSpreadsheet className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-8 cursor-default select-text"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                LUỒNG DỮ LIỆU THỐNG NHẤT TOÀN BỘ MODULE
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-semibold uppercase">
                  NexusSync Enterprise
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kích hoạt chu trình dữ liệu khép kín xuyên suốt 10 phân hệ nghiệp vụ ERP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto custom-scrollbar">
          
          {/* Architecture Map Header */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Sơ Đồ Chu Trình Dữ Liệu Liên Kết (End-to-End Enterprise Flow)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { label: "1. Master Data", desc: "KH & NCC", bg: "bg-blue-950/40 border-blue-800/40 text-blue-300" },
                { label: "2. P2P Purchase", desc: "PO → GR → AP", bg: "bg-amber-950/40 border-amber-800/40 text-amber-300" },
                { label: "3. WMS Inventory", desc: "Sổ Kho & Giá Vốn", bg: "bg-emerald-950/40 border-emerald-800/40 text-emerald-300" },
                { label: "4. MES Production", desc: "BOM → MO → QC", bg: "bg-purple-950/40 border-purple-800/40 text-purple-300" },
                { label: "5. O2C Sales", desc: "SO → DN → AR", bg: "bg-cyan-950/40 border-cyan-800/40 text-cyan-300" },
                { label: "6. RMA Returns", desc: "Credit Note AR", bg: "bg-rose-950/40 border-rose-800/40 text-rose-300" },
                { label: "7. Tax Engine", desc: "VAT Position CQT", bg: "bg-indigo-950/40 border-indigo-800/40 text-indigo-300" },
                { label: "8. Treasury", desc: "VietQR Settlement", bg: "bg-teal-950/40 border-teal-800/40 text-teal-300" },
                { label: "9. HR Payroll", desc: "Chi phí Lương 642", bg: "bg-orange-950/40 border-orange-800/40 text-orange-300" },
                { label: "10. Single Writer GL", desc: "Audit Correlation ID", bg: "bg-blue-900/40 border-blue-700/40 text-blue-200" },
              ].map((item, idx) => (
                <div key={idx} className={`border rounded-lg p-2.5 ${item.bg}`}>
                  <div className="font-semibold text-[11px] truncate">{item.label}</div>
                  <div className="text-[10px] opacity-80 mt-0.5 truncate">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-800 via-indigo-950/50 to-slate-800 border border-indigo-500/30 rounded-xl shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h5 className="font-semibold text-white text-sm">
                  Thực Thi Luồng Giao Dịch Thống Nhất Trực Tiếp
                </h5>
                <p className="text-xs text-slate-400 mt-0.5">
                  Khởi tạo chứng từ thực tế, ghi sổ cái GL đôi và tính toán nghĩa vụ Thuế GTGT liên kết
                </p>
              </div>
            </div>
            <button
              onClick={handleRunPipeline}
              disabled={isRunning}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang thực thi 10 Phân Hệ...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Kích Hoạt Luồng Thống Nhất (Run Enterprise Flow)</span>
                </>
              )}
            </button>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Execution Summary Stats */}
          {summary && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Trạng Thái Thực Thi</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">
                      {summary.status === "COMPLETED" ? "THÀNH CÔNG 100%" : summary.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    ID: {summary.executionId}
                  </span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Doanh Thu Sales O2C</span>
                  <div className="mt-1.5 text-sm font-bold text-cyan-300 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    {summary.impactSummary.salesAmount.toLocaleString()} VNĐ
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Thuế GTGT Đầu ra (TK 3331): {summary.impactSummary.outputVat.toLocaleString()} VNĐ
                  </span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Mua Hàng P2P</span>
                  <div className="mt-1.5 text-sm font-bold text-amber-300">
                    {summary.impactSummary.procurementAmount.toLocaleString()} VNĐ
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Thuế GTGT Đầu vào (TK 1331): {summary.impactSummary.inputVat.toLocaleString()} VNĐ
                  </span>
                </div>

                <div className="bg-slate-800/80 border border-indigo-500/40 bg-indigo-950/20 p-3.5 rounded-xl">
                  <span className="text-[11px] font-medium text-indigo-300 uppercase tracking-wider block">Thuế GTGT Ròng Phải Nộp</span>
                  <div className="mt-1.5 text-sm font-bold text-indigo-200">
                    {summary.impactSummary.netVatPayable.toLocaleString()} VNĐ
                  </div>
                  <span className="text-[10px] text-indigo-300/80 mt-1 block">
                    Central Tax Authority Determination
                  </span>
                </div>
              </div>

              {/* Trace Audit ID Banner */}
              <div className="px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Mã Liên Kết Vết Kiểm Toán (Trace Correlation ID):</span>
                  <code className="px-2 py-0.5 bg-slate-900 text-blue-300 font-mono rounded border border-slate-700">
                    {summary.correlationId}
                  </code>
                </div>
                <div className="text-slate-400">
                  Đã phát sinh <strong className="text-white">{summary.impactSummary.glEntriesCreated}</strong> bút toán GL đôi
                </div>
              </div>

              {/* Step Timeline */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Nhật Ký Chi Tiết 10 Bước Luồng Dữ Liệu
                </h5>

                <div className="space-y-2">
                  {summary.steps.map((step) => (
                    <div
                      key={step.stepId}
                      className="p-3 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 rounded-xl transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-900 rounded-lg border border-slate-700/80 shrink-0 mt-0.5">
                          {getStepIcon(step.module)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{step.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                              {step.module}
                            </span>
                          </div>
                          <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                            {step.details}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700/50">
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                          {step.recordReference}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {step.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Initial Instructions if not executed yet */}
          {!summary && !isRunning && (
            <div className="p-8 text-center bg-slate-800/30 border border-dashed border-slate-700 rounded-xl space-y-3">
              <Layers className="w-10 h-10 text-indigo-400/80 mx-auto animate-pulse" />
              <h5 className="text-sm font-semibold text-slate-200">
                Sẵn Sàng Khởi Động Chu Trình Dữ Liệu Doanh Nghiệp Khép Kín
              </h5>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Nhấn nút <strong className="text-indigo-300">"Kích Hoạt Luồng Thống Nhất"</strong> ở trên để thực thi tự động toàn bộ luồng nghiệp vụ từ Mua hàng (P2P), Nhập kho (WMS), Sản xuất (MES), Bán hàng (O2C), Đổi trả (RMA), Thuế (Tax Authority) tới Sổ cái Kế toán (GL).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/90 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <span>NexusSync ERP — Unified Architecture Engine v2026.2</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
