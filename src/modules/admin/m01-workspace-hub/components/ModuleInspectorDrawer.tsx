import React from 'react';
import * as Icons from 'lucide-react';
import { ModuleDefinition } from '../../../../config/moduleRegistry';
import { ProcessNode } from './ProcessFlowMap';

interface ModuleInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: ProcessNode | null;
  moduleDef?: ModuleDefinition;
  healthData?: {
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'NO_DATA';
    score: number | null;
    errorCount: number;
    totalActions?: number;
  };
  onNavigateToModule: (moduleDef?: ModuleDefinition, route?: string) => void;
}

export const ModuleInspectorDrawer: React.FC<ModuleInspectorDrawerProps> = ({
  isOpen,
  onClose,
  node,
  moduleDef,
  healthData,
  onNavigateToModule,
}) => {
  if (!isOpen || !node) return null;

  // Single-Writer Domain Authority Determination
  let authorityRole = 'Phân hệ nghiệp vụ luồng chuẩn';
  let authorityDescription = 'Đọc và ghi nhận dữ liệu theo ranh giới nghiệp vụ của phân hệ.';
  let isSingleWriter = false;

  if (node.id === 'M17') {
    authorityRole = 'Chủ Quản Đơn Nhất: TỒN KHO & KHO VẬN (Inventory Single Writer)';
    authorityDescription = 'InventoryService.postTransaction() là nơi DUY NHẤT được phép thay đổi stock_balances và stock_ledger. Mọi module khác bắt buộc phải gọi qua M17.';
    isSingleWriter = true;
  } else if (node.id === 'M30') {
    authorityRole = 'Chủ Quản Đơn Nhất: SỔ CÁI KẾ TOÁN (General Ledger Single Writer)';
    authorityDescription = 'AccountingService / GL Engine là nơi DUY NHẤT được phép tạo bút toán Nợ/Có vào accounting_entries. Không module nào được tự chèn bút toán song song.';
    isSingleWriter = true;
  } else if (node.id === 'M41') {
    authorityRole = 'Chủ Quản Đơn Nhất: CHÍNH SÁCH GIÁ (Pricing Single Writer)';
    authorityDescription = 'PricingEngine là nơi DUY NHẤT giải quyết giá bán, bảng giá và chiết khấu bậc thang. Không hard-code giá thủ công ngoài snapshot của M41.';
    isSingleWriter = true;
  } else if (node.id === 'M42') {
    authorityRole = 'Chủ Quản Đơn Nhất: GIÁ VỐN & PHÂN BỔ COGS (Costing Single Writer)';
    authorityDescription = 'CostingService / Landed Cost Engine là nơi DUY NHẤT tính toán và phân bổ chi phí giá vốn cost_layers.';
    isSingleWriter = true;
  }

  const score = healthData?.score;
  const isHealthy = !healthData || healthData.status === 'HEALTHY';
  const isDegraded = healthData?.status === 'DEGRADED';
  const isCritical = healthData?.status === 'CRITICAL';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-mono font-bold text-sm">
              {node.id}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {node.group}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {moduleDef?.moduleName || node.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs text-slate-600 dark:text-slate-300">
          {/* Health & Availability Score */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Chỉ số khả dụng hôm nay:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isCritical
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : isDegraded
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {score !== null && score !== undefined ? `${score}% — ${healthData?.status}` : '100% — HEALTHY'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">Lỗi phát sinh:</span>
                <strong className={healthData?.errorCount ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                  {healthData?.errorCount ?? 0} lỗi
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-sans block">Thao tác Audit/Event:</span>
                <strong className="text-slate-900 dark:text-white tabular-nums">
                  {healthData?.totalActions ?? 'Đang hoạt động'}
                </strong>
              </div>
            </div>
          </div>

          {/* Single Writer Authority Highlight */}
          <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
            isSingleWriter
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              <Icons.ShieldAlert className={`w-4 h-4 shrink-0 ${isSingleWriter ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
              <strong className="font-bold text-xs">{authorityRole}</strong>
            </div>
            <p className="text-[11px] leading-relaxed">
              {authorityDescription}
            </p>
          </div>

          {/* Module description */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              Mô tả phân hệ &amp; Phạm vi nghiệp vụ
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
              {moduleDef?.description || 'Phân hệ cốt lõi trong hệ thống NexusSync ERP.'}
            </p>
          </div>

          {/* Technical Specs */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              Thông số kỹ thuật &amp; Điểm cuối (Endpoints)
            </h4>
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 font-mono text-[11px] space-y-1.5">
              <div>
                <span className="text-slate-400">Route: </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{node.route || moduleDef?.route}</span>
              </div>
              <div>
                <span className="text-slate-400">Read Endpoint: </span>
                <span className="text-slate-800 dark:text-slate-200">{moduleDef?.readEndpoint || '/api/workspace/summary'}</span>
              </div>
              <div>
                <span className="text-slate-400">Workspace ID: </span>
                <span className="text-slate-800 dark:text-slate-200">{moduleDef?.workspaceId || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Permissions required */}
          {moduleDef?.permissions && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                Quyền hạn truy cập (RBAC Permissions)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {moduleDef.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-600"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToModule(moduleDef, node.route || moduleDef?.route);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Icons.ExternalLink className="w-3.5 h-3.5" />
            <span>Mở phân hệ {node.id}</span>
          </button>
        </div>
      </div>
    </>
  );
};
