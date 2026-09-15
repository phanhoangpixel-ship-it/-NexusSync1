import React from 'react';
import { LeadItem, CrmActivityItem, CrmQuotationItem } from './m12Types';
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  DollarSign,
  Activity,
  FileText,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface M12LeadDetailModalProps {
  isOpen: boolean;
  lead: LeadItem | null;
  activities: CrmActivityItem[];
  quotations: CrmQuotationItem[];
  onClose: () => void;
  onOpenConvertModal: (lead: LeadItem) => void;
  onOpenNewQuotationForLead: (lead: LeadItem) => void;
  onUpdateLeadStatus: (leadId: number, status: LeadItem['status']) => void;
}

export const M12LeadDetailModal: React.FC<M12LeadDetailModalProps> = ({
  isOpen,
  lead,
  activities,
  quotations,
  onClose,
  onOpenConvertModal,
  onOpenNewQuotationForLead,
  onUpdateLeadStatus,
}) => {
  if (!isOpen || !lead) return null;

  const leadActivities = activities.filter((a) => a.leadId === lead.id);
  const leadQuotations = quotations.filter((q) => q.leadId === lead.id);

  const statuses: LeadItem['status'][] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {lead.leadCode}
              </span>
              <span className="text-xs text-slate-400 font-mono">Nguồn: {lead.source}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {lead.company}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Người đại diện: <strong className="text-slate-700 dark:text-slate-200">{lead.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Stage Selector */}
        <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Giai đoạn Phễu Bán Hàng (Lead Pipeline Stage)
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {statuses.map((st) => {
              const isCurrent = lead.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => onUpdateLeadStatus(lead.id, st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Thông tin liên hệ</span>
            </h4>
            <div className="space-y-1 text-slate-600 dark:text-slate-400">
              <div>SĐT: <strong className="text-slate-800 dark:text-slate-200 font-mono">{lead.phone || 'Chưa có'}</strong></div>
              <div>Email: <strong className="text-slate-800 dark:text-slate-200 font-mono">{lead.email || 'Chưa có'}</strong></div>
              <div>Phụ trách: <strong className="text-slate-800 dark:text-slate-200">{lead.salespersonName || 'Admin'}</strong></div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quy mô & Nhu cầu</span>
            </h4>
            <div className="space-y-1 text-slate-600 dark:text-slate-400">
              <div>Giá trị dự kiến: <strong className="text-slate-900 dark:text-white font-mono font-bold">{Number(lead.value || 0).toLocaleString('vi-VN')} VND</strong></div>
              <div className="line-clamp-2">Nhu cầu: {lead.interest || 'Chưa ghi chú'}</div>
            </div>
          </div>
        </div>

        {/* Quotations for this lead */}
        {leadQuotations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Báo Giá Đã Lập ({leadQuotations.length})</span>
            </h4>
            <div className="space-y-1.5">
              {leadQuotations.map((q) => (
                <div key={q.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{q.quotationCode}</span>
                    <span className="text-slate-700 dark:text-slate-300 ml-2 font-medium">{q.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{Number(q.grandTotal).toLocaleString('vi-VN')} VND</span>
                    <span className="px-2 py-0.5 text-[10px] rounded font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{q.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline for this lead */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lịch Sử Hoạt Động & Tương Tác ({leadActivities.length})</span>
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {leadActivities.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Chưa có hoạt động tương tác nào được ghi nhận cho Lead này.
              </div>
            ) : (
              leadActivities.map((act) => (
                <div key={act.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">{act.subject}</span>
                    <span className="font-mono text-slate-400">{act.date} • {act.performedBy}</span>
                  </div>
                  {act.description && <p className="text-slate-600 dark:text-slate-400">{act.description}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewQuotationForLead(lead);
              }}
              className="px-3 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-600 hover:text-white rounded-xl border border-purple-200 dark:border-purple-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lập Báo Giá</span>
            </button>

            {lead.status !== 'WON' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConvertModal(lead);
                }}
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chuyển Đổi Sang Khách Hàng B2B (M03)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
