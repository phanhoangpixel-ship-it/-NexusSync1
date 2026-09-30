import React, { useState } from 'react';
import { UserCheck, FileText, Download, CheckCircle2, Clock, Truck, ShieldCheck, X, RefreshCw, ShoppingCart, DollarSign, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyFormatter';

interface M13CustomerSelfServicePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M13CustomerSelfServicePortalModal: React.FC<M13CustomerSelfServicePortalModalProps> = ({
  isOpen,
  onClose,
  onNotify
}) => {
  if (!isOpen) return null;

  const [activeCustomer] = useState({
    code: 'CUST-001',
    name: 'Công ty Cổ phần Công nghệ Bán dẫn Á Châu',
    taxCode: '0109988776',
    creditLimit: 5000000000,
    outstandingDebt: 1250000000,
    availableCredit: 3750000000,
    contactPerson: 'Hoàng Minh Tuấn (Giám Đốc Mua Hàng)'
  });

  const [recentOrders, setRecentOrders] = useState([
    {
      soCode: 'SO-2026-0089',
      orderDate: '2026-09-26',
      totalAmount: 480000000,
      deliveryStatus: 'Đang Vận Chuyển',
      carrier: 'Viettel Post (Mã: VP-88220011)',
      vatInvoiceNo: 'HD-2026-00412',
      paymentStatus: 'Đã Cọc 50%',
      itemsCount: 4
    },
    {
      soCode: 'SO-2026-0075',
      orderDate: '2026-09-18',
      totalAmount: 920000000,
      deliveryStatus: 'Đã Giao Thành Công',
      carrier: 'Đội Xe NexusSync Logistics',
      vatInvoiceNo: 'HD-2026-00388',
      paymentStatus: 'Đã Thanh Toán',
      itemsCount: 8
    }
  ]);

  const handleDownloadInvoice = (invoiceNo: string) => {
    onNotify('success', 'Đang Tải Hóa Đơn VAT', `Hóa đơn điện tử ${invoiceNo} (PDF ký số hợp lệ) đã được tải về máy.`);
  };

  const handleQuickReorder = (soCode: string) => {
    onNotify('success', 'Yêu Cầu Tái Đặt Hàng Thành Công', `Đã tạo bản nháp đơn hàng mới dựa trên ${soCode}. Nhân viên kinh doanh phụ trách sẽ liên hệ xác nhận trong 15 phút.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Cổng Thông Tin Khách Hàng Tự Phục Vụ (B2B Customer Portal)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/30 text-sky-200 border border-sky-400/30">
                  {activeCustomer.code}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">Theo dõi tiến độ đơn hàng, tra cứu hóa đơn GTGT, kiểm tra hạn mức công nợ trực tuyến</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Customer Profile & Credit Limit Overview */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{activeCustomer.name}</h4>
                <span className="text-[11px] text-slate-500">MST: {activeCustomer.taxCode} • Người liên hệ: {activeCustomer.contactPerson}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                Đối Tác VIP Hạng Kim Cương
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Hạn Mức Tín Dụng Cấp Phép:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">{formatCurrency(activeCustomer.creditLimit)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Dư Nợ Hiện Tại (TK 131):</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{formatCurrency(activeCustomer.outstandingDebt)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Hạn Mức Còn Được Đặt Hàng:</span>
                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">{formatCurrency(activeCustomer.availableCredit)}</span>
              </div>
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="space-y-3">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
              Danh Sách Đơn Hàng Gần Đây &amp; Hóa Đơn Ký Số:
            </span>

            <div className="space-y-3">
              {recentOrders.map(order => (
                <div
                  key={order.soCode}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{order.soCode}</span>
                      <span className="text-slate-500">Ngày đặt: {order.orderDate}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 border border-blue-300">
                      {order.deliveryStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-[11px] p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                    <div>
                      <span className="text-slate-500 block">Tổng Giá Trị:</span>
                      <strong className="font-mono text-slate-900 dark:text-white">{formatCurrency(order.totalAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Đơn Vị Vận Chuyển:</span>
                      <strong>{order.carrier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Hóa Đơn Điện Tử:</span>
                      <strong className="font-mono text-indigo-600 dark:text-indigo-400">{order.vatInvoiceNo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Trạng Thái Thanh Toán:</span>
                      <strong className="text-emerald-600">{order.paymentStatus}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(order.vatInvoiceNo)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-500" />
                      Tải Hóa Đơn GTGT (PDF)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickReorder(order.soCode)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Đặt Lại Đơn Hàng Nhanh
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Xác thực phiên bảo mật B2B Single Sign-On (SSO)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
