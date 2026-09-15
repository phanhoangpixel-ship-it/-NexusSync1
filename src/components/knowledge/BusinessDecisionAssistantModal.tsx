import React, { useState, useMemo } from 'react';
import { DECISION_INTENTS, DecisionIntent, DecisionIntentOption } from '../../data/erpBusinessKnowledge';
import { MODULE_REGISTRY, ModuleDefinition } from '../../config/moduleRegistry';
import {
  Compass,
  Search,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Sparkles,
  HelpCircle,
  FileText,
  CornerDownRight,
  ExternalLink,
} from 'lucide-react';

interface BusinessDecisionAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule?: (module: ModuleDefinition) => void;
  onNavigateModule?: (moduleId: string) => void;
}

export const BusinessDecisionAssistantModal: React.FC<BusinessDecisionAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  onNavigateModule,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<DecisionIntent | null>(null);
  const [selectedOption, setSelectedOption] = useState<DecisionIntentOption | null>(null);

  // Suggested quick intent prompts
  const quickPrompts = [
    'Tôi muốn nhập hàng',
    'Tôi muốn bán hàng',
    'Tôi muốn chuyển hàng giữa hai kho',
    'Tôi phát hiện tồn kho bị lệch',
    'Khách trả hàng',
  ];

  // Match intent based on user query
  const matchedIntents = useMemo(() => {
    if (!searchQuery.trim()) return DECISION_INTENTS;
    const query = searchQuery.toLowerCase().trim();
    return DECISION_INTENTS.filter((intent) => {
      const matchKeywords = intent.userQueryKeywords.some((kw) => query.includes(kw) || kw.includes(query));
      const matchSummary = intent.summaryIntent.toLowerCase().includes(query);
      const matchExplanation = intent.explanation.toLowerCase().includes(query);
      return matchKeywords || matchSummary || matchExplanation;
    });
  }, [searchQuery]);

  const handleSelectIntent = (intent: DecisionIntent) => {
    setSelectedIntent(intent);
    if (!intent.requiresDisambiguation && intent.options.length === 1) {
      setSelectedOption(intent.options[0]);
    } else {
      setSelectedOption(null);
    }
  };

  const handleNavigateToModule = (moduleId: string) => {
    const mod = MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
    if (mod && typeof onSelectModule === 'function') {
      onSelectModule(mod);
    } else if (typeof onNavigateModule === 'function') {
      onNavigateModule(moduleId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="decision-assistant-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="decision-assistant-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center shadow-inner">
              <Compass className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Trợ Lý Định Tuyến Nghiệp Vụ ERP (Business Decision Assistant)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  AI-Guided Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Nhập nhu cầu kinh doanh bằng ngôn ngữ tự nhiên để xác định chính xác phân hệ, quy trình & vai trò cần thiết
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Đóng trợ lý"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Quick Chips */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIntent(null);
                setSelectedOption(null);
              }}
              placeholder="Nhập nhu cầu của bạn (Ví dụ: 'tôi muốn nhập hàng', 'tôi muốn bán hàng', 'chuyển kho', 'tồn kho bị lệch')..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs placeholder:text-slate-400"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Quick Intent Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Nhu cầu phổ biến:
            </span>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setSearchQuery(prompt);
                  const matched = DECISION_INTENTS.find((it) =>
                    it.userQueryKeywords.some((kw) => prompt.toLowerCase().includes(kw))
                  );
                  if (matched) handleSelectIntent(matched);
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area (Master - Detail layout) */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0">
          {/* Left: Recognized Intents (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2.5 border-r border-slate-100 pr-0 md:pr-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Nghiệp vụ phù hợp ({matchedIntents.length})</span>
              <span className="text-[10px] font-mono text-slate-400">Rule-Checked</span>
            </h3>

            {matchedIntents.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium">Không tìm thấy nghiệp vụ khớp với từ khóa</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hãy thử gõ các cụm từ ngắn gọn: "nhập hàng", "bán hàng", "lệch kho", "chuyển kho"...
                </p>
              </div>
            ) : (
              matchedIntents.map((intent) => {
                const isSelected = selectedIntent?.intentId === intent.intentId;
                return (
                  <button
                    key={intent.intentId}
                    type="button"
                    onClick={() => handleSelectIntent(intent)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-sm font-bold leading-tight ${
                          isSelected ? 'text-blue-900' : 'text-slate-800'
                        }`}
                      >
                        {intent.summaryIntent}
                      </h4>
                      {intent.requiresDisambiguation && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                          {intent.options.length} trường hợp
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{intent.explanation}</p>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Disambiguation & Action Decision (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4 pl-0 md:pl-2">
            {!selectedIntent ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border border-slate-200/80">
                <Compass className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">Chọn một nghiệp vụ bên trái để xem hướng dẫn</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Trợ lý sẽ giúp bạn phân biệt chính xác các phân hệ liên quan, điều kiện tiên quyết và cách thức xử lý an toàn
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Intent Overview */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {selectedIntent.intentId}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{selectedIntent.summaryIntent}</h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{selectedIntent.explanation}</p>
                </div>

                {/* Disambiguation Question (if multiple options) */}
                {selectedIntent.requiresDisambiguation && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{selectedIntent.disambiguationQuestion || 'Vui lòng chọn tình huống cụ thể của bạn:'}</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedIntent.options.map((opt) => {
                        const isOptActive = selectedOption?.id === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedOption(opt)}
                            className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                              isOptActive
                                ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{opt.title}</span>
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  opt.riskLevel === 'HIGH'
                                    ? 'bg-rose-100 text-rose-800'
                                    : opt.riskLevel === 'MEDIUM'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                Rủi ro: {opt.riskLevel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{opt.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detailed Action Plan for Selected Option */}
                {selectedOption && (
                  <div className="p-4 rounded-xl border border-blue-200 bg-white shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                          Phân hệ thực hiện chính thức
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                          <span>{selectedOption.targetModuleName}</span>
                          <span className="text-xs font-mono text-slate-400">({selectedOption.route})</span>
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNavigateToModule(selectedOption.targetModuleId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        <span>Đi đến phân hệ ngay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Warning (if High Risk) */}
                    {selectedOption.warningMessage && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{selectedOption.warningMessage}</span>
                      </div>
                    )}

                    {/* Meta Specifications */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Dữ liệu đầu vào cần chuẩn bị:</span>
                        </div>
                        <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                          {selectedOption.requiredData.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Vai trò & Thẩm quyền (RBAC):</span>
                        </div>
                        <p className="text-slate-600 font-mono font-medium">{selectedOption.requiredRole}</p>
                        <div className="mt-2 text-[11px] text-slate-500">
                          <strong>Quy trình chuỗi:</strong> {selectedOption.flowName}
                        </div>
                      </div>
                    </div>

                    {/* Next step */}
                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                      <CornerDownRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Bước tiếp theo sau khi hoàn thành:</strong>
                        <p className="text-blue-800 mt-0.5">{selectedOption.nextStep}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Quy tắc Vàng: Không dùng tắt phân hệ, không ghi trực tiếp CSDL, tuân thủ Single Writer.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
