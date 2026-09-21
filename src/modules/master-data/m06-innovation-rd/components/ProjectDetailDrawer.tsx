import React from 'react';
import {
  X,
  Layers,
  FlaskConical,
  PackageOpen,
  Tag,
  FileCheck,
  Sparkles,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Lock,
  ArrowRight,
  Cpu,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ProjectDetailDrawerProps {
  isOpen: boolean;
  project: any;
  onClose: () => void;
  onOpenRequisition: (project: any) => void;
  onOpenRegisterSku: (project: any) => void;
  onOpenHandover: (project: any) => void;
  onOpenAiAdvisor: (project: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const ProjectDetailDrawer: React.FC<ProjectDetailDrawerProps> = ({
  isOpen,
  project,
  onClose,
  onOpenRequisition,
  onOpenRegisterSku,
  onOpenHandover,
  onOpenAiAdvisor,
  onNotify,
}) => {
  if (!isOpen || !project) return null;

  const stageLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Ý Tưởng (Draft)', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    TRIAL: { label: 'Thử Nghiệm Lab', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    SAMPLE_EVALUATION: { label: 'Đánh Giá Mẫu', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    APPROVED: { label: 'Đã Phê Duyệt', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    HANDED_OVER: { label: 'Đã Bàn Giao (Khóa)', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
    REJECTED: { label: 'Từ Chối', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  };

  const currentStage = stageLabels[project.stage || project.status] || {
    label: project.stage || project.status || 'DRAFT',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  const gates = [
    { num: 1, name: 'Khởi Tạo Ý Tưởng', desc: 'Đề cương & Ngân sách ban đầu' },
    { num: 2, name: 'Thử Nghiệm Lab', desc: 'Xây dựng công thức & Xuất vật tư M17' },
    { num: 3, name: 'Đánh Giá Mẫu Thử', desc: 'Kiểm định chất lượng phòng Lab M39' },
    { num: 4, name: 'Tuân Thủ Sinh Thái', desc: 'Chứng nhận RoHS, REACH, ESG' },
    { num: 5, name: 'Bàn Giao Sản Xuất', desc: 'Đăng ký SKU M07 & Chuyển giao BOM M25' },
  ];

  const getGateStatus = (gateNum: number) => {
    if (project.isLocked || project.stage === 'HANDED_OVER') return 'COMPLETED';
    if (gateNum === 1) return 'COMPLETED';
    if (gateNum === 2 && ['TRIAL', 'SAMPLE_EVALUATION', 'APPROVED'].includes(project.stage)) return 'COMPLETED';
    if (gateNum === 3 && ['SAMPLE_EVALUATION', 'APPROVED'].includes(project.stage)) return 'COMPLETED';
    if (gateNum === 4 && project.stage === 'APPROVED') return 'COMPLETED';
    if (gateNum === 5 && project.stage === 'APPROVED') return 'CURRENT';
    if (gateNum === 2 && project.stage === 'DRAFT') return 'CURRENT';
    if (gateNum === 3 && project.stage === 'TRIAL') return 'CURRENT';
    return 'UPCOMING';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0 mt-0.5">
              <FlaskConical className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  {project.projectCode || `RD-${project.id}`}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${currentStage.color}`}>
                  {currentStage.label}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                  TRL {project.trlLevel || 3}
                </span>
                {project.isLocked && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Đã Khóa Bất Biến</span>
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                {project.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lĩnh vực: <span className="font-semibold text-slate-700 dark:text-slate-300">{project.category || 'Công nghệ cao'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ngân Sách Được Duyệt</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {(Number(project.budget) || 0).toLocaleString('vi-VN')} ₫
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tiến Độ Dự Án</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {project.progress || 0}%
                </span>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Chủ Nhiệm Đề Tài</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate block">
                {project.lead || 'Chưa phân công'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Thời Hạn Hoàn Thành</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs block">
                {project.deadline || '2026-12-31'}
              </span>
            </div>
          </div>

          {/* 5-Gate Stage-Gate Pipeline */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2.5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Tiến Trình 5 Cổng Kiểm Soát (Stage-Gate Pipeline)</span>
            </h4>
            <div className="space-y-2">
              {gates.map((g) => {
                const status = getGateStatus(g.num);
                return (
                  <div
                    key={g.num}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                      status === 'COMPLETED'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : status === 'CURRENT'
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                          status === 'COMPLETED'
                            ? 'bg-emerald-600 text-white'
                            : status === 'CURRENT'
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {status === 'COMPLETED' ? '✓' : g.num}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          Gate {g.num}: {g.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {g.desc}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : status === 'CURRENT'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {status === 'COMPLETED' ? 'HOÀN THÀNH' : status === 'CURRENT' ? 'ĐANG THỰC HIỆN' : 'CHƯA ĐẾN'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cross-module Authority Linkages */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Liên Kết Thẩm Quyền Đơn Nhất Toàn Doanh Nghiệp (SSOT)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-500">M17 Xuất kho vật tư Lab:</span>
                <span className="font-bold text-blue-600 font-mono">InventoryService</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-500">M07 Item Master SKU:</span>
                <span className="font-bold text-emerald-600 font-mono">RD_PROJECT</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-500">M25 MES Production BOM:</span>
                <span className="font-bold text-purple-600 font-mono">Handover Gate 5</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-500">M29 DMS Hồ sơ mật mã:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">SHA-256 Vault</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Toolbar embedded at bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRequisition(project);
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-semibold flex items-center gap-1 border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <PackageOpen className="w-3.5 h-3.5" />
              <span>Xuất Vật Tư (M17)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegisterSku(project);
              }}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Đăng Ký SKU (M07)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHandover(project);
              }}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg font-semibold flex items-center gap-1 border border-purple-200 dark:border-purple-800 transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Nghiệm Thu Gate 5</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAiAdvisor(project);
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-2xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tư Vấn AI</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-semibold text-xs transition-colors ml-auto"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
