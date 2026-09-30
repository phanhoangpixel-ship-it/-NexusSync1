import React, { useState } from 'react';
import { FileCode, Upload, CheckCircle2, AlertTriangle, X, ArrowRight, Building, Hash, Calendar, DollarSign, RefreshCw, FileText } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyFormatter';

interface M08EInvoiceXmlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (parsedInvoice: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M08EInvoiceXmlImportModal: React.FC<M08EInvoiceXmlImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  onNotify
}) => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<any | null>(null);

  if (!isOpen) return null;

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <DLHDon Id="HD001">
    <TTChung>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>C26TAA</KHHDon>
      <SHDon>0008924</SHDon>
      <NLap>2026-09-27</NLap>
      <DVTTe>VND</DVTTe>
      <TGia>1.0</TGia>
    </TTChung>
    <NDHDon>
      <NBan>
        <Ten>CÔNG TY TNHH LINH KIỆN ĐIỆN TỬ VÀ VI MẠCH VIỆT SƠN</Ten>
        <MST>0314892345</MST>
        <DChi>Lô E2a-7, Đường D1, Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh</DChi>
      </NBan>
      <NMua>
        <Ten>TẬP ĐOÀN CÔNG NGHỆ NEXUSSYNC ERP VIỆT NAM</Ten>
        <MST>0109887766</MST>
        <DChi>Tòa nhà Nexus Tower, Cầu Giấy, Hà Nội</DChi>
      </NMua>
      <DSHHDVu>
        <HHDVu>
          <STT>1</STT>
          <MHHDVu>CHIP-STM32-F407</MHHDVu>
          <THHDVu>Vi điều khiển STM32F407VGT6 ARM Cortex-M4 168MHz</THHDVu>
          <DVTinh>Cái</DVTinh>
          <SLuong>500</SLuong>
          <DGia>185000</DGia>
          <Tien>92500000</Tien>
          <TSuat>10%</TSuat>
        </HHDVu>
        <HHDVu>
          <STT>2</STT>
          <MHHDVu>IC-POWER-LM2596</MHHDVu>
          <THHDVu>IC nguồn hạ áp LM2596S-5.0 TO-263</THHDVu>
          <DVTinh>Cái</DVTinh>
          <SLuong>1000</SLuong>
          <DGia>24000</DGia>
          <Tien>24000000</Tien>
          <TSuat>10%</TSuat>
        </HHDVu>
      </DSHHDVu>
      <TTTToan>
        <TgTCThue>116500000</TgTCThue>
        <TgTThue>11650000</TgTThue>
        <TgTTTBThue>128150000</TgTTTBThue>
      </TTTToan>
    </NDHDon>
  </DLHDon>
</HDon>`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
      parseXml(content);
    };
    reader.readAsText(file);
  };

  const parseXml = (xmlStr: string) => {
    setIsParsing(true);
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlStr, 'text/xml');
      
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Cấu trúc file XML không hợp lệ theo chuẩn Tổng Cục Thuế.');
      }

      const invoiceCode = doc.querySelector('KHHDon')?.textContent || 'C26TXX';
      const invoiceNo = doc.querySelector('SHDon')?.textContent || '0000001';
      const issueDate = doc.querySelector('NLap')?.textContent || new Date().toISOString().split('T')[0];
      const sellerName = doc.querySelector('NBan > Ten')?.textContent || 'Nhà Cung Cấp Mẫu';
      const sellerTaxCode = doc.querySelector('NBan > MST')?.textContent || '0310000000';
      const sellerAddress = doc.querySelector('NBan > DChi')?.textContent || '';
      
      const totalAmountBeforeTax = parseFloat(doc.querySelector('TgTCThue')?.textContent || '0');
      const totalVat = parseFloat(doc.querySelector('TgTThue')?.textContent || '0');
      const totalAmountWithTax = parseFloat(doc.querySelector('TgTTTBThue')?.textContent || '0');

      const items: any[] = [];
      const itemNodes = doc.querySelectorAll('DSHHDVu > HHDVu');
      itemNodes.forEach((node, idx) => {
        items.push({
          stt: idx + 1,
          sku: node.querySelector('MHHDVu')?.textContent || `SKU-${idx + 1}`,
          name: node.querySelector('THHDVu')?.textContent || 'Vật tư linh kiện',
          uom: node.querySelector('DVTinh')?.textContent || 'Cái',
          quantity: parseFloat(node.querySelector('SLuong')?.textContent || '1'),
          unitPrice: parseFloat(node.querySelector('DGia')?.textContent || '0'),
          totalAmount: parseFloat(node.querySelector('Tien')?.textContent || '0'),
          vatRate: node.querySelector('TSuat')?.textContent || '10%'
        });
      });

      const result = {
        invoiceCode,
        invoiceNo,
        issueDate,
        sellerName,
        sellerTaxCode,
        sellerAddress,
        totalAmountBeforeTax: totalAmountBeforeTax || items.reduce((s, i) => s + i.totalAmount, 0),
        totalVat: totalVat || (items.reduce((s, i) => s + i.totalAmount, 0) * 0.1),
        totalAmountWithTax: totalAmountWithTax || (items.reduce((s, i) => s + i.totalAmount, 0) * 1.1),
        items
      };

      setParsedData(result);
      onNotify('success', 'Bóc Tách Thành Công', `Đã nhận diện Hóa đơn điện tử số ${invoiceNo} từ ${sellerName}`);
    } catch (err: any) {
      onNotify('danger', 'Lỗi Bóc Tách XML', err.message || 'Không thể đọc dữ liệu hóa đơn điện tử.');
      setParsedData(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyToPo = () => {
    if (!parsedData) return;
    onImportSuccess(parsedData);
    onNotify('success', 'Đã Áp Dụng Dữ Liệu', 'Dữ liệu hóa đơn XML đã được nạp thành công vào phiên làm việc.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Bóc Tách Hóa Đơn Điện Tử Đầu Vào (XML / e-Invoice Ingestion)</h3>
              <p className="text-[11px] text-slate-300">Chuẩn Tổng Cục Thuế Thông tư 78/2021 & Nghị định 123/2020/NĐ-CP</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Upload & Sample Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
              <Upload className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-800 dark:text-slate-200">Tải Lên File Hóa Đơn .XML</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Hỗ trợ file XML chuẩn cơ quan Thuế từ mọi nhà cung cấp</span>
              <input type="file" accept=".xml,text/xml" className="hidden" onChange={handleFileUpload} />
            </label>

            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Thử Nghiệm Mẫu Hóa Đơn XML</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Tự động điền dữ liệu XML mẫu thực tế để kiểm tra tính năng bóc tách.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setXmlContent(sampleXml);
                  parseXml(sampleXml);
                }}
                className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                Nạp XML Mẫu Vi Mạch Việt Sơn
              </button>
            </div>
          </div>

          {/* Parsed Result Display */}
          {parsedData && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-slate-900 dark:text-slate-100">Thông Tin Hóa Đơn Nhận Diện</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Ký Hiệu: {parsedData.invoiceCode} • Số: {parsedData.invoiceNo}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Đơn Vị Bán (Nhà Cung Cấp):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{parsedData.sellerName}</span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">MST: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{parsedData.sellerTaxCode}</strong></span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Ngày Lập Hóa Đơn:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{parsedData.issueDate}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Địa chỉ: {parsedData.sellerAddress}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 w-10 text-center">STT</th>
                      <th className="p-2.5">Mã SKU</th>
                      <th className="p-2.5">Tên Hàng Hóa / Dịch Vụ</th>
                      <th className="p-2.5 text-center">ĐVT</th>
                      <th className="p-2.5 text-right">Số Lượng</th>
                      <th className="p-2.5 text-right">Đơn Giá</th>
                      <th className="p-2.5 text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedData.items.map((item: any) => (
                      <tr key={item.stt} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 text-center font-mono text-slate-500">{item.stt}</td>
                        <td className="p-2.5 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{item.sku}</td>
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                        <td className="p-2.5 text-center text-slate-600 dark:text-slate-400">{item.uom}</td>
                        <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">{item.quantity.toLocaleString('vi-VN')}</td>
                        <td className="p-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">{formatCurrency(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 font-semibold">
                    <tr>
                      <td colSpan={6} className="p-2.5 text-right text-slate-600 dark:text-slate-400">Cộng tiền hàng chưa thuế:</td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">{formatCurrency(parsedData.totalAmountBeforeTax)}</td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="p-2.5 text-right text-slate-600 dark:text-slate-400">Tiền thuế GTGT (10%):</td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">{formatCurrency(parsedData.totalVat)}</td>
                    </tr>
                    <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200">
                      <td colSpan={6} className="p-2.5 text-right font-bold text-xs">Tổng cộng thanh toán:</td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-bold text-xs text-indigo-700 dark:text-indigo-300">{formatCurrency(parsedData.totalAmountWithTax)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors"
          >
            Đóng
          </button>
          
          <button
            type="button"
            disabled={!parsedData || isParsing}
            onClick={handleApplyToPo}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Nạp Vào Đơn Mua Hàng / Đối Soát AP
          </button>
        </div>
      </div>
    </div>
  );
};
