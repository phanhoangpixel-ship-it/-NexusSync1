import React, { useState, useEffect } from 'react';
import { Tag, ShieldCheck, CheckCircle2, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface RegisterSkuModalProps {
  isOpen: boolean;
  project: any;
  onClose: () => void;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const RegisterSkuModal: React.FC<RegisterSkuModalProps> = ({
  isOpen,
  project,
  onClose,
  onSuccess,
  onNotify,
}) => {
  const generateSkuCode = (proj: any) => {
    if (!proj) return `SKU-RD-${Date.now().toString().slice(-4)}`;
    const sanitized = (proj.projectCode || `RD-${proj.id}`).replace(/[^A-Za-z0-9]/g, '-').toUpperCase();
    return `SKU-${sanitized}`;
  };

  const [skuCode, setSkuCode] = useState('');
  const [skuName, setSkuName] = useState('');
  const [uom, setUom] = useState('Pcs');
  const [category, setCategory] = useState('Bán dẫn & Phần cứng');
  const [targetCost, setTargetCost] = useState('2500000');
  const [retailPrice, setRetailPrice] = useState('3200000');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setSkuCode(generateSkuCode(project));
      setSkuName(project.title || '');
      setCategory(project.category || 'Bán dẫn & Phần cứng');
      if (project.budget) {
        // Est. unit target cost approx 1/1000 of project budget or standard
        const estCost = Math.round(Number(project.budget) / 1000) || 2500000;
        setTargetCost(String(estCost));
        setRetailPrice(String(Math.round(estCost * 1.3)));
      }
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuCode.trim() || !skuName.trim()) {
      onNotify('warning', 'Thiếu dữ liệu', 'Vui lòng nhập mã và tên SKU.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/rd/projects/${project.id}/register-sku`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skuCode: skuCode.trim(),
          skuName: skuName.trim(),
          uom,
          category,
          targetCost: Number(targetCost) || 0,
          retailPrice: Number(retailPrice) || 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Đăng ký SKU thành công', data.message || `Đã tạo SKU [${skuCode}] vào M07 Item Master.`);
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi đăng ký SKU', err.error || 'Thao tác đăng ký SKU thất bại.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              Đăng Ký SKU Chính Thức (M07 Item Master)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* M07 Master Authority Notice */}
        <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <span className="font-bold">M07 Item Master Authority: </span>
            Tạo bản ghi SKU chính thức trong bảng danh mục sản phẩm <code>products</code> với nguồn gốc <code>sourceType = 'RD_PROJECT'</code> và trạng thái <code>ACTIVE</code>.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 dark:text-slate-300 font-medium">
                Mã SKU Thương Mại Hóa *
              </label>
              <button
                type="button"
                onClick={() => setSkuCode(generateSkuCode(project))}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tạo lại mã</span>
              </button>
            </div>
            <input
              type="text"
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono font-bold text-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Tên Sản Phẩm Thương Mại *
            </label>
            <input
              type="text"
              value={skuName}
              onChange={(e) => setSkuName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Đơn Vị Tính (UoM) *
              </label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium"
              >
                <option value="Pcs">Pcs (Cái/Chiếc)</option>
                <option value="Kg">Kg (Kilogram)</option>
                <option value="Set">Set (Bộ thiết bị)</option>
                <option value="Box">Box (Hộp/Thùng)</option>
                <option value="Lít">Lít (Liter)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Ngành Hàng / Phân Loại
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium"
              >
                <option value="Bán dẫn & Phần cứng">Bán dẫn & Phần cứng</option>
                <option value="Điện tử & Viễn thông">Điện tử & Viễn thông</option>
                <option value="Vật liệu mới & Nano">Vật liệu mới & Nano</option>
                <option value="Hóa học & Sinh học">Hóa học & Sinh học</option>
                <option value="Phần mềm AI & IoT">Phần mềm AI & IoT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Giá Vốn Mục Tiêu (VND)
              </label>
              <input
                type="number"
                value={targetCost}
                onChange={(e) => setTargetCost(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Giá Bán Niêm Yết (VND)
              </label>
              <input
                type="number"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono font-bold text-emerald-600"
              />
            </div>
          </div>

          {/* Master Data Preview Card */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-slate-500 block">Dự án gốc:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                [{project.projectCode || `RD-${project.id}`}]
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Biên lợi nhuận gộp:</span>
              <span className="font-mono font-bold text-emerald-600">
                {Number(retailPrice) > 0 && Number(targetCost) > 0
                  ? `${Math.round(((Number(retailPrice) - Number(targetCost)) / Number(retailPrice)) * 100)}%`
                  : 'N/A'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
            >
              {submitting ? 'Đang tạo SKU...' : 'Tạo SKU Vào M07'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
