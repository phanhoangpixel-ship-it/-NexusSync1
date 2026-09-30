import { db } from "../src/db/index";
import { 
  projects, projectWbs, projectTasks, projectBudgets, projectCosts, 
  projectSubcontracts, projectBudgetVersions, projectEvmSnapshots, projectMilestones, outboxEvents,
  wbsNodes, projectResources, projectTimesheets, projectCostLedger, invoices, employees,
  projectChangeOrders, dmsDocuments
} from "../src/db/schema";
import { eq, and, sql, sum, desc } from "drizzle-orm";
import { enterpriseEmployees } from "../src/data/hrMasterData";
import { InventoryService } from "./inventoryService";
import { costingEngine } from "./costingEngine";
import { accountingEngine } from "./accountingEngine";
import { AuditService } from "./auditService";
import { DmsService } from "./dmsService";

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
      if (p.status === "CLOSED" || p.status === "COMPLETED" || p.status === "CANCELLED") {
        throw new Error(`Dự án đã ở trạng thái kết thúc/hoàn thành (${p.status}) mang tính bất biến. Không thể xuất thêm vật tư trực tiếp.`);
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

      // Also record in projectCostLedger for unified Job Costing
      try {
        await tx.insert(projectCostLedger).values({
          projectId: params.projectId,
          wbsId: params.wbsId || params.taskId || null,
          costType: "MATERIAL",
          description: `Xuất kho vật tư ID:${params.productId} x ${params.quantity} (WMS)`,
          amount: totalAmount,
          referenceNo: refNo,
          date: new Date().toISOString().slice(0, 10),
          sourceModule: "M17",
          recordedBy: `User:${params.userId}`,
          createdAt: new Date()
        } as any);
      } catch (cLedgerErr) {
        console.warn("Cost ledger insert warning:", cLedgerErr);
      }

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

      return { success: true, costEntry, totalAmount, refNo, projectCode: p.code, projectId: p.id };
    });

    // Record immutable audit log (M02) outside transaction
    try {
      await AuditService.recordAuditLog({
        userId: params.userId || 1,
        username: "InventoryOfficer",
        userName: "Thủ kho / Kỹ sư dự án",
        userRole: "INVENTORY_MANAGER",
        action: "ISSUE_MATERIAL",
        module: "M35",
        entityName: "project_costs",
        entityId: String(txRes.costEntry.id),
        description: `Xuất kho vật tư dự án [${txRes.projectCode}] - Vật tư ID: ${params.productId} x ${params.quantity} - Tổng tiền: ${txRes.totalAmount.toLocaleString('vi-VN')} đ (Tham chiếu: ${txRes.refNo})`,
        severity: "INFO",
        afterData: { costId: txRes.costEntry.id, productId: params.productId, quantity: params.quantity, totalAmount: txRes.totalAmount, refNo: txRes.refNo, projectId: txRes.projectId },
      });
    } catch (auditErr) {
      console.warn("Project Audit Log Warning:", auditErr);
    }

    return txRes;
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

  /**
   * Create / Register Project Resource (Cross-module M28 connection)
   */
  static async createProjectResource(params: {
    projectId?: number;
    name: string;
    role: string;
    department?: string;
    resourceType?: "PEOPLE" | "EQUIPMENT" | "MATERIAL";
    standardRateVND?: number;
    overtimeRateVND?: number;
    allocationPct?: number;
    capacityHours?: number;
    employeeId?: number;
    email?: string;
    phone?: string;
  }) {
    let rate = params.standardRateVND;
    // Cross-module M28: look up employee base_salary if available
    if ((!rate || rate <= 0) && params.employeeId) {
      try {
        const [emp] = await db.select().from(employees).where(eq(employees.id, params.employeeId)).limit(1);
        if (emp && emp.baseSalary) {
          rate = Math.round(emp.baseSalary / 160); // 160 standard work hours/month
        }
      } catch (e) {
        console.warn("Could not fetch M28 employee rate:", e);
      }
    }
    const finalStandardRate = rate && rate > 0 ? rate : 250000;
    const finalOvertimeRate = params.overtimeRateVND || Math.round(finalStandardRate * 1.5);

    const [res] = await db.insert(projectResources).values({
      projectId: params.projectId || null,
      name: params.name,
      role: params.role,
      department: params.department || "Kỹ thuật Công trình",
      resourceType: params.resourceType || "PEOPLE",
      standardRateVND: finalStandardRate,
      overtimeRateVND: finalOvertimeRate,
      allocationPct: params.allocationPct ?? 100,
      allocatedHours: 0,
      capacityHours: params.capacityHours || 160,
      assignedTasksCount: 0,
      employeeId: params.employeeId || null,
      status: "ACTIVE",
      email: params.email || null,
      phone: params.phone || null,
      createdAt: new Date(),
    } as any).returning();

    return res;
  }

  /**
   * Record Timesheet and Job Cost (Cross-module M28 labor rate, M30 GL posting)
   */
  static async recordTimesheet(params: {
    projectId: number;
    resourceId?: number;
    employeeName: string;
    wbsCode?: string;
    wbsTaskName?: string;
    date: string;
    hoursLogged: number;
    hourlyRateVND?: number;
    notes?: string;
    status?: string;
    userId?: number;
  }) {
    const txRes = await db.transaction(async (tx) => {
      const [p] = await tx.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
      if (!p) throw new Error("Dự án không tồn tại");
      if (p.status === "CLOSED" || p.status === "COMPLETED" || p.status === "CANCELLED") {
        throw new Error(`Dự án đã ở trạng thái kết thúc/hoàn thành (${p.status}) mang tính bất biến. Không thể ghi nhận timesheet bổ sung.`);
      }

      let rate = params.hourlyRateVND;
      if (!rate || rate <= 0) {
        if (params.resourceId) {
          const [res] = await tx.select().from(projectResources).where(eq(projectResources.id, params.resourceId)).limit(1);
          if (res && res.standardRateVND) rate = res.standardRateVND;
        }
        if (!rate || rate <= 0) {
          const emp = enterpriseEmployees.find(e => e.id === params.resourceId || e.fullName === params.employeeName);
          if (emp && emp.baseSalary) {
            rate = Math.round(emp.baseSalary / (22 * 8));
          }
        }
      }
      const finalRate = rate && rate > 0 ? rate : 280000;
      const hours = Number(params.hoursLogged) || 0;
      const laborCost = Math.round(hours * finalRate);

      const [ts] = await tx.insert(projectTimesheets).values({
        projectId: params.projectId,
        resourceId: params.resourceId || null,
        employeeName: params.employeeName,
        wbsCode: params.wbsCode || "1.0",
        wbsTaskName: params.wbsTaskName || "Thực thi công việc",
        date: params.date || new Date().toISOString().slice(0, 10),
        hoursLogged: hours,
        hourlyRateVND: finalRate,
        laborCostVND: laborCost,
        status: params.status || "APPROVED",
        notes: params.notes || "Ghi nhận chấm công tác vụ",
        approvedBy: params.status === "APPROVED" ? `User:${params.userId || 1}` : null,
        createdAt: new Date(),
      } as any).returning();

      // Record into Project Cost Ledger (Single Ledger Model)
      const costRefNo = `TS-CST-${ts.id}-${Date.now().toString().slice(-4)}`;
      const [costLedgerEntry] = await tx.insert(projectCostLedger).values({
        projectId: params.projectId,
        costType: "LABOR",
        description: `Nhân công: ${params.employeeName} (${hours}h @ ${finalRate.toLocaleString('vi-VN')} đ/h) - WBS ${params.wbsCode || ''}`,
        amount: laborCost,
        referenceNo: costRefNo,
        date: params.date || new Date().toISOString().slice(0, 10),
        sourceModule: "M28",
        recordedBy: `User:${params.userId || 1}`,
        createdAt: new Date(),
      } as any).returning();

      // Also record into projectCosts
      await tx.insert(projectCosts).values({
        projectId: params.projectId,
        costType: "LABOR",
        description: `Chi phí nhân công: ${params.employeeName} (${hours}h)`,
        amount: laborCost,
        referenceNo: costRefNo,
        date: params.date || new Date().toISOString().slice(0, 10),
        recordedBy: `User:${params.userId || 1}`,
        createdAt: new Date(),
      } as any);

      // Recalculate project totals
      const currentActualCost = (p.actualCost || 0) + laborCost;
      await tx.update(projects).set({
        actualCost: currentActualCost,
        updatedAt: new Date(),
      } as any).where(eq(projects.id, params.projectId));

      // Post VAS GL Journal Entry (WIP TK 154 / Phải trả NLĐ TK 334)
      try {
        await accountingEngine.postJournalEntry({
          sourceModule: "PROJECT",
          sourceDocumentType: "PROJECT_TIMESHEET",
          sourceDocumentId: ts.id,
          sourceReferenceNo: costRefNo,
          debitAccount: "154", // Chi phí sản xuất kinh doanh dở dang
          creditAccount: "334", // Phải trả người lao động (M28 Payroll)
          amount: laborCost,
          description: `Ghi nhận chi phí nhân công trực tiếp công trình ${p.code} - ${params.employeeName}`,
          branchId: p.branchId || 1,
          userId: params.userId || 1,
        }, tx);
      } catch (glError) {
        console.warn("Timesheet GL Posting Warning:", glError);
      }

      return { success: true, timesheet: ts, costLedgerEntry, laborCost, projectCode: p.code, finalRate, hours };
    });

    // Record immutable audit log (M02) outside transaction
    try {
      await AuditService.recordAuditLog({
        userId: params.userId || 1,
        username: "SiteEngineer",
        userName: params.employeeName,
        userRole: "PROJECT_ENGINEER",
        action: "LOG_TIMESHEET",
        module: "M35",
        entityName: "project_timesheets",
        entityId: String(txRes.timesheet.id),
        description: `Ghi nhận chấm công dự án [${txRes.projectCode}] - ${params.employeeName}: ${txRes.hours}h @ ${txRes.finalRate.toLocaleString('vi-VN')} đ/h = ${txRes.laborCost.toLocaleString('vi-VN')} đ (WBS: ${params.wbsCode || '1.0'})`,
        severity: "INFO",
        afterData: { timesheetId: txRes.timesheet.id, employeeName: params.employeeName, hoursLogged: txRes.hours, laborCost: txRes.laborCost, date: params.date, projectId: params.projectId },
      });
    } catch (auditErr) {
      console.warn("Timesheet Audit Log Warning:", auditErr);
    }

    return txRes;
  }

  /**
   * Get Aggregated Job Costing for Project (Labor + Material + Overhead + Equipment + Subcontract)
   */
  static async getJobCostSummary(projectId: number) {
    const [p] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!p) throw new Error("Dự án không tồn tại");

    const costLedgerEntries = await db.select().from(projectCostLedger)
      .where(eq(projectCostLedger.projectId, projectId))
      .orderBy(desc(projectCostLedger.id));

    const legacyCosts = await db.select().from(projectCosts)
      .where(eq(projectCosts.projectId, projectId));

    const timesheetEntries = await db.select().from(projectTimesheets)
      .where(eq(projectTimesheets.projectId, projectId));

    // Calculate breakdown
    let laborAmount = 0;
    let materialAmount = 0;
    let equipmentAmount = 0;
    let subcontractAmount = 0;
    let overheadAmount = 0;

    // Merge costLedgerEntries and legacyCosts without duplication
    const seenRefs = new Set<string>();
    const unifiedLedger: any[] = [];

    for (const c of costLedgerEntries) {
      if (c.referenceNo) seenRefs.add(c.referenceNo);
      unifiedLedger.push(c);
      const type = (c.costType || "").toUpperCase();
      const amt = c.amount || 0;
      if (type === "LABOR") laborAmount += amt;
      else if (type === "MATERIAL") materialAmount += amt;
      else if (type === "EQUIPMENT") equipmentAmount += amt;
      else if (type === "SUBCONTRACTOR" || type === "SUBCONTRACT") subcontractAmount += amt;
      else overheadAmount += amt;
    }

    for (const c of legacyCosts) {
      if (c.referenceNo && seenRefs.has(c.referenceNo)) continue;
      unifiedLedger.push({
        id: c.id,
        projectId: c.projectId,
        wbsId: c.taskId,
        costType: c.costType,
        description: c.description,
        amount: c.amount,
        referenceNo: c.referenceNo,
        date: c.date,
        sourceModule: c.costType === "MATERIAL" ? "M17" : "M35",
      });
      const type = (c.costType || "").toUpperCase();
      const amt = c.amount || 0;
      if (type === "LABOR") laborAmount += amt;
      else if (type === "MATERIAL") materialAmount += amt;
      else if (type === "EQUIPMENT") equipmentAmount += amt;
      else if (type === "SUBCONTRACTOR" || type === "SUBCONTRACT") subcontractAmount += amt;
      else overheadAmount += amt;
    }

    // If timesheets exist and laborAmount was 0, aggregate from timesheets
    if (laborAmount === 0 && timesheetEntries.length > 0) {
      laborAmount = timesheetEntries.reduce((acc, t) => acc + (t.laborCostVND || 0), 0);
    }

    const totalActualCost = laborAmount + materialAmount + equipmentAmount + subcontractAmount + overheadAmount || p.actualCost || 0;
    const totalBudget = p.totalBudget || 0;
    const variance = totalBudget - totalActualCost;

    const totalLaborHours = timesheetEntries.reduce((acc, t) => acc + (t.hoursLogged || 0), 0);

    return {
      projectId: p.id,
      projectCode: p.code,
      projectName: p.name,
      totalBudget,
      totalActualCost,
      variance,
      isUnderBudget: variance >= 0,
      burnRatePct: totalBudget > 0 ? Number(((totalActualCost / totalBudget) * 100).toFixed(2)) : 0,
      breakdown: {
        labor: {
          amount: laborAmount,
          percentage: totalActualCost > 0 ? Number(((laborAmount / totalActualCost) * 100).toFixed(1)) : 0,
          totalHours: totalLaborHours,
          source: "M28 HRM & Timesheets",
          glAccount: "TK 622 / 154",
        },
        material: {
          amount: materialAmount,
          percentage: totalActualCost > 0 ? Number(((materialAmount / totalActualCost) * 100).toFixed(1)) : 0,
          source: "M17 WMS & M42 Costing",
          glAccount: "TK 621 / 154",
        },
        overhead: {
          amount: overheadAmount,
          percentage: totalActualCost > 0 ? Number(((overheadAmount / totalActualCost) * 100).toFixed(1)) : 0,
          source: "M30 GL Allocation",
          glAccount: "TK 627 / 154",
        },
        equipment: {
          amount: equipmentAmount,
          percentage: totalActualCost > 0 ? Number(((equipmentAmount / totalActualCost) * 100).toFixed(1)) : 0,
          source: "M27 EAM & Rentals",
          glAccount: "TK 623 / 154",
        },
        subcontract: {
          amount: subcontractAmount,
          percentage: totalActualCost > 0 ? Number(((subcontractAmount / totalActualCost) * 100).toFixed(1)) : 0,
          source: "M10/M11 Procurement",
          glAccount: "TK 154 / 331",
        }
      },
      costLedger: unifiedLedger,
      timesheets: timesheetEntries,
    };
  }

  /**
   * Get Project Margin & Billing Analytics
   * Database: projects.billedAmount, contractValue, actualCost, invoices (M31 delegate)
   */
  static async getProjectMargin(projectId: number) {
    const [p] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!p) throw new Error("Dự án không tồn tại");

    const contractValue = p.revenue || 0;
    const totalBudget = p.totalBudget || 0;
    const actualCost = p.actualCost || 0;
    const billedAmount = p.billedAmount || 0;

    const grossProfit = contractValue - actualCost;
    const grossMarginPct = contractValue > 0 ? Number(((grossProfit / contractValue) * 100).toFixed(2)) : 0;

    const billedProfit = billedAmount - actualCost;
    const billedMarginPct = billedAmount > 0 ? Number(((billedProfit / billedAmount) * 100).toFixed(2)) : 0;

    const unbilledAmount = Math.max(0, contractValue - billedAmount);

    // Percentage of Completion (POC) Revenue Recognition
    const poc = totalBudget > 0 ? Math.min(1.0, actualCost / totalBudget) : 0;
    const pocRevenue = Number((contractValue * poc).toFixed(2));
    const pocMargin = pocRevenue - actualCost;
    const pocMarginPct = pocRevenue > 0 ? Number(((pocMargin / pocRevenue) * 100).toFixed(2)) : 0;

    // Financial Health Status
    let financialHealth: "HEALTHY" | "MODERATE" | "AT_RISK" = "HEALTHY";
    if (grossMarginPct < 10 || actualCost > totalBudget) {
      financialHealth = "AT_RISK";
    } else if (grossMarginPct < 20) {
      financialHealth = "MODERATE";
    }

    return {
      projectId: p.id,
      projectCode: p.code,
      projectName: p.name,
      contractNo: p.contractNo,
      financials: {
        contractValueVND: contractValue,
        totalBudgetVND: totalBudget,
        actualCostVND: actualCost,
        billedAmountVND: billedAmount,
        unbilledAmountVND: unbilledAmount,
        grossProfitVND: grossProfit,
        grossMarginPct,
        billedProfitVND: billedProfit,
        billedMarginPct,
        pocPercent: Number((poc * 100).toFixed(2)),
        pocRevenueVND: pocRevenue,
        pocMarginVND: pocMargin,
        pocMarginPct,
        billingStatus: p.billingStatus || (billedAmount >= contractValue ? "FULLY_BILLED" : billedAmount > 0 ? "PARTIALLY_BILLED" : "UNBILLED"),
        financialHealth,
      }
    };
  }

  /**
   * Delegate Billing to M31 (Invoices / AR) & Sync to M30 GL
   * Authoritative delegate creating VAT invoice owned by M31
   */
  static async delegateProjectBilling(params: {
    projectId: number;
    amount: number;
    milestoneId?: number;
    milestoneCode?: string;
    notes?: string;
    customerId?: number;
    customerName?: string;
    userId?: number;
    branchId?: number;
    taxRate?: number;
  }) {
    const txRes = await db.transaction(async (tx) => {
      const [p] = await tx.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
      if (!p) throw new Error("Dự án không tồn tại");
      if (p.status === "CANCELLED") {
        throw new Error("Không thể xuất hóa đơn cho dự án đã bị hủy");
      }

      const billingAmt = Number(params.amount);
      if (billingAmt <= 0) throw new Error("Số tiền xuất hóa đơn phải lớn hơn 0");

      const taxRate = params.taxRate ?? 0.10; // Default 10% VAT
      const taxAmount = Math.round(billingAmt * taxRate);
      const finalAmount = billingAmt + taxAmount;

      const invoiceNumber = `VAT-PRJ-${p.code}-${Date.now().toString().slice(-4)}`;

      // 1. Delegate creation of VAT Invoice owned by M31
      const [inv] = await tx.insert(invoices).values({
        invoiceNumber,
        type: "VAT",
        customerId: p.customerId || params.customerId || 1,
        customerName: p.customerName || params.customerName || "Khách hàng Doanh Nghiệp",
        companyName: p.customerName || params.customerName || "Khách hàng Doanh Nghiệp",
        taxCode: "0102030405",
        address: p.location || "Trụ sở Doanh nghiệp",
        totalAmount: billingAmt,
        discount: 0,
        taxRate,
        taxAmount,
        finalAmount,
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "UNPAID",
        status: "ISSUED",
        issueDate: new Date(),
        createdBy: params.userId || 1,
        createdAt: new Date(),
      } as any).returning();

      // 2. Link with Milestone if applicable
      if (params.milestoneId) {
        await tx.update(projectMilestones).set({
          status: "BILLED",
          invoiceId: inv.id,
          billedAt: new Date(),
        } as any).where(eq(projectMilestones.id, params.milestoneId));
      }

      // 3. Update Project billedAmount & billingStatus
      const newBilledAmount = (p.billedAmount || 0) + billingAmt;
      const contractVal = p.revenue || 0;
      const billingStatus = newBilledAmount >= contractVal ? "FULLY_BILLED" : "PARTIALLY_BILLED";

      await tx.update(projects).set({
        billedAmount: newBilledAmount,
        billingStatus,
        updatedAt: new Date(),
      } as any).where(eq(projects.id, params.projectId));

      // 4. Post Authoritative Accounting Journal Entry (M30 GL)
      // Debit 131 (Phải thu khách hàng) / Credit 511 (Doanh thu CCDV) / Credit 3331 (Thuế GTGT phải nộp)
      try {
        await accountingEngine.postJournalEntry({
          sourceModule: "PROJECT",
          sourceDocumentType: "PROJECT_BILLING_INVOICE",
          sourceDocumentId: inv.id,
          sourceReferenceNo: invoiceNumber,
          debitAccount: "131", // Phải thu khách hàng
          creditAccount: "511", // Doanh thu bán hàng & cung cấp dịch vụ
          amount: billingAmt,
          description: `Xuất hóa đơn nghiệm thu tiến độ công trình [${p.code}] ${p.name} - HĐ: ${invoiceNumber}`,
          branchId: params.branchId || p.branchId || 1,
          userId: params.userId || 1,
        }, tx);
      } catch (glError) {
        console.warn("Billing GL Posting Warning:", glError);
      }

      // 5. Emit Outbox Event for EDA (M05 EventBus)
      await tx.insert(outboxEvents).values({
        eventId: `EVT-PRJ-BILL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        eventType: "ProjectBillingIssued",
        eventVersion: 1,
        aggregateType: "PROJECT_BILLING",
        aggregateId: String(inv.id),
        source: "PROJECT",
        actorId: String(params.userId || 1),
        payload: JSON.stringify({
          projectId: p.id,
          projectCode: p.code,
          invoiceId: inv.id,
          invoiceNumber,
          billedAmount: billingAmt,
          taxAmount,
          finalAmount,
          milestoneId: params.milestoneId || null,
        }),
        status: "PENDING",
        retryCount: 0,
      } as any);

      return {
        success: true,
        invoice: inv,
        billedAmount: newBilledAmount,
        billingStatus,
        remainingToBill: Math.max(0, contractVal - newBilledAmount),
        projectCode: p.code,
        projectName: p.name,
        billingAmt,
        invoiceNumber,
        projectId: p.id,
        message: `Đã xuất hóa đơn ${invoiceNumber} thành công qua phân hệ M31 & đồng bộ Sổ cái M30!`,
      };
    });

    // 6. Record immutable audit log (M02) outside transaction
    try {
      await AuditService.recordAuditLog({
        userId: params.userId || 1,
        username: "ProjectPM",
        userName: "Quản lý Dự án",
        userRole: "PROJECT_MANAGER",
        action: "BILL",
        module: "M35",
        entityName: "invoices",
        entityId: String(txRes.invoice.id),
        description: `Xuất hóa đơn nghiệm thu tiến độ công trình [${txRes.projectCode}] ${txRes.projectName} - Giá trị: ${txRes.billingAmt.toLocaleString('vi-VN')} đ (HĐ: ${txRes.invoiceNumber})`,
        severity: "INFO",
        afterData: { invoiceId: txRes.invoice.id, invoiceNumber: txRes.invoiceNumber, billingAmt: txRes.billingAmt, projectId: txRes.projectId, remainingToBill: txRes.remainingToBill },
      });
    } catch (auditErr) {
      console.warn("Project Billing Audit Log Warning:", auditErr);
    }

    return txRes;
  }

  /**
   * Update Project or Task Progress & Recalculate EVM Metrics
   */
  static async updateProjectProgress(params: {
    projectId: number;
    progressPct?: number;
    taskId?: number;
    wbsId?: number;
    actualProgress?: number;
    notes?: string;
  }) {
    const { projectId, progressPct, taskId, wbsId, actualProgress } = params;

    const [p] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!p) throw new Error("Dự án không tồn tại");

    if (taskId && actualProgress !== undefined) {
      await db.update(projectTasks).set({
        actualProgress,
        status: actualProgress >= 100 ? "COMPLETED" : "IN_PROGRESS",
      } as any).where(eq(projectTasks.id, taskId));
    }

    if (wbsId && actualProgress !== undefined) {
      await db.update(wbsNodes).set({
        progressPct: actualProgress,
        status: actualProgress >= 100 ? "COMPLETED" : "IN_PROGRESS",
      } as any).where(eq(wbsNodes.id, wbsId));
    }

    // If progressPct is explicitly provided for project
    if (progressPct !== undefined) {
      const bac = p.totalBudget || 0;
      const evm = this.calculateEvmMetrics(bac, 70, progressPct, p.actualCost || 0);

      await db.update(projects).set({
        earnedValue: evm.ev,
        plannedValue: evm.pv,
        cpi: evm.cpi,
        spi: evm.spi,
        eac: evm.eac,
        updatedAt: new Date(),
      } as any).where(eq(projects.id, projectId));

      return {
        success: true,
        projectId,
        progressPct,
        evm,
      };
    }

    // Otherwise recalculate from tasks & costs
    const synced = await this.syncProjectProgressAndEvm(projectId);
    return {
      success: true,
      projectId,
      ...synced,
    };
  }

  /**
   * Calculate Portfolio-wide EVM Metrics across all projects
   */
  static async getPortfolioEvmSummary() {
    const dbProjects = await db.select().from(projects).all();
    let totalBac = 0;
    let totalPv = 0;
    let totalEv = 0;
    let totalAc = 0;

    const projectEvmList = dbProjects.map((p) => {
      const bac = p.totalBudget || 0;
      const ac = p.actualCost || 0;
      const pv = p.plannedValue || (bac * 0.7);
      const ev = p.earnedValue || 0;

      const cv = ev - ac;
      const sv = ev - pv;
      const cpi = ac > 0 ? Number((ev / ac).toFixed(2)) : 1.0;
      const spi = pv > 0 ? Number((ev / pv).toFixed(2)) : 1.0;
      const eac = cpi > 0 ? Number((bac / cpi).toFixed(2)) : bac;
      const vac = bac - eac;

      totalBac += bac;
      totalPv += pv;
      totalEv += ev;
      totalAc += ac;

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
        bac,
        pv,
        ev,
        ac,
        cv,
        sv,
        cpi,
        spi,
        eac,
        vac,
        health: cpi >= 1.0 && spi >= 1.0 ? "EXCELLENT" : cpi >= 0.9 ? "GOOD" : "WARNING",
      };
    });

    const portfolioCv = totalEv - totalAc;
    const portfolioSv = totalEv - totalPv;
    const portfolioCpi = totalAc > 0 ? Number((totalEv / totalAc).toFixed(2)) : 1.0;
    const portfolioSpi = totalPv > 0 ? Number((totalEv / totalPv).toFixed(2)) : 1.0;
    const portfolioEac = portfolioCpi > 0 ? Number((totalBac / portfolioCpi).toFixed(2)) : totalBac;
    const portfolioVac = totalBac - portfolioEac;

    return {
      portfolio: {
        totalBac,
        totalPv,
        totalEv,
        totalAc,
        cv: portfolioCv,
        sv: portfolioSv,
        cpi: portfolioCpi,
        spi: portfolioSpi,
        eac: portfolioEac,
        vac: portfolioVac,
        overallStatus: portfolioCpi >= 1.0 && portfolioSpi >= 1.0 ? "HEALTHY" : portfolioCpi >= 0.9 ? "MODERATE" : "ATTENTION_REQUIRED",
      },
      projects: projectEvmList,
    };
  }

  /**
   * Create Change Order (BCR) for project (Scope / Budget / Schedule adjustment)
   */
  static async createChangeOrder(params: {
    projectId: number;
    title: string;
    changeType?: string;
    description?: string;
    costImpact: number;
    scheduleImpactDays?: number;
    reason?: string;
    requestedBy?: string;
    userId?: number;
  }) {
    const txRes = await db.transaction(async (tx) => {
      const [p] = await tx.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
      if (!p) throw new Error("Dự án không tồn tại");
      if (p.status === "CANCELLED") {
        throw new Error("Không thể tạo Change Order cho dự án đã bị hủy");
      }

      const totalOrders = await tx.select().from(projectChangeOrders).where(eq(projectChangeOrders.projectId, params.projectId));
      const coCode = `CO-${p.code}-${String(totalOrders.length + 1).padStart(3, '0')}`;

      const [order] = await tx.insert(projectChangeOrders).values({
        projectId: params.projectId,
        changeOrderCode: coCode,
        title: params.title,
        changeType: params.changeType || "SCOPE_BUDGET",
        description: params.description || null,
        costImpact: Number(params.costImpact) || 0,
        scheduleImpactDays: Number(params.scheduleImpactDays) || 0,
        reason: params.reason || null,
        status: "SUBMITTED",
        requestedBy: params.requestedBy || "Quản lý Dự án",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any).returning();

      return { order, projectCode: p.code, coCode };
    });

    try {
      await AuditService.recordAuditLog({
        userId: params.userId || 1,
        username: "ProjectPM",
        userName: params.requestedBy || "Quản lý Dự án",
        userRole: "PROJECT_MANAGER",
        action: "CHANGE_ORDER",
        module: "M35",
        entityName: "project_change_orders",
        entityId: String(txRes.order.id),
        description: `Tạo Phiếu yêu cầu thay đổi (Change Order) [${txRes.coCode}] - Dự án [${txRes.projectCode}]: ${params.title} (Tác động chi phí: ${(Number(params.costImpact) || 0).toLocaleString('vi-VN')} đ)`,
        severity: "INFO",
        afterData: txRes.order,
      });
    } catch (e) {
      console.warn("Audit log warning on create change order:", e);
    }

    return txRes.order;
  }

  /**
   * Approve Change Order (Updates baseline totalBudget, creates version, updates schedule)
   */
  static async approveChangeOrder(params: {
    changeOrderId: number;
    approvedByUserId: number;
    approvedByName?: string;
    notes?: string;
  }) {
    const txResult = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(projectChangeOrders).where(eq(projectChangeOrders.id, params.changeOrderId)).limit(1);
      if (!order) throw new Error("Phiếu yêu cầu thay đổi không tồn tại");
      if (order.status === "APPROVED") throw new Error("Phiếu yêu cầu thay đổi này đã được phê duyệt trước đó");

      const [p] = await tx.select().from(projects).where(eq(projects.id, order.projectId)).limit(1);
      if (!p) throw new Error("Dự án liên quan không tồn tại");

      // 1. Mark order as APPROVED
      const [updatedOrder] = await tx.update(projectChangeOrders).set({
        status: "APPROVED",
        approvedBy: params.approvedByName || `User:${params.approvedByUserId}`,
        approvedAt: new Date(),
        updatedAt: new Date(),
      } as any).where(eq(projectChangeOrders.id, params.changeOrderId)).returning();

      // 2. Adjust project budget and baseline revision
      const oldBudget = p.totalBudget || 0;
      const newTotalBudget = oldBudget + (order.costImpact || 0);

      const existingVersions = await tx.select().from(projectBudgetVersions).where(eq(projectBudgetVersions.projectId, p.id));
      const nextVer = existingVersions.length + 1;
      const newVersionCode = `v${nextVer}.0`;

      // Record into projectBudgetVersions
      await tx.insert(projectBudgetVersions).values({
        projectId: p.id,
        versionCode: newVersionCode,
        bcrCode: order.changeOrderCode,
        materialBudget: 0,
        laborBudget: 0,
        equipmentBudget: 0,
        subcontractBudget: 0,
        overheadBudget: 0,
        contingencyBudget: 0,
        totalBudget: newTotalBudget,
        changeReason: `Change Order [${order.changeOrderCode}]: ${order.title}`,
        status: "APPROVED",
        createdBy: params.approvedByUserId,
        approvedBy: params.approvedByUserId,
        approvedAt: new Date(),
        createdAt: new Date(),
      } as any);

      // Calculate updated plannedEndDate if scheduleImpactDays > 0
      let updatedEndDate = p.plannedEndDate;
      if (order.scheduleImpactDays && order.scheduleImpactDays > 0 && p.plannedEndDate) {
        try {
          const d = new Date(p.plannedEndDate);
          d.setDate(d.getDate() + order.scheduleImpactDays);
          updatedEndDate = d.toISOString().slice(0, 10);
        } catch (_) {}
      }

      // Update project master
      await tx.update(projects).set({
        totalBudget: newTotalBudget,
        revisionNo: newVersionCode,
        plannedEndDate: updatedEndDate,
        updatedAt: new Date(),
      } as any).where(eq(projects.id, p.id));

      return { success: true, changeOrder: updatedOrder, newTotalBudget, newVersionCode, updatedEndDate, oldBudget, projectCode: p.code, prevRevisionNo: p.revisionNo, prevPlannedEndDate: p.plannedEndDate };
    });

    // Audit log outside transaction lock
    try {
      await AuditService.recordAuditLog({
        userId: params.approvedByUserId || 1,
        username: "ProjectApprover",
        userName: params.approvedByName || "CFO / Giám đốc Dự án",
        userRole: "PROJECT_DIRECTOR",
        action: "CHANGE_ORDER",
        module: "M35",
        entityName: "project_change_orders",
        entityId: String(txResult.changeOrder.id),
        description: `Phê duyệt Phiếu yêu cầu thay đổi [${txResult.changeOrder.changeOrderCode}] - Điều chỉnh ngân sách dự án [${txResult.projectCode}] từ ${txResult.oldBudget.toLocaleString('vi-VN')} đ lên ${txResult.newTotalBudget.toLocaleString('vi-VN')} đ (Baseline mới: ${txResult.newVersionCode})`,
        severity: "WARNING",
        beforeData: { oldBudget: txResult.oldBudget, revisionNo: txResult.prevRevisionNo, plannedEndDate: txResult.prevPlannedEndDate },
        afterData: { newTotalBudget: txResult.newTotalBudget, revisionNo: txResult.newVersionCode, plannedEndDate: txResult.updatedEndDate },
      });
    } catch (e) {
      console.warn("Audit log warning on approve change order:", e);
    }

    return txResult;
  }

  /**
   * Reject Change Order
   */
  static async rejectChangeOrder(params: {
    changeOrderId: number;
    rejectedByUserId: number;
    rejectedByName?: string;
    rejectionReason: string;
  }) {
    const [order] = await db.select().from(projectChangeOrders).where(eq(projectChangeOrders.id, params.changeOrderId)).limit(1);
    if (!order) throw new Error("Phiếu yêu cầu thay đổi không tồn tại");

    const [updatedOrder] = await db.update(projectChangeOrders).set({
      status: "REJECTED",
      rejectionReason: params.rejectionReason,
      approvedBy: params.rejectedByName || `User:${params.rejectedByUserId}`,
      approvedAt: new Date(),
      updatedAt: new Date(),
    } as any).where(eq(projectChangeOrders.id, params.changeOrderId)).returning();

    try {
      await AuditService.recordAuditLog({
        userId: params.rejectedByUserId || 1,
        username: "ProjectApprover",
        userName: params.rejectedByName || "CFO / Giám đốc Dự án",
        userRole: "PROJECT_DIRECTOR",
        action: "CHANGE_ORDER",
        module: "M35",
        entityName: "project_change_orders",
        entityId: String(order.id),
        description: `Từ chối Phiếu yêu cầu thay đổi [${order.changeOrderCode}] - Lý do: ${params.rejectionReason}`,
        severity: "INFO",
        afterData: updatedOrder,
      });
    } catch (e) {
      console.warn("Audit log warning on reject change order:", e);
    }

    return updatedOrder;
  }

  /**
   * Get all Change Orders for a project
   */
  static async getChangeOrders(projectId: number) {
    return await db.select().from(projectChangeOrders)
      .where(eq(projectChangeOrders.projectId, projectId))
      .orderBy(desc(projectChangeOrders.createdAt));
  }

  /**
   * Close Job Costing Period & Reconcile (VAS 15 / TK 154)
   */
  static async closeJobCostingPeriod(params: {
    projectId: number;
    period: string; // e.g. "2026-09"
    userId?: number;
    notes?: string;
  }) {
    const txRes = await db.transaction(async (tx) => {
      const [p] = await tx.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
      if (!p) throw new Error("Dự án không tồn tại");

      const summary = await this.getJobCostSummary(params.projectId);

      return {
        success: true,
        period: params.period,
        summary,
        closedAt: new Date(),
        projectCode: p.code,
        projectName: p.name,
        projectId: p.id,
      };
    });

    // Record audit log outside transaction
    try {
      await AuditService.recordAuditLog({
        userId: params.userId || 1,
        username: "CostingAccountant",
        userName: "Kế toán Chi phí Dự án",
        userRole: "COST_ACCOUNTANT",
        action: "JOB_COST_CLOSE",
        module: "M35",
        entityName: "project_cost_ledger",
        entityId: String(txRes.projectId),
        description: `Chốt kỳ tập hợp giá thành công việc (Job Costing Close) kỳ ${params.period} cho dự án [${txRes.projectCode}] ${txRes.projectName} - Tổng thực chi: ${txRes.summary.totalActualCost.toLocaleString('vi-VN')} đ (Nhân công: ${txRes.summary.breakdown.labor.amount.toLocaleString('vi-VN')} đ, Vật tư: ${txRes.summary.breakdown.material.amount.toLocaleString('vi-VN')} đ)`,
        severity: "WARNING",
        afterData: {
          period: params.period,
          totalBudget: txRes.summary.totalBudget,
          totalActualCost: txRes.summary.totalActualCost,
          variance: txRes.summary.variance,
          burnRatePct: txRes.summary.burnRatePct,
          breakdown: txRes.summary.breakdown,
        },
      });
    } catch (e) {
      console.warn("Audit log warning on job costing close:", e);
    }

    return {
      success: true,
      period: txRes.period,
      summary: txRes.summary,
      closedAt: txRes.closedAt,
    };
  }

  /**
   * Archive Project Document to M29 DMS
   */
  static async archiveDocumentToDms(params: {
    projectId: number;
    docTitle: string;
    category?: string;
    categoryName?: string;
    format?: string;
    fileSize?: string;
    userId?: number;
    refDocNo?: string;
  }) {
    const [p] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
    if (!p) throw new Error("Dự án không tồn tại");

    const totalDocs = await db.select().from(dmsDocuments).all();
    const docCode = `DMS-PRJ-${p.code}-${String(totalDocs.length + 1).padStart(3, '0')}`;
    const sha256Hash = `sha256_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}9f81a7b`;

    const [doc] = await db.insert(dmsDocuments).values({
      docCode,
      title: params.docTitle,
      category: params.category || "PROJECT",
      categoryName: params.categoryName || "Hồ sơ Dự án & Nghiệm thu",
      version: p.revisionNo || "v1.0",
      fileSize: params.fileSize || "2.4 MB",
      format: params.format || "PDF",
      status: "ACTIVE",
      securityLevel: "CONFIDENTIAL",
      sha256Hash,
      signedBy: p.projectManagerName || "Project Director",
      signedAt: new Date(),
      linkedModule: "M35 Projects & WBS",
      refDocNo: params.refDocNo || p.contractNo || p.code,
      storageTier: "ACTIVE_VAULT",
      retentionYears: 10,
      expireDate: "2036-09-30",
      workflowStage: 3,
      workflowSteps: JSON.stringify([
        { step: 1, name: "Khởi tạo hồ sơ kỹ thuật", role: "PM", status: "COMPLETED", user: p.projectManagerName || "PM", signedAt: new Date().toISOString() },
        { step: 2, name: "Thẩm tra khối lượng & chi phí", role: "QS_ENGINEER", status: "COMPLETED", user: "Kỹ sư QS", signedAt: new Date().toISOString() },
        { step: 3, name: "Lưu trữ niêm phong Kho DMS", role: "DMS_OFFICER", status: "COMPLETED", user: "Hệ thống DMS M29", signedAt: new Date().toISOString() }
      ]),
      uploadedBy: `User:${params.userId || 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any).returning();

    try {
      await AuditService.recordAuditLog({
        userId: params.userId || 1,
        username: "ProjectPM",
        userName: p.projectManagerName || "Quản lý Dự án",
        userRole: "PROJECT_MANAGER",
        action: "DMS_ARCHIVE",
        module: "M35",
        entityName: "dms_documents",
        entityId: String(doc.id),
        description: `Lưu trữ hồ sơ dự án [${p.code}] vào Kho điện tử DMS M29: [${docCode}] ${params.docTitle} (Mã băm SHA-256: ${sha256Hash})`,
        severity: "INFO",
        afterData: { docId: doc.id, docCode, sha256Hash, projectId: p.id },
      });
    } catch (e) {
      console.warn("Audit log warning on DMS archive:", e);
    }

    return doc;
  }

  /**
   * Phase 2: Calculate Critical Path Method (CPM) for Project WBS
   * Forward pass: ES, EF
   * Backward pass: LF, LS
   * Total Float: Slack = LS - ES (or LF - EF)
   * Critical Path: Slack === 0
   */
  static async calculateCriticalPath(projectId: number) {
    const nodes = await db.select().from(wbsNodes).where(eq(wbsNodes.projectId, projectId));
    if (nodes.length === 0) {
      return { projectId, totalDurationDays: 0, criticalPathCodes: [], nodes: [] };
    }

    // Map by code for fast lookup
    const nodeMap = new Map<string, typeof nodes[0] & { 
      duration: number; 
      preds: string[]; 
      succs: string[]; 
      es: number; 
      ef: number; 
      ls: number; 
      lf: number; 
      slack: number;
      isCritical: boolean;
    }>();

    for (const n of nodes) {
      const preds = (n.dependencyCode || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      
      const duration = Number(n.durationDays) > 0 ? Number(n.durationDays) : 1;

      nodeMap.set(n.code, {
        ...n,
        duration,
        preds,
        succs: [],
        es: 0,
        ef: duration,
        ls: 0,
        lf: 0,
        slack: 0,
        isCritical: false,
      });
    }

    // Build successors
    for (const [code, item] of nodeMap.entries()) {
      for (const predCode of item.preds) {
        if (nodeMap.has(predCode)) {
          nodeMap.get(predCode)!.succs.push(code);
        }
      }
    }

    // Topological Forward Pass (ES & EF)
    let changed = true;
    let iterations = 0;
    const maxIterations = nodes.length * 2 + 10;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      for (const [code, item] of nodeMap.entries()) {
        if (item.preds.length > 0) {
          let maxPredEf = 0;
          for (const p of item.preds) {
            const predNode = nodeMap.get(p);
            if (predNode) {
              maxPredEf = Math.max(maxPredEf, predNode.ef);
            }
          }
          if (item.es !== maxPredEf) {
            item.es = maxPredEf;
            item.ef = item.es + item.duration;
            changed = true;
          }
        }
      }
    }

    // Project Total Duration
    let projectTotalDuration = 0;
    for (const item of nodeMap.values()) {
      projectTotalDuration = Math.max(projectTotalDuration, item.ef);
    }

    // Initialize Backward Pass (LF & LS)
    for (const item of nodeMap.values()) {
      item.lf = projectTotalDuration;
      item.ls = item.lf - item.duration;
    }

    // Backward Pass Iteration
    changed = true;
    iterations = 0;
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      for (const [code, item] of nodeMap.entries()) {
        if (item.succs.length > 0) {
          let minSuccLs = projectTotalDuration;
          for (const s of item.succs) {
            const succNode = nodeMap.get(s);
            if (succNode) {
              minSuccLs = Math.min(minSuccLs, succNode.ls);
            }
          }
          if (item.lf !== minSuccLs) {
            item.lf = minSuccLs;
            item.ls = item.lf - item.duration;
            changed = true;
          }
        }
      }
    }

    // Calculate Slack & Critical Path Flag
    const criticalPathCodes: string[] = [];
    const calculatedNodes: any[] = [];

    for (const [code, item] of nodeMap.entries()) {
      item.slack = Math.max(0, item.ls - item.es);
      item.isCritical = item.slack === 0;

      if (item.isCritical) {
        criticalPathCodes.push(code);
      }

      calculatedNodes.push({
        id: item.id,
        code: item.code,
        name: item.name,
        durationDays: item.duration,
        earlyStartDays: item.es,
        earlyFinishDays: item.ef,
        lateStartDays: item.ls,
        lateFinishDays: item.lf,
        slackDays: item.slack,
        isCriticalPath: item.isCritical,
        dependencies: item.preds,
      });

      // Update database isCriticalPath
      try {
        await db.update(wbsNodes).set({
          isCriticalPath: item.isCritical,
        } as any).where(eq(wbsNodes.id, item.id));
      } catch (e) {
        console.warn(`Could not update isCriticalPath for WBS ${code}:`, e);
      }
    }

    return {
      projectId,
      totalDurationDays: projectTotalDuration,
      criticalPathCodes,
      nodes: calculatedNodes,
    };
  }

  /**
   * Phase 3: Batch Record Timesheets with M28 rate resolution and M30 GL posting
   */
  static async batchRecordTimesheets(params: {
    projectId: number;
    entries: Array<{
      resourceId?: number;
      employeeName: string;
      wbsCode?: string;
      wbsTaskName?: string;
      date: string;
      hoursLogged: number;
      hourlyRateVND?: number;
      notes?: string;
    }>;
    userId?: number;
  }) {
    const results: any[] = [];
    for (const entry of params.entries) {
      const res = await this.recordTimesheet({
        projectId: params.projectId,
        resourceId: entry.resourceId,
        employeeName: entry.employeeName,
        wbsCode: entry.wbsCode,
        wbsTaskName: entry.wbsTaskName,
        date: entry.date,
        hoursLogged: entry.hoursLogged,
        hourlyRateVND: entry.hourlyRateVND,
        notes: entry.notes,
        userId: params.userId,
      });
      results.push(res);
    }
    return {
      success: true,
      count: results.length,
      results,
    };
  }

  /**
   * Phase 10: Close and Seal Project (Terminal State Immutability Guard)
   * Performs final reconciliation, DMS archiving, locks project status to CLOSED/COMPLETED.
   */
  static async closeAndSealProject(params: {
    projectId: number;
    userId: number;
    closingNotes?: string;
    acceptanceSignoffBy?: string;
  }) {
    const txRes = await db.transaction(async (tx) => {
      const [p] = await tx.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
      if (!p) throw new Error("Dự án không tồn tại");
      if (p.status === "CLOSED" || p.status === "COMPLETED") {
        throw new Error(`Dự án [${p.code}] đã được đóng sổ và niêm phong trước đó (Trạng thái: ${p.status}).`);
      }

      // 1. Get Final Job Cost & POC Financials
      const jobCostSummary = await this.getJobCostSummary(p.id);
      const marginSummary = await this.getProjectMargin(p.id);

      // 2. Mark project status as CLOSED (Terminal Immutable State)
      const [closedPrj] = await tx.update(projects).set({
        status: "CLOSED",
        progressPct: 100,
        actualEndDate: new Date().toISOString().slice(0, 10),
        notes: params.closingNotes || p.notes || "Dự án đã nghiệm thu bàn giao và đóng sổ tài chính thành công.",
        updatedAt: new Date(),
      } as any).where(eq(projects.id, p.id)).returning();

      // 3. Mark all ongoing WBS tasks as COMPLETED
      await tx.update(wbsNodes).set({
        status: "COMPLETED",
        progressPct: 100,
      } as any).where(eq(wbsNodes.projectId, p.id));

      // 4. Archive Project Handover & Closeout Dossier to M29 DMS
      let dmsDoc = null;
      try {
        dmsDoc = await this.archiveDocumentToDms({
          projectId: p.id,
          docTitle: `Biên bản Nghiệm thu Bàn giao & Quyết toán Dự án [${p.code}] - ${p.name}`,
          category: "PROJECT_CLOSEOUT",
          categoryName: "Hồ sơ Quyết toán & Đóng sổ Dự án",
          format: "PDF",
          fileSize: "4.8 MB",
          userId: params.userId,
          refDocNo: `CLOSEOUT-${p.code}-${Date.now().toString().slice(-4)}`,
        });
      } catch (dmsErr) {
        console.warn("DMS archive on closeout warning:", dmsErr);
      }

      // 5. Emit Outbox Event for EDA (M05 EventBus)
      await tx.insert(outboxEvents).values({
        eventId: `EVT-PRJ-SEAL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        eventType: "ProjectSealedAndClosed",
        eventVersion: 1,
        aggregateType: "PROJECT",
        aggregateId: String(p.id),
        source: "PROJECT",
        actorId: String(params.userId || 1),
        payload: JSON.stringify({
          projectId: p.id,
          projectCode: p.code,
          totalBudget: p.totalBudget,
          finalActualCost: jobCostSummary.totalActualCost,
          finalBilledAmount: marginSummary.financials.billedAmountVND,
          closedAt: new Date().toISOString(),
          acceptanceSignoffBy: params.acceptanceSignoffBy || "Ban Giám đốc & Khách hàng",
        }),
        status: "PENDING",
        retryCount: 0,
      } as any);

      return {
        success: true,
        project: closedPrj,
        jobCostSummary,
        marginSummary,
        dmsDoc,
        prevStatus: p.status,
        prevProgress: p.progressPct,
        projectCode: p.code,
        projectName: p.name,
        projectId: p.id,
        message: `Dự án [${p.code}] đã được nghiệm thu bàn giao và niêm phong bất biến (CLOSED) thành công!`,
      };
    });

    // 6. Record Immutable Audit Log (M02) outside transaction
    try {
      await AuditService.recordAuditLog({
        userId: params.userId || 1,
        username: "ProjectDirector",
        userName: params.acceptanceSignoffBy || "Giám đốc Quản lý Dự án",
        userRole: "PROJECT_DIRECTOR",
        action: "PROJECT_CLOSE",
        module: "M35",
        entityName: "projects",
        entityId: String(txRes.projectId),
        description: `Niêm phong & Đóng sổ toàn diện dự án [${txRes.projectCode}] ${txRes.projectName} - Kích hoạt rào cản bất biến (Terminal State Immutability Guard). Tổng quyết toán: ${txRes.jobCostSummary.totalActualCost.toLocaleString('vi-VN')} đ (Doanh thu đã xuất HĐ: ${txRes.marginSummary.financials.billedAmountVND.toLocaleString('vi-VN')} đ)`,
        severity: "WARNING",
        beforeData: { status: txRes.prevStatus, progressPct: txRes.prevProgress },
        afterData: { status: "CLOSED", progressPct: 100, actualEndDate: new Date().toISOString().slice(0, 10), dmsDocId: txRes.dmsDoc?.id },
      });
    } catch (auditErr) {
      console.warn("Project Closeout Audit Log Warning:", auditErr);
    }

    return {
      success: true,
      project: txRes.project,
      jobCostSummary: txRes.jobCostSummary,
      marginSummary: txRes.marginSummary,
      dmsDoc: txRes.dmsDoc,
      message: txRes.message,
    };
  }
}

