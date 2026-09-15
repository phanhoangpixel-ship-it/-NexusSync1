// Enterprise Consolidation, Elimination & Transfer Pricing Master Records
export let consolidationEntities = [
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

export let intercompanyEliminations = [
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

export let fxRules = [
  { currency: 'USD', closingRate: 25400, averageRate: 25250, historicalRate: 24800, ctaReserveVND: 180000000, lastUpdated: '2026-08-28' },
  { currency: 'EUR', closingRate: 27500, averageRate: 27300, historicalRate: 26900, ctaReserveVND: 95000000, lastUpdated: '2026-08-28' }
];

export let transferPricingData = {
  decree132ComplianceStatus: "COMPLIANT",
  financialYear: "2026",
  groupGlobalThresholdEUR: 750000000,
  groupGlobalRevenueEUR: 820000000,
  globeEffectiveTaxRates: [
    {
      jurisdiction: "Vietnam (HQ & Subsidiaries)",
      statutoryTaxRate: 0.20,
      adjustedGlobeIncome: 14400000000,
      coveredTaxes: 2880000000,
      effectiveTaxRate: 0.20,
      topUpTaxRate: 0.0,
      topUpTaxAmountVND: 0,
      status: "SAFE_HARBOR_PASSED"
    },
    {
      jurisdiction: "Singapore (NexusSync Asia-Pacific)",
      statutoryTaxRate: 0.17,
      concessionaryTaxRate: 0.10,
      adjustedGlobeIncome: 7620000000,
      coveredTaxes: 762000000,
      effectiveTaxRate: 0.10,
      topUpTaxRate: 0.05,
      topUpTaxAmountVND: 381000000,
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
      title: "Hồ Sơ Toàn Tập Đoàn (Master File - Nghị Định 132)",
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
      title: "Báo Cáo Lợi Nhuận Liên Quốc Gia (CbCR - Mẫu 04/TĐ)",
      status: "GENERATED",
      lastUpdated: "2026-08-28",
      fileSize: "1.8 MB",
      summary: "Khai báo phân bổ doanh thu, thuế TNDN đã nộp và số lượng nhân sự giữa Việt Nam và Singapore theo quy chuẩn OECD Action 13."
    }
  ]
};
