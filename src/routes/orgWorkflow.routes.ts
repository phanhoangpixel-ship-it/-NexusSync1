import { Router } from "express";
import { OrgBudgetService, WorkflowMatrixEngine } from "../data/orgMasterData";

export const orgWorkflowRouter = Router();

/**
 * Phase 8: GET /api/org/cost-centers
 * Trọng tâm 5 - Tích hợp M30 General Ledger & Budget Guard
 * Returns authoritative Cost Center directory with real-time budget balances
 */
orgWorkflowRouter.get('/api/org/cost-centers', (req, res) => {
  try {
    const costCenters = OrgBudgetService.getAllCostCenters();
    res.json({
      success: true,
      total: costCenters.length,
      data: costCenters
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Phase 8: GET /api/org/cost-centers/:code
 * Query a specific Cost Center by code or department
 */
orgWorkflowRouter.get('/api/org/cost-centers/:code', (req, res) => {
  try {
    const { code } = req.params;
    const cc = OrgBudgetService.getCostCenterByCode(code);
    if (!cc) {
      return res.status(404).json({ success: false, error: `Cost Center '${code}' not found` });
    }
    res.json({ success: true, data: cc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Phase 8: POST /api/org/cost-centers/check-budget
 * Validates whether an expenditure can be accommodated by the cost center's available budget.
 */
orgWorkflowRouter.post('/api/org/cost-centers/check-budget', (req, res) => {
  try {
    const { costCenter, amount } = req.body;
    if (!costCenter || amount === undefined) {
      return res.status(400).json({ error: 'Missing costCenter or amount' });
    }

    const check = OrgBudgetService.checkBudget(costCenter, Number(amount));
    if (!check.allowed) {
      return res.status(422).json({
        success: false,
        allowed: false,
        error: 'BUDGET_GUARD_EXCEEDED',
        message: check.message,
        costCenter: check.costCenter.code,
        costCenterName: check.costCenter.name,
        availableBudget: check.availableBudget,
        requestedAmount: Number(amount),
        deficit: check.deficit,
        requiresOverride: check.requiresOverride
      });
    }

    res.json({
      success: true,
      allowed: true,
      message: check.message,
      costCenter: check.costCenter.code,
      availableBudget: check.availableBudget,
      remainingAfterCommit: check.availableBudget - Number(amount)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Phase 9: POST /api/workflow/matrix
 * Trọng tâm 7 - Tích hợp M28 Delegation of Authority Matrix
 * Evaluates approval routing:
 * - Standard <= 500.000.000 VNĐ -> Procurement Manager
 * - Escalated > 500.000.000 VNĐ -> Multi-tier approval routing to CPO / Director / CFO
 */
orgWorkflowRouter.post('/api/workflow/matrix', (req, res) => {
  try {
    const { amount, entityType, currency, costCenter, entityId } = req.body;
    if (amount === undefined) {
      return res.status(400).json({ error: 'Missing amount in request body' });
    }

    const matrixResult = WorkflowMatrixEngine.evaluateMatrix(
      Number(amount), 
      entityType || 'SOURCING_AWARD', 
      currency || 'VND'
    );

    res.json({
      success: true,
      entityId: entityId || null,
      costCenter: costCenter || 'CC-PROCUREMENT',
      ...matrixResult
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Phase 9: GET /api/workflow/matrix/rules
 * Returns governing matrix thresholds and SLA configurations
 */
orgWorkflowRouter.get('/api/workflow/matrix/rules', (req, res) => {
  res.json({
    success: true,
    engine: 'M28 Enterprise Workflow & Delegation of Authority Matrix',
    thresholds: [
      {
        tier: 1,
        name: 'Thẩm Quyền Đơn Cấp (Standard Approval)',
        maxLimit: WorkflowMatrixEngine.SINGLE_TIER_THRESHOLD,
        currency: 'VND',
        approverRole: 'PROCUREMENT_MANAGER',
        approverTitle: 'Trưởng phòng Mua sắm',
        slaHours: 24,
        description: 'Duyệt các gói thầu, RFQ và đơn đặt hàng có giá trị ≤ 500.000.000 VNĐ'
      },
      {
        tier: 2,
        name: 'Thẩm Quyền Đa Cấp Khối (Director Escalation)',
        minLimit: WorkflowMatrixEngine.SINGLE_TIER_THRESHOLD,
        maxLimit: WorkflowMatrixEngine.EXECUTIVE_THRESHOLD,
        currency: 'VND',
        approverRoles: ['PROCUREMENT_MANAGER', 'PROCUREMENT_DIRECTOR'],
        approverTitles: ['Trưởng phòng Mua sắm', 'Giám đốc Khối Mua sắm / CPO'],
        slaHours: 48,
        description: 'Tự động kích hoạt khi giá trị vượt > 500.000.000 VNĐ và ≤ 2.000.000.000 VNĐ'
      },
      {
        tier: 3,
        name: 'Thẩm Quyền Ban Điều Hành (Executive Board / CFO)',
        minLimit: WorkflowMatrixEngine.EXECUTIVE_THRESHOLD,
        currency: 'VND',
        approverRoles: ['PROCUREMENT_MANAGER', 'PROCUREMENT_DIRECTOR', 'CHIEF_FINANCIAL_OFFICER'],
        approverTitles: ['Trưởng phòng Mua sắm', 'Giám đốc Mua sắm', 'Giám đốc Tài chính (CFO) / CEO'],
        slaHours: 72,
        description: 'Bắt buộc đối với các hợp đồng quy mô chiến lược > 2.000.000.000 VNĐ'
      }
    ]
  });
});
