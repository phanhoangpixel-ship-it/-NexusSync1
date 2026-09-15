import React, { useState, useMemo } from 'react';
import { EventBusItem } from './types';
import {
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  ArrowUpDown,
  Radio,
  Clock,
  Layers,
  Activity,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Tag,
  Boxes,
  ShoppingCart,
  DollarSign,
  Truck,
  ShieldAlert,
  Award
} from 'lucide-react';

interface EventStreamTabProps {
  events: EventBusItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
  onSelectEvent: (event: EventBusItem) => void;
  onOpenPublisher: () => void;
  onViewDetails: (event: EventBusItem) => void;
  onRetryEvent?: (eventId: string) => void;
}

export const EventStreamTab: React.FC<EventStreamTabProps> = ({
  events,
  isLoading,
  onRefresh,
  onExportCSV,
  onSelectEvent,
  onOpenPublisher,
  onViewDetails,
  onRetryEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [timeRange, setTimeRange] = useState<'all' | '15m' | '1h' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Lọc danh sách sự kiện theo đầy đủ tiêu chí
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // 1. Text Search
      const matchSearch =
        searchTerm === '' ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.eventType && e.eventType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.aggregateId && e.aggregateId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.actorId && e.actorId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        e.sourceModule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.consumer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(e.payload).toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Status Filter
      const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;

      // 3. Source Module Filter
      const matchSource = sourceFilter === 'ALL' || e.sourceModule === sourceFilter;

      // 4. Domain Filter
      let matchDomain = true;
      if (domainFilter !== 'ALL') {
        const dom = domainFilter.toLowerCase();
        matchDomain =
          e.topic.toLowerCase().includes(dom) ||
          e.sourceModule.toLowerCase().includes(dom) ||
          (e.aggregateType && e.aggregateType.toLowerCase().includes(dom));
      }

      // 5. Time Range Filter
      let matchTime = true;
      const eventTime = new Date(e.timestamp).getTime();
      const now = Date.now();

      if (timeRange === '15m') {
        matchTime = now - eventTime <= 15 * 60 * 1000;
      } else if (timeRange === '1h') {
        matchTime = now - eventTime <= 60 * 60 * 1000;
      } else if (timeRange === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        matchTime = eventTime >= startOfToday.getTime();
      } else if (timeRange === '7d') {
        matchTime = now - eventTime <= 7 * 24 * 60 * 60 * 1000;
      } else if (timeRange === '30d') {
        matchTime = now - eventTime <= 30 * 24 * 60 * 60 * 1000;
      } else if (timeRange === 'custom') {
        if (startDate) {
          matchTime = matchTime && eventTime >= new Date(startDate).getTime();
        }
        if (endDate) {
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          matchTime = matchTime && eventTime <= endDateTime.getTime();
        }
      }

      return matchSearch && matchStatus && matchSource && matchDomain && matchTime;
    });
  }, [events, searchTerm, statusFilter, sourceFilter, domainFilter, timeRange, startDate, endDate]);

  // Danh sách các module nguồn duy nhất
  const uniqueSources = useMemo(() => {
    const set = new Set(events.map((e) => e.sourceModule));
    return Array.from(set);
  }, [events]);

  // Phân trang L4
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  // Tính toán KPI L2
  const totalEvents = events.length;
  const publishedCount = events.filter((e) => e.status === 'PUBLISHED').length;
  const acknowledgedCount = events.filter((e) => e.status === 'ACKNOWLEDGED').length;
  const dlqFailedCount = events.filter((e) => e.status === 'DLQ_FAILED').length;

  const resetAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSourceFilter('ALL');
    setDomainFilter('ALL');
    setTimeRange('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const isFiltered = searchTerm !== '' || statusFilter !== 'ALL' || sourceFilter !== 'ALL' || domainFilter !== 'ALL' || timeRange !== 'all';

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: KPI METRIC STRIP (CHUẨN M19)                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Tổng Sự Kiện */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Sự Kiện Outbox
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
            {totalEvents}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="text-blue-600 dark:text-blue-400 font-bold">100%</span>
            <span>At-Least-Once Delivery & Outbox</span>
          </div>
        </div>

        {/* KPI 2: Đã Phát (Published) */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đã Phát Lên Broker
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-indigo-600 dark:text-indigo-400">
            {publishedCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Broadcast</span>
            <span>Đang chuyển tới Consumer</span>
          </div>
        </div>

        {/* KPI 3: Đã Nhận (Acknowledged) */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đã Tiếp Nhận (ACK)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
            {acknowledgedCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Zero Loss</span>
            <span>Đã xử lý & định danh chốt</span>
          </div>
        </div>

        {/* KPI 4: Lỗi Hàng Đợi (DLQ Failed) */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sự Kiện Lỗi (DLQ)
            </span>
            <div className={`p-2 rounded-lg ${
              dlqFailedCount > 0 
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' 
                : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`font-mono tabular-nums font-bold text-2xl ${
            dlqFailedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
          }`}>
            {dlqFailedCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className={dlqFailedCount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 font-bold'}>
              {dlqFailedCount > 0 ? 'Cần Tái Xử Lý' : 'Bình Thường'}
            </span>
            <span>Trong Dead Letter Queue</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: COMMAND & PRIMARY FILTER BAR                                          */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Main search and quick filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Ô Tìm Kiếm Nâng Cao */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã EVT, topic, aggregate, payload..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Lọc Theo Domain / Phân Hệ Nghiệp Vụ */}
            <select
              value={domainFilter}
              onChange={(e) => {
                setDomainFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả Phân Hệ Nghiệp Vụ</option>
              <option value="sales">M13/M04 Bán Hàng (Sales)</option>
              <option value="inventory">M17/M18 Kho Vận (Inventory & WMS)</option>
              <option value="finance">M30/M31 Tài Chính & Sổ Cái (GL)</option>
              <option value="procurement">M08 Mua Hàng & PO (Procurement)</option>
              <option value="manufacturing">M26/M12 Sản Xuất & MRP</option>
              <option value="quality">M39 Quản Lý Chất Lượng (QC)</option>
              <option value="treasury">M32 Thu Chi & Treasury</option>
              <option value="crm">M12 Quản Lý Khách Hàng (CRM)</option>
            </select>

            {/* Lọc Theo Thời Gian (Time Range) */}
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value as any);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toàn bộ thời gian</option>
              <option value="15m">15 phút vừa qua</option>
              <option value="1h">1 giờ vừa qua</option>
              <option value="today">Hôm nay</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="custom">Tùy chọn khoảng ngày...</option>
            </select>

            {/* Toggle Advanced Filters */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showAdvancedFilters || isFiltered
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Bộ lọc chi tiết</span>
              {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>

            {isFiltered && (
              <button
                onClick={resetAllFilters}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline cursor-pointer"
              >
                Đặt lại
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Làm mới trạng thái broker"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Làm Mới</span>
            </button>

            <button
              onClick={onExportCSV}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Xuất danh sách sự kiện ra file CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Xuất CSV</span>
            </button>

            <button
              onClick={onOpenPublisher}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Phát Sự Kiện</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ADVANCED FILTER PANEL (EXPANDABLE)                                        */}
        {/* ========================================================================= */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Trạng Thái Xử Lý
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả Trạng thái</option>
                <option value="PUBLISHED">PUBLISHED (Đã phát)</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED (Đã tiếp nhận)</option>
                <option value="DLQ_FAILED">DLQ_FAILED (Lỗi hàng đợi)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Phân Hệ Nguồn (Source Module)
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả Phân hệ Nguồn</option>
                {uniqueSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {timeRange === 'custom' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Từ Ngày (Start Date)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Đến Ngày (End Date)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* L3: MASTER DATA TABLE (CHUẨN M19)                                         */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Nhật Ký Sự Kiện Doanh Nghiệp (Enterprise Event Logs Stream)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
              {filteredEvents.length} bản ghi
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Trục EDA: HOẠT ĐỘNG THỜI GIAN THỰC
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-2.5 px-3">Mã Event & Aggregate</th>
                <th className="py-2.5 px-3">Loại Sự Kiện / Topic</th>
                <th className="py-2.5 px-3">Phân Hệ Nguồn</th>
                <th className="py-2.5 px-3">Đơn Vị Nhận (Consumer)</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3">Thời Gian Phát</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Zap className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy sự kiện nào phù hợp với bộ lọc.</p>
                      <p className="text-[11px] text-slate-500">Hãy thử xóa từ khóa tìm kiếm hoặc chọn khoảng thời gian khác.</p>
                      {isFiltered && (
                        <button
                          onClick={resetAllFilters}
                          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Xóa Bộ Lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((e) => {
                  const isDlq = e.status === 'DLQ_FAILED';
                  const isAck = e.status === 'ACKNOWLEDGED';
                  const isPub = e.status === 'PUBLISHED';

                  return (
                    <tr
                      key={e.id}
                      onClick={() => onViewDetails(e)}
                      className={`transition-colors duration-150 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                        isDlq
                          ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                          : isAck
                          ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                          : isPub
                          ? 'border-l-4 border-blue-500/60 bg-blue-50/10 dark:bg-blue-950/10'
                          : 'border-l-4 border-transparent'
                      }`}
                    >
                      {/* Event ID + Aggregate ID */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {e.id}
                        </div>
                        {e.aggregateId && (
                          <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] px-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-bold">
                              {e.aggregateType || 'AGG'}
                            </span>
                            <span>{e.aggregateId}</span>
                          </div>
                        )}
                      </td>

                      {/* Event Type / Topic */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">
                          {e.eventType || e.topic.split('.').pop()}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                          {e.topic}
                        </div>
                      </td>

                      {/* Source Module */}
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                          {e.sourceModule}
                        </span>
                        {e.actorId && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            @{e.actorId}
                          </div>
                        )}
                      </td>

                      {/* Consumer */}
                      <td className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300 max-w-[150px] truncate" title={e.consumer}>
                        {e.consumer}
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-3">
                        {isPub && (
                          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950/90 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                            PUBLISHED
                          </span>
                        )}
                        {isAck && (
                          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-100 text-emerald-950 dark:bg-emerald-950/90 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                            ACKNOWLEDGED
                          </span>
                        )}
                        {isDlq && (
                          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-100 text-rose-950 dark:bg-rose-950/90 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                            DLQ_FAILED
                          </span>
                        )}
                        {!isPub && !isAck && !isDlq && (
                          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-600">
                            {e.status}
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        <div>{new Date(e.timestamp).toLocaleTimeString('vi-VN')}</div>
                        <div className="text-[10px] text-slate-400">{new Date(e.timestamp).toLocaleDateString('vi-VN')}</div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {isDlq && onRetryEvent && (
                            <button
                              onClick={() => onRetryEvent(e.id)}
                              className="px-2 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white rounded-lg transition-all cursor-pointer border border-rose-200 dark:border-rose-800 flex items-center gap-1"
                              title="Tái xử lý sự kiện lỗi"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                          <button
                            onClick={() => onViewDetails(e)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết 360°"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectEvent(e)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/80 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white rounded-lg transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800"
                            title="Nạp vào Ngữ cảnh Đối tượng"
                          >
                            Truy Vết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* L4: PAGINATION CONTROL                                                    */}
        {/* ========================================================================= */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            Hiển thị {filteredEvents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredEvents.length)} trên tổng số {filteredEvents.length} sự kiện
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 font-semibold cursor-pointer"
            >
              Trước
            </button>
            <span className="px-3 py-1 font-mono font-bold text-blue-600 dark:text-blue-400">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 font-semibold cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
