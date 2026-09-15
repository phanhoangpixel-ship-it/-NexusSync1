import React from 'react';
import { X, Receipt, ShieldCheck, RefreshCw, Key } from 'lucide-react';

interface M13VatIssueModalProps {
  isOpen: boolean;
  order: any | null;
  onClose: () => void;
  taxCode: string;
  setTaxCode: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  rate: number;
  setRate: (v: number) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  isSigningHsm: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const M13VatIssueModal: React.FC<M13VatIssueModalProps> = ({
  isOpen,
  order,
  onClose,
  taxCode,
  setTaxCode,
  address,
  setAddress,
  email,
  setEmail,
  rate,
  setRate,
  paymentMethod,
  setPaymentMethod,
  isSigningHsm,
  onSubmit,
}) => {
  if (!isOpen || !order) return null;

  const cleanTotal =
    parseFloat(order.totalAmount ? String(order.totalAmount).replace(/[^0-9]/g, '') : '0') || 0;
  const subtotal = Math.round(cleanTotal / (1 + rate / 100));
  const vatAmount = cleanTotal - subtotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Header matching M12 pattern */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-[#1e293b] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
                  NGHỊ ĐỊNH 123/2020/NĐ-CP • THÔNG TƯ 78
                </span>
                <span className="text-xs text-slate-300 font-mono">Đơn hàng: {order.id}</span>
              </div>
              <h3 className="text-base font-bold tracking-tight text-white mt-0.5">
                Phát Hành Hóa Đơn Điện Tử VAT Có Mã CQT
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={onSubmit} className="p-6 space-y-4 text-xs">
          {/* Bên bán */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Đơn Vị Bán Hàng (NexusSync ERP HQ)
            </span>
            <p className="font-bold text-slate-900 dark:text-white text-xs">
              CÔNG TY CỔ PHẦN CÔNG NGHỆ & GIẢI PHÁP NEXUSSYNC ERP
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] text-slate-600 dark:text-slate-400">
              <span>
                Mã số thuế: <strong className="font-mono tabular-nums text-slate-900 dark:text-white">0108899888</strong>
              </span>
              <span>
                Ký hiệu mẫu: <strong className="font-mono tabular-nums text-slate-900 dark:text-white">1C26TAA</strong>
              </span>
            </div>
          </div>

          {/* Bên mua */}
          <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
              Thông Tin Khách Hàng (Người Mua Hàng)
            </span>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên Đơn vị / Khách hàng
              </label>
              <input
                type="text"
                disabled
                value={order.customerName}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã số thuế (Bắt buộc để cấp mã CQT)
                </label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  placeholder="0108765432"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono tabular-nums font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email nhận HĐ điện tử (XML & PDF)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="invoicing@customer.vn"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono tabular-nums focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Địa chỉ đăng ký kinh doanh
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số 45 Đường Giải Phóng, TP. Hà Nội"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Thuế suất & Phương thức thanh toán */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thuế suất Giá trị gia tăng (VAT Rate)
              </label>
              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value={10}>Thuế suất 10% (Tiêu chuẩn)</option>
                <option value={8}>Thuế suất 8% (Nghị quyết giảm thuế)</option>
                <option value={5}>Thuế suất 5%</option>
                <option value={0}>Thuế suất 0%</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phương thức thanh toán
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="BANK_TRANSFER">Chuyển khoản (TM/CK)</option>
                <option value="CASH">Tiền mặt (TM)</option>
              </select>
            </div>
          </div>

          {/* Bảng tính toán tiền */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tiền hàng chưa thuế (Subtotal):</span>
              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {subtotal.toLocaleString('vi-VN')} VND
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tiền thuế GTGT ({rate}%):</span>
              <span className="font-mono tabular-nums font-bold text-purple-700 dark:text-purple-400">
                {vatAmount.toLocaleString('vi-VN')} VND
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Tổng tiền thanh toán (Total):</span>
              <span className="font-mono tabular-nums text-blue-700 dark:text-blue-400">
                {cleanTotal.toLocaleString('vi-VN')} VND
              </span>
            </div>
          </div>

          {/* Thông tin ký số HSM */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <div className="text-[11px]">
              <strong className="block">Ký số điện tử Cloud HSM & Cấp mã Cơ quan Thuế</strong>
              <span>Hóa đơn được ký số tự động và gửi dữ liệu lên cổng eTax của Tổng cục Thuế.</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSigningHsm}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSigningHsm ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang Ký Số HSM & Cấp Mã CQT...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Ký Số HSM & Xuất Hóa Đơn VAT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
