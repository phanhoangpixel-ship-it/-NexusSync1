import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Layers, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CostEstimatorTabProps {
  projects?: any[];
  formulas?: any[];
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const CostEstimatorTab: React.FC<CostEstimatorTabProps> = ({
  projects = [],
  formulas = [],
  onNotify,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects?.[0]?.id ? String(projects[0].id) : '');
  const [costData, setCostData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCostEstimate = async (projId: string) => {
    if (!projId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rd/projects/${projId}/cost-estimate`);
      if (res.ok) {
        const data = await res.json();
        setCostData(data);
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi tính giá thành', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchCostEstimate(selectedProjectId);
    }
  }, [selectedProjectId]);

  const selectedProj = (projects || []).find((p) => String(p.id) === selectedProjectId);

  return (
    <div className="space-y-4">
      {/* Project Selector Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
            Chọn Đề Tài R&amp;D:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-96"
          >
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>
                [{p.projectCode}] {p.title}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fetchCostEstimate(selectedProjectId)}
          disabled={loading}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Tính Toán Lại Giá Thành</span>
        </button>
      </div>

      {/* Governance Architecture Notice */}
      <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3 text-xs text-blue-800 dark:text-blue-300">
        <ShieldAlert className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <span className="font-bold">Quy tắc Thẩm quyền Kế toán &amp; Giá thành (Rule #03 &amp; #07): </span>
          <span>
            R&amp;D Formula Costing truy xuất trực tiếp các tầng chi phí thực tế từ <strong>M42 Landed Cost / Cost Layers</strong> và <strong>M07 Item Master</strong> theo chế độ Read-Only. Đề tài R&amp;D chỉ mô phỏng định mức và không tự ý ghi đè sổ sách kế toán.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <span>Đang tính toán giá thành định mức theo công thức...</span>
        </div>
      ) : costData ? (
        <>
          {/* KPI Cost Breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Chi Phí Vật Tư Trực Tiếp
              </span>
              <div className="text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {Number(costData.costs?.directMaterialCost || 0).toLocaleString('vi-VN')} {costData.currency}
              </div>
              <span className="text-[10px] text-slate-400">
                Định mức mẻ: {costData.batchSize} đơn vị
              </span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Hiệu Suất Thu Hồi (Yield)
              </span>
              <div className="text-xl font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">
                {costData.yieldRatePercent}%
              </div>
              <span className="text-[10px] text-slate-400">
                Sản lượng hữu hiệu: {Number(costData.effectiveYieldUnits || 0).toFixed(1)} Pcs
              </span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Giá Thành Đơn Vị (COGS)
              </span>
              <div className="text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                {Number(costData.costs?.estimatedUnitCost || 0).toLocaleString('vi-VN')} {costData.currency}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">
                Bao gồm 15% NC + 10% SXC
              </span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Giá Bán Đề Xuất (Target 40%)
              </span>
              <div className="text-2xl font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400">
                {Number(costData.costs?.suggestedSellingPrice || 0).toLocaleString('vi-VN')} {costData.currency}
              </div>
              <span className="text-[10px] text-purple-600 font-medium">
                Biên lợi nhuận gộp mục tiêu 40%
              </span>
            </div>
          </div>

          {/* Component Breakdown Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Bảng Phân Tích Định Mức Vật Tư Công Thức [{costData.formulaVersion}]
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Đề tài: {selectedProj?.title} ({selectedProj?.projectCode})
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                {costData.componentBreakdown?.length || 0} thành phần
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-semibold">
                    <th className="py-3 px-4">Tên Vật Tư / Hóa Chất</th>
                    <th className="py-3 px-4 text-center">Đơn Vị</th>
                    <th className="py-3 px-4 text-right">Định Mức (Qty)</th>
                    <th className="py-3 px-4 text-right">Đơn Giá Dự Toán</th>
                    <th className="py-3 px-4 text-right">Thành Tiền Mẻ</th>
                    <th className="py-3 px-4 text-center">Nguồn Dữ Liệu Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {costData.componentBreakdown?.map((comp: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white">
                        {comp.name}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                        {comp.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">
                        {comp.qty}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {Number(comp.unitCost || 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {Number(comp.lineTotal || 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {comp.sourceAuthority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/90 dark:bg-slate-900 font-bold border-t border-slate-200 dark:border-slate-700">
                    <td colSpan={4} className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                      Tổng Chi Phí Vật Tư Trực Tiếp (NVL):
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 text-sm">
                      {Number(costData.costs?.directMaterialCost || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-slate-400 text-xs">
          Chưa có dữ liệu tính toán giá thành cho đề tài này.
        </div>
      )}
    </div>
  );
};
