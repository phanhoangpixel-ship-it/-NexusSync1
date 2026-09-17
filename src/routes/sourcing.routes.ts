import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { 
  sourcingPackages, srmRfqs, srmRfqItems, srmRfqSuppliers, srmBids, srmBidItems, 
  srmAuctionRounds,
  sourcingEvaluations, sourcingEvaluationScores, sourcingAwards, sourcingAwardLines,
  purchaseOrders, purchaseOrderItems, products,
  suppliers, outboxEvents, dmsDocuments 
} from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requireRole } from '../middleware/auth.middleware';
import { requireEligibleSupplier, verifySupplierEligibility } from '../services/supplierEligibility.service';
import { generateSourcingDocumentCode } from '../services/sourcingCodeGenerator.service';
import { bpaContracts, BPAContract } from './purchases.routes';
import { OrgBudgetService, WorkflowMatrixEngine } from '../data/orgMasterData';
import { AuditService } from '../../engines/auditService';

const router = Router();

// ==========================================
// SOURCING PACKAGES (GÓI THẦU MUA SẮM)
// ==========================================

// GET /api/sourcing/packages
router.get('/api/sourcing/packages', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  try {
    const packages = await db.select().from(sourcingPackages).orderBy(desc(sourcingPackages.createdAt));
    const allRfqs = await db.select().from(srmRfqs);
    
    const enriched = packages.map(pkg => {
      const linkedRfqs = allRfqs.filter(r => r.packageId === pkg.id);
      return {
        ...pkg,
        rfqCount: linkedRfqs.length,
        rfqs: linkedRfqs.map(r => ({ id: r.id, code: r.code, title: r.title, status: r.status, deadline: r.deadline }))
      };
    });

    res.json(enriched);
  } catch (err: any) {
    console.error('Error fetching sourcing packages:', err);
    res.status(500).json({ error: 'Failed to fetch sourcing packages', detail: err.message });
  }
});

// GET /api/sourcing/packages/:id
router.get('/api/sourcing/packages/:id', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  try {
    const idOrCode = req.params.id;
    const isNum = !isNaN(Number(idOrCode));
    
    const pkg = isNum 
      ? await db.select().from(sourcingPackages).where(eq(sourcingPackages.id, Number(idOrCode))).limit(1)
      : await db.select().from(sourcingPackages).where(eq(sourcingPackages.packageCode, idOrCode)).limit(1);

    if (pkg.length === 0) {
      return res.status(404).json({ error: 'Sourcing package not found' });
    }

    const currentPkg = pkg[0];
    const linkedRfqs = await db.select().from(srmRfqs).where(eq(srmRfqs.packageId, currentPkg.id));
    
    res.json({
      ...currentPkg,
      rfqCount: linkedRfqs.length,
      rfqs: linkedRfqs
    });
  } catch (err: any) {
    console.error('Error fetching package details:', err);
    res.status(500).json({ error: 'Failed to fetch package details', detail: err.message });
  }
});

// POST /api/sourcing/packages
router.post('/api/sourcing/packages', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { title, category, estimatedBudget, costCenter, submissionDeadline, description, idempotencyKey } = req.body;
  const user = (req as any).user;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'MISSING_TITLE', message: 'Tên gói thầu mua sắm là bắt buộc.' });
  }

  // Bắt buộc kiểm tra idempotencyKey để chống tạo trùng lặp khi mạng chập chờn
  if (!idempotencyKey || typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    return res.status(400).json({ 
      success: false, 
      error: 'MISSING_IDEMPOTENCY_KEY', 
      message: 'Bắt buộc cung cấp idempotencyKey để chống tạo trùng lặp khi mạng chập chờn.' 
    });
  }

  try {
    // 1. Kiểm tra Idempotency
    const existingEvents = await db.select().from(outboxEvents).where(eq(outboxEvents.eventId, idempotencyKey.trim())).limit(1);
    if (existingEvents.length > 0) {
      const event = existingEvents[0];
      const payload = JSON.parse(event.payload || '{}');
      if (payload.title === title.trim()) {
        return res.status(200).json({ 
          success: true, 
          replayed: true, 
          packageId: Number(event.aggregateId), 
          code: payload.code || payload.packageCode,
          message: 'Gói thầu đã được ghi nhận trước đó (Idempotent Replay).' 
        });
      } else {
        return res.status(409).json({ 
          success: false, 
          error: 'IDEMPOTENCY_CONFLICT', 
          message: 'Trùng lặp idempotencyKey nhưng thông tin gói thầu yêu cầu khác biệt.' 
        });
      }
    }

    // 2. Tự động sinh mã chứng từ chuẩn hóa PKG-YYYY-XXXX
    let packageCode: string = '';
    let createdPkg: any = null;

    await db.transaction(async (tx) => {
      packageCode = await generateSourcingDocumentCode('PKG', tx);

      const inserted = await tx.insert(sourcingPackages).values({
        packageCode,
        title: title.trim(),
        category: category || 'Direct Materials',
        estimatedBudget: Number(estimatedBudget) || 0,
        costCenter: costCenter || 'CC-PROCUREMENT',
        submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : null,
        status: 'DRAFT',
        description: description || null,
        createdBy: user ? user.id : null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any).returning();

      createdPkg = inserted[0];

      // Ghi Outbox Event để đảm bảo Eventual Consistency và Idempotency Guard
      await tx.insert(outboxEvents).values({
        aggregateType: 'SOURCING_PACKAGE',
        aggregateId: String(createdPkg.id),
        eventId: idempotencyKey.trim(),
        source: 'M10_SOURCING',
        eventType: 'SOURCING_PACKAGE_CREATED',
        payload: JSON.stringify({
          id: createdPkg.id,
          code: packageCode,
          packageCode,
          title: createdPkg.title,
          category: createdPkg.category,
          estimatedBudget: createdPkg.estimatedBudget,
          costCenter: createdPkg.costCenter
        }),
        status: 'PENDING',
        correlationId: `CREATE_PKG_${createdPkg.id}`
      } as any);
    });

    // Audit Trail M02
    try {
      await AuditService.recordAuditLog({
        module: 'M10',
        action: 'CREATE_PACKAGE',
        entityType: 'SOURCING_PACKAGE',
        entityId: String(createdPkg?.id),
        userId: user ? user.id : 1,
        username: user?.username || 'purchasing_agent',
        result: 'SUCCESS',
        metadata: {
          code: packageCode,
          title: createdPkg?.title,
          estimatedBudget: createdPkg?.estimatedBudget,
          costCenter: createdPkg?.costCenter
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during package creation:', auditErr);
    }

    res.status(201).json({
      success: true,
      code: packageCode,
      packageId: createdPkg?.id,
      package: createdPkg,
      message: `Khởi tạo gói thầu mua sắm ${packageCode} thành công.`
    });
  } catch (err: any) {
    console.error('Error creating sourcing package:', err);
    res.status(500).json({ success: false, error: 'CREATE_PACKAGE_FAILED', detail: err.message });
  }
});

// ==========================================
// RFQ & MULTI-SUPPLIER SOURCING ENGINE
// ==========================================

// GET /api/sourcing/rfqs
router.get('/api/sourcing/rfqs', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  try {
    const rfqs = await db.select().from(srmRfqs).orderBy(desc(srmRfqs.createdAt));
    const allItems = await db.select().from(srmRfqItems);
    const allBids = await db.select().from(srmBids);
    const allPackages = await db.select().from(sourcingPackages);
    
    // Map to the format the UI expects for backward compatibility while providing full enterprise fields
    const mapped = rfqs.map(r => {
      const items = allItems.filter(i => i.rfqId === r.id);
      const bids = allBids.filter(b => b.rfqId === r.id);
      const pkg = allPackages.find(p => p.id === r.packageId);

      return {
        id: r.code,          // UI uses code as ID string
        dbId: r.id,          // real ID for updates
        code: r.code,
        title: r.title,
        packageId: r.packageId,
        packageCode: pkg ? pkg.packageCode : null,
        category: pkg ? pkg.category : 'Direct Materials',
        deadline: r.deadline ? r.deadline.toISOString().split('T')[0] : 'N/A',
        currentRound: (r as any).currentRound || 1,
        bidsCount: bids.length,
        status: r.status,
        budgetEstimate: pkg ? `${pkg.estimatedBudget.toLocaleString('vi-VN')} ₫` : 'N/A',
        itemsCount: items.length
      };
    });

    res.json(mapped);
  } catch (err: any) {
    console.error('Error fetching rfqs:', err);
    res.status(500).json({ error: 'Failed to fetch RFQs' });
  }
});

// POST /api/sourcing/rfqs
router.post('/api/sourcing/rfqs', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { 
    title, 
    packageId, 
    deadline, 
    targetQuantity, 
    productId, 
    items, 
    invitedSupplierIds, 
    supplierIds,
    idempotencyKey 
  } = req.body;
  const user = (req as any).user;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'MISSING_TITLE', message: 'Tiêu đề yêu cầu báo giá (RFQ) là bắt buộc.' });
  }

  // Bắt buộc kiểm tra idempotencyKey để chống tạo trùng lặp khi mạng chập chờn
  if (!idempotencyKey || typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    return res.status(400).json({ 
      success: false, 
      error: 'MISSING_IDEMPOTENCY_KEY', 
      message: 'Bắt buộc cung cấp idempotencyKey để chống tạo trùng lặp khi mạng chập chờn.' 
    });
  }

  try {
    // 1. Kiểm tra Idempotency
    const existingEvents = await db.select().from(outboxEvents).where(eq(outboxEvents.eventId, idempotencyKey.trim())).limit(1);
    if (existingEvents.length > 0) {
      const event = existingEvents[0];
      const payload = JSON.parse(event.payload || '{}');
      if (payload.title === title.trim()) {
        return res.status(200).json({ 
          success: true, 
          replayed: true, 
          rfqId: Number(event.aggregateId), 
          code: payload.code,
          message: 'Yêu cầu báo giá đã được ghi nhận trước đó (Idempotent Replay).' 
        });
      } else {
        return res.status(409).json({ 
          success: false, 
          error: 'IDEMPOTENCY_CONFLICT', 
          message: 'Trùng lặp idempotencyKey nhưng nội dung RFQ yêu cầu khác biệt.' 
        });
      }
    }

    // 2. Thẩm định điều kiện các nhà cung cấp được mời đồng thời (Multi-Supplier Eligibility Guard)
    const targetSuppliers: number[] = invitedSupplierIds || supplierIds || [];
    if (Array.isArray(targetSuppliers) && targetSuppliers.length > 0) {
      for (const supId of targetSuppliers) {
        const check = await verifySupplierEligibility(Number(supId));
        if (!check.eligible) {
          return res.status(422).json({
            success: false,
            error: 'SUPPLIER_INELIGIBLE',
            code: check.code,
            supplierId: supId,
            supplierName: check.supplier?.name,
            message: `Không thể tạo RFQ mời nhà cung cấp [${check.supplier?.name || supId}]: ${check.message}`
          });
        }
      }
    }

    // 3. Tự động sinh mã chứng từ chuẩn hóa RFQ-YYYY-XXXX
    let rfqCode = '';
    let rfqId: number = 0;

    await db.transaction(async (tx) => {
      rfqCode = await generateSourcingDocumentCode('RFQ', tx);

      const inserted = await tx.insert(srmRfqs).values({
        code: rfqCode,
        packageId: packageId ? Number(packageId) : null,
        title: title.trim(),
        status: 'OPEN_BIDDING',
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user ? user.id : 1
      } as any).returning({ id: srmRfqs.id });

      rfqId = inserted[0].id;

      // Xử lý danh mục vật tư / hàng hóa yêu cầu báo giá (Multi-item support)
      if (Array.isArray(items) && items.length > 0) {
        for (const it of items) {
          if (it.productId && it.targetQuantity) {
            await tx.insert(srmRfqItems).values({
              rfqId,
              productId: Number(it.productId),
              targetQuantity: Number(it.targetQuantity)
            } as any);
          }
        }
      } else if (productId && targetQuantity) {
        await tx.insert(srmRfqItems).values({
          rfqId,
          productId: Number(productId),
          targetQuantity: Number(targetQuantity)
        } as any);
      }

      // Xử lý danh sách nhà cung cấp được mời trực tiếp trong Multi-Supplier RFQ
      if (Array.isArray(targetSuppliers) && targetSuppliers.length > 0) {
        for (const supId of targetSuppliers) {
          await tx.insert(srmRfqSuppliers).values({
            rfqId,
            supplierId: Number(supId),
            invitedAt: new Date()
          } as any);
        }
      }

      // Nếu có gắn với Sourcing Package, chuyển trạng thái Package sang OPEN_BIDDING
      if (packageId) {
        await tx.update(sourcingPackages)
          .set({ status: 'OPEN_BIDDING', updatedAt: new Date() })
          .where(and(eq(sourcingPackages.id, Number(packageId)), eq(sourcingPackages.status, 'DRAFT')));
      }

      // Ghi Outbox Event để đảm bảo Eventual Consistency và Idempotency Guard
      await tx.insert(outboxEvents).values({
        aggregateType: 'RFQ',
        aggregateId: String(rfqId),
        eventId: idempotencyKey.trim(),
        source: 'M10_SOURCING',
        eventType: 'RFQ_CREATED',
        payload: JSON.stringify({ 
          rfqId, 
          code: rfqCode, 
          title: title.trim(), 
          packageId, 
          deadline, 
          targetQuantity, 
          productId, 
          invitedSupplierIds: targetSuppliers 
        }),
        status: 'PENDING',
        correlationId: `CREATE_RFQ_${rfqId}`
      } as any);
    });

    // Audit Trail M02
    try {
      await AuditService.recordAuditLog({
        module: 'M10',
        action: 'CREATE_RFQ',
        entityType: 'SRM_RFQ',
        entityId: String(rfqId),
        userId: user ? user.id : 1,
        username: user?.username || 'purchasing_agent',
        result: 'SUCCESS',
        metadata: {
          rfqCode,
          title: title.trim(),
          packageId,
          invitedSuppliersCount: targetSuppliers.length
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during RFQ creation:', auditErr);
    }

    res.status(201).json({ 
      success: true, 
      code: rfqCode, 
      rfqId,
      message: `Tạo yêu cầu báo giá thầu ${rfqCode} thành công.` 
    });
  } catch (err: any) {
    console.error('Error creating RFQ:', err);
    res.status(500).json({ success: false, error: 'Transaction failed', detail: err.message });
  }
});

// DELETE /api/sourcing/rfqs/:id
router.delete('/api/sourcing/rfqs/:id', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.select().from(srmRfqs).where(eq(srmRfqs.code, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    const rfq = existing[0];
    if (['CANCELLED', 'CLOSED', 'AWARDED'].includes(rfq.status)) {
      return res.status(400).json({ error: 'Cannot cancel an RFQ in this state' });
    }

    await db.transaction(async (tx) => {
      await tx.update(srmRfqs).set({ status: 'CANCELLED' } as any).where(eq(srmRfqs.code, id));
      
      await tx.insert(outboxEvents).values({
        aggregateType: 'RFQ',
        aggregateId: String(rfq.id),
        eventId: `EVT-${Date.now()}`, source: 'Sourcing', eventType: 'RFQ_CANCELLED',
        payload: JSON.stringify({ rfqCode: id }),
        status: 'PENDING'
      } as any);
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error cancelling RFQ:', err);
    res.status(500).json({ error: 'Failed to cancel RFQ' });
  }
});

// PATCH /api/sourcing/rfqs/:id/status
router.patch('/api/sourcing/rfqs/:id/status', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['DRAFT', 'OPEN_BIDDING', 'EVALUATING', 'CLOSED', 'AWARDED', 'CANCELLED'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const existing = await db.select().from(srmRfqs).where(eq(srmRfqs.code, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    await db.update(srmRfqs).set({ status } as any).where(eq(srmRfqs.code, id));

    await db.insert(outboxEvents).values({
      aggregateType: 'RFQ',
      aggregateId: String(existing[0].id),
      eventId: `EVT-STATUS-${Date.now()}`,
      source: 'Sourcing',
      eventType: 'RFQ_STATUS_CHANGED',
      payload: JSON.stringify({ rfqCode: id, previousStatus: existing[0].status, newStatus: status }),
      status: 'PENDING'
    } as any);

    res.json({ success: true, status });
  } catch (err: any) {
    console.error('Error updating RFQ status:', err);
    res.status(500).json({ error: 'Failed to update RFQ status' });
  }
});

// GET /api/sourcing/rfqs/:id/suppliers
router.get('/api/sourcing/rfqs/:id/suppliers', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.select().from(srmRfqs).where(eq(srmRfqs.code, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    const rfqId = existing[0].id;
    const invitations = await db.select().from(srmRfqSuppliers).where(eq(srmRfqSuppliers.rfqId, rfqId));
    const allSuppliers = await db.select().from(suppliers);

    const result = invitations.map(inv => {
      const sup = allSuppliers.find(s => s.id === inv.supplierId);
      return {
        id: inv.id,
        supplierId: inv.supplierId,
        supplierCode: sup?.code || '',
        supplierName: sup?.name || 'Unknown',
        taxId: (sup as any)?.taxCode || (sup as any)?.taxId || '',
        status: sup?.status || 'ACTIVE',
        invitedAt: inv.invitedAt
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error fetching invited suppliers:', err);
    res.status(500).json({ error: 'Failed to fetch invited suppliers' });
  }
});

// GET /api/sourcing/suppliers/:id/eligibility - Check supplier qualification & eligibility against M09
router.get('/api/sourcing/suppliers/:id/eligibility', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  try {
    const supplierId = Number(req.params.id);
    const result = await verifySupplierEligibility(supplierId);
    res.json(result);
  } catch (err: any) {
    console.error('Error verifying supplier eligibility:', err);
    res.status(500).json({ error: 'Failed to verify supplier eligibility', detail: err.message });
  }
});

// POST /api/sourcing/rfqs/:id/invite
router.post('/api/sourcing/rfqs/:id/invite', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), requireEligibleSupplier, async (req, res) => {
  const { id } = req.params;
  const { supplierId } = req.body;

  if (!supplierId) {
    return res.status(400).json({ error: 'Missing supplierId' });
  }

  try {
    const existing = await db.select().from(srmRfqs).where(eq(srmRfqs.code, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    const rfqId = existing[0].id;

    const checkInvited = await db.select().from(srmRfqSuppliers).where(
      and(eq(srmRfqSuppliers.rfqId, rfqId), eq(srmRfqSuppliers.supplierId, Number(supplierId)))
    );
    if (checkInvited.length > 0) {
      return res.status(400).json({ error: 'Supplier already invited to this RFQ' });
    }

    const inserted = await db.insert(srmRfqSuppliers).values({
      rfqId,
      supplierId: Number(supplierId),
      invitedAt: new Date()
    } as any).returning({ id: srmRfqSuppliers.id });

    await db.insert(outboxEvents).values({
      aggregateType: 'RFQ',
      aggregateId: String(rfqId),
      eventId: `EVT-INVITE-${Date.now()}`,
      source: 'Sourcing',
      eventType: 'RFQ_SUPPLIER_INVITED',
      payload: JSON.stringify({ rfqCode: id, supplierId }),
      status: 'PENDING'
    } as any);

    res.status(201).json({ success: true, invitationId: inserted[0].id });
  } catch (err: any) {
    console.error('Error inviting supplier:', err);
    res.status(500).json({ error: 'Failed to invite supplier' });
  }
});

// ==========================================
// W2-A: SUPPLIER BIDS API & REVERSE AUCTION
// ==========================================

router.get('/api/sourcing/bids', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { rfqId } = req.query;
  try {
    let query = db.select().from(srmBids);
    const bids = await query;
    
    // Enrich with supplier and items
    const allSuppliers = await db.select().from(suppliers);
    const allItems = await db.select().from(srmBidItems);

    const enriched = bids.map(b => {
      const sup = allSuppliers.find(s => s.id === b.supplierId);
      const items = allItems.filter(i => i.bidId === b.id);
      
      // Look for earlier round bid from same supplier for same RFQ
      const roundNum = b.roundNumber || 1;
      const earlierRoundBid = bids.find(other => 
        other.rfqId === b.rfqId && 
        other.supplierId === b.supplierId && 
        (other.roundNumber || 1) === roundNum - 1
      );
      const prevVal = earlierRoundBid?.totalValue || null;
      const redPercent = (prevVal && prevVal > 0 && b.totalValue) 
        ? Math.round(((prevVal - b.totalValue) / prevVal) * 10000) / 100 
        : 0;

      return {
        ...b,
        roundNumber: roundNum,
        supplierName: sup ? sup.name : 'Unknown Supplier',
        supplierCode: sup ? sup.code : '',
        previousRoundValue: prevVal,
        priceReductionPercent: redPercent > 0 ? redPercent : 0,
        items
      };
    });

    const filtered = rfqId ? enriched.filter(b => String(b.rfqId) === String(rfqId)) : enriched;
    res.json(filtered);
  } catch (err: any) {
    console.error('Error fetching bids:', err);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

router.post('/api/sourcing/bids', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), requireEligibleSupplier, async (req, res) => {
  const { rfqId, supplierId, items, idempotencyKey, currency = 'VND', roundNumber: explicitRoundNumber } = req.body;
  const user = (req as any).user;

  if (!rfqId || !supplierId || !idempotencyKey || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required bid parameters or items' });
  }

  try {
    // Resolve RFQ numeric id if code is passed
    let numericRfqId = Number(rfqId);
    let rfqRecord: any = null;
    if (isNaN(numericRfqId) || numericRfqId === 0) {
      const found = await db.select().from(srmRfqs).where(eq(srmRfqs.code, String(rfqId))).limit(1);
      if (found.length > 0) {
        rfqRecord = found[0];
        numericRfqId = rfqRecord.id;
      } else {
        return res.status(404).json({ error: 'RFQ not found' });
      }
    } else {
      const found = await db.select().from(srmRfqs).where(eq(srmRfqs.id, numericRfqId)).limit(1);
      if (found.length > 0) {
        rfqRecord = found[0];
      } else {
        return res.status(404).json({ error: 'RFQ not found' });
      }
    }

    const targetRoundNumber = explicitRoundNumber ? Number(explicitRoundNumber) : (rfqRecord?.currentRound || 1);

    // Idempotency check
    const existing = await db.select().from(outboxEvents).where(eq(outboxEvents.eventId, idempotencyKey));
    if (existing.length > 0) {
      const ev = existing[0];
      const payload = JSON.parse(ev.payload || '{}');
      if (payload.rfqId === numericRfqId && payload.supplierId === supplierId) {
        return res.status(200).json({ 
          success: true, 
          replayed: true, 
          bidId: Number(ev.aggregateId),
          roundNumber: payload.roundNumber || targetRoundNumber
        });
      } else {
        return res.status(409).json({ error: 'IDEMPOTENCY_CONFLICT' });
      }
    }

    let totalValue = 0;
    items.forEach((item: any) => {
      totalValue += Number(item.unitPrice || 0) * Number(item.offeredQuantity || 0);
    });

    // Check ceiling price if active auction round exists
    if (targetRoundNumber > 1) {
      const activeRound = await db.select().from(srmAuctionRounds).where(
        and(eq(srmAuctionRounds.rfqId, numericRfqId), eq(srmAuctionRounds.roundNumber, targetRoundNumber))
      ).limit(1);
      if (activeRound.length > 0 && activeRound[0].ceilingPrice && totalValue > activeRound[0].ceilingPrice) {
        return res.status(422).json({
          error: 'CEILING_PRICE_EXCEEDED',
          message: `Giá chào ${totalValue.toLocaleString('vi-VN')} VND vượt quá giá trần cho phép ${activeRound[0].ceilingPrice.toLocaleString('vi-VN')} VND của Vòng ${targetRoundNumber}.`
        });
      }
    }

    // Check previous round bid for this supplier to calculate reduction
    const previousBids = await db.select().from(srmBids).where(
      and(eq(srmBids.rfqId, numericRfqId), eq(srmBids.supplierId, Number(supplierId)))
    ).orderBy(desc(srmBids.roundNumber));

    const prevBid = previousBids.find(b => (b.roundNumber || 1) < targetRoundNumber);
    const previousValue = prevBid?.totalValue || null;
    let priceReductionAmount = 0;
    let priceReductionPercent = 0;
    if (previousValue && previousValue > 0) {
      priceReductionAmount = previousValue - totalValue;
      priceReductionPercent = Math.round(((previousValue - totalValue) / previousValue) * 10000) / 100;
    }

    let newBidId = 0;

    await db.transaction(async (tx) => {
      // If round > 1, update previous round bids to REVISED
      if (previousBids.length > 0) {
        for (const pb of previousBids) {
          if ((pb.roundNumber || 1) < targetRoundNumber && pb.status === 'SUBMITTED') {
            await tx.update(srmBids).set({ status: 'REVISED' } as any).where(eq(srmBids.id, pb.id));
          }
        }
      }

      const insertedBid = await tx.insert(srmBids).values({
        rfqId: numericRfqId,
        supplierId: Number(supplierId),
        roundNumber: targetRoundNumber,
        status: 'SUBMITTED',
        totalValue,
        submittedAt: new Date()
      } as any).returning({ id: srmBids.id });

      newBidId = insertedBid[0].id;

      for (const item of items) {
        await tx.insert(srmBidItems).values({
          bidId: newBidId,
          rfqItemId: Number(item.rfqItemId || item.id || 1),
          unitPrice: Number(item.unitPrice),
          offeredQuantity: Number(item.offeredQuantity),
          leadTimeDays: Number(item.leadTimeDays || 3)
        } as any);
      }

      await tx.insert(outboxEvents).values({
        aggregateType: 'BID',
        aggregateId: String(newBidId),
        eventId: idempotencyKey,
        source: 'M10_SOURCING',
        eventType: 'BID_SUBMITTED',
        payload: JSON.stringify({ 
          rfqId: numericRfqId, 
          rfqCode: rfqRecord?.code,
          supplierId, 
          roundNumber: targetRoundNumber,
          totalValue, 
          previousValue,
          priceReductionAmount,
          priceReductionPercent,
          items 
        }),
        status: 'PENDING',
        correlationId: `SUBMIT_BID_${newBidId}`
      } as any);
    });

    // Audit Trail M02
    try {
      await AuditService.recordAuditLog({
        module: 'M10',
        action: 'SUBMIT_BID',
        entityType: 'SRM_BID',
        entityId: String(newBidId),
        userId: user ? user.id : 1,
        username: user?.username || 'supplier_portal',
        result: 'SUCCESS',
        metadata: {
          rfqId: numericRfqId,
          supplierId,
          roundNumber: targetRoundNumber,
          totalValue,
          previousValue,
          priceReductionPercent
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during bid submission:', auditErr);
    }

    res.status(201).json({ 
      success: true, 
      bidId: newBidId,
      roundNumber: targetRoundNumber,
      totalValue,
      previousRoundValue: previousValue,
      priceReductionPercent: priceReductionPercent > 0 ? priceReductionPercent : 0,
      message: `Hồ sơ chào giá Vòng ${targetRoundNumber} đã được nộp thành công.`
    });
  } catch (err: any) {
    console.error('Error creating bid:', err);
    res.status(500).json({ error: 'Transaction failed', detail: err.message });
  }
});

// GET /api/sourcing/rfqs/:id/bids - Fetch bids specifically for a given RFQ ID or Code
router.get('/api/sourcing/rfqs/:id/bids', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { id } = req.params;
  try {
    const isNum = !isNaN(Number(id));
    let numericRfqId = Number(id);
    if (!isNum || numericRfqId === 0) {
      const found = await db.select().from(srmRfqs).where(eq(srmRfqs.code, id)).limit(1);
      if (found.length > 0) {
        numericRfqId = found[0].id;
      }
    }

    const bids = await db.select().from(srmBids).where(eq(srmBids.rfqId, numericRfqId));
    const allSuppliers = await db.select().from(suppliers);
    const allItems = await db.select().from(srmBidItems);

    const enriched = bids.map(b => {
      const sup = allSuppliers.find(s => s.id === b.supplierId);
      const items = allItems.filter(i => i.bidId === b.id);
      
      const roundNum = b.roundNumber || 1;
      const earlierRoundBid = bids.find(other => 
        other.rfqId === b.rfqId && 
        other.supplierId === b.supplierId && 
        (other.roundNumber || 1) === roundNum - 1
      );
      const prevVal = earlierRoundBid?.totalValue || null;
      const redPercent = (prevVal && prevVal > 0 && b.totalValue) 
        ? Math.round(((prevVal - b.totalValue) / prevVal) * 10000) / 100 
        : 0;

      return {
        ...b,
        roundNumber: roundNum,
        supplierName: sup ? sup.name : 'Unknown Supplier',
        supplierCode: sup ? sup.code : '',
        previousRoundValue: prevVal,
        priceReductionPercent: redPercent > 0 ? redPercent : 0,
        items
      };
    });

    res.json(enriched);
  } catch (err: any) {
    console.error('Error fetching bids for RFQ:', err);
    res.status(500).json({ error: 'Failed to fetch bids for RFQ', detail: err.message });
  }
});

// POST /api/sourcing/rfqs/:id/bids - Nested endpoint for submitting supplier bids for an RFQ
router.post('/api/sourcing/rfqs/:id/bids', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), requireEligibleSupplier, async (req, res, next) => {
  req.body = {
    ...req.body,
    rfqId: req.body.rfqId || req.params.id
  };
  req.url = '/api/sourcing/bids';
  router.handle(req, res, next);
});

// POST /api/sourcing/rfqs/:id/reverse-auction/round - Open next negotiation round
router.post('/api/sourcing/rfqs/:id/reverse-auction/round', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { id } = req.params;
  const { targetReductionPercent = 5, ceilingPrice, deadline, notes, idempotencyKey } = req.body;
  const user = (req as any).user;

  try {
    // 1. Resolve RFQ by code or ID
    const isNum = !isNaN(Number(id));
    const rfqQuery = isNum
      ? await db.select().from(srmRfqs).where(eq(srmRfqs.id, Number(id))).limit(1)
      : await db.select().from(srmRfqs).where(eq(srmRfqs.code, id)).limit(1);

    if (rfqQuery.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    const rfq = rfqQuery[0];

    if (['CANCELLED', 'AWARDED'].includes(rfq.status)) {
      return res.status(400).json({ 
        error: 'INVALID_RFQ_STATUS', 
        message: `Không thể mở vòng đàm phán khi RFQ đang ở trạng thái [${rfq.status}].` 
      });
    }

    // Check idempotency
    if (idempotencyKey) {
      const existing = await db.select().from(outboxEvents).where(eq(outboxEvents.eventId, idempotencyKey));
      if (existing.length > 0) {
        const ev = existing[0];
        const payload = JSON.parse(ev.payload || '{}');
        return res.status(200).json({ 
          success: true, 
          replayed: true, 
          roundNumber: payload.roundNumber,
          rfqCode: rfq.code,
          message: 'Vòng đàm phán đã được kích hoạt trước đó (Idempotent Replay).' 
        });
      }
    }

    const currentRound = (rfq as any).currentRound || 1;
    const nextRoundNumber = currentRound + 1;

    // Determine lowest bid from current round to establish price ceiling
    const existingBids = await db.select().from(srmBids).where(
      and(eq(srmBids.rfqId, rfq.id), eq(srmBids.roundNumber, currentRound))
    );

    let lowestBidPreviousRound = 0;
    if (existingBids.length > 0) {
      const validValues = existingBids.map(b => b.totalValue || 0).filter(v => v > 0);
      if (validValues.length > 0) {
        lowestBidPreviousRound = Math.min(...validValues);
      }
    }

    // Default ceiling price is previous lowest bid (or adjusted by target reduction)
    const effectiveCeilingPrice = ceilingPrice 
      ? Number(ceilingPrice) 
      : (lowestBidPreviousRound > 0 ? lowestBidPreviousRound * (1 - (Number(targetReductionPercent) || 0) / 100) : null);

    const roundDeadline = deadline ? new Date(deadline) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    let roundId = 0;

    await db.transaction(async (tx) => {
      // 1. Close any existing ACTIVE round for this RFQ
      await tx.update(srmAuctionRounds).set({
        status: 'CLOSED',
        closedAt: new Date()
      } as any).where(and(eq(srmAuctionRounds.rfqId, rfq.id), eq(srmAuctionRounds.status, 'ACTIVE')));

      // 2. Insert new auction round record
      const insertedRound = await tx.insert(srmAuctionRounds).values({
        rfqId: rfq.id,
        roundNumber: nextRoundNumber,
        status: 'ACTIVE',
        targetReductionPercent: Number(targetReductionPercent) || 0,
        ceilingPrice: effectiveCeilingPrice,
        deadline: roundDeadline,
        notes: notes?.trim() || `Vòng đàm phán giá #${nextRoundNumber} (Reverse Auction)`,
        openedBy: user ? user.id : 1,
        openedAt: new Date()
      } as any).returning({ id: srmAuctionRounds.id });

      roundId = insertedRound[0].id;

      // 3. Update RFQ current round and status to OPEN_BIDDING
      await tx.update(srmRfqs).set({
        currentRound: nextRoundNumber,
        status: 'OPEN_BIDDING',
        deadline: roundDeadline
      } as any).where(eq(srmRfqs.id, rfq.id));

      // 4. Record transactional outbox event
      const eventKey = idempotencyKey || `EVT-AUCTION-RND-${rfq.id}-${nextRoundNumber}-${Date.now()}`;
      await tx.insert(outboxEvents).values({
        aggregateType: 'RFQ',
        aggregateId: String(rfq.id),
        eventId: eventKey,
        source: 'M10_SOURCING',
        eventType: 'REVERSE_AUCTION_ROUND_OPENED',
        payload: JSON.stringify({
          rfqId: rfq.id,
          rfqCode: rfq.code,
          roundId,
          roundNumber: nextRoundNumber,
          previousRound: currentRound,
          lowestBidPreviousRound,
          ceilingPrice: effectiveCeilingPrice,
          targetReductionPercent,
          deadline: roundDeadline,
          notes
        }),
        status: 'PENDING',
        correlationId: `AUCTION_ROUND_${rfq.id}_${nextRoundNumber}`
      } as any);
    });

    res.status(201).json({
      success: true,
      rfqId: rfq.id,
      rfqCode: rfq.code,
      roundId,
      roundNumber: nextRoundNumber,
      previousLowestBid: lowestBidPreviousRound,
      ceilingPrice: effectiveCeilingPrice,
      targetReductionPercent: Number(targetReductionPercent) || 0,
      deadline: roundDeadline,
      message: `Đã mở thành công Vòng ${nextRoundNumber} đàm phán giá ngược (Reverse Auction) cho gói thầu ${rfq.code}.`
    });
  } catch (err: any) {
    console.error('Error opening reverse auction round:', err);
    res.status(500).json({ error: 'Failed to open reverse auction round', detail: err.message });
  }
});

// GET /api/sourcing/rfqs/:id/reverse-auction - Get full multi-round price reduction history
router.get('/api/sourcing/rfqs/:id/reverse-auction', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { id } = req.params;

  try {
    const isNum = !isNaN(Number(id));
    const rfqQuery = isNum
      ? await db.select().from(srmRfqs).where(eq(srmRfqs.id, Number(id))).limit(1)
      : await db.select().from(srmRfqs).where(eq(srmRfqs.code, id)).limit(1);

    if (rfqQuery.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    const rfq = rfqQuery[0];
    const currentRound = (rfq as any).currentRound || 1;

    // Fetch all rounds
    const rounds = await db.select().from(srmAuctionRounds).where(eq(srmAuctionRounds.rfqId, rfq.id)).orderBy(srmAuctionRounds.roundNumber);

    // Fetch all bids for this RFQ
    const bids = await db.select().from(srmBids).where(eq(srmBids.rfqId, rfq.id)).orderBy(srmBids.roundNumber);
    const allSuppliers = await db.select().from(suppliers);

    // Compute metrics per round
    const enrichedRounds = [];
    const maxRound = Math.max(currentRound, ...rounds.map(r => r.roundNumber), ...bids.map(b => b.roundNumber || 1));

    let prevLowest = 0;
    for (let r = 1; r <= maxRound; r++) {
      const roundMeta = rounds.find(item => item.roundNumber === r);
      const roundBids = bids.filter(b => (b.roundNumber || 1) === r);
      
      let lowestBid = 0;
      let leadingSupplierName = '';
      if (roundBids.length > 0) {
        const sorted = [...roundBids].sort((a, b) => (a.totalValue || 0) - (b.totalValue || 0));
        lowestBid = sorted[0].totalValue || 0;
        const sup = allSuppliers.find(s => s.id === sorted[0].supplierId);
        leadingSupplierName = sup ? sup.name : `Supplier #${sorted[0].supplierId}`;
      }

      const reductionFromPrev = (prevLowest > 0 && lowestBid > 0) ? prevLowest - lowestBid : 0;
      if (lowestBid > 0) prevLowest = lowestBid;

      enrichedRounds.push({
        id: roundMeta?.id || r,
        rfqId: rfq.id,
        roundNumber: r,
        status: roundMeta?.status || (r === currentRound ? 'ACTIVE' : (r < currentRound ? 'CLOSED' : 'PENDING')),
        targetReductionPercent: roundMeta?.targetReductionPercent || 0,
        ceilingPrice: roundMeta?.ceilingPrice || null,
        deadline: roundMeta?.deadline || null,
        notes: roundMeta?.notes || (r === 1 ? 'Vòng chào giá ban đầu' : `Vòng đàm phán giá #${r}`),
        openedAt: roundMeta?.openedAt || null,
        closedAt: roundMeta?.closedAt || null,
        lowestBid,
        leadingSupplierName,
        totalBidsInRound: roundBids.length,
        reductionFromPreviousRound: reductionFromPrev
      });
    }

    // Trajectory per supplier
    const supplierIds = Array.from(new Set(bids.map(b => b.supplierId)));
    const bidsHistory = supplierIds.map(sId => {
      const sup = allSuppliers.find(s => s.id === sId);
      const supBids = bids.filter(b => b.supplierId === sId);
      
      const roundBids: Record<number, any> = {};
      supBids.forEach(b => {
        roundBids[b.roundNumber || 1] = {
          bidId: b.id,
          totalValue: b.totalValue || 0,
          status: b.status,
          submittedAt: b.submittedAt
        };
      });

      const initialValue = roundBids[1]?.totalValue || supBids[0]?.totalValue || 0;
      const sortedByRound = [...supBids].sort((a, b) => (b.roundNumber || 1) - (a.roundNumber || 1));
      const latestValue = sortedByRound[0]?.totalValue || initialValue;

      const totalReductionAmount = initialValue > latestValue ? initialValue - latestValue : 0;
      const totalReductionPercent = (initialValue > 0 && totalReductionAmount > 0)
        ? Math.round((totalReductionAmount / initialValue) * 10000) / 100
        : 0;

      return {
        supplierId: sId,
        supplierName: sup?.name || 'Unknown',
        supplierCode: sup?.code || '',
        roundBids,
        initialValue,
        latestValue,
        totalReductionAmount,
        totalReductionPercent
      };
    });

    // Summary savings
    const round1Bids = bids.filter(b => (b.roundNumber || 1) === 1 && (b.totalValue || 0) > 0);
    const round1Lowest = round1Bids.length > 0 ? Math.min(...round1Bids.map(b => b.totalValue || 0)) : 0;

    const currentBids = bids.filter(b => (b.roundNumber || 1) === currentRound && (b.totalValue || 0) > 0);
    const currentLowest = currentBids.length > 0 
      ? Math.min(...currentBids.map(b => b.totalValue || 0)) 
      : (bids.length > 0 ? Math.min(...bids.map(b => b.totalValue || 0)) : 0);

    const totalSavingsAmount = round1Lowest > currentLowest ? round1Lowest - currentLowest : 0;
    const totalSavingsPercent = (round1Lowest > 0 && totalSavingsAmount > 0)
      ? Math.round((totalSavingsAmount / round1Lowest) * 10000) / 100
      : 0;

    res.json({
      rfqId: rfq.id,
      rfqCode: rfq.code,
      currentRound,
      rounds: enrichedRounds,
      bidsHistory,
      round1Lowest,
      currentLowest,
      totalSavingsAmount,
      totalSavingsPercent
    });
  } catch (err: any) {
    console.error('Error fetching reverse auction history:', err);
    res.status(500).json({ error: 'Failed to fetch reverse auction history', detail: err.message });
  }
});

// ==========================================
// M11 SRM SCORECARDS INTEGRATION HELPER
// ==========================================

function extractSupplierScorecard(sup: any) {
  if (!sup) {
    return {
      otifRate: '95.0%',
      otifRateNumeric: 95.0,
      qualityScore: '95.0%',
      qualityScoreNumeric: 95.0,
      complianceScore: '100%',
      complianceScoreNumeric: 100.0,
      compositeScore: 85,
      performanceTier: 'TIER_2_PREFERRED',
      overallRating: '4.2'
    };
  }

  let scorecards: any[] = [];
  if (sup.notes) {
    try {
      const parsed = JSON.parse(sup.notes);
      if (parsed && Array.isArray(parsed.scorecards)) {
        scorecards = parsed.scorecards;
      }
    } catch (e) {}
  }

  const parsePercent = (val: any, defaultVal: number) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const n = parseFloat(val.replace('%', ''));
      return isNaN(n) ? defaultVal : n;
    }
    return defaultVal;
  };

  const score = sup.compositeScore || 85;
  const otifRate = scorecards.length > 0 && scorecards[0].otifRate 
    ? scorecards[0].otifRate 
    : (score >= 90 ? '98.5%' : score >= 80 ? '95.2%' : '88.0%');
  const qualityScore = scorecards.length > 0 && scorecards[0].qualityScore 
    ? scorecards[0].qualityScore 
    : (score >= 90 ? '99.2%' : score >= 80 ? '96.5%' : '90.0%');
  const complianceScore = scorecards.length > 0 && scorecards[0].complianceScore 
    ? scorecards[0].complianceScore 
    : (score >= 90 ? '100%' : '98%');

  return {
    otifRate,
    otifRateNumeric: parsePercent(otifRate, 95.0),
    qualityScore,
    qualityScoreNumeric: parsePercent(qualityScore, 96.0),
    complianceScore,
    complianceScoreNumeric: parsePercent(complianceScore, 98.0),
    compositeScore: score,
    performanceTier: sup.performanceTier || (score >= 90 ? 'TIER_1_STRATEGIC' : 'TIER_2_PREFERRED'),
    overallRating: ((score) / 20).toFixed(1)
  };
}

// ==========================================
// PHASE 7: PRICE AGREEMENT BENCHMARK GUARD (M10 SOURCING x M09 BPA CONTRACTS)
// ==========================================

export interface BPABenchmarkResult {
  hasAgreement: boolean;
  contractCode?: string;
  contractTitle?: string;
  contractStatus?: string;
  lockedPrice?: number;
  offeredPrice?: number;
  varianceAmount?: number;
  variancePercent?: number;
  thresholdPercent: number; // 10%
  isExceedingLimit: boolean; // variancePercent > 10%
  flag: 'EXCEEDS_LIMIT' | 'WITHIN_TOLERANCE' | 'FAVORABLE' | 'NO_BPA';
  warningMessage: string;
  matchedItemName?: string;
  matchedItemCode?: string;
}

export function evaluateBpaBenchmark(
  supplier: { id?: number; code?: string; name?: string } | undefined,
  bidItems: Array<{ rfqItemId?: number; offeredQuantity?: number; unitPrice?: number; sku?: string; productName?: string }>,
  primaryUnitPrice: number
): BPABenchmarkResult {
  if (!supplier) {
    return {
      hasAgreement: false,
      thresholdPercent: 10,
      isExceedingLimit: false,
      flag: 'NO_BPA',
      warningMessage: 'Chưa có thông tin Nhà cung cấp để đối chiếu khung BPA M09.'
    };
  }

  // Find active or pending renewal BPA contract from M09
  const activeContracts = (bpaContracts || []).filter(c => 
    (c.status === 'ACTIVE' || c.status === 'PENDING_RENEWAL') &&
    (
      (supplier.id && c.supplierId === supplier.id) ||
      (supplier.code && c.supplierCode === supplier.code) ||
      (supplier.name && c.supplier && (
        c.supplier.toLowerCase().includes(supplier.name.toLowerCase()) ||
        supplier.name.toLowerCase().includes(c.supplier.toLowerCase())
      ))
    )
  );

  if (activeContracts.length === 0) {
    return {
      hasAgreement: false,
      thresholdPercent: 10,
      isExceedingLimit: false,
      flag: 'NO_BPA',
      warningMessage: 'Chưa có Hợp đồng nguyên tắc / Khung thỏa thuận giá (BPA) với Nhà cung cấp này.'
    };
  }

  const contract = activeContracts[0];
  const priceLocks = contract.priceLocks || [];

  // Try to match specific item by SKU or product name
  let matchedLock: { itemCode: string; itemName: string; lockedPrice: number; unit: string } | null = null;
  let matchedOfferedPrice = primaryUnitPrice;

  for (const item of bidItems) {
    const itemSku = (item.sku || '').toLowerCase().trim();
    const itemName = (item.productName || '').toLowerCase().trim();

    const found = priceLocks.find(pl => {
      const lockCode = (pl.itemCode || '').toLowerCase().trim();
      const lockName = (pl.itemName || '').toLowerCase().trim();
      return (
        (itemSku && lockCode && (lockCode.includes(itemSku) || itemSku.includes(lockCode))) ||
        (itemName && lockName && (lockName.includes(itemName) || itemName.includes(lockName)))
      );
    });

    if (found) {
      matchedLock = found;
      matchedOfferedPrice = Number(item.unitPrice || primaryUnitPrice);
      break;
    }
  }

  // If no exact item matched, take first price lock from contract if available
  if (!matchedLock && priceLocks.length > 0) {
    matchedLock = priceLocks[0];
  }

  if (!matchedLock) {
    return {
      hasAgreement: true,
      contractCode: contract.contractCode || contract.id,
      contractTitle: contract.title,
      contractStatus: contract.status,
      thresholdPercent: 10,
      isExceedingLimit: false,
      flag: 'WITHIN_TOLERANCE',
      warningMessage: `Có Hợp đồng khung ${contract.contractCode || contract.id} nhưng chưa cố định giá trần (Price Lock) cho mặt hàng này.`
    };
  }

  const lockedPrice = Number(matchedLock.lockedPrice || 0);
  const offeredPrice = Number(matchedOfferedPrice || 0);

  if (lockedPrice <= 0) {
    return {
      hasAgreement: true,
      contractCode: contract.contractCode || contract.id,
      contractTitle: contract.title,
      contractStatus: contract.status,
      thresholdPercent: 10,
      isExceedingLimit: false,
      flag: 'WITHIN_TOLERANCE',
      warningMessage: `Hợp đồng khung ${contract.contractCode || contract.id} chưa có đơn giá trần hợp lệ.`
    };
  }

  const varianceAmount = offeredPrice - lockedPrice;
  const variancePercent = Number(((varianceAmount / lockedPrice) * 100).toFixed(2));
  const isExceedingLimit = variancePercent > 10;

  let flag: 'EXCEEDS_LIMIT' | 'WITHIN_TOLERANCE' | 'FAVORABLE' = 'WITHIN_TOLERANCE';
  let warningMessage = '';

  if (isExceedingLimit) {
    flag = 'EXCEEDS_LIMIT';
    warningMessage = `⚠️ Cảnh báo bất thường: Đơn giá chào thầu (${offeredPrice.toLocaleString('vi-VN')} ₫) cao hơn +${variancePercent}% so với giá khung BPA ${contract.contractCode || contract.id} (${lockedPrice.toLocaleString('vi-VN')} ₫) - Vượt ngưỡng trần cho phép >10%! Cần thẩm tra hoặc yêu cầu giải trình trước khi phê duyệt.`;
  } else if (variancePercent <= 0) {
    flag = 'FAVORABLE';
    warningMessage = `✓ Đơn giá ưu đãi tốt hơn giá khung thỏa thuận BPA (${Math.abs(variancePercent)}% tiết kiệm).`;
  } else {
    flag = 'WITHIN_TOLERANCE';
    warningMessage = `✓ Đơn giá nằm trong biên độ cho phép (+${variancePercent}% so với giá khung BPA ${contract.contractCode || contract.id}).`;
  }

  return {
    hasAgreement: true,
    contractCode: contract.contractCode || contract.id,
    contractTitle: contract.title,
    contractStatus: contract.status,
    lockedPrice,
    offeredPrice,
    varianceAmount,
    variancePercent,
    thresholdPercent: 10,
    isExceedingLimit,
    flag,
    warningMessage,
    matchedItemName: matchedLock.itemName,
    matchedItemCode: matchedLock.itemCode
  };
}

// Helper to build standardized comparison matrix
async function buildRfqComparison(rfqIdOrCode: string | number) {
  const isNum = !isNaN(Number(rfqIdOrCode));
  const rfqRows = isNum
    ? await db.select().from(srmRfqs).where(eq(srmRfqs.id, Number(rfqIdOrCode))).limit(1)
    : await db.select().from(srmRfqs).where(eq(srmRfqs.code, String(rfqIdOrCode))).limit(1);

  if (!rfqRows || rfqRows.length === 0) {
    return null;
  }
  const rfq = rfqRows[0];
  const rfqId = rfq.id;

  // Package lookup
  let pkg: any = null;
  if (rfq.packageId) {
    const pkgs = await db.select().from(sourcingPackages).where(eq(sourcingPackages.id, rfq.packageId)).limit(1);
    if (pkgs.length > 0) pkg = pkgs[0];
  }

  // Active auction round
  const rounds = await db.select().from(srmAuctionRounds).where(eq(srmAuctionRounds.rfqId, rfqId)).orderBy(desc(srmAuctionRounds.roundNumber));
  const activeRound = rounds.find(r => r.roundNumber === rfq.currentRound) || rounds[0] || null;

  // RFQ Items with products
  const rawRfqItems = await db.select().from(srmRfqItems).where(eq(srmRfqItems.rfqId, rfqId));
  const allProducts = await db.select().from(products);
  const rfqItemsEnriched = rawRfqItems.map(item => {
    const prod = allProducts.find(p => p.id === item.productId);
    return {
      id: item.id,
      productId: item.productId,
      targetQuantity: item.targetQuantity,
      productName: prod ? prod.name : 'Unknown',
      sku: prod ? (prod.sku || prod.code) : '',
      category: prod ? prod.category : '',
      uom: prod ? prod.uom : 'PCS'
    };
  });

  // Bids for this RFQ
  const bids = await db.select().from(srmBids).where(eq(srmBids.rfqId, rfqId)).orderBy(desc(srmBids.createdAt));
  const allSuppliers = await db.select().from(suppliers);
  const allBidItems = await db.select().from(srmBidItems);
  const evals = await db.select().from(sourcingEvaluations).where(eq(sourcingEvaluations.rfqId, rfqId));
  const evalScores = await db.select().from(sourcingEvaluationScores);

  // Active bids (latest round per supplier or round matching rfq.currentRound)
  const activeBids = bids.filter(b => b.status !== 'REVISED' || b.roundNumber === rfq.currentRound);
  const bidsToCompare = activeBids.length > 0 ? activeBids : bids;

  // Min price for normalization & variance
  const validPrices = bidsToCompare.map(b => Number(b.totalValue || 0)).filter(p => p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
  const avgPrice = validPrices.length > 0 ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : 0;

  // Target budget baseline
  const estimatedBudget = pkg?.estimatedBudget || activeRound?.ceilingPrice || maxPrice || 0;

  const comparisonList = bidsToCompare.map(b => {
    const sup = allSuppliers.find(s => s.id === b.supplierId);
    const bItems = allBidItems.filter(i => i.bidId === b.id);
    const evalRecord = evals.find(e => e.bidId === b.id);
    const scores = evalRecord ? evalScores.filter(s => s.evaluationId === evalRecord.id) : [];

    // Line items with product names
    const enrichedItems = bItems.map(bi => {
      const rfqLine = rfqItemsEnriched.find(ri => ri.id === bi.rfqItemId);
      return {
        id: bi.id,
        rfqItemId: bi.rfqItemId,
        productName: rfqLine ? rfqLine.productName : 'Sản phẩm',
        sku: rfqLine ? rfqLine.sku : '',
        offeredQuantity: bi.offeredQuantity,
        unitPrice: bi.unitPrice,
        leadTimeDays: bi.leadTimeDays || 3,
        lineTotal: (bi.offeredQuantity || 0) * (bi.unitPrice || 0)
      };
    });

    const primaryUnitPrice = enrichedItems.length > 0 ? enrichedItems[0].unitPrice : (b.totalValue || 0);
    const leadTimeDays = enrichedItems.length > 0 
      ? Math.max(...enrichedItems.map(i => i.leadTimeDays || 0)) 
      : 3;

    // Discount calculation
    const totalVal = Number(b.totalValue || 0);
    let discountAmount = 0;
    let discountPercent = 0;
    if (estimatedBudget > 0 && totalVal < estimatedBudget) {
      discountAmount = estimatedBudget - totalVal;
      discountPercent = Number(((discountAmount / estimatedBudget) * 100).toFixed(2));
    }

    // Payment terms from supplier
    const paymentTerms = sup?.paymentTerms || 'NET 30 Ngày';

    // Variance from lowest price
    const isLowest = minPrice > 0 && totalVal === minPrice;
    const varianceFromLowestAmount = minPrice > 0 ? Math.max(0, totalVal - minPrice) : 0;
    const varianceFromLowestPercent = minPrice > 0 ? Number(((varianceFromLowestAmount / minPrice) * 100).toFixed(2)) : 0;

    // M11 SRM Scorecard extraction
    const m11Scorecard = extractSupplierScorecard(sup);

    // Criteria breakdown
    const commercialScoreObj = scores.find(s => s.criterionName.includes('PRICE') || s.criterionName.includes('COMMERCIAL'));
    const technicalScoreObj = scores.find(s => s.criterionName.includes('QUALITY') || s.criterionName.includes('TECHNICAL'));
    const slaScoreObj = scores.find(s => s.criterionName.includes('DELIVERY') || s.criterionName.includes('SLA') || s.criterionName.includes('OTIF'));
    const complianceScoreObj = scores.find(s => s.criterionName.includes('WARRANTY') || s.criterionName.includes('COMPLIANCE') || s.criterionName.includes('LEGAL'));

    return {
      bidId: b.id,
      supplierId: b.supplierId,
      supplierName: sup ? sup.name : 'Unknown',
      supplierCode: sup ? sup.code : '',
      roundNumber: b.roundNumber,
      status: b.status,
      currency: 'VND',
      unitPrice: primaryUnitPrice,
      totalValue: totalVal,
      discountPercent,
      discountAmount,
      leadTimeDays,
      paymentTerms,
      isLowestPrice: isLowest,
      varianceFromLowestAmount,
      varianceFromLowestPercent,
      items: enrichedItems,
      totalScore: evalRecord ? evalRecord.totalScore : 0,
      evaluationStatus: evalRecord ? evalRecord.status : 'PENDING',
      ranking: evalRecord ? evalRecord.ranking : 99,
      scoresBreakdown: {
        commercial: commercialScoreObj ? commercialScoreObj.score : 0,
        technical: technicalScoreObj ? technicalScoreObj.score : 0,
        sla: slaScoreObj ? slaScoreObj.score : 0,
        compliance: complianceScoreObj ? complianceScoreObj.score : 0
      },
      m11Scorecard,
      bpaBenchmark: evaluateBpaBenchmark(sup, enrichedItems, primaryUnitPrice)
    };
  });

  // Sort: If any evaluated, sort by totalScore desc; else sort by totalValue asc
  const hasEvaluations = comparisonList.some(c => c.totalScore > 0);
  if (hasEvaluations) {
    comparisonList.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  } else {
    comparisonList.sort((a, b) => (a.totalValue || 0) - (b.totalValue || 0));
  }
  comparisonList.forEach((c, idx) => { c.ranking = idx + 1; });

  const leadingSupplier = comparisonList.length > 0 ? comparisonList[0].supplierName : 'Chưa có';
  const topRankedBidId = comparisonList.length > 0 ? comparisonList[0].bidId : null;
  const topRankedItem = comparisonList.length > 0 ? comparisonList[0] : null;
  const potentialSavings = estimatedBudget > 0 && minPrice > 0 ? Math.max(0, estimatedBudget - minPrice) : 0;
  const potentialSavingsPercent = estimatedBudget > 0 && potentialSavings > 0 
    ? Number(((potentialSavings / estimatedBudget) * 100).toFixed(2)) 
    : 0;

  const bpaAlertsCount = comparisonList.filter(c => c.bpaBenchmark?.isExceedingLimit).length;

  return {
    rfq: {
      id: rfq.id,
      code: rfq.code,
      title: rfq.title,
      status: rfq.status,
      deadline: rfq.deadline,
      currentRound: rfq.currentRound,
      packageId: rfq.packageId,
      packageCode: pkg?.packageCode || null,
      packageTitle: pkg?.title || null,
      category: pkg?.category || 'Direct Materials',
      estimatedBudget
    },
    items: rfqItemsEnriched,
    comparison: comparisonList,
    summary: {
      totalBids: comparisonList.length,
      lowestPrice: minPrice,
      highestPrice: maxPrice,
      averagePrice: avgPrice,
      estimatedBudget,
      potentialSavings,
      potentialSavingsPercent,
      leadingSupplier,
      topRankedBidId,
      hasEvaluations,
      bpaAlertsCount,
      topRankedBpaAlert: Boolean(topRankedItem?.bpaBenchmark?.isExceedingLimit),
      topRankedBpaWarning: topRankedItem?.bpaBenchmark?.isExceedingLimit ? topRankedItem.bpaBenchmark.warningMessage : undefined
    }
  };
}

// ==========================================
// W2-B: BID EVALUATION API & CONSENSUS MATRIX
// ==========================================

router.get('/api/sourcing/evaluations', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { rfqId } = req.query;
  try {
    const evals = await db.select().from(sourcingEvaluations);
    const scores = await db.select().from(sourcingEvaluationScores);

    const enriched = evals.map(e => ({
      ...e,
      scores: scores.filter(s => s.evaluationId === e.id)
    }));

    const filtered = rfqId ? enriched.filter(e => String(e.rfqId) === String(rfqId)) : enriched;
    res.json(filtered);
  } catch (err: any) {
    console.error('Error fetching evaluations:', err);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

router.post('/api/sourcing/evaluations', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { rfqId, bidId, criteriaScores, scorePrice, scoreQuality, scoreDelivery, scoreWarranty, notes, idempotencyKey } = req.body;
  const user = (req as any).user;

  if (!rfqId || !bidId || !idempotencyKey) {
    return res.status(400).json({ error: 'Missing evaluation parameters (rfqId, bidId, idempotencyKey)' });
  }

  try {
    // Idempotency check
    const existing = await db.select().from(outboxEvents).where(eq(outboxEvents.eventId, idempotencyKey));
    if (existing.length > 0) {
      const ev = existing[0];
      return res.status(200).json({ replayed: true, evaluationId: ev.aggregateId });
    }

    // Prepare criteria scores
    let normalizedCriteria: any[] = [];
    if (Array.isArray(criteriaScores) && criteriaScores.length > 0) {
      normalizedCriteria = criteriaScores;
    } else {
      normalizedCriteria = [
        { criterionName: 'COMMERCIAL_PRICE', weight: 0.40, score: Number(scorePrice || 85) },
        { criterionName: 'TECHNICAL_QUALITY', weight: 0.30, score: Number(scoreQuality || 90) },
        { criterionName: 'SLA_DELIVERY_OTIF', weight: 0.20, score: Number(scoreDelivery || 85) },
        { criterionName: 'COMPLIANCE_LEGAL', weight: 0.10, score: Number(scoreWarranty || 90) },
      ];
    }

    // Server-authoritative calculation
    let totalScore = 0;
    const computedScores = normalizedCriteria.map((c: any) => {
      const weight = Number(c.weight || 0);
      const score = Number(c.score || 0);
      const weightedScore = Number((score * weight).toFixed(2));
      totalScore += weightedScore;
      return {
        criterionName: c.criterionName || 'GENERAL',
        weight,
        score,
        weightedScore
      };
    });
    totalScore = Number(totalScore.toFixed(2));

    let evalId = 0;

    await db.transaction(async (tx) => {
      // Check if evaluation for this bid already exists
      const existingEval = await tx.select().from(sourcingEvaluations).where(
        and(eq(sourcingEvaluations.rfqId, Number(rfqId)), eq(sourcingEvaluations.bidId, Number(bidId)))
      ).limit(1);

      if (existingEval.length > 0) {
        evalId = existingEval[0].id;
        await tx.update(sourcingEvaluations).set({
          evaluatorId: user.id,
          status: 'COMPLETED',
          totalScore,
          notes: notes || '',
          updatedAt: new Date()
        } as any).where(eq(sourcingEvaluations.id, evalId));

        await tx.delete(sourcingEvaluationScores).where(eq(sourcingEvaluationScores.evaluationId, evalId));
      } else {
        const inserted = await tx.insert(sourcingEvaluations).values({
          rfqId: Number(rfqId),
          bidId: Number(bidId),
          evaluatorId: user.id,
          status: 'COMPLETED',
          totalScore,
          ranking: 1,
          notes: notes || ''
        } as any).returning({ id: sourcingEvaluations.id });
        evalId = inserted[0].id;
      }

      for (const cs of computedScores) {
        await tx.insert(sourcingEvaluationScores).values({
          evaluationId: evalId,
          criterionName: cs.criterionName,
          weight: cs.weight,
          score: cs.score,
          weightedScore: cs.weightedScore
        } as any);
      }

      // Re-rank all evaluations for this RFQ
      const allRfqEvals = await tx.select().from(sourcingEvaluations).where(eq(sourcingEvaluations.rfqId, Number(rfqId)));
      allRfqEvals.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      for (let i = 0; i < allRfqEvals.length; i++) {
        await tx.update(sourcingEvaluations).set({ ranking: i + 1 } as any).where(eq(sourcingEvaluations.id, allRfqEvals[i].id));
      }

      await tx.insert(outboxEvents).values({
        aggregateType: 'EVALUATION',
        aggregateId: String(evalId),
        eventId: idempotencyKey,
        source: 'Sourcing',
        eventType: 'EVALUATION_COMPLETED',
        payload: JSON.stringify({ rfqId, bidId, totalScore }),
        status: 'PENDING',
        correlationId: `EVAL_${evalId}`
      } as any);
    });

    // Audit Trail M02
    try {
      await AuditService.recordAuditLog({
        module: 'M10',
        action: 'EVALUATE_BID',
        entityType: 'SOURCING_EVALUATION',
        entityId: String(evalId),
        userId: user ? user.id : 1,
        username: user?.username || 'purchasing_evaluator',
        result: 'SUCCESS',
        metadata: {
          rfqId,
          bidId,
          totalScore,
          criteriaCount: computedScores.length
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during bid evaluation:', auditErr);
    }

    res.status(201).json({ success: true, evaluationId: evalId, totalScore, criteria: computedScores });
  } catch (err: any) {
    console.error('Error creating evaluation:', err);
    res.status(500).json({ error: 'Failed to create evaluation', detail: err.message });
  }
});

// ==========================================
// PHASE 6: MULTI-CRITERIA CONSENSUS EVALUATION ENGINE (M10 SOURCING x M11 SRM)
// ==========================================

router.post('/api/sourcing/rfqs/:id/consensus-evaluation', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const rfqIdOrCode = req.params.id;
  const { customWeights, roundNumber, idempotencyKey } = req.body;
  const user = (req as any).user;

  try {
    const isNum = !isNaN(Number(rfqIdOrCode));
    const rfqRows = isNum
      ? await db.select().from(srmRfqs).where(eq(srmRfqs.id, Number(rfqIdOrCode))).limit(1)
      : await db.select().from(srmRfqs).where(eq(srmRfqs.code, String(rfqIdOrCode))).limit(1);

    if (!rfqRows || rfqRows.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    const rfq = rfqRows[0];
    const rfqId = rfq.id;

    // Standardized Consensus Weights:
    // Commercial (Price): 40%, Technical (Quality): 30%, SLA (Delivery/OTIF): 20%, Compliance: 10%
    const weights = {
      commercial: Number(customWeights?.commercial ?? 0.40),
      technical: Number(customWeights?.technical ?? 0.30),
      sla: Number(customWeights?.sla ?? 0.20),
      compliance: Number(customWeights?.compliance ?? 0.10),
    };

    // Ensure weights sum to 1.0 (normalize if needed)
    const weightSum = weights.commercial + weights.technical + weights.sla + weights.compliance;
    if (weightSum > 0 && Math.abs(weightSum - 1.0) > 0.01) {
      weights.commercial = Number((weights.commercial / weightSum).toFixed(2));
      weights.technical = Number((weights.technical / weightSum).toFixed(2));
      weights.sla = Number((weights.sla / weightSum).toFixed(2));
      weights.compliance = Number((weights.compliance / weightSum).toFixed(2));
    }

    // Retrieve active bids for this RFQ
    const targetRound = Number(roundNumber) || rfq.currentRound;
    const allBids = await db.select().from(srmBids).where(eq(srmBids.rfqId, rfqId));
    const roundBids = allBids.filter(b => b.roundNumber === targetRound && b.status !== 'REVISED');
    const bidsToEvaluate = roundBids.length > 0 ? roundBids : allBids.filter(b => b.status !== 'REVISED');

    if (bidsToEvaluate.length === 0) {
      return res.status(400).json({ error: 'No active bids available to evaluate for this RFQ' });
    }

    const allSuppliers = await db.select().from(suppliers);
    const allBidItems = await db.select().from(srmBidItems);

    // 1. Determine min price and min lead time for normalization
    const bidPrices = bidsToEvaluate.map(b => Number(b.totalValue || 0)).filter(p => p > 0);
    const minPrice = bidPrices.length > 0 ? Math.min(...bidPrices) : 1;

    const bidLeadTimes = bidsToEvaluate.map(b => {
      const items = allBidItems.filter(bi => bi.bidId === b.id);
      return items.length > 0 ? Math.max(...items.map(i => i.leadTimeDays || 3)) : 3;
    });
    const minLeadTime = bidLeadTimes.length > 0 ? Math.min(...bidLeadTimes) : 1;

    // 2. Compute Consensus Scores per Bid
    const consensusResults = bidsToEvaluate.map(b => {
      const sup = allSuppliers.find(s => s.id === b.supplierId);
      const items = allBidItems.filter(bi => bi.bidId === b.id);
      const bidLeadTime = items.length > 0 ? Math.max(...items.map(i => i.leadTimeDays || 3)) : 3;

      // Extract M11 SRM Performance Metrics
      const m11 = extractSupplierScorecard(sup);

      // (A) Commercial / Price Score (40%): Inverse Price Normalization
      const bidTotal = Number(b.totalValue || 0);
      const commercialScore = bidTotal > 0
        ? Math.min(100, Math.round(((minPrice / bidTotal) * 100) * 100) / 100)
        : 100;

      // (B) Technical / Quality Score (30%): From M11 SRM Scorecard Quality Score
      const technicalScore = Math.min(100, Math.max(0, m11.qualityScoreNumeric || m11.compositeScore || 85));

      // (C) SLA / Delivery Score (20%): From M11 OTIF Rate (70%) + Lead Time Competitiveness (30%)
      const leadTimeRatioScore = minLeadTime > 0
        ? Math.min(100, Math.round((minLeadTime / Math.max(1, bidLeadTime)) * 100))
        : 100;
      const slaScore = Math.min(100, Math.round(((m11.otifRateNumeric * 0.70) + (leadTimeRatioScore * 0.30)) * 100) / 100);

      // (D) Compliance / Legal Score (10%): From M11 SRM Compliance Score
      const complianceScore = Math.min(100, Math.max(0, m11.complianceScoreNumeric || 100));

      // Weighted Consensus Total Score (0 - 100)
      const totalScore = Number((
        (commercialScore * weights.commercial) +
        (technicalScore * weights.technical) +
        (slaScore * weights.sla) +
        (complianceScore * weights.compliance)
      ).toFixed(2));

      return {
        bidId: b.id,
        supplierId: b.supplierId,
        supplierName: sup ? sup.name : 'Unknown',
        supplierCode: sup ? sup.code : '',
        roundNumber: b.roundNumber,
        totalValue: bidTotal,
        leadTimeDays: bidLeadTime,
        commercialScore,
        technicalScore,
        slaScore,
        complianceScore,
        totalScore,
        m11Scorecard: m11
      };
    });

    // 3. Sort by Consensus Total Score descending (ties broken by lowest price)
    consensusResults.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.totalValue - b.totalValue;
    });

    const rankedResults = consensusResults.map((r, idx) => ({
      ...r,
      ranking: idx + 1
    }));

    // 4. Transactionally persist into database
    await db.transaction(async (tx) => {
      for (const resItem of rankedResults) {
        const existingEval = await tx.select().from(sourcingEvaluations).where(
          and(eq(sourcingEvaluations.rfqId, rfqId), eq(sourcingEvaluations.bidId, resItem.bidId))
        ).limit(1);

        let evalId = 0;
        const evalNotes = `Chấm điểm đồng thuận ma trận đa tiêu chí (M10 Sourcing x M11 SRM Scorecards). Giá: ${resItem.commercialScore}, Kỹ thuật: ${resItem.technicalScore}, SLA/OTIF: ${resItem.slaScore}, Tuân thủ: ${resItem.complianceScore}.`;

        if (existingEval.length > 0) {
          evalId = existingEval[0].id;
          await tx.update(sourcingEvaluations).set({
            evaluatorId: user?.id || 1,
            status: 'COMPLETED',
            totalScore: resItem.totalScore,
            ranking: resItem.ranking,
            notes: evalNotes,
            updatedAt: new Date()
          } as any).where(eq(sourcingEvaluations.id, evalId));

          await tx.delete(sourcingEvaluationScores).where(eq(sourcingEvaluationScores.evaluationId, evalId));
        } else {
          const inserted = await tx.insert(sourcingEvaluations).values({
            rfqId,
            bidId: resItem.bidId,
            evaluatorId: user?.id || 1,
            status: 'COMPLETED',
            totalScore: resItem.totalScore,
            ranking: resItem.ranking,
            notes: evalNotes
          } as any).returning({ id: sourcingEvaluations.id });
          evalId = inserted[0].id;
        }

        // Insert standardized criteria
        const criteriaToInsert = [
          {
            criterionName: 'COMMERCIAL_PRICE',
            weight: weights.commercial,
            score: resItem.commercialScore,
            weightedScore: Number((resItem.commercialScore * weights.commercial).toFixed(2))
          },
          {
            criterionName: 'TECHNICAL_QUALITY',
            weight: weights.technical,
            score: resItem.technicalScore,
            weightedScore: Number((resItem.technicalScore * weights.technical).toFixed(2))
          },
          {
            criterionName: 'SLA_DELIVERY_OTIF',
            weight: weights.sla,
            score: resItem.slaScore,
            weightedScore: Number((resItem.slaScore * weights.sla).toFixed(2))
          },
          {
            criterionName: 'COMPLIANCE_LEGAL',
            weight: weights.compliance,
            score: resItem.complianceScore,
            weightedScore: Number((resItem.complianceScore * weights.compliance).toFixed(2))
          }
        ];

        for (const c of criteriaToInsert) {
          await tx.insert(sourcingEvaluationScores).values({
            evaluationId: evalId,
            criterionName: c.criterionName,
            weight: c.weight,
            score: c.score,
            weightedScore: c.weightedScore
          } as any);
        }
      }

      // Update RFQ status to EVALUATING if currently OPEN_BIDDING or PUBLISHED
      if (rfq.status === 'OPEN_BIDDING' || rfq.status === 'PUBLISHED') {
        await tx.update(srmRfqs).set({ status: 'EVALUATING' } as any).where(eq(srmRfqs.id, rfqId));
      }

      // Outbox Event for Governance & Audit Trail
      await tx.insert(outboxEvents).values({
        aggregateType: 'RFQ',
        aggregateId: String(rfqId),
        eventId: idempotencyKey || `consensus-eval-${rfqId}-${Date.now()}`,
        source: 'Sourcing_ConsensusEngine',
        eventType: 'CONSENSUS_EVALUATION_COMPLETED',
        payload: JSON.stringify({
          rfqId,
          rfqCode: rfq.code,
          evaluatedCount: rankedResults.length,
          topRankedSupplier: rankedResults[0]?.supplierName,
          topScore: rankedResults[0]?.totalScore,
          weights
        }),
        status: 'PENDING',
        correlationId: `CONSENSUS_EVAL_${rfqId}`
      } as any);
    });

    res.json({
      success: true,
      message: `Đã hoàn thành chấm điểm đồng thuận ma trận đa tiêu chí cho RFQ ${rfq.code} với dữ liệu SRM M11.`,
      rfqId,
      rfqCode: rfq.code,
      evaluatedRound: targetRound,
      weights,
      evaluationsCount: rankedResults.length,
      topRankedSupplier: rankedResults[0],
      matrix: rankedResults
    });
  } catch (err: any) {
    console.error('Error executing consensus evaluation:', err);
    res.status(500).json({ error: 'Failed to execute consensus evaluation', detail: err.message });
  }
});

// Alias for automated evaluation
router.post('/api/sourcing/rfqs/:id/auto-evaluate', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res, next) => {
  // Delegate to consensus evaluation handler
  req.url = `/api/sourcing/rfqs/${req.params.id}/consensus-evaluation`;
  router.handle(req, res, next);
});

// ==========================================
// PHASE 5: STANDARDIZED SIDE-BY-SIDE COMPARISON MATRIX API
// ==========================================

// RESTful route: GET /api/sourcing/rfqs/:id/comparison
router.get('/api/sourcing/rfqs/:id/comparison', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const rfqId = req.params.id;
  try {
    const result = await buildRfqComparison(rfqId);
    if (!result) {
      return res.status(404).json({ error: `RFQ ${rfqId} not found` });
    }
    res.json(result);
  } catch (err: any) {
    console.error('Error generating RFQ comparison:', err);
    res.status(500).json({ error: 'Failed to generate comparison matrix', detail: err.message });
  }
});

// Backward-compatible query route: GET /api/sourcing/comparison?rfqId=...
router.get('/api/sourcing/comparison', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { rfqId } = req.query;
  if (!rfqId) {
    return res.status(400).json({ error: 'Missing rfqId parameter' });
  }

  try {
    const result = await buildRfqComparison(String(rfqId));
    if (!result) {
      return res.status(404).json({ error: `RFQ ${rfqId} not found` });
    }
    // Return both standard format and legacy comparison array
    res.json({
      ...result,
      rfqId: Number(rfqId),
      comparison: result.comparison
    });
  } catch (err: any) {
    console.error('Error generating comparison:', err);
    res.status(500).json({ error: 'Failed to generate comparison', detail: err.message });
  }
});

// ==========================================
// PHASE 7: PRICE AGREEMENT BENCHMARK GUARD REPORT API
// ==========================================

router.get('/api/sourcing/rfqs/:id/bpa-benchmark', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const rfqId = req.params.id;
  try {
    const comparison = await buildRfqComparison(rfqId);
    if (!comparison) {
      return res.status(404).json({ error: `RFQ ${rfqId} not found` });
    }

    const benchmarks = comparison.comparison.map(c => ({
      bidId: c.bidId,
      supplierId: c.supplierId,
      supplierName: c.supplierName,
      supplierCode: c.supplierCode,
      ranking: c.ranking,
      offeredPrice: c.unitPrice,
      totalValue: c.totalValue,
      bpaBenchmark: c.bpaBenchmark
    }));

    const alerts = benchmarks.filter(b => b.bpaBenchmark?.isExceedingLimit);

    res.json({
      success: true,
      rfq: comparison.rfq,
      thresholdPercent: 10,
      totalBidsCount: benchmarks.length,
      alertsCount: alerts.length,
      hasAlerts: alerts.length > 0,
      topRankedSupplier: comparison.comparison[0] || null,
      topRankedHasBpaBreach: Boolean(comparison.comparison[0]?.bpaBenchmark?.isExceedingLimit),
      benchmarks
    });
  } catch (err: any) {
    console.error('Error fetching BPA benchmark report:', err);
    res.status(500).json({ error: 'Failed to fetch BPA benchmark report', detail: err.message });
  }
});

// ==========================================
// W2-D: AWARD DECISION API
// ==========================================

router.get('/api/sourcing/awards', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { rfqId } = req.query;
  try {
    const awards = await db.select().from(sourcingAwards);
    const lines = await db.select().from(sourcingAwardLines);
    const allSuppliers = await db.select().from(suppliers);
    const allRfqs = await db.select().from(srmRfqs);
    const allPkgs = await db.select().from(sourcingPackages);
    const allEvents = await db.select().from(outboxEvents).where(eq(outboxEvents.aggregateType, 'SOURCING_AWARD'));
    const allDmsDocs = await db.select().from(dmsDocuments);

    const enriched = awards.map(a => {
      const sup = allSuppliers.find(s => s.id === a.supplierId);
      const awardLines = lines.filter(l => l.awardId === a.id);
      const rfq = allRfqs.find(r => r.id === a.rfqId);
      const pkg = rfq?.packageId ? allPkgs.find(p => p.id === rfq.packageId) : null;
      const costCenterCode = pkg?.costCenter || 'CC-PROCUREMENT';
      const matrix = WorkflowMatrixEngine.evaluateMatrix(Number(a.totalAmount || 0));

      // Match delegated PO from outboxEvents
      const poEvt = allEvents.find(e => e.aggregateId === String(a.id) && (e.eventType === 'PO_DELEGATED_FROM_AWARD' || e.eventType === 'PO_GENERATED_FROM_AWARD'));
      let poCode: string | undefined = undefined;
      let poId: number | undefined = undefined;
      if (poEvt && poEvt.payload) {
        try {
          const parsed = JSON.parse(poEvt.payload);
          poCode = parsed.poCode || parsed.order?.id;
          poId = parsed.poId || parsed.order?.internalId;
        } catch {}
      }

      // Match DMS Vault archival
      const dmsDoc = allDmsDocs.find(d => d.refDocNo === a.awardNo);
      let dmsVault = undefined;
      if (dmsDoc) {
        dmsVault = {
          id: dmsDoc.id,
          docCode: dmsDoc.docCode,
          title: dmsDoc.title,
          sha256Hash: dmsDoc.sha256Hash,
          status: dmsDoc.status,
          storageTier: dmsDoc.storageTier,
          signedAt: dmsDoc.signedAt,
          signedBy: dmsDoc.signedBy
        };
      }

      return {
        ...a,
        supplierName: sup ? sup.name : 'Unknown',
        costCenter: costCenterCode,
        workflowMatrix: matrix,
        lines: awardLines,
        poCode,
        poId,
        dmsVault
      };
    });

    const filtered = rfqId ? enriched.filter(a => String(a.rfqId) === String(rfqId)) : enriched;
    res.json(filtered);
  } catch (err: any) {
    console.error('Error fetching awards:', err);
    res.status(500).json({ error: 'Failed to fetch awards' });
  }
});

router.post('/api/sourcing/awards', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { 
    rfqId, 
    bidId, 
    supplierId, 
    evaluationId, 
    items, 
    costCenter: reqCostCenter,
    bpaExemptionJustification, 
    budgetOverrideJustification,
    idempotencyKey 
  } = req.body;
  const user = (req as any).user;

  if (!rfqId || !bidId || !supplierId || !idempotencyKey || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Missing required award parameters' });
  }

  try {
    // Idempotency check
    const existing = await db.select().from(outboxEvents).where(eq(outboxEvents.eventId, idempotencyKey));
    if (existing.length > 0) {
      const ev = existing[0];
      return res.status(200).json({ replayed: true, awardId: ev.aggregateId });
    }

    // Retrieve RFQ and linked package for Cost Center resolution
    const rfqQuery = await db.select().from(srmRfqs).where(eq(srmRfqs.id, Number(rfqId))).limit(1);
    const rfq = rfqQuery[0];
    let costCenterCode = reqCostCenter;
    if (!costCenterCode && rfq?.packageId) {
      const pkgQuery = await db.select().from(sourcingPackages).where(eq(sourcingPackages.id, rfq.packageId)).limit(1);
      if (pkgQuery[0]?.costCenter) {
        costCenterCode = pkgQuery[0].costCenter;
      }
    }
    if (!costCenterCode) {
      costCenterCode = 'CC-PROCUREMENT';
    }

    let totalAmount = 0;
    items.forEach((it: any) => {
      totalAmount += Number(it.awardedQuantity || 0) * Number(it.awardedUnitPrice || 0);
    });

    // =========================================================================
    // PHASE 8: BUDGET GUARD & COST CENTER VALIDATION (M30 GENERAL LEDGER)
    // =========================================================================
    const budgetCheck = OrgBudgetService.checkBudget(costCenterCode, totalAmount);
    if (!budgetCheck.allowed && !budgetOverrideJustification) {
      return res.status(422).json({
        success: false,
        error: 'BUDGET_GUARD_EXCEEDED',
        message: budgetCheck.message,
        costCenter: budgetCheck.costCenter.code,
        costCenterName: budgetCheck.costCenter.name,
        availableBudget: budgetCheck.availableBudget,
        requestedAmount: totalAmount,
        deficit: budgetCheck.deficit,
        requiresOverride: true,
        help: 'Chặn cứng hành động phê duyệt trao thầu theo chính sách M30. Để tiếp tục, người có thẩm quyền phải bổ sung trường budgetOverrideJustification (giải trình ngoại lệ ngân sách).'
      });
    }

    // =========================================================================
    // PHASE 9: MULTI-TIER APPROVAL MATRIX (M28 GOVERNANCE MATRIX)
    // =========================================================================
    const workflowMatrix = WorkflowMatrixEngine.evaluateMatrix(totalAmount, 'SOURCING_AWARD', 'VND');
    // If multi-tier is required (> 500M VND), status is AWARD_PENDING awaiting escalated director/board sign-off
    const initialAwardStatus = workflowMatrix.requiresMultiTier ? 'AWARD_PENDING' : 'APPROVED';

    // Evaluate BPA Benchmark Guard for Awarded Supplier (M09 Integration)
    const supQuery = await db.select().from(suppliers).where(eq(suppliers.id, Number(supplierId))).limit(1);
    const awardedSupplier = supQuery[0];
    const bpaBenchmark = evaluateBpaBenchmark(
      awardedSupplier,
      items.map((it: any) => ({
        rfqItemId: Number(it.rfqLineId),
        offeredQuantity: Number(it.awardedQuantity),
        unitPrice: Number(it.awardedUnitPrice)
      })),
      Number(items[0]?.awardedUnitPrice || 0)
    );

    const awardNo = `AWARD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    let newAwardId = 0;

    await db.transaction(async (tx) => {
      const inserted = await tx.insert(sourcingAwards).values({
        awardNo,
        rfqId: Number(rfqId),
        bidId: Number(bidId),
        supplierId: Number(supplierId),
        evaluationId: evaluationId ? Number(evaluationId) : null,
        status: initialAwardStatus,
        totalAmount,
        currency: 'VND',
        approvedBy: user.id,
        approvedAt: initialAwardStatus === 'APPROVED' ? new Date() : null
      } as any).returning({ id: sourcingAwards.id });

      newAwardId = inserted[0].id;

      for (const it of items) {
        await tx.insert(sourcingAwardLines).values({
          awardId: newAwardId,
          rfqLineId: Number(it.rfqLineId),
          bidLineId: Number(it.bidLineId),
          awardedQuantity: Number(it.awardedQuantity),
          awardedUnitPrice: Number(it.awardedUnitPrice),
          awardedTotal: Number(it.awardedQuantity) * Number(it.awardedUnitPrice)
        } as any);
      }

      // Update RFQ status to AWARDED to enforce Immutability Guard
      await tx.update(srmRfqs).set({
        status: 'AWARDED',
        updatedAt: new Date()
      } as any).where(eq(srmRfqs.id, Number(rfqId)));

      // Commit Budget into M30 Cost Center tracking
      OrgBudgetService.commitBudget(costCenterCode, totalAmount);

      // Determine Event Type based on Guards
      let eventType = 'SOURCING_AWARD_APPROVED';
      if (workflowMatrix.requiresMultiTier) {
        eventType = 'SOURCING_AWARD_ESCALATED_MULTI_TIER';
      } else if (bpaBenchmark.isExceedingLimit) {
        eventType = 'SOURCING_AWARD_APPROVED_WITH_BPA_OVERRIDE';
      }

      // M10 -> M08/M28/M30 integration boundary outbox event
      await tx.insert(outboxEvents).values({
        aggregateType: 'SOURCING_AWARD',
        aggregateId: String(newAwardId),
        eventId: idempotencyKey,
        source: 'Sourcing',
        eventType,
        payload: JSON.stringify({ 
          awardNo, 
          rfqId, 
          supplierId, 
          costCenter: costCenterCode,
          totalAmount, 
          items,
          budgetCheck: {
            allowed: budgetCheck.allowed,
            costCenter: budgetCheck.costCenter.code,
            availableBudget: budgetCheck.availableBudget,
            deficit: budgetCheck.deficit,
            overrideJustification: budgetOverrideJustification || null
          },
          workflowMatrix,
          bpaBenchmark,
          bpaExemptionJustification: bpaExemptionJustification || null
        }),
        status: 'PENDING',
        correlationId: `AWARD_APPROVED_${newAwardId}`
      } as any);
    });

    // Audit Trail M02
    try {
      await AuditService.recordAuditLog({
        module: 'M10',
        action: 'CREATE_AWARD',
        entityType: 'SOURCING_AWARD',
        entityId: String(newAwardId),
        userId: user?.id || 1,
        username: user?.username || 'purchasing_agent',
        result: 'SUCCESS',
        metadata: {
          awardNo,
          rfqId,
          supplierId,
          costCenter: costCenterCode,
          totalAmount,
          status: initialAwardStatus,
          matrixTier: workflowMatrix.tier
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during award creation:', auditErr);
    }

    res.status(201).json({ 
      success: true, 
      awardNo, 
      awardId: newAwardId,
      status: initialAwardStatus,
      costCenter: costCenterCode,
      budgetCheck: {
        costCenter: budgetCheck.costCenter.code,
        availableBefore: budgetCheck.availableBudget,
        committedAmount: totalAmount,
        availableAfter: budgetCheck.availableBudget - totalAmount,
        overridden: !budgetCheck.allowed && !!budgetOverrideJustification
      },
      workflowMatrix,
      bpaBenchmark,
      bpaWarning: bpaBenchmark.isExceedingLimit ? bpaBenchmark.warningMessage : null,
      message: workflowMatrix.requiresMultiTier 
        ? `Đã tạo Quyết định Trao thầu #${awardNo} (Trạng thái: Chờ duyệt đa cấp M28 do giá trị vượt ${workflowMatrix.thresholdLimit.toLocaleString()} VNĐ)`
        : `Phê duyệt Quyết định Trao thầu #${awardNo} thành công (Trưởng phòng Mua sắm đã duyệt)`
    });
  } catch (err: any) {
    console.error('Error creating award:', err);
    res.status(500).json({ error: 'Failed to create award', detail: err.message });
  }
});

// =========================================================================
// PHASE 10: AWARD FINALIZATION & PO DELEGATION (RÀNG BUỘC BẮT BUỘC #1)
// =========================================================================
// Chuyển đổi trúng thầu Award -> Purchase Order: TUYỆT ĐỐI KHÔNG insert trực tiếp vào bảng purchase_orders.
// Gọi ủy quyền trực tiếp endpoint POST /api/purchase/orders của M08 với đầy đủ idempotencyKey.
router.post(['/api/sourcing/awards/:id/generate-po', '/api/sourcing/awards/:id/delegate-po'], requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const awardQuery = await db.select().from(sourcingAwards).where(eq(sourcingAwards.id, Number(id)));
    if (awardQuery.length === 0) {
      return res.status(404).json({ error: 'Award not found' });
    }
    const award = awardQuery[0];

    // Check if PO was already generated/delegated
    const existingPoEvents = await db.select().from(outboxEvents).where(
      and(
        eq(outboxEvents.aggregateType, 'SOURCING_AWARD'),
        eq(outboxEvents.aggregateId, String(award.id)),
        eq(outboxEvents.source, 'Sourcing')
      )
    );
    const existingPo = existingPoEvents.find(e => e.eventType === 'PO_DELEGATED_FROM_AWARD' || e.eventType === 'PO_GENERATED_FROM_AWARD');
    if (existingPo) {
      const payload = JSON.parse(existingPo.payload || '{}');
      return res.json({ 
        success: true, 
        alreadyExists: true, 
        poCode: payload.poCode || payload.order?.id, 
        poId: payload.poId || payload.order?.internalId,
        message: `Đơn hàng M08 PO mã ${payload.poCode || payload.order?.id} đã được ủy quyền trước đó.` 
      });
    }

    const awardLines = await db.select().from(sourcingAwardLines).where(eq(sourcingAwardLines.awardId, award.id));
    const rfqItems = await db.select().from(srmRfqItems).where(eq(srmRfqItems.rfqId, award.rfqId));
    
    // Construct line items mapped from RFQ lines
    const poItems = awardLines.map(line => {
      const rfqItem = rfqItems.find(ri => ri.id === line.rfqLineId);
      return {
        productId: rfqItem?.productId || 1,
        quantity: Math.max(1, Math.round(Number(line.awardedQuantity) || 1)),
        unitCost: Number(line.awardedUnitPrice) || 0
      };
    });

    if (poItems.length === 0) {
      poItems.push({
        productId: 1,
        quantity: 1,
        unitCost: Number(award.totalAmount) || 100000
      });
    }

    const delegationIdempotencyKey = `PO-DELEGATION-AWARD-${award.id}-${award.awardNo}-${Date.now()}`;
    const poPayload = {
      supplierId: award.supplierId,
      items: poItems,
      totalAmount: Number(award.totalAmount || 0),
      notes: `Khởi tạo ủy quyền từ Quyết định Trao thầu #${award.awardNo} (RFQ-${award.rfqId}) - Phân hệ M10 Strategic Sourcing`,
      expectedDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      idempotencyKey: delegationIdempotencyKey,
      sourceType: 'SOURCING_AWARD',
      sourceId: String(award.id),
      sourcingAwardNo: award.awardNo,
      rfqId: String(award.rfqId)
    };

    // DELEGATE TO M08 VIA AUTHORITATIVE /api/purchase-orders
    let delegatedPoCode = '';
    let delegatedPoId = 0;
    let m08OrderData: any = null;

    try {
      const authHeader = req.headers.authorization || '';
      const response = await fetch('http://localhost:3000/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(poPayload)
      });

      const resultData = await response.json();
      if (!response.ok) {
        throw new Error(resultData.error || 'Lỗi ủy quyền phát hành PO từ M08 API');
      }

      m08OrderData = resultData.order || resultData;
      delegatedPoCode = m08OrderData.id || m08OrderData.code || `PO-2026-${award.id}`;
      delegatedPoId = m08OrderData.internalId || m08OrderData.id || award.id;
    } catch (delegationErr: any) {
      console.error('M08 PO Delegation fetch error:', delegationErr);
      throw new Error(`Ủy quyền phát hành đơn hàng sang M08 thất bại: ${delegationErr.message}`);
    }

    // Update Award status and record transactional outbox event
    await db.transaction(async (tx) => {
      await tx.update(sourcingAwards).set({ 
        status: 'AWARDED',
        updatedAt: new Date()
      } as any).where(eq(sourcingAwards.id, award.id));

      await tx.insert(outboxEvents).values({
        aggregateType: 'SOURCING_AWARD',
        aggregateId: String(award.id),
        eventId: delegationIdempotencyKey,
        source: 'Sourcing',
        eventType: 'PO_DELEGATED_FROM_AWARD',
        payload: JSON.stringify({
          awardId: award.id,
          awardNo: award.awardNo,
          poId: delegatedPoId,
          poCode: delegatedPoCode,
          supplierId: award.supplierId,
          totalAmount: award.totalAmount,
          order: m08OrderData,
          delegationEndpoint: '/api/purchase-orders'
        }),
        status: 'PENDING',
        correlationId: `PO_SRC_${delegatedPoId}`
      } as any);
    });

    // Audit Trail M02
    try {
      await AuditService.recordAuditLog({
        module: 'M10',
        action: 'DELEGATE_PO_M08',
        entityType: 'SOURCING_AWARD',
        entityId: String(award.id),
        userId: user?.id || 1,
        username: user?.username || 'purchasing_officer',
        result: 'SUCCESS',
        metadata: {
          awardNo: award.awardNo,
          poCode: delegatedPoCode,
          poId: delegatedPoId,
          totalAmount: award.totalAmount,
          supplierId: award.supplierId,
          delegationEndpoint: '/api/purchase/orders',
          idempotencyKey: delegationIdempotencyKey
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during PO delegation:', auditErr);
    }

    res.status(201).json({ 
      success: true, 
      delegated: true,
      poCode: delegatedPoCode, 
      poId: delegatedPoId,
      order: m08OrderData,
      message: `Đã ủy quyền thành công sang phân hệ Mua hàng M08 để khởi tạo Purchase Order #${delegatedPoCode}.` 
    });
  } catch (err: any) {
    console.error('Error delegating PO from award:', err);
    res.status(500).json({ error: 'Failed to delegate Purchase Order to M08', detail: err.message });
  }
});

// =========================================================================
// PHASE 11: DMS SECURE VAULT ARCHIVAL (M29 INTEGRATION) & AUDIT TRAIL (M02)
// =========================================================================

// POST /api/sourcing/awards/:id/seal-dms - Niêm phong số Quyết định Trao thầu vào M29 Vault
router.post('/api/sourcing/awards/:id/seal-dms', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const awardQuery = await db.select().from(sourcingAwards).where(eq(sourcingAwards.id, Number(id))).limit(1);
    if (awardQuery.length === 0) {
      return res.status(404).json({ error: 'Award not found' });
    }
    const award = awardQuery[0];

    const lines = await db.select().from(sourcingAwardLines).where(eq(sourcingAwardLines.awardId, award.id));
    const rfqQuery = await db.select().from(srmRfqs).where(eq(srmRfqs.id, award.rfqId)).limit(1);
    const supQuery = await db.select().from(suppliers).where(eq(suppliers.id, award.supplierId)).limit(1);

    const dossierPayload = {
      awardNo: award.awardNo,
      rfqCode: rfqQuery[0]?.code || `RFQ-${award.rfqId}`,
      rfqTitle: rfqQuery[0]?.title || '',
      supplierName: supQuery[0]?.name || `Supplier #${award.supplierId}`,
      totalAmount: award.totalAmount,
      lines,
      status: award.status,
      sealedAt: new Date().toISOString(),
      sealedBy: user ? `${user.username || 'User'} (${user.role || 'Procurement'})` : 'Procurement Officer'
    };

    // Direct M29 Vault Archival Call
    const vaultRes = await fetch('http://localhost:3000/api/dms/vault', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify({
        title: `Biên Bản Quyết Định Trao Thầu Số Hóa - ${award.awardNo}`,
        category: 'AWARD_MINUTES',
        categoryName: 'Biên Bản & Quyết Định Trao Thầu',
        fileSize: '3.2 MB',
        format: 'PDF-A/XML',
        linkedModule: 'M10 Strategic Sourcing',
        refDocNo: award.awardNo,
        securityLevel: 'CONFIDENTIAL',
        storageTier: 'COLD_GLACIER',
        metadata: dossierPayload,
        sealedBy: dossierPayload.sealedBy
      })
    });

    const vaultData = await vaultRes.json();
    if (!vaultRes.ok) {
      throw new Error(vaultData.error || 'Lỗi lưu trữ tài liệu vào DMS Vault');
    }

    // Audit Trail M02
    try {
      await AuditService.recordAuditLog({
        module: 'M10',
        action: 'ARCHIVE_AWARD_DMS_VAULT',
        entityType: 'SOURCING_AWARD',
        entityId: String(award.id),
        userId: user?.id || 1,
        username: user?.username || 'system',
        result: 'SUCCESS',
        metadata: {
          awardNo: award.awardNo,
          dmsDocCode: vaultData.document?.docCode,
          sha256Hash: vaultData.sha256Hash,
          storageTier: vaultData.vaultTier
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during award seal:', auditErr);
    }

    res.json({
      success: true,
      awardNo: award.awardNo,
      dmsDocument: vaultData.document,
      sha256Hash: vaultData.sha256Hash,
      message: `Đã niêm phong số Quyết định Trao thầu ${award.awardNo} vào Kho tài liệu M29 Vault (Mã băm: ${vaultData.sha256Hash?.slice(0, 16)}...).`
    });
  } catch (err: any) {
    console.error('Error sealing award dossier in DMS:', err);
    res.status(500).json({ error: 'Failed to seal award in DMS Vault', detail: err.message });
  }
});

// POST /api/sourcing/comparison/:rfqId/seal-dms - Niêm phong Bảng So Sánh Báo Giá & Biên Bản Mở Thầu
router.post('/api/sourcing/comparison/:rfqId/seal-dms', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { rfqId } = req.params;
  const user = (req as any).user;

  try {
    const rfqQuery = await db.select().from(srmRfqs).where(eq(srmRfqs.id, Number(rfqId))).limit(1);
    if (rfqQuery.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    const rfq = rfqQuery[0];
    const bids = await db.select().from(srmBids).where(eq(srmBids.rfqId, rfq.id));

    const dossierPayload = {
      rfqCode: rfq.code,
      rfqTitle: rfq.title,
      totalBidsReceived: bids.length,
      bids: bids.map(b => ({ id: b.id, supplierId: b.supplierId, totalValue: b.totalValue, status: b.status })),
      sealedAt: new Date().toISOString(),
      sealedBy: user ? `${user.username || 'User'} (${user.role || 'Procurement'})` : 'Tổ Trưởng Mở Thầu & Đánh Giá'
    };

    const vaultRes = await fetch('http://localhost:3000/api/dms/vault', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify({
        title: `Bảng So Sánh Báo Giá & Biên Bản Mở Thầu - ${rfq.code}`,
        category: 'BID_COMPARISON',
        categoryName: 'Biên Bản Mở Thầu & So Sánh Báo Giá',
        fileSize: '4.1 MB',
        format: 'PDF-A/XML',
        linkedModule: 'M10 Strategic Sourcing',
        refDocNo: rfq.code,
        securityLevel: 'CONFIDENTIAL',
        storageTier: 'COLD_GLACIER',
        metadata: dossierPayload,
        sealedBy: dossierPayload.sealedBy
      })
    });

    const vaultData = await vaultRes.json();
    if (!vaultRes.ok) {
      throw new Error(vaultData.error || 'Lỗi lưu trữ bảng so sánh vào DMS Vault');
    }

    // Audit Trail M02
    try {
      await AuditService.recordAuditLog({
        module: 'M10',
        action: 'ARCHIVE_COMPARISON_DMS_VAULT',
        entityType: 'SRM_RFQ',
        entityId: String(rfq.id),
        userId: user?.id || 1,
        username: user?.username || 'system',
        result: 'SUCCESS',
        metadata: {
          rfqCode: rfq.code,
          dmsDocCode: vaultData.document?.docCode,
          sha256Hash: vaultData.sha256Hash,
          storageTier: vaultData.vaultTier
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during comparison seal:', auditErr);
    }

    res.json({
      success: true,
      rfqCode: rfq.code,
      dmsDocument: vaultData.document,
      sha256Hash: vaultData.sha256Hash,
      message: `Đã niêm phong số Bảng so sánh báo giá gói thầu ${rfq.code} vào Kho tài liệu M29 Vault.`
    });
  } catch (err: any) {
    console.error('Error sealing comparison dossier in DMS:', err);
    res.status(500).json({ error: 'Failed to seal comparison in DMS Vault', detail: err.message });
  }
});

// POST /api/sourcing/rfqs/:id/seal-dms - Niêm phong Hồ Sơ Mời Thầu & Quy Cách Kỹ Thuật
router.post('/api/sourcing/rfqs/:id/seal-dms', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const isNum = !isNaN(Number(id));
    const rfqQuery = isNum 
      ? await db.select().from(srmRfqs).where(eq(srmRfqs.id, Number(id))).limit(1)
      : await db.select().from(srmRfqs).where(eq(srmRfqs.code, id)).limit(1);

    if (rfqQuery.length === 0) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    const rfq = rfqQuery[0];
    const items = await db.select().from(srmRfqItems).where(eq(srmRfqItems.rfqId, rfq.id));
    const suppliersList = await db.select().from(srmRfqSuppliers).where(eq(srmRfqSuppliers.rfqId, rfq.id));

    const dossierPayload = {
      rfqCode: rfq.code,
      rfqTitle: rfq.title,
      items,
      invitedSuppliersCount: suppliersList.length,
      sealedAt: new Date().toISOString(),
      sealedBy: user ? `${user.username || 'User'} (${user.role || 'Procurement'})` : 'Chuyên Viên Mua Sắm Chiến Lược'
    };

    const vaultRes = await fetch('http://localhost:3000/api/dms/vault', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify({
        title: `Hồ Sơ Yêu Cầu Báo Giá & Quy Cách - ${rfq.code}`,
        category: 'RFQ_DOSSIER',
        categoryName: 'Hồ Sơ Yêu Cầu Báo Giá (RFQ)',
        fileSize: '2.8 MB',
        format: 'PDF-A/XML',
        linkedModule: 'M10 Strategic Sourcing',
        refDocNo: rfq.code,
        securityLevel: 'CONFIDENTIAL',
        storageTier: 'COLD_GLACIER',
        metadata: dossierPayload,
        sealedBy: dossierPayload.sealedBy
      })
    });

    const vaultData = await vaultRes.json();
    if (!vaultRes.ok) {
      throw new Error(vaultData.error || 'Lỗi lưu trữ hồ sơ RFQ vào DMS Vault');
    }

    // Audit Trail M02
    try {
      await AuditService.recordAuditLog({
        module: 'M10',
        action: 'ARCHIVE_RFQ_DMS_VAULT',
        entityType: 'SRM_RFQ',
        entityId: String(rfq.id),
        userId: user?.id || 1,
        username: user?.username || 'system',
        result: 'SUCCESS',
        metadata: {
          rfqCode: rfq.code,
          dmsDocCode: vaultData.document?.docCode,
          sha256Hash: vaultData.sha256Hash,
          storageTier: vaultData.vaultTier
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during RFQ seal:', auditErr);
    }

    res.json({
      success: true,
      rfqCode: rfq.code,
      dmsDocument: vaultData.document,
      sha256Hash: vaultData.sha256Hash,
      message: `Đã niêm phong số Hồ sơ mời thầu ${rfq.code} vào Kho tài liệu M29 Vault.`
    });
  } catch (err: any) {
    console.error('Error sealing RFQ dossier in DMS:', err);
    res.status(500).json({ error: 'Failed to seal RFQ in DMS Vault', detail: err.message });
  }
});

export const sourcingRouter = router;
