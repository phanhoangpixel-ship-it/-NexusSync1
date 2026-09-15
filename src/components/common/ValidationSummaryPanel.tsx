import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  X,
  Target,
  Wand2,
  RotateCcw,
  CheckCheck,
  RefreshCw,
  Zap
} from 'lucide-react';

export interface ValidationErrorItem {
  id: string;
  tabId: string;
  tabLabel: string;
  fieldId?: string;
  fieldName?: string;
  message: string;
  severity?: 'error' | 'warning';
  actionLabel?: string;
  // Auto-Fix capabilities
  isAutoFixable?: boolean;
  autoFixDescription?: string;
  autoFixType?: 'reset_default' | 'format_normalize' | 'last_known_good' | 'clear' | 'fallback_value';
  suggestedValueLabel?: string;
  onAutoFix?: () => void;
}

export interface ValidationSummaryPanelProps {
  errors: ValidationErrorItem[];
  warnings?: ValidationErrorItem[];
  activeTabId?: string;
  onJumpToField: (error: ValidationErrorItem) => void;
  // Global Auto-Fix Handlers
  onAutoFixAll?: () => void;
  onAutoFixItem?: (error: ValidationErrorItem) => void;
  isAutoFixing?: boolean;
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  onDismiss?: () => void;
  showSuccessState?: boolean;
  showAutoFixButton?: boolean;
}

/**
 * Universal Enterprise Validation Summary Panel
 * Standardizes multi-tab form error diagnostics with direct navigation,
 * element focusing, and Global Auto-Fix resolution engine.
 */
export const ValidationSummaryPanel: React.FC<ValidationSummaryPanelProps> = ({
  errors = [],
  warnings = [],
  activeTabId,
  onJumpToField,
  onAutoFixAll,
  onAutoFixItem,
  isAutoFixing = false,
  title = 'Bảng Tổng Hợp Lỗi Xác Thực Đa Tab',
  collapsible = true,
  defaultExpanded = true,
  className = '',
  onDismiss,
  showSuccessState = false,
  showAutoFixButton = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>('ALL');
  const [justAutoFixed, setJustAutoFixed] = useState<boolean>(false);

  const totalErrors = errors.length;
  const totalWarnings = warnings.length;
  const totalIssues = totalErrors + totalWarnings;

  // Combine items with severity
  const allIssues: ValidationErrorItem[] = [
    ...errors.map(e => ({ ...e, severity: e.severity || ('error' as const) })),
    ...warnings.map(w => ({ ...w, severity: w.severity || ('warning' as const) })),
  ];

  // Count auto-fixable issues
  const fixableIssues = allIssues.filter(
    issue => issue.isAutoFixable || Boolean(issue.onAutoFix) || (onAutoFixItem && issue.isAutoFixable !== false)
  );
  const fixableCount = fixableIssues.length;
  const hasGlobalAutoFix = Boolean(onAutoFixAll) || fixableCount > 0;

  // Handler for global auto fix
  const handleTriggerAutoFixAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAutoFixAll) {
      onAutoFixAll();
    } else if (onAutoFixItem) {
      fixableIssues.forEach(item => {
        if (item.onAutoFix) {
          item.onAutoFix();
        } else {
          onAutoFixItem(item);
        }
      });
    } else {
      fixableIssues.forEach(item => {
        item.onAutoFix?.();
      });
    }

    setJustAutoFixed(true);
    setTimeout(() => setJustAutoFixed(false), 2500);
  };

  // Handler for single item auto fix
  const handleTriggerSingleAutoFix = (issue: ValidationErrorItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (issue.onAutoFix) {
      issue.onAutoFix();
    } else if (onAutoFixItem) {
      onAutoFixItem(issue);
    }
  };

  // If there are no issues and success state is not requested, return null
  if (totalIssues === 0) {
    if (!showSuccessState && !justAutoFixed) return null;
    return (
      <div 
        id="validation-summary-panel-success"
        className={`p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between transition-all duration-300 animate-in fade-in ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                {justAutoFixed ? 'Đã tự động chuẩn hóa & khắc phục lỗi thành công!' : 'Mọi trường dữ liệu đều hợp lệ'}
              </span>
              {justAutoFixed && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Auto-Fix Applied</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/90 mt-0.5">
              {justAutoFixed 
                ? 'Các giá trị mặc định của lược đồ và định dạng hợp lệ đã được áp dụng tự động.'
                : 'Đơn hàng đã sẵn sàng để ghi nhận và hạch toán vào hệ thống.'}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Extract unique tabs for filtering
  const tabsInErrors = Array.from(new Set(allIssues.map(i => i.tabId)));

  const filteredIssues = selectedFilterTab === 'ALL'
    ? allIssues
    : allIssues.filter(i => i.tabId === selectedFilterTab);

  return (
    <div
      id="validation-summary-panel"
      className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-xs ${
        totalErrors > 0
          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-slate-800 dark:text-slate-100'
          : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-slate-800 dark:text-slate-100'
      } ${className}`}
    >
      {/* Header Bar */}
      <div className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/60 dark:border-rose-900/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
            totalErrors > 0 
              ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300' 
              : 'bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300'
          }`}>
            {totalErrors > 0 ? <AlertCircle className="w-4.5 h-4.5 animate-pulse" /> : <AlertTriangle className="w-4.5 h-4.5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{title}</span>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                {totalErrors > 0 && (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                    {totalErrors} lỗi bắt buộc
                  </span>
                )}
                {totalWarnings > 0 && (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    {totalWarnings} cảnh báo
                  </span>
                )}
                {fixableCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-500" />
                    <span>{fixableCount} có thể sửa tự động</span>
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
              Nhấp vào mục lỗi để chuyển vị trí, hoặc sử dụng <strong>Global Auto-Fix</strong> để tự động chuẩn hóa định dạng và khôi phục giá trị mặc định hợp lệ.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Global Auto-Fix Button */}
          {showAutoFixButton && hasGlobalAutoFix && (
            <button
              type="button"
              id="btn-global-auto-fix"
              onClick={handleTriggerAutoFixAll}
              disabled={isAutoFixing}
              title="Tự động khôi phục giá trị mặc định của lược đồ và chuẩn hóa định dạng (Email, MST, Số lượng, Đơn giá, Thuế suất)"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border ${
                isAutoFixing
                  ? 'bg-indigo-400 text-white cursor-wait opacity-80'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 hover:shadow-md active:scale-98'
              }`}
            >
              {isAutoFixing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 text-indigo-200" />
              )}
              <span>Global Auto-Fix</span>
              {fixableCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white font-bold">
                  {fixableCount}
                </span>
              )}
            </button>
          )}

          {totalErrors > 0 && (
            <button
              type="button"
              id="btn-jump-first-error"
              onClick={() => {
                const firstError = errors[0];
                if (firstError) onJumpToField(firstError);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 shadow-xs transition-colors cursor-pointer border border-rose-700"
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lỗi đầu tiên</span>
            </button>
          )}

          {collapsible && (
            <button
              type="button"
              id="btn-toggle-validation-panel"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content List */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Quick Guidance & Filter Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Filter Pills if multiple tabs have issues */}
            {tabsInErrors.length > 1 ? (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">Lọc theo tab:</span>
                <button
                  type="button"
                  onClick={() => setSelectedFilterTab('ALL')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                    selectedFilterTab === 'ALL'
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                      : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white'
                  }`}
                >
                  Tất cả ({allIssues.length})
                </button>
                {tabsInErrors.map((tabId) => {
                  const countForTab = allIssues.filter(i => i.tabId === tabId).length;
                  const sampleItem = allIssues.find(i => i.tabId === tabId);
                  return (
                    <button
                      key={tabId}
                      type="button"
                      onClick={() => setSelectedFilterTab(tabId)}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 shrink-0 ${
                        selectedFilterTab === tabId
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white'
                      }`}
                    >
                      <span>{sampleItem?.tabLabel || tabId}</span>
                      <span className="font-mono text-[10px] px-1 rounded bg-black/10 dark:bg-white/20 font-bold">
                        {countForTab}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : <div />}

            {/* Auto Fix helper pill */}
            {fixableCount > 0 && (
              <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Nhấn nút <strong>Sửa nhanh</strong> trên từng dòng hoặc <strong>Global Auto-Fix</strong> để tự động sửa tất cả.
                </span>
              </div>
            )}
          </div>

          {/* Issue Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {filteredIssues.map((issue) => {
              const isError = issue.severity !== 'warning';
              const isCurrentTab = activeTabId === issue.tabId;
              const canFixThis = issue.isAutoFixable || Boolean(issue.onAutoFix) || Boolean(onAutoFixItem);

              return (
                <div
                  key={issue.id}
                  id={`val-issue-${issue.id}`}
                  onClick={() => onJumpToField(issue)}
                  className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between gap-2.5 group cursor-pointer hover:shadow-sm ${
                    isError
                      ? 'bg-white dark:bg-slate-900/95 border-rose-200 dark:border-rose-900/80 hover:border-rose-400 dark:hover:border-rose-700'
                      : 'bg-white dark:bg-slate-900/95 border-amber-200 dark:border-amber-900/80 hover:border-amber-400 dark:hover:border-amber-700'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isError
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          {issue.tabLabel}
                        </span>
                        {issue.fieldName && (
                          <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                            {issue.fieldName}
                          </span>
                        )}
                      </div>

                      {isCurrentTab && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                          Tab Hiện Tại
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {issue.message}
                    </p>

                    {/* Auto-fix description / suggested value preview */}
                    {issue.suggestedValueLabel && (
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span>Giá trị chuẩn đề xuất: <strong>{issue.suggestedValueLabel}</strong></span>
                      </div>
                    )}
                    {issue.autoFixDescription && !issue.suggestedValueLabel && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                        💡 {issue.autoFixDescription}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    {/* Individual auto fix button */}
                    {canFixThis && (
                      <button
                        type="button"
                        id={`btn-autofix-${issue.id}`}
                        onClick={(e) => handleTriggerSingleAutoFix(issue, e)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/90 dark:hover:bg-indigo-900/90 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 flex items-center gap-1 transition-all cursor-pointer"
                        title={issue.autoFixDescription || 'Tự động sửa lỗi cho trường này'}
                      >
                        <Zap className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        <span>Sửa nhanh</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center gap-1 transition-all"
                    >
                      <span>{issue.actionLabel || 'Đến ô nhập'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
