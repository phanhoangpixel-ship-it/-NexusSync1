import React, { useState, useMemo } from 'react';
import { RbacPermission, SuperAdminDetailItem } from './types';
import {
  Key,
  Search,
  Layers,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Code
} from 'lucide-react';

interface RbacPermissionsTabProps {
  permissions: RbacPermission[];
  onSelectPermission: (perm: RbacPermission) => void;
  onViewDetail: (item: SuperAdminDetailItem) => void;
}

export const RbacPermissionsTab: React.FC<RbacPermissionsTabProps> = ({
  permissions,
  onSelectPermission,
  onViewDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.moduleId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchRisk = riskFilter === 'ALL' || p.riskLevel === riskFilter;
      return matchSearch && matchCategory && matchRisk;
    });
  }, [permissions, searchTerm, categoryFilter, riskFilter]);

  return (
    <div className="space-y-6">
      {/* TẦNG L1: FILTER & COMMAND BAR (M41 SPEC) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm đặc quyền theo mã, tên, phân hệ (M01-M42) hoặc API endpoint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Mọi Mức Độ Rủi Ro</option>
              <option value="CRITICAL">Chỉ CRITICAL (Tối mật)</option>
              <option value="HIGH">Chỉ HIGH (Cao)</option>
              <option value="MEDIUM">Chỉ MEDIUM (Trung bình)</option>
              <option value="STANDARD">Chỉ STANDARD (Tiêu chuẩn)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 dark:border-slate-700 pt-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nhóm nghiệp vụ:</span>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'CORE', label: 'Hệ Thống Lõi (Core)' },
            { key: 'FINANCE', label: 'Tài Chính & Kế Toán' },
            { key: 'SUPPLY_CHAIN', label: 'Kho Vận & Chuỗi Cung Ứng' },
            { key: 'MANUFACTURING', label: 'Sản Xuất & Chế Tạo' },
            { key: 'SALES', label: 'Bán Hàng & Phân Phối' },
            { key: 'GOVERNANCE', label: 'Kiểm Toán & Giám Sát' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === cat.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* TẦNG L3: PERMISSIONS DATA TABLE (M41 SPEC) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Danh Mục Đặc Quyền Hạt Nhân ({filteredPermissions.length} / {permissions.length})
            </h3>
          </div>
          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
            Bảo vệ 42 Phân hệ ERP
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-4">Mã Quyền & Phân Hệ</th>
                <th className="py-3 px-3">Tên Đặc Quyền</th>
                <th className="py-3 px-3">API Gateway Endpoint</th>
                <th className="py-3 px-3">Mức Độ Rủi Ro</th>
                <th className="py-3 px-3">Vai Trò Gán</th>
                <th className="py-3 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {filteredPermissions.map((perm) => {
                return (
                  <tr
                    key={perm.id}
                    onClick={() => onSelectPermission(perm)}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {perm.moduleId}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                          {perm.code}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">{perm.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 line-clamp-1">
                          {perm.description}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-bold text-[10px]">
                          {perm.action}
                        </span>
                        <span className="truncate max-w-[200px]" title={perm.endpoint}>
                          {perm.endpoint}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {perm.riskLevel === 'CRITICAL' && (
                        <span className="px-2.5 py-0.5 bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 text-xs font-bold rounded-full border">
                          CRITICAL (TỐI MẬT)
                        </span>
                      )}
                      {perm.riskLevel === 'HIGH' && (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-950 dark:bg-amber-950/90 dark:text-amber-200 rounded text-xs font-bold border border-amber-300 dark:border-amber-700">
                          HIGH (CAO)
                        </span>
                      )}
                      {perm.riskLevel === 'MEDIUM' && (
                        <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded font-semibold text-[11px] border border-blue-200 dark:border-blue-800">
                          MEDIUM
                        </span>
                      )}
                      {perm.riskLevel === 'STANDARD' && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-mono text-[11px] border border-slate-200 dark:border-slate-600">
                          STANDARD
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[11px]">
                        {perm.assignedRolesCount} Roles
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail({ type: 'PERMISSION', data: perm });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all cursor-pointer"
                      >
                        Soi Chi Tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
