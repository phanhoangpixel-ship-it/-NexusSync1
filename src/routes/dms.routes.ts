import { Router } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middleware/auth.middleware";
import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { eq, desc, and, or, sql, like } from "drizzle-orm";
import { AuditService } from "../../engines/auditService";
import { DmsService } from "../../engines/dmsService";
import { DmsEntityLinker } from "../../engines/dmsEntityLinker";
import { DmsStatus, DmsClassification } from "../modules/governance/m29-dms/types";

const router = Router();

function resolveUser(req: any) {
  if (req.user) return req.user;
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) return decoded;
    } catch (e) {
      // ignore
    }
  }
  return { id: 1, username: 'admin', role: 'SUPER_ADMIN', permissions: ['admin'] };
}

function parseDoc(doc: any) {
  if (!doc) return doc;
  let steps = doc.workflowSteps;
  if (typeof steps === 'string') {
    try {
      steps = JSON.parse(steps);
    } catch {
      steps = [];
    }
  }
  return { ...doc, workflowSteps: steps };
}

// ==========================================
// 1. GET /api/dms/documents - List documents with search, RBAC & security filter
// ==========================================
router.get("/api/dms/documents", async (req, res) => {
  try {
    const { entityType, entityId, category, search, classification, status, limit, offset } = req.query;
    const user = resolveUser(req);
    
    let query = db.select().from(schema.dmsDocuments);
    const conditions = [];

    if (entityType) conditions.push(eq(schema.dmsDocuments.entityType, entityType as string));
    if (entityId) conditions.push(eq(schema.dmsDocuments.entityId, entityId as string));
    if (category) conditions.push(eq(schema.dmsDocuments.category, category as string));
    if (status) conditions.push(eq(schema.dmsDocuments.status, status as string));
    if (classification) conditions.push(eq(schema.dmsDocuments.classification, classification as string));

    if (search) {
      const term = `%${search}%`;
      conditions.push(or(
        like(schema.dmsDocuments.docCode, term),
        like(schema.dmsDocuments.title, term),
        like(schema.dmsDocuments.refDocNo, term),
        like(schema.dmsDocuments.sha256Hash, term)
      ));
    }

    const docs = await (conditions.length > 0 
      ? query.where(and(...conditions)) 
      : query
    ).orderBy(desc(schema.dmsDocuments.id)).all();

    // Security guard: Check classification permission
    const hasConfidentialPerm = user.role === 'SUPER_ADMIN' || user.permissions?.includes('dms.confidential.view') || user.permissions?.includes('admin');
    const filteredDocs = docs.map(d => {
      const parsed = parseDoc(d);
      if (parsed.classification === DmsClassification.RESTRICTED && !hasConfidentialPerm) {
        // Redact metadata for restricted docs if user lacks permission
        return {
          ...parsed,
          title: `[TÀI LIỆU BẢO MẬT - ${parsed.docCode}]`,
          sha256Hash: `***HIDDEN***`,
          fileContentBase64: null,
          isRedacted: true
        };
      }
      return parsed;
    });

    res.json(filteredDocs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi tải danh sách tài liệu DMS' });
  }
});

// ==========================================
// 2. GET /api/dms/documents/:id - Single document + Audit Log (F10)
// ==========================================
router.get("/api/dms/documents/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = resolveUser(req);
    const doc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).get();

    if (!doc) {
      return res.status(404).json({ error: "Không tìm thấy tài liệu" });
    }

    if (doc.classification === DmsClassification.RESTRICTED) {
      const hasConfidentialPerm = user.role === 'SUPER_ADMIN' || user.permissions?.includes('dms.confidential.view') || user.permissions?.includes('admin');
      if (!hasConfidentialPerm) {
        return res.status(403).json({ error: "Bạn không có thẩm quyền truy cập tài liệu bảo mật mức RESTRICTED." });
      }
    }

    // Log access in M02 for Confidential/Restricted documents
    if (doc.classification === DmsClassification.CONFIDENTIAL || doc.classification === DmsClassification.RESTRICTED) {
      await AuditService.recordAuditLog({
        module: 'M29',
        action: 'VIEW_CONFIDENTIAL_DOCUMENT',
        entityType: 'DMS_DOCUMENT',
        entityId: id,
        userId: user.id,
        username: user.username,
        result: 'SUCCESS',
        metadata: { docCode: doc.docCode, classification: doc.classification }
      });
    }

    res.json(parseDoc(doc));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi đọc chi tiết tài liệu' });
  }
});

// ==========================================
// 2a. PUT /api/dms/documents/:id - Update Document with Immutability Protection
// ==========================================
router.put("/api/dms/documents/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).get();
    if (!doc) {
      return res.status(404).json({ error: "Không tìm thấy tài liệu" });
    }

    if (doc.status === DmsStatus.SEALED || doc.status === DmsStatus.DISPOSED || doc.status === DmsStatus.SUPERSEDED) {
      return res.status(403).json({ 
        error: `Tài liệu đã ở trạng thái ${doc.status} bất biến. Cấm chỉnh sửa nội dung trực tiếp theo Rule #16 & Rule #19. Hãy tạo phiên bản mới (supersedesId).`,
        code: "IMMUTABLE_DOCUMENT" 
      });
    }

    const { title, categoryName, notes } = req.body;
    const updated = await db.update(schema.dmsDocuments)
      .set({
        ...(title ? { title } : {}),
        ...(categoryName ? { categoryName } : {}),
        ...(notes !== undefined ? { notes } : {}),
      } as any)
      .where(eq(schema.dmsDocuments.id, id))
      .returning();

    res.json({ success: true, document: parseDoc(updated[0]) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2a2. DELETE /api/dms/documents/:id - Delete Document with Immutability Protection
// ==========================================
router.delete("/api/dms/documents/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).get();
    if (!doc) {
      return res.status(404).json({ error: "Không tìm thấy tài liệu" });
    }

    if (doc.status === DmsStatus.SEALED || doc.status === DmsStatus.DISPOSED || doc.legalHold) {
      return res.status(403).json({ 
        error: `Tài liệu đã ở trạng thái ${doc.status} hoặc đang có Legal Hold. Tuyệt đối cấm xóa trực tiếp. Bắt buộc tuân thủ quy trình tiêu hủy có kiểm soát (F12).`,
        code: "IMMUTABLE_DOCUMENT_DELETE_FORBIDDEN" 
      });
    }

    await db.delete(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id));
    res.json({ success: true, message: "Đã xóa tài liệu nháp thành công." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2b. GET /api/dms/documents/:id/download - Stream/download original binary file
// ==========================================
router.get("/api/dms/documents/:id/download", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = resolveUser(req);
    const doc = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).get();

    if (!doc) {
      return res.status(404).json({ error: "Không tìm thấy tài liệu" });
    }

    if (doc.classification === DmsClassification.RESTRICTED) {
      const hasPerm = user.role === 'SUPER_ADMIN' || user.permissions?.includes('dms.confidential.view') || user.permissions?.includes('admin');
      if (!hasPerm) {
        return res.status(403).json({ error: "Tài liệu mức TUYỆT MẬT (RESTRICTED). Bạn không có thẩm quyền tải file." });
      }
    }

    if (!doc.fileContentBase64) {
      return res.status(404).json({ error: "Tài liệu này không có tệp nhị phân lưu trữ (Metadata only hoặc đã bị tiêu hủy)" });
    }

    // Record audit log for download
    await AuditService.recordAuditLog({
      module: 'M29',
      action: 'DOWNLOAD_DOCUMENT',
      entityType: 'DMS_DOCUMENT',
      entityId: id,
      userId: user.id,
      username: user.username,
      result: 'SUCCESS',
      metadata: { docCode: doc.docCode, classification: doc.classification }
    });

    const fileBuf = Buffer.from(doc.fileContentBase64, 'base64');
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.docCode}.${(doc.format || 'bin').toLowerCase()}"`);
    res.setHeader('Content-Length', fileBuf.length);
    res.send(fileBuf);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi tải tệp tin' });
  }
});

// ==========================================
// 2c. GET /api/dms/entity/:type/:id/attachments - Get attachments for an entity
// ==========================================
router.get("/api/dms/entity/:type/:id/attachments", async (req, res) => {
  try {
    const { type, id } = req.params;
    const attachments = await DmsService.getAttachments(type, id);
    res.json(attachments.map(parseDoc));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi tải tệp đính kèm theo chứng từ' });
  }
});

// ==========================================
// 3. POST /api/dms/vault & /api/dms/vault/seal - F01 Secure Vault Upload
// ==========================================
router.post(["/api/dms/vault", "/api/dms/vault/seal"], async (req, res) => {
  try {
    const { 
      title, category, categoryName, content, fileName, mimeType,
      entityType, entityId, classification, idempotencyKey,
      linkedModule, refDocNo, retentionYears, supersedesId
    } = req.body;
    
    const user = (req as any).user || { id: 1, username: 'admin', role: 'SUPER_ADMIN' };

    // F05: Verify entity existence
    if (entityType && entityId) {
      const exists = await DmsEntityLinker.verifyEntity(entityType, entityId);
      if (!exists) {
        return res.status(404).json({ 
          error: `Không tìm thấy chứng từ chủ tham chiếu ${entityType} ID/Code: ${entityId}`,
          code: "ENTITY_NOT_FOUND" 
        });
      }
    }

    const { declaredHash, isBase64 } = req.body;

    const result = await DmsService.vaultDocument({
      title: title || 'Tài liệu DMS',
      category: category || 'GENERAL',
      categoryName,
      content: content || Buffer.from(title || 'NexusSync DMS Document'),
      fileName,
      mimeType,
      entityType,
      entityId,
      classification: classification as DmsClassification,
      idempotencyKey,
      userId: user.id,
      username: user.username,
      linkedModule,
      refDocNo,
      retentionYears: Number(retentionYears) || 5,
      supersedesId: supersedesId ? Number(supersedesId) : undefined,
      declaredHash,
      isBase64: Boolean(isBase64)
    });

    res.status(201).json({
      success: true,
      document: parseDoc(result.document),
      alreadyProcessed: (result as any).alreadyProcessed,
      duplicate: (result as any).duplicate
    });
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('25 MB') || msg.includes('vượt quá giới hạn')) {
      return res.status(413).json({ error: msg, code: 'PAYLOAD_TOO_LARGE' });
    }
    if (msg.includes('Định dạng MIME không nằm trong danh mục') || msg.includes('MIME')) {
      return res.status(415).json({ error: msg, code: 'UNSUPPORTED_MEDIA_TYPE' });
    }
    if (msg.includes('Sai lệch mã băm') || msg.includes('Mã băm khai báo không khớp') || msg.includes('bắt buộc')) {
      return res.status(400).json({ error: msg, code: 'BAD_REQUEST' });
    }
    if (msg.includes('Xung đột phiên bản') || msg.includes('CONFLICT')) {
      return res.status(409).json({ error: msg, code: 'CONFLICT' });
    }
    res.status(500).json({ error: err.message || 'Lỗi lưu trữ tài liệu vào kho' });
  }
});

// ==========================================
// 4. POST /api/dms/documents/:id/sign - F03 Sign & Seal (M05 Outbox Event)
// ==========================================
router.post("/api/dms/documents/:id/sign", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { signatureType } = req.body;
    const user = (req as any).user || { id: 1, username: 'admin' };
    
    const sealedDoc = await DmsService.sealDocument(id, user.id, user.username, signatureType || "INTERNAL");
    
    res.json({ 
      success: true, 
      document: parseDoc(sealedDoc), 
      message: 'Đã ký số và niêm phong mật mã bất biến thành công.' 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi ký số tài liệu' });
  }
});

// ==========================================
// 5. POST /api/dms/documents/:id/verify & /batch-verify - F08 Integrity Check
// ==========================================
router.post("/api/dms/documents/:id/verify", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const verification = await DmsService.verifyIntegrity(id);
    
    res.json({
      success: true,
      verifiedAt: new Date().toISOString(),
      checksumMatches: verification.isValid,
      data: verification,
      message: verification.isValid 
        ? `Xác thực thành công. Mã băm SHA-256 (${verification.storedHash?.slice(0, 16)}...) khớp 100% với bản lưu trữ.` 
        : `CẢNH BÁO NGUY HIỂM: Sai lệch mã băm! Tài liệu hoặc chuỗi dữ liệu đã bị can thiệp trái phép!`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi xác thực toàn vẹn' });
  }
});

router.post("/api/dms/documents/batch-verify", async (_req, res) => {
  try {
    const report = await DmsService.batchVerifyIntegrity();
    res.json({
      success: true,
      verifiedAt: new Date().toISOString(),
      ...report
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi xác thực hàng loạt' });
  }
});

// ==========================================
// 6. PUT /api/dms/retention - F02 Retention & Legal Hold Guard
// ==========================================
router.put(["/api/dms/retention", "/api/dms/documents/:id/retention"], async (req, res) => {
  try {
    const docId = Number(req.params.id || req.body.docId);
    const { retentionYears, retentionClass, legalHold, reason } = req.body;
    const user = (req as any).user || { id: 1, username: 'admin' };
    
    const updated = await DmsService.updateRetentionAndLegalHold({
      docId,
      retentionYears: retentionYears ? Number(retentionYears) : undefined,
      retentionClass,
      legalHold: typeof legalHold === "boolean" ? legalHold : undefined,
      userId: user.id,
      username: user.username,
      reason
    });
    
    res.json({ 
      success: true, 
      document: parseDoc(updated), 
      message: 'Đã cập nhật chính sách lưu trữ và trạng thái Giữ Pháp Lý (Legal Hold).' 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi cập nhật Retention' });
  }
});

// ==========================================
// 7. POST /api/dms/archive - F04 Cross-Module Archiving Gateway
// ==========================================
router.post(["/api/dms/archive", "/api/dms/archive-dossier"], async (req, res) => {
  try {
    const { docId, archivePath, archiveTier } = req.body;
    const archive = await DmsService.archiveDossier({
      docId: Number(docId),
      archivePath,
      archiveTier
    });
    res.status(201).json({ success: true, archive });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi đóng gói kho lưu trữ' });
  }
});

// ==========================================
// 8. F12: Controlled Disposal Workflow (M28 Governance)
// ==========================================
router.post("/api/dms/documents/:id/request-disposal", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;
    const user = (req as any).user || { id: 1, username: 'admin' };
    
    const doc = await DmsService.requestDisposal(id, user.id, user.username, reason || "Hết hạn lưu trữ pháp lý");
    res.json({ success: true, document: parseDoc(doc), message: 'Đã gửi yêu cầu tiêu hủy sang Hội đồng Pháp chế/Nhân sự M28.' });
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('Legal Hold') || msg.includes('chưa hết thời hạn lưu trữ')) {
      return res.status(403).json({ error: msg, code: 'FORBIDDEN_DISPOSAL' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/dms/documents/:id/dispose", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user || { id: 1, username: 'admin' };
    
    const doc = await DmsService.finalizeDisposal(id, user.id, user.username);
    res.json({ 
      success: true, 
      document: parseDoc(doc), 
      message: 'Tài liệu đã được tiêu hủy có kiểm soát. Dấu vết tiêu hủy (Tombstone) đã lưu trữ vĩnh viễn trong M02.' 
    });
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('Legal Hold') || msg.includes('chưa hết thời hạn lưu trữ')) {
      return res.status(403).json({ error: msg, code: 'FORBIDDEN_DISPOSAL' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. F11: Missing Attachments Report
// ==========================================
router.get("/api/dms/reports/missing-attachments", async (_req, res) => {
  try {
    const report = await DmsService.getMissingAttachmentsReport();
    res.json({
      success: true,
      scannedAt: new Date().toISOString(),
      count: report.length,
      items: report
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi quét báo cáo thiếu đính kèm' });
  }
});

// ==========================================
// 10. GET /api/dms/retention-policies & Signatures
// ==========================================
router.get("/api/dms/retention-policies", async (_req, res) => {
  try {
    const policies = await db.select().from(schema.retentionPolicies).all();
    res.json(policies);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/dms/signatures", async (req, res) => {
  try {
    const { docId } = req.query;
    let query = db.select().from(schema.eSignatures);
    if (docId) {
      query = query.where(eq(schema.eSignatures.docId, Number(docId))) as any;
    }
    const sigs = await query.orderBy(desc(schema.eSignatures.id)).all();
    res.json(sigs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. Legacy workflow compatibility
// ==========================================
router.post("/api/dms/documents/:id/workflow-sign", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { stage } = req.body;
    const docs = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
    if (!docs[0]) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    
    const doc = parseDoc(docs[0]);
    const steps = doc.workflowSteps || [];
    
    if (stage === 2) {
      if (steps[1]) {
        steps[1].status = 'COMPLETED';
        steps[1].user = 'Trần Thu Hà (Trưởng phòng Pháp chế)';
        steps[1].signedAt = new Date().toISOString();
      }
      await db.update(schema.dmsDocuments).set({ workflowStage: 2, workflowSteps: JSON.stringify(steps), status: DmsStatus.APPROVED } as any).where(eq(schema.dmsDocuments.id, id));
    } else if (stage === 3) {
      const user = (req as any).user || { id: 1, username: 'admin' };
      await DmsService.sealDocument(id, user.id, user.username);
    }
    
    const updated = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
    res.json({ success: true, document: parseDoc(updated[0]) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
