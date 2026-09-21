import React from 'react';
import { Users, User, Clock, DollarSign, Award, CheckCircle2 } from 'lucide-react';
import { ResourceItem } from '../../../../types/m35Types';

interface ProjectResourcesTabProps {
  resources: ResourceItem[];
}

export const ProjectResourcesTab: React.FC<ProjectResourcesTabProps> = ({ resources }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            04. Quản Trị Nguồn Lực &amp; Phân Bổ Nhân Sự Dự Án (Resources &amp; Capacity)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theo dõi tải năng lực, đơn giá nhân công theo giờ và tổng giờ công đã ghi nhận.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((res) => (
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
                {res.type}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Đơn Giá Giờ:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {res.unitCostRateVND.toLocaleString('vi-VN')} đ/h
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Đã Ghi Nhận:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {res.hoursAssigned}h / {res.capacityHoursTotal}h
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Mức Sử Dụng Năng Lực:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{res.utilizationPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    res.utilizationPct > 90
                      ? 'bg-rose-500'
                      : res.utilizationPct > 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, res.utilizationPct)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
