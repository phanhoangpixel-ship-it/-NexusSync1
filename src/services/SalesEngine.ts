import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { PricingService } from "../../engines/pricingService";
import { InventoryService } from "../../engines/inventoryService";
import { ShiftEngine } from "../../engines/shiftEngine";
import { CashMovementService } from "../../engines/CashMovementService";
import { accountingEngine } from "../../engines/accountingEngine";
import { costingEngine } from "../../engines/costingEngine";
import { CostingShadowRunner } from "../../engines/costingShadowRunner";
import { AuditService } from "../../engines/auditService";

export interface SalesOrderRequest {
  channel: "POS" | "B2B" | "ONLINE" | "MARKETPLACE" | "SALES_REP" | "STORE_PICKUP" | string;
  source: string;
  externalOrderId?: string | null;
  customerId?: number | null;
  customerName?: string;
  customerType?: string; // GUEST, REGISTERED, B2B
  branchId?: number;
  warehouseId?: number;
  paymentIntent: {
    method: "CASH" | "CARD" | "BANK_TRANSFER" | "CREDIT" | "PAYMENT_GATEWAY" | "COD" | "QR" | string;
    amount?: number; // total amount to pay immediately if prepaid
  };
  fulfillmentIntent: {
    type: "IMMEDIATE" | "RESERVATION" | "PENDING"; // POS is immediate, Online is reservation
    deliveryPartner?: string;
    shippingAddress?: string;
  };
  items: Array<{
    productId: number;
    sku?: string;
    name?: string;
    quantity: number;
    price: number;
    discountPercent?: number;
    locationId?: number | null;
    lotId?: number | null;
    serials?: string[];
  }>;
  requiresVatInvoice?: boolean;
  vatDetails?: any;
  notes?: string;
  idempotencyKey?: string | null;
  userId?: number;
  salesRepId?: number | null;
}

export class SalesEngine {
  static async createOrder(req: SalesOrderRequest, txContext?: any) {
    const { idempotencyKey, channel, source, externalOrderId } = req;
    
    // 0. Idempotency Check by idempotencyKey
    if (idempotencyKey) {
      const existingAudit = await db.select().from(schema.auditLogs)
        .where(sql`${schema.auditLogs.metadata} LIKE ${'%' + idempotencyKey + '%'}`)
        .limit(1);
        
      if (existingAudit.length > 0) {
        const matchingOrder = await db.select().from(schema.salesOrders)
          .where(eq(schema.salesOrders.code, existingAudit[0].entityId))
          .limit(1);
          
        if (matchingOrder.length > 0) {
          return {
            success: true,
            idempotentReplay: true,
            orderId: matchingOrder[0].id,
            orderRef: matchingOrder[0].code,
            status: matchingOrder[0].status,
            grandTotal: matchingOrder[0].finalAmount,
            message: "Idempotent replay."
          };
        }
      }
    }

    // 1. Idempotency by externalOrderId + source
    if (externalOrderId) {
      const allOrders = await db.select().from(schema.salesOrders).all();
      const duplicate = allOrders.find(ord => {
        try {
          if (ord.notes && ord.notes.startsWith("{")) {
            const meta = JSON.parse(ord.notes);
            return meta.source === source && meta.externalOrderId === externalOrderId;
          }
        } catch (e) {}
        return false;
      });
      if (duplicate) {
        return {
          success: true,
          idempotentReplay: true,
          orderId: duplicate.id,
          orderRef: duplicate.code,
          status: duplicate.status,
          grandTotal: duplicate.finalAmount,
          message: "Duplicate order from external source (Idempotent)."
        };
      }
    }

    // 2. Validate Items & Pricing
    let totalSubtotal = 0;
    let totalTaxAmount = 0;
    const validatedItems: any[] = [];
    
    for (const rawItem of req.items) {
      const prodRecord = await db.select().from(schema.products).where(eq(schema.products.id, rawItem.productId)).limit(1);
      if (prodRecord.length === 0) {
        throw new Error(`Product ID ${rawItem.productId} not found.`);
      }
      const product = prodRecord[0];
      
      const pricingResult = PricingService.calculateLinePricing({
        sku: product.sku || "UNKNOWN",
        category: (product as any).category || String(product.categoryId || "UNKNOWN"),
        unitPrice: rawItem.price || product.retailPrice || 0,
        quantity: rawItem.quantity,
        discountPercent: rawItem.discountPercent || 0,
      });
      
      totalSubtotal += pricingResult.taxableAmount;
      totalTaxAmount += pricingResult.taxAmount;
      
      validatedItems.push({
        ...rawItem,
        product,
        pricingResult
      });
    }

    const grandTotal = totalSubtotal + totalTaxAmount;
    
    // Gen Order Ref
    const prefix = channel === "POS" ? "POS" : channel === "B2B" ? "B2B" : "ORD";
    const orderRef = externalOrderId ? `${prefix}-${externalOrderId}` : `${prefix}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const executeTransaction = async (tx: any) => {
      // 3. FULFILLMENT & INVENTORY LOGIC
      let inventoryStatus = "PENDING";
      let totalCogs = 0;
      let isFulfilled = false;

      if (req.fulfillmentIntent.type === "IMMEDIATE") {
        // POS / Immediate hand-carry
        isFulfilled = true;
        inventoryStatus = "COMPLETED";
        
        for (const item of validatedItems) {
          await InventoryService.postTransaction(tx, {
            productId: item.productId,
            warehouseId: req.warehouseId || 1,
            locationId: item.locationId || null,
            lotId: item.lotId || null,
            type: "SALE",
            referenceNo: orderRef,
            quantity: -item.quantity,
            notes: `${channel} Sale - ${orderRef}`,
            userId: req.userId,
            serials: item.serials || []
          });
          
          // Costing via Costing Engine (Single-Writer Authority)
          try {
            let costRes: any = null;
            if (typeof costingEngine?.calculateIssue === "function") {
              costRes = await costingEngine.calculateIssue({
                productId: item.productId,
                warehouseId: req.warehouseId || 1,
                quantity: item.quantity,
                createdBy: req.userId
              }, tx);
            } else if (typeof costingEngine?.calculateIssueCost === "function") {
              costRes = await costingEngine.calculateIssueCost({
                productId: item.productId,
                warehouseId: req.warehouseId || 1,
                quantity: item.quantity,
                createdBy: req.userId
              }, tx);
            }
            totalCogs += (costRes?.totalCost || 0);

            // Parallel Shadow Run Evaluation (Non-blocking, inactive by default)
            CostingShadowRunner.evaluateTransactionShadow({
              transactionId: orderRef,
              productId: item.productId,
              warehouseId: req.warehouseId || 1,
              quantity: item.quantity,
              engineOldResult: {
                totalCogs: costRes?.totalCost || 0,
                unitCost: costRes?.averageUnitCost || 0,
                source: 'COSTING_ENGINE'
              }
            }).catch(e => console.warn('[ShadowRun Warning]', e));
          } catch (costErr: any) {
            if (process.env.FEATURE_STRICT_COSTING_VALIDATION === 'true') {
              throw new Error(`ERR_COSTING_LAYER_DEPLETED: Giao dịch bán hàng bị chặn do thiếu cost layer cho sản phẩm ${item.productId}: ${costErr?.message || costErr}`);
            }
            // Strict flag = false: Đọc fallback từ cost_price của sản phẩm thật, ghi log cảnh báo
            const [pRow] = await tx.select({ costPrice: schema.products.costPrice }).from(schema.products).where(eq(schema.products.id, item.productId)).limit(1);
            const fallbackUnitCost = pRow?.costPrice || 0;
            console.warn(`[SalesEngine WARN] Thiếu tầng chi phí cho SKU #${item.productId}. Áp dụng fallback cost_price = ${fallbackUnitCost} ₫`);
            totalCogs += (fallbackUnitCost * item.quantity);

            // Parallel Shadow Run Evaluation with fallback record
            CostingShadowRunner.evaluateTransactionShadow({
              transactionId: orderRef,
              productId: item.productId,
              warehouseId: req.warehouseId || 1,
              quantity: item.quantity,
              engineOldResult: {
                totalCogs: fallbackUnitCost * item.quantity,
                unitCost: fallbackUnitCost,
                source: 'PRODUCT_CATALOG_FALLBACK'
              }
            }).catch(e => console.warn('[ShadowRun Warning]', e));
          }
        }
      } else if (req.fulfillmentIntent.type === "RESERVATION") {
        inventoryStatus = "RESERVED";
        for (const item of validatedItems) {
          await InventoryService.reserveStock(tx, {
            productId: item.productId,
            warehouseId: req.warehouseId || 1,
            quantity: item.quantity,
            referenceNo: orderRef,
            userId: req.userId,
            notes: `${channel} Reservation - ${orderRef}`
          });
        }
      }

      const isCod = req.paymentIntent.method === "COD";
      const isCredit = req.paymentIntent.method === "CREDIT";
      const initialPaymentStatus = (isFulfilled || req.paymentIntent.amount === grandTotal) && !isCod && !isCredit ? "PAID" : "UNPAID";
      
      const orderStatus = isFulfilled ? "COMPLETED" : (inventoryStatus === "RESERVED" ? "RESERVED" : "CONFIRMED");

      const glRef = `JE-${orderRef}`;

      // 4. Create Order
      const notesJson = JSON.stringify({
        channel,
        source,
        externalOrderId,
        idempotencyKey,
        customerName: req.customerName,
        paymentMethod: req.paymentIntent.method,
        fulfillmentStatus: inventoryStatus,
        fulfillmentType: req.fulfillmentIntent.type,
        cogsAmount: totalCogs,
        glRef: isFulfilled ? glRef : undefined,
        requiresVatInvoice: req.requiresVatInvoice,
        vatDetails: req.vatDetails,
        salesRepId: req.salesRepId,
        items: validatedItems.map(it => ({
          id: it.productId,
          sku: it.product.sku,
          name: it.product.name,
          quantity: it.quantity,
          price: it.price,
          total: it.price * it.quantity
        }))
      });

      const [insertedOrder] = await tx.insert(schema.salesOrders).values({
        code: orderRef,
        customerId: req.customerId || null,
        warehouseId: req.warehouseId || 1,
        status: orderStatus,
        paymentStatus: initialPaymentStatus,
        totalAmount: totalSubtotal,
        discountAmount: 0, // order-level discount
        taxAmount: totalTaxAmount,
        finalAmount: grandTotal,
        amountPaid: initialPaymentStatus === "PAID" ? grandTotal : 0,
        notes: notesJson,
        createdBy: req.userId
      }).returning();
      
      const orderId = insertedOrder.id;

      // 5. Order Lines
      for (const item of validatedItems) {
        await tx.insert(schema.salesOrderItems).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          discountAmount: item.pricingResult.discountAmount,
          taxRate: item.pricingResult.taxRate,
          subtotal: item.pricingResult.taxableAmount,
          notes: `${channel} line item ${item.product.sku}`
        });
      }

      // 6. Payments
      if (initialPaymentStatus === "PAID" || req.paymentIntent.amount! > 0) {
        const [payment] = await tx.insert(schema.payments).values({
          orderId,
          customerId: req.customerId || null,
          paymentType: "IN",
          paymentMethod: req.paymentIntent.method,
          amount: req.paymentIntent.amount || grandTotal,
          referenceNo: `PAY-${orderRef}`,
          status: "SUCCESS",
          notes: `Payment for ${orderRef} (${req.paymentIntent.method})`,
          createdBy: req.userId
        }).returning();

        if (req.paymentIntent.method === "CASH") {
          try {
            const activeShifts = await tx.select().from(schema.cashShifts)
              .where(eq(schema.cashShifts.status, "ACTIVE"))
              .orderBy(desc(schema.cashShifts.openedAt))
              .limit(1);
            const activeShift = activeShifts.length > 0 ? activeShifts[0] : null;
            
            await new CashMovementService().postMovement({
              shiftId: activeShift ? activeShift.id : null,
              cashDrawerId: activeShift ? activeShift.cashDrawerId : 1,
              movementType: 'SALE_CASH',
              amount: req.paymentIntent.amount || grandTotal,
              direction: 'IN',
              custodianId: String(req.userId || 1),
              fromLocation: 'CUSTOMER',
              toLocation: 'DRAWER',
              referenceNo: `PAY-${payment.id}`,
              idempotencyKey: `CM-PAY-${payment.id}`,
              notes: `Cash sale for order ${orderRef} (${channel})`
            }, tx);
          } catch (e) {
            console.error("CashMovement error", e);
          }
        }
      }

      // 7. GL Accounting (if fulfilled/invoiced immediately)
      if (isFulfilled) {
        const pMethod = req.paymentIntent.method;
        const debitAccount = pMethod === "CASH" ? "1111" : (pMethod === "CREDIT" ? "1311" : "1121");
        
        await accountingEngine.postJournal({
          sourceModule: `SALES_${channel}`,
          sourceDocumentType: "SALES_ORDER",
          sourceDocumentId: orderId,
          sourceReferenceNo: orderRef,
          debitAccount,
          creditAccount: "5111",
          amount: totalSubtotal,
          description: `Doanh thu bán hàng ${orderRef} (${channel})`,
          branchId: req.branchId || 1,
          userId: req.userId
        }, tx);
        
        if (totalTaxAmount > 0) {
          await accountingEngine.postJournal({
            sourceModule: `SALES_${channel}`,
            sourceDocumentType: "SALES_ORDER",
            sourceDocumentId: orderId,
            sourceReferenceNo: orderRef,
            debitAccount,
            creditAccount: "33311",
            amount: totalTaxAmount,
            description: `Thuế GTGT đầu ra ${orderRef}`,
            branchId: req.branchId || 1,
            userId: req.userId
          }, tx);
        }
        
        if (totalCogs > 0) {
          await accountingEngine.postJournal({
            sourceModule: `SALES_${channel}`,
            sourceDocumentType: "SALES_ORDER",
            sourceDocumentId: orderId,
            sourceReferenceNo: orderRef,
            debitAccount: "632",
            creditAccount: "1561",
            amount: totalCogs,
            description: `Giá vốn hàng bán ${orderRef}`,
            branchId: req.branchId || 1,
            userId: req.userId
          }, tx);
        }
      }

      // 8. Central Audit Gateway (Asynchronous Hash Chaining)
      AuditService.captureAsync({
        userId: req.userId,
        username: "sales_engine",
        userName: "Unified Sales Engine",
        role: "SYSTEM",
        branchId: req.branchId || 1,
        warehouseId: req.warehouseId || 1,
        action: "CREATE",
        entityType: "SALES_ORDER",
        entityId: orderRef,
        module: "M12",
        result: "SUCCESS",
        metadata: {
          channel,
          source,
          externalOrderId,
          idempotencyKey,
          grandTotal,
          orderStatus
        }
      });

      return {
        success: true,
        orderId,
        orderRef,
        status: orderStatus,
        grandTotal,
        message: "Order created successfully."
      };
    };

    if (txContext) {
      return await executeTransaction(txContext);
    } else {
      return await db.transaction(executeTransaction);
    }
  }
}
