# M28 — HR, Personnel & Payroll

**Module ID:** `M28`  
**Module Name:** Human Resources & Automated Payroll  
**Business Group:** `04. MANUFACTURING & OPERATIONS`  
**Workspace ID:** `WS18_FINANCE` | **Primary Route:** `/hr`  
**Mounted UI Component:** `src/pages/HR.tsx`  
**Primary API Endpoint:** `GET /api/hr/employees`

---

## 1. Executive Summary & Purpose
M28 administers employee personnel files, organizational hierarchies, time & attendance tracking, shift scheduling, and monthly payroll computation (Base salary, allowances, PIT, social insurance, and net pay).

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Employee records, contract terms, attendance logs, and salary calculations.
- **Accounting Integration:** Approved monthly payroll posts salary and insurance expense entries to GL (M30) (VAS 334/338).

## 3. Data Contracts & APIs
- **Database Tables:** `employees`, `departments`, `attendance_logs`, `payroll_runs`, `payslips`.
- **APIs:**
  - `GET /api/hr/employees` — Employee directory.
  - `POST /api/hr/payroll/run` — Compute monthly payroll run.
  - `POST /api/hr/payroll/:id/post-gl` — Post salary voucher to M30.

## 4. UI/UX Standards
- Salary breakdown table with tax deductions in `font-mono tabular-nums`.
- Employee status badges (Active = emerald, On Leave = amber, Terminated = slate).

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement employee self-service leave request and approval flow.
- [ ] Export bank payment batch file (Vietcombank, Techcombank format) for bulk payroll transfers.
