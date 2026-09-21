import React, { useState, useEffect } from 'react';
import { X, Edit2, Layers, Calendar, User, DollarSign, CheckCircle2 } from 'lucide-react';
import { WbsNode } from '../../../../types/m35Types';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';

interface WbsNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wbsNode: WbsNode | null;
  onSaveNode: (node: WbsNode) => void;
}

export const WbsNodeModal: React.FC<WbsNodeModalProps> = ({
  isOpen,
  onClose,
  wbsNode,
  onSaveNode,
}) => {
  const [formData, setFormData] = useState<WbsNode | null>(null);

  useEffect(() => {
    if (wbsNode) {
      setFormData({ ...wbsNode });
    }
  }, [wbsNode]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSaveNode(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Cập Nhật Hạng Mục WBS [{formData.code}]
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã WBS</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cấp Độ WBS</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={1}>Cấp 1 - Giai đoạn (Phase)</option>
                <option value={2}>Cấp 2 - Gói công việc (Work Package)</option>
                <option value={3}>Cấp 3 - Tác vụ thi công (Task)</option>
                <option value={4}>Cấp 4 - Tiểu tác vụ (Subtask)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Hạng Mục WBS *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nhân Sự Phụ Trách</label>
              <input
                type="text"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Trạng Thái</label>
              <select
                value={formData.status}
                onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              >
                <option value="NOT_STARTED">NOT_STARTED (Chưa bắt đầu)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Đang thực hiện)</option>
                <option value="BLOCKED">BLOCKED (Tạm dừng/Nghẽn)</option>
                <option value="COMPLETED">COMPLETED (Hoàn thành)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <CurrencyInput
                label="Chi Phí Kế Hoạch (PV - VNĐ)"
                value={formData.plannedCostVND}
                onChange={(val) => setFormData({ ...formData, plannedCostVND: val })}
                showBadge={true}
                showPresets={true}
              />
            </div>
            <div>
              <CurrencyInput
                label="Chi Phí Thực Tế (AC - VNĐ)"
                value={formData.actualCostVND}
                onChange={(val) => setFormData({ ...formData, actualCostVND: val })}
                showBadge={true}
                showPresets={true}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Tiến Độ Hoàn Thành (Progress %):
              </label>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                {formData.progressPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progressPct}
              onChange={(e) => setFormData({ ...formData, progressPct: Number(e.target.value) })}
              className="w-full cursor-pointer accent-blue-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isCriticalPath || false}
                onChange={(e) => setFormData({ ...formData, isCriticalPath: e.target.checked })}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span className="font-semibold text-rose-700 dark:text-rose-400">Thuộc Đường Găng (Critical Path)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isMilestone || false}
                onChange={(e) => setFormData({ ...formData, isMilestone: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="font-semibold text-amber-700 dark:text-amber-400">Mốc Nghiệm Thu (Milestone)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer active:scale-95"
            >
              Lưu Hạng Mục WBS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
