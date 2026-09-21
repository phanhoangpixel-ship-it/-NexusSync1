import React, { useState } from 'react';
import { Search, Plus, CheckCircle2, XCircle, Clock, Filter, Eye, Award } from 'lucide-react';

interface SampleEvaluationTabProps {
  samples: any[];
  projects?: any[];
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const SampleEvaluationTab: React.FC<SampleEvaluationTabProps> = ({
  samples,
  projects = [],
  onRefresh,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any | null>(null);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects?.[0]?.id ? String(projects[0].id) : '1');
  const [formulaVersion, setFormulaVersion] = useState('v2.0');
  const [evalType, setEvalType] = useState('TECHNICAL');
  const [evaluatorName, setEvaluatorName] = useState('KS. Đo Kiểm Lab');
  const [score, setScore] = useState('92.0');
  const [sensoryFeedback, setSensoryFeedback] = useState('');
  const [techParams, setTechParams] = useState('{"temperatureToleranceC": 105, "efficiency": 94.5}');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if ((!selectedProjectId || selectedProjectId === '1') && projects && projects.length > 0) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects, selectedProjectId]);

  const filteredSamples = samples.filter((s) => {
    const matchSearch =
      (s.sampleCode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (s.evaluatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (s.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchType = typeFilter === 'ALL' || s.evaluationType === typeFilter;
    const matchResult = resultFilter === 'ALL' || s.result === resultFilter;
    return matchSearch && matchType && matchResult;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !evaluatorName.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng chọn đề tài và người đánh giá.');
      return;
    }

    setSubmitting(true);
    try {
      const parsedScore = Number(score) || 85;
      const computedResult = parsedScore >= 80 ? 'PASS' : 'FAIL';

      let parsedParams = {};
      try {
        parsedParams = JSON.parse(techParams);
      } catch {
        parsedParams = { rawInput: techParams };
      }

      const res = await fetch('/api/rd/samples/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: Number(selectedProjectId),
          formulaVersion,
          evaluationType: evalType,
          evaluatorName: evaluatorName.trim(),
          evaluationScore: parsedScore,
          result: computedResult,
          sensoryFeedback,
          technicalParameters: parsedParams,
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Ghi nhận thành công', data.message);
        setShowModal(false);
        setNotes('');
        setSensoryFeedback('');
        onRefresh();
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi đánh giá mẫu', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi kết nối', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã mẫu, kiểm nghiệm viên, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Tất cả phương pháp kiểm định</option>
            <option value="TECHNICAL">Đo kiểm kỹ thuật (Technical Spec)</option>
            <option value="SENSORY">Đánh giá cảm quan (Sensory)</option>
            <option value="AQL_LAB">Đo chuẩn AQL Lab (M39)</option>
            <option value="PACKAGING">Bao bì &amp; Đóng gói</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Tất cả kết luận</option>
            <option value="PASS">PASS - Đạt Chuẩn</option>
            <option value="FAIL">FAIL - Không Đạt</option>
            <option value="PENDING">PENDING - Đang Chờ</option>
          </select>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi Nhận Đánh Giá Mẫu Mới</span>
        </button>
      </div>

      {/* Samples Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Mã Mẫu</th>
                <th className="py-3 px-4">Đề Tài R&amp;D</th>
                <th className="py-3 px-4 text-center">Phiên Bản</th>
                <th className="py-3 px-4">Phương Pháp</th>
                <th className="py-3 px-4 text-right">Điểm Số</th>
                <th className="py-3 px-4 text-center">Kết Luận</th>
                <th className="py-3 px-4">Kiểm Nghiệm Viên</th>
                <th className="py-3 px-4 text-right">Ngày Đánh Giá</th>
                <th className="py-3 px-4 text-center">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Không có bản ghi đánh giá mẫu nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredSamples.map((sample) => {
                  const proj = projects.find((p) => p.id === sample.projectId);
                  return (
                    <tr
                      key={sample.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {sample.sampleCode}
                      </td>
                      <td className="py-3 px-4 max-w-[220px] truncate">
                        <span className="font-semibold text-slate-800 dark:text-white block">
                          {proj ? proj.title : `Đề tài #${sample.projectId}`}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {proj?.projectCode || ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                        {sample.formulaVersion || 'v1.0'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {sample.evaluationType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-800 dark:text-white">
                        {Number(sample.evaluationScore || 0).toFixed(1)} / 100
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sample.result === 'PASS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> PASS
                          </span>
                        ) : sample.result === 'FAIL' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                            <XCircle className="w-3 h-3" /> FAIL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {sample.evaluatorName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500 text-[11px]">
                        {sample.evaluatedAt ? sample.evaluatedAt.slice(0, 16) : sample.createdAt?.slice(0, 16)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedSample(sample)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-600 transition-colors"
                          title="Xem chi tiết thông số đo kiểm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail View */}
      {selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Chi Tiết Mẫu Thử [{selectedSample.sampleCode}]
                </h3>
              </div>
              <button
                onClick={() => setSelectedSample(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Loại Kiểm Định:</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedSample.evaluationType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Phiên Bản Công Thức:</span>
                <span className="font-mono font-bold text-blue-600">{selectedSample.formulaVersion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Điểm Đánh Giá:</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {selectedSample.evaluationScore} / 100
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Kết Luận:</span>
                <span className={`font-bold ${selectedSample.result === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedSample.result}
                </span>
              </div>

              {selectedSample.sensoryFeedback && (
                <div>
                  <span className="text-slate-500 block mb-1">Nhận Xét Cảm Quan:</span>
                  <p className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                    {selectedSample.sensoryFeedback}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-500 block mb-1">Thông Số Đo Kiểm Kỹ Thuật:</span>
                <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto">
                  {typeof selectedSample.technicalParameters === 'string'
                    ? selectedSample.technicalParameters
                    : JSON.stringify(selectedSample.technicalParameters, null, 2)}
                </pre>
              </div>

              {selectedSample.notes && (
                <div>
                  <span className="text-slate-500 block mb-1">Ghi Chú Kiểm Định:</span>
                  <p className="text-slate-600 dark:text-slate-300 italic">{selectedSample.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSample(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create Sample Evaluation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Ghi Nhận Đánh Giá Mẫu Thử Nghiệm R&amp;D
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Đề Tài R&amp;D Thử Nghiệm *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                >
                  {(projects || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Phiên Bản Công Thức *
                  </label>
                  <input
                    type="text"
                    value={formulaVersion}
                    onChange={(e) => setFormulaVersion(e.target.value)}
                    placeholder="ví dụ: v2.0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Phương Pháp Đánh Giá *
                  </label>
                  <select
                    value={evalType}
                    onChange={(e) => setEvalType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg"
                  >
                    <option value="TECHNICAL">Đo kiểm kỹ thuật (Technical)</option>
                    <option value="SENSORY">Đánh giá cảm quan (Sensory)</option>
                    <option value="AQL_LAB">Đo chuẩn AQL Lab (M39)</option>
                    <option value="PACKAGING">Bao bì &amp; Đóng gói</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Điểm Số Đạt Được (0 - 100) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono font-bold"
                    required
                  />
                  <span className="text-[10px] text-slate-400">
                    &ge; 80 điểm tự động kết luận PASS
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Kiểm Nghiệm Viên / Chuyên Gia *
                  </label>
                  <input
                    type="text"
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Nhận Xét Cảm Quan (Độ bóng, mùi vị, bề mặt)
                </label>
                <input
                  type="text"
                  value={sensoryFeedback}
                  onChange={(e) => setSensoryFeedback(e.target.value)}
                  placeholder="Mẫu phẳng mịn, không xuất hiện bọt khí..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Thông Số Kỹ Thuật (JSON Định Dạng)
                </label>
                <textarea
                  rows={2}
                  value={techParams}
                  onChange={(e) => setTechParams(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Ghi Chú Bổ Sung
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Đạt yêu cầu thử nghiệm giai đoạn 1"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Kết Quả Đánh Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
