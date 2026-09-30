import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Smartphone,
  Fingerprint,
  ScanFace,
  Search,
  RefreshCw,
  Zap,
  Calendar,
} from 'lucide-react';
import { TimeAttendanceWebhookSyncModal } from './TimeAttendanceWebhookSyncModal';

interface TimeAttendanceTabProps {
  attendanceList: any[];
  loading: boolean;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const TimeAttendanceTab: React.FC<TimeAttendanceTabProps> = ({
  attendanceList,
  loading,
  onRefresh,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  const handleSimulateGPSCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const res = await fetch('/api/hr/ess/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 1,
          locationName: 'Nhà máy chính SMT (GPS: 10.7769, 106.7009)',
          method: 'GPS Di động & WiFi Công nghiệp',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onNotify('success', 'Điểm Danh Thành Công', data.message || 'Đã ghi nhận dữ liệu quẹt thẻ vào ca trực.');
        onRefresh();
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi Check-in', err.message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const filteredAttendance = attendanceList.filter((a) => {
    const matchesSearch =
      a.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.shiftName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
      case 'ON_TIME':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đúng giờ
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Đi muộn
          </span>
        );
      case 'EARLY_LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Về sớm
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Vắng mặt
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

  const getMethodIcon = (method: string) => {
    if (method?.includes('GPS') || method?.includes('WiFi')) {
      return (
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <Smartphone className="w-3.5 h-3.5 text-blue-500" />
          <span>GPS Mobile</span>
        </span>
      );
    }
    if (method?.includes('Face') || method?.includes('Khuôn mặt')) {
      return (
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <ScanFace className="w-3.5 h-3.5 text-purple-500" />
          <span>FaceID AI</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
        <Fingerprint className="w-3.5 h-3.5 text-emerald-500" />
        <span>Vân tay Biometrics</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nhân viên, ca trực, mã chấm công..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PRESENT">Đúng giờ (Present)</option>
            <option value="LATE">Đi muộn</option>
            <option value="EARLY_LEAVE">Về sớm</option>
            <option value="ABSENT">Vắng mặt</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWebhookModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Webhook Máy Chấm Công</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSimulateGPSCheckIn}
            disabled={isCheckingIn}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <MapPin className="w-4 h-4" />
            <span>{isCheckingIn ? 'Đang xác thực GPS...' : 'Mô Phỏng GPS Check-in'}</span>
          </button>
        </div>
      </div>

      {/* Webhook Sync Modal */}
      <TimeAttendanceWebhookSyncModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        onSyncComplete={onRefresh}
        onNotify={onNotify}
      />

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-4">Ngày chấm công</th>
                <th className="py-3 px-4">Ca làm việc</th>
                <th className="py-3 px-4 text-center">Giờ vào</th>
                <th className="py-3 px-4 text-center">Giờ ra</th>
                <th className="py-3 px-4 text-center">Tăng ca OT</th>
                <th className="py-3 px-4">Phương thức</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Không có dữ liệu điểm danh nào trong ngày.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((att, idx) => (
                  <tr key={att.id || idx} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{att.employeeName || 'Nhân sự'}</div>
                      <span className="text-[11px] font-mono font-normal text-slate-400">{att.employeeCode || `EMP-0010${att.employeeId || 1}`}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {att.date || new Date().toISOString().slice(0, 10)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {att.shiftName || 'Ca Hành Chính 8h'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                      {att.timeIn || '07:55'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {att.timeOut || '17:30'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-purple-600">
                      {att.otHours || att.overtimeHours || 0} giờ
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {getMethodIcon(att.method || att.verificationMethod)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(att.status || 'PRESENT')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
