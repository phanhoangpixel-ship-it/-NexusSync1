import React from 'react';
import {
  X,
  ShieldAlert,
  Building2,
  Activity,
  User,
  Monitor,
  Clock,
  MapPin,
  FileCode,
  Database,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Phone,
  Mail,
} from 'lucide-react';
import { SettingsDetailItem } from './types';

interface SettingsDetailModalProps {
  item: SettingsDetailItem | null;
  onClose: () => void;
  onForceLogoutSession?: (sessionId: string, userName: string) => void;
  onActivateBranch?: (branchId: string) => void;
  currentBranchId?: string;
}

export const SettingsDetailModal: React.FC<SettingsDetailModalProps> = ({
  item,
  onClose,
  onForceLogoutSession,
  onActivateBranch,
  currentBranchId,
}) => {
  if (!item) return null;

  return (
    <div
      id="settings-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all"
    >
      <div
        id="settings-detail-modal-container"
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {item.type === 'SESSION' && (
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            {item.type === 'BRANCH' && (
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            {item.type === 'DIAGNOSTIC' && (
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {item.type === 'SESSION' && 'ACTIVE_SESSION_INSPECT'}
                  {item.type === 'BRANCH' && 'MULTI_BRANCH_INSPECT'}
                  {item.type === 'DIAGNOSTIC' && 'SYSTEM_DIAGNOSTIC_INSPECT'}
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                  M03 • L4 Detail
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {item.type === 'SESSION' && `Chi tiết Phiên: ${item.data.user}`}
                {item.type === 'BRANCH' && `[${item.data.code}] ${item.data.name}`}
                {item.type === 'DIAGNOSTIC' && item.data.component}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng cửa sổ (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-200">
          {/* SESSION DETAILS */}
          {item.type === 'SESSION' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4 font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-sans font-bold">Mã Phiên (Session ID)</div>
                  <div className="text-xs font-bold text-blue-700 dark:text-blue-400">{item.data.id}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-sans font-bold">Trạng Thái</div>
                  <span
                    className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.data.status === 'SUSPICIOUS'
                        ? 'bg-amber-100 text-amber-950 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                        : 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                    }`}
                  >
                    {item.data.status === 'SUSPICIOUS' ? 'CẦN CHÚ Ý' : 'HOẠT ĐỘNG'}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-sans font-bold">Tài Khoản / Người Dùng</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-sans">{item.data.user}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-sans font-bold">Vai Trò Hệ Thống</div>
                  <div className="text-xs font-bold text-purple-700 dark:text-purple-400">{item.data.role}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-sans font-bold">Địa Chỉ IP Ingress</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.data.ip}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-sans font-bold">Thiết Bị / User Agent</div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-sans">{item.data.device}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-sans font-bold">Thời Điểm Đăng Nhập</div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.data.loginTime}</div>
                </div>
              </div>

              {item.data.status === 'SUSPICIOUS' && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong>Cảnh báo an ninh phiên:</strong> Địa chỉ IP kết nối hoặc thiết bị có dấu hiệu bất thường so với hồ sơ đăng nhập thường nhật. Khuyến nghị Quản trị viên tiến hành Buộc thoát (Force Logout) và yêu cầu người dùng đặt lại mật khẩu.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BRANCH DETAILS */}
          {item.type === 'BRANCH' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                    Mã Đơn Vị: {item.data.code}
                  </span>
                  {item.data.id === currentBranchId ? (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                      Đang Kích Hoạt
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Chi Nhánh Sẵn Sàng
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Tên Pháp Nhân / Chi Nhánh</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.data.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Phân Loại Chi Nhánh</div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">{item.data.meta.type}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Địa Chỉ Đăng Ký</div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.data.meta.address}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Mã Số Thuế Chi Nhánh</div>
                    <div className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400">{item.data.meta.taxCode}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Tiền Tố Chứng Từ & Khu Vực</div>
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {item.data.meta.prefix}XXXX ({item.data.meta.region})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Người Phụ Trách / Giám Đốc</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.data.meta.manager}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Quy Mô Nhân Sự</div>
                    <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{item.data.meta.staffCount} nhân sự</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Sổ Cái Kế Toán Phân Lập</div>
                    <div className="text-xs font-mono text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-100 dark:border-blue-800 font-semibold mt-1">
                      {item.data.meta.ledger}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Danh Sách Kho Trực Thuộc Chi Nhánh ({item.data.meta.warehouses.length})</span>
                </div>
                <div className="space-y-1.5">
                  {item.data.meta.warehouses.map((wh, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between font-mono"
                    >
                      <span className="font-sans font-medium text-slate-800 dark:text-slate-200">{wh}</span>
                      <span className="text-[10px] text-emerald-950 dark:text-emerald-200 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700">
                        Sẵn sàng điều phối
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DIAGNOSTIC DETAILS */}
          {item.type === 'DIAGNOSTIC' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-sans text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {item.data.component}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700">
                    {item.data.result}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-sans font-bold">Độ Trễ Phản Hồi (Latency)</div>
                    <div className="font-bold text-blue-700 dark:text-blue-400">{item.data.latency}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-sans font-bold">Thời Điểm Kiểm Tra</div>
                    <div className="text-slate-600 dark:text-slate-400">{item.data.checkedAt}</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto select-all border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase mb-1">// System Diagnostic Trace Message</div>
                {item.data.message}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
          <div>
            {item.type === 'SESSION' && onForceLogoutSession && (
              <button
                type="button"
                onClick={() => {
                  onForceLogoutSession(item.data.id, item.data.user);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Buộc Thoát Phiên Này</span>
              </button>
            )}
            {item.type === 'BRANCH' && onActivateBranch && item.data.id !== currentBranchId && (
              <button
                type="button"
                onClick={() => {
                  onActivateBranch(item.data.id);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Chuyển Sang Chi Nhánh Này</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
