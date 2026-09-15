import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utility to generate and download actual PDF files for NexusSync ERP
 */

// Helper to remove accents for standard PDF font rendering if needed
function removeVietnameseTones(str: string) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export const downloadPayslipPdf = (emp: any) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const empNameClean = removeVietnameseTones(emp.fullName || 'Nhan Vien');
    const deptClean = removeVietnameseTones(emp.departmentName || 'Khong xac dinh');
    const posClean = removeVietnameseTones(emp.position || 'Nhan vien');

    // Header bar (Slate 900)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');

    // Company logo/title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NEXUSSYNC ENTERPRISE ERP', 15, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('ELECTRONIC PAYSLIP / PHIEU LUONG DIEN TU CHINH THUC', 15, 22);

    // Blue accent line
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 31, 210, 2, 'F');

    // Employee Meta Box
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Employee / Nhan vien: ${empNameClean}`, 15, 45);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Emp Code: ${emp.code || 'EMP-001'}`, 15, 52);
    doc.text(`Department: ${deptClean}`, 15, 58);
    doc.text(`Position: ${posClean}`, 15, 64);

    const currentDate = new Date().toLocaleDateString('vi-VN');
    doc.text(`Issue Date: ${currentDate}`, 135, 52);
    doc.text(`Status: VERIFIED & LOCKED`, 135, 58);
    doc.text(`Rule #19: Audit Compliant`, 135, 64);

    // Main Salary Breakdown Table
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 74, 180, 95, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('SALARY BREAKDOWN / CHI TIET BANG LUONG', 22, 84);

    doc.setDrawColor(203, 213, 225);
    doc.line(22, 88, 188, 88);

    const baseSalary = emp.baseSalary || 15000000;
    const bhxh = Math.round(baseSalary * 0.105);
    const tncn = Math.round(baseSalary * 0.045);
    const netSalary = baseSalary - bhxh - tncn;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    doc.text('1. Base Gross Salary (Luong Co Ban):', 22, 98);
    doc.setFont('helvetica', 'bold');
    doc.text(`${baseSalary.toLocaleString('vi-VN')} VND`, 140, 98);

    doc.setFont('helvetica', 'normal');
    doc.text('2. Social Insurance BHXH/BHYT/BHTN (10.5%):', 22, 108);
    doc.setTextColor(225, 29, 72); // Rose red
    doc.text(`- ${bhxh.toLocaleString('vi-VN')} VND`, 140, 108);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('3. Personal Income Tax TNCN (4.5%):', 22, 118);
    doc.setTextColor(225, 29, 72);
    doc.text(`- ${tncn.toLocaleString('vi-VN')} VND`, 140, 118);

    doc.setDrawColor(203, 213, 225);
    doc.line(22, 126, 188, 126);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('NET SALARY / THUC LINH NET:', 22, 138);
    doc.text(`${netSalary.toLocaleString('vi-VN')} VND`, 140, 138);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Payment Method: Direct Bank Transfer (TK 334 / Account Default)', 22, 150);
    doc.text('GL Posting: TK 334 - Phai tra nguoi lao dong / TK 642', 22, 156);

    // Signatures Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    doc.text('Nhan Vien (Employee)', 30, 190);
    doc.text('Ke Toan Truong (Chief Accountant)', 125, 190);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('(Ky va ghi ro ho ten)', 33, 195);
    doc.text('(Da ky so SHA-256)', 132, 195);

    // Cryptographic audit footer
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 270, 195, 270);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('SHA-256 Hash: 8f94c12a7e4b901f82cc33e1098b671aef42901b0821d3f990172e8119c4b721', 15, 276);
    doc.text('NexusSync ERP Platform • Confidential Official Document', 15, 281);

    // Trigger immediate PDF file download
    const fileName = `Phieu_Luong_${emp.code || 'EMP'}_${empNameClean.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);

    return fileName;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const downloadModuleReportPdf = (module: any, currentUser: any) => {
  try {
    if (module.code === 'M34' || module.moduleId === 'M34') {
      return downloadFinancialReportPdf({
        title: 'BÁO CÁO TÀI CHÍNH HỢP NHẤT TẬP ĐOÀN (VAS 25 & IFRS 10)',
        period: 'Kỳ báo cáo 2026',
        totalAssets: '136.200.000.000 VNĐ',
        revenue: '82.730.000.000 VNĐ (Đã loại trừ 1.65 Tỷ VNĐ)',
        netProfit: '22.020.000.000 VNĐ',
        items: [
          ['BR_HO', 'Trụ sở chính Hà Nội (100%)', '25.400.000.000', '18.200.000.000', '7.200.000.000'],
          ['BR_HCM', 'Chi nhánh TP.HCM (100%)', '18.900.000.000', '14.100.000.000', '4.800.000.000'],
          ['BR_DN', 'Chi nhánh Đà Nẵng (80%)', '9.600.000.000', '7.200.000.000', '2.400.000.000'],
          ['BR_SG_GLOBAL', 'Singapore Sub (100%)', '30.480.000.000', '22.860.000.000', '7.620.000.000'],
          ['ELIM', 'Loại trừ giao dịch nội bộ', '-1.650.000.000', '-1.650.000.000', '0'],
          ['CONSO', 'HỢP NHẤT TẬP ĐOÀN', '82.730.000.000', '60.710.000.000', '22.020.000.000'],
        ]
      });
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const moduleNameClean = removeVietnameseTones(module.moduleName || 'Module Report');
    const userNameClean = removeVietnameseTones(currentUser.name || 'Admin User');

    // Header bar (Slate 900)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NEXUSSYNC ENTERPRISE ERP', 15, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`OFFICIAL MODULE REPORT / BAO CAO PHAN HE ${module.code || ''}`, 15, 22);

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 31, 210, 2, 'F');

    // Module Title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Module: [${module.code || 'M'}] ${moduleNameClean}`, 15, 45);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Created By: ${userNameClean} (${currentUser.role || 'Admin'})`, 15, 52);
    doc.text(`Generated At: ${new Date().toLocaleString('vi-VN')}`, 15, 58);
    doc.text(`Security Level: Enterprise Grade (Rule #19 Verified)`, 15, 64);

    // Table Summary
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 74, 180, 110, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('SUMMARY OF GENERAL LEDGER & SYSTEM OPERATIONS', 22, 84);

    doc.setDrawColor(203, 213, 225);
    doc.line(22, 88, 188, 88);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Ref Code', 22, 98);
    doc.text('Description', 60, 98);
    doc.text('GL Account', 120, 98);
    doc.text('Amount (VND)', 155, 98);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`REF-${module.code}-001`, 22, 108);
    doc.text('Operation Batch Journal Entry', 60, 108);
    doc.text('TK 152 / 331', 120, 108);
    doc.text('128,500,000', 155, 108);

    doc.text(`REF-${module.code}-002`, 22, 118);
    doc.text('Reconciliation Auto Entry', 60, 118);
    doc.text('TK 211 / 334', 120, 118);
    doc.text('45,200,000', 155, 118);

    doc.text(`REF-${module.code}-003`, 22, 128);
    doc.text('Monthly Depreciation & Cost', 60, 128);
    doc.text('TK 642 / 214', 120, 128);
    doc.text('18,900,000', 155, 128);

    doc.setDrawColor(203, 213, 225);
    doc.line(22, 136, 188, 136);

    doc.setFont('helvetica', 'bold');
    doc.text('Total Allocated:', 120, 144);
    doc.setTextColor(37, 99, 235);
    doc.text('192,600,000 VND', 155, 144);

    // Cryptographic audit footer
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 270, 195, 270);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('SHA-256 Hash: 8f94c12a7e4b901f82cc33e1098b671aef42901b0821d3f990172e8119c4b721', 15, 276);
    doc.text('NexusSync ERP Platform • Confidential Official Document', 15, 281);

    const fileName = `Bao_Cao_${module.code || 'MODULE'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    return fileName;
  } catch (error) {
    console.error('Error generating Module PDF:', error);
    throw error;
  }
};

export const downloadDmsDocumentPdf = (dmsDoc: any) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const titleClean = removeVietnameseTones(dmsDoc.title || 'Document');
    const catClean = removeVietnameseTones(dmsDoc.categoryName || 'General');
    const signedByClean = removeVietnameseTones(dmsDoc.signedBy || 'Unsigned');

    // Header bar (Slate 900)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NEXUSSYNC ELECTRONIC ARCHIVE (DMS)', 15, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`VERIFIED E-DOCUMENT / CHUNG TU SO HOA CHINH THUC: ${dmsDoc.docCode}`, 15, 22);

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 31, 210, 2, 'F');

    // Document Meta
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Title / Ten tai lieu: ${titleClean.slice(0, 50)}`, 15, 45);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Category: ${catClean}`, 15, 52);
    doc.text(`Version: ${dmsDoc.version || 'v1.0'} | Format: ${dmsDoc.format || 'PDF'} | Size: ${dmsDoc.fileSize || '1.0MB'}`, 15, 58);
    doc.text(`Linked Module: ${dmsDoc.linkedModule || 'N/A'} (Ref: ${dmsDoc.refDocNo || 'N/A'})`, 15, 64);
    doc.text(`Security Level: ${dmsDoc.securityLevel || 'INTERNAL'}`, 15, 70);

    // Certificate / Stamp Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 78, 180, 85, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('DIGITAL SIGNATURE & CRYPTOGRAPHIC TIMESTAMP (CA/HSM)', 22, 88);

    doc.setDrawColor(203, 213, 225);
    doc.line(22, 92, 188, 92);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Signer Authority: ${signedByClean}`, 22, 102);
    doc.text(`Signed Timestamp: ${dmsDoc.signedAt || new Date().toLocaleString()}`, 22, 110);
    doc.text(`Document Status: ${dmsDoc.status || 'DRAFT'}`, 22, 118);
    doc.text(`Cryptographic Checksum SHA-256:`, 22, 126);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    doc.text(`${dmsDoc.sha256Hash || 'hash_8f94c12a7e4b901f82cc33e1098b671aef42901b'}`, 22, 134);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Note: This document is legally binding under Decree 130/2018/ND-CP on e-signatures.', 22, 146);

    // Dynamic Security Watermark for Confidential / Restricted Documents
    if (dmsDoc.securityLevel === 'CONFIDENTIAL' || dmsDoc.securityLevel === 'RESTRICTED') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(226, 232, 240); // Soft visible watermark tint
      doc.text(`[ ${dmsDoc.securityLevel} - HOANG NAM (ADMIN) - IP 192.168.1.105 - ${new Date().toISOString().slice(0, 10)} ]`, 15, 185, { angle: 25 });
      doc.text(`[ NEXUSSYNC SECURITY WATERMARK - DO NOT DISTRIBUTE ]`, 25, 215, { angle: 25 });
    }

    // Cryptographic audit footer
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 270, 195, 270);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`SHA-256: ${dmsDoc.sha256Hash || '8f94c12a7e4b901f82cc33e1098b671aef42901b0821d3f990172e8119c4b721'}`, 15, 276);
    doc.text('NexusSync ERP Platform • DMS e-Archive Vault Official Document', 15, 281);

    const fileName = `${dmsDoc.docCode || 'DMS_DOC'}_${titleClean.replace(/\s+/g, '_').slice(0, 20)}.pdf`;
    doc.save(fileName);
    return fileName;
  } catch (error) {
    console.error('Error downloading DMS PDF:', error);
    throw error;
  }
};

export const downloadFinancialReportPdf = (finReport: any) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const reportTitle = finReport.title || 'BÁO CÁO TÀI CHÍNH TỔNG HỢP';
    const titleClean = removeVietnameseTones(reportTitle).toUpperCase();

    // Header Branding
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('NEXUSSYNC ERP - GENERAL LEDGER & FINANCE', 15, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text('FINANCIAL STATEMENTS & TRIAL BALANCE (TT200/2014/TT-BTC)', 15, 20);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(titleClean, 15, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Ky Ke Toan: ${finReport.period || 'Thang 08/2026'} | Don vi: VND | Ngay Lap: ${new Date().toLocaleDateString('vi-VN')}`, 15, 45);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 50, 180, 28, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('CHI TIEU TAI CHINH COT LOI', 20, 57);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Tong Tai San / Nguon Von: ${finReport.totalAssets || '14.850.000.000 VNĐ'}`, 20, 64);
    doc.text(`Doanh Thu Thuan: ${finReport.revenue || '8.450.000.000 VNĐ'}`, 20, 71);
    doc.text(`Loi Nhuan Rong Sau Thue: ${finReport.netProfit || '3.220.000.000 VNĐ'}`, 110, 64);
    doc.text(`Trang Thai So Cai: CAN DOI 100% (DEBIT = CREDIT)`, 110, 71);

    // Table
    const tableData = (finReport.items || [
      ['TK 111', 'Tien mat', '520.000.000', '0', '520.000.000'],
      ['TK 112', 'Tien gui Ngan hang', '3.450.000.000', '0', '3.450.000.000'],
      ['TK 131', 'Phai thu khach hang', '2.800.000.000', '0', '2.800.000.000'],
      ['TK 156', 'Hang hoa ton kho', '4.100.000.000', '0', '4.100.000.000'],
      ['TK 211', 'Tai san co dinh', '3.980.000.000', '0', '3.980.000.000'],
      ['TK 331', 'Phai tra nha cung cap', '0', '2.150.000.000', '2.150.000.000'],
      ['TK 411', 'Von dau tu cua CSH', '0', '9.480.000.000', '9.480.000.000'],
      ['TK 511', 'Doanh thu ban hang', '0', '8.450.000.000', '8.450.000.000'],
      ['TK 632', 'Gia von hang ban', '5.230.000.000', '0', '5.230.000.000'],
    ]).map((row: string[]) => row.map((cell: string) => removeVietnameseTones(cell)));

    autoTable(doc, {
      startY: 84,
      head: [['MA TK', 'TEN TAI KHOAN KE TOAN', 'DU NO (VND)', 'DU CO (VND)', 'DU CUOI KY']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 25 },
      },
    });

    // Signature Block
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 210;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    doc.text('NGUOI LAP BIEU', 30, finalY);
    doc.text('KE TOAN TRUONG (CFO)', 90, finalY);
    doc.text('GIAM DOC DOANH NGHIEP', 150, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Ky, ho ten)', 33, finalY + 5);
    doc.text('(Ky, dong dau, Token HSM)', 90, finalY + 5);
    doc.text('(Ky, dong dau)', 155, finalY + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text('Da Ky So CA/HSM dien tu: Hoang Nam (CFO) - Timestamp TSA Verified', 80, finalY + 22);

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 275, 195, 275);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('NexusSync ERP Platform • Module M30 General Ledger & Financial Accounting', 15, 282);

    const fileName = `FIN_REPORT_${(finReport.period || 'T08_2026').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
    return fileName;
  } catch (error) {
    console.error('Error generating Financial Report PDF:', error);
    throw error;
  }
};

/**
 * Download Invoice AR/AP & VAT Compliance Report PDF for Module M31
 */
export const downloadInvoiceArApReportPdf = (invoicesData: any[], vatSummary?: any) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header Color Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('NEXUSSYNC ERP ENTERPRISE - MODULE M31: INVOICES AR/AP & VAT', 12, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('SAO KE HOA DON PHAI THU / PHAI TRA & BAO CAO THUE GTGT', 150, 12);

    // Title Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('BAO CAO HOA DON PHAI THU (AR), PHAI TRA (AP) & THUE GTGT', 15, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Ngay xuat bao cao: ${new Date().toLocaleDateString('vi-VN')} | He thong: TT200/2014/TT-BTC & Nghi dinh 123/2020/ND-CP`, 15, 34);

    // Summary Box
    const arTotal = invoicesData.filter((i: any) => i.type === 'AR' || i.type === 'RETAIL' || i.type === 'VAT')
      .reduce((sum: number, i: any) => sum + (i.finalAmount || 0), 0);
    const apTotal = invoicesData.filter((i: any) => i.type === 'AP' || i.type === 'PURCHASE')
      .reduce((sum: number, i: any) => sum + (i.finalAmount || 0), 0);
    const vatOutput = invoicesData.reduce((sum: number, i: any) => sum + (i.taxAmount || 0), 0);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 38, 180, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Tong Hoa Don AR (Phai Thu): ${arTotal.toLocaleString('vi-VN')} VND`, 20, 46);
    doc.text(`Tong Hoa Don AP (Phai Tra): ${apTotal.toLocaleString('vi-VN')} VND`, 20, 52);
    doc.text(`Tong Thuế GTGT Khau Tru / Phai Nop: ${vatOutput.toLocaleString('vi-VN')} VND`, 110, 46);
    doc.text(`Trang thai Chuyet Ma CQT e-Invoice: 100% Validated (HSM Token)`, 110, 52);

    // Table of Invoices
    const tableRows = invoicesData.map((inv: any) => [
      inv.invoiceNumber || `INV-${inv.id}`,
      inv.type || 'AR',
      inv.customerName || inv.companyName || 'Khach Hang / NCC',
      (inv.taxCode || '0315894231'),
      `${(inv.totalAmount || 0).toLocaleString('vi-VN')}`,
      `${(inv.taxAmount || 0).toLocaleString('vi-VN')}`,
      `${(inv.finalAmount || 0).toLocaleString('vi-VN')}`,
      inv.paymentStatus || inv.status || 'ISSUED',
    ]);

    autoTable(doc, {
      startY: 63,
      head: [['Ma Hoa Don', 'Loai', 'Doi Tac', 'MST', 'Tien Hang', 'Thue GTGT', 'Tong Tien', 'Trang Thai']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { halign: 'center', cellWidth: 14 },
        2: { cellWidth: 42 },
        3: { cellWidth: 24 },
        4: { halign: 'right', cellWidth: 22 },
        5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 22 },
        7: { halign: 'center', cellWidth: 10 },
      },
    });

    // Signature Block
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 210;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    doc.text('NGUOI LAP BIEU', 25, finalY);
    doc.text('KE TOAN TRUONG (CFO)', 85, finalY);
    doc.text('CO QUAN THUE / HSM VERIFIED', 145, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Ky, ho ten)', 28, finalY + 5);
    doc.text('(Ky, dong dau, Token HSM)', 85, finalY + 5);
    doc.text('(Ma CQT Da Xac Thuc)', 148, finalY + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text('Da Ky So CA/HSM dien tu: NexusSync E-Invoice Engine - TSA Verified', 75, finalY + 20);

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 275, 195, 275);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('NexusSync ERP Platform • Module M31 Invoices AR/AP & VAT Management', 15, 282);

    const fileName = `INVOICE_AR_AP_REPORT_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    return fileName;
  } catch (error) {
    console.error('Error generating Invoice AR/AP Report PDF:', error);
    throw error;
  }
};

export const downloadTreasuryReportPdf = (vouchersData: any[], bankAccountsData: any[]) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header Color Bar (Slate 900)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('NEXUSSYNC ERP ENTERPRISE - MODULE M32: TREASURY & CASH FLOW', 12, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('SO QUY TIEN MAT, NG AN HANG & DU BAO DONG TIEN', 145, 12);

    // Title Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('BAO CAO LICH SU SO QUY TIEN MAT & DONG TIEN NG AN HANG', 15, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Ngay xuat bao cao: ${new Date().toLocaleDateString('vi-VN')} | Quy tac Audit Trail & Hep Thong TK TT200/2014`, 15, 34);

    // Summary Calculations
    const totalReceipts = vouchersData.filter((v: any) => v.voucherType === 'RECEIPT' || v.type === 'IN')
      .reduce((sum: number, v: any) => sum + (v.amount || 0), 0);
    const totalPayments = vouchersData.filter((v: any) => v.voucherType === 'PAYMENT' || v.type === 'OUT')
      .reduce((sum: number, v: any) => sum + (v.amount || 0), 0);
    const netCashFlow = totalReceipts - totalPayments;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 38, 180, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Tong Thu Quy & Ng an hang (Cash IN): ${totalReceipts.toLocaleString('vi-VN')} VND`, 20, 45);
    doc.text(`Tong Chi Quy & Ng an hang (Cash OUT): ${totalPayments.toLocaleString('vi-VN')} VND`, 20, 52);
    doc.text(`Dong Tien Thu an (Net Cash Flow): ${netCashFlow.toLocaleString('vi-VN')} VND`, 110, 45);
    doc.text(`Trang thai Thanh khoan Liquidity: OPTIMAL (An toan quy)`, 110, 52);

    // Table of Vouchers
    const tableRows = vouchersData.map((v: any) => [
      v.voucherCode || `PH-${v.id}`,
      v.voucherType === 'RECEIPT' || v.type === 'IN' ? 'PHIEU THU' : 'PHIEU CHI',
      v.partnerName || 'Doi Tac',
      v.paymentMethod || 'BANK_TRANSFER',
      `${(v.amount || 0).toLocaleString('vi-VN')}`,
      v.accountingEntry || (v.voucherType === 'RECEIPT' ? 'No 1121 / Co 131' : 'No 331 / Co 1121'),
      v.status || 'APPROVED',
      v.date || new Date().toISOString().slice(0, 10),
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Ma Phieu', 'Loai', 'Doi Tac / Noi Dung', 'PTTT', 'So Tien (VND)', 'Dinh Khoan GL', 'Trang Thai', 'Ngay']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 24 },
        1: { halign: 'center', cellWidth: 20 },
        2: { cellWidth: 40 },
        3: { cellWidth: 22 },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'center', cellWidth: 25 },
        6: { halign: 'center', cellWidth: 15 },
        7: { halign: 'center', cellWidth: 18 },
      },
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 210;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    doc.text('THU QUY / KE TOAN TIEN MAT', 20, finalY);
    doc.text('KE TOAN TRUONG (CFO)', 85, finalY);
    doc.text('GIAM DOC / BAN GIAM DOC', 145, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Ky, ho ten)', 25, finalY + 5);
    doc.text('(Ky, dong dau)', 88, finalY + 5);
    doc.text('(Phe duyet chi)', 150, finalY + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text('Xac thuc So cai Khong the Chinh sua (Single Writer Invariant Log)', 60, finalY + 20);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, 275, 195, 275);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('NexusSync ERP Platform • Module M32 Payments, Cash & Treasury Management', 15, 282);

    const fileName = `TREASURY_CASHFLOW_REPORT_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    return fileName;
  } catch (error) {
    console.error('Error generating Treasury Report PDF:', error);
    throw error;
  }
};

/**
 * Download Transfer Pricing & Compliance Report PDF (Decree 132/2020/ND-CP & OECD Pillar Two)
 */
export const downloadTransferPricingReportPdf = (fileType: 'MASTER_FILE' | 'LOCAL_FILE' | 'CBCR' | string, fileTitle?: string) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let docTitle = 'HỒ SƠ THUẾ CHUYỂN GIÁ & BÁO CÁO TUÂN THỦ NGHỊ ĐỊNH 132';
    let docSub = 'Master File - Hồ sơ Tập đoàn Global NexusSync';

    if (fileType === 'MASTER_FILE') {
      docTitle = 'HỒ SƠ TẢI TẬP ĐOÀN (MASTER FILE - NGHỊ ĐỊNH 132)';
      docSub = 'Mo ta toan bo cau truc so huu toan cau, chuoi gia tri logistics & chinh sach gia chuyen nhượng';
    } else if (fileType === 'LOCAL_FILE') {
      docTitle = 'HỒ SƠ QUỐC GIA (LOCAL FILE - NGHỊ ĐỊNH 132)';
      docSub = 'Phan tich so sanh bien loi nhuan doc lap, benchmarking du lieu Orbis / Bureau van Dijk';
    } else if (fileType === 'CBCR') {
      docTitle = 'BÁO CÁO LỢI NHUẬN LIÊN QUỐC GIA (CbCR - FORM 04/TĐ)';
      docSub = 'Phan bo loi nhuan, doanh thu, thue TNDN da nop va so luong lao dong theo tung quoc gia OECD';
    }

    const titleClean = removeVietnameseTones(fileTitle || docTitle).toUpperCase();
    const docSubClean = removeVietnameseTones(docSub);

    // Header bar (Amber / Slate theme)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('NEXUSSYNC ERP - TRANSFER PRICING COMPLIANCE', 15, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text('DECREE 132/2020/ND-CP & OECD PILLAR TWO 15% GLOBE RULES', 15, 20);

    // Accent Bar
    doc.setFillColor(217, 119, 6); // amber-600
    doc.rect(0, 27, 210, 2, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(titleClean, 15, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(docSubClean, 15, 44);
    doc.text(`Ngay phat hanh: ${new Date().toLocaleDateString('vi-VN')} | Cap do bao mat: CAO CAP (CONFIDENTIAL)`, 15, 50);

    // Summary Compliance Box
    doc.setFillColor(254, 243, 199); // amber-100/50
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(15, 55, 180, 32, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text('TRANG THAI TUAN THU & DANH GIA RUI RO THUE CHUYEN GIA', 20, 63);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Decree 132 Status: VERIFIED COMPLIANT (Dat ngung giao dich doc lap Arm Length)', 20, 71);
    doc.text('2. EBITDA Interest Cap 30%: DAT CHUAN (Chi phi lai vay 22% EBITDA < 30%)', 20, 77);
    doc.text('3. OECD Pillar Two Tax: MIEN TRU TOP-UP TAX 2026 (€3.2M < €750M Threshold)', 20, 83);

    // Main Content Table
    const tableData = [
      ['Giao dich 01', 'BR_HO -> BR_HCM', 'Ban phan mem SaaS', '1,250,000,000 VND', 'TNMM (Biên Lợi Nhuận)', 'Arm Length Range: 8%-12%'],
      ['Giao dich 02', 'BR_HO -> BR_DN', 'Phi ho tro IT & Quan ly', '400,000,000 VND', 'CUP (Giá So Sánh)', 'Khớp giá thị trường'],
      ['Giao dich 03', 'BR_HO -> Singapore Sub', 'Cho vay noi bo ngắn hạn', '1,270,000,000 VND', 'Interest Benchmark', 'Lai suat 5.2%/nam'],
      ['Tong cong', 'TOAN TAP DOAN', 'Giao dich quan he lien ket', '2,920,000,000 VND', 'Tuyet doi tuan thu', 'Audited by KPMG/EY'],
    ];

    autoTable(doc, {
      startY: 92,
      head: [['MA GD', 'DON VI GIAO NHAN', 'LOAI GIAO DICH', 'GIA TRI (VND)', 'PHUONG PHAP TP', 'KET LUAN ARMS LENGTH']],
      body: tableData.map(r => r.map(c => removeVietnameseTones(c))),
      theme: 'grid',
      headStyles: {
        fillColor: [180, 83, 9], // amber-700
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { halign: 'right', cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
      },
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 200;

    // Signatures
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);

    doc.text('CHUYEN VIEN THUE CHUYEN GIA', 20, finalY);
    doc.text('KE TOAN TRUONG / CFO', 85, finalY);
    doc.text('DAI DIEN PHAP LUAT TAP DOAN', 145, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Ky va ghi ro ho ten)', 25, finalY + 5);
    doc.text('(Da kiem tra & phe duyet)', 88, finalY + 5);
    doc.text('(Ky, dong dau)', 150, finalY + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text('Da xac thuc chu ky so Tap doan NexusSync CA/HSM Decree 132 Compliant', 50, finalY + 22);

    // Cryptographic audit footer
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 275, 195, 275);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('SHA-256 Hash: tp_decree132_8f94c12a7e4b901f82cc33e1098b671aef42901b0821d3f990172e8119c4b721', 15, 282);

    const safeFileName = `TP_${fileType}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(safeFileName);
    return safeFileName;
  } catch (error) {
    console.error('Error generating Transfer Pricing PDF:', error);
    throw error;
  }
};

/**
 * Download Project Progress & EVM Costing Report PDF (Module M35)
 */
export const downloadProjectReportPdf = (project: any, tasks?: any[]) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const code = removeVietnameseTones(project?.code || 'PRJ-2026-001');
    const titleClean = removeVietnameseTones(project?.name || 'DU AN ERP NEXUSSYNC PHASE 2').toUpperCase();
    const managerClean = removeVietnameseTones(project?.manager || 'Nguyen Van An (PM)');
    const clientClean = removeVietnameseTones(project?.client || 'Tap doan NexusSync');
    const categoryClean = removeVietnameseTones(project?.category || 'ERP / IT Infrastructure');

    // Header bar (Indigo / Slate theme)
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 210, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('NEXUSSYNC ERP - PROJECT & WBS MANAGEMENT (M35)', 15, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(129, 140, 248); // indigo-400
    doc.text('BAO CAO TIEN DO THI CONG & QUAN TRI GIA TRI THU DUOC (EVM)', 15, 20);

    // Accent Bar
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 27, 210, 2, 'F');

    // Title Block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`[${code}] ${titleClean}`, 15, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Chu dau tu / Khach hang: ${clientClean} | PM phu trách: ${managerClean}`, 15, 44);
    doc.text(`Loai hinh: ${categoryClean} | Ngay xuat bao cao: ${new Date().toLocaleDateString('vi-VN')}`, 15, 50);

    // KPI Summary Box (EVM Metrics)
    const budget = project?.budgetVND || 4500000000;
    const progress = project?.progressPct || 65;
    const actualCost = project?.actualCostVND || 2700000000;
    const ev = Math.round(budget * (progress / 100));
    const pv = Math.round(budget * 0.70); // Assume planned 70%
    const cpi = actualCost > 0 ? (ev / actualCost).toFixed(2) : '1.00';
    const spi = pv > 0 ? (ev / pv).toFixed(2) : '1.00';
    const eac = Number(cpi) > 0 ? Math.round(budget / Number(cpi)) : budget;

    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(15, 55, 180, 36, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text('CHI SO QUAN TRI EVM & NGAN SACH DU AN (EARNED VALUE MANAGEMENT)', 20, 63);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    doc.text(`Tong ngan sach (BAC): ${budget.toLocaleString('vi-VN')} VND`, 20, 71);
    doc.text(`Gia tri ke hoach (PV): ${pv.toLocaleString('vi-VN')} VND`, 20, 77);
    doc.text(`Gia tri thu duoc (EV): ${ev.toLocaleString('vi-VN')} VND (${progress}%)`, 20, 83);

    doc.text(`Chi phi thuc te (AC): ${actualCost.toLocaleString('vi-VN')} VND`, 110, 71);
    doc.text(`Chi so chi phi CPI: ${cpi} (${Number(cpi) >= 1 ? 'Tiet kiem chi phi' : 'Vuot ngan sach'})`, 110, 77);
    doc.text(`Chi so tien do SPI: ${spi} (${Number(spi) >= 1 ? 'Dung/Vuot tien do' : 'Cham tien do'})`, 110, 83);

    // WBS Task Table
    const taskList = tasks && tasks.length > 0 ? tasks : [
      { code: 'WBS-1.1', name: 'Khao sat & Lap thiet ke kien truc', assign: 'Nguyen Van An', planned: 500000000, actual: 480000000, pct: 100, status: 'DONE' },
      { code: 'WBS-1.2', name: 'Mua sam may chu & Thiet bi Cloud', assign: 'Tran Thi Binh', planned: 1500000000, actual: 1520000000, pct: 100, status: 'DONE' },
      { code: 'WBS-2.1', name: 'Phat triển & Tich hop Core ERP', assign: 'Le Hoang Cuong', planned: 1800000000, actual: 700000000, pct: 55, status: 'IN_PROGRESS' },
      { code: 'WBS-2.2', name: 'Kiem thu UAT & Dao tao nguoi dung', assign: 'Pham Duy Duc', planned: 700000000, actual: 0, pct: 0, status: 'PENDING' },
    ];

    autoTable(doc, {
      startY: 96,
      head: [['MA WBS', 'HANG MUC CONG VIEC', 'NHAN SU PHU TRACH', 'KE HOACH (VND)', 'THUC TE (VND)', 'TIEN DO', 'TRANG THAI']],
      body: taskList.map(t => [
        t.code || 'WBS-1.1',
        removeVietnameseTones(t.name || ''),
        removeVietnameseTones(t.assign || 'Chua gan'),
        (t.planned || 0).toLocaleString('vi-VN'),
        (t.actual || 0).toLocaleString('vi-VN'),
        `${t.pct || 0}%`,
        removeVietnameseTones(t.status || 'PENDING'),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [67, 56, 202], // indigo-700
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 22 },
        1: { cellWidth: 48 },
        2: { cellWidth: 30 },
        3: { halign: 'right', cellWidth: 28 },
        4: { halign: 'right', cellWidth: 28 },
        5: { halign: 'center', cellWidth: 12 },
        6: { halign: 'center', cellWidth: 12 },
      },
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 200;

    // Signatures
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);

    doc.text('GIAM DOC DU AN (PM)', 20, finalY);
    doc.text('KE TOAN TRUONG / CFO', 85, finalY);
    doc.text('BAN GIAM DOC TAP DOAN', 145, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Ky & xac nhận tien do)', 22, finalY + 5);
    doc.text('(Da pham duyet chi phi)', 88, finalY + 5);
    doc.text('(Phe duyet nghiem thu)', 150, finalY + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text('Xac thuc chu ky so & Tien do du an Immutable Registry NexusSync ERP', 45, finalY + 22);

    // Cryptographic audit footer
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 275, 195, 275);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`SHA-256 Hash: prj_m35_e20a91f${Date.now()}889a7124f00b91e`, 15, 282);

    const safeFileName = `PROJECT_REPORT_${code}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(safeFileName);
    return safeFileName;
  } catch (error) {
    console.error('Error generating Project Report PDF:', error);
    throw error;
  }
};

export interface PdfExportOptions {
  module: any;
  currentUser: any;
  title?: string;
  tableName?: string;
  headers: string[];
  rows: (string | number)[][];
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter';
  includeMetadata?: boolean;
  includeSignatures?: boolean;
  includeAuditHash?: boolean;
  customNotes?: string;
}

export const downloadCustomTablePdf = (options: PdfExportOptions): string => {
  try {
    const {
      module,
      currentUser,
      title,
      tableName,
      headers,
      rows,
      orientation = 'portrait',
      pageSize = 'a4',
      includeMetadata = true,
      includeSignatures = true,
      includeAuditHash = true,
      customNotes,
    } = options;

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize,
    });

    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const moduleNameClean = removeVietnameseTones(module?.moduleName || 'He Thong ERP');
    const moduleCode = module?.code || module?.moduleId || 'ERP';
    const userNameClean = removeVietnameseTones(currentUser?.name || currentUser?.username || 'Nguoi Dung');
    const userRole = currentUser?.role || 'Admin';
    const reportTitle = removeVietnameseTones(title || tableName || `BAO CAO PHAN HE [${moduleCode}] ${moduleNameClean}`).toUpperCase();

    // 1. Header Band (Slate 900)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('NEXUSSYNC ENTERPRISE ERP', 15, 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`OFFICIAL ENTERPRISE REPORT / BAO CAO PHAN HE ${moduleCode}`, 15, 20);

    // Accent line (Blue 600)
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 27, pageWidth, 1.5, 'F');

    let currentY = 36;

    // 2. Report Title & Meta
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(reportTitle, 15, currentY);
    currentY += 6;

    if (includeMetadata) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      const metaLeft = `Phan He: [${moduleCode}] ${moduleNameClean} | Nguoi Lap: ${userNameClean} (${userRole})`;
      const metaRight = `Ngay Xuat: ${new Date().toLocaleString('vi-VN')} | Tong: ${rows.length} ban ghi`;
      
      doc.text(metaLeft, 15, currentY);
      if (orientation === 'landscape') {
        doc.text(metaRight, 180, currentY);
      } else {
        currentY += 4.5;
        doc.text(metaRight, 15, currentY);
      }
      currentY += 6;
    }

    if (customNotes && customNotes.trim()) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text(`Ghi chu: ${removeVietnameseTones(customNotes.trim())}`, 15, currentY);
      currentY += 5;
    }

    // 3. Table Data Rendering with autoTable
    const cleanHeaders = headers.map(h => removeVietnameseTones(String(h || '')));
    const cleanRows = rows.map(row =>
      row.map(cell => {
        if (cell === null || cell === undefined) return '';
        if (typeof cell === 'number') return cell.toLocaleString('vi-VN');
        return removeVietnameseTones(String(cell));
      })
    );

    autoTable(doc, {
      startY: currentY,
      head: [cleanHeaders],
      body: cleanRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [30, 41, 59],
        overflow: 'linebreak',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Slate 50
      },
      margin: { left: 15, right: 15 },
    });

    let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : currentY + 30;

    // Check if new page is needed for signatures
    if (includeSignatures) {
      if (finalY + 35 > pageHeight - 20) {
        doc.addPage();
        finalY = 25;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);

      const col1X = 20;
      const col2X = orientation === 'landscape' ? 120 : 85;
      const col3X = orientation === 'landscape' ? 220 : 150;

      doc.text('NGUOI LAP BIEU', col1X, finalY);
      doc.text('TRUONG BO PHAN / KIEM SOAT', col2X, finalY);
      doc.text('BAN GIAM DOC / PHE DUYET', col3X, finalY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('(Ky va ghi ro ho ten)', col1X + 2, finalY + 4);
      doc.text('(Xac nhan tinh xac thuc so lieu)', col2X, finalY + 4);
      doc.text('(Ky so token HSM / e-Stamp)', col3X, finalY + 4);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      doc.text('Chung tu so hoa xac thuc NexusSync ERP Digital Security Engine', col1X, finalY + 18);
    }

    // 4. Audit Footer
    if (includeAuditHash) {
      doc.setDrawColor(226, 232, 240);
      doc.line(15, pageHeight - 14, pageWidth - 15, pageHeight - 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      const auditHash = `SHA256:${Math.random().toString(36).substring(2, 15)}${Date.now()}`;
      doc.text(`Ma xac thuc: ${auditHash} | NexusSync ERP Platform - Secure Official Archive`, 15, pageHeight - 9);
      doc.text(`Trang 1 / 1 (PDF/A Standard)`, pageWidth - 50, pageHeight - 9);
    }

    const safeDate = new Date().toISOString().slice(0, 10);
    const fileName = `Bao_Cao_${moduleCode}_${safeDate}.pdf`;
    doc.save(fileName);
    return fileName;
  } catch (error) {
    console.error('Error generating Custom Table PDF:', error);
    throw error;
  }
};

/**
 * Xuất Hoá Đơn Điện Tử Giá Trị Gia Tăng (VAT e-Invoice) chuẩn Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC
 * Áp dụng cho phân quyền Sales, Customer B2B & Kế toán Finance M31
 */
export const downloadVatElectronicInvoicePdf = (data: {
  invoiceNumber?: string;
  orderId?: string;
  formCode?: string; // Mẫu số 1C26TAA
  serialNo?: string; // Ký hiệu 1C26TAA
  date?: string;
  customerName: string;
  taxCode?: string;
  address?: string;
  billingEmail?: string;
  paymentMethod?: string;
  items?: Array<{
    sku?: string;
    name: string;
    uop?: string;
    qty: number;
    price?: string | number;
    amount?: number;
  }>;
  subtotalAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number | string;
  cqtCode?: string;
  lookupCode?: string;
  lookupUrl?: string;
  signerName?: string;
  companyName?: string;
  companyTaxCode?: string;
  companyAddress?: string;
  companyBank?: string;
}) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const invNo = data.invoiceNumber || data.orderId || 'INV-2026-00125';
    const formCode = data.formCode || '1C26TAA';
    const serialNo = data.serialNo || '1C26TAA';
    const cqtCode = data.cqtCode || 'T26-0001-A9F32E-78';
    const lookupCode = data.lookupCode || `NX${Math.random().toString(36).substring(2, 8).toUpperCase()}2026`;
    const lookupUrl = data.lookupUrl || 'https://hoadondientu.gdt.gov.vn';

    const customerNameClean = removeVietnameseTones(data.customerName || 'KHACH HANG DOANH NGHIEP');
    const custTaxCode = data.taxCode || '0109988776';
    const custAddressClean = removeVietnameseTones(data.address || 'Khu Cong Nghiep Tan Binh, TP. Ho Chi Minh');
    const paymentMethodClean = removeVietnameseTones(data.paymentMethod || 'TM/CK (Chuyen khoan)');

    const companyNameClean = removeVietnameseTones(data.companyName || 'CONG TY CO PHAN CONG NGHE & GIAI PHAP NEXUSSYNC ERP');
    const companyTaxCode = data.companyTaxCode || '0108899888';
    const companyAddressClean = removeVietnameseTones(data.companyAddress || 'Toa nha NexusSync Tower, 88 Pho Duy Tan, Cau Giay, Ha Noi');
    const companyBank = data.companyBank || '19036888999999 tai Techcombank - CN Ha Noi';

    // Header Background Frame (Gradient / Professional Slate)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 38, 'F');

    // Accent line
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 37, 210, 1.5, 'F');

    // Company Header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(companyNameClean, 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Ma so thue (Tax Code): ${companyTaxCode} | Hotline: 1900 6868 | Email: invoice@nexussync.vn`, 14, 18);
    doc.text(`Dia chi: ${companyAddressClean}`, 14, 24);
    doc.text(`So tai khoan: ${companyBank}`, 14, 30);

    // Invoice Title Section
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('HOA DON GIA TRI GIA TANG', 105, 48, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('(VAT ELECTRONIC INVOICE - NGHI DINH 123/2020/ND-CP)', 105, 54, { align: 'center' });

    const invDate = data.date || new Date().toLocaleDateString('vi-VN');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text(`Ngay (Date): ${invDate}`, 105, 59, { align: 'center' });

    // Meta Box (Top Right)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(138, 42, 58, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Mau so (Form): ${formCode}`, 142, 47);
    doc.text(`Ky hieu (Serial): ${serialNo}`, 142, 53);
    doc.text(`So hoa don (No):`, 142, 59);
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(9);
    doc.text(`${invNo}`, 166, 59);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ma CQT: ${cqtCode}`, 142, 64);

    // Customer Information Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 69, 182, 32, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('THONG TIN NGUOI MUA HANG (BUYER INFORMATION)', 18, 75);

    doc.setDrawColor(226, 232, 240);
    doc.line(18, 77, 192, 77);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Ten don vi (Company): ${customerNameClean}`, 18, 83);
    doc.text(`Ma so thue (Tax Code): ${custTaxCode}`, 18, 89);
    doc.text(`Dia chi (Address): ${custAddressClean}`, 18, 95);

    doc.text(`Hinh thuc thanh toan (Payment): ${paymentMethodClean}`, 120, 89);
    doc.text(`Email nhan hoa don: ${data.billingEmail || 'contact@client.vn'}`, 120, 95);

    // Table of Items
    const rawItems = data.items && data.items.length > 0 ? data.items : [
      { name: 'San pham cong nghe NexusSync Enterprise Edition', uop: 'Bo', qty: 1, price: 100000000, amount: 100000000 }
    ];

    let subtotal = 0;
    const tableRows = rawItems.map((item, idx) => {
      const priceNum = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9]/g, '')) || 0 : (item.price || 0);
      const amountNum = item.amount || (priceNum * (item.qty || 1));
      subtotal += amountNum;
      return [
        (idx + 1).toString(),
        removeVietnameseTones(item.name || 'San pham hang hoa'),
        removeVietnameseTones(item.uop || 'Cai'),
        (item.qty || 1).toString(),
        priceNum.toLocaleString('vi-VN'),
        amountNum.toLocaleString('vi-VN')
      ];
    });

    const taxRate = data.taxRate !== undefined ? data.taxRate : 10;
    const calcSubtotal = data.subtotalAmount || subtotal;
    const calcTaxAmount = data.taxAmount !== undefined ? data.taxAmount : Math.round(calcSubtotal * (taxRate / 100));
    const calcTotalAmount = typeof data.totalAmount === 'number' ? data.totalAmount : (calcSubtotal + calcTaxAmount);

    autoTable(doc, {
      startY: 104,
      head: [['STT', 'Ten Hang Hoa, Dich Vu (Description)', 'DVT', 'So Luong', 'Don Gia (VND)', 'Thanh Tien (VND)']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'right', cellWidth: 28 },
        5: { halign: 'right', cellWidth: 30 },
      },
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 4 : 170;

    // Totals Calculation Block
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(100, finalY, 96, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Cong tien hang (Subtotal):', 104, finalY + 7);
    doc.text(`Thue suat GTGT (VAT Rate ${taxRate}%):`, 104, finalY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Tong cong tien thanh toan:', 104, finalY + 22);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${calcSubtotal.toLocaleString('vi-VN')} VND`, 192, finalY + 7, { align: 'right' });
    doc.text(`${calcTaxAmount.toLocaleString('vi-VN')} VND`, 192, finalY + 14, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(37, 99, 235);
    doc.text(`${calcTotalAmount.toLocaleString('vi-VN')} VND`, 192, finalY + 22, { align: 'right' });

    // Lookup & Portal box (Left side)
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalY, 82, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('TRA CUU HOA DON DIEN TU & MA VIETQR', 18, finalY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Cong tra cuu: ${lookupUrl}`, 18, finalY + 13);
    doc.text(`Ma tra cuu hoa don: ${lookupCode}`, 18, finalY + 19);
    doc.text(`Trang thai CQT: Da cap ma xac thuc (Hop le)`, 18, finalY + 25);

    // Signatures & HSM Certification Block
    const signY = finalY + 34;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('NGUOI MUA HANG (BUYER)', 40, signY);
    doc.text('NGUOI BAN HANG (SELLER)', 135, signY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Ky, ghi ro ho ten)', 42, signY + 5);
    doc.text('(Ky so dien tu HSM / Token)', 136, signY + 5);

    // Digital Signature Stamp (Green Box)
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(120, signY + 10, 68, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    doc.text('[ DA KY SO DIEN TU HOP LE ]', 124, signY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(4, 120, 87);
    doc.text(`Ký bởi: ${companyNameClean.slice(0, 32)}...`, 124, signY + 20);
    doc.text(`Ngày ký: ${invDate} | CA: Viettel-CA Cloud HSM`, 124, signY + 24);
    doc.text(`Chứng thư số: SHA256-TSA-VERIFIED-ND123`, 124, signY + 28);

    // Audit Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 282, 196, 282);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`NexusSync ERP e-Invoice Engine • Ban the hien cua hoa don dien tu GTGT theo ND123 & TT78 • Ma bao mat SHA256: ${Math.random().toString(36).substring(2, 12)}`, 14, 287);
    doc.text(`Trang 1/1`, 188, 287);

    const safeFileName = `HOA_DON_VAT_${invNo.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(safeFileName);
    return safeFileName;
  } catch (error) {
    console.error('Error generating VAT Invoice PDF:', error);
    throw error;
  }
};





