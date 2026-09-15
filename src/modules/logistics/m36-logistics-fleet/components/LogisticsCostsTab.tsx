import React from 'react';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Plus,
  Fuel,
  CreditCard,
} from 'lucide-react';
import { VetcTransaction, FuelTransaction, formatVND } from './types';

interface LogisticsCostsTabProps {
  vetcTxs: VetcTransaction[];
  fuelTxs: FuelTransaction[];
  isLoading?: boolean;
  onSyncVetc: () => void;
  onReconcileVetc: () => void;
  onOpenNewFuelModal: () => void;
}

export const LogisticsCostsTab: React.FC<LogisticsCostsTabProps> = ({
  vetcTxs,
  fuelTxs,
  isLoading,
  onSyncVetc,
  onReconcileVetc,
  onOpenNewFuelModal,
}) => {
  return (
    <div className="space-y-6">
      {/* VETC / EPASS TOLL INTEGRATION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Đối Soát Chi Phí Cầu Đường VETC / ePass</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tự động kết nối API Cổng Thu Phí Không Dừng BOT và đối soát giao dịch theo lệnh vận chuyển
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onSyncVetc}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer border border-slate-300 dark:border-slate-600"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Đồng Bộ Giao Dịch</span>
            </button>
            <button
              onClick={onReconcileVetc}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đối Soát Tự Động</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">Mã Giao Dịch BOT</th>
                  <th className="py-3 px-4">Nhà Cung Cấp</th>
                  <th className="py-3 px-4">Trạm Thu Phí</th>
                  <th className="py-3 px-4">Biển Số Xe</th>
                  <th className="py-3 px-4">Thời Gian Qua Trạm</th>
                  <th className="py-3 px-4 text-right">Cước Phí (VND)</th>
                  <th className="py-3 px-4 text-center">Trạng Thái Đối Soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
                {vetcTxs.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                      {v.transactionCode}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                      {v.provider}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {v.tollStation}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {v.plateNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {v.passTime}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-right font-bold text-rose-600 dark:text-rose-400">
                      {formatVND(v.amountVND)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.status === 'RECONCILED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : v.status === 'AUTO_MATCHED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {vetcTxs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Chưa có giao dịch BOT nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FUEL LEDGER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Fuel className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Nhật Ký Nhiên Liệu (Fuel Ledger)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ghi nhận lượng dầu Diesel nạp vào xe, đối chiếu định mức L/100km
            </p>
          </div>
          <button
            onClick={onOpenNewFuelModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Giao Dịch Nạp Dầu</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">Biển Số Xe</th>
                  <th className="py-3 px-4">Ngày Nạp Dầu</th>
                  <th className="py-3 px-4">Số Lít</th>
                  <th className="py-3 px-4 text-right">Đơn Giá / Lít</th>
                  <th className="py-3 px-4 text-right">Thành Tiền</th>
                  <th className="py-3 px-4 text-right">KM Khi Nạp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
                {fuelTxs.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {f.plateNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {f.fuelDate}
                    </td>
                    <td className="py-3 px-4 font-semibold font-mono text-slate-900 dark:text-white">
                      {f.liters} Lít
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-right font-medium text-slate-600 dark:text-slate-300">
                      {formatVND(f.pricePerLiter)}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatVND(f.totalAmount)}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-right font-medium text-slate-700 dark:text-slate-300">
                      {f.mileageAtRefuel?.toLocaleString('vi-VN')} km
                    </td>
                  </tr>
                ))}
                {fuelTxs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Chưa có giao dịch nhiên liệu nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
