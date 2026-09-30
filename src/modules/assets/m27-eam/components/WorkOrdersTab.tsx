import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Search,
  Filter,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Table as TableIcon,
  LayoutGrid,
  DollarSign,
  User,
  Calendar,
  Layers,
  ArrowRight,
  Package,
  ShieldCheck,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { CompleteWorkOrderModal } from './CompleteWorkOrderModal';
import { IssueSparePartModal } from './IssueSparePartModal';

interface WorkOrdersTabProps {
  workOrders: any[];
  onOpenCreateModal: () => void;
  onRefreshData: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const WorkOrdersTab: React.FC<WorkOrdersTabProps> = ({
  workOrders,
  onOpenCreateModal,
  onRefreshData,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [woPage, setWoPage] = useState<number>(1);
  const [woPageSize, setWoPageSize] = useState<number>(15);
  const [selectedWoIds, setSelectedWoIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [completingWo, setCompletingWo] = useState<any | null>(null);
  const [issuingWo, setIssuingWo] = useState<any | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const handleUpdateWoStatus = async (woId: number, newStatus: string) => {
    setUpdatingStatusId(woId);
    try {
      const res = await fetch(`/api/eam/work-orders/${woId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi cập nhật trạng thái phiếu WO');
      }
      const data = await res.json();
      onNotify('success', 'Chuyển trạng thái WO thành công', data.message);
      onRefreshData();
    } catch (err: any) {
      onNotify('danger', 'Chuyển trạng thái thất bại', err.message);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredWos = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchQuery =
        !searchQuery.trim() ||
        wo.woCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.assetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.assignedTechnicianName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.sourceReferenceCode?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || wo.status === statusFilter;
      const matchType = typeFilter === 'ALL' || wo.maintenanceType === typeFilter;
      const matchPriority = priorityFilter === 'ALL' || wo.priority === priorityFilter;

      return matchQuery && matchStatus && matchType && matchPriority;
    });
  }, [workOrders, searchQuery, statusFilter, typeFilter, priorityFilter]);

  const renderSourceBadge = (wo: any) => {
    if (wo.sourceModule === 'M38' || wo.sourceReferenceCode?.startsWith('INC-')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <Flame className="w-2.5 h-2.5" /> M38: {wo.sourceReferenceCode || 'Sự cố'}
        </span>
      );
    }
    if (wo.sourceModule === 'M15' || wo.sourceReferenceCode?.startsWith('RMA-')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <RotateCcw className="w-2.5 h-2.5" /> M15: {wo.sourceReferenceCode || 'RMA'}
        </span>
      );
    }
    if (wo.sourceModule === 'M27_PM' || wo.sourceReferenceCode?.startsWith('PMS-') || wo.maintenanceType === 'PREVENTIVE') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Clock className="w-2.5 h-2.5" /> PM Plan
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* L1 COMMAND BAR */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã WO, tên máy, kỹ thuật viên, mã sự cố..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all font-medium"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">Tất cả trạng thái WO</option>
            <option value="OPEN">OPEN (Chờ thực hiện)</option>
            <option value="IN_PROGRESS">IN_PROGRESS (Đang sửa chữa)</option>
            <option value="COMPLETED">COMPLETED (Đã nghiệm thu)</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">Tất cả loại bảo trì</option>
            <option value="PREVENTIVE">Bảo dưỡng định kỳ (PM)</option>
            <option value="CORRECTIVE">Sửa chữa đột xuất (M38/M15)</option>
            <option value="PREDICTIVE">Dự đoán IoT</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">Tất cả ưu tiên</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT (Khẩn cấp)</option>
          </select>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Chế độ Bảng"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Chế độ Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Phát Phiếu WO Mới</span>
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs bg-white dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã Phiếu WO</th>
                  <th className="py-3 px-4">Thiết Bị Cần Bảo Trì</th>
                  <th className="py-3 px-4">Loại &amp; Nguồn Trigger</th>
                  <th className="py-3 px-4">Độ Ưu Tiên</th>
                  <th className="py-3 px-4">Kỹ Thuật Viên Phụ Trách</th>
                  <th className="py-3 px-4 text-center">Downtime (Giờ)</th>
                  <th className="py-3 px-4 text-right">Chi Phí MRO (₫)</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác Nghiệp Vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                {filteredWos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Không có phiếu bảo trì nào trong danh sách.
                    </td>
                  </tr>
                ) : (
                  filteredWos.map((wo) => (
                    <tr key={wo.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-blue-700 dark:text-blue-400">{wo.woCode}</div>
                        {wo.issuedPartsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                            <Package className="w-3 h-3" /> {wo.issuedPartsCount} phụ tùng
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{wo.assetName}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">{wo.description}</div>
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              wo.maintenanceType === 'PREVENTIVE'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {wo.maintenanceType === 'PREVENTIVE' ? 'Bảo dưỡng định kỳ' : 'Sửa chữa đột xuất'}
                          </span>
                        </div>
                        {renderSourceBadge(wo)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            wo.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : wo.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {wo.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{wo.assignedTechnicianName}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {wo.downtimeHours}h
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {wo.totalCost ? wo.totalCost.toLocaleString('vi-VN') : '0'} ₫
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            wo.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : wo.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                              : wo.status === 'WAITING_PART'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          }`}
                        >
                          {wo.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {wo.status === 'OPEN' && (
                            <button
                              onClick={() => handleUpdateWoStatus(wo.id, 'IN_PROGRESS')}
                              disabled={updatingStatusId === wo.id}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                              title="Bắt đầu triển khai sửa chữa"
                            >
                              Bắt Đầu
                            </button>
                          )}

                          {wo.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleUpdateWoStatus(wo.id, 'WAITING_PART')}
                              disabled={updatingStatusId === wo.id}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                              title="Tạm dừng chờ phụ tùng về"
                            >
                              Chờ Phụ Tùng
                            </button>
                          )}

                          {wo.status === 'WAITING_PART' && (
                            <button
                              onClick={() => handleUpdateWoStatus(wo.id, 'IN_PROGRESS')}
                              disabled={updatingStatusId === wo.id}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                              title="Tiếp tục bảo trì khi phụ tùng đã có"
                            >
                              Tiếp Tục
                            </button>
                          )}

                          {wo.status !== 'COMPLETED' && (
                            <button
                              onClick={() => setIssuingWo(wo)}
                              className="px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Xuất phụ tùng thay thế qua M17 Single-Writer"
                            >
                              <Package className="w-3 h-3 text-blue-600" /> Phụ Tùng
                            </button>
                          )}

                          {wo.status !== 'COMPLETED' ? (
                            <button
                              onClick={() => setCompletingWo(wo)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" /> Nghiệm Thu
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Đã hoàn thành (Khóa)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: OPEN */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Chờ Thực Hiện (OPEN)
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-mono font-bold rounded-full">
                {workOrders.filter((w) => w.status === 'OPEN').length}
              </span>
            </div>

            <div className="space-y-3">
              {workOrders
                .filter((w) => w.status === 'OPEN')
                .map((wo) => (
                  <div
                    key={wo.id}
                    className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{wo.woCode}</span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">
                        {wo.priority}
                      </span>
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">{wo.assetName}</h5>
                      <div className="mt-1">{renderSourceBadge(wo)}</div>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{wo.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] gap-2">
                      <span className="text-slate-500 truncate">{wo.assignedTechnicianName}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setIssuingWo(wo)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Package className="w-3 h-3" /> Phụ tùng
                        </button>
                        <button
                          onClick={() => setCompletingWo(wo)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3 h-3" /> Nghiệm thu
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Đang Bảo Trì (IN PROGRESS)
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-mono font-bold rounded-full">
                {workOrders.filter((w) => w.status === 'IN_PROGRESS' || w.status === 'ASSIGNED').length}
              </span>
            </div>

            <div className="space-y-3">
              {workOrders
                .filter((w) => w.status === 'IN_PROGRESS' || w.status === 'ASSIGNED')
                .map((wo) => (
                  <div
                    key={wo.id}
                    className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{wo.woCode}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                        {wo.priority}
                      </span>
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">{wo.assetName}</h5>
                      <div className="mt-1">{renderSourceBadge(wo)}</div>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{wo.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] gap-2">
                      <span className="text-slate-500 truncate">{wo.assignedTechnicianName}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setIssuingWo(wo)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Package className="w-3 h-3" /> Phụ tùng
                        </button>
                        <button
                          onClick={() => setCompletingWo(wo)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3 h-3" /> Nghiệm thu
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 3: COMPLETED */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Đã Nghiệm Thu (COMPLETED)
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-mono font-bold rounded-full">
                {workOrders.filter((w) => w.status === 'COMPLETED').length}
              </span>
            </div>

            <div className="space-y-3">
              {workOrders
                .filter((w) => w.status === 'COMPLETED')
                .map((wo) => (
                  <div
                    key={wo.id}
                    className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5 opacity-90"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">{wo.woCode}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        COMPLETED
                      </span>
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">{wo.assetName}</h5>
                      <div className="mt-1">{renderSourceBadge(wo)}</div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500">Chi phí MRO:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {wo.totalCost ? wo.totalCost.toLocaleString('vi-VN') : '0'} ₫
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE WORK ORDER MODAL */}
      <CompleteWorkOrderModal
        isOpen={!!completingWo}
        onClose={() => setCompletingWo(null)}
        workOrder={completingWo}
        onSuccess={onRefreshData}
        onNotify={onNotify}
      />

      {/* ISSUE SPARE PART MODAL (M17 DELEGATE) */}
      <IssueSparePartModal
        isOpen={!!issuingWo}
        onClose={() => setIssuingWo(null)}
        workOrder={issuingWo}
        onSuccess={onRefreshData}
        onNotify={onNotify}
      />
    </div>
  );
};
