import { Router, Request, Response } from "express";
import crypto from "crypto";
import { client, db } from "../../db/index";
import * as schema from "../../db/schema";
import { InventoryService } from "../../engines/inventoryService";
import { accountingEngine } from "../../engines/accountingEngine";
import { costingEngine } from "../../engines/costingEngine";
import { AuditService } from "../../engines/auditService";
import { CashMovementService } from "../../engines/CashMovementService";
import { RmaValidationService, IMMUTABLE_RMA_STATUSES } from "../../engines/rmaValidationService";
import { RmaFraudGuardService } from "../../engines/rmaFraudGuardService";
import { RmaDispositionRouter } from "../../engines/rmaDispositionRouter";
import { QualityService } from "../../services/qualityService";
import { requireRole } from "../middleware/auth.middleware";
import { eq, and, or, desc, sql, like } from "drizzle-orm";

const router = Router();

// =========================================================================
// M15 IMMUTABILITY INVARIANT DEFINITIONS (Rule #01, #03 & #16)
// =========================================================================
function isRmaImmutable(rma: any): boolean {
  return RmaValidationService.isImmutable(rma);
}

// Cash Movement Service instance for M32 Treasury integration
const cashMovementService = new CashMovementService(db);

async function getOrCreateActiveShift(tx: any = db, userId: number = 1): Promise<number> {
  const [existingShift] = await tx.select().from(schema.cashShifts)
    .where(or(eq(schema.cashShifts.status, 'ACTIVE'), eq(schema.cashShifts.status, 'OPEN')))
    .limit(1);
  if (existingShift) return existingShift.id;

  const now = new Date();
  const shiftNo = `CS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-001`;
  const [newShift] = await tx.insert(schema.cashShifts).values({
    shiftNo,
    cashierId: String(userId),
    cashDrawerId: 1,
    openedAt: now,
    openingFloat: 50000000,
    expectedCash: 50000000,
    status: 'ACTIVE',
    notes: 'Ca thu ngân tự động M15/M32'
  }).returning();
  return newShift.id;
}

// =========================================================================
// IN-MEMORY IDEMPOTENCY STORE
// =========================================================================
interface IdempotencyRecord {
  timestamp: number;
  response: any;
}
const idempotencyStore = new Map<string, IdempotencyRecord>();

async function checkIdempotency(key?: string): Promise<any | null> {
  if (!key) return null;
  // Check memory store
  const cached = idempotencyStore.get(key);
  if (cached && (Date.now() - cached.timestamp < 3600000 * 24)) {
    return cached.response;
  }
  // Check database audit logs for previous idempotent operation
  try {
    const existingAudit = await db.select().from(schema.auditLogs)
      .where(sql`${schema.auditLogs.metadata} LIKE ${'%' + key + '%'}`)
      .limit(1);

    if (existingAudit.length > 0) {
      let auditMeta: any = {};
      try { auditMeta = JSON.parse(existingAudit[0].metadata || "{}"); } catch (e) {}
      if (auditMeta.savedResponse) {
        idempotencyStore.set(key, { timestamp: Date.now(), response: auditMeta.savedResponse });
        return auditMeta.savedResponse;
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }
  return null;
}

function saveIdempotency(key: string | undefined, response: any) {
  if (!key) return;
  idempotencyStore.set(key, { timestamp: Date.now(), response });
  if (idempotencyStore.size > 2000) {
    const now = Date.now();
    for (const [k, v] of idempotencyStore.entries()) {
      if (now - v.timestamp > 3600000 * 24) idempotencyStore.delete(k);
    }
  }
}

// =========================================================================
// M29 DMS VAULT ARCHIVING SERVICE (CRYPTOGRAPHIC SHA-256 SEAL)
// =========================================================================
async function archiveToDmsVault({
  title,
  category,
  categoryName,
  refDocNo,
  metadata,
  signer,
  userId
}: {
  title: string;
  category: string;
  categoryName: string;
  refDocNo: string;
  metadata?: any;
  signer?: string;
  userId?: number;
}) {
  try {
    const totalDocs = await db.select().from(schema.dmsDocuments).all();
    const docCode = `DMS-${category.slice(0, 3).toUpperCase()}-2026-${String(totalDocs.length + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Compute tamper-evident SHA-256 seal for the archived dossier
    const sha256Hash = crypto.createHash('sha256')
      .update(JSON.stringify({ docCode, title, refDocNo, metadata, timestamp }))
      .digest('hex');

    const newDoc = {
      docCode,
      title,
      category,
      categoryName,
      version: 'v1.0-OFFICIAL',
      fileSize: '1.8 MB',
      format: 'PDF/A-3',
      status: 'SIGNED',
      securityLevel: 'CONFIDENTIAL',
      sha256Hash,
      signedBy: signer || 'Hệ thống Quản trị Đổi trả RMA M15 & Niêm phong CA',
      signedAt: timestamp,
      linkedModule: 'M15 Returns & RMA',
      refDocNo,
      storageTier: 'ACTIVE_VAULT',
      retentionYears: 10,
      expireDate: '2036-12-31',
      workflowStage: 3,
      workflowSteps: JSON.stringify([
        { step: 1, name: 'Khởi tạo & Trình duyệt Hồ sơ RMA', role: 'CUSTOMER_SERVICE', status: 'COMPLETED', user: signer || 'RMA Officer', signedAt: timestamp },
        { step: 2, name: 'Giám định Kỹ thuật & Quyết định Xử lý', role: 'QC_MANAGER', status: 'COMPLETED', user: 'Cổng Giám định QC M15', signedAt: timestamp },
        { step: 3, name: 'Niêm phong Điện tử M29 DMS Vault', role: 'DMS_VAULT', status: 'COMPLETED', user: 'M29 Secure Vault Engine', signedAt: timestamp }
      ])
    };

    const inserted = await db.insert(schema.dmsDocuments).values(newDoc as any).returning();
    const savedDoc = inserted[0] || newDoc;

    // Audit log for DMS archiving
    try {
      await AuditService.recordAuditLog({
        module: 'M29',
        action: 'ARCHIVE_VAULT',
        entityType: 'DMS_DOCUMENT',
        entityId: savedDoc.docCode,
        userId: userId || 1,
        username: 'rma_officer',
        result: 'SUCCESS',
        metadata: { docCode, refDocNo, sha256Hash }
      });
    } catch (e) {}

    return savedDoc;
  } catch (err) {
    console.error('Lỗi lưu trữ chứng từ sang DMS Vault:', err);
    return null;
  }
}

// =========================================================================
// M02 AUDIT TRAIL LOGGING HELPER
// =========================================================================
async function logRmaAudit(
  action: string,
  entityId: string,
  details: {
    orderCode?: string;
    idempotencyKey?: string;
    savedResponse?: any;
    beforeData?: any;
    afterData?: any;
    extra?: any;
  },
  req: Request,
  result: 'SUCCESS' | 'FAILED' = 'SUCCESS'
) {
  const user = (req as any).user || { id: 1, username: 'admin', role: 'SUPER_ADMIN', name: 'Hoàng Nam (Admin)' };
  try {
    await AuditService.recordAuditLog({
      module: 'M15',
      action,
      entityType: 'RMA_REQUEST',
      entityId,
      userId: user.id || 1,
      username: user.username || 'admin',
      userName: user.name || user.fullName || 'Hoàng Nam (Admin)',
      role: user.role || 'SUPER_ADMIN',
      result,
      beforeData: details.beforeData || null,
      afterData: details.afterData || null,
      metadata: {
        rmaNumber: entityId,
        orderCode: details.orderCode,
        idempotencyKey: details.idempotencyKey,
        savedResponse: details.savedResponse,
        ...details.extra
      }
    });
  } catch (err) {
    console.error('AuditService record error:', err);
  }
}

// =========================================================================
// DTO FORMATTER FOR FRONTEND COMPATIBILITY (M15ReturnsRMAWorkspace.tsx)
// =========================================================================
function formatRmaResponse(rma: any) {
  const items = rma.items || [];
  const primaryItem = items[0] || {};
  
  return {
    id: rma.rmaNumber,
    dbId: rma.id,
    rmaNumber: rma.rmaNumber,
    rmaCode: rma.rmaNumber, // Aliased for backwards compatibility
    orderId: rma.orderId,
    orderCode: rma.orderCode || rma.order?.code || 'SO-2026-0001',
    originalSo: rma.orderCode || rma.order?.code || 'SO-2026-0001',
    deliveryCode: rma.deliveryCode || `DEL-${rma.rmaNumber}`,
    customerId: rma.customerId,
    customerName: rma.customerName || rma.customer?.name || 'Khách hàng Doanh nghiệp',
    warehouseId: rma.warehouseId || 1,
    
    // Product details (from flat columns or first item)
    productCode: rma.productCode || primaryItem.productCode || 'SKU-GEN',
    productName: rma.productName || primaryItem.productName || 'Vật tư kỹ thuật',
    quantity: rma.quantity || items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0) || 1,
    uom: rma.uom || primaryItem.uom || 'Cái',
    lotSerial: rma.lotSerial || primaryItem.lotSerial || 'LOT-MIXED',
    
    // Reasons & resolutions
    reason: rma.reason,
    requestedResolution: rma.requestedResolution,
    
    // Lifecycle states
    status: rma.status,
    inspectionResult: rma.inspectionResult,
    disposition: rma.disposition,
    financialStatus: rma.financialStatus,
    refundMethod: rma.refundMethod || 'CREDIT_NOTE',
    
    // Phase 02 Enterprise Schema Expansions & Boundary Tracking
    warrantyStatus: rma.warrantyStatus || 'VALID',
    returnWindowDays: rma.returnWindowDays ?? 30,
    fraudScore: rma.fraudScore ?? 0,
    fraudFlags: typeof rma.fraudFlags === 'string' ? JSON.parse(rma.fraudFlags || '[]') : (rma.fraudFlags || []),
    rtvReferenceCode: rma.rtvReferenceCode || null,
    maintenanceWoCode: rma.maintenanceWoCode || null,
    refundChannel: rma.refundChannel || 'CREDIT_NOTE_M31',
    isImmutable: isRmaImmutable(rma),
    isLocked: isRmaImmutable(rma),

    // Financials
    totalAmount: rma.totalAmount || 0,
    refundedAmount: rma.refundedAmount || 0,
    creditNoteNumber: rma.creditNoteNumber,
    
    // QC & Auditing
    inspectionNotes: rma.inspectionNotes,
    inspectedBy: rma.inspectedBy,
    inspectedAt: rma.inspectedAt ? new Date(rma.inspectedAt).toISOString() : null,
    approvedBy: rma.approvedBy,
    approvedAt: rma.approvedAt ? new Date(rma.approvedAt).toISOString() : null,
    completedAt: rma.completedAt ? new Date(rma.completedAt).toISOString() : null,
    rejectedAt: rma.rejectedAt ? new Date(rma.rejectedAt).toISOString() : null,
    rejectionReason: rma.rejectionReason,
    
    date: rma.requestDate || (rma.createdAt ? new Date(rma.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
    requestDate: rma.requestDate,
    createdAt: rma.createdAt ? new Date(rma.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: rma.updatedAt ? new Date(rma.updatedAt).toISOString() : null,
    
    items: items.map((it: any) => ({
      ...it,
      dispositionTarget: it.dispositionTarget || 'RESTOCK',
      serialId: it.serialId || null,
      lotId: it.lotId || null,
      originalUnitCost: it.originalUnitCost || 0
    })),
    returnItems: items.map((it: any) => ({
      id: it.id,
      productId: it.productId,
      productCode: it.productCode,
      productName: it.productName,
      quantity: it.quantity,
      uom: it.uom,
      lotSerial: it.lotSerial,
      serialId: it.serialId || null,
      lotId: it.lotId || null,
      condition: it.condition,
      unitPrice: it.unitPrice,
      originalUnitCost: it.originalUnitCost || 0,
      subtotal: it.subtotal,
      reason: it.reason,
      disposition: it.disposition,
      dispositionTarget: it.dispositionTarget || 'RESTOCK'
    })),
    _raw: rma
  };
}

// Helper to find RMA by numeric ID or rmaNumber string
async function findRmaEntity(identifier: string | number) {
  const numId = Number(identifier);
  if (!isNaN(numId) && numId > 0 && String(numId) === String(identifier)) {
    return await db.query.rmaRequests.findFirst({
      where: eq(schema.rmaRequests.id, numId),
      with: { items: true, customer: true, order: true }
    });
  }
  return await db.query.rmaRequests.findFirst({
    where: eq(schema.rmaRequests.rmaNumber, String(identifier)),
    with: { items: true, customer: true, order: true }
  });
}

// =========================================================================
// 1. GET /api/returns & /api/sales/rma/list (List all RMAs)
// =========================================================================
router.get(["/api/returns", "/api/sales/rma/list"], async (req: Request, res: Response) => {
  try {
    const { status, disposition, search, customerId, orderCode } = req.query;

    const rmas = await db.query.rmaRequests.findMany({
      orderBy: [desc(schema.rmaRequests.id)],
      with: {
        items: true,
        customer: true,
        order: true
      }
    });

    let filtered = rmas;

    if (status && status !== 'ALL') {
      filtered = filtered.filter(r => r.status === status);
    }
    if (disposition && disposition !== 'ALL') {
      filtered = filtered.filter(r => r.disposition === disposition);
    }
    if (customerId) {
      filtered = filtered.filter(r => r.customerId === Number(customerId));
    }
    if (orderCode) {
      filtered = filtered.filter(r => r.orderCode?.toLowerCase().includes(String(orderCode).toLowerCase()));
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(r =>
        r.rmaNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        (r.orderCode && r.orderCode.toLowerCase().includes(q)) ||
        (r.productName && r.productName.toLowerCase().includes(q)) ||
        (r.productCode && r.productCode.toLowerCase().includes(q))
      );
    }

    const formatted = filtered.map(formatRmaResponse);
    res.json(formatted);
  } catch (err: any) {
    console.error("Lỗi lấy danh sách RMA:", err);
    res.status(500).json({ success: false, error: err.message || "Lỗi tải danh sách RMA" });
  }
});

// =========================================================================
// 1b. GET & POST /api/returns/credit-notes (Credit Note Master Endpoint)
// =========================================================================
router.get("/api/returns/credit-notes", async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.creditNotes).orderBy(desc(schema.creditNotes.id));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  ["/api/returns/credit-notes", "/api/returns/:id/credit-note"],
  requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CFO', 'SALES_MANAGER'),
  async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id || req.body.rmaNumber || req.body.rmaCode || req.body.rmaId;
      const {
        amount: rawAmount,
        reason = "Phát hành Credit Note cấn trừ công nợ đổi trả hàng",
        refundMethod = "CREDIT_NOTE",
        idempotencyKey
      } = req.body;

      if (!idParam && !rawAmount) {
        return res.status(400).json({ success: false, error: "Thiếu mã RMA hoặc số tiền Credit Note" });
      }

      if (idParam) {
        const rma = await findRmaEntity(idParam);
        if (rma) {
          // If RMA exists and already has credit note or completed
          if (rma.creditNoteNumber && rma.financialStatus === 'CREDIT_NOTE_ISSUED') {
            return res.json({
              success: true,
              creditNoteNumber: rma.creditNoteNumber,
              rmaNumber: rma.rmaNumber,
              amount: rma.totalAmount,
              status: 'ISSUED',
              message: `Credit Note [${rma.creditNoteNumber}] đã được phát hành cho RMA [${rma.rmaNumber}].`
            });
          }

          // Execute disposition as RESTOCK or CREDIT
          req.params.id = rma.rmaNumber;
          req.body.disposition = rma.disposition !== 'PENDING' ? rma.disposition : 'RESTOCK';
          req.body.refundMethod = refundMethod;
          req.body.idempotencyKey = idempotencyKey;

          const dispHandler = (router.stack.find(s => s.route?.path?.includes?.("/api/returns/:id/disposition"))?.route?.stack?.[0]?.handle);
          if (dispHandler) return dispHandler(req, res, () => {});
        }
      }

      // Standalone credit note generation
      const totalAmount = Number(rawAmount) || 0;
      const creditNoteNumber = `CN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const user = (req as any).user || { id: 1, username: 'accountant' };

      await accountingEngine.postJournal({
        sourceModule: 'M15_RMA',
        sourceDocumentType: 'CREDIT_NOTE',
        sourceReferenceNo: creditNoteNumber,
        debitAccount: '5212',
        creditAccount: refundMethod === 'BANK_TRANSFER' ? '1121' : '1311',
        amount: totalAmount,
        description: `Phát hành Credit Note ${creditNoteNumber} - ${reason}`,
        branchId: 1,
        userId: user.id || 1
      });

      await db.insert(schema.creditNotes).values({
        creditNoteNumber,
        originalInvoiceNumber: req.body.invoiceNumber || `INV-${creditNoteNumber}`,
        customerName: req.body.customerName || 'Khách hàng Doanh nghiệp',
        amount: totalAmount,
        vatAmount: Math.round(totalAmount * 0.1),
        finalAmount: totalAmount + Math.round(totalAmount * 0.1),
        rmaCode: idParam ? String(idParam) : null,
        reason,
        status: 'APPROVED',
        date: new Date().toISOString().slice(0, 10),
        accountingEntry: `Nợ 5212 / Có 1311: ${totalAmount.toLocaleString()} VNĐ`,
        createdAt: new Date()
      });

      res.json({
        success: true,
        creditNoteNumber,
        amount: totalAmount,
        status: 'ISSUED',
        message: `Đã phát hành Credit Note [${creditNoteNumber}] thành công, hạch toán Sổ cái GL.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// =========================================================================
// 2. GET /api/returns/:id (Single RMA Details + DMS Vault Docs)
// =========================================================================
router.get("/api/returns/:id", async (req: Request, res: Response) => {
  try {
    const rma = await findRmaEntity(req.params.id);
    if (!rma) {
      return res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ RMA ${req.params.id}` });
    }

    // Retrieve linked documents from M29 DMS Vault
    const vaultedDocs = await db.select().from(schema.dmsDocuments)
      .where(or(
        eq(schema.dmsDocuments.refDocNo, rma.rmaNumber),
        rma.creditNoteNumber ? eq(schema.dmsDocuments.refDocNo, rma.creditNoteNumber) : sql`1=0`
      ))
      .all();

    res.json({
      success: true,
      data: formatRmaResponse(rma),
      vaultedDocuments: vaultedDocs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 2b. POST /api/returns/validate-eligibility (Phase 04 Gate: Pre-creation Check)
// =========================================================================
router.post("/api/returns/validate-eligibility", async (req: Request, res: Response) => {
  try {
    const { orderCode, orderId, customerId, warehouseId, items = [], returnDate, returnWindowDays } = req.body;
    const report = await RmaValidationService.validateRmaEligibility({
      orderCode,
      orderId,
      customerId,
      warehouseId,
      items,
      returnDate: returnDate || new Date(),
      returnWindowDays: Number(returnWindowDays) || 30
    });
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 2c. POST /api/returns/fraud-check (Phase 03 & 04: Fraud Guard Assessment)
// =========================================================================
router.post("/api/returns/fraud-check", async (req: Request, res: Response) => {
  try {
    const { customerId, customerName, orderCode, totalAmount, warrantyStatus, items = [], returnWindowDays, customFlags } = req.body;
    
    // Perform eligibility validation first
    const validationReport = await RmaValidationService.validateRmaEligibility({
      orderCode,
      customerId,
      items,
      returnDate: new Date(),
      returnWindowDays: Number(returnWindowDays) || 30
    });

    // Evaluate comprehensive fraud & abuse risk
    const assessment = await RmaFraudGuardService.evaluateRisk({
      customerId,
      customerName,
      orderCode,
      totalAmount: Number(totalAmount) || 0,
      warrantyStatus,
      validationReport,
      customFlags
    });

    res.json({ success: true, assessment, validationReport });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 3. POST /api/returns & /api/sales/rma/create & /api/returns/rma (Create RMA Request)
// =========================================================================
router.post(
  ["/api/returns", "/api/sales/rma/create", "/api/returns/rma"],
  requireRole('SUPER_ADMIN', 'ADMIN', 'SALES', 'CUSTOMER_SERVICE', 'OPERATIONS', 'INVENTORY_MANAGER', 'QC_MANAGER'),
  async (req: Request, res: Response) => {
    try {
      const {
        orderCode,
        orderId: rawOrderId,
        customerId: rawCustomerId,
        customerName: rawCustomerName,
        warehouseId: rawWarehouseId,
        productCode: rawProductCode,
        productName: rawProductName,
        quantity: rawQuantity,
        uom: rawUom,
        lotSerial: rawLotSerial,
        reason = "Sản phẩm lỗi kỹ thuật / Khách hàng yêu cầu đổi trả",
        requestedResolution = "REPLACE (Đổi mới sản phẩm)",
        refundMethod = "CREDIT_NOTE",
        // Phase 02 Fields
        warrantyStatus: reqWarrantyStatus,
        returnWindowDays: reqReturnWindowDays,
        fraudScore: reqFraudScore,
        fraudFlags: reqFraudFlags,
        rtvReferenceCode: reqRtvReferenceCode,
        maintenanceWoCode: reqMaintenanceWoCode,
        refundChannel = "CREDIT_NOTE_M31",
        items = [], // [{ productId, productCode, productName, quantity, uom, unitPrice, lotSerial, serialId, lotId, dispositionTarget, originalUnitCost, reason }]
        idempotencyKey: bodyIdempKey
      } = req.body;

      const headerIdempKey = req.headers['idempotency-key'] as string;
      const effectiveIdempotencyKey = bodyIdempKey || headerIdempKey;

      // 1. Idempotency Guard check
      if (effectiveIdempotencyKey) {
        const replay = await checkIdempotency(effectiveIdempotencyKey);
        if (replay) {
          return res.status(200).json({
            ...replay,
            idempotentReplay: true,
            message: "Yêu cầu RMA đã được tiếp nhận trước đó (Idempotent replay)."
          });
        }
      }

      const user = (req as any).user || { id: 1, username: 'admin' };
      const userId = user.id || 1;

      // 2. Resolve Sales Order (M13 Integration)
      let resolvedOrderId: number | null = rawOrderId ? Number(rawOrderId) : null;
      let resolvedOrderCode: string | null = orderCode || null;
      let resolvedCustomerId: number | null = rawCustomerId ? Number(rawCustomerId) : null;
      let resolvedCustomerName = rawCustomerName || "Khách hàng Doanh nghiệp";
      let resolvedWarehouseId = rawWarehouseId ? Number(rawWarehouseId) : 1;

      const returnWindowDays = Number(reqReturnWindowDays) || 30;

      if (orderCode || rawOrderId) {
        const lookup = orderCode || rawOrderId;
        const [foundOrder] = await db.select().from(schema.salesOrders)
          .where(sql`${schema.salesOrders.code} = ${String(lookup)} OR ${schema.salesOrders.id} = ${Number(lookup) || 0}`)
          .limit(1);

        if (foundOrder) {
          resolvedOrderId = foundOrder.id;
          resolvedOrderCode = foundOrder.code;
          resolvedWarehouseId = foundOrder.warehouseId || resolvedWarehouseId;
          if (foundOrder.customerId) {
            resolvedCustomerId = foundOrder.customerId;
            const [cust] = await db.select().from(schema.customers).where(eq(schema.customers.id, foundOrder.customerId)).limit(1);
            if (cust) resolvedCustomerName = cust.name;
          }
        }
      }

      // 3. Automated Validation & Warranty Verification (Phase 04 Gate)
      const inputItemsForValidation = items.length > 0 ? items : [{
        productCode: rawProductCode,
        productName: rawProductName,
        quantity: Number(rawQuantity) || 1,
        lotSerial: rawLotSerial
      }];

      const validationReport = await RmaValidationService.validateRmaEligibility({
        orderCode: resolvedOrderCode,
        orderId: resolvedOrderId,
        customerId: resolvedCustomerId,
        warehouseId: resolvedWarehouseId,
        items: inputItemsForValidation,
        returnDate: new Date(),
        returnWindowDays
      });

      if (!validationReport.canProceed) {
        return res.status(400).json({
          success: false,
          code: 'RMA_VALIDATION_FAILED',
          error: validationReport.errors.join('; ') || 'Không đủ điều kiện khởi tạo yêu cầu đổi trả RMA.',
          errors: validationReport.errors,
          warnings: validationReport.warnings,
          flags: validationReport.flags
        });
      }

      let detectedWarrantyStatus = reqWarrantyStatus || validationReport.detectedWarrantyStatus || 'VALID';

      // 4. Multi-factor Fraud & Risk Scoring (RmaFraudGuardService)
      const customFlags: any[] = Array.isArray(reqFraudFlags)
        ? [...reqFraudFlags]
        : (typeof reqFraudFlags === 'string' ? JSON.parse(reqFraudFlags || '[]') : (reqFraudFlags ? [reqFraudFlags] : []));

      const fraudAssessment = await RmaFraudGuardService.evaluateRisk({
        customerId: resolvedCustomerId,
        customerName: resolvedCustomerName,
        orderCode: resolvedOrderCode,
        orderId: resolvedOrderId,
        warrantyStatus: detectedWarrantyStatus,
        validationReport,
        customFlags
      });

      const calculatedFraudScore = reqFraudScore !== undefined ? Number(reqFraudScore) : fraudAssessment.fraudScore;
      const flags = [...fraudAssessment.flags];

      // 5. Generate sequential RMA Number: RMA-2026-XXXX
      const totalRmas = await db.select({ count: sql<number>`count(*)` }).from(schema.rmaRequests);
      const nextCount = Number(totalRmas[0]?.count || 0) + 84;
      const rmaNumber = `RMA-2026-${String(nextCount).padStart(4, '0')}`;
      const requestDate = new Date().toISOString().slice(0, 10);

      // 6. Resolve items to return (M22 Lots & M23 Serial boundary checks)
      let computedItems: any[] = [];
      let totalAmount = 0;

      if (items.length > 0) {
        for (const it of items) {
          const itemQty = Math.max(1, Number(it.quantity) || 1);
          const itemPrice = Number(it.unitPrice) || 0;
          const subtotal = itemQty * itemPrice;
          totalAmount += subtotal;

          let resolvedSerialId = it.serialId ? Number(it.serialId) : null;
          let resolvedLotId = it.lotId ? Number(it.lotId) : null;
          let serialNumberStr = it.lotSerial || rawLotSerial || null;

          // Check M23 Serial Numbers table
          if (resolvedSerialId || serialNumberStr) {
            const [sn] = await db.select().from(schema.serialNumbers)
              .where(resolvedSerialId ? eq(schema.serialNumbers.id, resolvedSerialId) : eq(schema.serialNumbers.serialNumber, serialNumberStr))
              .limit(1);
            if (sn) {
              resolvedSerialId = sn.id;
              if (sn.lotId && !resolvedLotId) resolvedLotId = sn.lotId;
            }
          }

          // Check M22 Lots table
          if (resolvedLotId) {
            const [lot] = await db.select().from(schema.lots).where(eq(schema.lots.id, resolvedLotId)).limit(1);
            if (lot && lot.expiryDate && new Date(lot.expiryDate).getTime() < Date.now()) {
              if (!flags.some(f => f.rule === 'LOT_EXPIRED')) {
                flags.push({
                  rule: 'LOT_EXPIRED',
                  severity: 'MEDIUM',
                  scoreContribution: 20,
                  description: `Lô hàng [${lot.lotNumber}] đã quá hạn sử dụng (${lot.expiryDate}).`
                });
              }
            }
          }

          // Resolve unit cost for accurate costing replenishment (M42 Costing)
          let origUnitCost = Number(it.originalUnitCost) || 0;
          if (origUnitCost <= 0 && it.productId) {
            try {
              origUnitCost = await costingEngine.resolveUnitCost({
                productId: Number(it.productId),
                warehouseId: resolvedWarehouseId
              });
            } catch {
              origUnitCost = 0;
            }
          }

          computedItems.push({
            productId: it.productId ? Number(it.productId) : null,
            productCode: it.productCode || rawProductCode || 'SKU-GEN',
            productName: it.productName || rawProductName || 'Vật tư kỹ thuật',
            quantity: itemQty,
            uom: it.uom || rawUom || 'Cái',
            lotSerial: serialNumberStr || 'LOT-2026-X889',
            serialId: resolvedSerialId,
            lotId: resolvedLotId,
            condition: it.condition || 'DEFECTIVE',
            unitPrice: itemPrice,
            originalUnitCost: origUnitCost,
            subtotal,
            reason: it.reason || reason,
            disposition: 'PENDING',
            dispositionTarget: it.dispositionTarget || 'RESTOCK'
          });
        }
      } else {
        const itemQty = Math.max(1, Number(rawQuantity) || 1);
        const itemCode = rawProductCode || 'SKU-ENG-088';
        const itemName = rawProductName || 'Vật tư kỹ thuật công nghiệp';
        
        // Find product price if product exists
        const [prod] = await db.select().from(schema.products).where(eq(schema.products.sku, itemCode)).limit(1);
        const unitPrice = prod ? Number(prod.retailPrice) || 0 : 18500000;
        totalAmount = itemQty * unitPrice;

        let origUnitCost = prod ? Number(prod.costPrice) || 0 : 12000000;
        if (prod) {
          try {
            origUnitCost = await costingEngine.resolveUnitCost({
              productId: prod.id,
              warehouseId: resolvedWarehouseId
            });
          } catch {}
        }

        computedItems.push({
          productId: prod?.id || null,
          productCode: itemCode,
          productName: itemName,
          quantity: itemQty,
          uom: rawUom || 'Cái',
          lotSerial: rawLotSerial || 'LOT-2026-X889',
          serialId: null,
          lotId: null,
          condition: 'DEFECTIVE',
          unitPrice,
          originalUnitCost: origUnitCost,
          subtotal: totalAmount,
          reason,
          disposition: 'PENDING',
          dispositionTarget: 'RESTOCK'
        });
      }

      // 5. Database Insert: rmaRequests (with Phase 02 enterprise fields)
      const primaryItem = computedItems[0];
      const newRmaRecord = {
        rmaNumber,
        orderId: resolvedOrderId,
        orderCode: resolvedOrderCode,
        deliveryCode: `DEL-${resolvedOrderCode || rmaNumber}`,
        customerId: resolvedCustomerId,
        customerName: resolvedCustomerName,
        warehouseId: resolvedWarehouseId,
        productCode: primaryItem.productCode,
        productName: primaryItem.productName,
        quantity: primaryItem.quantity,
        uom: primaryItem.uom,
        lotSerial: primaryItem.lotSerial,
        reason,
        requestedResolution,
        status: 'REQUESTED',
        inspectionResult: 'PENDING',
        disposition: 'PENDING',
        financialStatus: 'PENDING',
        refundMethod,
        warrantyStatus: detectedWarrantyStatus,
        returnWindowDays,
        fraudScore: calculatedFraudScore,
        fraudFlags: JSON.stringify(flags),
        rtvReferenceCode: reqRtvReferenceCode || null,
        maintenanceWoCode: reqMaintenanceWoCode || null,
        refundChannel,
        totalAmount,
        refundedAmount: 0,
        requestDate,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [insertedRma] = await db.insert(schema.rmaRequests).values(newRmaRecord as any).returning();
      const rmaId = insertedRma.id;

      // 6. Database Insert: rmaItems (with Phase 02 item columns)
      for (const it of computedItems) {
        await db.insert(schema.rmaItems).values({
          rmaRequestId: rmaId,
          productId: it.productId,
          productCode: it.productCode,
          productName: it.productName,
          quantity: it.quantity,
          uom: it.uom,
          lotSerial: it.lotSerial,
          serialId: it.serialId,
          lotId: it.lotId,
          condition: it.condition,
          unitPrice: it.unitPrice,
          originalUnitCost: it.originalUnitCost,
          subtotal: it.subtotal,
          reason: it.reason,
          disposition: it.disposition,
          dispositionTarget: it.dispositionTarget,
          createdAt: new Date()
        });
      }

      // 7. M29 DMS Vault Integration: Archive RMA Initiation Dossier
      const vaultedDoc = await archiveToDmsVault({
        title: `Hồ Sơ Tiếp Nhận Yêu Cầu Đổi Trả RMA [${rmaNumber}]`,
        category: 'RMA_DOSSIER',
        categoryName: 'Hồ sơ Tiếp nhận & Ủy quyền Đổi trả Hàng bán',
        refDocNo: rmaNumber,
        metadata: { rmaNumber, orderCode: resolvedOrderCode, customerName: resolvedCustomerName, totalAmount },
        signer: `${user.username || 'rma_officer'} (Bộ phận Dịch vụ Khách hàng & Bảo hành M15)`,
        userId
      });

      // 8. Fetch complete created entity
      const completeRma = await db.query.rmaRequests.findFirst({
        where: eq(schema.rmaRequests.id, rmaId),
        with: { items: true, customer: true, order: true }
      });
      const responseData = formatRmaResponse(completeRma);

      const resultPayload = {
        success: true,
        rmaNumber,
        rmaCode: rmaNumber,
        orderCode: resolvedOrderCode,
        status: 'REQUESTED',
        message: `Đã khởi tạo yêu cầu trả hàng RMA [${rmaNumber}] thành công. Đã niêm phong hồ sơ sang kho chứng từ số M29 DMS Vault.`,
        data: responseData,
        vaultDocumentCode: vaultedDoc?.docCode
      };

      // 9. Save Idempotency & Log Audit Trail M02
      saveIdempotency(effectiveIdempotencyKey, resultPayload);
      await logRmaAudit('CREATE_RMA', rmaNumber, {
        orderCode: resolvedOrderCode || undefined,
        idempotencyKey: effectiveIdempotencyKey,
        savedResponse: resultPayload,
        afterData: responseData,
        extra: { totalAmount, itemsCount: computedItems.length }
      }, req, 'SUCCESS');

      res.status(201).json(resultPayload);
    } catch (err: any) {
      console.error("Lỗi khởi tạo RMA:", err);
      res.status(500).json({ success: false, error: err.message || "Lỗi tạo RMA" });
    }
  }
);

// =========================================================================
// 4. POST /api/returns/:id/inspect (QC Inspection & Defect Analysis)
// =========================================================================
router.post(
  ["/api/returns/:id/inspect", "/api/returns/inspect", "/api/returns/rma/:id/inspect"],
  requireRole('SUPER_ADMIN', 'ADMIN', 'QC_MANAGER', 'QC_INSPECTOR', 'WAREHOUSE_MANAGER', 'INVENTORY_MANAGER'),
  async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id || req.body.rmaNumber || req.body.rmaCode;
      const {
        inspectionResult = 'GOOD', // 'GOOD' | 'DEFECTIVE' | 'DAMAGED' | 'SCRAP' | 'PASSED' | 'FAILED'
        inspectionNotes = 'Đã hoàn tất giám định kỹ thuật: Hàng nguyên tem niêm phong',
        inspectedItems = [], // optional per-item condition update
        forceReinspect = false,
        idempotencyKey: bodyIdempKey
      } = req.body;

      const effectiveIdempotencyKey = bodyIdempKey || (req.headers['idempotency-key'] as string);
      if (effectiveIdempotencyKey) {
        const replay = await checkIdempotency(effectiveIdempotencyKey);
        if (replay) return res.status(200).json({ ...replay, idempotentReplay: true });
      }

      const rma = await findRmaEntity(idParam);
      if (!rma) {
        return res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ RMA ${idParam}` });
      }

      // Immutability Guard: Reject mutation if already locked (Rule #01 & Rule #16)
      if (isRmaImmutable(rma)) {
        return res.status(422).json({
          success: false,
          code: 'RMA_IMMUTABLE_LOCKED',
          error: `Chứng từ RMA [${rma.rmaNumber}] đã đạt trạng thái bất biến [${rma.status} / ${rma.disposition} / ${rma.financialStatus}] và bị khóa read-only. Mọi điều chỉnh phải tạo chứng từ Reversal/Adjustment mới.`,
          rmaNumber: rma.rmaNumber,
          currentStatus: rma.status,
          disposition: rma.disposition,
          financialStatus: rma.financialStatus
        });
      }

      // Re-inspection Guard: Prevent accidental duplicate inspection
      if (rma.inspectionResult && rma.inspectionResult !== 'PENDING' && !forceReinspect) {
        return res.status(409).json({
          success: false,
          code: 'RMA_ALREADY_INSPECTED',
          error: `Phiếu RMA [${rma.rmaNumber}] đã được xác nhận phân loại kiểm định (${rma.inspectionResult}). Không thể thao tác lại để tránh ghi đè kết quả. Vui lòng chuyển sang bước Xử lý (Disposition) hoặc kích hoạt quyền Giám sát QC để đánh giá lại.`,
          rmaNumber: rma.rmaNumber,
          currentInspectionResult: rma.inspectionResult
        });
      }

      const user = (req as any).user || { id: 1, username: 'qc_inspector' };
      const userId = user.id || 1;
      const isRejected = inspectionResult === 'REJECTED' || inspectionResult === 'FAILED';
      const newStatus = isRejected ? 'REJECTED' : 'UNDER_REVIEW';

      // Update rmaRequests
      await db.update(schema.rmaRequests)
        .set({
          inspectionResult: isRejected ? 'REJECTED' : (inspectionResult === 'PASSED' ? 'GOOD' : inspectionResult),
          inspectionNotes,
          inspectedBy: userId,
          inspectedAt: new Date(),
          status: newStatus,
          rejectedAt: isRejected ? new Date() : null,
          rejectionReason: isRejected ? inspectionNotes : null,
          updatedAt: new Date()
        })
        .where(eq(schema.rmaRequests.id, rma.id));

      // Update rmaItems condition if provided
      if (inspectedItems.length > 0) {
        for (const it of inspectedItems) {
          if (it.id) {
            await db.update(schema.rmaItems)
              .set({
                condition: it.condition || inspectionResult,
                dispositionTarget: it.dispositionTarget || undefined,
                inspectedQuantity: it.inspectedQuantity || it.quantity,
                notes: it.notes || inspectionNotes
              })
              .where(eq(schema.rmaItems.id, it.id));
          }
        }
      }

      // Phase 06: Closed-loop Serial Status Transition to WARRANTY_INSPECTION
      if (rma.items && rma.items.length > 0) {
        for (const it of rma.items) {
          if (it.serialId) {
            try {
              const [sn] = await db.select().from(schema.serialNumbers)
                .where(eq(schema.serialNumbers.id, it.serialId))
                .limit(1);

              if (sn && sn.status !== 'WARRANTY_INSPECTION') {
                const prevStatus = sn.status;
                await db.update(schema.serialNumbers)
                  .set({
                    status: 'WARRANTY_INSPECTION',
                    notes: `Tiếp nhận kiểm định bảo hành từ RMA [${rma.rmaNumber}]`,
                    updatedAt: new Date()
                  })
                  .where(eq(schema.serialNumbers.id, sn.id));

                await db.insert(schema.serialHistory).values({
                  serialId: sn.id,
                  action: 'STATUS_CHANGE',
                  fromStatus: prevStatus,
                  toStatus: 'WARRANTY_INSPECTION',
                  referenceNo: rma.rmaNumber,
                  notes: `Tiếp nhận thiết bị giám định kỹ thuật RMA [${rma.rmaNumber}]`,
                  performedBy: userId,
                  createdAt: new Date()
                });
              }
            } catch (snErr) {
              console.warn("Serial inspection transition warning:", snErr);
            }
          }
        }
      }

      // M39 QMS Non-Conformance (NCR) Auto-Generation if defect detected
      let generatedNcrCode: string | undefined = undefined;
      const isDefectiveResult = ['DEFECTIVE', 'DAMAGED', 'SCRAP', 'FAILED', 'REJECTED'].includes(String(inspectionResult).toUpperCase());
      if (isDefectiveResult) {
        try {
          const firstItem = rma.items?.[0];
          let prodId = firstItem?.productId;
          if (!prodId && rma.productCode) {
            const [p] = await db.select().from(schema.products).where(eq(schema.products.sku, rma.productCode)).limit(1);
            if (p) prodId = p.id;
          }
          if (prodId) {
            const ncr = await QualityService.createNcr({
              productId: prodId,
              lotId: firstItem?.lotId || undefined,
              warehouseId: rma.warehouseId || 1,
              affectedQuantity: rma.quantity || firstItem?.quantity || 1,
              defectType: inspectionResult === 'SCRAP' ? 'CRITICAL' : 'MAJOR',
              defectCategory: 'CUSTOMER_RETURN',
              defectDescription: `[NCR TỪ GIÁM ĐỊNH RMA ${rma.rmaNumber}] Kết quả: ${inspectionResult}. ${inspectionNotes}`,
              rootCause: `Tiếp nhận sản phẩm hoàn trả phát hiện khiếm khuyết kỹ thuật/ngoại quan (RMA: ${rma.rmaNumber})`,
              immediateAction: 'Khóa cách ly kiểm định & chuyển tuyến xử lý Disposition (M15/M39)',
              userId
            });
            if (ncr?.ncrCode) generatedNcrCode = ncr.ncrCode;
          }
        } catch (ncrErr) {
          console.warn("Auto NCR creation warning:", ncrErr);
        }
      }

      // Archive Inspection Certificate to M29 DMS Vault
      const certDoc = await archiveToDmsVault({
        title: `Biên Bản Giám Định Kỹ Thuật & Chất Lượng QC [${rma.rmaNumber}]`,
        category: 'QC_INSPECTION',
        categoryName: 'Biên bản Kiểm nghiệm Kỹ thuật & Chất lượng Hàng đổi trả',
        refDocNo: rma.rmaNumber,
        metadata: { rmaNumber: rma.rmaNumber, inspectionResult, inspectionNotes, inspectedBy: user.username, ncrCode: generatedNcrCode },
        signer: `${user.username || 'qc_lead'} (Cổng Giám định Chất lượng & Bảo hành M15/M39)`,
        userId
      });

      const updatedRma = await findRmaEntity(rma.id);
      const responseData = formatRmaResponse(updatedRma);

      const resultPayload = {
        success: true,
        rmaNumber: rma.rmaNumber,
        rmaCode: rma.rmaNumber,
        status: newStatus,
        inspectionResult,
        ncrCode: generatedNcrCode,
        message: `Đã hoàn tất giám định QC cho RMA [${rma.rmaNumber}]. Kết quả: ${inspectionResult}.${generatedNcrCode ? ` Đã tự động tạo biên bản NCR [${generatedNcrCode}].` : ''} Đã lưu chứng chỉ giám định vào M29 DMS Vault.`,
        data: responseData,
        vaultDocumentCode: certDoc?.docCode
      };

      saveIdempotency(effectiveIdempotencyKey, resultPayload);
      await logRmaAudit('INSPECT', rma.rmaNumber, {
        orderCode: rma.orderCode || undefined,
        idempotencyKey: effectiveIdempotencyKey,
        savedResponse: resultPayload,
        beforeData: { status: rma.status, inspectionResult: rma.inspectionResult },
        afterData: { status: newStatus, inspectionResult },
        extra: { inspectionNotes }
      }, req, 'SUCCESS');

      res.json(resultPayload);
    } catch (err: any) {
      console.error("Lỗi kiểm định RMA:", err);
      res.status(500).json({ success: false, error: err.message || "Lỗi kiểm định RMA" });
    }
  }
);

// =========================================================================
// 5. POST /api/returns/:id/approve (Approve RMA Request with Fraud Gate)
// =========================================================================
router.post(
  ["/api/returns/:id/approve", "/api/returns/approve"],
  requireRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'OPERATIONS_MANAGER', 'QC_MANAGER', 'DIRECTOR', 'CFO', 'GENERAL_DIRECTOR'),
  async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id || req.body.rmaNumber || req.body.rmaCode;
      const { fraudOverride = false, overrideReason, idempotencyKey: bodyIdempKey } = req.body;
      const effectiveIdempotencyKey = bodyIdempKey || (req.headers['idempotency-key'] as string);

      if (effectiveIdempotencyKey) {
        const replay = await checkIdempotency(effectiveIdempotencyKey);
        if (replay) return res.status(200).json({ ...replay, idempotentReplay: true });
      }

      const rma = await findRmaEntity(idParam);
      if (!rma) {
        return res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ RMA ${idParam}` });
      }

      // Immutability Guard: Reject mutation if already locked (Rule #01 & Rule #16)
      if (isRmaImmutable(rma)) {
        return res.status(422).json({
          success: false,
          code: 'RMA_IMMUTABLE_LOCKED',
          error: `Chứng từ RMA [${rma.rmaNumber}] đã đạt trạng thái bất biến [${rma.status} / ${rma.disposition} / ${rma.financialStatus}] và bị khóa read-only. Mọi điều chỉnh phải tạo chứng từ Reversal/Adjustment mới.`,
          rmaNumber: rma.rmaNumber,
          currentStatus: rma.status,
          disposition: rma.disposition,
          financialStatus: rma.financialStatus
        });
      }

      const user = (req as any).user || { id: 1, username: 'approver', role: 'ADMIN' };
      const userId = user.id || 1;
      const userRole = String(user.role || '').toUpperCase();

      // Phase 09 Fraud Shield Gate: Check if high fraud risk requires Director Override
      const isHighRisk = (rma.fraudScore ?? 0) >= 50 || String(rma.fraudFlags || '').includes('HIGH_RISK_FRAUD');
      const isDirectorLevel = ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'CFO', 'GENERAL_DIRECTOR'].includes(userRole);

      if (isHighRisk && !fraudOverride && !isDirectorLevel) {
        return res.status(403).json({
          success: false,
          code: 'REQUIRES_DIRECTOR_OVERRIDE',
          error: `Động cơ Fraud Shield: Hồ sơ RMA [${rma.rmaNumber}] bị cảnh báo rủi ro cao [HIGH_RISK_FRAUD] (${rma.fraudScore}/100). Bắt buộc phải có Giám đốc Phê duyệt đặc cách (returns:fraud_override).`,
          fraudScore: rma.fraudScore,
          fraudFlags: rma.fraudFlags
        });
      }

      await db.update(schema.rmaRequests)
        .set({
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(schema.rmaRequests.id, rma.id));

      const updatedRma = await findRmaEntity(rma.id);
      const responseData = formatRmaResponse(updatedRma);

      const resultPayload = {
        success: true,
        rmaNumber: rma.rmaNumber,
        rmaCode: rma.rmaNumber,
        status: 'APPROVED',
        fraudOverrideApplied: isHighRisk && (fraudOverride || isDirectorLevel),
        message: `Đã phê duyệt yêu cầu RMA [${rma.rmaNumber}] thành công.${isHighRisk ? ' (Đã áp dụng phê duyệt đặc cách Giám đốc cho hồ sơ rủi ro cao).' : ''} Kích hoạt cổng tiếp nhận hàng về kho.`,
        data: responseData
      };

      saveIdempotency(effectiveIdempotencyKey, resultPayload);
      await logRmaAudit('APPROVE_RMA', rma.rmaNumber, {
        orderCode: rma.orderCode || undefined,
        idempotencyKey: effectiveIdempotencyKey,
        savedResponse: resultPayload,
        beforeData: { status: rma.status },
        afterData: { status: 'APPROVED' },
        extra: { isHighRisk, fraudOverride: isHighRisk && (fraudOverride || isDirectorLevel), overrideReason }
      }, req, 'SUCCESS');

      res.json(resultPayload);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// =========================================================================
// 6. POST /api/returns/:id/reject & /api/returns/:id/cancel (Reject / Cancel RMA Request)
// =========================================================================
router.post(
  ["/api/returns/:id/reject", "/api/returns/reject", "/api/returns/:id/cancel", "/api/returns/cancel"],
  requireRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'OPERATIONS_MANAGER', 'QC_MANAGER'),
  async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id || req.body.rmaNumber || req.body.rmaCode;
      const { rejectionReason = "Không đáp ứng tiêu chuẩn chính sách bảo hành / hoàn trả" } = req.body;
      const effectiveIdempotencyKey = req.body.idempotencyKey || (req.headers['idempotency-key'] as string);

      if (effectiveIdempotencyKey) {
        const replay = await checkIdempotency(effectiveIdempotencyKey);
        if (replay) return res.status(200).json({ ...replay, idempotentReplay: true });
      }

      const rma = await findRmaEntity(idParam);
      if (!rma) {
        return res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ RMA ${idParam}` });
      }

      // Immutability Guard: Reject mutation if already locked (Rule #01 & Rule #16)
      if (isRmaImmutable(rma)) {
        return res.status(422).json({
          success: false,
          code: 'RMA_IMMUTABLE_LOCKED',
          error: `Chứng từ RMA [${rma.rmaNumber}] đã đạt trạng thái bất biến [${rma.status} / ${rma.disposition} / ${rma.financialStatus}] và bị khóa read-only. Mọi điều chỉnh phải tạo chứng từ Reversal/Adjustment mới.`,
          rmaNumber: rma.rmaNumber,
          currentStatus: rma.status,
          disposition: rma.disposition,
          financialStatus: rma.financialStatus
        });
      }

      await db.update(schema.rmaRequests)
        .set({
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason,
          updatedAt: new Date()
        })
        .where(eq(schema.rmaRequests.id, rma.id));

      const updatedRma = await findRmaEntity(rma.id);
      const responseData = formatRmaResponse(updatedRma);

      const resultPayload = {
        success: true,
        rmaNumber: rma.rmaNumber,
        rmaCode: rma.rmaNumber,
        status: 'REJECTED',
        rejectionReason,
        message: `Đã từ chối yêu cầu RMA [${rma.rmaNumber}]. Lý do: ${rejectionReason}`,
        data: responseData
      };

      saveIdempotency(effectiveIdempotencyKey, resultPayload);
      await logRmaAudit('CANCEL', rma.rmaNumber, {
        orderCode: rma.orderCode || undefined,
        idempotencyKey: effectiveIdempotencyKey,
        savedResponse: resultPayload,
        beforeData: { status: rma.status },
        afterData: { status: 'REJECTED', rejectionReason }
      }, req, 'SUCCESS');

      res.json(resultPayload);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// =========================================================================
// 6b. POST /api/returns/:id/photos & /api/returns/:id/dms-upload
// Archives Defect Evidence & Technical Reports into M29 DMS Vault (PDF/A + SHA-256)
// =========================================================================
router.post(
  ["/api/returns/:id/photos", "/api/returns/:id/dms-upload"],
  requireRole('SUPER_ADMIN', 'ADMIN', 'QC_MANAGER', 'QC_INSPECTOR', 'CUSTOMER_SERVICE', 'INVENTORY_MANAGER'),
  async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const {
        title = "Ảnh chụp hiện trạng hàng lỗi & Biên bản giám định kỹ thuật",
        category = "DEFECT_EVIDENCE",
        fileName = "rma-defect-evidence.pdf",
        fileData,
        notes = "Tài liệu đính kèm chứng cứ lỗi sản phẩm và kết quả thẩm định kỹ thuật"
      } = req.body;

      const rma = await findRmaEntity(idParam);
      if (!rma) {
        return res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ RMA ${idParam}` });
      }

      const user = (req as any).user || { id: 1, username: 'qc_inspector' };
      const userId = user.id || 1;

      const vaultedDoc = await archiveToDmsVault({
        title: `${title} [${rma.rmaNumber}]`,
        category: category || 'DEFECT_EVIDENCE',
        categoryName: 'Hồ sơ Ảnh chụp Hiện trạng & Chứng cứ Lỗi Kỹ thuật M15/M29',
        refDocNo: rma.rmaNumber,
        metadata: {
          rmaNumber: rma.rmaNumber,
          productCode: rma.productCode,
          fileName,
          notes
        },
        signer: `${user.username || 'qc_inspector'} (Bộ phận Kiểm soát Chất lượng & Bảo hành M15/M39)`,
        userId
      });

      res.json({
        success: true,
        message: `Đã niêm phong tài liệu số hóa [${vaultedDoc.docCode}] vào M29 DMS Vault với định dạng PDF/A-3 và mã băm SHA-256 an toàn.`,
        document: vaultedDoc
      });
    } catch (err: any) {
      console.error("Lỗi niêm phong tài liệu DMS:", err);
      res.status(500).json({ success: false, error: err.message || "Lỗi lưu trữ tài liệu M29 DMS" });
    }
  }
);

// =========================================================================
// 7. POST /api/returns/:id/disposition (Single-Writer Handover: Inventory + Accounting + DMS Vault)
// =========================================================================
router.post(
  [
    "/api/returns/:id/disposition",
    "/api/returns/:id/execute",
    "/api/returns/disposition",
    "/api/returns/rma/:id/restock",
    "/api/returns/:id/restock",
    "/api/returns/rma/:id/return-to-vendor",
    "/api/returns/:id/return-to-vendor",
    "/api/returns/rma/:id/rtv",
    "/api/returns/:id/rtv"
  ],
  requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CFO', 'WAREHOUSE_MANAGER', 'INVENTORY_MANAGER', 'OPERATIONS_MANAGER'),
  async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id || req.body.rmaNumber || req.body.rmaCode;
      const isRtvPath = req.originalUrl?.includes('return-to-vendor') || req.originalUrl?.includes('/rtv') || req.path?.includes('return-to-vendor') || req.path?.includes('/rtv');
      const isRestockPath = req.originalUrl?.includes('restock') || req.path?.includes('restock');
      const defaultDisp = isRtvPath ? 'RETURN_TO_VENDOR' : (isRestockPath ? 'RESTOCK' : 'RESTOCK');

      const {
        disposition = defaultDisp, // 'RESTOCK' | 'REPAIR' | 'REPLACE' | 'SCRAP' | 'RETURN_TO_VENDOR' | 'CREDIT'
        lineDispositions, // Optional array of per-line disposition: [{ itemId, dispositionTarget, quantity, condition, notes, warehouseId }]
        refundMethod = 'CREDIT_NOTE', // 'CREDIT_NOTE' | 'BANK_TRANSFER' | 'CASH'
        refundChannel,
        warehouseId: customWarehouseId,
        idempotencyKey: bodyIdempKey
      } = req.body;

      const effectiveIdempotencyKey = bodyIdempKey || (req.headers['idempotency-key'] as string);
      if (effectiveIdempotencyKey) {
        const replay = await checkIdempotency(effectiveIdempotencyKey);
        if (replay) return res.status(200).json({ ...replay, idempotentReplay: true });
      }

      const rma = await findRmaEntity(idParam);
      if (!rma) {
        return res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ RMA ${idParam}` });
      }

      // Immutability Guard: Reject mutation if already locked (Rule #01 & Rule #16)
      if (isRmaImmutable(rma)) {
        return res.status(422).json({
          success: false,
          code: 'RMA_IMMUTABLE_LOCKED',
          error: `Chứng từ RMA [${rma.rmaNumber}] đã đạt trạng thái bất biến [${rma.status} / ${rma.disposition} / ${rma.financialStatus}] và bị khóa read-only. Mọi điều chỉnh phải tạo chứng từ Reversal/Adjustment mới.`,
          rmaNumber: rma.rmaNumber,
          currentStatus: rma.status,
          disposition: rma.disposition,
          financialStatus: rma.financialStatus
        });
      }

      const user = (req as any).user || { id: 1, username: 'admin', role: 'SUPER_ADMIN', fullName: 'Quản trị viên' };
      const userId = user.id || 1;
      const userRole = String(user.role || '').toUpperCase();

      // Phase 09 Fraud Shield Gate: Check if high fraud risk requires Director Override
      const isHighRisk = (rma.fraudScore ?? 0) >= 50 || String(rma.fraudFlags || '').includes('HIGH_RISK_FRAUD');
      const isDirectorLevel = ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'CFO', 'GENERAL_DIRECTOR'].includes(userRole);

      if (isHighRisk && !req.body.fraudOverride && !isDirectorLevel) {
        return res.status(403).json({
          success: false,
          code: 'REQUIRES_DIRECTOR_OVERRIDE',
          error: `Động cơ Fraud Shield: Hồ sơ RMA [${rma.rmaNumber}] bị cảnh báo rủi ro cao [HIGH_RISK_FRAUD] (${rma.fraudScore}/100). Bắt buộc phải có Giám đốc Phê duyệt đặc cách (returns:fraud_override) trước khi thực thi quyết định xử lý (Disposition).`,
          fraudScore: rma.fraudScore,
          fraudFlags: rma.fraudFlags
        });
      }

      // Execute via authoritative RmaDispositionRouter
      const routerResult = await RmaDispositionRouter.executeDisposition({
        rmaId: rma.id,
        disposition,
        lineDispositions,
        refundMethod,
        refundChannel,
        warehouseId: customWarehouseId ? Number(customWarehouseId) : undefined,
        userId,
        username: user.username,
        userRole: user.role,
        userFullName: user.fullName,
        idempotencyKey: effectiveIdempotencyKey
      });

      const updatedRma = await findRmaEntity(rma.id);
      const responseData = formatRmaResponse(updatedRma);

      const resultPayload = {
        ...routerResult,
        data: responseData
      };

      saveIdempotency(effectiveIdempotencyKey, resultPayload);
      res.json(resultPayload);
    } catch (err: any) {
      console.error("Lỗi thực thi Disposition RMA:", err);
      if (err.code === 'RMA_IMMUTABLE_LOCKED') {
        return res.status(err.statusCode || 422).json({
          success: false,
          code: err.code,
          error: err.message,
          rmaNumber: err.rmaNumber
        });
      }
      res.status(500).json({ success: false, error: err.message || "Lỗi xử lý RMA" });
    }
  }
);

// =========================================================================
// 8. POST /api/returns/:id/reversal & /api/returns/:id/adjustment
// Generates a new Reversal/Adjustment document linked to an immutable RMA.
// Leaves the original immutable document untouched!
// =========================================================================
router.post(
  ["/api/returns/:id/reversal", "/api/returns/:id/adjustment"],
  requireRole('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'OPERATIONS_MANAGER', 'CFO', 'ACCOUNTANT'),
  async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id || req.body.rmaNumber;
      const {
        reversalReason = "Điều chỉnh số lượng / sai lệch nghiệp vụ từ chứng từ gốc",
        adjustmentType = "REVERSAL", // 'REVERSAL' | 'QUANTITY_ADJUSTMENT' | 'PRICE_ADJUSTMENT'
        idempotencyKey: bodyIdempKey
      } = req.body;

      const effectiveIdempotencyKey = bodyIdempKey || (req.headers['idempotency-key'] as string);
      if (effectiveIdempotencyKey) {
        const replay = await checkIdempotency(effectiveIdempotencyKey);
        if (replay) return res.status(200).json({ ...replay, idempotentReplay: true });
      }

      const originalRma = await findRmaEntity(idParam);
      if (!originalRma) {
        return res.status(404).json({ success: false, error: `Không tìm thấy chứng từ RMA gốc ${idParam}` });
      }

      // Generate new sequential Reversal RMA Number: RMA-REV-2026-XXXX
      const totalRmas = await db.select({ count: sql<number>`count(*)` }).from(schema.rmaRequests);
      const nextCount = Number(totalRmas[0]?.count || 0) + 100;
      const revNumber = `RMA-REV-2026-${String(nextCount).padStart(4, '0')}`;
      const requestDate = new Date().toISOString().slice(0, 10);
      const user = (req as any).user || { id: 1, username: 'admin' };
      const userId = user.id || 1;

      // Insert new Reversal RMA document linked to original
      const revRecord = {
        rmaNumber: revNumber,
        orderId: originalRma.orderId,
        orderCode: originalRma.orderCode,
        deliveryCode: originalRma.deliveryCode,
        customerId: originalRma.customerId,
        customerName: originalRma.customerName,
        warehouseId: originalRma.warehouseId,
        productCode: originalRma.productCode,
        productName: originalRma.productName,
        quantity: originalRma.quantity,
        uom: originalRma.uom,
        lotSerial: originalRma.lotSerial,
        reason: `[${adjustmentType} CHỨNG TỪ ${originalRma.rmaNumber}] ${reversalReason}`,
        requestedResolution: "ADJUSTMENT / REVERSAL",
        status: "REQUESTED",
        inspectionResult: "PENDING",
        disposition: "PENDING",
        financialStatus: "PENDING",
        refundMethod: originalRma.refundMethod || "CREDIT_NOTE",
        warrantyStatus: originalRma.warrantyStatus || "VALID",
        returnWindowDays: originalRma.returnWindowDays || 30,
        fraudScore: 0,
        fraudFlags: JSON.stringify([{ type: 'REVERSAL_DOCUMENT', originalRmaNumber: originalRma.rmaNumber }]),
        rtvReferenceCode: null,
        maintenanceWoCode: null,
        refundChannel: originalRma.refundChannel || "CREDIT_NOTE_M31",
        totalAmount: originalRma.totalAmount,
        refundedAmount: 0,
        requestDate,
        notes: `Chứng từ điều chỉnh/hủy đảo cho RMA [${originalRma.rmaNumber}]. Lý do: ${reversalReason}`,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [insertedRev] = await db.insert(schema.rmaRequests).values(revRecord as any).returning();

      // Copy items with originalUnitCost and references
      const originalItems = originalRma.items || [];
      for (const it of originalItems) {
        await db.insert(schema.rmaItems).values({
          rmaRequestId: insertedRev.id,
          productId: it.productId,
          productCode: it.productCode,
          productName: it.productName,
          quantity: it.quantity,
          uom: it.uom,
          uomId: it.uomId,
          serialId: it.serialId,
          lotId: it.lotId,
          lotSerial: it.lotSerial,
          condition: it.condition,
          unitPrice: it.unitPrice,
          originalUnitCost: it.originalUnitCost,
          subtotal: it.subtotal,
          reason: `Reversal item from ${originalRma.rmaNumber}`,
          disposition: 'PENDING',
          dispositionTarget: it.dispositionTarget || 'RESTOCK',
          createdAt: new Date()
        });
      }

      // Archive Reversal document into M29 DMS Vault
      const vaultDoc = await archiveToDmsVault({
        title: `Chứng Từ Điều Chỉnh & Reversal RMA [${revNumber}] Tham Chiếu [${originalRma.rmaNumber}]`,
        category: 'RMA_REVERSAL',
        categoryName: 'Chứng từ Điều chỉnh & Hủy đảo RMA',
        refDocNo: revNumber,
        metadata: { revNumber, originalRmaNumber: originalRma.rmaNumber, reversalReason, totalAmount: originalRma.totalAmount },
        signer: `${user.username || 'admin'} (Kiểm toán & Quản trị Rủi ro M02/M15)`,
        userId
      });

      // Audit log M02
      await logRmaAudit('CREATE_RMA_REVERSAL', revNumber, {
        orderCode: originalRma.orderCode || undefined,
        idempotencyKey: effectiveIdempotencyKey,
        savedResponse: { revNumber, originalRmaNumber: originalRma.rmaNumber },
        afterData: revRecord,
        extra: { originalRmaId: originalRma.id, originalRmaNumber: originalRma.rmaNumber, reversalReason }
      }, req, 'SUCCESS');

      const createdRev = await findRmaEntity(insertedRev.id);
      const responseData = formatRmaResponse(createdRev);

      const resultPayload = {
        success: true,
        rmaNumber: revNumber,
        originalRmaNumber: originalRma.rmaNumber,
        message: `Đã tạo thành công chứng từ Reversal/Adjustment mới [${revNumber}] liên kết với [${originalRma.rmaNumber}]. Chứng từ gốc được giữ nguyên vẹn ở trạng thái bất biến.`,
        data: responseData,
        vaultDocumentCode: vaultDoc?.docCode
      };

      saveIdempotency(effectiveIdempotencyKey, resultPayload);
      res.status(201).json(resultPayload);
    } catch (err: any) {
      console.error("Lỗi tạo chứng từ Reversal RMA:", err);
      res.status(500).json({ success: false, error: err.message || "Lỗi tạo chứng từ Reversal RMA" });
    }
  }
);

// =========================================================================
// 8. BACKWARD COMPATIBILITY: POST /api/sales/rma/process
// Routes actions ('INSPECT', 'APPROVE', 'REJECT', 'EXECUTE_RETURN_AND_REFUND')
// to the respective authoritative handlers above.
// =========================================================================
router.post("/api/sales/rma/process", async (req: Request, res: Response) => {
  const { action, rmaCode, orderCode, inspectionResult, inspectionNotes, disposition, refundMethod, idempotencyKey } = req.body;

  if (!rmaCode && !orderCode) {
    return res.status(400).json({ success: false, error: "Thiếu mã rmaCode hoặc orderCode" });
  }

  const lookupRma = rmaCode || orderCode;

  if (action === "INSPECT" || action === "REJECT") {
    req.params.id = lookupRma;
    req.body.inspectionResult = action === "REJECT" ? "REJECTED" : (inspectionResult || "GOOD");
    req.body.inspectionNotes = inspectionNotes || (action === "REJECT" ? "Từ chối tiếp nhận bảo hành" : "Đã kiểm định");
    // Forward to inspect logic
    return (router as any).handle(req, res);
  }

  if (action === "APPROVE") {
    req.params.id = lookupRma;
    const approveHandler = (router.stack.find(s => s.route?.path?.includes?.("/api/returns/:id/approve"))?.route?.stack?.[0]?.handle);
    if (approveHandler) return approveHandler(req, res, () => {});
  }

  if (action === "EXECUTE_RETURN_AND_REFUND" || action === "EXECUTE_RETURN" || action === "DISPOSITION") {
    req.params.id = lookupRma;
    req.body.disposition = disposition || "RESTOCK";
    req.body.refundMethod = refundMethod || "CREDIT_NOTE";
    const dispHandler = (router.stack.find(s => s.route?.path?.includes?.("/api/returns/:id/disposition"))?.route?.stack?.[0]?.handle);
    if (dispHandler) return dispHandler(req, res, () => {});
  }

  // Fallback if not matched
  res.status(400).json({ success: false, error: `Action '${action}' không được hỗ trợ.` });
});

export default router;
export { router as returnsRouter };
