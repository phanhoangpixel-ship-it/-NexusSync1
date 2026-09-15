import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/currencyFormatter';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Award,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface SupplierSpendAnalyticsTabProps {
  userToken?: string;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onNavigateToPO?: (supplierId?: string | number) => void;
  onSelectSupplier?: (supplier: any) => void;
}

export const SupplierSpendAnalyticsTab: React.FC<SupplierSpendAnalyticsTabProps> = ({
  userToken,
  onNotify,
  onNavigateToPO,
  onSelectSupplier
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers/analytics/spend', {
        headers: {
          'Authorization': `Bearer ${userToken || ''}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      } else {
        throw new Error('Không thể tải dữ liệu phân tích chi tiêu');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    );
  }

  const totalSpend = data?.totalSpend || 0;
  const totalPOs = data?.totalPOs || 0;
  const avgPOValue = data?.avgPOValue || 0;
  const activeSupplierCount = data?.activeSupplierCount || 0;
  const topSuppliers: any[] = data?.topSuppliers || [];
  const spendByType: Record<string, number> = data?.spendByType || {};
  const spendByTerms: Record<string, number> = data?.spendByTerms || {};
  const riskMatrix: any[] = data?.riskMatrix || [];

  const strategicSuppliers = riskMatrix.filter(s => s.quadrant === 'STRATEGIC');
  const criticalRiskSuppliers = riskMatrix.filter(s => s.quadrant === 'CRITICAL_RISK');
  const leverageSuppliers = riskMatrix.filter(s => s.quadrant === 'LEVERAGE');
  const routineSuppliers = riskMatrix.filter(s => s.quadrant === 'ROUTINE');

  return (
    <div className="space-y-4 text-xs">
      
      {/* 4 Financial & Spend Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Chi Tiêu Mua Sắm P2P</span>
            <div className="p-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xl">
            {formatCurrency(totalSpend)}
          </p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
            Tổng giá trị đơn đặt hàng PO
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Đơn Hàng Đã Lập (POs)</span>
            <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 text-xl">
            {totalPOs} Đơn PO
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold">
            Liên kết đồng bộ phân hệ M08
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Giá Trị Đơn Trung Bình</span>
            <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-xl">
            {formatCurrency(avgPOValue)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">
            Quy mô trung bình mỗi giao dịch
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số Đối Tác Có Phát Sinh Giao Dịch</span>
            <div className="p-1 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400 text-xl">
            {topSuppliers.length} / {activeSupplierCount} NCC
          </p>
          <span className="text-[10px] text-purple-600 font-semibold">
            Đối tác active trong kỳ
          </span>
        </div>
      </div>

      {/* Top 10 Suppliers Spend Pareto Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Bảng Xếp Hạng Chi Tiêu Pareto (Top Suppliers Spend Analysis)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Phân tích tỷ trọng chi tiêu mua hàng và mức độ tập trung nguồn cung theo nguyên lý Pareto 80/20.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors"
            title="Tải lại phân tích"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase">
                <th className="py-2.5 px-3 text-center w-12">Hạng</th>
                <th className="py-2.5 px-3">Mã NCC</th>
                <th className="py-2.5 px-3">Tên Nhà Cung Cấp</th>
                <th className="py-2.5 px-3">Loại Hình</th>
                <th className="py-2.5 px-3 text-center">Phân Hạng</th>
                <th className="py-2.5 px-3 text-center">Số Đơn PO</th>
                <th className="py-2.5 px-3 text-right">Chi Tiêu (VND)</th>
                <th className="py-2.5 px-3 text-center w-40">Tỷ Trọng (%)</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {topSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Chưa có số liệu giao dịch chi tiêu mua sắm nào.
                  </td>
                </tr>
              ) : (
                topSuppliers.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400 font-mono">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {s.code || `SUP-${s.id}`}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {s.supplierType}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {s.performanceTier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {s.poCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(s.spend)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-400">Chiếm:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{s.spendPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full" 
                            style={{ width: `${Math.min(100, s.spendPercent * 2)}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectSupplier && (
                          <button
                            type="button"
                            onClick={() => onSelectSupplier(s)}
                            className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 text-slate-700 rounded-md transition-colors"
                          >
                            Hồ Sơ
                          </button>
                        )}
                        {onNavigateToPO && (
                          <button
                            type="button"
                            onClick={() => onNavigateToPO(s.id)}
                            className="px-2 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 rounded-md transition-colors"
                          >
                            Tạo PO
                          </button>
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

      {/* 2 Breakdown Panels: By Type and By Payment Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spend by Supplier Type */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-blue-500" />
              Cơ Cấu Chi Tiêu Theo Loại Hình Đối Tác
            </span>
            <span className="text-[10px] text-slate-400 font-mono">SUPPLIER TYPE</span>
          </h4>
          <div className="space-y-2">
            {Object.entries(spendByType).length === 0 ? (
              <p className="text-slate-400 text-center py-4">Chưa có số liệu</p>
            ) : (
              Object.entries(spendByType).map(([type, amount]) => {
                const pct = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{type}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(amount)}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Spend by Payment Terms */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              Phân Bổ Chi Tiêu Theo Điều Khoản Thanh Toán
            </span>
            <span className="text-[10px] text-slate-400 font-mono">PAYMENT TERMS</span>
          </h4>
          <div className="space-y-2">
            {Object.entries(spendByTerms).length === 0 ? (
              <p className="text-slate-400 text-center py-4">Chưa có số liệu</p>
            ) : (
              Object.entries(spendByTerms).map(([terms, amount]) => {
                const pct = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0;
                return (
                  <div key={terms} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{terms}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(amount)}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Strategic Supply Risk Matrix (Kraljic 4-Quadrant Positioning) */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              Ma Trận Định Vị & Kiểm Soát Rủi Ro Cung Ứng (Supply Risk Matrix)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Phân bổ đối tác vào 4 góc phần tư chiến lược để thiết lập cơ chế quản trị và kế hoạch dự phòng.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 px-2.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
            STRATEGIC SOURCING
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Quadrant 1: Strategic Partners */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                1. Đối Tác Chiến Lược (Strategic)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                {strategicSuppliers.length} NCC
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Chi tiêu lớn + Hiệu suất SLA xuất sắc (Tier A/B). Cần duy trì cam kết hợp đồng dài hạn và chia sẻ kế hoạch sản xuất.
            </p>
            <div className="space-y-1 pt-1">
              {strategicSuppliers.map(s => (
                <div key={s.id} className="flex justify-between items-center text-[11px] font-mono bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-emerald-200/50">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(s.spend)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quadrant 2: Critical Risk Partners */}
          <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                2. Rủi Ro Cao Cần Can Thiệp (Critical Risk)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                {criticalRiskSuppliers.length} NCC
              </span>
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-400">
              Chi tiêu lớn nhưng hiệu suất thấp hoặc Tier C. Cần thanh tra chất lượng nghiệm thu kho IQC và kích hoạt nhà cung cấp dự phòng.
            </p>
            <div className="space-y-1 pt-1">
              {criticalRiskSuppliers.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Không có nhà cung cấp nào trong vùng rủi ro nghiêm trọng.</p>
              ) : (
                criticalRiskSuppliers.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-[11px] font-mono bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-rose-200/50">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{formatCurrency(s.spend)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quadrant 3: Leverage Partners */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                3. Đòn Bẩy Tiềm Năng (Leverage)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {leverageSuppliers.length} NCC
              </span>
            </div>
            <p className="text-[11px] text-blue-700 dark:text-blue-400">
              Chất lượng vượt trội nhưng quy mô chi tiêu hiện tại còn nhỏ. Tiềm năng đàm phán mở rộng sản lượng để tối ưu giá thành.
            </p>
            <div className="space-y-1 pt-1">
              {leverageSuppliers.map(s => (
                <div key={s.id} className="flex justify-between items-center text-[11px] font-mono bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-blue-200/50">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{formatCurrency(s.spend)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quadrant 4: Routine Purchases */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                4. Mua Sắm Tiêu Chuẩn Thường Xuyên (Routine)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {routineSuppliers.length} NCC
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Vật tư tiêu chuẩn, giá trị thấp, rủi ro thấp. Ưu tiên quy trình đặt hàng tự động và tinh gọn thủ tục phê duyệt.
            </p>
            <div className="space-y-1 pt-1">
              {routineSuppliers.map(s => (
                <div key={s.id} className="flex justify-between items-center text-[11px] font-mono bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                  <span className="text-slate-600 dark:text-slate-400 font-bold">{formatCurrency(s.spend)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
