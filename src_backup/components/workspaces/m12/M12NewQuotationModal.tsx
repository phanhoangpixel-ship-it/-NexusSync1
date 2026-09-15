import React, { useState, useEffect } from 'react';
import { LeadItem, QuotationLineItem } from './m12Types';
import { X, FileText, Plus, Trash2, DollarSign, Calculator, Send } from 'lucide-react';

interface M12NewQuotationModalProps {
  isOpen: boolean;
  preselectedLead: LeadItem | null;
  leads: LeadItem[];
  onClose: () => void;
  onSubmit: (quotationData: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M12NewQuotationModal: React.FC<M12NewQuotationModalProps> = ({
  isOpen,
  preselectedLead,
  leads,
  onClose,
  onSubmit,
  onNotify,
}) => {
  const [leadId, setLeadId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('Báo giá giải pháp phần mềm & phần cứng ERP');
  const [validDays, setValidDays] = useState(30);
  const [taxRate, setTaxRate] = useState(10);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('NET30 (Thanh toán trong 30 ngày)');
  const [deliveryTerms, setDeliveryTerms] = useState('DAP (Giao tại xưởng khách hàng)');
  const [salespersonName, setSalespersonName] = useState('Trần Minh Đức');
  const [notes, setNotes] = useState('Bao gồm bảo hành 12 tháng và hỗ trợ kỹ thuật trực tiếp.');

  const [items, setItems] = useState<QuotationLineItem[]>([
    {
      productId: 1,
      sku: 'SW-ERP-ENT',
      name: 'NexusSync ERP Enterprise Core License',
      quantity: 1,
      unitPrice: 800000000,
      discountPercent: 0,
      total: 800000000,
    },
    {
      productId: 2,
      sku: 'SRV-IMPL-100',
      name: 'Gói Dịch Vụ Khảo Sát & Triển Khai 100 Giờ',
      quantity: 1,
      unitPrice: 200000000,
      discountPercent: 0,
      total: 200000000,
    }
  ]);

  useEffect(() => {
    if (preselectedLead) {
      setLeadId(preselectedLead.id);
      setCustomerName(preselectedLead.company || preselectedLead.name);
      setContactPerson(preselectedLead.name);
      setEmail(preselectedLead.email || '');
      setPhone(preselectedLead.phone || '');
      setSalespersonName(preselectedLead.salespersonName || 'Trần Minh Đức');
    }
  }, [preselectedLead]);

  if (!isOpen) return null;

  const handleLeadChange = (idStr: string) => {
    if (!idStr) {
      setLeadId('');
      return;
    }
    const id = Number(idStr);
    setLeadId(id);
    const target = leads.find((l) => l.id === id);
    if (target) {
      setCustomerName(target.company || target.name);
      setContactPerson(target.name);
      setEmail(target.email || '');
      setPhone(target.phone || '');
      setSalespersonName(target.salespersonName || 'Trần Minh Đức');
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: items.length + 1,
        sku: `PROD-ITEM-00${items.length + 1}`,
        name: 'Sản phẩm / Dịch vụ B2B',
        quantity: 1,
        unitPrice: 50000000,
        discountPercent: 0,
        total: 50000000,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      onNotify('warning', 'Yêu cầu', 'Báo giá phải có ít nhất 1 dòng sản phẩm.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const updateItem = (index: number, field: keyof QuotationLineItem, value: any) => {
    const next = [...items];
    (next[index] as any)[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(next[index].quantity) || 1;
      const p = Number(next[index].unitPrice) || 0;
      next[index].total = q * p;
    }
    setItems(next);
  };

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
  const disc = Number(discountAmount) || 0;
  const taxAmount = ((subtotal - disc) * (Number(taxRate) || 0)) / 100;
  const grandTotal = subtotal - disc + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng điền tên khách hàng và ít nhất 1 sản phẩm.');
      return;
    }

    onSubmit({
      leadId: leadId ? Number(leadId) : undefined,
      customerName,
      contactPerson,
      email,
      phone,
      title,
      validDays,
      items,
      taxRate,
      discountAmount,
      paymentTerms,
      deliveryTerms,
      salespersonName,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Lập Báo Giá Thương Mại (Commercial Quotation / BPA)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gắn với Lead (Tùy chọn)
              </label>
              <select
                value={leadId}
                onChange={(e) => handleLeadChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">-- Chọn từ danh sách Lead --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.leadCode} - {l.company}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên Khách Hàng / Công Ty *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Vd: Công ty Cổ phần Vinatech..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tiêu đề Báo Giá *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Vd: Báo giá giải pháp phần mềm NexusSync ERP..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Người nhận báo giá
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số ngày hiệu lực
              </label>
              <input
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Line items section */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                Danh Mục Sản Phẩm / Hàng Hóa & Đơn Giá
              </span>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-purple-600 font-bold hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Sản Phẩm</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                    <th className="py-2 px-3">Mã SKU</th>
                    <th className="py-2 px-3">Tên Sản Phẩm / Dịch Vụ</th>
                    <th className="py-2 px-3 w-20 text-center">Số Lượng</th>
                    <th className="py-2 px-3 w-36 text-right">Đơn Giá (VND)</th>
                    <th className="py-2 px-3 w-36 text-right">Thành Tiền</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-750">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={it.sku}
                          onChange={(e) => updateItem(idx, 'sku', e.target.value)}
                          className="w-full px-2 py-1 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={it.quantity !== undefined && it.quantity !== null ? Number(it.quantity).toLocaleString('vi-VN') : '1'}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            updateItem(idx, 'quantity', raw ? Number(raw) : 1);
                          }}
                          className="w-full px-2 py-1 text-xs text-center font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={it.unitPrice !== undefined && it.unitPrice !== null ? Number(it.unitPrice).toLocaleString('vi-VN') : '0'}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            updateItem(idx, 'unitPrice', raw ? Number(raw) : 0);
                          }}
                          placeholder="0"
                          className="w-full px-2 py-1 text-xs text-right font-mono font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {(Number(it.quantity || 1) * Number(it.unitPrice || 0)).toLocaleString('vi-VN')} VND
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing & Terms Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Điều khoản thanh toán
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Điều khoản giao hàng / Bàn giao
                </label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Cộng tiền hàng (Subtotal):</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {subtotal.toLocaleString('vi-VN')} VND
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Thuế suất VAT (%):</span>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 text-right font-mono font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tiền thuế VAT:</span>
                <span className="font-bold">+{taxAmount.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-purple-700 dark:text-purple-400 border-t border-slate-200 dark:border-slate-700 pt-1.5">
                <span>Tổng giá trị Báo giá:</span>
                <span>{grandTotal.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Phát Hành Báo Giá</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
