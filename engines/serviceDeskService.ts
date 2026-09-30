import { db, client } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, asc, inArray, isNull, or, notInArray } from 'drizzle-orm';
import { AuditService } from './auditService';
import { eventBus } from './eventBus';

export interface PriorityMatrixInput {
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CreateTicketInput {
  subject: string;
  description?: string;
  type?: 'INCIDENT' | 'SERVICE_REQUEST' | 'ACCESS_REQUEST' | 'EQUIPMENT_DEFECT';
  impact?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  urgency?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  category?: string;
  requesterId?: number;
  requesterName?: string;
  requesterEmail?: string;
  requesterDepartment?: string;
  assignedAgentId?: number;
  assignedAgentName?: string;
  assetId?: number;
  assetCode?: string;
  assetName?: string;
  serialId?: number;
  serialNumber?: string;
  dmsAttachmentIds?: string[];
  idempotencyKey?: string;
  sourceModule?: string;
  sourceId?: string;
  parentTicketId?: number;
}

export interface ResolveTicketInput {
  ticketId: number;
  rootCause: string;
  resolutionNote: string;
  resolvedById?: number;
  resolvedByName?: string;
  idempotencyKey?: string;
}

export interface CloseTicketInput {
  ticketId: number;
  closedById?: number;
  closedByName?: string;
  feedbackScore?: number;
  feedbackComment?: string;
  idempotencyKey?: string;
}

export interface CreateAccessRequestInput {
  ticketId?: number;
  requesterId: number;
  requesterName: string;
  requesterEmail?: string;
  targetUserId: number;
  targetUserName: string;
  targetUserEmail?: string;
  targetUserRole?: string;
  requestedPermissionOrRole: string;
  isHighRisk?: boolean;
  reason: string;
  durationDays?: number;
  idempotencyKey?: string;
}

export const HIGH_RISK_PERMISSIONS = [
  'SUPER_ADMIN',
  'ADMIN',
  'system.admin',
  'roles.manage',
  'rbac:manage',
  'accounting:post_gl',
  'accounting:close_period',
  'costing:update_method',
  'costing:allocate',
  'pricing:override_approval',
  'inventory:force_adjust'
];

export class ServiceDeskService {
  /**
   * Calculate Priority from Impact x Urgency (ITIL Standard)
   */
  public static calculatePriority(impact: string = 'LOW', urgency: string = 'LOW'): 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' {
    const imp = impact.toUpperCase();
    const urg = urgency.toUpperCase();

    if (imp === 'CRITICAL' && urg === 'CRITICAL') return 'URGENT';
    if (imp === 'CRITICAL' || urg === 'CRITICAL') return 'HIGH';
    if (imp === 'HIGH' && urg === 'HIGH') return 'HIGH';
    if (imp === 'HIGH' || urg === 'HIGH') return 'NORMAL';
    if (imp === 'MEDIUM' && urg === 'MEDIUM') return 'NORMAL';
    return 'LOW';
  }

  /**
   * Check if a requested permission or role is high risk
   */
  public static isHighRiskPermission(permissionOrRole: string): boolean {
    if (!permissionOrRole) return false;
    const clean = permissionOrRole.trim();
    return HIGH_RISK_PERMISSIONS.some(p => p.toLowerCase() === clean.toLowerCase() || clean.includes('admin') || clean.includes('manage'));
  }

  /**
   * Get SLA Policy by Priority
   */
  public static async getSlaPolicy(priority: string) {
    const policies = await db.select().from(schema.slaPolicies).where(eq(schema.slaPolicies.isActive, true));
    const matched = policies.find(p => p.priority.toUpperCase() === priority.toUpperCase());
    if (matched) return matched;
    
    // Fallback default
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return { responseHours: 0.25, resolutionHours: 2.0, warning75ThresholdPct: 75, warning90ThresholdPct: 90, businessHoursOnly: false };
      case 'HIGH':
        return { responseHours: 0.5, resolutionHours: 4.0, warning75ThresholdPct: 75, warning90ThresholdPct: 90, businessHoursOnly: true };
      case 'NORMAL':
        return { responseHours: 2.0, resolutionHours: 8.0, warning75ThresholdPct: 75, warning90ThresholdPct: 90, businessHoursOnly: true };
      default:
        return { responseHours: 4.0, resolutionHours: 24.0, warning75ThresholdPct: 75, warning90ThresholdPct: 90, businessHoursOnly: true };
    }
  }

  /**
   * Calculate Due Dates based on SLA Policy & Priority
   */
  public static calculateDueDates(createdAt: Date, responseHours: number, resolutionHours: number) {
    const responseDueAt = new Date(createdAt.getTime() + responseHours * 3600 * 1000);
    const resolveDueAt = new Date(createdAt.getTime() + resolutionHours * 3600 * 1000);
    return { responseDueAt, resolveDueAt };
  }

  /**
   * Generate Next Document Code for Tickets (e.g. IT-TKT-2026-0042)
   */
  public static async generateTicketCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `IT-TKT-${year}-`;
    const lastTickets = await db.select({ code: schema.tickets.ticketCode })
      .from(schema.tickets)
      .where(sql`ticket_code LIKE ${prefix + '%'}`)
      .orderBy(desc(schema.tickets.id))
      .limit(1);

    if (lastTickets.length > 0) {
      const parts = lastTickets[0].code.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
      }
    }
    
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.tickets);
    const count = Number(countRes[0]?.count || 0) + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  /**
   * Auto-assign available agent excluding employees on active leave
   */
  public static async autoAssignAgent(department?: string): Promise<{ agentId: number; agentName: string } | null> {
    try {
      // 1. Get employees on active leave today
      const todayStr = new Date().toISOString().split('T')[0];
      const leaves = await db.select({ employeeId: schema.leaveRequests.employeeId })
        .from(schema.leaveRequests)
        .where(and(
          eq(schema.leaveRequests.status, 'APPROVED'),
          sql`date(${schema.leaveRequests.startDate}) <= date(${todayStr}) AND date(${schema.leaveRequests.endDate}) >= date(${todayStr})`
        ));
      
      const onLeaveEmpIds = leaves.map(l => l.employeeId).filter(Boolean);

      // 2. Query available IT/Support users or employees
      const itUsers = await db.select({
        id: schema.users.id,
        username: schema.users.username,
        name: schema.users.username
      }).from(schema.users)
        .where(eq(schema.users.status, 'ACTIVE'));

      if (itUsers.length === 0) return null;

      // Filter out those on leave if mapping exists
      const available = itUsers.filter(u => !onLeaveEmpIds.includes(u.id));
      const pool = available.length > 0 ? available : itUsers;

      // Find agent with lowest open ticket backlog
      const openCounts = await db.select({
        agentId: schema.tickets.assignedAgentId,
        count: sql<number>`count(*)`
      }).from(schema.tickets)
        .where(notInArray(schema.tickets.status, ['RESOLVED', 'CLOSED', 'CANCELLED']))
        .groupBy(schema.tickets.assignedAgentId);

      const countMap = new Map<number, number>();
      openCounts.forEach(r => {
        if (r.agentId) countMap.set(r.agentId, Number(r.count || 0));
      });

      pool.sort((a, b) => (countMap.get(a.id) || 0) - (countMap.get(b.id) || 0));
      const selected = pool[0];

      return {
        agentId: selected.id,
        agentName: selected.name || selected.username
      };
    } catch (err) {
      console.warn('[ServiceDeskService] Auto-assign fallback:', err);
      return null;
    }
  }

  /**
   * F01: Create Ticket (Idempotent, Sequenced, SLA-initialized)
   */
  public static async createTicket(input: CreateTicketInput, currentUser?: any) {
    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = await db.select().from(schema.tickets)
        .where(eq(schema.tickets.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (existing.length > 0) {
        return { ticket: existing[0], isDuplicate: true };
      }
    }

    // 2. Calculate priority if not explicitly given
    const impact = input.impact || 'LOW';
    const urgency = input.urgency || 'LOW';
    const priority = input.priority || this.calculatePriority(impact, urgency);
    const type = input.type || 'INCIDENT';

    // 3. SLA Policy & Due Dates
    const slaPolicy = await this.getSlaPolicy(priority);
    const now = new Date();
    const { responseDueAt, resolveDueAt } = this.calculateDueDates(now, slaPolicy.responseHours, slaPolicy.resolutionHours);

    // 4. Sequence Code
    const ticketCode = await this.generateTicketCode();

    // 5. Auto Assignee if not specified
    let assignedAgentId = input.assignedAgentId;
    let assignedAgentName = input.assignedAgentName;
    let initialStatus = 'OPEN';

    if (!assignedAgentId) {
      const autoAgent = await this.autoAssignAgent(input.requesterDepartment);
      if (autoAgent) {
        assignedAgentId = autoAgent.agentId;
        assignedAgentName = autoAgent.agentName;
        initialStatus = 'ASSIGNED';
      }
    } else {
      initialStatus = 'ASSIGNED';
    }

    // 6. DB Insert
    const inserted = await db.insert(schema.tickets).values({
      ticketCode,
      subject: input.subject,
      description: input.description,
      type,
      impact,
      urgency,
      priority,
      category: input.category || 'TECHNICAL_SUPPORT',
      requesterId: input.requesterId || currentUser?.id,
      requesterName: input.requesterName || currentUser?.username || 'Employee',
      requesterEmail: input.requesterEmail,
      requesterDepartment: input.requesterDepartment,
      assignedAgentId,
      assignedAgentName,
      slaHours: Math.ceil(slaPolicy.resolutionHours),
      slaPolicyId: (slaPolicy as any).id || null,
      responseDueAt,
      resolveDueAt,
      status: initialStatus,
      assetId: input.assetId,
      assetCode: input.assetCode,
      assetName: input.assetName,
      serialId: input.serialId,
      serialNumber: input.serialNumber,
      dmsAttachmentIds: input.dmsAttachmentIds ? JSON.stringify(input.dmsAttachmentIds) : null,
      idempotencyKey: input.idempotencyKey,
      sourceModule: input.sourceModule,
      sourceId: input.sourceId,
      parentTicketId: input.parentTicketId,
      createdAt: now,
      updatedAt: now,
    }).returning();

    const ticket = inserted[0];

    // 7. Status History
    await db.insert(schema.ticketStatusHistory).values({
      ticketId: ticket.id,
      previousStatus: null,
      newStatus: initialStatus,
      changedById: currentUser?.id || 1,
      changedByName: currentUser?.username || 'SYSTEM',
      changeReason: 'Phiếu được khởi tạo',
      notes: `Ưu tiên ${priority}, SLA Giải quyết: ${slaPolicy.resolutionHours}h`,
      createdAt: now,
    });

    // 8. Audit Log M02
    await AuditService.recordAuditLog({
      module: 'M38',
      action: 'CREATE_TICKET',
      entityType: 'TICKET',
      entityId: ticket.id,
      userId: currentUser?.id || 1,
      username: currentUser?.username || 'SYSTEM',
      afterData: ticket,
      result: 'SUCCESS',
      metadata: { ticketCode: ticket.ticketCode, priority, type }
    });

    // 9. Outbox Event M05
    eventBus.emit('servicedesk.ticket.created.v1', {
      ticketId: ticket.id,
      code: ticket.ticketCode,
      type: ticket.type,
      priority: ticket.priority,
      status: ticket.status,
      assigneeId: ticket.assignedAgentId,
      timestamp: now.toISOString()
    });

    return { ticket, isDuplicate: false };
  }

  /**
   * F02 & F06: SLA Evaluation Engine with virtual time parameter `asOf`
   */
  public static async evaluateSlaStatus(asOfTime?: Date) {
    const checkTime = asOfTime || new Date();
    const activeTickets = await db.select().from(schema.tickets)
      .where(notInArray(schema.tickets.status, ['RESOLVED', 'CLOSED', 'CANCELLED']));

    const results = [];

    for (const t of activeTickets) {
      if (!t.resolveDueAt || !t.createdAt) continue;

      const createdTime = new Date(t.createdAt).getTime();
      const dueTime = new Date(t.resolveDueAt).getTime();
      const totalDuration = dueTime - createdTime;
      const elapsedTime = checkTime.getTime() - createdTime - ((t.slaPausedSeconds || 0) * 1000);
      const percentUsed = Math.max(0, (elapsedTime / totalDuration) * 100);
      const isBreached = checkTime.getTime() > dueTime;

      let slaStatus: 'NORMAL' | 'WARNING_75' | 'WARNING_90' | 'BREACHED' = 'NORMAL';
      if (isBreached) {
        slaStatus = 'BREACHED';
      } else if (percentUsed >= 90) {
        slaStatus = 'WARNING_90';
      } else if (percentUsed >= 75) {
        slaStatus = 'WARNING_75';
      }

      // If this is real-time evaluation (not dry-run / virtual simulation), update triggers in DB
      if (!asOfTime) {
        let needsUpdate = false;
        const updates: any = {};

        if (isBreached && !t.isSlaBreached) {
          updates.isSlaBreached = true;
          updates.escalationLevel = (t.escalationLevel || 0) + 1;
          needsUpdate = true;

          // Outbox event M05
          eventBus.emit('servicedesk.ticket.sla_breached.v1', {
            ticketId: t.id,
            code: t.ticketCode,
            priority: t.priority,
            escalationLevel: updates.escalationLevel,
            timestamp: checkTime.toISOString()
          });
        }

        if (percentUsed >= 75 && !t.warning75Sent) {
          updates.warning75Sent = true;
          needsUpdate = true;
        }

        if (percentUsed >= 90 && !t.warning90Sent) {
          updates.warning90Sent = true;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await db.update(schema.tickets)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.tickets.id, t.id));
        }
      }

      results.push({
        ticketId: t.id,
        ticketCode: t.ticketCode,
        subject: t.subject,
        priority: t.priority,
        status: t.status,
        assigneeName: t.assignedAgentName,
        createdAt: t.createdAt,
        resolveDueAt: t.resolveDueAt,
        percentUsed: Number(percentUsed.toFixed(1)),
        isBreached,
        slaStatus,
        remainingHours: Number(Math.max(0, (dueTime - checkTime.getTime()) / (3600 * 1000)).toFixed(2))
      });
    }

    return {
      asOf: checkTime.toISOString(),
      totalActive: activeTickets.length,
      breachedCount: results.filter(r => r.isBreached).length,
      warningCount: results.filter(r => r.slaStatus === 'WARNING_75' || r.slaStatus === 'WARNING_90').length,
      tickets: results
    };
  }

  /**
   * F03: Resolve Ticket (Mandatory Root Cause & Resolution Note)
   */
  public static async resolveTicket(input: ResolveTicketInput, currentUser?: any) {
    const existing = await db.select().from(schema.tickets).where(eq(schema.tickets.id, input.ticketId)).limit(1);
    if (existing.length === 0) throw new Error('Không tìm thấy phiếu yêu cầu');

    const ticket = existing[0];
    if (ticket.status === 'CLOSED' || ticket.status === 'CANCELLED') {
      throw new Error(`Phiếu đang ở trạng thái ${ticket.status} (Read-Only), không thể thay đổi.`);
    }

    if (!input.rootCause || !input.rootCause.trim()) {
      throw new Error('Bắt buộc cung cấp nguyên nhân gốc rễ (Root Cause) theo chuẩn ITIL');
    }
    if (!input.resolutionNote || !input.resolutionNote.trim()) {
      throw new Error('Bắt buộc cung cấp ghi chú giải pháp kỹ thuật (Resolution Notes)');
    }

    const now = new Date();
    const createdTime = new Date(ticket.createdAt || now).getTime();
    const resolutionHours = Number(((now.getTime() - createdTime) / (3600 * 1000)).toFixed(2));

    await db.update(schema.tickets).set({
      status: 'RESOLVED',
      rootCause: input.rootCause,
      resolutionNote: input.resolutionNote,
      resolvedAt: now,
      resolutionTimeHours: resolutionHours,
      updatedAt: now,
    }).where(eq(schema.tickets.id, ticket.id));

    // Append Status History
    await db.insert(schema.ticketStatusHistory).values({
      ticketId: ticket.id,
      previousStatus: ticket.status,
      newStatus: 'RESOLVED',
      changedById: currentUser?.id || input.resolvedById || 1,
      changedByName: currentUser?.username || input.resolvedByName || 'IT Engineer',
      changeReason: 'Kỹ thuật viên hoàn tất xử lý sự cố',
      notes: input.resolutionNote,
      createdAt: now,
    });

    // Audit Log M02
    await AuditService.recordAuditLog({
      module: 'M38',
      action: 'RESOLVE_TICKET',
      entityType: 'TICKET',
      entityId: ticket.id,
      userId: currentUser?.id || 1,
      username: currentUser?.username || 'IT Engineer',
      beforeData: { status: ticket.status },
      afterData: { status: 'RESOLVED', rootCause: input.rootCause, resolutionNote: input.resolutionNote },
      result: 'SUCCESS',
      metadata: { ticketCode: ticket.ticketCode, resolutionHours }
    });

    // Outbox Event M05
    eventBus.emit('servicedesk.ticket.resolved.v1', {
      ticketId: ticket.id,
      code: ticket.ticketCode,
      status: 'RESOLVED',
      resolvedAt: now.toISOString()
    });

    return { success: true, ticketId: ticket.id, status: 'RESOLVED' };
  }

  /**
   * F04: Close Ticket (Read-only lock & optional CSAT survey)
   */
  public static async closeTicket(input: CloseTicketInput, currentUser?: any) {
    const existing = await db.select().from(schema.tickets).where(eq(schema.tickets.id, input.ticketId)).limit(1);
    if (existing.length === 0) throw new Error('Không tìm thấy phiếu yêu cầu');

    const ticket = existing[0];
    if (ticket.status === 'CLOSED') {
      return { success: true, ticketId: ticket.id, message: 'Phiếu đã đóng trước đó' };
    }

    const now = new Date();
    await db.update(schema.tickets).set({
      status: 'CLOSED',
      closedAt: now,
      feedbackScore: input.feedbackScore || ticket.feedbackScore,
      feedbackComment: input.feedbackComment || ticket.feedbackComment,
      updatedAt: now,
    }).where(eq(schema.tickets.id, ticket.id));

    // Survey Recording if score provided
    if (input.feedbackScore) {
      try {
        await db.insert(schema.ticketSurveys).values({
          ticketId: ticket.id,
          rating: input.feedbackScore,
          feedback: input.feedbackComment || '',
          submittedById: currentUser?.id || input.closedById || 1,
          submittedByName: currentUser?.username || input.closedByName || 'Requester',
          submittedAt: now,
        });
      } catch (surveyErr) {
        // Survey might already exist, ignore unique constraint
      }
    }

    // Append Status History
    await db.insert(schema.ticketStatusHistory).values({
      ticketId: ticket.id,
      previousStatus: ticket.status,
      newStatus: 'CLOSED',
      changedById: currentUser?.id || input.closedById || 1,
      changedByName: currentUser?.username || input.closedByName || 'Requester',
      changeReason: 'Người yêu cầu xác nhận nghiệm thu và đóng phiếu',
      notes: input.feedbackComment || 'Khách hàng hài lòng, nghiệm thu đóng phiếu.',
      createdAt: now,
    });

    // Audit Log M02
    await AuditService.recordAuditLog({
      module: 'M38',
      action: 'CLOSE_TICKET',
      entityType: 'TICKET',
      entityId: ticket.id,
      userId: currentUser?.id || 1,
      username: currentUser?.username || 'Requester',
      beforeData: { status: ticket.status },
      afterData: { status: 'CLOSED', feedbackScore: input.feedbackScore },
      result: 'SUCCESS',
      metadata: { ticketCode: ticket.ticketCode }
    });

    // Outbox Event M05
    eventBus.emit('servicedesk.ticket.closed.v1', {
      ticketId: ticket.id,
      code: ticket.ticketCode,
      status: 'CLOSED',
      closedAt: now.toISOString()
    });

    return { success: true, ticketId: ticket.id, status: 'CLOSED' };
  }

  /**
   * F09: Access Request Workflow (Strict SoD, M28 Approval, M04 Delegation/Execution)
   */
  public static async createAccessRequest(input: CreateAccessRequestInput, currentUser?: any) {
    const isHighRisk = input.isHighRisk ?? this.isHighRiskPermission(input.requestedPermissionOrRole);
    const now = new Date();
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.ticketAccessRequests);
    const requestCode = `AR-${now.getFullYear()}-${String(Number(countRes[0]?.count || 0) + 1).padStart(4, '0')}`;

    const durationDays = input.durationDays || 30;
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 3600 * 1000);

    const inserted = await db.insert(schema.ticketAccessRequests).values({
      ticketId: input.ticketId,
      requestCode,
      requesterId: input.requesterId,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      targetUserId: input.targetUserId,
      targetUserName: input.targetUserName,
      targetUserEmail: input.targetUserEmail,
      targetUserRole: input.targetUserRole,
      requestedPermissionOrRole: input.requestedPermissionOrRole,
      isHighRisk,
      reason: input.reason,
      durationDays,
      expiresAt,
      status: 'PENDING_MANAGER_APPROVAL',
      createdAt: now,
      updatedAt: now,
    }).returning();

    const request = inserted[0];

    // Audit Log M02
    await AuditService.recordAuditLog({
      module: 'M38',
      action: 'CREATE_ACCESS_REQUEST',
      entityType: 'ACCESS_REQUEST',
      entityId: request.id,
      userId: currentUser?.id || input.requesterId,
      username: currentUser?.username || input.requesterName,
      afterData: request,
      result: 'SUCCESS',
      metadata: { requestCode, isHighRisk, requestedPermission: input.requestedPermissionOrRole }
    });

    return request;
  }

  /**
   * F09 Manager Approval (Enforces SoD: Requester != Approver)
   */
  public static async approveAccessRequestByManager(requestId: number, approver: { id: number; name: string; notes?: string }) {
    const reqList = await db.select().from(schema.ticketAccessRequests).where(eq(schema.ticketAccessRequests.id, requestId)).limit(1);
    if (reqList.length === 0) throw new Error('Không tìm thấy yêu cầu cấp quyền');

    const req = reqList[0];
    if (req.requesterId === approver.id) {
      throw new Error('Vi phạm Phân tách Nhiệm vụ (SoD): Người yêu cầu không được tự phê duyệt yêu cầu của chính mình.');
    }

    const nextStatus = req.isHighRisk ? 'PENDING_SECURITY_APPROVAL' : 'APPROVED_PENDING_FULFILLMENT';
    const now = new Date();

    await db.update(schema.ticketAccessRequests).set({
      status: nextStatus,
      managerApproverId: approver.id,
      managerApproverName: approver.name,
      managerApprovedAt: now,
      managerNotes: approver.notes,
      updatedAt: now,
    }).where(eq(schema.ticketAccessRequests.id, requestId));

    await AuditService.recordAuditLog({
      module: 'M38',
      action: 'APPROVE_ACCESS_REQUEST_MANAGER',
      entityType: 'ACCESS_REQUEST',
      entityId: requestId,
      userId: approver.id,
      username: approver.name,
      afterData: { status: nextStatus, approverNotes: approver.notes },
      result: 'SUCCESS',
      metadata: { requestCode: req.requestCode }
    });

    return { success: true, status: nextStatus };
  }

  /**
   * F09 Security Admin Approval (for High Risk requests)
   */
  public static async approveAccessRequestBySecurity(requestId: number, approver: { id: number; name: string; notes?: string }) {
    const reqList = await db.select().from(schema.ticketAccessRequests).where(eq(schema.ticketAccessRequests.id, requestId)).limit(1);
    if (reqList.length === 0) throw new Error('Không tìm thấy yêu cầu cấp quyền');

    const req = reqList[0];
    if (req.requesterId === approver.id || req.managerApproverId === approver.id) {
      throw new Error('Vi phạm SoD: Cấp phê duyệt Bảo mật phải độc lập với người yêu cầu và quản lý trực tiếp.');
    }

    const now = new Date();
    await db.update(schema.ticketAccessRequests).set({
      status: 'APPROVED_PENDING_FULFILLMENT',
      securityApproverId: approver.id,
      securityApproverName: approver.name,
      securityApprovedAt: now,
      securityNotes: approver.notes,
      updatedAt: now,
    }).where(eq(schema.ticketAccessRequests.id, requestId));

    await AuditService.recordAuditLog({
      module: 'M38',
      action: 'APPROVE_ACCESS_REQUEST_SECURITY',
      entityType: 'ACCESS_REQUEST',
      entityId: requestId,
      userId: approver.id,
      username: approver.name,
      afterData: { status: 'APPROVED_PENDING_FULFILLMENT' },
      result: 'SUCCESS',
      metadata: { requestCode: req.requestCode }
    });

    return { success: true, status: 'APPROVED_PENDING_FULFILLMENT' };
  }

  /**
   * F09 Fulfill Access Request (Execute through M04 official mechanism, SoD check)
   */
  public static async fulfillAccessRequest(requestId: number, fulfiller: { id: number; name: string; notes?: string }) {
    const reqList = await db.select().from(schema.ticketAccessRequests).where(eq(schema.ticketAccessRequests.id, requestId)).limit(1);
    if (reqList.length === 0) throw new Error('Không tìm thấy yêu cầu cấp quyền');

    const req = reqList[0];
    if (req.status !== 'APPROVED_PENDING_FULFILLMENT') {
      throw new Error(`Yêu cầu chưa được duyệt đầy đủ. Trạng thái hiện tại: ${req.status}`);
    }

    if (req.requesterId === fulfiller.id) {
      throw new Error('Vi phạm SoD: Người yêu cầu không được tự thực thi cấp quyền cho chính mình.');
    }

    const now = new Date();

    // M38 calls M04 delegation or permissions registration safely
    try {
      const permRecord = await db.select().from(schema.permissions)
        .where(eq(schema.permissions.code, req.requestedPermissionOrRole))
        .limit(1);

      if (permRecord.length > 0) {
        await db.insert(schema.userPermissions).values({
          userId: req.targetUserId,
          permissionId: permRecord[0].id,
          isGranted: true,
        }).onConflictDoUpdate({
          target: [schema.userPermissions.userId, schema.userPermissions.permissionId],
          set: { isGranted: true }
        });
      }
    } catch (e) {
      // Non-fatal if permission code does not exist in standard catalog
    }

    await db.update(schema.ticketAccessRequests).set({
      status: 'FULFILLED',
      fulfilledById: fulfiller.id,
      fulfilledByName: fulfiller.name,
      fulfilledAt: now,
      fulfillmentNotes: fulfiller.notes,
      updatedAt: now,
    }).where(eq(schema.ticketAccessRequests.id, requestId));

    await AuditService.recordAuditLog({
      module: 'M38',
      action: 'FULFILL_ACCESS_REQUEST',
      entityType: 'ACCESS_REQUEST',
      entityId: requestId,
      userId: fulfiller.id,
      username: fulfiller.name,
      afterData: { status: 'FULFILLED', grantedTo: req.targetUserName, permission: req.requestedPermissionOrRole },
      result: 'SUCCESS',
      metadata: { requestCode: req.requestCode }
    });

    return { success: true, status: 'FULFILLED' };
  }

  /**
   * F19: KPI & Performance Analytics Engine
   */
  public static async getKpiMetrics() {
    const allTickets = await db.select().from(schema.tickets);
    const resolved = allTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const closed = allTickets.filter(t => t.status === 'CLOSED');
    const breached = allTickets.filter(t => t.isSlaBreached);

    const totalResolved = resolved.length;
    let totalResolutionHours = 0;
    resolved.forEach(t => {
      if (t.resolutionTimeHours) totalResolutionHours += t.resolutionTimeHours;
    });

    const avgResolutionHours = totalResolved > 0 ? Number((totalResolutionHours / totalResolved).toFixed(2)) : 0;
    const slaOnTimeRate = allTickets.length > 0 ? Number((((allTickets.length - breached.length) / allTickets.length) * 100).toFixed(1)) : 100;

    // CSAT Score Calculation
    const surveys = await db.select().from(schema.ticketSurveys);
    let totalStars = 0;
    surveys.forEach(s => totalStars += s.rating);
    const avgCsat = surveys.length > 0 ? Number((totalStars / surveys.length).toFixed(1)) : 4.8;

    // Backlog by Category
    const categoryMap: Record<string, number> = {};
    allTickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').forEach(t => {
      const cat = t.category || 'TECHNICAL_SUPPORT';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    // Priority Distribution
    const priorityMap = {
      URGENT: allTickets.filter(t => t.priority === 'URGENT').length,
      HIGH: allTickets.filter(t => t.priority === 'HIGH').length,
      NORMAL: allTickets.filter(t => t.priority === 'NORMAL').length,
      LOW: allTickets.filter(t => t.priority === 'LOW').length,
    };

    return {
      totalTickets: allTickets.length,
      openTickets: allTickets.filter(t => t.status === 'OPEN' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length,
      resolvedTickets: totalResolved,
      closedTickets: closed.length,
      slaBreachedCount: breached.length,
      slaOnTimeRate,
      avgResolutionHours,
      avgCsat,
      totalSurveys: surveys.length,
      categoryBacklog: categoryMap,
      priorityDistribution: priorityMap
    };
  }
}
