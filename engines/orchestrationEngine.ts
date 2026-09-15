import { db } from "../src/db";
import { businessWorkspaces, businessProcesses, businessTasks, functionalGroups } from "../src/db/schema";
import { ProcessEngine, ensureProcessTraceabilityTablesExist } from "./processEngine";
import { eq, and, desc } from "drizzle-orm";

export class OrchestrationEngine {
  
  static async seedDefinitions() {
    // Seed Functional Groups
    const groups = [
      { code: 'FINANCIAL', name: 'Tài chính & Kế toán', icon: 'DollarSign', displayOrder: 1 },
      { code: 'OPERATIONS', name: 'Vận hành & Chuỗi Cung Ứng', icon: 'Truck', displayOrder: 2 },
      { code: 'COMMERCE', name: 'Thương mại', icon: 'ShoppingCart', displayOrder: 3 },
      { code: 'PRODUCTION', name: 'Sản xuất', icon: 'Factory', displayOrder: 4 },
      { code: 'MANAGEMENT', name: 'Quản lý & Phân tích', icon: 'BarChart2', displayOrder: 5 },
      { code: 'SYSTEM', name: 'Hệ thống & Admin', icon: 'Settings', displayOrder: 6 },
    ];
    
    for (const g of groups) {
      const [existing] = await db.select().from(functionalGroups).where(eq(functionalGroups.code, g.code)).limit(1);
      if (!existing) {
        await db.insert(functionalGroups).values(g);
      }
    }
    
    const allGroups = await db.select().from(functionalGroups);
    const getGroupId = (code) => allGroups.find(g => g.code === code)?.id;

    // Seed Workspaces
    const workspaces = [
      { type: 'FIN_01_AR', group: 'FINANCIAL', name: 'Accounts Receivable (AR)', description: 'O2C Invoicing, receipts, reconciliation', icon: 'ArrowDownLeft', color: 'bg-green-500', displayOrder: 1 },
      { type: 'FIN_02_AP', group: 'FINANCIAL', name: 'Accounts Payable (AP)', description: 'P2P invoice matching, payments', icon: 'ArrowUpRight', color: 'bg-red-500', displayOrder: 2 },
      { type: 'FIN_03_CASH', group: 'FINANCIAL', name: 'Cash Management', description: 'Cash collection, disbursement, bank rec', icon: 'Wallet', color: 'bg-emerald-500', displayOrder: 3 },
      { type: 'FIN_04_GL', group: 'FINANCIAL', name: 'General Ledger & Reporting', description: 'GL posting, trial balance, statements', icon: 'BookOpen', color: 'bg-blue-600', displayOrder: 4 },
      { type: 'FIN_05_ASSET', group: 'FINANCIAL', name: 'Assets & Fixed Asset Mgmt', description: 'Acquisition, depreciation, disposal', icon: 'Building2', color: 'bg-indigo-500', displayOrder: 5 },
      { type: 'OPS_01_INBOUND', group: 'OPERATIONS', name: 'Inbound & Receiving', description: 'GR receipt, inspection, lot creation', icon: 'ArrowDownToLine', color: 'bg-sky-500', displayOrder: 1 },
      { type: 'OPS_02_STOCK_MGMT', group: 'OPERATIONS', name: 'Stock Management & Balance', description: 'Stock allocation, locations, serials', icon: 'Boxes', color: 'bg-amber-500', displayOrder: 2 },
      { type: 'OPS_03_OUTBOUND', group: 'OPERATIONS', name: 'Outbound & Picking', description: 'Picking, packing, shipping', icon: 'ArrowUpFromLine', color: 'bg-orange-500', displayOrder: 3 },
      { type: 'OPS_04_TRANSFER', group: 'OPERATIONS', name: 'Stock Transfer & Movement', description: 'Inter-warehouse, adjustments', icon: 'ArrowLeftRight', color: 'bg-cyan-500', displayOrder: 4 },
      { type: 'OPS_05_STOCKTAKE', group: 'OPERATIONS', name: 'Inventory Reconciliation', description: 'Stocktake planning, physical count', icon: 'ClipboardCheck', color: 'bg-lime-500', displayOrder: 5 },
      { type: 'OPS_06_RETURNS', group: 'OPERATIONS', name: 'Return Management', description: 'Sales/Purchase returns, inspections', icon: 'Undo2', color: 'bg-rose-500', displayOrder: 6 },
      { type: 'OPS_07_SUPPLY_CHAIN', group: 'OPERATIONS', name: 'Supply Chain Planning', description: 'Demand forecasting, MRP, reorder', icon: 'LineChart', color: 'bg-violet-500', displayOrder: 7 },
      { type: 'OPS_08_ALERTS', group: 'OPERATIONS', name: 'Inventory Alerts', description: 'Out of stock, expirations, overstock', icon: 'BellRing', color: 'bg-red-600', displayOrder: 8 },
      { type: 'COM_01_SALES', group: 'COMMERCE', name: 'Sales Order-to-Cash', description: 'Order entry, reservation, picking', icon: 'BadgeDollarSign', color: 'bg-blue-500', displayOrder: 1 },
      { type: 'COM_02_POS', group: 'COMMERCE', name: 'Point of Sale', description: 'POS transactions, payment processing', icon: 'Store', color: 'bg-teal-500', displayOrder: 2 },
      { type: 'COM_03_PURCHASE', group: 'COMMERCE', name: 'Purchase Order & Procure', description: 'RFQ to PO, goods receipt', icon: 'ShoppingBag', color: 'bg-purple-500', displayOrder: 3 },
      { type: 'COM_04_CUSTOMER', group: 'COMMERCE', name: 'Customer Management', description: 'CRM, credit limits, scoring', icon: 'Users', color: 'bg-pink-500', displayOrder: 4 },
      { type: 'COM_05_SUPPLIER', group: 'COMMERCE', name: 'Supplier Management', description: 'SRM, terms, evaluations', icon: 'Briefcase', color: 'bg-slate-500', displayOrder: 5 },
      { type: 'COM_06_COMMISSION', group: 'COMMERCE', name: 'Commission & Sales KPI', description: 'Commission plans, tracking, payouts', icon: 'Percent', color: 'bg-fuchsia-500', displayOrder: 6 },
      { type: 'PROD_01_MFG', group: 'PRODUCTION', name: 'Manufacturing Orders', description: 'Planning, release, execution', icon: 'Wrench', color: 'bg-orange-600', displayOrder: 1 },
      { type: 'PROD_02_SUBCONTRACTING', group: 'PRODUCTION', name: 'Subcontracting Management', description: 'Subcontract orders, material supply', icon: 'Handshake', color: 'bg-cyan-600', displayOrder: 2 },
      { type: 'PROD_03_QUALITY', group: 'PRODUCTION', name: 'Quality Management', description: 'QC incoming/in-process, CAPA', icon: 'ShieldCheck', color: 'bg-green-600', displayOrder: 3 },
      { type: 'MGT_01_REPORTS', group: 'MANAGEMENT', name: 'Business Reports & Analytics', description: 'Sales, inventory, executive dashboard', icon: 'PieChart', color: 'bg-blue-700', displayOrder: 1 },
      { type: 'MGT_02_AUDIT', group: 'MANAGEMENT', name: 'Audit & Compliance', description: 'Audit trails, retention, compliance', icon: 'FileSearch', color: 'bg-indigo-700', displayOrder: 2 },
      { type: 'MGT_03_ANALYTICS', group: 'MANAGEMENT', name: 'Business Intelligence', description: 'Consolidation, trending, forecasting', icon: 'TrendingUp', color: 'bg-purple-700', displayOrder: 3 },
      { type: 'SYS_01_ADMIN', group: 'SYSTEM', name: 'System Administration', description: 'Users, roles, fiscal periods', icon: 'Shield', color: 'bg-slate-800', displayOrder: 1 },
      { type: 'SYS_02_WORKFLOW', group: 'SYSTEM', name: 'Business Process Orchestration', description: 'Workflow design, SLAs', icon: 'Network', color: 'bg-slate-700', displayOrder: 2 },
      { type: 'SYS_03_DATA', group: 'SYSTEM', name: 'Data & Integration', description: 'Import, export, backup, API', icon: 'Database', color: 'bg-slate-600', displayOrder: 3 },
      { type: 'SYS_04_SECURITY', group: 'SYSTEM', name: 'Security & Access Control', description: 'Access, passwords, logs', icon: 'Lock', color: 'bg-slate-900', displayOrder: 4 },
    ];
    
    let wsId = null;
    for (const w of workspaces) {
      const gId = getGroupId(w.group);
      if (!gId) continue;
      
      const [existing] = await db.select().from(businessWorkspaces).where(eq(businessWorkspaces.type, w.type)).limit(1);
      if (existing) {
        if (!wsId) wsId = existing.id;
        await db.update(businessWorkspaces).set({
          functionalGroupId: gId,
          name: w.name,
          description: w.description,
          icon: w.icon,
          color: w.color,
          displayOrder: w.displayOrder
        } as any).where(eq(businessWorkspaces.type, w.type));
      } else {
        const [inserted] = await db.insert(businessWorkspaces).values({
          functionalGroupId: gId,
          type: w.type,
          name: w.name,
          description: w.description,
          icon: w.icon,
          color: w.color,
          displayOrder: w.displayOrder
        } as any).returning();
        if (!wsId) wsId = inserted.id;
      }
    }

    const processes = [
      { key: "O2C_FLOW", name: "Order to Cash" },
      { key: "P2P_FLOW", name: "Procure to Pay" },
      { key: "INVENTORY_RECONCILIATION", name: "Inventory Reconciliation" },
      { key: "PURCHASE_RETURN", name: "Purchase Return" },
      { key: "SALES_RETURN", name: "Sales Return" },
      { key: "INVENTORY_TRANSFER", name: "Inventory Transfer" }
    ];

    for (const proc of processes) {
      const [existing] = await db.select().from(businessProcesses).where(eq(businessProcesses.processKey, proc.key)).limit(1);
      if (!existing) {
        await db.insert(businessProcesses).values({
          processKey: proc.key,
          name: proc.name,
          workspaceId: wsId,
          isActive: true
        } as any);
      }
    }
  }

  static async handleEvent(processDefinitionKey: string, businessKey: string, stepCode: string, payload: any, txHandle?: any) {
    const executor = txHandle || db;
    
    // 1. Start or Get Process
    const processInstance = await ProcessEngine.startOrGetProcessInstance({
      processDefinitionKey,
      processName: processDefinitionKey,
      businessKey,
      rootEntityModule: "ORCHESTRATION",
      rootEntityType: "PROCESS",
      rootEntityId: String(businessKey),
      initialStep: stepCode,
      correlationId: String(businessKey),
    }, executor);

    // 2. Record Step Transition
    await ProcessEngine.recordStepTransition({
      processInstanceId: processInstance.id,
      stepCode: stepCode,
      stepName: `Completed: ${stepCode}`,
      status: "COMPLETED",
      entityModule: "ORCHESTRATION",
      entityType: "PROCESS",
      entityId: String(businessKey),
    }, executor);

    // 3. Generate Next Task based on Process Rules
    const nextTask = this.determineNextTask(processDefinitionKey, stepCode, payload);
    if (nextTask) {
      const [bp] = await executor.select().from(businessProcesses).where(eq(businessProcesses.processKey, processDefinitionKey)).limit(1);
      const targetProcessId = bp ? bp.id : processInstance.id;

      // Check idempotency for task creation per entity
      const [existingTask] = await executor.select().from(businessTasks).where(
        and(
          eq(businessTasks.entityId, String(businessKey)),
          eq(businessTasks.taskCode, nextTask.taskCode)
        )
      ).limit(1);

      if (!existingTask) {
        await executor.insert(businessTasks).values({
          processInstanceId: targetProcessId,
          taskCode: nextTask.taskCode,
          title: nextTask.title,
          status: "PENDING",
          assignedRole: nextTask.assignedRole,
          entityModule: nextTask.entityModule,
          entityType: nextTask.entityType,
          entityId: String(businessKey),
          actionEndpoint: nextTask.actionEndpoint,
          actionPayload: JSON.stringify(nextTask.actionPayload || {}),
          createdAt: new Date()
        });
      }
    } else {
      // Complete Process if no next task
      await ProcessEngine.recordStepTransition({
        processInstanceId: processInstance.id,
        stepCode: "PROCESS_COMPLETED",
        stepName: "Process Completed",
        status: "COMPLETED_TERMINAL",
        entityModule: "ORCHESTRATION",
        entityType: "PROCESS",
        entityId: String(businessKey),
        isTerminalStep: true
      }, executor);
    }
  }

  static determineNextTask(processKey: string, completedStep: string, payload: any) {
    if (processKey === "O2C_FLOW") {
      if (completedStep === "OrderConfirmed") {
        return {
          taskCode: "PICK_SO",
          title: "Pick & Issue Stock for Sales Order",
          assignedRole: "WAREHOUSE_MANAGER",
          entityModule: "WMS",
          entityType: "SALES_ORDER",
          actionEndpoint: `/api/sales-orders/${payload.id || payload.orderId}/issue`
        };
      }
      if (completedStep === "StockIssued") {
        return {
          taskCode: "CREATE_INVOICE",
          title: "Create Invoice for Sales Order",
          assignedRole: "ACCOUNTANT",
          entityModule: "FINANCE",
          entityType: "SALES_ORDER",
          actionEndpoint: `/api/sales-orders/${payload.id || payload.orderId || payload.salesOrderId}/complete`
        };
      }
      if (completedStep === "InvoiceIssued") {
        return {
          taskCode: "RECEIVE_PAYMENT",
          title: "Receive Payment",
          assignedRole: "ACCOUNTANT",
          entityModule: "FINANCE",
          entityType: "INVOICE",
          actionEndpoint: `/api/sales-orders/${payload.id || payload.orderId || payload.salesOrderId}/pay`
        };
      }
    }

    if (processKey === "P2P_FLOW") {
      if (completedStep === "POApproved") {
        return {
          taskCode: "RECEIVE_GOODS",
          title: "Receive Goods (GR)",
          assignedRole: "WAREHOUSE_MANAGER",
          entityModule: "WMS",
          entityType: "PURCHASE_ORDER",
          actionEndpoint: `/api/goods-receipts`,
          actionPayload: { purchaseOrderId: payload.id }
        };
      }
      if (completedStep === "GoodsReceived") {
        return {
          taskCode: "MATCH_INVOICE",
          title: "Three-way Match AP Invoice",
          assignedRole: "ACCOUNTANT",
          entityModule: "FINANCE",
          entityType: "PURCHASE_ORDER",
          actionEndpoint: `/api/invoices`,
          actionPayload: { purchaseOrderId: payload.id }
        };
      }
    }

    if (processKey === "INVENTORY_RECONCILIATION") {
      if (completedStep === "StocktakeCompleted") {
        return {
          taskCode: "APPROVE_VARIANCE",
          title: "Approve Stocktake Variance",
          assignedRole: "MANAGER",
          entityModule: "INVENTORY",
          entityType: "STOCKTAKE",
          actionEndpoint: `/api/stocktakes/${payload.id || payload.stocktakeId}/approve`
        };
      }
    }

    if (processKey === "PURCHASE_RETURN") {
      if (completedStep === "PR_CREATED") {
        return {
          taskCode: "PROCESS_PR",
          title: "Process Purchase Return",
          assignedRole: "MANAGER",
          entityModule: "PURCHASE",
          entityType: "PURCHASE_RETURN",
          actionEndpoint: `/api/purchase-returns/${payload.id}/process`
        };
      }
    }

    if (processKey === "SALES_RETURN") {
      if (completedStep === "SR_CREATED") {
        return {
          taskCode: "PROCESS_SR",
          title: "Process Sales Return",
          assignedRole: "MANAGER",
          entityModule: "SALES",
          entityType: "SALES_RETURN",
          actionEndpoint: `/api/sales-returns/${payload.id}/process`
        };
      }
    }

    return null;
  }
}
