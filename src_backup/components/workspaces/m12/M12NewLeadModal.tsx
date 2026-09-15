import React, { useState } from 'react';
import { LeadItem } from './m12Types';
import { X, Building2, User, Mail, Phone, DollarSign, Tag, UserCheck, Plus } from 'lucide-react';

interface M12NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: Partial<LeadItem>) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M12NewLeadModal: React.FC<M12NewLeadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onNotify,
}) => {
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('WEBSITE');
  const [interest, setInterest] = useState('Hệ thống ERP Sản xuất & Kho thông minh WMS');
  const [value, setValue] = useState(500000000);
  const [salespersonName, setSalespersonName] = useState('Trần Minh Đức');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() && !name.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên công ty hoặc người liên hệ.');
      return;
    }

    onSubmit({
      company,
      name: name || company,
      email,
      phone,
      source,
      interest,
      value: Number(value) || 0,
      salespersonName,
      status: 'NEW',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tiếp Nhận Khách Hàng Tiềm Năng (New Lead)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên Công ty / Khách hàng Doanh nghiệp *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Vd: Công ty Cổ phần Công nghệ ABC..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Người liên hệ chính *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vd: Nguyễn Văn A"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@abc.vn"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nguồn tiếp nhận
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="WEBSITE">Website Form (Inbound)</option>
                <option value="REFERRAL">Đối tác / Khách hàng giới thiệu</option>
                <option value="EVENT">Hội chợ triển lãm / Sự kiện</option>
                <option value="COLD_CALL">Telesales / Outbound Call</option>
                <option value="DIRECT_INQUIRY">Trực tiếp Hotline / Showroom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quy mô dự kiến (VND)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={value !== undefined && value !== null ? Number(value).toLocaleString('vi-VN') : '0'}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setValue(raw ? Number(raw) : 0);
                }}
                placeholder="0"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chuyên viên phụ trách
              </label>
              <input
                type="text"
                value={salespersonName}
                onChange={(e) => setSalespersonName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nhu cầu sản phẩm & Dịch vụ quan tâm
              </label>
              <textarea
                rows={2}
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="Ghi chú nhu cầu triển khai ERP, hệ thống WMS, thiết bị phần cứng hoặc số lượng user..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tiếp Nhận Lead</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
