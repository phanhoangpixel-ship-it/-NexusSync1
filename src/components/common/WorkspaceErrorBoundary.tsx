import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, Trash2, Copy, Check, ChevronRight } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleId?: string;
  moduleName?: string;
  onNavigateHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class WorkspaceErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[WorkspaceErrorBoundary] L3 error in module ${this.props.moduleId}:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  public componentDidUpdate(prevProps: Props) {
    // Automatically clear error when user navigates to a different module
    if (prevProps.moduleId !== this.props.moduleId && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  private handleReset = () => {
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => caches.delete(k).catch(() => {}));
      }).catch(() => {});
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleClearModuleCache = () => {
    try {
      if (this.props.moduleId) {
        localStorage.removeItem(`nexussync_tab_${this.props.moduleId}`);
        localStorage.removeItem(`nexus_tab_${this.props.moduleId}`);
      }
      localStorage.removeItem('nexussync_workspace_cache');
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k).catch(() => {}));
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleCopyError = () => {
    const text = `[NexusSync Module Error: ${this.props.moduleId} - ${this.props.moduleName}]\n` +
      `Message: ${this.state.error?.message}\n` +
      `Stack: ${this.state.error?.stack}\n` +
      `Component: ${this.state.errorInfo?.componentStack}`;
    
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      const modId = this.props.moduleId || 'UNKNOWN';
      const modName = this.props.moduleName || 'Phân hệ';

      return (
        <div className="flex-1 w-full min-h-[480px] p-6 sm:p-8 flex items-center justify-center">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    L3 WORKSPACE ISOLATION
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    Phân hệ [{modId}]
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                  Không thể tải phân hệ: {modName}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Lỗi đã được cô lập an toàn trong không gian làm việc này. Toàn bộ thanh điều hướng, sổ cái, dữ liệu kho và các phân hệ khác vẫn hoạt động bình thường.
                </p>
              </div>
            </div>

            {/* Error Message */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 font-mono text-xs text-rose-600 dark:text-rose-400 overflow-x-auto max-h-32">
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Chi tiết lỗi:</div>
              <div>{this.state.error?.message || 'Lỗi không xác định khi tải phân hệ.'}</div>
            </div>

            {/* Recovery Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử tải lại phân hệ</span>
              </button>

              {this.props.onNavigateHome && (
                <button
                  type="button"
                  onClick={this.props.onNavigateHome}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-slate-500" />
                  <span>Về Workspace Hub [M01]</span>
                </button>
              )}

              <button
                type="button"
                onClick={this.handleClearModuleCache}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-slate-700 hover:text-rose-700 dark:text-slate-200 dark:hover:text-rose-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-rose-300 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xoá đệm & Tải lại</span>
              </button>
            </div>

            {/* Copy Error Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              <span>Bạn có thể chọn bất kỳ phân hệ nào khác trên thanh điều hướng để tiếp tục làm việc.</span>
              <button
                type="button"
                onClick={this.handleCopyError}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                {this.state.copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{this.state.copied ? 'Đã chép' : 'Chép lỗi'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default WorkspaceErrorBoundary;
