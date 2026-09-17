import { Router } from "express";
import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { SerialEngine } from "../../engines/serialEngine";

export const serialsRouter = Router();

// 1. GET ALL SERIALS / IMEI
serialsRouter.get("/api/serials", async (req, res) => {
  try {
    let allSerials = await db.select({
      id: schema.serialNumbers.id,
      serialNumber: schema.serialNumbers.serialNumber,
      productId: schema.serialNumbers.productId,
      sku: schema.products.sku,
      productName: schema.products.name,
      warehouseId: schema.serialNumbers.warehouseId,
      warehouseName: schema.warehouses.name,
      status: schema.serialNumbers.status,
      customerName: schema.serialNumbers.customerName,
      customerPhone: schema.serialNumbers.customerPhone,
      warrantyStartDate: schema.serialNumbers.warrantyStartDate,
      warrantyEndDate: schema.serialNumbers.warrantyEndDate,
      warrantyMonths: schema.serialNumbers.warrantyMonths,
      notes: schema.serialNumbers.notes,
      createdAt: schema.serialNumbers.createdAt
    })
    .from(schema.serialNumbers)
    .leftJoin(schema.products, eq(schema.serialNumbers.productId, schema.products.id))
    .leftJoin(schema.warehouses, eq(schema.serialNumbers.warehouseId, schema.warehouses.id))
    .orderBy(desc(schema.serialNumbers.createdAt));

    if (allSerials.length === 0) {
      const defaultSerials = [
        { serialNumber: 'IMEI-864201092837401', sku: 'SKU-PHN-012', status: 'IN_STOCK', warehouseId: 1, warrantyMonths: 12, notes: 'Nhập kho từ đơn PO-2026-0089' },
        { serialNumber: 'IMEI-864201092837402', sku: 'SKU-PHN-012', status: 'SOLD', warehouseId: 2, customerName: 'Công ty Cổ phần Công nghệ Viettel', warrantyMonths: 12, notes: 'Bán qua đơn hàng SO-2026-0120' },
        { serialNumber: 'MED-DEV-2026-9901', sku: 'SKU-MED-004', status: 'IN_STOCK', warehouseId: 1, warrantyMonths: 24, notes: 'Kiểm định chất lượng IQC đạt chuẩn' },
        { serialNumber: 'MED-DEV-2026-9902', sku: 'SKU-MED-004', status: 'WARRANTY', warehouseId: 1, customerName: 'Bệnh viện Đa khoa Quốc tế Vinmec', warrantyMonths: 24, notes: 'Đang bảo trì thay thế màn hình' },
        { serialNumber: 'MCH-SER-88210', sku: 'SKU-MCH-501', status: 'DEFECTIVE', warehouseId: 3, warrantyMonths: 12, notes: 'Lỗi bộ phóng điện hồ quang' }
      ];

      for (const ds of defaultSerials) {
        let pId = 1;
        const [p] = await db.select().from(schema.products).where(eq(schema.products.sku, ds.sku));
        if (p) pId = p.id;

        const [ins] = await db.insert(schema.serialNumbers).values({
          serialNumber: ds.serialNumber,
          productId: pId,
          warehouseId: ds.warehouseId,
          status: ds.status,
          customerName: ds.customerName || null,
          warrantyMonths: ds.warrantyMonths,
          notes: ds.notes,
          createdBy: 1
        }).returning();

        if (ins) {
          await db.insert(schema.serialHistory).values({
            serialId: ins.id,
            action: 'CREATED',
            toWarehouseId: ds.warehouseId,
            toStatus: ds.status,
            notes: ds.notes,
            performedBy: 1
          });
        }
      }

      allSerials = await db.select({
        id: schema.serialNumbers.id,
        serialNumber: schema.serialNumbers.serialNumber,
        productId: schema.serialNumbers.productId,
        sku: schema.products.sku,
        productName: schema.products.name,
        warehouseId: schema.serialNumbers.warehouseId,
        warehouseName: schema.warehouses.name,
        status: schema.serialNumbers.status,
        customerName: schema.serialNumbers.customerName,
        customerPhone: schema.serialNumbers.customerPhone,
        warrantyStartDate: schema.serialNumbers.warrantyStartDate,
        warrantyEndDate: schema.serialNumbers.warrantyEndDate,
        warrantyMonths: schema.serialNumbers.warrantyMonths,
        notes: schema.serialNumbers.notes,
        createdAt: schema.serialNumbers.createdAt
      })
      .from(schema.serialNumbers)
      .leftJoin(schema.products, eq(schema.serialNumbers.productId, schema.products.id))
      .leftJoin(schema.warehouses, eq(schema.serialNumbers.warehouseId, schema.warehouses.id))
      .orderBy(desc(schema.serialNumbers.createdAt));
    }

    // For each serial, fetch history/timeline
    const enriched = await Promise.all(allSerials.map(async (s) => {
      const historyItems = await db.select({
        id: schema.serialHistory.id,
        timestamp: schema.serialHistory.createdAt,
        type: schema.serialHistory.action,
        title: schema.serialHistory.action,
        description: schema.serialHistory.notes,
        referenceDoc: schema.serialHistory.referenceNo
      })
      .from(schema.serialHistory)
      .where(eq(schema.serialHistory.serialId, s.id))
      .orderBy(desc(schema.serialHistory.createdAt));

      return {
        id: `SN-${s.id}`,
        serialNumber: s.serialNumber,
        sku: s.sku || 'SKU-GENERIC',
        productName: s.productName || 'Sản phẩm định danh',
        category: 'Thiết bị & Viễn thông',
        warehouse: s.warehouseName || 'Kho Tổng Hà Nội',
        status: s.status,
        customerName: s.customerName || undefined,
        warrantyStart: s.warrantyStartDate ? new Date(s.warrantyStartDate).toISOString().slice(0, 10) : undefined,
        warrantyEnd: s.warrantyEndDate ? new Date(s.warrantyEndDate).toISOString().slice(0, 10) : undefined,
        manufactureDate: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : '2026-01-01',
        warrantyMonths: s.warrantyMonths || 12,
        notes: s.notes || '',
        timeline: historyItems.map((h, idx) => ({
          id: `TL-${h.id || idx}`,
          timestamp: h.timestamp ? new Date(h.timestamp).toISOString().replace('T', ' ').slice(0, 19) : '2026-01-01 00:00:00',
          type: h.type,
          title: h.title || 'Sự kiện vòng đời',
          description: h.description || '',
          actor: 'Hệ thống ERP'
        }))
      };
    }));

    res.json(enriched);
  } catch (err: any) {
    console.error("Error fetching serials:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. CREATE / REGISTER NEW SERIAL
serialsRouter.post("/api/serials", async (req, res) => {
  try {
    const { serialNumber, sku, productId, warehouseId = 1, notes, warrantyMonths = 12 } = req.body;
    const user = (req as any).user || { id: 1 };

    if (!serialNumber) {
      return res.status(400).json({ success: false, error: "Thiếu số Serial / IMEI bắt buộc." });
    }

    let prodId = productId;
    if (!prodId && sku) {
      const [p] = await db.select().from(schema.products).where(eq(schema.products.sku, sku));
      if (p) prodId = p.id;
    }
    if (!prodId) {
      const [firstP] = await db.select().from(schema.products).limit(1);
      prodId = firstP ? firstP.id : 1;
    }

    // Check duplicate
    const [existing] = await db.select().from(schema.serialNumbers).where(eq(schema.serialNumbers.serialNumber, serialNumber));
    if (existing) {
      return res.status(400).json({ success: false, error: `Serial / IMEI ${serialNumber} đã tồn tại trong hệ thống.` });
    }

    const [inserted] = await db.insert(schema.serialNumbers).values({
      serialNumber,
      productId: prodId,
      warehouseId,
      status: 'IN_STOCK',
      warrantyMonths: Number(warrantyMonths) || 12,
      notes: notes || 'Đăng ký nhập kho mới',
      createdBy: user.id || 1
    }).returning();

    // Record history
    await db.insert(schema.serialHistory).values({
      serialId: inserted.id,
      action: 'CREATED',
      toWarehouseId: warehouseId,
      toStatus: 'IN_STOCK',
      notes: notes || 'Khởi tạo số Serial mới trong hệ thống',
      performedBy: user.id || 1
    });

    res.json({ success: true, data: inserted, message: `Đã đăng ký serial ${serialNumber} thành công.` });
  } catch (err: any) {
    console.error("Error creating serial:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET SERIAL 360 FULL LIFECYCLE TRACE & TIMELINE
serialsRouter.get("/api/serials/:id/history", async (req, res) => {
  try {
    const serialIdParam = req.params.id;
    const numericId = parseInt(serialIdParam.replace('SN-', ''), 10);

    const [serial] = await db.select()
      .from(schema.serialNumbers)
      .where(eq(schema.serialNumbers.id, isNaN(numericId) ? 0 : numericId));

    if (!serial) {
      return res.status(404).json({ success: false, error: "Không tìm thấy số Serial / IMEI yêu cầu." });
    }

    const historyEvents = await db.select()
      .from(schema.serialHistory)
      .where(eq(schema.serialHistory.serialId, serial.id))
      .orderBy(desc(schema.serialHistory.createdAt));

    const transactions = await db.select()
      .from(schema.serialTransactions)
      .where(eq(schema.serialTransactions.serialId, serial.id));

    res.json({
      success: true,
      serial,
      timeline: historyEvents,
      transactions
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PERFORM ACTION ON SERIAL (SELL, WARRANTY, TRANSFER, DEFECTIVE)
serialsRouter.post("/api/serials/:id/actions", async (req, res) => {
  try {
    const serialIdParam = req.params.id;
    const numericId = parseInt(serialIdParam.replace('SN-', ''), 10);
    const { actionType, customerName, orderNumber, warehouseId, notes } = req.body;
    const user = (req as any).user || { id: 1 };

    const [serial] = await db.select()
      .from(schema.serialNumbers)
      .where(eq(schema.serialNumbers.id, isNaN(numericId) ? 0 : numericId));

    if (!serial) {
      return res.status(404).json({ success: false, error: "Không tìm thấy số Serial." });
    }

    let nextStatus = serial.status;
    let actionName = actionType;

    if (actionType === 'SELL') {
      nextStatus = 'SOLD';
      actionName = 'SOLD';
    } else if (actionType === 'WARRANTY') {
      nextStatus = 'WARRANTY';
      actionName = 'WARRANTY_CLAIM';
    } else if (actionType === 'RESOLVE_WARRANTY') {
      nextStatus = 'IN_STOCK';
      actionName = 'WARRANTY_REPAIRED';
    } else if (actionType === 'DEFECTIVE') {
      nextStatus = 'DEFECTIVE';
      actionName = 'DEFECT_MARKED';
    } else if (actionType === 'TRANSFER') {
      actionName = 'TRANSFER';
    }

    const updateData: any = {
      status: nextStatus,
      updatedAt: new Date()
    };
    if (customerName) updateData.customerName = customerName;
    if (actionType === 'SELL') {
      updateData.warrantyStartDate = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + (serial.warrantyMonths || 12));
      updateData.warrantyEndDate = end;
    }
    if (warehouseId) updateData.warehouseId = warehouseId;

    await db.update(schema.serialNumbers)
      .set(updateData)
      .where(eq(schema.serialNumbers.id, serial.id));

    // Record history
    await db.insert(schema.serialHistory).values({
      serialId: serial.id,
      action: actionName,
      fromStatus: serial.status,
      toStatus: nextStatus,
      referenceNo: orderNumber || notes,
      notes: notes || `Thực hiện thao tác ${actionType}`,
      performedBy: user.id || 1
    });

    res.json({ success: true, message: `Đã cập nhật trạng thái serial ${serial.serialNumber} thành công.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET SERIAL PROFILES
serialsRouter.get("/api/serial-profiles", async (req, res) => {
  try {
    const profiles = await db.select().from(schema.serialProfiles);
    if (profiles.length === 0) {
      // Seed default
      const defaultProfiles = [
        { code: 'MEDICAL', name: 'Thiết bị Y tế & Đo lường', categoryType: 'MEDICAL', warrantyMonths: 24, prefix: 'MED-', description: 'Quản lý mã UDI, hiệu chuẩn định kỳ.', isSystem: true },
        { code: 'ELECTRONICS', name: 'Thiết bị Điện tử & IMEI', categoryType: 'ELECTRONICS', warrantyMonths: 12, prefix: 'IMEI-', description: 'Quản lý mã IMEI di động.', isSystem: true },
        { code: 'MACHINERY', name: 'Máy móc Công nghiệp', categoryType: 'MACHINERY', warrantyMonths: 18, prefix: 'MCH-', description: 'Quản lý số máy và giờ vận hành.', isSystem: true }
      ];
      for (const dp of defaultProfiles) {
        await db.insert(schema.serialProfiles).values(dp).onConflictDoNothing();
      }
      const seeded = await db.select().from(schema.serialProfiles);
      return res.json(seeded);
    }
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. CREATE SERIAL PROFILE
serialsRouter.post("/api/serial-profiles", async (req, res) => {
  try {
    const { name, code, categoryType, description, prefix, warrantyMonths } = req.body;
    if (!name || !code || !prefix) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc (name, code, prefix).' });
    }

    const [inserted] = await db.insert(schema.serialProfiles).values({
      name,
      code: code.toUpperCase(),
      categoryType: categoryType || 'CUSTOM',
      description: description || '',
      prefix: prefix.toUpperCase(),
      warrantyMonths: warrantyMonths ? Number(warrantyMonths) : 12,
      isSystem: false
    }).returning();

    res.json({ success: true, profile: inserted, message: 'Đã tạo hồ sơ ngành hàng thành công.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
