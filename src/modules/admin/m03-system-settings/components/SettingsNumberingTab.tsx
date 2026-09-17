import React, { useState, useEffect } from 'react';
import {
  FileText,
  Hash,
  Play,
  RotateCcw,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
  Search,
  Building,
  Calendar,
  Layers,
} from 'lucide-react';
import { DocumentSequence } from './types';
import ConfirmDialog, { ConfirmDialogProps } from '../../../../components/common/ConfirmDialog';

interface SettingsNumberingTabProps {
  onNotify?: (notification: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  currentUser?: any;
}

export const SettingsNumberingTab: React.FC<SettingsNumberingTabProps> = ({
  onNotify,
  currentUser,
}) => {
  const [sequences, setSequences] = useState<DocumentSequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingDocType, setTestingDocType] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ docType: string; code: string; counter: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSeq, setEditingSeq] = useState<Partial<DocumentSequence> | null>(null);
  const [livePreview, setLivePreview] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps['dialog'] | null>(null);

  const fetchSequences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/sequences');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSequences(json.data);
      }
    } catch (err) {
      console.error('Error fetching sequences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSequences();
  }, []);

  // Compute live preview whenever editingSeq changes
  useEffect(() => {
    if (!editingSeq) return;
    const now = new Date();
    const yearStr = now.getFullYear().toString();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    let datePart = '';
    if (editingSeq.dateFormat === 'YYYY') datePart = yearStr;
    else if (editingSeq.dateFormat === 'YYYYMM') datePart = `${yearStr}${monthStr}`;

    const pad = Number(editingSeq.padding || 5);
    const num = Number(editingSeq.currentNumber || 0) + 1;
    const branchPrefix = (editingSeq.branchCode && editingSeq.branchCode !== 'ALL') ? `${editingSeq.branchCode}-` : '';
    const sample = `${branchPrefix}${editingSeq.prefix || 'DOC'}${editingSeq.separator || '-'}${datePart ? datePart + (editingSeq.separator || '-') : ''}${String(num).padStart(pad, '0')}`;
    setLivePreview(sample);
  }, [editingSeq]);

  const handleTestGenerateNext = async (docType: string) => {
    setTestingDocType(docType);
    try {
      const res = await fetch(`/api/settings/sequences/${docType}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchCode: 'BR_HO' }),
      });
      const json = await res.json();
      if (json.success) {
        setTestResult({
          docType,
          code: json.generatedDocNumber,
          counter: json.counter,
        });
        onNotify?.({
          type: 'success',
          title: 'Sinh Số Chứng Từ Thành Công',
          message: `Mã chứng từ kế tiếp: ${json.generatedDocNumber} (Bộ đếm: ${json.counter})`,
        });
        fetchSequences();
      } else {
        throw new Error(json.error || 'Sinh số thất bại');
      }
    } catch (err: any) {
      onNotify?.({
        type: 'error',
        title: 'Lỗi Sinh Số',
        message: err.message,
      });
    } finally {
      setTestingDocType(null);
    }
  };

  const handleSaveSequence = () => {
    if (!editingSeq?.docType || !editingSeq?.prefix) {
      onNotify?.({
        type: 'warning',
        title: 'Thiếu Dữ Liệu',
        message: 'Vui lòng cung cấp Loại chứng từ và Tiền tố (Prefix).',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Xác Nhận Thay Đổi Cấu Hình Mẫu Số [${editingSeq.docType}]`,
      message: `Bạn đang cập nhật cấu hình đánh số cho ${editingSeq.docName}. Việc này sẽ ảnh hưởng trực tiếp đến định dạng mã của các chứng từ tạo mới trong tương lai. Bạn có chắc chắn muốn lưu?`,
      confirmLabel: 'Xác nhận & Lưu cấu hình',
      cancelLabel: 'Quay lại',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/settings/sequences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingSeq),
          });
          const json = await res.json();
          if (json.success) {
            onNotify?.({
              type: 'success',
              title: 'Cập Nhật Thành Công',
              message: json.message || 'Đã lưu cấu hình mẫu số chứng từ.',
            });
            setEditModalOpen(false);
            setEditingSeq(null);
            fetchSequences();
          } else {
            throw new Error(json.error || 'Lưu thất bại');
          }
        } catch (err: any) {
          onNotify?.({
            type: 'error',
            title: 'Lỗi Lưu Cấu Hình',
            message: err.message,
          });
        }
      },
    });
  };

  const filteredSequences = sequences.filter(
    (s) =>
      s.docType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.prefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER & CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-500" />
            Bộ Sinh Mã Số Chứng Từ Toàn Hệ Thống (Document Numbering Engine)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cấu hình quy tắc đặt mã chứng từ tự động (SO, PO, INV, WH, MO...). Cơ chế Single-Writer đảm bảo mã sinh ra là nguyên tử (ACID), duy nhất và không bị nhảy số.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm loại chứng từ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* TEST RESULT BANNER */}
      {testResult && (
        <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Kết quả thử nghiệm sinh số tiếp theo:</span>
            <span className="font-mono font-bold bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-sm">
              {testResult.code}
            </span>
            <span className="text-slate-500">(Bộ đếm hiện thời: {testResult.counter})</span>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Đóng thông báo
          </button>
        </div>
      )}

      {/* SEQUENCES TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Loại Chứng Từ</th>
                <th className="py-3 px-4">Tên Nghiệp Vụ</th>
                <th className="py-3 px-4">Tiền Tố</th>
                <th className="py-3 px-4">Định Dạng Ngày</th>
                <th className="py-3 px-4 text-center">Độ Dài Số</th>
                <th className="py-3 px-4 text-right">Bộ Đếm Hiện Tại</th>
                <th className="py-3 px-4">Chu Kỳ Reset</th>
                <th className="py-3 px-4">Mẫu Hiển Thị (Sample Preview)</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredSequences.map((seq) => (
                <tr
                  key={seq.docType}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {seq.docType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {seq.docName}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {seq.prefix}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {seq.dateFormat === 'NONE' ? 'Không' : seq.dateFormat}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {seq.padding} chữ số
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                    #{seq.currentNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {seq.resetCycle === 'YEARLY'
                      ? 'Hàng năm'
                      : seq.resetCycle === 'MONTHLY'
                      ? 'Hàng tháng'
                      : 'Không reset'}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {seq.samplePreview || `${seq.prefix}-2026-${String(seq.currentNumber).padStart(seq.padding, '0')}`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleTestGenerateNext(seq.docType)}
                      disabled={testingDocType === seq.docType}
                      title="Thử nghiệm sinh số tiếp theo"
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Sinh Số</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingSeq({ ...seq });
                        setEditModalOpen(true);
                      }}
                      title="Cấu hình mẫu số"
                      className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT SEQUENCE MODAL */}
      {editModalOpen && editingSeq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-500" />
              Cấu Hình Mẫu Số: {editingSeq.docName} ({editingSeq.docType})
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Tiền Tố (Prefix)</label>
                  <input
                    type="text"
                    value={editingSeq.prefix || ''}
                    onChange={(e) => setEditingSeq({ ...editingSeq, prefix: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="SO, PO, INV..."
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Ký Tự Ngăn Cách</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={editingSeq.separator || '-'}
                    onChange={(e) => setEditingSeq({ ...editingSeq, separator: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="-"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Định Dạng Năm/Tháng</label>
                  <select
                    value={editingSeq.dateFormat || 'YYYY'}
                    onChange={(e) => setEditingSeq({ ...editingSeq, dateFormat: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="YYYY">Chỉ năm (YYYY - VD: 2026)</option>
                    <option value="YYYYMM">Năm & Tháng (YYYYMM - VD: 202609)</option>
                    <option value="NONE">Không chèn ngày tháng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Số Chữ Số (Padding)</label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={editingSeq.padding || 5}
                    onChange={(e) => setEditingSeq({ ...editingSeq, padding: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Bộ Đếm Hiện Thời</label>
                  <input
                    type="number"
                    min={0}
                    value={editingSeq.currentNumber || 0}
                    onChange={(e) => setEditingSeq({ ...editingSeq, currentNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-right font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Chu Kỳ Reset Bộ Đếm</label>
                  <select
                    value={editingSeq.resetCycle || 'YEARLY'}
                    onChange={(e) => setEditingSeq({ ...editingSeq, resetCycle: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="YEARLY">Hàng năm (Reset về 1 vào ngày 01/01)</option>
                    <option value="MONTHLY">Hàng tháng (Reset về 1 vào đầu tháng)</option>
                    <option value="NEVER">Tăng liên tục không reset</option>
                  </select>
                </div>
              </div>

              {/* LIVE PREVIEW BOX */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                  Mẫu Mã Chứng Từ Tiếp Theo (Live Preview):
                </span>
                <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 block">
                  {livePreview}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveSequence}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
