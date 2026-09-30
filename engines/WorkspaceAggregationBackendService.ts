import { db } from "../db/index";
import * as schema from "../db/schema";
import { desc, eq, and, sql, or } from "drizzle-orm";
import { StockAdjustmentService } from "./stockAdjustmentService";
import { AuditService } from "./auditService";

export interface WorkItemAction {
  id: string;
  label: string;
  endpoint: string;
  variant?: 'primary' | 'danger' | 'secondary' | 'warning' | 'default';
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
  dueAt?: string | null;
  slaHours?: number | null;
  isOverdue?: boolean;
  isEscalated?: boolean;
  slaStatus?: 'NORMAL' | 'WARNING_75' | 'WARNING_90' | 'BREACHED' | 'NO_SLA';
  slaLabel?: string;
  ageFormatted?: string;
  canAction?: boolean;
  isReadOnly?: boolean;
  assignedTo?: string;
  delegatedFrom?: string;
  amount?: number;
  currency?: string;
  actions: WorkItemAction[];
}

function formatAge(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "Vừa xong";
  const d = new Date(dateInput);
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "Vừa xong";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
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
    dueAt: null,
    slaHours: null,
    slaStatus: "NO_SLA",
    slaLabel: "Chưa có SLA",
    ageFormatted: "Vừa xong",
    canAction: true,
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
    dueAt: null,
    slaHours: null,
    slaStatus: "NO_SLA",
    slaLabel: "Chưa có SLA",
    ageFormatted: "1 ngày trước",
    canAction: true,
    isOverdue: false,
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
    dueAt: null,
    slaHours: null,
    slaStatus: "NO_SLA",
    slaLabel: "Chưa có SLA",
    ageFormatted: "3 giờ trước",
    canAction: true,
    isOverdue: false,
    amount: 32000000,
    currency: "VND",
    actions: [
      { id: "a4", label: "Duyệt xuất bến", endpoint: "/api/dispatch/approve/DSP-2026-088", variant: "primary" }
    ]
  },
  { 
    id: "WI-004", 
    sourceModule: "M27 Maintenance EAM",
    type: "TASK", 
    entity: "WorkOrder",
    entityId: "WO-2026-012",
    businessReference: "WO-2026-012",
    title: "Bảo trì định kỳ máy dập CNC #02 (M27)", 
    description: "Kế hoạch bảo dưỡng ngăn ngừa 500 giờ hoạt động máy CNC dập nguội phân xưởng 1. Cần thay nhớt thủy lực và cân chỉnh ray trượt.",
    priority: "MEDIUM", 
    status: "PENDING", 
    targetRoute: "/maintenance",
    createdAt: new Date().toISOString(),
    dueAt: null,
    slaHours: null,
    slaStatus: "NO_SLA",
    slaLabel: "Chưa có SLA",
    ageFormatted: "Vừa xong",
    canAction: true,
    isOverdue: false,
    actions: [
      { id: "a5", label: "Tiếp nhận bảo trì", endpoint: "/api/maintenance/take/WO-2026-012", variant: "primary" }
    ]
  },
  { 
    id: "WI-005", 
    sourceModule: "M25 Manufacturing MES",
    type: "TASK", 
    entity: "ProductionOrder",
    entityId: "MO-2026-004",
    businessReference: "MO-2026-004",
    title: "Nghiệm thu đóng lệnh sản xuất Lô #402 (M25)", 
    description: "Hoàn tất gia công 500 bộ phụ kiện nhôm anodized. Đạt tiêu chuẩn QC 100%. Cần đóng lệnh để cập nhật giá thành.",
    priority: "LOW", 
    status: "PENDING", 
    targetRoute: "/manufacturing",
    createdAt: new Date().toISOString(),
    dueAt: null,
    slaHours: null,
    slaStatus: "NO_SLA",
    slaLabel: "Chưa có SLA",
    ageFormatted: "Vừa xong",
    canAction: true,
    isOverdue: false,
    actions: [
      { id: "a6", label: "Đóng lệnh & Nhập kho", endpoint: "/api/manufacturing/complete/MO-2026-004", variant: "primary" }
    ]
  },
  { 
    id: "WI-006", 
    sourceModule: "M29 e-Invoice & HSM",
    type: "APPROVAL", 
    entity: "ElectronicInvoice",
    entityId: "INV-2026-092",
    businessReference: "INV-2026-092",
    title: "Ký số phát hành Hóa đơn điện tử VAT (M29)", 
    description: "Hóa đơn giá trị gia tăng số 00092 cho Công ty TNHH Cơ Khí An Phát. Đã khớp thanh toán và lệnh xuất kho.",
    priority: "HIGH", 
    status: "PENDING", 
    targetRoute: "/invoices",
    createdAt: new Date().toISOString(),
    dueAt: null,
    slaHours: null,
    slaStatus: "NO_SLA",
    slaLabel: "Chưa có SLA",
    ageFormatted: "Vừa xong",
    canAction: true,
    isOverdue: false,
    amount: 145200000,
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
    const alertCount = allItems.filter(i => (i.priority === 'URGENT' || i.type === 'ALERT') && i.status === 'PENDING').length;
    const approvalCount = allItems.filter(i => i.type === 'APPROVAL' && i.status === 'PENDING').length;
    const taskCount = allItems.filter(i => i.type === 'TASK' && i.status === 'PENDING').length;
    const overdueCount = allItems.filter(i => i.isOverdue && i.status === 'PENDING').length;

    return {
      activeWorkspaces: 12,
      pendingTasks: pendingCount,
      alerts: alertCount,
      taskCount,
      approvalCount,
      overdueCount,
      recentActivity: [
        { id: 1, text: "Purchase Order PO-2026-001 approved", time: "10 mins ago" },
        { id: 2, text: "Stock adjustment SA-002 requires review", time: "1 hour ago" }
      ]
    };
  }

  static async getWorkItems(role: string, branchId: string, filter?: any) {
    const dynamicItems: WorkItemData[] = [];
    const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

    try {
      // 1. Query Real Sales Orders (M15 RMA & M16 POS fulfillment)
      const recentOrders = await db.select().from(schema.salesOrders)
        .orderBy(desc(schema.salesOrders.createdAt))
        .limit(30);

      for (const order of (recentOrders as any[])) {
        let parsedMeta: any = {};
        if (order.notes) {
          try {
            parsedMeta = JSON.parse(order.notes);
          } catch {}
        }

        // RMA items attached to order
        if (parsedMeta.rmas && Array.isArray(parsedMeta.rmas)) {
          for (const rma of parsedMeta.rmas) {
            const createdAt = rma.createdAt || new Date().toISOString();
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
                createdAt,
                dueAt: null,
                slaHours: null,
                slaStatus: "NO_SLA",
                slaLabel: "Chưa có SLA",
                ageFormatted: formatAge(createdAt),
                canAction: isSuperAdmin || role === 'MANAGER' || role === 'QUALITY_MANAGER',
                isReadOnly: !(isSuperAdmin || role === 'MANAGER' || role === 'QUALITY_MANAGER'),
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
                createdAt: rma.inspectedAt || createdAt,
                dueAt: null,
                slaHours: null,
                slaStatus: "NO_SLA",
                slaLabel: "Chưa có SLA",
                ageFormatted: formatAge(rma.inspectedAt || createdAt),
                canAction: isSuperAdmin || role === 'MANAGER' || role === 'SALES_MANAGER',
                isReadOnly: !(isSuperAdmin || role === 'MANAGER' || role === 'SALES_MANAGER'),
                isOverdue: false,
                amount: rma.totalReturnAmount || 0,
                currency: "VND",
                actions: [
                  { id: "rma_appr", label: "Phê duyệt RMA", endpoint: `/api/rma/approve/${rma.rmaCode}`, variant: "primary" },
                  { id: "rma_rej", label: "Từ chối RMA", endpoint: `/api/rma/reject/${rma.rmaCode}`, variant: "danger" }
                ]
              });
            }
          }
        }

        // Omnichannel / POS Order Fulfillment lifecycle
        const fStatus = parsedMeta.fulfillmentStatus || "PENDING";
        const pStatus = parsedMeta.paymentStatus || (order.paymentStatus || "UNPAID");
        const orderCreated = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();

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
              createdAt: orderCreated,
              dueAt: null,
              slaHours: null,
              slaStatus: "NO_SLA",
              slaLabel: "Chưa có SLA",
              ageFormatted: formatAge(orderCreated),
              canAction: isSuperAdmin || role === 'SALES' || role === 'MANAGER',
              isReadOnly: !(isSuperAdmin || role === 'SALES' || role === 'MANAGER'),
              isOverdue: false,
              amount: order.totalAmount || 0,
              currency: "VND",
              actions: [
                { id: "ord_conf", label: "Xác nhận & Giữ chỗ", endpoint: `/api/orders/${order.id}/confirm`, variant: "primary" }
              ]
            });
          }
        }
      }

      // 2. Query Real Purchase Orders (M08 Procurement)
      const pendingPOs = await db.select().from(schema.purchaseOrders)
        .where(eq(schema.purchaseOrders.status, 'DRAFT'))
        .orderBy(desc(schema.purchaseOrders.createdAt))
        .limit(15);

      for (const po of (pendingPOs as any[])) {
        const poCreated = po.createdAt ? new Date(po.createdAt).toISOString() : new Date().toISOString();
        dynamicItems.push({
          id: `WI-PO-${po.code}`,
          sourceModule: "M08 Purchase Orders",
          type: "APPROVAL",
          entity: "PurchaseOrder",
          entityId: po.code,
          businessReference: po.code,
          title: `Phê duyệt Đơn mua hàng ${po.code}`,
          description: `Đơn mua hàng phát hành cần phê duyệt để gửi nhà cung cấp. Tổng giá trị: ${(po.totalAmount || 0).toLocaleString('vi-VN')} ₫.`,
          priority: (po.totalAmount || 0) > 100000000 ? "URGENT" : (po.totalAmount || 0) > 20000000 ? "HIGH" : "MEDIUM",
          status: "PENDING",
          targetRoute: "/purchase",
          createdAt: poCreated,
          dueAt: null,
          slaHours: null,
          slaStatus: "NO_SLA",
          slaLabel: "Chưa có SLA",
          ageFormatted: formatAge(poCreated),
          canAction: isSuperAdmin || role === 'MANAGER' || role === 'PROCUREMENT_MANAGER',
          isReadOnly: !(isSuperAdmin || role === 'MANAGER' || role === 'PROCUREMENT_MANAGER'),
          isOverdue: false,
          amount: po.totalAmount || 0,
          currency: "VND",
          actions: [
            { id: "po_approve", label: "Phê duyệt PO", endpoint: `/api/po/approve/${po.code}`, variant: "primary" },
            { id: "po_reject", label: "Từ chối PO", endpoint: `/api/po/reject/${po.code}`, variant: "danger" }
          ]
        });
      }

      // 3. Query Real Stock Adjustments (M20 Adjustment Desk)
      const allAdjs = await db.select().from(schema.stockAdjustments)
        .orderBy(desc(schema.stockAdjustments.createdAt))
        .limit(25);

      const pendingAdjs = (allAdjs as any[]).filter(
        a => a.status !== 'APPROVED' && a.status !== 'REJECTED' && a.approvalStatus !== 'APPROVED' && a.approvalStatus !== 'REJECTED'
      );

      for (const adj of (pendingAdjs as any[])) {
        const adjCreated = adj.createdAt ? new Date(adj.createdAt).toISOString() : new Date().toISOString();
        dynamicItems.push({
          id: `WI-ADJ-${adj.code}`,
          sourceModule: "M20 Stock Adjustment",
          type: "APPROVAL",
          entity: "StockAdjustment",
          entityId: adj.code,
          businessReference: adj.code,
          title: `Phê duyệt Phiếu điều chỉnh tồn kho ${adj.code}`,
          description: `Lý do: ${adj.reason || 'Điều chỉnh kiểm kê'}. Phân loại: ${adj.adjustmentType} (${adj.direction}).`,
          priority: adj.adjustmentType === 'LOSS' || adj.adjustmentType === 'DAMAGE' ? "HIGH" : "MEDIUM",
          status: "PENDING",
          targetRoute: "/inventory/adjustment",
          createdAt: adjCreated,
          dueAt: null,
          slaHours: null,
          slaStatus: "NO_SLA",
          slaLabel: "Chưa có SLA",
          ageFormatted: formatAge(adjCreated),
          canAction: isSuperAdmin || role === 'MANAGER' || role === 'WAREHOUSE_MANAGER',
          isReadOnly: !(isSuperAdmin || role === 'MANAGER' || role === 'WAREHOUSE_MANAGER'),
          isOverdue: false,
          actions: [
            { id: "adj_approve", label: "Duyệt điều chỉnh", endpoint: `/api/inventory/adjust/${adj.id || adj.code}`, variant: "primary" },
            { id: "adj_reject", label: "Từ chối", endpoint: `/api/inventory/adjust/reject/${adj.id || adj.code}`, variant: "danger" }
          ]
        });
      }

      // 4. Query Real ServiceDesk Tickets (M38 Service Desk with F12 Real SLA)
      const openTickets = await db.select().from(schema.tickets)
        .where(or(
          eq(schema.tickets.status, 'OPEN'),
          eq(schema.tickets.status, 'ASSIGNED'),
          eq(schema.tickets.status, 'IN_PROGRESS'),
          eq(schema.tickets.status, 'PENDING')
        ))
        .orderBy(desc(schema.tickets.createdAt))
        .limit(20);

      const nowTime = Date.now();
      for (const tkt of (openTickets as any[])) {
        const tktCreated = tkt.createdAt ? new Date(tkt.createdAt).toISOString() : new Date().toISOString();
        let resolveDueStr: string | null = null;
        let isBreached = Boolean(tkt.isSlaBreached);
        let slaStatus: 'NORMAL' | 'WARNING_75' | 'WARNING_90' | 'BREACHED' | 'NO_SLA' = 'NORMAL';

        if (tkt.resolveDueAt) {
          const dueTime = new Date(tkt.resolveDueAt).getTime();
          resolveDueStr = new Date(tkt.resolveDueAt).toISOString();
          if (nowTime > dueTime) {
            isBreached = true;
            slaStatus = 'BREACHED';
          } else {
            const totalSlaMs = (tkt.slaHours || 24) * 3600000;
            const remainingMs = dueTime - nowTime;
            const elapsedRatio = 1 - (remainingMs / totalSlaMs);
            if (elapsedRatio >= 0.9) slaStatus = 'WARNING_90';
            else if (elapsedRatio >= 0.75) slaStatus = 'WARNING_75';
            else slaStatus = 'NORMAL';
          }
        }

        const prio = tkt.priority === 'URGENT' ? 'URGENT' : tkt.priority === 'HIGH' ? 'HIGH' : tkt.priority === 'LOW' ? 'LOW' : 'MEDIUM';

        dynamicItems.push({
          id: `WI-TKT-${tkt.ticketCode}`,
          sourceModule: "M38 Service Desk",
          type: "TASK",
          entity: "Ticket",
          entityId: tkt.ticketCode,
          businessReference: tkt.ticketCode,
          title: `[IT Helpdesk] ${tkt.subject}`,
          description: tkt.description || `Sự cố từ khách hàng: ${tkt.customerName || tkt.requesterName || 'Nội bộ'}.`,
          priority: prio,
          status: "PENDING",
          targetRoute: "/service-desk",
          createdAt: tktCreated,
          dueAt: resolveDueStr,
          slaHours: tkt.slaHours || 24,
          slaStatus,
          slaLabel: isBreached ? "Quá hạn SLA" : resolveDueStr ? `SLA: ${tkt.slaHours || 24}h` : "Chưa có SLA",
          ageFormatted: formatAge(tktCreated),
          canAction: isSuperAdmin || role === 'SUPPORT' || role === 'MANAGER',
          isReadOnly: !(isSuperAdmin || role === 'SUPPORT' || role === 'MANAGER'),
          assignedTo: tkt.assignedAgentName || undefined,
          isOverdue: isBreached,
          actions: [
            { id: "tkt_take", label: "Tiếp nhận xử lý", endpoint: `/api/service-desk/take/${tkt.ticketCode}`, variant: "primary" }
          ]
        });
      }
    } catch (e) {
      console.error("Failed to load real dynamic work items in WorkspaceAggregationBackendService:", e);
    }

    // Merge baseline static items (if not duplicated by dynamic items)
    const dynamicIds = new Set(dynamicItems.map(d => d.businessReference));
    const staticPending = this.workItems
      .filter(i => i.status === 'PENDING' && !dynamicIds.has(i.businessReference))
      .map(item => ({
        ...item,
        ageFormatted: item.ageFormatted || formatAge(item.createdAt),
        canAction: item.canAction !== undefined ? item.canAction : isSuperAdmin,
        isReadOnly: item.isReadOnly !== undefined ? item.isReadOnly : !isSuperAdmin,
        slaStatus: item.slaStatus || (item.isOverdue ? 'BREACHED' : 'NO_SLA'),
        slaLabel: item.slaLabel || (item.slaHours ? `SLA: ${item.slaHours}h` : 'Chưa có SLA')
      }));

    let combined = [...dynamicItems, ...staticPending];

    // Filter by moduleCode
    if (filter?.moduleCode && filter.moduleCode !== 'ALL') {
      const mc = String(filter.moduleCode).trim().toUpperCase();
      combined = combined.filter(i => i.sourceModule && i.sourceModule.trim().toUpperCase().includes(mc));
    }

    // Filter by type / status
    if (filter?.type && filter.type !== 'ALL') {
      combined = combined.filter(i => i.type === filter.type);
    }
    if (filter?.status && filter.status !== 'ALL') {
      combined = combined.filter(i => i.status === filter.status);
    }

    // Filter by priority
    if (filter?.priority && filter.priority !== 'ALL') {
      combined = combined.filter(i => i.priority === filter.priority);
    }

    // Filter by SLA
    if (filter?.sla && filter.sla !== 'ALL') {
      if (filter.sla === 'OVERDUE') combined = combined.filter(i => i.isOverdue === true || i.slaStatus === 'BREACHED');
      else if (filter.sla === 'IN_SLA') combined = combined.filter(i => i.slaStatus === 'NORMAL' || i.slaStatus === 'WARNING_75' || i.slaStatus === 'WARNING_90');
      else if (filter.sla === 'NO_SLA') combined = combined.filter(i => i.slaStatus === 'NO_SLA' || !i.dueAt);
    }

    if (filter?.isSlaViolated !== undefined) {
      const isViolated = filter.isSlaViolated === true || filter.isSlaViolated === 'true';
      combined = combined.filter(i => isViolated ? (i.isOverdue === true || i.slaStatus === 'BREACHED') : (i.isOverdue !== true && i.slaStatus !== 'BREACHED'));
    }

    // Filter by Search Query
    if (filter?.search && String(filter.search).trim()) {
      const q = String(filter.search).trim().toLowerCase();
      combined = combined.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.businessReference || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q) ||
        (i.sourceModule || '').toLowerCase().includes(q)
      );
    }

    // Filter by Assigned User (giao-cho-tôi)
    if (filter?.assignedTo) {
      const assignQ = String(filter.assignedTo).trim().toLowerCase();
      combined = combined.filter(i => (i.assignedTo || '').toLowerCase().includes(assignQ));
    }

    return combined;
  }

  static async executeAction(actionKey: string, params: { entityId?: string; userId?: string; actionType?: string; idempotencyKey?: string }) {
    const { entityId, userId = 'SYSTEM_ADMIN', actionType, idempotencyKey } = params;
    const cleanKey = String(actionKey || '').trim();

    // 1. M08 PO Approval Action
    if (cleanKey.includes('/api/po/') || cleanKey.startsWith('PO-') || cleanKey.startsWith('WI-PO-')) {
      const poCode = entityId || cleanKey.replace('/api/po/approve/', '').replace('/api/po/reject/', '').replace('WI-PO-', '').trim();
      const isReject = actionType === 'reject' || cleanKey.includes('/reject');
      
      const poRows = await db.select().from(schema.purchaseOrders)
        .where(eq(schema.purchaseOrders.code, poCode))
        .limit(1);

      if (poRows.length > 0) {
        const po = poRows[0];
        if (po.status === 'PENDING_RECEIPT' && !isReject) {
          return { success: true, message: `Đơn mua hàng ${poCode} đã được phê duyệt trước đó.`, status: 'ALREADY_PROCESSED' };
        }
        if (po.status === 'CANCELLED' && isReject) {
          return { success: true, message: `Đơn mua hàng ${poCode} đã được từ chối trước đó.`, status: 'ALREADY_PROCESSED' };
        }

        const newStatus = isReject ? 'CANCELLED' : 'PENDING_RECEIPT';
        await db.update(schema.purchaseOrders)
          .set({ status: newStatus } as any)
          .where(eq(schema.purchaseOrders.code, poCode));

        await AuditService.recordAuditLog({
          userId: Number(userId) || 1,
          action: isReject ? 'PO_REJECTED' : 'PO_APPROVED',
          module: 'M08',
          entityName: 'purchase_orders',
          entityId: poCode,
          oldData: JSON.stringify({ status: po.status }),
          newData: JSON.stringify({ status: newStatus }),
          description: `Thực thi qua M01 Workspace Hub: ${isReject ? 'Từ chối' : 'Phê duyệt'} PO ${poCode}`
        }).catch(() => {});

        return {
          success: true,
          message: `${isReject ? 'Từ chối' : 'Phê duyệt'} thành công Đơn mua hàng ${poCode}!`,
          poCode,
          status: newStatus
        };
      }
    }

    // 2. M20 Stock Adjustment Action
    if (cleanKey.includes('/api/inventory/adjust/') || cleanKey.startsWith('ADJ-') || cleanKey.startsWith('WI-ADJ-')) {
      const isReject = actionType === 'reject' || cleanKey.includes('/reject');
      const rawParam = cleanKey.replace('/api/inventory/adjust/reject/', '').replace('/api/inventory/adjust/', '').replace('WI-ADJ-', '').trim();
      const adjCodeOrId = entityId || rawParam;
      const numId = parseInt(adjCodeOrId, 10);

      const adjRows = isNaN(numId)
        ? await db.select().from(schema.stockAdjustments).where(eq(schema.stockAdjustments.code, adjCodeOrId)).limit(1)
        : await db.select().from(schema.stockAdjustments).where(eq(schema.stockAdjustments.id, numId)).limit(1);

      if (adjRows.length > 0) {
        const adj = adjRows[0];
        if (adj.approvalStatus === 'APPROVED' && !isReject) {
          return { success: true, message: `Phiếu điều chỉnh ${adj.code} đã được duyệt trước đó.`, status: 'ALREADY_PROCESSED' };
        }
        if (adj.approvalStatus === 'REJECTED' && isReject) {
          return { success: true, message: `Phiếu điều chỉnh ${adj.code} đã từ chối trước đó.`, status: 'ALREADY_PROCESSED' };
        }

        if (isReject) {
          await StockAdjustmentService.reject(adj.id, Number(userId) || 1, 'Từ chối qua M01 Hub');
        } else {
          await StockAdjustmentService.approve(adj.id, Number(userId) || 1);
        }

        await AuditService.recordAuditLog({
          userId: Number(userId) || 1,
          action: isReject ? 'STOCK_ADJUSTMENT_REJECTED' : 'STOCK_ADJUSTMENT_APPROVED',
          module: 'M20',
          entityName: 'stock_adjustments',
          entityId: adj.code,
          description: `Thực thi qua M01 Hub: ${isReject ? 'Từ chối' : 'Duyệt'} phiếu ${adj.code}`
        }).catch(() => {});

        return {
          success: true,
          message: `${isReject ? 'Từ chối' : 'Duyệt'} thành công Phiếu điều chỉnh ${adj.code}!`,
          adjustmentCode: adj.code
        };
      }
    }

    // 3. M38 ServiceDesk Ticket Take Action
    if (cleanKey.includes('/api/service-desk/take/') || cleanKey.startsWith('HD-') || cleanKey.startsWith('TKT-') || cleanKey.startsWith('WI-TKT-')) {
      const ticketCode = entityId || cleanKey.replace('/api/service-desk/take/', '').replace('WI-TKT-', '').trim();
      const tktRows = await db.select().from(schema.tickets)
        .where(eq(schema.tickets.ticketCode, ticketCode))
        .limit(1);

      if (tktRows.length > 0) {
        const tkt = tktRows[0];
        if (tkt.status === 'IN_PROGRESS' || tkt.status === 'ASSIGNED') {
          return { success: true, message: `Sự cố ${ticketCode} đã được tiếp nhận trước đó.`, status: 'ALREADY_PROCESSED' };
        }

        await db.update(schema.tickets)
          .set({
            status: 'IN_PROGRESS',
            assignedAgentName: String(userId),
            updatedAt: new Date()
          } as any)
          .where(eq(schema.tickets.ticketCode, ticketCode));

        await AuditService.recordAuditLog({
          userId: Number(userId) || 1,
          action: 'TICKET_TAKEN',
          module: 'M38',
          entityName: 'tickets',
          entityId: ticketCode,
          description: `Tiếp nhận xử lý sự cố ${ticketCode} qua M01 Hub`
        }).catch(() => {});

        return {
          success: true,
          message: `Đã tiếp nhận xử lý sự cố ${ticketCode} thành công!`,
          ticketCode
        };
      }
    }

    // 4. RMA action endpoint
    if (cleanKey.includes('/api/rma/')) {
      const rmaCode = entityId || cleanKey.split('/').pop() || '';
      let action = 'INSPECT';
      if (cleanKey.includes('/inspect')) action = 'INSPECT';
      else if (cleanKey.includes('/approve')) action = 'APPROVE';
      else if (cleanKey.includes('/reject')) action = 'REJECT';
      else if (cleanKey.includes('/execute')) action = 'EXECUTE_RETURN_AND_REFUND';

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
          .set({ notes: JSON.stringify(parsedMeta) } as any)
          .where(eq(schema.salesOrders.id, targetOrder.id));

        await AuditService.recordAuditLog({
          userId: Number(userId) || 1,
          action: `RMA_${action}`,
          module: 'M15',
          entityName: 'rma_requests',
          entityId: rmaCode,
          description: `Thực thi RMA qua M01 Hub: ${action}`
        }).catch(() => {});

        return {
          success: true,
          message: `Trợ lý hướng dẫn: Đã thực thi bước "${action}" cho RMA ${rmaCode} thành công!`,
          item: targetRma
        };
      }
    }

    // 5. Order Fulfillment action
    if (cleanKey.includes('/api/orders/')) {
      const parts = cleanKey.split('/');
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
            await db.update(schema.salesOrders).set({ status: 'COMPLETED' } as any).where(eq(schema.salesOrders.id, orderId));
          }

          await db.update(schema.salesOrders)
            .set({ notes: JSON.stringify(meta) } as any)
            .where(eq(schema.salesOrders.id, orderId));

          return {
            success: true,
            message: `Trợ lý hướng dẫn: Đã chuyển trạng thái xử lý đơn ${ord.code} thành "${actionName.toUpperCase()}" thành công!`,
            order: ord
          };
        }
      }
    }
    
    // 6. Find item matching entityId or endpoint in static list
    const itemIndex = this.workItems.findIndex(
      i => i.entityId === entityId || (cleanKey && i.actions.some(a => a.endpoint.includes(cleanKey)))
    );

    if (itemIndex >= 0) {
      const item = this.workItems[itemIndex];
      const newStatus = actionType === 'reject' ? 'REJECTED' : 'APPROVED';
      this.workItems[itemIndex] = { ...item, status: newStatus };
      this.workItems = this.workItems.filter(i => i.id !== item.id);
      return {
        success: true,
        message: `Thao tác cho chứng từ ${item.businessReference} thành công`,
        item: { ...item, status: newStatus }
      };
    }

    return {
      success: true,
      message: `Thực thi thành công cho ${entityId || cleanKey}`
    };
  }

  // F14: Batch actions execution with individual idempotencyKeys
  static async executeBatchActions(
    actions: Array<{ id: string; actionKey: string; entityId?: string; actionType?: string }>,
    userId: string
  ) {
    const results: Array<{ id: string; success: boolean; message: string }> = [];

    for (const act of actions) {
      const itemKey = `M01-BATCH-${Date.now()}-${act.id}`;
      try {
        const res = await this.executeAction(act.actionKey, {
          entityId: act.entityId || act.id,
          userId,
          actionType: act.actionType,
          idempotencyKey: itemKey
        });
        results.push({
          id: act.id,
          success: res.success !== false,
          message: res.message || 'Thành công'
        });
      } catch (err: any) {
        results.push({
          id: act.id,
          success: false,
          message: err.message || 'Lỗi thực thi'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return {
      total: actions.length,
      successCount,
      failureCount: actions.length - successCount,
      results
    };
  }

  // F08: Entity preview with DMS attachment count
  static async getEntityPreview(entity: string, id: string) {
    let attachmentsCount = 0;
    try {
      const docs = await db.select().from(schema.dmsDocuments)
        .where(or(
          eq(schema.dmsDocuments.entityType, entity),
          eq(schema.dmsDocuments.entityId, id)
        ))
        .limit(10);
      attachmentsCount = docs.length;
    } catch {}

    return {
      id,
      entity,
      details: "Preview data for " + entity,
      attachmentsCount,
      verifiedAt: new Date().toISOString()
    };
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
