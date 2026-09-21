import React, { useState } from 'react';
import { X, Clock, Calendar, User, DollarSign, FileText } from 'lucide-react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';

interface AddTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectCode: string;
  projectName: string;
  onAddTimesheet: (timesheetData: any) => void;
}

export const AddTimesheetModal: React.FC<AddTimesheetModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectCode,
  projectName,
  onAddTimesheet,
}) => {
  const [formData, setFormData] = useState({
    employeeName: 'Phan Hoàng Pixel (PM)',
    wbsCode: '2.2',
    wbsTaskName: 'Xây dựng Module M35 Projects & WBS',
    date: new Date().toISOString().slice(0, 10),
    hoursLogged: 8,
    hourlyRateVND: 280000,
    notes: 'Tiếp tục phát triển các màn hình Job Costing & Timesheet ERP',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTimesheet(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Ghi Nhận Giờ Làm (Daily Timesheet Logging)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 text-xs">
          <span className="font-bold text-blue-800 dark:text-blue-300 block">Dự Án Áp Dụng:</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">[{projectCode}] {projectName}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Nhân Viên Thực Hiện *</label>
            <input
              type="text"
              required
              value={formData.employeeName}
              onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã WBS Tác Vụ *</label>
              <input
                type="text"
                required
                value={formData.wbsCode}
                onChange={(e) => setFormData({ ...formData, wbsCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày Chấm Công *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Hạng Mục Công Việc</label>
            <input
              type="text"
              value={formData.wbsTaskName}
              onChange={(e) => setFormData({ ...formData, wbsTaskName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số Giờ Ghi Nhận (Hours) *</label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                required
                value={formData.hoursLogged}
                onChange={(e) => setFormData({ ...formData, hoursLogged: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <CurrencyInput
                label="Đơn Giá Giờ (VNĐ/hr)"
                value={formData.hourlyRateVND}
                onChange={(val) => setFormData({ ...formData, hourlyRateVND: val })}
                showBadge={true}
                showPresets={true}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Chi Phí Nhân Công Dự Tính:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
              {(formData.hoursLogged * formData.hourlyRateVND).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi Chú Chi Tiết Công Việc</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
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
              Ghi Timesheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
