import { eq, and, inArray } from "drizzle-orm";
import { serialNumbers, serialHistory, serialTransactions } from "../db/schema";

export const SerialEngine = {
  /**
   * Validate that all requested serials for an issue/sale are currently IN_STOCK 
   * at the specified warehouse and belong to the specified product.
   */
  validateSerialsForIssue: async (db: any, serialStrings: string[], productId: number, warehouseId: number, locationId?: number | null) => {
    if (!serialStrings || serialStrings.length === 0) return true;

    // Fetch serials
    const serials = await db.select().from(serialNumbers)
      .where(inArray(serialNumbers.serialNumber, serialStrings));

    if (serials.length !== serialStrings.length) {
      const foundSn = serials.map((s: any) => s.serialNumber);
      const missingSn = serialStrings.filter((s: string) => !foundSn.includes(s));
      throw new Error(`Các số Serial sau không tồn tại: ${missingSn.join(', ')}`);
    }

    for (const s of serials) {
      if (s.productId !== productId) {
        throw new Error(`Serial ${s.serialNumber} không thuộc sản phẩm yêu cầu.`);
      }
      if (s.warehouseId !== warehouseId) {
        throw new Error(`Serial ${s.serialNumber} không nằm trong kho xuất.`);
      }
      if (locationId != null && s.locationId != null && s.locationId !== locationId) {
        throw new Error(`Serial ${s.serialNumber} không nằm tại vị trí (location) yêu cầu.`);
      }
      if (s.status !== 'IN_STOCK') {
        throw new Error(`Serial ${s.serialNumber} đang ở trạng thái ${s.status}, không thể xuất.`);
      }
    }

    return serials;
  },

  /**
   * Receive Serials into a warehouse
   */
  receiveSerials: async (tx: any, serialStrings: string[], productId: number, warehouseId: number, transactionType: string, refId: number, refItemId: number, userId: number, notes?: string, locationId?: number | null) => {
    if (!serialStrings || serialStrings.length === 0) return;

    // Check for duplicates in input array
    const uniqueSerials = new Set(serialStrings);
    if (uniqueSerials.size !== serialStrings.length) {
      throw new Error(`Danh sách serial có phần tử trùng lặp.`);
    }

    // Check existing in DB
    const existing = await tx.select().from(serialNumbers).where(inArray(serialNumbers.serialNumber, serialStrings));
    for (const snRecord of existing) {
      if (snRecord.status === 'IN_STOCK') {
        throw new Error(`Serial ${snRecord.serialNumber} đã tồn tại ở trạng thái IN_STOCK trong kho ID ${snRecord.warehouseId}.`);
      }
    }

    for (const sn of serialStrings) {
      const match = existing.find((e: any) => e.serialNumber === sn);
      let serialId: number;

      if (match) {
        // Re-activate serial back into IN_STOCK
        await tx.update(serialNumbers).set({
          status: "IN_STOCK",
          productId,
          warehouseId,
          locationId: locationId || null,
          updatedAt: new Date()
        }).where(eq(serialNumbers.id, match.id));
        serialId = match.id;
      } else {
        // Create new serial
        const [inserted] = await tx.insert(serialNumbers).values({
          serialNumber: sn,
          productId,
          warehouseId,
          locationId: locationId || null,
          status: "IN_STOCK",
          createdBy: userId
        }).returning();
        serialId = inserted.id;
      }

      // Record History
      await tx.insert(serialHistory).values({
        serialId,
        action: "INWARD",
        toWarehouseId: warehouseId,
        toStatus: "IN_STOCK",
        notes: notes || `Nhập kho từ ${transactionType}`,
        performedBy: userId
      });

      // Record Transaction mapping
      await tx.insert(serialTransactions).values({
        serialId,
        transactionType,
        referenceId: refId,
        referenceItemId: refItemId
      });
    }
  },

  /**
   * Issue Serials from a warehouse
   */
  issueSerials: async (tx: any, serialStrings: string[], productId: number, warehouseId: number, transactionType: string, refId: number, refItemId: number, userId: number, notes?: string, locationId?: number | null, targetStatus?: string) => {
    if (!serialStrings || serialStrings.length === 0) return;

    // Validate first
    const serials = await SerialEngine.validateSerialsForIssue(tx, serialStrings, productId, warehouseId, locationId);

    for (const s of serials) {
      // Determine new status
      let newStatus = targetStatus;
      if (!newStatus) {
        newStatus = transactionType === 'SALE' ? 'SOLD' : 'ISSUED';
      }
      
      await tx.update(serialNumbers).set({
        status: newStatus,
        warehouseId: newStatus === 'SOLD' ? null : s.warehouseId, // If sold, no longer in warehouse physically
        locationId: newStatus === 'SOLD' ? null : (locationId !== undefined ? locationId : s.locationId)
      }).where(eq(serialNumbers.id, s.id));

      // Record History
      await tx.insert(serialHistory).values({
        serialId: s.id,
        action: transactionType === 'SALE' ? 'SOLD' : 'OUTWARD',
        fromWarehouseId: s.warehouseId,
        fromStatus: s.status,
        toStatus: newStatus,
        notes: notes || `Xuất kho từ ${transactionType}`,
        performedBy: userId
      });

      // Record Transaction mapping
      await tx.insert(serialTransactions).values({
        serialId: s.id,
        transactionType,
        referenceId: refId,
        referenceItemId: refItemId
      });
    }
  },
  
  /**
   * Transfer Serials to Transit
   */
  transferToTransit: async (tx: any, serialStrings: string[], productId: number, fromWarehouseId: number, refId: number, refItemId: number, userId: number, locationId?: number | null) => {
     if (!serialStrings || serialStrings.length === 0) return;

     const serials = await SerialEngine.validateSerialsForIssue(tx, serialStrings, productId, fromWarehouseId);

     for (const s of serials) {
      await tx.update(serialNumbers).set({
        status: 'IN_TRANSIT',
        locationId: null
      }).where(eq(serialNumbers.id, s.id));

      await tx.insert(serialHistory).values({
        serialId: s.id,
        action: 'TRANSFER_OUT',
        fromWarehouseId: s.warehouseId,
        fromStatus: s.status,
        toStatus: 'IN_TRANSIT',
        notes: `Chuyển kho IN_TRANSIT, phiếu ${refId}`,
        performedBy: userId
      });

      await tx.insert(serialTransactions).values({
        serialId: s.id,
        transactionType: 'TRANSFER_OUT',
        referenceId: refId,
        referenceItemId: refItemId
      });
     }
  },
  
  /**
   * Receive Serials from Transit
   */
  receiveFromTransit: async (tx: any, serialStrings: string[], productId: number, toWarehouseId: number, refId: number, refItemId: number, userId: number, toLocationId?: number | null) => {
    if (!serialStrings || serialStrings.length === 0) return;

    const serials = await tx.select().from(serialNumbers)
      .where(inArray(serialNumbers.serialNumber, serialStrings));

    for (const s of serials) {
      if (s.status !== 'IN_TRANSIT') {
        throw new Error(`Serial ${s.serialNumber} không ở trạng thái IN_TRANSIT.`);
      }

      await tx.update(serialNumbers).set({
        status: 'IN_STOCK',
        warehouseId: toWarehouseId,
        locationId: toLocationId || null
      }).where(eq(serialNumbers.id, s.id));

      await tx.insert(serialHistory).values({
        serialId: s.id,
        action: 'TRANSFER_IN',
        toWarehouseId,
        fromStatus: s.status,
        toStatus: 'IN_STOCK',
        notes: `Nhận điều chuyển, phiếu ${refId}`,
        performedBy: userId
      });

      await tx.insert(serialTransactions).values({
        serialId: s.id,
        transactionType: 'TRANSFER_IN',
        referenceId: refId,
        referenceItemId: refItemId
      });
    }
  }
};
