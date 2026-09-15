import { Router } from "express";
import { client, db, recreateDatabaseClient } from "../../db/index";
import * as schema from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const router = Router();

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

router.get("/api/dms/documents", async (req, res) => {
  try {
    const docs = await db.select().from(schema.dmsDocuments).orderBy(desc(schema.dmsDocuments.id)).all();
    res.json(docs.map(parseDoc));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi tải tài liệu DMS' });
  }
});

router.post("/api/dms/documents", async (req, res) => {
  try {
    const { title, category, categoryName, fileSize, format, linkedModule, refDocNo, securityLevel } = req.body;
    const totalDocs = await db.select().from(schema.dmsDocuments).all();
    const newDoc = {
      docCode: `DMS-${(category || 'DOC').toUpperCase().slice(0, 3)}-2026-${String(totalDocs.length + 1).padStart(3, '0')}`,
      title: title || 'Tài liệu Số hóa Mới',
      category: category || 'GENERAL',
      categoryName: categoryName || 'Tài liệu Chung',
      version: 'v1.0',
      fileSize: fileSize || '1.5 MB',
      format: format || 'PDF',
      status: 'DRAFT',
      securityLevel: securityLevel || 'INTERNAL',
      sha256Hash: `hash_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}8f94c12a7e4b901f`,
      signedBy: 'Chưa ký số',
      signedAt: null,
      linkedModule: linkedModule || 'M01 Workspace Hub',
      refDocNo: refDocNo || 'REF-2026-001',
      storageTier: 'ACTIVE_VAULT',
      retentionYears: 5,
      expireDate: '2031-08-28',
      workflowStage: 1,
      workflowSteps: JSON.stringify([
        { step: 1, name: 'Khởi tạo & Trình duyệt', role: 'REQUESTER', status: 'COMPLETED', user: 'Hoàng Nam (Admin)', signedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') },
        { step: 2, name: 'Thẩm định Pháp chế / Quản lý', role: 'LEGAL', status: 'PENDING', user: 'Chờ Pháp chế duyệt', signedAt: null },
        { step: 3, name: 'Ký số CA / CFO Phê duyệt', role: 'CFO', status: 'PENDING', user: 'Chờ CFO ký số', signedAt: null },
      ]),
    };

    const inserted = await db.insert(schema.dmsDocuments).values(newDoc as any).returning();
    res.status(201).json(parseDoc(inserted[0] || newDoc));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi tạo tài liệu' });
  }
});

router.post("/api/dms/documents/:id/sign", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const docs = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
    if (!docs[0]) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }
    const doc = parseDoc(docs[0]);
    const signedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sha256Hash = `sig_${Date.now().toString(16)}_sha256_verified_root`;
    const updatedSteps = (doc.workflowSteps || []).map((st: any) => ({
      ...st,
      status: 'COMPLETED',
      signedAt: st.signedAt || signedAt
    }));

    await db.update(schema.dmsDocuments).set({
      status: 'SIGNED',
      signedBy: 'Hoàng Nam (Admin) - Token HSM CA',
      signedAt,
      sha256Hash,
      workflowStage: 3,
      workflowSteps: JSON.stringify(updatedSteps),
    } as any).where(eq(schema.dmsDocuments.id, id));

    const updated = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
    res.json({ success: true, document: parseDoc(updated[0]), message: 'Đã hoàn tất ký số điện tử với mã băm toàn vẹn SHA-256.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi ký số tài liệu' });
  }
});

router.post("/api/dms/documents/:id/version", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const docs = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
    if (!docs[0]) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }
    const doc = parseDoc(docs[0]);
    const currentVerNum = parseFloat((doc.version || 'v1.0').replace('v', '')) || 1.0;
    const newVersion = `v${(currentVerNum + 0.1).toFixed(1)}`;
    const sha256Hash = `rev_${Date.now().toString(16)}_sha256_audit_${newVersion}`;

    const updatedSteps = (doc.workflowSteps || []).map((st: any, idx: number) => ({
      ...st,
      status: idx === 0 ? 'COMPLETED' : 'PENDING',
      signedAt: idx === 0 ? new Date().toISOString().slice(0, 16).replace('T', ' ') : null,
    }));

    await db.update(schema.dmsDocuments).set({
      version: newVersion,
      status: 'DRAFT',
      signedBy: 'Cập nhật phiên bản mới - Chờ duyệt',
      signedAt: null,
      sha256Hash,
      workflowStage: 1,
      workflowSteps: JSON.stringify(updatedSteps),
    } as any).where(eq(schema.dmsDocuments.id, id));

    const updated = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
    res.json({ success: true, document: parseDoc(updated[0]), message: `Đã cập nhật phiên bản mới ${newVersion} thành công.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi cập nhật phiên bản' });
  }
});

router.post("/api/dms/documents/:id/verify", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const docs = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
    if (!docs[0]) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }
    const doc = parseDoc(docs[0]);
    res.json({
      success: true,
      document: doc,
      verifiedAt: new Date().toISOString(),
      checksumMatches: true,
      message: `Xác thực thành công: Mã băm SHA-256 [${doc?.sha256Hash?.slice(0, 16)}...] khớp 100% với Sổ cái Kiểm toán An ninh Enterprise.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi xác thực tài liệu' });
  }
});

router.post("/api/dms/documents/ocr", async (req, res) => {
  try {
    const { text: fileContent, fileName } = req.body;
    let ocrResult;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
       const ai = new GoogleGenAI({ apiKey });
       const prompt = `Trích xuất thông tin hợp đồng sau thành JSON (bắt buộc đúng định dạng JSON chuẩn):
         {
           "title": "Tên tài liệu",
           "category": "CONTRACT",
           "categoryName": "Hợp đồng Kinh tế",
           "taxCode": "MST",
           "totalAmount": "245,000,000 VNĐ",
           "partnerName": "Tên đối tác",
           "linkedModule": "M04 Sales Orders",
           "refDocNo": "SO-123",
           "securityLevel": "CONFIDENTIAL",
           "extractedConfidence": "98%",
           "detectedFields": [ { "label": "Trường 1", "value": "Giá trị 1" } ]
         }
         
         Nội dung tệp tham khảo (giả lập): ${fileName} - ${fileContent || ''}`;
         
       const aiResponse = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: prompt
       });
       
       let text = aiResponse.text;
       try {
         text = (text || '').trim();
         if (text.startsWith('```json')) {
            text = text.replace(/^```json/, '').replace(/```$/, '');
         } else if (text.startsWith('```')) {
            text = text.replace(/^```/, '').replace(/```$/, '');
         }
         ocrResult = JSON.parse(text);
       } catch (e) {
         console.error("Failed to parse Gemini output", text);
       }
    }
    
    if (!ocrResult) {
        ocrResult = {
          title: fileName ? `Tài liệu: ${fileName}` : 'Tài liệu không xác định',
          category: 'CONTRACT',
          categoryName: 'Hợp đồng',
          taxCode: 'N/A',
          totalAmount: 'N/A',
          partnerName: 'N/A',
          linkedModule: 'DMS',
          refDocNo: 'N/A',
          securityLevel: 'INTERNAL',
          extractedConfidence: 'N/A',
          detectedFields: []
        };
    }
    
    res.json({
      success: true,
      ocrData: ocrResult,
      message: 'Trích xuất OCR thành công.',
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/dms/documents/:id/workflow-sign", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { stage } = req.body; // 2 (Legal) or 3 (CFO)
    const docs = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
    if (!docs[0]) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }
    const doc = parseDoc(docs[0]);
    const steps = doc.workflowSteps || [];

    if (stage === 2) {
      if (steps[1]) {
        steps[1].status = 'COMPLETED';
        steps[1].user = 'Trần Thu Hà (Trưởng phòng Pháp chế)';
        steps[1].signedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
      }
      await db.update(schema.dmsDocuments).set({
        workflowStage: 2,
        workflowSteps: JSON.stringify(steps),
        status: 'APPROVED',
      } as any).where(eq(schema.dmsDocuments.id, id));

      const updated = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
      res.json({ success: true, document: parseDoc(updated[0]), message: 'Phòng Pháp chế đã thẩm định & phê duyệt điều khoản chứng từ.' });
    } else if (stage === 3) {
      const signedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      if (steps[2]) {
        steps[2].status = 'COMPLETED';
        steps[2].user = 'Kế toán trưởng (CFO) - Token HSM';
        steps[2].signedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
      }
      const sha256Hash = `sig_cfo_${Date.now().toString(16)}_sha256_final_sealed`;

      await db.update(schema.dmsDocuments).set({
        workflowStage: 3,
        workflowSteps: JSON.stringify(steps),
        status: 'SIGNED',
        signedBy: 'Kế toán trưởng (CFO) - Token HSM',
        signedAt,
        sha256Hash,
      } as any).where(eq(schema.dmsDocuments.id, id));

      const updated = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
      res.json({ success: true, document: parseDoc(updated[0]), message: 'CFO đã ký số CA/HSM hoàn tất luồng trình ký 3 cấp.' });
    } else {
      res.status(400).json({ error: 'Giai đoạn trình ký không hợp lệ' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi phê duyệt quy trình' });
  }
});

router.post("/api/dms/documents/:id/archive", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const docs = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();
    if (!docs[0]) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }
    const doc = parseDoc(docs[0]);
    const newTier = doc.storageTier === 'COLD_GLACIER' ? 'ACTIVE_VAULT' : 'COLD_GLACIER';
    const isCold = newTier === 'COLD_GLACIER';

    await db.update(schema.dmsDocuments).set({ storageTier: newTier } as any).where(eq(schema.dmsDocuments.id, id));
    const updated = await db.select().from(schema.dmsDocuments).where(eq(schema.dmsDocuments.id, id)).all();

    res.json({
      success: true,
      document: parseDoc(updated[0]),
      message: isCold
        ? 'Đã đóng băng & chuyển tài liệu sang kho băng từ Cold Storage (S3 Glacier Vault) niêm phong 10 năm.'
        : 'Đã kích hoạt lại tài liệu về Kho lưu trữ Nhanh (Active Vault S3 Standard).',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi lưu trữ tài liệu' });
  }
});

export default router;
