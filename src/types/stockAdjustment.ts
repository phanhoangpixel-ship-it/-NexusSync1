export type StockAdjustmentType = 'FOUND' | 'LOST' | 'EXPIRED' | 'DAMAGED' | 'PROMO' | 'CORRECTION' | 'WRITE_OFF';
export type StockAdjustmentDirection = 'INCREASE' | 'DECREASE';
export type StockAdjustmentStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type EvidenceType = 'DAMAGE' | 'EXPIRED' | 'LOSS' | 'GENERAL';

export interface StockAdjustmentItem {
  id?: number;
  adjustmentId?: number;
  productId: number;
  quantity: number;
  unitCost?: number;
  lotId?: number | null;
  serialNumbers?: string[];
  reason?: string;
}

export interface StockAdjustmentRecord {
  id: number;
  code: string;
  warehouseId: number;
  adjustmentType: StockAdjustmentType;
  reason: string;
  sourceType?: string | null;
  sourceId?: string | null;
  status: StockAdjustmentStatus;
  approvalLevelRequired: number;
  approvalStatus: string;
  flaggedForReview: boolean;
  evidenceDocId?: number | null;
  notes?: string;
  createdBy: number;
  approvedBy?: number | null;
  createdAt: string;
  items?: StockAdjustmentItem[];
}
