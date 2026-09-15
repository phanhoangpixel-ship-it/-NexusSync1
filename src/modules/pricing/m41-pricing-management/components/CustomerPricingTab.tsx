import React, { useState } from 'react';
import { Search, Plus, UserCheck, ShieldCheck, CheckCircle2, DollarSign, Tag, FileText } from 'lucide-react';
import { CustomerPricing } from './types';
import { formatVND } from '../../../../lib/currency';
import { CurrencyInputField } from '../../../../components/common/CurrencyInputField';

interface CustomerPricingTabProps {
  customerPricingList: CustomerPricing[];
  onAddCustomerPrice: (newCP: CustomerPricing) => void;
}

export const CustomerPricingTab: React.FC<CustomerPricingTabProps> = ({
  customerPricingList,
  onAddCustomerPrice
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  // Modal Form State
  const [customerName, setCustomerName] = useState('');
  const [customerGroup, setCustomerGroup] = useState<'Retail' | 'Wholesale' | 'Dealer' | 'VIP'>('VIP');
  const [contractCode, setContractCode] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(650000);
  const [validTo, setValidTo] = useState('2026-12-31');

  const filtered = customerPricingList.filter(item => {
    const matchesSearch = (item.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.contractCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = groupFilter === 'ALL' || item.customerGroup === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CustomerPricing = {
      id: `CP-${Date.now().toString().slice(-4)}`,
      customerId: `CUST-${Date.now().toString().slice(-3)}`,
      customerName,
      customerGroup,
      productId: 'PROD-RAM-16',
      productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
      sku: 'RAM-16GB-DDR5',
      uom: 'Cây (PCS)',
      contractCode: contractCode || 'HD-SPECIFIC-2026',
      customPrice: Number(customPrice),
      standardPrice: 666666,
      discountPercent: Math.round(((666666 - Number(customPrice)) / 666666) * 1000) / 10,
      costBasis: 444444,
      actualMarginPercent: Math.round(((Number(customPrice) - 444444) / Number(customPrice)) * 1000) / 10,
      validFrom: '2026-08-01',
      validTo,
      status: 'ACTIVE',
      approvedBy: 'Trần Văn Giám (CFO)'
    };
    onAddCustomerPrice(created);
    setShowModal(false);
    setCustomerName('');
    setContractCode('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm khách hàng, hợp đồng, sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="ALL">Tất cả nhóm khách</option>
            <option value="VIP">Khách VIP</option>
            <option value="Distributor">Nhà phân phối</option>
            <option value="Dealer">Đại lý</option>
            <option value="Wholesale">Bán sỉ</option>
            <option value="Retail">Bán lẻ</option>
          </select>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thiết Lập Giá Khách Hàng / Hợp Đồng
        </button>
      </div>

      {/* Table of Customer-Specific Prices */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
              <tr>
                <th className="py-3.5 px-4">Khách Hàng & Nhóm</th>
                <th className="py-3.5 px-3">Mã Hợp Đồng</th>
                <th className="py-3.5 px-3">Sản Phẩm & ĐVT</th>
                <th className="py-3.5 px-3 text-right">Giá Niêm Yết</th>
                <th className="py-3.5 px-3 text-right font-bold text-indigo-900 dark:text-indigo-200">Giá Riêng (Thỏa Thuận)</th>
                <th className="py-3.5 px-3 text-center">Chiết Khấu</th>
                <th className="py-3.5 px-3 text-right">Margin Thực</th>
                <th className="py-3.5 px-3 text-center">Thời Hạn</th>
                <th className="py-3.5 px-3">Người Phê Duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/60">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{item.customerName}</div>
                    <span className="inline-block mt-0.5 text-[11px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-full font-medium border border-indigo-200 dark:border-indigo-700">
                      Nhóm: {item.customerGroup}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                      {item.contractCode || '—'}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{item.productName}</div>
                    <div className="text-xs text-slate-400">SKU: {item.sku} | ĐVT: {item.uom}</div>
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono text-xs text-slate-500 line-through">
                    {formatVND(item.standardPrice)}
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                    {formatVND(item.customPrice)}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded border border-emerald-200 dark:border-emerald-700">
                      -{item.discountPercent}%
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    {item.actualMarginPercent.toFixed(1)}%
                  </td>

                  <td className="py-3.5 px-3 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {item.validTo}
                  </td>

                  <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-4">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {item.approvedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal create customer pricing */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Thiết Lập Giá Hợp Đồng Cho Khách Hàng
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Doanh Nghiệp / Khách Hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tập đoàn VNPT"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nhóm Khách Hàng</label>
                  <select
                    value={customerGroup}
                    onChange={(e) => setCustomerGroup(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                  >
                    <option value="VIP">VIP</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Dealer">Dealer</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Số Hợp Đồng</label>
                  <input
                    type="text"
                    placeholder="VD: HD-2026-VNPT"
                    value={contractCode}
                    onChange={(e) => setContractCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Bán Thỏa Thuận (₫) *</label>
                <CurrencyInputField
                  required
                  value={customPrice}
                  onChange={setCustomPrice}
                  placeholder="VD: 650.000"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Giá niêm yết chuẩn: 666.666 ₫ | Giá vốn: 444.444 ₫
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày Hết Hạn Hợp Đồng</label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium cursor-pointer"
                >
                  Lưu Giá Khách Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

