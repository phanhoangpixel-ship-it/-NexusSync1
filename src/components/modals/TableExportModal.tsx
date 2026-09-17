import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  X,
  FileText,
  Table as TableIcon,
  RefreshCw,
  Info,
  Layers,
  Sparkles,
  Database,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  scanTablesInDOM,
  ScannedTableData,
  ExportMetadata,
  downloadExcelFile,
  generateCsvContent,
  generateTsvContent,
  downloadTextFile,
} from '../../utils/excelExporter';

interface TableExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule: {
    moduleId: string;
    code: string;
    moduleName: string;
    domain: string;
  };
  currentUser: {
    username: string;
    role: string;
    department: string;
  };
  currentBranchName?: string;
  onNotify?: (type: 'info' | 'success' | 'warning' | 'danger', title: string, message: string) => void;
}

export const TableExportModal: React.FC<TableExportModalProps> = ({
  isOpen,
  onClose,
  currentModule,
  currentUser,
  currentBranchName = 'Tổng công ty',
  onNotify,
}) => {
  const [tables, setTables] = useState<ScannedTableData[]>([]);
  const [selectedTableIndex, setSelectedTableIndex] = useState<number>(0);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'tsv' | 'json'>('xlsx');
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Scan tables when modal opens
  useEffect(() => {
    if (isOpen) {
      handleScan();
    }
  }, [isOpen, currentModule.moduleId]);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const detected = scanTablesInDOM();
      setTables(detected);
      setSelectedTableIndex(0);
      setIsScanning(false);

      // Generate default file name
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '');
      const baseName = `NexusSync_${currentModule.code || currentModule.moduleId}_${dateStr}_${timeStr}`;
      setCustomFileName(baseName);
    }, 150);
  };

  if (!isOpen) return null;

  const currentTable = tables[selectedTableIndex];
  const metadata: ExportMetadata = {
    workspaceCode: currentModule.code,
    workspaceName: currentModule.moduleName,
    branchName: currentBranchName,
    userName: `${currentUser.username} (${currentUser.role})`,
    exportDate: new Date().toLocaleString('vi-VN'),
  };

  const handleDownload = () => {
    if (tables.length === 0) {
      if (onNotify) {
        onNotify('warning', 'Không có bảng dữ liệu', 'Không tìm thấy bảng dữ liệu trực quan trong không gian làm việc hiện tại.');
      }
      return;
    }

    const baseName = customFileName.trim() || `NexusSync_${currentModule.code}_Export`;

    try {
      if (exportFormat === 'xlsx') {
        // Export selected table or all tables
        const tablesToExport = selectedTableIndex === -1 ? tables : [currentTable];
        downloadExcelFile(tablesToExport, `${baseName}.xlsx`, includeMetadata ? metadata : undefined);
        if (onNotify) {
          onNotify(
            'success',
            'Xuất Excel thành công',
            `Đã tải xuống tệp Microsoft Excel [${baseName}.xlsx] chứa ${tablesToExport.length} bảng dữ liệu.`
          );
        }
      } else if (exportFormat === 'csv') {
        const tableToExport = currentTable || tables[0];
        const csvContent = generateCsvContent(tableToExport, includeMetadata ? metadata : undefined);
        downloadTextFile(csvContent, `${baseName}.csv`, 'text/csv;charset=utf-8;');
        if (onNotify) {
          onNotify('success', 'Xuất CSV thành công', `Đã tải xuống tệp CSV UTF-8 [${baseName}.csv] với ${tableToExport.totalRows} dòng.`);
        }
      } else if (exportFormat === 'tsv') {
        const tableToExport = currentTable || tables[0];
        const tsvContent = generateTsvContent(tableToExport);
        downloadTextFile(tsvContent, `${baseName}.tsv`, 'text/tab-separated-values;charset=utf-8;');
        if (onNotify) {
          onNotify('success', 'Xuất TSV thành công', `Đã tải xuống tệp TSV [${baseName}.tsv].`);
        }
      } else if (exportFormat === 'json') {
        const tableToExport = currentTable || tables[0];
        const jsonData = {
          metadata: includeMetadata ? metadata : undefined,
          table: {
            title: tableToExport.title,
            headers: tableToExport.headers,
            totalRows: tableToExport.totalRows,
            data: tableToExport.rows.map((row) => {
              const rowObj: Record<string, string | number> = {};
              tableToExport.headers.forEach((h, i) => {
                rowObj[h] = row[i] ?? '';
              });
              return rowObj;
            }),
          },
        };
        downloadTextFile(JSON.stringify(jsonData, null, 2), `${baseName}.json`, 'application/json;charset=utf-8;');
        if (onNotify) {
          onNotify('success', 'Xuất JSON thành công', `Đã tải xuống tệp JSON [${baseName}.json].`);
        }
      }
      onClose();
    } catch (err: any) {
      if (onNotify) {
        onNotify('danger', 'Lỗi xuất tệp', err.message || 'Không thể tạo tệp xuất dữ liệu.');
      }
    }
  };

  const handleCopyToClipboard = () => {
    if (!currentTable && tables.length === 0) return;
    const tableToExport = currentTable || tables[0];
    const tsvContent = generateTsvContent(tableToExport);

    navigator.clipboard
      .writeText(tsvContent)
      .then(() => {
        setCopied(true);
        if (onNotify) {
          onNotify('success', 'Đã sao chép vào Clipboard', 'Dữ liệu dạng bảng đã sẵn sàng để dán trực tiếp (Ctrl+V) vào Microsoft Excel hoặc Google Sheets.');
        }
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        if (onNotify) onNotify('danger', 'Lỗi sao chép', 'Không thể truy cập clipboard.');
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                  Data Export Engine
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  [{currentModule.code}] {currentModule.moduleName}
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Xuất Bảng Dữ Liệu Ra Tệp CSV / Excel
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* Top Info Banner */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                <TableIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Phát hiện <span className="text-blue-600 font-mono">{tables.length}</span> bảng dữ liệu đang hiển thị trong Workspace
                </p>
                <p className="text-[11px] text-slate-500">
                  Hỗ trợ font UTF-8 tiếng Việt hoàn chỉnh, tương thích 100% Microsoft Excel, Google Sheets, LibreOffice.
                </p>
              </div>
            </div>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-600' : ''}`} />
              <span>Quét lại màn hình</span>
            </button>
          </div>

          {tables.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
              <Info className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Chưa phát hiện bảng dữ liệu HTML nào trong không gian này</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hãy mở một phân hệ con hoặc tab có danh sách dữ liệu (như Số dư kho, Đơn hàng, Chứng từ kế toán, Nhân viên...) rồi bấm <strong>Quét lại màn hình</strong>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Configuration */}
              <div className="lg:col-span-1 space-y-4">
                {/* Table Selection */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">Chọn Bảng Dữ Liệu:</label>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {tables.map((t, idx) => (
                      <button
                        key={t.id + idx}
                        onClick={() => setSelectedTableIndex(idx)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between ${
                          selectedTableIndex === idx
                            ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate leading-tight font-medium text-slate-800">{t.title}</p>
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5 font-normal">
                            {t.totalRows} dòng • {t.totalColumns} cột
                          </p>
                        </div>
                        {selectedTableIndex === idx && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    ))}

                    {tables.length > 1 && (
                      <button
                        onClick={() => setSelectedTableIndex(-1)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between ${
                          selectedTableIndex === -1
                            ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">Xuất toàn bộ {tables.length} bảng</p>
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5">Tạo Multi-Sheet Workbook (.xlsx)</p>
                        </div>
                        {selectedTableIndex === -1 && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Export Format Selection */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">Định Dạng Tệp Xuất:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportFormat('xlsx')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                        exportFormat === 'xlsx'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs ring-1 ring-emerald-500'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <span>Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportFormat('csv')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                        exportFormat === 'csv'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>CSV (UTF-8)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportFormat('tsv')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                        exportFormat === 'tsv'
                          ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-2xs ring-1 ring-purple-500'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Database className="w-5 h-5 text-purple-600" />
                      <span>TSV Tab-Sep</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportFormat('json')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                        exportFormat === 'json'
                          ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-2xs ring-1 ring-amber-500'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-amber-600" />
                      <span>JSON Data</span>
                    </button>
                  </div>
                </div>

                {/* File Options */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Tên Tệp Tải Xuống:</label>
                    <input
                      type="text"
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="NexusSync_Report"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={includeMetadata}
                      onChange={(e) => setIncludeMetadata(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">
                      Bao gồm thông tin tiêu đề ERP (Người lập, ngày giờ, chi nhánh)
                    </span>
                  </label>
                </div>
              </div>

              {/* Right Column: Data Preview */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{currentTable ? currentTable.title : 'Xem Trước Dữ Liệu'}</span>
                        {currentTable && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px]">
                            {currentTable.totalRows} dòng • {currentTable.totalColumns} cột
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">Xem trước 5 bản ghi mẫu đầu tiên</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyToClipboard}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                      title="Sao chép toàn bộ bảng để dán vào Excel / Google Sheets"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Clipboard</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Preview Table Canvas */}
                  <div className="flex-1 overflow-x-auto mt-3 border border-slate-100 rounded-lg">
                    {currentTable ? (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200">
                            {currentTable.headers.map((h, i) => (
                              <th
                                key={i}
                                className="px-3 py-2 font-bold text-slate-700 text-[11px] uppercase tracking-wider whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentTable.rows.slice(0, 5).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                              {row.map((val, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="px-3 py-2 text-slate-700 font-mono text-[11px] whitespace-nowrap"
                                >
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-600 font-medium">
                        Chế độ xuất đa bảng được chọn. Tất cả các bảng sẽ được chia thành từng Sheet riêng biệt trong tệp Excel.
                      </div>
                    )}
                  </div>

                  {/* Metadata Stamp Footer */}
                  {includeMetadata && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10px] text-slate-600 font-mono gap-2 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>Chi nhánh: {currentBranchName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Thời gian: {new Date().toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-slate-500" />
                        <span>Người lập: {currentUser.username}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép bảng</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>
                Tải Xuống Tệp{' '}
                {exportFormat === 'xlsx'
                  ? 'Excel (.xlsx)'
                  : exportFormat === 'csv'
                  ? 'CSV (.csv)'
                  : exportFormat.toUpperCase()}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
