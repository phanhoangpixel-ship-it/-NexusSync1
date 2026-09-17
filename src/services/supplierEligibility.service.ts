import { db } from '../db';
import { suppliers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Request, Response, NextFunction } from 'express';

export interface SupplierEligibilityResult {
  eligible: boolean;
  code: 'ELIGIBLE' | 'SUPPLIER_NOT_FOUND' | 'SUPPLIER_INACTIVE' | 'SUPPLIER_BLACKLISTED' | 'SUPPLIER_BLOCKED' | 'SUPPLIER_ARCHIVED' | 'SUPPLIER_NOT_QUALIFIED';
  message: string;
  supplier?: {
    id: number;
    code: string;
    name: string;
    status: string;
    performanceTier?: string | null;
    compositeScore?: number | null;
  };
}

/**
 * Validates supplier eligibility for Sourcing & RFQ invitation against M09 Master Data:
 * - Supplier must exist in M09 (Single Source of Truth)
 * - Must NOT be INACTIVE
 * - Must NOT be BLACKLISTED or BLOCKED
 * - Must NOT be ARCHIVED
 * - Must have completed qualification approval (not PENDING_APPROVAL, PENDING_QUALIFICATION, UNQUALIFIED)
 * - Must maintain acceptable performance threshold (compositeScore >= 50)
 */
export async function verifySupplierEligibility(supplierId: number): Promise<SupplierEligibilityResult> {
  if (!supplierId || isNaN(Number(supplierId))) {
    return {
      eligible: false,
      code: 'SUPPLIER_NOT_FOUND',
      message: 'Mã nhà cung cấp không hợp lệ hoặc bị thiếu.'
    };
  }

  const existing = await db.select().from(suppliers).where(eq(suppliers.id, Number(supplierId))).limit(1);
  if (existing.length === 0) {
    return {
      eligible: false,
      code: 'SUPPLIER_NOT_FOUND',
      message: `Không tìm thấy hồ sơ nhà cung cấp #${supplierId} trong hệ thống Master Data M09.`
    };
  }

  const sup = existing[0];
  const statusUpper = (sup.status || '').toUpperCase().trim();

  // 1. INACTIVE check
  if (statusUpper === 'INACTIVE') {
    return {
      eligible: false,
      code: 'SUPPLIER_INACTIVE',
      message: `Nhà cung cấp "${sup.name}" (${sup.code}) đang ở trạng thái INACTIVE (Ngừng hoạt động). Hệ thống M10 từ chối gửi thư mời thầu.`,
      supplier: {
        id: sup.id,
        code: sup.code,
        name: sup.name,
        status: sup.status,
        performanceTier: sup.performanceTier,
        compositeScore: sup.compositeScore
      }
    };
  }

  // 2. BLACKLISTED / BLOCKED check
  if (['BLACKLISTED', 'BLOCKED'].includes(statusUpper)) {
    return {
      eligible: false,
      code: 'SUPPLIER_BLACKLISTED',
      message: `CẢNH BÁO VI PHẠM: Nhà cung cấp "${sup.name}" (${sup.code}) thuộc danh sách đen (BLACKLISTED/BLOCKED) do vi phạm quy chế hoặc không đạt chuẩn tuân thủ. Nghiêm cấm mời thầu!`,
      supplier: {
        id: sup.id,
        code: sup.code,
        name: sup.name,
        status: sup.status,
        performanceTier: sup.performanceTier,
        compositeScore: sup.compositeScore
      }
    };
  }

  // 3. ARCHIVED check
  if (statusUpper === 'ARCHIVED') {
    return {
      eligible: false,
      code: 'SUPPLIER_ARCHIVED',
      message: `Nhà cung cấp "${sup.name}" (${sup.code}) đã được lưu trữ/ngừng hợp tác (ARCHIVED). Không được phép tham gia đấu thầu mới.`,
      supplier: {
        id: sup.id,
        code: sup.code,
        name: sup.name,
        status: sup.status,
        performanceTier: sup.performanceTier,
        compositeScore: sup.compositeScore
      }
    };
  }

  // 4. Qualification / Approval status check
  if (['PENDING', 'PENDING_APPROVAL', 'PENDING_QUALIFICATION', 'UNQUALIFIED', 'PROSPECT', 'ONBOARDING'].includes(statusUpper)) {
    return {
      eligible: false,
      code: 'SUPPLIER_NOT_QUALIFIED',
      message: `Nhà cung cấp "${sup.name}" (${sup.code}) chưa qua phê duyệt năng lực hoặc hồ sơ đang chờ thẩm định (${sup.status}). Yêu cầu hoàn tất đánh giá thẩm định nhà cung cấp M09/M11 trước khi mời thầu.`,
      supplier: {
        id: sup.id,
        code: sup.code,
        name: sup.name,
        status: sup.status,
        performanceTier: sup.performanceTier,
        compositeScore: sup.compositeScore
      }
    };
  }

  // 5. Performance composite score threshold (min 50 points)
  if (sup.compositeScore !== null && sup.compositeScore !== undefined && sup.compositeScore < 50) {
    return {
      eligible: false,
      code: 'SUPPLIER_NOT_QUALIFIED',
      message: `Nhà cung cấp "${sup.name}" (${sup.code}) có điểm năng lực tổng hợp (${sup.compositeScore}/100) dưới ngưỡng tối thiểu 50 điểm. Cần tái thẩm định năng lực trước khi mời thầu.`,
      supplier: {
        id: sup.id,
        code: sup.code,
        name: sup.name,
        status: sup.status,
        performanceTier: sup.performanceTier,
        compositeScore: sup.compositeScore
      }
    };
  }

  return {
    eligible: true,
    code: 'ELIGIBLE',
    message: `Nhà cung cấp "${sup.name}" (${sup.code}) đủ điều kiện năng lực tham gia đấu thầu.`,
    supplier: {
      id: sup.id,
      code: sup.code,
      name: sup.name,
      status: sup.status,
      performanceTier: sup.performanceTier,
      compositeScore: sup.compositeScore
    }
  };
}

/**
 * Express Middleware: requireEligibleSupplier
 * Intercepts requests that invite or assign suppliers to RFQs/Sourcing packages.
 * Intercepts and blocks ineligible suppliers with HTTP 422.
 */
export async function requireEligibleSupplier(req: Request, res: Response, next: NextFunction) {
  const rawId = req.body?.supplierId || req.params?.supplierId || req.query?.supplierId;
  const supplierId = Number(rawId);

  if (!rawId || isNaN(supplierId)) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_SUPPLIER_ID',
      message: 'Thiếu thông tin mã nhà cung cấp (supplierId).'
    });
  }

  try {
    const result = await verifySupplierEligibility(supplierId);
    if (!result.eligible) {
      return res.status(422).json({
        success: false,
        error: 'SUPPLIER_INELIGIBLE',
        code: result.code,
        message: result.message,
        supplier: result.supplier
      });
    }

    // Attach validated supplier to request context for downstream handlers
    (req as any).eligibleSupplier = result.supplier;
    next();
  } catch (err: any) {
    console.error('Error in requireEligibleSupplier middleware:', err);
    return res.status(500).json({
      success: false,
      error: 'ELIGIBILITY_CHECK_FAILED',
      message: 'Lỗi kiểm tra tính hợp lệ của nhà cung cấp',
      detail: err.message
    });
  }
}
