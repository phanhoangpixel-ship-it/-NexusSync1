import React, { useState, useEffect } from 'react';
import { WorkspaceWorkItem } from '../../types/workspace';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert, ArrowRight, X, Sparkles, CheckSquare } from 'lucide-react';

interface WorkQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: WorkspaceWorkItem[];
  onNavigate: (route: string) => void;
  onAction: (item: WorkspaceWorkItem, actionEndpoint: string, actionLabel: string) => void;
}

export const WorkQueueDrawer: React.FC<WorkQueueDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onNavigate,
  onAction,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDelegationActive, setIsDelegationActive] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBulkAction = () => {
    selectedItems.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item && item.actions && item.actions.length > 0) {
         // Assuming the first action is the default positive action
         onAction(item, item.actions[0].endpoint, `Xử lý hàng loạt`);
      }
    });
    setSelectedItems([]);
  };

  return (
    <div
      id="workqueue-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer select-none"
    >
      <div
        id="workqueue-drawer"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200 cursor-default select-text"
      >
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Hàng chờ xử lý SLA</h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  {items.length} tác vụ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Nhiệm vụ & Chứng từ cần phê duyệt theo vai trò</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature 3: SLA Performance Analytics & Feature 4: Delegation */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">SLA Performance (Tháng này)</span>
              <span className="text-xs font-bold text-emerald-600">94.5% On-time</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94.5%' }}></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
             <div className="flex items-center gap-2">
               <div 
                  className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isDelegationActive ? 'bg-blue-600' : 'bg-slate-300'}`} 
                  onClick={() => setIsDelegationActive(!isDelegationActive)}
               >
                 <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isDelegationActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
               </div>
               <span className="text-xs font-medium text-slate-700">Chế độ nhận ủy quyền (OOO)</span>
             </div>
          </div>
        </div>

        {/* Feature 2: Bulk Actions Toolbar */}
        {selectedItems.length > 0 && (
          <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-semibold text-blue-800">Đã chọn {selectedItems.length} tác vụ</span>
            <button
              onClick={handleBulkAction}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Duyệt hàng loạt
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">Tất cả hàng chờ đã hoàn thành!</p>
              <p className="text-xs text-slate-400 mt-1">Không có tác vụ nào tồn đọng vi phạm SLA.</p>
            </div>
          ) : (
            items.map((item) => {
              const isUrgent = item.priority === 'URGENT' || item.isOverdue;
              return (
                <div
                  key={item.id}
                  className={`flex gap-3 p-3.5 rounded-xl border transition-all ${
                    isUrgent
                      ? 'border-rose-300 bg-rose-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Bulk Select Checkbox (only for APPROVAL types to be safe) */}
                  {item.type === 'APPROVAL' && (
                    <div className="pt-1">
                      <input 
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedItems([...selectedItems, item.id]);
                          else setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.sourceModule} • {item.businessReference}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    {/* Feature 1: SLA Escalation & Delegation Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {item.isEscalated && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-1 uppercase">
                          <AlertTriangle className="w-2.5 h-2.5" /> Leo thang
                        </span>
                      )}
                      {item.delegatedFrom && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 flex items-center gap-1 uppercase">
                          <ShieldAlert className="w-2.5 h-2.5" /> Ủy quyền từ: {item.delegatedFrom}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 leading-snug">{item.title}</h4>
                    
                    {item.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                    )}
                    
                    {item.amount && (
                      <div className="mt-2 text-xs font-semibold text-slate-700 font-mono">
                        Giá trị: {item.amount.toLocaleString('vi-VN')} {item.currency || 'VND'}
                      </div>
                    )}
                    
                    {item.dueAt && (
                      <div className={`mt-2 text-xs font-semibold flex items-center gap-1 ${item.isOverdue ? 'text-rose-600' : 'text-amber-600'}`}>
                        <Clock className="w-3 h-3" />
                        Hạn xử lý: {new Date(item.dueAt).toLocaleString('vi-VN')} {item.slaHours ? `(SLA: ${item.slaHours}h)` : ''}
                      </div>
                    )}
                    
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          onNavigate(item.targetRoute);
                          onClose();
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>Mở chứng từ</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      
                      {item.actions && item.actions.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {item.actions.map((act) => (
                            <button
                              key={act.id}
                              onClick={() => onAction(item, act.endpoint, act.label)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shadow-2xs ${
                                act.variant === 'danger'
                                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Ưu tiên xử lý từ trên xuống dưới</span>
          <span className="font-mono text-[11px]">SLA: 24h</span>
        </div>
      </div>
    </div>
  );
};
