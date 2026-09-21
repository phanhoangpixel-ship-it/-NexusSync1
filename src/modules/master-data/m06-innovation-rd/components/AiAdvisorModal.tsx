import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  X,
  ShieldAlert,
  Beaker,
  Scale,
  Leaf,
  FileText,
  Lightbulb,
  Send
} from 'lucide-react';

interface AiAdvisorModalProps {
  isOpen: boolean;
  project: any;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  project,
  onClose,
  onNotify,
}) => {
  const [promptType, setPromptType] = useState<'FORMULATION' | 'PATENT' | 'ECO'>('FORMULATION');
  const [customQuestion, setCustomQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAiAdvice = async (type: 'FORMULATION' | 'PATENT' | 'ECO' = promptType) => {
    if (!project) return;
    setLoading(true);
    setAnalysisText(null);
    try {
      const res = await fetch('/api/rd/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptType: type,
          projectTitle: project.title,
          category: project.category,
          customQuestion: customQuestion.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisText(data.analysis || 'Không nhận được phân tích từ hệ thống AI.');
        onNotify('info', 'AI Gemini R&D Advisor', 'Đã hoàn tất báo cáo khuyến nghị khoa học.');
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi AI Advisor', err.error || 'Không thể kết nối AI Advisor.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      fetchAiAdvice(promptType);
    }
  }, [isOpen, project, promptType]);

  if (!isOpen || !project) return null;

  const handleCopy = () => {
    if (!analysisText) return;
    navigator.clipboard.writeText(analysisText);
    setCopied(true);
    onNotify('success', 'Đã sao chép', 'Nội dung khuyến nghị đã được lưu vào bộ nhớ tạm.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 flex items-center justify-center border border-purple-200 dark:border-purple-800">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Tư Vấn AI Gemini R&D Advisor
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đề tài: <span className="font-semibold text-slate-700 dark:text-slate-200">[{project.projectCode}] {project.title}</span>
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

        {/* Consultation Mode Selector */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <button
            type="button"
            onClick={() => setPromptType('FORMULATION')}
            className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              promptType === 'FORMULATION'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold bg-white dark:bg-slate-800 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Beaker className="w-3.5 h-3.5" />
            <span>Tối Ưu Công Thức BOM</span>
          </button>
          <button
            type="button"
            onClick={() => setPromptType('PATENT')}
            className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              promptType === 'PATENT'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold bg-white dark:bg-slate-800 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Bảo Hộ Sáng Chế (FTO)</span>
          </button>
          <button
            type="button"
            onClick={() => setPromptType('ECO')}
            className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              promptType === 'ECO'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold bg-white dark:bg-slate-800 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>Sinh Thái & Hóa Học Xanh</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Project Summary Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Lĩnh vực</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{project.category || 'Công nghệ cao'}</span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Chủ nhiệm</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{project.lead || 'Chưa phân công'}</span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Cấp TRL</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">TRL {project.trlLevel || 3}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchAiAdvice()}
              disabled={loading}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
              <span>Phân Tích Lại</span>
            </button>
          </div>

          {/* AI Response Display */}
          {loading ? (
            <div className="p-8 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Gemini đang phân tích dữ liệu phòng Lab & tiêu chuẩn kỹ thuật...
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-sm mx-auto">
                Mô hình đang tổng hợp cơ sở dữ liệu sáng chế, công thức hóa lý và đánh giá mức sẵn sàng công nghệ TRL.
              </p>
            </div>
          ) : analysisText ? (
            <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-800/40 pb-2">
                <div className="flex items-center gap-1.5 text-purple-800 dark:text-purple-300 font-bold text-xs">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  <span>Báo Cáo Đánh Giá & Khuyến Nghị Chuyên Sâu</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded text-purple-700 dark:text-purple-300 flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                {analysisText}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              Chưa có dữ liệu phân tích. Vui lòng bấm "Phân Tích Lại".
            </div>
          )}

          {/* Quick Custom Question / Prompt Input */}
          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Câu hỏi hoặc yêu cầu chuyên biệt cho AI:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ví dụ: Đề xuất tỷ lệ pha trộn giảm 10% chi phí nhưng giữ nguyên độ bền nhiệt..."
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchAiAdvice();
                  }
                }}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={() => fetchAiAdvice()}
                disabled={loading}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Khuyến nghị mang tính tham vấn kỹ thuật cho Hội đồng Khoa học.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
