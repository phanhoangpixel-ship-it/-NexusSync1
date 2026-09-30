import React, { useState } from 'react';
import {
  X,
  Cpu,
  Activity,
  Wrench,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Layers,
  FileText,
  Calculator,
  ShieldCheck,
} from 'lucide-react';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onCreateWoForAsset: (asset: any) => void;
  onOpenDepreciationModal?: (asset: any) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  onNotify,
  onCreateWoForAsset,
  onOpenDepreciationModal,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'iot' | 'history' | 'finance'>('info');

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  {asset.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    asset.status === 'ACTIVE' || asset.status === 'IN_USE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                  }`}
                >
                  {asset.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{asset.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onCreateWoForAsset(asset);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Tạo Phiếu WO</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUB TABS */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Thông Số Kỹ Thuật
          </button>
          <button
            onClick={() => setActiveTab('iot')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'iot'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Cảm Biến IoT &amp; Sức Khỏe
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Lịch Sử Bảo Trì
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Sổ Cái &amp; Khấu Hao (TK 211/214)
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Nhóm Tài Sản</span>
                  <strong className="text-slate-900 dark:text-white">{asset.categoryName || 'MÁY MÓC SX'}</strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Model Thiết Bị</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{asset.model || 'UMC-750SS'}</strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Số Serial (S/N)</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{asset.serialNumber || 'SN-2024-998'}</strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Nhà Sản Xuất</span>
                  <strong className="text-slate-900 dark:text-white">{asset.manufacturer || 'Nexus Tech'}</strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Vị Trí Lắp Đặt</span>
                  <strong className="text-slate-900 dark:text-white">{asset.location || 'Xưởng Cơ Khí A1'}</strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Cán Bộ Quản Lý</span>
                  <strong className="text-slate-900 dark:text-white">{asset.responsibleEmployeeName || 'Trần Văn Hùng'}</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'iot' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Nhiệt Độ Vận Hành</span>
                  <strong className="text-base font-mono text-slate-900 dark:text-white">52.4 °C</strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Độ Rung Spindle</span>
                  <strong className="text-base font-mono text-emerald-600 dark:text-emerald-400">1.8 mm/s</strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Dòng Tải Động Cơ</span>
                  <strong className="text-base font-mono text-slate-900 dark:text-white">14.2 A</strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Chỉ Số Sức Khỏe</span>
                  <strong className="text-base font-mono text-emerald-600 dark:text-emerald-400">{asset.healthScore || 98} / 100</strong>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Cảnh Báo Dự Đoán Hỏng Hóc (Predictive AI)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Không có rủi ro bất thường
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Dữ liệu phổ tần rung động FFT 3 trục không ghi nhận biến dạng bề mặt ổ bi hoặc lệch trục quay. Thời gian dự kiến cần đại tu tiếp theo: <strong>1.450 giờ vận hành</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-blue-600 dark:text-blue-400">WO-2026-0001 • Bảo Dưỡng Định Kỳ 500h</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Hoàn thành ngày 15/09/2026 • KTV Trần Văn Hùng</div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">3.500.000 ₫</span>
                  <div className="text-[10px] text-slate-400">Downtime: 2.5h</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-blue-600 dark:text-blue-400">WO-2026-0002 • Hiệu Chuẩn Bàn Máy 5 Trục</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Hoàn thành ngày 01/08/2026 • KTV Lê Minh Quang</div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">1.800.000 ₫</span>
                  <div className="text-[10px] text-slate-400">Downtime: 1.0h</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Nguyên Giá (TK 211)</span>
                  <strong className="font-mono text-base text-slate-900 dark:text-white">
                    {asset.purchaseCost ? asset.purchaseCost.toLocaleString('vi-VN') : '0'} ₫
                  </strong>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="text-amber-700 dark:text-amber-300 block mb-1">Khấu Hao Lũy Kế (TK 214)</span>
                  <strong className="font-mono text-base text-amber-700 dark:text-amber-300">
                    {((asset.purchaseCost || 0) - (asset.bookValue || 0)).toLocaleString('vi-VN')} ₫
                  </strong>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-300 block mb-1">Giá Trị Còn Lại</span>
                  <strong className="font-mono text-base text-emerald-700 dark:text-emerald-300">
                    {asset.bookValue ? asset.bookValue.toLocaleString('vi-VN') : '0'} ₫
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-0.5">Thời Gian Khấu Hao Hữu Ích</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">
                    {asset.usefulLifeMonths || 60} tháng (5 năm)
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-0.5">Mức Trích Khấu Hao Hàng Tháng</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    {asset.monthlyDepreciation ? asset.monthlyDepreciation.toLocaleString('vi-VN') : '—'} ₫/tháng
                  </strong>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Định Khoản Kế Toán Sổ Cái M30:</span>
                  <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                    Nợ TK 627 (Chi phí SXC khấu hao) / Có TK 214 (Hao mòn TSCĐ)
                  </p>
                </div>
                {onOpenDepreciationModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDepreciationModal(asset);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 ml-3"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Trích Khấu Hao (M30)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
