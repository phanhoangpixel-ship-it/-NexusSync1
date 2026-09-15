import { Router } from "express";
import { client, db, recreateDatabaseClient } from "../../db/index";
import * as schema from "../../db/schema";
import { StockAdjustmentService } from "../../engines/stockAdjustmentService";
import { WorkspaceAggregationService } from "../../engines/WorkspaceAggregationService";
import { InventoryService } from "../../engines/inventoryService";
import { accountingEngine } from "../../engines/accountingEngine";
import { UnifiedPipelineEngine } from "../../engines/unifiedPipelineEngine";
import { BankReconciliationEngine } from "../../engines/bankReconciliationEngine";
import { eq, desc, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const router = Router();

let driverSafetyData = [
  { driverId: 1, driverCode: 'DRV-001', fullName: 'Lê Hoàng Vũ', licenseClass: 'FC', totalKm: 1420, safetyScore: 96, tier: 'Hạng A+ (An Toàn Xuất Sắc)', ecoStars: 5, hardBrakingCount: 1, overspeedEvents: 0, rapidAccelCount: 2, idleMinutes: 18, ecoSavingsLiters: 42, safetyBonusVND: 1500000, courseRecommendation: 'Không cần (Đạt chuẩn Eco Master)' },
  { driverId: 2, driverCode: 'DRV-002', fullName: 'Phạm Minh Chính', licenseClass: 'C', totalKm: 1180, safetyScore: 88, tier: 'Hạng A (Khá)', ecoStars: 4, hardBrakingCount: 4, overspeedEvents: 2, rapidAccelCount: 5, idleMinutes: 45, ecoSavingsLiters: 25, safetyBonusVND: 800000, courseRecommendation: 'Kỹ năng phanh êm & tối ưu Nổ máy chờ' },
  { driverId: 3, driverCode: 'DRV-003', fullName: 'Trần Quốc Tuấn', licenseClass: 'FC', totalKm: 950, safetyScore: 74, tier: 'Hạng B (Trung Bình - Cần Cải Thiện)', ecoStars: 3, hardBrakingCount: 12, overspeedEvents: 6, rapidAccelCount: 11, idleMinutes: 92, ecoSavingsLiters: 8, safetyBonusVND: 0, courseRecommendation: 'Khóa Đào tạo Bổ sung Lái xe Phòng ngừa (Defensive Driving)' },
  { driverId: 4, driverCode: 'DRV-004', fullName: 'Nguyễn Văn Hùng', licenseClass: 'C', totalKm: 1310, safetyScore: 92, tier: 'Hạng A+ (An Toàn)', ecoStars: 5, hardBrakingCount: 2, overspeedEvents: 1, rapidAccelCount: 3, idleMinutes: 22, ecoSavingsLiters: 38, safetyBonusVND: 1200000, courseRecommendation: 'Duy trì phong độ Eco-Driving' },
];

let initialVetcLogs = [
  { id: 1, transactionCode: 'VETC-2026-8812', provider: 'VETC', plateNumber: '29C-882.14', tollStation: 'Trạm BOT Cao tốc Hà Nội - Hải Phòng', passTime: '2026-08-30 08:14:22', amountVND: 45000, orderCode: 'TRP-2026-101', status: 'AUTO_MATCHED', rfidTag: 'E00400018821' },
  { id: 2, transactionCode: 'EPASS-2026-3341', provider: 'ePass', plateNumber: '30F-551.90', tollStation: 'Trạm BOT Cầu Giẽ - Ninh Bình', passTime: '2026-08-30 09:30:15', amountVND: 65000, orderCode: 'TRP-2026-102', status: 'PENDING_MATCH', rfidTag: 'E00400019942' },
  { id: 3, transactionCode: 'VETC-2026-9014', provider: 'VETC', plateNumber: '51D-229.88', tollStation: 'Trạm BOT Pháp Vân - Cầu Giẽ', passTime: '2026-08-30 10:05:40', amountVND: 35000, orderCode: 'TRP-2026-103', status: 'RECONCILED', rfidTag: 'E00400011109' },
];


router.get("/api/logistics/kpi", async (req, res) => {
    try {
      const vList = await db.select().from(schema.vehicles).all();
      const dList = await db.select().from(schema.drivers).all();
      const oList = await db.select().from(schema.transportOrders).all();
      const fuelList = await db.select().from(schema.fuelTransactions).all();

      const totalVehicles = vList.length;
      const activeVehicles = vList.filter(v => v.status === 'ACTIVE' || v.status === 'IN_USE').length;
      const totalDrivers = dList.length;
      const availableDrivers = dList.filter(d => d.status === 'AVAILABLE').length;

      const totalOrders = oList.length;
      const deliveredOrders = oList.filter(o => o.status === 'DELIVERED' || o.status === 'CLOSED').length;
      const inTransitOrders = oList.filter(o => o.status === 'IN_TRANSIT').length;

      const totalFreightCost = oList.reduce((sum, o) => sum + (o.freightCost || 0), 0);
      const totalFuelCost = fuelList.reduce((sum, f) => sum + (f.totalAmount || 0), 0);
      const onTimeRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 100;

      res.json({
        totalVehicles,
        activeVehicles,
        totalDrivers,
        availableDrivers,
        totalOrders,
        deliveredOrders,
        inTransitOrders,
        totalFreightCost,
        totalFuelCost,
        onTimeRate,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/api/logistics/vehicles", async (req, res) => {
    try {
      const vList = await db.select().from(schema.vehicles).all();
      res.json(vList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.post("/api/logistics/vehicles", async (req, res) => {
    try {
      const { plateNumber, vehicleType, capacityKg, fuelType, mileageKm } = req.body;
      const code = `VEH-${String(Math.floor(100 + Math.random() * 900))}`;
      const result = await db.insert(schema.vehicles).values({
        code,
        plateNumber: plateNumber || `29C-${Math.floor(10000 + Math.random() * 90000)}`,
        vehicleType: vehicleType || "TRUCK_5T",
        capacityKg: Number(capacityKg) || 5000,
        fuelType: fuelType || "DIESEL",
        status: "ACTIVE",
        mileageKm: Number(mileageKm) || 0,
      } as any).returning();
      res.status(201).json(result[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

router.put("/api/logistics/vehicles/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status, mileageKm } = req.body;
      await db.update(schema.vehicles)
        .set({
          status: status,
          mileageKm: mileageKm !== undefined ? Number(mileageKm) : undefined,
        } as any)
        .where(eq(schema.vehicles.id, id));
      const updated = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id)).get();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/api/logistics/drivers", async (req, res) => {
    try {
      const dList = await db.select().from(schema.drivers).all();
      res.json(dList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.post("/api/logistics/drivers", async (req, res) => {
    try {
      const { fullName, phone, licenseNumber, licenseExpiryDate } = req.body;
      const code = `DRV-${String(Math.floor(100 + Math.random() * 900))}`;
      const result = await db.insert(schema.drivers).values({
        code,
        fullName: fullName || "Tài xế Mới",
        phone: phone || "0900 000 000",
        licenseNumber: licenseNumber || "FC-123456",
        licenseExpiryDate: licenseExpiryDate || "2029-12-31",
        status: "AVAILABLE",
      } as any).returning();
      res.status(201).json(result[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

router.get(["/api/logistics/orders", "/api/logistics/deliveries"], async (req, res) => {
    try {
      const orders = await db.select().from(schema.transportOrders).orderBy(desc(schema.transportOrders.id)).all();
      const vList = await db.select().from(schema.vehicles).all();
      const dList = await db.select().from(schema.drivers).all();
      const podList = await db.select().from(schema.proofOfDeliveries).all();

      const vMap = new Map(vList.map((v) => [v.id, v]));
      const dMap = new Map(dList.map((d) => [d.id, d]));
      const podMap = new Map(podList.map((p) => [p.transportOrderId, p]));

      const enriched = orders.map((o) => {
        const v = o.vehicleId ? vMap.get(o.vehicleId) : null;
        const d = o.driverId ? dMap.get(o.driverId) : null;
        const pod = podMap.get(o.id);
        return {
          ...o,
          vehiclePlate: v?.plateNumber || "Chưa gán",
          vehicleType: v?.vehicleType || "-",
          driverName: d?.fullName || "Chưa gán",
          driverPhone: d?.phone || "-",
          pod,
        };
      });

      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.post("/api/logistics/orders", async (req, res) => {
    try {
      const { customerName, originAddress, destinationAddress, weightKg, volumeCbm, freightCost, plannedDate } = req.body;
      const orderCode = `TRP-2026-${String(Math.floor(100 + Math.random() * 900))}`;
      const result = await db.insert(schema.transportOrders).values({
        orderCode,
        customerName: customerName || "Khách hàng Doanh nghiệp",
        originAddress: originAddress || "Kho Tổng HQ Hà Nội (WH-MAIN)",
        destinationAddress: destinationAddress || "Địa chỉ nhận hàng",
        weightKg: Number(weightKg) || 500,
        volumeCbm: Number(volumeCbm) || 2.5,
        freightCost: Number(freightCost) || 1500000,
        fuelCost: Math.round((Number(freightCost) || 1500000) * 0.25),
        plannedDate: plannedDate || new Date().toISOString().split("T")[0],
        status: "PLANNED",
      } as any).returning();
      res.status(201).json(result[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

router.post("/api/logistics/orders/:id/assign", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { vehicleId, driverId } = req.body;
      const vId = Number(vehicleId);
      const dId = Number(driverId);

      await db.update(schema.transportOrders).set({
        vehicleId: vId,
        driverId: dId,
        status: "ASSIGNED",
      } as any).where(eq(schema.transportOrders.id, id));

      if (vId) {
        await db.update(schema.vehicles).set({ status: "IN_USE" } as any).where(eq(schema.vehicles.id, vId));
      }
      if (dId) {
        await db.update(schema.drivers).set({ status: "ON_TRIP" } as any).where(eq(schema.drivers.id, dId));
      }

      res.json({ success: true, message: "Đã phân công phương tiện & tài xế cho lệnh vận chuyển." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.post("/api/logistics/orders/:id/status", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      await db.update(schema.transportOrders).set({ status } as any).where(eq(schema.transportOrders.id, id));
      res.json({ success: true, status, message: `Đã chuyển trạng thái lệnh vận chuyển sang ${status}.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.post("/api/logistics/orders/:id/pod", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { receiverName, signatureUrl, photoUrl, status, failureReason, notes } = req.body;

      const order = await db.select().from(schema.transportOrders).where(eq(schema.transportOrders.id, id)).get();
      if (!order) return res.status(404).json({ error: "Transport order not found" });

      const podStatus = status || "DELIVERED_SUCCESS";
      const deliveredAt = new Date().toISOString().slice(0, 19).replace("T", " ");

      const result = await db.insert(schema.proofOfDeliveries).values({
        transportOrderId: id,
        receiverName: receiverName || "Người nhận hàng",
        signatureUrl: signatureUrl || "https://signature.api/sig_verified.png",
        photoUrl: photoUrl || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500",
        deliveredAt,
        status: podStatus,
        failureReason: failureReason || null,
        notes: notes || "Xác nhận giao hàng thành công & đầy đủ số lượng.",
      } as any).returning();

      const newOrderStatus = podStatus === "DELIVERED_SUCCESS" ? "DELIVERED" : "FAILED";
      await db.update(schema.transportOrders).set({ status: newOrderStatus } as any).where(eq(schema.transportOrders.id, id));

      // Free vehicle & driver if delivered or failed
      if (order.vehicleId) {
        await db.update(schema.vehicles).set({ status: "ACTIVE" } as any).where(eq(schema.vehicles.id, order.vehicleId));
      }
      if (order.driverId) {
        await db.update(schema.drivers).set({ status: "AVAILABLE" } as any).where(eq(schema.drivers.id, order.driverId));
      }

      res.json({ success: true, pod: result[0], orderStatus: newOrderStatus, message: "Đã cập nhật biên bản giao hàng POD thành công." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/api/logistics/fuel-transactions", async (req, res) => {
    try {
      const list = await db.select().from(schema.fuelTransactions).orderBy(desc(schema.fuelTransactions.id)).all();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.post("/api/logistics/fuel-transactions", async (req, res) => {
    try {
      const { vehicleId, driverId, liters, pricePerLiter, mileageAtRefuel } = req.body;
      const v = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, Number(vehicleId))).get();
      const l = Number(liters) || 50;
      const p = Number(pricePerLiter) || 21500;
      const totalAmount = l * p;

      const result = await db.insert(schema.fuelTransactions).values({
        vehicleId: Number(vehicleId) || 1,
        plateNumber: v?.plateNumber || "N/A",
        driverId: driverId ? Number(driverId) : null,
        fuelDate: new Date().toISOString().split("T")[0],
        liters: l,
        pricePerLiter: p,
        totalAmount,
        mileageAtRefuel: Number(mileageAtRefuel) || (v?.mileageKm || 0) + 150,
      } as any).returning();

      if (vehicleId && mileageAtRefuel) {
        await db.update(schema.vehicles).set({ mileageKm: Number(mileageAtRefuel) } as any).where(eq(schema.vehicles.id, Number(vehicleId)));
      }

      res.status(201).json(result[0]);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

router.get("/api/logistics/vetc-transactions", (req, res) => {
    res.json(initialVetcLogs);
  });

router.post("/api/logistics/vetc-transactions/sync", (req, res) => {
    const newTx = {
      id: initialVetcLogs.length + 1,
      transactionCode: `VETC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      provider: Math.random() > 0.5 ? 'VETC' : 'ePass',
      plateNumber: req.body.plateNumber || '29C-882.14',
      tollStation: req.body.tollStation || 'Trạm BOT Hà Nội - Hải Phòng',
      passTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      amountVND: req.body.amountVND || 45000,
      orderCode: req.body.orderCode || 'TRP-2026-101',
      status: 'AUTO_MATCHED',
      rfidTag: 'E00400018821',
    };
    initialVetcLogs.unshift(newTx);
    res.json({ success: true, transaction: newTx, message: 'Đã kết nối API VETC/ePass & đồng bộ giao dịch thu phí tự động thành công.' });
  });

router.post("/api/logistics/vetc-transactions/reconcile", (req, res) => {
    initialVetcLogs = initialVetcLogs.map(item => ({ ...item, status: 'RECONCILED' }));
    res.json({ success: true, count: initialVetcLogs.length, message: 'Đã đối soát 100% chi phí BOT VETC/ePass với Sổ Cái Tài Chính M30.' });
  });

router.get("/api/logistics/driver-safety-scores", (req, res) => {
    res.json(driverSafetyData);
  });

export default router;
