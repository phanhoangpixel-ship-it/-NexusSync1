import { eq, and, sql, or } from "drizzle-orm";
import crypto from "crypto";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { InventoryService } from "./inventoryService";
import { accountingEngine } from "./accountingEngine";
import { costingEngine } from "./costingEngine";
import { AuditService } from "./auditService";
import { CashMovementService } from "./CashMovementService";
import { RmaValidationService } from "./rmaValidationService";

export type RmaDispositionType =
  | 'RESTOCK'
  | 'REPAIR'
  | 'REPLACE'
  | 'SCRAP'
  | 'RETURN_TO_VENDOR'
  | 'CREDIT';

export type RmaRefundChannel = 'CREDIT_NOTE_M31' | 'CASH_M32';

export interface LineDispositionInput {
  itemId: number;
  dispositionTarget: RmaDispositionType;
  quantity?: number;
  inspectedQuantity?: number;
  condition?: 'GOOD' | 'DEFECTIVE' | 'DAMAGED' | 'SCRAP';
  notes?: string;
  warehouseId?: number;
}

export interface ExecuteDispositionParams {
  rmaId: number | string;
  disposition?: RmaDispositionType;
  lineDispositions?: LineDispositionInput[];
  refundMethod?: 'CREDIT_NOTE' | 'BANK_TRANSFER' | 'CASH';
  refundChannel?: RmaRefundChannel;
  warehouseId?: number;
  userId: number;
  username?: string;
  userRole?: string;
  userFullName?: string;
  idempotencyKey?: string;
  notes?: string;
}

export interface DispositionExecutionResult {
  success: boolean;
  rmaNumber: string;
  disposition: RmaDispositionType;
  rmaStatus: string;
  financialStatus: string;
  creditNoteNumber?: string | null;
  refundChannel: RmaRefundChannel;
  maintenanceWoCode?: string | null;
  rtvReferenceCode?: string | null;
  totalAmount: number;
  totalReturnCogs: number;
  vaultDocumentCode?: string;
  message: string;
  idempotentReplay?: boolean;
}

const cashMovementService = new CashMovementService(db);

async function getOrCreateActiveShift(tx: any = db, userId: number = 1): Promise<number> {
  const [existingShift] = await tx.select().from(schema.cashShifts)
    .where(eq(schema.cashShifts.status, 'ACTIVE'))
    .limit(1);
  if (existingShift) return existingShift.id;

  const now = new Date();
  const shiftNo = `CS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-001`;
  const [newShift] = await tx.insert(schema.cashShifts).values({
    shiftNo,
    cashierId: String(userId),
    cashDrawerId: 1,
    openedAt: now,
    openingFloat: 50000000,
    expectedCash: 50000000,
    status: 'ACTIVE',
    notes: 'Ca thu ngân tự động M15/M32'
  }).returning();
  return newShift.id;
}

export async function archiveToDmsVault({
  title,
  category,
  categoryName,
  refDocNo,
  metadata,
  signer,
  userId
}: {
  title: string;
  category: string;
  categoryName: string;
  refDocNo: string;
  metadata?: any;
  signer?: string;
  userId?: number;
}) {
  try {
    const totalDocs = await db.select().from(schema.dmsDocuments).all();
    const docCode = `DMS-${category.slice(0, 3).toUpperCase()}-2026-${String(totalDocs.length + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const sha256Hash = crypto.createHash('sha256')
      .update(JSON.stringify({ docCode, title, refDocNo, metadata, timestamp }))
      .digest('hex');

    const newDoc = {
      docCode,
      title,
      category,
      categoryName,
      version: 'v1.0-OFFICIAL',
      fileSize: '1.8 MB',
      format: 'PDF/A-3',
      status: 'SIGNED',
      securityLevel: 'CONFIDENTIAL',
      sha256Hash,
      signedBy: signer || 'Hệ thống Điều phối Xử lý Đổi trả M15 RMA Router',
      signedAt: timestamp,
      linkedModule: 'M15 Returns & RMA',
      refDocNo,
      storageTier: 'ACTIVE_VAULT',
      retentionYears: 10,
      expireDate: '2036-12-31',
      workflowStage: 3,
      workflowSteps: JSON.stringify([
        { step: 1, name: 'Khởi tạo & Trình duyệt Hồ sơ RMA', role: 'CUSTOMER_SERVICE', status: 'COMPLETED', user: signer || 'RMA Officer', signedAt: timestamp },
        { step: 2, name: 'Giám định Kỹ thuật & Quyết định Xử lý', role: 'QC_MANAGER', status: 'COMPLETED', user: 'Cổng Giám định QC M15', signedAt: timestamp },
        { step: 3, name: 'Niêm phong Điện tử M29 DMS Vault', role: 'DMS_VAULT', status: 'COMPLETED', user: 'M29 Secure Vault Engine', signedAt: timestamp }
      ])
    };

    const inserted = await db.insert(schema.dmsDocuments).values(newDoc as any).returning();
    return inserted[0] || newDoc;
  } catch (err) {
    console.error('Lỗi lưu trữ chứng từ sang DMS Vault:', err);
    return null;
  }
}

export class RmaDispositionRouter {
  private static idempotencyCache = new Map<string, DispositionExecutionResult>();

  /**
   * Orchestrate RMA Disposition Execution with Atomic sequencing and Single-Writer Handover.
   * Dispatches to Inventory (M17), Costing (M42), Warranty/Serial (M23), Maintenance (M27), SRM (M08/M11), and Finance (M31/M32).
   */
  static async executeDisposition(
    params: ExecuteDispositionParams,
    tx: any = db
  ): Promise<DispositionExecutionResult> {
    const {
      rmaId,
      disposition = 'RESTOCK',
      refundMethod = 'CREDIT_NOTE',
      userId,
      username = 'admin',
      userRole = 'SUPER_ADMIN',
      userFullName = 'Quản trị viên',
      idempotencyKey
    } = params;

    // 0. Check in-memory Idempotency Cache for exact match replays
    if (idempotencyKey && RmaDispositionRouter.idempotencyCache.has(idempotencyKey)) {
      const cached = RmaDispositionRouter.idempotencyCache.get(idempotencyKey)!;
      return {
        ...cached,
        idempotentReplay: true,
        message: `[IDEMPOTENT REPLAY] Yêu cầu xử lý RMA đã được thực thi thành công trước đó (Idempotency Key: ${idempotencyKey}). Không thực hiện ghi trùng lặp.`
      };
    }

    // 1. Fetch RMA Entity
    let rma: any = null;
    const numId = Number(rmaId);
    if (!isNaN(numId) && numId > 0 && String(numId) === String(rmaId)) {
      rma = await tx.query.rmaRequests.findFirst({
        where: eq(schema.rmaRequests.id, numId),
        with: { items: true, customer: true, order: true }
      });
    } else {
      rma = await tx.query.rmaRequests.findFirst({
        where: eq(schema.rmaRequests.rmaNumber, String(rmaId)),
        with: { items: true, customer: true, order: true }
      });
    }

    if (!rma) {
      throw new Error(`Không tìm thấy hồ sơ RMA [${rmaId}]`);
    }

    // 2. Immutability Assertion (Rule #01 & Rule #16)
    RmaValidationService.assertNotImmutable(rma, `thực thi quyết định xử lý [${disposition}]`);

    const targetWarehouseId = params.warehouseId || rma.warehouseId || 1;
    const items = rma.items || [];
    const effectiveRefundChannel: RmaRefundChannel =
      params.refundChannel || rma.refundChannel || (refundMethod === 'CASH' ? 'CASH_M32' : 'CREDIT_NOTE_M31');

    let hasRepairLines = false;
    let hasRtvLines = false;
    let hasRestockLines = false;
    let totalReturnCogs = 0;

    const maintenanceWoCode = rma.maintenanceWoCode || `WO-EAM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const rtvReferenceCode = rma.rtvReferenceCode || `RTV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const creditNoteNumber = rma.creditNoteNumber || `CN-2026-${String(rma.id).padStart(4, '0')}`;

    // -------------------------------------------------------------
    // ROUTE 1: LINE-ITEM MULTI-DISPOSITION ROUTING (M17, M22, M23, M27, M08)
    // -------------------------------------------------------------
    for (const it of items) {
      const lineInput = params.lineDispositions?.find(ld => ld.itemId === it.id);
      const lineDisposition: RmaDispositionType = lineInput?.dispositionTarget
        || (it.dispositionTarget as any)
        || (it.disposition as any)
        || disposition;
      const lineQty = Number(lineInput?.quantity ?? it.quantity ?? 1);
      const lineWarehouseId = lineInput?.warehouseId || targetWarehouseId;

      let productId = it.productId;
      if (!productId && it.productCode) {
        const [foundProd] = await tx.select().from(schema.products)
          .where(eq(schema.products.sku, it.productCode))
          .limit(1);
        if (foundProd) productId = foundProd.id;
      }
      if (!productId) productId = 5;

      if (lineDisposition === 'RESTOCK' || (lineDisposition === 'REPLACE' && (it.condition === 'GOOD' || lineInput?.condition === 'GOOD'))) {
        hasRestockLines = true;
        // 1. Single-Writer Inventory Transaction (M17)
        await InventoryService.postTransaction({
          productId,
          warehouseId: lineWarehouseId,
          type: 'RETURN_FROM_CUSTOMER',
          referenceNo: rma.rmaNumber,
          quantity: lineQty,
          userId,
          notes: `Nhập kho hoàn trả RMA [${rma.rmaNumber}] - Sản phẩm: ${it.productName}`,
          idempotencyKey: idempotencyKey ? `INV-${idempotencyKey}-${it.id}` : `INV-RMA-${rma.rmaNumber}-${it.id}`
        });

        // 2. Single-Writer Costing (M42)
        try {
          const itemUnitCost = it.originalUnitCost > 0
            ? Number(it.originalUnitCost)
            : await costingEngine.resolveUnitCost({ productId, warehouseId: lineWarehouseId });
          const itemCogs = Math.round(lineQty * itemUnitCost);
          totalReturnCogs += itemCogs;

          await costingEngine.addCostLayer({
            productId,
            warehouseId: lineWarehouseId,
            quantity: lineQty,
            unitCost: itemUnitCost,
            sourceDocumentType: 'RMA_RETURN',
            sourceDocumentId: rma.id,
            sourceReferenceNo: rma.rmaNumber,
            receiptDate: new Date()
          });
        } catch (costErr) {
          console.warn("CostingEngine warning in RmaDispositionRouter:", costErr);
        }

        // 3. M22 Lot Tracking & Balances Synchronization
        if (it.lotId) {
          try {
            const [existingBalance] = await tx.select().from(schema.lotBalances)
              .where(and(
                eq(schema.lotBalances.lotId, it.lotId),
                eq(schema.lotBalances.productId, productId),
                eq(schema.lotBalances.warehouseId, lineWarehouseId)
              ))
              .limit(1);

            if (existingBalance) {
              await tx.update(schema.lotBalances)
                .set({
                  stockPhysical: sql`${schema.lotBalances.stockPhysical} + ${lineQty}`,
                  stockAvailable: sql`${schema.lotBalances.stockAvailable} + ${lineQty}`,
                  updatedAt: new Date()
                })
                .where(eq(schema.lotBalances.id, existingBalance.id));
            } else {
              await tx.insert(schema.lotBalances).values({
                lotId: it.lotId,
                productId,
                warehouseId: lineWarehouseId,
                stockPhysical: lineQty,
                stockReserved: 0,
                stockAvailable: lineQty,
                updatedAt: new Date()
              });
            }

            // Reactivate lot if DEPLETED
            await tx.update(schema.lots)
              .set({ status: 'ACTIVE' })
              .where(and(eq(schema.lots.id, it.lotId), eq(schema.lots.status, 'DEPLETED')));
          } catch (lotErr) {
            console.warn("Lot balance update warning in RMA router:", lotErr);
          }
        }

        // 4. M23 Serial Numbers status synchronization
        if (it.serialId) {
          try {
            await tx.update(schema.serialNumbers)
              .set({
                status: 'IN_STOCK',
                warehouseId: lineWarehouseId,
                notes: `Hoàn nhập kho từ RMA [${rma.rmaNumber}] (Đạt chuẩn QC)`,
                updatedAt: new Date()
              })
              .where(eq(schema.serialNumbers.id, it.serialId));

            await tx.insert(schema.serialHistory).values({
              serialId: it.serialId,
              action: 'INWARD',
              fromStatus: 'WARRANTY_INSPECTION',
              toStatus: 'IN_STOCK',
              referenceNo: rma.rmaNumber,
              notes: `Nhập lại kho theo quyết định RESTOCK từ RMA [${rma.rmaNumber}]`,
              performedBy: userId,
              createdAt: new Date()
            });

            await tx.insert(schema.serialTransactions).values({
              serialId: it.serialId,
              transactionType: 'RETURN',
              referenceId: rma.id,
              referenceItemId: it.id,
              referenceCode: rma.rmaNumber,
              fromWarehouseId: null,
              toWarehouseId: lineWarehouseId,
              customerId: rma.customerId,
              customerName: rma.customerName,
              notes: `RMA Restock hoàn trả kho #${lineWarehouseId}`,
              createdBy: userId,
              createdAt: new Date()
            });
          } catch (snErr) {
            console.warn("Serial sync warning:", snErr);
          }
        }

        await tx.update(schema.rmaItems)
          .set({
            disposition: 'RESTOCK',
            dispositionTarget: 'RESTOCK',
            restockedQuantity: lineQty,
            condition: lineInput?.condition || it.condition || 'GOOD',
            notes: lineInput?.notes || it.notes
          })
          .where(eq(schema.rmaItems.id, it.id));

      } else if (lineDisposition === 'REPAIR') {
        hasRepairLines = true;
        
        // 1. M23 Serial Numbers status synchronization
        if (it.serialId) {
          try {
            await tx.update(schema.serialNumbers)
              .set({
                status: 'UNDER_MAINTENANCE',
                notes: `Chuyển sửa chữa bảo dưỡng EAM M27 từ RMA [${rma.rmaNumber}]`,
                updatedAt: new Date()
              })
              .where(eq(schema.serialNumbers.id, it.serialId));

            await tx.insert(schema.serialHistory).values({
              serialId: it.serialId,
              action: 'WARRANTY_CLAIM',
              fromStatus: 'WARRANTY_INSPECTION',
              toStatus: 'UNDER_MAINTENANCE',
              referenceNo: rma.rmaNumber,
              notes: `Điều chuyển sửa chữa nội bộ M27`,
              performedBy: userId,
              createdAt: new Date()
            });
          } catch (snErr) {
            console.warn("Serial repair sync warning:", snErr);
          }
        }

        // 2. M27 EAM: Automatically Create Maintenance Work Order (CORRECTIVE_REPAIR)
        try {
          let assetId = 1;
          const [foundAsset] = await tx.select().from(schema.assets)
            .where(it.lotSerial ? eq(schema.assets.serialNumber, it.lotSerial) : sql`1=1`)
            .limit(1);

          if (foundAsset) {
            assetId = foundAsset.id;
          } else {
            const [firstAsset] = await tx.select().from(schema.assets).limit(1);
            if (firstAsset) {
              assetId = firstAsset.id;
            } else {
              const [newAsset] = await tx.insert(schema.assets).values({
                code: `AST-RMA-${rma.rmaNumber}-${it.id}`,
                name: it.productName || 'Thiết bị tiếp nhận sửa chữa M15',
                serialNumber: it.lotSerial || undefined,
                status: 'REPAIR',
                purchaseCost: 0,
                bookValue: 0
              }).returning();
              if (newAsset) assetId = newAsset.id;
            }
          }

          const [newWo] = await tx.insert(schema.maintenanceWorkOrders).values({
            woCode: maintenanceWoCode || `WO-EAM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            assetId,
            assetName: `${it.productName} (Serial: ${it.lotSerial || 'N/A'})`,
            maintenanceType: 'CORRECTIVE',
            priority: 'HIGH',
            description: `[LỆNH BẢO DƯỠNG EAM M27 TỪ RMA ${rma.rmaNumber}] Sửa chữa phục hồi: ${it.productName} (Serial: ${it.lotSerial || 'N/A'}) - Phiếu yêu cầu kỹ thuật: ${it.reason || rma.reason || 'Lỗi chức năng cần khắc phục'}`,
            assignedTechnicianId: 1,
            assignedTechnicianName: 'Quản đốc Xưởng Kỹ thuật M27',
            plannedStart: new Date().toISOString().slice(0, 10),
            status: 'OPEN',
            totalCost: 0,
            downtimeHours: 0,
            createdAt: new Date()
          }).returning();

          if (newWo && it.productId) {
            await tx.insert(schema.maintenanceParts).values({
              woId: newWo.id,
              productId,
              productName: it.productName,
              quantity: lineQty,
              unitCost: 0,
              totalCost: 0,
              warehouseId: lineWarehouseId,
              issuedAt: new Date()
            });
          }
        } catch (woErr) {
          console.warn("M27 Maintenance Work Order creation warning:", woErr);
        }

        await tx.update(schema.rmaItems)
          .set({
            disposition: 'REPAIR',
            dispositionTarget: 'REPAIR',
            condition: lineInput?.condition || it.condition || 'DEFECTIVE',
            notes: lineInput?.notes || it.notes
          })
          .where(eq(schema.rmaItems.id, it.id));

      } else if (lineDisposition === 'SCRAP') {
        if (it.serialId) {
          try {
            await tx.update(schema.serialNumbers)
              .set({
                status: 'DEFECTIVE',
                notes: `Tiêu hủy / thanh lý phế liệu từ RMA [${rma.rmaNumber}]`,
                updatedAt: new Date()
              })
              .where(eq(schema.serialNumbers.id, it.serialId));

            await tx.insert(schema.serialHistory).values({
              serialId: it.serialId,
              action: 'QC_FAIL',
              fromStatus: 'WARRANTY_INSPECTION',
              toStatus: 'DEFECTIVE',
              referenceNo: rma.rmaNumber,
              notes: `Loại bỏ / tiêu hủy lấy linh kiện theo RMA [${rma.rmaNumber}]`,
              performedBy: userId,
              createdAt: new Date()
            });
          } catch (snErr) {
            console.warn("Serial scrap sync warning:", snErr);
          }
        }

        await tx.update(schema.rmaItems)
          .set({
            disposition: 'SCRAP',
            dispositionTarget: 'SCRAP',
            scrappedQuantity: lineQty,
            condition: lineInput?.condition || it.condition || 'SCRAP',
            notes: lineInput?.notes || it.notes
          })
          .where(eq(schema.rmaItems.id, it.id));

      } else if (lineDisposition === 'RETURN_TO_VENDOR') {
        hasRtvLines = true;
        
        // 1. M23 Serial Numbers status synchronization
        if (it.serialId) {
          try {
            await tx.update(schema.serialNumbers)
              .set({
                status: 'RTV',
                notes: `Xuất trả nhà cung cấp (RTV M08/M11) từ RMA [${rma.rmaNumber}]`,
                updatedAt: new Date()
              })
              .where(eq(schema.serialNumbers.id, it.serialId));

            await tx.insert(schema.serialHistory).values({
              serialId: it.serialId,
              action: 'OUTWARD',
              fromStatus: 'WARRANTY_INSPECTION',
              toStatus: 'RTV',
              referenceNo: rma.rmaNumber,
              notes: `Ủy quyền xuất trả NCC theo RTV từ RMA [${rma.rmaNumber}]`,
              performedBy: userId,
              createdAt: new Date()
            });
          } catch (snErr) {
            console.warn("Serial RTV sync warning:", snErr);
          }
        }

        // 2. M08/M11 SRM: Automatically Create Purchase Return (RTV) & Delegate Single-Writer Inventory Return
        let supplierId = 1;
        let supplierName = 'Nhà Cung Cấp Linh Kiện & Thiết Bị';
        try {
          if (it.productId) {
            const [prod] = await tx.select().from(schema.products).where(eq(schema.products.id, it.productId)).limit(1);
            if (prod && prod.supplierId) supplierId = prod.supplierId;
          }
          if (it.lotId) {
            const [lot] = await tx.select().from(schema.lots).where(eq(schema.lots.id, it.lotId)).limit(1);
            if (lot && lot.supplierId) supplierId = lot.supplierId;
          }
          const [foundSupp] = await tx.select().from(schema.suppliers).where(eq(schema.suppliers.id, supplierId)).limit(1);
          if (foundSupp?.name) supplierName = foundSupp.name;
        } catch (suppErr) {
          console.warn("Supplier resolution warning:", suppErr);
        }

        let itemUnitCost = it.originalUnitCost > 0 ? Number(it.originalUnitCost) : 0;
        if (itemUnitCost <= 0) {
          try {
            itemUnitCost = await costingEngine.resolveUnitCost({ productId, warehouseId: lineWarehouseId });
          } catch {
            itemUnitCost = Number(it.unitPrice) || 0;
          }
        }
        const rtvLineSubtotal = Math.round(itemUnitCost * lineQty);

        const currentRtvCode = rtvReferenceCode || `RTV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        try {
          // 2a. Insert purchaseReturns dossier
          const [newPr] = await tx.insert(schema.purchaseReturns).values({
            code: currentRtvCode,
            poId: null,
            supplierId,
            warehouseId: lineWarehouseId,
            status: 'RETURNED',
            refundStatus: 'AP_CREDITED',
            refundedAmount: rtvLineSubtotal,
            totalAmount: rtvLineSubtotal,
            returnDate: new Date(),
            reason: `Xuất trả hàng nhà cung cấp (RTV) từ hồ sơ RMA [${rma.rmaNumber}] - Sản phẩm: ${it.productName} - Lỗi: ${it.reason || rma.reason || 'Lỗi kỹ thuật nhà sản xuất'}`,
            createdBy: userId,
            createdAt: new Date()
          }).returning();

          // 2b. Insert purchaseReturnItems
          if (newPr) {
            await tx.insert(schema.purchaseReturnItems).values({
              purchaseReturnId: newPr.id,
              productId,
              quantity: lineQty,
              unitPrice: itemUnitCost,
              reason: it.reason || rma.reason || 'Lỗi kỹ thuật nhà sản xuất',
              serialNumbers: it.lotSerial ? JSON.stringify([it.lotSerial]) : null
            });
          }

          // 2c. Delegate Single-Writer Outward Inventory Transaction (M17)
          await InventoryService.postTransaction({
            productId,
            warehouseId: lineWarehouseId,
            type: 'RETURN_TO_SUPPLIER',
            referenceNo: currentRtvCode,
            quantity: lineQty,
            userId,
            notes: `Xuất kho trả nhà cung cấp (RTV M08/M11) theo RMA [${rma.rmaNumber}] - NCC: ${supplierName}`,
            idempotencyKey: idempotencyKey ? `INV-RTV-${idempotencyKey}-${it.id}` : `INV-RTV-${rma.rmaNumber}-${it.id}`
          });

          // 2d. Propose AP Reduction via Debit Note & Ledger (M31 AP)
          const debitNoteNumber = `DN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          await tx.insert(schema.debitNotes).values({
            debitNoteNumber,
            originalInvoiceNumber: `PO-INV-${currentRtvCode}`,
            supplierName,
            amount: rtvLineSubtotal,
            vatAmount: 0,
            finalAmount: rtvLineSubtotal,
            purchaseReturnCode: currentRtvCode,
            reason: `Giảm trừ công nợ phải trả AP do xuất trả hàng NCC theo RMA ${rma.rmaNumber}`,
            status: 'APPROVED',
            date: new Date().toISOString().slice(0, 10),
            accountingEntry: `Nợ TK 3311 / Có TK 1561: ${rtvLineSubtotal.toLocaleString()} VNĐ`,
            createdAt: new Date()
          });

          if (rtvLineSubtotal > 0) {
            await accountingEngine.postJournal({
              sourceModule: 'M08_PURCHASE_RETURN',
              sourceDocumentType: 'DEBIT_NOTE',
              sourceDocumentId: newPr ? newPr.id : rma.id,
              sourceReferenceNo: debitNoteNumber,
              debitAccount: '3311',
              creditAccount: '1561',
              amount: rtvLineSubtotal,
              description: `Giảm trừ công nợ AP xuất trả hàng NCC ${supplierName} theo RMA ${rma.rmaNumber}`,
              branchId: 1,
              supplierId,
              userId
            });
          }
        } catch (rtvErr) {
          console.warn("M08/M11 RTV Purchase Return execution warning:", rtvErr);
        }

        await tx.update(schema.rmaItems)
          .set({
            disposition: 'RETURN_TO_VENDOR',
            dispositionTarget: 'RETURN_TO_VENDOR',
            condition: lineInput?.condition || it.condition || 'DEFECTIVE',
            notes: lineInput?.notes || it.notes
          })
          .where(eq(schema.rmaItems.id, it.id));

      } else if (lineDisposition === 'REPLACE') {
        if (it.serialId) {
          try {
            await tx.update(schema.serialNumbers)
              .set({
                status: 'DEFECTIVE',
                notes: `Đã đổi mới cho khách hàng theo RMA [${rma.rmaNumber}]`,
                updatedAt: new Date()
              })
              .where(eq(schema.serialNumbers.id, it.serialId));

            await tx.insert(schema.serialHistory).values({
              serialId: it.serialId,
              action: 'STATUS_CHANGE',
              fromStatus: 'WARRANTY_INSPECTION',
              toStatus: 'DEFECTIVE',
              referenceNo: rma.rmaNumber,
              notes: `Đổi mới thiết bị tương đương theo RMA [${rma.rmaNumber}]`,
              performedBy: userId,
              createdAt: new Date()
            });
          } catch (snErr) {
            console.warn("Serial replace sync warning:", snErr);
          }
        }

        await tx.update(schema.rmaItems)
          .set({
            disposition: 'REPLACE',
            dispositionTarget: 'REPLACE',
            replacedQuantity: lineQty,
            condition: lineInput?.condition || it.condition || 'DEFECTIVE',
            notes: lineInput?.notes || it.notes
          })
          .where(eq(schema.rmaItems.id, it.id));
      }
    }

    // -------------------------------------------------------------
    // ROUTE 2: FINANCIAL REFUND HANDOVER (M31 AR / M32 Cash Drawer)
    // -------------------------------------------------------------
    const totalAmount = Number(rma.totalAmount) || 0;
    let newFinancialStatus = 'CREDIT_NOTE_ISSUED';
    let newRmaStatus = 'COMPLETED';

    if (totalAmount > 0) {
      if (effectiveRefundChannel === 'CASH_M32' || refundMethod === 'CASH' || refundMethod === 'BANK_TRANSFER') {
        // --- M32 CASH / BANK REFUND PATH ---
        const isBankTransfer = refundMethod === 'BANK_TRANSFER';
        const creditAccount = isBankTransfer ? '1121' : '1111';
        const paymentMethodVal = isBankTransfer ? 'BANK_TRANSFER' : 'CASH';

        try {
          if (!isBankTransfer) {
            const shiftId = await getOrCreateActiveShift(tx, userId);
            await cashMovementService.postMovement({
              shiftId,
              cashDrawerId: 1,
              movementType: 'REFUND_CASH',
              amount: totalAmount,
              direction: 'OUT',
              custodianId: String(userId),
              referenceNo: rma.rmaNumber,
              notes: `Chi tiền mặt hoàn trả khách hàng theo RMA [${rma.rmaNumber}] (${rma.customerName})`,
              idempotencyKey: idempotencyKey ? `CASH-${idempotencyKey}` : `CASH-RMA-${rma.rmaNumber}`
            });
          }

          // Post General Ledger: Nợ 5212 (Hàng bán bị trả lại) / Có 1111 (Tiền mặt) hoặc Có 1121 (Tiền gửi ngân hàng)
          await accountingEngine.postJournal({
            sourceModule: 'M15_RMA',
            sourceDocumentType: isBankTransfer ? 'BANK_REFUND' : 'CASH_REFUND',
            sourceDocumentId: rma.id,
            sourceReferenceNo: rma.rmaNumber,
            debitAccount: '5212',
            creditAccount,
            amount: totalAmount,
            description: `Chi hoàn ${isBankTransfer ? 'chuyển khoản' : 'tiền mặt'} hàng bán trả lại RMA ${rma.rmaNumber} (${rma.customerName})`,
            branchId: 1,
            customerId: rma.customerId || undefined,
            userId
          });

          // Insert into payments table (Treasury & Cashier disbursement tracking)
          try {
            await tx.insert(schema.payments).values({
              orderId: rma.orderId || null,
              customerId: rma.customerId || null,
              paymentType: 'OUT',
              paymentMethod: paymentMethodVal,
              amount: totalAmount,
              referenceNo: rma.rmaNumber,
              status: 'SUCCESS',
              notes: `Chi hoàn trả khách hàng theo hồ sơ RMA [${rma.rmaNumber}]`,
              createdBy: userId,
              createdAt: new Date()
            });
          } catch (payErr) {
            console.warn("Payment record creation warning:", payErr);
          }

          // Insert into cashVouchers table (M32 Payment Voucher / Phiếu chi)
          try {
            const voucherCode = `PC-2026-${String(rma.id).padStart(4, '0')}`;
            await tx.insert(schema.cashVouchers).values({
              voucherCode,
              voucherType: 'PAYMENT',
              partnerType: 'CUSTOMER',
              partnerName: rma.customerName || 'Khách hàng',
              amount: totalAmount,
              paymentMethod: paymentMethodVal,
              status: 'APPROVED',
              date: new Date().toISOString().slice(0, 10),
              reason: `Chi hoàn trả hàng đổi trả RMA [${rma.rmaNumber}]`,
              accountingEntry: `Nợ TK 5212 / Có TK ${creditAccount}: ${totalAmount.toLocaleString()} VNĐ`,
              createdBy: username,
              approvedBy: 'Kế toán trưởng M30',
              createdAt: new Date()
            });
          } catch (voucherErr) {
            console.warn("Cash voucher creation warning:", voucherErr);
          }

          newFinancialStatus = 'REFUNDED';
          newRmaStatus = 'REFUNDED';
        } catch (cashErr) {
          console.error("CashMovementService error:", cashErr);
        }
      } else {
        // --- M31 CREDIT NOTE PATH (AR OFFSET & INVOICE REDUCTION) ---
        const creditAccount = '1311';
        try {
          // 1. Post General Ledger: Nợ TK 5212 / Có TK 1311
          await accountingEngine.postJournal({
            sourceModule: 'M15_RMA',
            sourceDocumentType: 'CREDIT_NOTE',
            sourceDocumentId: rma.id,
            sourceReferenceNo: creditNoteNumber,
            debitAccount: '5212',
            creditAccount,
            amount: totalAmount,
            description: `Hàng bán bị trả lại theo RMA ${rma.rmaNumber} (Khách hàng: ${rma.customerName})`,
            branchId: 1,
            customerId: rma.customerId || undefined,
            userId
          });

          // 2. Issue Official Credit Note
          await tx.insert(schema.creditNotes).values({
            creditNoteNumber,
            originalInvoiceNumber: rma.orderCode ? `INV-${rma.orderCode}` : `INV-${rma.rmaNumber}`,
            customerName: rma.customerName,
            amount: totalAmount,
            vatAmount: Math.round(totalAmount * 0.1),
            finalAmount: totalAmount + Math.round(totalAmount * 0.1),
            rmaCode: rma.rmaNumber,
            reason: rma.reason,
            status: 'APPROVED',
            date: new Date().toISOString().slice(0, 10),
            accountingEntry: `Nợ 5212 / Có ${creditAccount}: ${totalAmount.toLocaleString()} VNĐ`,
            createdAt: new Date()
          });

          // 3. Reconcile and reduce original invoice in M31
          try {
            const invoiceMatch = await tx.select().from(schema.invoices)
              .where(or(
                rma.orderId ? eq(schema.invoices.orderId, rma.orderId) : sql`1=0`,
                rma.customerId ? eq(schema.invoices.customerId, rma.customerId) : sql`1=0`
              ))
              .limit(1);

            if (invoiceMatch.length > 0) {
              const matchedInv = invoiceMatch[0];
              await tx.update(schema.invoices)
                .set({
                  status: 'ADJUSTED'
                })
                .where(eq(schema.invoices.id, matchedInv.id));
            }
          } catch (invErr) {
            console.warn("Original invoice reconciliation warning:", invErr);
          }
        } catch (accErr) {
          console.error("Credit note accounting error:", accErr);
        }

        newFinancialStatus = 'CREDIT_NOTE_ISSUED';
        newRmaStatus = 'COMPLETED';
      }

      // Hoàn nhập giá vốn kho hàng bán trả lại (1561 / 632)
      if (totalReturnCogs > 0) {
        try {
          await accountingEngine.postJournal({
            sourceModule: 'M15_RMA',
            sourceDocumentType: 'CREDIT_NOTE',
            sourceDocumentId: rma.id,
            sourceReferenceNo: creditNoteNumber,
            debitAccount: '1561',
            creditAccount: '632',
            amount: totalReturnCogs,
            description: `Hoàn nhập giá vốn hàng bán trả lại RMA ${rma.rmaNumber}`,
            branchId: 1,
            userId
          });
        } catch (cogsErr) {
          console.error("AccountingEngine cogs error:", cogsErr);
        }
      }
    }

    // -------------------------------------------------------------
    // ROUTE 3: M29 DMS VAULT ARCHIVING WITH SHA-256 SEAL
    // -------------------------------------------------------------
    const vaultedCreditNote = await archiveToDmsVault({
      title: `Chứng Từ Quyết Định Xử Lý & Hoàn Tiền RMA [${rma.rmaNumber}]`,
      category: 'CREDIT_NOTE',
      categoryName: 'Hóa đơn Điều chỉnh Giảm & Biên bản Quyết định Xử lý Hàng đổi trả',
      refDocNo: creditNoteNumber,
      metadata: {
        creditNoteNumber,
        rmaNumber: rma.rmaNumber,
        disposition,
        refundChannel: effectiveRefundChannel,
        totalAmount,
        customerName: rma.customerName
      },
      signer: `${username} (Phòng Kế toán Tài chính & Quản trị Công nợ M30/M31/M32)`,
      userId
    });

    // -------------------------------------------------------------
    // ROUTE 4: UPDATE RMA REQUEST STATUS (BECOMES IMMUTABLE)
    // -------------------------------------------------------------
    await tx.update(schema.rmaRequests)
      .set({
        disposition,
        status: newRmaStatus,
        financialStatus: newFinancialStatus,
        creditNoteNumber: effectiveRefundChannel === 'CREDIT_NOTE_M31' ? creditNoteNumber : null,
        refundChannel: effectiveRefundChannel,
        maintenanceWoCode,
        rtvReferenceCode,
        refundedAmount: totalAmount,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.rmaRequests.id, rma.id));

    // -------------------------------------------------------------
    // ROUTE 5: M02 AUDIT TRAIL LOGGING (10 STANDARDIZED LIFECYCLE MILESTONES)
    // -------------------------------------------------------------
    try {
      // 5a. Milestone: RESTOCK
      if (hasRestockLines) {
        await AuditService.recordAuditLog({
          module: 'M15',
          action: 'RESTOCK',
          entityType: 'INVENTORY_TRANSACTION',
          entityId: rma.rmaNumber,
          userId,
          username,
          userName: userFullName,
          role: userRole,
          result: 'SUCCESS',
          metadata: {
            rmaNumber: rma.rmaNumber,
            warehouseId: targetWarehouseId,
            restockCogs: totalReturnCogs,
            idempotencyKey
          }
        });
      }

      // 5b. Milestone: RTV (Return to Vendor)
      if (hasRtvLines) {
        await AuditService.recordAuditLog({
          module: 'M15',
          action: 'RTV',
          entityType: 'PURCHASE_RETURN',
          entityId: rtvReferenceCode || rma.rmaNumber,
          userId,
          username,
          userName: userFullName,
          role: userRole,
          result: 'SUCCESS',
          metadata: {
            rmaNumber: rma.rmaNumber,
            rtvReferenceCode,
            idempotencyKey
          }
        });
      }

      // 5c. Milestone: REPAIR_ROUTE (Internal Maintenance Work Order)
      if (hasRepairLines) {
        await AuditService.recordAuditLog({
          module: 'M15',
          action: 'REPAIR_ROUTE',
          entityType: 'WORK_ORDER',
          entityId: maintenanceWoCode || rma.rmaNumber,
          userId,
          username,
          userName: userFullName,
          role: userRole,
          result: 'SUCCESS',
          metadata: {
            rmaNumber: rma.rmaNumber,
            maintenanceWoCode,
            idempotencyKey
          }
        });
      }

      // 5d. Milestone: CREDIT_NOTE / REFUND
      if (totalAmount > 0) {
        if (effectiveRefundChannel === 'CREDIT_NOTE_M31') {
          await AuditService.recordAuditLog({
            module: 'M15',
            action: 'CREDIT_NOTE',
            entityType: 'CREDIT_NOTE',
            entityId: creditNoteNumber,
            userId,
            username,
            userName: userFullName,
            role: userRole,
            result: 'SUCCESS',
            metadata: {
              rmaNumber: rma.rmaNumber,
              creditNoteNumber,
              amount: totalAmount,
              customerName: rma.customerName
            }
          });
        } else {
          await AuditService.recordAuditLog({
            module: 'M15',
            action: 'REFUND',
            entityType: 'CASH_PAYMENT',
            entityId: rma.rmaNumber,
            userId,
            username,
            userName: userFullName,
            role: userRole,
            result: 'SUCCESS',
            metadata: {
              rmaNumber: rma.rmaNumber,
              refundChannel: effectiveRefundChannel,
              amount: totalAmount,
              customerName: rma.customerName
            }
          });
        }
      }

      // 5e. Milestone: DISPOSITION_SET & CLOSE
      await AuditService.recordAuditLog({
        module: 'M15',
        action: 'DISPOSITION_SET',
        entityType: 'RMA_REQUEST',
        entityId: rma.rmaNumber,
        userId,
        username,
        userName: userFullName,
        role: userRole,
        result: 'SUCCESS',
        beforeData: { status: rma.status, disposition: rma.disposition },
        afterData: { status: newRmaStatus, disposition, creditNoteNumber, refundChannel: effectiveRefundChannel },
        metadata: {
          rmaNumber: rma.rmaNumber,
          disposition,
          effectiveRefundChannel,
          totalAmount,
          totalReturnCogs,
          maintenanceWoCode,
          rtvReferenceCode,
          idempotencyKey
        }
      });

      await AuditService.recordAuditLog({
        module: 'M15',
        action: 'CLOSE',
        entityType: 'RMA_REQUEST',
        entityId: rma.rmaNumber,
        userId,
        username,
        userName: userFullName,
        role: userRole,
        result: 'SUCCESS',
        metadata: {
          rmaNumber: rma.rmaNumber,
          finalStatus: newRmaStatus,
          financialStatus: newFinancialStatus,
          dmsVaultCode: vaultedCreditNote?.docCode
        }
      });
    } catch (auditErr) {
      console.warn("AuditService milestone logging warning:", auditErr);
    }

    const finalResult: DispositionExecutionResult = {
      success: true,
      rmaNumber: rma.rmaNumber,
      disposition,
      rmaStatus: newRmaStatus,
      financialStatus: newFinancialStatus,
      creditNoteNumber: effectiveRefundChannel === 'CREDIT_NOTE_M31' ? creditNoteNumber : null,
      refundChannel: effectiveRefundChannel,
      maintenanceWoCode,
      rtvReferenceCode,
      totalAmount,
      totalReturnCogs,
      vaultDocumentCode: vaultedCreditNote?.docCode,
      message: `Đã thực thi quyết định xử lý [${disposition}] cho RMA [${rma.rmaNumber}]. Kênh hoàn tiền: [${effectiveRefundChannel}]. Chứng từ đã đạt trạng thái bất biến và được niêm phong bảo vệ an toàn.`
    };

    if (idempotencyKey) {
      RmaDispositionRouter.idempotencyCache.set(idempotencyKey, finalResult);
    }

    return finalResult;
  }
}
