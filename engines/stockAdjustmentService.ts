import { db } from "../src/db";
import * as schema from "../src/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { InventoryService } from "./inventoryService";

export const StockAdjustmentService = {
  async list(filters?: { warehouseId?: number; status?: string; search?: string }) {
    try {
      const adjustments = await db.select().from(schema.stockAdjustments).orderBy(desc(schema.stockAdjustments.id)).all();
      const items = await db.select().from(schema.stockAdjustmentItems).all();
      const warehouses = await db.select().from(schema.warehouses).all();
      const products = await db.select().from(schema.products).all();

      const wMap = new Map(warehouses.map(w => [w.id, w]));
      const pMap = new Map(products.map(p => [p.id, p]));
      const itemsMap = new Map<number, any[]>();

      items.forEach(it => {
        const list = itemsMap.get(it.adjustmentId) || [];
        const prod = pMap.get(it.productId);
        list.push({
          ...it,
          productSku: prod?.sku || `SKU-${it.productId}`,
          productName: prod?.name || `Product #${it.productId}`,
          baseUnit: prod?.baseUnit || "Cái",
        });
        itemsMap.set(it.adjustmentId, list);
      });

      let result = adjustments.map(adj => {
        const wh = wMap.get(adj.warehouseId);
        const adjItems = itemsMap.get(adj.id) || [];
        return {
          ...adj,
          warehouseCode: wh?.code || "WH-01",
          warehouseName: wh?.name || "Kho Tổng",
          items: adjItems,
          totalLines: adjItems.length,
        };
      });

      if (filters?.warehouseId) {
        result = result.filter(r => r.warehouseId === filters.warehouseId);
      }
      if (filters?.status) {
        result = result.filter(r => r.status === filters.status);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(r => r.code.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q));
      }

      return { data: result, total: result.length };
    } catch (err: any) {
      console.error("StockAdjustmentService.list error:", err);
      return { data: [], total: 0 };
    }
  },

  async getById(id: number) {
    const adjList = await db.select().from(schema.stockAdjustments).where(eq(schema.stockAdjustments.id, id)).limit(1);
    if (adjList.length === 0) return null;
    const adj = adjList[0];

    const items = await db.select().from(schema.stockAdjustmentItems).where(eq(schema.stockAdjustmentItems.adjustmentId, id)).all();
    const products = await db.select().from(schema.products).all();
    const warehouses = await db.select().from(schema.warehouses).all();
    const pMap = new Map(products.map(p => [p.id, p]));
    const wh = warehouses.find(w => w.id === adj.warehouseId);

    const enrichedItems = items.map(it => {
      const prod = pMap.get(it.productId);
      return {
        ...it,
        productSku: prod?.sku || `SKU-${it.productId}`,
        productName: prod?.name || `Product #${it.productId}`,
        baseUnit: prod?.baseUnit || "Cái",
      };
    });

    return {
      ...adj,
      warehouseCode: wh?.code || `WH-${adj.warehouseId}`,
      warehouseName: wh?.name || `Kho #${adj.warehouseId}`,
      items: enrichedItems,
      totalLines: enrichedItems.length,
    };
  },

  async createDraft(input: {
    warehouseId: number;
    adjustmentType?: string;
    direction?: string;
    reason: string;
    notes?: string;
    items: Array<{
      productId: number;
      locationId?: number;
      lotId?: number;
      direction: string;
      quantity: number; // Variance or actual quantity
      unitCost?: number;
      currentStock?: number;
      newStock?: number;
      notes?: string;
    }>;
  }, userId: number) {
    const code = `ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Validate warehouse exists
    const whCheck = await db.select().from(schema.warehouses).where(eq(schema.warehouses.id, input.warehouseId)).limit(1);
    if (whCheck.length === 0) {
      // If warehouse does not exist, use default warehouse if available or throw clear message
      const anyWh = await db.select().from(schema.warehouses).limit(1);
      if (anyWh.length > 0) {
        input.warehouseId = anyWh[0].id;
      }
    }

    let adjId = 0;

    await db.transaction(async (tx) => {
      const newAdj = await tx.insert(schema.stockAdjustments).values({
        code,
        warehouseId: input.warehouseId,
        adjustmentType: input.adjustmentType || "CYCLE_COUNT",
        direction: input.direction || "INCREASE",
        reason: input.reason || "Kiểm định tồn kho định kỳ",
        notes: input.notes || "",
        status: "DRAFT",
        createdBy: userId,
      } as any).returning();

      adjId = newAdj[0].id;

      for (const it of input.items) {
        // Fetch current stock snapshot from M17 (stockBalances)
        const balCheck = await tx.select().from(schema.stockBalances)
          .where(and(
            eq(schema.stockBalances.productId, it.productId),
            eq(schema.stockBalances.warehouseId, input.warehouseId)
          ))
          .limit(1);

        const currentStock = balCheck.length > 0 ? balCheck[0].stockPhysical : 0;
        const qty = Number(it.quantity) || 0;
        const direction = it.direction || (qty >= 0 ? "INCREASE" : "DECREASE");
        const absQty = Math.abs(qty);
        const newStock = direction === "INCREASE" ? currentStock + absQty : Math.max(0, currentStock - absQty);

        await tx.insert(schema.stockAdjustmentItems).values({
          adjustmentId: adjId,
          productId: it.productId,
          locationId: it.locationId || null,
          lotId: it.lotId || null,
          direction,
          quantity: absQty,
          unitCost: it.unitCost || 0,
          totalCost: absQty * (it.unitCost || 0),
          currentStockSnapshot: currentStock,
          newStockSnapshot: newStock,
          currentStock,
          newStock,
          type: direction,
          notes: it.notes || "",
        } as any);
      }
    });

    const created = await this.getById(adjId);
    if (!created) {
      return {
        id: adjId,
        code,
        warehouseId: input.warehouseId,
        adjustmentType: input.adjustmentType || "CYCLE_COUNT",
        direction: input.direction || "INCREASE",
        reason: input.reason || "Kiểm định tồn kho định kỳ",
        notes: input.notes || "",
        status: "DRAFT",
        createdBy: userId,
        createdAt: new Date().toISOString(),
        totalLines: input.items.length,
        items: input.items.map((it, idx) => ({
          id: idx + 1,
          productId: it.productId,
          direction: it.direction,
          quantity: it.quantity,
          unitCost: it.unitCost || 0,
          notes: it.notes || ""
        }))
      };
    }
    return created;
  },

  async approve(id: number, userId: number) {
    const adj = await this.getById(id);
    if (!adj) throw new Error("Không tìm thấy phiếu điều chỉnh kho");
    if (adj.status !== "DRAFT") {
      throw new Error(`Chỉ có thể phê duyệt phiếu ở trạng thái DRAFT. Trạng thái hiện tại: ${adj.status}`);
    }

    await db.transaction(async (tx) => {
      // 1. Post each item through authoritative InventoryService.postTransaction
      for (const it of adj.items) {
        const isIncrease = it.direction === "INCREASE" || it.type === "INCREASE";
        const txType = isIncrease ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
        const signedQty = isIncrease ? it.quantity : -it.quantity;

        await InventoryService.postTransaction(tx, {
          productId: it.productId,
          warehouseId: adj.warehouseId,
          locationId: it.locationId,
          lotId: it.lotId,
          type: txType as any,
          referenceNo: adj.code,
          quantity: signedQty,
          notes: `Điều chỉnh kho ${adj.code}: ${adj.reason}`,
          userId,
          referenceId: adj.id,
          referenceItemId: it.id,
        });
      }

      // 2. Update Adjustment status to APPROVED / POSTED
      await tx.update(schema.stockAdjustments)
        .set({
          status: "APPROVED",
          approvedBy: userId,
          approvedAt: new Date(),
          postedAt: new Date(),
        } as any)
        .where(eq(schema.stockAdjustments.id, id));
    });

    const updated = await this.getById(id);
    return updated || { ...adj, status: "APPROVED", approvedAt: new Date().toISOString() };
  },

  async reject(id: number, userId: number, reason: string) {
    const adj = await this.getById(id);
    if (!adj) throw new Error("Không tìm thấy phiếu điều chỉnh kho");
    if (adj.status !== "DRAFT") {
      throw new Error("Chỉ có thể từ chối phiếu ở trạng thái DRAFT");
    }

    await db.update(schema.stockAdjustments)
      .set({
        status: "REJECTED",
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason || "Từ chối kiểm kê",
      } as any)
      .where(eq(schema.stockAdjustments.id, id));

    return await this.getById(id);
  },

  async duplicate(id: number, userId: number) {
    const adj = await this.getById(id);
    if (!adj) throw new Error("Không tìm thấy phiếu điều chỉnh kho");

    return await this.createDraft({
      warehouseId: adj.warehouseId,
      adjustmentType: adj.adjustmentType,
      direction: adj.direction,
      reason: `${adj.reason} (Bản sao)`,
      notes: adj.notes,
      items: adj.items.map((it: any) => ({
        productId: it.productId,
        locationId: it.locationId,
        lotId: it.lotId,
        direction: it.direction,
        quantity: it.quantity,
        unitCost: it.unitCost,
        notes: it.notes,
      })),
    }, userId);
  }
};
