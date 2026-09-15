import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Navigation,
  CheckCircle2,
  Camera,
  PenTool,
  Phone,
  MapPin,
  Package,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { TransportOrder } from '../../../../../types';
import { formatVNDCurrency as formatVND } from '../../../../../utils/currencyFormatter';

interface MobileDriverAppSimulatorProps {
  isOpen: boolean;
  order: TransportOrder | null;
  onClose: () => void;
  onSubmitPod: (orderId: number, receiverName: string, notes: string) => void;
}

export const MobileDriverAppSimulator: React.FC<MobileDriverAppSimulatorProps> = ({
  isOpen,
  order,
  onClose,
  onSubmitPod,
}) => {
  const [step, setStep] = useState<'TRIP' | 'SIGN' | 'DONE'>('TRIP');
  const [receiverName, setReceiverName] = useState('Trần Văn Bình');
  const [hasSignature, setHasSignature] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [notes, setNotes] = useState('Đã kiểm đếm đủ thùng carton, tem niêm phong nguyên vẹn.');

  if (!isOpen || !order) return null;

  const handleFinishPod = () => {
    onSubmitPod(order.id, receiverName, notes);
    setStep('DONE');
  };

  const handleReset = () => {
    setStep('TRIP');
    setHasSignature(false);
    setHasPhoto(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative">
        {/* CLOSE BUTTON FLOATING */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-slate-300 flex items-center gap-1 text-xs font-semibold bg-slate-800/80 px-2.5 py-1 rounded-full cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Đóng Simulator</span>
        </button>

        {/* SMARTPHONE CHASSIS */}
        <div className="w-[360px] h-[720px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-700 flex flex-col relative overflow-hidden ring-1 ring-white/20">
          {/* TOP NOTCH / DYNAMIC ISLAND */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
          </div>

          {/* SCREEN CONTAINER */}
          <div className="w-full h-full bg-slate-50 dark:bg-slate-900 rounded-[38px] overflow-hidden flex flex-col pt-7 pb-2 text-slate-900 dark:text-white font-sans text-xs">
            {/* APP HEADER */}
            <div className="px-4 py-2.5 bg-blue-600 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-200" />
                <span className="font-bold tracking-tight text-sm">Nexus Driver App</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-blue-700/80 rounded">
                {order.orderCode}
              </span>
            </div>

            {/* SCREEN BODY */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {step === 'TRIP' && (
                <>
                  {/* TRIP CARD */}
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Chuyến Xe Đang Chạy</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        IN TRANSIT
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{order.customerName}</h4>

                    <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>Từ: {order.originAddress}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Đến: {order.destinationAddress}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-500">Tải trọng:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {order.weightKg.toLocaleString('vi-VN')} kg
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500">Xe:</span>{' '}
                        <strong className="text-blue-600 dark:text-blue-400">{order.vehiclePlate || '29C-882.14'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* QUICK ACTIONS */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${order.driverPhone || '0988123456'}`}
                      className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Gọi Khách Hàng</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setNotes((prev) => `${prev} [Đã bật GPS dẫn đường]`)}
                      className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-500" />
                      <span>Chỉ Đường GPS</span>
                    </button>
                  </div>

                  {/* ARRIVED AT DESTINATION BUTTON */}
                  <button
                    onClick={() => setStep('SIGN')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all mt-4"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã Đến Điểm Giao &amp; Ký POD</span>
                  </button>
                </>
              )}

              {step === 'SIGN' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white">Bàn Giao &amp; Lấy Chữ Ký POD</h4>
                    <button
                      onClick={() => setStep('TRIP')}
                      className="text-blue-600 dark:text-blue-400 text-[11px] font-semibold cursor-pointer"
                    >
                      Quay lại
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Họ tên người nhận:
                    </label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* SIGNATURE PAD SIMULATOR */}
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Ký tên điện tử (Khách ký trên màn hình):
                    </label>
                    <div
                      onClick={() => setHasSignature(!hasSignature)}
                      className="h-28 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
                    >
                      {hasSignature ? (
                        <div className="text-center font-serif text-2xl text-blue-600 italic select-none">
                          Trần Văn Bình
                          <span className="block text-[10px] text-emerald-600 font-mono mt-1 not-italic">
                            ✓ Đã ghi nhận tọa độ GPS &amp; Timestamp
                          </span>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-center space-y-1">
                          <PenTool className="w-5 h-5 mx-auto" />
                          <span className="text-[11px]">Chạm vào đây để mô phỏng khách ký</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PHOTO PROOF SIMULATOR */}
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Ảnh chụp kiện hàng &amp; tem niêm phong:
                    </label>
                    <div
                      onClick={() => setHasPhoto(!hasPhoto)}
                      className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-500" />
                        <span className="text-[11px]">
                          {hasPhoto ? '✓ Đã chụp 2 ảnh (Kiện hàng + Niêm seal)' : 'Chạm để chụp ảnh chứng cứ'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600">
                        {hasPhoto ? 'Đổi ảnh' : 'Chụp'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleFinishPod}
                    disabled={!hasSignature}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hoàn Tất &amp; Gửi Biên Bản POD</span>
                  </button>
                </div>
              )}

              {step === 'DONE' && (
                <div className="text-center py-10 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Giao Hàng Thành Công!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs px-4">
                    Biên bản POD của lệnh <strong className="font-mono">{order.orderCode}</strong> đã được đồng bộ lên máy
                    chủ TMS trung tâm.
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mô phỏng lại chuyến này</span>
                  </button>
                </div>
              )}
            </div>

            {/* HOME INDICATOR */}
            <div className="w-32 h-1 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto my-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
