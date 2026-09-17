import { Router } from "express";
import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export const industryProfilesRouter = Router();

// 1. GET ALL INDUSTRY PROFILES
industryProfilesRouter.get("/api/industry-profiles", async (req, res) => {
  try {
    let profiles = await db.select().from(schema.industryProfiles).orderBy(desc(schema.industryProfiles.createdAt));
    
    if (profiles.length === 0) {
      const defaultProfiles = [
        {
          code: "MFG",
          name: "Công nghiệp Chế tạo & Sản xuất",
          sector: "Manufacturing",
          description: "Quản lý định mức nguyên vật liệu (BOM), lệnh sản xuất, giá thành công đoạn và kiểm soát chất lượng QA/QC.",
          primaryCurrency: "VND",
          valuationMethod: "FIFO",
          complianceStandards: "ISO 9001, ISO 14001, 5S",
          defaultTaxRate: 10.0,
          isActive: true
        },
        {
          code: "MED",
          name: "Thiết bị Y tế & Dược phẩm",
          sector: "Healthcare",
          description: "Quản lý mã định danh UDI, số Serial/Lot, hạn sử dụng, kiểm định thiết bị và điều kiện bảo quản nhiệt độ.",
          primaryCurrency: "VND",
          valuationMethod: "FIFO",
          complianceStandards: "GMP, FDA, ISO 13485, GDP",
          defaultTaxRate: 5.0,
          isActive: true
        },
        {
          code: "RET",
          name: "Bán lẻ & Thương mại Điện tử",
          sector: "Retail",
          description: "Quản lý hệ thống POS đa điểm, chương trình khuyến mãi, thành viên thân thiết và omnichannel inventory.",
          primaryCurrency: "VND",
          valuationMethod: "WEIGHTED_AVERAGE",
          complianceStandards: "PCI-DSS, e-Invoice Standards",
          defaultTaxRate: 10.0,
          isActive: true
        },
        {
          code: "LOG",
          name: "Kho vận & Logistics Chuyên sâu",
          sector: "Logistics",
          description: "Quản lý kho WMS nhiều tầng, vị trí bin/rack, điều phối đội xe vận tải, cross-docking và quản lý 3PL.",
          primaryCurrency: "VND",
          valuationMethod: "FIFO",
          complianceStandards: "WMS Standard, TAPA, ADR",
          defaultTaxRate: 10.0,
          isActive: true
        },
        {
          code: "TECH",
          name: "Công nghệ & Thiết bị Điện tử",
          sector: "Technology",
          description: "Quản lý IMEI/Serial thiết bị phần cứng, bảo hành điện tử, linh kiện thay thế và quản lý RMA đổi trả.",
          primaryCurrency: "VND",
          valuationMethod: "LIFO",
          complianceStandards: "CE, FCC, RoHS",
          defaultTaxRate: 10.0,
          isActive: true
        }
      ];

      for (const dp of defaultProfiles) {
        await db.insert(schema.industryProfiles).values(dp).onConflictDoNothing();
      }
      profiles = await db.select().from(schema.industryProfiles).orderBy(desc(schema.industryProfiles.createdAt));
    }

    res.json(profiles);
  } catch (err: any) {
    console.error("Error GET /api/industry-profiles:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET SINGLE INDUSTRY PROFILE
industryProfilesRouter.get("/api/industry-profiles/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [profile] = await db.select().from(schema.industryProfiles).where(eq(schema.industryProfiles.id, id));
    if (!profile) {
      return res.status(404).json({ success: false, error: "Không tìm thấy hồ sơ ngành hàng." });
    }
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. CREATE INDUSTRY PROFILE
industryProfilesRouter.post("/api/industry-profiles", async (req, res) => {
  try {
    const { name, code, sector, description, primaryCurrency, valuationMethod, complianceStandards, defaultTaxRate, isActive } = req.body;
    if (!name || !code || !sector) {
      return res.status(400).json({ success: false, error: "Thiếu thông tin bắt buộc: Tên, Mã định danh (Code), hoặc Khối ngành (Sector)." });
    }

    const upperCode = code.toUpperCase().trim();
    const [existing] = await db.select().from(schema.industryProfiles).where(eq(schema.industryProfiles.code, upperCode));
    if (existing) {
      return res.status(400).json({ success: false, error: `Mã định danh / Prefix "${upperCode}" đã tồn tại trong hệ thống. Vui lòng chọn mã khác.` });
    }

    const [inserted] = await db.insert(schema.industryProfiles).values({
      name,
      code: upperCode,
      sector,
      description: description || "",
      primaryCurrency: primaryCurrency || "VND",
      valuationMethod: valuationMethod || "FIFO",
      complianceStandards: complianceStandards || "",
      defaultTaxRate: defaultTaxRate !== undefined ? Number(defaultTaxRate) : 10.0,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    }).returning();

    res.json({ success: true, profile: inserted, message: "Đã tạo hồ sơ ngành hàng thành công." });
  } catch (err: any) {
    console.error("Error POST /api/industry-profiles:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. UPDATE INDUSTRY PROFILE
industryProfilesRouter.put("/api/industry-profiles/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, code, sector, description, primaryCurrency, valuationMethod, complianceStandards, defaultTaxRate, isActive } = req.body;

    if (code) {
      const upperCode = code.toUpperCase().trim();
      const existingList = await db.select().from(schema.industryProfiles).where(eq(schema.industryProfiles.code, upperCode));
      const duplicate = existingList.find(p => p.id !== id);
      if (duplicate) {
        return res.status(400).json({ success: false, error: `Mã định danh / Prefix "${upperCode}" đã tồn tại trong hệ thống.` });
      }
    }

    const [updated] = await db.update(schema.industryProfiles)
      .set({
        name,
        code: code ? code.toUpperCase().trim() : undefined,
        sector,
        description,
        primaryCurrency,
        valuationMethod,
        complianceStandards,
        defaultTaxRate: defaultTaxRate !== undefined ? Number(defaultTaxRate) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        updatedAt: new Date()
      })
      .where(eq(schema.industryProfiles.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ success: false, error: "Không tìm thấy hồ sơ ngành hàng để cập nhật." });
    }

    res.json({ success: true, profile: updated, message: "Đã cập nhật hồ sơ ngành hàng thành công." });
  } catch (err: any) {
    console.error("Error PUT /api/industry-profiles/:id:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. DELETE INDUSTRY PROFILE
industryProfilesRouter.delete("/api/industry-profiles/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(schema.industryProfiles)
      .where(eq(schema.industryProfiles.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Không tìm thấy hồ sơ ngành hàng để xóa." });
    }

    res.json({ success: true, message: "Đã xóa hồ sơ ngành hàng thành công." });
  } catch (err: any) {
    console.error("Error DELETE /api/industry-profiles/:id:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
