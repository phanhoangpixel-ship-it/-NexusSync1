import { db } from "../src/db/index";
import {
  payrolls,
  payslips,
  employees,
  employeeContracts,
  attendanceRecords,
  leaveRequests,
  overtimeRecords,
  employeeAllowances,
  employeeDeductions,
  insuranceProfiles,
  taxProfiles,
  departments,
  positions
} from "../src/db/schema";
import { eq, and, ne, between, lte, or } from "drizzle-orm";

export interface PayrollCalculationResult {
  employeeId: number;
  fullName: string;
  departmentCode: string;
  positionCode: string;
  baseSalary: number;
  standardWorkingDays: number;
  actualWorkingDays: number;
  otHours: number;
  otPay: number;
  allowancesTotal: number;
  deductionsTotal: number;
  grossSalary: number;
  insuranceBase: number;
  employeeInsurance: {
    bhxh: number;
    bhyt: number;
    bhtn: number;
    total: number;
  };
  employerInsurance: {
    bhxh: number;
    bhyt: number;
    bhtn: number;
    total: number;
  };
  taxableIncome: number;
  personalIncomeTax: number;
  netSalary: number;
}

/**
 * Calculates progressive Personal Income Tax based on Resolution 954/2020/UBTVQH14
 */
export function calculateProgressivePIT(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  // Progressive Tax Brackets:
  // Bracket 1: Up to 5M -> 5%
  // Bracket 2: 5M to 10M -> 10% (subtract 250,000)
  // Bracket 3: 10M to 18M -> 15% (subtract 750,000)
  // Bracket 4: 18M to 32M -> 20% (subtract 1,650,000)
  // Bracket 5: 32M to 52M -> 25% (subtract 3,250,000)
  // Bracket 6: 52M to 80M -> 30% (subtract 5,850,000)
  // Bracket 7: Above 80M -> 35% (subtract 9,850,000)

  if (taxableIncome <= 5000000) {
    return Math.round(taxableIncome * 0.05);
  } else if (taxableIncome <= 10000000) {
    return Math.round(taxableIncome * 0.10 - 250000);
  } else if (taxableIncome <= 18000000) {
    return Math.round(taxableIncome * 0.15 - 750000);
  } else if (taxableIncome <= 32000000) {
    return Math.round(taxableIncome * 0.20 - 1650000);
  } else if (taxableIncome <= 52000000) {
    return Math.round(taxableIncome * 0.25 - 3250000);
  } else if (taxableIncome <= 80000000) {
    return Math.round(taxableIncome * 0.30 - 5850000);
  } else {
    return Math.round(taxableIncome * 0.35 - 9850000);
  }
}

export class PayrollService {
  /**
   * Compiles and calculates payroll details for a given payroll run
   */
  static async compileAndCalculate(payrollId: number, tx: any = db): Promise<PayrollCalculationResult[]> {
    // 1. Fetch payroll period header
    const [payroll] = await tx
      .select()
      .from(payrolls)
      .where(eq(payrolls.id, payrollId))
      .limit(1);

    if (!payroll) {
      throw new Error(`Payroll period not found for ID: ${payrollId}`);
    }

    if (payroll.status !== "DRAFT" && payroll.status !== "CALCULATED") {
      throw new Error(`Payroll can only be calculated when in DRAFT or CALCULATED status. Current: ${payroll.status}`);
    }

    // 2. Fetch all employees (excluding terminated ones)
    const activeEmployees = await tx
      .select({
        id: employees.id,
        fullName: employees.fullName,
        status: employees.status,
        departmentId: employees.departmentId,
        positionId: employees.positionId,
      })
      .from(employees)
      .where(ne(employees.status, "TERMINATED"));

    const results: PayrollCalculationResult[] = [];

    for (const emp of activeEmployees) {
      // 3. Fetch active contract for the employee
      const [contract] = await tx
        .select()
        .from(employeeContracts)
        .where(
          and(
            eq(employeeContracts.employeeId, emp.id),
            eq(employeeContracts.status, "ACTIVE")
          )
        )
        .limit(1);

      // Skip employees without an active contract
      if (!contract) {
        continue;
      }

      // 4. Resolve Department & Position codes/names
      let deptCode = "DEPT-GEN";
      if (emp.departmentId) {
        const [dept] = await tx
          .select()
          .from(departments)
          .where(eq(departments.id, emp.departmentId))
          .limit(1);
        if (dept) {
          deptCode = dept.code;
        }
      }

      let posCode = "POS-GEN";
      if (emp.positionId) {
        const [pos] = await tx
          .select()
          .from(positions)
          .where(eq(positions.id, emp.positionId))
          .limit(1);
        if (pos) {
          posCode = pos.code;
        }
      }

      const baseSalary = contract.baseSalary || 0;
      const standardWorkingDays = 26; // Default standard working days

      // 5. Calculate Actual Working Days using attendance and approved paid leave
      let actualWorkingDays = 0;
      const attendance = await tx
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.employeeId, emp.id),
            between(attendanceRecords.workDate, payroll.startDate, payroll.endDate)
          )
        );

      if (attendance.length === 0) {
        // Fallback to full standard days if no attendance is logged in database
        actualWorkingDays = standardWorkingDays;
      } else {
        const workedDaysCount = attendance.filter((r) =>
          ["PRESENT", "LATE", "EARLY_LEAVE"].includes(r.status)
        ).length;

        // Add approved annual or sick leaves
        const approvedLeaves = await tx
          .select()
          .from(leaveRequests)
          .where(
            and(
              eq(leaveRequests.employeeId, emp.id),
              eq(leaveRequests.status, "APPROVED"),
              or(
                between(leaveRequests.startDate, payroll.startDate, payroll.endDate),
                between(leaveRequests.endDate, payroll.startDate, payroll.endDate)
              )
            )
          );

        const paidLeaveDays = approvedLeaves
          .filter((l) => ["ANNUAL_LEAVE", "SICK_LEAVE"].includes(l.leaveType))
          .reduce((sum, l) => sum + (l.totalDays || 0), 0);

        actualWorkingDays = Math.min(standardWorkingDays, workedDaysCount + paidLeaveDays);
      }

      // Prorated Base Earnings
      const baseEarnings = Math.round(baseSalary * (actualWorkingDays / standardWorkingDays));

      // 6. Overtime Calculation
      let otPay = 0;
      let otHoursTotal = 0;
      const otRecords = await tx
        .select()
        .from(overtimeRecords)
        .where(
          and(
            eq(overtimeRecords.employeeId, emp.id),
            eq(overtimeRecords.status, "APPROVED"),
            between(overtimeRecords.otDate, payroll.startDate, payroll.endDate)
          )
        );

      for (const ot of otRecords) {
        const otHours = ot.hours || 0;
        const multiplier = ot.multiplier || 1.5;
        const otHourlyRate = (baseSalary / (standardWorkingDays * 8)) * multiplier;
        otPay += Math.round(otHours * otHourlyRate);
        otHoursTotal += otHours;
      }

      // 7. Allowances & Deductions
      const allowances = await tx
        .select()
        .from(employeeAllowances)
        .where(
          and(
            eq(employeeAllowances.employeeId, emp.id),
            lte(employeeAllowances.effectiveDate, payroll.endDate)
          )
        );

      let allowancesTotal = allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
      if (allowances.length === 0) {
        // Contract fallback for allowances
        allowancesTotal = contract.allowanceAmount || 0;
      }

      const deductions = await tx
        .select()
        .from(employeeDeductions)
        .where(
          and(
            eq(employeeDeductions.employeeId, emp.id),
            eq(employeeDeductions.periodCode, payroll.periodCode)
          )
        );

      const deductionsTotal = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);

      // 8. Gross Pay Compilation
      const grossSalary = baseEarnings + otPay + allowancesTotal;

      // 9. Compulsory Insurance (VAS / Statutory Splits)
      const [insuranceProfile] = await tx
        .select()
        .from(insuranceProfiles)
        .where(eq(insuranceProfiles.employeeId, emp.id))
        .limit(1);

      const rawInsuranceBase = insuranceProfile ? insuranceProfile.baseAmount : baseSalary;
      const insuranceCap = 46800000; // General statutory limit (20x Base Wage)
      const insuranceBase = Math.min(rawInsuranceBase, insuranceCap);

      // Employee Share: BHXH 8%, BHYT 1.5%, BHTN 1% = 10.5%
      const empBHXH = Math.round(insuranceBase * 0.08);
      const empBHYT = Math.round(insuranceBase * 0.015);
      const empBHTN = Math.round(insuranceBase * 0.01);
      const employeeInsuranceTotal = empBHXH + empBHYT + empBHTN;

      // Employer Share: BHXH 17.5%, BHYT 3.0%, BHTN 1% = 21.5%
      const emrBHXH = Math.round(insuranceBase * 0.175);
      const emrBHYT = Math.round(insuranceBase * 0.03);
      const emrBHTN = Math.round(insuranceBase * 0.01);
      const employerInsuranceTotal = emrBHXH + emrBHYT + emrBHTN;

      // 10. Progressive Personal Income Tax (PIT)
      const [taxProfile] = await tx
        .select()
        .from(taxProfiles)
        .where(eq(taxProfiles.employeeId, emp.id))
        .limit(1);

      const personalExemption = taxProfile ? taxProfile.deductionAmount : 11000000;
      const dependentsCount = taxProfile ? taxProfile.dependentsCount : 0;
      const dependentExemption = dependentsCount * 4400000;

      const totalExemptions = personalExemption + dependentExemption + employeeInsuranceTotal;
      const taxableIncome = Math.max(0, grossSalary - totalExemptions);
      const personalIncomeTax = calculateProgressivePIT(taxableIncome);

      // 11. Net Salary
      const netSalary = Math.max(0, grossSalary - employeeInsuranceTotal - personalIncomeTax - deductionsTotal);

      results.push({
        employeeId: emp.id,
        fullName: emp.fullName,
        departmentCode: deptCode,
        positionCode: posCode,
        baseSalary,
        standardWorkingDays,
        actualWorkingDays,
        otHours: otHoursTotal,
        otPay,
        allowancesTotal,
        deductionsTotal,
        grossSalary,
        insuranceBase,
        employeeInsurance: {
          bhxh: empBHXH,
          bhyt: empBHYT,
          bhtn: empBHTN,
          total: employeeInsuranceTotal,
        },
        employerInsurance: {
          bhxh: emrBHXH,
          bhyt: emrBHYT,
          bhtn: emrBHTN,
          total: employerInsuranceTotal,
        },
        taxableIncome,
        personalIncomeTax,
        netSalary,
      });
    }

    return results;
  }
}
