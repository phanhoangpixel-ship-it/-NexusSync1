import React from 'react';
import { X, Printer, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { TransportOrder } from '../../../../../types';
import { formatVNDCurrency as formatVND } from '../../../../../utils/currencyFormatter';

interface PrintDocumentModalProps {
  document: { type: 'ORDER' | 'POD'; order: TransportOrder } | null;
  onClose: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({ document, onClose }) => {
  if (!document) return null;

  const { type, order } = document;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <span>
              {type === 'ORDER' ? 'In Lệnh Vận Chuyển (Phiếu Điều Xe)' : 'In Biên Bản Nghiệm Thu & Giao Hàng (POD)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PAPER LAYOUT */}
        <div
          id="printable-document-area"
          className="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 font-sans text-xs"
        >
          {/* HEADER */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase">CÔNG TY CỔ PHẦN TẬP ĐOÀN NEXUSSYNC ERP</h2>
              <p className="text-[11px] text-slate-600">Phân hệ Logistics &amp; Quản lý Vận tải Hạm Đội (M36)</p>
              <p className="text-[11px] text-slate-600">Địa chỉ: KCN Nam Thăng Long, Bắc Từ Liêm, Hà Nội</p>
              <p className="text-[11px] text-slate-600 font-mono">Hotline điều vận: 1900 6868 - contact@nexussync.vn</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-md inline-block mb-1">
                MÃ LỆNH: {order.orderCode}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Ngày in: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}
              </p>
            </div>
          </div>

          {/* DOCUMENT TITLE */}
          <div className="text-center space-y-1">
            <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
              {type === 'ORDER' ? 'PHIẾU ĐIỀU ĐỘNG XE & LỆNH VẬN CHUYỂN' : 'BIÊN BẢN BÀN GIAO HÀNG HÓA & KÝ NHẬN (POD)'}
            </h1>
            <p className="text-[11px] text-slate-600 italic">
              (Lưu chuyển kèm hàng hóa và xuất trình khi kiểm tra liên ngành trên tuyến)
            </p>
          </div>

          {/* MAIN INFO GRID */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 bg-slate-50/50">
            <div className="space-y-1.5">
              <div>
                <span className="font-bold text-slate-700">Khách Hàng / Đơn Vị Nhận:</span>{' '}
                <span className="font-semibold">{order.customerName}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Điểm Xuất Phát (Kho cấp):</span>{' '}
                <span>{order.originAddress}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Điểm Giao Hàng Đến:</span>{' '}
                <span>{order.destinationAddress}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Điểm Dừng Phụ:</span>{' '}
                <span>{order.stops?.join(', ') || 'Tuyến thẳng không dừng'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div>
                <span className="font-bold text-slate-700">Biển Số Xe Vận Tải:</span>{' '}
                <span className="font-mono font-bold text-blue-700">{order.vehiclePlate || 'Chưa gán'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Tài Xế Phụ Trách:</span>{' '}
                <span>{order.driverName || 'Chưa gán'}</span>{' '}
                <span className="font-mono">({order.driverPhone || 'N/A'})</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Trọng Lượng / Thể Tích:</span>{' '}
                <span className="font-mono font-bold">{order.weightKg.toLocaleString('vi-VN')} kg</span> /{' '}
                <span className="font-mono">{order.volumeCbm} m³</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Cước Phí Vận Chuyển:</span>{' '}
                <span className="font-mono font-bold text-emerald-700">{formatVND(order.freightCost)}</span>
              </div>
            </div>
          </div>

          {/* POD RESULT (IF POD) */}
          {type === 'POD' && order.pod && (
            <div className="border border-emerald-300 bg-emerald-50/60 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>KẾT QUẢ NGHIỆM THU GIAO HÀNG TẠI ĐÍCH (POD)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="font-semibold text-slate-700">Người ký nhận:</span>{' '}
                  <span className="font-bold">{order.pod.receiverName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Thời gian nhận:</span>{' '}
                  <span className="font-mono">{order.pod.deliveredAt}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Trạng thái:</span>{' '}
                  <span className="font-bold text-emerald-700">{order.pod.status}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Ghi chú:</span>{' '}
                  <span>{order.pod.notes || 'Không có ghi chú thêm'}</span>
                </div>
              </div>
            </div>
          )}

          {/* SIGNATURE SECTION */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center">
            <div className="space-y-12">
              <p className="font-bold text-slate-800 uppercase">NGƯỜI LẬP LỆNH</p>
              <p className="text-[11px] text-slate-500 italic">(Ký, ghi rõ họ tên)</p>
            </div>
            <div className="space-y-12">
              <p className="font-bold text-slate-800 uppercase">LÁI XE VẬN TẢI</p>
              <p className="text-[11px] text-slate-500 italic">{order.driverName || '(Ký, ghi rõ họ tên)'}</p>
            </div>
            <div className="space-y-12">
              <p className="font-bold text-slate-800 uppercase">ĐẠI DIỆN BÊN NHẬN</p>
              <p className="text-[11px] text-slate-500 italic">
                {order.pod?.receiverName || '(Ký, đóng dấu xác nhận)'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
