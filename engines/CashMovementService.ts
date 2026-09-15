import { db } from "../db/index";
import { cashMovements, cashShifts } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export type CashMovementType =
  | "OPENING_FLOAT"
  | "SALE_CASH"
  | "REFUND_CASH"
  | "CASH_IN"
  | "CASH_OUT"
  | "SAFE_DROP"
  | "HANDOVER_IN"
  | "HANDOVER_OUT";

export type CashDirection = "IN" | "OUT";

const SHIFT_REQUIRED_TYPES: ReadonlySet<CashMovementType> = new Set([
  "OPENING_FLOAT",
  "SALE_CASH",
  "REFUND_CASH",
  "CASH_IN",
  "CASH_OUT",
  "SAFE_DROP",
  "HANDOVER_IN",
  "HANDOVER_OUT",
]);

export interface PostMovementParams {
  shiftId: number | null;
  cashDrawerId: number;
  movementType: CashMovementType;
  amount: number;
  direction: CashDirection;
  custodianId: string;
  fromLocation?: string;
  toLocation?: string;
  referenceNo?: string;
  notes?: string;
  idempotencyKey?: string;
}

export interface CashMovementRecord {
  id: number;
  movementNo: string;
  shiftId: number | null;
  cashDrawerId: number;
  movementType: string;
  amount: number;
  direction: string;
  custodianId: string;
  fromLocation: string;
  toLocation: string;
  referenceNo: string | null;
  idempotencyKey: string;
  notes: string | null;
  createdAt: Date;
}

export class ShiftRequiredError extends Error {
  constructor(movementType: string) {
    super(
      `shiftId là bắt buộc cho movement_type="${movementType}". ` +
        `Không được ghi cash_movements với shift_id=null cho loại giao dịch này.`
    );
    this.name = "ShiftRequiredError";
  }
}

export class ShiftNotActiveError extends Error {
  constructor(shiftId: number, status: string) {
    super(
      `Shift #${shiftId} đang ở trạng thái "${status}", không phải ACTIVE. ` +
        `Không thể ghi cash movement mới vào ca đã đóng (immutability).`
    );
    this.name = "ShiftNotActiveError";
  }
}

export class CashMovementService {
  constructor(private readonly dbInstance: typeof db = db) {}

  async postMovement(params: PostMovementParams, txObj: any = this.dbInstance): Promise<CashMovementRecord> {
    if (SHIFT_REQUIRED_TYPES.has(params.movementType) && params.shiftId == null) {
      throw new ShiftRequiredError(params.movementType);
    }
    const idempotencyKey = params.idempotencyKey ?? randomUUID();
    const existing = await txObj.select().from(cashMovements).where(eq(cashMovements.idempotencyKey, idempotencyKey)).limit(1);
    if (existing.length > 0) {
      return existing[0] as unknown as CashMovementRecord;
    }

    if (params.shiftId != null) {
      const shifts = await txObj.select().from(cashShifts).where(eq(cashShifts.id, params.shiftId)).limit(1);
      if (shifts.length === 0) {
        throw new Error(`Shift #${params.shiftId} không tồn tại.`);
      }
      const shift = shifts[0];
      if (shift.status !== "ACTIVE" && shift.status !== "OPEN") {
        throw new ShiftNotActiveError(params.shiftId, shift.status);
      }
    }


    if (!(params.amount > 0)) {
      throw new Error(`amount phải là số dương. Nhận được: ${params.amount}`);
    }


    const movementNo = `CM-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const now = new Date();

    const record = await txObj.transaction(async (tx: any) => {
      const txExisting = await tx.select().from(cashMovements).where(eq(cashMovements.idempotencyKey, idempotencyKey)).limit(1);
      if (txExisting.length > 0) {
        return txExisting[0];
      }

      const inserted = await tx.insert(cashMovements).values({
        movementNo,
        shiftId: params.shiftId,
        cashDrawerId: params.cashDrawerId,
        movementType: params.movementType,
        amount: params.amount,
        direction: params.direction,
        custodianId: params.custodianId,
        fromLocation: params.fromLocation ?? "DRAWER",
        toLocation: params.toLocation ?? "DRAWER",
        referenceNo: params.referenceNo ?? null,
        idempotencyKey,
        notes: params.notes ?? null,
        createdAt: now,
      }).returning();

      return inserted[0];
    });

    return record as unknown as CashMovementRecord;
  }

  async getExpectedCash(shiftId: number): Promise<number> {
    const shiftList = await this.dbInstance.select().from(cashShifts).where(eq(cashShifts.id, shiftId)).limit(1);
    if (shiftList.length === 0) throw new Error(`Shift #${shiftId} không tồn tại.`);
    const openingFloat = shiftList[0].openingFloat || 0;

    const movements = await this.dbInstance.select().from(cashMovements).where(eq(cashMovements.shiftId, shiftId));
    let totalIn = 0;
    let totalOut = 0;
    for (const m of movements) {
      if (m.direction === 'IN') totalIn += m.amount;
      if (m.direction === 'OUT') totalOut += m.amount;
    }

    return totalIn - totalOut; // openingFloat is already recorded as an IN movement
  }

  async getShiftSummary(shiftId: number) {
    const expectedCash = await this.getExpectedCash(shiftId);
    const movements = await this.dbInstance.select().from(cashMovements).where(eq(cashMovements.shiftId, shiftId));
    
    const breakdownMap: Record<string, { movementType: string; direction: string; total: number }> = {};
    for (const m of movements) {
      const key = `${m.movementType}_${m.direction}`;
      if (!breakdownMap[key]) {
        breakdownMap[key] = { movementType: m.movementType, direction: m.direction, total: 0 };
      }
      breakdownMap[key].total += m.amount;
    }

    return {
      shiftId,
      expectedCash,
      breakdown: Object.values(breakdownMap)
    };
  }
}
