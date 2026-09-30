import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { eq, sql, desc, and, or } from "drizzle-orm";
import { PricingService } from "../../engines/pricingService";
import { InventoryService } from "../../engines/inventoryService";
import { ShiftEngine } from "../../engines/shiftEngine";
import { CashMovementService } from "../../engines/CashMovementService";
import { accountingEngine } from "../../engines/accountingEngine";
import { costingEngine } from "../../engines/costingEngine";
import { CostingShadowRunner } from "../../engines/costingShadowRunner";
import { AuditService } from "../../engines/auditService";

export interface SalesOrderRequest {
  channel: "POS" | "POS_RETAIL" | "B2B" | "ONLINE" | "MARKETPLACE" | "SALES_REP" | "STORE_PICKUP" | string;
  source: string;
  sourceType?: string;
  sourceId?: number;
  externalOrderId?: string | null;
  customerId?: number | null;
  customerName?: string;
  customerType?: string; // GUEST, REGISTERED, B2B
  customerTier?: string; // STANDARD, SILVER, GOLD, VIP, ENTERPRISE
  promoCode?: string;
  minMarginPercent?: number;
  allowBelowCostOverride?: boolean;
  branchId?: number;
  warehouseId?: number;
  status?: "DRAFT" | "PENDING_APPROVAL" | "CONFIRMED" | "RESERVED" | string;
  allowCreditOverride?: boolean;
  creditApprovedBy?: string | number;
  creditOverrideReason?: string;
  paymentIntent: {
    method: "CASH" | "CARD" | "BANK_TRANSFER" | "CREDIT" | "PAYMENT_GATEWAY" | "COD" | "QR" | string;
    amount?: number; // total amount to pay immediately if prepaid
    splits?: Array<{ method: string; amount: number; reference?: string }>;
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
    price?: number;
    unitPrice?: number;
    discountPercent?: number;
    discountAmount?: number;
    promoCode?: string;
    priceListId?: number | null;
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
  shiftId?: number | null;
}

export class SalesEngine {
  static async createOrder(req: SalesOrderRequest, txContext?: any) {
    const { idempotencyKey, channel, source, externalOrderId } = req;
    
    // 0. Idempotency Check by idempotencyKey
    if (idempotencyKey) {
      const existingOrder = await db.select().from(schema.salesOrders)
        .where(sql`${schema.salesOrders.notes} LIKE ${'%' + idempotencyKey + '%'}`)
        .limit(1);

      if (existingOrder.length > 0) {
        return {
          success: true,
          idempotentReplay: true,
          orderId: existingOrder[0].id,
          orderRef: existingOrder[0].code,
          status: existingOrder[0].status,
          grandTotal: existingOrder[0].finalAmount,
          message: "Idempotent replay."
        };
      }

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

    // 2. Validate Items & Authoritative Pricing (M41 Pricing Engine Authority & Margin Floor Guard)
    let totalSubtotal = 0;
    let totalTaxAmount = 0;
    const validatedItems: any[] = [];
    
    for (const rawItem of req.items) {
      const prodRecord = await db.select().from(schema.products).where(eq(schema.products.id, rawItem.productId)).limit(1);
      if (prodRecord.length === 0) {
        throw new Error(`Product ID ${rawItem.productId} not found.`);
      }
      const product = prodRecord[0];
      
      // Authoritative Price Resolution via M41 Pricing Engine (Strictly Server-Authoritative Waterfall)
      let resolvedPriceInfo: any = null;
      try {
        resolvedPriceInfo = await PricingService.resolveUnitPrice({
          productId: rawItem.productId,
          customerId: req.customerId ? Number(req.customerId) : undefined,
          priceListId: rawItem.priceListId || (rawItem as any).priceListId,
          quantity: rawItem.quantity
        });
      } catch (_) {
        resolvedPriceInfo = {
          unitPrice: product.retailPrice || rawItem.price || rawItem.unitPrice || 0,
          source: 'BASE_PRICE'
        };
      }

      const authoritativeUnitPrice = Number(resolvedPriceInfo.unitPrice) || Number(product.retailPrice) || 0;
      const basePrice = Number(product.retailPrice) || authoritativeUnitPrice;
      const costBasis = Number(product.costPrice) || 0;

      // Calculate combined discount (item line discount + promo code discount)
      let lineDiscountPercent = Number(rawItem.discountPercent) || 0;
      let effectivePromoCode = rawItem.promoCode || req.promoCode || null;
      let promoDiscountPercent = 0;

      if (effectivePromoCode) {
        const cleanPromo = effectivePromoCode.trim().toUpperCase();
        if (cleanPromo === 'NEXUS2026' || cleanPromo === 'O2C_VIP') {
          promoDiscountPercent = 5;
        } else if (cleanPromo === 'SUMMER50') {
          promoDiscountPercent = 8;
        } else if (cleanPromo === 'DISCOUNT10' || cleanPromo === 'VIP10') {
          promoDiscountPercent = 10;
        }
      }

      const totalDiscountPercent = Math.min(100, Math.max(0, lineDiscountPercent + promoDiscountPercent));

      // Calculate Line Pricing via M41 Pricing Calculator
      const pricingResult = PricingService.calculateLinePricing({
        sku: product.sku || "UNKNOWN",
        category: (product as any).category || String(product.categoryId || "UNKNOWN"),
        unitPrice: authoritativeUnitPrice,
        quantity: rawItem.quantity,
        discountPercent: totalDiscountPercent,
        discountAmount: rawItem.discountAmount
      });

      // Calculate Effective Unit Price after discount
      const effectiveUnitPrice = rawItem.quantity > 0
        ? Math.round(pricingResult.taxableAmount / rawItem.quantity)
        : authoritativeUnitPrice;

      // --- M41 MARGIN FLOOR GUARD (Kiểm soát trần sàn an toàn) ---
      const actualMarginPercent = costBasis > 0
        ? PricingService.calculateActualMargin(costBasis, effectiveUnitPrice)
        : 100;

      const minMarginThreshold = req.minMarginPercent !== undefined ? req.minMarginPercent : 0;
      const isBelowCost = costBasis > 0 && effectiveUnitPrice < costBasis;
      const isMarginBreached = costBasis > 0 && actualMarginPercent < minMarginThreshold;

      if ((isBelowCost || isMarginBreached) && !req.allowBelowCostOverride) {
        throw new Error(
          `ERR_MARGIN_FLOOR_VIOLATION: Đơn giá sau chiết khấu (${effectiveUnitPrice.toLocaleString('vi-VN')} ₫) ` +
          `thấp hơn giá vốn an toàn (${costBasis.toLocaleString('vi-VN')} ₫) cho sản phẩm [${product.name}] (SKU: ${product.sku}). ` +
          `Biên lợi nhuận: ${actualMarginPercent.toFixed(1)}% < sàn tối thiểu ${minMarginThreshold}%. ` +
          `Giao dịch bị chặn bởi M41 Margin Floor Guard để bảo vệ lợi nhuận.`
        );
      }

      // Immutable Pricing Snapshot for auditability and invoice reproduction
      const pricingSnapshot = {
        unitPrice: authoritativeUnitPrice,
        basePrice,
        costBasis,
        discountPercent: totalDiscountPercent,
        discountAmount: pricingResult.discountAmount,
        effectiveUnitPrice,
        promoCode: effectivePromoCode,
        taxableAmount: pricingResult.taxableAmount,
        taxRate: pricingResult.taxRate,
        taxAmount: pricingResult.taxAmount,
        totalAmount: pricingResult.totalAmount,
        marginPercent: Math.round(actualMarginPercent * 10) / 10,
        isMarginProtected: true,
        source: resolvedPriceInfo.source,
        contractId: resolvedPriceInfo.contractId || null,
        priceListId: resolvedPriceInfo.priceListId || null,
        isPriceLocked: true,
        resolvedAt: new Date().toISOString()
      };

      totalSubtotal += pricingResult.taxableAmount;
      totalTaxAmount += pricingResult.taxAmount;
      
      validatedItems.push({
        ...rawItem,
        unitPrice: authoritativeUnitPrice,
        price: authoritativeUnitPrice,
        pricingSnapshot,
        product,
        pricingResult,
        costBasis
      });
    }

    const grandTotal = totalSubtotal + totalTaxAmount;
    
    // Gen Standard Order Ref (Format POS-YYYY-XXXXX for POS counter orders)
    const isPosChannel = channel.toUpperCase().startsWith("POS") || channel.toUpperCase() === "COUNTER";
    const prefix = isPosChannel ? "POS" : channel === "B2B" ? "B2B" : "ORD";
    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderRef = externalOrderId
      ? (externalOrderId.startsWith(prefix) ? externalOrderId : `${prefix}-${externalOrderId}`)
      : `${prefix}-${currentYear}-${randomSuffix}`;

    // 2.1. M07 Customer Credit Limit Guard Gate
    let creditGuardResult: any = null;
    let requiresApprovalDueToCredit = false;

    const isPrepaid = req.paymentIntent.method === "CASH" || req.paymentIntent.method === "CARD" || req.paymentIntent.method === "PREPAID";
    if (req.customerId && !isPrepaid) {
      const customer = await db.select().from(schema.customers).where(eq(schema.customers.id, req.customerId)).get();
      if (customer) {
        let customLimit: number | null = null;
        let isCreditBlocked = false;
        try {
          if (customer.notes && customer.notes.startsWith('{')) {
            const parsed = JSON.parse(customer.notes);
            if (typeof parsed.creditLimit === 'number') customLimit = parsed.creditLimit;
            if (typeof parsed.isCreditBlocked === 'boolean') isCreditBlocked = parsed.isCreditBlocked;
          }
        } catch (_) {}

        const activeOrders = await db.select().from(schema.salesOrders).where(
          and(
            eq(schema.salesOrders.customerId, req.customerId),
            sql`${schema.salesOrders.status} != 'CANCELLED'`,
            sql`${schema.salesOrders.paymentStatus} != 'PAID'`
          )
        ).all();

        const creditUsed = activeOrders.reduce((sum, o) => {
          const remainingOnOrder = Math.max(0, (o.finalAmount || 0) - (o.amountPaid || 0));
          return sum + remainingOnOrder;
        }, 0);

        const defaultLimit = customer.customerGroup === 'B2B' ? 1000000000 : (customer.customerGroup === 'VIP' ? 2000000000 : 200000000);
        const creditLimit = customLimit !== null ? customLimit : defaultLimit;
        const availableCredit = creditLimit - creditUsed;
        const exceededAmount = Math.max(0, (creditUsed + grandTotal) - creditLimit);

        if (isCreditBlocked && !req.allowCreditOverride) {
          throw new Error(`ERR_CREDIT_BLOCKED: Khách hàng [${customer.companyName || customer.name}] đang bị KHÓA CÔNG NỢ (Credit Blocked) theo chính sách M07.`);
        }

        if (exceededAmount > 0) {
          if (req.allowCreditOverride || req.creditApprovedBy) {
            creditGuardResult = {
              status: 'APPROVED_WITH_OVERRIDE',
              creditLimit,
              creditUsed,
              orderAmount: grandTotal,
              exceededAmount,
              approvedBy: req.creditApprovedBy || 'MANAGER',
              reason: req.creditOverrideReason || 'Phê duyệt ngoại lệ hạn mức tín dụng'
            };
          } else {
            requiresApprovalDueToCredit = true;
            creditGuardResult = {
              status: 'OVER_LIMIT',
              creditLimit,
              creditUsed,
              availableCredit,
              orderAmount: grandTotal,
              exceededAmount,
              rejectionReason: `Đơn hàng (${grandTotal.toLocaleString('vi-VN')} đ) vượt quá hạn mức tín dụng còn lại (${Math.max(0, availableCredit).toLocaleString('vi-VN')} đ). Vượt mức: ${exceededAmount.toLocaleString('vi-VN')} đ. Chờ quản lý tài chính phê duyệt ngoại lệ hoặc bắt buộc thanh toán trước.`
            };
          }
        } else {
          creditGuardResult = {
            status: 'APPROVED',
            creditLimit,
            creditUsed,
            availableCredit,
            orderAmount: grandTotal,
            availableCreditAfterOrder: availableCredit - grandTotal,
            exceededAmount: 0
          };
        }
      }
    }

    const executeTransaction = async (tx: any) => {
      // 3. FULFILLMENT & INVENTORY LOGIC
      let inventoryStatus = "PENDING";
      let totalCogs = 0;
      let isFulfilled = false;
      const backorderItems: any[] = [];

      if (requiresApprovalDueToCredit) {
        // Must stay pending approval; no stock issue or reservation until manager approval
        inventoryStatus = "PENDING";
      } else if (req.status === "DRAFT") {
        // Draft order; no stock deduction or reservation yet
        inventoryStatus = "PENDING";
      } else if (req.fulfillmentIntent.type === "IMMEDIATE") {
        // POS / Immediate hand-carry stock issue via M17 InventoryService (Single-Writer Authority)
        isFulfilled = true;
        inventoryStatus = "COMPLETED";
        
        for (const item of validatedItems) {
          await InventoryService.postTransaction(tx, {
            productId: item.productId,
            warehouseId: req.warehouseId || 1,
            locationId: item.locationId || null,
            lotId: item.lotId || null,
            type: "SALE_ISSUE", // Authorized transaction type for immediate POS issue
            referenceNo: orderRef,
            quantity: -item.quantity,
            deductReserved: false, // ATP reservation bypass: deduct physical stock directly without touching stock_reservations
            notes: `POS Immediate Stock Issue - ${orderRef}`,
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
        let allSufficient = true;
        const stockChecks: any[] = [];

        for (const item of validatedItems) {
          const avail = await InventoryService.checkAvailability({
            productId: item.productId,
            warehouseId: req.warehouseId || 1,
            quantity: item.quantity
          });

          stockChecks.push({
            productId: item.productId,
            sku: item.product.sku,
            name: item.product.name,
            requestedQty: item.quantity,
            availableStock: avail.available,
            isAvailable: avail.isAvailable
          });

          if (!avail.isAvailable) {
            allSufficient = false;
            backorderItems.push({
              productId: item.productId,
              sku: item.product.sku,
              name: item.product.name,
              requestedQty: item.quantity,
              availableStock: avail.available,
              shortageQty: item.quantity - Math.max(0, avail.available),
              suggestedAction: 'WAITING_TRANSFER_OR_RESTOCK'
            });
          }
        }

        if (allSufficient) {
          inventoryStatus = "RESERVED";
          for (const item of validatedItems) {
            await InventoryService.reserveStock(tx, {
              productId: item.productId,
              warehouseId: req.warehouseId || 1,
              quantity: item.quantity,
              referenceNo: orderRef,
              userId: req.userId,
              notes: `${channel} M17 Reservation - ${orderRef}`
            });
          }
        } else {
          // Stock shortage detected -> Mark as BACKORDER / WAITING_TRANSFER
          inventoryStatus = "BACKORDER";
          for (const item of validatedItems) {
            try {
              const balances = await tx.select().from(schema.stockBalances)
                .where(and(
                  eq(schema.stockBalances.productId, item.productId),
                  eq(schema.stockBalances.warehouseId, req.warehouseId || 1)
                ));
              const maxAvailInLocation = balances.reduce((sum, b) => Math.max(sum, b.stockAvailable || 0), 0);
              const reserveQty = Math.min(item.quantity, maxAvailInLocation);
              if (reserveQty > 0) {
                await InventoryService.reserveStock(tx, {
                  productId: item.productId,
                  warehouseId: req.warehouseId || 1,
                  quantity: reserveQty,
                  referenceNo: orderRef,
                  userId: req.userId,
                  notes: `${channel} M17 Partial Reservation - Backorder for ${orderRef}`
                });
              }
            } catch (resErr) {
              console.warn("M17 partial reservation safe fallback:", resErr);
            }
          }
        }
      }

      const isCod = req.paymentIntent.method === "COD";
      const isCredit = req.paymentIntent.method === "CREDIT";
      const initialPaymentStatus = (isFulfilled || req.paymentIntent.amount === grandTotal) && !isCod && !isCredit ? "PAID" : "UNPAID";
      
      const orderStatus = requiresApprovalDueToCredit
        ? "PENDING_APPROVAL"
        : (req.status === "DRAFT"
            ? "DRAFT"
            : (isFulfilled
                ? "COMPLETED"
                : (inventoryStatus === "RESERVED" ? "RESERVED" : "CONFIRMED")));

      const glRef = `JE-${orderRef}`;

      // 4. Create Order
      const notesJson = JSON.stringify({
        channel,
        source,
        externalOrderId,
        idempotencyKey,
        customerName: req.customerName,
        paymentMethod: req.paymentIntent.method,
        fulfillmentStatus: inventoryStatus === "BACKORDER" ? "WAITING_TRANSFER" : inventoryStatus,
        fulfillmentType: req.fulfillmentIntent.type,
        reservationStatus: inventoryStatus === "RESERVED" ? "RESERVED" : (inventoryStatus === "BACKORDER" ? "BACKORDER" : "PENDING"),
        cogsAmount: totalCogs,
        glRef: isFulfilled ? glRef : undefined,
        requiresVatInvoice: req.requiresVatInvoice,
        vatDetails: req.vatDetails,
        salesRepId: req.salesRepId,
        creditGuardResult,
        requiresManagerApproval: requiresApprovalDueToCredit,
        creditBlockReason: creditGuardResult?.rejectionReason,
        pricingEngineResolution: {
          resolvedBy: "M41_PRICING_ENGINE",
          resolvedAt: new Date().toISOString(),
          isPriceLocked: true
        },
        backorderItems: inventoryStatus === "BACKORDER" ? backorderItems : undefined,
        items: validatedItems.map(it => ({
          id: it.productId,
          sku: it.product.sku,
          name: it.product.name,
          quantity: it.quantity,
          price: it.price,
          total: it.price * it.quantity,
          pricingSnapshot: it.pricingSnapshot
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
        sourceType: req.sourceType,
        sourceId: req.sourceId,
        createdBy: req.userId
      }).returning();
      
      const orderId = insertedOrder.id;

      // 5. Order Lines with Immutable Pricing Snapshot
      for (const item of validatedItems) {
        await tx.insert(schema.salesOrderItems).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          discountAmount: item.pricingResult.discountAmount,
          taxRate: item.pricingResult.taxRate,
          subtotal: item.pricingResult.taxableAmount,
          notes: JSON.stringify({
            sku: item.product.sku,
            pricingSnapshot: item.pricingSnapshot,
            resolvedAt: item.pricingSnapshot?.resolvedAt || new Date().toISOString()
          })
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

        if (req.paymentIntent.method === "CASH" || (req.paymentIntent.splits && req.paymentIntent.splits.some(s => s.method === "CASH"))) {
          try {
            let activeShift: any = null;
            if (req.shiftId) {
              const shifts = await tx.select().from(schema.cashShifts)
                .where(eq(schema.cashShifts.id, req.shiftId))
                .limit(1);
              if (shifts.length > 0 && (shifts[0].status === "ACTIVE" || shifts[0].status === "OPEN")) {
                activeShift = shifts[0];
              }
            }
            if (!activeShift) {
              const activeShifts = await tx.select().from(schema.cashShifts)
                .where(or(eq(schema.cashShifts.status, "ACTIVE"), eq(schema.cashShifts.status, "OPEN")))
                .orderBy(desc(schema.cashShifts.openedAt))
                .limit(1);
              activeShift = activeShifts.length > 0 ? activeShifts[0] : null;
            }

            const isPos = isPosChannel || channel.toUpperCase().includes("POS");
            if (!activeShift && isPos) {
              try {
                const autoShift = await ShiftEngine.openShift({
                  cashDrawerId: 1,
                  cashierUserId: String(req.userId || 1),
                  cashierName: req.customerName || "POS Cashier",
                  openingFloat: 0,
                  notes: `Auto-opened shift for POS sale ${orderRef}`
                }, tx);
                if (autoShift && autoShift.length > 0) {
                  activeShift = autoShift[0];
                }
              } catch (openErr) {
                // If drawer is already occupied or shift exists in another state, attempt to find latest shift
                const fallbackShifts = await tx.select().from(schema.cashShifts)
                  .orderBy(desc(schema.cashShifts.openedAt))
                  .limit(1);
                if (fallbackShifts.length > 0 && (fallbackShifts[0].status === "ACTIVE" || fallbackShifts[0].status === "OPEN")) {
                  activeShift = fallbackShifts[0];
                }
              }
            }
            
            const cashAmount = req.paymentIntent.splits
              ? (req.paymentIntent.splits.find(s => s.method === "CASH")?.amount || 0)
              : (req.paymentIntent.method === "CASH" ? (req.paymentIntent.amount || grandTotal) : 0);

            if (cashAmount > 0 && activeShift && activeShift.id) {
              await new CashMovementService().postMovement({
                shiftId: activeShift.id,
                cashDrawerId: activeShift.cashDrawerId || 1,
                movementType: 'SALE_CASH',
                amount: cashAmount,
                direction: 'IN',
                custodianId: String(req.userId || 1),
                fromLocation: 'CUSTOMER',
                toLocation: 'DRAWER',
                referenceNo: `PAY-${payment.id}`,
                idempotencyKey: `CM-PAY-${payment.id}`,
                notes: `Cash sale for order ${orderRef} (${channel})`
              }, tx);
            }
          } catch (e) {
            console.error("CashMovement error", e);
          }
        }
      }

      // 7. GL Accounting - VAS Double-Entry Postings via M30 Accounting Authority (Immediate fulfillment)
      if (isFulfilled) {
        const resolveDebitAccount = (method: string) => {
          const m = (method || "").toUpperCase();
          if (m === "CASH") return "1111"; // Tiền mặt tại quỹ
          if (m === "CREDIT") return "1311"; // Phải thu của khách hàng
          return "1121"; // Tiền gửi ngân hàng / QR / Thẻ / Ví điện tử / Chuyển khoản
        };

        const isPos = isPosChannel || channel.toUpperCase().includes("POS");
        const sourceModule = isPos ? "M16_POS_RETAIL" : `SALES_${channel}`;

        // Check if split payments exist
        const splits = req.paymentIntent.splits && req.paymentIntent.splits.length > 0
          ? req.paymentIntent.splits
          : [{ method: req.paymentIntent.method || "CASH", amount: grandTotal }];

        // Post Revenue (Có TK 5111) & VAT (Có TK 33311) per payment method
        for (let i = 0; i < splits.length; i++) {
          const split = splits[i];
          const debitAccount = resolveDebitAccount(split.method);
          const ratio = grandTotal > 0 ? (split.amount / grandTotal) : (1 / splits.length);
          const splitSubtotal = Math.round(totalSubtotal * ratio);
          const splitTax = Math.round(totalTaxAmount * ratio);
          const splitSuffix = splits.length > 1 ? `-${i + 1}` : "";

          // 1. Doanh thu bán lẻ hàng hóa: Nợ 1111/1121 -> Có 5111
          if (splitSubtotal > 0) {
            await accountingEngine.postJournal({
              entryCode: `JE-REV-${orderRef}${splitSuffix}`,
              sourceModule,
              sourceDocumentType: "SALES_ORDER",
              sourceDocumentId: orderId,
              sourceReferenceNo: orderRef,
              debitAccount,
              creditAccount: "5111",
              amount: splitSubtotal,
              description: `Doanh thu bán lẻ ${orderRef} (${split.method})`,
              branchId: req.branchId || 1,
              customerId: req.customerId || null,
              userId: req.userId
            }, tx);
          }

          // 2. Thuế GTGT đầu ra: Nợ 1111/1121 -> Có 33311
          if (splitTax > 0) {
            await accountingEngine.postJournal({
              entryCode: `JE-VAT-${orderRef}${splitSuffix}`,
              sourceModule,
              sourceDocumentType: "SALES_ORDER",
              sourceDocumentId: orderId,
              sourceReferenceNo: orderRef,
              debitAccount,
              creditAccount: "33311",
              amount: splitTax,
              description: `Thuế GTGT đầu ra bán lẻ ${orderRef} (${split.method})`,
              branchId: req.branchId || 1,
              customerId: req.customerId || null,
              userId: req.userId
            }, tx);
          }
        }

        // 3. Giá vốn hàng bán: Nợ TK 632 -> Có TK 1561 (Hàng hóa kho bán lẻ)
        if (totalCogs > 0) {
          await accountingEngine.postJournal({
            entryCode: `JE-COGS-${orderRef}`,
            sourceModule,
            sourceDocumentType: "SALES_ORDER",
            sourceDocumentId: orderId,
            sourceReferenceNo: orderRef,
            debitAccount: "632",
            creditAccount: "1561",
            amount: totalCogs,
            description: `Giá vốn hàng bán ${orderRef} (M42 Costing Authority)`,
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
        requiresApproval: requiresApprovalDueToCredit,
        creditGuardResult,
        message: requiresApprovalDueToCredit
          ? "Đơn hàng đã được lưu ở trạng thái CHỜ PHÊ DUYỆT (PENDING_APPROVAL) do vượt hạn mức công nợ khách hàng."
          : "Order created successfully."
      };
    };

    const runTxWithRetry = async () => {
      let attempts = 0;
      while (attempts < 4) {
        try {
          if (txContext) {
            return await executeTransaction(txContext);
          } else {
            return await db.transaction(executeTransaction);
          }
        } catch (err: any) {
          if (err?.message?.includes('SQLITE_BUSY') || err?.code === 'SQLITE_BUSY') {
            attempts++;
            await new Promise(r => setTimeout(r, 100 * attempts));
            if (attempts >= 4) throw err;
          } else {
            throw err;
          }
        }
      }
    };

    return await runTxWithRetry();
  }
}
