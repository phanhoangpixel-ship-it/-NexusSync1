import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Search,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  BarChart3,
  Layers,
  Filter,
  RefreshCw,
  Table,
  LayoutGrid,
  Sliders,
  Boxes,
  Target,
  Sparkles,
} from 'lucide-react';
import { CreateForecastModal } from './CreateForecastModal';
import { CreateMpsModal } from './CreateMpsModal';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

interface ForecastMpsTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onSelectEntity?: (entity: any) => void;
}

export const ForecastMpsTab: React.FC<ForecastMpsTabProps> = ({ onNotify, onSelectEntity }) => {
  const [subTab, setSubTab] = useState<'FORECAST' | 'MPS'>('FORECAST');
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [mpsSchedules, setMpsSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);
  const [isMpsModalOpen, setIsMpsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, mRes] = await Promise.all([
        fetch('/api/scm/forecasts').then((r) => r.json()),
        fetch('/api/scm/mps').then((r) => r.json()),
      ]);
      setForecasts(Array.isArray(fRes) ? fRes : []);
      setMpsSchedules(Array.isArray(mRes) ? mRes : []);
    } catch (err) {
      console.error('Error fetching Forecast/MPS data:', err);
      onNotify('danger', 'Lỗi tải dữ liệu', 'Không thể nạp dữ liệu Dự báo hoặc MPS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleFreeze = (mps: any) => {
    const nextFrozen = !mps.isFrozen;
    setConfirmDialog({
      isOpen: true,
      title: nextFrozen ? `Đóng băng lịch trình ${mps.mpsCode}?` : `Mở khóa lịch trình ${mps.mpsCode}?`,
      message: nextFrozen
        ? `Lịch sản xuất cho ${mps.productName} sẽ chuyển sang trạng thái COMMITTED (Frozen Window). Thuật toán MRP sẽ giữ nguyên lịch này mà không tự động đẩy lùi thời gian.`
        : `Lịch sản xuất sẽ chuyển về trạng thái PLANNED (Liquid Window), cho phép bộ máy MRP tái tối ưu hóa theo biến động nhu cầu mới.`,
      variant: nextFrozen ? 'warning' : 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/scm/mps/${mps.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isFrozen: nextFrozen,
              status: nextFrozen ? 'COMMITTED' : 'PLANNED',
            }),
          });
          if (!res.ok) throw new Error('Không thể cập nhật trạng thái đóng băng');
          onNotify('success', 'Thành công', `Đã ${nextFrozen ? 'đóng băng' : 'mở khóa'} lịch trình ${mps.mpsCode}.`);
          fetchData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi', err.message);
        }
      },
    });
  };

  const filteredForecasts = forecasts.filter(
    (f) =>
      (f.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.forecastCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMps = mpsSchedules.filter(
    (m) =>
      (m.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.mpsCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Summary Metrics
  const totalForecastDemand = forecasts.reduce((sum, f) => sum + (f.forecastQuantity || 0), 0);
  const avgMape = forecasts.length > 0 ? (forecasts.reduce((sum, f) => sum + (f.accuracyMape || 0), 0) / forecasts.length).toFixed(1) : '0';
  const totalMpsPlanned = mpsSchedules.reduce((sum, m) => sum + (m.plannedProductionQty || 0), 0);
  const frozenCount = mpsSchedules.filter((m) => m.isFrozen).length;

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: KPI METRIC STRIP (M25 COMPATIBLE 4-METRIC GRID)                       */}
      {/* ========================================================================= */}
      {subTab === 'FORECAST' ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Tổng Sản Lượng Dự Báo
              </span>
              <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
                {totalForecastDemand.toLocaleString()}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Sai Số TB (MAPE)
              </span>
              <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
                {avgMape}%
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Mặt Hàng Dự Báo
              </span>
              <div className="font-mono tabular-nums font-bold text-2xl text-indigo-600 dark:text-indigo-400">
                {forecasts.length}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Thuật Toán Dự Báo
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                Holt-Winters / Exp
              </div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Tổng Kế Hoạch (MPS)
              </span>
              <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
                {totalMpsPlanned.toLocaleString()}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Đóng Băng (Frozen)
              </span>
              <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400">
                {frozenCount}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Linh Hoạt (Liquid)
              </span>
              <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
                {mpsSchedules.length - frozenCount}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Unlock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Đồng Bộ Cung Cầu
              </span>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Thời gian thực
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* L1 COMMAND BAR: SUB-TAB SWITCHER, SEARCH, VIEW MODES, ACTIONS             */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Sub-tab Pill Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSubTab('FORECAST')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                subTab === 'FORECAST'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Dự Báo Cầu ({forecasts.length})</span>
            </button>
            <button
              onClick={() => setSubTab('MPS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                subTab === 'MPS'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Lịch MPS ({mpsSchedules.length})</span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, SKU, tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
          {/* View Mode Toggle for All Screen Resolutions */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Chế độ Bảng (Table View)"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Chế độ Thẻ (Card View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('auto')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'auto'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Tự động tối ưu theo độ phân giải thiết bị"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Tự động</span>
            </button>
          </div>

          <button
            onClick={fetchData}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {subTab === 'FORECAST' ? (
            <button
              onClick={() => setIsForecastModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Dự Báo</span>
            </button>
          ) : (
            <button
              onClick={() => setIsMpsModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lập Lịch MPS</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATA PRESENTATION: FORECASTS OR MPS SCHEDULES                             */}
      {/* ========================================================================= */}
      {subTab === 'FORECAST' ? (
        loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 shadow-2xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50 text-blue-600" />
            Đang nạp dữ liệu dự báo nhu cầu...
          </div>
        ) : filteredForecasts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 shadow-2xs">
            <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            Chưa có bản ghi dự báo nào. Bấm "Tạo Dự Báo" để thiết lập.
          </div>
        ) : (
          <>
            {/* 1. TABLE VIEW */}
            {(viewMode === 'table' || viewMode === 'auto') && (
              <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden ${viewMode === 'auto' ? 'hidden md:block' : 'block'}`}>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap min-w-[840px] lg:min-w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mã Dự Báo</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sản Phẩm &amp; SKU</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chu Kỳ</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kho</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Quá Khứ TB</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Dự Báo Cầu</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Thực Tế Bán</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mô Hình</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Sai Số (MAPE)</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredForecasts.map((f) => (
                        <tr
                          key={f.id}
                          className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 border-l-4 border-blue-500/60"
                        >
                          <td className="p-2.5 sm:p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{f.forecastCode}</td>
                          <td className="p-2.5 sm:p-3">
                            <div className="font-bold text-slate-900 dark:text-white">{f.productName}</div>
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 inline-block mt-0.5">
                              {f.sku}
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3 font-mono text-slate-600 dark:text-slate-300">
                            <div className="font-bold">{f.period}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              {f.startDate} → {f.endDate}
                            </div>
                          </td>
                          <td className="p-2.5 sm:p-3 text-slate-700 dark:text-slate-300 font-medium">Kho WMS #{f.warehouseId || 1}</td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">{f.historicalAvgDemand || 0}</td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 text-sm">
                            {f.forecastQuantity}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">{f.actualSalesQuantity || '—'}</td>
                          <td className="p-2.5 sm:p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                              {f.forecastMethod}
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {f.accuracyMape ? `${f.accuracyMape}%` : '—'}
                          </td>
                          <td className="p-2.5 sm:p-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              {f.status || 'ACTIVE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. CARD VIEW (Adaptive for mobile or cards toggle) */}
            {(viewMode === 'cards' || viewMode === 'auto') && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${viewMode === 'auto' ? 'block md:hidden' : 'block'}`}>
                {filteredForecasts.map((f) => (
                  <div
                    key={f.id}
                    className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{f.forecastCode}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                        {f.status || 'ACTIVE'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{f.productName}</h4>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 inline-block mt-1">
                        {f.sku}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Dự Báo:</span>
                        <span className="font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 text-base">{f.forecastQuantity}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Sai Số MAPE:</span>
                        <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-base">{f.accuracyMape ? `${f.accuracyMape}%` : '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      ) : (
        /* MPS SCHEDULES VIEW */
        loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 shadow-2xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50 text-indigo-600" />
            Đang nạp dữ liệu Lịch trình sản xuất chính...
          </div>
        ) : filteredMps.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 shadow-2xs">
            <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            Chưa có bản ghi MPS nào. Bấm "Lập Lịch MPS" để thiết lập.
          </div>
        ) : (
          <>
            {/* 1. TABLE VIEW */}
            {(viewMode === 'table' || viewMode === 'auto') && (
              <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden ${viewMode === 'auto' ? 'hidden md:block' : 'block'}`}>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap min-w-[920px] lg:min-w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mã MPS</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sản Phẩm &amp; SKU</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kỳ Kế Hoạch</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Dự Báo (FC)</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Đơn Đặt (SO)</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Tổng Cầu Gộp</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Tồn PAB</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Hứa Hẹn ATP</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Kế Hoạch MPS</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Cửa Sổ</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredMps.map((m) => (
                        <tr
                          key={m.id}
                          className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 ${
                            m.isFrozen
                              ? 'border-l-4 border-amber-500 bg-amber-50/10 dark:bg-amber-950/10'
                              : 'border-l-4 border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10'
                          }`}
                        >
                          <td className="p-2.5 sm:p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{m.mpsCode}</td>
                          <td className="p-2.5 sm:p-3">
                            <div className="font-bold text-slate-900 dark:text-white">{m.productName}</div>
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 inline-block mt-0.5">
                              {m.sku}
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3 font-mono text-slate-600 dark:text-slate-300">
                            <div className="font-bold">{m.period}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              {m.periodStartDate} → {m.periodEndDate}
                            </div>
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">{m.forecastDemand || 0}</td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums text-blue-600 dark:text-blue-400 font-bold">{m.salesOrderDemand || 0}</td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">{m.totalGrossDemand || 0}</td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                            {m.projectedAvailableBalance || 0}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {m.availableToPromise || 0}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                            {m.plannedProductionQty}
                          </td>
                          <td className="p-2.5 sm:p-3 text-center">
                            {m.isFrozen ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
                                <Lock className="w-3 h-3" /> Đóng băng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                                <Unlock className="w-3 h-3" /> Linh hoạt
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 sm:p-3 text-center">
                            <button
                              onClick={() => handleToggleFreeze(m)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                                m.isFrozen
                                  ? 'border-slate-300 text-slate-700 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                  : 'border-amber-300 text-amber-700 dark:text-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              }`}
                            >
                              {m.isFrozen ? 'Mở Khóa' : 'Khóa Frozen'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. CARD VIEW (Adaptive for mobile or cards toggle) */}
            {(viewMode === 'cards' || viewMode === 'auto') && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${viewMode === 'auto' ? 'block md:hidden' : 'block'}`}>
                {filteredMps.map((m) => (
                  <div
                    key={m.id}
                    className={`bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-2xs space-y-3 ${
                      m.isFrozen ? 'border-amber-300 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{m.mpsCode}</span>
                      {m.isFrozen ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
                          <Lock className="w-3 h-3" /> Đóng băng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                          <Unlock className="w-3 h-3" /> Linh hoạt
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{m.productName}</h4>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 inline-block mt-1">
                        {m.sku}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Kế Hoạch MPS:</span>
                        <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 text-base">{m.plannedProductionQty}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Hứa Hẹn ATP:</span>
                        <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-base">{m.availableToPromise || 0}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                      <button
                        onClick={() => handleToggleFreeze(m)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                          m.isFrozen
                            ? 'border-slate-300 text-slate-700 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                            : 'border-amber-300 text-amber-700 dark:text-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        }`}
                      >
                        {m.isFrozen ? 'Mở Khóa' : 'Khóa Frozen'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}

      {/* MODALS */}
      <CreateForecastModal
        isOpen={isForecastModalOpen}
        onClose={() => setIsForecastModalOpen(false)}
        onSuccess={fetchData}
        onNotify={onNotify}
      />

      <CreateMpsModal
        isOpen={isMpsModalOpen}
        onClose={() => setIsMpsModalOpen(false)}
        onSuccess={fetchData}
        onNotify={onNotify}
      />

      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
