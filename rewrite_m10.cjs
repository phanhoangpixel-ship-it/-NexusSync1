const fs = require('fs');
const content = `import React, { useState, useEffect, useCallback } from 'react';
import { SelectedEntityContext } from '../../types';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import {
  SearchCode,
  FileText,
  DollarSign,
  ShieldCheck,
  Plus,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
  Send,
  Award,
  Trash2
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface M10StrategicSourcingWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M10StrategicSourcingWorkspace: React.FC<M10StrategicSourcingWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'rfqs' | 'bids' | 'evaluation' | 'analytics'>('M10', 'rfqs');

  const [rfqs, setRfqs] = useState<any[]>([]);

  // Create Form State
  const [newRfqTitle, setNewRfqTitle] = useState('');
  const [newRfqDeadline, setNewRfqDeadline] = useState('');
  const [newRfqProductId, setNewRfqProductId] = useState('');
  const [newRfqQuantity, setNewRfqQuantity] = useState('');

  // Selected RFQ Detail Modal State
  const [selectedRfqForModal, setSelectedRfqForModal] = useState<any | null>(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<any>(null);

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const res = await fetch('/api/sourcing/rfqs', {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (!res.ok) throw new Error('Failed to fetch RFQs');
      const data = await res.json();
      setRfqs(data);
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải danh sách', err.message);
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRfqTitle) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('erp_token');
      const payload = {
        title: newRfqTitle,
        deadline: newRfqDeadline || undefined,
        productId: newRfqProductId || undefined,
        targetQuantity: newRfqQuantity || undefined,
        idempotencyKey: \`rfq-create-\${Date.now()}\`
      };

      const res = await fetch('/api/sourcing/rfqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi hệ thống');
      }

      const data = await res.json();
      
      onNotify('success', 'Tạo Gói Thầu Thành Công', \`Mã RFQ: \${data.code || 'Thành công'}\`);
      setNewRfqTitle('');
      setNewRfqDeadline('');
      setNewRfqProductId('');
      setNewRfqQuantity('');
      
      await fetchRfqs();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo RFQ', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRfq = async (rfqId: string) => {
    try {
      const token = localStorage.getItem('erp_token');
      const res = await fetch(\`/api/sourcing/rfqs/\${rfqId}\`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi huỷ RFQ');
      }
      onNotify('success', 'Huỷ Gói Thầu Thành Công', \`Đã huỷ gói thầu \${rfqId}\`);
      await fetchRfqs();
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    }
  };

  const handleSelectRfq = (rfq: any) => {
    setSelectedRfqForModal(rfq);
    onSelectEntity({
      type: 'STRATEGIC_SOURCING',
      id: rfq.id,
      code: rfq.id,
      title: rfq.title,
      status: rfq.status,
      lineage: [
        { id: rfq.id, type: 'Gói thầu RFQ', code: rfq.id, relation: 'CURRENT_RFQ', status: rfq.status },
        { id: 'M10-SOURCING', type: 'Phân hệ M10', code: 'M10_STRATEGIC_SOURCING', relation: 'PARENT_MODULE', status: 'ACTIVE' }
      ],
      auditTrail: [
        { id: 1, action: 'INSPECT_RFQ_BIDDING', timestamp: new Date().toISOString(), user: 'admin', sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
      ],
      glEntries: []
    });
    onNotify('info', 'Đã tải chi tiết gói thầu', \`Đã chọn gói thầu \${rfq.id} vào Thanh Ngữ cảnh Đối Tượng.\`);
  };

  const handleExportCSV = () => {
    const csvHeader = "RFQ_ID,Title,Category,Deadline,BidsCount,Status,BudgetEstimate\\n";
    const csvRows = rfqs.map(r => \`"\${r.id}","\${r.title}","\${r.category}","\${r.deadline}","\${r.bidsCount}","\${r.status}","\${r.budgetEstimate}"\`).join('\\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', \`sourcing_rfqs_\${new Date().toISOString().split('T')[0]}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất File CSV Thành công', 'Dữ liệu RFQ đã được tải về máy của bạn.');
  };

  return (
    <div className="space-y-4">
      {/* Workspace Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mb-10 pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-400/30 shadow-inner">
              <SearchCode className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">M10 Strategic Sourcing</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">NEXUS-SRM-SOURCING // GLOBAL BIDDING PLATFORM</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Phân hệ Quản trị Nguồn cung Chiến lược (Strategic Sourcing). Tổ chức Đấu thầu (RFx), Yêu cầu Báo giá (RFQ), đánh giá năng lực Nhà cung cấp đa chiều và phân tích tối ưu hóa ngân sách Mua sắm (Savings Analytics) theo chuẩn bảo mật đa tầng.
          </p>
        </div>

        <div className="relative z-10 flex gap-2 w-full md:w-auto">
          <button 
            onClick={fetchRfqs}
            disabled={loading}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-xl text-xs font-bold transition-all shadow-sm border border-slate-700/50 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin' : ''}\`} />
            <span>Đồng bộ</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-100 hover:bg-white text-slate-900 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo cáo CSV</span>
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {[
          { id: 'rfqs', label: '10.1 Quản trị Yêu cầu RFQ', icon: <FileText className="w-4 h-4" /> },
          { id: 'bids', label: '10.2 Hồ sơ Chào giá (Bids)', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'evaluation', label: '10.3 Hội đồng Phê duyệt', icon: <Award className="w-4 h-4" /> },
          { id: 'analytics', label: '10.4 Tiết kiệm (Savings)', icon: <DollarSign className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={\`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap \${
              activeTab === tab.id 
                ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs'
            }\`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: RFQs */}
      {activeTab === 'rfqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center border border-purple-200">
                    <Layers className="w-3.5 h-3.5 text-purple-700" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Danh mục Gói thầu Đang mở (Active RFQs)</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {rfqs.length} RECORDS
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="p-3">Mã RFQ</th>
                      <th className="p-3">Gói thầu / Nội dung</th>
                      <th className="p-3">Hạn nộp</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {rfqs.map(rfq => (
                      <tr key={rfq.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-purple-700">
                          <button onClick={() => handleSelectRfq(rfq)} className="hover:underline">{rfq.id}</button>
                        </td>
                        <td className="p-3 font-medium text-slate-900">
                          <div className="truncate max-w-[200px]" title={rfq.title}>{rfq.title}</div>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{rfq.deadline}</td>
                        <td className="p-3">
                          <span className={\`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono border \${
                            rfq.status === 'OPEN_BIDDING' || rfq.status === 'DRAFT' || rfq.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            rfq.status === 'EVALUATION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            rfq.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }\`}>
                            {rfq.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                           <button
                             onClick={() => handleSelectRfq(rfq)}
                             className="text-[10px] font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors"
                           >
                             CHI TIẾT
                           </button>
                           {rfq.status !== 'CANCELLED' && rfq.status !== 'AWARDED' && (
                             <button
                               onClick={() => setConfirmDialog({
                                 isOpen: true,
                                 title: 'Hủy Gói Thầu RFQ',
                                 message: \`Bạn có chắc chắn muốn hủy gói thầu \${rfq.id} không?\`,
                                 variant: 'danger',
                                 onConfirm: () => {
                                   cancelRfq(rfq.id);
                                   setConfirmDialog(null);
                                 },
                                 onClose: () => setConfirmDialog(null)
                               })}
                               className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                             >
                               HỦY
                             </button>
                           )}
                        </td>
                      </tr>
                    ))}
                    {rfqs.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                          Chưa có yêu cầu báo giá (RFQ) nào được tạo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden sticky top-4">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center border border-emerald-200">
                  <Plus className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Khởi tạo Yêu cầu RFQ Mới</h3>
              </div>
              <form onSubmit={handleCreateRfq} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tên Gói Thầu / Nhu cầu (*)</label>
                  <input 
                    type="text" 
                    required
                    value={newRfqTitle}
                    onChange={e => setNewRfqTitle(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-400 focus:bg-white transition-all shadow-inner"
                    placeholder="VD: Cung ứng Tấm Silicon Wafer..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Hạn nộp hồ sơ (Tùy chọn)</label>
                  <input 
                    type="date" 
                    value={newRfqDeadline}
                    onChange={e => setNewRfqDeadline(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-400 focus:bg-white transition-all shadow-inner text-slate-600"
                  />
                </div>
                
                <div className="space-y-1 border-t border-slate-100 pt-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Sản phẩm (Tùy chọn)</label>
                  <input 
                    type="number" 
                    value={newRfqProductId}
                    onChange={e => setNewRfqProductId(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-400 focus:bg-white transition-all shadow-inner text-slate-600"
                    placeholder="ID Sản phẩm"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Số lượng mục tiêu (Tùy chọn)</label>
                  <input 
                    type="number" 
                    value={newRfqQuantity}
                    onChange={e => setNewRfqQuantity(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-400 focus:bg-white transition-all shadow-inner text-slate-600"
                    placeholder="VD: 1000"
                  />
                </div>

                <div className="pt-2">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                      RFQ mới sẽ tự động phát hành thông báo đến các nhà cung cấp thỏa mãn cấu hình Phân loại (Supplier Segmentation) tương ứng trong M09.
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !newRfqTitle}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Phát hành Gói thầu RFQ</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bids */}
      {activeTab === 'bids' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hồ sơ Chào giá Nhà cung cấp (Supplier Bids & Quotations)</h3>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Comparative Matrix
            </span>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Hệ thống Đọ giá Tự động (Bid Comparison)</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Mọi hồ sơ chào giá gửi từ cổng thông tin nhà cung cấp SRM đều được chuẩn hóa đơn giá, điều khoản thương mại và thời gian giao hàng để hiển thị trên bảng so sánh trực quan.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Evaluation */}
      {activeTab === 'evaluation' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hội đồng Chấm thầu & Phê duyệt Trao thầu (Awarding Committee)</h3>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Governance & Compliance
            </span>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-700" />
              <span>Quy trình Trao thầu Chuẩn Doanh nghiệp</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Các gói thầu sau khi chấm điểm kỹ thuật và tài chính sẽ được phê duyệt bởi Hội đồng Sourcing để tự động chuyển đổi thành Hợp đồng khung hoặc Đơn hàng mua (PO).
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Analytics */}
      {activeTab === 'analytics' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Báo cáo Phân tích Sourcing & Tiết kiệm Ngân sách (Savings Analytics)</h3>
            <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Sourcing Metrics
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng Gói thầu RFQ</span>
              <p className="font-mono font-bold text-slate-900 text-sm">{rfqs.length} Gói thầu</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Đang Đấu thầu</span>
              <p className="font-mono font-bold text-purple-700 text-sm">{rfqs.filter(r => ['OPEN_BIDDING', 'PUBLISHED'].includes(r.status)).length} Gói thầu</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Đã Trao thầu</span>
              <p className="font-mono font-bold text-emerald-700 text-sm">{rfqs.filter(r => r.status === 'AWARDED').length} Gói thầu</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Ngân sách Tiết kiệm</span>
              <p className="font-mono font-bold text-blue-700 text-sm">N/A</p>
            </div>
          </div>
        </div>
      )}

      {/* RFQ Detail Modal */}
      {selectedRfqForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-[#1e293b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-bold font-mono">
                  {selectedRfqForModal.id}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">{selectedRfqForModal.title}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Danh mục: {selectedRfqForModal.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRfqForModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Hạn nộp hồ sơ</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">{selectedRfqForModal.deadline}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Ngân sách dự kiến</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">{selectedRfqForModal.budgetEstimate}</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-purple-900">Đã đồng bộ Hồ Sơ Gói Thầu 360°</span>
                  <span className="text-[11px] text-purple-800">Toàn bộ phả hệ gói thầu RFQ và vết kiểm toán đã được ghi nhận vào hệ thống đối soát ERP.</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedRfqForModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Đóng Cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirm Dialog Instance */}
      {confirmDialog && (
        <ConfirmDialog {...confirmDialog} />
      )}
    </div>
  );
};

export default M10StrategicSourcingWorkspace;
`;

fs.writeFileSync('src/components/workspaces/M10StrategicSourcingWorkspace.tsx', content);
console.log("Rewritten M10StrategicSourcingWorkspace.tsx successfully");
