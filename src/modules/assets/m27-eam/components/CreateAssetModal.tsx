import React, { useState } from 'react';
import { X, Cpu, Plus } from 'lucide-react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNotify,
}) => {
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('MÁY MÓC SX');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [criticality, setCriticality] = useState<'A' | 'B' | 'C'>('B');
  const [purchaseCost, setPurchaseCost] = useState<number>(500000000);
  const [location, setLocation] = useState('Nhà Xưởng A — Khu Gia Công');
  const [responsibleEmployeeName, setResponsibleEmployeeName] = useState('Trần Văn Hùng (Kỹ thuật trưởng)');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên thiết bị / máy móc.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/eam/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          categoryName,
          model: model.trim() || 'MODEL-2026',
          serialNumber: serialNumber.trim() || `SN-${Date.now().toString().slice(-6)}`,
          manufacturer: manufacturer.trim() || 'Nexus Engineering',
          criticality,
          purchaseCost: Number(purchaseCost),
          location,
          responsibleEmployeeName,
          status: 'ACTIVE',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi đăng ký hồ sơ tài sản');
      }

      onNotify('success', 'Đăng ký thành công', `Đã ghi nhận tài sản thiết bị mới "${name}" vào sổ cái EAM.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Đăng ký thất bại', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đăng Ký Hồ Sơ Thiết Bị &amp; Tài Sản Cố Định (EAM)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ghi nhận máy móc xưởng, nguyên giá VAS 211 &amp; vị trí vận hành</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên Máy Móc / Thiết Bị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Máy phay CNC 5 trục Haas UMC-750"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phân Loại Thiết Bị
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value="MÁY MÓC SX">MÁY MÓC SX (Chính)</option>
                <option value="DÂY CHUYỀN SMT">DÂY CHUYỀN SMT &amp; HÀN</option>
                <option value="THIẾT BỊ NÂNG HẠ">THIẾT BỊ NÂNG HẠ / XE NÂNG</option>
                <option value="TRẠM KIỂM TRA QC">TRẠM ĐO LƯỜNG &amp; QC</option>
                <option value="HỆ THỐNG TIỆN ÍCH">HỆ THỐNG TIỆN ÍCH (Khí Nén, Lạnh)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Model Thiết Bị
              </label>
              <input
                type="text"
                placeholder="VD: UMC-750SS"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số Seri (Serial Number)
              </label>
              <input
                type="text"
                placeholder="VD: SN-2026-9941"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hãng Sản Xuất (OEM)
              </label>
              <input
                type="text"
                placeholder="VD: Haas Automation / Fanuc"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mức Độ Trọng Yếu (Criticality Tier) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCriticality('A')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  criticality === 'A'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Tier A</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Cực Kỳ Quan Trọng</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Zero tolerance downtime</div>
              </button>

              <button
                type="button"
                onClick={() => setCriticality('B')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  criticality === 'B'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Tier B</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Quan Trọng</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Thiết bị chạy ca</div>
              </button>

              <button
                type="button"
                onClick={() => setCriticality('C')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  criticality === 'C'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Tier C</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Tiêu Chuẩn</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Phụ trợ, dự phòng</div>
              </button>
            </div>
          </div>

          <div>
            <CurrencyInput
              label="Nguyên Giá Mua Sắm (TK 211) *"
              value={purchaseCost}
              onChange={(val) => setPurchaseCost(val)}
              placeholder="VD: 500.000.000"
              required
              showBadge={true}
              showPresets={true}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vị Trí Lắp Đặt / Xưởng
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Người Phụ Trách Kỹ Thuật
              </label>
              <input
                type="text"
                value={responsibleEmployeeName}
                onChange={(e) => setResponsibleEmployeeName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Đang Đăng Ký...' : 'Đăng Ký Hồ Sơ Tài Sản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
