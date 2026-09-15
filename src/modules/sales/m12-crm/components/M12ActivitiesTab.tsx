import React, { useState } from 'react';
import { CrmActivityItem, LeadItem } from './m12Types';
import {
  Activity,
  PhoneCall,
  Mail,
  Users,
  FileText,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  Calendar,
  UserCheck
} from 'lucide-react';

interface M12ActivitiesTabProps {
  activities: CrmActivityItem[];
  leads: LeadItem[];
  onAddActivity: (activity: Partial<CrmActivityItem>) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M12ActivitiesTab: React.FC<M12ActivitiesTabProps> = ({
  activities,
  leads,
  onAddActivity,
  onNotify,
}) => {
  const [activityType, setActivityType] = useState<CrmActivityItem['activityType']>('CALL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>('');
  const [performedBy, setPerformedBy] = useState('Trần Minh Đức');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tiêu đề hoạt động.');
      return;
    }

    onAddActivity({
      leadId: selectedLeadId ? Number(selectedLeadId) : undefined,
      activityType,
      subject,
      description,
      performedBy,
      date: new Date().toISOString().slice(0, 10),
    });

    setSubject('');
    setDescription('');
    setSelectedLeadId('');
  };

  const getActivityIcon = (type: CrmActivityItem['activityType']) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="w-4 h-4 text-emerald-600" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'MEETING':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'VISIT':
        return <MapPin className="w-4 h-4 text-amber-600" />;
      case 'NOTE':
        return <FileText className="w-4 h-4 text-slate-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActivityTypeLabel = (type: CrmActivityItem['activityType']) => {
    switch (type) {
      case 'CALL': return 'Cuộc Gọi Tư Vấn';
      case 'EMAIL': return 'Gửi Email / Bản Chào';
      case 'MEETING': return 'Họp Demo / Thương Thảo';
      case 'VISIT': return 'Khảo Sát Nhà Máy';
      case 'NOTE': return 'Ghi Chú Tiến Độ';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Activity Form */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Ghi Nhận Hoạt Động Chăm Sóc Khách Hàng (Log Sales Activity)
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Loại tương tác
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="CALL">Cuộc gọi điện thoại (CALL)</option>
                <option value="EMAIL">Gửi Email chào hàng (EMAIL)</option>
                <option value="MEETING">Họp trực tuyến / Trực tiếp (MEETING)</option>
                <option value="VISIT">Khảo sát hiện trường / Nhà máy (VISIT)</option>
                <option value="NOTE">Ghi chú nội bộ (NOTE)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Liên kết Lead
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">-- Không gắn Lead cụ thể --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.leadCode} - {l.company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Người thực hiện
              </label>
              <input
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                placeholder="Tên chuyên viên..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Tiêu đề tóm tắt *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Vd: Họp Demo phân hệ WMS..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nội dung trao đổi chi tiết & Kết quả
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập chi tiết nội dung cuộc gọi, yêu cầu kỹ thuật của khách hàng, các điểm nghẽn và bước hành động tiếp theo..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ghi Nhận Hoạt Động</span>
            </button>
          </div>
        </form>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Dòng Thời Gian Tương Tác Khách Hàng (Customer Interaction Timeline)
          </h4>
          <span className="text-xs font-mono text-slate-500">
            {activities.length} sự kiện được ghi nhận
          </span>
        </div>

        <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Chưa có lịch sử hoạt động nào được ghi lại.
            </div>
          ) : (
            activities.map((act) => {
              const matchedLead = act.leadId ? leads.find((l) => l.id === act.leadId) : null;

              return (
                <div key={act.id} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[31px] top-1 p-1 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-500 shadow-xs">
                    {getActivityIcon(act.activityType)}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1.5 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                          {getActivityTypeLabel(act.activityType)}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          {act.subject}
                        </h5>
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                        <span>{act.date}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{act.performedBy}</span>
                      </div>
                    </div>

                    {matchedLead && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                        <UserCheck className="w-3 h-3" />
                        <span>{matchedLead.leadCode} - {matchedLead.company}</span>
                      </div>
                    )}

                    {act.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        {act.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
