import React, { useState } from 'react';
import { X, Wrench, Plus } from 'lucide-react';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: any[];
  initialAssetId?: number;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  onClose,
  assets,
  initialAssetId,
  onSuccess,
  onNotify,
}) => {
  const [assetId, setAssetId] = useState<number>(initialAssetId || (assets[0]?.id || 1));
  const [sourceOrigin, setSourceOrigin] = useState<'MANUAL' | 'M38' | 'M15'>('MANUAL');
  const [sourceReferenceCode, setSourceReferenceCode] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('PREVENTIVE');
  const [priority, setPriority] = useState('NORMAL');
  const [downtimeHours, setDowntimeHours] = useState<number>(0);
  const [description, setDescription] = useState('Bảo dưỡng & tra dầu trục vít me định kỳ');
  const [assignedTechnicianName, setAssignedTechnicianName] = useState('Kỹ thuật viên Trần Văn Hùng');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập mô tả công việc bảo trì.');
      return;
    }

    setLoading(true);
    try {
      const generatedRefCode =
        sourceOrigin === 'M38'
          ? (sourceReferenceCode.trim() || `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`)
          : sourceOrigin === 'M15'
          ? (sourceReferenceCode.trim() || `RMA-2026-${Math.floor(100 + Math.random() * 900)}`)
          : undefined;

      const res = await fetch('/api/eam/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          maintenanceType: sourceOrigin === 'M38' || sourceOrigin === 'M15' ? 'CORRECTIVE' : maintenanceType,
          priority,
          sourceModule: sourceOrigin === 'MANUAL' ? undefined : sourceOrigin,
          sourceReferenceCode: generatedRefCode,
          downtimeHours: Number(downtimeHours) || 0,
          description: description.trim(),
          assignedTechnicianName: assignedTechnicianName.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi khởi tạo phiếu bảo trì');
      }

      onNotify('success', 'Tạo phiếu thành công', 'Phiếu bảo trì công tác WO đã được phát thành công.');
      onSuccess();
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Lỗi phát phiếu WO', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Khởi Tạo Phiếu Bảo Trì (Work Order)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Phát phiếu công tác sửa chữa hoặc bảo dưỡng thiết bị</p>
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
              Thiết Bị Cần Bảo Trì / Sửa Chữa <span className="text-rose-500">*</span>
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name} ({a.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nguồn Gốc Phát Sinh Phiếu WO
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSourceOrigin('MANUAL');
                  setMaintenanceType('PREVENTIVE');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  sourceOrigin === 'MANUAL'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">Nội Bộ / Kế Hoạch</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Tự tạo tại xưởng EAM</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSourceOrigin('M38');
                  setMaintenanceType('CORRECTIVE');
                  setPriority('HIGH');
                  if (!sourceReferenceCode) setSourceReferenceCode(`INC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                  setDescription('Khắc phục sự cố theo ticket báo hỏng từ M38 Service Desk');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  sourceOrigin === 'M38'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-0.5">M38 Service Desk</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Sự cố máy móc đột xuất</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSourceOrigin('M15');
                  setMaintenanceType('CORRECTIVE');
                  setPriority('HIGH');
                  if (!sourceReferenceCode) setSourceReferenceCode(`RMA-2026-${Math.floor(100 + Math.random() * 900)}`);
                  setDescription('Định tuyến sửa chữa bảo hành máy móc thiết bị theo phiếu RMA M15');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  sourceOrigin === 'M15'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-0.5">M15 RMA Routing</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Định tuyến sửa chữa RMA</div>
              </button>
            </div>
          </div>

          {sourceOrigin !== 'MANUAL' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã Tham Chiếu Liên Kết ({sourceOrigin === 'M38' ? 'Mã Sự Cố M38' : 'Mã Phiếu RMA M15'})
              </label>
              <input
                type="text"
                value={sourceReferenceCode}
                onChange={(e) => setSourceReferenceCode(e.target.value)}
                placeholder={sourceOrigin === 'M38' ? 'INC-2026-xxxx' : 'RMA-2026-xxx'}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Loại Bảo Trì
              </label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value="PREVENTIVE">Bảo dưỡng định kỳ</option>
                <option value="CORRECTIVE">Sửa chữa đột xuất</option>
                <option value="PREDICTIVE">Dự đoán IoT</option>
                <option value="EMERGENCY">Khẩn cấp dừng máy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mức Độ Ưu Tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-semibold"
              >
                <option value="NORMAL">Bình thường (NORMAL)</option>
                <option value="HIGH">Ưu tiên cao (HIGH)</option>
                <option value="URGENT">Khẩn cấp (URGENT)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thời Gian Dừng Máy (Giờ)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={downtimeHours}
                onChange={(e) => setDowntimeHours(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kỹ Thuật Viên Phụ Trách
            </label>
            <input
              type="text"
              required
              value={assignedTechnicianName}
              onChange={(e) => setAssignedTechnicianName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nội Dung &amp; Yêu Cầu Công Tác <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
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
              <span>{loading ? 'Đang Tạo...' : 'Phát Phiếu Công Tác WO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
