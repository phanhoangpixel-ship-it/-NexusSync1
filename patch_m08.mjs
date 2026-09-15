import fs from 'fs';
import crypto from 'crypto';

let content = fs.readFileSync('src/routes/purchases.routes.ts', 'utf-8');

// Need to add `crypto` import if not present.
if (!content.includes("import crypto")) {
  content = content.replace('import { Router } from "express";', 'import { Router } from "express";\nimport crypto from "crypto";');
}

// 1. PO Creation Endpoint
content = content.replace(
  /\/\/ POST create a new Purchase Order(.|\n)*?(?=\/\/ POST Approve Purchase Order)/,
`// POST create a new Purchase Order
router.post("/api/purchase/orders", async (req, res) => {
  try {
    const { supplierId, items = [], totalAmount, notes, expectedDate, idempotencyKey } = req.body;
    if (!supplierId) {
      return res.status(400).json({ error: "supplierId là bắt buộc." });
    }
    
    // FA-019 REQUIREMENT 1 - KEY REQUIRED
    if (!idempotencyKey) {
      return res.status(400).json({ error: "idempotencyKey is required for this operation." });
    }

    // FA-020 Hardcoded Identity removal
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Missing authenticated actor" });
    }

    // Generate payload fingerprint
    const payloadFingerprint = crypto.createHash('sha256').update(JSON.stringify({ supplierId, items, totalAmount, notes, expectedDate })).digest('hex');

    // FA-019 REQUIREMENT 2 & 3 - Same key + Same Payload
    const existingEvent = await db.select().from(schema.outboxEvents)
      .where(eq(schema.outboxEvents.eventId, idempotencyKey)).limit(1);
    
    if (existingEvent.length > 0) {
      const evt = existingEvent[0];
      if (evt.correlationId !== payloadFingerprint) {
        return res.status(409).json({ error: "IDEMPOTENCY_CONFLICT: same key with different payload" });
      }
      // Replay authoritative result (which we stored in causationId for this demo, or we can fetch the PO by aggregateId)
      const poObj = await db.select().from(schema.purchaseOrders)
        .where(eq(schema.purchaseOrders.id, Number(evt.aggregateId))).limit(1);
      
      if (poObj.length > 0) {
        return res.status(200).json({
          success: true,
          message: "Tạo đơn mua hàng thành công (idempotent)",
          order: {
            id: poObj[0].code,
            internalId: poObj[0].id,
            status: poObj[0].status,
            totalAmount: poObj[0].totalAmount
          }
        });
      }
    }

    let createdPo;
    try {
      // Wrap in tx for safety and outbox insert (Requirement 6 - Transaction Safety)
      await db.transaction(async (tx) => {
        // Generate unique code
        const existingCount = (await tx.select().from(schema.purchaseOrders).all()).length;
        const poCode = \`PO-2026-\${String(existingCount + 1).padStart(3, '0')}\`;

        let computedTotal = Number(totalAmount) || 0;
        if (computedTotal === 0 && Array.isArray(items) && items.length > 0) {
          computedTotal = items.reduce((sum: number, it: any) => sum + ((Number(it.quantity) || 1) * (Number(it.unitCost) || 0)), 0);
        }

        const created = await tx.insert(schema.purchaseOrders).values({
          code: poCode,
          supplierId: Number(supplierId),
          status: 'PENDING_APPROVAL',
          paymentStatus: 'UNPAID',
          amountPaid: 0,
          totalAmount: computedTotal,
          expectedDate: expectedDate ? new Date(expectedDate) : new Date(Date.now() + 7 * 86400000),
          createdBy: userId
        } as any).returning();
        
        const newPo = created[0];
        createdPo = newPo;

        if (Array.isArray(items) && items.length > 0) {
          for (const it of items) {
            await tx.insert(schema.purchaseOrderItems).values({
              poId: newPo.id,
              productId: Number(it.productId) || 1,
              quantity: Number(it.quantity) || 10,
              unitCost: Number(it.unitCost) || 100000,
              receivedQuantity: 0
            } as any);
          }
        } else {
          await tx.insert(schema.purchaseOrderItems).values({
            poId: newPo.id,
            productId: 1,
            quantity: 10,
            unitCost: Math.round(computedTotal / 10) || 1000000,
            receivedQuantity: 0
          } as any);
        }
        
        // Outbox idempotency event logic
        await tx.insert(schema.outboxEvents).values({
          eventId: idempotencyKey,
          eventType: 'PurchaseOrderCreated',
          aggregateType: 'PurchaseOrder',
          aggregateId: String(newPo.id),
          source: 'Purchase',
          actorId: String(userId),
          correlationId: payloadFingerprint
        } as any);
      });
    } catch (txErr: any) {
      if (txErr.message && txErr.message.includes("UNIQUE constraint failed")) {
         // Handle concurrent idempotency insert (Requirement 4)
         // Another transaction just inserted this exact idempotencyKey
         const existingEvt = await db.select().from(schema.outboxEvents)
           .where(eq(schema.outboxEvents.eventId, idempotencyKey)).limit(1);
         if (existingEvt.length > 0) {
           const evt = existingEvt[0];
           if (evt.correlationId !== payloadFingerprint) {
             return res.status(409).json({ error: "IDEMPOTENCY_CONFLICT: same key with different payload" });
           }
           const poObj = await db.select().from(schema.purchaseOrders)
             .where(eq(schema.purchaseOrders.id, Number(evt.aggregateId))).limit(1);
           if (poObj.length > 0) {
             return res.status(200).json({
               success: true,
               message: "Tạo đơn mua hàng thành công (idempotent)",
               order: {
                 id: poObj[0].code,
                 internalId: poObj[0].id,
                 status: poObj[0].status,
                 totalAmount: poObj[0].totalAmount
               }
             });
           }
         }
      }
      throw txErr;
    }

    res.status(201).json({
      success: true,
      message: "Tạo đơn mua hàng thành công",
      order: {
        id: createdPo.code,
        internalId: createdPo.id,
        status: createdPo.status,
        totalAmount: createdPo.totalAmount
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

`
);

// 2. Receive Goods Endpoint
content = content.replace(
  /\/\/ POST Receive Goods for Purchase Order \(GR\)(.|\n)*?(?=\/\/ POST Cancel\/Reject Purchase Order)/,
`// POST Receive Goods for Purchase Order (GR)
router.post("/api/purchase/orders/:id/receive", async (req, res) => {
  try {
    const rawId = req.params.id;
    const lookup = String(rawId);
    
    // FA-020 Hardcoded Identity removal
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Missing authenticated actor" });
    }
    
    const { warehouseId, idempotencyKey } = req.body;
    
    if (!warehouseId) {
      return res.status(400).json({ error: "warehouseId is required." });
    }
    
    // FA-019 REQUIREMENT 1 - KEY REQUIRED
    if (!idempotencyKey) {
      return res.status(400).json({ error: "idempotencyKey is required for this operation." });
    }

    // Generate payload fingerprint
    const payloadFingerprint = crypto.createHash('sha256').update(JSON.stringify({ warehouseId })).digest('hex');
    
    // FA-019 REQUIREMENT 2 & 3 - Same key + Same Payload
    const existingEvent = await db.select().from(schema.outboxEvents)
      .where(eq(schema.outboxEvents.eventId, idempotencyKey)).limit(1);
    
    if (existingEvent.length > 0) {
      const evt = existingEvent[0];
      if (evt.correlationId !== payloadFingerprint) {
        return res.status(409).json({ error: "IDEMPOTENCY_CONFLICT: same key with different payload" });
      }
      return res.status(200).json({
        success: true,
        message: "Đã xử lý (idempotent)",
        status: 'COMPLETED'
      });
    }

    const existing = await db.select().from(schema.purchaseOrders)
      .where(sql\`\${schema.purchaseOrders.code} = \${lookup} OR \${schema.purchaseOrders.id} = \${Number(lookup) || 0}\`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: \`Không tìm thấy đơn PO với mã \${lookup}\` });
    }
    const po = existing[0];
    
    if (po.status === 'CANCELLED' || po.status === 'REJECTED') {
      return res.status(400).json({ error: \`Không thể nhận hàng cho PO ở trạng thái \${po.status}\` });
    }

    const items = await db.select().from(schema.purchaseOrderItems).where(eq(schema.purchaseOrderItems.poId, po.id));

    try {
      // M08-FA-001 Receiving Atomicity
      await db.transaction(async (tx) => {
        // M08-FA-002 Goods Receipt
        const existingGrCount = (await tx.select().from(schema.goodsReceipts).all()).length;
        const grCode = \`GR-2026-\${String(existingGrCount + 1).padStart(3, '0')}\`;
        
        const createdGr = await tx.insert(schema.goodsReceipts).values({
          code: grCode,
          poId: po.id,
          warehouseId: Number(warehouseId),
          status: 'COMPLETED',
          createdBy: userId,
          notes: \`Nhập kho từ PO \${po.code}\`
        } as any).returning();
        
        const gr = createdGr[0];
        
        let anyReceived = false;

        for (const item of items) {
          const qtyToReceive = item.quantity - (item.receivedQuantity || 0);
          if (qtyToReceive > 0) {
            anyReceived = true;
            // M08-FA-008 Error Swallowing: no .catch(), let it throw to rollback transaction
            await InventoryService.postTransaction(tx as any, {
              productId: item.productId,
              warehouseId: Number(warehouseId),
              type: 'GOODS_RECEIPT',
              referenceNo: gr.code,
              quantity: qtyToReceive,
              notes: \`Nhập kho từ đơn PO \${po.code}\`,
              userId: userId
            });

            await tx.insert(schema.goodsReceiptItems).values({
              grId: gr.id,
              poItemId: item.id,
              productId: item.productId,
              quantity: qtyToReceive,
              baseQuantity: qtyToReceive
            } as any);

            await tx.update(schema.purchaseOrderItems)
              .set({ receivedQuantity: item.quantity } as any)
              .where(eq(schema.purchaseOrderItems.id, item.id));
          }
        }
        
        if (anyReceived) {
          await tx.update(schema.purchaseOrders)
            .set({ status: 'COMPLETED' } as any)
            .where(eq(schema.purchaseOrders.id, po.id));
            
          await tx.insert(schema.outboxEvents).values({
            eventId: idempotencyKey,
            eventType: 'GoodsReceived',
            aggregateType: 'PurchaseOrder',
            aggregateId: String(po.id),
            source: 'Purchase',
            actorId: String(userId),
            correlationId: payloadFingerprint
          } as any);
        } else {
          throw new Error("Không có mặt hàng nào cần nhận thêm.");
        }
      });
    } catch (txErr: any) {
      if (txErr.message && txErr.message.includes("UNIQUE constraint failed")) {
         // Concurrent Request (Requirement 4)
         const existingEvt = await db.select().from(schema.outboxEvents)
           .where(eq(schema.outboxEvents.eventId, idempotencyKey)).limit(1);
         if (existingEvt.length > 0) {
           const evt = existingEvt[0];
           if (evt.correlationId !== payloadFingerprint) {
             return res.status(409).json({ error: "IDEMPOTENCY_CONFLICT: same key with different payload" });
           }
           return res.status(200).json({
             success: true,
             message: "Đã xử lý (idempotent)",
             status: 'COMPLETED'
           });
         }
      }
      throw txErr;
    }

    res.json({
      success: true,
      message: \`Đã nhập kho thành công đơn PO \${po.code} và tạo phiếu nhập.\`,
      status: 'COMPLETED'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

`
);

fs.writeFileSync('src/routes/purchases.routes.ts', content);
