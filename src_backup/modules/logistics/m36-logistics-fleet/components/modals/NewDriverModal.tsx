import React, { useState } from 'react';
import { X, Users, Plus } from 'lucide-react';

interface NewDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    fullName: string;
    phone: string;
    licenseNumber: string;
    licenseClass: string;
    licenseExpiryDate: string;
  }) => void;
}

export const NewDriverModal: React.FC<NewDriverModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    licenseNumber: '',
    licenseClass: 'FC',
    licenseExpiryDate: '2028-12-31',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <span>Hồ Sơ Hóa Tài Xế Mới (Driver Roster)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Họ Và Tên Lái Xe:
            </label>
            <input
              type="text"
              required
              placeholder="VD: Nguyễn Văn Hùng"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Số Điện Thoại Liên Hệ:
            </label>
            <input
              type="tel"
              required
              placeholder="VD: 0988 123 456"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full font-mono px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Số GPLX (Bằng lái):
              </label>
              <input
                type="text"
                required
                placeholder="VD: 010188291823"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                className="w-full font-mono px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Hạng Bằng Lái:
              </label>
              <select
                value={form.licenseClass}
                onChange={(e) => setForm({ ...form, licenseClass: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="B2">Hạng B2 (Xe dưới 9 chỗ / &lt; 3.5T)</option>
                <option value="C">Hạng C (Xe tải trên 3.5T)</option>
                <option value="D">Hạng D (Xe chở khách 10-30 chỗ)</option>
                <option value="E">Hạng E (Xe chở khách &gt; 30 chỗ)</option>
                <option value="FC">Hạng FC (Đầu kéo sơ-mi rơ-moóc)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Thời Hạn Hiệu Lực GPLX:
            </label>
            <input
              type="date"
              required
              value={form.licenseExpiryDate}
              onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Tài Xế</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
