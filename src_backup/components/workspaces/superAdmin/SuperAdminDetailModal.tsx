import React from 'react';
import { SuperAdminDetailItem, RbacRole, RbacUser, RbacPermission, SodDiagnosticRule } from './types';
import {
  X,
  Shield,
  Key,
  Users,
  ShieldAlert,
  Building2,
  Lock,
  Smartphone,
  Hash,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Code
} from 'lucide-react';

interface SuperAdminDetailModalProps {
  item: SuperAdminDetailItem | null;
  onClose: () => void;
}

export const SuperAdminDetailModal: React.FC<SuperAdminDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER (M41 L0 SPEC) */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs">
              {item.type === 'ROLE' && <Shield className="w-5 h-5" />}
              {item.type === 'USER' && <Users className="w-5 h-5" />}
              {item.type === 'PERMISSION' && <Key className="w-5 h-5" />}
              {item.type === 'SOD_RULE' && <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                  {item.type}
                </span>
                <span className="font-mono text-xs text-slate-300">
                  #{item.data.id}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {item.type === 'ROLE' && (item.data as RbacRole).name}
                {item.type === 'USER' && (item.data as RbacUser).fullName}
                {item.type === 'PERMISSION' && (item.data as RbacPermission).name}
                {item.type === 'SOD_RULE' && (item.data as SodDiagnosticRule).name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-slate-100 dark:divide-slate-700/60">
          {/* TYPE: ROLE */}
          {item.type === 'ROLE' && (() => {
            const r = item.data as RbacRole;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Mã Định Danh (Code)
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                      {r.code}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Cấp Bậc An Ninh (Tier)
                    </span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                      {r.tier}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Mô Tả Chức Năng
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    {r.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Số Tài Khoản Đang Gán
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white mt-1 block">
                      {r.userCount} người dùng
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Số Quyền Hạn
                    </span>
                    <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
                      {r.permissionsCount} đặc quyền hạt nhân
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Chữ Ký Toàn Vẹn SHA-256
                  </span>
                  <span className="font-mono text-[10px] break-all bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 block">
                    {r.auditChecksum}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* TYPE: USER */}
          {item.type === 'USER' && (() => {
            const u = item.data as RbacUser;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Tên Đăng Nhập
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                      {u.username}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Vai Trò Phân Quyền
                    </span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                      {u.roleName} ({u.roleCode})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Chi Nhánh Trực Thuộc
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white mt-1 block">
                      {u.branchName} ({u.branchScope})
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Đăng Nhập Lần Cuối
                    </span>
                    <span className="font-mono text-xs text-slate-900 dark:text-white mt-1 block">
                      {u.lastLogin}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Xác Thực 2 Bước (MFA)
                    </span>
                  </div>
                  {u.mfaEnabled ? (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full border">
                      ĐÃ KÍCH HOẠT
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-950 dark:bg-amber-950/90 dark:text-amber-200 rounded text-xs font-bold border border-amber-300 dark:border-amber-700">
                      CHƯA KÍCH HOẠT
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TYPE: PERMISSION */}
          {item.type === 'PERMISSION' && (() => {
            const p = item.data as RbacPermission;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Mã Đặc Quyền
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                      {p.code}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Phân Hệ ERP
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                      {p.moduleId} ({p.category})
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    API Endpoint & Action
                  </span>
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-800 dark:text-slate-200">
                    <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded font-bold text-[10px]">
                      {p.action}
                    </span>
                    <span>{p.endpoint}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Mô Tả Nghiệp Vụ
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* TYPE: SOD_RULE */}
          {item.type === 'SOD_RULE' && (() => {
            const s = item.data as SodDiagnosticRule;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Mã Quy Tắc SoD
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                      {s.code}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Mức Độ Rủi Ro
                    </span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                      {s.riskSeverity}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Mô Tả Quy Tắc Kiểm Soát
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    {s.description}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Các Cặp Quyền Xung Đột Bị Cấm Kiêm Nhiệm
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {s.conflictingPermissions.map((cp, idx) => (
                      <span
                        key={idx}
                        className="font-mono text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800"
                      >
                        {cp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
