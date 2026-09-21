import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Plus,
  Fuel,
  CreditCard,
  DollarSign,
  Receipt,
  ArrowRightLeft,
  Building2,
  Coins,
  Check
} from 'lucide-react';
import { VetcTransaction, FuelTransaction, formatVND } from './types';

interface CodRecord {
  id: number;
  orderId: number;
  orderCode: string;
  customerName: string;
  codAmount: number;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  status: 'PENDING_RECONCILE' | 'RECONCILED';
  collectedAt: string;
  settledAt?: string;
  glJournalCode?: string;
  notes?: string;
}

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
  const [codList, setCodList] = useState<CodRecord[]>([]);
  const [loadingCod, setLoadingCod] = useState(false);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [freightAllocating, setFreightAllocating] = useState(false);
  const [freightResultMsg, setFreightResultMsg] = useState<string | null>(null);

  const fetchCod = async () => {
    setLoadingCod(true);
    try {
      const res = await fetch('/api/logistics/cod-reconciliation');
      if (res.ok) {
        const data = await res.json();
        setCodList(data);
      }
    } catch (err) {
      console.warn("Lỗi tải danh sách COD:", err);
    } finally {
      setLoadingCod(false);
    }
  };

  useEffect(() => {
    fetchCod();
  }, []);

  const handleSettleCod = async (id: number) => {
    setSettlingId(id);
    try {
      const res = await fetch(`/api/logistics/cod-reconciliation/${id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await fetchCod();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettlingId(null);
    }
  };

  const handleRunFreightAllocation = async () => {
    setFreightAllocating(true);
    setFreightResultMsg(null);
    try {
      const res = await fetch('/api/logistics/freight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transportOrderId: 1,
          distanceKm: 45,
          weightKg: 3500,
          freightCost: 4500000,
          expenseType: 'FREIGHT',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFreightResultMsg(data.message || 'Đã phân bổ chi phí cước vận chuyển thành công qua M42/M30.');
      }
    } catch (err: any) {
      setFreightResultMsg('Lỗi phân bổ cước: ' + err.message);
    } finally {
      setFreightAllocating(false);
    }
  };

  const pendingCodAmount = codList.filter(c => c.status === 'PENDING_RECONCILE').reduce((sum, c) => sum + c.codAmount, 0);
  const reconciledCodAmount = codList.filter(c => c.status === 'RECONCILED').reduce((sum, c) => sum + c.codAmount, 0);

  return (
    <div className="space-y-6">
      {/* VETC / EPASS TOLL INTEGRATION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Đối Soát Chi Phí Cầu Đường VETC / ePass (M30 GL Reconcile)</span>
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
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {v.plateNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {v.passTime}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white">
                      {formatVND(v.amountVND)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          v.status === 'RECONCILED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                            : v.status === 'AUTO_MATCHED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {v.status === 'RECONCILED'
                          ? 'Đã Đối Soát GL'
                          : v.status === 'AUTO_MATCHED'
                          ? 'Khớp Tự Động'
                          : 'Chờ Đối Soát'}
                      </span>
                    </td>
                  </tr>
                ))}
                {vetcTxs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Chưa có giao dịch VETC / ePass nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* COD RECONCILIATION (M36-F12) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Đối Soát Tiền Thu Hộ COD &amp; Nhập Quỹ Sổ Cái (M30 GL Single-Writer)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                M36-F12
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tài xế thu hộ COD nộp về quỹ chi nhánh, hệ thống tự động sinh bút toán Nợ 1111 / Có 131 vào Sổ cái M30
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right pr-2">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Chờ Quyết Toán</div>
              <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{formatVND(pendingCodAmount)}</div>
            </div>
            <div className="text-right pl-2 border-l border-slate-200 dark:border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Đã Quyết Toán GL</div>
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatVND(reconciledCodAmount)}</div>
            </div>
            <button
              onClick={fetchCod}
              disabled={loadingCod}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Làm mới COD"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCod ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">Lệnh Vận Chuyển</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Tài Xế Thu Hộ</th>
                  <th className="py-3 px-4">Phương Tiện</th>
                  <th className="py-3 px-4 text-right">Số Tiền COD</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
                {codList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {c.orderCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {c.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div>{c.driverName}</div>
                      <div className="text-[10px] text-slate-400">{c.driverPhone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400">
                      {c.vehiclePlate}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                      {formatVND(c.codAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'RECONCILED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                      }`}>
                        {c.status === 'RECONCILED' ? 'Đã Quyết Toán M30' : 'Chờ Nhập Quỹ'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.status === 'PENDING_RECONCILE' ? (
                        <button
                          onClick={() => handleSettleCod(c.id)}
                          disabled={settlingId === c.id}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 mx-auto shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{settlingId === c.id ? 'Đang hạch toán...' : 'Quyết Toán GL'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">
                          {c.glJournalCode || 'M30-POSTED'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {codList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                      Không có khoản COD nào cần đối soát.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FREIGHT COST ALLOCATION (M36-F03 & M42/M30) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Phân Bổ Chi Phí Cước Vận Chuyển Hàng Hóa (Freight Costing M42 / M30)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                M36-F03
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ủy quyền tính toán chi phí cước Landed Cost cho M42 (Inbound) và hạch toán Nợ 6417 / Có 331 vào Sổ cái M30 (Outbound).
            </p>
          </div>
          <button
            onClick={handleRunFreightAllocation}
            disabled={freightAllocating}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
          >
            <ArrowRightLeft className={`w-4 h-4 ${freightAllocating ? 'animate-spin' : ''}`} />
            <span>{freightAllocating ? 'Đang Phân Bổ M42/M30...' : 'Chạy Phân Bổ Cước M42/M30'}</span>
          </button>
        </div>
        {freightResultMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{freightResultMsg}</span>
          </div>
        )}
      </div>

      {/* FUEL TRANSACTIONS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Fuel className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Nhật Ký Tiếp Nhiên Liệu &amp; Định Mức Dầu Hào Hụt</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ghi nhận giao dịch nạp dầu Diesel, số lít, đơn giá và số công-tơ-mét (Odometer) tại thời điểm nạp
            </p>
          </div>
          <button
            onClick={onOpenNewFuelModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi Nhận Đổ Dầu Mới</span>
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
