import React from 'react';
import {
  GraduationCap,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface TrainingCertificationTabProps {
  trainingRecords: any[];
  loading: boolean;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const TrainingCertificationTab: React.FC<TrainingCertificationTabProps> = ({
  trainingRecords,
  loading,
  onRefresh,
  onNotify,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Chương Trình Đào Tạo &amp; Chứng Chỉ Kỹ Thuật (ISO / IPC / VAS)</h4>
          <p className="text-xs text-slate-500">Quản lý nâng cao năng lực nhân sự và lưu trữ chứng chỉ năng lực chuyên môn</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Training Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Khóa đào tạo</th>
                <th className="py-3 px-4">Nhân sự tham gia</th>
                <th className="py-3 px-4">Đơn vị đào tạo</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-center">Kết quả</th>
                <th className="py-3 px-4 text-center">Hiệu lực chứng chỉ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {trainingRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Chưa có hồ sơ đào tạo nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                trainingRecords.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{t.courseName || 'Khóa Huấn luyện An toàn ISO 45001'}</div>
                      <span className="text-[11px] font-mono text-slate-400">{t.category || 'An toàn & Tiêu chuẩn'}</span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {t.employeeName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {t.institution || 'Trung tâm Kiểm định & Đào tạo Quốc gia'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {t.startDate} - {t.endDate}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                      {t.score ? `${t.score}/100` : 'ĐẠT (Pass)'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                      {t.validUntil || '31/12/2028'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Đã cấp chứng chỉ
                      </span>
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
