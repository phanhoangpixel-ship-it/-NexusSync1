export interface SupplierItem {
  id: number;
  code: string;
  name: string;
  taxCode?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  performanceTier?: string;
  compositeScore?: number;
  otifRate?: string;
  qualityScore?: string;
  complianceScore?: string;
  rating?: string;
  totalSpend?: number;
  poCount?: number;
  activePOCount?: number;
  completedPOCount?: number;
  scorecards?: ScorecardItem[];
  contacts?: any[];
  bankAccounts?: any[];
  notes?: string;
}

export interface ScorecardItem {
  id: string;
  supplierId?: number;
  supplierName: string;
  supplierCode?: string;
  period: string;
  otifRate: string;
  qualityScore: string;
  complianceScore: string;
  serviceScore?: string;
  overallRating: string;
  compositeScore?: number;
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' | string;
  evaluator: string;
  evaluationDate: string;
  notes?: string;
}

export interface SupplierAuditItem {
  id: string;
  auditCode: string;
  supplierId: number;
  supplierName: string;
  supplierCode: string;
  auditType: 'FACTORY_CAPACITY' | 'ESG_ENVIRONMENT' | 'QUALITY_ISO' | 'SECURITY_SLA';
  leadAuditor: string;
  auditDate: string;
  score: number;
  result: 'PASSED' | 'PASSED_WITH_CONDITIONS' | 'FAILED' | 'SCHEDULED' | 'IN_PROGRESS';
  findingsCount: number;
  criticalIssues: number;
  recommendations?: string;
  status: string;
}

export interface SrmPerformanceMetric {
  supplierId: number;
  supplierName: string;
  supplierCode: string;
  tier: string;
  totalOrders: number;
  onTimeOrders: number;
  otifPercent: number;
  inspectedLots: number;
  passedLots: number;
  qualityPercent: number;
  leadTimeAvgDays: number;
  slaCompliancePercent: number;
  trend: 'UP' | 'STABLE' | 'DOWN';
}

export interface PriceLockItem {
  itemCode: string;
  itemName: string;
  lockedPrice: number;
  unit: string;
}

export interface RenewalHistoryEntry {
  renewalDate: string;
  previousEndDate: string;
  newEndDate: string;
  renewedBy: string;
  committedValueAdded: number;
  notes?: string;
}

export interface FrameworkContractItem {
  id: string;
  contractCode?: string;
  title: string;
  supplier: string;
  supplierId?: number;
  supplierCode?: string;
  contractType?: 'FRAMEWORK_BPA' | 'PRICE_LOCK' | 'SERVICE_SLA' | 'LONG_TERM_SUPPLY';
  startDate: string;
  endDate: string;
  committedValue: number;
  usedValue: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_RENEWAL' | 'TERMINATED' | 'UNDER_REVIEW';
  discountRate?: number;
  paymentTerms?: string;
  slaTargetOtif?: number;
  slaTargetQuality?: number;
  autoRenewalNoticeDays?: number;
  priceLocks?: PriceLockItem[];
  renewalHistory?: RenewalHistoryEntry[];
  notes?: string;
}

export interface ContractExpiryAlert {
  contractId: string;
  contractCode: string;
  title: string;
  supplierName: string;
  endDate: string;
  daysRemaining: number;
  urgency: 'EXPIRED' | 'CRITICAL_30D' | 'WARNING_60D' | 'UPCOMING_90D';
  committedValue: number;
  usedValue: number;
  utilizationPercent: number;
}

