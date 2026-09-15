import React, { useState, useMemo } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, AlertTriangle, ShieldCheck, 
  Search, Filter, RefreshCw, FileSpreadsheet, Building2, 
  Layers, PackageX, Calendar, ArrowUpRight, ArrowDownRight,
  Sparkles, CheckCircle2, Boxes
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StockAdjustmentRecord } from './StockAdjustmentMasterTab';

interface StockAdjustmentReasonAnalyticsTabProps {
  adjustments: StockAdjustmentRecord[];
  warehouses: Array<{ id: number; code: string; name: string }>;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const StockAdjustmentReasonAnalyticsTab: React.FC<StockAdjustmentReasonAnalyticsTabProps> = ({
  adjustments,
  warehouses,
  onNotify
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('Q3_2026');
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('ALL');

  // Reason Categories Breakdown
  const reasonBreakdown = useMemo(() => {
    return [
      {
        code: 'DAMAGE',
        name: 'Hư Hỏng & Biến Dạng Vật Lý',
        count: 14,
        totalLossValue: 8450000,
        percentage: 38.5,
        responsibleCostCenter: 'CC-WH-MAIN (Kho Vận)',
        benchmarkLimit: '≤ 10.000.000 ₫ / Quý',
        status: 'WITHIN_LIMIT',
        description: 'Hư hỏng thùng carton khi bốc xếp xe nâng, rơi vỡ linh kiện'
      },
      {
        code: 'EXPIRATION',
        name: 'Hết Hạn Sử Dụng (Quá Date)',
        count: 5,
        totalLossValue: 4200000,
        percentage: 19.1,
        responsibleCostCenter: 'CC-QA-QC (Ban Chất Lượng)',
        benchmarkLimit: '≤ 3.000.000 ₫ / Quý',
        status: 'EXCEED_LIMIT',
        description: 'Dung môi hóa chất và keo dẫn nhiệt quá hạn lưu kho 6 tháng'
      },
      {
        code: 'SHRINKAGE',
        name: 'Hao Hụt Bay Hơi Tự Nhiên (Định Mức)',
        count: 9,
        totalLossValue: 2600000,
        percentage: 11.8,
        responsibleCostCenter: 'CC-MFG-01 (Phân Xưởng)',
        benchmarkLimit: '≤ 5.000.000 ₫ / Quý',
        status: 'WITHIN_LIMIT',
        description: 'Hao hụt xăng dầu máy phát điện và dầu thủy lực làm mát'
      },
      {
        code: 'DATA_ENTRY',
        name: 'Sai Sót Nhập Liệu Đầu Vào (PO/GRN)',
        count: 12,
        totalLossValue: 3100000,
        percentage: 14.1,
        responsibleCostCenter: 'CC-B2B-SALES (Kinh Doanh)',
        benchmarkLimit: '≤ 2.000.000 ₫ / Quý',
        status: 'EXCEED_LIMIT',
        description: 'Ghi nhầm đơn vị tính Hộp thành Thùng tại khâu nhận hàng'
      },
      {
        code: 'SURPLUS',
        name: 'Dôi Dư Thực Tế Sau Kiểm Kê Mù',
        count: 8,
        totalLossValue: -3600000, // Thặng dư ghi tăng tài sản
        percentage: 16.5,
        responsibleCostCenter: 'CC-WH-MAIN (Kho Vận)',
        benchmarkLimit: 'Được ghi tăng Có 3381',
        status: 'SURPLUS_POSITIVE',
        description: 'Kiểm kê mù phát hiện thừa nguyên kiện phụ tùng chưa kích hoạt PO'
      }
    ];
  }, []);

  // Cost Center Summary
  const costCenterBreakdown = useMemo(() => {
    return [
      { name: 'Kho Vận Trung Tâm (CC-WH-MAIN)', count: 22, totalLoss: 12050000, share: '54.9%' },
      { name: 'Phân Xưởng Cơ Khí (CC-MFG-01)', count: 9, totalLoss: 2600000, share: '11.8%' },
      { name: 'Ban Chất Lượng KCS (CC-QA-QC)', count: 5, totalLoss: 4200000, share: '19.1%' },
      { name: 'Khối Kinh Doanh (CC-B2B-SALES)', count: 12, totalLoss: 3100000, share: '14.2%' }
    ];
  }, []);

  // Export Analytics
  const handleExport = () => {
    const exportData = reasonBreakdown.map(r => ({
      'Mã Nguyên Nhân': r.code,
      'Tên Nguyên Nhân': r.name,
      'Số Phiếu Phát Sinh': r.count,
      'Giá Trị Thất Thoát / Lệch (VND)': r.totalLossValue,
      'Tỷ Trọng (%)': `${r.percentage}%`,
      'Bộ Phận Chịu Trách Nhiệm': r.responsibleCostCenter,
      'Hạn Mức Định Mức': r.benchmarkLimit,
      'Đánh Giá Ngưỡng': r.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PhanTichNguyenNhanM20');
    XLSX.writeFile(wb, `M20_Reason_Analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);

    onNotify('success', 'Xuất Báo Cáo Thành Công', 'Đã xuất bảng phân tích hao hụt điều chỉnh kho.');
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: ANALYTICAL KPI STRIP                                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Tổng Vụ Việc Hao Hụt / Lệch
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                48
              </span>
              <span className="text-xs text-slate-500 font-medium">Lượt điều chỉnh</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
              Tổng Thất Thoát / Hư Hỏng
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                18.350.000 ₫
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center">
            <PackageX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Thặng Dư Ghi Tăng Kho
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                +3.600.000 ₫
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
              Nhóm Cần Kiểm Soát KCS
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                Quá Hạn &amp; Sai PO
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: COMMAND BAR & FILTER                                                  */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer"
          >
            <option value="Q3_2026">Kỳ Báo Cáo: Quý 3/2026 (Hiện Tại)</option>
            <option value="Q2_2026">Kỳ Báo Cáo: Quý 2/2026</option>
            <option value="Q1_2026">Kỳ Báo Cáo: Quý 1/2026</option>
            <option value="YEAR_2026">Lũy Kế Toàn Năm 2026</option>
          </select>

          <select
            value={selectedCostCenter}
            onChange={(e) => setSelectedCostCenter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer"
          >
            <option value="ALL">Tất cả Trung tâm chi phí</option>
            <option value="WH">Kho Vận Trung Tâm (CC-WH-MAIN)</option>
            <option value="MFG">Phân Xưởng Cơ Khí (CC-MFG-01)</option>
            <option value="QA">Ban Chất Lượng (CC-QA-QC)</option>
            <option value="SALES">Khối Kinh Doanh (CC-B2B-SALES)</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Xuất Báo Cáo Phân Tích</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* L3: REASON BREAKDOWN DATA GRID                                            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-blue-600" />
            <span>Ma Trận Phân Bổ Nguyên Nhân Hao Hụt &amp; Đánh Giá Ngưỡng Định Mức</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-500">Đơn vị: VNĐ / Tỷ trọng %</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">Mã &amp; Nhóm Nguyên Nhân</th>
                <th className="p-3 text-right">Số Vụ Việc</th>
                <th className="p-3 text-right">Giá Trị Thất Thoát (VND)</th>
                <th className="p-3 text-center">Tỷ Trọng</th>
                <th className="p-3">Trung Tâm Chi Phí Quản Lý</th>
                <th className="p-3">Hạn Mức Định Mức</th>
                <th className="p-3 text-center">Đánh Giá Ngưỡng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {reasonBreakdown.map((r) => {
                const isExceed = r.status === 'EXCEED_LIMIT';
                const isSurplus = r.status === 'SURPLUS_POSITIVE';

                return (
                  <tr
                    key={r.code}
                    className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors ${
                      isExceed ? 'border-l-4 border-rose-500 bg-rose-50/15 dark:bg-rose-950/15' :
                      isSurplus ? 'border-l-4 border-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/15' :
                      'border-l-4 border-blue-500'
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {r.code}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {r.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        {r.description}
                      </div>
                    </td>

                    <td className="p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {r.count}
                    </td>

                    <td className="p-3 text-right font-mono tabular-nums font-bold text-xs">
                      <span className={r.totalLossValue < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {r.totalLossValue > 0 ? '-' : '+'}{Math.abs(r.totalLossValue).toLocaleString('vi-VN')} ₫
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isSurplus ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            style={{ width: `${r.percentage}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                          {r.percentage}%
                        </span>
                      </div>
                    </td>

                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                      {r.responsibleCostCenter}
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {r.benchmarkLimit}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isExceed 
                          ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700' 
                          : isSurplus
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                          : 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700'
                      }`}>
                        {isExceed ? 'VƯỢT ĐỊNH MỨC' : isSurplus ? 'THẶNG DƯ GHI TĂNG' : 'TRONG ĐỊNH MỨC'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Center Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {costCenterBreakdown.map((cc, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{cc.name}</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{cc.share}</span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500">{cc.count} Vụ việc</span>
              <span className="font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                {cc.totalLoss.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
