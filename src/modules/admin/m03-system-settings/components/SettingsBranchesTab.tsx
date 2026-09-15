import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Check,
  Database,
  HardDrive,
  ShieldCheck,
  Search,
  Eye,
  Layers,
} from 'lucide-react';
import { BranchMetadata } from './types';
import { SelectedEntityContext } from '../../../../types';

interface BranchItem {
  id: string;
  name: string;
  code: string;
  isDefault?: boolean;
}

interface SettingsBranchesTabProps {
  branches: BranchItem[];
  branchMetadata: Record<string, BranchMetadata>;
  currentBranch: string;
  onRequestBranchSelect: (branchId: string) => void;
  onInspectBranch: (branch: { id: string; name: string; code: string; isDefault?: boolean; meta: BranchMetadata }) => void;
  onSelectEntity: (entity: SelectedEntityContext) => void;
}

export const SettingsBranchesTab: React.FC<SettingsBranchesTabProps> = ({
  branches,
  branchMetadata,
  currentBranch,
  onRequestBranchSelect,
  onInspectBranch,
  onSelectEntity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const activeBranchObj = branches.find((b) => b.id === currentBranch);
  const activeMeta = branchMetadata[currentBranch];

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (branchMetadata[b.id]?.address ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Active Branch Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 border border-blue-800/40 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40">
              CHI NHÁNH LÀM VIỆC HIỆN HÀNH
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Đang đồng bộ trực tiếp
            </span>
            {activeBranchObj?.isDefault && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                Trụ sở chính mặc định
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-400 shrink-0" />
            <span>
              [{activeBranchObj?.code}] {activeBranchObj?.name}
            </span>
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{activeMeta?.address ?? 'Địa chỉ đăng ký doanh nghiệp'}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-xl border border-white/10 shrink-0">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Mã Số Thuế</div>
            <div className="text-xs font-mono font-bold text-white tabular-nums">{activeMeta?.taxCode}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tiền Tố Chứng Từ</div>
            <div className="text-xs font-mono font-bold text-blue-300">{activeMeta?.prefix}XXXX</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Kho Trực Thuộc</div>
            <div className="text-xs font-mono font-bold text-amber-300 tabular-nums">
              {activeMeta?.warehouses.length ?? 0} kho bãi
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Nhân Sự</div>
            <div className="text-xs font-mono font-bold text-emerald-300 tabular-nums">
              {activeMeta?.staffCount ?? 0} nhân sự
            </div>
          </div>
        </div>
      </div>

      {/* Branch Switcher Grid Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Danh sách Đơn Vị / Chi Nhánh Doanh Nghiệp ({branches.length} đơn vị)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bấm để chuyển đổi tức thì không gian làm việc, chứng từ phát sinh và số dư sổ cái theo chi nhánh
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm chi nhánh, mã, địa chỉ..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBranches.map((b) => {
            const isSelected = b.id === currentBranch;
            const meta = branchMetadata[b.id];
            return (
              <div
                key={b.id}
                onClick={() => onRequestBranchSelect(b.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-2xs">
                    <Check className="w-3 h-3" />
                    <span>ĐANG HOẠT ĐỘNG</span>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700">
                      {b.code}
                    </span>
                    {b.isDefault && !isSelected && (
                      <span className="text-[10px] text-amber-950 dark:text-amber-200 font-semibold bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                        Trụ sở chính
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{b.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{meta?.type}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Khu vực:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{meta?.region}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Sổ cái:</span>
                      <span className="font-mono text-[10px] text-blue-700 dark:text-blue-400 font-semibold">
                        {meta?.ledger.split(' (')[1]?.replace(')', '') ?? 'GL-INDEP'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestBranchSelect(b.id);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Hiện Hành</span>
                      </>
                    ) : (
                      <span>Chuyển Sang Chi Nhánh Này</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectBranch({ ...b, meta });
                      onSelectEntity({
                        type: 'M03_BRANCH',
                        id: b.id,
                        code: b.code,
                        title: b.name,
                        status: isSelected ? 'ACTIVE' : 'READY',
                        data: { ...b, meta },
                      });
                    }}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                    title="Xem chi tiết đơn vị chi nhánh"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Branch Overview Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Bảng Quản Trị Danh Mục Chi Nhánh & Thông Số Vận Hành
            </h4>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Đồng bộ mô hình Multi-Branch ERP (4 Chi nhánh)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Mã</th>
                <th className="p-3">Tên Đơn Vị / Chi Nhánh</th>
                <th className="p-3">Địa Chỉ Đăng Ký</th>
                <th className="p-3">Kho Trực Thuộc</th>
                <th className="p-3">Sổ Cái & Tiền Tố</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {filteredBranches.map((b) => {
                const isSelected = b.id === currentBranch;
                const meta = branchMetadata[b.id];
                return (
                  <tr
                    key={b.id}
                    onClick={() => {
                      onInspectBranch({ ...b, meta });
                      onSelectEntity({
                        type: 'M03_BRANCH',
                        id: b.id,
                        code: b.code,
                        title: b.name,
                        status: isSelected ? 'ACTIVE' : 'READY',
                        data: { ...b, meta },
                      });
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-l-4 border-blue-600'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">{b.code}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{b.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{meta?.type}</div>
                    </td>
                    <td className="p-3 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-300" title={meta?.address}>
                      {meta?.address}
                    </td>
                    <td className="p-3">
                      <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">{meta?.warehouses[0]}</div>
                      {meta && meta.warehouses.length > 1 && (
                        <div className="text-[10px] text-slate-400">+{meta.warehouses.length - 1} kho bãi khác</div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      <span className="text-blue-700 dark:text-blue-400 font-bold">{meta?.prefix}</span>
                      <span className="text-slate-500 dark:text-slate-400"> ({meta?.region})</span>
                    </td>
                    <td className="p-3">
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700">
                          Đang kích hoạt
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
                          Sẵn sàng
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectBranch({ ...b, meta });
                          }}
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isSelected ? (
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1 font-mono">
                            <Check className="w-3.5 h-3.5" />
                            <span>Hiện hành</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestBranchSelect(b.id);
                            }}
                            className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 hover:text-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            Kích hoạt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Governance & Isolation Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>1. Phân Lập Sổ Sách Kế Toán (GL)</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Mỗi chi nhánh sở hữu tập hợp số liệu kế toán độc lập, tự động tổng hợp lên báo cáo tài chính hợp nhất tập đoàn theo chuẩn VAS/IFRS.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
            <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>2. Độc Lập Số Dư 3 Trạng Thái Kho</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Số dư khả dụng (Available), giữ chỗ (Reserved) và đang trung chuyển (In-transit) được tính toán riêng biệt cho từng kho trực thuộc chi nhánh.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>3. Giám Sát Phân Quyền Vận Hành</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Người dùng chỉ được tạo đơn hàng, phê duyệt xuất nhập kho và ghi sổ hóa đơn trong phạm vi chi nhánh được phân quyền trực tiếp.
          </p>
        </div>
      </div>
    </div>
  );
};
