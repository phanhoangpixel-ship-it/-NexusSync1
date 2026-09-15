export interface RFQItem {
  id: string;
  dbId?: number;
  title: string;
  category?: string;
  deadline?: string;
  productId?: number;
  targetQuantity?: number;
  budgetEstimate?: string | number;
  status: string;
}

export interface BidItem {
  id: number;
  rfqId: number;
  supplierId: number;
  supplierName?: string;
  totalValue?: number;
  unitPrice?: number;
  offeredQuantity?: number;
  leadTimeDays?: number;
  status: string;
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

export interface ComparisonItem {
  bidId: number;
  supplierName: string;
  totalValue: number;
  totalScore: number;
  ranking: number;
  evaluationStatus: string;
}

export interface AwardItem {
  id: number;
  awardNo: string;
  rfqId: number;
  supplierId: number;
  supplierName?: string;
  totalAmount: number;
  status: string;
  poCode?: string;
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
}

export interface MasterProductOption {
  id: number;
  code: string;
  name: string;
  category?: string;
}
