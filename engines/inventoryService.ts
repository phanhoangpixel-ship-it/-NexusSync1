import { db } from '../src/db';
import { stockLedger, stockBalances, products, lotBalances, warehouseLocations } from '../src/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { SerialEngine } from '../src/services/serialEngine';
import { masterDataCache } from '../src/services/masterDataCache';

export const InventoryService = {
  /**
   * Reserves available stock for an order without deducting physical inventory.
   * INVARIANT: Available ↓, Reserved ↑, Physical UNCHANGED.
   */
  async reserveStock(tx: any, params: {
    productId: number;
    warehouseId: number;
    locationId?: number | null;
    quantity: number;
    referenceNo: string;
    userId: number;
    notes?: string;
  }) {
    const { productId, warehouseId, locationId = null, quantity, referenceNo, userId, notes } = params;
    if (quantity <= 0) return;

    // Location resolution
    let effectiveLocationId: number | null = locationId || null;
    if (!locationId) {
      const defaultLoc = await tx.select().from(warehouseLocations)
        .where(and(eq(warehouseLocations.warehouseId, warehouseId), eq(warehouseLocations.isActive, true)))
        .limit(1);
      if (defaultLoc.length > 0) {
        effectiveLocationId = defaultLoc[0].id;
      }
    }

    const balanceConditions = [
      eq(stockBalances.productId, productId),
      eq(stockBalances.warehouseId, warehouseId)
    ];
    if (effectiveLocationId) {
      balanceConditions.push(eq(stockBalances.locationId, effectiveLocationId));
    } else {
      balanceConditions.push(isNull(stockBalances.locationId));
    }

    const existingBalance = await tx.select().from(stockBalances).where(and(...balanceConditions)).limit(1);

    if (existingBalance.length > 0) {
      const bal = existingBalance[0];
      if (bal.stockAvailable < quantity) {
        const prod = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
        const name = prod.length > 0 ? prod[0].name : `ID ${productId}`;
        throw new Error(`Tồn khả dụng không đủ để giữ chỗ cho sản phẩm ${name}. Khả dụng: ${bal.stockAvailable}, Yêu cầu giữ chỗ: ${quantity}.`);
      }

      await tx.update(stockBalances)
        .set({
          stockReserved: sql`${stockBalances.stockReserved} + ${quantity}`,
          stockAvailable: sql`${stockBalances.stockAvailable} - ${quantity}`
        })
        .where(eq(stockBalances.id, bal.id));
    } else {
      // Check product master stock
      const prod = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      const name = prod.length > 0 ? prod[0].name : `ID ${productId}`;
      const avail = prod.length > 0 ? (prod[0].stockAvailable ?? prod[0].stockPhysical ?? 0) : 0;
      if (avail < quantity) {
        throw new Error(`Tồn khả dụng không đủ để giữ chỗ cho sản phẩm ${name}. Khả dụng: ${avail}, Yêu cầu: ${quantity}.`);
      }

      await tx.insert(stockBalances).values({
        productId,
        warehouseId,
        locationId: effectiveLocationId,
        stockPhysical: Math.max(0, avail),
        stockAvailable: Math.max(0, avail - quantity),
        stockReserved: quantity
      });
    }

    // Update Global Product Stock Cache
    const allBalances = await tx.select().from(stockBalances).where(eq(stockBalances.productId, productId));
    const totalPhysical = allBalances.reduce((sum: number, b: any) => sum + (b.stockPhysical || 0), 0);
    const totalReserved = allBalances.reduce((sum: number, b: any) => sum + (b.stockReserved || 0), 0);

    await tx.update(products)
      .set({
        stockPhysical: totalPhysical,
        stockReserved: totalReserved,
        stockAvailable: Math.max(0, totalPhysical - totalReserved)
      })
      .where(eq(products.id, productId));

    masterDataCache.invalidateByTag('products');
  },

  /**
   * Releases stock reservation (e.g. order cancelled or returned).
   * INVARIANT: Available ↑, Reserved ↓, Physical UNCHANGED.
   */
  async releaseReservation(tx: any, params: {
    productId: number;
    warehouseId: number;
    locationId?: number | null;
    quantity: number;
    referenceNo: string;
    userId: number;
    notes?: string;
  }) {
    const { productId, warehouseId, locationId = null, quantity, referenceNo, userId, notes } = params;
    if (quantity <= 0) return;

    let effectiveLocationId: number | null = locationId || null;
    if (!locationId) {
      const defaultLoc = await tx.select().from(warehouseLocations)
        .where(and(eq(warehouseLocations.warehouseId, warehouseId), eq(warehouseLocations.isActive, true)))
        .limit(1);
      if (defaultLoc.length > 0) {
        effectiveLocationId = defaultLoc[0].id;
      }
    }

    const balanceConditions = [
      eq(stockBalances.productId, productId),
      eq(stockBalances.warehouseId, warehouseId)
    ];
    if (effectiveLocationId) {
      balanceConditions.push(eq(stockBalances.locationId, effectiveLocationId));
    } else {
      balanceConditions.push(isNull(stockBalances.locationId));
    }

    const existingBalance = await tx.select().from(stockBalances).where(and(...balanceConditions)).limit(1);

    if (existingBalance.length > 0) {
      const bal = existingBalance[0];
      const newReserved = Math.max(0, bal.stockReserved - quantity);
      const newAvail = bal.stockPhysical - newReserved;

      await tx.update(stockBalances)
        .set({
          stockReserved: newReserved,
          stockAvailable: newAvail
        })
        .where(eq(stockBalances.id, bal.id));
    }

    // Update Global Product Stock Cache
    const allBalances = await tx.select().from(stockBalances).where(eq(stockBalances.productId, productId));
    const totalPhysical = allBalances.reduce((sum: number, b: any) => sum + (b.stockPhysical || 0), 0);
    const totalReserved = allBalances.reduce((sum: number, b: any) => sum + (b.stockReserved || 0), 0);

    await tx.update(products)
      .set({
        stockPhysical: totalPhysical,
        stockReserved: totalReserved,
        stockAvailable: Math.max(0, totalPhysical - totalReserved)
      })
      .where(eq(products.id, productId));

    masterDataCache.invalidateByTag('products');
  },

  /**
   * Logs a transaction to the stock ledger and updates stock balances globally.
   * Ensures atomic-like behavior for standard inventory movements.
   * Promotes (Product + Warehouse + Location) as Primary Inventory Dimension.
   */
  async postTransaction(tx: any, params: {
    productId: number;
    warehouseId: number;
    locationId?: number | null;
    lotId?: number | null;
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'SALE' | 'PURCHASE' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'SALES_RETURN' | 'PURCHASE_RETURN' | 'GOODS_RECEIPT' | 'GOODS_ISSUE';
    referenceNo: string;
    quantity: number; // MUST BE POSITIVE FOR 'IN', NEGATIVE FOR 'OUT'
    notes?: string;
    userId: number;
    serials?: string[];
    referenceId?: number;
    referenceItemId?: number;
    serialTargetStatus?: string;
    deductReserved?: boolean; // When true (e.g. online order completion), also deducts from stockReserved
  }) {
    const outTypes = ['OUT', 'SALE', 'TRANSFER_OUT', 'ADJUSTMENT_OUT', 'PURCHASE_RETURN', 'GOODS_ISSUE'];
    const inTypes = ['IN', 'PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'SALES_RETURN', 'GOODS_RECEIPT'];

    if (outTypes.includes(params.type) && params.quantity > 0) {
       params.quantity = -params.quantity; // Auto-correct to negative if OUT
    } else if (inTypes.includes(params.type) && params.quantity < 0) {
       params.quantity = Math.abs(params.quantity); // Auto-correct to positive if IN
    }

    const { productId, warehouseId, locationId = null, lotId = null, type, referenceNo, quantity, notes, userId, serials = [], referenceId = 0, referenceItemId = 0, serialTargetStatus, deductReserved = false } = params;

    // -1. Location Validation & Default Location Resolution
    let effectiveLocationId: number | null = locationId || null;
    if (locationId) {
      const locCheck = await tx.select().from(warehouseLocations).where(eq(warehouseLocations.id, locationId)).limit(1);
      if (locCheck.length === 0) {
        throw new Error(`Location ID ${locationId} không tồn tại`);
      }
      if (locCheck[0].warehouseId !== warehouseId) {
        throw new Error(`Location ID ${locationId} không thuộc Kho ID ${warehouseId}`);
      }
    } else {
      // Resolve default location for this warehouse if available
      const defaultLoc = await tx.select().from(warehouseLocations)
        .where(and(eq(warehouseLocations.warehouseId, warehouseId), eq(warehouseLocations.isActive, true)))
        .limit(1);
      if (defaultLoc.length > 0) {
        effectiveLocationId = defaultLoc[0].id;
      }
    }

    // 0. Serial Validation & Processing
    const productArr = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
    if (productArr.length === 0) throw new Error("Sản phẩm không tồn tại");
    const product = productArr[0];

    if (product.isSerialTracked) {
        if (!serials || serials.length !== Math.abs(quantity)) {
            throw new Error(`Sản phẩm ${product.name} quản lý theo Serial. Cần đúng ${Math.abs(quantity)} serials, nhưng nhận được ${serials ? serials.length : 0}.`);
        }
        if (inTypes.includes(type)) {
            if (type === 'TRANSFER_IN') {
                await SerialEngine.receiveFromTransit(tx, serials, productId, warehouseId, referenceId, referenceItemId, userId, effectiveLocationId);
            } else {
                await SerialEngine.receiveSerials(tx, serials, productId, warehouseId, type, referenceId, referenceItemId, userId, notes, effectiveLocationId);
            }
        } else if (outTypes.includes(type)) {
            if (type === 'TRANSFER_OUT') {
                await SerialEngine.transferToTransit(tx, serials, productId, warehouseId, referenceId, referenceItemId, userId, effectiveLocationId);
            } else {
                await SerialEngine.issueSerials(tx, serials, productId, warehouseId, type, referenceId, referenceItemId, userId, notes, effectiveLocationId, serialTargetStatus);
            }
        }
    }

    // 1. Find existing balance using (productId + warehouseId + effectiveLocationId) as primary dimension
    const balanceConditions = [
      eq(stockBalances.productId, productId),
      eq(stockBalances.warehouseId, warehouseId)
    ];
    if (effectiveLocationId) {
      balanceConditions.push(eq(stockBalances.locationId, effectiveLocationId));
    } else {
      balanceConditions.push(isNull(stockBalances.locationId));
    }

    const existingBalance = await tx.select().from(stockBalances).where(and(...balanceConditions)).limit(1);

    let currentPhysical = 0;
    let balanceId = null;

    if (existingBalance.length > 0) {
      currentPhysical = existingBalance[0].stockPhysical;
      balanceId = existingBalance[0].id;
      
      if (quantity < 0 && !deductReserved && existingBalance[0].stockAvailable < Math.abs(quantity) && type !== 'ADJUSTMENT') {
         // Allow raw 'ADJUSTMENT' override if explicit, but enforce guard on ADJUSTMENT_OUT
         const locInfo = effectiveLocationId ? ` (Location ID ${effectiveLocationId})` : '';
         throw new Error(`Insufficient available stock for product ${product.name} at warehouse ID ${warehouseId}${locInfo}. Available: ${existingBalance[0].stockAvailable}, Requested: ${Math.abs(quantity)}.`);
      }

      if (deductReserved && quantity < 0) {
        // Issuing previously reserved stock: Physical ↓, Reserved ↓, Available = Physical - Reserved
        const absQty = Math.abs(quantity);
        const newPhys = Math.max(0, existingBalance[0].stockPhysical - absQty);
        const newRes = Math.max(0, existingBalance[0].stockReserved - absQty);
        await tx.update(stockBalances)
          .set({
            stockPhysical: newPhys,
            stockReserved: newRes,
            stockAvailable: Math.max(0, newPhys - newRes)
          })
          .where(eq(stockBalances.id, balanceId));
      } else {
        await tx.update(stockBalances)
          .set({
            stockPhysical: sql`${stockBalances.stockPhysical} + ${quantity}`,
            stockAvailable: sql`${stockBalances.stockAvailable} + ${quantity}`
          })
          .where(eq(stockBalances.id, balanceId));
      }
    } else {
      if (quantity < 0 && type !== 'ADJUSTMENT') {
         const locInfo = effectiveLocationId ? ` (Location ID ${effectiveLocationId})` : '';
         throw new Error(`Cannot issue ${Math.abs(quantity)} for product ${product.name}. No stock balance exists at warehouse ID ${warehouseId}${locInfo}.`);
      }
      
      const newBalance = await tx.insert(stockBalances).values({
        productId,
        warehouseId,
        locationId: effectiveLocationId,
        stockPhysical: Math.max(0, quantity),
        stockAvailable: Math.max(0, quantity),
        stockReserved: 0
      }).returning();
      balanceId = newBalance[0].id;
    }

    const balanceAfter = currentPhysical + quantity;

    // 2. Insert Stock Ledger Entry
    await tx.insert(stockLedger).values({
      productId,
      warehouseId,
      locationId: effectiveLocationId,
      lotId: lotId || null,
      type,
      referenceNo,
      quantity,
      balanceAfter,
      notes,
      userId
    });

    // 3. Update Lot Balances if Lot ID is provided
    if (lotId) {
      const lotConditions = [
        eq(lotBalances.lotId, lotId),
        eq(lotBalances.productId, productId),
        eq(lotBalances.warehouseId, warehouseId)
      ];
      if (effectiveLocationId) {
        lotConditions.push(eq(lotBalances.locationId, effectiveLocationId));
      } else {
        lotConditions.push(isNull(lotBalances.locationId));
      }

      const existingLotBal = await tx.select().from(lotBalances).where(and(...lotConditions)).limit(1);
      if (existingLotBal.length > 0) {
        if (quantity < 0 && existingLotBal[0].stockAvailable < Math.abs(quantity) && type !== 'ADJUSTMENT') {
          throw new Error(`Insufficient available stock for Lot ID ${lotId}. Available: ${existingLotBal[0].stockAvailable}, Requested: ${Math.abs(quantity)}.`);
        }
        const newLotPhys = Math.max(0, existingLotBal[0].stockPhysical + quantity);
        const newLotAvail = Math.max(0, existingLotBal[0].stockAvailable + quantity);
        await tx.update(lotBalances).set({
          stockPhysical: newLotPhys,
          stockAvailable: newLotAvail,
          updatedAt: new Date()
        }).where(eq(lotBalances.id, existingLotBal[0].id));
      } else if (quantity > 0) {
        await tx.insert(lotBalances).values({
          lotId,
          productId,
          warehouseId,
          locationId: effectiveLocationId,
          stockPhysical: quantity,
          stockAvailable: quantity,
          stockReserved: 0
        });
      } else if (type !== 'ADJUSTMENT') {
        throw new Error(`Cannot issue ${Math.abs(quantity)} from Lot ID ${lotId}. No lot balance exists at warehouse ID ${warehouseId}.`);
      }
    }

    // 4. Update Global Product Stock Cache (Atomic synchronization)
    const allBalances = await tx.select().from(stockBalances).where(eq(stockBalances.productId, productId));
    const totalPhysical = allBalances.reduce((sum: number, b: any) => sum + (b.stockPhysical || 0), 0);
    const totalReserved = allBalances.reduce((sum: number, b: any) => sum + (b.stockReserved || 0), 0);
    
    await tx.update(products)
      .set({ 
        stockPhysical: totalPhysical, 
        stockReserved: totalReserved, 
        stockAvailable: Math.max(0, totalPhysical - totalReserved) 
      })
      .where(eq(products.id, productId));

    masterDataCache.invalidateByTag('products');
  }
};
