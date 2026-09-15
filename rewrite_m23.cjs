const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/workspaces/M23SerialsWorkspace.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(
  "import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';",
  `import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { usePagination } from '../../hooks/usePagination';
import { PaginationControl } from '../common/PaginationControl';
import { L3ContentState } from '../common/L3ContentState';`
);

// 2. Pagination Logic
const paginationLogic = `
  const totalCount = serials.length;
  const inStockCount = serials.filter(s => s.status === 'IN_STOCK').length;
  const soldCount = serials.filter(s => s.status === 'SOLD').length;
  const warrantyCount = serials.filter(s => s.status === 'WARRANTY' || s.status === 'DEFECTIVE').length;

  const pagination = usePagination({
    totalItems: filteredSerials.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedSerials = pagination.paginatedData(filteredSerials);
`;
content = content.replace(
  `  const totalCount = serials.length;
  const inStockCount = serials.filter(s => s.status === 'IN_STOCK').length;
  const soldCount = serials.filter(s => s.status === 'SOLD').length;
  const warrantyCount = serials.filter(s => s.status === 'WARRANTY' || s.status === 'DEFECTIVE').length;`,
  paginationLogic
);

// 3. Main container and Banner, KPI, Tabs
const oldHeaderToTabs = `    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-indigo-100 text-indigo-800 rounded-md">M23</span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Số Serial & IMEI</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Truy xuất nguồn gốc từng đơn vị sản phẩm, quản lý vòng đời 360°, bảo hành điện tử và kiểm soát trạng thái tồn kho.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Xuất Excel/CSV
          </button>
          <button
            onClick={() => {
              if (filteredSerials.length > 0) {
                handleInspectSerial(filteredSerials[0]);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            In Nhãn Mã Vạch
          </button>
          <button 
            onClick={() => setInternalCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Đăng Ký Serial / IMEI
          </button>
        </div>
      </div>

      {/* KPI Sparkline / Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số Serial / IMEI</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalCount}</p>
            <span className="text-xs text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Đồng bộ WMS
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang trong kho (In Stock)</p>
            <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">{inStockCount}</p>
            <span className="text-xs text-slate-500 mt-1 block">Sẵn sàng xuất kho / bán hàng</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã bán / Sở hữu</p>
            <p className="text-2xl font-bold font-mono text-blue-600 mt-1">{soldCount}</p>
            <span className="text-xs text-blue-600 font-medium mt-1 inline-flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Có thông tin khách hàng
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <User className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bảo hành / Lỗi</p>
            <p className="text-2xl font-bold font-mono text-amber-600 mt-1">{warrantyCount}</p>
            <span className="text-xs text-amber-600 font-medium mt-1 inline-flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Cần xử lý kỹ thuật
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab('serials')}
          className={\`pb-3 text-sm font-medium border-b-2 transition-colors \${
            activeTab === 'serials' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }\`}
        >
          Danh Sách Serial / IMEI ({serials.length})
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={\`pb-3 text-sm font-medium border-b-2 transition-colors \${
            activeTab === 'profiles' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }\`}
        >
          Hồ Sơ Ngành Hàng (Profiles)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={\`pb-3 text-sm font-medium border-b-2 transition-colors \${
            activeTab === 'history' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }\`}
        >
          Nhật Ký Vòng Đời (Audit Trail)
        </button>
      </div>`;

const newHeaderToTabs = `    <div className="space-y-3.5 max-w-full pb-6 bg-slate-50 dark:bg-slate-900 min-h-screen px-4 pt-4">
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (COMPACT & MODERN)                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M23 • SERIALS & IMEI
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Data Lineage 360°
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              Quản Lý Số Serial & IMEI
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TABS NAVIGATION STRIP (STREAMLINED & RESPONSIVE)                     */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('serials')}
            className={\`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer \${
              activeTab === 'serials'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }\`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Danh Sách Serial / IMEI ({totalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={\`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer \${
              activeTab === 'profiles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }\`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hồ Sơ Ngành Hàng (Profiles)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={\`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer \${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }\`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Nhật Ký Vòng Đời (Audit Trail)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI SUMMARY CARDS                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Số Serial / IMEI</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <QrCode className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {totalCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> 100% WMS
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đang Trong Kho</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {inStockCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Sẵn sàng xuất</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đã Bán / Sở Hữu</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {soldCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Có thông tin khách hàng</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bảo Hành / Lỗi</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
              {warrantyCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Cần xử lý kỹ thuật</span>
          </div>
        </div>
      </div>`;

content = content.replace(oldHeaderToTabs, newHeaderToTabs);

// 4. Tab 1 Toolbar
const oldTab1Top = `      {/* Tab 1: Serial List */}
      {activeTab === 'serials' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Tìm kiếm số serial, IMEI, SKU, khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="IN_STOCK">Trong kho (IN_STOCK)</option>
                <option value="SOLD">Đã bán (SOLD)</option>
                <option value="WARRANTY">Bảo hành (WARRANTY)</option>
                <option value="DEFECTIVE">Hỏng / Lỗi (DEFECTIVE)</option>
              </select>
            </div>
          </div>`;

const newTab1Top = `      {/* Tab 1: Serial List */}
      {activeTab === 'serials' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm số serial, IMEI, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="IN_STOCK">Trong kho (IN_STOCK)</option>
                <option value="SOLD">Đã bán (SOLD)</option>
                <option value="WARRANTY">Bảo hành (WARRANTY)</option>
                <option value="DEFECTIVE">Hỏng / Lỗi (DEFECTIVE)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Xuất Excel/CSV</span>
              </button>
              <button
                onClick={() => {
                  if (filteredSerials.length > 0) handleInspectSerial(filteredSerials[0]);
                }}
                className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">In Nhãn</span>
              </button>
              <button
                onClick={() => setInternalCreateModal(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Đăng Ký Serial</span>
              </button>
            </div>
          </div>

          <L3ContentState
            isLoading={false}
            error={null}
            isEmpty={filteredSerials.length === 0}
            onRetry={() => {}}
            emptyTitle="Không tìm thấy Serial / IMEI"
            emptyDescription="Không có dữ liệu phù hợp với điều kiện tìm kiếm và bộ lọc."
            emptyAction={{
              label: 'Đăng ký Serial mới',
              onClick: () => setInternalCreateModal(true),
              variant: 'primary'
            }}
            skeletonRows={6}
            minHeight="min-h-[420px]"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">`;

content = content.replace(oldTab1Top, newTab1Top);

// 5. Table Header and Rows (M19 Styles)
const oldTable = `          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Số Serial / IMEI</th>
                  <th className="py-3.5 px-4">Mã SKU & Sản Phẩm</th>
                  <th className="py-3.5 px-4">Kho / Vị Trí</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4">Khách Hàng / Sở Hữu</th>
                  <th className="py-3.5 px-4">Bảo Hành Đến</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSerials.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Không tìm thấy số Serial hoặc IMEI phù hợp với điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  filteredSerials.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/85 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        <button
                          onClick={() => handleInspectSerial(s)}
                          className="hover:text-indigo-600 hover:underline flex items-center gap-1.5 text-left"
                          title="Click để xem chi tiết hồ sơ thiết bị"
                        >
                          <span>{s.serialNumber}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs text-indigo-600 block">{s.sku}</span>
                        <span className="text-slate-800 font-medium">{s.productName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {s.warehouse}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${
                          s.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800' :
                          s.status === 'SOLD' ? 'bg-blue-100 text-blue-800' :
                          s.status === 'WARRANTY' ? 'bg-amber-100 text-amber-800' :
                          s.status === 'DEFECTIVE' ? 'bg-rose-100 text-rose-800' :
                          'bg-purple-100 text-purple-800'
                        }\`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {s.customerName ? (
                          <div>
                            <span className="font-medium text-slate-900 block">{s.customerName}</span>
                            {s.orderNumber && <span className="font-mono text-[11px] text-slate-400">Đơn: {s.orderNumber}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Nội bộ kho</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {s.warrantyEnd ? (
                          <span className="text-slate-800 font-medium">{s.warrantyEnd}</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa kích hoạt</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* IN_STOCK: Actions */}
                          {s.status === 'IN_STOCK' && (
                            <>
                              <button
                                onClick={() => openActionModal(s, 'SELL')}
                                title="Xuất bán theo đơn hàng SO / Khách hàng"
                                className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                              >
                                Xuất bán
                              </button>
                              <button
                                onClick={() => openActionModal(s, 'TRANSFER')}
                                title="Điều chuyển kho nội bộ"
                                className="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                Chuyển kho
                              </button>
                            </>
                          )}

                          {/* SOLD: Actions */}
                          {s.status === 'SOLD' && (
                            <>
                              <button
                                onClick={() => openActionModal(s, 'WARRANTY')}
                                title="Tiếp nhận bảo hành / sửa chữa thiết bị"
                                className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md transition-colors"
                              >
                                Bảo hành
                              </button>
                            </>
                          )}

                          {/* WARRANTY: Actions */}
                          {s.status === 'WARRANTY' && (
                            <>
                              <button
                                onClick={() => openActionModal(s, 'RESOLVE_WARRANTY')}
                                title="Hoàn tất bảo hành và trả lại thiết bị cho khách hàng"
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"
                              >
                                Trả máy
                              </button>
                              <button
                                onClick={() => openActionModal(s, 'DEFECTIVE')}
                                title="Báo hỏng không thể sửa chữa"
                                className="px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                Báo hỏng
                              </button>
                            </>
                          )}

                          {/* DEFECTIVE: Actions */}
                          {s.status === 'DEFECTIVE' && (
                            <>
                              <button
                                onClick={() => handleQuickStatusUpdate(s.id, s.serialNumber, 'IN_STOCK')}
                                title="Đã khắc phục / NCC đổi mới, tái nhập kho"
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"
                              >
                                Tái nhập kho
                              </button>
                            </>
                          )}

                          {/* Inspect Eye Button */}
                          <button
                            onClick={() => handleInspectSerial(s)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-1"
                            title="Xem chi tiết hồ sơ & Dòng thời gian 360°"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}`;

const newTable = `              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[140px]">Số Serial / IMEI</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Mã SKU & Sản Phẩm</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Kho / Vị Trí</th>
                      <th className="py-2.5 px-2 text-center min-w-[100px]">Trạng Thái</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Khách Hàng / Sở Hữu</th>
                      <th className="py-2.5 px-3 min-w-[100px]">Bảo Hành Đến</th>
                      <th className="py-2.5 px-3 text-right min-w-[150px]">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                    {paginatedSerials.map((s) => {
                      const isSelected = selectedSerial?.id === s.id;
                      const statusClass = 
                        s.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold' :
                        s.status === 'SOLD' ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold' :
                        s.status === 'WARRANTY' ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold' :
                        s.status === 'DEFECTIVE' ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold' :
                        'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-semibold';
                      
                      const borderColor = 
                        isSelected ? 'border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80 shadow-2xs' :
                        (s.status === 'WARRANTY' || s.status === 'DEFECTIVE') ? 'border-l-4 border-amber-500 bg-amber-50/20 dark:bg-amber-950/20' :
                        'border-l-4 border-transparent';

                      return (
                        <tr key={s.id} className={\`transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 \${borderColor}\`}>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleInspectSerial(s)}
                              className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                              title="Click để xem chi tiết hồ sơ thiết bị"
                            >
                              {s.serialNumber}
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block">{s.sku}</span>
                            <span className="font-medium">{s.productName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {s.warehouse}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={\`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-md border \${statusClass}\`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {s.customerName ? (
                              <div>
                                <span className="font-medium text-slate-900 dark:text-white block">{s.customerName}</span>
                                {s.orderNumber && <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Đơn: {s.orderNumber}</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic">Nội bộ kho</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {s.warrantyEnd ? (
                              <span className="font-medium">{s.warrantyEnd}</span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic">Chưa kích hoạt</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* IN_STOCK: Actions */}
                              {s.status === 'IN_STOCK' && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openActionModal(s, 'SELL'); }}
                                    className="px-2 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded transition-colors cursor-pointer"
                                  >
                                    Xuất bán
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openActionModal(s, 'TRANSFER'); }}
                                    className="px-2 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded transition-colors cursor-pointer"
                                  >
                                    Chuyển
                                  </button>
                                </>
                              )}

                              {/* SOLD: Actions */}
                              {s.status === 'SOLD' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); openActionModal(s, 'WARRANTY'); }}
                                  className="px-2 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 rounded transition-colors cursor-pointer"
                                >
                                  Bảo hành
                                </button>
                              )}

                              {/* WARRANTY: Actions */}
                              {s.status === 'WARRANTY' && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openActionModal(s, 'RESOLVE_WARRANTY'); }}
                                    className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded transition-colors cursor-pointer"
                                  >
                                    Trả máy
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openActionModal(s, 'DEFECTIVE'); }}
                                    className="px-2 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded transition-colors cursor-pointer"
                                  >
                                    Báo hỏng
                                  </button>
                                </>
                              )}

                              {/* DEFECTIVE: Actions */}
                              {s.status === 'DEFECTIVE' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(s.id, s.serialNumber, 'IN_STOCK'); }}
                                  className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded transition-colors cursor-pointer"
                                >
                                  Tái nhập
                                </button>
                              )}

                              <button
                                onClick={(e) => { e.stopPropagation(); handleInspectSerial(s); }}
                                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700">
                <PaginationControl pagination={pagination} />
              </div>
            </div>
          </L3ContentState>
        </div>
      )}`;
content = content.replace(oldTable, newTable);

// 6. Profile tab
const oldProfileTab = `      {/* Tab 2: Profiles */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profiles.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono text-xs font-bold rounded-md">
                  {p.code}
                </span>
                <span className="text-xs font-mono text-slate-500">Prefix: {p.prefix}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{p.description}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Thời hạn bảo hành chuẩn: <strong>{p.warrantyMonths} tháng</strong></span>
                <span className="font-mono bg-slate-100 px-2 py-1 rounded">Category: {p.categoryType}</span>
              </div>
            </div>
          ))}
        </div>
      )}`;

const newProfileTab = `      {/* Tab 2: Profiles */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-mono text-[10px] font-bold rounded">
                  {p.code}
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Prefix: {p.prefix}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{p.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description}</p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Bảo hành: <strong className="font-mono tabular-nums">{p.warrantyMonths}</strong> tháng</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">{p.categoryType}</span>
              </div>
            </div>
          ))}
        </div>
      )}`;
content = content.replace(oldProfileTab, newProfileTab);

// 7. History tab
const oldHistoryTab = `      {/* Tab 3: History Audit Trail */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Nhật Ký Vòng Đời & Truy Vết Serial (Audit Trail)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Lịch sử giao dịch, biến động kho và các mốc bảo hành của toàn bộ thiết bị</p>
            </div>
            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md font-semibold">
              Live Event Lineage
            </span>
          </div>
          <div className="space-y-3 pt-2">
            {serials.flatMap(s => (s.timeline || []).map(t => ({ ...t, serialNumber: s.serialNumber, sku: s.sku, productName: s.productName }))).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((event, idx) => (
              <div key={event.id || idx} className="p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-lg border border-slate-200 flex items-start gap-3.5">
                <div className={\`p-2 rounded-lg shrink-0 \${
                  event.type === 'SOLD' ? 'bg-blue-100 text-blue-700' :
                  event.type === 'MAINTENANCE' || event.type === 'DEFECT' ? 'bg-amber-100 text-amber-700' :
                  event.type === 'TRANSFER' ? 'bg-purple-100 text-purple-700' :
                  'bg-emerald-100 text-emerald-700'
                }\`}>
                  {event.type === 'SOLD' ? <User className="w-4 h-4" /> :
                   event.type === 'MAINTENANCE' ? <Wrench className="w-4 h-4" /> :
                   event.type === 'TRANSFER' ? <ArrowLeftRight className="w-4 h-4" /> :
                   <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">{event.serialNumber}</span>
                      <span className="text-xs font-mono text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">{event.sku}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{event.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium mt-1">{event.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                    <span>Thực hiện: <strong>{event.actor}</strong></span>
                    {event.referenceDoc && <span className="font-mono">Chứng từ: <strong>{event.referenceDoc}</strong></span>}
                    {event.location && <span>Vị trí: <strong>{event.location}</strong></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}`;

const newHistoryTab = `      {/* Tab 3: History Audit Trail */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nhật Ký Vòng Đời & Truy Vết Serial</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Lịch sử giao dịch, biến động kho và các mốc bảo hành</p>
            </div>
            <span className="px-2 py-1 text-[10px] font-mono text-emerald-900 bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 rounded font-semibold tracking-wider">
              GL AUDIT LOG
            </span>
          </div>
          <div className="p-4 space-y-3">
            {serials.flatMap(s => (s.timeline || []).map(t => ({ ...t, serialNumber: s.serialNumber, sku: s.sku, productName: s.productName }))).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((event, idx) => (
              <div key={event.id || idx} className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-700/60 transition-colors rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className={\`p-1.5 rounded-lg shrink-0 border \${
                  event.type === 'SOLD' ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700' :
                  event.type === 'MAINTENANCE' || event.type === 'DEFECT' ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700' :
                  event.type === 'TRANSFER' ? 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700' :
                  'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                }\`}>
                  {event.type === 'SOLD' ? <User className="w-3.5 h-3.5" /> :
                   event.type === 'MAINTENANCE' ? <Wrench className="w-3.5 h-3.5" /> :
                   event.type === 'TRANSFER' ? <ArrowLeftRight className="w-3.5 h-3.5" /> :
                   <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{event.serialNumber}</span>
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">{event.sku}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">{event.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1">{event.title}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{event.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex-wrap border-t border-slate-100 dark:border-slate-700/50 pt-2">
                    <span>Thực hiện: <strong className="text-slate-700 dark:text-slate-300">{event.actor}</strong></span>
                    {event.referenceDoc && <span className="font-mono">Tham chiếu: <strong className="text-slate-700 dark:text-slate-300">{event.referenceDoc}</strong></span>}
                    {event.location && <span>Kho/Vị trí: <strong className="text-slate-700 dark:text-slate-300">{event.location}</strong></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}`;
content = content.replace(oldHistoryTab, newHistoryTab);

// 8. 360 Degree Inspector Modal - just update bg-slate-900/60 to backdrop-blur-xs and fix header/footer colors for dark mode if needed
content = content.replace(/bg-slate-900\/60 backdrop-blur-xs/g, "bg-slate-900/60 backdrop-blur-sm");
content = content.replace(/bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8/g, "bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-700 my-8");
content = content.replace(/px-6 py-4 bg-slate-900 text-white flex items-center justify-between/g, "px-5 py-3 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800");

// 9. Fix some hardcoded text colors in the 360 modal body
content = content.replace(/text-slate-900/g, "text-slate-900 dark:text-white");
content = content.replace(/text-slate-800/g, "text-slate-800 dark:text-slate-200");
content = content.replace(/text-slate-600/g, "text-slate-600 dark:text-slate-400");
content = content.replace(/text-slate-500/g, "text-slate-500 dark:text-slate-400");
content = content.replace(/bg-slate-50/g, "bg-slate-50 dark:bg-slate-900/50");
content = content.replace(/border-slate-200/g, "border-slate-200 dark:border-slate-700");
content = content.replace(/border-slate-100/g, "border-slate-100 dark:border-slate-700/50");
content = content.replace(/border-slate-300/g, "border-slate-300 dark:border-slate-600");
content = content.replace(/bg-white/g, "bg-white dark:bg-slate-800");

// Action modal sizes
content = content.replace(/max-w-lg/g, "max-w-md");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
