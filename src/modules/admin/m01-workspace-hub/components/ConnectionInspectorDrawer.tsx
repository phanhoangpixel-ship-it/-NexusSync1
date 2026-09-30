import React from 'react';
import * as Icons from 'lucide-react';
import { ProcessEdge } from './ProcessFlowMap';

interface ConnectionInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  edge: ProcessEdge | null;
}

export const ConnectionInspectorDrawer: React.FC<ConnectionInspectorDrawerProps> = ({
  isOpen,
  onClose,
  edge,
}) => {
  if (!isOpen || !edge) return null;

  const isAsync = edge.type === 'ASYNC_EVENT';

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isAsync ? 'bg-violet-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              <Icons.GitCommit className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isAsync
                  ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              }`}>
                {edge.type === 'ASYNC_EVENT' ? 'Bất đồng bộ (M05 Outbox Event)' : 'Đồng bộ trực tiếp (API Call)'}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                Liên kết: {edge.source} ➔ {edge.target}
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
          {/* Interaction Flow Summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-center flex-1">
              <span className="text-[10px] text-slate-400 font-mono block">Nguồn (Source)</span>
              <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">{edge.source}</span>
            </div>
            <div className="px-3 flex flex-col items-center">
              <Icons.ArrowRight className="w-5 h-5 text-slate-400" />
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">{edge.label}</span>
            </div>
            <div className="text-center flex-1">
              <span className="text-[10px] text-slate-400 font-mono block">Đích (Target)</span>
              <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">{edge.target}</span>
            </div>
          </div>

          {/* Operational description */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              Mục đích luồng dữ liệu nghiệp vụ
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Chuyển tiếp trạng thái và thông điệp &ldquo;{edge.label}&rdquo; từ phân hệ {edge.source} tới {edge.target}. 
              {isAsync 
                ? ' Luồng này thực hiện thông qua cơ chế Outbox Pattern và EventRouter của M05 EventBus, đảm bảo tính bền vững (durability) và phân tích truy vết span.'
                : ' Luồng này được xác thực tại tầng API Gateway với cơ chế ủy quyền đồng bộ.'}
            </p>
          </div>

          {/* Single-Writer Authority Notice */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5 text-amber-950 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Icons.ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <strong className="font-bold text-xs">Quy định Thẩm quyền Đơn nhất (Single-Writer)</strong>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-850 dark:text-amber-300">
              {edge.authorityNote || 'Hai phân hệ tương tác tuân thủ ranh giới chủ quản: Không phân hệ nào được phép ghi đè bảng dữ liệu lõi của phân hệ còn lại.'}
            </p>
          </div>

          {/* Technical Protocol */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              Giao thức định tuyến &amp; Giám sát
            </h4>
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 font-mono text-[11px] space-y-1.5">
              <div>
                <span className="text-slate-400">Cơ chế truyền thông: </span>
                <span className="text-slate-800 dark:text-slate-200">{edge.type}</span>
              </div>
              <div>
                <span className="text-slate-400">Observability Span: </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Enabled (flow_spans tracking)</span>
              </div>
              <div>
                <span className="text-slate-400">Correlation ID: </span>
                <span className="text-slate-800 dark:text-slate-200">Kế thừa qua chuỗi nghiệp vụ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  );
};
