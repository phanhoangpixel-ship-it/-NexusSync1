import React, { useState } from 'react';
import { Truck, CheckCircle2, DollarSign, RefreshCw, X, ArrowRight, ShieldCheck, MapPin, Package, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyFormatter';

interface M13LastMileDeliveryCodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M13LastMileDeliveryCodModal: React.FC<M13LastMileDeliveryCodModalProps> = ({
  isOpen,
  onClose,
  onNotify
}) => {
  if (!isOpen) return null;

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [carrierShipments, setCarrierShipments] = useState([
    {
      waybillCode: 'VP-88220011',
      carrier: 'Viettel Post',
      soCode: 'SO-2026-0089',
      recipient: 'Nguyễn Văn Minh (Hà Nội)',
      codAmount: 24000000,
      deliveryStatus: 'DELIVERED', // Đã phát thành công
      codStatus: 'COLLECTED_BY_CARRIER', // Đã thu tiền COD
      settlementStatus: 'PENDING_RECONCILIATION',
      deliveredAt: '2026-09-27 10:30'
    },
    {
      waybillCode: 'GHN-99114422',
      carrier: 'Giao Hàng Nhanh (GHN)',
      soCode: 'SO-2026-0091',
      recipient: 'Trần Thị Thu Hà (Đà Nẵng)',
      codAmount: 18500000,
      deliveryStatus: 'DELIVERED',
      codStatus: 'COLLECTED_BY_CARRIER',
      settlementStatus: 'PENDING_RECONCILIATION',
      deliveredAt: '2026-09-27 09:15'
    },
    {
      waybillCode: 'GHTK-33445511',
      carrier: 'Giao Hàng Tiết Kiệm (GHTK)',
      soCode: 'SO-2026-0094',
      recipient: 'Phạm Quốc Bảo (Bình Dương)',
      codAmount: 12200000,
      deliveryStatus: 'IN_TRANSIT',
      codStatus: 'PENDING_DELIVERY',
      settlementStatus: 'NOT_ELIGIBLE',
      deliveredAt: 'Dự kiến: Hôm nay'
    }
  ]);

  const totalCodPending = carrierShipments
    .filter(s => s.codStatus === 'COLLECTED_BY_CARRIER')
    .reduce((sum, s) => sum + s.codAmount, 0);

  const handleReconcileCod = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setCarrierShipments(prev => prev.map(s => {
        if (s.codStatus === 'COLLECTED_BY_CARRIER') {
          return { ...s, settlementStatus: 'RECONCILED_AND_CLEARED' };
        }
        return s;
      }));
      setIsSyncing(false);
      onNotify('success', 'Đối Soát COD Thành Công', `Đã đối soát và gạch nợ tiền COD ${formatCurrency(totalCodPending)} vào tài khoản ngân hàng (Nợ 1121 / Có 131-COD).`);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Quản Lý Giao Hàng Chặng Cuối &amp; Đối Soát Tiền Thu Hộ (Last-Mile Delivery &amp; COD)
              </h3>
              <p className="text-[11px] text-slate-300">Đồng bộ trạng thái vận đơn với Viettel Post / GHN / GHTK &amp; Tự động gạch nợ dòng tiền COD</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Tổng Vận Đơn Theo Dõi</span>
              <span className="text-base font-mono tabular-nums font-bold text-slate-900 dark:text-white">{carrierShipments.length} Vận Đơn</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 block uppercase font-bold">Tiền COD Đang Chờ Đối Soát</span>
              <span className="text-base font-mono tabular-nums font-bold text-amber-800 dark:text-amber-300">{formatCurrency(totalCodPending)}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">Trạng Thái Kết Nối API Đơn Vị</span>
              <span className="text-base font-mono tabular-nums font-bold text-emerald-800 dark:text-emerald-300">3/3 Hãng Hoạt Động (Live)</span>
            </div>
          </div>

          {/* Shipments Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">Mã Vận Đơn &amp; Hãng</th>
                  <th className="p-2.5">Đơn Hàng &amp; Người Nhận</th>
                  <th className="p-2.5 text-right">Tiền Thu Hộ (COD)</th>
                  <th className="p-2.5 text-center">Giao Hàng</th>
                  <th className="p-2.5 text-center">Thu Tiền COD</th>
                  <th className="p-2.5 text-center">Trạng Thái Đối Soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {carrierShipments.map(s => (
                  <tr key={s.waybillCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5">
                      <div className="font-mono font-bold text-orange-600 dark:text-orange-400">{s.waybillCode}</div>
                      <div className="text-slate-500 text-[10px]">{s.carrier}</div>
                    </td>
                    <td className="p-2.5">
                      <div className="font-mono font-semibold text-slate-900 dark:text-white">{s.soCode}</div>
                      <div className="text-slate-500 text-[10px]">{s.recipient}</div>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(s.codAmount)}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.deliveryStatus === 'DELIVERED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'}`}>
                        {s.deliveryStatus === 'DELIVERED' ? 'Đã Giao' : 'Đang Giao'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.codStatus === 'COLLECTED_BY_CARRIER' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                        {s.codStatus === 'COLLECTED_BY_CARRIER' ? 'Đã Thu Tiền' : 'Chưa Thu'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.settlementStatus === 'RECONCILED_AND_CLEARED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                        {s.settlementStatus === 'RECONCILED_AND_CLEARED' ? 'Đã Đối Soát Sổ Cái' : 'Chờ Khớp Tiền'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleReconcileCod}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            {isSyncing ? 'Đang Đối Soát...' : 'Đối Soát & Gạch Nợ Tiền COD Tự Động'}
          </button>
        </div>
      </div>
    </div>
  );
};
