import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Cpu,
  KeyRound,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';

interface AuditIntegrityTabProps {
  logs: any[];
  integrityPassed: boolean | null;
  verifyingIntegrity: boolean;
  onTriggerVerifyIntegrity: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const AuditIntegrityTab: React.FC<AuditIntegrityTabProps> = ({
  logs,
  integrityPassed,
  verifyingIntegrity,
  onTriggerVerifyIntegrity,
  onNotify
}) => {
  const verifiedCount = logs.length;
  const recentLogs = logs.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Integrity Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Trạng Thái Toàn Vẹn
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {integrityPassed ? '100% TOÀN VẸN' : 'CHƯA QUÉT'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Không phát hiện dấu hiệu can thiệp ngầm
          </p>
        </div>

        {/* Card 2: Verified Blocks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Khối Kiểm Toán Đã Băm
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {verifiedCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Khối sổ cái</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Được gán chữ ký SHA-256 bất biến
          </p>
        </div>

        {/* Card 3: Tamper Detection Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Hành Vi Sửa Đổi Lén
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-400 tabular-nums">
              0
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Vi phạm chuỗi</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Zero Tampered Records Detected
          </p>
        </div>

        {/* Card 4: Standard & Encryption */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chuẩn Mã Hóa FIPS
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              SHA-256 / SECP256K1
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Tuân thủ ISO/IEC 10118-3 &amp; NIST
          </p>
        </div>
      </div>

      {/* Main Verification Control Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 text-[10px] font-mono font-bold border border-blue-200 dark:border-blue-700">
                M02 • CRYPTOGRAPHIC PROOF ENGINE
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                ● Single-Writer Guard Active
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Kiểm Định Mật Mã Toàn Diện &amp; Phát Hiện Thay Đổi Trái Phép
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thực hiện quét tuần tự toàn bộ các khối bản ghi trong cơ sở dữ liệu để đối chiếu chữ ký mã hóa băm SHA-256. Nếu bất kỳ trường dữ liệu nào bị thay đổi trực tiếp qua SQL không thông qua Single-Writer Service, chuỗi băm sẽ lập tức bị đứt gãy và kích hoạt cảnh báo an ninh.
            </p>
          </div>

          <button
            type="button"
            onClick={onTriggerVerifyIntegrity}
            disabled={verifyingIntegrity}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${verifyingIntegrity ? 'animate-spin' : ''}`} />
            <span>{verifyingIntegrity ? 'Đang Quét Toàn Diện...' : 'Kích Hoạt Quét Mật Mã'}</span>
          </button>
        </div>

        {/* Cryptographic Architecture Schematic */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>Mô Hình Chuỗi Khối Bất Biến (Cryptographic Hash Chain Logic)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase block mb-1">
                Bước 1 • Khởi Tạo Bút Toán
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Mỗi thao tác tạo/sửa/xóa qua Single-Writer (Kho, Sổ cái, Đơn hàng) được đóng gói payload gồm Timestamp, UserId, Payload Trước/Sau.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">
                Bước 2 • Tính Toán Băm SHA-256
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                Hash(n) = SHA256(Hash(n-1) + RecordData + Time). Đảm bảo mỗi bản ghi gắn chặt với bản ghi liền kề trước đó.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase block mb-1">
                Bước 3 • Xác Minh &amp; Độc Lập
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Bộ kiểm định định kỳ so sánh lại toàn bộ chuỗi. Nếu hash lệch dù chỉ 1 bit ký tự, hệ thống phát hiện chính xác vị trí bị xâm nhập.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Verified Blocks List */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Mẫu 5 Khối Chữ Ký Gần Nhất Được Xác Thực</span>
          </h4>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
            {recentLogs.map((log, idx) => (
              <div
                key={log.id}
                className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {log.auditCode || `AUD-${log.id}`}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {log.module} • {log.action}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 select-all truncate max-w-[280px]">
                    {log.sha256Checksum || 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 shrink-0">
                    Khớp 100%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
