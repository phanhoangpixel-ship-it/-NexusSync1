import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Search,
  Filter,
  Plus,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  Activity,
  DollarSign,
  ChevronRight,
  Eye,
  Wrench,
  QrCode,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { SelectedEntityContext } from '../../../../types';
import { AssetDetailModal } from './AssetDetailModal';

interface AssetRegistryTabProps {
  assets: any[];
  selectedAsset: any;
  onSelectAsset: (asset: any) => void;
  onOpenCreateModal: () => void;
  onOpenCreateWoModal: (asset?: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const AssetRegistryTab: React.FC<AssetRegistryTabProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  onOpenCreateModal,
  onOpenCreateWoModal,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [inspectingAsset, setInspectingAsset] = useState<any | null>(null);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchQuery =
        !searchQuery.trim() ||
        a.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = categoryFilter === 'ALL' || a.categoryName === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchQuery && matchCategory && matchStatus;
    });
  }, [assets, searchQuery, categoryFilter, statusFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      if (a.categoryName) set.add(a.categoryName);
    });
    return Array.from(set);
  }, [assets]);

  return (
    <div className="space-y-4">
      {/* L1 COMMAND BAR */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã máy, tên thiết bị, model, vị trí..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all font-medium"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Tất cả nhóm tài sản</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE (Đang vận hành)</option>
            <option value="IN_USE">IN_USE (Đang chạy ca)</option>
            <option value="MAINTENANCE">MAINTENANCE (Đang bảo trì)</option>
            <option value="IDLE">IDLE (Tạm dừng)</option>
          </select>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Chế độ xem Bảng dữ liệu"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Chế độ xem Thẻ Card"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng Ký Thiết Bị Mới</span>
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
                  <th className="py-3 px-4">Mã Thiết Bị</th>
                  <th className="py-3 px-4">Tên Thiết Bị / Model</th>
                  <th className="py-3 px-4">Nhóm Tài Sản</th>
                  <th className="py-3 px-4">Vị Trí Lắp Đặt</th>
                  <th className="py-3 px-4 text-right">Nguyên Giá (TK 211)</th>
                  <th className="py-3 px-4 text-right">Giá Trị Sổ Sách</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Không tìm thấy thiết bị nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => onSelectAsset(asset)}
                        className={`hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-slate-700/80 font-semibold border-l-4 border-l-blue-600'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                          {asset.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{asset.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {asset.model} • SN: {asset.serialNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {asset.categoryName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{asset.location}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-white">
                          {asset.purchaseCost ? asset.purchaseCost.toLocaleString('vi-VN') : '—'} ₫
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {asset.bookValue ? asset.bookValue.toLocaleString('vi-VN') : '—'} ₫
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              asset.status === 'ACTIVE' || asset.status === 'IN_USE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            }`}
                          >
                            {asset.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setInspectingAsset(asset)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Chi tiết hồ sơ thiết bị"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenCreateWoModal(asset)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                              title="Tạo phiếu bảo trì WO"
                            >
                              <Wrench className="w-3 h-3" /> WO
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
        </div>
      )}

      {/* CARDS GRID VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const isSelected = selectedAsset?.id === asset.id;
            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-800 space-y-3.5 shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                        {asset.code}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 line-clamp-1">
                        {asset.name}
                      </h4>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      asset.status === 'ACTIVE' || asset.status === 'IN_USE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Model:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">{asset.model || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Vị trí:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{asset.location || 'Xưởng'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nguyên giá:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {asset.purchaseCost ? (asset.purchaseCost / 1000000).toFixed(1) + ' Tr ₫' : '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Giá trị sổ sách:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                      {asset.bookValue ? (asset.bookValue / 1000000).toFixed(1) + ' Tr ₫' : '—'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectingAsset(asset);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Chi tiết hồ sơ
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCreateWoModal(asset);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
                  >
                    <Wrench className="w-3 h-3" /> Lập Phiếu WO
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ASSET DETAIL MODAL */}
      <AssetDetailModal
        isOpen={!!inspectingAsset}
        onClose={() => setInspectingAsset(null)}
        asset={inspectingAsset}
        onNotify={onNotify}
        onCreateWoForAsset={(a) => onOpenCreateWoModal(a)}
      />
    </div>
  );
};
