async function findOrCreateOrder(lookupKey: string | number) {
  if (!lookupKey) return null;
  const existingOrders = await db.select().from(schema.salesOrders)
    .where(sql`${schema.salesOrders.code} = ${String(lookupKey)} OR ${schema.salesOrders.id} = ${Number(lookupKey) || 0}`)
    .limit(1);
  if (existingOrders.length > 0) {
    return existingOrders[0];
  }
  return null;
}
import { Router } from "express";
import { client, db, recreateDatabaseClient } from "../../db/index";
import * as schema from "../../db/schema";
import { StockAdjustmentService } from "../../engines/stockAdjustmentService";
import { WorkspaceAggregationService } from "../../engines/WorkspaceAggregationService";
import { InventoryService } from "../../engines/inventoryService";
import { accountingEngine } from "../../engines/accountingEngine";
import { costingEngine } from "../../engines/costingEngine";
import { UnifiedPipelineEngine } from "../../engines/unifiedPipelineEngine";
import { BankReconciliationEngine } from "../../engines/bankReconciliationEngine";
import { PricingService } from "../../engines/pricingService";
import { CashMovementService } from "../../engines/shiftEngine";
import { SalesEngine } from "../services/SalesEngine";
import { eq, desc, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const router = Router();



// GET all sales orders
router.get(["/api/sales", "/api/sales/orders"], async (req, res) => {
  try {
    let orders = await db.select().from(schema.salesOrders).orderBy(desc(schema.salesOrders.createdAt)).all();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sales/pricing/calculate-discount - Calculate dynamic discount matrix
router.post("/api/sales/pricing/calculate-discount", async (req, res) => {
  try {
    const {
      unitPrice = 0,
      quantity = 1,
      costBasis,
      customerId,
      customerTier,
      paymentTerm = "NET30",
      promoCode,
      minMarginPercent = 15
    } = req.body;

    let resolvedTier = customerTier || "STANDARD";
    if (customerId) {
      const cust = await db.select().from(schema.customers).where(eq(schema.customers.id, Number(customerId))).limit(1).all();
      if (cust.length > 0) {
        resolvedTier = (cust[0] as any).customerTier || (cust[0] as any).groupName || "ENTERPRISE";
      }
    }

    if (costBasis === undefined || costBasis === null || isNaN(Number(costBasis)) || Number(costBasis) <= 0) {
      return res.status(400).json({
        success: false,
        error: "ERR_COST_BASIS_REQUIRED: costBasis là tham số bắt buộc và phải là số dương (> 0) để tính toán ma trận chiết khấu động."
      });
    }

    const result = PricingService.calculateDynamicDiscount({
      unitPrice: Number(unitPrice) || 0,
      quantity: Number(quantity) || 1,
      costBasis: Number(costBasis),
      customerTier: resolvedTier,
      paymentTerm,
      promoCode,
      minMarginPercent: Number(minMarginPercent) || 15
    });

    res.json({
      success: true,
      resolvedTier,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sales/pricing/resolve-price - Resolve price for a product using M41 Waterfall Engine
router.post("/api/sales/pricing/resolve-price", async (req, res) => {
  try {
    const { productId, customerId, priceListId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }
    const resolved = await PricingService.resolveUnitPrice({
      productId: Number(productId),
      customerId: customerId ? Number(customerId) : undefined,
      priceListId: priceListId ? Number(priceListId) : undefined,
      quantity: Number(quantity) || 1
    });
    res.json({
      success: true,
      ...resolved
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sales/pricing/resolve-batch - Resolve prices for multiple products
router.post("/api/sales/pricing/resolve-batch", async (req, res) => {
  try {
    const { items = [], customerId, priceListId } = req.body;
    const results = await Promise.all(
      items.map(async (item: any) => {
        const resolved = await PricingService.resolveUnitPrice({
          productId: Number(item.productId),
          customerId: customerId ? Number(customerId) : undefined,
          priceListId: priceListId ? Number(priceListId) : undefined,
          quantity: Number(item.quantity) || 1
        });
        return {
          productId: item.productId,
          ...resolved
        };
      })
    );
    res.json({
      success: true,
      results
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create sales order with real DB persistence and stock reservation (Delegated to ONE SALES ENGINE)
router.post(["/api/sales", "/api/sales/orders"], async (req, res) => {
  try {
    const {
      customerId,
      customerName = 'Khách hàng',
      branchId = 1,
      warehouseId = 1,
      items = [],
      shippingAddress,
      paymentMethod = "TRANSFER",
      requiresVatInvoice = false,
      vatDetails = null,
      notes = "",
      channel = 'B2B',
      idempotencyKey
    } = req.body;
    
    const userId = 1;

    const result = await SalesEngine.createOrder({
      channel: channel,
      source: "GENERIC_API",
      customerId: typeof customerId === "number" ? customerId : null,
      customerName,
      branchId: Number(branchId) || 1,
      warehouseId: Number(warehouseId) || 1,
      paymentIntent: {
        method: paymentMethod
      },
      fulfillmentIntent: {
        type: "RESERVATION",
        shippingAddress
      },
      items: items.map((it: any) => ({
        productId: Number(it.id || it.productId || 1),
        sku: it.sku,
        name: it.name,
        quantity: Number(it.qty || it.quantity || 1),
        price: Number(it.price || it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || it.discount || 0)
      })),
      requiresVatInvoice,
      vatDetails,
      notes,
      idempotencyKey,
      userId
    });
    
    res.status(201).json({
      success: true,
      message: `Tạo thành công đơn bán hàng ${result.orderRef}`,
      order: {
         id: result.orderId,
         code: result.orderRef,
         status: result.status,
         finalAmount: (result as any).grandTotal
      },
      ...result
    });
  } catch (err: any) {
    console.error("Generic Order Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET Omnichannel unified orders timeline list
router.get("/api/sales/omnichannel", async (req, res) => {
  try {
    let orders = await db.select().from(schema.salesOrders).orderBy(desc(schema.salesOrders.createdAt)).all();

    // Query real COGS records per sales order from authoritative cogs_transactions (Single Writer)
    const allCogs = await db.select({
      salesOrderId: schema.cogsTransactions.salesOrderId,
      totalCogs: schema.cogsTransactions.totalCogs
    }).from(schema.cogsTransactions).all();

    const orderCogsMap = new Map<number, number>();
    for (const c of allCogs) {
      if (c.salesOrderId) {
        orderCogsMap.set(c.salesOrderId, (orderCogsMap.get(c.salesOrderId) || 0) + (c.totalCogs || 0));
      }
    }

    const customersList = await db.select().from(schema.customers).all();
    const customerMap = new Map<number, any>();
    customersList.forEach(c => customerMap.set(c.id, c));

    const enriched = orders.map(ord => {
      let metadata: any = {};
      try {
        if (ord.notes && ord.notes.startsWith("{")) {
          metadata = JSON.parse(ord.notes);
        }
      } catch (e) {}

      const channel = metadata.channel || (ord.code.startsWith("POS-") ? "COUNTER" : "ONLINE");
      const fulfillmentStatus = metadata.fulfillmentStatus || (channel === "COUNTER" ? "COMPLETED" : (ord.status === "COMPLETED" ? "COMPLETED" : "RESERVED"));
      const fulfillmentType = metadata.fulfillmentType || (channel === "COUNTER" ? "COUNTER_HANDOVER" : "WAREHOUSE_SHIPMENT");
      const customerObj = ord.customerId ? customerMap.get(ord.customerId) : null;
      const customerName = customerObj ? customerObj.name : (metadata.customerName || "Khách lẻ vãng lai (Walk-in)");
      const hasCogsRecord = orderCogsMap.has(ord.id) || (metadata.cogsAmount !== undefined && metadata.cogsAmount !== null);
      const cogsVal = orderCogsMap.has(ord.id) ? orderCogsMap.get(ord.id)! : (metadata.cogsAmount ?? null);
      const cogsStatus = hasCogsRecord ? 'COMPUTED' : 'PENDING';
      const authoritativeCogs = hasCogsRecord ? cogsVal : null;

      return {
        id: ord.id,
        orderId: ord.code,
        channel,
        source: metadata.source || (channel === "COUNTER" ? "POS_TERMINAL" : "WEBSITE"),
        externalOrderId: metadata.externalOrderId || null,
        customerId: ord.customerId,
        customerName,
        createdAt: ord.createdAt ? new Date(ord.createdAt).toISOString().replace("T", " ").slice(0, 19) : new Date().toISOString().replace("T", " ").slice(0, 19),
        totalAmount: ord.finalAmount || ord.totalAmount || 0,
        subtotal: ord.totalAmount || 0,
        taxAmount: ord.taxAmount || 0,
        discountAmount: ord.discountAmount || 0,
        paymentStatus: ord.paymentStatus || (channel === "COUNTER" ? "PAID" : "UNPAID"),
        paymentMethod: metadata.paymentMethod || (channel === "COUNTER" ? "CASH" : "TRANSFER"),
        fulfillmentStatus,
        fulfillmentType,
        customerReceived: metadata.customerReceived || (channel === "COUNTER" || fulfillmentStatus === "COMPLETED"),
        deliverySuccess: metadata.deliverySuccess || (channel === "COUNTER" || fulfillmentStatus === "COMPLETED"),
        deliveryPartner: metadata.deliveryPartner || "Nội bộ / Shopee Xpress",
        deliveryAddress: metadata.deliveryAddress || (customerObj?.address || "Giao tại quầy"),
        inventoryPosted: channel === "COUNTER" || fulfillmentStatus === "COMPLETED",
        inventoryRef: metadata.inventoryRef || (channel === "COUNTER" || fulfillmentStatus === "COMPLETED" ? `INV-OUT-${ord.code.replace(/[^0-9]/g, "").slice(-4)}` : null),
        costingComputed: hasCogsRecord,
        cogsStatus,
        cogsAmount: authoritativeCogs,
        glPosted: channel === "COUNTER" || fulfillmentStatus === "COMPLETED",
        glRef: metadata.glRef || (channel === "COUNTER" || fulfillmentStatus === "COMPLETED" ? `JE-${ord.code.replace(/[^0-9]/g, "").slice(-4)}` : null),
        invoiceRef: (channel === "COUNTER" || fulfillmentStatus === "COMPLETED") ? `INV-${ord.code}` : (metadata.vatDetails?.invoiceRef || null),
        paymentRef: metadata.lastPaymentRef || ((channel === "COUNTER" || fulfillmentStatus === "COMPLETED" || ord.paymentStatus === "PAID") ? `PAY-${ord.code}` : null),
        fulfillmentRef: `FUL-${ord.code}`,
        costingRef: (channel === "COUNTER" || fulfillmentStatus === "COMPLETED") ? `CST-${ord.code}` : null,
        auditRef: `AUD-${ord.code}`,
        warehouseId: ord.warehouseId || 1,
        warehouseName: ord.warehouseId === 2 ? "Kho Phụ Long Biên (WH-02)" : "Kho Tổng Miền Bắc (WH-01)",
        requiresVatInvoice: metadata.requiresVatInvoice || false,
        vatDetails: metadata.vatDetails || null,
        rmas: metadata.rmas || [],
        auditLogged: true,
        biSynced: channel === "COUNTER" || fulfillmentStatus === "COMPLETED",
        items: metadata.items || [
          { sku: "PRD-001", name: "Sản phẩm thương mại", quantity: 1, unitPrice: ord.totalAmount || 0, price: ord.totalAmount || 0 }
        ]
      };
    });

    res.json(enriched);
  } catch (err: any) {
    console.error("Omnichannel list error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sales/pos - Counter POS checkout (Delegated to ONE SALES ENGINE)
router.post("/api/sales/pos", async (req, res) => {
  try {
    const {
      items,
      customerId,
      customerName = "Khách lẻ vãng lai (Walk-in)",
      branchId = 1,
      warehouseId = 1,
      paymentMethod = "CASH",
      requiresVatInvoice = false,
      vatDetails = null,
      idempotencyKey
    } = req.body;
    
    const userId = 1;
    
    const result = await SalesEngine.createOrder({
      channel: "POS",
      source: "POS_TERMINAL",
      customerId: typeof customerId === "number" ? customerId : null,
      customerName,
      branchId: Number(branchId) || 1,
      warehouseId: Number(warehouseId) || 1,
      paymentIntent: {
        method: paymentMethod
      },
      fulfillmentIntent: {
        type: "IMMEDIATE"
      },
      items: items.map((it: any) => ({
        productId: Number(it.id || it.productId),
        sku: it.sku,
        name: it.name,
        quantity: Number(it.quantity || 1),
        price: Number(it.price || it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || it.discount || 0),
        locationId: it.locationId || null,
        lotId: it.lotId || null,
        serials: it.serials || []
      })),
      requiresVatInvoice,
      vatDetails,
      idempotencyKey,
      userId
    });
    
    // Maintain POS return format
    res.json({
        ...result,
        pdfPath: `/invoices/Invoice_${result.orderRef}.pdf`,
        pdfUrl: `/invoices/Invoice_${result.orderRef}.pdf`,
    });
  } catch (err: any) {
    console.error("POS Checkout Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales/omnichannel/create - Omnichannel/POS Checkout alias
router.post("/api/sales/omnichannel/create", async (req, res) => {
  try {
    const {
      items,
      customerId,
      customerName = "Khách lẻ vãng lai (Walk-in)",
      branchId = 1,
      warehouseId = 1,
      paymentMethods = [],
      requiresVatInvoice = false,
      vatDetails = null,
      idempotencyKey,
      shiftId
    } = req.body;
    
    const primaryPaymentMethod = paymentMethods && paymentMethods.length > 0 ? paymentMethods[0].method : "CASH";
    const userId = 1;
    
    const result = await SalesEngine.createOrder({
      channel: "POS_RETAIL",
      source: "POS_TERMINAL",
      customerId: typeof customerId === "number" ? customerId : null,
      customerName,
      branchId: Number(branchId) || 1,
      warehouseId: Number(warehouseId) || 1,
      paymentIntent: {
        method: primaryPaymentMethod,
        splits: paymentMethods
      },
      fulfillmentIntent: {
        type: "IMMEDIATE"
      },
      items: (items || []).map((it: any) => ({
        productId: Number(it.id || it.productId),
        sku: it.sku,
        name: it.name,
        quantity: Number(it.quantity || it.qty || 1),
        price: Number(it.price || it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || it.discount || 0),
        locationId: it.locationId || null,
        lotId: it.lotId || null,
        serials: it.serials || []
      })),
      requiresVatInvoice,
      vatDetails,
      idempotencyKey: idempotencyKey || `POS-${Date.now()}`,
      userId
    });
    
    res.json({
        ...result,
        pdfPath: `/invoices/Invoice_${result.orderRef}.pdf`,
        pdfUrl: `/invoices/Invoice_${result.orderRef}.pdf`,
    });
  } catch (err: any) {
    console.error("Omnichannel POS Checkout Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales/online - Create Online/Marketplace Order (Delegated to ONE SALES ENGINE)
router.post("/api/sales/online", async (req, res) => {
  try {
    const {
      source = "WEBSITE",
      externalOrderId = null,
      idempotencyKey = null,
      channel = "ONLINE",
      items = [],
      customerId,
      customerName = "Khách hàng Trực tuyến",
      customerType = "REGISTERED",
      guestPhone = null,
      guestEmail = null,
      shippingAddress = null,
      deliveryAddress = "Số 88 Cầu Giấy, Hà Nội",
      billingAddress = null,
      deliveryPartner = "Giao Hàng Tiết Kiệm (GHTK)",
      warehouseId = 1,
      paymentMethod = "TRANSFER",
      notes = "",
      requiresVatInvoice = false,
      vatDetails = null
    } = req.body;
    
    const userId = 1;
    
    const result = await SalesEngine.createOrder({
      channel: channel,
      source: source,
      externalOrderId,
      customerId: typeof customerId === "number" ? customerId : null,
      customerName,
      customerType,
      warehouseId: Number(warehouseId) || 1,
      paymentIntent: {
        method: paymentMethod
      },
      fulfillmentIntent: {
        type: "RESERVATION",
        deliveryPartner,
        shippingAddress: shippingAddress || deliveryAddress
      },
      items: items.map((it: any) => ({
        productId: Number(it.id || it.productId),
        sku: it.sku,
        name: it.name,
        quantity: Number(it.quantity || 1),
        price: Number(it.price || it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || it.discount || 0)
      })),
      requiresVatInvoice,
      vatDetails,
      notes,
      idempotencyKey,
      userId
    });
    
    res.json(result);
  } catch (err: any) {
    console.error("Online Order Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Defines valid transitions for online orders per the Sales Engine architecture
const VALID_ONLINE_TRANSITIONS: Record<string, string[]> = {
  "DRAFT": ["CONFIRMED", "CANCELLED"],
  "PENDING": ["CONFIRMED", "CANCELLED", "REJECTED"],
  "RESERVED": ["CONFIRMED", "ALLOCATED", "CANCELLED", "ON_HOLD"],
  "CONFIRMED": ["ALLOCATED", "CANCELLED", "ON_HOLD"],
  "ALLOCATED": ["FULFILLING", "CANCELLED", "ON_HOLD"],
  "FULFILLING": ["FULFILLED", "PARTIALLY_FULFILLED", "ON_HOLD", "CANCELLED"],
  "PARTIALLY_FULFILLED": ["FULFILLED", "CANCELLED", "COMPLETED"],
  "FULFILLED": ["COMPLETED", "CANCELLED"],
  "ON_HOLD": ["CONFIRMED", "ALLOCATED", "FULFILLING", "CANCELLED"],
  "COMPLETED": [], // Terminal state, unless reversed by RMA
  "CANCELLED": [], // Terminal state
  "REJECTED": []   // Terminal state
};

// POST /api/sales/fulfillment/transition - Transition fulfillment status with strict Completion Gate & State Machine
router.post("/api/sales/fulfillment/transition", async (req, res) => {
  try {
    const { orderNumber, orderId: rawOrderId, targetStatus, customerReceived = false, deliverySuccess = false } = req.body;
    const lookupKey = orderNumber || rawOrderId;
    const userId = 1;

    if (!lookupKey || !targetStatus) {
      return res.status(400).json({ success: false, error: "Thiếu thông tin orderNumber hoặc targetStatus." });
    }

    // Find order by code or id using findOrCreateOrder
    const order = await findOrCreateOrder(lookupKey);
    if (!order) {
      return res.status(404).json({ success: false, error: "Không tìm thấy đơn hàng trong hệ thống Sales Engine." });
    }

    let metadata: any = {};
    try {
      if (order.notes && order.notes.startsWith("{")) {
        metadata = JSON.parse(order.notes);
      }
    } catch (e) {}

    const currentStatus = metadata.fulfillmentStatus || order.status || "PENDING";

    // 1. STATE MACHINE TRANSITION VALIDATION (Only applicable for ONLINE orders or custom transitions)
    const allowedTargets = VALID_ONLINE_TRANSITIONS[currentStatus] || [];
    if (!allowedTargets.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: `Chuyển đổi trạng thái không hợp lệ: Không thể chuyển từ [${currentStatus}] sang [${targetStatus}]. Các trạng thái cho phép: ${allowedTargets.length > 0 ? allowedTargets.join(", ") : "Không có (trạng thái kết thúc)"}.`
      });
    }

    // 2. SALES COMPLETION GATE ENFORCEMENT:
    // Online Order ≠ Completed Sale until fulfillment succeeds and customer received = true.
    if (targetStatus === "COMPLETED") {
      if (!customerReceived || !deliverySuccess) {
        return res.status(400).json({
          success: false,
          error: "Sales Completion Gate: Đơn hàng Online chỉ hoàn tất giao dịch (COMPLETED SALE) khi và chỉ khi xác nhận Khách hàng đã nhận (Customer Received = TRUE) & Giao hàng thành công (Delivery = SUCCESS)."
        });
      }
    }

    const updatedMetadata = {
      ...metadata,
      fulfillmentStatus: targetStatus,
      customerReceived: targetStatus === "COMPLETED" ? true : (customerReceived || metadata.customerReceived),
      deliverySuccess: targetStatus === "COMPLETED" ? true : (deliverySuccess || metadata.deliverySuccess),
    };

    let glRef = metadata.glRef || `JE-${order.code.replace(/[^0-9]/g, "").slice(-4)}`;
    let inventoryRef = metadata.inventoryRef || `INV-OUT-${order.code.replace(/[^0-9]/g, "").slice(-4)}`;
    let totalCogs = metadata.cogsAmount || 0;

    await db.transaction(async (tx) => {
      // CASE A: CANCELLED from RESERVED -> RELEASE RESERVATION via InventoryService
      if (targetStatus === "CANCELLED" && (currentStatus === "RESERVED" || currentStatus === "CONFIRMED" || currentStatus === "PENDING")) {
        if (currentStatus === "RESERVED") {
          const orderItems = await tx.select().from(schema.salesOrderItems).where(eq(schema.salesOrderItems.orderId, order.id)).all();
          for (const it of orderItems) {
            await InventoryService.releaseReservation(tx, {
              productId: it.productId,
              warehouseId: order.warehouseId,
              quantity: it.quantity,
              referenceNo: order.code,
              userId,
              notes: `Order Cancelled - Release Reservation ${order.code}`
            });
          }
        }
      }

      // CASE B: RETURNED from DELIVERY_FAILED -> RELEASE RESERVATION via InventoryService
      if (targetStatus === "RETURNED") {
        const orderItems = await tx.select().from(schema.salesOrderItems).where(eq(schema.salesOrderItems.orderId, order.id)).all();
        for (const it of orderItems) {
          await InventoryService.releaseReservation(tx, {
            productId: it.productId,
            warehouseId: order.warehouseId,
            quantity: it.quantity,
            referenceNo: order.code,
            userId,
            notes: `Delivery Returned - Release Reservation ${order.code}`
          });
        }
      }

      // CASE C: If completing, trigger: INVENTORY ISSUE -> COGS -> AR / PAYMENT -> VAT INVOICE -> SALES COMPLETED
      if (targetStatus === "COMPLETED" && order.status !== "COMPLETED") {
        const orderItems = await tx.select().from(schema.salesOrderItems).where(eq(schema.salesOrderItems.orderId, order.id)).all();
        
        // 1. INVENTORY ISSUE via single writer path (InventoryService.postTransaction with deductReserved: true)
        // INVARIANT: Physical ↓, Reserved ↓, Available = Physical - Reserved
        for (const it of orderItems) {
          await InventoryService.postTransaction(tx, {
            productId: it.productId,
            warehouseId: order.warehouseId,
            type: "SALE",
            referenceNo: order.code,
            quantity: -it.quantity,
            deductReserved: true,
            notes: `Fulfillment Completed - Online Issue ${order.code}`,
            userId
          });
        }

        // 2. COGS via Costing Engine (Single-Writer Authority)
        totalCogs = 0;
        for (const it of orderItems) {
          try {
            let costRes: any = null;
            if (typeof costingEngine?.calculateIssue === "function") {
              costRes = await costingEngine.calculateIssue({
                productId: it.productId,
                warehouseId: order.warehouseId,
                quantity: it.quantity,
                createdBy: userId
              }, tx);
            } else if (typeof costingEngine?.calculateIssueCost === "function") {
              costRes = await costingEngine.calculateIssueCost({
                productId: it.productId,
                warehouseId: order.warehouseId,
                quantity: it.quantity,
                createdBy: userId
              }, tx);
            }
            totalCogs += (costRes?.totalCost || 0);
          } catch (costErr: any) {
            if (process.env.FEATURE_STRICT_COSTING_VALIDATION === 'true') {
              throw new Error(`ERR_COSTING_LAYER_DEPLETED: Không thể hoàn tất đơn hàng ${order.code} do thiếu tầng chi phí cho sản phẩm #${it.productId}: ${costErr?.message || costErr}`);
            }
            // Strict flag = false: Đọc fallback từ cost_price của sản phẩm thật, ghi log cảnh báo
            const [pRow] = await tx.select({ costPrice: schema.products.costPrice }).from(schema.products).where(eq(schema.products.id, it.productId)).limit(1);
            const fallbackUnitCost = pRow?.costPrice || 0;
            console.warn(`[sales.routes WARN] Thiếu tầng chi phí cho SKU #${it.productId}. Áp dụng fallback cost_price = ${fallbackUnitCost} ₫`);
            totalCogs += (fallbackUnitCost * it.quantity);
          }
        }
        updatedMetadata.cogsAmount = totalCogs;
        updatedMetadata.glRef = glRef;
        updatedMetadata.inventoryRef = inventoryRef;

        // 3. AR / PAYMENT & GL POSTING
        const debitAccount = metadata.paymentMethod === "CASH" ? "1111" : (metadata.paymentMethod === "COD" ? "1111" : (metadata.paymentMethod === "TRANSFER" ? "1121" : "1311"));
        
        // Revenue GL
        await accountingEngine.postJournal({
          sourceModule: "SALES_ONLINE_FULFILLMENT",
          sourceDocumentType: "SALES_ORDER",
          sourceDocumentId: order.id,
          sourceReferenceNo: order.code,
          debitAccount,
          creditAccount: "5111",
          amount: order.totalAmount || 0,
          description: `Doanh thu đơn hàng online hoàn tất giao ${order.code}`,
          branchId: 1,
          userId,
        }, tx);

        // Output VAT GL
        if ((order.taxAmount || 0) > 0) {
          await accountingEngine.postJournal({
            sourceModule: "SALES_ONLINE_FULFILLMENT",
            sourceDocumentType: "SALES_ORDER",
            sourceDocumentId: order.id,
            sourceReferenceNo: order.code,
            debitAccount,
            creditAccount: "33311",
            amount: order.taxAmount,
            description: `Thuế GTGT đầu ra đơn online hoàn tất giao ${order.code}`,
            branchId: 1,
            userId,
          }, tx);
        }

        // COGS GL
        if (totalCogs > 0) {
          await accountingEngine.postJournal({
            sourceModule: "SALES_ONLINE_FULFILLMENT",
            sourceDocumentType: "SALES_ORDER",
            sourceDocumentId: order.id,
            sourceReferenceNo: order.code,
            debitAccount: "632",
            creditAccount: "1561",
            amount: totalCogs,
            description: `Giá vốn COGS đơn hàng online hoàn tất giao ${order.code}`,
            branchId: 1,
            userId,
          }, tx);
        }

        // Record/Update Payment record
        await tx.insert(schema.payments).values({
          orderId: order.id,
          paymentType: "IN",
          paymentMethod: metadata.paymentMethod === "COD" ? "CASH" : (metadata.paymentMethod === "CARD" ? "CREDIT_CARD" : "BANK_TRANSFER"),
          amount: order.finalAmount || order.totalAmount || 0,
          referenceNo: `PAY-${order.code}`,
          status: "SUCCESS",
          notes: `Thanh toán đơn online hoàn tất (${metadata.paymentMethod || 'COD/Transfer'})`,
          createdBy: userId
        } as any);

        // 4. VAT INVOICE REQUEST / INTEGRATION
        await tx.insert(schema.invoices).values({
          invoiceNumber: `INV-${order.code}`,
          orderId: order.id,
          type: metadata.requiresVatInvoice ? "VAT" : "RETAIL",
          customerName: metadata.customerName || "Khách hàng Trực tuyến",
          companyName: metadata.vatDetails?.vatCompany || metadata.customerName,
          taxCode: metadata.vatDetails?.vatTaxId || null,
          address: metadata.deliveryAddress || metadata.vatDetails?.vatAddress || null,
          billingEmail: metadata.vatDetails?.vatEmail || null,
          totalAmount: order.totalAmount || 0,
          taxRate: 0.1,
          taxAmount: order.taxAmount || 0,
          finalAmount: order.finalAmount || order.totalAmount || 0,
          paymentMethod: metadata.paymentMethod,
          paymentStatus: "PAID",
          status: "ISSUED",
          issueDate: new Date(),
          createdBy: userId
        } as any);
      }

      // 5. UPDATE SALES ORDER
      await tx.update(schema.salesOrders)
        .set({
          status: targetStatus === "COMPLETED" ? "COMPLETED" : (targetStatus === "RESERVED" ? "RESERVED" : "ISSUED"),
          paymentStatus: targetStatus === "COMPLETED" ? "PAID" : order.paymentStatus,
          amountPaid: targetStatus === "COMPLETED" ? (order.finalAmount || order.totalAmount || 0) : order.amountPaid,
          notes: JSON.stringify(updatedMetadata)
        } as any)
        .where(eq(schema.salesOrders.id, order.id));

      // 6. AUDIT TRAIL ENTRY (Standardized Transition Traceability: timestamp, actor, source, previousStatus, newStatus, referenceId)
      await (tx.insert(schema.auditLogs) as any).values({
        auditCode: `AUD-FULFILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId,
        username: "fulfillment_controller",
        userName: "Điều phối viên Fulfillment",
        role: "WAREHOUSE_MANAGER",
        branchId: 1,
        warehouseId: order.warehouseId,
        action: "UPDATE",
        entityType: "SALES_ORDER",
        entityId: order.code,
        module: "SALES",
        result: "SUCCESS",
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          actor: { userId, username: "fulfillment_controller", userName: "Điều phối viên Fulfillment", role: "WAREHOUSE_MANAGER" },
          source: metadata.source || metadata.channel || "ONLINE",
          previousStatus: currentStatus,
          newStatus: targetStatus,
          referenceId: order.code,
          targetStatus,
          customerReceived,
          deliverySuccess,
          inventoryRef: targetStatus === "COMPLETED" ? inventoryRef : null,
          glRef: targetStatus === "COMPLETED" ? glRef : null,
          cogsAmount: totalCogs
        }),
        createdAt: new Date()
      });
    });

    res.json({
      success: true,
      orderCode: order.code,
      fulfillmentStatus: targetStatus,
      inventoryRef: targetStatus === "COMPLETED" ? inventoryRef : undefined,
      journalRef: targetStatus === "COMPLETED" ? glRef : undefined,
      cogsAmount: totalCogs,
      message: `Đơn hàng ${order.code} đã cập nhật trạng thái fulfillment: ${targetStatus}. ${targetStatus === 'COMPLETED' ? 'Đã qua Sales Completion Gate: xuất kho M17, tính COGS, hạch toán GL và xuất hóa đơn.' : ''}`
    });
  } catch (err: any) {
    console.error("Fulfillment Transition Error:", err);
    if (err?.message?.includes("ERR_COSTING_LAYER_DEPLETED") || err?.message?.includes("ERR_COST_BASIS_UNAVAILABLE")) {
      return res.status(422).json({
        success: false,
        errorCode: "ERR_COSTING_LAYER_DEPLETED",
        error: err.message
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales/payment/process & /api/sales/payment/collect-cod - Idempotent Payment & COD Processing Engine
router.post(["/api/sales/payment/process", "/api/sales/payment/collect-cod"], async (req, res) => {
  try {
    const {
      orderNumber,
      orderCode,
      orderId: rawOrderId,
      amount: rawAmount,
      paymentMethod = "COD", // "COD" | "PREPAID" | "BANK_TRANSFER" | "CARD" | "PAYMENT_GATEWAY" | "CASH"
      idempotencyKey,
      referenceNo,
      notes
    } = req.body;
    const lookupKey = orderNumber || orderCode || rawOrderId;
    const userId = 1;

    if (!lookupKey) {
      return res.status(400).json({ success: false, error: "Thiếu mã đơn hàng hoặc orderId." });
    }

    const effectiveIdempotencyKey = idempotencyKey || `IDEMP-PAY-${lookupKey}-${paymentMethod}`;

    // 1. IDEMPOTENCY GATE: Check if this transaction has already executed
    const existingAudit = await db.select().from(schema.auditLogs)
      .where(sql`${schema.auditLogs.metadata} LIKE ${'%' + effectiveIdempotencyKey + '%'}`)
      .limit(1);

    if (existingAudit.length > 0) {
      let auditMeta: any = {};
      try { auditMeta = JSON.parse(existingAudit[0].metadata || "{}"); } catch (e) {}
      return res.status(200).json({
        success: true,
        idempotentReplay: true,
        orderCode: existingAudit[0].entityId,
        paymentStatus: auditMeta.paymentStatus || "PAID",
        amountPaid: auditMeta.amount || 0,
        idempotencyKey: effectiveIdempotencyKey,
        message: "Giao dịch thanh toán đã được thực hiện trước đó (Idempotent replay - chống trừ tiền 2 lần)."
      });
    }

    // 2. Lookup Sales Order using findOrCreateOrder
    const order = await findOrCreateOrder(lookupKey);
    if (!order) {
      return res.status(404).json({ success: false, error: "Không tìm thấy đơn hàng trong Sales Engine." });
    }

    const targetTotal = order.finalAmount || order.totalAmount || 0;
    const currentPaid = order.amountPaid || 0;
    const remainingBalance = Math.max(0, targetTotal - currentPaid);
    const paymentAmount = rawAmount !== undefined && rawAmount !== null ? Number(rawAmount) : remainingBalance;

    if (paymentAmount <= 0 && remainingBalance <= 0) {
      return res.status(400).json({
        success: false,
        error: `Đơn hàng ${order.code} đã được thanh toán đầy đủ (Số tiền đã thanh toán: ${currentPaid.toLocaleString()} đ).`
      });
    }

    const newAmountPaid = currentPaid + paymentAmount;
    const newPaymentStatus = newAmountPaid >= targetTotal ? "PAID" : "PARTIAL";
    const payRef = referenceNo || `PAY-${paymentMethod}-${order.code}-${Math.floor(1000 + Math.random() * 9000)}`;
    const glJournalRef = `JE-PAY-${order.code}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. TRANSACTION: Record Payment, Post GL & Update Order
    await db.transaction(async (tx) => {
      // Step A: Insert Payment Record into Payments Master
      await (tx.insert(schema.payments) as any).values({
        orderId: order.id,
        customerId: order.customerId,
        paymentType: "IN",
        paymentMethod: (paymentMethod === "COD" || paymentMethod === "CASH") ? "CASH" : (paymentMethod === "CARD" ? "CREDIT_CARD" : "BANK_TRANSFER"),
        amount: paymentAmount,
        referenceNo: payRef,
        status: "SUCCESS",
        notes: notes || `Thu tiền ${paymentMethod} cho đơn hàng ${order.code}`,
        createdBy: userId,
        createdAt: new Date()
      });

      // Shift & Cashier Hardening: Attribution & Cash Ledger Single Write Authority
      const activeShifts = await tx.select().from(schema.cashShifts)
        .where(require("drizzle-orm").eq(schema.cashShifts.status, "ACTIVE"))
        .orderBy(require("drizzle-orm").desc(schema.cashShifts.openedAt))
        .limit(1);

      if (paymentMethod === "CASH") {
        if (activeShifts.length > 0) {
          await CashMovementService.postMovement({
            shiftId: activeShifts[0].id,
            cashDrawerId: activeShifts[0].cashDrawerId,
            movementType: "SALE_CASH",
            amount: paymentAmount,
            direction: "IN",
            custodianId: String(userId),
            fromLocation: "CUSTOMER",
            toLocation: "DRAWER",
            referenceNo: payRef,
            idempotencyKey: `PAY-${payRef}-${Date.now()}`,
            notes: `Thu tiền ${paymentMethod} - ${order.code}`
          }, tx);
        }
      } else if (paymentMethod === "COD") {
        // COD should NOT be posted to Cashier Shift automatically
      }

      // Step B: Post GL Entry via Accounting Single Writer (Debit 1111/1121, Credit 1311 AR)
      const debitAccount = (paymentMethod === "COD" || paymentMethod === "CASH") ? "1111" : "1121";
      await accountingEngine.postJournal({
        sourceModule: "SALES_PAYMENT_COLLECTION",
        sourceDocumentType: "PAYMENT",
        sourceDocumentId: order.id,
        sourceReferenceNo: payRef,
        debitAccount,
        creditAccount: "1311",
        amount: paymentAmount,
        description: `Thu tiền ${paymentMethod} đơn hàng ${order.code} (Tham chiếu: ${payRef})`,
        branchId: 1,
        customerId: order.customerId || undefined,
        userId
      }, tx);

      // Step C: Update Sales Order Payment Status & Paid Amount
      let notesObj: any = {};
      try {
        if (order.notes && order.notes.startsWith("{")) notesObj = JSON.parse(order.notes);
      } catch (e) {}
      notesObj.paymentMethod = paymentMethod;
      notesObj.lastPaymentAt = new Date().toISOString();
      notesObj.lastPaymentRef = payRef;

      await tx.update(schema.salesOrders)
        .set({
          paymentStatus: newPaymentStatus,
          amountPaid: newAmountPaid,
          notes: JSON.stringify(notesObj)
        } as any)
        .where(eq(schema.salesOrders.id, order.id));

      // Step D: Update Invoices if available
      await tx.update(schema.invoices)
        .set({
          paymentStatus: newPaymentStatus,
          paymentMethod: paymentMethod
        } as any)
        .where(eq(schema.invoices.orderId, order.id));

      // Step E: Write Audit Log with Idempotency Key (Standardized Transition Traceability)
      await tx.insert(schema.auditLogs).values({
        auditCode: `AUD-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId,
        username: "payment_settler",
        userName: "Hệ thống Xử lý Thanh toán Idempotent",
        role: "ACCOUNTANT",
        branchId: 1,
        warehouseId: order.warehouseId,
        action: "PAYMENT",
        entityType: "PAYMENT",
        entityId: order.code,
        module: "SALES",
        result: "SUCCESS",
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          actor: { userId, username: "payment_settler", userName: "Hệ thống Xử lý Thanh toán Idempotent", role: "ACCOUNTANT" },
          source: notesObj.channel || "PAYMENT_GATEWAY",
          previousStatus: order.paymentStatus || "UNPAID",
          newStatus: newPaymentStatus,
          referenceId: payRef,
          idempotencyKey: effectiveIdempotencyKey,
          orderCode: order.code,
          paymentMethod,
          amount: paymentAmount,
          newAmountPaid,
          paymentStatus: newPaymentStatus,
          paymentRef: payRef,
          glRef: glJournalRef
        }),
        createdAt: new Date()
      } as any);
    });

    res.json({
      success: true,
      orderCode: order.code,
      paymentStatus: newPaymentStatus,
      amountPaid: newAmountPaid,
      collectedAmount: paymentAmount,
      paymentRef: payRef,
      journalRef: glJournalRef,
      idempotencyKey: effectiveIdempotencyKey,
      message: `Thanh toán thành công ${paymentAmount.toLocaleString()} đ cho đơn hàng ${order.code} qua ${paymentMethod}. Sổ cái GL đã hạch toán Nợ ${paymentMethod === 'COD' || paymentMethod === 'CASH' ? '1111' : '1121'} / Có 1311.`
    });
  } catch (err: any) {
    console.error("Payment Processing Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 12. M15 RMA & RETURN ARCHITECTURE
// Flow: COMPLETED SALE -> M15 RMA -> RETURN REQUEST -> INSPECT -> APPROVE/REJECT -> INVENTORY RETURN -> REFUND/CREDIT NOTE
// ==========================================

// POST /api/sales/rma/create - Khởi tạo yêu cầu trả hàng M15 RMA từ Completed Sale
router.post("/api/sales/rma/create", async (req, res) => {
  try {
    const {
      orderCode,
      orderId: rawOrderId,
      reason = "Sản phẩm lỗi kỹ thuật / Khách đổi ý",
      items = [], // [{ productId, quantity, reason }]
      refundMethod = "CREDIT_NOTE", // "CREDIT_NOTE" | "BANK_TRANSFER" | "CASH"
      idempotencyKey
    } = req.body;

    if (idempotencyKey) {
      const existingAudit = await db.select().from(schema.auditLogs)
        .where(sql`${schema.auditLogs.metadata} LIKE ${'%' + idempotencyKey + '%'}`)
        .limit(1);

      if (existingAudit.length > 0) {
        let auditMeta: any = {};
        try { auditMeta = JSON.parse(existingAudit[0].metadata || "{}"); } catch (e) {}
        return res.status(200).json({
          success: true,
          idempotentReplay: true,
          rmaCode: existingAudit[0].entityId,
          orderCode: auditMeta.orderCode,
          status: "REQUESTED",
          message: "Yêu cầu RMA đã được tạo trước đó (Idempotent replay)."
        });
      }
    }
    const lookupKey = orderCode || rawOrderId;
    const userId = 1;

    if (!lookupKey) {
      return res.status(400).json({ success: false, error: "Thiếu mã đơn hàng hoặc orderId." });
    }

    const order = await findOrCreateOrder(lookupKey);
    if (!order) {
      return res.status(404).json({ success: false, error: "Không tìm thấy đơn hàng trong Sales Engine." });
    }

    let parsedMeta: any = {};
    try {
      if (order.notes && order.notes.startsWith("{")) parsedMeta = JSON.parse(order.notes);
    } catch (e) {}

    // Check if Order is Completed/Issued Sale (Eligible for M15 RMA)
    const isCompletedSale = 
      order.status === "COMPLETED" || 
      order.status === "ISSUED" || 
      order.status === "PAID" || 
      parsedMeta.fulfillmentStatus === "COMPLETED" ||
      order.code.startsWith("POS-");

    if (!isCompletedSale || order.status === "DRAFT" || order.status === "CANCELLED" || order.status === "RESERVED") {
      return res.status(400).json({
        success: false,
        error: `Chỉ đơn hàng đã hoàn tất/xuất bán (COMPLETED / ISSUED SALE) mới có thể tạo yêu cầu trả hàng RMA M15. Trạng thái hiện tại: ${order.status}.`
      });
    }

    const rmaCode = `RMA-M15-${order.code}-${Math.floor(1000 + Math.random() * 9000)}`;
    const originalInvoice = `INV-${order.code}`;

    // Parse items to return or default to all items in order
    const orderItems = await db.select().from(schema.salesOrderItems).where(eq(schema.salesOrderItems.orderId, order.id)).all();
    
    // Validate quantities
    let validatedItems = [];
    if (items.length > 0) {
      for (const reqItem of items) {
        const origItem = orderItems.find(it => it.productId === reqItem.productId);
        if (!origItem) {
          throw new Error(`Sản phẩm ${reqItem.productId} không thuộc đơn hàng gốc.`);
        }
        if (reqItem.quantity > origItem.quantity) {
          throw new Error(`Số lượng trả (${reqItem.quantity}) vượt quá số lượng đã mua (${origItem.quantity}).`);
        }
        validatedItems.push({
          productId: reqItem.productId,
          quantity: reqItem.quantity,
          unitPrice: origItem.unitPrice,
          subtotal: origItem.unitPrice * reqItem.quantity
        });
      }
    } else {
      validatedItems = orderItems.map(it => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal
      }));
    }
    const returnItems = validatedItems;

    const totalReturnAmount = returnItems.reduce((s: number, it: any) => s + (Number(it.unitPrice || 0) * Number(it.quantity || 1)), 0);
    const returnVatAmount = Math.round(totalReturnAmount * 0.1);
    const totalRefundFinal = totalReturnAmount + returnVatAmount;

    // Attach RMA Record into Order metadata (Preserving original completed sale transaction)
    const existingRmas = parsedMeta.rmas || [];
    const newRma = {
      rmaCode,
      createdAt: new Date().toISOString(),
      reason,
      status: "REQUESTED", // "REQUESTED" -> "INSPECTED" -> "APPROVED" -> "INVENTORY_RETURNED" -> "REFUNDED"
      inspectionResult: null,
      refundMethod,
      originalInvoice,
      returnItems,
      totalReturnAmount,
      returnVatAmount,
      totalRefundFinal,
      createdBy: userId
    };

    existingRmas.push(newRma);
    parsedMeta.rmas = existingRmas;
    parsedMeta.hasRma = true;

    await db.update(schema.salesOrders)
      .set({ notes: JSON.stringify(parsedMeta) } as any)
      .where(eq(schema.salesOrders.id, order.id));

    // Audit Log for M15 RMA creation (Standardized Transition Traceability)
    await db.insert(schema.auditLogs).values({
      auditCode: `AUD-RMA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      username: "rma_officer",
      userName: "Nhân viên Tiếp nhận Bảo hành RMA M15",
      role: "CUSTOMER_SERVICE",
      branchId: 1,
      warehouseId: order.warehouseId,
      action: "CREATE",
      entityType: "RMA_REQUEST",
      entityId: rmaCode,
      module: "SALES",
      result: "SUCCESS",
      metadata: JSON.stringify({
        timestamp: new Date().toISOString(),
        actor: { userId, username: "rma_officer", userName: "Nhân viên Tiếp nhận Bảo hành RMA M15", role: "CUSTOMER_SERVICE" },
        source: "M15_RMA_RETURNS",
        previousStatus: "COMPLETED_SALE",
        newStatus: "RMA_REQUESTED",
        referenceId: rmaCode,
        orderCode: order.code,
        reason,
        refundAmount: totalRefundFinal,
        idempotencyKey
      }),
      createdAt: new Date()
    } as any);

    res.json({
      success: true,
      rmaCode,
      orderCode: order.code,
      status: "REQUESTED",
      totalRefund: totalRefundFinal,
      message: `Đã khởi tạo yêu cầu trả hàng RMA [${rmaCode}] cho đơn hàng đã hoàn tất [${order.code}]. Bước tiếp theo: Giám định sản phẩm (INSPECT). Chứng từ bán hàng gốc được bảo toàn không xóa.`
    });
  } catch (err: any) {
    console.error("RMA Create Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales/rma/process - Xử lý quy trình RMA (Inspect -> Approve/Reject -> Inventory Return -> Refund/Credit Note)
router.post("/api/sales/rma/process", async (req, res) => {
  try {
    const {
      orderCode,
      rmaCode,
      action, // "INSPECT" | "APPROVE" | "REJECT" | "EXECUTE_RETURN_AND_REFUND"
      inspectionResult = "PASSED", // "PASSED" | "FAILED"
      inspectionNotes = "Đã kiểm định: Hàng nguyên tem mác, đủ điều kiện trả lại kho",
      refundMethod = "CREDIT_NOTE", // "CREDIT_NOTE" | "BANK_TRANSFER" | "CASH"
      idempotencyKey
    } = req.body;

    if (idempotencyKey) {
      const existingAudit = await db.select().from(schema.auditLogs)
        .where(sql`${schema.auditLogs.metadata} LIKE ${'%' + idempotencyKey + '%'}`)
        .limit(1);

      if (existingAudit.length > 0) {
        let auditMeta: any = {};
        try { auditMeta = JSON.parse(existingAudit[0].metadata || "{}"); } catch (e) {}
        return res.status(200).json({
          success: true,
          idempotentReplay: true,
          rmaCode: existingAudit[0].entityId,
          orderCode,
          status: auditMeta.newStatus || "UNKNOWN",
          message: "Yêu cầu xử lý RMA đã được thực hiện trước đó (Idempotent replay)."
        });
      }
    }
    const userId = 1;

    if (!orderCode || !rmaCode || !action) {
      return res.status(400).json({ success: false, error: "Thiếu orderCode, rmaCode hoặc action." });
    }

    const order = await findOrCreateOrder(orderCode);
    if (!order) {
      return res.status(404).json({ success: false, error: "Không tìm thấy đơn hàng." });
    }

    let parsedMeta: any = {};
    try {
      if (order.notes && order.notes.startsWith("{")) parsedMeta = JSON.parse(order.notes);
    } catch (e) {}

    const rmas = parsedMeta.rmas || [];
    const rmaIndex = rmas.findIndex((r: any) => r.rmaCode === rmaCode);

    if (rmaIndex === -1) {
      return res.status(404).json({ success: false, error: `Không tìm thấy RMA [${rmaCode}] trong đơn hàng ${orderCode}.` });
    }

    const currentRma = rmas[rmaIndex];

    if (action === "INSPECT") {
      currentRma.status = "INSPECTED";
      currentRma.inspectionResult = inspectionResult;
      currentRma.inspectionNotes = inspectionNotes;
      currentRma.inspectedAt = new Date().toISOString();
    } else if (action === "REJECT") {
      currentRma.status = "REJECTED";
      currentRma.rejectReason = inspectionNotes;
      currentRma.rejectedAt = new Date().toISOString();
    } else if (action === "APPROVE") {
      currentRma.status = "APPROVED";
      currentRma.approvedAt = new Date().toISOString();
    } else if (action === "EXECUTE_RETURN_AND_REFUND" || action === "EXECUTE_RETURN") {
      // Full execution: Single-writer Inventory Return + GL Credit Note / Refund
      let creditNoteNumber = `CN-M15-${Date.now().toString().slice(-4)}`;

      await db.transaction(async (tx) => {
        // Step 1: Inventory Return via InventoryService (Single Writer) and determine return COGS
        let totalReturnCogs = 0;
        for (const it of currentRma.returnItems) {
          await InventoryService.postTransaction(tx, {
            productId: it.productId,
            warehouseId: order.warehouseId,
            type: "PURCHASE", // Inward stock adjustment from customer return
            referenceNo: rmaCode,
            quantity: it.quantity,
            notes: `Nhập trả kho hàng bán trả lại qua RMA M15 [${rmaCode}]`,
            userId
          });

          // Resolve authoritative unit cost from CostingEngine (Single Writer)
          const itemUnitCost = await costingEngine.resolveUnitCost({
            productId: it.productId,
            warehouseId: order.warehouseId
          }, tx);

          const itemCogs = Math.round(it.quantity * itemUnitCost);
          totalReturnCogs += itemCogs;

          // Replenish cost layer for returned goods
          await costingEngine.addCostLayer({
            productId: it.productId,
            warehouseId: order.warehouseId,
            quantity: it.quantity,
            unitCost: itemUnitCost,
            sourceDocumentType: "RMA_RETURN",
            sourceDocumentId: order.id,
            sourceReferenceNo: rmaCode,
            receiptDate: new Date()
          }, tx);
        }

        // Step 2: Post GL Credit Note / Accounting Return Entry (Debit 5212 Hàng bán bị trả lại, Debit 3331 Thuế GTGT giảm / Credit 131 AR hoặc 1121/1111)
        const creditAccount = refundMethod === "BANK_TRANSFER" ? "1121" : (refundMethod === "CASH" ? "1111" : "1311");
        
        // Hàng bán bị trả lại (5212)
        await accountingEngine.postJournal({
          sourceModule: "RMA_RETURNS",
          sourceDocumentType: "CREDIT_NOTE",
          sourceDocumentId: order.id,
          sourceReferenceNo: rmaCode,
          debitAccount: "5212",
          creditAccount,
          amount: currentRma.totalReturnAmount,
          description: `Hàng bán bị trả lại theo RMA ${rmaCode} (Đơn gốc: ${order.code})`,
          branchId: 1,
          customerId: order.customerId || undefined,
          userId
        }, tx);

        // Giảm thuế GTGT đầu ra (33311)
        if (currentRma.returnVatAmount > 0) {
          await accountingEngine.postJournal({
            sourceModule: "RMA_RETURNS",
            sourceDocumentType: "CREDIT_NOTE",
            sourceDocumentId: order.id,
            sourceReferenceNo: rmaCode,
            debitAccount: "33311",
            creditAccount,
            amount: currentRma.returnVatAmount,
            description: `Giảm thuế GTGT đầu ra hàng trả lại RMA ${rmaCode}`,
            branchId: 1,
            userId
          }, tx);
        }

        // Step 3: Hoàn nhập giá vốn (Debit 1561 / Credit 632) theo đơn giá vốn thực tế từ CostingEngine
        if (totalReturnCogs > 0) {
          await accountingEngine.postJournal({
            sourceModule: "RMA_RETURNS",
            sourceDocumentType: "CREDIT_NOTE",
            sourceDocumentId: order.id,
            sourceReferenceNo: rmaCode,
            debitAccount: "1561",
            creditAccount: "632",
            amount: totalReturnCogs,
            description: `Hoàn nhập giá vốn kho hàng bán bị trả lại RMA ${rmaCode}`,
            branchId: 1,
            userId
          }, tx);
        }

        currentRma.status = "REFUNDED";
        // Step 4: Cash Refund if CASH
        if (refundMethod === "CASH") {
          const activeShifts = await tx.select().from(schema.cashShifts)
            .where(require("drizzle-orm").and(
              require("drizzle-orm").eq(schema.cashShifts.status, "ACTIVE"),
              require("drizzle-orm").eq(schema.cashShifts.cashierUserId, String(userId))
            ))
            .orderBy(require("drizzle-orm").desc(schema.cashShifts.openedAt))
            .limit(1);
            
          if (activeShifts.length === 0) {
            throw new Error("Không tìm thấy ca làm việc (Active Shift) hợp lệ để thực hiện hoàn tiền mặt (CASH). Vui lòng mở ca.");
          }
          
          await CashMovementService.postMovement({
            shiftId: activeShifts[0].id,
            cashDrawerId: activeShifts[0].cashDrawerId,
            movementType: "REFUND_CASH",
            amount: currentRma.totalRefundFinal, // refund total amount including VAT
            direction: "OUT",
            custodianId: String(userId),
            fromLocation: "DRAWER",
            toLocation: "CUSTOMER",
            referenceNo: rmaCode,
            idempotencyKey: `RMA-REFUND-${rmaCode}-${Date.now()}`,
            notes: `Hoàn tiền mặt RMA ${rmaCode} (Đơn: ${order.code})`
          }, tx);
        }

        currentRma.refundedAt = new Date().toISOString();
        currentRma.creditNoteNumber = creditNoteNumber;
        currentRma.inventoryReturned = true;
      });
    }

    rmas[rmaIndex] = currentRma;
    parsedMeta.rmas = rmas;

    await db.update(schema.salesOrders)
      .set({ notes: JSON.stringify(parsedMeta) } as any)
      .where(eq(schema.salesOrders.id, order.id));

    // Audit Log for RMA Processing Transition
    await db.insert(schema.auditLogs).values({
      auditCode: `AUD-RMA-PROC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      username: "rma_processor",
      userName: "Bộ phận Giám định & Xử lý RMA M15",
      role: "QC_MANAGER",
      branchId: 1,
      warehouseId: order.warehouseId,
      action: action === "EXECUTE_RETURN_AND_REFUND" ? "REFUND" : "UPDATE",
      entityType: "RMA_REQUEST",
      entityId: rmaCode,
      module: "SALES",
      result: "SUCCESS",
      metadata: JSON.stringify({
        timestamp: new Date().toISOString(),
        actor: { userId, username: "rma_processor", userName: "Bộ phận Giám định & Xử lý RMA M15", role: "QC_MANAGER" },
        source: "M15_RMA_RETURNS",
        previousStatus: currentRma.previousStatus || "REQUESTED",
        newStatus: currentRma.status,
        referenceId: rmaCode,
        orderCode: order.code,
        action,
        refundMethod,
        idempotencyKey,
        creditNoteNumber: currentRma.creditNoteNumber || null
      }),
      createdAt: new Date()
    } as any);

    res.json({
      success: true,
      rmaCode,
      orderCode: order.code,
      status: currentRma.status,
      rmaDetails: currentRma,
      message: `Đã cập nhật trạng thái RMA [${rmaCode}] thành ${currentRma.status}.`
    });
  } catch (err: any) {
    console.error("RMA Process Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});





// GET /api/sales/rma/list - Get all RMAs
router.get("/api/sales/rma/list", async (req, res) => {
  try {
    const orders = await db.select().from(schema.salesOrders).all();
    let rmaList: any[] = [];
    for (const order of orders) {
      if (order.notes && order.notes.includes("rmaCode")) {
        try {
          const parsed = JSON.parse(order.notes);
          if (parsed.rmas && Array.isArray(parsed.rmas)) {
            parsed.rmas.forEach((rma: any) => {
              rmaList.push({
                orderCode: order.code,
                orderId: order.id,
                customerId: order.customerId,
                ...rma
              });
            });
          }
        } catch (e) {}
      }
    }
    rmaList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(rmaList);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
