import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Layers,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  Building,
  TrendingDown,
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

interface MroCostLedgerTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const MroCostLedgerTab: React.FC<MroCostLedgerTabProps> = ({ onNotify }) => {
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/eam/ledger');
      if (res.ok) {
        const data = await res.json();
        setLedgerEntries(data.entries || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleSyncToGl = async () => {
    setIsSyncConfirmOpen(false);
    setIsSyncing(true);
    try {
      const res = await fetch('/api/eam/sync-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi hạch toán vào Sổ cái M30');
      }

      const data = await res.json();
      onNotify(
        'success',
        'Đồng bộ Sổ cái M30 thành công',
        `Đã hạch toán thành công tổng chi phí MRO ${data.syncedAmount?.toLocaleString('vi-VN')} ₫ vào TK 627 (Chi phí sản xuất chung - Bảo trì).`
      );
      fetchLedger();
    } catch (err: any) {
      onNotify('danger', 'Đồng bộ thất bại', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* L1 COMMAND STRIP */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sổ Chi Phí Bảo Trì MRO &amp; Hạch Toán VAS 211 / 627
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kiểm soát ngân sách phụ tùng thay thế, vật tư tiêu hao và tích hợp Sổ Cái Tổng Hợp M30 GL
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSyncConfirmOpen(true)}
          disabled={isSyncing}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Building className="w-4 h-4" />
          <span>{isSyncing ? 'Đang Hạch Toán...' : 'Đồng Bộ Hạch Toán Sang M30 Sổ Cái'}</span>
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Tổng Chi Phí MRO Đã Hạch Toán
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary?.totalMroCost ? summary.totalMroCost.toLocaleString('vi-VN') : '0'} ₫
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Hạch toán vào Nợ TK 627</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Chi Phí Phụ Tùng (TK 152)
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {summary?.sparePartsCost ? summary.sparePartsCost.toLocaleString('vi-VN') : '0'} ₫
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Xuất kho phụ tùng bảo dưỡng</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Chi Phí Nhân Công (TK 334)
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {summary?.laborCost ? summary.laborCost.toLocaleString('vi-VN') : '0'} ₫
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Giờ công kỹ thuật viên</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Nguyên Giá Thiết Bị Toàn Xưởng (TK 211)
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {summary?.totalAssetCost ? (summary.totalAssetCost / 1000000000).toFixed(2) + ' Tỷ ₫' : '—'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Giá trị nguyên giá tài sản</span>
        </div>
      </div>

      {/* LEDGER ENTRIES TABLE */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs bg-white dark:bg-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Nhật Ký Chứng Từ Định Khoản Chi Phí Bảo Trì (GL Transactions)
          </h4>
          <button
            onClick={fetchLedger}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Số Chứng Từ</th>
                <th className="py-3 px-4">Ngày Hạch Toán</th>
                <th className="py-3 px-4">Diễn Giải Nghiệp Vụ</th>
                <th className="py-3 px-4 text-center">Tài Khoản Nợ</th>
                <th className="py-3 px-4 text-center">Tài Khoản Có</th>
                <th className="py-3 px-4 text-right">Số Tiền (VND)</th>
                <th className="py-3 px-4 text-center">Trạng Thái Sổ Cái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    Chưa có bút toán hạch toán chi phí bảo trì.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {entry.refCode || `EAM-GL-${String(idx + 1).padStart(4, '0')}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{entry.entryDate}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{entry.description}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {entry.debitAccount}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {entry.creditAccount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {entry.amount ? entry.amount.toLocaleString('vi-VN') : '0'} ₫
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        POSTED_TO_GL
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM SYNC TO GL */}
      <ConfirmDialog
        isOpen={isSyncConfirmOpen}
        title="Hạch toán chi phí MRO sang Sổ Cái Tổng Hợp M30?"
        message="Hệ thống sẽ ghi nhận toàn bộ chi phí phụ tùng xuất kho và dịch vụ sửa chữa vào tài khoản Nợ 627 (Chi phí SXC) và Có 152 / 334 / 331 theo đúng chuẩn mực VAS."
        variant="primary"
        confirmText="Xác Nhận Hạch Toán Sổ Cái"
        cancelText="Hủy"
        onConfirm={handleSyncToGl}
        onClose={() => setIsSyncConfirmOpen(false)}
      />
    </div>
  );
};
