import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  RefreshCw,
  FileText,
  UserCheck,
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

interface LeaveManagementTabProps {
  leaves: any[];
  employees: any[];
  loading: boolean;
  onOpenCreateLeaveModal: () => void;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const LeaveManagementTab: React.FC<LeaveManagementTabProps> = ({
  leaves,
  employees,
  loading,
  onOpenCreateLeaveModal,
  onRefresh,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [approvingLeave, setApprovingLeave] = useState<any | null>(null);

  const filteredLeaves = leaves.filter((l) => {
    const matchesSearch =
      l.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leaveType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApprove = async () => {
    if (!approvingLeave) return;
    try {
      const res = await fetch(`/api/hr/leaves/${approvingLeave.id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Phê duyệt thất bại');

      onNotify('success', 'Phê duyệt đơn nghỉ phép', `Đã duyệt đơn nghỉ phép cho ${approvingLeave.employeeName}.`);
      onRefresh();
    } catch (err: any) {
      onNotify('danger', 'Lỗi phê duyệt', err.message);
    } finally {
      setApprovingLeave(null);
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'ANNUAL_LEAVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Phép năm (100% lương)
          </span>
        );
      case 'SICK_LEAVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Nghỉ ốm (BHXH)
          </span>
        );
      case 'PERSONAL_LEAVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Việc riêng có lương
          </span>
        );
      case 'MATERNITY_LEAVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Thai sản (BHXH)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã duyệt (Approved)
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Chờ duyệt (Pending)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Từ chối (Rejected)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nhân viên, lý do nghỉ phép..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt (Pending)</option>
            <option value="APPROVED">Đã duyệt (Approved)</option>
            <option value="REJECTED">Từ chối (Rejected)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreateLeaveModal}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Đơn Nghỉ Phép</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-4">Loại phép</th>
                <th className="py-3 px-4">Khoảng thời gian</th>
                <th className="py-3 px-4 text-center">Số ngày</th>
                <th className="py-3 px-4">Lý do</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Không có đơn nghỉ phép nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{leave.employeeName}</div>
                      <span className="text-[11px] font-mono text-slate-400">Mã NV: #{leave.employeeId}</span>
                    </td>

                    <td className="py-3.5 px-4">{getLeaveTypeBadge(leave.leaveType)}</td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {leave.startDate} <span className="text-slate-400">đến</span> {leave.endDate}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {leave.totalDays} ngày
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {leave.reason}
                    </td>

                    <td className="py-3.5 px-4 text-center">{getStatusBadge(leave.status)}</td>

                    <td className="py-3.5 px-4 text-right">
                      {leave.status === 'PENDING' ? (
                        <button
                          onClick={() => setApprovingLeave(leave)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Phê duyệt</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!approvingLeave}
        title="Xác nhận phê duyệt đơn nghỉ phép"
        message={`Bạn có chắc chắn muốn phê duyệt đơn nghỉ phép của ${approvingLeave?.employeeName} (${approvingLeave?.totalDays} ngày) không?`}
        confirmLabel="Phê Duyệt Đơn"
        cancelLabel="Hủy"
        variant="primary"
        onConfirm={handleApprove}
        onCancel={() => setApprovingLeave(null)}
      />
    </div>
  );
};
