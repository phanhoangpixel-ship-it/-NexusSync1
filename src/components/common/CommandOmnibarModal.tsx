import React, { useState, useEffect, useRef } from 'react';
import { MODULE_REGISTRY } from '../../config/moduleRegistry';
import { Search, ArrowRight, Layers, FileText, Package, X, Command } from 'lucide-react';

interface CommandOmnibarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string, item?: any) => void;
  allowedModules?: string[];
}

export const CommandOmnibarModal: React.FC<CommandOmnibarModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  allowedModules,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const isModuleAllowed = (moduleId: string) => {
    if (!allowedModules) return true;
    if (allowedModules.includes('*')) return true;
    return allowedModules.includes(moduleId);
  };

  const filteredModules = MODULE_REGISTRY.filter(
    (m) =>
      isModuleAllowed(m.moduleId) &&
      (m.moduleName.toLowerCase().includes(query.toLowerCase()) ||
        m.code.toLowerCase().includes(query.toLowerCase()) ||
        m.domain.toLowerCase().includes(query.toLowerCase()) ||
        m.route.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 8);

  const sampleDocuments = [
    { code: 'ADJ-2026-0001', title: 'Phiếu kiểm kê chênh lệch Linh kiện Kho Tổng', route: '/stock-adjustment', type: 'Điều chỉnh kho', moduleId: 'M20' },
    { code: 'PO-2026-001', title: 'Đơn mua hàng Silicon Wafer NCC Bán Dẫn', route: '/purchase', type: 'Đơn mua hàng', moduleId: 'M08' },
    { code: 'PO-2026-002', title: 'Đơn mua hàng Biopolymer PLA Resin NCC Hóa Chất Xanh', route: '/purchase', type: 'Đơn mua hàng', moduleId: 'M08' },
    { code: 'PO-2026-003', title: 'Đơn mua hàng Cảm biến Laser 3D NCC Quang Học', route: '/purchase', type: 'Đơn mua hàng', moduleId: 'M08' },
    { code: 'PO-2026-0891', title: 'Đơn mua hàng Dell XPS 15 nhà cung cấp FPT', route: '/purchase', type: 'Đơn mua hàng', moduleId: 'M08' },
    { code: 'MC-2026-001', title: 'Hồ sơ đối chiếu 3 bên Silicon Wafer (3-Way Matching)', route: '/purchase', type: 'Đối chiếu 3 bên', moduleId: 'M08' },
    { code: 'CON-2026-001', title: 'Hợp đồng nguyên tắc cung ứng Silicon Wafer', route: '/purchase', type: 'Hợp đồng mua hàng', moduleId: 'M08' },
    { code: 'SO-2026-0412', title: 'Đơn bán hàng B2B Công ty Cổ phần Vingroup', route: '/sales', type: 'Đơn bán hàng', moduleId: 'M13' },
    { code: 'STK-2026-0002', title: 'Phiếu kiểm kê đếm mù Zone A & Zone B', route: '/stocktake', type: 'Kiểm kê định kỳ', moduleId: 'M19' },
    { code: 'SKU-LAPTOP-01', title: 'Laptop Dell XPS 15 Core i9 32GB RAM', route: '/inventory', type: 'Sản phẩm', moduleId: 'M17' },
  ].filter(
    (d) =>
      d.code.toLowerCase().includes(query.toLowerCase()) ||
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.type.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [
    ...filteredModules.map((m) => ({
      id: m.moduleId,
      title: m.moduleName,
      subtitle: `${m.code} • ${m.domain}`,
      route: m.route,
      moduleId: m.moduleId,
      icon: Layers,
      tag: 'Phân hệ',
      documentItem: undefined,
    })),
    ...sampleDocuments.map((d) => ({
      id: d.code,
      title: d.title,
      subtitle: `${d.code} • ${d.type}`,
      route: d.route,
      moduleId: d.moduleId,
      icon: d.type === 'Sản phẩm' ? Package : FileText,
      tag: d.type,
      documentItem: {
        entity: d.type === 'Sản phẩm' ? 'PRODUCT' : 'DOCUMENT',
        entityId: d.code,
        title: d.title,
        businessReference: d.code,
        sourceModule: d.moduleId || 'M08',
      },
    })),
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          onNavigate(allItems[selectedIndex].route, allItems[selectedIndex].documentItem);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="command-omnibar-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm transition-all cursor-pointer select-none"
    >
      <div
        id="command-omnibar-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150 cursor-default select-text"
      >
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm phân hệ M01-M43, chứng từ PO/SO/ADJ, mã SKU sản phẩm..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full py-4 px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer mr-1"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-0.5 rounded ml-2 transition-colors cursor-pointer"
            title="Đóng tìm kiếm (ESC hoặc nhấp ra ngoài)"
          >
            <span>ESC</span>
            <X className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        <div className="overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/80 flex-1">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Không tìm thấy kết quả phù hợp với từ khóa "{query}"
            </div>
          ) : (
            allItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id + index}
                  onClick={() => {
                    onNavigate(item.route, item.documentItem);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            isSelected
                              ? 'bg-blue-200/60 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-blue-600 dark:text-blue-400 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Di chuyển</span>
            <span>↵ Chọn</span>
            <button
              type="button"
              onClick={onClose}
              className="hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer transition-colors"
              title="Đóng cửa sổ tìm kiếm"
            >
              ESC Đóng
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <Command className="w-3.5 h-3.5" />
            <span>Nexus Omnibar v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
