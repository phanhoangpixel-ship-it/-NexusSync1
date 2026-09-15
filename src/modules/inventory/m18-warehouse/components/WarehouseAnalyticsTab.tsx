import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Warehouse, Boxes, Clock, CheckCircle2, 
  Activity, ArrowUpRight, ArrowDownRight, Layers, MapPin, Download, 
  RefreshCw, Filter, Calendar, Zap, AlertTriangle, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../../../types';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';

interface WarehouseAnalyticsTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
}

export const WarehouseAnalyticsTab: React.FC<WarehouseAnalyticsTabProps> = ({ onNotify, onSelectEntity }) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'YTD'>('30D');
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ isOpen: false });

  // L3 Content Area Loading / Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
      onNotify('info', 'Làm Mới Phân Tích', 'Đã tính toán lại dữ liệu phân tích Heatmap và ABC Velocity.');
    }, 450);
  };

  // Heatmap bin data
  const binHeatmap = [
    { zone: 'Zone A (Mặt Tiền & Pick Nhanh)', bins: [
      { code: 'A-01-01', heat: 94, name: 'RAM DDR5 16GB', picks: 1420 },
      { code: 'A-01-02', heat: 88, name: 'Màn hình theo dõi 7 thông số', picks: 980 },
      { code: 'A-01-03', heat: 76, name: 'SSD 1TB Samsung 980', picks: 850 },
      { code: 'A-02-01', heat: 65, name: 'Cáp nguồn y tế', picks: 620 },
      { code: 'A-02-02', heat: 52, name: 'Phụ kiện máy đo ECG', picks: 410 },
      { code: 'A-02-03', heat: 45, name: 'Pin dự phòng thiết bị', picks: 330 },
    ]},
    { zone: 'Zone B (Linh Kiện Điện Tử & Phụ Trợ)', bins: [
      { code: 'B-01-01', heat: 82, name: 'Vi xử lý Intel Core i7', picks: 1100 },
      { code: 'B-01-02', heat: 71, name: 'Card mạng PCIe 10Gb', picks: 790 },
      { code: 'B-02-01', heat: 60, name: 'Bo mạch điều khiển SMT', picks: 590 },
      { code: 'B-02-02', heat: 38, name: 'Bộ chia nguồn công nghiệp', picks: 280 },
    ]},
    { zone: 'Zone C (Bulk Storage & Lưu Trữ Tầng Cao)', bins: [
      { code: 'C-01-01', heat: 42, name: 'Điện trở dán SMD cuộn', picks: 310 },
      { code: 'C-01-02', heat: 35, name: 'Tụ điện nhôm 100uF', picks: 240 },
      { code: 'C-02-01', heat: 18, name: 'Vỏ tủ rack 42U', picks: 95 },
      { code: 'C-02-02', heat: 12, name: 'Khung máy trạm dự phòng', picks: 45 },
    ]},
  ];

  // Top fast-moving SKUs data
  const fastMovingSkus = [
    { sku: 'SKU-RAM-16G', name: 'RAM DDR5 16GB Kingston Fury', picks: 1420, velocity: 'Class A (Fastest)', turnRate: '14.2x / năm', stockDays: '12 ngày' },
    { sku: 'SKU-CPU-I7', name: 'Bộ Vi Xử Lý Intel Core i7 14700K', picks: 1100, velocity: 'Class A', turnRate: '11.8x / năm', stockDays: '15 ngày' },
    { sku: 'SKU-MED-MON', name: 'Màn hình theo dõi bệnh nhân 7 thông số', picks: 980, velocity: 'Class A', turnRate: '9.4x / năm', stockDays: '18 ngày' },
    { sku: 'SKU-SSD-1TB', name: 'Ổ Cứng SSD NVMe 1TB Samsung 980 Pro', picks: 850, velocity: 'Class B (Medium)', turnRate: '7.6x / năm', stockDays: '22 ngày' },
    { sku: 'SKU-MED-ECG', name: 'Máy đo ECG 12 đạo trình', picks: 790, velocity: 'Class B', turnRate: '6.8x / năm', stockDays: '26 ngày' },
    { sku: 'SKU-RES-10K', name: 'Điện trở dán SMD 10K Ohm 0805', picks: 620, velocity: 'Class B', turnRate: '5.2x / năm', stockDays: '35 ngày' },
    { sku: 'SKU-CAB-42U', name: 'Vỏ tủ rack trung tâm dữ liệu 42U', picks: 95, velocity: 'Class C (Slow)', turnRate: '1.4x / năm', stockDays: '110 ngày' },
  ];

  const pagination = usePagination({
    totalItems: fastMovingSkus.length,
    defaultPageSize: 5,
    syncWithUrl: false
  });

  const paginatedItems = useMemo(() => {
    return pagination.paginatedData(fastMovingSkus);
  }, [pagination, fastMovingSkus]);

  const handleExportExcel = () => {
    const data = fastMovingSkus.map(s => ({
      'Mã SKU': s.sku,
      'Tên Sản Phẩm': s.name,
      'Lượt Xuất / Nhặt (Picks)': s.picks,
      'Phân Hạng Tốc Độ (ABC)': s.velocity,
      'Vòng Quay Tồn Kho': s.turnRate,
      'Số Ngày Tồn Kho Trung Bình': s.stockDays
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Warehouse_Velocity_Analytics');
    XLSX.writeFile(wb, `NexusSync_Warehouse_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
    onNotify('info', 'Xuất báo cáo', 'Đã tải xuống bảng phân tích hiệu suất kho Excel.');
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L0: TOP HEADER BAR                                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              G. Warehouse Throughput &amp; Velocity Analytics (Phân Tích &amp; Bản Đồ Nhiệt)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Báo cáo hiệu suất kho toàn diện: Thời gian Dock-to-Stock, tỷ lệ đầy kệ (Occupancy), bản đồ nhiệt tần suất nhặt hàng và phân hạng ABC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-xl text-xs font-semibold">
            {(['7D', '30D', '90D', 'YTD'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeRange === t ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: KPI METRICS STRIP                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Dock-to-Stock</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
            2.4 Giờ
          </div>
          <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
            <ArrowDownRight className="w-3 h-3" /> Nhanh hơn 18% kỳ trước
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Order Cycle Time</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-amber-600 mt-1">
            42 Phút
          </div>
          <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
            <ArrowDownRight className="w-3 h-3" /> Chu kỳ Pick-Pack-Ship
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Đầy Kệ (Occupancy)</span>
            <Warehouse className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-purple-600 mt-1">
            78.4%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">188 / 240 Bin đang chứa</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Độ Chính Xác Picking</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-emerald-600 mt-1">
            99.82%
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Scan Barcode đối khớp</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Vòng Quay Tồn Kho</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-indigo-600 mt-1">
            8.6x / năm
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Vòng quay hàng hóa TB</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Thông Lượng / Ngày</span>
            <Activity className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-rose-600 mt-1">
            4,850 Units
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">Nhập + Xuất trung bình</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: HEATMAP VISUALIZATION                                                 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Bản Đồ Nhiệt Vị Trí Bin &amp; Tần Suất Nhặt Hàng (Pick-Face Heatmap)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500"></span> Nóng (&gt;75%)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500"></span> Ấm (50-75%)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400"></span> Vừa (25-50%)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></span> Nguội (&lt;25%)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {binHeatmap.map((zoneGroup, idx) => (
            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center justify-between">
                <span>{zoneGroup.zone}</span>
                <span className="text-[10px] text-slate-400 font-mono">{zoneGroup.bins.length} Bins</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {zoneGroup.bins.map((bin) => {
                  const heatColor = bin.heat >= 75 
                    ? 'bg-rose-500 text-white' 
                    : bin.heat >= 50 
                      ? 'bg-amber-500 text-white' 
                      : bin.heat >= 25 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';

                  return (
                    <div
                      key={bin.code}
                      className={`p-2.5 rounded-lg text-xs flex flex-col justify-between transition-all hover:scale-105 cursor-pointer shadow-2xs ${heatColor}`}
                      title={`${bin.code} - ${bin.name} (${bin.picks} picks)`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>{bin.code}</span>
                        <span>{bin.heat}%</span>
                      </div>
                      <div className="text-[10px] truncate opacity-90 mt-1">{bin.name}</div>
                      <div className="text-[9px] font-mono mt-0.5 opacity-80">{bin.picks} Lượt nhặt</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: FAST-MOVING SKUS TABLE (VELOCITY CLASS A/B/C)                         */}
      {/* ========================================================================= */}
      <L3ContentState
        isLoading={isLoading}
        error={error}
        isEmpty={paginatedItems.length === 0}
        onRetry={handleRefresh}
        emptyTitle="Không tìm thấy mặt hàng phù hợp"
        emptyDescription="Không có dữ liệu phân tích SKU cho bộ lọc kho đã chọn."
        skeletonRows={5}
        minHeight="min-h-[350px]"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Xếp Hạng Mặt Hàng Theo Tốc Độ Luân Chuyển (ABC Velocity Analysis)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Dựa trên {fastMovingSkus.length} SKU chính</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Mã SKU</th>
                  <th className="py-3 px-4">Tên Sản Phẩm</th>
                  <th className="py-3 px-4 text-center">Lượt Nhặt (Picks)</th>
                  <th className="py-3 px-4 text-center">Phân Hạng Tốc Độ</th>
                  <th className="py-3 px-4 text-center">Vòng Quay Tồn Kho</th>
                  <th className="py-3 px-4 text-center">Số Ngày Tồn Kho TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedItems.map((sku) => (
                  <tr key={sku.sku} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {sku.sku}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {sku.name}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {sku.picks.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        sku.velocity.includes('Class A') 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                          : sku.velocity.includes('Class B')
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {sku.velocity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {sku.turnRate}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {sku.stockDays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* L4: PINNED PAGINATION FOOTER                                              */}
          {/* ========================================================================= */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
            <PaginationControl
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={fastMovingSkus.length}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>
      </L3ContentState>

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (Mandatory Rule #19)                                       */}
      {/* ========================================================================= */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default WarehouseAnalyticsTab;
