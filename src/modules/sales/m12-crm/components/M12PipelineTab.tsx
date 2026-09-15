import React from 'react';
import { LeadItem, OpportunityItem } from './m12Types';
import { Target, DollarSign, ChevronRight, ChevronLeft, ArrowRight, UserCheck, Sparkles } from 'lucide-react';

interface M12PipelineTabProps {
  leads: LeadItem[];
  opportunities: OpportunityItem[];
  onUpdateLeadStatus: (leadId: number, status: LeadItem['status']) => void;
  onSelectLead: (lead: LeadItem) => void;
  onOpenConvertModal: (lead: LeadItem) => void;
}

export const M12PipelineTab: React.FC<M12PipelineTabProps> = ({
  leads,
  opportunities,
  onUpdateLeadStatus,
  onSelectLead,
  onOpenConvertModal,
}) => {
  const stages: Array<{
    key: LeadItem['status'];
    name: string;
    desc: string;
    color: string;
    bgHeader: string;
    textColor: string;
  }> = [
    {
      key: 'NEW',
      name: '1. Tiếp Nhận (New)',
      desc: 'Sàng lọc nhu cầu sơ bộ',
      color: 'border-slate-300 dark:border-slate-600',
      bgHeader: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
      textColor: 'text-slate-700 dark:text-slate-300',
    },
    {
      key: 'QUALIFIED',
      name: '2. Thẩm Định (Qualified)',
      desc: 'Xác nhận ngân sách & quyền quyết định',
      color: 'border-blue-300 dark:border-blue-700',
      bgHeader: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
    {
      key: 'PROPOSAL',
      name: '3. Đề Xuất (Proposal)',
      desc: 'Gửi bản chào giá & kỹ thuật',
      color: 'border-purple-300 dark:border-purple-700',
      bgHeader: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200',
      textColor: 'text-purple-700 dark:text-purple-300',
    },
    {
      key: 'NEGOTIATION',
      name: '4. Đàm Phán (Negotiation)',
      desc: 'Thương thảo điều khoản hợp đồng',
      color: 'border-amber-300 dark:border-amber-700',
      bgHeader: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200',
      textColor: 'text-amber-700 dark:text-amber-300',
    },
    {
      key: 'WON',
      name: '5. Thắng (Closed Won)',
      desc: 'Chuyển đổi Khách hàng & Tạo Đơn SO',
      color: 'border-emerald-300 dark:border-emerald-700',
      bgHeader: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200',
      textColor: 'text-emerald-700 dark:text-emerald-300',
    },
  ];

  const stageKeysOrder: LeadItem['status'][] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'];

  const getNextStage = (current: LeadItem['status']): LeadItem['status'] | null => {
    const idx = stageKeysOrder.indexOf(current);
    if (idx !== -1 && idx < stageKeysOrder.length - 1) {
      return stageKeysOrder[idx + 1];
    }
    return null;
  };

  const getPrevStage = (current: LeadItem['status']): LeadItem['status'] | null => {
    const idx = stageKeysOrder.indexOf(current);
    if (idx > 0) {
      return stageKeysOrder[idx - 1];
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Phễu Chuyển Đổi Kinh Doanh (Sales Pipeline & Deal Flow Kanban)
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Kéo chuyển giai đoạn hoặc dùng phím điều hướng nhanh
        </span>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.key);
          const stageTotalValue = stageLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

          return (
            <div
              key={stage.key}
              className="bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3 flex flex-col min-h-[480px] space-y-3 shadow-2xs"
            >
              {/* Column Header */}
              <div className={`p-2.5 rounded-xl ${stage.bgHeader} border border-slate-200/60 dark:border-slate-700 space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono tracking-tight">{stage.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/40 dark:border-slate-700/60 font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Tổng giá trị:</span>
                  <span className="font-bold tabular-nums">
                    {(stageTotalValue / 1000000).toLocaleString('vi-VN')} Tr
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                {stageLeads.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Chưa có deal ở giai đoạn này
                  </div>
                ) : (
                  stageLeads.map((l) => {
                    const nextSt = getNextStage(l.status);
                    const prevSt = getPrevStage(l.status);

                    return (
                      <div
                        key={l.id}
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {l.leadCode}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                            {l.source}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {l.company}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {l.name}
                          </p>
                        </div>

                        {l.interest && (
                          <div className="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/80 p-1.5 rounded border border-slate-100 dark:border-slate-800 line-clamp-2">
                            {l.interest}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                          <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {Number(l.value || 0).toLocaleString('vi-VN')} VND
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {l.salespersonName || 'Admin'}
                          </span>
                        </div>

                        {/* Card Action Controls */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectLead(l)}
                            className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                          >
                            Chi tiết
                          </button>

                          <div className="flex items-center gap-1">
                            {prevSt && (
                              <button
                                type="button"
                                onClick={() => onUpdateLeadStatus(l.id, prevSt)}
                                className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[10px] transition-colors cursor-pointer"
                                title={`Lùi về: ${prevSt}`}
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}

                            {nextSt && (
                              <button
                                type="button"
                                onClick={() => onUpdateLeadStatus(l.id, nextSt)}
                                className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                                title={`Chuyển sang: ${nextSt}`}
                              >
                                <span>Tiếp</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}

                            {l.status === 'WON' && (
                              <button
                                type="button"
                                onClick={() => onOpenConvertModal(l)}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Chuyển đổi Khách hàng Master M03"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>B2B</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
