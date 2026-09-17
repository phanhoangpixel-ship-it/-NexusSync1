import { Router } from "express";
import { client, db, recreateDatabaseClient } from "../../db/index";
import * as schema from "../../db/schema";
import { ProjectService } from "../../engines/projectService";
import { InventoryService } from "../../engines/inventoryService";
import { accountingEngine } from "../../engines/accountingEngine";
import { costingEngine } from "../../engines/costingEngine";
import { eq, desc, sql, and } from "drizzle-orm";
import { INITIAL_M35_PROJECTS, INITIAL_M35_WBS, INITIAL_M35_RESOURCES, INITIAL_M35_TIMESHEETS, INITIAL_M35_DOCUMENTS, INITIAL_M35_RISKS } from "../data/m35SeedData";

const router = Router();

let seedTickets: any[] = [
  { id: 1, ticketCode: "IT-TKT-2026-0042", title: "Máy in mã vạch Zebra ZT411 tại Kho WMS kẹt giấy & mờ nhiệt", category: "HARDWARE", priority: "URGENT", requester: "Lê Văn Kho (Quản lý Kho Tổng)", department: "Kho Vận & Logistics (M36)", assignedTo: "Nguyen Van IT", status: "OPEN", slaHoursRemaining: 1.2, createdAt: "2026-09-11 08:30:00", description: "Máy in mã vạch liên tục báo lỗi đầu in nhiệt, không xuất được tem nhãn xuất hàng GRN/GDN." },
  { id: 2, ticketCode: "IT-TKT-2026-0041", title: "Lỗi phân quyền truy cập phê duyệt Đơn hàng Bán buôn (M16)", category: "SOFTWARE_ACCESS", priority: "HIGH", requester: "Trần Thị Trưởng (Cửa hàng trưởng)", department: "Bán hàng & Phân phối (M16)", assignedTo: "Tran Thi IT", status: "IN_PROGRESS", slaHoursRemaining: 2.8, createdAt: "2026-09-11 07:15:00", description: "Tài khoản nhân viên bán hàng không bấm được nút Phê Duyệt Chiết Khấu vượt mức 15% sau khi update M34." },
  { id: 3, ticketCode: "IT-TKT-2026-0040", title: "Máy trạm POS quầy thu ngân 03 mất kết nối máy chủ ERP trung tâm", category: "NETWORK", priority: "URGENT", requester: "Phạm Văn Thu (Thu ngân POS)", department: "Cửa hàng bán lẻ HCM", assignedTo: "Nguyen Van IT", status: "IN_PROGRESS", slaHoursRemaining: 1.8, createdAt: "2026-09-10 16:45:00", description: "Máy POS không đồng bộ được hóa đơn điện tử và không quét được mã vạch barcode." },
  { id: 4, ticketCode: "IT-TKT-2026-0039", title: "Yêu cầu cấu hình chữ ký số HSM Cloud cho Kế toán trưởng (M29)", category: "ERP_SYSTEM", priority: "NORMAL", requester: "Võ Thị Kế (Kế toán trưởng)", department: "Tài chính Kế toán (M03)", assignedTo: "Tran Thi IT", status: "RESOLVED", slaHoursRemaining: 0, createdAt: "2026-09-10 14:00:00", resolutionNotes: "Đã cài đặt chứng thư số Viettel HSM và kích hoạt quyền ký số tự động tại phân hệ M29." },
  { id: 5, ticketCode: "IT-TKT-2026-0038", title: "Bảo dưỡng định kỳ Máy chủ Cơ sở dữ liệu ERP Oracle/PostgreSQL", category: "DATABASE", priority: "NORMAL", requester: "Đào IT (DevOps Lead)", department: "Trung tâm Công nghệ Thông tin", assignedTo: "Pham IT", status: "RESOLVED", slaHoursRemaining: 0, createdAt: "2026-09-09 11:20:00", resolutionNotes: "Đã hoàn thành tối ưu hóa Index, Vacuum định kỳ và backup dữ liệu nóng an toàn." },
  { id: 6, ticketCode: "IT-TKT-2026-0037", title: "Lỗi kết nối Bluetooth máy quét cầm tay PDA Datalogic kiểm kê", category: "HARDWARE", priority: "NORMAL", requester: "Hoàng Kho (Thủ kho Phụ tùng)", department: "Quản lý Kho (M17)", assignedTo: "Nguyen Van IT", status: "OPEN", slaHoursRemaining: 6.5, createdAt: "2026-09-11 09:10:00", description: "Thiết bị PDA không nhận tín hiệu scanner từ ứng dụng kiểm kê thời gian thực M17." }
];

let seedITAssets: any[] = [
  { id: 1, assetCode: "IT-AST-SRV-001", name: "Máy chủ Ứng dụng NexusSync ERP Core (Dell PowerEdge R750)", category: "SERVER", serialNumber: "DELL-PE750-VN01", location: "Trung tâm Dữ liệu DC-01, Tủ Rack A04", assignedTo: "Đào IT (DevOps Lead)", status: "OPERATIONAL", ipAddress: "192.168.1.10", purchaseDate: "2024-01-15", warrantyExpiry: "2027-01-15" },
  { id: 2, assetCode: "IT-AST-PRN-004", name: "Máy in mã vạch công nghiệp Zebra ZT411 (WMS Picking)", category: "PRINTER", serialNumber: "ZEB-ZT411-KHO01", location: "Kho Tổng Logistics Long An (M36)", assignedTo: "Lê Văn Kho", status: "MAINTENANCE", ipAddress: "192.168.10.45", purchaseDate: "2023-06-20", warrantyExpiry: "2026-06-20" },
  { id: 3, assetCode: "IT-AST-PDA-012", name: "Thiết bị kiểm kho di động PDA Android Datalogic Memor 10", category: "PDA_SCANNER", serialNumber: "DLG-M10-88762", location: "Kho Thành phẩm MES (M17)", assignedTo: "Hoàng Kho", status: "OPERATIONAL", ipAddress: "192.168.10.88", purchaseDate: "2024-03-10", warrantyExpiry: "2026-03-10" },
  { id: 4, assetCode: "IT-AST-WS-028", name: "Máy trạm đồ họa thiết kế CAD/CAM HP Z4 G4 Workstation", category: "WORKSTATION", serialNumber: "HPZ4-CAD-9921", location: "Phòng R&D Kỹ thuật Sản xuất (M26)", assignedTo: "Nguyễn Văn Kỹ Sư", status: "OPERATIONAL", ipAddress: "192.168.5.28", purchaseDate: "2024-05-18", warrantyExpiry: "2027-05-18" },
  { id: 5, assetCode: "IT-AST-NET-003", name: "Bộ định tuyến & Tường lửa Firewall Fortinet FortiGate 100F", category: "NETWORK", serialNumber: "FG-100F-HQ-01", location: "Phòng Server Tổng Công ty", assignedTo: "Pham IT (Network Lead)", status: "OPERATIONAL", ipAddress: "192.168.1.1", purchaseDate: "2023-11-05", warrantyExpiry: "2026-11-05" },
  { id: 6, assetCode: "IT-AST-POS-008", name: "Máy bán hàng cảm ứng All-in-One Sunmi D2s POS Terminal", category: "POS", serialNumber: "SNM-D2S-SH03", location: "Cửa hàng Bán lẻ Quận 1, TP.HCM", assignedTo: "Phạm Văn Thu", status: "DEGRADED", ipAddress: "192.168.20.15", purchaseDate: "2023-08-12", warrantyExpiry: "2025-08-12" }
];

let seedKnowledgeBase: any[] = [
  { id: 1, kbCode: "KB-ERP-001", title: "Quy trình xử lý lỗi mất kết nối máy in nhiệt WMS Barcode", category: "HARDWARE", appliesTo: "M17 / M36 Logistics", summary: "Hướng dẫn hiệu chuẩn Calibrate cảm biến giấy in nhiệt Zebra và kiểm tra kết nối LAN/IP.", steps: ["Kiểm tra đèn STATUS màu xanh trên thân máy in", "Tắt nguồn, mở nắp vệ sinh đầu in nhiệt bằng cồn Isopropyl", "Nhấn giữ nút PAUSE + FEED để chạy chế độ Auto-Calibration", "Gửi lệnh test print từ phân hệ M36 WMS"], viewCount: 342, helpfulCount: 89 },
  { id: 2, kbCode: "KB-SEC-002", title: "Cấp quyền phê duyệt hóa đơn điện tử & Ký số từ xa qua HSM (M29)", category: "SOFTWARE_ACCESS", appliesTo: "M03 Kế toán / M29 DMS", summary: "Các bước gán quyền phê duyệt vượt thẩm quyền theo ma trận RBAC và kích hoạt token HSM.", steps: ["Vào phân hệ M34 Quản trị Phân quyền", "Tìm kiếm User ID và chọn Role ACC_MANAGER", "Gán chứng thư số Serial tương ứng trên hệ thống DMS M29", "Yêu cầu người dùng đăng nhập lại để làm mới token JWT"], viewCount: 521, helpfulCount: 142 },
  { id: 3, kbCode: "KB-NET-003", title: "Khắc phục sự cố gián đoạn đồng bộ hóa dữ liệu POS ngoại tuyến", category: "NETWORK", appliesTo: "M16 POS / Bán lẻ", summary: "Kích hoạt chế độ Local Cache và đẩy đồng bộ dữ liệu giao dịch về Authoritative Core.", steps: ["Kiểm tra đèn cổng Ethernet trên router phụ cửa hàng", "Mở tab 'Đồng bộ ngoại tuyến' trên ứng dụng POS", "Nhấn 'Buộc đồng bộ' để đẩy toàn bộ hóa đơn hàng chờ lên máy chủ", "Kiểm tra số dư tiền mặt khớp với báo cáo ca M16"], viewCount: 215, helpfulCount: 67 },
  { id: 4, kbCode: "KB-SYS-004", title: "Khôi phục mật khẩu & Cấu hình xác thực 2 lớp (2FA) NexusSync ERP", category: "ERP_SYSTEM", appliesTo: "Toàn bộ Phân hệ", summary: "Quy trình reset mã OTP Google Authenticator và xác minh danh tính nhân viên an toàn.", steps: ["Tiếp nhận yêu cầu từ email doanh nghiệp chính chủ", "Kiểm tra mã nhân viên trên phân hệ HRM M28", "Tạo liên kết khôi phục 2FA có hiệu lực trong 15 phút", "Kích hoạt lại xác thực sinh trắc học / OTP"], viewCount: 489, helpfulCount: 135 }
];

let inMemoryProjects = [...INITIAL_M35_PROJECTS];
let inMemoryWbs = [...INITIAL_M35_WBS];
let inMemoryTimesheets = [...INITIAL_M35_TIMESHEETS];
let inMemoryResources = [...INITIAL_M35_RESOURCES];
let inMemoryDocuments = [...INITIAL_M35_DOCUMENTS];
let inMemoryRisks = [...INITIAL_M35_RISKS];

/**
 * Seed initial database records for Projects if empty
 */
async function ensureProjectsSeeded() {
  try {
    const existing = await db.select().from(schema.projects).limit(1);
    if (existing.length === 0) {
      for (const p of INITIAL_M35_PROJECTS) {
        const [insertedPrj] = await db.insert(schema.projects).values({
          code: p.code,
          name: p.name,
          customerName: p.client,
          contractNo: p.contractNumber || `HD-${p.code}`,
          projectManagerName: p.manager,
          startDate: p.startDate,
          plannedEndDate: p.endDate,
          status: p.status,
          totalBudget: p.budgetVND,
          actualCost: p.actualCostVND,
          revenue: p.contractValueVND,
          profit: p.contractValueVND - p.actualCostVND,
          plannedValue: p.budgetVND * 0.7,
          earnedValue: p.budgetVND * (p.progressPct / 100),
          cpi: p.actualCostVND > 0 ? Number(((p.budgetVND * (p.progressPct / 100)) / p.actualCostVND).toFixed(2)) : 1.0,
          spi: 0.95,
          eac: p.budgetVND,
          revisionNo: "v1.0",
          notes: p.description,
        } as any).returning();

        // Seed initial WBS
        const prjWbs = INITIAL_M35_WBS.filter(w => w.projectId === p.id);
        for (const w of prjWbs) {
          const [insertedWbs] = await db.insert(schema.projectWbs).values({
            projectId: insertedPrj.id,
            code: w.code,
            name: w.name,
            budgetAmount: w.plannedCostVND,
            description: w.deliverable || w.name,
          } as any).returning();

          await db.insert(schema.projectTasks).values({
            projectId: insertedPrj.id,
            wbsId: insertedWbs.id,
            code: `TSK-${w.code}`,
            name: w.name,
            startDate: w.startDate,
            endDate: w.endDate,
            plannedProgress: 100,
            actualProgress: w.progressPct,
            responsibleEmployeeName: w.assignee,
            status: w.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
            budgetAmount: w.plannedCostVND,
            actualCost: w.actualCostVND,
          } as any);
        }
      }
    }
  } catch (err) {
    console.warn("Project seeding error (non-fatal, in-memory fallback active):", err);
  }
}

// Ensure seeded on module load
ensureProjectsSeeded();

// ==========================================
// IT ISSUES API (Audit Ledger handled by M02 auditRouter)
// ==========================================
router.get("/api/issues", (req, res) => {
  res.json(seedTickets);
});

router.post("/api/issues", (req, res) => {
  const { title, category, priority, requester, department, description } = req.body;
  const newTicket = {
    id: seedTickets.length + 1,
    ticketCode: `IT-TKT-2026-${String(seedTickets.length + 43).padStart(4, '0')}`,
    title: title || 'Sự cố Kỹ thuật IT Mới',
    category: category || 'SOFTWARE_ACCESS',
    priority: priority || 'NORMAL',
    requester: requester || 'Nhân viên Người dùng',
    department: department || 'Bộ phận Nghiệp vụ ERP',
    assignedTo: 'Chờ phân công',
    status: 'OPEN',
    slaHoursRemaining: priority === 'URGENT' ? 2.0 : priority === 'HIGH' ? 4.0 : 8.0,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    description: description || 'Đã tiếp nhận vào hệ thống WorkQueue IT Desk.',
    resolutionNotes: '',
  };
  seedTickets.unshift(newTicket);
  res.status(201).json(newTicket);
});

router.post("/api/issues/:id/resolve", (req, res) => {
  const id = Number(req.params.id);
  const { resolutionNotes } = req.body;
  const ticket = seedTickets.find((t) => t.id === id);
  if (ticket) {
    ticket.status = 'RESOLVED';
    ticket.slaHoursRemaining = 0;
    ticket.resolutionNotes = resolutionNotes || 'Đã khắc phục hoàn tất sự cố và xác nhận với người dùng.';
  }
  res.json({ success: true, ticket, message: 'Đã hoàn tất đóng và giải quyết sự cố IT.' });
});

router.post("/api/issues/:id/escalate", (req, res) => {
  const id = Number(req.params.id);
  const { reason, targetTier } = req.body;
  const ticket = seedTickets.find((t) => t.id === id);
  if (ticket) {
    ticket.priority = 'URGENT';
    ticket.slaHoursRemaining = 1.0;
    ticket.assignedTo = targetTier || 'IT L2/L3 Specialist Tier';
    ticket.description = `${ticket.description || ''} [NÂNG CẤP KHẨN CẤP: ${reason || 'Yêu cầu hỗ trợ chuyên sâu'}]`;
  }
  res.json({ success: true, ticket, message: 'Đã nâng cấp mức độ ưu tiên lên URGENT và chuyển tuyến L2/L3.' });
});

router.post("/api/issues/:id/assign", (req, res) => {
  const id = Number(req.params.id);
  const { assignee } = req.body;
  const ticket = seedTickets.find((t) => t.id === id);
  if (ticket) {
    ticket.assignedTo = assignee || 'Kỹ thuật viên IT';
    if (ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }
  }
  res.json({ success: true, ticket, message: `Đã phân công xử lý cho ${ticket?.assignedTo}.` });
});

// IT Assets API
router.get("/api/issues/assets", (req, res) => {
  res.json(seedITAssets);
});

router.post("/api/issues/assets", (req, res) => {
  const { name, category, serialNumber, location, assignedTo, ipAddress } = req.body;
  const newAsset = {
    id: seedITAssets.length + 1,
    assetCode: `IT-AST-${(category || 'DEV').slice(0, 3).toUpperCase()}-${String(seedITAssets.length + 10).padStart(3, '0')}`,
    name: name || 'Thiết bị IT mới',
    category: category || 'WORKSTATION',
    serialNumber: serialNumber || `SN-${Date.now().toString().slice(-6)}`,
    location: location || 'Văn phòng Tổng công ty',
    assignedTo: assignedTo || 'Chưa gán',
    status: 'OPERATIONAL',
    ipAddress: ipAddress || '192.168.1.100',
    purchaseDate: new Date().toISOString().slice(0, 10),
    warrantyExpiry: '2027-12-31'
  };
  seedITAssets.unshift(newAsset);
  res.status(201).json(newAsset);
});

router.post("/api/issues/assets/:id/maintenance", (req, res) => {
  const id = Number(req.params.id);
  const { notes } = req.body;
  const asset = seedITAssets.find((a) => a.id === id);
  if (asset) {
    asset.status = 'MAINTENANCE';
    asset.maintenanceNotes = notes || 'Đã gửi yêu cầu bảo dưỡng kỹ thuật sang phân hệ M27 EAM.';
  }
  res.json({ success: true, asset, message: 'Đã chuyển giao thiết bị sang chế độ bảo trì M27 EAM.' });
});

// Knowledge Base API
router.get("/api/issues/knowledge-base", (req, res) => {
  res.json(seedKnowledgeBase);
});

router.post("/api/issues/knowledge-base", (req, res) => {
  const { title, category, appliesTo, summary, steps } = req.body;
  const newArticle = {
    id: seedKnowledgeBase.length + 1,
    kbCode: `KB-IT-${String(seedKnowledgeBase.length + 1).padStart(3, '0')}`,
    title: title || 'Cẩm nang khắc phục sự cố mới',
    category: category || 'ERP_SYSTEM',
    appliesTo: appliesTo || 'NexusSync ERP',
    summary: summary || 'Tóm tắt giải pháp kỹ thuật.',
    steps: Array.isArray(steps) ? steps : [steps || 'Thực hiện theo quy trình chuẩn'],
    viewCount: 1,
    helpfulCount: 0
  };
  seedKnowledgeBase.unshift(newArticle);
  res.status(201).json(newArticle);
});

router.post("/api/issues/knowledge-base/:id/helpful", (req, res) => {
  const id = Number(req.params.id);
  const article = seedKnowledgeBase.find((k) => k.id === id);
  if (article) {
    article.helpfulCount = (article.helpfulCount || 0) + 1;
    article.viewCount = (article.viewCount || 0) + 1;
  }
  res.json({ success: true, article, message: 'Đã ghi nhận phản hồi hữu ích.' });
});

router.post("/api/issues/:id/note", (req, res) => {
  const id = Number(req.params.id);
  const { note, author } = req.body;
  const ticket = seedTickets.find((t) => t.id === id);
  if (ticket) {
    const timestamp = new Date().toISOString().slice(11, 16);
    ticket.description = `${ticket.description || ''}\n[${timestamp} - ${author || 'Kỹ thuật viên'}] ${note}`;
  }
  res.json({ success: true, ticket, message: 'Đã lưu ghi chú kỹ thuật.' });
});

// ==========================================
// MODULE M35: PROJECTS & WBS REST API
// ==========================================

/**
 * GET /api/projects
 * List all projects with financial and progress summaries
 */
router.get("/api/projects", async (req, res) => {
  try {
    const dbProjects = await db.select().from(schema.projects).orderBy(desc(schema.projects.id)).all();
    if (dbProjects && dbProjects.length > 0) {
      const formatted = dbProjects.map(p => {
        const matchingMem = inMemoryProjects.find(m => m.code === p.code);
        return {
          id: String(p.id),
          code: p.code,
          name: p.name,
          category: (matchingMem?.category || "ERP_IT") as any,
          client: p.customerName || "Khách hàng Doanh nghiệp",
          manager: p.projectManagerName || "Nguyễn Văn An",
          branch: "BR_HO",
          startDate: p.startDate || "2026-01-01",
          endDate: p.plannedEndDate || "2026-12-31",
          status: p.status as any,
          currency: "VND",
          contractNumber: p.contractNo || `HD-${p.code}`,
          businessUnit: matchingMem?.businessUnit || "Khối Dự Án Doanh Nghiệp",
          contractValueVND: p.revenue || matchingMem?.contractValueVND || 5000000000,
          budgetVND: p.totalBudget || matchingMem?.budgetVND || 4000000000,
          committedCostVND: matchingMem?.committedCostVND || 500000000,
          actualCostVND: p.actualCost || matchingMem?.actualCostVND || 2000000000,
          progressPct: matchingMem?.progressPct || (p.earnedValue && p.totalBudget ? Math.round((p.earnedValue / p.totalBudget) * 100) : 50),
          laborCostVND: matchingMem?.laborCostVND || Math.round((p.actualCost || 2000000000) * 0.45),
          materialCostVND: matchingMem?.materialCostVND || Math.round((p.actualCost || 2000000000) * 0.35),
          equipmentCostVND: matchingMem?.equipmentCostVND || Math.round((p.actualCost || 2000000000) * 0.12),
          externalServiceCostVND: matchingMem?.externalServiceCostVND || Math.round((p.actualCost || 2000000000) * 0.05),
          overheadCostVND: matchingMem?.overheadCostVND || Math.round((p.actualCost || 2000000000) * 0.03),
          riskLevel: matchingMem?.riskLevel || "LOW",
          description: p.notes || matchingMem?.description || "Dự án NexusSync ERP",
          charterObjective: matchingMem?.charterObjective || "Số hóa & tối ưu hóa vận hành",
          scopeSummary: matchingMem?.scopeSummary || "Phạm vi theo hợp đồng và phụ lục WBS",
        };
      });
      return res.json(formatted);
    }
    return res.json(inMemoryProjects);
  } catch (err: any) {
    console.warn("Error fetching projects from DB, using memory fallback:", err.message);
    res.json(inMemoryProjects);
  }
});

/**
 * POST /api/projects
 * Create a new enterprise project
 */
router.post("/api/projects", async (req, res) => {
  try {
    const {
      code,
      name,
      category,
      client: clientName,
      manager,
      branch,
      startDate,
      endDate,
      contractValueVND,
      budgetVND,
      description,
      charterObjective,
      scopeSummary,
      businessUnit
    } = req.body;

    const prjCode = code || `PRJ-2026-${String(inMemoryProjects.length + 1).padStart(3, '0')}`;
    const budget = Number(budgetVND) || 2500000000;
    const contractVal = Number(contractValueVND) || 3500000000;

    let newDbId = inMemoryProjects.length + 1;
    try {
      const [inserted] = await db.insert(schema.projects).values({
        code: prjCode,
        name: name || 'Dự án Mới',
        customerName: clientName || 'Khách hàng Nội bộ',
        contractNo: `HD-2026/NEXUS-${prjCode}`,
        projectManagerName: manager || 'Nguyễn Văn An',
        startDate: startDate || new Date().toISOString().slice(0, 10),
        plannedEndDate: endDate || '2026-12-31',
        status: 'PLANNED',
        totalBudget: budget,
        actualCost: 0,
        revenue: contractVal,
        profit: contractVal - budget,
        plannedValue: budget * 0.1,
        earnedValue: 0,
        cpi: 1.0,
        spi: 1.0,
        eac: budget,
        notes: description || 'Dự án mới tạo',
      } as any).returning();
      newDbId = inserted.id;
    } catch (dbErr) {
      console.warn("DB insert project fallback:", dbErr);
    }

    const newPrj = {
      id: String(newDbId),
      code: prjCode,
      name: name || 'Dự án Mới',
      category: category || 'ERP_IT',
      client: clientName || 'Khách hàng Nội bộ',
      manager: manager || 'Nguyễn Văn An',
      branch: branch || 'BR_HO',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || '2026-12-31',
      status: 'PLANNED' as any,
      currency: 'VND',
      contractNumber: `HD-2026/NEXUS-${prjCode}`,
      businessUnit: businessUnit || 'Khối Dự Án Doanh Nghiệp',
      contractValueVND: contractVal,
      budgetVND: budget,
      committedCostVND: 0,
      actualCostVND: 0,
      progressPct: 0,
      laborCostVND: 0,
      materialCostVND: 0,
      equipmentCostVND: 0,
      externalServiceCostVND: 0,
      overheadCostVND: 0,
      riskLevel: 'LOW' as any,
      description: description || 'Dự án mới tạo',
      charterObjective: charterObjective || 'Số hóa & hoàn thành mục tiêu kinh doanh',
      scopeSummary: scopeSummary || 'Phạm vi theo hợp đồng',
    };

    inMemoryProjects.unshift(newPrj);
    res.status(201).json(newPrj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/projects/:id/status
 * Transition project status with state-machine validation
 */
router.put("/api/projects/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const memPrj = inMemoryProjects.find(p => p.id === id || p.code === id);
    if (!memPrj) {
      return res.status(404).json({ error: "Không tìm thấy dự án" });
    }

    const isValidTransition = ProjectService.validateStatusTransition(memPrj.status, status);
    if (!isValidTransition) {
      return res.status(400).json({
        error: `Chuyển đổi trạng thái từ [${memPrj.status}] sang [${status}] không hợp lệ theo quy tắc vòng đời dự án.`
      });
    }

    memPrj.status = status;

    const numId = Number(id);
    if (!isNaN(numId)) {
      await db.update(schema.projects).set({
        status,
        updatedAt: new Date()
      } as any).where(eq(schema.projects.id, numId));
    }

    res.json({ success: true, project: memPrj, message: `Đã chuyển trạng thái dự án sang ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/projects/:id/wbs
 * Fetch WBS tasks for a specific project
 */
router.get("/api/projects/:id/wbs", (req, res) => {
  const { id } = req.params;
  const nodes = inMemoryWbs.filter(w => w.projectId === id || w.projectId === `PRJ-${id}`);
  res.json(nodes.length > 0 ? nodes : inMemoryWbs);
});

/**
 * POST /api/projects/:id/wbs
 * Save or update WBS Node
 */
router.post("/api/projects/:id/wbs", (req, res) => {
  const { id } = req.params;
  const nodeData = req.body;

  const existingIdx = inMemoryWbs.findIndex(w => w.id === nodeData.id);
  if (existingIdx >= 0) {
    inMemoryWbs[existingIdx] = { ...inMemoryWbs[existingIdx], ...nodeData };
  } else {
    inMemoryWbs.push({
      ...nodeData,
      id: nodeData.id || `WBS-${Date.now()}`,
      projectId: id,
    });
  }

  // Recalculate Project Overall Progress
  const pNodes = inMemoryWbs.filter(w => w.projectId === id);
  const avgProgress = pNodes.length > 0
    ? Math.round(pNodes.reduce((acc, curr) => acc + (curr.progressPct || 0), 0) / pNodes.length)
    : 0;
  const totalActual = pNodes.reduce((acc, curr) => acc + (curr.actualCostVND || 0), 0);

  const memPrj = inMemoryProjects.find(p => p.id === id || p.code === id);
  if (memPrj) {
    memPrj.progressPct = avgProgress;
    memPrj.actualCostVND = totalActual;
  }

  res.json({ success: true, wbsNode: nodeData, progressPct: avgProgress, actualCostVND: totalActual });
});

/**
 * GET /api/projects/:id/timesheets
 * Fetch timesheet entries
 */
router.get("/api/projects/:id/timesheets", (req, res) => {
  const { id } = req.params;
  const entries = inMemoryTimesheets.filter(t => t.projectId === id || t.projectId === `PRJ-${id}`);
  res.json(entries.length > 0 ? entries : inMemoryTimesheets);
});

/**
 * POST /api/projects/:id/timesheets
 * Log timesheet & update labor cost in Job Costing
 */
router.post("/api/projects/:id/timesheets", async (req, res) => {
  const { id } = req.params;
  const { employeeName, wbsCode, wbsTaskName, date, hoursLogged, hourlyRateVND, notes } = req.body;

  const hours = Number(hoursLogged) || 8;
  const rate = Number(hourlyRateVND) || 280000;
  const laborCost = hours * rate;

  const newTs = {
    id: `TS-${Date.now()}`,
    projectId: id,
    employeeName: employeeName || 'Nhân viên Dự án',
    wbsCode: wbsCode || '1.1',
    wbsTaskName: wbsTaskName || 'Thực thi công việc',
    date: date || new Date().toISOString().slice(0, 10),
    hoursLogged: hours,
    hourlyRateVND: rate,
    laborCostVND: laborCost,
    notes: notes || 'Ghi nhận thời gian làm việc',
    status: 'APPROVED' as any,
  };

  inMemoryTimesheets.unshift(newTs);

  const memPrj = inMemoryProjects.find(p => p.id === id || p.code === id);
  if (memPrj) {
    memPrj.laborCostVND += laborCost;
    memPrj.actualCostVND += laborCost;
  }

  // Record to GL if DB project exists
  const numId = Number(id);
  if (!isNaN(numId)) {
    try {
      await accountingEngine.postJournalEntry({
        sourceModule: "PROJECT",
        sourceDocumentType: "PROJECT_TIMESHEET",
        sourceDocumentId: Date.now(),
        sourceReferenceNo: newTs.id,
        debitAccount: "154",
        creditAccount: "334",
        amount: laborCost,
        description: `Ghi nhận chi phí nhân công dự án ${memPrj?.code || id} - ${newTs.employeeName}`,
        branchId: 1,
        userId: 1,
      });
    } catch (glErr) {
      console.warn("GL Posting for timesheet warning:", glErr);
    }
  }

  res.status(201).json(newTs);
});

/**
 * POST /api/projects/:id/material-issue
 * Single-writer material issue for project WBS
 */
router.post("/api/projects/:id/material-issue", async (req, res) => {
  const { id } = req.params;
  const { productId, warehouseId, quantity, taskId } = req.body;

  try {
    const numId = Number(id);
    if (!isNaN(numId)) {
      const result = await ProjectService.postMaterialIssueToProject({
        projectId: numId,
        taskId: taskId ? Number(taskId) : undefined,
        warehouseId: Number(warehouseId) || 1,
        productId: Number(productId) || 1,
        quantity: Number(quantity) || 1,
        userId: 1,
      });
      return res.json(result);
    }

    // Fallback simulation
    res.json({ success: true, message: `Đã xuất kho vật tư cho dự án ${id}` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/projects/:id/evm
 * Calculate Earned Value Management (EVM) metrics
 */
router.get("/api/projects/:id/evm", (req, res) => {
  const { id } = req.params;
  const memPrj = inMemoryProjects.find(p => p.id === id || p.code === id) || inMemoryProjects[0];

  const bac = memPrj.budgetVND || 0;
  const actualCost = memPrj.actualCostVND || 0;
  const progressPct = memPrj.progressPct || 0;

  const evm = ProjectService.calculateEvmMetrics(bac, 70, progressPct, actualCost);
  res.json({
    project: memPrj,
    evm: {
      ...evm,
      vac: bac - evm.eac,
      status: evm.cpi >= 1.0 && evm.spi >= 1.0 ? 'EXCELLENT' : evm.cpi >= 0.9 ? 'GOOD' : 'WARNING',
    }
  });
});

/**
 * GET /api/projects/resources
 * Get project resource pool
 */
router.get("/api/projects/resources", (req, res) => {
  res.json(inMemoryResources);
});

/**
 * GET /api/projects/documents
 * Get project documents
 */
router.get("/api/projects/documents", (req, res) => {
  res.json(inMemoryDocuments);
});

/**
 * POST /api/projects/documents
 * Upload / Register new project document
 */
router.post("/api/projects/documents", (req, res) => {
  const { projectId, name, category, uploadedBy, size, status, code } = req.body;
  const newDoc = {
    id: `DOC-${Date.now()}`,
    projectId: projectId || "PRJ-1",
    code: code || `DOC-${category || "GEN"}-${Date.now().toString().slice(-4)}`,
    name: name || "Tai_Lieu_Du_An.pdf",
    category: category || "DELIVERABLE",
    uploadedBy: uploadedBy || "Quản Lý Dự Án",
    uploadDate: new Date().toISOString().slice(0, 10),
    size: size || "3.5 MB",
    status: status || "APPROVED",
  };
  inMemoryDocuments.unshift(newDoc);
  res.status(201).json(newDoc);
});

/**
 * PUT /api/projects/documents/:id/status
 * Update document approval status
 */
router.put("/api/projects/documents/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const doc = inMemoryDocuments.find((d) => d.id === id);
  if (doc) {
    doc.status = status;
    return res.json({ success: true, document: doc });
  }
  res.status(404).json({ error: "Không tìm thấy hồ sơ tài liệu" });
});

/**
 * GET /api/projects/risks
 * Get project risks
 */
router.get("/api/projects/risks", (req, res) => {
  res.json(inMemoryRisks);
});

export default router;
