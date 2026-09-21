import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Clock, Boxes, Wrench, Truck, Trash2, RefreshCw, DollarSign, Lock, FileCheck } from 'lucide-react';

export interface WarrantyStatusBadgeProps {
  status?: 'VALID' | 'EXPIRED' | 'VOID_TAMPERED' | string;
  className?: string;
}

export const WarrantyStatusBadge: React.FC<WarrantyStatusBadgeProps> = ({ status = 'VALID', className = '' }) => {
  const norm = String(status || 'VALID').toUpperCase();
  if (norm === 'EXPIRED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs ${className}`}>
        <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
        <span>Hết hạn BH</span>
      </span>
    );
  }
  if (norm === 'VOID_TAMPERED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-2xs ${className}`}>
        <AlertTriangle className="w-3 h-3 text-rose-700 dark:text-rose-400 shrink-0" />
        <span>Từ chối / Mất tem</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs ${className}`}>
      <ShieldCheck className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
      <span>Còn BH</span>
    </span>
  );
};

export interface FraudRiskBadgeProps {
  score?: number;
  flags?: any;
  className?: string;
  showOverrideRequirement?: boolean;
}

export const FraudRiskBadge: React.FC<FraudRiskBadgeProps> = ({ score = 0, flags, className = '', showOverrideRequirement = true }) => {
  const isHighRisk = score >= 50 || (typeof flags === 'string' && flags.includes('HIGH_RISK_FRAUD'));
  const isMedRisk = score >= 20 && score < 50;

  if (isHighRisk) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-2xs ${className}`} title="Rủi ro gian lận cao: Bắt buộc Giám đốc Phê duyệt (returns:fraud_override)">
        <AlertCircle className="w-3 h-3 text-rose-700 dark:text-rose-400 shrink-0 animate-pulse" />
        <span>Gian lận: {score}/100</span>
        {showOverrideRequirement && (
          <span className="ml-0.5 px-1 py-0.2 bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100 rounded text-[9px]">Cần GĐ Duyệt</span>
        )}
      </span>
    );
  }

  if (isMedRisk) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs ${className}`}>
        <AlertTriangle className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
        <span>Rủi ro TB: {score}/100</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs ${className}`}>
      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>An toàn: {score}/100</span>
    </span>
  );
};

export interface WorkflowProgressBadgeProps {
  disposition?: string;
  maintenanceWoCode?: string | null;
  rtvReferenceCode?: string | null;
  creditNoteNumber?: string | null;
  className?: string;
}

export const WorkflowProgressBadge: React.FC<WorkflowProgressBadgeProps> = ({
  disposition = 'PENDING',
  maintenanceWoCode,
  rtvReferenceCode,
  creditNoteNumber,
  className = ''
}) => {
  const disp = String(disposition || 'PENDING').toUpperCase();

  if (disp === 'RESTOCK') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shadow-2xs ${className}`}>
        <Boxes className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>RESTOCK (Nhập kho M17)</span>
      </span>
    );
  }

  if (disp === 'REPAIR') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 shadow-2xs ${className}`}>
        <Wrench className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>REPAIR (M27 EAM)</span>
        {maintenanceWoCode && (
          <span className="font-mono text-[9px] text-indigo-700 dark:text-indigo-300 underline ml-0.5">[{maintenanceWoCode}]</span>
        )}
      </span>
    );
  }

  if (disp === 'RETURN_TO_VENDOR') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs ${className}`}>
        <Truck className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>RTV (Trả NCC M08/M11)</span>
        {rtvReferenceCode && (
          <span className="font-mono text-[9px] text-amber-800 dark:text-amber-300 underline ml-0.5">[{rtvReferenceCode}]</span>
        )}
      </span>
    );
  }

  if (disp === 'SCRAP') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-2xs ${className}`}>
        <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>SCRAP (Hủy phế liệu)</span>
      </span>
    );
  }

  if (disp === 'REPLACE') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-50 text-teal-900 dark:bg-teal-950/80 dark:text-teal-200 border border-teal-300 dark:border-teal-700 shadow-2xs ${className}`}>
        <RefreshCw className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
        <span>REPLACE (Đổi mới M17)</span>
      </span>
    );
  }

  if (disp === 'CREDIT') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs ${className}`}>
        <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>CREDIT NOTE (M31/M32)</span>
        {creditNoteNumber && (
          <span className="font-mono text-[9px] text-emerald-800 dark:text-emerald-300 underline ml-0.5">[{creditNoteNumber}]</span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs ${className}`}>
      <span>PENDING (Chờ xử lý)</span>
    </span>
  );
};

export interface DmsSealBadgeProps {
  vaultDocumentCode?: string | null;
  className?: string;
}

export const DmsSealBadge: React.FC<DmsSealBadgeProps> = ({ vaultDocumentCode, className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs ${className}`} title="Đã niêm phong số vào M29 DMS Vault với mã băm SHA-256">
      <FileCheck className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
      <span className="truncate max-w-[120px]">{vaultDocumentCode || 'M29 DMS Sealed'}</span>
    </span>
  );
};
