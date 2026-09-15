export let seedCreditNotes = [
    { id: 1, creditNoteNumber: 'CN-2026-001', originalInvoiceNumber: 'HD-AR-2026-042', customerName: 'Công ty Cổ phần MISA', amount: 15000000, vatAmount: 1500000, finalAmount: 16500000, rmaCode: 'RMA-2026-008', reason: 'Hàng lỗi kỹ thuật đợt giao 25/08 - Giảm trừ công nợ AR', status: 'APPROVED', date: '2026-08-27', accountingEntry: 'Nợ 5212, Nợ 3331 / Có 131' },
    { id: 2, creditNoteNumber: 'CN-2026-002', originalInvoiceNumber: 'HD-AR-2026-045', customerName: 'Công ty TNHH Phong Vũ', amount: 8000000, vatAmount: 800000, finalAmount: 8800000, rmaCode: 'RMA-2026-012', reason: 'Chiết khấu thương mại do đạt sản lượng Quý 2', status: 'ISSUED', date: '2026-08-28', accountingEntry: 'Nợ 5211, Nợ 3331 / Có 131' },
  ];

export let seedDebitNotes = [
    { id: 1, debitNoteNumber: 'DN-2026-001', originalInvoiceNumber: 'HD-AP-2026-991', supplierName: 'Tập đoàn Điện Lực Việt Nam EVN', amount: 5000000, vatAmount: 500000, finalAmount: 5500000, purchaseReturnCode: 'PRT-2026-004', reason: 'Trả lại vật tư không đạt chứng chỉ CO/CQ - Giảm nợ AP', status: 'APPROVED', date: '2026-08-26', accountingEntry: 'Nợ 331 / Có 152, Có 1331' },
  ];

export let seedAccountingEvents = [
    { id: 1, eventId: 'FE-2026-0881', sourceModule: 'SALES_O2C', eventType: 'INVOICE_ISSUED', invoiceNumber: 'HD-AR-2026-042', partnerName: 'Công ty Cổ phần MISA', amount: 120000000, vatAmount: 12000000, totalAmount: 132000000, accountingStatus: 'POSTED_TO_GL', glJournalId: 'GL-2026-0912', timestamp: '2026-08-27 10:15:00', entryRules: 'Nợ 131: 132M / Có 511: 120M, Có 3331: 12M' },
    { id: 2, eventId: 'FE-2026-0882', sourceModule: 'RMA_RETURNS', eventType: 'CREDIT_NOTE_ISSUED', invoiceNumber: 'CN-2026-001', partnerName: 'Công ty Cổ phần MISA', amount: 15000000, vatAmount: 1500000, totalAmount: 16500000, accountingStatus: 'POSTED_TO_GL', glJournalId: 'GL-2026-0915', timestamp: '2026-08-27 14:30:00', entryRules: 'Nợ 5212: 15M, Nợ 3331: 1.5M / Có 131: 16.5M' },
    { id: 3, eventId: 'FE-2026-0883', sourceModule: 'P2P_PURCHASE', eventType: 'SUPPLIER_INVOICE_MATCHED', invoiceNumber: 'HD-AP-2026-991', partnerName: 'CÔNG TY TNHH THIẾT BỊ CÔNG NGHỆ VIỆT NAM', amount: 120000000, vatAmount: 12000000, totalAmount: 132000000, accountingStatus: 'POSTED_TO_GL', glJournalId: 'GL-2026-0918', timestamp: '2026-08-28 09:00:00', entryRules: 'Nợ 211/152: 120M, Nợ 1331: 12M / Có 331: 132M' },
    { id: 4, eventId: 'FE-2026-0884', sourceModule: 'PAYMENTS_M32', eventType: 'PAYMENT_ALLOCATED', invoiceNumber: 'HD-AR-2026-042', partnerName: 'Công ty Cổ phần MISA', amount: 132000000, vatAmount: 0, totalAmount: 132000000, accountingStatus: 'POSTED_TO_GL', glJournalId: 'GL-2026-0925', timestamp: '2026-08-28 11:20:00', entryRules: 'Nợ 1121: 132M / Có 131: 132M' },
  ];

export let seedBankAccounts = [
    { id: 1, bankName: 'Vietcombank (VCB)', accountNumber: '1012998877', accountName: 'CONG TY CP NEXUSSYNC ERP', currency: 'VND', bookBalance: 1250000000, bankBalance: 1250000000, branchName: 'Hội Sở Chính - Hà Nội', isActive: true, accountType: 'BANK' },
    { id: 2, bankName: 'MB Bank (MBB)', accountNumber: '999988889999', accountName: 'CONG TY CP NEXUSSYNC ERP', currency: 'VND', bookBalance: 840000000, bankBalance: 840000000, branchName: 'Chi Nhánh Ba Đình', isActive: true, accountType: 'BANK' },
    { id: 3, bankName: 'Techcombank (TCB)', accountNumber: '190388776655', accountName: 'CONG TY CP NEXUSSYNC ERP', currency: 'VND', bookBalance: 420000000, bankBalance: 420000000, branchName: 'Chi Nhánh Hoàn Kiếm', isActive: true, accountType: 'BANK' },
    { id: 4, bankName: 'Quỹ Tiền Mặt Trung Tâm', accountNumber: 'CASH-HO-01', accountName: 'Thủ Quỹ - Phạm Thị Mai', currency: 'VND', bookBalance: 185000000, bankBalance: 185000000, branchName: 'Trụ sở Chính', isActive: true, accountType: 'CASH' },
  ];

export let seedCashVouchers = [
    { id: 1, voucherCode: 'PT-2026-0089', voucherType: 'RECEIPT', partnerType: 'CUSTOMER', partnerName: 'Công ty Cổ phần MISA', amount: 120000000, bankAccountId: 1, bankName: 'Vietcombank (VCB)', paymentMethod: 'BANK_TRANSFER', status: 'APPROVED', date: '2026-08-27', reason: 'Thu tiền thanh toán Hóa đơn AR-2026-0042', accountingEntry: 'Nợ 1121 / Có 131', createdBy: 'Kế toán Thu - Nguyễn Văn A', approvedBy: 'CFO - Nguyễn Thị Hương' },
    { id: 2, voucherCode: 'PC-2026-0045', voucherType: 'PAYMENT', partnerType: 'SUPPLIER', partnerName: 'Tập đoàn Điện Lực Việt Nam EVN', amount: 35000000, bankAccountId: 2, bankName: 'MB Bank (MBB)', paymentMethod: 'BANK_TRANSFER', status: 'APPROVED', date: '2026-08-26', reason: 'Chi trả tiền điện sản xuất Xưởng CNC Tháng 08/2026', accountingEntry: 'Nợ 6427 / Có 1121', createdBy: 'Kế toán Chi - Lê Thị B', approvedBy: 'CFO - Nguyễn Thị Hương' },
    { id: 3, voucherCode: 'PC-2026-0046', voucherType: 'PAYMENT', partnerType: 'EMPLOYEE', partnerName: 'Trần Văn Hưng (Kỹ sư Trưởng)', amount: 1500000, bankAccountId: 4, bankName: 'Quỹ Tiền Mặt Trung Tâm', paymentMethod: 'CASH', status: 'APPROVED', date: '2026-08-28', reason: 'Tạm ứng chi phí công tác vận hành hệ thống', accountingEntry: 'Nợ 141 / Có 1111', createdBy: 'Thủ quỹ - Phạm Thị Mai', approvedBy: 'Trưởng phòng Kế toán' },
    { id: 4, voucherCode: 'PT-2026-0090', voucherType: 'RECEIPT', partnerType: 'CUSTOMER', partnerName: 'Công ty TNHH Phong Vũ', amount: 85000000, bankAccountId: 2, bankName: 'MB Bank (MBB)', paymentMethod: 'BANK_TRANSFER', status: 'PENDING_APPROVAL', date: '2026-08-28', reason: 'Thu tiền đặt cọc Đơn bán hàng SO-2026-018', accountingEntry: 'Nợ 1121 / Có 131', createdBy: 'Kế toán Thu - Nguyễn Văn A', approvedBy: null },
  ];

export let seedTransfers = [
    { id: 1, transferCode: 'TRF-2026-012', fromAccountId: 1, fromBankName: 'Vietcombank (VCB)', toAccountId: 2, toBankName: 'MB Bank (MBB)', amount: 200000000, fee: 0, status: 'COMPLETED', date: '2026-08-25', reason: 'Điều chuyển vốn thanh toán lương kỳ 2', accountingEntry: 'Nợ 1121-MBB / Có 1121-VCB', createdBy: 'CFO - Nguyễn Thị Hương' },
    { id: 2, transferCode: 'TRF-2026-013', fromAccountId: 1, fromBankName: 'Vietcombank (VCB)', toAccountId: 4, toBankName: 'Quỹ Tiền Mặt Trung Tâm', amount: 50000000, fee: 0, status: 'COMPLETED', date: '2026-08-27', reason: 'Rút tiền mặt về quỹ chi trả công tác phí', accountingEntry: 'Nợ 1111 / Có 1121-VCB', createdBy: 'Thủ quỹ - Phạm Thị Mai' },
  ];

export let seedBankStatements = [
    { id: 1, statementId: 'STMT-VCB-20260828-01', bankAccountId: 1, bankTransactionId: 'FT2624098123912', transactionDate: '2026-08-28 09:15:00', amount: 120000000, reference: 'CT TU MISA THANH TOAN HD AR-2026-0042', status: 'MATCHED', matchedVoucherCode: 'PT-2026-0089' },
    { id: 2, statementId: 'STMT-MBB-20260828-02', bankAccountId: 2, bankTransactionId: 'FT2624098123915', transactionDate: '2026-08-28 10:30:00', amount: -35000000, reference: 'PAYMENT TO EVN HANOI HOADON 88712', status: 'MATCHED', matchedVoucherCode: 'PC-2026-0045' },
    { id: 3, statementId: 'STMT-VCB-20260828-03', bankAccountId: 1, bankTransactionId: 'FT2624098124001', transactionDate: '2026-08-28 14:20:00', amount: 65000000, reference: 'CCTY PHONG VU CHUYEN TIEN SO-2026-018', status: 'UNMATCHED', matchedVoucherCode: null },
  ];

export let seedConsolidationEntities = [
    {
      id: 1,
      code: 'BR_HO',
      name: 'Tập đoàn NexusSync - Hội Sở Hà Nội',
      ownershipPercent: 100,
      currency: 'VND',
      entityType: 'PARENT',
      revenue: 25400000000,
      expense: 18200000000,
      netIncome: 7200000000,
      assets: 68500000000,
      liabilities: 24500000000,
      equity: 44000000000,
      intercompanyAR: 1200000000,
      intercompanyAP: 0,
      status: 'ACTIVE'
    },
    {
      id: 2,
      code: 'BR_HCM',
      name: 'Chi Nhánh TP. Hồ Chí Minh (Subsidiary)',
      ownershipPercent: 100,
      currency: 'VND',
      entityType: 'SUBSIDIARY',
      revenue: 18900000000,
      expense: 14100000000,
      netIncome: 4800000000,
      assets: 41200000000,
      liabilities: 16800000000,
      equity: 24400000000,
      intercompanyAR: 0,
      intercompanyAP: 1200000000,
      status: 'ACTIVE'
    },
    {
      id: 3,
      code: 'BR_DN',
      name: 'Công ty Logistics Miền Trung - Đà Nẵng',
      ownershipPercent: 80,
      currency: 'VND',
      entityType: 'SUBSIDIARY',
      revenue: 9600000000,
      expense: 7200000000,
      netIncome: 2400000000,
      assets: 19500000000,
      liabilities: 7500000000,
      equity: 12000000000,
      intercompanyAR: 450000000,
      intercompanyAP: 0,
      status: 'ACTIVE'
    },
    {
      id: 4,
      code: 'BR_SG_GLOBAL',
      name: 'NexusSync Asia-Pacific Pte Ltd (Singapore)',
      ownershipPercent: 100,
      currency: 'USD',
      fxRate: 25400,
      entityType: 'SUBSIDIARY_FOREIGN',
      revenueUSD: 1200000,
      expenseUSD: 900000,
      netIncomeUSD: 300000,
      revenue: 30480000000,
      expense: 22860000000,
      netIncome: 7620000000,
      assets: 50800000000,
      liabilities: 20320000000,
      equity: 30480000000,
      intercompanyAR: 0,
      intercompanyAP: 450000000,
      status: 'ACTIVE'
    }
  ];

export let seedIntercompanyEliminations = [
    {
      id: 1,
      eliminationCode: 'ELIM-2026-001',
      type: 'IC_SALES_PURCHASE',
      sourceBranch: 'BR_HO',
      targetBranch: 'BR_HCM',
      accountCode: '5111 / 6321',
      description: 'Loại trừ doanh thu & giá vốn nội bộ bán hàng từ HQ Hà Nội cho Chi nhánh HCM',
      amount: 1200000000,
      status: 'POSTED',
      date: '2026-08-28'
    },
    {
      id: 2,
      eliminationCode: 'ELIM-2026-002',
      type: 'IC_AR_AP',
      sourceBranch: 'BR_HO',
      targetBranch: 'BR_HCM',
      accountCode: '1311 / 3311',
      description: 'Loại trừ công nợ phải thu / phải trả nội bộ giữa HQ Hà Nội và Chi nhánh HCM',
      amount: 1200000000,
      status: 'POSTED',
      date: '2026-08-28'
    },
    {
      id: 3,
      eliminationCode: 'ELIM-2026-003',
      type: 'IC_SERVICE_FEE',
      sourceBranch: 'BR_DN',
      targetBranch: 'BR_SG_GLOBAL',
      accountCode: '5113 / 6421',
      description: 'Loại trừ phí logistics dịch vụ nội bộ giữa Đà Nẵng và SG Global',
      amount: 450000000,
      status: 'POSTED',
      date: '2026-08-28'
    }
  ];

export let seedFxRules = [
    { currency: 'USD', closingRate: 25400, averageRate: 25250, historicalRate: 24800, ctaReserveVND: 180000000, lastUpdated: '2026-08-28' },
    { currency: 'EUR', closingRate: 27500, averageRate: 27300, historicalRate: 26900, ctaReserveVND: 95000000, lastUpdated: '2026-08-28' }
  ];

export let seedTransferPricingData = {
    decree132ComplianceStatus: "COMPLIANT",
    financialYear: "2026",
    groupGlobalThresholdEUR: 750000000, // 750M EUR OECD Pillar Two threshold
    groupGlobalRevenueEUR: 820000000,  // Over threshold -> Subject to OECD Pillar Two Top-Up Tax
    globeEffectiveTaxRates: [
      {
        jurisdiction: "Vietnam (HQ & Subsidiaries)",
        statutoryTaxRate: 0.20, // 20% CIT
        adjustedGlobeIncome: 14400000000,
        coveredTaxes: 2880000000,
        effectiveTaxRate: 0.20, // 20% >= 15% -> Top-up Tax = 0
        topUpTaxRate: 0.0,
        topUpTaxAmountVND: 0,
        status: "SAFE_HARBOR_PASSED"
      },
      {
        jurisdiction: "Singapore (NexusSync Asia-Pacific)",
        statutoryTaxRate: 0.17,
        concessionaryTaxRate: 0.10, // Incentivized Tech/Regional HO rate
        adjustedGlobeIncome: 7620000000,
        coveredTaxes: 762000000,
        effectiveTaxRate: 0.10, // 10% < 15% Minimum Rate
        topUpTaxRate: 0.05,     // 15% - 10% = 5% Top-Up Tax
        topUpTaxAmountVND: 381000000, // 5% Top-up Tax collected under QDMTT / IIR
        status: "TOP_UP_TAX_TRIGGERED"
      }
    ],
    interestCapRule30Ebitda: {
      ebitdaVND: 22000000000,
      netInterestExpenseVND: 4200000000,
      cap30EbitdaVND: 6600000000,
      deductibleInterestVND: 4200000000,
      nondeductibleCarriedForwardVND: 0,
      isCompliant: true
    },
    relatedPartyTransactions: [
      {
        id: "RPT-001",
        transactionType: "Bán hàng hóa & vật tư linh kiện nội bộ",
        sourceEntity: "BR_HO (Hà Nội)",
        targetEntity: "BR_HCM (Chi Nhánh HCM)",
        valueVND: 1200000000,
        tpMethod: "CUP (Phương pháp So sánh Giá giao dịch độc lập)",
        benchmarkArmLengthRange: "5.2% - 8.5% Gross Margin",
        actualMargin: "6.8% Gross Margin",
        isArmLength: true
      },
      {
        id: "RPT-002",
        transactionType: "Phí Quản lý & Bản quyền Phần mềm ERP Nội bộ",
        sourceEntity: "BR_SG_GLOBAL (Singapore)",
        targetEntity: "BR_DN (Đà Nẵng)",
        valueVND: 450000000,
        tpMethod: "TNMM (Phương pháp So sánh Tỷ suất Lợi nhuận Ròng)",
        benchmarkArmLengthRange: "4.0% - 7.0% Operating Margin",
        actualMargin: "5.5% Operating Margin",
        isArmLength: true
      }
    ],
    documentationFiles: [
      {
        fileType: "MASTER_FILE",
        title: "Hồ Sơ Tải Tập Đoàn (Master File - Nghị Định 132)",
        status: "GENERATED",
        lastUpdated: "2026-08-28",
        fileSize: "4.2 MB",
        summary: "Mô tả toàn bộ cấu trúc sở hữu toàn cầu, chuỗi giá trị logistics, quyền sở hữu trí tuệ ERP và chính sách giá chuyển nhượng tập đoàn NexusSync."
      },
      {
        fileType: "LOCAL_FILE",
        title: "Hồ Sơ Quốc Gia (Local File - Nghị Định 132)",
        status: "GENERATED",
        lastUpdated: "2026-08-28",
        fileSize: "8.5 MB",
        summary: "Phân tích so sánh biên lợi nhuận độc lập, dữ liệu benchmarking cơ sở dữ liệu Orbis/Bureau van Dijk cho thị trường Việt Nam."
      },
      {
        fileType: "CBCR",
        title: "Báo Cáo Lợi Nhuận Liên Quốc Gia (CbCR - Form Form 04/TĐ)",
        status: "FILED",
        lastUpdated: "2026-08-28",
        fileSize: "2.1 MB",
        summary: "Phân bổ lợi nhuận, doanh thu, thuế TNDN đã nộp và số lượng lao động theo từng quốc gia gia nhập OECD."
      }
    ]
  };

export let seedEmployees = [
    { id: 1, code: 'EMP-00101', fullName: 'Nguyễn Văn An', gender: 'NAM', departmentId: 1, departmentName: 'Khối Sản xuất & MES', position: 'Kỹ sư Vận hành Máy CNC', phone: '0912 345 678', email: 'an.nv@nexussync.vn', hireDate: '2023-03-15', baseSalary: 16500000, status: 'ACTIVE', bankAccount: '1903456789001 (Techcombank)' },
    { id: 2, code: 'EMP-00102', fullName: 'Trần Thị Mai', gender: 'NU', departmentId: 2, departmentName: 'Tài chính - Kế toán', position: 'Chuyên viên Kế toán Kho', phone: '0988 765 432', email: 'mai.tt@nexussync.vn', hireDate: '2022-06-01', baseSalary: 18000000, status: 'ACTIVE', bankAccount: '0071001234567 (Vietcombank)' },
    { id: 3, code: 'EMP-00103', fullName: 'Lê Hoàng Long', gender: 'NAM', departmentId: 3, departmentName: 'Quản lý Kho vận WMS', position: 'Trưởng nhóm Kiểm đếm & Bin/Rack', phone: '0903 112 233', email: 'long.lh@nexussync.vn', hireDate: '2021-11-10', baseSalary: 21000000, status: 'ACTIVE', bankAccount: '102384756201 (MB Bank)' },
    { id: 4, code: 'EMP-00104', fullName: 'Phạm Thu Trang', gender: 'NU', departmentId: 4, departmentName: 'Kiểm soát Chất lượng QMS', position: 'Chuyên viên Đảm bảo Chất lượng QA/QC', phone: '0934 998 877', email: 'trang.pt@nexussync.vn', hireDate: '2024-01-08', baseSalary: 15500000, status: 'ACTIVE', bankAccount: '109876543210 (VietinBank)' },
    { id: 5, code: 'EMP-00105', fullName: 'Đỗ Đức Minh', gender: 'NAM', departmentId: 5, departmentName: 'Kỹ thuật & Bảo trì EAM', position: 'Kỹ thuật viên Trưởng EAM', phone: '0977 445 566', email: 'minh.dd@nexussync.vn', hireDate: '2020-08-20', baseSalary: 23500000, status: 'ACTIVE', bankAccount: '2151000123456 (BIDV)' },
  ];

export let seedPayrolls = [
    { id: 1, periodCode: 'PAY-2026-08', name: 'Bảng lương Tháng 08/2026', month: 8, year: 2026, totalEmployees: 5, totalGross: 94500000, totalInsurance: 9922500, totalTax: 4250000, totalNet: 80327500, status: 'APPROVED', postedGL: true },
    { id: 2, periodCode: 'PAY-2026-07', name: 'Bảng lương Tháng 07/2026', month: 7, year: 2026, totalEmployees: 5, totalGross: 94500000, totalInsurance: 9922500, totalTax: 4250000, totalNet: 80327500, status: 'PAID', postedGL: true },
  ];

export let seedAttendance = [
    { id: 1, employeeId: 1, employeeName: 'Nguyễn Văn An', workDate: '2026-08-27', checkIn: '07:55:12', checkOut: '17:05:30', status: 'PRESENT', workHours: 8.0, otHours: 1.0 },
    { id: 2, employeeId: 2, employeeName: 'Trần Thị Mai', workDate: '2026-08-27', checkIn: '08:02:45', checkOut: '17:00:10', status: 'PRESENT', workHours: 8.0, otHours: 0 },
    { id: 3, employeeId: 3, employeeName: 'Lê Hoàng Long', workDate: '2026-08-27', checkIn: '07:48:30', checkOut: '17:30:00', status: 'PRESENT', workHours: 8.0, otHours: 1.5 },
    { id: 4, employeeId: 4, employeeName: 'Phạm Thu Trang', workDate: '2026-08-27', checkIn: '08:15:00', checkOut: '17:00:00', status: 'LATE', workHours: 7.75, otHours: 0 },
    { id: 5, employeeId: 5, employeeName: 'Đỗ Đức Minh', workDate: '2026-08-27', checkIn: '07:50:00', checkOut: '18:00:00', status: 'PRESENT', workHours: 8.0, otHours: 2.0 },
  ];

export let seedLeaves = [
    { id: 1, employeeId: 4, employeeName: 'Phạm Thu Trang', leaveType: 'ANNUAL_LEAVE', startDate: '2026-09-02', endDate: '2026-09-04', totalDays: 3, reason: 'Nghỉ phép gia đình', status: 'APPROVED', approvedBy: 'Admin' },
    { id: 2, employeeId: 1, employeeName: 'Nguyễn Văn An', leaveType: 'SICK_LEAVE', startDate: '2026-08-15', endDate: '2026-08-16', totalDays: 2, reason: 'Khám sức khỏe định kỳ & điều trị', status: 'APPROVED', approvedBy: 'Admin' },
  ];

export let seedPerformance = [
    { id: 1, employeeId: 1, employeeName: 'Nguyễn Văn An', department: 'Khối Sản xuất & MES', kpiScore: 94.5, okrRating: 'A - Hoàn thành xuất sắc', salaryCoefficient: 1.15, reviewPeriod: 'Q2/2026', status: 'LOCKED' },
    { id: 2, employeeId: 2, employeeName: 'Trần Thị Bình', department: 'Tài chính - Kế toán', kpiScore: 88.0, okrRating: 'B+ - Hoàn thành tốt', salaryCoefficient: 1.05, reviewPeriod: 'Q2/2026', status: 'LOCKED' },
    { id: 3, employeeId: 3, employeeName: 'Lê Hoàng Cường', department: 'Quản lý Kho vận WMS', kpiScore: 91.2, okrRating: 'A - Hoàn thành xuất sắc', salaryCoefficient: 1.10, reviewPeriod: 'Q2/2026', status: 'LOCKED' },
  ];

export let seedTraining = [
    { id: 1, employeeId: 1, employeeName: 'Nguyễn Văn An', courseName: 'An toàn Vận hành Máy CNC & Cẩu trục Nhà xưởng', category: 'AN TOÀN LAO ĐỘNG', hours: 16, expiresAt: '2027-05-15', status: 'VALID', certificateNo: 'CERT-EHS-9912' },
    { id: 2, employeeId: 4, employeeName: 'Phạm Thu Trang', courseName: 'Vận hành Cần trục Tháp & PCCC Chuyên sâu', category: 'PCCC & CỨU HỘ', hours: 24, expiresAt: '2026-09-10', status: 'WARNING_EXPIRING', certificateNo: 'CERT-EHS-4481' },
    { id: 3, employeeId: 3, employeeName: 'Lê Hoàng Cường', courseName: 'Chứng chỉ ISO 9001:2015 & Lean Six Sigma Green Belt', category: 'QUẢN TRỊ CHẤT LƯỢNG', hours: 40, expiresAt: '2028-01-20', status: 'VALID', certificateNo: 'CERT-QMS-1102' },
  ];

export let seedDocuments = [
    { id: 1, docCode: 'DMS-HD-2026-001', title: 'Hợp đồng Cung ứng Linh kiện Điện tử B2B - Viettel Post', category: 'CONTRACT', categoryName: 'Hợp đồng Kinh tế', version: 'v1.2', fileSize: '2.4 MB', format: 'PDF', status: 'SIGNED', securityLevel: 'CONFIDENTIAL', sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', signedBy: 'Hoàng Nam (Admin)', signedAt: '2026-08-20 14:30:00', linkedModule: 'M04 Sales Orders', refDocNo: 'SO-2026-00125', storageTier: 'ACTIVE_VAULT', retentionYears: 10, expireDate: '2036-08-20', workflowStage: 3, workflowSteps: [ { step: 1, name: 'Khởi tạo & Trình duyệt', role: 'REQUESTER', status: 'COMPLETED', user: 'Nguyễn Văn Nam (Sales)', signedAt: '2026-08-20 10:00' }, { step: 2, name: 'Thẩm định Pháp chế', role: 'LEGAL', status: 'COMPLETED', user: 'Lê Thu Trang (Pháp chế)', signedAt: '2026-08-20 11:30' }, { step: 3, name: 'Ký số CA / Token HSM', role: 'CFO', status: 'COMPLETED', user: 'Hoàng Nam (Admin)', signedAt: '2026-08-20 14:30' } ] },
    { id: 2, docCode: 'DMS-ISO-2026-004', title: 'Chứng chỉ Hệ thống Quản lý Chất lượng ISO 9001:2015', category: 'CERTIFICATE', categoryName: 'Chứng nhận & Tiêu chuẩn', version: 'v2.0', fileSize: '4.8 MB', format: 'PDF', status: 'VERIFIED', securityLevel: 'PUBLIC', sha256Hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0', signedBy: 'Tổ chức Chứng nhận SGS', signedAt: '2026-01-15 09:00:00', linkedModule: 'M37 Quality QMS', refDocNo: 'QMS-CERT-9001', storageTier: 'ACTIVE_VAULT', retentionYears: 5, expireDate: '2031-01-15', workflowStage: 3, workflowSteps: [ { step: 1, name: 'Khởi tạo & Trình duyệt', role: 'REQUESTER', status: 'COMPLETED', user: 'Trần Văn Mạnh (QA)', signedAt: '2026-01-14 16:00' }, { step: 2, name: 'Thẩm định Trưởng phòng', role: 'LEGAL', status: 'COMPLETED', user: 'Phạm Hồng Minh (QMS)', signedAt: '2026-01-15 08:00' }, { step: 3, name: 'Xác thực Chứng thư ISO', role: 'CFO', status: 'COMPLETED', user: 'Tổ chức SGS', signedAt: '2026-01-15 09:00' } ] },
    { id: 3, docCode: 'DMS-BOM-2026-012', title: 'Bản vẽ Thiết kế Kỹ thuật & Định mức BOM Bộ điều khiển PCB-V3', category: 'TECH_SPEC', categoryName: 'Bản vẽ Kỹ thuật & BOM', version: 'v3.1', fileSize: '12.6 MB', format: 'DWG/PDF', status: 'APPROVED', securityLevel: 'RESTRICTED', sha256Hash: 'f4e3d2c1b0a987654321fedcba0987654321fedcba0987654321fedcba098765', signedBy: 'Phòng Kỹ thuật R&D', signedAt: '2026-08-10 16:45:00', linkedModule: 'M15 Manufacturing MES', refDocNo: 'BOM-PCB-001', storageTier: 'COLD_GLACIER', retentionYears: 15, expireDate: '2041-08-10', workflowStage: 2, workflowSteps: [ { step: 1, name: 'Khởi tạo Thiết kế R&D', role: 'REQUESTER', status: 'COMPLETED', user: 'Đỗ Hùng Dũng (R&D)', signedAt: '2026-08-10 10:00' }, { step: 2, name: 'Phê duyệt Quản đốc MES', role: 'LEGAL', status: 'COMPLETED', user: 'Nguyễn Thị Hoa (Plant Mgr)', signedAt: '2026-08-10 16:45' }, { step: 3, name: 'Ký số Ban Giám Đốc', role: 'CFO', status: 'PENDING', user: 'Chờ Giám đốc Ký', signedAt: null } ] },
    { id: 4, docCode: 'DMS-VAT-2026-089', title: 'Hóa đơn Điện tử Giá trị Gia tăng GTGT - Đợt giao hàng T8/2026', category: 'FINANCIAL', categoryName: 'Hóa đơn & Chứng từ Kế toán', version: 'v1.0', fileSize: '850 KB', format: 'XML/PDF', status: 'SIGNED', securityLevel: 'CONFIDENTIAL', sha256Hash: '7b8a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b', signedBy: 'Kế toán trưởng (CFO)', signedAt: '2026-08-25 11:20:00', linkedModule: 'M22 Invoices AR/AP', refDocNo: 'INV-2026-0089', storageTier: 'ACTIVE_VAULT', retentionYears: 10, expireDate: '2036-08-25', workflowStage: 3, workflowSteps: [ { step: 1, name: 'Tạo Hóa đơn GTGT', role: 'REQUESTER', status: 'COMPLETED', user: 'Nguyễn Thị Thu (Kế toán AR)', signedAt: '2026-08-25 09:00' }, { step: 2, name: 'Đối soát 3 Bên 3-Way', role: 'LEGAL', status: 'COMPLETED', user: 'Trần Đức Hòa (Kế toán Tổng hợp)', signedAt: '2026-08-25 10:15' }, { step: 3, name: 'Ký số Kế toán trưởng', role: 'CFO', status: 'COMPLETED', user: 'Kế toán trưởng (CFO)', signedAt: '2026-08-25 11:20' } ] },
    { id: 5, docCode: 'DMS-OPS-2026-003', title: 'Quy trình Tiêu chuẩn Vận hành Kho Thông minh Smart WMS & Pick-to-Light', category: 'OPERATION', categoryName: 'Quy trình Vận hành Nội bộ', version: 'v1.5', fileSize: '3.1 MB', format: 'PDF', status: 'RELEASED', securityLevel: 'INTERNAL', sha256Hash: 'c9d8e7f6a5b4c3d2e1f09876543210fedcba9876543210fedcba9876543210fe', signedBy: 'Giám đốc Vận hành (COO)', signedAt: '2026-07-01 08:30:00', linkedModule: 'M07 Inventory Core', refDocNo: 'OPS-WMS-01', storageTier: 'ACTIVE_VAULT', retentionYears: 3, expireDate: '2029-07-01', workflowStage: 3, workflowSteps: [ { step: 1, name: 'Soạn thảo Hướng dẫn WMS', role: 'REQUESTER', status: 'COMPLETED', user: 'Vũ Minh Hoàng (WMS)', signedAt: '2026-06-30 14:00' }, { step: 2, name: 'Kiểm duyệt An toàn Kho', role: 'LEGAL', status: 'COMPLETED', user: 'Phạm Ngọc Thắng (EHS)', signedAt: '2026-07-01 08:00' }, { step: 3, name: 'Ban hành COO', role: 'CFO', status: 'COMPLETED', user: 'Giám đốc Vận hành (COO)', signedAt: '2026-07-01 08:30' } ] },
  ];

export let seedEhsIncidents = [
    { id: 1, recordCode: 'EHS-INC-2026-001', title: 'Tràn dầu bôi trơn tại khu vực Máy dập thủy lực Xưởng 2', incidentType: 'SPILL_HAZARD', severity: 'LOW', location: 'Xưởng Sản xuất 2 - Line CNC', reportedDate: '2026-08-22', status: 'RESOLVED', actionTaken: 'Sử dụng cát thấm dầu, cô lập rò rỉ và thay gioăng cao su', inspector: 'Vũ Đức Thịnh (EHS Officer)' },
    { id: 2, recordCode: 'EHS-INC-2026-002', title: 'Sự cố trượt chân nhẹ tại lối đi khu vực Staging Kho Tổng', incidentType: 'NEAR_MISS', severity: 'MEDIUM', location: 'Kho Tổng WH-01 - Khu vực Cửa Dock số 3', reportedDate: '2026-08-25', status: 'INVESTIGATING', actionTaken: 'Bổ sung thảm chống trượt và biển cảnh báo sàn ướt', inspector: 'Trần Văn Hưng (Safety Team)' },
  ];

export let seedEhsInspections = [
    { id: 1, checkCode: 'EHS-CHK-2026-08', title: 'Kiểm định An toàn Hệ thống PCCC & Bình chữa cháy Khí CO2', inspectionDate: '2026-08-15', passedItems: 48, totalItems: 50, result: 'PASSED', nextDueDate: '2026-11-15', certifiedBy: 'Cục Cảnh sát PCCC & CNCH' },
    { id: 2, checkCode: 'EHS-CHK-2026-07', title: 'Quan trắc Môi trường Lao động: Tiếng ồn & Nồng độ Bụi Xưởng Cơ khí', inspectionDate: '2026-07-20', passedItems: 30, totalItems: 30, result: 'PASSED', nextDueDate: '2027-01-20', certifiedBy: 'Trung tâm Quan trắc Môi trường' },
  ];

export let seedTickets = [
    { id: 1, ticketCode: 'IT-TKT-2026-0042', title: 'Máy in mã vạch Zebra ZT411 tại Kho WH-01 bị kẹt giấy và lệch cảm biến', category: 'HARDWARE', priority: 'HIGH', requester: 'Lê Hoàng Long (Thủ kho)', assignedTo: 'Đỗ Văn Toàn (IT Support)', status: 'IN_PROGRESS', slaHoursRemaining: 1.5, createdAt: '2026-08-27 08:30:00', resolutionNotes: 'Đang vệ sinh đầu in và cân chỉnh sensor nhiệt.' },
    { id: 2, ticketCode: 'IT-TKT-2026-0041', title: 'Yêu cầu cấp thêm quyền truy cập phân hệ Kế hoạch Cung ứng MRP (M16)', category: 'SOFTWARE_ACCESS', priority: 'NORMAL', requester: 'Phạm Thu Trang (QA)', assignedTo: 'Hoàng Nam (Admin)', status: 'OPEN', slaHoursRemaining: 4.0, createdAt: '2026-08-27 09:15:00', resolutionNotes: 'Đang đợi phê duyệt từ Trưởng phòng.' },
    { id: 3, ticketCode: 'IT-TKT-2026-0040', title: 'Lỗi đồng bộ dữ liệu tồn kho 3 trạng thái giữa POS và WMS tại Chi nhánh HCM', category: 'ERP_SYSTEM', priority: 'URGENT', requester: 'Nguyễn Văn An (Sản xuất)', assignedTo: 'ERP Support Team', status: 'RESOLVED', slaHoursRemaining: 0, createdAt: '2026-08-26 14:00:00', resolutionNotes: 'Đã xử lý xong Outbox message bị tắc và đối soát thành công.' },
    { id: 4, ticketCode: 'IT-TKT-2026-0039', title: 'Mạng LAN Xưởng Đóng gói LPN bị chập chờn khi kết nối đầu đọc RFID', category: 'NETWORK', priority: 'NORMAL', requester: 'Vũ Thị Hòa (Đóng gói)', assignedTo: 'Trần Văn Tuấn (Network Admin)', status: 'CLOSED', slaHoursRemaining: 0, createdAt: '2026-08-26 10:20:00', resolutionNotes: 'Đã thay thế switch cổng quang PoE và kiểm tra thông mạng 1Gbps.' },
  ];

export let seedProjectsList = [
    {
      id: 1,
      code: 'PRJ-2026-001',
      name: 'Triển khai Hệ thống ERP NexusSync Phase 2',
      category: 'ERP_IT',
      client: 'Tập đoàn NexusSync Việt Nam',
      manager: 'Nguyễn Văn An (PM Senior)',
      branch: 'BR_HO',
      startDate: '2026-01-15',
      endDate: '2026-10-30',
      budgetVND: 4500000000,
      actualCostVND: 2700000000,
      progressPct: 65,
      status: 'IN_PROGRESS',
      wbsTasksCount: 18,
      riskLevel: 'MEDIUM',
      description: 'Hợp nhất 40 phân hệ ERP, tích hợp AI Core & chuẩn hóa sổ cái đa chi nhánh.',
    },
    {
      id: 2,
      code: 'PRJ-2026-002',
      name: 'Xây dựng Nhà máy Chế biến Nông sản Cần Thơ',
      category: 'EPC_CONSTRUCTION',
      client: 'Công ty Cổ phần Nông sản Miền Tây',
      manager: 'Trần Thị Bình (EPC Lead)',
      branch: 'BR_CT',
      startDate: '2025-09-01',
      endDate: '2026-12-31',
      budgetVND: 18500000000,
      actualCostVND: 12200000000,
      progressPct: 72,
      status: 'IN_PROGRESS',
      wbsTasksCount: 32,
      riskLevel: 'LOW',
      description: 'Thi công nhà xưởng 12.000m2, lắp đặt dây chuyền cấp đông IQF tiêu chuẩn EU.',
    },
    {
      id: 3,
      code: 'PRJ-2026-003',
      name: 'Nâng cấp Hạ tầng Cloud Data Center & Security',
      category: 'INFRASTRUCTURE',
      client: 'Chi nhánh TP. Hồ Chí Minh',
      manager: 'Lê Hoàng Cường (Infra Spec)',
      branch: 'BR_HCM',
      startDate: '2026-03-01',
      endDate: '2026-08-15',
      budgetVND: 2800000000,
      actualCostVND: 2850000000,
      progressPct: 90,
      status: 'IN_PROGRESS',
      wbsTasksCount: 12,
      riskLevel: 'HIGH',
      description: 'Trang bị cụm Server Dell PowerEdge R760, tường lửa Palo Alto & chuẩn hóa ISO 27001.',
    },
  ];

