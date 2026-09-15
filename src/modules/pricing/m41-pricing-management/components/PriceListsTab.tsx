import React, { useState } from 'react';
import { Layers, Plus, CheckCircle, ShieldAlert, Calendar, DollarSign, Search, Filter } from 'lucide-react';
import { PriceList } from '../../../../types/pricingManagement';

interface PriceListsTabProps {
  priceLists: PriceList[];
  onSelectPriceList: (list: PriceList) => void;
  selectedPriceListId: string;
  onAddNewPriceList: (newList: PriceList) => void;
}

export const PriceListsTab: React.FC<PriceListsTabProps> = ({
  priceLists,
  onSelectPriceList,
  selectedPriceListId,
  onAddNewPriceList
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<PriceList['type']>('RETAIL');
  const [newCurrency, setNewCurrency] = useState('VND');
  const [newTargetType, setNewTargetType] = useState<PriceList['targetType']>('ALL');
  const [newPriority, setNewPriority] = useState(1);
  const [newValidFrom, setNewValidFrom] = useState('2026-08-01');
  const [newValidTo, setNewValidTo] = useState('2026-12-31');
  const [newDescription, setNewDescription] = useState('');

  const filteredLists = priceLists.filter(pl => {
    const matchesSearch = pl.name.toLowerCase().includes(searchTerm.toLowerCase()) || pl.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || pl.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    const created: PriceList = {
      id: `PL-${Date.now().toString().slice(-4)}`,
      code: newCode.toUpperCase(),
      name: newName,
      type: newType,
      currency: newCurrency,
      targetType: newTargetType,
      priority: Number(newPriority),
      status: 'ACTIVE',
      approvalStatus: 'ACTIVE',
      validFrom: newValidFrom,
      validTo: newValidTo,
      description: newDescription,
      defaultUom: 'PCS',
      itemsCount: 0,
      approvedBy: 'Hoàng Nam (Admin)',
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    onAddNewPriceList(created);
    setShowModal(false);
    // Reset
    setNewCode('');
    setNewName('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã bảng giá, tên bảng giá..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="ALL">Tất cả loại bảng giá</option>
              <option value="RETAIL">Bán lẻ (Retail)</option>
              <option value="WHOLESALE">Bán sỉ (Wholesale)</option>
              <option value="DISTRIBUTOR">Nhà phân phối (Distributor)</option>
              <option value="DEALER">Đại lý (Dealer)</option>
              <option value="VIP">Khách VIP</option>
              <option value="EXPORT">Xuất khẩu (Export)</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo Bảng Giá Mới
        </button>
      </div>

      {/* Grid of Price Lists - 4 Columns Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredLists.map((pl) => {
          const isSelected = pl.id === selectedPriceListId;
          return (
            <div
              key={pl.id}
              onClick={() => onSelectPriceList(pl)}
              className={`cursor-pointer bg-white dark:bg-slate-800 rounded-xl border p-4 transition-all shadow-2xs relative hover:shadow-md flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200 font-mono text-xs font-bold rounded border border-blue-200 dark:border-blue-700">
                    {pl.code}
                  </span>
                  <span className={`px-2 py-0.5 text-[11px] rounded font-bold ${
                    pl.type === 'RETAIL' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700' :
                    pl.type === 'WHOLESALE' ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700' :
                    pl.type === 'VIP' ? 'bg-amber-50 text-amber-950 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700' :
                    'bg-purple-50 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
                  }`}>
                    {pl.type}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 leading-snug">{pl.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{pl.description || 'Không có mô tả chi tiết'}</p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500">Độ ưu tiên:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    P{pl.priority}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500">Tiền tệ & ĐVT:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">{pl.currency} / {pl.defaultUom || 'PCS'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500">Hiệu lực:</span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-400">{pl.validFrom}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-50 dark:border-slate-700/50">
                  <span className="text-slate-400 dark:text-slate-500">Trạng thái:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5" /> {pl.approvalStatus || pl.status}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2 border-t border-blue-100 dark:border-blue-900 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-bold">
                  <span>Đang chọn kiểm tra</span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Thiết Lập Bảng Giá Mới (Price List Authority)
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Bảng Giá *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: RETAIL-2026"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm uppercase font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại Bảng Giá</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                  >
                    <option value="RETAIL">RETAIL (Bán lẻ)</option>
                    <option value="WHOLESALE">WHOLESALE (Bán sỉ)</option>
                    <option value="DISTRIBUTOR">DISTRIBUTOR (Nhà phân phối)</option>
                    <option value="DEALER">DEALER (Đại lý)</option>
                    <option value="VIP">VIP (Khách thân thiết)</option>
                    <option value="EXPORT">EXPORT (Xuất khẩu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Bảng Giá *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bảng giá Bán lẻ Tiêu chuẩn 2026"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tiền Tệ</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                  >
                    <option value="VND">VND (₫)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Độ Ưu Tiên</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newPriority}
                    onChange={(e) => setNewPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đối Tượng</label>
                  <select
                    value={newTargetType}
                    onChange={(e) => setNewTargetType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="GROUP">Theo nhóm</option>
                    <option value="CUSTOMER">Theo khách hàng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hiệu lực từ</label>
                  <input
                    type="date"
                    value={newValidFrom}
                    onChange={(e) => setNewValidFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hiệu lực đến</label>
                  <input
                    type="date"
                    value={newValidTo}
                    onChange={(e) => setNewValidTo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô tả & Phạm vi áp dụng</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết về mục đích áp dụng của bảng giá..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Lưu & Áp Dụng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
