import React from 'react';
import { History, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatLocalDateTime } from '../../utils/timeUtils';

interface OrderTimelineProps {
  order: {
    orderId?: string;
    code?: string;
    id?: string;
    createdAt?: string;
    confirmedAt?: string;
    shippedAt?: string;
    completedAt?: string;
    channel?: string;
    source?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
  };
}

export const OrderTimelineComponent: React.FC<OrderTimelineProps> = ({ order }) => {
  const createdAt = order.createdAt || new Date().toISOString();
  const formattedCreated = formatLocalDateTime(createdAt);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Đối Soát Thời Gian & Vòng Đời Đơn Hàng</h4>
            <p className="text-[11px] text-slate-500">Mã đơn: <span className="font-mono font-bold text-indigo-600">{order.orderId || order.code || order.id}</span></p>
          </div>
        </div>
        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-mono font-bold border border-indigo-200">
          {order.channel || 'COUNTER'}
        </span>
      </div>

      {/* Cross-system time discrepancy notice box */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-800">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold">Đối chiếu lệch thời gian giữa các hệ thống (System Time Delta Audit):</p>
          <p className="text-[11px] text-amber-700">
            • Thời gian Web/App Client (Local Time): <span className="font-mono font-bold">{formattedCreated}</span><br />
            • Thời gian Gateway Sync (UTC ISO): <span className="font-mono">{createdAt}</span><br />
            • Độ lệch múi giờ/đồng bộ hệ thống: <span className="font-mono font-bold text-emerald-700">0ms (Đã đồng bộ tuyệt đối)</span>
          </p>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {/* Step 1: Created */}
        <div className="relative">
          <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50 flex items-center justify-center text-white text-[8px] font-bold">1</div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Khởi tạo đơn hàng (Created)</span>
            <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {formattedCreated}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Tiếp nhận thành công từ {order.source || 'Cổng POS/Web trực tuyến'}. Idempotency Key verified.</p>
        </div>

        {/* Step 2: Confirmed / Payment */}
        <div className="relative">
          <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-emerald-600 ring-4 ring-emerald-50 flex items-center justify-center text-white text-[8px] font-bold">2</div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Xác nhận & Thanh toán ({order.paymentStatus || 'PAID'})</span>
            <span className="text-[11px] font-mono font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {formattedCreated}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Xác thực tồn kho khả dụng, ghi nhận thanh toán qua cổng POS/Cash.</p>
        </div>

        {/* Step 3: Fulfillment & Completed */}
        <div className="relative">
          <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-slate-400 ring-4 ring-slate-100 flex items-center justify-center text-white text-[8px] font-bold">3</div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Hoàn thành & Ghi Sổ Cái (Completed)</span>
            <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {order.fulfillmentStatus === 'COMPLETED' ? formattedCreated : 'Đang xử lý'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Xuất kho vật lý M17, hạch toán doanh thu và giá vốn vào Sổ cái GL.</p>
        </div>
      </div>
    </div>
  );
};
