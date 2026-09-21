import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  Boxes,
  TrendingUp,
  DollarSign,
  Lock,
  FileCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  Scale
} from 'lucide-react';

export interface CommissionStatusBadgeProps {
  status?: string;
  className?: string;
}

export const CommissionStatusBadge: React.FC<CommissionStatusBadgeProps> = ({ status = 'ELIGIBLE', className = '' }) => {
  const s = String(status || 'ELIGIBLE').toUpperCase();

  if (s === 'ACCRUED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shadow-2xs ${className}`}>
        <Clock className="w-3 h-3 text-blue-700 dark:text-blue-400 shrink-0" />
        <span>ACCRUED (Trích trước)</span>
      </span>
    );
  }

  if (s === 'SETTLED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-50 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shadow-2xs ${className}`}>
        <CheckCircle2 className="w-3 h-3 text-purple-700 dark:text-purple-400 shrink-0" />
        <span>SETTLED (Đã quyết toán)</span>
      </span>
    );
  }

  if (s === 'REVERSED' || s === 'CANCELLED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-2xs ${className}`}>
        <RotateCcw className="w-3 h-3 text-rose-700 dark:text-rose-400 shrink-0" />
        <span>REVERSED (Hủy đảo)</span>
      </span>
    );
  }

  if (s === 'DISPUTED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs ${className}`}>
        <Scale className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0 animate-pulse" />
        <span>DISPUTED (Đang khiếu nại)</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs ${className}`}>
      <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
      <span>ELIGIBLE (Đủ điều kiện)</span>
    </span>
  );
};

export interface CalculationBasisBadgeProps {
  basis?: string;
  marginPercent?: number | string | null;
  className?: string;
}

export const CalculationBasisBadge: React.FC<CalculationBasisBadgeProps> = ({ basis = 'GROSS_MARGIN', marginPercent, className = '' }) => {
  const b = String(basis || 'GROSS_MARGIN').toUpperCase();

  if (b === 'GROSS_MARGIN') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs ${className}`}>
        <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Biên Lợi Nhuận Gộp (M42)</span>
        {marginPercent !== undefined && marginPercent !== null && Number(marginPercent) > 0 && (
          <span className="ml-1 px-1 py-0.2 bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100 rounded text-[9px]">
            {Number(marginPercent).toFixed(1)}%
          </span>
        )}
      </span>
    );
  }

  if (b === 'PAYMENT_COLLECTED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shadow-2xs ${className}`}>
        <DollarSign className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Thu Tiền Thực Tế (M32)</span>
      </span>
    );
  }

  if (b === 'INVOICE_ISSUED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-50 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shadow-2xs ${className}`}>
        <Boxes className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
        <span>Xuất Hóa Đơn (M31)</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 shadow-2xs ${className}`}>
      <Award className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
      <span>Doanh Số Xác Nhận</span>
    </span>
  );
};

export interface DisputeStatusBadgeProps {
  status?: string;
  className?: string;
}

export const DisputeStatusBadge: React.FC<DisputeStatusBadgeProps> = ({ status = 'OPEN', className = '' }) => {
  const s = String(status || 'OPEN').toUpperCase();

  if (s === 'RESOLVED_ADJUSTED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs ${className}`}>
        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Đã Duyệt Điều Chỉnh</span>
      </span>
    );
  }

  if (s === 'RESOLVED_REJECTED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-2xs ${className}`}>
        <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>Bác Bỏ Khiếu Nại</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs ${className}`}>
      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
      <span>Chờ Quản Lý Xử Lý</span>
    </span>
  );
};

export interface PayoutStatusBadgeProps {
  status?: string;
  className?: string;
}

export const PayoutStatusBadge: React.FC<PayoutStatusBadgeProps> = ({ status = 'DRAFT', className = '' }) => {
  const s = String(status || 'DRAFT').toUpperCase();

  if (s === 'DISBURSED' || s === 'PAID') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs ${className}`}>
        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>ĐÃ CHI TRẢ (PAID)</span>
      </span>
    );
  }

  if (s === 'APPROVED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shadow-2xs ${className}`}>
        <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>ĐÃ DUYỆT (APPROVED)</span>
      </span>
    );
  }

  if (s === 'CANCELLED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-2xs ${className}`}>
        <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>ĐÃ HỦY (CANCELLED)</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs ${className}`}>
      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
      <span>BẢN NHÁP (DRAFT)</span>
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

export interface AnomalyRiskBadgeProps {
  ratePercent?: number;
  threshold?: number;
  className?: string;
}

export const AnomalyRiskBadge: React.FC<AnomalyRiskBadgeProps> = ({ ratePercent = 0, threshold = 20, className = '' }) => {
  const isAnomaly = ratePercent >= threshold;

  if (isAnomaly) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-2xs ${className}`} title="Tỷ lệ hoa hồng vượt ngưỡng cảnh báo bất thường (>20%)">
        <AlertCircle className="w-3 h-3 text-rose-700 dark:text-rose-400 shrink-0 animate-pulse" />
        <span>Bất thường: {ratePercent}%</span>
        <span className="ml-0.5 px-1 py-0.2 bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100 rounded text-[9px]">Cần GĐ Duyệt</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs ${className}`}>
      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>Hợp lệ: {ratePercent}%</span>
    </span>
  );
};
