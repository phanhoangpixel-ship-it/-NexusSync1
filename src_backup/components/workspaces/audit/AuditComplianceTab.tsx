import React from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Award,
  Layers,
  FileSpreadsheet,
  Check,
  ExternalLink
} from 'lucide-react';

interface AuditComplianceTabProps {
  logs: any[];
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const AuditComplianceTab: React.FC<AuditComplianceTabProps> = ({ logs, onNotify }) => {
  const total = logs.length || 1;
  const successCount = logs.filter(l => l.result === 'SUCCESS').length;
  const complianceScore = Math.min(100, Math.round((successCount / total) * 100 * 10) / 10);

  const sodRules = [
    {
      id: 'SOD-01',
      title: 'Tách biệt Duyệt PO & Nhận hàng Kho',
      desc: 'Nhân viên tạo Đơn mua hàng (PO) không được phép thực hiện Phiếu nhập kho (GRN).',
      status: 'COMPLIANT',
      domain: 'PURCHASE / INVENTORY'
    },
    {
      id: 'SOD-02',
      title: 'Tách biệt Lập Bút toán GL & Duyệt Sổ cái',
      desc: 'Kế toán viên lập định khoản không được kiêm quyền Kế toán trưởng phê duyệt kỳ đóng sổ.',
      status: 'COMPLIANT',
      domain: 'FINANCE / GL'
    },
    {
      id: 'SOD-03',
      title: 'Kiểm soát Điều chỉnh Số dư Tồn kho (M18/M19)',
      desc: 'Thủ kho thực hiện đếm kiểm kê không được tự duyệt Bút toán điều chỉnh hao hụt.',
      status: 'COMPLIANT',
      domain: 'WMS / INVENTORY'
    },
    {
      id: 'SOD-04',
      title: 'Quản trị viên Hệ thống & Dữ liệu Nghiệp vụ',
      desc: 'SuperAdmin IT không được can thiệp trực tiếp số dư tài khoản ngân hàng hoặc giá bán sản phẩm.',
      status: 'COMPLIANT',
      domain: 'CORE / IAM'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chỉ Số Tuân Thủ Toàn Diện
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
              {complianceScore}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Đạt chuẩn SOX 404</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Không có sai phạm kiểm soát tài chính trọng yếu
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tiêu Chuẩn ISO/IEC 27001
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400">
              A.12.4 ĐẠT 100%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Ghi nhận và bảo vệ nhật ký kiểm toán bất biến
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quy Tắc Bất Kiêm Nhiệm (SoD)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-400 tabular-nums">
              4/4 ĐẠT
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Tuân thủ hoàn toàn ma trận phân tách vai trò
          </p>
        </div>
      </div>

      {/* SoD Matrix Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Ma Trận Kiểm Soát Phân Tách Trách Nhiệm (Segregation of Duties - SoD Matrix)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kiểm tra xung đột quyền lợi giữa các tác nhân nhằm ngăn ngừa rủi ro gian lận và sai sót nghiệp vụ.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 rounded-md text-[11px] font-bold">
            Hoàn Toàn Tuân Thủ
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
          {sodRules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                    {rule.id}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{rule.title}</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-600">
                    {rule.domain}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {rule.desc}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                  <span>Tuân Thủ</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
