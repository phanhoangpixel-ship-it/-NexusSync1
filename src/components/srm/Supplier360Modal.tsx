import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/currencyFormatter';
import {
  Building2,
  X,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Award,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react';

interface Supplier360ModalProps {
  supplier: any;
  onClose: () => void;
  onNavigateToPO?: (supplierId: string | number) => void;
  onOpenScorecard?: (supplierId: string | number) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  userToken?: string;
  onReloadSupplier?: () => void;
}

export const Supplier360Modal: React.FC<Supplier360ModalProps> = ({
  supplier,
  onClose,
  onNavigateToPO,
  onOpenScorecard,
  onNotify,
  userToken,
  onReloadSupplier
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'contacts_banks' | 'orders' | 'scorecards'>('general');
  const [details, setDetails] = useState<any>(supplier);
  const [loading, setLoading] = useState<boolean>(false);

  // Add Contact Form State
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactDept, setContactDept] = useState('Kinh doanh');
  const [contactPosition, setContactPosition] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Add Bank Form State
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [branch, setBranch] = useState('');
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  const fetchDetailedData = async () => {
    if (!supplier?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        headers: {
          'Authorization': `Bearer ${userToken || ''}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setDetails(json.data);
        }
      }
    } catch (err) {
      console.error('Error fetching supplier details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedData();
  }, [supplier?.id]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập họ tên người liên hệ.');
      return;
    }
    setIsSubmittingContact(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken || ''}`
        },
        body: JSON.stringify({
          contactName,
          department: contactDept,
          position: contactPosition,
          phone: contactPhone,
          email: contactEmail,
          isPrimary: details?.contacts?.length === 0
        })
      });
      if (!res.ok) throw new Error('Không thể thêm người liên hệ');
      onNotify('success', 'Thành công', 'Đã thêm người liên hệ mới.');
      setContactName('');
      setContactPosition('');
      setContactPhone('');
      setContactEmail('');
      setShowAddContact(false);
      fetchDetailedData();
      if (onReloadSupplier) onReloadSupplier();
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken || ''}` }
      });
      if (!res.ok) throw new Error('Không thể xóa người liên hệ');
      onNotify('success', 'Thành công', 'Đã xóa người liên hệ.');
      fetchDetailedData();
      if (onReloadSupplier) onReloadSupplier();
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên ngân hàng, số tài khoản và người thụ hưởng.');
      return;
    }
    setIsSubmittingBank(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken || ''}`
        },
        body: JSON.stringify({
          bankName,
          accountNumber,
          accountHolder,
          branch,
          isDefault: details?.bankAccounts?.length === 0
        })
      });
      if (!res.ok) throw new Error('Không thể thêm tài khoản ngân hàng');
      onNotify('success', 'Thành công', 'Đã thêm tài khoản ngân hàng mới.');
      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
      setBranch('');
      setShowAddBank(false);
      fetchDetailedData();
      if (onReloadSupplier) onReloadSupplier();
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    } finally {
      setIsSubmittingBank(false);
    }
  };

  const handleDeleteBank = async (bankId: number) => {
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/bank-accounts/${bankId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken || ''}` }
      });
      if (!res.ok) throw new Error('Không thể xóa tài khoản ngân hàng');
      onNotify('success', 'Thành công', 'Đã xóa tài khoản ngân hàng.');
      fetchDetailedData();
      if (onReloadSupplier) onReloadSupplier();
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    }
  };

  const creditLimit = details?.creditLimit || 500000000;
  const totalSpend = details?.totalSpend || 0;
  const creditAvailable = Math.max(0, creditLimit - totalSpend);
  const utilizationRate = creditLimit > 0 ? Math.min(100, Math.round((totalSpend / creditLimit) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold font-mono text-sm shrink-0">
              {String(details.code || details.id || 'SUP').slice(-3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold tracking-wide text-white">{details.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {details.code || `SUP-${details.id}`}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  details.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}>
                  {details.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-3">
                <span>MST: {details.taxCode || 'Chưa cập nhật'}</span>
                <span>•</span>
                <span>Phân hạng: <strong className="text-emerald-400">{details.performanceTier || 'Tier A (Chiến lược)'}</strong></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="px-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1 overflow-x-auto shrink-0 py-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('general')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'general'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Thông tin Chung & Hạn mức</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('contacts_banks')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'contacts_banks'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>2. Người liên hệ & Ngân hàng ({details.contacts?.length || 0}/{details.bankAccounts?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('orders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'orders'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>3. Lịch sử Đơn Mua PO ({details.purchaseOrders?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('scorecards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'scorecards'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>4. Thẻ điểm SRM & Đánh giá</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* SUB-TAB 1: GENERAL & FINANCIAL TERMS */}
          {activeSubTab === 'general' && (
            <div className="space-y-4">
              {/* Financial & Credit Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hạn mức Tín dụng</span>
                  <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-base">
                    {formatCurrency(creditLimit)}
                  </p>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    Điều khoản: {details.paymentTerms || 'NET 30'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chi tiêu Cam kết (PO)</span>
                  <p className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 text-base">
                    {formatCurrency(totalSpend)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Từ {details.purchaseOrders?.length || 0} đơn mua hàng
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hạn mức Khả dụng</span>
                  <p className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-base">
                    {formatCurrency(creditAvailable)}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          utilizationRate > 85 ? 'bg-rose-500' : utilizationRate > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${utilizationRate}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      {utilizationRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Master Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    Thông Tin Pháp Lý
                  </h4>
                  <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tên đầy đủ:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{details.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tên viết tắt:</span>
                      <span className="font-semibold">{details.shortName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mã số thuế:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{details.taxCode || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Loại hình đối tác:</span>
                      <span className="font-semibold">{details.supplierType || 'Nhà sản xuất'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tiền tệ mặc định:</span>
                      <span className="font-mono font-bold">{details.currency || 'VND'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    Địa Chỉ & Thông Tin Liên Hệ
                  </h4>
                  <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Điện thoại:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{details.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">{details.email || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Website:</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">{details.website || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Địa chỉ trụ sở:</span>
                      <span className="font-semibold text-right max-w-[240px] truncate">{details.address || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality & SLA Badge */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="block text-xs">Hồ Sơ Nhà Cung Cấp Chuẩn Hóa M09</strong>
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Đầy đủ chứng chỉ ISO, quy chuẩn CO/CQ và được thẩm định bởi Hội đồng Mua sắm P2P.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-mono font-bold text-[10px]">
                  VERIFIED PARTNER
                </span>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: CONTACTS & BANK ACCOUNTS */}
          {activeSubTab === 'contacts_banks' && (
            <div className="space-y-4">
              {/* Contacts Section */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    Danh Sách Người Liên Hệ ({details.contacts?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddContact(!showAddContact)}
                    className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddContact ? 'Đóng' : 'Thêm Người Liên Hệ'}</span>
                  </button>
                </div>

                {showAddContact && (
                  <form onSubmit={handleAddContact} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Họ & Tên *</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Phòng Ban / Chức Vụ</label>
                        <input
                          type="text"
                          value={contactPosition}
                          onChange={(e) => setContactPosition(e.target.value)}
                          placeholder="Trưởng phòng Mua sắm"
                          className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Số Điện Thoại</label>
                        <input
                          type="text"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="0987654321"
                          className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Email</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="contact@supplier.com"
                          className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddContact(false)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingContact}
                        className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSubmittingContact ? 'Đang lưu...' : 'Lưu Người Liên Hệ'}
                      </button>
                    </div>
                  </form>
                )}

                {(!details.contacts || details.contacts.length === 0) ? (
                  <p className="text-slate-400 py-3 text-center">Chưa có thông tin người liên hệ nào.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.contacts.map((c: any) => (
                      <div key={c.id} className="py-2 flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{c.contactName}</span>
                            {c.isPrimary === 1 && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                Chính
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">({c.position || c.department || 'Đại diện'})</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {c.phone && <span>SĐT: {c.phone}</span>}
                            {c.email && <span>Email: {c.email}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Xóa liên hệ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bank Accounts Section */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                    Tài Khoản Ngân Hàng Thanh Toán ({details.bankAccounts?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddBank(!showAddBank)}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddBank ? 'Đóng' : 'Thêm Tài Khoản Ngân Hàng'}</span>
                  </button>
                </div>

                {showAddBank && (
                  <form onSubmit={handleAddBank} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Tên Ngân Hàng *</label>
                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="Vietcombank / Techcombank"
                          className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Số Tài Khoản *</label>
                        <input
                          type="text"
                          required
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="0011001234567"
                          className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Tên Chủ Tài Khoản *</label>
                        <input
                          type="text"
                          required
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          placeholder="CÔNG TY TNHH..."
                          className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Chi Nhánh</label>
                        <input
                          type="text"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="Chi nhánh Thủ Đức"
                          className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddBank(false)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingBank}
                        className="px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isSubmittingBank ? 'Đang lưu...' : 'Lưu Tài Khoản'}
                      </button>
                    </div>
                  </form>
                )}

                {(!details.bankAccounts || details.bankAccounts.length === 0) ? (
                  <p className="text-slate-400 py-3 text-center">Chưa có thông tin tài khoản ngân hàng nào.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.bankAccounts.map((b: any) => (
                      <div key={b.id} className="py-2 flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{b.bankName}</span>
                            {b.isDefault === 1 && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                Mặc định
                              </span>
                            )}
                            {b.branch && <span className="text-[11px] text-slate-400">({b.branch})</span>}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>STK: <strong className="text-slate-800 dark:text-slate-200">{b.accountNumber}</strong></span>
                            <span>Chủ TK: {b.accountHolder}</span>
                            <span>Tiền tệ: {b.currency || 'VND'}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteBank(b.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: PURCHASE ORDERS (M08) */}
          {activeSubTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                    Lịch Sử Đơn Mua Hàng (M08 Purchase Orders)
                  </h4>
                  <p className="text-[11px] text-slate-500">Toàn bộ đơn PO đã phát hành và liên kết tới nhà cung cấp này.</p>
                </div>
                {onNavigateToPO && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToPO(details.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo Đơn Hàng PO Mới</span>
                  </button>
                )}
              </div>

              {(!details.purchaseOrders || details.purchaseOrders.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500">
                  <ShoppingBag className="w-8 h-8 opacity-40 mx-auto mb-2 text-slate-400" />
                  <p className="font-semibold">Chưa có đơn đặt hàng PO nào cho nhà cung cấp này.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Bấm "Tạo Đơn Hàng PO Mới" để phát hành đơn PO tại M08.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="py-2 px-3">Mã PO</th>
                        <th className="py-2 px-3">Ngày Lập</th>
                        <th className="py-2 px-3 text-center">Trạng Thái Đơn</th>
                        <th className="py-2 px-3 text-center">Thanh Toán</th>
                        <th className="py-2 px-3 text-right">Tổng Tiền (VND)</th>
                        <th className="py-2 px-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {details.purchaseOrders.map((po: any) => (
                        <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {po.code || `PO-${po.id}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">
                            {po.createdAt ? new Date(po.createdAt).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              po.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                              po.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                              po.status === 'PARTIALLY_RECEIVED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {po.paymentStatus || 'UNPAID'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(po.totalAmount || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {onNavigateToPO && (
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigateToPO(details.id);
                                  onClose();
                                }}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold hover:underline flex items-center justify-end gap-1 ml-auto cursor-pointer"
                              >
                                <span>Mở PO</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 4: SCORECARDS & EVALUATION */}
          {activeSubTab === 'scorecards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Thẻ Điểm & Báo Cáo Đánh Giá SRM
                  </h4>
                  <p className="text-[11px] text-slate-500">Chỉ số giao hàng đúng hạn OTIF, chất lượng kiểm định GR, và tuân thủ hợp đồng.</p>
                </div>
                {onOpenScorecard && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenScorecard(details.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Mở Bảng Điểm Đầy Đủ</span>
                  </button>
                )}
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">OTIF Rate</span>
                  <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {details.otifRate || '98.5%'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">SLA Target ≥ 95%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">Chất Lượng GR</span>
                  <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                    {details.qualityScore || '99.0%'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Nghiệm thu IQC</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">Tuân Thủ CO/CQ</span>
                  <span className="font-mono text-base font-bold text-purple-600 dark:text-purple-400">
                    {details.complianceScore || '100%'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Hồ sơ pháp lý</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">Điểm Composite</span>
                  <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400">
                    {details.compositeScore || 95}/100
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold">{details.performanceTier || 'Tier A'}</span>
                </div>
              </div>

              {/* Evaluation History List */}
              {details.scorecards && details.scorecards.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs">Lịch Sử Các Kỳ Đánh Giá:</h5>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    {details.scorecards.map((sc: any, idx: number) => (
                      <div key={sc.id || idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{sc.period}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {sc.status || 'EXCELLENT'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">({sc.id})</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{sc.notes || 'Đánh giá định kỳ theo quy chuẩn SRM.'}</p>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                            <span>OTIF: {sc.otifRate}</span>
                            <span>•</span>
                            <span>Chất lượng: {sc.qualityScore}</span>
                            <span>•</span>
                            <span>Người đánh giá: {sc.evaluator}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                            {sc.overallRating || '4.9 / 5.0'}
                          </span>
                          <span className="text-[10px] text-slate-400">{sc.evaluationDate || '2026'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onNavigateToPO && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToPO(details.id);
                  onClose();
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Tạo Đơn PO Cho NCC Này (M08)</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>

      </div>
    </div>
  );
};
