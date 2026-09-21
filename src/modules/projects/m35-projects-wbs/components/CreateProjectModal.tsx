import React, { useState } from 'react';
import { X, Plus, Building2, Calendar, User, DollarSign, Layers } from 'lucide-react';
import { ProjectMaster, ProjectCategory } from '../../../../types/m35Types';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCount: number;
  onCreateProject: (projectData: any) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  projectCount,
  onCreateProject,
}) => {
  const [formData, setFormData] = useState({
    code: `PRJ-2026-00${projectCount + 1}`,
    name: '',
    category: 'ERP_IT' as ProjectCategory,
    client: '',
    manager: 'Nguyễn Văn An (PM Senior)',
    branch: 'BR_HO',
    businessUnit: 'Khối Công Nghệ Thông Tin',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    contractValueVND: 3500000000,
    budgetVND: 2500000000,
    description: '',
    charterObjective: 'Số hóa và chuẩn hóa toàn bộ quy trình vận hành chuỗi cung ứng và quản trị nguồn lực doanh nghiệp.',
    scopeSummary: 'Triển khai phân hệ M35 WBS & Job Costing Engine, tích hợp hạch toán GL và quản trị EVM.',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateProject(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Khởi Tạo Dự Án Mới (Project Master)
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
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Dự Án *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại Hình Dự Án</label>
              <select
                value={formData.category}
                onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ERP_IT">ERP / IT Software</option>
                <option value="EPC_CONSTRUCTION">EPC Construction</option>
                <option value="RD_INNOVATION">R&D Innovation</option>
                <option value="INFRASTRUCTURE">Infrastructure</option>
                <option value="SERVICE_CONSULTING">Tư vấn & Dịch vụ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Dự Án *</label>
            <input
              type="text"
              required
              placeholder="VD: Triển khai Hệ thống ERP Chuỗi Cung Ứng Phase 3"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Khách Hàng / Chủ Đầu Tư</label>
              <input
                type="text"
                placeholder="Tập đoàn NexusSync"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">PM Phụ Trách</label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày Bắt Đầu</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày Hoàn Thành Kế Hoạch</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <CurrencyInput
                label="Giá Trị Hợp Đồng (Doanh Thu VNĐ)"
                value={formData.contractValueVND}
                onChange={(val) => setFormData({ ...formData, contractValueVND: val })}
                showBadge={true}
                showPresets={true}
              />
            </div>
            <div>
              <CurrencyInput
                label="Tổng Ngân Sách Gốc (BAC VNĐ)"
                value={formData.budgetVND}
                onChange={(val) => setFormData({ ...formData, budgetVND: val })}
                showBadge={true}
                showPresets={true}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mục Tiêu Dự Án (Charter Objectives)</label>
            <textarea
              rows={2}
              value={formData.charterObjective}
              onChange={(e) => setFormData({ ...formData, charterObjective: e.target.value })}
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
              Tạo Dự Án Mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
