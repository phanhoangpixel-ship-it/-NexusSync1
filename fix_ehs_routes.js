const fs = require('fs');
const content = `import { Router } from "express";

const router = Router();

let seedEhsIncidents: any[] = [
  { id: 1, recordCode: "EHS-INC-2026-001", title: "Tràn hóa chất tẩy rửa", incidentType: "ENVIRONMENTAL_SPILL", severity: "HIGH", location: "Khu vực kho hóa chất", reportedDate: "2026-08-28", status: "INVESTIGATING", actionTaken: "Cô lập khu vực, dùng cát thấm hút", inspector: "Nguyễn Văn An" },
  { id: 2, recordCode: "EHS-INC-2026-002", title: "Chập điện máy mài", incidentType: "SAFETY_HAZARD", severity: "CRITICAL", location: "Xưởng cơ khí", reportedDate: "2026-08-27", status: "CLOSED", actionTaken: "Cắt điện, thay dây nguồn, đào tạo lại", inspector: "Trần Thị Bích" }
];

let seedEhsInspections: any[] = [
  { id: 1, inspectionCode: "EHS-INSP-2026-001", type: "FIRE_SAFETY", location: "Tòa nhà văn phòng", date: "2026-08-20", status: "PASSED", findings: "Bình chữa cháy còn hạn, lối thoát hiểm thông thoáng" },
  { id: 2, inspectionCode: "EHS-INSP-2026-002", type: "WASTE_MANAGEMENT", location: "Khu xử lý rác", date: "2026-08-25", status: "FAILED", findings: "Phân loại rác thải nguy hại chưa đúng quy định" }
];

router.get("/api/ehs/records", (req, res) => {
    res.json(seedEhsIncidents);
});

router.post("/api/ehs/records", (req, res) => {
    const { title, incidentType, severity, location, actionTaken } = req.body;
    const newRecord = {
      id: seedEhsIncidents.length + 1,
      recordCode: \`EHS-INC-2026-\${String(seedEhsIncidents.length + 1).padStart(3, '0')}\`,
      title: title || 'Báo cáo Sự cố An toàn Mới',
      incidentType: incidentType || 'SAFETY_HAZARD',
      severity: severity || 'MEDIUM',
      location: location || 'Khu vực Nhà xưởng',
      reportedDate: new Date().toISOString().slice(0, 10),
      status: 'OPEN',
      actionTaken: actionTaken || 'Đã ghi nhận, chờ đội an toàn xử lý CAPA',
      inspector: 'Hoàng Nam (Admin)',
    };
    seedEhsIncidents.unshift(newRecord);
    res.status(201).json(newRecord);
});

router.get("/api/ehs/inspections", (req, res) => {
    res.json(seedEhsInspections);
});

export default router;
`;
fs.writeFileSync('src/routes/ehs.routes.ts', content);
