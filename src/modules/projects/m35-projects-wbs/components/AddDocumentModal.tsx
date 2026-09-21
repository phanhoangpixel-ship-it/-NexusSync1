import React, { useState, useRef } from 'react';
import { X, FileText, UploadCloud, FileCheck, Trash2 } from 'lucide-react';
import { ProjectDocument } from '../../../../types/m35Types';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectCode: string;
  projectName: string;
  documentCount: number;
  onAddDocument: (docData: any) => void;
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectCode,
  projectName,
  documentCount,
  onAddDocument,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'DELIVERABLE' as ProjectDocument['category'],
    uploadedBy: 'Phan Hoàng Pixel (PM)',
    size: '4.2 MB',
    status: 'APPROVED' as ProjectDocument['status'],
  });

  if (!isOpen) return null;

  const processSelectedFile = (file: File) => {
    setUploadedFileName(file.name);

    let formattedSize = '1.0 MB';
    if (file.size < 1024 * 1024) {
      formattedSize = `${Math.max(1, Math.round(file.size / 1024))} KB`;
    } else {
      formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    const lowerName = file.name.toLowerCase();
    let detectedCat: ProjectDocument['category'] = 'DELIVERABLE';
    if (lowerName.includes('contract') || lowerName.includes('hop_dong') || lowerName.includes('phu_luc')) {
      detectedCat = 'CONTRACT';
    } else if (lowerName.includes('charter') || lowerName.includes('dieu_le') || lowerName.includes('quyet_dinh')) {
      detectedCat = 'CHARTER';
    } else if (lowerName.includes('spec') || lowerName.includes('thiet_ke') || lowerName.includes('drawing') || lowerName.endsWith('.dwg')) {
      detectedCat = 'DESIGN_SPEC';
    } else if (lowerName.includes('uat') || lowerName.includes('test') || lowerName.includes('kiem_thu') || lowerName.includes('qa')) {
      detectedCat = 'UAT_REPORT';
    }

    setFormData((prev) => ({
      ...prev,
      name: file.name,
      size: formattedSize,
      category: detectedCat,
    }));

    if (onNotify) {
      onNotify('info', 'Đã nạp tệp', `Đã nhận tệp: "${file.name}" (${formattedSize})`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearSelectedFile = () => {
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFormData((prev) => ({
      ...prev,
      name: '',
      size: '4.2 MB',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      if (onNotify) onNotify('warning', 'Thiếu thông tin', 'Vui lòng chọn tệp hoặc nhập tên tài liệu!');
      return;
    }

    onAddDocument(formData);
    handleClearSelectedFile();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Thêm Hồ Sơ / Tài Liệu / Sản Phẩm Nghiệm Thu
          </h3>
          <button
            type="button"
            onClick={() => {
              onClose();
              handleClearSelectedFile();
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Dự Án Áp Dụng</label>
            <input
              type="text"
              disabled
              value={`[${projectCode}] ${projectName}`}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chọn Tệp Từ Máy Tính (Import Local File)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.zip,.rar,.png,.jpg,.jpeg,.txt"
            />

            {!uploadedFileName ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                  isDraggingFile
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-blue-50/30'
                }`}
              >
                <div className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Kéo & thả tệp từ máy tính vào đây, hoặc{' '}
                    <span className="text-blue-600 dark:text-blue-400 underline font-extrabold hover:text-blue-700">
                      chọn tệp từ máy tính
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ: PDF, Word (DOCX), Excel (XLSX), DWG, ZIP, Ảnh (PNG, JPG)
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white block truncate text-xs">
                      {uploadedFileName}
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Đã nạp tệp từ máy tính • Dung lượng: {formData.size}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    Đổi tệp
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelectedFile}
                    className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Hủy chọn tệp"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Hồ Sơ / Tài Liệu Hiển Thị *</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Bien_Ban_Nghiem_Thu_UAT_Phase2.pdf"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phân Loại Hồ Sơ</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProjectDocument['category'] })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="DELIVERABLE">DELIVERABLE (Sản phẩm nghiệm thu)</option>
                <option value="CONTRACT">CONTRACT (Hợp đồng & Phụ lục)</option>
                <option value="CHARTER">CHARTER (Điều lệ dự án)</option>
                <option value="DESIGN_SPEC">DESIGN SPEC (Bản vẽ / Thiết kế)</option>
                <option value="UAT_REPORT">UAT REPORT (Biên bản kiểm thử)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Dung Lượng Tệp</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Người Tải Lên / Ký Duyệt</label>
              <input
                type="text"
                value={formData.uploadedBy}
                onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Trạng Thái Ban Đầu</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectDocument['status'] })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="APPROVED">APPROVED (Đã duyệt)</option>
                <option value="DRAFT">DRAFT (Bản nháp)</option>
                <option value="ARCHIVED">ARCHIVED (Lưu trữ)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                handleClearSelectedFile();
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer active:scale-95"
            >
              Lưu & Lưu Trữ Hồ Sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
