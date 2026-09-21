import React, { useState } from 'react';
import { Search, Plus, ShieldCheck, CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';

interface EcoComplianceTabProps {
  complianceList: any[];
  projects?: any[];
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const EcoComplianceTab: React.FC<EcoComplianceTabProps> = ({
  complianceList,
  projects = [],
  onRefresh,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [standardFilter, setStandardFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<any | null>(null);

  // Form states
  const [projectId, setProjectId] = useState<string>(projects?.[0]?.id ? String(projects[0].id) : '1');
  const [standardName, setStandardName] = useState('RoHS 2011/65/EU');
  const [status, setStatus] = useState('PASS');
  const [certRef, setCertRef] = useState('');
  const [checkedBy, setCheckedBy] = useState('Ban Giám Sát Tuân Thủ QA/QC');
  const [paramsJson, setParamsJson] = useState('{"leadPpm": 0, "mercuryPpm": 0, "cadmiumPpm": 0}');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if ((!projectId || projectId === '1') && projects && projects.length > 0) {
      setProjectId(String(projects[0].id));
    }
  }, [projects, projectId]);

  const filteredList = complianceList.filter((c) => {
    const matchSearch =
      (c.checkCode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (c.standardName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (c.checkedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchStandard = standardFilter === 'ALL' || c.standardName?.includes(standardFilter);
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStandard && matchStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !standardName) {
      onNotify('warning', 'Thiếu dữ liệu', 'Vui lòng chọn đề tài và tiêu chuẩn.');
      return;
    }

    setSubmitting(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(paramsJson);
      } catch {
        parsed = { raw: paramsJson };
      }

      const res = await fetch('/api/rd/eco-compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: Number(projectId),
          standardName,
          status,
          testedParameters: parsed,
          certificationDocRef: certRef || `DMS-CERT-${Date.now().toString().slice(-6)}`,
          checkedBy,
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Tuân thủ môi trường', data.message);
        setShowModal(false);
        setNotes('');
        onRefresh();
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi ghi nhận', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã kiểm định, tiêu chuẩn, kiểm nghiệm viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={standardFilter}
            onChange={(e) => setStandardFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Tất cả tiêu chuẩn quốc tế</option>
            <option value="RoHS">RoHS 2011/65/EU</option>
            <option value="REACH">REACH (EC 1907/2006)</option>
            <option value="ISO 14001">ISO 14001:2015 Eco-Design</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Tất cả kết luận</option>
            <option value="PASS">PASS - Đạt Chuẩn</option>
            <option value="FAIL">FAIL - Không Đạt</option>
          </select>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Kiểm Định Tuân Thủ Sinh Thái</span>
        </button>
      </div>

      {/* Compliance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Mã Kiểm Định</th>
                <th className="py-3 px-4">Đề Tài R&amp;D</th>
                <th className="py-3 px-4">Tiêu Chuẩn Pháp Lý</th>
                <th className="py-3 px-4 text-center">Kết Luận</th>
                <th className="py-3 px-4">Chứng Chỉ / Tài Liệu DMS</th>
                <th className="py-3 px-4">Cán Bộ Kiểm Tra</th>
                <th className="py-3 px-4 text-right">Ngày Xác Thực</th>
                <th className="py-3 px-4 text-center">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không có bản ghi kiểm định tuân thủ môi trường nào.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const proj = projects.find((p) => p.id === item.projectId);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.checkCode}
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate">
                        <span className="font-semibold text-slate-800 dark:text-white block">
                          {proj ? proj.title : `Đề tài #${item.projectId}`}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {proj?.projectCode || ''}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.standardName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.status === 'PASS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> ĐẠT (PASS)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                            <XCircle className="w-3 h-3" /> KHÔNG ĐẠT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.certificationDocRef || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.checkedBy}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500 text-[11px]">
                        {item.checkedAt ? item.checkedAt.slice(0, 10) : ''}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedCheck(item)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[11px] font-semibold transition-colors"
                        >
                          Xem Chỉ Số
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

      {/* Modal Detail */}
      {selectedCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Chỉ Số Kiểm Định [{selectedCheck.checkCode}]
                </h3>
              </div>
              <button
                onClick={() => setSelectedCheck(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Tiêu Chuẩn:</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedCheck.standardName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Kết Luận:</span>
                <span className={`font-bold ${selectedCheck.status === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedCheck.status === 'PASS' ? 'ĐẠT TIÊU CHUẨN' : 'KHÔNG ĐẠT'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Tài Liệu Chứng Chỉ:</span>
                <span className="font-mono text-blue-600">{selectedCheck.certificationDocRef}</span>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Nồng Độ Hóa Chất / Tham Số Thử Nghiệm:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto">
                  {typeof selectedCheck.testedParametersJson === 'string'
                    ? selectedCheck.testedParametersJson
                    : JSON.stringify(selectedCheck.testedParametersJson, null, 2)}
                </pre>
              </div>

              {selectedCheck.notes && (
                <div>
                  <span className="text-slate-500 block mb-1">Kết Luận Chuyên Gia:</span>
                  <p className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg">
                    {selectedCheck.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCheck(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Compliance Check */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Thêm Bản Ghi Kiểm Định Sinh Thái &amp; Pháp Lý
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
                  Đề Tài R&amp;D Cần Xác Thực *
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium"
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
                    Bộ Tiêu Chuẩn Áp Dụng *
                  </label>
                  <select
                    value={standardName}
                    onChange={(e) => setStandardName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium"
                  >
                    <option value="RoHS 2011/65/EU">RoHS 2011/65/EU</option>
                    <option value="REACH (EC 1907/2006) SVHC">REACH (EC 1907/2006) SVHC</option>
                    <option value="ISO 14001:2015 Eco-Design">ISO 14001:2015 Eco-Design</option>
                    <option value="Chỉ thị Thiết kế Sinh thái EU">Chỉ thị Thiết kế Sinh thái EU</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Kết Luận Đánh Giá *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-semibold"
                  >
                    <option value="PASS">PASS - Đạt Tiêu Chuẩn</option>
                    <option value="FAIL">FAIL - Không Đạt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Mã Hồ Sơ Chứng Nhận DMS
                  </label>
                  <input
                    type="text"
                    value={certRef}
                    onChange={(e) => setCertRef(e.target.value)}
                    placeholder="ví dụ: DMS-CERT-ROHS-2026"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Cán Bộ / Đơn Vị Giám Sát *
                  </label>
                  <input
                    type="text"
                    value={checkedBy}
                    onChange={(e) => setCheckedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Chỉ Số Nồng Độ Chất Thử Nghiệm (JSON)
                </label>
                <textarea
                  rows={2}
                  value={paramsJson}
                  onChange={(e) => setParamsJson(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Ghi Chú Kết Luận
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Hoàn toàn đáp ứng ngưỡng giới hạn nồng độ an toàn"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Bản Ghi Tuân Thủ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
