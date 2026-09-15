import { Router } from 'express';
import { db } from '../db';
import { 
  srmRfqs, srmRfqItems, srmRfqSuppliers, srmBids, srmBidItems, 
  sourcingEvaluations, sourcingEvaluationScores, sourcingAwards, sourcingAwardLines,
  purchaseOrders, purchaseOrderItems, products,
  suppliers, outboxEvents 
} from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET /api/sourcing/rfqs
router.get('/api/sourcing/rfqs', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  try {
    const rfqs = await db.select().from(srmRfqs).orderBy(desc(srmRfqs.createdAt));
    
    // Map to the format the UI expects for minimal disruption
    const mapped = rfqs.map(r => ({
      id: r.code,          // UI uses code as ID string
      dbId: r.id,          // real ID for updates
      title: r.title,
      category: 'Uncategorized',
      deadline: r.deadline ? r.deadline.toISOString().split('T')[0] : 'N/A',
      bidsCount: 0,
      status: r.status,
      budgetEstimate: 'N/A'
    }));

    res.json(mapped);
  } catch (err: any) {
    console.error('Error fetching rfqs:', err);
    res.status(500).json({ error: 'Failed to fetch RFQs' });
  }
});

// POST /api/sourcing/rfqs
router.post('/api/sourcing/rfqs', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { title, deadline, targetQuantity, productId, idempotencyKey } = req.body;
  const user = (req as any).user;

  if (!title) {
    return res.status(400).json({ error: 'Missing title' });
  }
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Missing idempotencyKey' });
  }

  try {
    // Check Idempotency
    const existingEvents = await db.select().from(outboxEvents).where(eq(outboxEvents.eventId, idempotencyKey));
    if (existingEvents.length > 0) {
      const event = existingEvents[0];
      const payload = JSON.parse(event.payload || '{}');
      if (payload.title === title) {
        return res.status(200).json({ replayed: true, rfqId: event.aggregateId });
      } else {
        return res.status(409).json({ error: 'IDEMPOTENCY_CONFLICT' });
      }
    }

    const rfqCode = `RFQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    await db.transaction(async (tx) => {
      const inserted = await tx.insert(srmRfqs).values({
        code: rfqCode,
        title,
        status: 'OPEN_BIDDING',
        deadline: deadline ? new Date(deadline) : new Date(),
        createdBy: user.id
      } as any).returning({ id: srmRfqs.id });

      const rfqId = inserted[0].id;

      if (productId && targetQuantity) {
        await tx.insert(srmRfqItems).values({
          rfqId,
          productId: Number(productId),
          targetQuantity: Number(targetQuantity)
        } as any);
      }

      await tx.insert(outboxEvents).values({
        aggregateType: 'RFQ',
        aggregateId: String(rfqId),
        eventId: idempotencyKey, source: 'Sourcing', eventType: 'RFQ_CREATED',
        payload: JSON.stringify({ title, deadline, targetQuantity, productId }),
        status: 'PENDING',
        correlationId: `CREATE_RFQ_${rfqId}`
      } as any);
    });

    res.status(201).json({ success: true, code: rfqCode });
  } catch (err: any) {
    console.error('Error creating RFQ:', err);
    res.status(500).json({ error: 'Transaction failed', detail: err.message });
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
        taxId: sup?.taxId || '',
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

// POST /api/sourcing/rfqs/:id/invite
router.post('/api/sourcing/rfqs/:id/invite', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
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
// W2-A: SUPPLIER BIDS API
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
      return {
        ...b,
        supplierName: sup ? sup.name : 'Unknown Supplier',
        supplierCode: sup ? sup.code : '',
        items
      };
    });

    const filtered = rfqId ? enriched.filter(b => String(b.rfqId) === String(rfqId) || String(b.rfqId) === String(rfqId)) : enriched;
    res.json(filtered);
  } catch (err: any) {
    console.error('Error fetching bids:', err);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

router.post('/api/sourcing/bids', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { rfqId, supplierId, items, idempotencyKey, currency = 'VND' } = req.body;
  const user = (req as any).user;

  if (!rfqId || !supplierId || !idempotencyKey || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required bid parameters or items' });
  }

  try {
    // Idempotency check
    const existing = await db.select().from(outboxEvents).where(eq(outboxEvents.eventId, idempotencyKey));
    if (existing.length > 0) {
      const ev = existing[0];
      const payload = JSON.parse(ev.payload || '{}');
      if (payload.rfqId === rfqId && payload.supplierId === supplierId) {
        return res.status(200).json({ replayed: true, bidId: ev.aggregateId });
      } else {
        return res.status(409).json({ error: 'IDEMPOTENCY_CONFLICT' });
      }
    }

    let totalValue = 0;
    items.forEach((item: any) => {
      totalValue += Number(item.unitPrice || 0) * Number(item.offeredQuantity || 0);
    });

    let newBidId = 0;

    await db.transaction(async (tx) => {
      const insertedBid = await tx.insert(srmBids).values({
        rfqId: Number(rfqId),
        supplierId: Number(supplierId),
        status: 'SUBMITTED',
        totalValue,
        submittedAt: new Date()
      } as any).returning({ id: srmBids.id });

      newBidId = insertedBid[0].id;

      for (const item of items) {
        await tx.insert(srmBidItems).values({
          bidId: newBidId,
          rfqItemId: Number(item.rfqItemId),
          unitPrice: Number(item.unitPrice),
          offeredQuantity: Number(item.offeredQuantity),
          leadTimeDays: Number(item.leadTimeDays || 3)
        } as any);
      }

      await tx.insert(outboxEvents).values({
        aggregateType: 'BID',
        aggregateId: String(newBidId),
        eventId: idempotencyKey,
        source: 'Sourcing',
        eventType: 'BID_SUBMITTED',
        payload: JSON.stringify({ rfqId, supplierId, totalValue, items }),
        status: 'PENDING',
        correlationId: `SUBMIT_BID_${newBidId}`
      } as any);
    });

    res.status(201).json({ success: true, bidId: newBidId });
  } catch (err: any) {
    console.error('Error creating bid:', err);
    res.status(500).json({ error: 'Transaction failed', detail: err.message });
  }
});

// ==========================================
// W2-B: BID EVALUATION API
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
  const { rfqId, bidId, criteriaScores, notes, idempotencyKey } = req.body;
  const user = (req as any).user;

  if (!rfqId || !bidId || !criteriaScores || !Array.isArray(criteriaScores) || !idempotencyKey) {
    return res.status(400).json({ error: 'Missing evaluation parameters' });
  }

  try {
    // Idempotency check
    const existing = await db.select().from(outboxEvents).where(eq(outboxEvents.eventId, idempotencyKey));
    if (existing.length > 0) {
      const ev = existing[0];
      return res.status(200).json({ replayed: true, evaluationId: ev.aggregateId });
    }

    // Server-authoritative calculation
    let totalScore = 0;
    const computedScores = criteriaScores.map((c: any) => {
      const weight = Number(c.weight || 0); // e.g. 0.4 for 40%
      const score = Number(c.score || 0);   // e.g. 85 out of 100
      const weightedScore = score * weight;
      totalScore += weightedScore;
      return {
        criterionName: c.criterionName || 'GENERAL',
        weight,
        score,
        weightedScore
      };
    });

    let evalId = 0;

    await db.transaction(async (tx) => {
      const inserted = await tx.insert(sourcingEvaluations).values({
        rfqId: Number(rfqId),
        bidId: Number(bidId),
        evaluatorId: user.id,
        status: 'COMPLETED',
        totalScore,
        ranking: 1, // Will be re-ranked if needed
        notes: notes || ''
      } as any).returning({ id: sourcingEvaluations.id });

      evalId = inserted[0].id;

      for (const cs of computedScores) {
        await tx.insert(sourcingEvaluationScores).values({
          evaluationId: evalId,
          criterionName: cs.criterionName,
          weight: cs.weight,
          score: cs.score,
          weightedScore: cs.weightedScore
        } as any);
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

    res.status(201).json({ success: true, evaluationId: evalId, totalScore });
  } catch (err: any) {
    console.error('Error creating evaluation:', err);
    res.status(500).json({ error: 'Failed to create evaluation', detail: err.message });
  }
});

// ==========================================
// W2-C: BID COMPARISON API
// ==========================================

router.get('/api/sourcing/comparison', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { rfqId } = req.query;
  if (!rfqId) {
    return res.status(400).json({ error: 'Missing rfqId parameter' });
  }

  try {
    const bids = await db.select().from(srmBids).where(eq(srmBids.rfqId, Number(rfqId) || 0));
    const allSuppliers = await db.select().from(suppliers);
    const allItems = await db.select().from(srmBidItems);
    const evals = await db.select().from(sourcingEvaluations).where(eq(sourcingEvaluations.rfqId, Number(rfqId) || 0));

    const comparisonList = bids.map(b => {
      const sup = allSuppliers.find(s => s.id === b.supplierId);
      const items = allItems.filter(i => i.bidId === b.id);
      const evalRecord = evals.find(e => e.bidId === b.id);

      return {
        bidId: b.id,
        supplierId: b.supplierId,
        supplierName: sup ? sup.name : 'Unknown',
        supplierCode: sup ? sup.code : '',
        currency: 'VND',
        totalValue: b.totalValue || 0,
        items,
        totalScore: evalRecord ? evalRecord.totalScore : 0,
        evaluationStatus: evalRecord ? evalRecord.status : 'PENDING',
        ranking: evalRecord ? evalRecord.ranking : 99
      };
    });

    // Sort by totalScore desc (server authoritative ranking)
    comparisonList.sort((a, b) => b.totalScore - a.totalScore);
    comparisonList.forEach((c, idx) => { c.ranking = idx + 1; });

    res.json({ rfqId, comparison: comparisonList });
  } catch (err: any) {
    console.error('Error generating comparison:', err);
    res.status(500).json({ error: 'Failed to generate comparison' });
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

    const enriched = awards.map(a => {
      const sup = allSuppliers.find(s => s.id === a.supplierId);
      const awardLines = lines.filter(l => l.awardId === a.id);
      return {
        ...a,
        supplierName: sup ? sup.name : 'Unknown',
        lines: awardLines
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
  const { rfqId, bidId, supplierId, evaluationId, items, idempotencyKey } = req.body;
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

    let totalAmount = 0;
    items.forEach((it: any) => {
      totalAmount += Number(it.awardedQuantity || 0) * Number(it.awardedUnitPrice || 0);
    });

    const awardNo = `AWARD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    let newAwardId = 0;

    await db.transaction(async (tx) => {
      const inserted = await tx.insert(sourcingAwards).values({
        awardNo,
        rfqId: Number(rfqId),
        bidId: Number(bidId),
        supplierId: Number(supplierId),
        evaluationId: evaluationId ? Number(evaluationId) : null,
        status: 'APPROVED',
        totalAmount,
        currency: 'VND',
        approvedBy: user.id,
        approvedAt: new Date()
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

      // M10 -> M08 integration boundary outbox event
      await tx.insert(outboxEvents).values({
        aggregateType: 'SOURCING_AWARD',
        aggregateId: String(newAwardId),
        eventId: idempotencyKey,
        source: 'Sourcing',
        eventType: 'SOURCING_AWARD_APPROVED',
        payload: JSON.stringify({ awardNo, rfqId, supplierId, totalAmount, items }),
        status: 'PENDING',
        correlationId: `AWARD_APPROVED_${newAwardId}`
      } as any);
    });

    res.status(201).json({ success: true, awardNo, awardId: newAwardId });
  } catch (err: any) {
    console.error('Error creating award:', err);
    res.status(500).json({ error: 'Failed to create award', detail: err.message });
  }
});

// POST /api/sourcing/awards/:id/generate-po - Generate M08 Purchase Order from Award
router.post('/api/sourcing/awards/:id/generate-po', requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const awardQuery = await db.select().from(sourcingAwards).where(eq(sourcingAwards.id, Number(id)));
    if (awardQuery.length === 0) {
      return res.status(404).json({ error: 'Award not found' });
    }
    const award = awardQuery[0];

    // Check if PO was already generated
    const existingPoEvents = await db.select().from(outboxEvents).where(
      and(
        eq(outboxEvents.aggregateType, 'SOURCING_AWARD'),
        eq(outboxEvents.aggregateId, String(award.id)),
        eq(outboxEvents.eventType, 'PO_GENERATED_FROM_AWARD')
      )
    );
    if (existingPoEvents.length > 0) {
      const payload = JSON.parse(existingPoEvents[0].payload || '{}');
      return res.json({ success: true, alreadyExists: true, poCode: payload.poCode, poId: payload.poId });
    }

    const awardLines = await db.select().from(sourcingAwardLines).where(eq(sourcingAwardLines.awardId, award.id));
    const rfqItems = await db.select().from(srmRfqItems).where(eq(srmRfqItems.rfqId, award.rfqId));
    
    // Find product ID (from first rfq item or default 1)
    const productId = rfqItems.length > 0 ? rfqItems[0].productId : 1;

    const poCode = `PO-SRC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let newPoId = 0;
    await db.transaction(async (tx) => {
      // 1. Create Purchase Order in M08
      const insertedPo = await tx.insert(purchaseOrders).values({
        code: poCode,
        supplierId: award.supplierId,
        status: 'DRAFT',
        paymentStatus: 'UNPAID',
        amountPaid: 0,
        totalAmount: award.totalAmount || 0,
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // default 7 days lead
        createdAt: new Date(),
        createdBy: user?.id || 1
      } as any).returning({ id: purchaseOrders.id });

      newPoId = insertedPo[0].id;

      // 2. Create Purchase Order Items
      if (awardLines.length > 0) {
        for (const line of awardLines) {
          await tx.insert(purchaseOrderItems).values({
            poId: newPoId,
            productId,
            quantity: Math.round(line.awardedQuantity || 1),
            unitCost: line.awardedUnitPrice || 0,
            receivedQuantity: 0
          } as any);
        }
      } else {
        await tx.insert(purchaseOrderItems).values({
          poId: newPoId,
          productId,
          quantity: 1,
          unitCost: award.totalAmount || 0,
          receivedQuantity: 0
        } as any);
      }

      // 3. Update Award status to AWARDED
      await tx.update(sourcingAwards).set({ 
        status: 'AWARDED',
        updatedAt: new Date()
      } as any).where(eq(sourcingAwards.id, award.id));

      // 4. Record transactional outbox event
      await tx.insert(outboxEvents).values({
        aggregateType: 'SOURCING_AWARD',
        aggregateId: String(award.id),
        eventId: `EVT-PO-GEN-${Date.now()}`,
        source: 'Sourcing',
        eventType: 'PO_GENERATED_FROM_AWARD',
        payload: JSON.stringify({
          awardId: award.id,
          awardNo: award.awardNo,
          poId: newPoId,
          poCode,
          supplierId: award.supplierId,
          totalAmount: award.totalAmount
        }),
        status: 'PENDING',
        correlationId: `PO_SRC_${newPoId}`
      } as any);
    });

    res.status(201).json({ success: true, poCode, poId: newPoId });
  } catch (err: any) {
    console.error('Error generating PO from award:', err);
    res.status(500).json({ error: 'Failed to generate Purchase Order', detail: err.message });
  }
});

export const sourcingRouter = router;
