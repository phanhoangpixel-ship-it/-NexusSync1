export interface SourcingPackageItem {
  id: number;
  packageCode: string;
  title: string;
  category: string;
  estimatedBudget: number;
  costCenter: string;
  submissionDeadline?: string | null;
  status: string;
  description?: string | null;
  rfqCount?: number;
  rfqs?: Array<{ id: number; code: string; title: string; status: string; deadline?: string }>;
  createdAt?: string;
}

export interface RFQItem {
  id: string;
  dbId?: number;
  code?: string;
  packageId?: number | null;
  packageCode?: string | null;
  title: string;
  category?: string;
  deadline?: string;
  currentRound?: number;
  productId?: number;
  targetQuantity?: number;
  budgetEstimate?: string | number;
  bidsCount?: number;
  itemsCount?: number;
  status: string;
}

export interface BidItem {
  id: number;
  rfqId: number;
  supplierId: number;
  roundNumber?: number;
  supplierName?: string;
  supplierCode?: string;
  totalValue?: number;
  unitPrice?: number;
  offeredQuantity?: number;
  leadTimeDays?: number;
  status: string;
  submittedAt?: string;
  previousRoundValue?: number;
  priceReductionPercent?: number;
}

export interface ReverseAuctionRoundItem {
  id: number;
  rfqId: number;
  roundNumber: number;
  status: string;
  targetReductionPercent?: number;
  ceilingPrice?: number;
  deadline?: string;
  notes?: string;
  openedAt?: string;
  closedAt?: string;
  lowestBid?: number;
  leadingSupplierName?: string;
  totalBidsInRound?: number;
  reductionFromPreviousRound?: number;
}

export interface ReverseAuctionHistory {
  rfqId: number;
  rfqCode: string;
  currentRound: number;
  rounds: ReverseAuctionRoundItem[];
  bidsHistory: Array<{
    supplierId: number;
    supplierName: string;
    supplierCode: string;
    roundBids: Record<number, { bidId: number; totalValue: number; unitPrice?: number; status: string; submittedAt?: string }>;
    initialValue: number;
    latestValue: number;
    totalReductionAmount: number;
    totalReductionPercent: number;
  }>;
  round1Lowest: number;
  currentLowest: number;
  totalSavingsAmount: number;
  totalSavingsPercent: number;
}

export interface EvaluationItem {
  id: number;
  rfqId: number;
  bidId: number;
  totalScore: number;
  status: string;
  criteriaScores?: Array<{
    criterionName: string;
    weight: number;
    score: number;
  }>;
}

export interface M11ScorecardData {
  otifRate: string;
  otifRateNumeric: number;
  qualityScore: string;
  qualityScoreNumeric: number;
  complianceScore: string;
  complianceScoreNumeric: number;
  compositeScore: number;
  performanceTier: string;
  overallRating: string;
}

export interface BPABenchmarkData {
  hasAgreement: boolean;
  contractCode?: string;
  contractTitle?: string;
  contractStatus?: string;
  lockedPrice?: number;
  offeredPrice?: number;
  varianceAmount?: number;
  variancePercent?: number;
  thresholdPercent: number;
  isExceedingLimit: boolean;
  flag: 'EXCEEDS_LIMIT' | 'WITHIN_TOLERANCE' | 'FAVORABLE' | 'NO_BPA';
  warningMessage: string;
  matchedItemName?: string;
  matchedItemCode?: string;
}

export interface ComparisonItem {
  bidId: number;
  supplierId?: number;
  supplierName: string;
  supplierCode?: string;
  roundNumber?: number;
  status?: string;
  currency?: string;
  unitPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  leadTimeDays?: number;
  paymentTerms?: string;
  totalValue: number;
  isLowestPrice?: boolean;
  varianceFromLowestAmount?: number;
  varianceFromLowestPercent?: number;
  totalScore: number;
  ranking: number;
  evaluationStatus: string;
  scoresBreakdown?: {
    commercial: number;
    technical: number;
    sla: number;
    compliance: number;
  };
  m11Scorecard?: M11ScorecardData;
  bpaBenchmark?: BPABenchmarkData;
  items?: Array<{
    id: number;
    rfqItemId: number;
    productName: string;
    sku: string;
    offeredQuantity: number;
    unitPrice: number;
    leadTimeDays: number;
    lineTotal: number;
  }>;
}

export interface CostCenter {
  id: number;
  code: string;
  name: string;
  department: string;
  manager: string;
  allocatedBudget: number;
  committedBudget: number;
  actualSpent: number;
  availableBudget: number;
  currency: string;
  fiscalYear: number;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
}

export interface ApprovalTier {
  tierNumber: number;
  role: string;
  roleTitle: string;
  slaHours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'QUEUED';
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

export interface ApprovalMatrixResult {
  routeType: 'STANDARD' | 'MULTI_TIER_DIRECTOR' | 'MULTI_TIER_EXECUTIVE';
  requiresMultiTier: boolean;
  thresholdLimit: number;
  amount: number;
  currency: string;
  totalTiers: number;
  currentTier: number;
  tiers: ApprovalTier[];
  triggerReason: string;
  ruleReference: string;
}

export interface AwardItem {
  id: number;
  awardNo: string;
  rfqId: number;
  supplierId: number;
  supplierName?: string;
  totalAmount: number;
  status: string;
  costCenter?: string;
  workflowMatrix?: ApprovalMatrixResult;
  poCode?: string;
  poId?: number;
  dmsVault?: {
    id: number;
    docCode: string;
    title: string;
    sha256Hash: string;
    status: string;
    storageTier: string;
    signedAt?: string;
    signedBy?: string;
  };
}

export interface InvitedSupplier {
  id: number;
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  taxId?: string;
  status: string;
  invitedAt?: string;
}

export interface MasterSupplierOption {
  id: number;
  code: string;
  name: string;
  status?: string;
  performanceTier?: string;
  compositeScore?: number;
  isEligible?: boolean;
  ineligibilityReason?: string;
}

export interface MasterProductOption {
  id: number;
  code: string;
  name: string;
  category?: string;
}
