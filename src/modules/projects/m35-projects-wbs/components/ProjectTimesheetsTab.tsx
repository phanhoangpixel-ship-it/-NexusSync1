import React from 'react';
import { Clock, Plus, CheckCircle2, User, Calendar, DollarSign } from 'lucide-react';
import { TimesheetEntry } from '../../../../types/m35Types';

interface ProjectTimesheetsTabProps {
  timesheets: TimesheetEntry[];
  onOpenAddModal: () => void;
  onApproveTimesheet: (id: string) => void;
}

export const ProjectTimesheetsTab: React.FC<ProjectTimesheetsTabProps> = ({
  timesheets,
  onOpenAddModal,
  onApproveTimesheet,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'SUBMITTED':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'REJECTED':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const totalHours = timesheets.reduce((acc, t) => acc + (t.hoursLogged || 0), 0);
  const totalCost = timesheets.reduce((acc, t) => acc + (t.totalCostVND || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            07. Chấm Công Tác Vụ Dự Án &amp; Chi Phí Giờ Công (Daily Timesheets &amp; Labor Logs)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tổng hợp {timesheets.length} bản ghi chấm công: <strong className="text-slate-900 dark:text-white">{totalHours} giờ</strong> (Tổng chi phí: <strong className="text-blue-600 dark:text-blue-400 font-mono">{totalCost.toLocaleString('vi-VN')} đ</strong>).
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ghi Timesheet
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">Ngày</th>
              <th className="py-2.5 px-3">Nhân Viên Thực Hiện</th>
              <th className="py-2.5 px-3">Mã WBS</th>
              <th className="py-2.5 px-3">Nội Dung / Tác Vụ</th>
              <th className="py-2.5 px-3 text-right">Số Giờ</th>
              <th className="py-2.5 px-3 text-right">Đơn Giá Giờ</th>
              <th className="py-2.5 px-3 text-right">Thành Tiền (VND)</th>
              <th className="py-2.5 px-3 text-center">Trạng Thái</th>
              <th className="py-2.5 px-3 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {timesheets.map((ts) => (
              <tr key={ts.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition">
                <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{ts.date}</td>
                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{ts.employeeName}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{ts.wbsCode}</td>
                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">{ts.wbsTaskName || ts.notes}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{ts.hoursLogged}h</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                  {ts.hourlyRateVND?.toLocaleString('vi-VN')} đ
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                  {ts.totalCostVND?.toLocaleString('vi-VN')}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(ts.status)}`}>
                    {ts.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  {ts.status !== 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => onApproveTimesheet(ts.id)}
                      className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-md text-[10px] font-bold transition cursor-pointer active:scale-95"
                    >
                      Duyệt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
