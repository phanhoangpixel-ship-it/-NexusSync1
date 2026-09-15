import React, { useState } from 'react';
import { Search, Calculator, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Tag, DollarSign, RefreshCw, FileText } from 'lucide-react';
import { PriceResolutionQuery, PriceResolutionResult } from '../../../../types/pricingManagement';

interface PricingAuditAndSimulatorTabProps {
  onExecuteResolution: (query: PriceResolutionQuery) => Promise<PriceResolutionResult>;
}

export const PricingAuditAndSimulatorTab: React.FC<PricingAuditAndSimulatorTabProps> = ({
  onExecuteResolution
}) => {
  const [customerId, setCustomerId] = useState('');
  const [customerGroup, setCustomerGroup] = useState('VIP');
  const [productId, setProductId] = useState('PROD-RAM-16');
  const [quantity, setQuantity] = useState(1);
  const [uom, setUom] = useState('Cây (PCS)');
  const [transactionDate, setTransactionDate] = useState('2026-08-30');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PriceResolutionResult | null>(null);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await onExecuteResolution({
        customerId: customerId || undefined,
        customerGroup: customerGroup || undefined,
        productId,
        quantity: Number(quantity),
        uom,
        transactionDate,
        currency: 'VND'
      });
      setResult(res);
    } catch (err) {
      console.error("Resolution error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informative Header with Dynamic 6-Step Waterfall Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Động Cơ Phân Giải Giá Độc Quyền (Authoritative 6-Step Price Resolution Waterfall)
            </h3>
            {result && (
              <span className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                Đã phân giải xong
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Cung cấp giá bán chính thức cho phân hệ Sales Orders (O2C), Bán lẻ POS và Hóa đơn. Động cơ tự động dò tìm thứ tự ưu tiên 6 cấp từ Hợp đồng riêng đến Bảng giá tiêu chuẩn.
          </p>
        </div>

        {/* Dynamic 6-Step Hierarchy visual bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px]">
          {[
            { step: 1, label: 'Hợp đồng riêng', desc: 'Customer Contract', keyPrefix: '1.' },
            { step: 2, label: 'Nhóm khách hàng', desc: 'Customer Group', keyPrefix: '2.' },
            { step: 3, label: 'Bậc số lượng', desc: 'Quantity Breaks', keyPrefix: '3.' },
            { step: 4, label: 'Khuyến mãi có hạn', desc: 'Promotions', keyPrefix: '4.' },
            { step: 5, label: 'Quy tắc danh mục', desc: 'Category Rules', keyPrefix: '5.' },
            { step: 6, label: 'Giá niêm yết chuẩn', desc: 'Default Standard', keyPrefix: '6.' }
          ].map((s) => {
            const isWinner = result?.resolutionStep.startsWith(s.keyPrefix);
            const winningStepNum = result ? parseInt(result.resolutionStep[0], 10) : 0;
            const isEvaluated = result ? s.step < winningStepNum : false;
            const isSkipped = result ? s.step > winningStepNum : false;

            return (
              <div
                key={s.step}
                className={`p-2.5 rounded-xl border transition-all text-center flex flex-col justify-between ${
                  isWinner
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                    : isEvaluated
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-500 opacity-70'
                    : isSkipped
                    ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/60 dark:border-slate-700/60 text-slate-400 opacity-50'
                    : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isWinner
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Bậc {s.step}
                    </span>
                    {isWinner && (
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                        Trúng
                      </span>
                    )}
                  </div>
                  <span className={`font-bold block ${isWinner ? 'text-indigo-950 dark:text-indigo-200 text-xs' : 'text-slate-800 dark:text-slate-200'}`}>
                    {s.label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">{s.desc}</span>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px]">
                  {isWinner ? (
                    <span className="text-indigo-700 dark:text-indigo-300 font-bold">✓ Áp dụng giá</span>
                  ) : isEvaluated ? (
                    <span className="text-slate-400">Không khớp</span>
                  ) : isSkipped ? (
                    <span className="text-slate-400">Bỏ qua (Dừng)</span>
                  ) : (
                    <span className="text-slate-400">Sẵn sàng</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Query Inputs */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-600" />
            Tham Số Giao Dịch Đầu Vào
          </h4>

          <form onSubmit={handleSimulate} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Khách Hàng (Tùy Chọn)</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
              >
                <option value="">-- Khách hàng vãng lai / Bán lẻ --</option>
                <option value="CUS-001">Công ty Cổ phần Công nghệ FPT (CUS-001)</option>
                <option value="CUS-002">Tập đoàn Viễn thông Quân đội Viettel (CUS-002)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nhóm Khách Hàng</label>
              <select
                value={customerGroup}
                onChange={(e) => setCustomerGroup(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
              >
                <option value="VIP">VIP (Khách hàng đặc biệt)</option>
                <option value="WHOLESALE">WHOLESALE (Khách sỉ đại lý)</option>
                <option value="RETAIL">RETAIL (Khách lẻ tiêu chuẩn)</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR (Nhà phân phối)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sản Phẩm & SKU *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
              >
                <option value="PROD-RAM-16">Bộ nhớ RAM DDR5 16GB Kingston Fury (SKU: RAM-16GB-DDR5)</option>
                <option value="PROD-SSD-1TB">Ổ cứng SSD Samsung 990 Pro 1TB NVMe (SKU: SSD-1TB-990P)</option>
                <option value="PROD-CPU-I7">CPU Intel Core i7 14700K (SKU: CPU-I7-14700K)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số Lượng Mua *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đơn Vị Tính</label>
                <input
                  type="text"
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày Giao Dịch Giả Định</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang truy vấn động cơ giá...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Chạy Mô Phỏng Dò Giá (Execute Waterfall)
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Kết Quả Phân Giải Giá Cuối Cùng & Vết Dò (Waterfall Trace Result)
            </h4>

            {result ? (
              <div className="space-y-4">
                <div className="bg-indigo-50/80 dark:bg-indigo-950/60 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold uppercase tracking-wide block">Giá Bán Chính Thức Đã Phân Giải:</span>
                    <div className="text-2xl font-black text-indigo-950 dark:text-indigo-200 font-mono mt-0.5">{formatVND(result.finalUnitPrice)}</div>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Quyết định bởi bậc: <strong>{result.resolutionStep}</strong></span>
                  </div>
                  <div className="text-right sm:border-l sm:border-indigo-200 dark:sm:border-indigo-800 sm:pl-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Biên LN Gộp (Margin):</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 font-mono text-base">{result.actualMarginPercent.toFixed(2)}%</strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Giá vốn cơ sở: {formatVND(result.costBasis)}</span>
                  </div>
                </div>

                {/* Audit Explanation Steps */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Nhật ký truy vết từng bước (Waterfall Trace Logs):</span>
                  {result.traceLog.map((log, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200">{log}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold">Đã kiểm tra</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <Calculator className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-sm font-medium">Chưa chạy mô phỏng phân giải giá.</p>
                <p className="text-xs">Vui lòng nhập tham số giao dịch ở cột bên trái và bấm "Chạy Mô Phỏng Dò Giá".</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Tuân thủ nguyên tắc Single-Writer Authority</span>
            <span className="font-mono">Engine: PricingService.resolvePrice()</span>
          </div>
        </div>
      </div>
    </div>
  );
};
