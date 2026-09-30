import React, { useState } from 'react';
import { FileSpreadsheet, Download, CheckCircle2, FileCode, X, Calendar, DollarSign, Building, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyFormatter';

interface M30VatDeclarationXmlExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M30VatDeclarationXmlExportModal: React.FC<M30VatDeclarationXmlExportModalProps> = ({
  isOpen,
  onClose,
  onNotify
}) => {
  if (!isOpen) return null;

  const [period, setPeriod] = useState<string>('Q3-2026');
  const [taxMethod, setTaxMethod] = useState<'KHẤU TRỪ' | 'TRỰC TIẾP'>('KHẤU TRỪ');
  
  // Indicators from TT 80/2021/TT-BTC
  const [vatData, setVatData] = useState({
    ct22: 45000000,    // Thuế GTGT còn được khấu trừ kỳ trước chuyển sang
    ct23: 1250000000,  // Giá trị hàng hóa dịch vụ mua vào
    ct24: 125000000,   // Thuế GTGT của HHDV mua vào
    ct25: 125000000,   // Thuế GTGT mua vào được khấu trừ kỳ này
    ct26: 0,           // HHDV bán ra không chịu thuế
    ct29: 0,           // HHDV bán ra chịu thuế 0%
    ct30: 320000000,   // HHDV bán ra chịu thuế 5%
    ct31: 16000000,    // Thuế GTGT của HHDV chịu thuế 5%
    ct32: 2450000000,  // HHDV bán ra chịu thuế 10%
    ct33: 245000000,   // Thuế GTGT của HHDV chịu thuế 10%
  });

  // Calculate summary fields
  const totalSalesRevenue = vatData.ct26 + vatData.ct29 + vatData.ct30 + vatData.ct32;
  const totalOutputVat = vatData.ct31 + vatData.ct33;
  const netVatPayable = Math.max(0, totalOutputVat - vatData.ct25 - vatData.ct22);
  const netVatCarriedForward = Math.max(0, (vatData.ct25 + vatData.ct22) - totalOutputVat);

  const handleExportXml = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<HSoThueDTu xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue">
  <HSoKhaiThue>
    <TTinChung>
      <TTinTKhaiThue>
        <TKhai>01/GTGT</TKhai>
        <MaTKhai>01/GTGT</MaTKhai>
        <TenTKhai>TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (Mẫu 01/GTGT)</TenTKhai>
        <MauTKhaiXML>TT80_2021</MauTKhaiXML>
        <KyKKhaiThue>${period}</KyKKhaiThue>
        <LoaiTKhai>C</LoaiTKhai>
        <NgayLapTKhai>${new Date().toISOString().split('T')[0]}</NgayLapTKhai>
        <NguoiKy>TỔNG GIÁM ĐỐC / KẾ TOÁN TRƯỞNG</NguoiKy>
      </TTinTKhaiThue>
      <NNT>
        <MST>0109887766</MST>
        <TenNNT>TẬP ĐOÀN CÔNG NGHỆ NEXUSSYNC ERP VIỆT NAM</TenNNT>
        <DChiNNT>Tòa nhà Nexus Tower, Cầu Giấy, Hà Nội</DChiNNT>
        <CQTThueQuanLy>Cục Thuế Thành phố Hà Nội</CQTThueQuanLy>
      </NNT>
    </TTinChung>
    <CTieuTKhaiChinh>
      <ct21>0</ct21>
      <ct22>${vatData.ct22}</ct22>
      <ct23>${vatData.ct23}</ct23>
      <ct24>${vatData.ct24}</ct24>
      <ct25>${vatData.ct25}</ct25>
      <ct26>${vatData.ct26}</ct26>
      <ct27>${totalSalesRevenue}</ct27>
      <ct28>${totalOutputVat}</ct28>
      <ct29>${vatData.ct29}</ct29>
      <ct30>${vatData.ct30}</ct30>
      <ct31>${vatData.ct31}</ct31>
      <ct32>${vatData.ct32}</ct32>
      <ct33>${vatData.ct33}</ct33>
      <ct34>${totalSalesRevenue}</ct34>
      <ct35>${totalOutputVat}</ct35>
      <ct36>${totalOutputVat}</ct36>
      <ct40>${netVatPayable}</ct40>
      <ct43>${netVatCarriedForward}</ct43>
    </CTieuTKhaiChinh>
  </HSoKhaiThue>
</HSoThueDTu>`;

    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TK_01_GTGT_TT80_${period.replace('-', '_')}_${Date.now()}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onNotify('success', 'Kết Xuất XML Thành Công', `Đã tạo file tờ khai XML chuẩn nộp thuế điện tử cho kỳ ${period}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Kết Xuất Tờ Khai Thuế GTGT XML (HTKK / Tổng Cục Thuế)</h3>
              <p className="text-[11px] text-slate-300">Mẫu 01/GTGT theo Thông tư 80/2021/TT-BTC & Nghị định 126/2020/NĐ-CP</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Kỳ Kê Khai Thuế</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="Q3-2026">Quý 3 Năm 2026</option>
                <option value="Q2-2026">Quý 2 Năm 2026</option>
                <option value="T09-2026">Tháng 09 Năm 2026</option>
                <option value="T08-2026">Tháng 08 Năm 2026</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Phương Pháp Tính Thuế</label>
              <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600 dark:text-indigo-400">
                Phương Pháp Khấu Trừ (100% Tuân Thủ)
              </div>
            </div>
          </div>

          {/* Indicators Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 w-16 text-center">Chỉ Tiêu</th>
                  <th className="p-2.5">Nội Dung Nghiệp Vụ Kê Khai</th>
                  <th className="p-2.5 text-right">Giá Trị (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">[22]</td>
                  <td className="p-2">Thuế GTGT còn được khấu trừ kỳ trước chuyển sang</td>
                  <td className="p-2 text-right font-mono tabular-nums font-semibold">{formatCurrency(vatData.ct22)}</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">[23]</td>
                  <td className="p-2">Giá trị hàng hóa, dịch vụ mua vào trong kỳ</td>
                  <td className="p-2 text-right font-mono tabular-nums font-semibold">{formatCurrency(vatData.ct23)}</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">[24]</td>
                  <td className="p-2">Thuế GTGT của hàng hóa, dịch vụ mua vào</td>
                  <td className="p-2 text-right font-mono tabular-nums font-semibold">{formatCurrency(vatData.ct24)}</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <td className="p-2 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">[25]</td>
                  <td className="p-2 font-medium">Tổng thuế GTGT mua vào được khấu trừ kỳ này</td>
                  <td className="p-2 text-right font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(vatData.ct25)}</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">[34]</td>
                  <td className="p-2">Tổng doanh thu hàng hóa, dịch vụ bán ra</td>
                  <td className="p-2 text-right font-mono tabular-nums font-semibold">{formatCurrency(totalSalesRevenue)}</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">[35]</td>
                  <td className="p-2 font-medium">Tổng thuế GTGT của hàng hóa, dịch vụ bán ra</td>
                  <td className="p-2 text-right font-mono tabular-nums font-bold">{formatCurrency(totalOutputVat)}</td>
                </tr>
                <tr className="bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800 font-bold">
                  <td className="p-2.5 text-center font-mono text-emerald-700 dark:text-emerald-300">[40]</td>
                  <td className="p-2.5 text-emerald-800 dark:text-emerald-200">Thuế GTGT còn phải nộp vào Ngân sách Nhà nước</td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-300">{formatCurrency(netVatPayable)}</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/40 font-bold">
                  <td className="p-2.5 text-center font-mono text-blue-700 dark:text-blue-300">[43]</td>
                  <td className="p-2.5 text-blue-800 dark:text-blue-200">Thuế GTGT chưa khấu trừ hết còn được chuyển kỳ sau</td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-blue-700 dark:text-blue-300">{formatCurrency(netVatCarriedForward)}</td>
                </tr>
              </tbody>
            </table>
          </div>
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
            onClick={handleExportXml}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Tải File Tờ Khai XML Nộp HTKK
          </button>
        </div>
      </div>
    </div>
  );
};
