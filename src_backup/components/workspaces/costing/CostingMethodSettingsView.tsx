import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ConfirmDialogState } from '../../../types';
import {
  Calculator,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  History,
  Info,
  ArrowRight,
  Layers,
  FileText,
  Lock,
  RefreshCw,
  Sliders
} from 'lucide-react';

interface CostingMethodSettingsViewProps {
  currentUser?: {
    id?: number;
    username?: string;
    name?: string;
    role?: string;
    department?: string;
  };
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

interface CostingConfigResponse {
  isConfigured: boolean;
  configuredMethod: 'FIFO' | 'WEIGHTED_AVERAGE' | null;
  effectiveMethod: 'FIFO' | 'WEIGHTED_AVERAGE';
  fallbackActive: boolean;
  updatedAt: string | null;
  updatedBy: number | null;
  updaterName?: string;
  auditHistory: Array<{
    id: number;
    auditCode: string;
    username: string;
    role: string;
    action: string;
    beforeData?: string;
    afterData?: string;
    changedFields?: string;
    createdAt: string;
  }>;
}

export const CostingMethodSettingsView: React.FC<CostingMethodSettingsViewProps> = ({
  currentUser = { id: 1, username: 'admin', role: 'SUPER_ADMIN', name: 'Hoàng Nam (Admin)' },
  onNotify
}) => {
  const [config, setConfig] = useState<CostingConfigResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<'FIFO' | 'WEIGHTED_AVERAGE'>('WEIGHTED_AVERAGE');
  const [approvalReason, setApprovalReason] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // RBAC: Chief Accountant, CFO, Finance Admin, Super Admin
  const allowedRoles = ['CFO', 'CHIEF_ACCOUNTANT', 'FINANCE_ADMIN', 'SUPER_ADMIN', 'ADMIN'];
  const userRole = currentUser?.role || 'SUPER_ADMIN';
  const hasPermission = allowedRoles.includes(userRole);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/costing/settings');
      const json = await res.json();
      if (json.success && json.data) {
        setConfig(json.data);
        if (json.data.configuredMethod) {
          setSelectedMethod(json.data.configuredMethod);
        } else {
          // If not configured, keep selected method or default
          setSelectedMethod(json.data.effectiveMethod || 'WEIGHTED_AVERAGE');
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải cấu hình costing:', err);
      if (onNotify) {
        onNotify('danger', 'Lỗi tải dữ liệu', 'Không thể kết nối đến máy chủ lấy cấu hình giá vốn.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveClick = () => {
    if (!hasPermission) {
      if (onNotify) {
        onNotify('danger', 'Từ chối truy cập (403)', 'Bạn không có quyền Kế toán trưởng/CFO để thực hiện hành động này.');
      }
      return;
    }

    const methodName = selectedMethod === 'FIFO'
      ? 'FIFO (Nhập trước Xuất trước)'
      : 'Bình Quân Gia Quyền Di Động (Moving Weighted Average)';

    // Rule #19: ConfirmDialog with Warning Variant
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Phê duyệt Phương pháp Tính Giá Vốn',
      message: `Thay đổi phương pháp tính giá vốn sẽ ảnh hưởng đến toàn bộ giao dịch xuất kho phát sinh SAU thời điểm lưu. Các giao dịch/bút toán đã ghi nhận trước đó KHÔNG bị thay đổi.\n\nBạn có chắc chắn muốn áp dụng phương pháp ${methodName} cho toàn bộ doanh nghiệp?`,
      variant: 'warning',
      confirmText: 'Xác nhận & Phê duyệt',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setSaving(true);
        try {
          const res = await fetch('/api/costing/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: selectedMethod,
              reason: approvalReason.trim() || `Phê duyệt phương pháp ${selectedMethod} bởi ${currentUser.name || currentUser.username} (${userRole})`
            })
          });
          const json = await res.json();
          if (json.success) {
            if (onNotify) {
              onNotify('success', 'Phê duyệt thành công', `Phương pháp tính giá vốn toàn doanh nghiệp đã được cập nhật sang ${selectedMethod}.`);
            }
            setApprovalReason('');
            await fetchConfig();
          } else {
            if (onNotify) {
              onNotify('danger', 'Lỗi lưu cấu hình', json.error || 'Thao tác thất bại.');
            }
          }
        } catch (err: any) {
          if (onNotify) {
            onNotify('danger', 'Lỗi hệ thống', err.message || 'Không thể gửi yêu cầu lưu cấu hình.');
          }
        } finally {
          setSaving(false);
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Đang tải trạng thái cấu hình giá vốn từ máy chủ...</p>
      </div>
    );
  }

  const isConfigured = config?.isConfigured ?? false;
  const configuredMethod = config?.configuredMethod;
  const fallbackActive = config?.fallbackActive ?? true;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shadow-xs">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Cấu hình Phương pháp Tính Giá Vốn Doanh nghiệp
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                M42 Single-Writer
              </span>
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Thiết lập chính sách định giá hàng tồn kho và hạch toán giá vốn hàng bán (COGS) theo chuẩn mực kế toán VAS 02 / IFRS.
            </p>
          </div>
        </div>

        <button
          onClick={fetchConfig}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* RBAC PERMISSION BANNER */}
      {!hasPermission && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
          <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Quyền truy cập bị giới hạn (RBAC L0):</span> Bạn đang đăng nhập với vai trò{' '}
            <span className="font-mono font-bold">{userRole}</span>. Chỉ các vai trò có thẩm quyền tài chính tối cao (
            <span className="font-semibold">CFO, Kế toán trưởng, Finance Admin, Super Admin</span>) mới có quyền phê duyệt thay đổi phương pháp tính giá vốn toàn doanh nghiệp. Màn hình hiện ở chế độ chỉ đọc.
          </div>
        </div>
      )}

      {/* CURRENT STATUS BANNER */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isConfigured
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/80 border-amber-300 text-amber-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {isConfigured ? (
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold tracking-wide uppercase text-slate-500">
                  Trạng thái Cấu hình Hiện tại
                </span>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ĐÃ PHÊ DUYỆT CHÍNH THỨC
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    CHƯA CẤU HÌNH (ĐANG CHỜ PHÊ DUYỆT)
                  </span>
                )}
              </div>

              <div className="mt-1">
                {isConfigured ? (
                  <p className="text-base font-medium text-emerald-900">
                    Phương pháp có hiệu lực:{' '}
                    <span className="font-bold font-mono text-emerald-950 text-lg">
                      {configuredMethod === 'FIFO'
                        ? 'FIFO (Nhập trước Xuất trước)'
                        : 'Bình Quân Gia Quyền Di Động (WEIGHTED_AVERAGE)'}
                    </span>
                  </p>
                ) : (
                  <p className="text-base font-medium text-amber-900">
                    Hệ thống chưa có bản ghi phê duyệt chính thức trong cơ sở dữ liệu. Hiện đang vận hành ở cơ chế{' '}
                    <span className="font-bold underline">Dự phòng Mặc định</span>:{' '}
                    <span className="font-bold font-mono text-amber-950">Bình Quân Gia Quyền Di Động (WEIGHTED_AVERAGE)</span>.
                  </p>
                )}
              </div>

              {config?.updatedAt && (
                <div className="mt-2 text-xs text-slate-600 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Cập nhật lần cuối: <span className="font-mono">{new Date(config.updatedAt).toLocaleString('vi-VN')}</span>
                  </span>
                  {config.updaterName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Người phê duyệt: <span className="font-medium text-slate-800">{config.updaterName}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-xs text-slate-500 block">Quy chuẩn định giá:</span>
            <span className="text-sm font-semibold font-mono text-slate-800">VAS 02 / IFRS 02</span>
          </div>
        </div>
      </div>

      {/* METHOD SELECTION CARDS */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-800">
          Chọn Phương pháp Định giá Giá vốn Chính thức:
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OPTION 1: FIFO */}
          <div
            onClick={() => hasPermission && setSelectedMethod('FIFO')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedMethod === 'FIFO'
                ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600/10'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            } ${!hasPermission ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="costingMethod"
                    value="FIFO"
                    checked={selectedMethod === 'FIFO'}
                    onChange={() => hasPermission && setSelectedMethod('FIFO')}
                    disabled={!hasPermission}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <h3 className="font-bold text-base text-slate-900">
                    FIFO (Nhập trước - Xuất trước)
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-blue-100 text-blue-800 border border-blue-200">
                  Strict Cost Layers
                </span>
              </div>

              <p className="text-sm text-slate-600 mt-2.5">
                Hàng hóa nhập kho trước sẽ được ưu tiên xuất kho và kết chuyển giá vốn trước. Giá trị hàng tồn kho cuối kỳ phản ánh mức giá nhập gần nhất.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cơ chế kỹ thuật:</strong> Tiêu thụ trực tiếp từng tầng chi phí theo thời gian (
                    <span className="font-mono">cost_layers</span> active oldest-first).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Phù hợp nhất:</strong> Doanh nghiệp phân phối linh kiện điện tử, dược phẩm, hàng có hạn sử dụng hoặc giá nhập biến động theo từng lô.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Trạng thái dữ liệu:</strong> Đã sẵn sàng 17/17 SKU và 122.811.633.280 ₫ tầng vốn hóa mở đầu.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Độ phức tạp tính toán: Từng tầng (O(K))</span>
              <span className="text-blue-700 font-semibold">Minh bạch 100% audit</span>
            </div>
          </div>

          {/* OPTION 2: WEIGHTED_AVERAGE */}
          <div
            onClick={() => hasPermission && setSelectedMethod('WEIGHTED_AVERAGE')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedMethod === 'WEIGHTED_AVERAGE'
                ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600/10'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            } ${!hasPermission ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="costingMethod"
                    value="WEIGHTED_AVERAGE"
                    checked={selectedMethod === 'WEIGHTED_AVERAGE'}
                    onChange={() => hasPermission && setSelectedMethod('WEIGHTED_AVERAGE')}
                    disabled={!hasPermission}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <h3 className="font-bold text-base text-slate-900">
                    Bình Quân Gia Quyền Di Động
                  </h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-slate-100 text-slate-800 border border-slate-200">
                  Moving Average
                </span>
              </div>

              <p className="text-sm text-slate-600 mt-2.5">
                Đơn giá vốn xuất kho được tính bình quân lại sau mỗi lần nhập hàng mới. Làm phẳng các biến động giá đột ngột giữa các lô nhập.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cơ chế kỹ thuật:</strong> Tự động tính lại <span className="font-mono">products.costPrice</span> khi nhập kho và áp dụng đồng nhất cho đợt xuất tiếp theo.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Phù hợp nhất:</strong> Ngành sản xuất hàng loạt, nguyên vật liệu đồng nhất (thép, hạt nhựa, hóa chất) hoặc bán lẻ tiêu dùng nhanh.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Công thức:</strong> C_mới = (Q_tồn × C_tồn + Q_nhập × C_nhập) ÷ (Q_tồn + Q_nhập).
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Độ mượt giá: Cao</span>
              <span className="text-slate-700 font-semibold">Dễ đối soát báo cáo</span>
            </div>
          </div>
        </div>
      </div>

      {/* APPROVAL REASON & GOVERNANCE IMPACT NOTICE */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block text-sm">
              Cảnh báo Quản trị Tài chính & Phạm vi Bất biến (Frozen Policy)
            </span>
            <p>
              Theo nguyên tắc kế toán nhất quán (VAS 02 / IFRS 02), phương pháp tính giá tồn kho nên được duy trì ổn định ít nhất trong một niên độ tài chính.
            </p>
            <p className="text-amber-900 font-medium">
              ⚠️ Thay đổi phương pháp tính giá vốn sẽ ảnh hưởng đến toàn bộ giao dịch xuất kho phát sinh <strong>SAU</strong> thời điểm lưu. Các giao dịch, phiếu xuất và bút toán Sổ cái M30 đã ghi nhận trước đó <strong>KHÔNG</strong> bị thay đổi.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Lý do phê duyệt / Quyết định thay đổi chính sách (Ghi nhận Audit Trail L4):
          </label>
          <input
            type="text"
            value={approvalReason}
            onChange={(e) => setApprovalReason(e.target.value)}
            disabled={!hasPermission || saving}
            placeholder="Ví dụ: Phê duyệt phương pháp FIFO theo Quyết định Ban Giám đốc số 12/2026/QĐ-TC..."
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        {/* ACTION BUTTON */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            Người thao tác:{' '}
            <span className="font-semibold text-slate-800">
              {currentUser.name || currentUser.username} ({userRole})
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={!hasPermission || saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang ghi nhận vào hệ thống...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Phê duyệt & Lưu Phương pháp Giá vốn
              </>
            )}
          </button>
        </div>
      </div>

      {/* AUDIT TRAIL TIMELINE (L4) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            Nhật ký Phê duyệt & Kiểm toán Thay đổi (Audit Trail L4)
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {config?.auditHistory?.length || 0} bản ghi kiểm toán
          </span>
        </div>

        {config?.auditHistory && config.auditHistory.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-left">Mã Kiểm toán</th>
                  <th scope="col" className="px-4 py-2.5 text-left">Thời điểm</th>
                  <th scope="col" className="px-4 py-2.5 text-left">Người phê duyệt</th>
                  <th scope="col" className="px-4 py-2.5 text-left">Vai trò</th>
                  <th scope="col" className="px-4 py-2.5 text-center">Phương pháp Mới</th>
                  <th scope="col" className="px-4 py-2.5 text-left">Lý do / Diễn giải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {config.auditHistory.map((item) => {
                  let parsedAfter: any = {};
                  try {
                    parsedAfter = item.afterData ? JSON.parse(item.afterData) : {};
                  } catch {
                    // ignore
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 text-slate-700 font-mono font-medium">
                        {item.auditCode}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-2.5 font-sans font-medium text-slate-900">
                        {item.username}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                          {item.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          parsedAfter.method === 'FIFO'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {parsedAfter.method || 'CẬP NHẬT'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-sans text-slate-600 max-w-xs truncate" title={parsedAfter.reason || ''}>
                        {parsedAfter.reason || 'Cập nhật phương pháp tính giá vốn'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
            Chưa có lịch sử thay đổi phương pháp tính giá vốn. Bản ghi đầu tiên sẽ xuất hiện sau khi Kế toán trưởng phê duyệt.
          </div>
        )}
      </div>

      {/* CONFIRM DIALOG (Rule #19) */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
};
