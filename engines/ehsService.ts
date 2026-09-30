import { db } from '../db';
import * as schema from '../db/schema';
import { eq, desc, asc, and, sql, gte, lte, or } from 'drizzle-orm';
import { AuditService } from './auditService';
import { eventBus } from './eventBus';

export interface CreateIncidentInput {
  title: string;
  incidentType?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  warehouseId?: number;
  locationDetail?: string;
  incidentDate?: string;
  reportedBy?: number;
  reportedByName?: string;
  affectedEmployeeId?: number;
  affectedEmployeeName?: string;
  description: string;
  immediateAction?: string;
  relatedAssetId?: number;
  relatedPermitId?: number;
  idempotencyKey?: string;
}

export interface CreateRiskAssessmentInput {
  jobTitle: string;
  workArea: string;
  warehouseId?: number;
  severityScore: number; // 1-5
  probabilityScore: number; // 1-5
  hazardsJson?: string;
  controlMeasures: string;
  assessedBy: string;
  assessedEmployeeId?: number;
  reviewDate?: string;
  idempotencyKey?: string;
}

export interface CreateCapaInput {
  sourceRefType?: string;
  sourceRefId?: number;
  sourceRefCode?: string;
  title: string;
  actionType?: 'CORRECTIVE' | 'PREVENTIVE';
  rootCauseSummary?: string;
  actionPlan: string;
  assignedTo?: number;
  assignedToName?: string;
  warehouseId?: number;
  dueDate: string;
  idempotencyKey?: string;
}

export interface CreateAuditInput {
  title: string;
  auditType?: string;
  warehouseId?: number;
  auditDate?: string;
  auditorId?: number;
  auditorName: string;
  checklistItems: Array<{
    itemDescription: string;
    category: string;
    isMandatory?: boolean;
    status: 'PASS' | 'FAIL' | 'NA';
    equipmentId?: number;
    equipmentCode?: string;
    failureReason?: string;
    notes?: string;
  }>;
  remarks?: string;
  idempotencyKey?: string;
}

export interface CreateFireEquipmentInput {
  equipmentCode: string;
  name: string;
  type?: string;
  warehouseId?: number;
  specificLocation: string;
  lastInspectionDate: string;
  expiryDate?: string;
  weightKg?: number;
  pressureStatus?: string;
  relatedAssetId?: number;
}

export interface CreateEnvironmentalRecordInput {
  recordType: string;
  warehouseId?: number;
  parameterName: string;
  measuredValue: number;
  standardThreshold: number;
  unit: string;
  recordedDate?: string;
  notes?: string;
  recordedBy?: string;
  idempotencyKey?: string;
}

export interface CreatePermitInput {
  permitType: string;
  targetAssetId?: number;
  targetAssetCode?: string;
  targetAssetName?: string;
  warehouseId?: number;
  areaLocation: string;
  description: string;
  validFrom: string;
  validTo: string;
  applicantId?: number;
  applicantName: string;
  lotoTagNumber?: string;
  safetyChecklistJson?: string;
  idempotencyKey?: string;
}

export class EhsService {
  /**
   * Helper: Calculate reporting deadline according to Vietnam OSH Law 2015 / Decree 39/2016
   */
  private calculateReportingDeadline(severity: string, incidentDateStr: string): Date {
    const baseDate = incidentDateStr ? new Date(incidentDateStr) : new Date();
    if (isNaN(baseDate.getTime())) return new Date(Date.now() + 24 * 3600 * 1000);
    
    // FATAL / CRITICAL -> 24 hours
    if (severity === 'CRITICAL') {
      return new Date(baseDate.getTime() + 24 * 3600 * 1000);
    }
    // HIGH (Lost Time Injury) -> 48 hours
    if (severity === 'HIGH') {
      return new Date(baseDate.getTime() + 48 * 3600 * 1000);
    }
    // MEDIUM / LOW -> 72 hours
    return new Date(baseDate.getTime() + 72 * 3600 * 1000);
  }

  /**
   * Helper: Calculate JSA 5x5 matrix risk score & level
   */
  public calculateRiskLevel(severityScore: number, probabilityScore: number): { riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' } {
    const s = Math.max(1, Math.min(5, severityScore || 1));
    const p = Math.max(1, Math.min(5, probabilityScore || 1));
    const score = s * p;
    
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
    if (score >= 15) level = 'EXTREME';
    else if (score >= 10) level = 'HIGH';
    else if (score >= 5) level = 'MEDIUM';
    else level = 'LOW';

    return { riskScore: score, riskLevel: level };
  }

  // =========================================================================
  // 1. INCIDENTS (F01, F09, F10)
  // =========================================================================

  public async getIncidents(filter?: { warehouseId?: number; severity?: string; status?: string; search?: string }) {
    let query = db.select().from(schema.ehsIncidents);
    const conditions = [];

    if (filter?.warehouseId) conditions.push(eq(schema.ehsIncidents.warehouseId, filter.warehouseId));
    if (filter?.severity && filter.severity !== 'ALL') conditions.push(eq(schema.ehsIncidents.severity, filter.severity));
    if (filter?.status && filter.status !== 'ALL') conditions.push(eq(schema.ehsIncidents.status, filter.status));

    const records = conditions.length > 0 
      ? await query.where(and(...conditions)).orderBy(desc(schema.ehsIncidents.id))
      : await query.orderBy(desc(schema.ehsIncidents.id));

    if (filter?.search) {
      const term = filter.search.toLowerCase();
      return records.filter(r => 
        r.incidentNumber.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        (r.locationDetail && r.locationDetail.toLowerCase().includes(term)) ||
        (r.reportedByName && r.reportedByName.toLowerCase().includes(term))
      );
    }
    return records;
  }

  public async getIncidentById(id: number) {
    const [incident] = await db.select().from(schema.ehsIncidents).where(eq(schema.ehsIncidents.id, id));
    if (!incident) return null;

    // Get linked CAPAs
    const linkedCapas = await db.select().from(schema.ehsCapas).where(
      and(
        eq(schema.ehsCapas.sourceRefType, 'INCIDENT'),
        eq(schema.ehsCapas.sourceRefId, id)
      )
    );

    return { ...incident, capas: linkedCapas };
  }

  public async createIncident(input: CreateIncidentInput, actor?: { userId?: number; username?: string }) {
    // Check idempotency
    if (input.idempotencyKey) {
      const [existing] = await db.select().from(schema.ehsIncidents).where(eq(schema.ehsIncidents.idempotencyKey, input.idempotencyKey));
      if (existing) return existing;
    }

    // Resolve warehouse name if warehouseId provided
    let whName = undefined;
    if (input.warehouseId) {
      const [wh] = await db.select().from(schema.warehouses).where(eq(schema.warehouses.id, input.warehouseId));
      if (wh) whName = wh.name;
    }

    // Generate incident number
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.ehsIncidents);
    const seq = (countRes[0]?.count || 0) + 1;
    const year = new Date().getFullYear();
    const incidentNumber = `EHS-INC-${year}-${String(seq).padStart(4, '0')}`;

    const severity = input.severity || 'MEDIUM';
    const incidentDate = input.incidentDate || new Date().toISOString().slice(0, 10);
    const deadline = this.calculateReportingDeadline(severity, incidentDate);

    const [inserted] = await db.insert(schema.ehsIncidents).values({
      incidentNumber,
      title: input.title,
      incidentType: input.incidentType || 'SAFETY_HAZARD',
      severity,
      warehouseId: input.warehouseId,
      warehouseName: whName,
      locationDetail: input.locationDetail,
      incidentDate,
      reportedBy: input.reportedBy,
      reportedByName: input.reportedByName || actor?.username || 'Cán bộ An toàn',
      affectedEmployeeId: input.affectedEmployeeId,
      affectedEmployeeName: input.affectedEmployeeName,
      description: input.description,
      immediateAction: input.immediateAction || 'Đã khoanh vùng và cách ly hiện trường.',
      reportingDeadlineAt: deadline,
      status: 'OPEN',
      relatedAssetId: input.relatedAssetId,
      relatedPermitId: input.relatedPermitId,
      idempotencyKey: input.idempotencyKey,
    }).returning();

    // M02 Audit Log
    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'CREATE',
      entityType: 'EHS_INCIDENT',
      entityId: inserted.id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      afterData: inserted,
      metadata: { incidentNumber, severity, deadline },
    });

    // M05 EventBus Outbox
    await eventBus.publishTransactional(db, {
      eventType: 'ehs.incident.reported.v1',
      aggregateType: 'EHS_INCIDENT',
      aggregateId: String(inserted.id),
      source: 'M40_EHS',
      payload: {
        recordId: inserted.id,
        code: inserted.incidentNumber,
        type: inserted.incidentType,
        siteId: inserted.warehouseId,
        severity: inserted.severity,
        status: inserted.status,
        timestamp: new Date().toISOString(),
      },
    });

    return inserted;
  }

  public async investigateIncident(id: number, input: { rootCause: string; immediateAction?: string; status?: string }, actor?: { userId?: number; username?: string }) {
    const [existing] = await db.select().from(schema.ehsIncidents).where(eq(schema.ehsIncidents.id, id));
    if (!existing) throw new Error('Không tìm thấy hồ sơ sự cố.');
    if (existing.status === 'CLOSED') throw new Error('Hồ sơ sự cố đã ĐÓNG, tính chất bất biến.');

    const [updated] = await db.update(schema.ehsIncidents).set({
      rootCause: input.rootCause,
      immediateAction: input.immediateAction || existing.immediateAction,
      status: (input.status as any) || 'INVESTIGATING',
      updatedAt: new Date(),
    }).where(eq(schema.ehsIncidents.id, id)).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'INVESTIGATE',
      entityType: 'EHS_INCIDENT',
      entityId: id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      beforeData: existing,
      afterData: updated,
    });

    return updated;
  }

  public async closeIncident(id: number, notes?: string, actor?: { userId?: number; username?: string }) {
    const [existing] = await db.select().from(schema.ehsIncidents).where(eq(schema.ehsIncidents.id, id));
    if (!existing) throw new Error('Không tìm thấy hồ sơ sự cố.');
    if (existing.status === 'CLOSED') return { status: 'ALREADY_PROCESSED', record: existing };

    const [updated] = await db.update(schema.ehsIncidents).set({
      status: 'CLOSED',
      resolvedAt: new Date(),
      closedBy: actor?.username || 'EHS Manager',
      updatedAt: new Date(),
    }).where(eq(schema.ehsIncidents.id, id)).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'CLOSE',
      entityType: 'EHS_INCIDENT',
      entityId: id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      beforeData: existing,
      afterData: updated,
      metadata: { notes },
    });

    return { status: 'SUCCESS', record: updated };
  }

  // =========================================================================
  // 2. RISK ASSESSMENTS / JSA MATRIX (F02)
  // =========================================================================

  public async getRiskAssessments(filter?: { warehouseId?: number; riskLevel?: string; search?: string }) {
    let query = db.select().from(schema.ehsRiskAssessments);
    const conditions = [];

    if (filter?.warehouseId) conditions.push(eq(schema.ehsRiskAssessments.warehouseId, filter.warehouseId));
    if (filter?.riskLevel && filter.riskLevel !== 'ALL') conditions.push(eq(schema.ehsRiskAssessments.riskLevel, filter.riskLevel));

    const records = conditions.length > 0 
      ? await query.where(and(...conditions)).orderBy(desc(schema.ehsRiskAssessments.id))
      : await query.orderBy(desc(schema.ehsRiskAssessments.id));

    if (filter?.search) {
      const term = filter.search.toLowerCase();
      return records.filter(r => 
        r.assessmentCode.toLowerCase().includes(term) ||
        r.jobTitle.toLowerCase().includes(term) ||
        r.workArea.toLowerCase().includes(term)
      );
    }
    return records;
  }

  public async createRiskAssessment(input: CreateRiskAssessmentInput, actor?: { userId?: number; username?: string }) {
    if (input.idempotencyKey) {
      const [existing] = await db.select().from(schema.ehsRiskAssessments).where(eq(schema.ehsRiskAssessments.idempotencyKey, input.idempotencyKey));
      if (existing) return existing;
    }

    let whName = undefined;
    if (input.warehouseId) {
      const [wh] = await db.select().from(schema.warehouses).where(eq(schema.warehouses.id, input.warehouseId));
      if (wh) whName = wh.name;
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.ehsRiskAssessments);
    const seq = (countRes[0]?.count || 0) + 1;
    const year = new Date().getFullYear();
    const assessmentCode = `JSA-${year}-${String(seq).padStart(4, '0')}`;

    const { riskScore, riskLevel } = this.calculateRiskLevel(input.severityScore, input.probabilityScore);

    const [inserted] = await db.insert(schema.ehsRiskAssessments).values({
      assessmentCode,
      jobTitle: input.jobTitle,
      workArea: input.workArea,
      warehouseId: input.warehouseId,
      warehouseName: whName,
      severityScore: input.severityScore,
      probabilityScore: input.probabilityScore,
      riskScore,
      riskLevel,
      hazardsJson: input.hazardsJson,
      controlMeasures: input.controlMeasures,
      assessedBy: input.assessedBy || actor?.username || 'Chuyên viên An toàn',
      assessedEmployeeId: input.assessedEmployeeId,
      reviewDate: input.reviewDate,
      status: 'ACTIVE',
      idempotencyKey: input.idempotencyKey,
    }).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'CREATE',
      entityType: 'EHS_RISK_ASSESSMENT',
      entityId: inserted.id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      afterData: inserted,
    });

    return inserted;
  }

  // =========================================================================
  // 3. CAPA MANAGEMENT (F03, F11)
  // =========================================================================

  public async getCapas(filter?: { warehouseId?: number; status?: string; search?: string }) {
    let query = db.select().from(schema.ehsCapas);
    const conditions = [];

    if (filter?.warehouseId) conditions.push(eq(schema.ehsCapas.warehouseId, filter.warehouseId));
    if (filter?.status && filter.status !== 'ALL') conditions.push(eq(schema.ehsCapas.status, filter.status));

    const records = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(schema.ehsCapas.id))
      : await query.orderBy(desc(schema.ehsCapas.id));

    if (filter?.search) {
      const term = filter.search.toLowerCase();
      return records.filter(r => 
        r.capaNumber.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        (r.assignedToName && r.assignedToName.toLowerCase().includes(term))
      );
    }
    return records;
  }

  public async createCapa(input: CreateCapaInput, actor?: { userId?: number; username?: string }) {
    if (input.idempotencyKey) {
      const [existing] = await db.select().from(schema.ehsCapas).where(eq(schema.ehsCapas.idempotencyKey, input.idempotencyKey));
      if (existing) return existing;
    }

    let whName = undefined;
    if (input.warehouseId) {
      const [wh] = await db.select().from(schema.warehouses).where(eq(schema.warehouses.id, input.warehouseId));
      if (wh) whName = wh.name;
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.ehsCapas);
    const seq = (countRes[0]?.count || 0) + 1;
    const year = new Date().getFullYear();
    const capaNumber = `EHS-CAPA-${year}-${String(seq).padStart(4, '0')}`;

    const [inserted] = await db.insert(schema.ehsCapas).values({
      capaNumber,
      sourceRefType: input.sourceRefType || 'MANUAL',
      sourceRefId: input.sourceRefId,
      sourceRefCode: input.sourceRefCode,
      title: input.title,
      actionType: input.actionType || 'CORRECTIVE',
      rootCauseSummary: input.rootCauseSummary,
      actionPlan: input.actionPlan,
      assignedTo: input.assignedTo,
      assignedToName: input.assignedToName,
      warehouseId: input.warehouseId,
      warehouseName: whName,
      dueDate: input.dueDate,
      status: 'OPEN',
      idempotencyKey: input.idempotencyKey,
    }).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'CREATE',
      entityType: 'EHS_CAPA',
      entityId: inserted.id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      afterData: inserted,
    });

    return inserted;
  }

  public async verifyCapa(id: number, input: { verificationNotes: string }, actor?: { userId?: number; username?: string }) {
    const [existing] = await db.select().from(schema.ehsCapas).where(eq(schema.ehsCapas.id, id));
    if (!existing) throw new Error('Không tìm thấy phiếu CAPA.');
    if (existing.status === 'CLOSED') throw new Error('Phiếu CAPA đã đóng.');

    const [updated] = await db.update(schema.ehsCapas).set({
      status: 'VERIFIED',
      verificationNotes: input.verificationNotes,
      verifiedBy: actor?.username || 'EHS Auditor',
      verifiedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(schema.ehsCapas.id, id)).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'VERIFY',
      entityType: 'EHS_CAPA',
      entityId: id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      beforeData: existing,
      afterData: updated,
    });

    return updated;
  }

  public async closeCapa(id: number, actor?: { userId?: number; username?: string }) {
    const [existing] = await db.select().from(schema.ehsCapas).where(eq(schema.ehsCapas.id, id));
    if (!existing) throw new Error('Không tìm thấy phiếu CAPA.');
    if (existing.status === 'CLOSED') return { status: 'ALREADY_PROCESSED', record: existing };

    const [updated] = await db.update(schema.ehsCapas).set({
      status: 'CLOSED',
      updatedAt: new Date(),
    }).where(eq(schema.ehsCapas.id, id)).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'CLOSE',
      entityType: 'EHS_CAPA',
      entityId: id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      beforeData: existing,
      afterData: updated,
    });

    return { status: 'SUCCESS', record: updated };
  }

  // =========================================================================
  // 4. SAFETY AUDITS & AUTO-CAPA ON FAILURE (F04, F12)
  // =========================================================================

  public async getAudits(filter?: { warehouseId?: number; result?: string; search?: string }) {
    let query = db.select().from(schema.ehsSafetyAudits);
    const conditions = [];

    if (filter?.warehouseId) conditions.push(eq(schema.ehsSafetyAudits.warehouseId, filter.warehouseId));
    if (filter?.result && filter.result !== 'ALL') conditions.push(eq(schema.ehsSafetyAudits.result, filter.result));

    const records = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(schema.ehsSafetyAudits.id))
      : await query.orderBy(desc(schema.ehsSafetyAudits.id));

    if (filter?.search) {
      const term = filter.search.toLowerCase();
      return records.filter(r => 
        r.auditNumber.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        r.auditorName.toLowerCase().includes(term)
      );
    }
    return records;
  }

  public async getAuditById(id: number) {
    const [audit] = await db.select().from(schema.ehsSafetyAudits).where(eq(schema.ehsSafetyAudits.id, id));
    if (!audit) return null;

    const items = await db.select().from(schema.ehsAuditChecklistItems).where(eq(schema.ehsAuditChecklistItems.auditId, id));
    return { ...audit, items };
  }

  public async executeSafetyAudit(input: CreateAuditInput, actor?: { userId?: number; username?: string }) {
    if (input.idempotencyKey) {
      const [existing] = await db.select().from(schema.ehsSafetyAudits).where(eq(schema.ehsSafetyAudits.idempotencyKey, input.idempotencyKey));
      if (existing) return existing;
    }

    let whName = undefined;
    if (input.warehouseId) {
      const [wh] = await db.select().from(schema.warehouses).where(eq(schema.warehouses.id, input.warehouseId));
      if (wh) whName = wh.name;
    }

    const auditDate = input.auditDate || new Date().toISOString().slice(0, 10);
    const items = input.checklistItems || [];
    const totalItems = items.length;
    let passedCount = 0;
    let failedCount = 0;
    let hasMandatoryFailure = false;
    const failedDescriptions: string[] = [];

    // Check items and fire safety expiry
    for (const it of items) {
      if (it.status === 'PASS') {
        passedCount++;
      } else if (it.status === 'FAIL') {
        failedCount++;
        if (it.isMandatory !== false) hasMandatoryFailure = true;
        failedDescriptions.push(`${it.category}: ${it.itemDescription} (${it.failureReason || 'Không đạt tiêu chuẩn'})`);
      }
    }

    // Automatic Golden Rule: Check if any fire equipment in this warehouse is EXPIRED
    if (input.warehouseId) {
      const fireEquipments = await db.select().from(schema.ehsFireEquipment).where(eq(schema.ehsFireEquipment.warehouseId, input.warehouseId));
      for (const eqItem of fireEquipments) {
        if (eqItem.expiryDate && eqItem.expiryDate < auditDate) {
          hasMandatoryFailure = true;
          failedDescriptions.push(`PCCC Quá hạn kiểm định: Thiết bị ${eqItem.equipmentCode} (${eqItem.name}) đã quá hạn ngày ${eqItem.expiryDate}`);
        }
      }
    }

    const scorePercent = totalItems > 0 ? Math.round((passedCount / totalItems) * 100) : 100;
    const result = (failedCount > 0 || hasMandatoryFailure || scorePercent < 85) ? 'FAIL' : 'PASS';

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.ehsSafetyAudits);
    const seq = (countRes[0]?.count || 0) + 1;
    const year = new Date().getFullYear();
    const auditNumber = `EHS-AUD-${year}-${String(seq).padStart(4, '0')}`;

    // Insert audit header
    const [insertedAudit] = await db.insert(schema.ehsSafetyAudits).values({
      auditNumber,
      title: input.title,
      auditType: input.auditType || 'FIRE_SAFETY',
      warehouseId: input.warehouseId,
      warehouseName: whName,
      auditDate,
      auditorId: input.auditorId,
      auditorName: input.auditorName || actor?.username || 'Cán bộ Kiểm định EHS',
      totalItems,
      passedItems: passedCount,
      failedItems: failedCount,
      scorePercent,
      result,
      remarks: input.remarks || (result === 'FAIL' ? `Audit FAILED do tồn tại ${failedDescriptions.length} hạng mục không đạt chuẩn.` : 'Đã nghiệm thu đạt chuẩn an toàn.'),
      status: 'COMPLETED',
      idempotencyKey: input.idempotencyKey,
    }).returning();

    // Insert checklist items
    if (items.length > 0) {
      for (const it of items) {
        await db.insert(schema.ehsAuditChecklistItems).values({
          auditId: insertedAudit.id,
          itemDescription: it.itemDescription,
          category: it.category,
          isMandatory: it.isMandatory !== false,
          status: it.status,
          equipmentId: it.equipmentId,
          equipmentCode: it.equipmentCode,
          failureReason: it.failureReason,
          notes: it.notes,
        });
      }
    }

    // F12 Automatic CAPA generation on FAIL
    let generatedCapa = null;
    if (result === 'FAIL') {
      const dueDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10); // 7 days resolution window
      generatedCapa = await this.createCapa({
        sourceRefType: 'AUDIT',
        sourceRefId: insertedAudit.id,
        sourceRefCode: insertedAudit.auditNumber,
        title: `[Tự động từ Audit] Khắc phục vi phạm an toàn ${insertedAudit.auditNumber}`,
        actionType: 'CORRECTIVE',
        rootCauseSummary: `Phát hiện vi phạm an toàn tại đợt kiểm tra ${insertedAudit.title} (${insertedAudit.auditDate}).`,
        actionPlan: failedDescriptions.join('\n') || 'Khắc phục các điểm không phù hợp được chỉ ra trong biên bản audit.',
        warehouseId: input.warehouseId,
        dueDate,
      }, actor);

      // Link generated CAPA
      await db.update(schema.ehsSafetyAudits).set({
        generatedCapaId: generatedCapa.id,
      }).where(eq(schema.ehsSafetyAudits.id, insertedAudit.id));

      // M05 EventBus Outbox on Audit Failed
      await eventBus.publishTransactional(db, {
        eventType: 'ehs.audit.failed.v1',
        aggregateType: 'EHS_AUDIT',
        aggregateId: String(insertedAudit.id),
        source: 'M40_EHS',
        payload: {
          recordId: insertedAudit.id,
          code: insertedAudit.auditNumber,
          siteId: insertedAudit.warehouseId,
          result: 'FAIL',
          scorePercent,
          capaNumber: generatedCapa.capaNumber,
          timestamp: new Date().toISOString(),
        },
      });
    }

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'EXECUTE_AUDIT',
      entityType: 'EHS_AUDIT',
      entityId: insertedAudit.id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      afterData: insertedAudit,
      metadata: { result, scorePercent, generatedCapaId: generatedCapa?.id },
    });

    return { ...insertedAudit, generatedCapa };
  }

  // =========================================================================
  // 5. FIRE SAFETY EQUIPMENT REGISTRY (F05)
  // =========================================================================

  public async getFireEquipment(filter?: { warehouseId?: number; status?: string; search?: string }) {
    let query = db.select().from(schema.ehsFireEquipment);
    const conditions = [];

    if (filter?.warehouseId) conditions.push(eq(schema.ehsFireEquipment.warehouseId, filter.warehouseId));
    if (filter?.status && filter.status !== 'ALL') conditions.push(eq(schema.ehsFireEquipment.status, filter.status));

    const records = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(asc(schema.ehsFireEquipment.expiryDate))
      : await query.orderBy(asc(schema.ehsFireEquipment.expiryDate));

    const todayStr = new Date().toISOString().slice(0, 10);

    // Compute dynamic overdue flag
    const mapped = records.map(r => {
      const isExpired = r.expiryDate < todayStr;
      const computedStatus = isExpired && r.status === 'READY' ? 'EXPIRED' : r.status;
      return { ...r, status: computedStatus, isExpired };
    });

    if (filter?.search) {
      const term = filter.search.toLowerCase();
      return mapped.filter(r => 
        r.equipmentCode.toLowerCase().includes(term) ||
        r.name.toLowerCase().includes(term) ||
        r.specificLocation.toLowerCase().includes(term)
      );
    }
    return mapped;
  }

  public async createFireEquipment(input: CreateFireEquipmentInput, actor?: { userId?: number; username?: string }) {
    let whName = undefined;
    if (input.warehouseId) {
      const [wh] = await db.select().from(schema.warehouses).where(eq(schema.warehouses.id, input.warehouseId));
      if (wh) whName = wh.name;
    }

    // Default expiry 6 months from last inspection if not provided
    let expiryDate = input.expiryDate;
    if (!expiryDate && input.lastInspectionDate) {
      const d = new Date(input.lastInspectionDate);
      d.setMonth(d.getMonth() + 6);
      expiryDate = d.toISOString().slice(0, 10);
    } else if (!expiryDate) {
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      expiryDate = d.toISOString().slice(0, 10);
    }

    const [inserted] = await db.insert(schema.ehsFireEquipment).values({
      equipmentCode: input.equipmentCode,
      name: input.name,
      type: input.type || 'FIRE_EXTINGUISHER_ABC',
      warehouseId: input.warehouseId,
      warehouseName: whName,
      specificLocation: input.specificLocation,
      lastInspectionDate: input.lastInspectionDate,
      expiryDate,
      weightKg: input.weightKg,
      pressureStatus: input.pressureStatus || 'NORMAL',
      status: 'READY',
      relatedAssetId: input.relatedAssetId,
    }).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'CREATE',
      entityType: 'EHS_FIRE_EQUIPMENT',
      entityId: inserted.id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      afterData: inserted,
    });

    return inserted;
  }

  public async inspectFireEquipment(id: number, input: { inspectionDate: string; pressureStatus?: string; notes?: string }, actor?: { userId?: number; username?: string }) {
    const [existing] = await db.select().from(schema.ehsFireEquipment).where(eq(schema.ehsFireEquipment.id, id));
    if (!existing) throw new Error('Không tìm thấy thiết bị PCCC.');

    const inspDate = input.inspectionDate || new Date().toISOString().slice(0, 10);
    const d = new Date(inspDate);
    d.setMonth(d.getMonth() + 6);
    const nextExpiry = d.toISOString().slice(0, 10);

    const [updated] = await db.update(schema.ehsFireEquipment).set({
      lastInspectionDate: inspDate,
      expiryDate: nextExpiry,
      pressureStatus: input.pressureStatus || 'NORMAL',
      status: 'READY',
      updatedAt: new Date(),
    }).where(eq(schema.ehsFireEquipment.id, id)).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'INSPECT_FIRE_EQUIPMENT',
      entityType: 'EHS_FIRE_EQUIPMENT',
      entityId: id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      beforeData: existing,
      afterData: updated,
      metadata: { notes: input.notes, nextExpiry },
    });

    return updated;
  }

  // =========================================================================
  // 6. ENVIRONMENTAL MONITORING (F06)
  // =========================================================================

  public async getEnvironmentalRecords(filter?: { warehouseId?: number; recordType?: string; status?: string }) {
    let query = db.select().from(schema.ehsEnvironmentalRecords);
    const conditions = [];

    if (filter?.warehouseId) conditions.push(eq(schema.ehsEnvironmentalRecords.warehouseId, filter.warehouseId));
    if (filter?.recordType && filter.recordType !== 'ALL') conditions.push(eq(schema.ehsEnvironmentalRecords.recordType, filter.recordType));
    if (filter?.status && filter.status !== 'ALL') conditions.push(eq(schema.ehsEnvironmentalRecords.complianceStatus, filter.status));

    return conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(schema.ehsEnvironmentalRecords.id))
      : await query.orderBy(desc(schema.ehsEnvironmentalRecords.id));
  }

  public async createEnvironmentalRecord(input: CreateEnvironmentalRecordInput, actor?: { userId?: number; username?: string }) {
    if (input.idempotencyKey) {
      const [existing] = await db.select().from(schema.ehsEnvironmentalRecords).where(eq(schema.ehsEnvironmentalRecords.idempotencyKey, input.idempotencyKey));
      if (existing) return existing;
    }

    let whName = undefined;
    if (input.warehouseId) {
      const [wh] = await db.select().from(schema.warehouses).where(eq(schema.warehouses.id, input.warehouseId));
      if (wh) whName = wh.name;
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.ehsEnvironmentalRecords);
    const seq = (countRes[0]?.count || 0) + 1;
    const year = new Date().getFullYear();
    const recordNumber = `ENV-${year}-${String(seq).padStart(4, '0')}`;

    const isExceeded = input.measuredValue > input.standardThreshold;
    const complianceStatus = isExceeded ? 'EXCEEDED' : 'COMPLIANT';

    const [inserted] = await db.insert(schema.ehsEnvironmentalRecords).values({
      recordNumber,
      recordType: input.recordType,
      warehouseId: input.warehouseId,
      warehouseName: whName,
      parameterName: input.parameterName,
      measuredValue: input.measuredValue,
      standardThreshold: input.standardThreshold,
      unit: input.unit,
      complianceStatus,
      recordedDate: input.recordedDate || new Date().toISOString().slice(0, 10),
      notes: input.notes,
      recordedBy: input.recordedBy || actor?.username || 'Cán bộ Quan trắc ISO 14001',
      idempotencyKey: input.idempotencyKey,
    }).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'CREATE',
      entityType: 'EHS_ENVIRONMENTAL_RECORD',
      entityId: inserted.id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      afterData: inserted,
      metadata: { complianceStatus },
    });

    return inserted;
  }

  // =========================================================================
  // 7. SAFETY PERMITS & LOTO ISOLATION (F08)
  // =========================================================================

  public async getPermits(filter?: { warehouseId?: number; status?: string; assetId?: number }) {
    let query = db.select().from(schema.ehsSafetyPermits);
    const conditions = [];

    if (filter?.warehouseId) conditions.push(eq(schema.ehsSafetyPermits.warehouseId, filter.warehouseId));
    if (filter?.status && filter.status !== 'ALL') conditions.push(eq(schema.ehsSafetyPermits.status, filter.status));
    if (filter?.assetId) conditions.push(eq(schema.ehsSafetyPermits.targetAssetId, filter.assetId));

    return conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(schema.ehsSafetyPermits.id))
      : await query.orderBy(desc(schema.ehsSafetyPermits.id));
  }

  public async getPermitById(id: number) {
    const [permit] = await db.select().from(schema.ehsSafetyPermits).where(eq(schema.ehsSafetyPermits.id, id));
    return permit || null;
  }

  /**
   * READ-ONLY API for M27 EAM or any external module to check active permit for an asset
   */
  public async getActivePermitForAsset(assetId: number) {
    const nowIso = new Date().toISOString();
    const [permit] = await db.select().from(schema.ehsSafetyPermits).where(
      and(
        eq(schema.ehsSafetyPermits.targetAssetId, assetId),
        or(eq(schema.ehsSafetyPermits.status, 'ACTIVE'), eq(schema.ehsSafetyPermits.status, 'APPROVED')),
        gte(schema.ehsSafetyPermits.validTo, nowIso.slice(0, 10))
      )
    ).orderBy(desc(schema.ehsSafetyPermits.id)).limit(1);

    if (!permit) return { hasActivePermit: false, permit: null };
    return { hasActivePermit: true, permit };
  }

  public async createPermit(input: CreatePermitInput, actor?: { userId?: number; username?: string }) {
    if (input.idempotencyKey) {
      const [existing] = await db.select().from(schema.ehsSafetyPermits).where(eq(schema.ehsSafetyPermits.idempotencyKey, input.idempotencyKey));
      if (existing) return existing;
    }

    let whName = undefined;
    if (input.warehouseId) {
      const [wh] = await db.select().from(schema.warehouses).where(eq(schema.warehouses.id, input.warehouseId));
      if (wh) whName = wh.name;
    }

    let assetCode = input.targetAssetCode;
    let assetName = input.targetAssetName;
    if (input.targetAssetId && (!assetCode || !assetName)) {
      const [ast] = await db.select().from(schema.assets).where(eq(schema.assets.id, input.targetAssetId));
      if (ast) {
        assetCode = ast.code;
        assetName = ast.name;
      }
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.ehsSafetyPermits);
    const seq = (countRes[0]?.count || 0) + 1;
    const year = new Date().getFullYear();
    const permitNumber = `PMT-${year}-${String(seq).padStart(4, '0')}`;

    const [inserted] = await db.insert(schema.ehsSafetyPermits).values({
      permitNumber,
      permitType: input.permitType,
      targetAssetId: input.targetAssetId,
      targetAssetCode: assetCode,
      targetAssetName: assetName,
      warehouseId: input.warehouseId,
      warehouseName: whName,
      areaLocation: input.areaLocation,
      description: input.description,
      validFrom: input.validFrom,
      validTo: input.validTo,
      applicantId: input.applicantId,
      applicantName: input.applicantName || actor?.username || 'Kỹ thuật viên',
      lotoTagNumber: input.lotoTagNumber,
      safetyChecklistJson: input.safetyChecklistJson,
      status: 'APPROVED', // Default approved by EHS officer or created active
      idempotencyKey: input.idempotencyKey,
    }).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'CREATE_PERMIT',
      entityType: 'EHS_SAFETY_PERMIT',
      entityId: inserted.id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      afterData: inserted,
    });

    // M05 EventBus Outbox
    await eventBus.publishTransactional(db, {
      eventType: 'ehs.permit.issued.v1',
      aggregateType: 'EHS_PERMIT',
      aggregateId: String(inserted.id),
      source: 'M40_EHS',
      payload: {
        recordId: inserted.id,
        code: inserted.permitNumber,
        type: inserted.permitType,
        targetAssetId: inserted.targetAssetId,
        validFrom: inserted.validFrom,
        validTo: inserted.validTo,
        status: inserted.status,
        timestamp: new Date().toISOString(),
      },
    });

    return inserted;
  }

  public async activatePermit(id: number, actor?: { userId?: number; username?: string }) {
    const [existing] = await db.select().from(schema.ehsSafetyPermits).where(eq(schema.ehsSafetyPermits.id, id));
    if (!existing) throw new Error('Không tìm thấy giấy phép an toàn.');
    if (existing.status === 'CLOSED' || existing.status === 'EXPIRED') throw new Error('Giấy phép đã kết thúc.');

    const [updated] = await db.update(schema.ehsSafetyPermits).set({
      status: 'ACTIVE',
      updatedAt: new Date(),
    }).where(eq(schema.ehsSafetyPermits.id, id)).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'ACTIVATE_PERMIT',
      entityType: 'EHS_SAFETY_PERMIT',
      entityId: id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      beforeData: existing,
      afterData: updated,
    });

    return updated;
  }

  public async closePermit(id: number, notes?: string, actor?: { userId?: number; username?: string }) {
    const [existing] = await db.select().from(schema.ehsSafetyPermits).where(eq(schema.ehsSafetyPermits.id, id));
    if (!existing) throw new Error('Không tìm thấy giấy phép an toàn.');
    if (existing.status === 'CLOSED') return { status: 'ALREADY_PROCESSED', record: existing };

    const [updated] = await db.update(schema.ehsSafetyPermits).set({
      status: 'CLOSED',
      closedAt: new Date(),
      closedNotes: notes || 'Đã tháo thẻ LOTO và bàn giao thiết bị an toàn.',
      updatedAt: new Date(),
    }).where(eq(schema.ehsSafetyPermits.id, id)).returning();

    await AuditService.recordAuditLog({
      module: 'M40',
      action: 'CLOSE_PERMIT',
      entityType: 'EHS_SAFETY_PERMIT',
      entityId: id,
      userId: actor?.userId,
      username: actor?.username || 'system',
      beforeData: existing,
      afterData: updated,
    });

    return { status: 'SUCCESS', record: updated };
  }

  // =========================================================================
  // 8. SITE SCOPE (F07)
  // =========================================================================

  public async getSiteScopes() {
    return db.select().from(schema.ehsSiteScope).orderBy(asc(schema.ehsSiteScope.id));
  }

  public async setSiteScope(warehouseId: number, data: { safetyOfficerId?: number; safetyOfficerName?: string; auditFrequencyDays?: number; emergencyContact?: string }) {
    const [wh] = await db.select().from(schema.warehouses).where(eq(schema.warehouses.id, warehouseId));
    if (!wh) throw new Error('Kho không tồn tại.');

    const [existing] = await db.select().from(schema.ehsSiteScope).where(eq(schema.ehsSiteScope.warehouseId, warehouseId));
    if (existing) {
      const [updated] = await db.update(schema.ehsSiteScope).set({
        safetyOfficerId: data.safetyOfficerId,
        safetyOfficerName: data.safetyOfficerName,
        auditFrequencyDays: data.auditFrequencyDays || 30,
        emergencyContact: data.emergencyContact,
        updatedAt: new Date(),
      }).where(eq(schema.ehsSiteScope.warehouseId, warehouseId)).returning();
      return updated;
    } else {
      const [inserted] = await db.insert(schema.ehsSiteScope).values({
        warehouseId,
        warehouseName: wh.name,
        safetyOfficerId: data.safetyOfficerId,
        safetyOfficerName: data.safetyOfficerName,
        auditFrequencyDays: data.auditFrequencyDays || 30,
        emergencyContact: data.emergencyContact,
      }).returning();
      return inserted;
    }
  }

  // =========================================================================
  // 9. KPI SUMMARY & CANONICAL COMPATIBILITY (F16)
  // =========================================================================

  public async getKpiSummary() {
    const incidents = await db.select().from(schema.ehsIncidents);
    const audits = await db.select().from(schema.ehsSafetyAudits);
    const capas = await db.select().from(schema.ehsCapas);
    const fireEquipments = await db.select().from(schema.ehsFireEquipment);
    const permits = await db.select().from(schema.ehsSafetyPermits);

    const todayStr = new Date().toISOString().slice(0, 10);

    const totalIncidents = incidents.length;
    const openIncidents = incidents.filter(i => i.status !== 'CLOSED').length;
    const fatalOrCritical = incidents.filter(i => i.severity === 'CRITICAL' || i.incidentType === 'FATAL').length;

    const totalAudits = audits.length;
    const passedAudits = audits.filter(a => a.result === 'PASS').length;
    const auditPassRate = totalAudits > 0 ? Math.round((passedAudits / totalAudits) * 100) : 100;

    const totalCapas = capas.length;
    const openCapas = capas.filter(c => c.status !== 'CLOSED').length;
    const overdueCapas = capas.filter(c => c.status !== 'CLOSED' && c.dueDate < todayStr).length;

    const totalFireEq = fireEquipments.length;
    const expiredFireEq = fireEquipments.filter(e => e.expiryDate < todayStr).length;

    const activePermits = permits.filter(p => p.status === 'ACTIVE' || p.status === 'APPROVED').length;

    return {
      totalIncidents,
      openIncidents,
      fatalOrCritical,
      totalAudits,
      passedAudits,
      auditPassRate,
      totalCapas,
      openCapas,
      overdueCapas,
      totalFireEquipment: totalFireEq,
      expiredFireEquipment: expiredFireEq,
      activePermits,
      safeWorkingDays: 142, // Seed baseline
    };
  }

  /**
   * Canonical wrapper returning legacy array structure for backwards compatibility with GET /api/ehs/records
   */
  public async getCanonicalRecords() {
    const incidents = await this.getIncidents();
    return incidents.map(i => ({
      id: i.id,
      recordCode: i.incidentNumber,
      title: i.title,
      incidentType: i.incidentType,
      severity: i.severity,
      location: i.locationDetail || i.warehouseName || 'Khu vực Kho bãi',
      reportedDate: i.incidentDate,
      status: i.status === 'CLOSED' ? 'CLOSED' : (i.status === 'INVESTIGATING' ? 'INVESTIGATING' : 'OPEN'),
      actionTaken: i.immediateAction || 'Đã ghi nhận, chờ đội an toàn xử lý CAPA',
      inspector: i.reportedByName || 'Cán bộ EHS',
    }));
  }
}

export const ehsService = new EhsService();
