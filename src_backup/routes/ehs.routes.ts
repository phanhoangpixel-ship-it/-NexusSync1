import { Router } from "express";

const router = Router();

let seedEhsIncidents: any[] = [
  { 
    id: 1, 
    recordCode: "EHS-INC-2026-001", 
    title: "Tràn đổ dung môi hữu cơ tại kho hóa chất", 
    incidentType: "ENVIRONMENTAL_SPILL", 
    severity: "HIGH", 
    location: "Khu vực kho hóa chất - Nhà xưởng 2", 
    reportedDate: "2026-08-28", 
    status: "INVESTIGATING", 
    actionTaken: "Cô lập bán kính 15m, rải cát hấp thụ và thu gom vào thùng chứa rác nguy hại.", 
    inspector: "Nguyễn Văn An" 
  },
  { 
    id: 2, 
    recordCode: "EHS-INC-2026-002", 
    title: "Chập điện cục bộ tại máy mài CNC số 4", 
    incidentType: "SAFETY_HAZARD", 
    severity: "CRITICAL", 
    location: "Xưởng cơ khí - Line CNC 1", 
    reportedDate: "2026-08-27", 
    status: "CLOSED", 
    actionTaken: "Ngắt cầu dao tổng, thay thế cụm dây nguồn chống cháy và tái đào tạo vận hành.", 
    inspector: "Trần Thị Bích" 
  },
  { 
    id: 3, 
    recordCode: "EHS-INC-2026-003", 
    title: "Suýt rơi pallet linh kiện từ xe nâng cao", 
    incidentType: "NEAR_MISS", 
    severity: "MEDIUM", 
    location: "Kho Tổng Logistics M17 - Dãy C", 
    reportedDate: "2026-08-25", 
    status: "RESOLVED", 
    actionTaken: "Căn chỉnh lại giới hạn tải trọng xe nâng và kẻ lại vạch an toàn lối đi bộ.", 
    inspector: "Lê Hoàng Nam" 
  },
  { 
    id: 4, 
    recordCode: "EHS-INC-2026-004", 
    title: "Xước da nhẹ khi thao tác đóng gói", 
    incidentType: "FIRST_AID", 
    severity: "LOW", 
    location: "Phân xưởng Lắp ráp hoàn thiện", 
    reportedDate: "2026-08-20", 
    status: "CLOSED", 
    actionTaken: "Sát trùng, dán băng gạc y tế tại chỗ và cấp mới găng tay chống cắt cấp 5.", 
    inspector: "Phạm Minh Đức" 
  }
];

let seedEhsInspections: any[] = [
  { 
    id: 1, 
    inspectionCode: "EHS-INSP-2026-001", 
    title: "Kiểm định Hệ thống Báo cháy & Bình chữa cháy PCCC",
    type: "FIRE_SAFETY", 
    location: "Khu phức hợp Văn phòng & Nhà xưởng 1", 
    date: "2026-08-20", 
    status: "PASSED", 
    findings: "50/50 bình chữa cháy CO2 & Bột ABC còn hạn kiểm định, lối thoát hiểm Exit thông thoáng.",
    inspector: "Đội PCCC Cơ sở & Phòng CS PCCC",
    totalItems: 25,
    passedItems: 25
  },
  { 
    id: 2, 
    inspectionCode: "EHS-INSP-2026-002", 
    title: "Thanh tra Quản lý Rác thải Nguy hại & Nước thải",
    type: "WASTE_MANAGEMENT", 
    location: "Khu vực Lưu trữ Tạm thời & Trạm Xử lý Nước thải", 
    date: "2026-08-25", 
    status: "FAILED", 
    findings: "Phát hiện 2 thùng đựng giẻ lau dính dầu chưa dán nhãn chất thải nguy hại theo quy chuẩn.",
    inspector: "Ban Môi trường ISO 14001",
    totalItems: 20,
    passedItems: 18
  },
  { 
    id: 3, 
    inspectionCode: "EHS-INSP-2026-003", 
    title: "Kiểm tra An toàn Điện & Tiếp địa Chống sét",
    type: "ELECTRICAL", 
    location: "Trạm Biến áp 1000kVA & Tủ điện phân phối chính", 
    date: "2026-08-15", 
    status: "PASSED", 
    findings: "Điện trở tiếp địa đạt < 4 Ohm, thảm cách điện cao áp đạt chuẩn an toàn 24kV.",
    inspector: "Trung tâm Kiểm định Kỹ thuật An toàn",
    totalItems: 15,
    passedItems: 15
  },
  { 
    id: 4, 
    inspectionCode: "EHS-INSP-2026-004", 
    title: "Kiểm định Nồi hơi Áp lực & Bình khí nén trung tâm",
    type: "PRESSURE_VESSEL", 
    location: "Phòng Máy nén khí & Cung cấp Nhiệt", 
    date: "2026-08-10", 
    status: "PASSED", 
    findings: "Van an toàn xả đúng áp suất 10 bar, chứng chỉ kiểm định hợp quy có hiệu lực đến 2027.",
    inspector: "Vinacontrol",
    totalItems: 12,
    passedItems: 12
  }
];

let seedEhsTrainings: any[] = [
  {
    id: 1,
    courseCode: "TRN-EHS-2026-01",
    courseName: "Huấn luyện An toàn Vận hành Thiết bị Nâng & Xe nâng (Nhóm 3)",
    targetGroup: "Nhóm 3 (Nghị định 44/2016)",
    trainer: "Viện An toàn Lao động Việt Nam",
    date: "2026-08-15",
    attendeesCount: 35,
    passedCount: 35,
    status: "COMPLETED",
    certificateExpiry: "2028-08-15"
  },
  {
    id: 2,
    courseCode: "TRN-EHS-2026-02",
    courseName: "Kỹ năng Nhận diện Mối nguy & Sơ tán PCCC Cơ sở",
    targetGroup: "Toàn thể CBNV (Nhóm 4 & Nhóm 6)",
    trainer: "Cảnh sát PCCC & CNCH Tỉnh",
    date: "2026-07-20",
    attendeesCount: 280,
    passedCount: 280,
    status: "COMPLETED",
    certificateExpiry: "2027-07-20"
  },
  {
    id: 3,
    courseCode: "TRN-EHS-2026-03",
    courseName: "Đào tạo Nghiệp vụ Cán bộ Chuyên trách An toàn ISO 45001",
    targetGroup: "Nhóm 2 (Cán bộ EHS)",
    trainer: "TÜV Rheinland Vietnam",
    date: "2026-09-02",
    attendeesCount: 8,
    passedCount: 8,
    status: "COMPLETED",
    certificateExpiry: "2028-09-02"
  }
];

// --- INCIDENTS ENDPOINTS ---
router.get("/api/ehs/records", (req, res) => {
  res.json(seedEhsIncidents);
});

router.post("/api/ehs/records", (req, res) => {
  const { title, incidentType, severity, location, actionTaken, inspector } = req.body;
  const newRecord = {
    id: seedEhsIncidents.length + 1,
    recordCode: `EHS-INC-2026-${String(seedEhsIncidents.length + 1).padStart(3, '0')}`,
    title: title || 'Báo cáo Sự cố An toàn Mới',
    incidentType: incidentType || 'SAFETY_HAZARD',
    severity: severity || 'MEDIUM',
    location: location || 'Khu vực Nhà xưởng',
    reportedDate: new Date().toISOString().slice(0, 10),
    status: 'OPEN',
    actionTaken: actionTaken || 'Đã ghi nhận, chờ đội an toàn xử lý CAPA',
    inspector: inspector || 'Hoàng Nam (EHS Officer)',
  };
  seedEhsIncidents.unshift(newRecord);
  res.status(201).json(newRecord);
});

router.put("/api/ehs/records/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = seedEhsIncidents.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy hồ sơ sự cố" });
  }
  seedEhsIncidents[index] = {
    ...seedEhsIncidents[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json(seedEhsIncidents[index]);
});

// --- INSPECTIONS ENDPOINTS ---
router.get("/api/ehs/inspections", (req, res) => {
  res.json(seedEhsInspections);
});

router.post("/api/ehs/inspections", (req, res) => {
  const { title, type, location, findings, inspector, status, totalItems, passedItems } = req.body;
  const newInsp = {
    id: seedEhsInspections.length + 1,
    inspectionCode: `EHS-INSP-2026-${String(seedEhsInspections.length + 1).padStart(3, '0')}`,
    title: title || 'Kiểm định An toàn Lao động Mới',
    type: type || 'FIRE_SAFETY',
    location: location || 'Nhà máy & Kho bãi',
    date: new Date().toISOString().slice(0, 10),
    status: status || 'PASSED',
    findings: findings || 'Đã hoàn tất kiểm tra hiện trường, các tiêu chuẩn được đáp ứng.',
    inspector: inspector || 'Ban An toàn & Môi trường EHS',
    totalItems: totalItems ? Number(totalItems) : 20,
    passedItems: passedItems ? Number(passedItems) : (status === 'FAILED' ? 18 : 20)
  };
  seedEhsInspections.unshift(newInsp);
  res.status(201).json(newInsp);
});

router.put("/api/ehs/inspections/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = seedEhsInspections.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy đợt kiểm định" });
  }
  seedEhsInspections[index] = {
    ...seedEhsInspections[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json(seedEhsInspections[index]);
});

// --- TRAININGS ENDPOINTS ---
router.get("/api/ehs/trainings", (req, res) => {
  res.json(seedEhsTrainings);
});

router.post("/api/ehs/trainings", (req, res) => {
  const { courseName, targetGroup, trainer, attendeesCount, passedCount, certificateExpiry } = req.body;
  const newTraining = {
    id: seedEhsTrainings.length + 1,
    courseCode: `TRN-EHS-2026-${String(seedEhsTrainings.length + 1).padStart(2, '0')}`,
    courseName: courseName || 'Khóa Huấn luyện ATLĐ Định kỳ',
    targetGroup: targetGroup || 'Nhóm 3 (Nghị định 44/2016)',
    trainer: trainer || 'Trung tâm Kiểm định & Đào tạo ATLĐ',
    date: new Date().toISOString().slice(0, 10),
    attendeesCount: Number(attendeesCount) || 20,
    passedCount: Number(passedCount) || Number(attendeesCount) || 20,
    status: 'COMPLETED',
    certificateExpiry: certificateExpiry || new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  };
  seedEhsTrainings.unshift(newTraining);
  res.status(201).json(newTraining);
});

export default router;
