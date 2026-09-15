import { Router } from "express";
import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const router = Router();

// Helper to seed initial R&D data if table is empty
async function ensureRdSeedData() {
  try {
    const existing = await db.select().from(schema.rdProjects).all();
    if (existing.length === 0) {
      const now = new Date().toISOString().slice(0, 10);
      // Seed Projects
      const p1 = await db.insert(schema.rdProjects).values({
        projectCode: "RD-2026-001",
        title: "Chip Vi Xử Lý AI 3nm Thế Hệ Mới (Nexus Neural-Core)",
        category: "Bán dẫn & Phần cứng",
        lead: "Dr. Hoàng Minh Tuấn",
        status: "IN_PROGRESS",
        progress: 78,
        budget: 15000000000,
        spentBudget: 11700000000,
        currency: "VND",
        startDate: "2026-01-15",
        deadline: "2026-12-31",
        trlLevel: 7,
        riskLevel: "MEDIUM",
        description: "Thiết kế và đóng gói IC vi xử lý mạng nơ-ron chuyên dụng cho hệ thống điều khiển tự động hóa nhà máy thông minh.",
        createdAt: "2026-01-15 08:30:00",
        updatedAt: now,
      } as any).returning();

      const p2 = await db.insert(schema.rdProjects).values({
        projectCode: "RD-2026-002",
        title: "Vật Liệu Nano Polymer Hấp Thụ Carbon Sinh Học",
        category: "Công nghệ Xanh",
        lead: "Ing. Lê Thị Mai",
        status: "TESTING",
        progress: 92,
        budget: 8500000000,
        spentBudget: 7820000000,
        currency: "VND",
        startDate: "2026-02-01",
        deadline: "2026-09-30",
        trlLevel: 8,
        riskLevel: "LOW",
        description: "Hợp chất phủ màng sinh học có khả năng hấp phụ CO2 và tự phân hủy sau 180 ngày trong điều kiện tự nhiên.",
        createdAt: "2026-02-01 09:00:00",
        updatedAt: now,
      } as any).returning();

      const p3 = await db.insert(schema.rdProjects).values({
        projectCode: "RD-2026-003",
        title: "Thuật Toán Dự Báo Nhu Cầu Chuỗi Cung Ứng Tự Trị",
        category: "Phần mềm AI",
        lead: "Eng. Trần Văn Nam",
        status: "COMPLETED",
        progress: 100,
        budget: 3200000000,
        spentBudget: 3150000000,
        currency: "VND",
        startDate: "2026-03-10",
        deadline: "2026-08-15",
        trlLevel: 9,
        riskLevel: "LOW",
        description: "Mô hình học sâu kết hợp Bayesian Optimization dự báo chính xác 96.4% nhu cầu tồn kho theo thời gian thực.",
        createdAt: "2026-03-10 14:00:00",
        updatedAt: now,
      } as any).returning();

      // Seed Formulas
      await db.insert(schema.rdFormulas).values([
        {
          formulaCode: "FORM-01",
          projectId: p1[0]?.id ?? 1,
          name: "Công thức Đúc Chip Substrate Ultra-Clean SiC",
          version: "v2.4",
          status: "APPROVED",
          author: "Lab Vật Liệu Bán Dẫn",
          components: JSON.stringify([
            { name: "Silicon Carbide Wafer 300mm", qty: 1, unit: "tấm", cost: 12500000 },
            { name: "Chất Quang Khắc EUV Photoresist", qty: 25, unit: "ml", cost: 8400000 },
            { name: "Khí Tinh Khiết SiH4 / NF3", qty: 120, unit: "lít", cost: 3100000 }
          ]),
          yieldRate: 94.5,
          testBatchSize: 20,
          approvedBy: "TS. Nguyễn An Hòa (Chief Scientist)",
          approvedAt: "2026-08-10 16:00:00",
          createdAt: "2026-07-01 10:00:00",
        },
        {
          formulaCode: "FORM-02",
          projectId: p2[0]?.id ?? 2,
          name: "Hợp Chất Polymer Bio-Degradable BioMax-800",
          version: "v1.0",
          status: "REVIEW",
          author: "Phòng Hóa Lý & Nano",
          components: JSON.stringify([
            { name: "Tinh bột ngô biến tính PLA", qty: 65, unit: "kg", cost: 1950000 },
            { name: "Chất xúc tác sinh học BioCat-9", qty: 5, unit: "lít", cost: 4500000 },
            { name: "Sợi Xenlulozo Nano gia cường", qty: 15, unit: "kg", cost: 3200000 }
          ]),
          yieldRate: 88.2,
          testBatchSize: 100,
          approvedBy: null,
          approvedAt: null,
          createdAt: "2026-08-05 09:30:00",
        }
      ] as any);

      // Seed Patents
      await db.insert(schema.rdPatents).values([
        {
          patentCode: "PAT-9921",
          projectId: p1[0]?.id ?? 1,
          title: "Cấu Trúc Cổng Logic 3 Chiều Chống Rò Rỉ Dòng Điện",
          filingNo: "VN-2026-004128",
          filingDate: "2026-02-20",
          grantDate: "2026-08-01",
          status: "GRANTED",
          inventors: "Dr. Hoàng Minh Tuấn, KS. Đỗ Đức Long",
          jurisdiction: "Cục SHTT Việt Nam & WIPO",
          abstract: "Giải pháp thiết kế cổng transistor FinFET thế hệ mới giảm 35% điện năng tiêu thụ ở chế độ nghỉ.",
          createdAt: "2026-02-20 11:00:00",
        },
        {
          patentCode: "PAT-9928",
          projectId: p2[0]?.id ?? 2,
          title: "Phương Pháp Tổng Hợp Vật Liệu Nano Hấp Phụ Khí Nhà Kính",
          filingNo: "VN-2026-009841",
          filingDate: "2026-05-14",
          grantDate: null,
          status: "PENDING",
          inventors: "Ing. Lê Thị Mai, GS. Vũ Đình Khoa",
          jurisdiction: "Cục Sở Hữu Trí Tuệ Việt Nam",
          abstract: "Quy trình tổng hợp màng sinh học mao quản nano mở rộng diện tích bề mặt hấp thụ CO2 lên 850 m2/g.",
          createdAt: "2026-05-14 15:30:00",
        }
      ] as any);

      // Seed Trials
      await db.insert(schema.rdLabTrials).values([
        {
          trialCode: "TRL-2026-001",
          projectId: p1[0]?.id ?? 1,
          formulaId: 1,
          trialName: "Thử Nghiệm Ứng Suất Nhiệt & Xung Điện Tần Số 4.5GHz",
          testType: "Thermal & Frequency Stress Test",
          sampleSize: 50,
          status: "PASSED",
          score: 98.4,
          performedBy: "Phòng Đo Kiểm Vi Mạch Lab-A1",
          resultNotes: "Vượt qua bài test 1000 giờ liên tục ở nhiệt độ 105°C không ghi nhận suy giảm hiệu năng.",
          conductedAt: "2026-08-15 14:00:00",
        },
        {
          trialCode: "TRL-2026-002",
          projectId: p2[0]?.id ?? 2,
          formulaId: 2,
          trialName: "Đo Lường Tốc Độ Phân Hủy Màng Nano Trong Đất Trồng",
          testType: "Soil Bio-degradation Test",
          sampleSize: 20,
          status: "RUNNING",
          score: 87.5,
          performedBy: "Trung Tâm Thử Nghiệm Sinh Thái Lab-B3",
          resultNotes: "Mẫu đạt 42% phân hủy sau 45 ngày thử nghiệm gia tốc theo chuẩn ISO 14855.",
          conductedAt: "2026-08-25 09:00:00",
        }
      ] as any);
    }
  } catch (err) {
    console.error("Error seeding R&D data:", err);
  }
}

// ----------------------------------------------------
// 1. PROJECTS APIs
// ----------------------------------------------------
router.get("/api/rd/projects", async (req, res) => {
  try {
    await ensureRdSeedData();
    const projects = await db.select().from(schema.rdProjects).orderBy(desc(schema.rdProjects.id)).all();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi tải danh sách đề tài R&D" });
  }
});

router.post("/api/rd/projects", async (req, res) => {
  try {
    const { title, category, lead, budget, deadline, description, trlLevel, riskLevel } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Tiêu đề đề tài R&D là bắt buộc" });
    }

    const count = (await db.select().from(schema.rdProjects).all()).length;
    const projectCode = `RD-2026-${String(count + 1).padStart(3, "0")}`;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const newProj = {
      projectCode,
      title: title.trim(),
      category: category || "Bán dẫn & Phần cứng",
      lead: lead || "SuperAdmin R&D Lead",
      status: "IN_PROGRESS",
      progress: 10,
      budget: Number(budget) || 5000000000,
      spentBudget: 0,
      currency: "VND",
      startDate: new Date().toISOString().slice(0, 10),
      deadline: deadline || "2026-12-31",
      trlLevel: Number(trlLevel) || 3,
      riskLevel: riskLevel || "MEDIUM",
      description: description || "Đề tài nghiên cứu sáng tạo công nghệ phục vụ dây chuyền sản xuất NexusSync.",
      createdAt: now,
      updatedAt: now,
    };

    const inserted = await db.insert(schema.rdProjects).values(newProj as any).returning();
    res.status(201).json(inserted[0] || newProj);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi khởi tạo đề tài R&D" });
  }
});

router.put("/api/rd/projects/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { progress, status, spentBudget, description } = req.body;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await db.update(schema.rdProjects).set({
      ...(progress !== undefined ? { progress: Number(progress) } : {}),
      ...(status ? { status } : {}),
      ...(spentBudget !== undefined ? { spentBudget: Number(spentBudget) } : {}),
      ...(description ? { description } : {}),
      updatedAt: now,
    } as any).where(eq(schema.rdProjects.id, id));

    const updated = await db.select().from(schema.rdProjects).where(eq(schema.rdProjects.id, id)).all();
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi cập nhật đề tài R&D" });
  }
});

router.post("/api/rd/projects/:id/approve", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { approver, stageNotes } = req.body;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await db.update(schema.rdProjects).set({
      status: "COMPLETED",
      progress: 100,
      updatedAt: now,
    } as any).where(eq(schema.rdProjects.id, id));

    const updated = await db.select().from(schema.rdProjects).where(eq(schema.rdProjects.id, id)).all();
    res.json({
      success: true,
      project: updated[0],
      message: `Hội đồng Khoa học & Công nghệ do ${approver || "Hội đồng R&D"} chủ trì đã nghiệm thu hoàn thành đề tài.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi nghiệm thu đề tài" });
  }
});

// ----------------------------------------------------
// 2. FORMULAS & R&D BOM APIs
// ----------------------------------------------------
router.get("/api/rd/formulas", async (req, res) => {
  try {
    await ensureRdSeedData();
    const formulas = await db.select().from(schema.rdFormulas).orderBy(desc(schema.rdFormulas.id)).all();
    const parsed = formulas.map(f => {
      let comps = f.components;
      if (typeof comps === "string") {
        try { comps = JSON.parse(comps); } catch { comps = []; }
      }
      return { ...f, components: comps };
    });
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi tải công thức R&D" });
  }
});

router.post("/api/rd/formulas", async (req, res) => {
  try {
    const { name, version, author, components, yieldRate, testBatchSize, projectId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Tên công thức R&D là bắt buộc" });
    }

    const count = (await db.select().from(schema.rdFormulas).all()).length;
    const formulaCode = `FORM-${String(count + 1).padStart(2, "0")}`;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const compsJson = Array.isArray(components)
      ? JSON.stringify(components)
      : JSON.stringify([{ name: "Thành phần cơ sở", qty: 100, unit: "%", cost: 1000000 }]);

    const newFormula = {
      formulaCode,
      projectId: projectId ? Number(projectId) : null,
      name: name.trim(),
      version: version || "v1.0",
      status: "REVIEW",
      author: author || "SuperAdmin Lab",
      components: compsJson,
      yieldRate: Number(yieldRate) || 95.0,
      testBatchSize: Number(testBatchSize) || 10.0,
      approvedBy: null,
      approvedAt: null,
      createdAt: now,
    };

    const inserted = await db.insert(schema.rdFormulas).values(newFormula as any).returning();
    res.status(201).json({
      ...inserted[0],
      components: Array.isArray(components) ? components : []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi tạo công thức" });
  }
});

router.post("/api/rd/formulas/:id/approve", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { approver } = req.body;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await db.update(schema.rdFormulas).set({
      status: "APPROVED",
      approvedBy: approver || "TS. Nguyễn An Hòa (Giám đốc R&D)",
      approvedAt: now,
    } as any).where(eq(schema.rdFormulas.id, id));

    const updated = await db.select().from(schema.rdFormulas).where(eq(schema.rdFormulas.id, id)).all();
    res.json({
      success: true,
      formula: updated[0],
      message: "Công thức R&D BOM đã được phê duyệt chính thức và sẵn sàng chuyển giao sang phân hệ Sản xuất M25."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi duyệt công thức" });
  }
});

// ----------------------------------------------------
// 3. PATENTS & IP APIs
// ----------------------------------------------------
router.get("/api/rd/patents", async (req, res) => {
  try {
    await ensureRdSeedData();
    const patents = await db.select().from(schema.rdPatents).orderBy(desc(schema.rdPatents.id)).all();
    res.json(patents);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi tải bằng sáng chế" });
  }
});

router.post("/api/rd/patents", async (req, res) => {
  try {
    const { title, filingNo, filingDate, inventors, jurisdiction, abstract, projectId } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Tên sáng chế là bắt buộc" });
    }

    const count = (await db.select().from(schema.rdPatents).all()).length;
    const patentCode = `PAT-${Math.floor(9000 + count * 11 + Math.random() * 9)}`;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const newPatent = {
      patentCode,
      projectId: projectId ? Number(projectId) : null,
      title: title.trim(),
      filingNo: filingNo || `VN-2026-${String(count + 1).padStart(6, "0")}`,
      filingDate: filingDate || new Date().toISOString().slice(0, 10),
      grantDate: null,
      status: "PENDING",
      inventors: inventors || "Đội ngũ Nghiên cứu NexusSync R&D",
      jurisdiction: jurisdiction || "Cục Sở Hữu Trí Tuệ Việt Nam",
      abstract: abstract || "Sáng chế giải pháp công nghệ mới tối ưu hóa hiệu suất vận hành hệ sinh thái công nghiệp.",
      createdAt: now,
    };

    const inserted = await db.insert(schema.rdPatents).values(newPatent as any).returning();
    res.status(201).json(inserted[0] || newPatent);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi đăng ký sáng chế" });
  }
});

// ----------------------------------------------------
// 4. TRIALS & EXPERIMENTS APIs
// ----------------------------------------------------
router.get("/api/rd/trials", async (req, res) => {
  try {
    await ensureRdSeedData();
    const trials = await db.select().from(schema.rdLabTrials).orderBy(desc(schema.rdLabTrials.id)).all();
    res.json(trials);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi tải dữ liệu thử nghiệm" });
  }
});

router.post("/api/rd/trials", async (req, res) => {
  try {
    const { trialName, testType, sampleSize, performedBy, resultNotes, projectId, formulaId, score, status } = req.body;
    if (!trialName || !trialName.trim()) {
      return res.status(400).json({ error: "Tên bài thử nghiệm là bắt buộc" });
    }

    const count = (await db.select().from(schema.rdLabTrials).all()).length;
    const trialCode = `TRL-2026-${String(count + 1).padStart(3, "0")}`;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const newTrial = {
      trialCode,
      projectId: projectId ? Number(projectId) : null,
      formulaId: formulaId ? Number(formulaId) : null,
      trialName: trialName.trim(),
      testType: testType || "Stress Testing & Reliability",
      sampleSize: Number(sampleSize) || 10,
      status: status || "PASSED",
      score: Number(score) || 95.0,
      performedBy: performedBy || "Kỹ sư Đo Kiểm Lab",
      resultNotes: resultNotes || "Thử nghiệm đạt chỉ tiêu chất lượng và độ ổn định thiết kế.",
      conductedAt: now,
    };

    const inserted = await db.insert(schema.rdLabTrials).values(newTrial as any).returning();
    res.status(201).json(inserted[0] || newTrial);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi ghi nhận thử nghiệm" });
  }
});

// ----------------------------------------------------
// 5. AI GEMINI R&D ADVISOR API
// ----------------------------------------------------
router.post("/api/rd/ai-suggest", async (req, res) => {
  try {
    const { promptType, projectTitle, category, currentComponents } = req.body;
    let aiResponseText = "";

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Bạn là Chuyên gia Khoa học & Kỹ thuật Trưởng (Chief Scientist / R&D Lead) của hệ thống NexusSync ERP.
Nhiệm vụ: ${promptType === "FORMULATION" ? "Đề xuất tối ưu hóa công thức BOM / thành phần hóa lý" : "Phân tích rủi ro & đề xuất các yêu cầu bảo hộ sáng chế"} cho đề tài:
- Tên đề tài: ${projectTitle || "Nghiên cứu công nghệ mới"}
- Lĩnh vực: ${category || "Công nghệ cao"}
- Thành phần hiện tại: ${JSON.stringify(currentComponents || [])}

Hãy đưa ra phản hồi bằng Tiếng Việt súc tích, chuyên nghiệp, cấu trúc rõ ràng gồm:
1. Đánh giá TRL & Độ tin cậy
2. 3 Đề xuất cải tiến đột phá (kèm tỷ lệ % dự kiến)
3. Điểm cảnh báo an toàn / tuân thủ ISO.`;

      const resp = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      aiResponseText = resp.text || "";
    } else {
      aiResponseText = `[Mô phỏng AI Gemini R&D Advisor]\n1. Đánh giá TRL 7 (Hệ thống nguyên mẫu thực địa hoàn chỉnh).\n2. Khuyến nghị thay thế 15% chất ổn định bằng phụ gia nano sinh học để nâng hiệu suất thêm 12.4%.\n3. Đáp ứng tiêu chuẩn kiểm định độ bền nhiệt ISO/IEC 17025.`;
    }

    res.json({
      success: true,
      analysis: aiResponseText,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi tư vấn AI R&D" });
  }
});

export default router;
