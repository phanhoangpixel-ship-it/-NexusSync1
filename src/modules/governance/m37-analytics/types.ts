export type AnalyticsScope = 'BRANCH' | 'CONSOLIDATED';
export type ReportType = 'PNL' | 'CASHFLOW' | 'TURNOVER_RATIOS' | 'FORECAST' | 'KPI_SUMMARY';
export type ExportFormat = 'EXCEL' | 'PDF' | 'CSV';
export type ExportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface PnLStatementLine {
  code: string; // e.g. "REV_511", "COGS_632", "GROSS_PROFIT", "OPEX_641_642", "NET_PROFIT"
  lineName: string;
  accountGroup: string;
  amount: number;
  priorPeriodAmount: number;
  growthPct: number;
}

export interface PnLReportResult {
  periodCode: string;
  year: number;
  scope: AnalyticsScope;
  branchId?: number | null;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  netProfitBeforeTax: number;
  netMarginPct: number;
  lines: PnLStatementLine[];
  source: 'M30_GENERAL_LEDGER';
  calculatedAt: string;
}

export interface CashFlowLine {
  category: 'OPERATING' | 'INVESTING' | 'FINANCING';
  code: string;
  description: string;
  inflow: number;
  outflow: number;
  netCash: number;
}

export interface CashFlowReportResult {
  periodCode: string;
  year: number;
  scope: AnalyticsScope;
  branchId?: number | null;
  openingCashBalance: number; // Matched with M32/M33 cash & bank
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  closingCashBalance: number; // Matched with M32/M33 cash & bank
  lines: CashFlowLine[];
  source: 'M32_PAYMENTS_M33_BANK_M30_GL';
  calculatedAt: string;
}

export interface FinancialRatiosResult {
  periodCode: string;
  year: number;
  // Inventory turnover & efficiency
  cogsAmount: number;
  averageInventoryValue: number;
  inventoryTurnoverRatio: number; // COGS / Avg Inventory
  daysSalesInInventory: number; // 365 / Inventory Turnover

  // Working capital & liquidity
  receivablesBalance: number; // Accounts 131
  revenueAmount: number;
  dso: number; // Days Sales Outstanding: (AR / Revenue) * 365

  payablesBalance: number; // Accounts 331
  dpo: number; // Days Payable Outstanding: (AP / COGS) * 365

  cashConversionCycle: number; // DSO + DSI - DPO

  currentAssets: number;
  currentLiabilities: number;
  currentRatio: number; // Assets / Liabilities
  quickRatio: number; // (Cash + AR) / Liabilities

  calculatedAt: string;
}

export interface Forecast90Day {
  dayOffset: number;
  dateStr: string;
  predictedRevenue: number;
  predictedCashInflow: number;
  predictedCashOutflow: number;
  projectedCashBalance: number;
  confidenceMin: number;
  confidenceMax: number;
}

export interface ExecutiveKpiSummary {
  periodCode: string;
  year: number;
  scope: AnalyticsScope;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPct: number;
  netProfit: number;
  netMarginPct: number;
  operatingExpenses: number;
  cashBalance: number;
  inventoryTurnover: number;
  dso: number;
  dpo: number;
  currentRatio: number;
  revenueGrowthYoY: number;
  cogsVariancePct: number;
  profitGrowthYoY: number;
  calculatedAt: string;
}

export interface ExportJobRecord {
  id: number;
  jobId: string;
  idempotencyKey: string;
  reportType: ReportType;
  scope: AnalyticsScope;
  branchId?: number | null;
  periodId?: string | null;
  format: ExportFormat;
  status: ExportJobStatus;
  filePath?: string | null;
  dmsDocId?: number | null;
  errorMessage?: string | null;
  createdBy?: number | null;
  createdAt: string;
  completedAt?: string | null;
}
