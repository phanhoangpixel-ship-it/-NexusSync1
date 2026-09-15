import React, { useState, useMemo } from 'react';
import { ERP_GLOSSARY, ErpGlossaryTerm } from '../../data/erpBusinessKnowledge';
import { MODULE_REGISTRY, ModuleDefinition } from '../../config/moduleRegistry';
import { BookOpen, Search, X, Tag, ExternalLink, Sparkles, HelpCircle } from 'lucide-react';

interface ErpGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule?: (module: ModuleDefinition) => void;
  onNavigateModule?: (moduleId: string) => void;
}

export const ErpGlossaryModal: React.FC<ErpGlossaryModalProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  onNavigateModule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<ErpGlossaryTerm>(ERP_GLOSSARY[0]);

  const filteredTerms = useMemo(() => {
    if (!searchTerm.trim()) return ERP_GLOSSARY;
    const query = searchTerm.toLowerCase().trim();
    return ERP_GLOSSARY.filter((t) => {
      const matchName = t.term.toLowerCase().includes(query) || t.vietnameseTerm.toLowerCase().includes(query);
      const matchDef = t.shortDefinition.toLowerCase().includes(query) || t.businessMeaning.toLowerCase().includes(query);
      return matchName || matchDef;
    });
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      id="erp-glossary-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="erp-glossary-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Từ Điển Thuật Ngữ Nghiệp Vụ ERP (ERP Business Glossary)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Song Ngữ Việt - Anh
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Giải thích bản chất kinh tế, nguyên tắc bất biến và ngữ cảnh áp dụng của các khái niệm ERP tiêu chuẩn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Đóng từ điển"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm thuật ngữ (VD: Physical Stock, 3-Way Matching, Blind Count, COGS, FEFO, Sổ cái kép)..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs placeholder:text-slate-400"
              autoFocus
            />
          </div>
        </div>

        {/* Master - Detail Content */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0">
          {/* Term list (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2 border-r border-slate-100 pr-0 md:pr-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Thuật ngữ ({filteredTerms.length})
            </h3>
            {filteredTerms.map((t) => {
              const isSelected = selectedTerm.term === t.term;
              return (
                <button
                  key={t.term}
                  type="button"
                  onClick={() => setSelectedTerm(t)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 font-mono">{t.term}</span>
                  </div>
                  <p className="text-xs font-semibold text-indigo-700 mt-0.5">{t.vietnameseTerm}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{t.shortDefinition}</p>
                </button>
              );
            })}
          </div>

          {/* Detail (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4 pl-0 md:pl-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {selectedTerm.term}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{selectedTerm.vietnameseTerm}</h3>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-2">{selectedTerm.shortDefinition}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col gap-3 text-xs">
              <div>
                <strong className="text-slate-800 font-bold block mb-1">Bản chất kinh tế & Nghiệp vụ chuyên sâu:</strong>
                <p className="text-slate-600 leading-relaxed">{selectedTerm.businessMeaning}</p>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-indigo-950">
                <strong className="block mb-1 font-bold">Ví dụ thực tế doanh nghiệp:</strong>
                <p className="font-mono text-[11px]">{selectedTerm.example}</p>
              </div>

              <div>
                <strong className="text-slate-800 font-bold block mb-1">Được áp dụng tại các phân hệ:</strong>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedTerm.whereUsed.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        const mod = MODULE_REGISTRY.find((x) => x.moduleId === m);
                        if (mod && typeof onSelectModule === 'function') {
                          onSelectModule(mod);
                          onClose();
                        } else if (typeof onNavigateModule === 'function') {
                          onNavigateModule(m);
                          onClose();
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                      title={`Mở phân hệ ${m}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-slate-800 font-bold block mb-1">Khái niệm liên quan:</strong>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedTerm.relatedConcepts.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Chuẩn hóa nghiệp vụ theo hệ thống Enterprise ERP Governance</span>
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
