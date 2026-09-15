// Enterprise Human Resources Master & Operational Records

export let enterpriseEmployees = [
  { id: 1, code: 'EMP-00101', fullName: 'Nguyễn Văn An', gender: 'NAM', departmentId: 1, departmentName: 'Khối Sản xuất & MES', position: 'Kỹ sư Vận hành Máy CNC', phone: '0912 345 678', email: 'an.nv@nexussync.vn', hireDate: '2023-03-15', baseSalary: 16500000, status: 'ACTIVE', bankAccount: '1903456789001 (Techcombank)' },
  { id: 2, code: 'EMP-00102', fullName: 'Trần Thị Mai', gender: 'NU', departmentId: 2, departmentName: 'Tài chính - Kế toán', position: 'Chuyên viên Kế toán Kho', phone: '0988 765 432', email: 'mai.tt@nexussync.vn', hireDate: '2022-06-01', baseSalary: 18000000, status: 'ACTIVE', bankAccount: '0071001234567 (Vietcombank)' },
  { id: 3, code: 'EMP-00103', fullName: 'Lê Hoàng Long', gender: 'NAM', departmentId: 3, departmentName: 'Quản lý Kho vận WMS', position: 'Trưởng nhóm Kiểm đếm & Bin/Rack', phone: '0903 112 233', email: 'long.lh@nexussync.vn', hireDate: '2021-11-10', baseSalary: 21000000, status: 'ACTIVE', bankAccount: '102384756201 (MB Bank)' },
  { id: 4, code: 'EMP-00104', fullName: 'Phạm Thu Trang', gender: 'NU', departmentId: 4, departmentName: 'Kiểm soát Chất lượng QMS', position: 'Chuyên viên Đảm bảo Chất lượng QA/QC', phone: '0934 998 877', email: 'trang.pt@nexussync.vn', hireDate: '2024-01-08', baseSalary: 15500000, status: 'ACTIVE', bankAccount: '109876543210 (VietinBank)' },
  { id: 5, code: 'EMP-00105', fullName: 'Đỗ Đức Minh', gender: 'NAM', departmentId: 5, departmentName: 'Kỹ thuật & Bảo trì EAM', position: 'Kỹ thuật viên Trưởng EAM', phone: '0977 445 566', email: 'minh.dd@nexussync.vn', hireDate: '2020-08-20', baseSalary: 23500000, status: 'ACTIVE', bankAccount: '2151000123456 (BIDV)' },
];

export let enterpriseAttendance = [
  { id: 1, employeeId: 1, employeeName: 'Nguyễn Văn An', workDate: '2026-08-27', checkIn: '07:55:12', checkOut: '17:05:30', status: 'PRESENT', workHours: 8.0, otHours: 1.0 },
  { id: 2, employeeId: 2, employeeName: 'Trần Thị Mai', workDate: '2026-08-27', checkIn: '08:02:45', checkOut: '17:00:10', status: 'PRESENT', workHours: 8.0, otHours: 0 },
  { id: 3, employeeId: 3, employeeName: 'Lê Hoàng Long', workDate: '2026-08-27', checkIn: '07:48:30', checkOut: '17:30:00', status: 'PRESENT', workHours: 8.0, otHours: 1.5 },
  { id: 4, employeeId: 4, employeeName: 'Phạm Thu Trang', workDate: '2026-08-27', checkIn: '08:15:00', checkOut: '17:00:00', status: 'LATE', workHours: 7.75, otHours: 0 },
  { id: 5, employeeId: 5, employeeName: 'Đỗ Đức Minh', workDate: '2026-08-27', checkIn: '07:50:00', checkOut: '18:00:00', status: 'PRESENT', workHours: 8.0, otHours: 2.0 },
];

export let enterpriseLeaves = [
  { id: 1, employeeId: 4, employeeName: 'Phạm Thu Trang', leaveType: 'ANNUAL_LEAVE', startDate: '2026-09-02', endDate: '2026-09-04', totalDays: 3, reason: 'Nghỉ phép gia đình', status: 'APPROVED', approvedBy: 'Admin' },
  { id: 2, employeeId: 1, employeeName: 'Nguyễn Văn An', leaveType: 'SICK_LEAVE', startDate: '2026-08-15', endDate: '2026-08-16', totalDays: 2, reason: 'Khám sức khỏe định kỳ & điều trị', status: 'APPROVED', approvedBy: 'Admin' },
];

export let enterprisePerformance = [
  { id: 1, employeeId: 1, employeeName: 'Nguyễn Văn An', department: 'Khối Sản xuất & MES', kpiScore: 94.5, okrRating: 'A - Hoàn thành xuất sắc', salaryCoefficient: 1.15, reviewPeriod: 'Q2/2026', status: 'LOCKED' },
  { id: 2, employeeId: 2, employeeName: 'Trần Thị Mai', department: 'Tài chính - Kế toán', kpiScore: 88.0, okrRating: 'B+ - Hoàn thành tốt', salaryCoefficient: 1.05, reviewPeriod: 'Q2/2026', status: 'LOCKED' },
  { id: 3, employeeId: 3, employeeName: 'Lê Hoàng Long', department: 'Quản lý Kho vận WMS', kpiScore: 91.2, okrRating: 'A - Hoàn thành xuất sắc', salaryCoefficient: 1.10, reviewPeriod: 'Q2/2026', status: 'LOCKED' },
];

export let enterpriseTraining = [
  { id: 1, employeeId: 1, employeeName: 'Nguyễn Văn An', courseName: 'An toàn Vận hành Máy CNC & Cẩu trục Nhà xưởng', category: 'AN TOÀN LAO ĐỘNG', hours: 16, expiresAt: '2027-05-15', status: 'VALID', certificateNo: 'CERT-EHS-9912' },
  { id: 2, employeeId: 4, employeeName: 'Phạm Thu Trang', courseName: 'Vận hành Cần trục Tháp & PCCC Chuyên sâu', category: 'PCCC & CỨU HỘ', hours: 24, expiresAt: '2026-09-10', status: 'WARNING_EXPIRING', certificateNo: 'CERT-EHS-4481' },
  { id: 3, employeeId: 3, employeeName: 'Lê Hoàng Long', courseName: 'Chứng chỉ ISO 9001:2015 & Lean Six Sigma Green Belt', category: 'QUẢN TRỊ CHẤT LƯỢNG', hours: 40, expiresAt: '2028-01-20', status: 'VALID', certificateNo: 'CERT-QMS-1102' },
];
