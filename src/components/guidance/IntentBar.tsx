import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  Compass,
  CheckCircle2,
  CornerDownRight,
  Info,
  X,
} from 'lucide-react';
import { BusinessGuidanceService } from '../../services/guidanceEngine';
import { BusinessIntentResult, DisambiguationChoice } from '../../types/guidance';
import { UserSession } from '../../types';

interface IntentBarProps {
  currentUser: UserSession;
  currentBranch?: string;
  currentModuleId?: string;
  onNavigateToModule: (moduleId: string, contextPayload?: any) => void;
  className?: string;
}

export const IntentBar: React.FC<IntentBarProps> = ({
  currentUser,
  currentBranch = 'BR_HO',
  currentModuleId = 'M01',
  onNavigateToModule,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [activeResult, setActiveResult] = useState<BusinessIntentResult | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<DisambiguationChoice | null>(null);

  const quickPrompts = [
    'Tôi muốn nhập 100 sản phẩm từ Supplier',
    'Tôi muốn bán hàng B2B theo đơn',
    'Khách muốn đổi trả hàng lỗi',
    'Phát hiện lệch tồn kho sau kiểm kê',
    'Chuyển hàng sang chi nhánh khác',
    'Bán lẻ thu tiền mặt tại quầy',
  ];

  const handleSearch = (textToSearch?: string) => {
    const q = textToSearch !== undefined ? textToSearch : query;
    if (!q.trim()) return;
    const result = BusinessGuidanceService.parseIntent(q, {
      user: currentUser,
      currentBranch,
      currentModuleId,
      currentModuleName: '',
      permissions: [currentUser.role],
    });
    setActiveResult(result);
    setSelectedChoice(null);
  };

  const handleSelectChoice = (choice: DisambiguationChoice) => {
    setSelectedChoice(choice);
  };

  const handleExecuteIntent = (targetModId: string, route: string, actionName?: string) => {
    onNavigateToModule(targetModId, {
      suggestedAction: actionName,
      triggeredFromIntent: activeResult?.recognizedIntent,
    });
    setActiveResult(null);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input Box */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
            <Compass className="w-5 h-5" />
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="Bạn muốn thực hiện nghiệp vụ gì hôm nay? (Ví dụ: 'Nhập 100 sản phẩm từ Supplier ABC', 'Khách trả hàng', 'Lệch kho')..."
              className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setActiveResult(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSearch()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Xác Định Nghiệp Vụ</span>
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 mt-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-400 dark:text-slate-500">Gợi ý nhanh:</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(prompt);
                handleSearch(prompt);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-600"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Recognized Intent Card / Disambiguation Box */}
      {activeResult && (
        <div className="mt-3 bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-lg p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200">
                    {activeResult.category}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Độ tin cậy: {Math.round(activeResult.confidence * 100)}%</span>
                  {activeResult.requiresDisambiguation && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Cần Làm Rõ Nghiệp Vụ
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {activeResult.recognizedIntent}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Quy trình gợi ý: </span>
                  {activeResult.suggestedProcess}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Lý do nghiệp vụ: </span>
                  {activeResult.businessReason}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveResult(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Disambiguation Section if Multiple Options */}
          {activeResult.requiresDisambiguation && activeResult.choices.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{activeResult.disambiguationPrompt || 'Vui lòng chọn chính xác trường hợp nghiệp vụ của bạn:'}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeResult.choices.map((choice) => {
                  const isSelected = selectedChoice?.id === choice.id;
                  return (
                    <div
                      key={choice.id}
                      onClick={() => handleSelectChoice(choice)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{choice.title}</h4>
                          {choice.riskLevel === 'HIGH' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                              Lưu Ý Quan Trọng
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{choice.description}</p>
                        {choice.warningMessage && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded border border-rose-200 dark:border-rose-800">
                            ⚠ {choice.warningMessage}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">{choice.targetModuleName}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          Chọn <CornerDownRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Execution Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveResult(null)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Đóng Lại
            </button>

            {activeResult.requiresDisambiguation ? (
              <button
                type="button"
                disabled={!selectedChoice}
                onClick={() => {
                  if (selectedChoice) {
                    handleExecuteIntent(selectedChoice.targetModuleId, selectedChoice.targetRoute, selectedChoice.suggestedAction);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${
                  selectedChoice
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Bắt Đầu: {selectedChoice ? selectedChoice.targetModuleName : 'Chọn 1 phương án'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleExecuteIntent(activeResult.targetModuleId, activeResult.targetRoute)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <span>Mở {activeResult.targetModuleName}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
