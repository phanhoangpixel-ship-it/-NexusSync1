import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, Trash2, Copy, Check, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
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
    console.error('[NexusSync ERP] GlobalErrorBoundary caught an uncaught error:', error, errorInfo);
    this.setState({ errorInfo });

    // Optional: Log to local activity storage
    try {
      const logs = JSON.parse(localStorage.getItem('nexussync_activity_logs') || '[]');
      logs.unshift({
        id: `ERR-${Date.now()}`,
        action: 'CRITICAL_RUNTIME_ERROR',
        timestamp: new Date().toISOString(),
        sourceModule: 'L0_ROOT_ERROR_BOUNDARY',
        status: 'FAILED',
        userName: 'System Watchdog',
        userRole: 'MONITOR',
        reason: error.message,
        details: { stack: error.stack, componentStack: errorInfo.componentStack },
      });
      localStorage.setItem('nexussync_activity_logs', JSON.stringify(logs.slice(0, 50)));
    } catch {
      // ignore storage failure
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleNavigateHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#/hub';
    window.location.reload();
  };

  private handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem('nexussync_workspace_cache');
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleCopyError = () => {
    const text = `[NexusSync ERP Error Report]\nMessage: ${this.state.error?.message}\nStack: ${this.state.error?.stack}\nComponent: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex items-center justify-center p-4 select-none font-sans">
          <div className="max-w-xl w-full bg-slate-800 rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    L0 ERROR BOUNDARY
                  </span>
                  <span className="text-xs text-slate-400 font-mono">NexusSync Core Watchdog</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">Đã xảy ra sự cố hiển thị trong phân hệ</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Ứng dụng đã bảo vệ tính toàn vẹn của dữ liệu bằng cách cô lập lỗi và ngăn chặn crash hệ thống. Dữ liệu kho và sổ cái kế toán vẫn an toàn.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 font-mono text-xs text-rose-300 overflow-x-auto max-h-32">
              <div className="font-semibold text-rose-400 mb-1">Chi tiết lỗi:</div>
              <div>{this.state.error?.message || 'Lỗi không xác định.'}</div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử phục hồi lại</span>
              </button>

              <button
                type="button"
                onClick={this.handleNavigateHome}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-400" />
                <span>Về Trang chủ Hub</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-200 hover:text-rose-300 text-xs font-semibold border border-slate-700 hover:border-rose-900/50 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>Xóa đệm & Tải lại</span>
              </button>
            </div>

            {/* Footer Copy Stack Trace */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Kiến trúc phân lớp L0-L4 • Bảo mật & Chống mất dữ liệu</span>
              </div>
              <button
                type="button"
                onClick={this.handleCopyError}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{this.state.copied ? 'Đã sao chép' : 'Sao chép chi tiết'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
