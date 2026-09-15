import { db } from "../src/db/index";
import { 
  qualityInspectionPlans, qualityInspections, qualityInspectionResults, 
  qualityHolds, qualityNcrs, qualityCapas, lotSerialQualityStatuses, 
  crossModuleTasks, systemNotifications, products, warehouses, warehouseLocations, users, outboxEvents 
} from "../src/db/schema";
import { eq, and, desc, sql, inArray, like, ne } from "drizzle-orm";
import { InventoryService } from "./inventoryService";
import { accountingEngine } from "./accountingEngine";

export class QualityService {

  // Generate unique codes with transaction safety
  private static async generateCode(prefix: string, table: any, codeColumn: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefixYear = `${prefix}-${year}-`;
    const records = await db.select({ code: codeColumn })
      .from(table)
      .where(like(codeColumn, `${prefixYear}%`))
      .orderBy(desc(codeColumn))
      .limit(1);

    let nextSeq = 1;
    if (records.length > 0 && records[0].code) {
      const parts = records[0].code.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
    return `${prefixYear}${String(nextSeq).padStart(5, '0')}`;
  }

  // QMS-001: Quality Inspection Plans
  static async getPlans(filters?: { productId?: number; inspectionType?: string; status?: string }) {
    let query = db.select({
      plan: qualityInspectionPlans,
      productName: products.name,
      productSku: products.sku,
    })
    .from(qualityInspectionPlans)
    .leftJoin(products, eq(qualityInspectionPlans.productId, products.id))
    .$dynamic();

    const conditions = [];
    if (filters?.productId) conditions.push(eq(qualityInspectionPlans.productId, filters.productId));
    if (filters?.inspectionType) conditions.push(eq(qualityInspectionPlans.inspectionType, filters.inspectionType));
    if (filters?.status) conditions.push(eq(qualityInspectionPlans.status, filters.status));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(qualityInspectionPlans.createdAt));
    return rows.map(r => ({
      ...r.plan,
      productName: r.productName,
      productSku: r.productSku,
      characteristics: r.plan.characteristics ? (typeof r.plan.characteristics === 'string' ? JSON.parse(r.plan.characteristics) : r.plan.characteristics) : []
    }));
  }

  static async createPlan(data: {
    title: string;
    productId?: number;
    categoryId?: number;
    inspectionType: string;
    aqlLevel?: string;
    sampleSizeFormula?: string;
    characteristics: any[];
    createdBy: number;
  }) {
    const planCode = await this.generateCode('QIP', qualityInspectionPlans, qualityInspectionPlans.planCode);
    const [plan] = await db.insert(qualityInspectionPlans).values({
      planCode,
      title: data.title,
      productId: data.productId || null,
      categoryId: data.categoryId || null,
      inspectionType: data.inspectionType || 'INCOMING',
      revision: 1,
      status: 'ACTIVE',
      aqlLevel: data.aqlLevel || 'NORMAL',
      sampleSizeFormula: data.sampleSizeFormula || 'FIXED_10',
      characteristics: JSON.stringify(data.characteristics || []),
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any).returning();
    return plan;
  }

  // QMS-002, QMS-003, QMS-004: Create Quality Inspection
  static async createInspection(data: {
    planId?: number;
    inspectionType: string; // INCOMING, IN_PROCESS, OUTGOING, RE_INSPECTION
    sourceDocumentType: string; // GOODS_RECEIPT, WORK_ORDER, DELIVERY_ORDER, MANUAL
    sourceDocumentId: number;
    sourceReferenceNo: string;
    productId: number;
    lotNumber?: string;
    serialNumber?: string;
    warehouseId?: number;
    locationId?: number;
    totalQuantity: number;
    sampleQuantity?: number;
    inspectorId?: number;
    inspectionRound?: number;
    parentInspectionId?: number;
  }) {
    const inspectionCode = await this.generateCode('QIN', qualityInspections, qualityInspections.inspectionCode);
    
    // Calculate sample quantity if not provided
    let sampleQty = data.sampleQuantity || 1;
    if (!data.sampleQuantity && data.totalQuantity) {
      sampleQty = Math.max(1, Math.min(data.totalQuantity, Math.ceil(data.totalQuantity * 0.1)));
    }

    const [inspection] = await db.insert(qualityInspections).values({
      inspectionCode,
      planId: data.planId || null,
      inspectionType: data.inspectionType,
      sourceDocumentType: data.sourceDocumentType,
      sourceDocumentId: data.sourceDocumentId,
      sourceReferenceNo: data.sourceReferenceNo,
      productId: data.productId,
      lotNumber: data.lotNumber || null,
      serialNumber: data.serialNumber || null,
      warehouseId: data.warehouseId || null,
      locationId: data.locationId || null,
      totalQuantity: data.totalQuantity,
      sampleQuantity: sampleQty,
      inspectorId: data.inspectorId || null,
      status: 'PENDING',
      inspectionRound: data.inspectionRound || 1,
      parentInspectionId: data.parentInspectionId || null,
      createdAt: new Date()
    } as any).returning();

    // QMS-013: Set initial lot/serial status to PENDING
    if (data.productId && (data.lotNumber || data.serialNumber)) {
      await db.insert(lotSerialQualityStatuses).values({
        productId: data.productId,
        lotNumber: data.lotNumber || null,
        serialNumber: data.serialNumber || null,
        qualityStatus: 'PENDING',
        lastInspectionId: inspection.id,
        updatedAt: new Date()
      } as any);
    }

    return inspection;
  }

  // QMS-006: Record Inspection Results
  static async recordResults(inspectionId: number, results: Array<{
    characteristicName: string;
    isQuantitative: boolean;
    targetValue?: number;
    upperTolerance?: number;
    lowerTolerance?: number;
    measuredValue?: number;
    qualitativeResult?: string;
    isPassed: boolean;
    notes?: string;
    sampleNumber?: number;
  }>) {
    // Clear old results if any
    await db.delete(qualityInspectionResults).where(eq(qualityInspectionResults.inspectionId, inspectionId));

    if (results.length > 0) {
      await db.insert(qualityInspectionResults).values(
        results.map(r => ({
          inspectionId,
          characteristicName: r.characteristicName,
          isQuantitative: r.isQuantitative ?? true,
          targetValue: r.targetValue ?? null,
          upperTolerance: r.upperTolerance ?? null,
          lowerTolerance: r.lowerTolerance ?? null,
          measuredValue: r.measuredValue ?? null,
          qualitativeResult: r.qualitativeResult ?? null,
          isPassed: r.isPassed,
          notes: r.notes || null,
          sampleNumber: r.sampleNumber || 1
        })) as any
      );
    }

    // Update status to PENDING_DECISION
    await db.update(qualityInspections)
      .set({ status: 'PENDING_DECISION' } as any)
      .where(eq(qualityInspections.id, inspectionId));

    return { success: true, recordedCount: results.length };
  }

  // QMS-007, QMS-008, QMS-014: Evaluate PASS/FAIL Decision & Auto Quarantine
  static async evaluateAndDecide(inspectionId: number, decisionData: {
    decision: 'PASSED' | 'FAILED' | 'PASSED_WITH_DEVIATION';
    decisionReason?: string;
    decidedBy: number;
  }) {
    return await db.transaction(async (tx) => {
      const [insp] = await tx.select().from(qualityInspections).where(eq(qualityInspections.id, inspectionId)).limit(1);
      if (!insp) throw new Error("Không tìm thấy phiếu kiểm tra chất lượng");

      const status = decisionData.decision === 'FAILED' ? 'FAILED' : 'PASSED';

      await tx.update(qualityInspections)
        .set({
          status,
          decision: decisionData.decision,
          decisionReason: decisionData.decisionReason || null,
          decidedBy: decisionData.decidedBy,
          decidedAt: new Date(),
        } as any)
        .where(eq(qualityInspections.id, inspectionId));

      // QMS-013: Update Lot/Serial Quality Status
      if (insp.productId && (insp.lotNumber || insp.serialNumber)) {
        const qStatus = decisionData.decision === 'FAILED' ? 'QUARANTINED' : 'PASSED';
        await tx.insert(lotSerialQualityStatuses).values({
          productId: insp.productId,
          lotNumber: insp.lotNumber || null,
          serialNumber: insp.serialNumber || null,
          qualityStatus: qStatus,
          lastInspectionId: insp.id,
          updatedAt: new Date()
        } as any);
      }

      // QMS-008: Auto-Create Quality Hold if FAILED
      let holdRecord = null;
      if (decisionData.decision === 'FAILED') {
        const holdCode = await this.generateCode('QHD', qualityHolds, qualityHolds.holdCode);
        const [newHold] = await tx.insert(qualityHolds).values({
          holdCode,
          inspectionId: insp.id,
          productId: insp.productId,
          lotNumber: insp.lotNumber || null,
          serialNumber: insp.serialNumber || null,
          warehouseId: insp.warehouseId || 1,
          locationId: insp.locationId || null,
          quarantineQuantity: insp.totalQuantity,
          holdReason: decisionData.decisionReason || `Không đạt kiểm tra chất lượng ${insp.inspectionCode}`,
          status: 'QUARANTINED',
          createdAt: new Date()
        } as any).returning();
        holdRecord = newHold;

        // QMS-014: Trigger Cross-Module Task for QA Quarantine
        try {
          await tx.insert(crossModuleTasks).values({
            taskType: 'QUALITY_HOLD_REVIEW',
            sourceModule: 'QMS',
            sourceDocumentType: 'QUALITY_INSPECTION',
            sourceDocumentId: insp.id,
            sourceReferenceNo: insp.inspectionCode,
            targetModule: 'QUALITY_HOLD',
            targetAction: 'REVIEW_DISPOSITION',
            payload: JSON.stringify({
              holdId: newHold.id,
              holdCode: newHold.holdCode,
              productId: insp.productId,
              quarantineQuantity: insp.totalQuantity,
              reason: newHold.holdReason
            }),
            status: 'PENDING',
            priority: 'HIGH',
            createdAt: new Date()
          } as any);

          // Dispatch System Notification
          await tx.insert(systemNotifications).values({
            userId: decisionData.decidedBy,
            title: `Cảnh báo Hàng Cách ly: ${newHold.holdCode}`,
            message: `Lô hàng thuộc phiếu kiểm tra ${insp.inspectionCode} đã bị chuyển sang trạng thái Cách ly (Quarantine).`,
            referenceKey: `QMS_HOLD_${newHold.id}`,
            createdAt: new Date()
          } as any);
        } catch (e) {
          console.warn("QMS Task/Notification dispatch warning:", e);
        }

        // Atomic Outbox Event Insertion (GAP-02-D)
        await tx.insert(outboxEvents).values({
          eventId: `EVT-QHD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          eventType: "QualityHoldApplied",
          eventVersion: 1,
          aggregateType: "QUALITY_HOLD",
          aggregateId: String(newHold.id),
          source: "QUALITY",
          actorId: String(decisionData.decidedBy || "admin"),
          payload: JSON.stringify({ hold: newHold, inspection: insp }),
          status: "PENDING",
          retryCount: 0
        } as any);
      }

      return {
        inspectionId: insp.id,
        inspectionCode: insp.inspectionCode,
        decision: decisionData.decision,
        status,
        qualityHold: holdRecord
      };
    });
  }

  // QMS-009, QMS-018, QMS-019: Quality Release & Disposition Approval
  static async executeDisposition(holdId: number, data: {
    disposition: 'RELEASE_TO_STOCK' | 'SCRAP_FINANCIAL' | 'REWORK_ORDER' | 'RETURN_TO_SUPPLIER';
    dispositionNotes?: string;
    disposedBy: number;
    targetWarehouseId?: number;
    targetLocationId?: number;
  }) {
    const [hold] = await db.select().from(qualityHolds).where(eq(qualityHolds.id, holdId)).limit(1);
    if (!hold) throw new Error("Không tìm thấy hồ sơ hàng bị tạm giữ cách ly");
    if (hold.status !== 'QUARANTINED') throw new Error("Hàng bị tạm giữ này đã được xử lý disposition trước đó");

    let newStatus = 'RELEASED';
    if (data.disposition === 'SCRAP_FINANCIAL') newStatus = 'SCRAPPED';
    if (data.disposition === 'REWORK_ORDER') newStatus = 'REWORK';
    if (data.disposition === 'RETURN_TO_SUPPLIER') newStatus = 'RELEASED';

    await db.update(qualityHolds)
      .set({
        status: newStatus,
        disposition: data.disposition,
        dispositionNotes: data.dispositionNotes || null,
        disposedBy: data.disposedBy,
        disposedAt: new Date()
      } as any)
      .where(eq(qualityHolds.id, holdId));

    // QMS-018: Inventory Boundary Enforcer (Call InventoryService.postTransaction)
    if (data.disposition === 'RELEASE_TO_STOCK' || data.disposition === 'SCRAP_FINANCIAL') {
      try {
        const movementType = data.disposition === 'SCRAP_FINANCIAL' ? 'GOODS_ISSUE' : 'TRANSFER_OUT';
        await InventoryService.postTransaction(db, {
          productId: hold.productId,
          warehouseId: hold.warehouseId,
          locationId: hold.locationId || null,
          type: movementType as any,
          referenceNo: hold.holdCode,
          quantity: -Math.abs(hold.quarantineQuantity),
          notes: `QA Disposition: ${data.disposition} (${data.dispositionNotes || ''})`,
          userId: data.disposedBy
        });
      } catch (invErr) {
        console.warn("QMS InventoryService postTransaction notice:", invErr);
      }
    }

    // QMS-019: Accounting Boundary Enforcer (Delegate Scrap to AccountingService)
    if (data.disposition === 'SCRAP_FINANCIAL') {
      try {
        await accountingEngine.postAdjustmentJournalEntry({
          adjustmentId: hold.id,
          adjustmentCode: hold.holdCode,
          adjustmentType: 'SCRAP',
          direction: 'DECREASE',
          totalAmount: 1, // Nominal valuation
          warehouseId: hold.warehouseId,
          reason: `Xuất hủy hàng QA không đạt - ${hold.holdCode}`,
          userId: data.disposedBy
        });
      } catch (accErr) {
        console.warn("QMS Accounting delegation notice:", accErr);
      }
    }

    // QMS-013: Update Lot/Serial Quality Status to RELEASED or SCRAPPED
    if (hold.productId && (hold.lotNumber || hold.serialNumber)) {
      await db.insert(lotSerialQualityStatuses).values({
        productId: hold.productId,
        lotNumber: hold.lotNumber || null,
        serialNumber: hold.serialNumber || null,
        qualityStatus: newStatus,
        lastInspectionId: hold.inspectionId || null,
        updatedAt: new Date()
      } as any);
    }

    return { success: true, holdId: hold.id, disposition: data.disposition, status: newStatus };
  }

  // QMS-010: NCR Lifecycle
  static async getNcrs(filters?: { status?: string; severity?: string }) {
    let query = db.select({
      ncr: qualityNcrs,
      reporterName: users.username,
    })
    .from(qualityNcrs)
    .leftJoin(users, eq(qualityNcrs.reporterId, users.id))
    .$dynamic();

    const conditions = [];
    if (filters?.status) conditions.push(eq(qualityNcrs.status, filters.status));
    if (filters?.severity) conditions.push(eq(qualityNcrs.severity, filters.severity));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(qualityNcrs.createdAt));
  }

  static async createNcr(data: {
    inspectionId?: number;
    holdId?: number;
    title: string;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    description: string;
    rootCause?: string;
    assigneeId?: number;
    reporterId: number;
  }) {
    const ncrCode = await this.generateCode('NCR', qualityNcrs, qualityNcrs.ncrCode);
    const [ncr] = await db.insert(qualityNcrs).values({
      ncrCode,
      inspectionId: data.inspectionId || null,
      holdId: data.holdId || null,
      title: data.title,
      severity: data.severity || 'MAJOR',
      description: data.description,
      rootCause: data.rootCause || null,
      status: 'DRAFT',
      assigneeId: data.assigneeId || null,
      reporterId: data.reporterId,
      createdAt: new Date()
    } as any).returning();
    return ncr;
  }

  static async updateNcrStatus(ncrId: number, status: string, userId: number) {
    const updateData: any = { status };
    if (status === 'CLOSED') {
      updateData.closedBy = userId;
      updateData.closedAt = new Date();
    }
    await db.update(qualityNcrs).set(updateData as any).where(eq(qualityNcrs.id, ncrId));
    return { ncrId, status };
  }

  // QMS-011: CAPA Lifecycle
  static async getCapas(ncrId?: number) {
    let query = db.select().from(qualityCapas).$dynamic();
    if (ncrId) query = query.where(eq(qualityCapas.ncrId, ncrId));
    return await query.orderBy(desc(qualityCapas.createdAt));
  }

  static async createCapa(data: {
    ncrId: number;
    title: string;
    correctiveAction: string;
    preventiveAction: string;
    targetDate?: string;
    assignedUserId?: number;
  }) {
    const capaCode = await this.generateCode('CAP', qualityCapas, qualityCapas.capaCode);
    const [capa] = await db.insert(qualityCapas).values({
      capaCode,
      ncrId: data.ncrId,
      title: data.title,
      correctiveAction: data.correctiveAction,
      preventiveAction: data.preventiveAction,
      targetDate: data.targetDate || null,
      status: 'PLANNED',
      assignedUserId: data.assignedUserId || null,
      createdAt: new Date()
    } as any).returning();

    // Auto update NCR status to CAPA_PENDING
    await db.update(qualityNcrs).set({ status: 'CAPA_PENDING' } as any).where(eq(qualityNcrs.id, data.ncrId));

    return capa;
  }

  // QMS-015: Quality Analytics Engine
  static async getAnalytics() {
    const allInspections = await db.select().from(qualityInspections);
    const totalCount = allInspections.length;
    const passedCount = allInspections.filter(i => i.status === 'PASSED').length;
    const failedCount = allInspections.filter(i => i.status === 'FAILED').length;
    const pendingCount = allInspections.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS' || i.status === 'PENDING_DECISION').length;

    const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 100;

    const incomingInspections = allInspections.filter(i => i.inspectionType === 'INCOMING');
    const incomingPassed = incomingInspections.filter(i => i.status === 'PASSED').length;
    const incomingPassRate = incomingInspections.length > 0 ? Math.round((incomingPassed / incomingInspections.length) * 100) : 100;

    const inProcessInspections = allInspections.filter(i => i.inspectionType === 'IN_PROCESS');
    const inProcessPassed = inProcessInspections.filter(i => i.status === 'PASSED').length;
    const inProcessPassRate = inProcessInspections.length > 0 ? Math.round((inProcessPassed / inProcessInspections.length) * 100) : 100;

    const activeHolds = await db.select().from(qualityHolds).where(eq(qualityHolds.status, 'QUARANTINED'));
    const openNcrs = await db.select().from(qualityNcrs).where(ne(qualityNcrs.status, 'CLOSED'));

    return {
      overview: {
        totalInspections: totalCount,
        passedInspections: passedCount,
        failedInspections: failedCount,
        pendingInspections: pendingCount,
        overallPassRate: passRate,
        incomingPassRate,
        inProcessPassRate,
        activeHoldCount: activeHolds.length,
        openNcrCount: openNcrs.length
      }
    };
  }
}
