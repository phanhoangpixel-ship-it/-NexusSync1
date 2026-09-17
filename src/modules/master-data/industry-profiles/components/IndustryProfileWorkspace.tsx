import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, Plus, Search, Edit3, Trash2, ShieldCheck, 
  Layers, CheckCircle2, AlertCircle, RefreshCw, Globe, Coins, FileText, Check
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

interface IndustryProfile {
  id: number;
  code: string;
  name: string;
  sector: string;
  description: string;
  primaryCurrency: string;
  valuationMethod: string;
  complianceStandards: string;
  defaultTaxRate: number;
  isActive: boolean;
  createdAt?: string;
}

export function IndustryProfileWorkspace() {
  const [profiles, setProfiles] = useState<IndustryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  
  // Modal states
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT' | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<IndustryProfile | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    sector: 'Manufacturing',
    description: '',
    primaryCurrency: 'VND',
    valuationMethod: 'FIFO',
    complianceStandards: '',
    defaultTaxRate: 10,
    isActive: true
  });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Notification toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('nexus_jwt') || '';
    try {
      const res = await fetch('/api/industry-profiles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setProfiles(data);
      } else if (data.success && Array.isArray(data.data)) {
        setProfiles(data.data);
      }
    } catch (err) {
      console.error('Error fetching industry profiles:', err);
      showToast('error', 'Lỗi tải dữ liệu', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleOpenCreate = () => {
    setFormData({
      code: '',
      name: '',
      sector: 'Manufacturing',
      description: '',
      primaryCurrency: 'VND',
      valuationMethod: 'FIFO',
      complianceStandards: '',
      defaultTaxRate: 10,
      isActive: true
    });
    setModalMode('CREATE');
  };

  const handleOpenEdit = (profile: IndustryProfile) => {
    setSelectedProfile(profile);
    setFormData({
      code: profile.code,
      name: profile.name,
      sector: profile.sector,
      description: profile.description || '',
      primaryCurrency: profile.primaryCurrency || 'VND',
      valuationMethod: profile.valuationMethod || 'FIFO',
      complianceStandards: profile.complianceStandards || '',
      defaultTaxRate: profile.defaultTaxRate ?? 10,
      isActive: profile.isActive ?? true
    });
    setModalMode('EDIT');
  };

  const removeVietnameseTones = (str: string) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const suggestCodeFromName = (nameStr: string) => {
    if (!nameStr) return '';
    const clean = removeVietnameseTones(nameStr)
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map(w => w.substring(0, 4))
      .join('-');
    return clean || 'IND';
  };

  const suggestedCode = suggestCodeFromName(formData.name);

  const isDuplicateCode = profiles.some(p => 
    p.code.toUpperCase() === formData.code.trim().toUpperCase() && 
    (modalMode === 'CREATE' || p.id !== selectedProfile?.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.sector) {
      showToast('error', 'Thiếu thông tin', 'Vui lòng điền đầy đủ Mã, Tên và Lĩnh vực ngành nghề.');
      return;
    }

    if (isDuplicateCode) {
      showToast('error', 'Trùng lặp mã prefix', `Mã định danh "${formData.code}" đã tồn tại trong hệ thống. Vui lòng chọn mã khác.`);
      return;
    }

    const token = localStorage.getItem('nexus_jwt') || '';
    const url = modalMode === 'EDIT' && selectedProfile 
      ? `/api/industry-profiles/${selectedProfile.id}`
      : '/api/industry-profiles';
    const method = modalMode === 'EDIT' ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && (data.success || data.profile)) {
        showToast('success', 'Thành công', modalMode === 'EDIT' ? 'Đã cập nhật hồ sơ ngành hàng.' : 'Đã tạo hồ sơ ngành hàng mới.');
        setModalMode(null);
        fetchProfiles();
      } else {
        showToast('error', 'Thất bại', data.error || 'Có lỗi xảy ra khi lưu hồ sơ.');
      }
    } catch (err) {
      console.error('Error saving industry profile:', err);
      showToast('error', 'Lỗi kết nối', 'Không thể gửi yêu cầu đến máy chủ.');
    }
  };

  const handleDelete = (profile: IndustryProfile) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa Hồ sơ ngành hàng',
      message: `Bạn có chắc chắn muốn xóa hồ sơ "${profile.name}" (${profile.code})? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        const token = localStorage.getItem('nexus_jwt') || '';
        try {
          const res = await fetch(`/api/industry-profiles/${profile.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showToast('success', 'Đã xóa', 'Hồ sơ ngành hàng đã được xóa thành công.');
            fetchProfiles();
          } else {
            showToast('error', 'Không thể xóa', data.error || 'Có lỗi xảy ra.');
          }
        } catch (err) {
          showToast('error', 'Lỗi hệ thống', 'Không thể kết nối đến máy chủ.');
        }
      }
    });
  };

  const filteredProfiles = profiles.filter(p => {
    const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchSector = sectorFilter === 'ALL' || p.sector === sectorFilter;
    return matchQuery && matchSector;
  });

  const sectorsList = Array.from(new Set(profiles.map(p => p.sector)));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 transition-all animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <div>
            <div className="font-bold text-xs uppercase tracking-wide">{toast.title}</div>
            <div className="text-xs">{toast.message}</div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 font-mono text-xs font-bold rounded-md">
              MODULE M-IND / HỒ SƠ NGÀNH HÀNG
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Enterprise Standard</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Quản Lý Hồ Sơ Ngành Hàng (Industry Profiles)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thiết lập các tiêu chuẩn vận hành, phương pháp tính giá tồn kho (FIFO/LIFO/Average), tiền tệ và tiêu chuẩn tuân thủ theo từng lĩnh vực kinh doanh.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProfiles}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo Hồ Sơ Mới
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, tên hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Lĩnh vực:</span>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả lĩnh vực ({profiles.length})</option>
            {sectorsList.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-sm text-slate-500">Đang tải danh sách hồ sơ ngành hàng...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <Layers className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Không tìm thấy hồ sơ ngành hàng nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Thử thay đổi từ khóa tìm kiếm hoặc bấm "Tạo Hồ Sơ Mới" để bắt đầu thiết lập thông số cho ngành hàng của bạn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800 font-mono text-xs font-bold rounded-md">
                    {p.code}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    p.isActive 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {p.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{p.name}</h3>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{p.sector}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">{p.description || 'Không có mô tả chi tiết.'}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Định giá kho</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">{p.valuationMethod}</strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Tiền tệ / Thuế</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">{p.primaryCurrency} ({p.defaultTaxRate}%)</strong>
                  </div>
                </div>

                {p.complianceStandards && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">Tiêu chuẩn: {p.complianceStandards}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create / Edit */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-scale-up">
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                {modalMode === 'CREATE' ? 'Thêm Mới Hồ Sơ Ngành Hàng' : 'Chỉnh Sửa Hồ Sơ Ngành Hàng'}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Tên Hồ Sơ / Ngành Hàng *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Điện tử & Viễn thông"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Mã Định Danh / Prefix *</label>
                    {formData.name && modalMode === 'CREATE' && !formData.code && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, code: suggestedCode })}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold underline cursor-pointer"
                      >
                        💡 Gợi ý: {suggestedCode}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className={`w-full px-3 py-2 text-sm font-mono uppercase bg-slate-50 dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 ${
                      isDuplicateCode 
                        ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/50 dark:bg-rose-950/20' 
                        : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    placeholder="VD: TELECOM"
                  />
                  {isDuplicateCode && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Mã prefix "{formData.code}" đã tồn tại trong hệ thống! Vui lòng chọn mã khác.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Khối Lĩnh Vực (Sector) *</label>
                  <input
                    type="text"
                    required
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Technology, Manufacturing..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Phương Pháp Tính Giá Tồn Kho</label>
                  <select
                    value={formData.valuationMethod}
                    onChange={(e) => setFormData({ ...formData, valuationMethod: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FIFO">FIFO (Nhập trước, xuất trước)</option>
                    <option value="LIFO">LIFO (Nhập sau, xuất trước)</option>
                    <option value="WEIGHTED_AVERAGE">WEIGHTED AVERAGE (Bình quân gia quyền)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Tiền Tệ Mặc Định</label>
                  <input
                    type="text"
                    value={formData.primaryCurrency}
                    onChange={(e) => setFormData({ ...formData, primaryCurrency: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="VND, USD..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Thuế Suất Mặc Định (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.defaultTaxRate}
                    onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Tiêu chuẩn tuân thủ (Compliance Standards)</label>
                <input
                  type="text"
                  value={formData.complianceStandards}
                  onChange={(e) => setFormData({ ...formData, complianceStandards: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: ISO 9001, GMP, FDA, CE"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Mô Tả Chi Tiết</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả các đặc thù vận hành, quy trình nghiệp vụ của ngành hàng này..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kích hoạt trạng thái hoạt động ngay
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors"
                >
                  {modalMode === 'CREATE' ? 'Tạo Hồ Sơ' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
