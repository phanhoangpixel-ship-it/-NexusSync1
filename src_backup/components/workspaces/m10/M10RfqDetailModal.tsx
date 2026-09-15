import React, { useState, useEffect } from 'react';
import { RFQItem, MasterSupplierOption, InvitedSupplier } from './m10Types';
import { X, ShieldCheck, Calendar, DollarSign, Tag, Layers, UserPlus, Building, RefreshCw, CheckCircle2 } from 'lucide-react';

interface M10RfqDetailModalProps {
  rfq: RFQItem | null;
  suppliers: MasterSupplierOption[];
  onClose: () => void;
  onUpdateStatus?: (rfqCode: string, newStatus: string) => Promise<void>;
  onNavigateToTab?: (tab: 'rfqs' | 'bids' | 'evaluation' | 'comparison' | 'awards' | 'analytics', rfqId?: string) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M10RfqDetailModal: React.FC<M10RfqDetailModalProps> = ({
  rfq,
  suppliers,
  onClose,
  onUpdateStatus,
  onNavigateToTab,
  onNotify,
}) => {
  const [invitedSuppliers, setInvitedSuppliers] = useState<InvitedSupplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [selectedSupplierToInvite, setSelectedSupplierToInvite] = useState<string>('');
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!rfq?.id) return;
    const fetchInvited = async () => {
      setLoadingSuppliers(true);
      try {
        const token = localStorage.getItem('erp_token');
        const res = await fetch(`/api/sourcing/rfqs/${rfq.id}/suppliers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setInvitedSuppliers(data);
        }
      } catch (err: any) {
        console.error('Error fetching invited suppliers:', err);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchInvited();
  }, [rfq?.id]);

  if (!rfq) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierToInvite) return;

    setIsInviting(true);
    try {
      const token = localStorage.getItem('erp_token');
      const res = await fetch(`/api/sourcing/rfqs/${rfq.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ supplierId: Number(selectedSupplierToInvite) })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi mời nhà cung cấp');
      }

      onNotify('success', 'Mời Thầu Thành Công', 'Đã thêm nhà cung cấp vào danh sách nhận hồ sơ mời thầu');
      setSelectedSupplierToInvite('');
      
      // Refresh invited list
      const updatedRes = await fetch(`/api/sourcing/rfqs/${rfq.id}/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (updatedRes.ok) {
        setInvitedSuppliers(await updatedRes.json());
      }
    } catch (err: any) {
      onNotify('danger', 'Thất bại', err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleStatusChange = async (targetStatus: string) => {
    if (!onUpdateStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(rfq.id, targetStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-bold font-mono tabular-nums text-xs">
              {rfq.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wide">{rfq.title}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold bg-purple-900/80 text-purple-200 border border-purple-600">
                  {rfq.status}
                </span>
              </div>
              <p className="text-[11px] text-purple-200/80 font-mono">
                {rfq.category ? `Danh mục: ${rfq.category}` : 'Gói thầu Strategic Sourcing'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto grow">
          {/* Quick Status Lifecycle Management */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Vòng Đời Gói Thầu (Lifecycle Transition)
              </span>
              {isUpdatingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {['DRAFT', 'OPEN_BIDDING', 'EVALUATING', 'CLOSED'].map((st) => {
                const isCurrent = rfq.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    disabled={isCurrent || isUpdatingStatus}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-400/40'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300'
                    } disabled:cursor-default`}
                  >
                    {st === 'DRAFT' && '1. Bản nháp (DRAFT)'}
                    {st === 'OPEN_BIDDING' && '2. Mở chào thầu (OPEN)'}
                    {st === 'EVALUATING' && '3. Đang chấm thầu (EVAL)'}
                    {st === 'CLOSED' && '4. Đóng thầu (CLOSED)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Hạn nộp
              </span>
              <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
                {rfq.deadline || 'Không giới hạn'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Dự toán
              </span>
              <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
                {rfq.budgetEstimate ? String(rfq.budgetEstimate) : 'Thương lượng'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Sản phẩm
              </span>
              <p className="font-mono tabular-nums font-bold text-purple-700 dark:text-purple-400 text-xs truncate">
                {rfq.productId ? `PRD-${rfq.productId}` : 'Gói tổng hợp'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Số lượng
              </span>
              <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
                {rfq.targetQuantity ? `${rfq.targetQuantity.toLocaleString()} sp` : 'Theo đề xuất'}
              </p>
            </div>
          </div>

          {/* Invited Suppliers Management Section */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Nhà Cung Cấp Được Mời Thầu ({invitedSuppliers.length})
                </span>
              </div>
              {loadingSuppliers && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInvite} className="flex items-center gap-2">
              <select
                value={selectedSupplierToInvite}
                onChange={e => setSelectedSupplierToInvite(e.target.value)}
                className="grow text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white outline-none focus:border-purple-500"
              >
                <option value="">-- Chọn Nhà cung cấp để mời thầu --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedSupplierToInvite || isInviting}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                {isInviting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Gửi thư mời</span>
              </button>
            </form>

            {/* Invited Suppliers List */}
            {invitedSuppliers.length === 0 ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic py-2 text-center">
                Chưa có nhà cung cấp nào được chỉ định mời thầu riêng. Gói thầu hiện ở chế độ công khai rộng rãi.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-36 overflow-y-auto">
                {invitedSuppliers.map(inv => (
                  <div key={inv.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {inv.supplierCode || `#${inv.supplierId}`}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{inv.supplierName}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Đã mời
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Badge */}
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-purple-700 dark:text-purple-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Đã đồng bộ Hồ Sơ Gói Thầu 360°</span>
              <span className="text-[11px] leading-relaxed">
                Toàn bộ phả hệ gói thầu RFQ và vết kiểm toán sha256 đã được đồng bộ vào Thanh Ngữ cảnh Đối Tượng và hệ thống đối soát ERP.
              </span>
            </div>
          </div>
        </div>

        {/* Footer with Workflow Action Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onNavigateToTab && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('bids', String(rfq.dbId || rfq.id));
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Nộp Chào Giá (Bids)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('evaluation', String(rfq.dbId || rfq.id));
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Chấm Thầu (Eval)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('comparison', String(rfq.dbId || rfq.id));
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>So Sánh &amp; Xếp Hạng</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ml-auto"
          >
            Đóng Cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
