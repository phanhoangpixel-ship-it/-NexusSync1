/**
 * NEXUSSYNC ERP - M30 GENERAL LEDGER & M28 GOVERNANCE WORKFLOW DATA
 * Authoritative Cost Centers and Approval Matrix Engine
 */

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

// In-memory persistent master data for Cost Centers (linked to M30 General Ledger)
export const initialCostCenters: CostCenter[] = [
  {
    id: 1,
    code: 'CC-PROCUREMENT',
    name: 'Trung tâm Thu mua & Cung ứng Chiến lược',
    department: 'Khối Mua hàng & Chuỗi cung ứng',
    manager: 'Nguyễn Văn Thu Mua (Trưởng phòng Cung ứng)',
    allocatedBudget: 2000000000, // 2.000.000.000 VND
    committedBudget: 1200000000, // 1.200.000.000 VND
    actualSpent: 300000000,      // 300.000.000 VND
    availableBudget: 500000000,  // 500.000.000 VND
    currency: 'VND',
    fiscalYear: 2026,
    status: 'ACTIVE'
  },
  {
    id: 2,
    code: 'CC-MFG-01',
    name: 'Xưởng Sản Xuất & Lắp Ráp Bán Dẫn #1',
    department: 'Khối Vận hành Sản xuất',
    manager: 'Trần Đình Chế Tạo (Giám đốc Sản xuất)',
    allocatedBudget: 5000000000,
    committedBudget: 3800000000,
    actualSpent: 600000000,
    availableBudget: 600000000,
    currency: 'VND',
    fiscalYear: 2026,
    status: 'ACTIVE'
  },
  {
    id: 3,
    code: 'CC-IT',
    name: 'Khối Công Nghệ Thông Tin & Hạ Tầng ERP',
    department: 'Khối Công nghệ Thông tin',
    manager: 'Lê Công Nghệ (Trưởng ban IT & Systems)',
    allocatedBudget: 1500000000,
    committedBudget: 1350000000,
    actualSpent: 50000000,
    availableBudget: 100000000,
    currency: 'VND',
    fiscalYear: 2026,
    status: 'ACTIVE'
  },
  {
    id: 4,
    code: 'CC-WH-MAIN',
    name: 'Kho Vận & Logistics Tổng Trung Tâm',
    department: 'Khối Kho vận & Chuỗi cung ứng',
    manager: 'Phạm Kho Vận (Trưởng phòng Logistics)',
    allocatedBudget: 1000000000,
    committedBudget: 600000000,
    actualSpent: 100000000,
    availableBudget: 300000000,
    currency: 'VND',
    fiscalYear: 2026,
    status: 'ACTIVE'
  },
  {
    id: 5,
    code: 'CC-RD',
    name: 'Viện R&D Nghiên Cứu Vi Mạch & Vật Liệu',
    department: 'Khối Nghiên cứu & Phát triển',
    manager: 'Hoàng Nghiên Cứu (Giám đốc R&D)',
    allocatedBudget: 800000000,
    committedBudget: 720000000,
    actualSpent: 40000000,
    availableBudget: 40000000,
    currency: 'VND',
    fiscalYear: 2026,
    status: 'ACTIVE'
  }
];

export class OrgBudgetService {
  private static costCenters: CostCenter[] = [...initialCostCenters];

  public static getAllCostCenters(): CostCenter[] {
    return this.costCenters.map(cc => ({
      ...cc,
      availableBudget: Math.max(0, cc.allocatedBudget - cc.committedBudget - cc.actualSpent)
    }));
  }

  public static getCostCenterByCode(code: string): CostCenter | undefined {
    const cleanCode = code ? code.trim().toUpperCase() : '';
    const found = this.costCenters.find(cc => 
      cc.code.toUpperCase() === cleanCode ||
      cleanCode.includes(cc.code.toUpperCase()) ||
      cc.name.toUpperCase().includes(cleanCode)
    );
    if (!found) return undefined;
    return {
      ...found,
      availableBudget: Math.max(0, found.allocatedBudget - found.committedBudget - found.actualSpent)
    };
  }

  /**
   * Phase 8: Hard Budget Guard Check
   * Returns allowed status, available budget, and deficit if exceeded.
   */
  public static checkBudget(code: string, requestedAmount: number): {
    allowed: boolean;
    costCenter: CostCenter;
    availableBudget: number;
    deficit: number;
    requiresOverride: boolean;
    message: string;
  } {
    let cc = this.getCostCenterByCode(code);
    if (!cc) {
      // Fallback to CC-PROCUREMENT if unknown
      cc = this.getCostCenterByCode('CC-PROCUREMENT') || this.costCenters[0];
    }

    const available = cc.availableBudget;
    const deficit = requestedAmount - available;

    if (deficit > 0) {
      return {
        allowed: false,
        costCenter: cc,
        availableBudget: available,
        deficit,
        requiresOverride: true,
        message: `Hành động trao thầu bị CHẶN CỨNG theo chính sách kiểm soát ngân sách M30: Giá trị đề xuất trao thầu (${requestedAmount.toLocaleString()} VND) vượt quá ngân sách khả dụng của Trung tâm chi phí [${cc.code}] (${available.toLocaleString()} VND). Thâm hụt: ${deficit.toLocaleString()} VND.`
      };
    }

    return {
      allowed: true,
      costCenter: cc,
      availableBudget: available,
      deficit: 0,
      requiresOverride: false,
      message: `Ngân sách hợp lệ. Cost Center [${cc.code}] còn khả dụng ${available.toLocaleString()} VND (sau khi trừ: ${(available - requestedAmount).toLocaleString()} VND).`
    };
  }

  /**
   * Commit budget upon successful award approval
   */
  public static commitBudget(code: string, amount: number): boolean {
    const idx = this.costCenters.findIndex(cc => 
      cc.code.toUpperCase() === (code || '').trim().toUpperCase()
    );
    if (idx >= 0) {
      this.costCenters[idx].committedBudget += amount;
      this.costCenters[idx].availableBudget = Math.max(
        0, 
        this.costCenters[idx].allocatedBudget - this.costCenters[idx].committedBudget - this.costCenters[idx].actualSpent
      );
      return true;
    }
    return false;
  }
}

/**
 * Phase 9: Multi-Tier Approval Matrix Engine (M28 Governance)
 */
export class WorkflowMatrixEngine {
  public static readonly SINGLE_TIER_THRESHOLD = 500000000;  // 500.000.000 VND
  public static readonly EXECUTIVE_THRESHOLD = 2000000000;    // 2.000.000.000 VND

  public static evaluateMatrix(
    amount: number, 
    entityType: string = 'SOURCING_AWARD', 
    currency: string = 'VND'
  ): ApprovalMatrixResult {
    const numAmount = Number(amount) || 0;

    // Level 1: <= 500.000.000 VNĐ -> Standard Single-Tier Approval
    if (numAmount <= this.SINGLE_TIER_THRESHOLD) {
      return {
        routeType: 'STANDARD',
        requiresMultiTier: false,
        thresholdLimit: this.SINGLE_TIER_THRESHOLD,
        amount: numAmount,
        currency,
        totalTiers: 1,
        currentTier: 1,
        triggerReason: 'Gói thầu nằm trong thẩm quyền hạn mức đơn cấp (≤ 500.000.000 VNĐ). Duyệt trực tiếp bởi Trưởng phòng Mua sắm.',
        ruleReference: 'M28-MTRX-LVL1 (Standard Delegation of Authority)',
        tiers: [
          {
            tierNumber: 1,
            role: 'PROCUREMENT_MANAGER',
            roleTitle: 'Trưởng phòng Mua sắm (Procurement Manager)',
            slaHours: 24,
            status: 'PENDING'
          }
        ]
      };
    }

    // Level 2: > 500.000.000 VNĐ & <= 2.000.000.000 VNĐ -> Two-Tier Multi-Approval
    if (numAmount <= this.EXECUTIVE_THRESHOLD) {
      return {
        routeType: 'MULTI_TIER_DIRECTOR',
        requiresMultiTier: true,
        thresholdLimit: this.SINGLE_TIER_THRESHOLD,
        amount: numAmount,
        currency,
        totalTiers: 2,
        currentTier: 1,
        triggerReason: 'Gói thầu vượt hạn mức thẩm quyền đơn cấp (> 500.000.000 VNĐ). Tự động chuyển sang luồng duyệt 2 cấp qua M28 Workflow Matrix.',
        ruleReference: 'M28-MTRX-LVL2 (Departmental Escalation)',
        tiers: [
          {
            tierNumber: 1,
            role: 'PROCUREMENT_MANAGER',
            roleTitle: 'Trưởng phòng Mua sắm (Cấp 1 - Đánh giá kỹ thuật & thương mại)',
            slaHours: 24,
            status: 'PENDING'
          },
          {
            tierNumber: 2,
            role: 'PROCUREMENT_DIRECTOR',
            roleTitle: 'Giám đốc Khối Cung ứng & Mua sắm / CPO (Cấp 2 - Phê duyệt hạn mức)',
            slaHours: 48,
            status: 'QUEUED'
          }
        ]
      };
    }

    // Level 3: > 2.000.000.000 VNĐ -> Three-Tier Multi-Approval (CFO / CEO Level)
    return {
      routeType: 'MULTI_TIER_EXECUTIVE',
      requiresMultiTier: true,
      thresholdLimit: this.EXECUTIVE_THRESHOLD,
      amount: numAmount,
      currency,
      totalTiers: 3,
      currentTier: 1,
      triggerReason: 'Gói thầu quy mô chiến lược (> 2.000.000.000 VNĐ). Tự động chuyển sang luồng duyệt đa cấp Ban Điều hành (CFO/CEO) M28.',
      ruleReference: 'M28-MTRX-LVL3 (Executive Board Authorization)',
      tiers: [
        {
          tierNumber: 1,
          role: 'PROCUREMENT_MANAGER',
          roleTitle: 'Trưởng phòng Mua sắm (Cấp 1 - Trình hồ sơ thẩm định)',
          slaHours: 24,
          status: 'PENDING'
        },
        {
          tierNumber: 2,
          role: 'PROCUREMENT_DIRECTOR',
          roleTitle: 'Giám đốc Khối Mua sắm / CPO (Cấp 2 - Xác nhận chiến lược nhà cung cấp)',
          slaHours: 48,
          status: 'QUEUED'
        },
        {
          tierNumber: 3,
          role: 'CHIEF_FINANCIAL_OFFICER',
          roleTitle: 'Giám đốc Tài chính (CFO) / Tổng Giám đốc (CEO) (Cấp 3 - Phê duyệt ngân sách & cam kết thanh toán)',
          slaHours: 72,
          status: 'QUEUED'
        }
      ]
    };
  }
}
