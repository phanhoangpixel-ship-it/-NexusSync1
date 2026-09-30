import React, { useState } from 'react';
import { Users, User, Clock, DollarSign, Award, CheckCircle2, Plus, X } from 'lucide-react';
import { ResourceItem } from '../../../../types/m35Types';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

interface ProjectResourcesTabProps {
  resources: ResourceItem[];
  onResourceAdded?: () => void;
}

export const ProjectResourcesTab: React.FC<ProjectResourcesTabProps> = ({ resources, onResourceAdded }) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('Kỹ sư triển khai hệ thống');
  const [resourceType, setResourceType] = useState<'PEOPLE' | 'EQUIPMENT' | 'SUBCONTRACTOR'>('PEOPLE');
  const [standardRate, setStandardRate] = useState<number>(320000);
  const [capacityHours, setCapacityHours] = useState<number>(160);
  const [department, setDepartment] = useState<string>('Ban Triển khai Dự án');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {},
  });

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/projects/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          role,
          resourceType,
          standardRateVND: standardRate,
          capacityHours,
          department,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setName('');
        if (onResourceAdded) onResourceAdded();
      } else {
        const err = await res.json();
        setConfirmDialog({
          isOpen: true,
          title: 'Lỗi Tạo Nguồn Lực',
          message: err.error || 'Có lỗi khi tạo nguồn lực',
          variant: 'warning',
          onConfirm: () => setConfirmDialog((p) => ({ ...p, isOpen: false })),
        });
      }
    } catch (e: any) {
      setConfirmDialog({
        isOpen: true,
        title: 'Lỗi Kết Nối',
        message: `Lỗi: ${e.message}`,
        variant: 'warning',
        onConfirm: () => setConfirmDialog((p) => ({ ...p, isOpen: false })),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            04. Quản Trị Nguồn Lực &amp; Phân Bổ Nhân Sự Dự Án (Resources &amp; Capacity - M28)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theo dõi tải năng lực, đơn giá nhân công theo giờ và tổng giờ công đã ghi nhận từ bảng chấm công M28.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm Nguồn Lực Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((res) => {
          const unitRate = (res as any).unitRateVND ?? (res as any).unitCostRateVND ?? (res as any).standardRateVND ?? (res as any).standardRate ?? 0;
          const hoursLogged = (res as any).allocatedHours ?? (res as any).hoursAssigned ?? 0;
          const totalCapacity = (res as any).capacityHoursTotal ?? (res as any).capacityHours ?? 160;
          const utilization = (res as any).utilizationPct ?? (totalCapacity > 0 ? Math.round((hoursLogged / totalCapacity) * 100) : 0);
          const resType = res.type || (res as any).resourceType || 'PEOPLE';

          return (
            <div
              key={res.id}
              className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">{res.name}</h4>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium block">{res.role}</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                  {resType}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Đơn Giá Giờ:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {(Number(unitRate) || 0).toLocaleString('vi-VN')} đ/h
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Đã Ghi Nhận:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {hoursLogged}h / {totalCapacity}h
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Mức Sử Dụng Năng Lực:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{utilization}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      utilization > 90
                        ? 'bg-rose-500'
                        : utilization > 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, utilization))}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Resource Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Đăng Ký Nguồn Lực Dự Án (M28 Cross-Module)
              </h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ &amp; Tên Nguồn Lực / Chuyên Gia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn Chuyên Viên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vai Trò Kỹ Thuật
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phân Loại
                  </label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="PEOPLE">Nhân Sự (People)</option>
                    <option value="EQUIPMENT">Thiết Bị (Equipment)</option>
                    <option value="SUBCONTRACTOR">Nhà Thầu Phụ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Đơn Giá Lao Động (đ/giờ)
                  </label>
                  <input
                    type="number"
                    min="50000"
                    step="10000"
                    value={standardRate}
                    onChange={(e) => setStandardRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Năng Lực Định Mức (Giờ/Tháng)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="300"
                    value={capacityHours}
                    onChange={(e) => setCapacityHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Đơn Vị / Phòng Ban Quản Lý
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Lưu Nguồn Lực'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rule #19 Enterprise Confirm Dialog */}
      <ConfirmDialog state={confirmDialog} setState={setConfirmDialog} />
    </div>
  );
};
