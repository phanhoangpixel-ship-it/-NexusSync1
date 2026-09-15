import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Clock,
  Search,
  Trash2,
  Printer,
  Download,
  Sparkles,
  Edit2,
  Save,
  FileText,
  Layout,
  PieChart,
  FolderPlus,
  Check,
  Plus,
  Heart
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { ModuleDefinition, MODULE_REGISTRY } from '../../config/moduleRegistry';
import { FavoriteItem, RecentVisitItem } from '../../types/recentFavorites';

interface RecentFavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recents: RecentVisitItem[];
  favorites: FavoriteItem[];
  onToggleFavorite: (module: ModuleDefinition) => void;
  onUpdateFavoriteNote: (moduleId: string, note: string) => void;
  onUpdateFavoriteGroup: (moduleId: string, group: string) => void;
  onClearRecents: () => void;
  onClearFavorites: () => void;
  onNavigate: (module: ModuleDefinition) => void;
  onTriggerSeedSimulation: () => void;
}

export const RecentFavoritesDrawer: React.FC<RecentFavoritesDrawerProps> = ({
  isOpen,
  onClose,
  recents,
  favorites,
  onToggleFavorite,
  onUpdateFavoriteNote,
  onUpdateFavoriteGroup,
  onClearRecents,
  onClearFavorites,
  onNavigate,
  onTriggerSeedSimulation,
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'recents'>('favorites');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [tempGroup, setTempGroup] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter lists based on search
  const filteredFavorites = favorites.filter(item =>
    item.moduleName.toLowerCase().includes(search.toLowerCase()) ||
    item.moduleId.toLowerCase().includes(search.toLowerCase()) ||
    (item.note && item.note.toLowerCase().includes(search.toLowerCase())) ||
    (item.customGroup && item.customGroup.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredRecents = recents.filter(item =>
    item.moduleName.toLowerCase().includes(search.toLowerCase()) ||
    item.moduleId.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartEditing = (item: FavoriteItem) => {
    setEditingId(item.moduleId);
    setTempNote(item.note || '');
    setTempGroup(item.customGroup || 'Thường xuyên');
  };

  const handleSaveEdit = (moduleId: string) => {
    onUpdateFavoriteNote(moduleId, tempNote);
    onUpdateFavoriteGroup(moduleId, tempGroup);
    setEditingId(null);
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Báo cáo Tiện ích Cá nhân - NexusSync ERP</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
            h1 { font-size: 22px; color: #0f172a; margin-bottom: 5px; }
            p { font-size: 12px; color: #64748b; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
            td { padding: 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            .badge { background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .note { color: #64748b; font-style: italic; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>Báo cáo Lối tắt Ưu tiên & Nhật ký Vận hành Cá nhân</h1>
          <p>Thời gian xuất báo cáo: ${new Date().toLocaleString('vi-VN')} | Tổng số mục lưu: ${favorites.length}</p>
          
          <h2>★ DANH SÁCH LỐI TẮT YÊU THÍCH (FAVORITES)</h2>
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên Phân Hệ</th>
                <th>Nhóm Tự Chọn</th>
                <th>Ghi chú / Mô tả nghiệp vụ</th>
                <th>Ngày ghim</th>
              </tr>
            </thead>
            <tbody>
              ${favorites.length === 0 ? '<tr><td colspan="5" style="text-align:center;">Trống</td></tr>' : favorites.map(f => `
                <tr>
                  <td><b>${f.moduleId}</b></td>
                  <td>${f.moduleName}</td>
                  <td><span class="badge">${f.customGroup || 'Thường xuyên'}</span></td>
                  <td><span class="note">${f.note || '---'}</span></td>
                  <td>${new Date(f.timestamp).toLocaleDateString('vi-VN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2 style="margin-top: 40px;">🕒 LỊCH SỬ TRUY CẬP GẦN ĐÂY (RECENTS)</h2>
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên Phân Hệ</th>
                <th>Lượt click</th>
                <th>Truy cập cuối</th>
              </tr>
            </thead>
            <tbody>
              ${recents.length === 0 ? '<tr><td colspan="4" style="text-align:center;">Trống</td></tr>' : recents.map(r => `
                <tr>
                  <td><b>${r.moduleId}</b></td>
                  <td>${r.moduleName}</td>
                  <td>${r.clickCount} lượt</td>
                  <td>${new Date(r.timestamp).toLocaleTimeString('vi-VN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportCSV = () => {
    let csvContent = 'ID,Name,Type,Group,Note,Timestamp\n';
    favorites.forEach(f => {
      csvContent += `"${f.moduleId}","${f.moduleName}","FAVORITE","${f.customGroup || ''}","${(f.note || '').replace(/"/g, '""')}","${f.timestamp}"\n`;
    });
    recents.forEach(r => {
      csvContent += `"${r.moduleId}","${r.moduleName}","RECENT","","Lượt click: ${r.clickCount}","${r.timestamp}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NexusSync_Recent_Favorites_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  const getDynamicIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) return <IconComponent className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in cursor-pointer select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left border-l border-slate-200 cursor-default select-text"
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <div>
              <h3 className="text-sm font-bold">Recent & Favorites Manager</h3>
              <p className="text-[10px] text-slate-400">Trình tối ưu hóa và cá nhân hóa lối tắt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'favorites'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Đã Lưu Yêu Thích ({favorites.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('recents')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'recents'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Truy Cập Gần Đây ({recents.length})</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={activeTab === 'favorites' ? onClearFavorites : onClearRecents}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa sạch {activeTab === 'favorites' ? 'Yêu thích' : 'Lịch sử'}</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrint}
              title="Xuất báo cáo PDF"
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleExportCSV}
              title="Tải tệp CSV"
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên phân hệ, mã hoặc ghi chú..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {activeTab === 'favorites' ? (
            filteredFavorites.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {search ? 'Không tìm thấy lối tắt yêu thích nào.' : 'Chưa ghim lối tắt nào. Hãy bấm biểu tượng ngôi sao bên cạnh tên các phân hệ để ghim.'}
              </div>
            ) : (
              filteredFavorites.map((item) => (
                <div key={item.moduleId} className="p-4 hover:bg-slate-50/60 transition-all group">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-150 flex items-center justify-center shrink-0">
                      {getDynamicIcon(item.iconName)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.moduleId}
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {item.customGroup || 'Thường xuyên'}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => {
                            const mod = MODULE_REGISTRY.find(m => m.moduleId === item.moduleId);
                            if (mod) onToggleFavorite(mod);
                          }}
                          className="text-amber-500 hover:text-slate-300 p-1 rounded transition-colors"
                          title="Hủy ghim yêu thích"
                        >
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        </button>
                      </div>

                      <h4
                        onClick={() => {
                          const mod = MODULE_REGISTRY.find(m => m.moduleId === item.moduleId);
                          if (mod) {
                            onNavigate(mod);
                            onClose();
                          }
                        }}
                        className="text-xs font-bold text-slate-900 mt-1 cursor-pointer hover:text-blue-600 transition-colors leading-snug hover:underline"
                      >
                        {item.moduleName}
                      </h4>

                      {/* Editing View */}
                      {editingId === item.moduleId ? (
                        <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase">Nhóm phân loại</label>
                            <select
                              value={tempGroup}
                              onChange={(e) => setTempGroup(e.target.value)}
                              className="w-full mt-0.5 p-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="Hàng ngày">Hàng ngày (Daily)</option>
                              <option value="Thường xuyên">Thường xuyên (Frequent)</option>
                              <option value="Cuối tháng">Cuối tháng (Closing)</option>
                              <option value="Quản trị">Quản trị (Admin)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase">Ghi chú cá nhân</label>
                            <input
                              type="text"
                              value={tempNote}
                              onChange={(e) => setTempNote(e.target.value)}
                              placeholder="Nhập ghi chú hoặc nhắc nhở..."
                              className="w-full mt-0.5 p-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-0.5 text-[9px] font-bold bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveEdit(item.moduleId)}
                              className="px-2 py-0.5 text-[9px] font-bold bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center gap-1"
                            >
                              <Save className="w-2.5 h-2.5" />
                              <span>Lưu</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-start justify-between gap-2">
                          <p className="text-[11px] text-slate-500 italic">
                            {item.note ? `“${item.note}”` : 'Chưa có ghi chú.'}
                          </p>
                          <button
                            onClick={() => handleStartEditing(item)}
                            className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                            title="Chỉnh sửa ghi chú / phân nhóm"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="mt-2 text-[9px] text-slate-400">
                        Đã ghim: {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            filteredRecents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {search ? 'Không tìm thấy lịch sử truy cập.' : 'Lịch sử trống. Hãy di chuyển qua lại giữa các phân hệ để ghi lại lịch sử.'}
              </div>
            ) : (
              filteredRecents.map((item) => (
                <div key={item.moduleId} className="p-4 hover:bg-slate-50/60 transition-all flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-150 flex items-center justify-center shrink-0">
                    {getDynamicIcon(item.iconName)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.moduleId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.clickCount} lượt truy cập
                      </span>
                    </div>

                    <h4
                      onClick={() => {
                        const mod = MODULE_REGISTRY.find(m => m.moduleId === item.moduleId);
                        if (mod) {
                          onNavigate(mod);
                          onClose();
                        }
                      }}
                      className="text-xs font-bold text-slate-900 mt-1 cursor-pointer hover:text-blue-600 hover:underline leading-snug"
                    >
                      {item.moduleName}
                    </h4>

                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Lần cuối: {new Date(item.timestamp).toLocaleTimeString('vi-VN')} ({new Date(item.timestamp).toLocaleDateString('vi-VN')})
                    </p>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer info and close */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 text-center">
          Nhấn vào tên phân hệ để chuyển hướng nhanh chóng.
        </div>

      </div>
    </div>
  );
};
