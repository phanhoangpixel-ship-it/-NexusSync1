import React, { useState, useEffect } from 'react';
import { RFQItem, ReverseAuctionHistory, ReverseAuctionRoundItem } from './m10Types';
import { 
  X, RefreshCw, Zap, TrendingDown, Award, Calendar, DollarSign, 
  Clock, ShieldCheck, ArrowDownRight, Layers, PlayCircle, AlertCircle, Building
} from 'lucide-react';

interface M10ReverseAuctionModalProps {
  rfq: RFQItem | null;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onRoundOpened?: () => void;
}

export const M10ReverseAuctionModal: React.FC<M10ReverseAuctionModalProps> = ({
  rfq,
  onClose,
  onNotify,
  onRoundOpened
}) => {
  const [history, setHistory] = useState<ReverseAuctionHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpeningRound, setIsOpeningRound] = useState(false);
  const [showOpenRoundForm, setShowOpenRoundForm] = useState(false);

  // Form states for opening new round
  const [targetReductionPercent, setTargetReductionPercent] = useState<number>(5);
  const [customCeilingPrice, setCustomCeilingPrice] = useState<string>('');
  const [roundDeadline, setRoundDeadline] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const fetchHistory = async () => {
    if (!rfq?.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const rfqKey = rfq.dbId || rfq.id;
      const res = await fetch(`/api/sourcing/rfqs/${rfqKey}/reverse-auction`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        const err = await res.json();
        onNotify('warning', 'Thông báo', err.message || 'Chưa có lịch sử đấu thầu ngược cho gói thầu này.');
      }
    } catch (err: any) {
      console.error('Error fetching reverse auction:', err);
      onNotify('danger', 'Lỗi', 'Không thể nạp dữ liệu lịch sử đấu thầu ngược.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [rfq?.id]);

  if (!rfq) return null;

  const currentRound = history?.currentRound || rfq.currentRound || 1;
  const nextRound = currentRound + 1;

  const handleOpenNewRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpeningRound(true);
    try {
      const token = localStorage.getItem('erp_token');
      const rfqKey = rfq.dbId || rfq.id;
      const payload = {
        targetReductionPercent: Number(targetReductionPercent) || 5,
        ceilingPrice: customCeilingPrice ? Number(customCeilingPrice) : undefined,
        deadline: roundDeadline || undefined,
        notes: notes.trim() || `Vòng đàm phán giá #${nextRound} (Reverse Auction)`,
        idempotencyKey: `AUCTION-RND-OPEN-${rfqKey}-${nextRound}-${Date.now()}`
      };

      const res = await fetch(`/api/sourcing/rfqs/${rfqKey}/reverse-auction/round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Lỗi mở vòng đấu thầu ngược');
      }

      onNotify(
        'success',
        `Mở Vòng ${nextRound} Thành Công`,
        `Đã kích hoạt vòng đàm phán giá #${nextRound}. Giá trần: ${data.ceilingPrice ? Number(data.ceilingPrice).toLocaleString('vi-VN') + ' ₫' : 'Tự động'}`
      );

      setShowOpenRoundForm(false);
      setCustomCeilingPrice('');
      setNotes('');
      await fetchHistory();
      if (onRoundOpened) onRoundOpened();
    } catch (err: any) {
      onNotify('danger', 'Mở Vòng Thất Bại', err.message);
    } finally {
      setIsOpeningRound(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="reverse-auction-title"
        className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="reverse-auction-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Đấu Thầu Ngược Đa Vòng (Multi-Round Reverse Auction)
                </h2>
                <span className="font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                  {rfq.id}
                </span>
                <span className="font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  VÒNG {currentRound}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {rfq.title} • Quản lý các vòng đàm phán giá giảm dần và tối ưu hóa chi phí mua sắm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Executive KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Vòng Hiện Tại
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  #{currentRound}
                </span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {rfq.status === 'OPEN_BIDDING' ? 'Đang mở thầu' : rfq.status}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Giá Thấp Nhất Vòng 1
              </span>
              <div className="mt-1 font-mono tabular-nums text-lg font-bold text-slate-700 dark:text-slate-300">
                {history?.round1Lowest ? Number(history.round1Lowest).toLocaleString('vi-VN') + ' ₫' : 'Chưa có'}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                Giá Thấp Nhất Hiện Tại
              </span>
              <div className="mt-1 font-mono tabular-nums text-lg font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {history?.currentLowest ? Number(history.currentLowest).toLocaleString('vi-VN') + ' ₫' : 'Chưa có'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                Tổng Tiết Kiệm (Savings)
              </span>
              <div className="mt-1 font-mono tabular-nums text-lg font-black text-purple-900 dark:text-purple-200 flex items-baseline gap-1">
                <span>{history?.totalSavingsAmount ? Number(history.totalSavingsAmount).toLocaleString('vi-VN') + ' ₫' : '0 ₫'}</span>
                {history?.totalSavingsPercent && history.totalSavingsPercent > 0 ? (
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-200/60 dark:bg-purple-900/60 px-1.5 py-0.5 rounded">
                    -{history.totalSavingsPercent}%
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action to Open New Round */}
          {!showOpenRoundForm ? (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl border border-purple-200 dark:border-purple-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <PlayCircle className="w-4 h-4 text-purple-700 dark:text-purple-300" />
                  Mở Vòng Đàm Phán Tiếp Theo (Vòng {nextRound})
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Kích hoạt đàm phán giá ngược để mời các nhà cung cấp chào giá cạnh tranh hơn. Hệ thống sẽ áp dụng giá trần tự động.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowOpenRoundForm(true)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Kích Hoạt Vòng {nextRound}</span>
              </button>
            </div>
          ) : (
            /* Open Round Form */
            <form onSubmit={handleOpenNewRound} className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/50 pb-2">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Cấu hình Vòng Đàm Phán #{nextRound}
                </span>
                <button
                  type="button"
                  onClick={() => setShowOpenRoundForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Tỷ Lệ Giảm Kỳ Vọng (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={targetReductionPercent}
                    onChange={e => setTargetReductionPercent(Number(e.target.value))}
                    className="w-full text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/30"
                    required
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Gợi ý: 3% - 10%</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Giá Trần Cho Phép (VND)
                  </label>
                  <input
                    type="number"
                    value={customCeilingPrice}
                    onChange={e => setCustomCeilingPrice(e.target.value)}
                    placeholder={history?.currentLowest ? `Mặc định ≤ ${Number(history.currentLowest).toLocaleString('vi-VN')} ₫` : 'VD: 95000000'}
                    className="w-full text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Bỏ trống để tự tính từ giá tốt nhất vòng trước</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Hạn Chót Nộp Giá Vòng {nextRound}
                  </label>
                  <input
                    type="date"
                    value={roundDeadline}
                    onChange={e => setRoundDeadline(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Mặc định: 3 ngày sau</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Ghi Chú / Chỉ Dẫn Cho Nhà Cung Cấp
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="VD: Yêu cầu tối ưu phí vận chuyển & chiết khấu theo khối lượng đơn hàng"
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOpenRoundForm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isOpeningRound}
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isOpeningRound ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                  <span>Xác Nhận Mở Vòng {nextRound}</span>
                </button>
              </div>
            </form>
          )}

          {/* Multi-Round Traceability Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              Lịch Sử Biến Động Giá Qua Các Vòng (Round-by-Round Trajectory)
            </h4>

            {history?.bidsHistory && history.bidsHistory.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold">
                        <th className="p-3">Nhà Cung Cấp</th>
                        {history.rounds.map(r => (
                          <th key={r.roundNumber} className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span>Vòng {r.roundNumber}</span>
                              {r.roundNumber === currentRound && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              )}
                            </div>
                            <span className="text-[9px] font-normal normal-case block text-slate-400">
                              {r.status === 'ACTIVE' ? 'Đang mở' : 'Đã đóng'}
                            </span>
                          </th>
                        ))}
                        <th className="p-3 text-right">Tổng Mức Giảm</th>
                        <th className="p-3 text-center">Xếp Hạng Giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {history.bidsHistory.map(sup => {
                        const isLeading = sup.latestValue === history.currentLowest && history.currentLowest > 0;
                        return (
                          <tr
                            key={sup.supplierId}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${
                              isLeading ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                            }`}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {sup.supplierName}
                                </span>
                                <span className="font-mono tabular-nums text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700 px-1 rounded">
                                  {sup.supplierCode}
                                </span>
                              </div>
                            </td>

                            {history.rounds.map(r => {
                              const bidInRound = sup.roundBids[r.roundNumber];
                              const isLowestInRound = bidInRound && bidInRound.totalValue === r.lowestBid && r.lowestBid > 0;
                              return (
                                <td key={r.roundNumber} className="p-3 text-right font-mono tabular-nums">
                                  {bidInRound ? (
                                    <div>
                                      <span className={`font-bold ${isLowestInRound ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                        {Number(bidInRound.totalValue).toLocaleString('vi-VN')} ₫
                                      </span>
                                      {isLowestInRound && (
                                        <span className="text-[9px] font-bold block text-emerald-600 dark:text-emerald-400">
                                          ★ Tốt nhất
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">Chưa nộp</span>
                                  )}
                                </td>
                              );
                            })}

                            <td className="p-3 text-right font-mono tabular-nums font-bold">
                              {sup.totalReductionAmount > 0 ? (
                                <div className="text-emerald-700 dark:text-emerald-400">
                                  <span>-{Number(sup.totalReductionAmount).toLocaleString('vi-VN')} ₫</span>
                                  <span className="text-[10px] ml-1 bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                                    -{sup.totalReductionPercent}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-normal">Giữ nguyên</span>
                              )}
                            </td>

                            <td className="p-3 text-center">
                              {isLeading ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                                  <Award className="w-3 h-3 text-emerald-600" />
                                  Dẫn đầu
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Đang theo dõi</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-xs">
                Chưa có dữ liệu chào thầu của các nhà cung cấp để hiển thị quỹ đạo đàm phán giá.
              </div>
            )}
          </div>

          {/* Sourcing Compliance Notice */}
          <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl flex items-start gap-2.5 text-purple-900 dark:text-purple-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-purple-700 dark:text-purple-300 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block">Tính Toàn Vẹn &amp; Bất Biến Của Quy Trình Đấu Thầu:</span>
              Toàn bộ lịch sử nộp giá qua các vòng được niêm phong mật mã vào sự kiện outbox (`REVERSE_AUCTION_ROUND_OPENED`, `BID_SUBMITTED`) và đối soát trực tiếp theo tiêu chuẩn M10 Sourcing &amp; M09 Supplier Governance.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Hệ thống tự động đồng bộ giá trần cho các nhà cung cấp dự thầu.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
