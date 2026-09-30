import { Router, Request, Response } from 'express';
import { db, client } from '../../db';
import * as schema from '../../db/schema';
import { eq, desc, and, sql, or, like, inArray } from 'drizzle-orm';
import { ServiceDeskService } from '../../engines/serviceDeskService';
import { AuditService } from '../../engines/auditService';

export const serviceDeskRouter = Router();

// ==========================================
// TICKETS MANAGEMENT
// ==========================================

/**
 * GET /api/service-desk/tickets
 */
serviceDeskRouter.get('/tickets', async (req: Request, res: Response) => {
  try {
    const { status, priority, type, search, assigneeId, requesterId, limit = 100, page = 1 } = req.query;

    let query = db.select().from(schema.tickets);
    const conditions = [];

    if (status && typeof status === 'string' && status !== 'ALL') {
      conditions.push(eq(schema.tickets.status, status));
    }
    if (priority && typeof priority === 'string' && priority !== 'ALL') {
      conditions.push(eq(schema.tickets.priority, priority));
    }
    if (type && typeof type === 'string' && type !== 'ALL') {
      conditions.push(eq(schema.tickets.type, type));
    }
    if (assigneeId && typeof assigneeId === 'string') {
      conditions.push(eq(schema.tickets.assignedAgentId, parseInt(assigneeId, 10)));
    }
    if (requesterId && typeof requesterId === 'string') {
      conditions.push(eq(schema.tickets.requesterId, parseInt(requesterId, 10)));
    }
    if (search && typeof search === 'string') {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(schema.tickets.ticketCode, term),
          like(schema.tickets.subject, term),
          like(schema.tickets.description, term),
          like(schema.tickets.requesterName, term),
          like(schema.tickets.assignedAgentName, term)
        )
      );
    }

    const items = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(schema.tickets.id)).limit(Number(limit))
      : await query.orderBy(desc(schema.tickets.id)).limit(Number(limit));

    res.json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/tickets (F01 Create Ticket with Idempotency)
 */
serviceDeskRouter.post('/tickets', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string || req.body.idempotencyKey;
    const result = await ServiceDeskService.createTicket({
      ...req.body,
      idempotencyKey
    }, (req as any).user);

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      data: result.ticket,
      isDuplicate: result.isDuplicate
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/service-desk/tickets/:id (Full Details with History & Messages)
 */
serviceDeskRouter.get('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const tickets = await db.select().from(schema.tickets).where(eq(schema.tickets.id, ticketId)).limit(1);
    if (tickets.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phiếu' });
    }

    const ticket = tickets[0];
    const messages = await db.select().from(schema.ticketMessages)
      .where(eq(schema.ticketMessages.ticketId, ticketId))
      .orderBy(desc(schema.ticketMessages.createdAt));

    const history = await db.select().from(schema.ticketStatusHistory)
      .where(eq(schema.ticketStatusHistory.ticketId, ticketId))
      .orderBy(desc(schema.ticketStatusHistory.createdAt));

    const survey = await db.select().from(schema.ticketSurveys)
      .where(eq(schema.ticketSurveys.ticketId, ticketId))
      .limit(1);

    res.json({
      success: true,
      data: {
        ...ticket,
        messages,
        history,
        survey: survey[0] || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/tickets/:id/assign
 */
serviceDeskRouter.post('/tickets/:id/assign', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { agentId, agentName } = req.body;
    const user = (req as any).user;

    const existing = await db.select().from(schema.tickets).where(eq(schema.tickets.id, ticketId)).limit(1);
    if (existing.length === 0) return res.status(404).json({ success: false, error: 'Phiếu không tồn tại' });
    const ticket = existing[0];

    if (ticket.status === 'CLOSED' || ticket.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Phiếu đã đóng hoặc huỷ, không thể phân công' });
    }

    const now = new Date();
    await db.update(schema.tickets).set({
      assignedAgentId: agentId,
      assignedAgentName: agentName,
      status: ticket.status === 'OPEN' ? 'ASSIGNED' : ticket.status,
      updatedAt: now
    }).where(eq(schema.tickets.id, ticketId));

    await db.insert(schema.ticketStatusHistory).values({
      ticketId,
      previousStatus: ticket.status,
      newStatus: ticket.status === 'OPEN' ? 'ASSIGNED' : ticket.status,
      changedById: user?.id || 1,
      changedByName: user?.username || 'SYSTEM',
      changeReason: `Phân công kỹ thuật viên: ${agentName}`,
      createdAt: now
    });

    res.json({ success: true, message: `Đã phân công cho ${agentName}` });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/tickets/:id/accept (Agent accepts ticket -> IN_PROGRESS)
 */
serviceDeskRouter.post('/tickets/:id/accept', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const user = (req as any).user;

    const existing = await db.select().from(schema.tickets).where(eq(schema.tickets.id, ticketId)).limit(1);
    if (existing.length === 0) return res.status(404).json({ success: false, error: 'Phiếu không tồn tại' });
    const ticket = existing[0];

    const now = new Date();
    const firstResponseAt = ticket.firstResponseAt || now;
    const firstResponseTimeMinutes = ticket.firstResponseTimeMinutes || Math.round((now.getTime() - new Date(ticket.createdAt || now).getTime()) / 60000);

    await db.update(schema.tickets).set({
      status: 'IN_PROGRESS',
      firstResponseAt,
      firstResponseTimeMinutes,
      updatedAt: now
    }).where(eq(schema.tickets.id, ticketId));

    await db.insert(schema.ticketStatusHistory).values({
      ticketId,
      previousStatus: ticket.status,
      newStatus: 'IN_PROGRESS',
      changedById: user?.id || 1,
      changedByName: user?.username || 'IT Technician',
      changeReason: 'Kỹ thuật viên tiếp nhận và bắt đầu xử lý',
      createdAt: now
    });

    res.json({ success: true, status: 'IN_PROGRESS' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/tickets/:id/pause (SLA Pause)
 */
serviceDeskRouter.post('/tickets/:id/pause', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { reason = 'Chờ thông tin từ người dùng' } = req.body;
    const user = (req as any).user;

    const existing = await db.select().from(schema.tickets).where(eq(schema.tickets.id, ticketId)).limit(1);
    if (existing.length === 0) return res.status(404).json({ success: false, error: 'Phiếu không tồn tại' });
    const ticket = existing[0];

    const now = new Date();
    await db.update(schema.tickets).set({
      status: 'PENDING',
      slaPausedAt: now,
      updatedAt: now
    }).where(eq(schema.tickets.id, ticketId));

    await db.insert(schema.ticketStatusHistory).values({
      ticketId,
      previousStatus: ticket.status,
      newStatus: 'PENDING',
      changedById: user?.id || 1,
      changedByName: user?.username || 'IT Technician',
      changeReason: `Tạm dừng đồng hồ SLA: ${reason}`,
      createdAt: now
    });

    res.json({ success: true, status: 'PENDING', message: 'Đã tạm dừng tính SLA' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/tickets/:id/resume (Resume SLA)
 */
serviceDeskRouter.post('/tickets/:id/resume', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const user = (req as any).user;

    const existing = await db.select().from(schema.tickets).where(eq(schema.tickets.id, ticketId)).limit(1);
    if (existing.length === 0) return res.status(404).json({ success: false, error: 'Phiếu không tồn tại' });
    const ticket = existing[0];

    const now = new Date();
    let additionalSeconds = 0;
    if (ticket.slaPausedAt) {
      additionalSeconds = Math.round((now.getTime() - new Date(ticket.slaPausedAt).getTime()) / 1000);
    }

    await db.update(schema.tickets).set({
      status: 'IN_PROGRESS',
      slaPausedAt: null,
      slaPausedSeconds: (ticket.slaPausedSeconds || 0) + additionalSeconds,
      updatedAt: now
    }).where(eq(schema.tickets.id, ticketId));

    await db.insert(schema.ticketStatusHistory).values({
      ticketId,
      previousStatus: ticket.status,
      newStatus: 'IN_PROGRESS',
      changedById: user?.id || 1,
      changedByName: user?.username || 'IT Technician',
      changeReason: 'Tiếp tục xử lý, khôi phục đếm SLA',
      createdAt: now
    });

    res.json({ success: true, status: 'IN_PROGRESS', message: 'Đã tiếp tục xử lý' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/tickets/:id/resolve (F03 Resolve with mandatory rootCause)
 */
serviceDeskRouter.post('/tickets/:id/resolve', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { rootCause, resolutionNote } = req.body;
    const user = (req as any).user;

    const result = await ServiceDeskService.resolveTicket({
      ticketId,
      rootCause,
      resolutionNote,
      resolvedById: user?.id,
      resolvedByName: user?.username
    }, user);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/tickets/:id/close (F04 Confirm & Close Ticket)
 */
serviceDeskRouter.post('/tickets/:id/close', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { feedbackScore, feedbackComment } = req.body;
    const user = (req as any).user;

    const result = await ServiceDeskService.closeTicket({
      ticketId,
      feedbackScore,
      feedbackComment,
      closedById: user?.id,
      closedByName: user?.username
    }, user);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/tickets/:id/comment (Add message)
 */
serviceDeskRouter.post('/tickets/:id/comment', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { message, senderName, senderType = 'AGENT' } = req.body;
    const user = (req as any).user;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Nội dung tin nhắn không được để trống' });
    }

    const inserted = await db.insert(schema.ticketMessages).values({
      ticketId,
      senderName: senderName || user?.username || 'Support Agent',
      senderType,
      message,
      createdAt: new Date()
    }).returning();

    res.json({ success: true, data: inserted[0] });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/tickets/:id/create-work-order (F11 Create M27 EAM Work Order)
 */
serviceDeskRouter.post('/tickets/:id/create-work-order', async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { assetId, description, priority = 'HIGH' } = req.body;
    const user = (req as any).user;

    const tickets = await db.select().from(schema.tickets).where(eq(schema.tickets.id, ticketId)).limit(1);
    if (tickets.length === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy phiếu' });
    const ticket = tickets[0];

    const now = new Date();
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.maintenanceWorkOrders);
    const woCode = `WO-${now.getFullYear()}-${String(Number(countRes[0]?.count || 0) + 1).padStart(4, '0')}`;

    const insertedWO = await db.insert(schema.maintenanceWorkOrders).values({
      workOrderCode: woCode,
      assetId: assetId || ticket.assetId || 1,
      title: `[M38] ${ticket.subject}`,
      description: description || ticket.description || 'Lệnh bảo trì khắc phục sự cố phần cứng',
      workOrderType: 'CORRECTIVE',
      priority,
      status: 'OPEN',
      sourceModule: 'M38',
      sourceReferenceId: ticket.id,
      sourceReferenceCode: ticket.ticketCode,
      estimatedHours: 2,
      createdAt: now,
      updatedAt: now
    }).returning();

    const wo = insertedWO[0];

    // Link back to ticket
    await db.update(schema.tickets).set({
      workOrderId: wo.id,
      workOrderCode: wo.workOrderCode,
      updatedAt: now
    }).where(eq(schema.tickets.id, ticketId));

    res.json({ success: true, data: wo, message: `Đã phát hành Lệnh bảo trì ${wo.workOrderCode} sang M27 EAM` });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// SLA ENGINE & POLICIES
// ==========================================

/**
 * GET /api/service-desk/sla (F02 Real-time or Virtual SLA status with ?asOf=)
 */
serviceDeskRouter.get('/sla', async (req: Request, res: Response) => {
  try {
    const asOfStr = req.query.asOf as string;
    const asOfDate = asOfStr ? new Date(asOfStr) : undefined;
    const result = await ServiceDeskService.evaluateSlaStatus(asOfDate);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/service-desk/sla-policies (F06 Policies)
 */
serviceDeskRouter.get('/sla-policies', async (req: Request, res: Response) => {
  try {
    const policies = await db.select().from(schema.slaPolicies).orderBy(asc(schema.slaPolicies.id));
    res.json({ success: true, data: policies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/service-desk/sla-policies/:id (Update SLA policy)
 */
serviceDeskRouter.put('/sla-policies/:id', async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params.id, 10);
    const { responseHours, resolutionHours, warning75ThresholdPct, warning90ThresholdPct, businessHoursOnly, description } = req.body;
    const now = new Date();

    await db.update(schema.slaPolicies).set({
      responseHours,
      resolutionHours,
      warning75ThresholdPct,
      warning90ThresholdPct,
      businessHoursOnly,
      description,
      updatedAt: now
    }).where(eq(schema.slaPolicies.id, policyId));

    res.json({ success: true, message: 'Đã cập nhật chính sách SLA' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// ACCESS REQUESTS (F09)
// ==========================================

/**
 * GET /api/service-desk/access-requests
 */
serviceDeskRouter.get('/access-requests', async (req: Request, res: Response) => {
  try {
    const { status, targetUserId } = req.query;
    let query = db.select().from(schema.ticketAccessRequests);
    const conditions = [];

    if (status && typeof status === 'string' && status !== 'ALL') {
      conditions.push(eq(schema.ticketAccessRequests.status, status));
    }
    if (targetUserId && typeof targetUserId === 'string') {
      conditions.push(eq(schema.ticketAccessRequests.targetUserId, parseInt(targetUserId, 10)));
    }

    const items = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(schema.ticketAccessRequests.id))
      : await query.orderBy(desc(schema.ticketAccessRequests.id));

    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/access-requests (F09 Create Access Request)
 */
serviceDeskRouter.post('/access-requests', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const request = await ServiceDeskService.createAccessRequest({
      ...req.body,
      idempotencyKey
    }, user);

    res.status(201).json({ success: true, data: request });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/access-requests/:id/approve-manager
 */
serviceDeskRouter.post('/access-requests/:id/approve-manager', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const user = (req as any).user;
    const { notes } = req.body;

    const result = await ServiceDeskService.approveAccessRequestByManager(requestId, {
      id: user?.id || 2,
      name: user?.username || 'Line Manager',
      notes
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/access-requests/:id/approve-security
 */
serviceDeskRouter.post('/access-requests/:id/approve-security', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const user = (req as any).user;
    const { notes } = req.body;

    const result = await ServiceDeskService.approveAccessRequestBySecurity(requestId, {
      id: user?.id || 1,
      name: user?.username || 'Security Officer',
      notes
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/service-desk/access-requests/:id/fulfill
 */
serviceDeskRouter.post('/access-requests/:id/fulfill', async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const user = (req as any).user;
    const { notes } = req.body;

    const result = await ServiceDeskService.fulfillAccessRequest(requestId, {
      id: user?.id || 1,
      name: user?.username || 'Super Admin',
      notes
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// KPI & PERFORMANCE ANALYTICS (F19)
// ==========================================

/**
 * GET /api/service-desk/kpi
 */
serviceDeskRouter.get('/kpi', async (req: Request, res: Response) => {
  try {
    const kpi = await ServiceDeskService.getKpiMetrics();
    res.json({ success: true, data: kpi });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
