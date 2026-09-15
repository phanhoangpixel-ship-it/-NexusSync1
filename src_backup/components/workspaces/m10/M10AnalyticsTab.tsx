import React from 'react';
import { DollarSign, TrendingUp, BarChart3, ShieldCheck, CheckCircle2, ShoppingBag, PieChart } from 'lucide-react';

interface M10AnalyticsTabProps {
  rfqsCount: number;
  bidsCount: number;
  awardsCount: number;
  totalAwardValue: number;
}

export const M10AnalyticsTab: React.FC<M10AnalyticsTabProps> = ({
  rfqsCount,
  bidsCount,
  awardsCount,
  totalAwardValue,
}) => {
  const bidsPerRfq = rfqsCount > 0 ? (bidsCount / rfqsCount).toFixed(1) : '0';
  const estimatedSavingsAmount = totalAwardValue * 0.125;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Phân tích Sourcing &amp; Tiết kiệm Ngân sách (Savings Analytics)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đo lường hiệu quả đàm phán thương mại và bảo toàn biên lợi nhuận thu mua
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 self-start sm:self-auto">
          BENCHMARK: 12.5% SAVINGS
        </span>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tổng Gói thầu RFQ</span>
          <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xl">{rfqsCount} Gói</p>
          <span className="text-[10px] text-slate-400">Nhu cầu mua sắm tập trung</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Hồ sơ Chào giá (Bids)</span>
          <p className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 text-xl">{bidsCount} Bids</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">~{bidsPerRfq} Bids / RFQ</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase dark:text-slate-400">Đã Trao thầu (Awards)</span>
          <p className="font-mono tabular-nums font-bold text-purple-700 dark:text-purple-400 text-xl">{awardsCount} Awards</p>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">Đồng bộ M08 PO</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase dark:text-slate-400">Tiết kiệm Ước tính</span>
          <p className="font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400 text-xl">12.5%</p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
            {estimatedSavingsAmount > 0 ? `~${(estimatedSavingsAmount / 1e6).toFixed(1)}M đ` : 'Tối ưu ngân sách'}
          </span>
        </div>
      </div>

      {/* Strategic Sourcing Insights Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel 1: Sourcing Performance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Chỉ Số Hiệu Quả Đàm Phán &amp; Cạnh Tranh
            </h4>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-300">Tỷ lệ nộp hồ sơ cạnh tranh bình quân:</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{bidsPerRfq} Nhà cung cấp / RFQ</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-300">Thời gian đóng gói thầu &amp; thẩm định:</span>
              <span className="font-mono font-bold text-blue-700 dark:text-blue-400">4.2 Ngày làm việc</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-300">Tỷ lệ chênh lệch giá sàn so với ngân sách trần:</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">-12.5% (Tối ưu)</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Sourcing Governance & Integration */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Kiểm Soát Tuân Thủ &amp; Tích Hợp Chuỗi Cung Ứng
            </h4>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-2 text-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Hội đồng chấm thầu áp dụng chuẩn 4 tiêu chí (Giá, Chất lượng, Giao hàng, Bảo hành) với tổng trọng số 100%.</span>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-start gap-2 text-indigo-950 dark:text-indigo-200">
              <ShoppingBag className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>Sự kiện <code className="font-mono font-bold">SOURCING_AWARD_APPROVED</code> kích hoạt quy trình tạo Đơn Đặt Hàng M08 PO tự động, loại bỏ nhập liệu trùng lặp.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
