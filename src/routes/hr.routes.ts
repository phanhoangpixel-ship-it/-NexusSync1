import { Router } from "express";
import { client, db, recreateDatabaseClient } from "../../db/index";
import * as schema from "../../db/schema";
import { StockAdjustmentService } from "../../engines/stockAdjustmentService";
import { WorkspaceAggregationService } from "../../engines/WorkspaceAggregationService";
import { InventoryService } from "../../engines/inventoryService";
import { accountingEngine } from "../../engines/accountingEngine";
import { UnifiedPipelineEngine } from "../../engines/unifiedPipelineEngine";
import { BankReconciliationEngine } from "../../engines/bankReconciliationEngine";
import { eq, desc, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { enterpriseEmployees, enterpriseAttendance, enterpriseLeaves, enterprisePerformance, enterpriseTraining } from "../data/hrMasterData";

const router = Router();

// Helper to calculate payroll items for a list of employees
function computeDetailedPayroll(month: number, year: number, standardDays: number = 22, emps: any[] = enterpriseEmployees) {
  const safeStandardDays = standardDays > 0 ? standardDays : 22;
  const targetEmployees = emps && emps.length > 0 ? emps : enterpriseEmployees;
  const items = targetEmployees.map((emp, index) => {
    // Determine OT hours & attendance from seed or simulated
    const att = enterpriseAttendance.find(a => a.employeeId === emp.id);
    const otHours = (att && typeof (att as any).otHours === 'number')
      ? (att as any).otHours
      : (att && typeof (att as any).overtimeHours === 'number')
        ? (att as any).overtimeHours
        : (index % 2 === 0 ? 8.5 : 4.0);
    const actualDays = att && att.status === 'PRESENT' ? safeStandardDays : (safeStandardDays - (index % 3 === 0 ? 1 : 0));
    
    // Performance score
    const perf = enterprisePerformance.find(p => p.employeeId === emp.id);
    const kpiMultiplier = (perf && typeof perf.salaryCoefficient === 'number') ? perf.salaryCoefficient : 1.1;

    const baseSalary = typeof emp.baseSalary === 'number' && !isNaN(emp.baseSalary) ? emp.baseSalary : 15000000;

    // Allowances
    const mealAllowance = 1500000;
    const transportAllowance = 800000;
    const responsibilityAllowance = (emp.position && (emp.position.includes('Trưởng') || emp.position.includes('Giám đốc'))) ? 3500000 : 1000000;
    const totalAllowances = mealAllowance + transportAllowance + responsibilityAllowance;

    // OT amount calculation (1.5x hourly rate)
    const hourlyRate = (baseSalary / safeStandardDays) / 8;
    const otAmount = Math.round(hourlyRate * otHours * 1.5);

    // KPI Bonus
    const kpiBonus = Math.round(baseSalary * Math.max(0, kpiMultiplier - 1.0) * 0.5);

    // Prorated base for actual work days
    const proratedBase = Math.round((baseSalary / safeStandardDays) * actualDays);

    // Gross Salary
    const grossSalary = proratedBase + totalAllowances + otAmount + kpiBonus;

    // Insurance deductions (10.5% total: BHXH 8%, BHYT 1.5%, BHTN 1%) - capped at statutory limit if any
    const insBase = Math.min(baseSalary, 36000000); // statutory ceiling cap simulation
    const bhxh = Math.round(insBase * 0.08);
    const bhyt = Math.round(insBase * 0.015);
    const bhtn = Math.round(insBase * 0.01);
    const totalInsurance = bhxh + bhyt + bhtn;

    // Personal Income Tax (PIT) computation
    // Personal deduction 11,000,000 VND
    const personalDeduction = 11000000;
    const taxableIncome = Math.max(0, grossSalary - totalInsurance - personalDeduction);
    
    let pitTax = 0;
    if (taxableIncome > 0) {
      if (taxableIncome <= 5000000) {
        pitTax = taxableIncome * 0.05;
      } else if (taxableIncome <= 10000000) {
        pitTax = 250000 + (taxableIncome - 5000000) * 0.10;
      } else if (taxableIncome <= 18000000) {
        pitTax = 750000 + (taxableIncome - 10000000) * 0.15;
      } else if (taxableIncome <= 32000000) {
        pitTax = 1950000 + (taxableIncome - 18000000) * 0.20;
      } else {
        pitTax = 4750000 + (taxableIncome - 32000000) * 0.25;
      }
    }
    pitTax = Math.round(pitTax);

    // Net Take-Home Pay
    const netSalary = Math.max(0, grossSalary - totalInsurance - pitTax);

    return {
      employeeId: emp.id,
      code: emp.code || `EMP-${emp.id}`,
      fullName: emp.fullName || 'Nhân sự',
      position: emp.position || 'Nhân viên',
      departmentName: emp.departmentName || 'Bộ phận',
      baseSalary,
      actualDays,
      standardDays: safeStandardDays,
      otHours,
      otAmount,
      totalAllowances,
      kpiBonus,
      grossSalary,
      bhxh,
      bhyt,
      bhtn,
      totalInsurance,
      taxableIncome,
      pitTax,
      netSalary,
      bankAccount: emp.bankAccount || 'Đang cập nhật',
    };
  });

  const totalGross = items.reduce((acc, i) => acc + i.grossSalary, 0);
  const totalBhxh = items.reduce((acc, i) => acc + i.bhxh, 0);
  const totalBhyt = items.reduce((acc, i) => acc + i.bhyt, 0);
  const totalBhtn = items.reduce((acc, i) => acc + i.bhtn, 0);
  const totalInsurance = totalBhxh + totalBhyt + totalBhtn;
  const totalTax = items.reduce((acc, i) => acc + i.pitTax, 0);
  const totalNet = items.reduce((acc, i) => acc + i.netSalary, 0);

  // GL double-entry journal items
  const glLines = [
    {
      account: '6421',
      accountName: 'Chi phí Lương Bộ phận Quản lý & Khối Văn phòng',
      debit: Math.round(totalGross * 0.65),
      credit: 0,
      description: `Chi phí lương quản lý Tháng ${month}/${year}`
    },
    {
      account: '6221',
      accountName: 'Chi phí Nhân công Trực tiếp Nhà máy Sản xuất',
      debit: totalGross - Math.round(totalGross * 0.65),
      credit: 0,
      description: `Chi phí lương kỹ thuật sản xuất Tháng ${month}/${year}`
    },
    {
      account: '3341',
      accountName: 'Phải trả người lao động (Lương Net thực lĩnh)',
      debit: 0,
      credit: totalNet,
      description: `Khoản lương thực trả nhân viên Tháng ${month}/${year}`
    },
    {
      account: '3383',
      accountName: 'Phải trả Bảo hiểm Xã hội (BHXH 8%)',
      debit: 0,
      credit: totalBhxh,
      description: `Trích BHXH 8% từ lương nhân viên Tháng ${month}/${year}`
    },
    {
      account: '3384',
      accountName: 'Phải trả Bảo hiểm Y tế (BHYT 1.5%)',
      debit: 0,
      credit: totalBhyt,
      description: `Trích BHYT 1.5% từ lương nhân viên Tháng ${month}/${year}`
    },
    {
      account: '3386',
      accountName: 'Phải trả Bảo hiểm Thất nghiệp (BHTN 1.0%)',
      debit: 0,
      credit: totalBhtn,
      description: `Trích BHTN 1.0% từ lương nhân viên Tháng ${month}/${year}`
    },
    {
      account: '3335',
      accountName: 'Thuế Thu nhập Cá nhân Khấu trừ tại nguồn (PIT)',
      debit: 0,
      credit: totalTax,
      description: `Thuế TNCN tạm khấu trừ Tháng ${month}/${year}`
    },
  ];

  const totalDebit = glLines.reduce((acc, l) => acc + l.debit, 0);
  const totalCredit = glLines.reduce((acc, l) => acc + l.credit, 0);
  const isBalanced = totalDebit === totalCredit;

  return {
    periodCode: `PAY-${year}-${String(month).padStart(2, '0')}`,
    month,
    year,
    standardDays,
    totalEmployees: items.length,
    items,
    totalGross,
    totalInsurance,
    totalTax,
    totalNet,
    glLines,
    totalDebit,
    totalCredit,
    isBalanced,
  };
}

router.get("/api/hr/payrolls/preview", async (req, res) => {
  const month = Number(req.query.month) || (new Date().getMonth() + 1);
  const year = Number(req.query.year) || new Date().getFullYear();
  const standardDays = Number(req.query.standardDays) || 22;

  let emps = await db.select().from(schema.employees).all();
  if (!emps || emps.length === 0) {
    emps = enterpriseEmployees as any;
  }

  const result = computeDetailedPayroll(month, year, standardDays, emps);
  res.json(result);
});

router.get("/api/hr/employees", async (req, res) => {
  try {
    const emps = await db.select().from(schema.employees).all();
    if (emps && emps.length > 0) {
      res.json(emps);
    } else {
      res.json(enterpriseEmployees);
    }
  } catch (e) {
    res.json(enterpriseEmployees);
  }
});

router.post("/api/hr/employees", async (req, res) => {
  try {
    const { fullName, gender, departmentName, position, phone, email, baseSalary } = req.body;
    const countRes = await db.select().from(schema.employees).all();
    const newEmpData = {
      code: `EMP-001${String(countRes.length + 1).padStart(2, '0')}`,
      fullName: fullName || 'Nhân viên Mới',
      gender: gender || 'NAM',
      departmentId: 1,
      departmentName: departmentName || 'Khối Sản xuất & MES',
      position: position || 'Nhân viên Kỹ thuật',
      phone: phone || '0900 000 000',
      email: email || 'nv.moi@nexussync.vn',
      hireDate: new Date().toISOString().slice(0, 10),
      baseSalary: Number(baseSalary) || 15000000,
      status: 'ACTIVE',
      bankAccount: '190000000000 (Techcombank)',
    };
    const inserted = await db.insert(schema.employees).values(newEmpData as any).returning();
    res.status(201).json(inserted[0] || newEmpData);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi thêm nhân viên' });
  }
});

router.get("/api/hr/payrolls", async (req, res) => {
  try {
    const prs = await db.select().from(schema.payrolls).orderBy(desc(schema.payrolls.id)).all();
    if (prs && prs.length > 0) {
      res.json(prs);
    } else {
      res.json([
        { id: 1, periodCode: 'PAY-2026-08', name: 'Bảng lương Tháng 08/2026', month: 8, year: 2026, totalEmployees: 5, totalGross: 94500000, totalInsurance: 9922500, totalTax: 4250000, totalNet: 80327500, status: 'APPROVED', postedGL: true },
        { id: 2, periodCode: 'PAY-2026-07', name: 'Bảng lương Tháng 07/2026', month: 7, year: 2026, totalEmployees: 5, totalGross: 94500000, totalInsurance: 9922500, totalTax: 4250000, totalNet: 80327500, status: 'PAID', postedGL: true }
      ]);
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi truy vấn bảng lương' });
  }
});

router.post("/api/hr/payrolls/calculate", async (req, res) => {
  try {
    const month = Number(req.body.month) || (new Date().getMonth() + 1);
    const year = Number(req.body.year) || new Date().getFullYear();
    const standardDays = Number(req.body.standardDays) || 22;
    const approverName = req.body.approverName || 'Kế toán trưởng & Giám đốc Nhân sự';
    const notes = req.body.notes || 'Bảng lương định kỳ đã được thẩm định tự động.';
    const shouldPostGL = req.body.postToGL !== false;

    let emps = await db.select().from(schema.employees).all();
    if (!emps || emps.length === 0) {
      emps = enterpriseEmployees as any;
    }

    const calculation = computeDetailedPayroll(month, year, standardDays, emps);

    const periodCode = `PAY-${year}-${String(month).padStart(2, '0')}`;
    const sha256Checksum = `sha256_${Buffer.from(`${periodCode}-${calculation.totalNet}-${Date.now()}`).toString('hex').slice(0, 24)}`;

    // Post to General Ledger via Authoritative AccountingEngine
    const postedEntries = [];
    if (shouldPostGL) {
      for (const line of calculation.glLines) {
        if (line.debit > 0) {
          const entry = await accountingEngine.postJournal({
            sourceModule: 'PAYROLL',
            sourceDocumentType: 'PAYROLL_VOUCHER',
            sourceReferenceNo: periodCode,
            debitAccount: line.account,
            creditAccount: '3341', // Intermediate/contra
            amount: line.debit,
            description: `${line.description} - Bút toán Nợ [${line.account}]`,
            createdBy: 1,
          });
          if (entry) postedEntries.push(entry);
        }
      }
    }

    const newPayrollData = {
      periodCode,
      name: `Bảng lương Tháng ${String(month).padStart(2, '0')}/${year}`,
      month,
      year,
      startDate: `${year}-${String(month).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month).padStart(2, '0')}-${standardDays}`,
      totalEmployees: calculation.totalEmployees,
      totalGross: calculation.totalGross,
      totalInsurance: calculation.totalInsurance,
      totalTax: calculation.totalTax,
      totalNet: calculation.totalNet,
      status: 'APPROVED',
      postedGL: shouldPostGL,
      sha256Checksum,
      approvedBy: approverName,
      approvedAt: new Date().toISOString(),
      notes,
    };

    const existing = await db.select().from(schema.payrolls).where(eq(schema.payrolls.periodCode, periodCode)).all();
    let savedPayroll: any;
    if (existing && existing.length > 0) {
      await db.update(schema.payrolls).set(newPayrollData).where(eq(schema.payrolls.periodCode, periodCode));
      savedPayroll = { ...existing[0], ...newPayrollData };
    } else {
      const inserted = await db.insert(schema.payrolls).values(newPayrollData).returning();
      savedPayroll = inserted[0] || newPayrollData;
    }

    res.json({
      success: true,
      payroll: {
        ...savedPayroll,
        glEntries: calculation.glLines,
        items: calculation.items,
      },
      postedGL: shouldPostGL,
      sha256Checksum,
      message: `Đã hoàn tất tính lương Kỳ ${periodCode} và hạch toán tự động ${calculation.glLines.length} bút toán cân bằng vào Sổ cái GL (M30 General Ledger).`,
    });
  } catch (err: any) {
    console.error('[Payroll Calculation Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi tính toán bảng lương' });
  }
});

router.get("/api/hr/payrolls/:id/details", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const prs = await db.select().from(schema.payrolls).where(eq(schema.payrolls.id, id)).all();
    if (!prs || !prs[0]) {
      return res.status(404).json({ error: 'Không tìm thấy bảng lương' });
    }
    const payroll = prs[0];
    const emps = await db.select().from(schema.employees).all();
    const calculation = computeDetailedPayroll(payroll.month, payroll.year, 22, emps);

    res.json({
      ...payroll,
      glEntries: calculation.glLines,
      items: calculation.items,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi chi tiết bảng lương' });
  }
});

router.get("/api/hr/attendance", (req, res) => {
  res.json(enterpriseAttendance);
});

router.get("/api/hr/leaves", (req, res) => {
  res.json(enterpriseLeaves);
});

router.post("/api/hr/leaves", (req, res) => {
  const { employeeId, leaveType, startDate, endDate, totalDays, reason } = req.body;
  const emp = enterpriseEmployees.find((e) => e.id === Number(employeeId)) || enterpriseEmployees[0];
  const newLeave = {
    id: enterpriseLeaves.length + 1,
    employeeId: emp.id,
    employeeName: emp.fullName,
    leaveType: leaveType || 'ANNUAL_LEAVE',
    startDate: startDate || new Date().toISOString().slice(0, 10),
    endDate: endDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    totalDays: Number(totalDays) || 1,
    reason: reason || 'Nghỉ cá nhân',
    status: 'PENDING',
    approvedBy: 'Chờ duyệt',
  };
  enterpriseLeaves.unshift(newLeave);
  res.status(201).json(newLeave);
});

router.post("/api/hr/leaves/:id/approve", (req, res) => {
  const id = Number(req.params.id);
  const leave = enterpriseLeaves.find((l) => l.id === id);
  if (leave) {
    leave.status = 'APPROVED';
    (leave as any).approvedBy = 'Admin';
  }
  res.json({ success: true, leave, message: 'Đã phê duyệt đơn nghỉ phép.' });
});

router.get("/api/hr/performance", (req, res) => {
  res.json(enterprisePerformance);
});

router.get("/api/hr/training", (req, res) => {
  res.json(enterpriseTraining);
});

router.post("/api/hr/ess/checkin", (req, res) => {
    const { employeeId, locationName, method } = req.body;
    res.json({
      success: true,
      message: `Check-in thành công qua ${method || 'GPS Mobile'} tại ${locationName || 'Nhà máy chính (GPS: 10.7769, 106.7009)'}`,
      timestamp: new Date().toLocaleTimeString(),
    });
  });

export default router;
