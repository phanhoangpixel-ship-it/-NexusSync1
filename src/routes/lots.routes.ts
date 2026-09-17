import { Router } from "express";
import { db, client } from "../../db/index";
import * as schema from "../../db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { ENTERPRISE_MASTER_PRODUCTS } from "../data/enterpriseMaster";
import { AuditService } from "../../engines/auditService";

export const lotsRouter = Router();

// In-memory fallback and enhanced store for lots
let memoryLotsStore = [
  {
    id: 'LOT-2026-001',
    batchNumber: 'LOT-YMH-2026-08A',
    sku: 'SKU-ENG-088',
    productName: 'Động cơ servo AC 750W',
    category: 'Động cơ & Biến tần',
    warehouse: 'WH-01 (Kho Tổng Hà Nội)',
    warehouseId: 1,
    locationBin: 'BIN-A01-R02',
    mfgDate: '2026-01-15',
    expDate: '2029-01-15',
    initialQty: 500,
    currentQty: 420,
    uom: 'Cái',
    status: 'ACTIVE',
    supplierLot: 'SUP-LOT-88901',
    supplierName: 'Yamaha Robotics Automation',
    storageCondition: 'Nhiệt độ phòng (18-25°C), Độ ẩm < 60%',
    qcStatus: 'PASSED',
    qcInspector: 'KCS Nguyễn Văn Hùng',
    qcDate: '2026-01-16'
  },
  {
    id: 'LOT-2026-002',
    batchNumber: 'LOT-PLC-2026-03B',
    sku: 'SKU-PLC-102',
    productName: 'Bộ lập trình PLC Siemens S1200',
    category: 'Tự động hóa',
    warehouse: 'WH-02 (Kho Chi nhánh Nam)',
    warehouseId: 2,
    locationBin: 'BIN-B04-R01',
    mfgDate: '2026-03-10',
    expDate: '2028-03-10',
    initialQty: 250,
    currentQty: 185,
    uom: 'Bộ',
    status: 'ACTIVE',
    supplierLot: 'SIEMENS-BATCH-442',
    supplierName: 'Siemens Industrial Vietnam',
    storageCondition: 'Nhiệt độ phòng khô ráo, Chống tĩnh điện ESD',
    qcStatus: 'PASSED',
    qcInspector: 'KCS Trần Tuấn Anh',
    qcDate: '2026-03-12'
  },
  {
    id: 'LOT-2026-003',
    batchNumber: 'LOT-SEN-2025-11X',
    sku: 'SKU-SEN-305',
    productName: 'Cảm biến quang điện Panasonic',
    category: 'Thiết bị điện',
    warehouse: 'WH-01 (Kho Tổng Hà Nội)',
    warehouseId: 1,
    locationBin: 'BIN-A03-R05',
    mfgDate: '2025-11-01',
    expDate: '2026-09-25',
    initialQty: 1000,
    currentQty: 95,
    uom: 'Cái',
    status: 'EXPIRED_SOON',
    supplierLot: 'PANAS-LOT-991',
    supplierName: 'Panasonic Electric Co.',
    storageCondition: 'Nhiệt độ 20-30°C, Tránh ánh sáng mặt trời',
    qcStatus: 'PASSED',
    qcInspector: 'KCS Lê Thị Mai',
    qcDate: '2025-11-03'
  },
  {
    id: 'LOT-2026-004',
    batchNumber: 'LOT-INV-2025-05C',
    sku: 'SKU-INV-204',
    productName: 'Biến tần Inverter 3 pha 380V',
    category: 'Động cơ & Biến tần',
    warehouse: 'WH-03 (Kho Linh kiện CNC)',
    warehouseId: 3,
    locationBin: 'BIN-C02-R01',
    mfgDate: '2025-05-20',
    expDate: '2026-08-10',
    initialQty: 100,
    currentQty: 12,
    uom: 'Cái',
    status: 'EXPIRED',
    supplierLot: 'INV-OLD-772',
    supplierName: 'Inovance Industrial Co.',
    storageCondition: 'Nơi thông thoáng, Tránh ẩm ướt',
    qcStatus: 'EXPIRED_HOLD',
    qcInspector: 'KCS Đặng Văn Bình',
    qcDate: '2025-05-22'
  },
  {
    id: 'LOT-2026-005',
    batchNumber: 'LOT-ALUM-2026-04M',
    sku: 'ALUM-BRACKET-2',
    productName: 'Khung Nhôm Định Hình Anodize 40x40',
    category: 'Cơ khí chính xác',
    warehouse: 'WH-01 (Kho Tổng Hà Nội)',
    warehouseId: 1,
    locationBin: 'BIN-D01-R01',
    mfgDate: '2026-04-01',
    expDate: '2030-04-01',
    initialQty: 800,
    currentQty: 620,
    uom: 'Mét',
    status: 'ACTIVE',
    supplierLot: 'ALUM-VN-449',
    supplierName: 'Nhôm Đông Á Corporation',
    storageCondition: 'Kê giá đỡ phẳng, Tránh va đập bề mặt',
    qcStatus: 'PASSED',
    qcInspector: 'KCS Hoàng Văn Nam',
    qcDate: '2026-04-02'
  },
  {
    id: 'LOT-2026-006',
    batchNumber: 'LOT-STL-2026-02Q',
    sku: 'SKU-STEEL-18',
    productName: 'Thép tròn đặc kéo nguội S45C phi 18',
    category: 'Vật liệu kim loại',
    warehouse: 'WH-01 (Kho Tổng Hà Nội)',
    warehouseId: 1,
    locationBin: 'BIN-D03-R02',
    mfgDate: '2026-02-15',
    expDate: '2031-02-15',
    initialQty: 1200,
    currentQty: 780,
    uom: 'Cây',
    status: 'ACTIVE',
    supplierLot: 'STEEL-HP-8831',
    supplierName: 'Tập đoàn Hòa Phát',
    storageCondition: 'Xịt dầu bảo quản chống rỉ sét',
    qcStatus: 'PASSED',
    qcInspector: 'KCS Phạm Quốc Toàn',
    qcDate: '2026-02-18'
  }
];

// Calculate dynamic status based on expiry date
function calculateLotStatus(expDateStr: string, currentStatus: string, currentQty: number): string {
  if (currentQty <= 0) return 'DEPLETED';
  if (currentStatus === 'QUARANTINE' || currentStatus === 'HOLD') return currentStatus;
  
  const now = new Date();
  const exp = new Date(expDateStr);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 45) return 'EXPIRED_SOON';
  return 'ACTIVE';
}

// 1. GET ALL LOTS
lotsRouter.get("/api/inventory/lots", async (req, res) => {
  try {
    // Enrich with days to expiry and computed status
    const enriched = memoryLotsStore.map(lot => {
      const exp = new Date(lot.expDate);
      const now = new Date();
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const status = calculateLotStatus(lot.expDate, lot.status, lot.currentQty);
      
      return {
        ...lot,
        daysToExpiry: diffDays,
        status: status as any
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
      metrics: {
        totalLots: enriched.length,
        activeLots: enriched.filter(l => l.status === 'ACTIVE').length,
        expiredSoonLots: enriched.filter(l => l.status === 'EXPIRED_SOON').length,
        expiredLots: enriched.filter(l => l.status === 'EXPIRED').length,
        quarantineLots: enriched.filter(l => l.status === 'QUARANTINE').length,
        totalStock: enriched.reduce((acc, l) => acc + l.currentQty, 0)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET SINGLE LOT BY ID OR BATCH NUMBER
lotsRouter.get("/api/inventory/lots/:id", async (req, res) => {
  try {
    const rawId = req.params.id;
    const lot = memoryLotsStore.find(l => 
      l.id === rawId || 
      l.batchNumber.toLowerCase() === rawId.toLowerCase() ||
      l.id.toLowerCase() === rawId.toLowerCase()
    );
    if (!lot) {
      return res.status(404).json({ success: false, error: "Không tìm thấy lô hàng" });
    }
    const exp = new Date(lot.expDate);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      data: {
        ...lot,
        daysToExpiry: diffDays,
        status: calculateLotStatus(lot.expDate, lot.status, lot.currentQty)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. CREATE NEW LOT
lotsRouter.post("/api/inventory/lots", async (req, res) => {
  try {
    const {
      batchNumber,
      sku,
      productName,
      category,
      warehouse,
      warehouseId,
      locationBin,
      mfgDate,
      expDate,
      initialQty,
      uom,
      supplierLot,
      supplierName,
      storageCondition,
      notes
    } = req.body;

    if (!batchNumber || !sku || !productName) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc: Mã Lô, SKU hoặc Tên sản phẩm" });
    }

    const qty = Number(initialQty) || 0;
    const newLotId = `LOT-${new Date().getFullYear()}-${String(memoryLotsStore.length + 1).padStart(3, '0')}`;
    
    const newLot = {
      id: newLotId,
      batchNumber: String(batchNumber).trim().toUpperCase(),
      sku: String(sku).trim().toUpperCase(),
      productName: String(productName).trim(),
      category: category || 'Vật tư tiêu chuẩn',
      warehouse: warehouse || 'WH-01 (Kho Tổng Hà Nội)',
      warehouseId: Number(warehouseId) || 1,
      locationBin: locationBin || 'BIN-A01-DEFAULT',
      mfgDate: mfgDate || new Date().toISOString().slice(0, 10),
      expDate: expDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      initialQty: qty,
      currentQty: qty,
      uom: uom || 'Cái',
      status: 'ACTIVE',
      supplierLot: supplierLot || `SUP-${Date.now().toString().slice(-6)}`,
      supplierName: supplierName || 'Nhà Cung Cấp Chuẩn',
      storageCondition: storageCondition || 'Tiêu chuẩn nhiệt độ kho (20-25°C)',
      qcStatus: 'PASSED',
      qcInspector: 'KCS Quản Lý Kho',
      qcDate: new Date().toISOString().slice(0, 10),
      notes: notes || ''
    };

    memoryLotsStore.unshift(newLot);

    // Central Audit Gateway (M21 Lot Traceability)
    AuditService.captureAsync({
      userId: 1,
      username: 'admin',
      userName: 'Admin Hệ Thống',
      role: 'SUPER_ADMIN',
      module: 'M21',
      action: 'CREATE',
      entityType: 'LOT',
      entityId: newLot.id,
      result: 'SUCCESS',
      afterData: newLot
    });

    res.status(201).json({
      success: true,
      message: `Đã khởi tạo thành công lô hàng ${newLot.batchNumber}`,
      data: newLot
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE LOT STATUS (ACTIVE, QUARANTINE, RELEASED, EXPIRED)
lotsRouter.patch("/api/inventory/lots/:id/status", async (req, res) => {
  try {
    const { status, reason, inspectorName } = req.body;
    const lotIndex = memoryLotsStore.findIndex(l => l.id === req.params.id || l.batchNumber === req.params.id);

    if (lotIndex === -1) {
      return res.status(404).json({ error: "Không tìm thấy lô hàng" });
    }

    const previousStatus = memoryLotsStore[lotIndex].status;
    memoryLotsStore[lotIndex].status = status;
    if (inspectorName) {
      memoryLotsStore[lotIndex].qcInspector = inspectorName;
      memoryLotsStore[lotIndex].qcDate = new Date().toISOString().slice(0, 10);
    }

    // Central Audit Gateway (M21 Lot Traceability)
    AuditService.captureAsync({
      userId: 1,
      username: 'admin',
      userName: 'Admin Hệ Thống',
      role: 'SUPER_ADMIN',
      module: 'M21',
      action: 'UPDATE',
      entityType: 'LOT',
      entityId: memoryLotsStore[lotIndex].id,
      result: 'SUCCESS',
      beforeData: { status: previousStatus },
      afterData: { status, reason, inspectorName }
    });

    res.json({
      success: true,
      message: `Đã cập nhật trạng thái lô ${memoryLotsStore[lotIndex].batchNumber} sang ${status}`,
      data: memoryLotsStore[lotIndex]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4b. DELETE LOT (SOFT DELETE / ARCHIVE)
lotsRouter.delete("/api/inventory/lots/:id", async (req, res) => {
  try {
    const rawId = req.params.id;
    const lotIndex = memoryLotsStore.findIndex(l => 
      l.id === rawId || 
      l.batchNumber.toLowerCase() === rawId.toLowerCase()
    );

    if (lotIndex === -1) {
      return res.status(404).json({ success: false, error: "Không tìm thấy lô hàng để xóa" });
    }

    const deletedLot = memoryLotsStore[lotIndex];
    memoryLotsStore.splice(lotIndex, 1);

    AuditService.captureAsync({
      userId: 1,
      username: 'admin',
      userName: 'Admin Hệ Thống',
      role: 'SUPER_ADMIN',
      module: 'M21',
      action: 'DELETE',
      entityType: 'LOT',
      entityId: deletedLot.id,
      result: 'SUCCESS',
      beforeData: deletedLot
    });

    res.json({
      success: true,
      message: `Đã xóa thành công lô hàng ${deletedLot.batchNumber}`,
      deletedId: deletedLot.id
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. FEFO ALLOCATION SIMULATOR
lotsRouter.post("/api/inventory/lots/fefo-simulate", async (req, res) => {
  try {
    const { sku, requiredQuantity, warehouseId } = req.body;

    if (!sku || !requiredQuantity || Number(requiredQuantity) <= 0) {
      return res.status(400).json({ error: "Vui lòng cung cấp mã SKU và số lượng cần xuất > 0" });
    }

    const reqQty = Number(requiredQuantity);
    
    // Find all lots matching SKU with stock > 0
    let candidateLots = memoryLotsStore.filter(l => 
      l.sku.toUpperCase() === String(sku).toUpperCase() && 
      l.currentQty > 0 &&
      l.status !== 'QUARANTINE' &&
      l.status !== 'EXPIRED'
    );

    if (warehouseId) {
      candidateLots = candidateLots.filter(l => l.warehouseId === Number(warehouseId));
    }

    // Sort by Expiration Date ASC (FEFO: earliest expiration first)
    candidateLots.sort((a, b) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime());

    let remainingToAllocate = reqQty;
    const allocations: any[] = [];
    const now = new Date();

    for (const lot of candidateLots) {
      if (remainingToAllocate <= 0) break;

      const takeQty = Math.min(lot.currentQty, remainingToAllocate);
      remainingToAllocate -= takeQty;

      const exp = new Date(lot.expDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      allocations.push({
        lotId: lot.id,
        batchNumber: lot.batchNumber,
        warehouse: lot.warehouse,
        locationBin: lot.locationBin || 'BIN-A01-R01',
        expDate: lot.expDate,
        daysToExpiry: diffDays,
        lotAvailableQty: lot.currentQty,
        allocatedQty: takeQty,
        remainingInLotAfterAllocation: lot.currentQty - takeQty,
        uom: lot.uom,
        isNearExpiry: diffDays <= 45,
        fefoPriorityRank: allocations.length + 1
      });
    }

    const totalAllocated = reqQty - remainingToAllocate;
    const isFullySatisfied = remainingToAllocate === 0;

    res.json({
      success: true,
      sku,
      requiredQuantity: reqQty,
      totalAllocated,
      unfulfilledQuantity: remainingToAllocate,
      isFullySatisfied,
      allocationsCount: allocations.length,
      allocations,
      pickingRouteRecommendation: allocations.map((a, idx) => ({
        step: idx + 1,
        locationBin: a.locationBin,
        batchNumber: a.batchNumber,
        pickQty: `${a.allocatedQty} ${a.uom}`,
        action: `Nhặt ${a.allocatedQty} ${a.uom} từ vị trí ${a.locationBin} (Lô: ${a.batchNumber} - HSD: ${a.expDate})`
      })),
      warning: !isFullySatisfied 
        ? `Tồn kho khả dụng không đủ đáp ứng (Thiếu ${remainingToAllocate} đơn vị).` 
        : allocations.some(a => a.isNearExpiry)
        ? `Có ${allocations.filter(a => a.isNearExpiry).length} lô cận hạn (<= 45 ngày) được ưu tiên xuất trước theo chính sách FEFO.`
        : null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET BIDIRECTIONAL TRACEABILITY GRAPH DATA FOR LOT
lotsRouter.get("/api/inventory/lots/:id/trace", async (req, res) => {
  try {
    const lot = memoryLotsStore.find(l => l.id === req.params.id || l.batchNumber === req.params.id) || memoryLotsStore[0];

    const nodes: any[] = [
      {
        id: `supplier-${lot.id}`,
        name: lot.supplierName || 'Nhà Cung Cấp Ủy Quyền',
        code: lot.supplierLot,
        type: 'SUPPLIER',
        status: 'VERIFIED',
        date: lot.mfgDate,
        location: 'Inbound PO & Logistics',
        color: '#6366f1',
        subtitle: `PO Inbound: PO-2026-${lot.id.slice(-3)}`
      },
      {
        id: `lot-${lot.id}`,
        name: lot.productName,
        code: lot.batchNumber,
        type: 'LOT',
        status: lot.status,
        date: lot.expDate,
        location: lot.warehouse,
        color: '#2563eb',
        subtitle: `Tồn khả dụng: ${lot.currentQty}/${lot.initialQty} ${lot.uom}`
      },
      {
        id: `wo-${lot.id}-1`,
        name: 'Lệnh SX: Gia công lắp ráp khối điều khiển',
        code: `WO-2026-${lot.id.slice(-3)}A`,
        type: 'WORK_ORDER',
        status: 'COMPLETED',
        date: '2026-06-12',
        location: 'Xưởng Tự Động Hóa X1',
        quantity: Math.round(lot.initialQty * 0.45),
        uom: lot.uom,
        workcenter: 'Chuyền Lắp Ráp CNC-01',
        color: '#f59e0b',
        subtitle: `Tiêu hao: ${Math.round(lot.initialQty * 0.45)} ${lot.uom}`
      },
      {
        id: `wo-${lot.id}-2`,
        name: 'Lệnh SX: Thử nghiệm tải & Đo kiểm động học',
        code: `WO-2026-${lot.id.slice(-3)}B`,
        type: 'WORK_ORDER',
        status: 'IN_PROGRESS',
        date: '2026-07-05',
        location: 'Xưởng Cơ Điện X2',
        quantity: Math.round(lot.initialQty * 0.25),
        uom: lot.uom,
        workcenter: 'Phòng Lab Đo Kiểm',
        color: '#f59e0b',
        subtitle: `Tiêu hao: ${Math.round(lot.initialQty * 0.25)} ${lot.uom}`
      },
      {
        id: `fg-${lot.id}-1`,
        name: 'Thành Phẩm: Robot Hàn Tự Động 6 Trục',
        code: `FG-ROBOT-${lot.id.slice(-3)}`,
        type: 'FINISHED_GOOD',
        status: 'IN_STOCK',
        date: '2026-06-25',
        location: 'Kho Thành Phẩm WH-04',
        color: '#10b981',
        subtitle: 'Lô TP: FG-BATCH-881'
      },
      {
        id: `so-${lot.id}-1`,
        name: 'Đơn Hàng Bán: Tập đoàn VinFast',
        code: `SO-2026-VF-${lot.id.slice(-3)}`,
        type: 'SALES_ORDER',
        status: 'DELIVERED',
        date: '2026-07-20',
        location: 'Nhà máy Hải Phòng',
        color: '#06b6d4',
        subtitle: 'Bàn giao nghiệm thu 100%'
      }
    ];

    const links = [
      { source: `supplier-${lot.id}`, target: `lot-${lot.id}`, relation: 'SUPPLIED_AS', label: `Nhập ${lot.initialQty} ${lot.uom}` },
      { source: `lot-${lot.id}`, target: `wo-${lot.id}-1`, relation: 'CONSUMED_BY', label: `Xuất ${Math.round(lot.initialQty * 0.45)} ${lot.uom}` },
      { source: `lot-${lot.id}`, target: `wo-${lot.id}-2`, relation: 'CONSUMED_BY', label: `Xuất ${Math.round(lot.initialQty * 0.25)} ${lot.uom}` },
      { source: `wo-${lot.id}-1`, target: `fg-${lot.id}-1`, relation: 'PRODUCED_FG', label: 'Cấu thành SP' },
      { source: `fg-${lot.id}-1`, target: `so-${lot.id}-1`, relation: 'SHIPPED_TO', label: 'Giao khách hàng' }
    ];

    res.json({
      lotId: lot.id,
      batchNumber: lot.batchNumber,
      nodes,
      links,
      traceSummary: {
        totalInitialQty: lot.initialQty,
        totalConsumedQty: lot.initialQty - lot.currentQty,
        remainingStockQty: lot.currentQty,
        consumptionRatePercent: Math.round(((lot.initialQty - lot.currentQty) / lot.initialQty) * 100),
        workOrdersCount: 2,
        salesOrdersCount: 1
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET STOCK MOVEMENTS LEDGER FOR LOT
lotsRouter.get("/api/inventory/lots/:id/ledger", async (req, res) => {
  try {
    const rawId = req.params.id;
    const lot = memoryLotsStore.find(l => 
      l.id === rawId || 
      l.batchNumber.toLowerCase() === rawId.toLowerCase() ||
      l.id.toLowerCase() === rawId.toLowerCase()
    ) || memoryLotsStore[0];

    const consumed = Math.max(0, lot.initialQty - lot.currentQty);
    const mfgYear = lot.mfgDate ? lot.mfgDate.slice(0, 4) : '2026';
    const mfgMonth = lot.mfgDate ? lot.mfgDate.slice(5, 7) : '01';

    const ledger: any[] = [
      {
        id: `MOV-${lot.id}-001`,
        timestamp: `${lot.mfgDate} 08:30:00`,
        type: 'IN',
        referenceNo: `GRN-${mfgYear}-${lot.id.replace(/[^0-9]/g, '').slice(-4) || '1001'}`,
        orderType: 'Nhập Kho Mua Hàng (PO Inbound)',
        quantity: lot.initialQty,
        balanceAfter: lot.initialQty,
        operator: 'Thủ kho Nguyễn Văn Nam',
        warehouse: lot.warehouse,
        locationBin: lot.locationBin || 'BIN-A01-R01',
        notes: `Nghiệm thu đạt chuẩn 100% từ ${lot.supplierName || 'Nhà Cung Cấp'}. Mã lô NCC: ${lot.supplierLot}`
      },
      {
        id: `MOV-${lot.id}-002`,
        timestamp: `${mfgYear}-${mfgMonth}-18 14:15:00`,
        type: 'IN',
        referenceNo: `QC-${mfgYear}-${lot.id.replace(/[^0-9]/g, '').slice(-4) || '2002'}`,
        orderType: 'Kiểm định KCS / Đóng dấu chuẩn',
        quantity: 0,
        balanceAfter: lot.initialQty,
        operator: lot.qcInspector || 'Trưởng bộ phận QA/QC',
        warehouse: lot.warehouse,
        locationBin: lot.locationBin || 'BIN-A01-R01',
        notes: 'Kiểm tra độ ẩm, độ bền cơ học và seal bảo vệ. Đạt chỉ tiêu xuất kho.'
      }
    ];

    if (consumed > 0) {
      const firstOut = Math.round(consumed * 0.6);
      const secondOut = consumed - firstOut;

      ledger.push({
        id: `MOV-${lot.id}-003`,
        timestamp: `${mfgYear}-04-12 10:20:45`,
        type: 'OUT',
        referenceNo: `SO-${mfgYear}-1142`,
        orderType: 'Xuất giao hàng B2B (Goods Issue)',
        quantity: -firstOut,
        balanceAfter: lot.initialQty - firstOut,
        operator: 'Điều phối xuất kho',
        warehouse: lot.warehouse,
        locationBin: lot.locationBin || 'BIN-A01-R01',
        notes: 'Xuất giao dự án Hệ thống Tự động hóa nhà xưởng.'
      });

      if (secondOut > 0) {
        ledger.push({
          id: `MOV-${lot.id}-004`,
          timestamp: `${mfgYear}-07-20 16:40:10`,
          type: 'OUT',
          referenceNo: `WO-${mfgYear}-0456`,
          orderType: 'Xuất cấp vật tư Lệnh sản xuất',
          quantity: -secondOut,
          balanceAfter: lot.currentQty,
          operator: 'Quản đốc phân xưởng',
          warehouse: lot.warehouse,
          locationBin: lot.locationBin || 'BIN-A01-R01',
          notes: 'Lắp ráp mô-đun tủ điều khiển trung tâm đợt 2.'
        });
      }
    }

    if (lot.status === 'EXPIRED' || lot.status === 'QUARANTINE' || lot.status === 'QUARANTINED') {
      ledger.push({
        id: `MOV-${lot.id}-005`,
        timestamp: `${lot.expDate} 09:00:00`,
        type: 'QUARANTINE',
        referenceNo: `QC-HOLD-${mfgYear}-009`,
        orderType: 'Khóa cách ly quá hạn (Quarantine Hold)',
        quantity: 0,
        balanceAfter: lot.currentQty,
        operator: 'Hệ thống tự động NexusSync WMS',
        warehouse: lot.warehouse,
        locationBin: 'ZONE-QUARANTINE-01',
        notes: 'Lô hàng đã quá hạn sử dụng hoặc kiểm định không đạt. Khóa phân bổ FEFO.'
      });
    }

    res.json({
      success: true,
      lotId: lot.id,
      batchNumber: lot.batchNumber,
      data: ledger,
      ledger
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET UPSTREAM TRACEABILITY (SUPPLIER, PO, GRN, INBOUND INSPECTION)
lotsRouter.get("/api/inventory/lots/:id/trace-upstream", async (req, res) => {
  try {
    const rawId = req.params.id;
    const lot = memoryLotsStore.find(l => 
      l.id === rawId || 
      l.batchNumber.toLowerCase() === rawId.toLowerCase() ||
      l.id.toLowerCase() === rawId.toLowerCase()
    ) || memoryLotsStore[0];

    const mfgYear = lot.mfgDate ? lot.mfgDate.slice(0, 4) : '2026';
    const numId = lot.id.replace(/[^0-9]/g, '').slice(-3) || '001';

    const upstreamData = {
      lotId: lot.id,
      batchNumber: lot.batchNumber,
      sku: lot.sku,
      productName: lot.productName,
      supplier: {
        code: `SUP-VN-${numId}`,
        name: lot.supplierName || 'Nhà Cung Cấp Chuỗi Cung Ứng',
        supplierLotNumber: lot.supplierLot || `SUP-LOT-${numId}89`,
        countryOfOrigin: 'Việt Nam / Nhập khẩu ủy quyền',
        contactPerson: 'Phòng Kỹ Thuật NCC',
        phone: '+84 (024) 3892-8811'
      },
      procurement: {
        poNumber: `PO-${mfgYear}-${numId}42`,
        poDate: `${lot.mfgDate.slice(0, 7)}-02`,
        grnNumber: `GRN-${mfgYear}-${numId}88`,
        grnDate: `${lot.mfgDate} 08:30`,
        receivedQuantity: lot.initialQty,
        acceptedQuantity: lot.initialQty,
        rejectedQuantity: 0,
        uom: lot.uom,
        warehouse: lot.warehouse,
        receivingDock: 'DOCK-INBOUND-02'
      },
      qualityAssurance: {
        qcReportNo: `QC-INB-${mfgYear}-${numId}99`,
        qcStatus: lot.qcStatus || 'PASSED',
        inspector: lot.qcInspector || 'KCS Trưởng Ban Nghiệm Thu',
        inspectionDate: lot.qcDate || lot.mfgDate,
        coCqCertificate: `CO-CQ-${numId}882/TCHQ`,
        testParameters: [
          { param: 'Độ ẩm & Bảo quản', standard: '18-25°C, < 60% RH', measured: '21.5°C, 54% RH', result: 'PASS' },
          { param: 'Quy cách & Ngoại quan', standard: 'Nguyên seal, không trầy xước', measured: 'Đạt chuẩn 100%', result: 'PASS' },
          { param: 'Kích thước / Dung sai', standard: '±0.02 mm', measured: '+0.008 mm', result: 'PASS' },
          { param: 'Kiểm tra chức năng', standard: '100% test điện / áp suất', measured: 'Đáp ứng tiêu chuẩn', result: 'PASS' }
        ]
      }
    };

    res.json({
      success: true,
      data: upstreamData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. GET DOWNSTREAM TRACEABILITY (CONSUMPTION IN WO, FG BATCHES, SHIPPED CUSTOMERS)
lotsRouter.get("/api/inventory/lots/:id/trace-downstream", async (req, res) => {
  try {
    const rawId = req.params.id;
    const lot = memoryLotsStore.find(l => 
      l.id === rawId || 
      l.batchNumber.toLowerCase() === rawId.toLowerCase() ||
      l.id.toLowerCase() === rawId.toLowerCase()
    ) || memoryLotsStore[0];

    const numId = lot.id.replace(/[^0-9]/g, '').slice(-3) || '001';
    const consumed = Math.max(0, lot.initialQty - lot.currentQty);
    const wo1Qty = Math.round(consumed * 0.6) || Math.round(lot.initialQty * 0.45);
    const wo2Qty = consumed - wo1Qty > 0 ? (consumed - wo1Qty) : Math.round(lot.initialQty * 0.25);

    const downstreamData = {
      lotId: lot.id,
      batchNumber: lot.batchNumber,
      sku: lot.sku,
      productName: lot.productName,
      totalInitialQty: lot.initialQty,
      totalConsumedQty: consumed,
      remainingInStockQty: lot.currentQty,
      uom: lot.uom,
      workOrders: [
        {
          woCode: `WO-2026-${numId}A`,
          title: 'Lệnh SX: Gia công mô-đun điều khiển CNC tự động',
          workCenter: 'Chuyền Lắp Ráp CNC-01 (Xưởng 1)',
          dateIssued: '2026-06-12',
          consumedQuantity: wo1Qty,
          uom: lot.uom,
          status: 'COMPLETED',
          producedFinishedGood: {
            sku: 'FG-ROBOT-ARM-6X',
            productName: 'Robot Hàn Tự Động 6 Trục Công Nghiệp',
            fgBatchNumber: `FG-BATCH-881-${numId}`,
            producedQuantity: 10,
            uom: 'Bộ',
            warehouse: 'Kho Thành Phẩm WH-04'
          }
        },
        {
          woCode: `WO-2026-${numId}B`,
          title: 'Lệnh SX: Thử nghiệm tải cao tần & Đo kiểm động học',
          workCenter: 'Phòng Lab Thử Nghiệm X2',
          dateIssued: '2026-07-05',
          consumedQuantity: wo2Qty,
          uom: lot.uom,
          status: 'IN_PROGRESS',
          producedFinishedGood: {
            sku: 'FG-INVERTER-PRO',
            productName: 'Tủ Biến Tần Điều Khiển Trung Tâm 380V',
            fgBatchNumber: `FG-BATCH-902-${numId}`,
            producedQuantity: 15,
            uom: 'Tủ',
            warehouse: 'Kho Thành Phẩm WH-04'
          }
        }
      ],
      shippedCustomers: [
        {
          soNumber: `SO-2026-VF-${numId}`,
          customerCode: 'CUST-VINFAST',
          customerName: 'Tập đoàn Sản Xuất Ô tô VinFast',
          deliveryAddress: 'Khu Công Nghiệp Đình Vũ, Cát Hải, Hải Phòng',
          contactPhone: '+84 225 398 9999',
          contactPerson: 'Kỹ sư trưởng Nguyễn Tuấn Vũ',
          shippedQuantity: wo1Qty,
          uom: lot.uom,
          shippingDate: '2026-07-20',
          invoiceNo: `HD-AR-2026-${numId}81`,
          deliveryStatus: 'DELIVERED',
          recallContactStatus: 'PENDING_NOTIFICATION'
        },
        {
          soNumber: `SO-2026-TH-${numId}`,
          customerCode: 'CUST-THACO',
          customerName: 'Tập đoàn Cơ Khí Ô tô Chu Lai THACO',
          deliveryAddress: 'Khu Kinh Tế Mở Chu Lai, Núi Thành, Quảng Nam',
          contactPhone: '+84 235 385 6789',
          contactPerson: 'Trưởng ban mua hàng Lê Hoàng Nam',
          shippedQuantity: Math.round(wo2Qty * 0.7),
          uom: lot.uom,
          shippingDate: '2026-08-05',
          invoiceNo: `HD-AR-2026-${numId}94`,
          deliveryStatus: 'DELIVERED',
          recallContactStatus: 'PENDING_NOTIFICATION'
        }
      ]
    };

    res.json({
      success: true,
      data: downstreamData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. POST RECALL INCIDENT (LOCK LOT TO QUARANTINE, AUDIT TRAIL, NOTIFY STAKEHOLDERS)
lotsRouter.post("/api/inventory/lots/:id/recall-incident", async (req, res) => {
  try {
    const rawId = req.params.id;
    const { reason, severity, recallScope, affectedBatch, initiatedBy = 'QA/QC Manager' } = req.body;
    
    const lotIndex = memoryLotsStore.findIndex(l => 
      l.id === rawId || 
      l.batchNumber.toLowerCase() === rawId.toLowerCase() ||
      l.id.toLowerCase() === rawId.toLowerCase()
    );

    if (lotIndex === -1) {
      return res.status(404).json({ success: false, error: "Không tìm thấy thông tin lô hàng cần thu hồi" });
    }

    const previousStatus = memoryLotsStore[lotIndex].status;
    memoryLotsStore[lotIndex].status = 'QUARANTINE';
    memoryLotsStore[lotIndex].notes = `[SỰ CỐ THU HỒI ${new Date().toISOString().slice(0, 10)}] ${reason || 'Khóa khẩn cấp thu hồi chất lượng'}`;

    const incidentId = `REC-INC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    // Central Audit Gateway (M22 Lot Traceability Recall Protocol)
    AuditService.captureAsync({
      userId: 1,
      username: 'qa_manager',
      userName: initiatedBy,
      role: 'SUPER_ADMIN',
      module: 'M22',
      action: 'UPDATE',
      entityType: 'LOT_RECALL_INCIDENT',
      entityId: memoryLotsStore[lotIndex].id,
      result: 'SUCCESS',
      beforeData: { status: previousStatus },
      afterData: {
        incidentId,
        lotNumber: memoryLotsStore[lotIndex].batchNumber,
        status: 'QUARANTINE',
        severity: severity || 'CRITICAL_LEVEL_1',
        recallScope: recallScope || 'ALL_DOWNSTREAM_CUSTOMERS',
        reason
      }
    });

    res.json({
      success: true,
      incidentId,
      message: `Đã kích hoạt phong tỏa khẩn cấp và thiết lập hồ sơ thu hồi cho lô ${memoryLotsStore[lotIndex].batchNumber}`,
      lot: memoryLotsStore[lotIndex],
      incident: {
        incidentId,
        lotId: memoryLotsStore[lotIndex].id,
        lotNumber: memoryLotsStore[lotIndex].batchNumber,
        productName: memoryLotsStore[lotIndex].productName,
        initiatedBy,
        timestamp: new Date().toISOString(),
        status: 'QUARANTINE_LOCKED',
        severity: severity || 'CRITICAL_LEVEL_1',
        actionRequired: [
          'Niêm phong và khóa xuất kho toàn bộ tồn kho hiện tại',
          'Gửi thông báo khẩn cấp tới khách hàng đã nhận hàng',
          'Thu hồi mẫu lưu kho và gửi phòng Lab giám định độc lập',
          'Lập biên bản báo cáo Ban Giám Đốc và Tổ chức Chứng nhận ISO/IATF'
        ]
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. GET RECALL DOSSIER (COMPLETE COMPLIANCE DOSSIER FOR EXPORT)
lotsRouter.get("/api/inventory/lots/:id/recall-dossier", async (req, res) => {
  try {
    const rawId = req.params.id;
    const lot = memoryLotsStore.find(l => 
      l.id === rawId || 
      l.batchNumber.toLowerCase() === rawId.toLowerCase() ||
      l.id.toLowerCase() === rawId.toLowerCase()
    ) || memoryLotsStore[0];

    const dossier = {
      dossierCode: `DOSSIER-RECALL-${lot.batchNumber}`,
      generatedAt: new Date().toISOString(),
      standardsCompliance: ['ISO 9001:2015 Clause 8.7', 'IATF 16949 Section 8.5.2.1', 'FDA 21 CFR Part 11'],
      lotDetails: lot,
      currentInventoryLocked: lot.currentQty,
      quarantineWarehouse: lot.warehouse,
      quarantineBin: lot.locationBin || 'BIN-QUARANTINE-01',
      rootCauseAnalysis: 'Đang tiến hành phân tích 5-Why & Biểu đồ Xương Cá (Fishbone) tại Phòng Lab',
      recommendedDispositions: ['Hoàn trả Nhà Cung Cấp', 'Hủy theo quy trình EHS', 'Tái chế kỹ thuật có giám sát KCS']
    };

    res.json({
      success: true,
      data: dossier
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
