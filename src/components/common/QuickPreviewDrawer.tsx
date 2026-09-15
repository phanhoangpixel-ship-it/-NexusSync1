import React, { useEffect } from 'react';
import { WorkspaceEntityPreview } from '../../types/workspace';
import { FileText, X, CheckCircle2, Clock, GitBranch, ArrowRight, Printer } from 'lucide-react';

interface QuickPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preview: WorkspaceEntityPreview | null;
  onPrint?: () => void;
}

export const QuickPreviewDrawer: React.FC<QuickPreviewDrawerProps> = ({
  isOpen,
  onClose,
  preview,
  onPrint,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !preview) return null;

  return (
    <div
      id="quick-preview-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer select-none"
    >
      <div
        id="quick-preview-drawer"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200 cursor-default select-text"
      >
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {preview.code}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {preview.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{preview.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onPrint && (
              <button
                onClick={onPrint}
                className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
                title="In chứng từ"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Thông tin chung
            </h4>
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-500">Mã chứng từ:</span>
                <p className="font-mono font-semibold text-slate-900 mt-0.5">{preview.code}</p>
              </div>
              <div>
                <span className="text-slate-500">Phân loại:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{preview.type}</p>
              </div>
              <div>
                <span className="text-slate-500">Ngày tạo:</span>
                <p className="font-mono text-slate-700 mt-0.5">
                  {preview.createdAt ? new Date(preview.createdAt).toLocaleString('vi-VN') : '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Trạng thái:</span>
                <p className="font-semibold text-emerald-700 mt-0.5">{preview.status}</p>
              </div>
            </div>
          </div>

          {preview.items && preview.items.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Danh sách chi tiết ({preview.items.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Mặt hàng</th>
                      <th className="py-2 px-3 font-semibold text-right">SL</th>
                      <th className="py-2 px-3 font-semibold text-right">Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {preview.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-900 font-medium">
                          {it.productName || it.productSku || `Mục #${idx + 1}`}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                          {it.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {it.unitCost ? it.unitCost.toLocaleString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {preview.lineage && preview.lineage.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                Chuỗi liên kết chứng từ (Lineage)
              </h4>
              <div className="space-y-2">
                {preview.lineage.map((node, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{node.code}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">{node.type}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                      {node.relation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  );
};
