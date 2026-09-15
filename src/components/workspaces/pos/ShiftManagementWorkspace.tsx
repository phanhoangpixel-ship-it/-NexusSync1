import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  DollarSign,
  User,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  RefreshCw,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Receipt,
  Store,
  Building2,
  Check,
  X,
  Eye,
  Info,
  Calendar,
  CreditCard,
  QrCode,
  Truck,
  HelpCircle
} from 'lucide-react';
import { formatVNDCurrency } from '../../../utils/currencyFormatter';
import { formatLocalDateTime } from '../../../utils/timeUtils';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ConfirmDialogState } from '../../../types';

interface ShiftManagementWorkspaceProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const ShiftManagementWorkspace: React.FC<ShiftManagementWorkspaceProps> = ({ onNotify }) => {
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [closedShifts, setClosedShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedShiftDetail, setSelectedShiftDetail] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Open Shift Form State
  const [openModalOpen, setOpenModalOpen] = useState<boolean>(false);
  const [openingFloat, setOpeningFloat] = useState<string>('2000000');
  const [cashDrawerId, setCashDrawerId] = useState<number>(1);
  const [cashierUserId, setCashierUserId] = useState<string>('1');
  const [cashierName, setCashierName] = useState<string>('Nguyễn Văn An');
  const [openNotes, setOpenNotes] = useState<string>('Ca trực sáng tại Quầy số 1 (REG-01)');

  // Close Shift Form State
  const [closeModalOpen, setCloseModalOpen] = useState<boolean>(false);
  const [closeNotes, setCloseNotes] = useState<string>('Đối soát và kết ca tự động');
  const [denominations, setDenominations] = useState<Record<number, number>>({
    500000: 0,
    200000: 0,
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  const fetchShiftData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch active shift
      let activeRes = await fetch('/api/shift/active');
      let activeData = [];
      if (activeRes.ok) {
        activeData = await activeRes.json();
      }

      if (!Array.isArray(activeData) || activeData.length === 0) {
        // Automatically open a default active shift if none exists
        try {
          const openRes = await fetch('/api/shift/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cashDrawerId: 1,
              cashierUserId: 'USR-ADMIN',
              cashierName: 'Hoàng Nam (Admin)',
              openingFloat: 2000000,
              notes: 'Tự động khởi tạo ca làm việc mặc định'
            })
          });
          if (openRes.ok) {
            activeRes = await fetch('/api/shift/active');
            if (activeRes.ok) {
              activeData = await activeRes.json();
            }
          }
        } catch (e) {
          console.error('Auto open shift error:', e);
        }
      }

      if (Array.isArray(activeData) && activeData.length > 0) {
        const currentActive = activeData[0];
        // Authoritative Rule: fetch GET /api/shift/:id/summary to obtain reconstructedExpectedCash
        const summaryRes = await fetch(`/api/shift/${currentActive.id}/summary`);
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setActiveShift({ ...currentActive, ...summaryData });
        } else {
          setActiveShift(currentActive);
        }
      } else {
        setActiveShift(null);
      }

      // 2. Fetch closed history
      const historyRes = await fetch('/api/shift/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (Array.isArray(historyData)) {
          setClosedShifts(historyData);
        }
      }
    } catch (err: any) {
      console.error('Fetch shift data error:', err);
      onNotify('danger', 'Lỗi kết nối', err.message || 'Không thể tải thông tin ca làm việc từ server.');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchShiftData();
  }, [fetchShiftData]);

  // Handle Open Shift
  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatVal = Number(openingFloat);
    if (isNaN(floatVal) || floatVal < 0) {
      onNotify('warning', 'Dữ liệu không hợp lệ', 'Tiền quỹ đầu ca phải là số >= 0.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Mở ca làm việc mới',
      message: `Bạn có chắc chắn muốn mở ca mới với tiền quỹ đầu ca ${formatVNDCurrency(floatVal)} tại Quầy #${cashDrawerId}?`,
      confirmText: 'Mở ca ngay',
      cancelText: 'Hủy bỏ',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch('/api/shift/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cashDrawerId: Number(cashDrawerId),
              cashierUserId: String(cashierUserId),
              cashierName,
              openingFloat: floatVal,
              notes: openNotes
            })
          });
          const data = await res.json();
          if (res.ok) {
            onNotify('success', 'Mở ca thành công', `Đã khởi tạo ca mới: ${data.shiftNo || data.id}`);
            setOpenModalOpen(false);
            fetchShiftData();
          } else {
            onNotify('danger', 'Lỗi mở ca', data.error || 'Không thể mở ca.');
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi hệ thống', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null)
    } as any);
  };

  // Calculate physical counted cash from denominations
  const totalCountedCash = Object.entries(denominations).reduce((sum, [denom, qty]) => {
    return sum + (Number(denom) * Number(qty || 0));
  }, 0);

  // Handle Close Shift
  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const formattedDenominations = Object.entries(denominations)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([denom, qty]) => ({
        denomination: Number(denom),
        quantity: Number(qty)
      }));

    if (formattedDenominations.length === 0) {
      onNotify('warning', 'Chưa kiểm tiền', 'Vui lòng nhập số lượng mệnh giá tiền mặt thực tế trong két.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Đóng và Đối soát Ca',
      message: `Tổng tiền thực tế kiểm đếm: ${formatVNDCurrency(totalCountedCash)}. Xác nhận đóng ca ${activeShift.shiftNo}?`,
      confirmText: 'Xác nhận Đóng Ca',
      cancelText: 'Kiểm tra lại',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/shift/${activeShift.shiftNo}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              denominations: formattedDenominations,
              actualCash: totalCountedCash,
              notes: closeNotes
            })
          });
          const data = await res.json();
          if (res.ok) {
            onNotify('success', 'Đóng ca thành công', `Ca ${activeShift.shiftNo} đã chốt. Trạng thái: ${data.status}`);
            setCloseModalOpen(false);
            fetchShiftData();
          } else {
            onNotify('danger', 'Lỗi đóng ca', data.error || 'Không thể đóng ca.');
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi hệ thống', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null)
    } as any);
  };

  const handleViewDetail = async (shiftNo: string) => {
    try {
      const res = await fetch(`/api/shift/${shiftNo}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedShiftDetail(data);
        setDetailModalOpen(true);
      } else {
        onNotify('danger', 'Lỗi tải chi tiết', 'Không tìm thấy thông tin chi tiết ca.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi kết nối', err.message);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Lock className="w-4 h-4" />
            <span>M16 POS Retail • Shift & Cash Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Ca & Két Thu Ngân</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm soát ca làm việc, luân chuyển tiền mặt, đối soát doanh thu và chốt ca chính xác theo chuẩn ERP.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={fetchShiftData}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          {!activeShift ? (
            <button
              onClick={() => setOpenModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition flex items-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Mở Ca Mới</span>
            </button>
          ) : (
            <button
              onClick={() => setCloseModalOpen(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-sm transition flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Đóng & Đối Soát Ca</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Card */}
      {activeShift ? (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-slate-700/60">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400 font-bold text-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold">{activeShift.shiftNo}</h2>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-semibold uppercase">
                    {activeShift.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mở lúc: {formatLocalDateTime(activeShift.openedAt)}</span>
                  <span>•</span>
                  <User className="w-3.5 h-3.5" />
                  <span>Thu ngân: {activeShift.cashierName} ({activeShift.cashierUserId})</span>
                </p>
              </div>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-6 text-right">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Tiền quỹ ban đầu</p>
                <p className="text-lg font-bold text-slate-100">{formatVNDCurrency(activeShift.openingFloat || 0)}</p>
              </div>
              <div className="border-l border-slate-700 pl-6">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Expected Cash (Dự kiến trong két)</p>
                <p className="text-xl font-extrabold text-emerald-400">
                  {formatVNDCurrency(activeShift.reconstructedExpectedCash ?? activeShift.expectedCash ?? activeShift.openingFloat)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tiền mặt bán hàng (Cash Sales)</span>
              </p>
              <p className="text-lg font-bold text-white mt-1">
                {formatVNDCurrency(activeShift.cashSalesTotal || 0)}
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>Thẻ / QR / Chuyển khoản</span>
              </p>
              <p className="text-lg font-bold text-white mt-1">
                {formatVNDCurrency((activeShift.cardSalesTotal || 0) + (activeShift.transferSalesTotal || 0))}
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Nộp tiền / Bổ sung quỹ (Cash In)</span>
              </p>
              <p className="text-lg font-bold text-white mt-1">
                {formatVNDCurrency(activeShift.cashDropsTotal || 0)}
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                <span>Chi phí / Hoàn tiền (Cash Out)</span>
              </p>
              <p className="text-lg font-bold text-white mt-1">
                {formatVNDCurrency(activeShift.payoutsTotal || 0)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Chưa có Ca Làm Việc nào đang mở (ACTIVE SHIFT)</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Thu ngân cần mở ca mới và nhập quỹ tiền thối đầu ca trước khi thực hiện các giao dịch bán hàng tiền mặt POS.
          </p>
          <button
            onClick={() => setOpenModalOpen(true)}
            className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition inline-flex items-center space-x-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Mở Ca Làm Việc Ngay</span>
          </button>
        </div>
      )}

      {/* Shift History Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-slate-900">Lịch sử Ca đã đóng & Đối soát</h3>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
            Tổng cộng: {closedShifts.length} ca
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-4">Mã Ca (Shift No)</th>
                <th className="p-4">Thu ngân / Nhân viên</th>
                <th className="p-4">Mở ca</th>
                <th className="p-4">Đóng ca</th>
                <th className="p-4 text-right">Quỹ đầu</th>
                <th className="p-4 text-right">Expected Cash</th>
                <th className="p-4 text-right">Actual Count</th>
                <th className="p-4 text-center">Chênh lệch</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closedShifts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Chưa có lịch sử ca làm việc đã đóng.
                  </td>
                </tr>
              ) : (
                closedShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-slate-800">{shift.shiftNo}</td>
                    <td className="p-4 font-medium text-slate-900">{shift.cashierName}</td>
                    <td className="p-4 text-slate-600">{shift.openedAt ? formatLocalDateTime(shift.openedAt) : '-'}</td>
                    <td className="p-4 text-slate-600">{shift.closedAt ? formatLocalDateTime(shift.closedAt) : '-'}</td>
                    <td className="p-4 text-right font-mono">{formatVNDCurrency(shift.openingFloat)}</td>
                    <td className="p-4 text-right font-mono text-slate-600">{formatVNDCurrency(shift.expectedCash)}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">{formatVNDCurrency(shift.actualCountedCash || 0)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                        (shift.varianceAmount || 0) === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {formatVNDCurrency(shift.varianceAmount || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        shift.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {shift.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleViewDetail(shift.shiftNo)}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                        title="Xem chi tiết ca"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      {openModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2 text-emerald-700">
                <Unlock className="w-5 h-5" />
                <h3 className="font-bold text-lg text-slate-900">Mở Ca Làm Việc & Két Thu Ngân</h3>
              </div>
              <button onClick={() => setOpenModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleOpenShiftSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã Quầy Thu Ngân (Drawer ID)</label>
                <select
                  value={cashDrawerId}
                  onChange={(e) => setCashDrawerId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={1}>Quầy thu ngân số 1 (REG-01 - Trụ sở chính)</option>
                  <option value={2}>Quầy thu ngân số 2 (REG-02 - Chi nhánh)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã Nhân Viên Thu Ngân</label>
                  <input
                    type="text"
                    value={cashierUserId}
                    onChange={(e) => setCashierUserId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ tên Thu Ngân</label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiền Quỹ Đầu Ca (Opening Float)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(e.target.value)}
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <div className="absolute right-3 top-2.5 text-slate-400 font-semibold text-sm">VNĐ</div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Số tiền mặt có sẵn trong két để thối tiền cho khách (Float).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú ca</label>
                <textarea
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                >
                  Xác nhận Mở Ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {closeModalOpen && activeShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2 text-rose-700">
                <Lock className="w-5 h-5" />
                <h3 className="font-bold text-lg text-slate-900">Đóng & Đối Soát Ca: {activeShift.shiftNo}</h3>
              </div>
              <button onClick={() => setCloseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCloseShiftSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Quỹ đầu ca</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{formatVNDCurrency(activeShift.openingFloat)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Tiền mặt bán hàng</p>
                  <p className="text-base font-bold text-emerald-600 mt-1">{formatVNDCurrency(activeShift.cashSalesTotal || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Expected Cash</p>
                  <p className="text-lg font-extrabold text-blue-700 mt-1">
                    {formatVNDCurrency(activeShift.reconstructedExpectedCash ?? activeShift.expectedCash ?? activeShift.openingFloat)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2 text-sm">Kiểm đếm tiền mặt thực tế theo mệnh giá (Denominations)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000].map((denom) => (
                    <div key={denom} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">{formatVNDCurrency(denom)}</span>
                        <span className="text-xs text-slate-400 font-mono">x {denominations[denom] || 0}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={denominations[denom] || ''}
                        onChange={(e) => setDenominations({ ...denominations, [denom]: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-800 font-bold uppercase">Tổng tiền đếm thực tế (Actual Counted Cash)</p>
                  <p className="text-2xl font-black text-emerald-700 mt-0.5">{formatVNDCurrency(totalCountedCash)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600 font-bold uppercase">Chênh lệch (Variance)</p>
                  <p className={`text-xl font-bold mt-0.5 font-mono ${
                    totalCountedCash - (activeShift.reconstructedExpectedCash ?? activeShift.expectedCash ?? 0) === 0
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}>
                    {formatVNDCurrency(totalCountedCash - (activeShift.reconstructedExpectedCash ?? activeShift.expectedCash ?? 0))}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú đối soát / Giải trình chênh lệch</label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Nhập giải trình nếu có chênh lệch thừa/thiếu tiền..."
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                >
                  Xác nhận Đóng Ca & Chốt Sổ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shift Detail Drawer / Modal */}
      {detailModalOpen && selectedShiftDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2 text-slate-900">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-lg">Chi tiết Ca: {selectedShiftDetail.shiftNo}</h3>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Thu ngân</p>
                  <p className="font-semibold text-slate-800">{selectedShiftDetail.cashierName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Trạng thái</p>
                  <p className="font-semibold text-emerald-700">{selectedShiftDetail.status}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Mở lúc</p>
                  <p className="text-slate-700">{selectedShiftDetail.openedAt ? formatLocalDateTime(selectedShiftDetail.openedAt) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Đóng lúc</p>
                  <p className="text-slate-700">{selectedShiftDetail.closedAt ? formatLocalDateTime(selectedShiftDetail.closedAt) : '-'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Thông tin tài chính két</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex justify-between p-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-slate-600">Tiền quỹ đầu ca</span>
                    <span className="font-mono font-bold">{formatVNDCurrency(selectedShiftDetail.openingFloat)}</span>
                  </div>
                  <div className="flex justify-between p-3 border-b border-slate-200">
                    <span className="text-slate-600">Expected Cash (Dự kiến)</span>
                    <span className="font-mono font-bold text-blue-700">{formatVNDCurrency(selectedShiftDetail.reconstructedExpectedCash ?? selectedShiftDetail.expectedCash)}</span>
                  </div>
                  <div className="flex justify-between p-3 border-b border-slate-200">
                    <span className="text-slate-600">Actual Counted Cash (Thực tế)</span>
                    <span className="font-mono font-bold text-emerald-700">{formatVNDCurrency(selectedShiftDetail.actualCountedCash)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50">
                    <span className="text-slate-600">Chênh lệch (Variance)</span>
                    <span className="font-mono font-bold text-rose-700">{formatVNDCurrency(selectedShiftDetail.varianceAmount)} ({selectedShiftDetail.varianceStatus})</span>
                  </div>
                </div>
              </div>

              {selectedShiftDetail.notes && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Ghi chú / Giải trình</h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">{selectedShiftDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          dialog={confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};
