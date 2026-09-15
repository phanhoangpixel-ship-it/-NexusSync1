import { db } from '../src/db';
import { 
  subcontractingOrders, 
  subcontractingOrderComponents, 
  subcontractingMaterialIssues, 
  subcontractingOutputReceipts, 
  subcontractorStockBalances,
  products, 
  suppliers, 
  warehouses, 
  warehouseLocations, 
  boms, 
  bomItems, 
  users, 
  purchaseOrders,
  qualityInspections
} from '../src/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { InventoryService } from './inventoryService';
import { costingEngine } from './costingEngine';
import { accountingEngine } from './accountingEngine';

export const SubcontractingService = {
  /**
   * 1. Get Subcontracting Orders with filtering
   */
  async getOrders(filters?: {
    status?: string;
    supplierId?: number;
    productId?: number;
    search?: string;
  }) {
    let query = db.select({
      order: subcontractingOrders,
      supplierName: suppliers.name,
      supplierCode: suppliers.code,
      productName: products.name,
      productSku: products.sku,
      warehouseName: warehouses.name,
      creatorName: users.username,
    })
    .from(subcontractingOrders)
    .leftJoin(suppliers, eq(subcontractingOrders.supplierId, suppliers.id))
    .leftJoin(products, eq(subcontractingOrders.productId, products.id))
    .leftJoin(warehouses, eq(subcontractingOrders.destinationWarehouseId, warehouses.id))
    .leftJoin(users, eq(subcontractingOrders.createdBy, users.id))
    .$dynamic();

    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(subcontractingOrders.status, filters.status));
    }
    if (filters?.supplierId) {
      conditions.push(eq(subcontractingOrders.supplierId, filters.supplierId));
    }
    if (filters?.productId) {
      conditions.push(eq(subcontractingOrders.productId, filters.productId));
    }
    if (filters?.search) {
      conditions.push(
        sql`(${subcontractingOrders.orderCode} LIKE ${`%${filters.search}%`} OR ${products.name} LIKE ${`%${filters.search}%`} OR ${products.sku} LIKE ${`%${filters.search}%`})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const list = await query.orderBy(desc(subcontractingOrders.createdAt));

    return list.map(item => ({
      ...item.order,
      supplierName: item.supplierName,
      supplierCode: item.supplierCode,
      productName: item.productName,
      productSku: item.productSku,
      warehouseName: item.warehouseName,
      creatorName: item.creatorName,
    }));
  },

  /**
   * 2. Get detailed Subcontracting Order by ID including components, issues, receipts
   */
  async getOrderById(id: number) {
    const [order] = await db.select({
      order: subcontractingOrders,
      supplierName: suppliers.name,
      supplierCode: suppliers.code,
      productName: products.name,
      productSku: products.sku,
      warehouseName: warehouses.name,
      vendorLocationName: warehouseLocations.name,
      creatorName: users.username,
      approverName: users.username,
    })
    .from(subcontractingOrders)
    .leftJoin(suppliers, eq(subcontractingOrders.supplierId, suppliers.id))
    .leftJoin(products, eq(subcontractingOrders.productId, products.id))
    .leftJoin(warehouses, eq(subcontractingOrders.destinationWarehouseId, warehouses.id))
    .leftJoin(warehouseLocations, eq(subcontractingOrders.vendorLocationId, warehouseLocations.id))
    .leftJoin(users, eq(subcontractingOrders.createdBy, users.id))
    .where(eq(subcontractingOrders.id, id))
    .limit(1);

    if (!order) {
      throw new Error("Không tìm thấy Đơn gia công (SCO)");
    }

    const components = await db.select({
      component: subcontractingOrderComponents,
      productName: products.name,
      productSku: products.sku,
      baseUnit: products.baseUnit,
    })
    .from(subcontractingOrderComponents)
    .leftJoin(products, eq(subcontractingOrderComponents.componentProductId, products.id))
    .where(eq(subcontractingOrderComponents.subcontractingOrderId, id));

    const issues = await db.select().from(subcontractingMaterialIssues).where(eq(subcontractingMaterialIssues.subcontractingOrderId, id));
    const receipts = await db.select().from(subcontractingOutputReceipts).where(eq(subcontractingOutputReceipts.subcontractingOrderId, id));

    return {
      ...order.order,
      supplierName: order.supplierName,
      supplierCode: order.supplierCode,
      productName: order.productName,
      productSku: order.productSku,
      warehouseName: order.warehouseName,
      vendorLocationName: order.vendorLocationName,
      creatorName: order.creatorName,
      components: components.map(c => ({
        ...c.component,
        productName: c.productName,
        productSku: c.productSku,
        baseUnit: c.baseUnit,
      })),
      issues,
      receipts,
    };
  },

  /**
   * 3. Create Subcontracting Order (SCO)
   */
  async createOrder(data: {
    supplierId: number;
    productId: number;
    purchaseOrderId?: number;
    bomId?: number;
    destinationWarehouseId: number;
    destinationLocationId?: number;
    vendorLocationId?: number;
    orderedQuantity: number;
    serviceUnitPrice: number;
    notes?: string;
    components?: Array<{
      componentProductId: number;
      bomQtyPerUnit: number;
      requiredQuantity: number;
    }>;
    createdBy: number;
  }) {
    // Generate order code SCO-YYYY-XXXXX
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(subcontractingOrders);
    const seq = (countRes[0]?.count || 0) + 1;
    const year = new Date().getFullYear();
    const orderCode = `SCO-${year}-${String(seq).padStart(5, '0')}`;

    const totalServiceCost = data.orderedQuantity * data.serviceUnitPrice;

    // Resolve or create virtual vendor location if not provided
    let vendorLocId = data.vendorLocationId;
    if (!vendorLocId) {
      const [existingLoc] = await db.select()
        .from(warehouseLocations)
        .where(and(eq(warehouseLocations.warehouseId, data.destinationWarehouseId), eq(warehouseLocations.type, 'VENDOR_HELD')))
        .limit(1);
      
      if (existingLoc) {
        vendorLocId = existingLoc.id;
      } else {
        const [newLoc] = await db.insert(warehouseLocations).values({
          warehouseId: data.destinationWarehouseId,
          code: `VLOC-SUP-${data.supplierId}`,
          name: `Kho gia công Nhà cung cấp #${data.supplierId}`,
          type: 'VENDOR_HELD',
          isActive: true
        } as any).returning();
        vendorLocId = newLoc.id;
      }
    }

    const [newOrder] = await db.insert(subcontractingOrders).values({
      orderCode,
      supplierId: data.supplierId,
      purchaseOrderId: data.purchaseOrderId || null,
      productId: data.productId,
      bomId: data.bomId || null,
      vendorLocationId: vendorLocId,
      destinationWarehouseId: data.destinationWarehouseId,
      destinationLocationId: data.destinationLocationId || null,
      orderedQuantity: data.orderedQuantity,
      receivedQuantity: 0,
      serviceUnitPrice: data.serviceUnitPrice,
      totalServiceCost,
      status: 'DRAFT',
      notes: data.notes || null,
      createdBy: data.createdBy,
      createdAt: new Date(),
    } as any).returning();

    // Auto-explode BOM components if not manually specified
    let compList = data.components || [];
    if (compList.length === 0 && data.bomId) {
      const bItems = await db.select().from(bomItems).where(eq(bomItems.bomId, data.bomId));
      compList = bItems.map(item => ({
        componentProductId: item.materialProductId,
        bomQtyPerUnit: Number(item.quantity) || 1,
        requiredQuantity: (Number(item.quantity) || 1) * data.orderedQuantity,
      }));
    }

    for (const comp of compList) {
      await db.insert(subcontractingOrderComponents).values({
        subcontractingOrderId: newOrder.id,
        componentProductId: comp.componentProductId,
        bomQtyPerUnit: comp.bomQtyPerUnit,
        requiredQuantity: comp.requiredQuantity,
        issuedQuantity: 0,
        consumedQuantity: 0,
        returnedQuantity: 0,
        scrappedQuantity: 0,
      } as any);
    }

    return newOrder;
  },

  /**
   * 4. Approve Subcontracting Order (SCO)
   */
  async approveOrder(orderId: number, userId: number) {
    const [order] = await db.select().from(subcontractingOrders).where(eq(subcontractingOrders.id, orderId)).limit(1);
    if (!order) throw new Error("Không tìm thấy đơn gia công");
    if (order.status !== 'DRAFT') throw new Error(`Đơn gia công đang ở trạng thái ${order.status}, không thể duyệt`);

    const [updated] = await db.update(subcontractingOrders).set({
      status: 'RELEASED',
      approvedBy: userId,
      approvedAt: new Date(),
    } as any).where(eq(subcontractingOrders.id, orderId)).returning();

    return updated;
  },

  /**
   * 5. Issue Materials to Subcontractor Vendor Location
   * SUB-007: Mandatory write via InventoryService.postTransaction()
   */
  async issueMaterials(orderId: number, data: {
    sourceWarehouseId: number;
    sourceLocationId?: number;
    items: Array<{
      componentProductId: number;
      quantity: number;
      lotId?: number;
    }>;
    notes?: string;
  }, userId: number) {
    const [order] = await db.select().from(subcontractingOrders).where(eq(subcontractingOrders.id, orderId)).limit(1);
    if (!order) throw new Error("Không tìm thấy đơn gia công");
    if (order.status !== 'RELEASED' && order.status !== 'IN_PROGRESS') {
      throw new Error("Đơn gia công phải ở trạng thái CHẤP NHẬN/ĐANG THỰC HIỆN để xuất vật tư");
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(subcontractingMaterialIssues);
    const seq = (countRes[0]?.count || 0) + 1;
    const year = new Date().getFullYear();
    const issueCode = `SMI-${year}-${String(seq).padStart(5, '0')}`;

    // Execute within database transaction boundary
    return await db.transaction(async (tx) => {
      const [issue] = await tx.insert(subcontractingMaterialIssues).values({
        issueCode,
        subcontractingOrderId: orderId,
        sourceWarehouseId: data.sourceWarehouseId,
        sourceLocationId: data.sourceLocationId || null,
        vendorLocationId: order.vendorLocationId,
        notes: data.notes || null,
        status: 'POSTED',
        issuedBy: userId,
        issuedAt: new Date(),
      } as any).returning();

      for (const item of data.items) {
        if (item.quantity <= 0) continue;

        // 1. Transfer OUT from Source Warehouse Location via InventoryService
        await InventoryService.postTransaction(tx, {
          productId: item.componentProductId,
          warehouseId: data.sourceWarehouseId,
          locationId: data.sourceLocationId,
          lotId: item.lotId,
          type: 'TRANSFER_OUT',
          referenceNo: issueCode,
          quantity: item.quantity,
          notes: `Xuất vật tư gia công theo ${order.orderCode}`,
          userId,
          referenceId: issue.id
        });

        // 2. Transfer IN to Subcontractor Vendor Location via InventoryService
        await InventoryService.postTransaction(tx, {
          productId: item.componentProductId,
          warehouseId: data.sourceWarehouseId,
          locationId: order.vendorLocationId,
          lotId: item.lotId,
          type: 'TRANSFER_IN',
          referenceNo: issueCode,
          quantity: item.quantity,
          notes: `Nhập kho gia công NCC theo ${order.orderCode}`,
          userId,
          referenceId: issue.id
        });

        // 3. Update component issued quantity
        await tx.run(sql`
          UPDATE subcontracting_order_components 
          SET issued_quantity = issued_quantity + ${item.quantity}
          WHERE subcontracting_order_id = ${orderId} AND component_product_id = ${item.componentProductId}
        `);

        // 4. Update vendor stock balance ledger
        await tx.run(sql`
          INSERT INTO subcontractor_stock_balances (supplier_id, vendor_location_id, product_id, physical_quantity, updated_at)
          VALUES (${order.supplierId}, ${order.vendorLocationId}, ${item.componentProductId}, ${item.quantity}, datetime('now'))
          ON CONFLICT DO UPDATE SET 
            physical_quantity = physical_quantity + ${item.quantity},
            updated_at = datetime('now')
        `);
      }

      // Update Order Status to IN_PROGRESS
      await tx.update(subcontractingOrders).set({
        status: 'IN_PROGRESS'
      } as any).where(eq(subcontractingOrders.id, orderId));

      return issue;
    });
  },

  /**
   * 6. Receive Subcontracted Output Items & Backflush Vendor Component Stock
   * SUB-009 & SUB-010: Mandatory write via InventoryService.postTransaction()
   */
  async receiveOutput(orderId: number, data: {
    receivedQuantity: number;
    destinationWarehouseId: number;
    destinationLocationId?: number;
    unitServiceCost?: number;
    qualityInspectionId?: number;
    notes?: string;
  }, userId: number) {
    const [order] = await db.select().from(subcontractingOrders).where(eq(subcontractingOrders.id, orderId)).limit(1);
    if (!order) throw new Error("Không tìm thấy đơn gia công");
    if (order.status !== 'IN_PROGRESS' && order.status !== 'RELEASED') {
      throw new Error("Đơn gia công phải ở trạng thái ĐANG THỰC HIỆN để nhận thành phẩm");
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(subcontractingOutputReceipts);
    const seq = (countRes[0]?.count || 0) + 1;
    const year = new Date().getFullYear();
    const receiptCode = `SOR-${year}-${String(seq).padStart(5, '0')}`;

    const serviceCostPerUnit = data.unitServiceCost ?? order.serviceUnitPrice;

    return await db.transaction(async (tx) => {
      // 1. Calculate Component Material Cost per Output Unit
      const components = await tx.select().from(subcontractingOrderComponents).where(eq(subcontractingOrderComponents.subcontractingOrderId, orderId));
      
      let totalMaterialCostForReceipt = 0;
      const componentConsumptions: Array<{ productId: number; consumedQty: number }> = [];

      for (const comp of components) {
        const consumedQty = comp.bomQtyPerUnit * data.receivedQuantity;
        
        // Fetch component cost price
        const [compProd] = await tx.select().from(products).where(eq(products.id, comp.componentProductId)).limit(1);
        const compUnitCost = compProd?.costPrice || 0;
        
        totalMaterialCostForReceipt += consumedQty * compUnitCost;
        componentConsumptions.push({ productId: comp.componentProductId, consumedQty });

        // Backflush vendor component inventory via InventoryService.postTransaction()
        await InventoryService.postTransaction(tx, {
          productId: comp.componentProductId,
          warehouseId: data.destinationWarehouseId,
          locationId: order.vendorLocationId,
          type: 'GOODS_ISSUE',
          referenceNo: receiptCode,
          quantity: consumedQty,
          notes: `Khấu trừ vật tư gia công theo ${receiptCode}`,
          userId
        });

        // Update component consumed quantity
        await tx.run(sql`
          UPDATE subcontracting_order_components 
          SET consumed_quantity = consumed_quantity + ${consumedQty}
          WHERE id = ${comp.id}
        `);

        // Deduct subcontractor vendor stock balance
        await tx.run(sql`
          UPDATE subcontractor_stock_balances
          SET physical_quantity = MAX(0, physical_quantity - ${consumedQty}),
              updated_at = datetime('now')
          WHERE supplier_id = ${order.supplierId} AND product_id = ${comp.componentProductId}
        `);
      }

      const unitMaterialCost = data.receivedQuantity > 0 ? (totalMaterialCostForReceipt / data.receivedQuantity) : 0;
      const totalUnitCost = unitMaterialCost + serviceCostPerUnit;

      // 2. Receive Finished Product into Destination Warehouse via InventoryService.postTransaction()
      await InventoryService.postTransaction(tx, {
        productId: order.productId,
        warehouseId: data.destinationWarehouseId,
        locationId: data.destinationLocationId || order.destinationLocationId,
        type: 'GOODS_RECEIPT',
        referenceNo: receiptCode,
        quantity: data.receivedQuantity,
        notes: `Nhập kho thành phẩm gia công ${order.orderCode}`,
        userId
      });

      // 3. Create Output Receipt Record
      const [receipt] = await tx.insert(subcontractingOutputReceipts).values({
        receiptCode,
        subcontractingOrderId: orderId,
        receivedQuantity: data.receivedQuantity,
        destinationWarehouseId: data.destinationWarehouseId,
        destinationLocationId: data.destinationLocationId || order.destinationLocationId || null,
        unitMaterialCost,
        unitServiceCost: serviceCostPerUnit,
        totalUnitCost,
        qualityInspectionId: data.qualityInspectionId || null,
        status: 'POSTED',
        notes: data.notes || null,
        receivedBy: userId,
        receivedAt: new Date(),
      } as any).returning();

      // 4. Update SCO Received Quantity & Status
      const newReceivedTotal = order.receivedQuantity + data.receivedQuantity;
      const isCompleted = newReceivedTotal >= order.orderedQuantity;

      await tx.update(subcontractingOrders).set({
        receivedQuantity: newReceivedTotal,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isCompleted ? new Date() : null,
      } as any).where(eq(subcontractingOrders.id, orderId));

      return {
        receipt,
        isCompleted,
        totalUnitCost,
        unitMaterialCost,
        unitServiceCost: serviceCostPerUnit
      };
    });
  },

  /**
   * 7. Return Unconsumed Component Materials from Vendor Location back to Internal Warehouse
   * SUB-016: Mandatory write via InventoryService.postTransaction()
   */
  async returnMaterials(orderId: number, data: {
    destinationWarehouseId: number;
    destinationLocationId?: number;
    items: Array<{
      componentProductId: number;
      quantity: number;
    }>;
    notes?: string;
  }, userId: number) {
    const [order] = await db.select().from(subcontractingOrders).where(eq(subcontractingOrders.id, orderId)).limit(1);
    if (!order) throw new Error("Không tìm thấy đơn gia công");

    const returnRef = `SMR-${order.orderCode}-${Date.now().toString().slice(-4)}`;

    return await db.transaction(async (tx) => {
      for (const item of data.items) {
        if (item.quantity <= 0) continue;

        // 1. OUT from Vendor Location via InventoryService
        await InventoryService.postTransaction(tx, {
          productId: item.componentProductId,
          warehouseId: data.destinationWarehouseId,
          locationId: order.vendorLocationId,
          type: 'TRANSFER_OUT',
          referenceNo: returnRef,
          quantity: item.quantity,
          notes: `Trả lại vật tư gia công dư thừa theo ${order.orderCode}`,
          userId
        });

        // 2. IN to Destination Warehouse Location via InventoryService
        await InventoryService.postTransaction(tx, {
          productId: item.componentProductId,
          warehouseId: data.destinationWarehouseId,
          locationId: data.destinationLocationId,
          type: 'TRANSFER_IN',
          referenceNo: returnRef,
          quantity: item.quantity,
          notes: `Nhập lại kho vật tư dư từ NCC gia công ${order.orderCode}`,
          userId
        });

        // 3. Update component returned quantity
        await tx.run(sql`
          UPDATE subcontracting_order_components
          SET returned_quantity = returned_quantity + ${item.quantity}
          WHERE subcontracting_order_id = ${orderId} AND component_product_id = ${item.componentProductId}
        `);

        // 4. Deduct vendor stock balance
        await tx.run(sql`
          UPDATE subcontractor_stock_balances
          SET physical_quantity = MAX(0, physical_quantity - ${item.quantity}),
              updated_at = datetime('now')
          WHERE supplier_id = ${order.supplierId} AND product_id = ${item.componentProductId}
        `);
      }

      return { success: true, returnRef };
    });
  },

  /**
   * 8. Vendor Stock Balances view
   */
  async getVendorBalances(supplierId?: number) {
    let query = db.select({
      balance: subcontractorStockBalances,
      supplierName: suppliers.name,
      supplierCode: suppliers.code,
      productName: products.name,
      productSku: products.sku,
      baseUnit: products.baseUnit,
      locationName: warehouseLocations.name,
    })
    .from(subcontractorStockBalances)
    .leftJoin(suppliers, eq(subcontractorStockBalances.supplierId, suppliers.id))
    .leftJoin(products, eq(subcontractorStockBalances.productId, products.id))
    .leftJoin(warehouseLocations, eq(subcontractorStockBalances.vendorLocationId, warehouseLocations.id))
    .$dynamic();

    if (supplierId) {
      query = query.where(eq(subcontractorStockBalances.supplierId, supplierId));
    }

    const list = await query.orderBy(desc(subcontractorStockBalances.updatedAt));

    return list.map(item => ({
      ...item.balance,
      supplierName: item.supplierName,
      supplierCode: item.supplierCode,
      productName: item.productName,
      productSku: item.productSku,
      baseUnit: item.baseUnit,
      locationName: item.locationName,
    }));
  },

  /**
   * 9. Dashboard Analytics for Module 38
   */
  async getAnalytics() {
    const totalOrdersRes = await db.select({ count: sql<number>`count(*)` }).from(subcontractingOrders);
    const inProgressOrdersRes = await db.select({ count: sql<number>`count(*)` }).from(subcontractingOrders).where(eq(subcontractingOrders.status, 'IN_PROGRESS'));
    const completedOrdersRes = await db.select({ count: sql<number>`count(*)` }).from(subcontractingOrders).where(eq(subcontractingOrders.status, 'COMPLETED'));
    
    const totalServiceCostRes = await db.select({ total: sql<number>`sum(total_service_cost)` }).from(subcontractingOrders);
    const totalVendorItemsRes = await db.select({ totalQty: sql<number>`sum(physical_quantity)` }).from(subcontractorStockBalances);

    return {
      totalOrders: totalOrdersRes[0]?.count || 0,
      inProgressOrders: inProgressOrdersRes[0]?.count || 0,
      completedOrders: completedOrdersRes[0]?.count || 0,
      totalServiceCost: totalServiceCostRes[0]?.total || 0,
      vendorHeldStockQty: totalVendorItemsRes[0]?.totalQty || 0,
    };
  }
};
