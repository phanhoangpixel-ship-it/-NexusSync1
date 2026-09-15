import { db } from "../db/index";
import * as schema from "../db/schema";
import { desc, eq } from "drizzle-orm";

export interface WorkItemAction {
  id: string;
  label: string;
  endpoint: string;
  variant?: 'primary' | 'danger' | 'secondary';
}

export interface WorkItemData {
  id: string;
  sourceModule: string;
  type: 'APPROVAL' | 'TASK' | 'ALERT' | 'REVIEW';
  entity: string;
  entityId: string;
  businessReference: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'IN_PROGRESS';
  targetRoute: string;
  createdAt: string;
  dueAt: string;
  slaHours: number;
  isOverdue?: boolean;
  isEscalated?: boolean;
  delegatedFrom?: string;
  amount?: number;
  currency?: string;
  actions: WorkItemAction[];
}

let initialWorkItems: WorkItemData[] = [
  { 
    id: "WI-001", 
    sourceModule: "M08 Procurement",
    type: "APPROVAL", 
    entity: "PurchaseOrder",
    entityId: "PO-2026-001",
    businessReference: "PO-2026-001",
    title: "Phê duyệt Đơn mua hàng PO-2026-001", 
    description: "Yêu cầu phê duyệt đơn mua hàng thép cuộn SS400 từ nhà cung cấp Hòa Phát. Vượt hạn mức 500tr cần GĐ duyệt.",
    priority: "HIGH", 
    status: "PENDING", 
    targetRoute: "/purchase",
    createdAt: new Date().toISOString(),
    dueAt: new Date(Date.now() + 4 * 3600000).toISOString(),
    slaHours: 24,
    isOverdue: false,
    amount: 850000000,
    currency: "VND",
    actions: [
      { id: "a1", label: "Phê duyệt", endpoint: "/api/po/approve/PO-2026-001", variant: "primary" },
      { id: "a2", label: "Từ chối", endpoint: "/api/po/reject/PO-2026-001", variant: "danger" }
    ]
  },
  { 
    id: "WI-002", 
    sourceModule: "M17 Inventory Core",
    type: "TASK", 
    entity: "StockAdjustment",
    entityId: "SA-2026-042",
    businessReference: "SA-2026-042",
    title: "Kiểm tra chênh lệch kiểm kê kho HQ (M17)", 
    description: "Phiếu kiểm kê định kỳ tháng 8 phát hiện chênh lệch -2 cuộn cáp quang. Cần rà soát và xác nhận bù trừ.",
    priority: "URGENT", 
    status: "PENDING", 
    targetRoute: "/inventory",
    createdAt: new Date(Date.now() - 25 * 3600000).toISOString(),
    dueAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    slaHours: 24,
    isOverdue: true,
    actions: [
      { id: "a3", label: "Xử lý ngay", endpoint: "/api/inventory/adjust/SA-2026-042", variant: "primary" }
    ]
  },
  { 
    id: "WI-003", 
    sourceModule: "M25 Dispatch & Yard Logistics",
    type: "APPROVAL", 
    entity: "ShipmentDispatch",
    entityId: "DSP-2026-088",
    businessReference: "DSP-2026-088",
    title: "Phê duyệt Lệnh điều phối xe giao hàng (M25)", 
    description: "Lô hàng 15 tấn xuất đi KCN Biên Hòa 2 yêu cầu điều phối xe tải 20T và bàn giao biên bản giao nhận.",
    priority: "HIGH", 
    status: "PENDING", 
    targetRoute: "/dispatch",
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    dueAt: new Date(Date.now() + 5 * 3600000).toISOString(),
    slaHours: 8,
    isOverdue: false,
    amount: 32000000,
    currency: "VND",
    actions: [
      { id: "a4", label: "Duyệt xuất bến", endpoint: "/api/dispatch/approve/DSP-2026-088", variant: "primary" }
    ]
  },
  { 
    id: "WI-004", 
    sourceModule: "M27 Asset Maintenance EAM",
    type: "ALERT", 
    entity: "MaintenanceWorkOrder",
    entityId: "MWO-2026-015",
    businessReference: "MWO-2026-015",
    title: "Cảnh báo Bảo trì khẩn cấp Máy dập CNC 03 (M27)", 
    description: "Cảm biến nhiệt độ trục chính vượt ngưỡng 85°C. Cần kỹ sư bảo trì kiểm tra thay vòng bi và dầu thủy lực.",
    priority: "URGENT", 
    status: "PENDING", 
    targetRoute: "/asset-maintenance",
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    dueAt: new Date(Date.now() + 2 * 3600000).toISOString(),
    slaHours: 4,
    isOverdue: false,
    actions: [
      { id: "a5", label: "Tiếp nhận sửa chữa", endpoint: "/api/maintenance/take/MWO-2026-015", variant: "primary" }
    ]
  },
  { 
    id: "WI-005", 
    sourceModule: "M18 Manufacturing MES",
    type: "TASK", 
    entity: "WorkOrder",
    entityId: "WO-2026-0045",
    businessReference: "WO-2026-0045",
    title: "Xác nhận hoàn thành lệnh sản xuất Lô #45 (M18)", 
    description: "Công đoạn lắp ráp hoàn tất 100 bộ sản phẩm. Cần xác nhận nhập kho thành phẩm.",
    priority: "MEDIUM", 
    status: "PENDING", 
    targetRoute: "/manufacturing",
    createdAt: new Date().toISOString(),
    dueAt: new Date(Date.now() + 12 * 3600000).toISOString(),
    slaHours: 24,
    isOverdue: false,
    actions: [
      { id: "a6", label: "Xác nhận nhập kho", endpoint: "/api/manufacturing/complete/WO-2026-0045", variant: "primary" }
    ]
  },
  { 
    id: "WI-006", 
    sourceModule: "M31 Invoices AR/AP",
    type: "APPROVAL", 
    entity: "CustomerInvoice",
    entityId: "INV-2026-092",
    businessReference: "INV-2026-092",
    title: "Duyệt xuất hóa đơn điện tử GTGT (M31)", 
    description: "Hóa đơn VAT cho khách hàng Đại lý Miền Nam trị giá 185.000.000 VND.",
    priority: "HIGH", 
    status: "PENDING", 
    targetRoute: "/invoices",
    createdAt: new Date().toISOString(),
    dueAt: new Date(Date.now() + 6 * 3600000).toISOString(),
    slaHours: 8,
    isOverdue: false,
    amount: 185000000,
    currency: "VND",
    actions: [
      { id: "a7", label: "Ký số phát hành", endpoint: "/api/invoices/sign/INV-2026-092", variant: "primary" }
    ]
  }
];

export class WorkspaceAggregationBackendService {
  private static workItems: WorkItemData[] = [...initialWorkItems];

  static async getSummary(role: string, branchId: string) {
    const allItems = await this.getWorkItems(role, branchId);
    const pendingCount = allItems.filter(i => i.status === 'PENDING').length;
    const alertCount = allItems.filter(i => i.priority === 'URGENT' && i.status === 'PENDING').length;

    return {
      activeWorkspaces: 12,
      pendingTasks: pendingCount,
      alerts: alertCount,
      recentActivity: [
        { id: 1, text: "Purchase Order PO-2026-001 approved", time: "10 mins ago" },
        { id: 2, text: "Stock adjustment SA-002 requires review", time: "1 hour ago" }
      ]
    };
  }

  static async getWorkItems(role: string, branchId: string, filter?: any) {
    const dynamicItems: WorkItemData[] = [];

    try {
      // Query recent sales orders to generate real dynamic workflow tasks
      const recentOrders = await db.select().from(schema.salesOrders)
        .orderBy(desc(schema.salesOrders.createdAt))
        .limit(20);

      for (const order of recentOrders) {
        let parsedMeta: any = {};
        if (order.notes) {
          try {
            parsedMeta = JSON.parse(order.notes);
          } catch {}
        }

        // 1. Check for RMA items attached to order
        if (parsedMeta.rmas && Array.isArray(parsedMeta.rmas)) {
          for (const rma of parsedMeta.rmas) {
            if (rma.status === 'REQUESTED') {
              dynamicItems.push({
                id: `WI-RMA-QC-${rma.rmaCode}`,
                sourceModule: "M15 Returns RMA / M39 QC",
                type: "TASK",
                entity: "RMARequest",
                entityId: rma.rmaCode,
                businessReference: rma.rmaCode,
                title: `👉 [Trợ lý M15/M39] Giám định QC cho RMA ${rma.rmaCode} (Đơn ${order.code})`,
                description: `Khách yêu cầu đổi trả (${rma.returnReason || 'Hàng lỗi'}). Bước 2: Giám định chất lượng & ngoại quan tem nhãn.`,
                priority: "HIGH",
                status: "PENDING",
                targetRoute: "/pos-retail",
                createdAt: rma.createdAt || new Date().toISOString(),
                dueAt: new Date(Date.now() + 6 * 3600000).toISOString(),
                slaHours: 8,
                isOverdue: false,
                amount: rma.totalReturnAmount || 0,
                currency: "VND",
                actions: [
                  { id: "rma_qc", label: "Giám định QC", endpoint: `/api/rma/inspect/${rma.rmaCode}`, variant: "primary" }
                ]
              });
            } else if (rma.status === 'INSPECTED') {
              dynamicItems.push({
                id: `WI-RMA-APPR-${rma.rmaCode}`,
                sourceModule: "M15 Returns RMA",
                type: "APPROVAL",
                entity: "RMARequest",
                entityId: rma.rmaCode,
                businessReference: rma.rmaCode,
                title: `👉 [Trợ lý M15] Phê duyệt phương án RMA ${rma.rmaCode} (Đơn ${order.code})`,
                description: `QC đã giám định (${rma.inspectionResult || 'Đạt'}). Bước 3: Phê duyệt phương án hoàn tiền/cấn trừ công nợ.`,
                priority: "HIGH",
                status: "PENDING",
                targetRoute: "/pos-retail",
                createdAt: rma.inspectedAt || new Date().toISOString(),
                dueAt: new Date(Date.now() + 4 * 3600000).toISOString(),
                slaHours: 4,
                isOverdue: false,
                amount: rma.totalReturnAmount || 0,
                currency: "VND",
                actions: [
                  { id: "rma_appr", label: "Phê duyệt RMA", endpoint: `/api/rma/approve/${rma.rmaCode}`, variant: "primary" },
                  { id: "rma_rej", label: "Từ chối RMA", endpoint: `/api/rma/reject/${rma.rmaCode}`, variant: "danger" }
                ]
              });
            } else if (rma.status === 'APPROVED') {
              dynamicItems.push({
                id: `WI-RMA-EXEC-${rma.rmaCode}`,
                sourceModule: "M15 RMA / M17 Kho / M30 GL",
                type: "TASK",
                entity: "RMARequest",
                entityId: rma.rmaCode,
                businessReference: rma.rmaCode,
                title: `👉 [Trợ lý M15/M17/M30] Nhập kho & Hoàn tiền cho RMA ${rma.rmaCode}`,
                description: `RMA đã được duyệt. Bước 4: Hoàn kho vật lý vào Kho ${order.warehouseId} và hạch toán giảm trừ doanh thu / hoàn nhập giá vốn GL.`,
                priority: "URGENT",
                status: "PENDING",
                targetRoute: "/pos-retail",
                createdAt: rma.approvedAt || new Date().toISOString(),
                dueAt: new Date(Date.now() + 2 * 3600000).toISOString(),
                slaHours: 4,
                isOverdue: false,
                amount: rma.totalReturnAmount || 0,
                currency: "VND",
                actions: [
                  { id: "rma_exec", label: "Nhập kho & Hoàn tiền", endpoint: `/api/rma/execute/${rma.rmaCode}`, variant: "primary" }
                ]
              });
            }
          }
        }

        // 2. Check for Omnichannel / POS Order Fulfillment lifecycle
        const fStatus = parsedMeta.fulfillmentStatus || "PENDING";
        const pStatus = parsedMeta.paymentStatus || (order.paymentStatus || "UNPAID");

        if (order.status !== 'CANCELLED' && order.status !== 'COMPLETED') {
          if (fStatus === 'PENDING') {
            dynamicItems.push({
              id: `WI-ORD-CONFIRM-${order.code}`,
              sourceModule: "M16 POS & Omnichannel",
              type: "TASK",
              entity: "SalesOrder",
              entityId: order.code,
              businessReference: order.code,
              title: `👉 [Trợ lý M16] Xác nhận & Giữ chỗ kho đơn ${order.code}`,
              description: `Khách đặt hàng online (${order.customerName || 'Khách vãng lai'}). Bước 1: Xác nhận đơn và tạo phiếu giữ chỗ tồn kho.`,
              priority: "MEDIUM",
              status: "PENDING",
              targetRoute: "/pos-retail",
              createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
              dueAt: new Date(Date.now() + 4 * 3600000).toISOString(),
              slaHours: 4,
              isOverdue: false,
              amount: order.totalAmount || 0,
              currency: "VND",
              actions: [
                { id: "ord_conf", label: "Xác nhận & Giữ chỗ", endpoint: `/api/orders/${order.id}/confirm`, variant: "primary" }
              ]
            });
          } else if (fStatus === 'CONFIRMED') {
            dynamicItems.push({
              id: `WI-ORD-PACK-${order.code}`,
              sourceModule: "M16 POS / M17 Inventory",
              type: "TASK",
              entity: "SalesOrder",
              entityId: order.code,
              businessReference: order.code,
              title: `👉 [Trợ lý M16/M17] Soạn hàng & Đóng gói (Pick & Pack) đơn ${order.code}`,
              description: `Đơn đã xác nhận giữ chỗ. Bước 2: In phiếu lấy hàng (Pick list) và đóng gói kiện hàng.`,
              priority: "HIGH",
              status: "PENDING",
              targetRoute: "/pos-retail",
              createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
              dueAt: new Date(Date.now() + 2 * 3600000).toISOString(),
              slaHours: 2,
              isOverdue: false,
              amount: order.totalAmount || 0,
              currency: "VND",
              actions: [
                { id: "ord_pack", label: "Soạn hàng & Đóng gói", endpoint: `/api/orders/${order.id}/pack`, variant: "primary" }
              ]
            });
          } else if (fStatus === 'PACKED') {
            dynamicItems.push({
              id: `WI-ORD-SHIP-${order.code}`,
              sourceModule: "M16 POS / M25 Logistics",
              type: "TASK",
              entity: "SalesOrder",
              entityId: order.code,
              businessReference: order.code,
              title: `👉 [Trợ lý M16/M25] Bàn giao giao vận cho đơn ${order.code}`,
              description: `Kiện hàng đã đóng gói niêm phong. Bước 3: Xuất kho và bàn giao đơn vị chuyển phát (GHN / ViettelPost).`,
              priority: "HIGH",
              status: "PENDING",
              targetRoute: "/pos-retail",
              createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
              dueAt: new Date(Date.now() + 3 * 3600000).toISOString(),
              slaHours: 3,
              isOverdue: false,
              amount: order.totalAmount || 0,
              currency: "VND",
              actions: [
                { id: "ord_ship", label: "Bàn giao vận chuyển", endpoint: `/api/orders/${order.id}/ship`, variant: "primary" }
              ]
            });
          } else if (fStatus === 'SHIPPED') {
            dynamicItems.push({
              id: `WI-ORD-DELIVER-${order.code}`,
              sourceModule: "M16 POS / Giao nhận",
              type: "TASK",
              entity: "SalesOrder",
              entityId: order.code,
              businessReference: order.code,
              title: `👉 [Trợ lý M16] Xác nhận giao hàng thành công đơn ${order.code}`,
              description: `Đơn hàng đang trên đường giao. Bước 4: Cập nhật trạng thái nhận hàng từ shipper.`,
              priority: "MEDIUM",
              status: "PENDING",
              targetRoute: "/pos-retail",
              createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
              dueAt: new Date(Date.now() + 6 * 3600000).toISOString(),
              slaHours: 6,
              isOverdue: false,
              amount: order.totalAmount || 0,
              currency: "VND",
              actions: [
                { id: "ord_deliv", label: "Xác nhận đã giao", endpoint: `/api/orders/${order.id}/deliver`, variant: "primary" }
              ]
            });
          } else if (fStatus === 'DELIVERED' && pStatus !== 'PAID') {
            dynamicItems.push({
              id: `WI-ORD-PAY-${order.code}`,
              sourceModule: "M16 POS / M31 Kế toán",
              type: "TASK",
              entity: "SalesOrder",
              entityId: order.code,
              businessReference: order.code,
              title: `👉 [Trợ lý M16/M31] Thu tiền COD (${(order.totalAmount || 0).toLocaleString('vi-VN')} đ) đơn ${order.code}`,
              description: `Khách đã nhận hàng. Bước 5: Thu hồi và đối soát tiền thu hộ COD từ đơn vị vận chuyển.`,
              priority: "HIGH",
              status: "PENDING",
              targetRoute: "/pos-retail",
              createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
              dueAt: new Date(Date.now() + 12 * 3600000).toISOString(),
              slaHours: 12,
              isOverdue: false,
              amount: order.totalAmount || 0,
              currency: "VND",
              actions: [
                { id: "ord_pay", label: "Thu tiền COD", endpoint: `/api/orders/${order.id}/pay`, variant: "primary" }
              ]
            });
          } else if (fStatus === 'DELIVERED' && pStatus === 'PAID') {
            dynamicItems.push({
              id: `WI-ORD-COMPL-${order.code}`,
              sourceModule: "M16 POS / M30 Sổ cái",
              type: "TASK",
              entity: "SalesOrder",
              entityId: order.code,
              businessReference: order.code,
              title: `👉 [Trợ lý M16/M30] Hoàn tất & Hạch toán GL đơn ${order.code}`,
              description: `Đã giao hàng và thanh toán đủ. Bước 6: Khóa đơn và hoàn tất ghi nhận sổ cái tài chính.`,
              priority: "LOW",
              status: "PENDING",
              targetRoute: "/pos-retail",
              createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
              dueAt: new Date(Date.now() + 24 * 3600000).toISOString(),
              slaHours: 24,
              isOverdue: false,
              amount: order.totalAmount || 0,
              currency: "VND",
              actions: [
                { id: "ord_compl", label: "Hoàn tất đơn", endpoint: `/api/orders/${order.id}/complete`, variant: "primary" }
              ]
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to load dynamic sales tasks in WorkspaceAggregationBackendService:", e);
    }

    const staticPending = this.workItems.filter(i => i.status === 'PENDING');
    return [...dynamicItems, ...staticPending];
  }

  static async executeAction(actionKey: string, params: { entityId?: string; userId?: string; actionType?: string }) {
    const { entityId, userId, actionType } = params;
    
    // Check if it's an RMA action endpoint
    if (actionKey.includes('/api/rma/')) {
      const rmaCode = entityId || actionKey.split('/').pop() || '';
      let action = 'INSPECT';
      if (actionKey.includes('/inspect')) action = 'INSPECT';
      else if (actionKey.includes('/approve')) action = 'APPROVE';
      else if (actionKey.includes('/reject')) action = 'REJECT';
      else if (actionKey.includes('/execute')) action = 'EXECUTE_RETURN_AND_REFUND';

      // Find sales order containing this RMA
      const allOrders = await db.select().from(schema.salesOrders).limit(50);
      let targetOrder: any = null;
      let targetRma: any = null;

      for (const ord of allOrders) {
        if (ord.notes) {
          try {
            const meta = JSON.parse(ord.notes);
            if (meta.rmas && Array.isArray(meta.rmas)) {
              const f = meta.rmas.find((r: any) => r.rmaCode === rmaCode || r.rmaId === rmaCode);
              if (f) {
                targetOrder = ord;
                targetRma = f;
                break;
              }
            }
          } catch {}
        }
      }

      if (targetOrder && targetRma) {
        const parsedMeta = JSON.parse(targetOrder.notes);
        const rmaIndex = parsedMeta.rmas.findIndex((r: any) => r.rmaCode === targetRma.rmaCode);

        if (action === 'INSPECT') {
          targetRma.status = 'INSPECTED';
          targetRma.inspectionResult = 'PASS';
          targetRma.inspectedAt = new Date().toISOString();
        } else if (action === 'APPROVE') {
          targetRma.status = 'APPROVED';
          targetRma.approvedAt = new Date().toISOString();
        } else if (action === 'REJECT') {
          targetRma.status = 'REJECTED';
          targetRma.rejectedAt = new Date().toISOString();
        } else if (action === 'EXECUTE_RETURN_AND_REFUND') {
          targetRma.status = 'REFUNDED';
          targetRma.refundedAt = new Date().toISOString();
          targetRma.creditNoteNumber = `CN-M15-${Date.now().toString().slice(-4)}`;
          targetRma.inventoryReturned = true;
        }

        parsedMeta.rmas[rmaIndex] = targetRma;
        await db.update(schema.salesOrders)
          .set({ notes: JSON.stringify(parsedMeta) })
          .where(eq(schema.salesOrders.id, targetOrder.id));

        return {
          success: true,
          message: `Trợ lý hướng dẫn: Đã thực thi bước "${action}" cho RMA ${rmaCode} thành công!`,
          item: targetRma
        };
      }
    }

    // Check if it's an Order Fulfillment action
    if (actionKey.includes('/api/orders/')) {
      const parts = actionKey.split('/');
      const orderIdStr = parts[3];
      const actionName = parts[4];
      const orderId = parseInt(orderIdStr, 10);

      if (!isNaN(orderId)) {
        const orderRows = await db.select().from(schema.salesOrders).where(eq(schema.salesOrders.id, orderId)).limit(1);
        if (orderRows.length > 0) {
          const ord = orderRows[0];
          let meta: any = {};
          try { meta = JSON.parse(ord.notes || '{}'); } catch {}

          if (actionName === 'confirm') {
            meta.fulfillmentStatus = 'CONFIRMED';
            meta.confirmedAt = new Date().toISOString();
          } else if (actionName === 'pack') {
            meta.fulfillmentStatus = 'PACKED';
            meta.packedAt = new Date().toISOString();
          } else if (actionName === 'ship') {
            meta.fulfillmentStatus = 'SHIPPED';
            meta.shippedAt = new Date().toISOString();
          } else if (actionName === 'deliver') {
            meta.fulfillmentStatus = 'DELIVERED';
            meta.deliveredAt = new Date().toISOString();
          } else if (actionName === 'pay') {
            meta.paymentStatus = 'PAID';
            meta.paidAt = new Date().toISOString();
          } else if (actionName === 'complete') {
            meta.fulfillmentStatus = 'COMPLETED';
            meta.completedAt = new Date().toISOString();
            await db.update(schema.salesOrders).set({ status: 'COMPLETED' }).where(eq(schema.salesOrders.id, orderId));
          }

          await db.update(schema.salesOrders)
            .set({ notes: JSON.stringify(meta) })
            .where(eq(schema.salesOrders.id, orderId));

          return {
            success: true,
            message: `Trợ lý hướng dẫn: Đã chuyển trạng thái xử lý đơn ${ord.code} thành "${actionName.toUpperCase()}" thành công!`,
            order: ord
          };
        }
      }
    }
    
    // Find item matching entityId or endpoint in static list
    const itemIndex = this.workItems.findIndex(
      i => i.entityId === entityId || (actionKey && i.actions.some(a => a.endpoint.includes(actionKey)))
    );

    if (itemIndex >= 0) {
      const item = this.workItems[itemIndex];
      const newStatus = actionType === 'reject' ? 'REJECTED' : 'APPROVED';
      this.workItems[itemIndex] = { ...item, status: newStatus };
      // Remove from pending
      this.workItems = this.workItems.filter(i => i.id !== item.id);
      return {
        success: true,
        message: `Thao tác cho chứng từ ${item.businessReference} thành công`,
        item: { ...item, status: newStatus }
      };
    }

    return {
      success: true,
      message: `Thực thi thành công cho ${entityId || actionKey}`
    };
  }

  static async getEntityPreview(entity: string, id: string) {
    return { id, entity, details: "Preview data for " + entity };
  }

  static async getProcessChains(role: string) {
    return {
      p2pChains: [],
      o2cChains: []
    };
  }

  static async searchOmnibar(query: string) {
    return [
      { id: "RES-1", title: "Result 1 for " + query, type: "DOCUMENT" },
      { id: "RES-2", title: "Result 2 for " + query, type: "RECORD" }
    ];
  }
}
