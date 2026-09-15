import { db } from "../src/db/index";
import { 
  projects, projectWbs, projectTasks, projectBudgets, projectCosts, 
  projectSubcontracts, projectBudgetVersions, projectEvmSnapshots, projectMilestones, outboxEvents 
} from "../src/db/schema";
import { eq, and, sql, sum } from "drizzle-orm";
import { InventoryService } from "./inventoryService";
import { costingEngine } from "./costingEngine";
import { accountingEngine } from "./accountingEngine";

export interface EvmResult {
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
}

export class ProjectService {
  /**
   * Calculate Earned Value Management (EVM) metrics for a project
   * Safe against zero denominators (CPI = 1.0 if AC = 0, SPI = 1.0 if PV = 0)
   */
  static calculateEvmMetrics(
    totalBudget: number,
    plannedProgress: number,
    actualProgress: number,
    actualCost: number
  ): EvmResult {
    const bac = totalBudget || 0;
    const pv = bac * ((plannedProgress || 0) / 100);
    const ev = bac * ((actualProgress || 0) / 100);
    const ac = actualCost || 0;

    const cv = ev - ac;
    const sv = ev - pv;

    const cpi = ac > 0 ? Number((ev / ac).toFixed(2)) : 1.0;
    const spi = pv > 0 ? Number((ev / pv).toFixed(2)) : 1.0;

    const eac = cpi > 0 ? Number((bac / cpi).toFixed(2)) : bac;

    return { bac, pv, ev, ac, cv, sv, cpi, spi, eac };
  }

  /**
   * Recalculate project overall progress and EVM metrics and sync back to projects table
   */
  static async syncProjectProgressAndEvm(projectId: number) {
    const [p] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!p) return null;

    const tasks = await db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId));
    const costs = await db.select().from(projectCosts).where(eq(projectCosts.projectId, projectId));

    let totalTaskBudget = 0;
    let weightedActualProgress = 0;
    let weightedPlannedProgress = 0;

    if (tasks.length > 0) {
      for (const t of tasks) {
        const b = t.budgetAmount || 1;
        totalTaskBudget += b;
        weightedActualProgress += (t.actualProgress || 0) * b;
        weightedPlannedProgress += (t.plannedProgress || 0) * b;
      }
    }

    const totalWeight = totalTaskBudget > 0 ? totalTaskBudget : 1;
    const overallActualProgress = Number((weightedActualProgress / totalWeight).toFixed(2));
    const overallPlannedProgress = Number((weightedPlannedProgress / totalWeight).toFixed(2));

    const totalActualCost = costs.reduce((s, c) => s + (c.amount || 0), 0);
    const evm = this.calculateEvmMetrics(p.totalBudget, overallPlannedProgress, overallActualProgress, totalActualCost);

    await db.update(projects).set({
      actualCost: totalActualCost,
      plannedValue: evm.pv,
      earnedValue: evm.ev,
      cpi: evm.cpi,
      spi: evm.spi,
      eac: evm.eac,
      updatedAt: new Date()
    } as any).where(eq(projects.id, projectId));

    return { overallActualProgress, overallPlannedProgress, evm };
  }

  /**
   * Validate and transition project status state machine (PRJ-001)
   */
  static validateStatusTransition(currentStatus: string, targetStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["APPROVED", "CANCELLED"],
      APPROVED: ["ACTIVE", "ON_HOLD", "CANCELLED"],
      ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
      ON_HOLD: ["ACTIVE", "CANCELLED"],
      COMPLETED: ["CLOSED"],
      CLOSED: [],
      CANCELLED: []
    };

    const allowed = validTransitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Post Material Job Cost Issue to WBS task
   * Strictly delegates to InventoryService.postTransaction('GOODS_ISSUE')
   */
  static async postMaterialIssueToProject(params: {
    projectId: number;
    taskId?: number;
    wbsId?: number;
    warehouseId: number;
    locationId?: number;
    productId: number;
    quantity: number;
    referenceNo?: string;
    userId: number;
  }) {
    return await db.transaction(async (tx) => {
      const [p] = await tx.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
      if (!p) throw new Error("Dự án không tồn tại");
      if (p.status === "CLOSED" || p.status === "CANCELLED") {
        throw new Error(`Không thể xuất vật tư cho dự án ở trạng thái ${p.status}`);
      }

      const refNo = params.referenceNo || `PCE-MAT-${Date.now()}`;

      // Delegate to InventoryService single write path
      await InventoryService.postTransaction(tx, {
        productId: params.productId,
        warehouseId: params.warehouseId,
        locationId: params.locationId || null,
        type: "GOODS_ISSUE",
        referenceNo: refNo,
        quantity: -Math.abs(params.quantity), // Negative for issue
        notes: `Xuất vật tư công trình ${p.code}`,
        userId: params.userId,
        referenceId: params.projectId
      });

      // Get valuation from CostingEngine
      const unitPrice = await costingEngine.resolveUnitCost({
        productId: params.productId,
        warehouseId: params.warehouseId,
        direction: "DECREASE",
        quantity: params.quantity
      }, tx);

      const totalAmount = (unitPrice || 0) * params.quantity;

      // Log project cost entry
      const [costEntry] = await tx.insert(projectCosts).values({
        projectId: params.projectId,
        taskId: params.taskId || null,
        costType: "MATERIAL",
        description: `Xuất kho vật tư ID:${params.productId} x ${params.quantity}`,
        amount: totalAmount,
        referenceNo: refNo,
        date: new Date().toISOString().slice(0, 10),
        recordedBy: `User:${params.userId}`,
        createdAt: new Date()
      } as any).returning();

      // Recalculate project totals
      const allCosts = await tx.select().from(projectCosts).where(eq(projectCosts.projectId, params.projectId));
      const newActualCost = allCosts.reduce((s, c) => s + (c.amount || 0), 0);

      await tx.update(projects).set({
        actualCost: newActualCost,
        updatedAt: new Date()
      } as any).where(eq(projects.id, params.projectId));

      // Post VAS GL Journal Entry (WIP TK 154 / Stock TK 152)
      try {
        await accountingEngine.postJournalEntry({
          sourceModule: "PROJECT",
          sourceDocumentType: "PROJECT_COST",
          sourceDocumentId: costEntry.id,
          sourceReferenceNo: refNo,
          debitAccount: "154",
          creditAccount: "152",
          amount: totalAmount,
          description: `Ghi nhận chi phí nguyên vật liệu trực tiếp công trình ${p.code}`,
          branchId: params.warehouseId,
          userId: params.userId
        }, tx);
      } catch (glError) {
        console.warn("Project GL Posting Warning:", glError);
      }

      return { success: true, costEntry, totalAmount };
    });
  }

  /**
   * Submit and Approve Budget Change Request (BCR) (PRJ-005)
   */
  static async createBudgetRevision(params: {
    projectId: number;
    bcrCode: string;
    materialBudget: number;
    laborBudget: number;
    equipmentBudget: number;
    subcontractBudget: number;
    overheadBudget: number;
    contingencyBudget: number;
    changeReason: string;
    approvedByUserId: number;
  }) {
    return await db.transaction(async (tx) => {
      const [p] = await tx.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
      if (!p) throw new Error("Dự án không tồn tại");

      const existingVersions = await tx.select().from(projectBudgetVersions)
        .where(eq(projectBudgetVersions.projectId, params.projectId));
      
      const newVerNumber = existingVersions.length + 1;
      const versionCode = `v${newVerNumber}.0`;

      const totalBudget = (params.materialBudget || 0) +
        (params.laborBudget || 0) +
        (params.equipmentBudget || 0) +
        (params.subcontractBudget || 0) +
        (params.overheadBudget || 0) +
        (params.contingencyBudget || 0);

      const [version] = await tx.insert(projectBudgetVersions).values({
        projectId: params.projectId,
        versionCode,
        bcrCode: params.bcrCode || `BCR-${p.code}-${newVerNumber}`,
        materialBudget: params.materialBudget || 0,
        laborBudget: params.laborBudget || 0,
        equipmentBudget: params.equipmentBudget || 0,
        subcontractBudget: params.subcontractBudget || 0,
        overheadBudget: params.overheadBudget || 0,
        contingencyBudget: params.contingencyBudget || 0,
        totalBudget,
        changeReason: params.changeReason,
        status: "APPROVED",
        approvedBy: params.approvedByUserId,
        approvedAt: new Date(),
        createdAt: new Date()
      } as any).returning();

      // Update project master budget baseline
      await tx.update(projects).set({
        totalBudget,
        revisionNo: versionCode,
        updatedAt: new Date()
      } as any).where(eq(projects.id, params.projectId));

      return { success: true, version, totalBudget };
    });
  }

  /**
   * Percentage of Completion (POC) Revenue Recognition (PRJ-013)
   * Formula: (Actual Cost / Total Budget) * Contract Value
   */
  static calculatePocRevenue(
    contractValue: number,
    actualCost: number,
    totalBudget: number
  ): { pocPercent: number; recognizedRevenue: number } {
    if (!totalBudget || totalBudget <= 0) return { pocPercent: 0, recognizedRevenue: 0 };
    const poc = Math.min(1.0, actualCost / totalBudget);
    const pocPercent = Number((poc * 100).toFixed(2));
    const recognizedRevenue = Number((contractValue * poc).toFixed(2));
    return { pocPercent, recognizedRevenue };
  }

  /**
   * Complete / Signoff Project Milestone (PRJ-012 / PRJ-014)
   * Emits MilestoneCompleted event atomically inside domain transaction
   */
  static async completeMilestone(params: {
    milestoneId: number;
    userId: number;
    completionPercentage?: number;
    notes?: string;
  }) {
    return await db.transaction(async (tx) => {
      const [ms] = await tx.select().from(projectMilestones).where(eq(projectMilestones.id, params.milestoneId)).limit(1);
      if (!ms) throw new Error("Mốc nghiệm thu không tồn tại");

      const [updatedMs] = await tx.update(projectMilestones).set({
        status: "COMPLETED",
        completionPercentage: params.completionPercentage ?? 100
      } as any).where(eq(projectMilestones.id, params.milestoneId)).returning();

      const [proj] = await tx.select().from(projects).where(eq(projects.id, updatedMs.projectId)).limit(1);

      // Atomic Event Outbox Insertion inside Domain Transaction
      await tx.insert(outboxEvents).values({
        eventId: `EVT-PRJ-MS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        eventType: "MilestoneCompleted",
        eventVersion: 1,
        aggregateType: "PROJECT_MILESTONE",
        aggregateId: String(updatedMs.id),
        source: "PROJECT",
        actorId: String(params.userId || "admin"),
        payload: JSON.stringify({ milestone: updatedMs, project: proj }),
        status: "PENDING",
        retryCount: 0
      } as any);

      return { success: true, milestone: updatedMs };
    });
  }
}
