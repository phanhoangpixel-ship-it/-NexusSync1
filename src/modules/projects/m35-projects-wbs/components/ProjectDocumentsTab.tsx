import React from 'react';
import { FileText, Plus, Download, Eye, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { ProjectDocument } from '../../../../types/m35Types';

interface ProjectDocumentsTabProps {
  documents: ProjectDocument[];
  onOpenAddModal: () => void;
  onDownloadDoc: (doc: ProjectDocument) => void;
  onPreviewDoc: (doc: ProjectDocument) => void;
}

export const ProjectDocumentsTab: React.FC<ProjectDocumentsTabProps> = ({
  documents,
  onOpenAddModal,
  onDownloadDoc,
  onPreviewDoc,
}) => {
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'CONTRACT':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'CHARTER':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'DESIGN_SPEC':
        return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'UAT_REPORT':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            09. Hồ Sơ Tài Liệu &amp; Sản Phẩm Bàn Giao (DMS Dossier &amp; Deliverables)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quản trị lưu trữ hợp đồng, thiết kế, biên bản nghiệm thu và tài liệu kỹ thuật liên kết hệ thống DMS (M29).
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tải Lên Tài Liệu
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">Tên Hồ Sơ / Tài Liệu</th>
              <th className="py-2.5 px-3">Phân Loại</th>
              <th className="py-2.5 px-3">Người Tải Lên</th>
              <th className="py-2.5 px-3">Ngày Tải Lên</th>
              <th className="py-2.5 px-3">Dung Lượng</th>
              <th className="py-2.5 px-3 text-center">Trạng Thái</th>
              <th className="py-2.5 px-3 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition">
                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate max-w-sm">{doc.name}</span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getCategoryBadge(doc.category)}`}>
                    {doc.category}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{doc.uploadedBy}</td>
                <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{doc.uploadedAt}</td>
                <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{doc.size}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {doc.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onPreviewDoc(doc)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                      title="Xem trước tài liệu"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadDoc(doc)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg transition cursor-pointer"
                      title="Tải xuống tệp tin"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
