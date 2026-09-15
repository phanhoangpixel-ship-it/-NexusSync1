import React, { useState, useMemo } from 'react';
import { LeadItem } from './m12Types';
import { SelectedEntityContext } from '../../../types';
import {
  Search,
  Filter,
  UserCheck,
  Building2,
  Phone,
  Mail,
  DollarSign,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
  ExternalLink,
  FileText
} from 'lucide-react';

interface M12LeadsTabProps {
  leads: LeadItem[];
  onSelectLead: (lead: LeadItem) => void;
  onOpenConvertModal: (lead: LeadItem) => void;
  onOpenNewQuotationForLead: (lead: LeadItem) => void;
  onUpdateLeadStatus: (leadId: number, status: LeadItem['status']) => void;
  onDeleteLead: (leadId: number) => void;
  onOpenNewLeadModal: () => void;
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M12LeadsTab: React.FC<M12LeadsTabProps> = ({
  leads,
  onSelectLead,
  onOpenConvertModal,
  onOpenNewQuotationForLead,
  onUpdateLeadStatus,
  onDeleteLead,
  onOpenNewLeadModal,
  onSelectEntity,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchSearch =
        l.leadCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.phone && l.phone.includes(searchTerm));

      const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
      const matchSource = sourceFilter === 'ALL' || l.source === sourceFilter;

      return matchSearch && matchStatus && matchSource;
    });
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  const getStatusBadge = (status: LeadItem['status']) => {
    switch (status) {
      case 'NEW':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
      case 'CONTACTED':
        return 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700';
      case 'QUALIFIED':
        return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'PROPOSAL':
        return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      case 'NEGOTIATION':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
      case 'WON':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
      case 'LOST':
        return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã Lead, tên công ty, người liên hệ, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Giai đoạn:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả giai đoạn ({leads.length})</option>
            <option value="NEW">Mới (NEW)</option>
            <option value="CONTACTED">Đã liên hệ (CONTACTED)</option>
            <option value="QUALIFIED">Đủ điều kiện (QUALIFIED)</option>
            <option value="PROPOSAL">Đề xuất / Báo giá (PROPOSAL)</option>
            <option value="NEGOTIATION">Thương thảo (NEGOTIATION)</option>
            <option value="WON">Đã thắng / Chốt hợp đồng (WON)</option>
            <option value="LOST">Thất bại (LOST)</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả nguồn Lead</option>
            <option value="WEBSITE">Website Form</option>
            <option value="REFERRAL">Giới thiệu (Referral)</option>
            <option value="EVENT">Hội chợ / Triển lãm</option>
            <option value="COLD_CALL">Telesales / Cold Call</option>
            <option value="DIRECT_INQUIRY">Trực tiếp / Hotline</option>
          </select>

          <button
            type="button"
            onClick={onOpenNewLeadModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Lead</span>
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Danh Mục Khách Hàng Tiềm Năng (Active Leads Directory)
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
            Hiển thị {filteredLeads.length} / {leads.length} Leads
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/60">
                <th className="py-3 px-4">Mã Lead</th>
                <th className="py-3 px-4">Công ty & Khách hàng</th>
                <th className="py-3 px-4">Người liên hệ</th>
                <th className="py-3 px-4">Nguồn & Nhu cầu</th>
                <th className="py-3 px-4 text-right">Quy mô Dự kiến</th>
                <th className="py-3 px-4">Người phụ trách</th>
                <th className="py-3 px-4 text-center">Giai đoạn</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy khách hàng tiềm năng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {l.leadCode}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {l.company}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        {l.email && (
                          <span className="flex items-center gap-1 font-mono">
                            <Mail className="w-3 h-3" /> {l.email}
                          </span>
                        )}
                        {l.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3" /> {l.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {l.name}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {l.source}
                      </span>
                      {l.interest && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {l.interest}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {Number(l.value || 0).toLocaleString('vi-VN')} VND
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {l.salespersonName || 'Admin'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border ${getStatusBadge(
                          l.status
                        )}`}
                      >
                        {l.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectLead(l)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-all cursor-pointer"
                          title="Hồ sơ Lead 360°"
                        >
                          Hồ Sơ 360°
                        </button>

                        {l.status !== 'WON' && (
                          <button
                            type="button"
                            onClick={() => onOpenConvertModal(l)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1"
                            title="Chuyển đổi thành Khách hàng B2B Master Data M03"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Chuyển B2B</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenNewQuotationForLead(l)}
                          className="px-2 py-1 text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white rounded-lg border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
                          title="Lập Báo Giá Thương Mại"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteLead(l.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
