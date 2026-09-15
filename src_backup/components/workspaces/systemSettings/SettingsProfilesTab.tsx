import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  Check,
  Lock,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { EnvironmentProfile, ModuleDefinition } from '../../../types';

interface SettingsProfilesTabProps {
  profiles: EnvironmentProfile[];
  currentProfile: string;
  onRequestProfileSelect: (profileId: string) => void;
  moduleRegistry: ModuleDefinition[];
}

const DOMAIN_GROUPS = [
  '01. Thương Mại & Bán Hàng (Commercial & Sales)',
  '02. Kho Vận & Vận Hành (Inventory & Logistics)',
  '03. Mua Sắm & Chuỗi Cung Ứng (Procurement & SCM)',
  '04. Sản Xuất & Kỹ Thuật (Manufacturing & Engineering)',
  '05. Tài Chính & Kế Toán (Finance & Accounting)',
  '06. Quản Trị & Hệ Thống (Governance & System)',
];

export const SettingsProfilesTab: React.FC<SettingsProfilesTabProps> = ({
  profiles,
  currentProfile,
  onRequestProfileSelect,
  moduleRegistry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const activeProf = profiles.find((p) => p.id === currentProfile);
  const isAll = activeProf?.allowedModules.includes('*') ?? false;
  const activeCount = isAll ? moduleRegistry.length : (activeProf?.allowedModules.length ?? 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Active Profile Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900 border border-purple-800/40 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40">
              HỒ SƠ MÔI TRƯỜNG KÍCH HOẠT
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Đang hoạt động toàn hệ thống
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-purple-400 shrink-0" />
            <span>{activeProf?.name}</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            {activeProf?.description}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 shrink-0">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Phạm Vi Phân Hệ</div>
            <div className="text-lg font-mono font-bold text-purple-300 tabular-nums">
              {activeCount} / {moduleRegistry.length}
              <span className="text-xs font-normal text-slate-300 ml-1">phân hệ</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Mã Hồ Sơ</div>
            <div className="text-sm font-mono font-bold text-white">{currentProfile}</div>
          </div>
        </div>
      </div>

      {/* Profile Switcher Cards Grid */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Chọn Mô Hình Môi Trường Vận Hành ({profiles.length} hồ sơ mẫu)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tự động bật hoặc giới hạn menu phân hệ, điều hướng luồng chứng từ phù hợp với đặc thù kinh doanh
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {profiles.map((p) => {
            const isSelected = p.id === currentProfile;
            const isProfAll = p.allowedModules.includes('*');
            const count = isProfAll ? moduleRegistry.length : p.allowedModules.length;
            return (
              <div
                key={p.id}
                onClick={() => onRequestProfileSelect(p.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-500 dark:border-purple-400 shadow-md ring-2 ring-purple-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-2xs">
                    <Check className="w-3 h-3" />
                    <span>ĐANG KÍCH HOẠT</span>
                  </div>
                )}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-950 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700">
                      {p.id}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 tabular-nums">
                      {count} phân hệ
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 line-clamp-3">
                      {p.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestProfileSelect(p.id);
                  }}
                  className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Hồ Sơ Hiện Hành</span>
                    </>
                  ) : (
                    <span>Kích Hoạt Hồ Sơ Này</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Registry Matrix for Current Profile */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Ma Trận Phân Hệ ERP Hoạt Động Theo Hồ Sơ [{currentProfile}]
            </h4>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Lọc phân hệ..."
                className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Màu xanh: <span className="text-emerald-950 dark:text-emerald-200 font-bold">Kích hoạt</span> • Màu xám: <span className="text-slate-500 dark:text-slate-400 font-medium">Tạm khóa</span>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOMAIN_GROUPS.map((groupName) => {
            const rawModules = moduleRegistry.filter(
              (m) => m.group === groupName || m.group.includes(groupName.split(' (')[0])
            );
            const groupModules = rawModules.filter(
              (m) =>
                m.moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.moduleId.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const activeInGroup = rawModules.filter(
              (m) => isAll || (activeProf?.allowedModules.includes(m.moduleId) ?? false)
            ).length;

            return (
              <div key={groupName} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-semibold text-xs text-slate-900 dark:text-white pb-1.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="truncate">{groupName.split(' (')[0]}</span>
                  <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-700 shrink-0 font-bold tabular-nums">
                    {activeInGroup}/{rawModules.length}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {groupModules.map((mod) => {
                    const isModActive = isAll || (activeProf?.allowedModules.includes(mod.moduleId) ?? false);
                    return (
                      <div
                        key={mod.moduleId}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between gap-2 border ${
                          isModActive
                            ? 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200'
                            : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isModActive
                                ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {mod.moduleId}
                          </span>
                          <span className="truncate text-[11px] font-medium">{mod.moduleName}</span>
                        </div>
                        {isModActive ? (
                          <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 shrink-0 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            <span>Bật</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 shrink-0 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Khóa</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {groupModules.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-xs italic">
                      Không tìm thấy phân hệ
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
