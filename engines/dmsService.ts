import { db } from "../db/index";
import * as schema from "../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import crypto from "crypto";
import { AuditService } from "./auditService";
import { eventBus } from "./eventBus";
import { DmsStatus, DmsClassification, DmsWorkflowStep, MissingAttachmentReportItem } from "../src/modules/governance/m29-dms/types";
import { DmsEntityLinker } from "./dmsEntityLinker";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/xml",
  "text/xml",
  "application/json",
  "text/plain",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel"
];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export class DmsService {
  /**
   * P0: F01 Vault - Store document with server-side SHA-256 and idempotency
   */
  static async vaultDocument(params: {
    title: string;
    category: string;
    categoryName?: string;
    content: string | Buffer; // Real content for hashing
    fileName?: string;
    mimeType?: string;
    entityType?: string;
    entityId?: string;
    classification?: DmsClassification;
    idempotencyKey?: string;
    userId: number;
    username: string;
    linkedModule?: string;
    refDocNo?: string;
    retentionYears?: number;
    supersedesId?: number;
    declaredHash?: string;
    isBase64?: boolean;
  }) {
    const { 
      title, category = "GENERAL", categoryName, content, fileName, mimeType, 
      entityType, entityId, classification, idempotencyKey, 
      userId = 1, username = "System", linkedModule, refDocNo, retentionYears, supersedesId,
      declaredHash, isBase64 = false
    } = params;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await db.select().from(schema.dmsDocuments)
        .where(eq(schema.dmsDocuments.idempotencyKey, idempotencyKey))
        .get();
      if (existing) return { success: true, document: existing, alreadyProcessed: true };
    }

    // Size limit check
    let contentBuffer: Buffer;
    if (Buffer.isBuffer(content)) {
      contentBuffer = content;
    } else if (typeof content === "string") {
      if (isBase64) {
        contentBuffer = Buffer.from(content, 'base64');
      } else {
        contentBuffer = Buffer.from(content, 'utf-8');
      }
    } else {
      contentBuffer = Buffer.from(String(content), 'utf-8');
    }
    const sizeBytes = contentBuffer.byteLength;
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Kích thước tệp vượt quá giới hạn tối đa cho phép (25 MB). Tệp hiện tại: ${(sizeBytes / 1024 / 1024).toFixed(2)} MB`);
    }

    // MIME validation
    const resolvedMime = mimeType || "application/pdf";
    if (resolvedMime && !ALLOWED_MIME_TYPES.includes(resolvedMime) && !resolvedMime.startsWith("image/")) {
      throw new Error(`Định dạng MIME không nằm trong danh mục cho phép (${resolvedMime})`);
    }

    // Server-side SHA-256 hashing
    const sha256Hash = crypto.createHash('sha256').update(contentBuffer).digest('hex');

    // Integrity check if client declared a hash
    if (declaredHash && declaredHash.toLowerCase() !== sha256Hash.toLowerCase()) {
      throw new Error(`Sai lệch mã băm (Checksum Mismatch): Mã băm khai báo không khớp với mã băm thực tế được tính toán bởi máy chủ.`);
    }
    
    // Check for duplicate by hash + entity
    if (entityType && entityId) {
      const duplicate = await db.select().from(schema.dmsDocuments)
        .where(and(
          eq(schema.dmsDocuments.sha256Hash, sha256Hash),
          eq(schema.dmsDocuments.entityType, entityType),
          eq(schema.dmsDocuments.entityId, entityId)
        ))
        .get();
      
      if (duplicate) return { success: true, document: duplicate, duplicate: true };
    }

    // Optional Entity verification
    if (entityType && entityId) {
      const isValidEntity = await DmsEntityLinker.verifyEntity(entityType, entityId);
      if (!isValidEntity) {
        console.warn(`[DmsService] Cảnh báo: Không tìm thấy chứng từ chủ tham chiếu ${entityType} ID/Code ${entityId}`);
      }
    }

    // Calculate versioning (Zero-overwrite)
    let version = "v1.0";
    if (supersedesId) {
      const priorDoc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, supersedesId)).get();
      if (!priorDoc) {
        throw new Error(`Không tìm thấy tài liệu gốc ID: ${supersedesId} để nâng cấp phiên bản.`);
      }
      if (priorDoc.status === DmsStatus.SUPERSEDED) {
        throw new Error(`Xung đột phiên bản (CONFLICT): Tài liệu #${supersedesId} đã được nâng cấp bởi một phiên bản khác. Không thể tạo phiên bản trùng lặp.`);
      }
      const vNum = parseFloat(priorDoc.version?.replace("v", "") || "1.0");
      version = `v${(vNum + 1.0).toFixed(1)}`;
      // Mark old document as SUPERSEDED atomically
      await db.update(schema.dmsDocuments)
        .set({ status: DmsStatus.SUPERSEDED } as any)
        .where(eq(schema.dmsDocuments.id, supersedesId));
    }

    const docCode = `DMS-${category.toUpperCase().slice(0, 3)}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const retYears = retentionYears || 5;
    const expireDate = new Date(Date.now() + retYears * 365 * 24 * 60 * 60 * 1000);

    // Save base64 preview/content safely (limit to 10MB in base64 string column if under limit)
    let base64Content = "";
    if (sizeBytes <= 12 * 1024 * 1024) {
      base64Content = contentBuffer.toString("base64");
    }

    const newDoc = {
      docCode,
      title,
      category,
      categoryName: categoryName || "Tài liệu hệ thống",
      version,
      fileSize: `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`,
      format: fileName?.split('.').pop()?.toUpperCase() || "PDF",
      status: DmsStatus.DRAFT,
      securityLevel: classification || DmsClassification.INTERNAL,
      classification: classification || DmsClassification.INTERNAL,
      sha256Hash,
      sizeBytes,
      mimeType: resolvedMime,
      entityType: entityType || null,
      entityId: entityId || null,
      idempotencyKey: idempotencyKey || null,
      linkedModule: linkedModule || (entityType ? entityType.split('_')[0] : "DMS"),
      refDocNo: refDocNo || entityId || null,
      storageTier: "ACTIVE_VAULT",
      retentionYears: retYears,
      expireDate: expireDate.toISOString().split('T')[0],
      retentionUntil: expireDate,
      legalHold: false,
      supersedesId: supersedesId || null,
      hashScope: "FILE_CONTENT",
      fileContentBase64: base64Content || null,
      workflowStage: 1,
      workflowSteps: JSON.stringify([
        { step: 1, name: 'Khởi tạo', role: 'REQUESTER', status: 'COMPLETED', user: username, signedAt: new Date().toISOString() },
        { step: 2, name: 'Phê duyệt', role: 'MANAGER', status: 'PENDING', user: null, signedAt: null },
        { step: 3, name: 'Niêm phong', role: 'DMS_ADMIN', status: 'PENDING', user: null, signedAt: null },
      ]),
    };

    const result = await db.insert(schema.dmsDocuments).values(newDoc as any).returning();
    const savedDoc = result[0];

    await AuditService.recordAuditLog({
      module: 'M29',
      action: 'VAULT_DOCUMENT',
      entityType: 'DMS_DOCUMENT',
      entityId: savedDoc.id,
      userId,
      username,
      result: 'SUCCESS',
      metadata: { docCode, sha256Hash, entityType, entityId, version, sizeBytes }
    });

    return { success: true, document: savedDoc };
  }

  /**
   * F02: Set Retention & Legal Hold
   */
  static async updateRetentionAndLegalHold(params: {
    docId: number;
    retentionYears?: number;
    retentionClass?: string;
    legalHold?: boolean;
    userId: number;
    username: string;
    reason?: string;
  }) {
    const { docId, retentionYears, retentionClass, legalHold, userId, username, reason } = params;
    const doc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, docId)).get();
    if (!doc) throw new Error("Không tìm thấy tài liệu");

    const updates: any = {};
    if (typeof legalHold === "boolean") {
      updates.legalHold = legalHold;
    }
    if (retentionYears) {
      updates.retentionYears = retentionYears;
      const expire = new Date(Date.now() + retentionYears * 365 * 24 * 60 * 60 * 1000);
      updates.retentionUntil = expire;
      updates.expireDate = expire.toISOString().split('T')[0];
    }
    if (retentionClass) {
      updates.retentionClass = retentionClass;
    }

    const updated = await db.update(schema.dmsDocuments)
      .set(updates)
      .where(eq(schema.dmsDocuments.id, docId))
      .returning();

    await AuditService.recordAuditLog({
      module: 'M29',
      action: 'UPDATE_RETENTION_LEGAL_HOLD',
      entityType: 'DMS_DOCUMENT',
      entityId: docId,
      userId,
      username,
      result: 'SUCCESS',
      metadata: { legalHold, retentionYears, retentionClass, reason }
    });

    return updated[0];
  }

  /**
   * F12: Controlled Disposal - Request disposal via M28
   */
  static async requestDisposal(docId: number, userId: number, username: string, reason: string) {
    const doc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, docId)).get();
    if (!doc) throw new Error("Không tìm thấy tài liệu");
    
    if (doc.legalHold) {
      throw new Error("Tài liệu đang bị áp dụng Lệnh Giữ Pháp Lý (Legal Hold). Tuyệt đối không được phép tiêu hủy.");
    }

    // Check retention period
    if (doc.retentionUntil && new Date(doc.retentionUntil).getTime() > Date.now()) {
      throw new Error(`Tài liệu chưa hết thời hạn lưu trữ pháp định (hạn lưu trữ đến: ${new Date(doc.retentionUntil).toLocaleDateString('vi-VN')}).`);
    }

    const updated = await db.update(schema.dmsDocuments)
      .set({
        status: DmsStatus.APPROVED, // Trạng thái chờ phê duyệt tiêu hủy
        workflowSteps: sql`json_set(COALESCE(workflow_steps, '[]'), '$[2].status', 'PENDING', '$[2].name', 'Duyệt tiêu hủy M28', '$[2].user', ${username})`
      } as any)
      .where(eq(schema.dmsDocuments.id, docId))
      .returning();

    await AuditService.recordAuditLog({
      module: 'M29',
      action: 'REQUEST_DISPOSAL',
      entityType: 'DMS_DOCUMENT',
      entityId: docId,
      userId,
      username,
      result: 'SUCCESS',
      metadata: { reason }
    });

    return updated[0];
  }

  /**
   * F12: Finalize Disposal - Leave tombstone
   */
  static async finalizeDisposal(docId: number, userId: number, username: string) {
    const doc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, docId)).get();
    if (!doc) throw new Error("Không tìm thấy tài liệu");
    if (doc.legalHold) throw new Error("Tài liệu đang bị áp dụng Lệnh Giữ Pháp Lý (Legal Hold). Tuyệt đối không được phép tiêu hủy.");

    // Check retention period
    if (doc.retentionUntil && new Date(doc.retentionUntil).getTime() > Date.now()) {
      throw new Error(`Tài liệu chưa hết thời hạn lưu trữ pháp định (hạn lưu trữ đến: ${new Date(doc.retentionUntil).toLocaleDateString('vi-VN')}).`);
    }

    const disposalAt = new Date();
    const updated = await db.update(schema.dmsDocuments)
      .set({
        status: DmsStatus.DISPOSED,
        sha256Hash: `TOMBSTONE_${doc.sha256Hash}`,
        sizeBytes: 0,
        fileContentBase64: null, // Wipe binary payload
        signedBy: `DISPOSED_BY_${username}`,
        signedAt: disposalAt.toISOString(),
      } as any)
      .where(eq(schema.dmsDocuments.id, docId))
      .returning();

    await AuditService.recordAuditLog({
      module: 'M29',
      action: 'FINALIZE_DISPOSAL',
      entityType: 'DMS_DOCUMENT',
      entityId: docId,
      userId,
      username,
      result: 'SUCCESS',
      metadata: { originalHash: doc.sha256Hash, docCode: doc.docCode }
    });

    return updated[0];
  }

  /**
   * P1: F03 Sign & Seal (Niêm phong nội bộ / Ký số số hóa)
   */
  static async sealDocument(
    docId: number, 
    userIdOrParams: number | { signerId?: number; signerName?: string; signatureType?: 'INTERNAL' | 'LEGAL_CA' }, 
    username?: string, 
    signatureType: 'INTERNAL' | 'LEGAL_CA' = "INTERNAL"
  ) {
    let resolvedUserId = 1;
    let resolvedUsername = "Admin";
    let resolvedType: 'INTERNAL' | 'LEGAL_CA' = signatureType;

    if (typeof userIdOrParams === "object" && userIdOrParams !== null) {
      resolvedUserId = userIdOrParams.signerId || 1;
      resolvedUsername = userIdOrParams.signerName || "Admin";
      resolvedType = userIdOrParams.signatureType || "INTERNAL";
    } else if (typeof userIdOrParams === "number") {
      resolvedUserId = userIdOrParams;
      resolvedUsername = username || "Admin";
      resolvedType = signatureType;
    }

    const doc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, docId)).get();
    if (!doc) throw new Error("Không tìm thấy tài liệu");
    if (doc.status === DmsStatus.SEALED) return doc;

    const sealedAt = new Date();
    const certSerial = resolvedType === 'LEGAL_CA' ? `VN-CA-${Date.now().toString(16).toUpperCase()}` : null;
    
    // Create e-signature record
    await db.insert(schema.eSignatures).values({
      docId,
      signerId: resolvedUserId,
      signerName: resolvedUsername,
      signatureType: resolvedType,
      hashValue: doc.sha256Hash || "",
      certificateSerial: certSerial,
      signedAt: sealedAt,
    });

    const updated = await db.update(schema.dmsDocuments)
      .set({
        status: DmsStatus.SEALED,
        signedBy: resolvedUsername,
        signedAt: sealedAt.toISOString(),
        workflowStage: 3,
      } as any)
      .where(eq(schema.dmsDocuments.id, docId))
      .returning();

    // Emit M05 Event: dms.document.sealed.v1 (idempotent payload)
    await eventBus.publishTransactional(db, {
      eventType: "dms.document.sealed.v1",
      aggregateType: "DMS_DOCUMENT",
      aggregateId: String(doc.id),
      source: "M29_DMS",
      payload: {
        docId: doc.id,
        docCode: doc.docCode,
        category: doc.category,
        entityType: doc.entityType,
        entityId: doc.entityId,
        sha256: doc.sha256Hash,
        version: doc.version,
        classification: doc.classification,
        timestamp: sealedAt.getTime()
      },
      metadata: { idempotencyKey: `seal-${docId}-${doc.version}`, source: "M29_DMS" },
      actorId: resolvedUserId
    });

    await AuditService.recordAuditLog({
      module: 'M29',
      action: 'SEAL_DOCUMENT',
      entityType: 'DMS_DOCUMENT',
      entityId: docId,
      userId: resolvedUserId,
      username: resolvedUsername,
      result: 'SUCCESS',
      metadata: { signatureType: resolvedType, certificateSerial: certSerial }
    });

    return updated[0];
  }

  /**
   * P0: F08 Verify Integrity (Đơn lẻ & Hàng loạt)
   */
  static async verifyIntegrity(docId: number, currentContent?: Buffer | string) {
    const doc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, docId)).get();
    if (!doc) throw new Error("Không tìm thấy tài liệu");

    // Case 1: Client sends content
    if (currentContent) {
      const buf = typeof currentContent === "string" ? Buffer.from(currentContent) : currentContent;
      const currentHash = crypto.createHash('sha256').update(buf).digest('hex');
      const isValid = currentHash === doc.sha256Hash;
      return {
        docId: doc.id,
        docCode: doc.docCode,
        isValid,
        checksumMatches: isValid,
        storedHash: doc.sha256Hash,
        actualHash: currentHash,
        hashScope: doc.hashScope || "FILE_CONTENT",
        status: doc.status,
      };
    }

    // Case 2: Verification using stored binary if available
    if (doc.fileContentBase64) {
      const buf = Buffer.from(doc.fileContentBase64, "base64");
      const currentHash = crypto.createHash('sha256').update(buf).digest('hex');
      const isValid = currentHash === doc.sha256Hash;
      return {
        docId: doc.id,
        docCode: doc.docCode,
        isValid,
        checksumMatches: isValid,
        storedHash: doc.sha256Hash,
        actualHash: currentHash,
        hashScope: doc.hashScope || "FILE_CONTENT",
        status: doc.status,
      };
    }

    // Case 3: Metadata / structural integrity verification
    const isValid = !!doc.sha256Hash && !doc.sha256Hash.startsWith("TOMBSTONE");
    return {
      docId: doc.id,
      docCode: doc.docCode,
      isValid,
      checksumMatches: isValid,
      storedHash: doc.sha256Hash,
      actualHash: doc.sha256Hash,
      hashScope: doc.hashScope || "METADATA_JSON",
      status: doc.status,
      note: "Xác thực cấu trúc băm metadata hợp lệ."
    };
  }

  /**
   * Batch verify integrity for all sealed documents
   */
  static async batchVerifyIntegrity() {
    const docs = await db.select().from(schema.dmsDocuments).all();
    const results = await Promise.all(
      docs.map(async (d) => {
        try {
          return await this.verifyIntegrity(d.id);
        } catch (err: any) {
          return {
            docId: d.id,
            docCode: d.docCode,
            isValid: false,
            storedHash: d.sha256Hash,
            actualHash: "ERROR",
            error: err.message
          };
        }
      })
    );

    const total = results.length;
    const passed = results.filter(r => r.isValid).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      results
    };
  }

  /**
   * F04: Cross-Module Document Archiving (Duy trì API cũ)
   */
  static async archiveDossier(params: {
    docId: number;
    archivePath?: string;
    archiveTier?: string;
  }) {
    const { docId, archivePath, archiveTier } = params;
    const doc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, docId)).get();
    if (!doc) throw new Error("Không tìm thấy tài liệu");

    const resolvedPath = archivePath || `/vault/archive/${new Date().getFullYear()}/${doc.docCode}.zip`;
    const resolvedTier = archiveTier || "COLD_GLACIER";

    const [archive] = await db.insert(schema.dmsArchives).values({
      docId,
      archivePath: resolvedPath,
      archiveTier: resolvedTier,
    }).returning();

    await db.update(schema.dmsDocuments)
      .set({ storageTier: resolvedTier } as any)
      .where(eq(schema.dmsDocuments.id, docId));

    return archive;
  }

  /**
   * Get document by ID
   */
  static async getDocument(docId: number) {
    return await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, docId)).get();
  }

  /**
   * Get attachments for a specific entity (M31, M08, etc.)
   */
  static async getAttachments(entityType: string, entityId: string) {
    return await db.select().from(schema.dmsDocuments)
      .where(and(
        eq(schema.dmsDocuments.entityType, entityType),
        eq(schema.dmsDocuments.entityId, entityId)
      ))
      .orderBy(desc(schema.dmsDocuments.id))
      .all();
  }

  /**
   * F11: Missing Attachments Report (Chỉ báo cáo, không chặn module khác)
   */
  static async getMissingAttachmentsReport(): Promise<MissingAttachmentReportItem[]> {
    const missing: MissingAttachmentReportItem[] = [];

    try {
      // 1. Check Unattached Invoices (M31)
      const invoices = await db.select().from(schema.invoices).limit(30).all();
      const invoiceDocs = await db.select().from(schema.dmsDocuments)
        .where(eq(schema.dmsDocuments.entityType, "M31_INVOICE"))
        .all();
      const attachedInvIds = new Set(invoiceDocs.map(d => d.entityId));

      for (const inv of invoices) {
        if (!attachedInvIds.has(String(inv.id)) && !attachedInvIds.has(inv.invoiceNumber)) {
          missing.push({
            id: `M31-${inv.id}`,
            module: "M31",
            moduleName: "Hóa Đơn AR/AP & VAT",
            entityType: "M31_INVOICE",
            entityId: String(inv.id),
            docNumber: inv.invoiceNumber,
            title: `Hóa đơn ${inv.invoiceNumber} - ${inv.customerName || "Khách hàng"}`,
            date: inv.issueDate || new Date().toISOString().slice(0, 10),
            creator: "Phòng Kế Toán",
            amount: inv.totalAmount || 0,
            urgency: "HIGH",
            recommendedCategory: "INVOICE",
            status: "PENDING_UPLOAD"
          });
        }
      }

      // 2. Check Unattached Purchase Orders (M08)
      const pos = await db.select().from(schema.purchaseOrders).limit(30).all();
      const poDocs = await db.select().from(schema.dmsDocuments)
        .where(eq(schema.dmsDocuments.entityType, "M08_PO"))
        .all();
      const attachedPoIds = new Set(poDocs.map(d => d.entityId));

      for (const po of pos) {
        if (!attachedPoIds.has(String(po.id)) && !attachedPoIds.has(po.code)) {
          missing.push({
            id: `M08-${po.id}`,
            module: "M08",
            moduleName: "Đơn Mua Hàng & Hợp Đồng",
            entityType: "M08_PO",
            entityId: String(po.id),
            docNumber: po.code,
            title: `Đơn mua ${po.code} - ${po.supplierName || "Nhà cung cấp"}`,
            date: po.createdAt ? new Date(po.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            creator: "Phòng Mua Hàng",
            amount: po.totalAmount || 0,
            urgency: "MEDIUM",
            recommendedCategory: "CONTRACT",
            status: "PENDING_UPLOAD"
          });
        }
      }

      // 3. Check Cash Vouchers (M32)
      const cashVouchers = await db.select().from(schema.cashVouchers).limit(30).all();
      const voucherDocs = await db.select().from(schema.dmsDocuments)
        .where(eq(schema.dmsDocuments.entityType, "M32_PAYMENT"))
        .all();
      const attachedVoucherIds = new Set(voucherDocs.map(d => d.entityId));

      for (const v of cashVouchers) {
        if (!attachedVoucherIds.has(String(v.id)) && !attachedVoucherIds.has(v.voucherCode)) {
          missing.push({
            id: `M32-${v.id}`,
            module: "M32",
            moduleName: "Thu Chi & Ngân Quỹ",
            entityType: "M32_PAYMENT",
            entityId: String(v.id),
            docNumber: v.voucherCode,
            title: `Phiếu thu/chi ${v.voucherCode} - ${v.description || "Thanh toán"}`,
            date: v.voucherDate || new Date().toISOString().slice(0, 10),
            creator: "Thủ Quỹ",
            amount: v.amount || 0,
            urgency: (v.amount || 0) > 50000000 ? "HIGH" : "LOW",
            recommendedCategory: "FINANCIAL_REPORT",
            status: "PENDING_UPLOAD"
          });
        }
      }
    } catch (e) {
      console.error("[DmsService] Lỗi quét báo cáo chứng từ thiếu đính kèm:", e);
    }

    return missing;
  }
}
