import { Router } from "express";
import { ShiftEngine, DenominationLine } from "../../engines/shiftEngine";
import { CashMovementService } from "../../engines/CashMovementService";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { db } from "../../db/index";
import { cashShifts, cashVariances, cashMovements } from "../../db/schema";
import { eq, and, or } from "drizzle-orm";

const router = Router();

// Lấy danh sách ca đang hoạt động hoặc chờ đối soát
router.get("/active", requireAuth, async (req, res) => {
  try {
    const shifts = await ShiftEngine.getActiveShifts();
    res.json(shifts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy lịch sử ca đã chốt
router.get("/history", requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'CASHIER', 'AUDITOR', 'FINANCE'), async (req, res) => {
  try {
    const filters = {
      employeeId: req.query.employeeId,
      page: req.query.page,
      pageSize: req.query.pageSize,
    };
    const shifts = await ShiftEngine.getClosedShifts(filters);
    res.json(shifts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy chi tiết ca
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const shift = await ShiftEngine.getShiftDetail(req.params.id);
    res.json(shift);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy tổng quan ca và chuyển động dòng tiền
router.get("/:id/summary", requireAuth, async (req, res) => {
  try {
    const shiftIdParam = req.params.id;
    const shiftRow = await db.select().from(cashShifts).where(or(eq(cashShifts.id, Number(shiftIdParam) || 0), eq(cashShifts.shiftNo, shiftIdParam))).limit(1);
    if (!shiftRow.length) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    const s = shiftRow[0];
    const movements = await db.select().from(cashMovements).where(eq(cashMovements.shiftId, s.id));
    const expected = await ShiftEngine.reconstructExpectedCash(s.id, db);

    res.json({
      shift: s,
      movements,
      reconstructedExpectedCash: expected
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mở ca
router.post("/open", requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'CASHIER'), async (req, res) => {
  try {
    const user = (req as any).user;
    const { cashDrawerId, notes } = req.body;
    const cashierUserId = req.body.cashierUserId || String(user?.id || '1');
    const cashierName = req.body.cashierName || user?.name || user?.username || 'Thu ngân Mặc định';
    const openingFloat = req.body.openingFloat !== undefined ? Number(req.body.openingFloat) : 2000000;

    const shift = await ShiftEngine.openShift({
      cashDrawerId: cashDrawerId ? Number(cashDrawerId) : 1,
      cashierUserId,
      cashierName,
      openingFloat,
      notes
    });
    res.json(shift);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Đóng và đối soát ca
const handleCloseShift = async (req: any, res: any) => {
  try {
    const shiftId = req.params.id || req.body.shiftId;
    if (!shiftId) {
      return res.status(400).json({ error: 'Thiếu mã ca làm việc (shiftId).' });
    }
    let denominations: DenominationLine[] = req.body.denominations;
    const { notes } = req.body;
    const actualCash = req.body.actualCash !== undefined ? req.body.actualCash : req.body.actualCashCount;
    
    if (!denominations && actualCash !== undefined) {
      denominations = [{ denomination: Number(actualCash) || 0, quantity: 1 }];
    }
    
    const shift = await ShiftEngine.closeShift(
      shiftId, 
      denominations, 
      notes, 
      actualCash !== undefined && actualCash !== null && !isNaN(Number(actualCash)) ? Number(actualCash) : undefined
    );
    res.json(shift);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

router.post("/close", requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'CASHIER'), handleCloseShift);
router.post("/:id/close", requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'CASHIER'), handleCloseShift);

// Ghi nhận chuyển động dòng tiền thủ công hoặc từ bán hàng
router.post("/cash-movement", requireAuth, async (req, res) => {
  try {
    const { shiftId, cashDrawerId, movementType, amount, direction, custodianId, orderId, notes, idempotencyKey } = req.body;
    
    const mov = await new CashMovementService().postMovement({
      shiftId: shiftId ? Number(shiftId) : null,
      cashDrawerId: cashDrawerId ? Number(cashDrawerId) : 1,
      movementType: (movementType || 'CASH_IN') as any,
      amount: Number(amount) || 0,
      direction: direction || 'IN',
      custodianId: custodianId || '1',
      fromLocation: req.body.fromLocation || 'DRAWER',
      toLocation: req.body.toLocation || 'DRAWER',
      referenceNo: orderId ? String(orderId) : undefined,
      idempotencyKey: idempotencyKey || `MOV-${Date.now()}-${Math.random()}`,
      notes: notes || ''
    });

    res.json(mov);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Phê duyệt hoặc Từ chối Chênh lệch Ca (Variance Approval / Rejection Workflow)
router.post("/:id/approve-variance", requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'BRANCH_OWNER', 'FINANCE'), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Không tìm thấy thông tin xác thực người dùng.' });
    }

    const approverId = user.id;
    const approverRole = user.role;
    const { decision, reviewNotes } = req.body; // decision: 'APPROVE' | 'REJECT'

    if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
      return res.status(400).json({ error: 'Quyết định (decision) phải là APPROVE hoặc REJECT' });
    }

    const shiftIdParam = req.params.id;
    const shiftRow = await db.select().from(cashShifts).where(or(eq(cashShifts.id, Number(shiftIdParam) || 0), eq(cashShifts.shiftNo, shiftIdParam))).limit(1);
    if (!shiftRow.length) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const shift = shiftRow[0];

    // 1. Separation of Duties (SoD) check: Approver cannot be the cashier of the same shift
    // Note: compare both numeric id and string identifier if applicable
    if (String(approverId) === String(shift.cashierUserId)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Vi phạm phân nhiệm (SoD): Thu ngân không được phép tự phê duyệt chênh lệch ca do chính mình phụ trách!'
      });
    }

    // 2. Atomic check-and-act using conditional update WHERE status = 'PENDING_RECONCILIATION'
    const targetStatus = decision === 'APPROVE' ? 'CLOSED' : 'PENDING_RECONCILIATION';
    const resolutionStatus = decision === 'APPROVE' ? 'RESOLVED' : 'REJECTED_COUNT_AGAIN';

    const updated = await db.transaction(async (tx) => {
      // Atomic conditional update
      const updateResult = await (tx.update(cashShifts) as any)
        .set({
          status: targetStatus,
          closedAt: decision === 'APPROVE' ? new Date() : shift.closedAt,
          notes: `${shift.notes || ''} [${decision === 'APPROVE' ? 'Đã duyệt chênh lệch' : 'Từ chối chênh lệch - Yêu cầu đếm lại'} bởi Quản lý ID:${approverId} (${approverRole}): ${reviewNotes || 'N/A'}]`
        })
        .where(and(eq(cashShifts.id, shift.id), eq(cashShifts.status, 'PENDING_RECONCILIATION')))
        .returning();

      if (!updateResult.length) {
        throw new Error('Variance đã được xử lý hoặc ca không ở trạng thái chờ đối soát.');
      }

      await (tx.update(cashVariances) as any)
        .set({
          status: decision === 'APPROVE' ? 'RESOLVED' : 'REJECTED_COUNT_AGAIN',
          reviewNotes: reviewNotes || (decision === 'APPROVE' ? 'Đã duyệt chênh lệch' : 'Từ chối, yêu cầu thu ngân kiểm đếm lại')
        })
        .where(eq(cashVariances.shiftId, shift.id));

      return updateResult[0];
    });

    res.json({
      success: true,
      decision,
      shift: updated,
      message: decision === 'APPROVE' ? 'Đã phê duyệt chênh lệch và đóng ca thành công.' : 'Đã từ chối chênh lệch, yêu cầu đếm lại quỹ két.'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
