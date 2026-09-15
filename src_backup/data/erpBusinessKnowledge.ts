// NexusSync ERP — Business Knowledge Base, Domain Map, Contracts & Guided Workflows
// Strictly reflects existing core engines, tables, rules and workflows.

export interface BusinessDomain {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  modules: string[];
  primaryAuthority: string;
}

export interface ModuleBusinessContract {
  moduleId: string;
  businessName: string;
  domain: string;
  purpose: string;
  whenToUse: string;
  whenNotToUse: string;
  actors: string[];
  permissions: string[];
  inputs: string[];
  outputs: string[];
  workflow: string[];
  statusLifecycle: string[];
  businessRules: string[];
  validationRules: string[];
  upstreamDependencies: string[];
  downstreamEffects: string[];
  coreEngineUsed: string;
  apiUsed: string[];
  dataWritten: string[];
  dataRead: string[];
  auditRequirements: string;
  commonMistakes: string[];
  realWorldExample: string;
  relatedModules: string[];
}

export interface BusinessFlowStep {
  stepNumber: number;
  name: string;
  input: string;
  process: string;
  module: string;
  moduleName: string;
  coreEngine: string;
  databaseEffect: string;
  output: string;
  nextProcess: string;
  roleRequired: string;
  rules: string[];
}

export interface EndToEndBusinessFlow {
  id: string;
  name: string;
  code: string;
  description: string;
  trigger: string;
  finalOutcome: string;
  steps: BusinessFlowStep[];
}

export interface ErpGlossaryTerm {
  term: string;
  vietnameseTerm: string;
  shortDefinition: string;
  businessMeaning: string;
  whereUsed: string[];
  example: string;
  relatedConcepts: string[];
}

export interface DecisionIntentOption {
  id: string;
  title: string;
  description: string;
  targetModuleId: string;
  targetModuleName: string;
  route: string;
  flowName: string;
  requiredData: string[];
  requiredRole: string;
  nextStep: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warningMessage?: string;
}

export interface DecisionIntent {
  intentId: string;
  userQueryKeywords: string[];
  summaryIntent: string;
  explanation: string;
  requiresDisambiguation: boolean;
  disambiguationQuestion?: string;
  options: DecisionIntentOption[];
}

export interface TrainingScenario {
  id: string;
  title: string;
  domain: string;
  difficulty: 'CƠ BẢN' | 'TRUNG CẤP' | 'NÂNG CAO';
  durationMinutes: number;
  objective: string;
  businessContext: string;
  initialState: string;
  steps: {
    stepIndex: number;
    title: string;
    instruction: string;
    moduleId: string;
    targetAction: string;
    dataPayload: Record<string, any>;
    expectedResult: string;
    verificationPoints: string[];
  }[];
  finalVerification: string[];
}

// 1. BUSINESS DOMAIN MAP
export const BUSINESS_DOMAINS: BusinessDomain[] = [
  {
    id: 'CORE_IAM',
    name: 'Nền tảng & Quản trị Danh tính (Core Platform & IAM)',
    code: 'DOM_01',
    description: 'Điều phối hệ thống, cấu hình tham số toàn cục, phân quyền RBAC hạt nhân và trục sự kiện EventBus.',
    color: 'slate',
    modules: ['M01', 'M03', 'M04', 'M05'],
    primaryAuthority: 'SuperAdmin & SystemSettings Service',
  },
  {
    id: 'MASTER_DATA',
    name: 'Dữ liệu Gốc & Nghiên cứu (Master Data & Innovation)',
    code: 'DOM_02',
    description: 'Danh mục Khách hàng B2B, SKU sản phẩm Item Master, danh mục Nhà cung cấp và dự án R&D.',
    color: 'indigo',
    modules: ['M06', 'M07'],
    primaryAuthority: 'ItemMaster & Customer Registry',
  },
  {
    id: 'P2P',
    name: 'Mua sắm & Quản lý Cung ứng (Procure-to-Pay & SRM)',
    code: 'DOM_03',
    description: 'Quy trình mua hàng từ Yêu cầu mua sắm (PR) -> Đơn mua hàng (PO) -> Nhận hàng (GRN) -> Hóa đơn (AP).',
    color: 'teal',
    modules: ['M08', 'M09', 'M10', 'M11'],
    primaryAuthority: 'Procurement & 3-Way Matching Engine',
  },
  {
    id: 'O2C',
    name: 'Bán hàng & Thương mại (Order-to-Cash & Commercial)',
    code: 'DOM_04',
    description: 'Quy trình bán hàng B2B, quản lý đơn hàng SO, bán lẻ POS, đổi trả hàng RMA và chính sách giá M41.',
    color: 'emerald',
    modules: ['M12', 'M13', 'M14', 'M15', 'M16', 'M41'],
    primaryAuthority: 'Sales Order & Pricing Resolution Engine',
  },
  {
    id: 'INVENTORY_WMS',
    name: 'Quản trị Tồn kho & Kho vận (Inventory Core & WMS)',
    code: 'DOM_05',
    description: 'Single Writer tồn kho 3 trạng thái (Physical, Allocated, Available), kiểm kê đếm mù, điều chỉnh và số lô/serial.',
    color: 'amber',
    modules: ['M17', 'M18', 'M19', 'M20', 'M21', 'M22', 'M23', 'M24'],
    primaryAuthority: 'InventoryService (postTransaction Single Writer)',
  },
  {
    id: 'MANUFACTURING',
    name: 'Sản xuất & Chuỗi Cung ứng (MES, BOM & MRP)',
    code: 'DOM_06',
    description: 'Định mức nguyên vật liệu BOM, lệnh sản xuất MO, tiêu hao vật tư và hoạch định nhu cầu vật tư MRP.',
    color: 'rose',
    modules: ['M25', 'M26'],
    primaryAuthority: 'Manufacturing ProcessEngine',
  },
  {
    id: 'ASSET_LOGISTICS',
    name: 'Tài sản & Điều vận (EAM, Projects & Logistics)',
    code: 'DOM_07',
    description: 'Bảo trì phòng ngừa PM cho máy móc, quản lý dự án công trình WBS và điều phối đội xe logistics.',
    color: 'cyan',
    modules: ['M27', 'M35', 'M36'],
    primaryAuthority: 'EAM Maintenance & Logistics Dispatch Engine',
  },
  {
    id: 'FINANCE_GL',
    name: 'Tài chính & Kế toán Tổng hợp (Finance, Cash & General Ledger)',
    code: 'DOM_08',
    description: 'Sổ cái kép Single Writer GL (Nợ = Có), hóa đơn AR/AP, quản lý quỹ tiền mặt và đối soát ngân hàng VietQR.',
    color: 'purple',
    modules: ['M28', 'M30', 'M31', 'M32', 'M33', 'M34'],
    primaryAuthority: 'AccountingEngine (Single Writer GL)',
  },
  {
    id: 'GOVERNANCE_QC',
    name: 'Kiểm soát, An toàn & Chất lượng (Governance, QC, DMS & EHS)',
    code: 'DOM_09',
    description: 'Kiểm soát chất lượng QMS (IQC/PQC/OQC), an toàn lao động EHS, lưu trữ số hóa DMS và Service Desk IT.',
    color: 'blue',
    modules: ['M02', 'M29', 'M37', 'M38', 'M39', 'M40'],
    primaryAuthority: 'Audit SHA-256 Ledger & QualityService',
  },
];

// 2. END-TO-END BUSINESS FLOWS (12 Required Flows)
export const END_TO_END_FLOWS: EndToEndBusinessFlow[] = [
  {
    id: 'FLOW_P2P',
    name: 'Procure-to-Pay (P2P) — Chu trình Mua sắm đến Thanh toán',
    code: 'P2P_01',
    description: 'Toàn bộ vòng đời từ lập nhu cầu mua sắm đến khi hàng vào kho và hạch toán công nợ/chi trả cho nhà cung cấp.',
    trigger: 'Thiếu hụt tồn kho dưới mức Min-Stock hoặc kế hoạch MRP phát sinh nhu cầu mua hàng.',
    finalOutcome: 'Hàng hóa nhập kho vật lý cập nhật stock_balances, công nợ AP hoàn tất thanh toán và bút toán GL cân đối.',
    steps: [
      {
        stepNumber: 1,
        name: 'Lập Đơn mua hàng (Purchase Order)',
        input: 'Danh sách SKU, số lượng dự kiến, Nhà cung cấp (Supplier) từ M09',
        process: 'Kiểm tra ngân sách phòng ban, lập PO ở trạng thái DRAFT, gửi duyệt cấp thẩm quyền.',
        module: 'M08',
        moduleName: 'Purchase Orders',
        coreEngine: 'OrchestrationEngine',
        databaseEffect: 'Ghi bản ghi vào purchase_orders & po_items (KHÔNG làm thay đổi tồn kho vật lý).',
        output: 'Mã PO được phê duyệt (APPROVED) sẵn sàng gửi NCC.',
        nextProcess: 'Nhà cung cấp giao hàng đến cổng cảng/kho vận.',
        roleRequired: 'Nhân viên Mua hàng / Trưởng phòng Mua',
        rules: ['PO chưa phải là hàng vào kho; tuyệt đối không tăng Physical Stock tại bước này.'],
      },
      {
        stepNumber: 2,
        name: 'Tiếp nhận & Nhập kho (Goods Receipt Note - GRN)',
        input: 'Số PO tham chiếu, biên bản giao nhận từ nhà xe/NCC',
        process: 'Kiểm đếm thực tế, quét mã Lô/Serial nếu có, gọi InventoryService.postTransaction(RECEIPT).',
        module: 'M17 / M08',
        moduleName: 'Warehouse Ops & Inventory Core',
        coreEngine: 'InventoryService (Single Writer)',
        databaseEffect: 'Ghi stock_ledger (RECEIPT, Physical +100), cập nhật stock_balances, tạo cost_layers.',
        output: 'Phiếu nhập kho GRN hoàn tất (COMPLETED), tồn kho Physical & Available cùng tăng.',
        nextProcess: 'Kế toán tiếp nhận Hóa đơn GTGT từ NCC để đối soát.',
        roleRequired: 'Thủ kho trưởng (Warehouse Chief)',
        rules: ['Bắt buộc kiểm tra Idempotency để không nhận hàng trùng lặp.'],
      },
      {
        stepNumber: 3,
        name: 'Đối soát 3 bên & Ghi nhận Hóa đơn AP (3-Way Matching)',
        input: 'Đơn PO + Phiếu Nhập Kho GRN + Hóa đơn GTGT của NCC',
        process: 'Đối soát số lượng PO == số lượng GRN, đơn giá PO == đơn giá Hóa đơn (dung sai cho phép ≤ 2%).',
        module: 'M31',
        moduleName: 'Invoices AR/AP',
        coreEngine: 'FinanceEngine & Tax Authority',
        databaseEffect: 'Ghi nhận bảng invoices (loại AP_INVOICE), hạch toán Nợ 156/152, Nợ 1331 / Có 331.',
        output: 'Hóa đơn AP được xác nhận nợ (OPEN / APPROVED).',
        nextProcess: 'Lập đề nghị thanh toán đến hạn chi trả.',
        roleRequired: 'Kế toán Công nợ / Kế toán trưởng',
        rules: ['Chênh lệch > 2% bắt buộc đưa vào hàng chờ kiểm soát rủi ro, không tự động duyệt.'],
      },
      {
        stepNumber: 4,
        name: 'Thanh toán & Tất toán Công nợ (Payment Execution)',
        input: 'Hóa đơn AP đã duyệt, tài khoản ngân hàng hoặc quỹ tiền mặt',
        process: 'Lập lệnh chi tiền (Ủy nhiệm chi hoặc Tiền mặt), sinh mã QR/chuyển khoản, đối soát số dư.',
        module: 'M32 / M33',
        moduleName: 'Payments & Treasury',
        coreEngine: 'AccountingEngine & Bank Reconciliation',
        databaseEffect: 'Ghi payments, cập nhật invoice.paidAmount, hạch toán GL: Nợ 331 / Có 1121 (hoặc 1111).',
        output: 'Phiếu chi hoàn tất, Hóa đơn AP chuyển sang trạng thái PAID.',
        nextProcess: 'Kết thúc chu trình P2P, lưu trữ chứng từ vào M29 DMS.',
        roleRequired: 'Thủ quỹ / Kế toán trưởng / CFO',
        rules: ['Mọi khoản chi > 500M VND bắt buộc chữ ký số phê duyệt kép của CFO.'],
      },
    ],
  },
  {
    id: 'FLOW_O2C',
    name: 'Order-to-Cash (O2C) — Chu trình Bán hàng đến Thu tiền B2B',
    code: 'O2C_02',
    description: 'Từ báo giá/tiếp nhận đơn bán hàng B2B, giữ chỗ tồn kho, xuất kho vận chuyển đến phát hành hóa đơn và thu hồi nợ.',
    trigger: 'Khách hàng ký hợp đồng hoặc gửi đơn đặt hàng mua số lượng lớn.',
    finalOutcome: 'Giao hàng thành công, giảm tồn kho, ghi nhận doanh thu & giá vốn COGS, thu đủ tiền bán hàng.',
    steps: [
      {
        stepNumber: 1,
        name: 'Tiếp nhận Đơn Bán Hàng (Sales Order Creation)',
        input: 'Khách hàng, SKU, Số lượng, Đơn giá từ Bảng giá M41',
        process: 'Kiểm tra hạn mức tín dụng công nợ khách hàng (Credit Limit) và tồn kho khả dụng (Available Qty).',
        module: 'M13',
        moduleName: 'Sales Orders',
        coreEngine: 'PriceResolutionService & OrchestrationEngine',
        databaseEffect: 'Ghi sales_orders & so_items ở trạng thái DRAFT hoặc CONFIRMED.',
        output: 'Đơn hàng SO được xác nhận.',
        nextProcess: 'Khoanh giữ tồn kho bảo đảm không bị xuất trùng.',
        roleRequired: 'Nhân viên Kinh doanh / Quản lý Bán hàng',
        rules: ['Vượt hạn mức nợ phải yêu cầu bảo lãnh hoặc thanh toán trước tối thiểu 30%.'],
      },
      {
        stepNumber: 2,
        name: 'Khoanh Giữ Tồn Kho (Stock Reservation / Allocation)',
        input: 'Mã đơn SO đã xác nhận',
        process: 'Khóa số lượng trong kho: stockReserved tăng, stockAvailable giảm (Physical Stock không đổi).',
        module: 'M17',
        moduleName: 'Inventory Core',
        coreEngine: 'InventoryService.reserveStock()',
        databaseEffect: 'Ghi stock_reservations, cập nhật stock_balances.allocated.',
        output: 'Tồn kho được cam kết cho đơn hàng SO, trạng thái SO chuyển RESERVED.',
        nextProcess: 'Chuyển lệnh soạn hàng (Pick & Pack) cho bộ phận WMS.',
        roleRequired: 'Hệ thống tự động / Điều phối viên Bán hàng',
        rules: ['Available Stock = Physical Stock - Reserved Stock >= 0; không được giữ âm tồn kho.'],
      },
      {
        stepNumber: 3,
        name: 'Soạn Hàng, Xuất Kho & Giảm Tồn Thực Tế (Goods Issue)',
        input: 'Phiếu xuất kho (Delivery Order / Pick List)',
        process: 'Nhân viên kho lấy hàng theo Lô/FEFO, đóng gói LPN, gọi InventoryService.postTransaction(ISSUE).',
        module: 'M17 / M18',
        moduleName: 'Warehouse Ops & Master WMS',
        coreEngine: 'InventoryService & CostingEngine',
        databaseEffect: 'Ghi stock_ledger (ISSUE, Physical -Qty), giải phóng reservation, hạch toán COGS: Nợ 632 / Có 156.',
        output: 'Phiếu xuất kho hoàn tất, hàng lên xe giao vận M36.',
        nextProcess: 'Phát hành Hóa đơn bán lẻ / Hóa đơn tài chính AR cho khách hàng.',
        roleRequired: 'Nhân viên Vận hành Kho (WMS Operator)',
        rules: ['Tự động tính COGS bằng CostingEngine theo đúng phương pháp bình quân hoặc FIFO.'],
      },
      {
        stepNumber: 4,
        name: 'Phát hành Hóa đơn AR & Thu tiền (Invoicing & Receipt)',
        input: 'Biên bản giao hàng có ký nhận của khách + Phiếu xuất kho',
        process: 'Xuất hóa đơn điện tử GTGT, ghi nhận nợ phải thu, tiếp nhận tiền chuyển khoản hoặc tiền mặt.',
        module: 'M31 / M32',
        moduleName: 'Invoices AR/AP & Payments',
        coreEngine: 'FinanceEngine & AccountingEngine',
        databaseEffect: 'Hạch toán Nợ 131 / Có 511, Có 3331. Khi thu tiền: Nợ 1121 / Có 131.',
        output: 'Đơn hàng hoàn tất vòng đời (CLOSED / FULFILLED).',
        nextProcess: 'Tính thưởng hoa hồng bán hàng cho NVKD tại M14.',
        roleRequired: 'Kế toán Bán hàng & Thu quỹ',
        rules: ['Hóa đơn đã ký số điện tử không được sửa đổi trực tiếp; sai sót phải lập hóa đơn điều chỉnh.'],
      },
    ],
  },
  {
    id: 'FLOW_INVENTORY',
    name: 'Inventory Control — Quản lý Tồn kho 3 Trạng thái & Sổ cái Kho',
    code: 'INV_03',
    description: 'Cơ chế kiểm soát tồn kho lõi: Physical Stock, Allocated Stock, Available Stock và Sổ cái kho bất biến.',
    trigger: 'Mọi biến động nhập, xuất, chuyển, khóa giữ hoặc điều chỉnh tồn kho.',
    finalOutcome: 'Số dư tồn kho tại từng ô Bin/Vị trí chính xác 100%, bảo đảm nguyên tắc Available >= 0.',
    steps: [
      {
        stepNumber: 1,
        name: 'Ghi nhận giao dịch vào Sổ cái Kho (Stock Ledger Post)',
        input: 'Loại giao dịch (RECEIPT / ISSUE / TRANSFER / ADJUSTMENT), SKU, Kho, Vị trí, Số lượng',
        process: 'InventoryService.postTransaction() đóng vai trò Single Writer duy nhất, kiểm tra khóa dữ liệu và tính balanceAfter.',
        module: 'M17',
        moduleName: 'Inventory Core',
        coreEngine: 'InventoryService',
        databaseEffect: 'Chèn bản ghi bất biến vào stock_ledger (id, timestamp, movementType, qty, balanceAfter).',
        output: 'Bản ghi sổ cái kho được lưu trữ vĩnh viễn.',
        nextProcess: 'Cập nhật số dư bảng tổng hợp stock_balances.',
        roleRequired: 'Inventory Engine / Authorized Service Call',
        rules: ['stock_ledger là nguồn sự thật duy nhất (Immutable Source of Truth); tuyệt đối cấm UPDATE/DELETE.'],
      },
      {
        stepNumber: 2,
        name: 'Cập nhật View Số dư Vật lý & Khả dụng (Stock Balance Sync)',
        input: 'Biến động từ stock_ledger',
        process: 'Đồng bộ hóa stock_balances: physicalQty = sum(ledger), availableQty = physicalQty - allocatedQty.',
        module: 'M17',
        moduleName: 'Inventory Core',
        coreEngine: 'InventoryService',
        databaseEffect: 'Cập nhật bản ghi stock_balances tương ứng với bộ khóa (productId, warehouseId, locationId).',
        output: 'Tồn kho trên giao diện UI hiển thị tức thì số liệu chuẩn xác.',
        nextProcess: 'Kích hoạt cảnh báo nếu tồn kho chạm ngưỡng Min-Stock.',
        roleRequired: 'Hệ thống tự động',
        rules: ['Available Stock không bao giờ được âm; nếu âm hệ thống chặn giao dịch ngay lập tức.'],
      },
    ],
  },
  {
    id: 'FLOW_WAREHOUSE',
    name: 'Warehouse Operations — Vận hành Kho Bãi, Vị trí Bin & Wave Picking',
    code: 'WMS_04',
    description: 'Quy trình lấy hàng theo sóng (Wave Picking), chắp hàng (Replenishment), quản lý mã kiện LPN và xếp dỡ.',
    trigger: 'Hàng chờ đơn hàng cần xuất kho gom nhóm hoặc nhu cầu di chuyển hàng giữa các tầng giá kệ.',
    finalOutcome: 'Tối ưu hóa quãng đường di chuyển của thủ kho, không tắc nghẽn cầu bốc dỡ.',
    steps: [
      {
        stepNumber: 1,
        name: 'Gom nhóm Sóng Lấy Hàng (Wave Batching)',
        input: 'Danh sách các đơn hàng B2B / Bán lẻ đang chờ xuất',
        process: 'Gộp các đơn có chung tuyến đường hoặc cùng khu vực Bin kệ vào 1 Wave duy nhất.',
        module: 'M24',
        moduleName: 'WMS Extended',
        coreEngine: 'InventoryService',
        databaseEffect: 'Tạo bản ghi wms_waves và gán wms_wave_items.',
        output: 'Mã sóng WAVE-2026-XXXX sẵn sàng thực thi.',
        nextProcess: 'Xuất danh sách phân bổ soạn hàng (Pick List).',
        roleRequired: 'Trưởng ca Kho (WMS Supervisor)',
        rules: ['Chỉ gom các đơn có tồn kho khả dụng 100%.'],
      },
      {
        stepNumber: 2,
        name: 'Lấy hàng, Quét Mã Vị trí Bin & Đóng gói LPN',
        input: 'Xe đẩy lấy hàng, thiết bị kiểm kho cầm tay / Quét Barcode',
        process: 'Thủ kho quét mã vạch Bin nguồn, xác nhận số lượng, quét mã kiện LPN (License Plate Number).',
        module: 'M18 / M24',
        moduleName: 'Warehouse Ops & WMS Extended',
        coreEngine: 'InventoryService',
        databaseEffect: 'Cập nhật vị trí gói hàng sang khu tập kết (Staging Lane).',
        output: 'Kiện hàng dán nhãn LPN sẵn sàng giao vận xe tải.',
        nextProcess: 'Cập bến cầu dỡ Dock và bàn giao cho tài xế.',
        roleRequired: 'Nhân viên Nhặt hàng (Picker)',
        rules: ['Quét mã kiểm tra đúng SKU và Hạn dùng FEFO trước khi thả vào kiện.'],
      },
    ],
  },
  {
    id: 'FLOW_RETURNS',
    name: 'Returns & RMA — Quy trình Đổi Trả Hàng & Xử lý Khiếu nại',
    code: 'RMA_05',
    description: 'Tiếp nhận hàng khách trả lại, kiểm định chất lượng phân loại và hạch toán nhập lại kho hoặc hủy phế liệu.',
    trigger: 'Khách hàng yêu cầu đổi trả do lỗi kỹ thuật hoặc hủy hợp đồng.',
    finalOutcome: 'Hàng được phân loại chính xác, công nợ được cấn trừ hoặc hoàn tiền minh bạch.',
    steps: [
      {
        stepNumber: 1,
        name: 'Khởi tạo Yêu cầu Đổi trả (RMA Request)',
        input: 'Mã đơn hàng gốc (SO), lý do trả hàng, bằng chứng lỗi sản phẩm',
        process: 'Kiểm tra chính sách đổi trả (trong hạn 7/30 ngày), tạo phiếu RMA ở trạng thái PENDING_RECEIPT.',
        module: 'M15',
        moduleName: 'Returns & RMA',
        coreEngine: 'ProcessEngine',
        databaseEffect: 'Ghi rma_requests & rma_items.',
        output: 'Phiếu RMA-2026-XXXX được phê duyệt tiếp nhận.',
        nextProcess: 'Khách gửi hàng về kho bảo hành / kiểm định.',
        roleRequired: 'CSKH / Quản lý Bán hàng',
        rules: ['Bắt buộc liên kết với đơn bán hàng gốc để kiểm tra đúng giá bán và thuế GTGT.'],
      },
      {
        stepNumber: 2,
        name: 'Giám định Kỹ thuật & Phân loại Chất lượng (Inspection QC)',
        input: 'Sản phẩm vật lý nhận lại tại kho',
        process: 'Bộ phận QC kiểm tra: Nếu còn nguyên vẹn -> Nhập lại kho bán lại; Nếu hỏng hóc -> Kho bảo hành/Hủy phế.',
        module: 'M39 / M15',
        moduleName: 'Quality Control & RMA',
        coreEngine: 'QualityService',
        databaseEffect: 'Ghi biên bản kiểm định rma_inspections.',
        output: 'Kết luận phân loại: RESTOCK (Nhập lại) hoặc SCRAP (Hủy) hoặc REPAIR (Sửa chữa).',
        nextProcess: 'Thủ kho nhập kho theo đúng phân loại và Kế toán hoàn tiền.',
        roleRequired: 'Kỹ thuật viên QC (Quality Inspector)',
        rules: ['Không được nhập hàng hỏng vào kho thành phẩm bán lẻ.'],
      },
    ],
  },
  {
    id: 'FLOW_MANUFACTURING',
    name: 'Manufacturing & BOM — Quản lý Sản xuất & Định mức Vật tư',
    code: 'MFG_06',
    description: 'Từ Lệnh sản xuất (Manufacturing Order) -> Xuất kho nguyên liệu theo BOM -> Lắp ráp/Gia công -> Nhập kho Thành phẩm.',
    trigger: 'Kế hoạch sản xuất tuần/tháng hoặc đơn hàng B2B yêu cầu đóng gói riêng biệt.',
    finalOutcome: 'Nguyên vật liệu được tiêu hao chính xác theo định mức, thành phẩm mới được tạo lập và ghi nhận giá thành.',
    steps: [
      {
        stepNumber: 1,
        name: 'Lập Lệnh Sản Xuất & Bóc tách BOM (Manufacturing Order)',
        input: 'Mã thành phẩm (Finished Good), Số lượng cần sản xuất, Phiên bản BOM đang áp dụng',
        process: 'Bóc tách danh sách nguyên vật liệu cần thiết từ bảng boms & bom_items, kiểm tra tồn vật tư trong kho.',
        module: 'M25',
        moduleName: 'Manufacturing & BOM',
        coreEngine: 'ProcessEngine',
        databaseEffect: 'Ghi manufacturing_orders và mo_materials.',
        output: 'Lệnh sản xuất MO-2026-XXXX ở trạng thái RELEASED.',
        nextProcess: 'Xuất kho nguyên vật liệu cấp cho phân xưởng.',
        roleRequired: 'Kỹ sư Kế hoạch Sản xuất (Production Planner)',
        rules: ['BOM phải ở trạng thái ACTIVE và được phê duyệt kỹ thuật trước khi đưa vào sản xuất.'],
      },
      {
        stepNumber: 2,
        name: 'Xuất Kho Nguyên Liệu & Ghi nhận Hao hụt (Material Issue)',
        input: 'Phiếu cấp phát vật tư theo Lệnh MO',
        process: 'Thủ kho xuất linh kiện: InventoryService.postTransaction(ISSUE), chuyển chi phí vào TK 154 (Chi phí SX dở dang).',
        module: 'M17 / M25',
        moduleName: 'Inventory Core & Manufacturing',
        coreEngine: 'InventoryService & CostingEngine',
        databaseEffect: 'Giảm tồn vật liệu trong kho, ghi Nợ 154 / Có 152.',
        output: 'Vật liệu đã chuyển đến dây chuyền sản xuất.',
        nextProcess: 'Phân xưởng vận hành máy móc lắp ráp theo quy trình.',
        roleRequired: 'Thủ kho vật tư & Quản đốc phân xưởng',
        rules: ['Vật tư vượt định mức (Over-consumption) phải có phiếu giải trình ký duyệt.'],
      },
      {
        stepNumber: 3,
        name: 'Nghiệm thu QC & Nhập Kho Thành Phẩm (Receipt Finished Goods)',
        input: 'Số lượng sản phẩm hoàn thành, Phiếu kiểm định OQC đạt tiêu chuẩn',
        process: 'Nhập thành phẩm vào kho: InventoryService.postTransaction(RECEIPT), tính giá thành sản xuất đơn vị.',
        module: 'M25 / M17',
        moduleName: 'Manufacturing & Inventory Core',
        coreEngine: 'InventoryService & CostingEngine',
        databaseEffect: 'Tăng tồn kho thành phẩm TK 156/155, hạch toán Nợ 155 / Có 154, đóng Lệnh MO (COMPLETED).',
        output: 'Thành phẩm có mã Lô/Serial sẵn sàng xuất bán.',
        nextProcess: 'Cập nhật số liệu năng suất cho ban giám đốc.',
        roleRequired: 'Quản lý Sản xuất (Plant Manager) & Kế toán Giá thành',
        rules: ['Giá thành thành phẩm = Chi phí NVL trực tiếp (154) + Nhân công trực tiếp + Chi phí SX chung.'],
      },
    ],
  },
  {
    id: 'FLOW_SUPPLY_CHAIN',
    name: 'Supply Chain & MRP — Hoạch định Nhu cầu Vật tư & Cân bằng Cung Cầu',
    code: 'SCM_07',
    description: 'Thu thập dự báo bán hàng, đơn SO đang mở và mức tồn an toàn để tính toán nhu cầu đặt hàng nguyên liệu tối ưu.',
    trigger: 'Chu kỳ hoạch định hàng tuần hoặc khi có biến động lớn về nhu cầu thị trường.',
    finalOutcome: 'Kế hoạch mua sắm (PR) và kế hoạch sản xuất (Planned MO) được tự động đề xuất không thiếu hụt tồn.',
    steps: [
      {
        stepNumber: 1,
        name: 'Thu thập Dự báo & Tính toán Cân đối (Gross-to-Net MRP)',
        input: 'Dự báo bán hàng + Đơn hàng SO đang mở - Tồn khả dụng hiện tại - Đơn PO đang trên đường về',
        process: 'Chạy thuật toán cân đối nhu cầu ròng (Net Requirements Calculation) theo thời gian giao hàng (Lead Time).',
        module: 'M26',
        moduleName: 'Supply Chain SCM',
        coreEngine: 'CostingEngine & OrchestrationEngine',
        databaseEffect: 'Ghi kết quả vào mrp_runs và mrp_planned_orders.',
        output: 'Bảng cân đối cung cầu theo tuần/tháng với các cảnh báo nguy cơ đứt gãy nguồn cung.',
        nextProcess: 'Phê duyệt chuyển thành Đơn mua hàng PO thực tế tại M08.',
        roleRequired: 'Chuyên viên Kế hoạch Chuỗi Cung Ứng (Supply Chain Analyst)',
        rules: ['Phải tính đến thời gian giao hàng của Nhà cung cấp (Vendor Lead Time) để không đặt trễ hạn.'],
      },
    ],
  },
  {
    id: 'FLOW_FINANCE_GL',
    name: 'Finance, AR, AP & General Ledger — Sổ cái Kép & Hạch toán Doanh nghiệp',
    code: 'FICO_08',
    description: 'Cơ chế Single Writer Sổ cái GL: Mọi giao dịch kinh tế phát sinh đều sinh bút toán Nợ/Có đối ứng cân đối tuyệt đối.',
    trigger: 'Phát sinh giao dịch mua hàng, bán hàng, kho, lương nhân viên hoặc khấu hao tài sản.',
    finalOutcome: 'Báo cáo Bảng cân đối thử, Bảng cân đối kế toán và Báo cáo Kết quả Kinh doanh (P&L) chính xác đến từng đồng.',
    steps: [
      {
        stepNumber: 1,
        name: 'Sinh Bút toán Định khoản Kép (Journal Entry Posting)',
        input: 'Chứng từ gốc (Hóa đơn, Phiếu chi, Phiếu xuất kho, Bảng lương)',
        process: 'AccountingEngine kiểm tra: Tổng Nợ (Debit) == Tổng Có (Credit), kiểm tra tính hợp lệ của tài khoản trong chart_accounts.',
        module: 'M30',
        moduleName: 'Finance & GL',
        coreEngine: 'AccountingEngine (Single Writer GL)',
        databaseEffect: 'Chèn bản ghi vào journal_entries và journal_lines.',
        output: 'Số chứng từ sổ cái GL-2026-XXXX được cấp phát và khóa sổ.',
        nextProcess: 'Cập nhật số dư lũy kế của các tài khoản kế toán cấp 1, cấp 2.',
        roleRequired: 'Kế toán Tổng hợp / Kế toán trưởng',
        rules: ['Tổng Nợ bắt buộc phải bằng Tổng Có; lệch dù chỉ 1 đồng hệ thống lập tức từ chối ghi nhận.'],
      },
    ],
  },
  {
    id: 'FLOW_EAM',
    name: 'Asset Maintenance — Bảo trì Phòng ngừa & Quản trị Thiết bị EAM',
    code: 'EAM_09',
    description: 'Quản lý lý lịch thiết bị máy móc, lập lịch bảo dưỡng định kỳ (PM), tiếp nhận sự cố (CM) và thay thế phụ tùng.',
    trigger: 'Đến hạn bảo trì theo số giờ chạy máy (Running Hours) hoặc công nhân vận hành báo sự cố hỏng hóc.',
    finalOutcome: 'Thiết bị hoạt động ổn định, giảm thiểu thời gian dừng máy (Downtime), chi phí bảo trì được ghi nhận minh bạch.',
    steps: [
      {
        stepNumber: 1,
        name: 'Phát hành Lệnh Bảo Trì (Maintenance Work Order - MWO)',
        input: 'Mã tài sản, loại bảo dưỡng (Định kỳ PM hoặc Sự cố CM), danh sách công việc kiểm tra',
        process: 'Tạo lệnh MWO, điều động kỹ sư cơ điện, đặt trước phụ tùng thay thế từ kho M17.',
        module: 'M27',
        moduleName: 'EAM Asset Maintenance',
        coreEngine: 'ProcessEngine',
        databaseEffect: 'Ghi maintenance_work_orders và mwo_parts.',
        output: 'Phiếu bảo trì MWO-2026-XXXX được gán cho kỹ sư.',
        nextProcess: 'Kỹ sư tiếp cận máy và thực hiện bảo dưỡng.',
        roleRequired: 'Kỹ sư trưởng / Quản lý Thiết bị (EAM Lead)',
        rules: ['Thiết bị đang bảo trì bắt buộc phải treo biển cảnh báo LOTO (Lockout/Tagout) an toàn.'],
      },
    ],
  },
  {
    id: 'FLOW_PROJECTS',
    name: 'Projects & WBS — Quản trị Dự án, Tiến độ & Hạch toán Chi phí',
    code: 'PRJ_10',
    description: 'Cấu trúc phân rã công việc WBS, theo dõi tiến độ từng mốc Milestones và phân bổ chi phí nhân công, vật tư vào dự án.',
    trigger: 'Ký kết hợp đồng dự án triển khai hoặc dự án đầu tư mở rộng nhà xưởng.',
    finalOutcome: 'Kiểm soát ngân sách dự án không bị vượt chi, nghiệm thu các hạng mục đúng tiến độ.',
    steps: [
      {
        stepNumber: 1,
        name: 'Thiết lập Cây WBS & Ngân sách Hạng mục (WBS Tree & Budgeting)',
        input: 'Hồ sơ dự án, các giai đoạn (Phases), các gói công việc (Work Packages), ngân sách trần',
        process: 'Khởi tạo cây công việc WBS, gán người phụ trách, thời hạn hoàn thành và định mức ngân sách.',
        module: 'M35',
        moduleName: 'Projects & WBS',
        coreEngine: 'ProjectService',
        databaseEffect: 'Ghi projects, wbs_tasks và project_budgets.',
        output: 'Dự án ở trạng thái ACTIVE với tiến độ ban đầu 0%.',
        nextProcess: 'Ghi nhận giờ công và xuất vật tư gắn mã dự án.',
        roleRequired: 'Giám đốc Dự án (Project Manager)',
        rules: ['Mọi chi phí mua sắm phát sinh phải đi kèm Project ID để tập hợp giá thành.'],
      },
    ],
  },
  {
    id: 'FLOW_LOGISTICS',
    name: 'Logistics & Fleet — Quản lý Chuyến xe Giao vận & Điều phối Đội xe',
    code: 'LOG_11',
    description: 'Lập kế hoạch chuyến xe, ghép đơn hàng giao theo tuyến, quản lý tài xế, xăng dầu và đối soát vận đơn với đối tác 3PL.',
    trigger: 'Hàng hóa đã đóng gói xong tại kho và cần vận chuyển đến tay khách hàng hoặc chi nhánh vệ tinh.',
    finalOutcome: 'Giao hàng đúng hẹn (On-Time Delivery), ký nhận biên bản POD đầy đủ, kiểm soát chi phí cước xe.',
    steps: [
      {
        stepNumber: 1,
        name: 'Điều xe & Gán Vận đơn Giao hàng (Trip Dispatch & Waybill)',
        input: 'Danh sách phiếu xuất kho, địa chỉ giao hàng, tải trọng xe khả dụng',
        process: 'Tối ưu tuyến đường, gán biển số xe tải, phân bổ tài xế, phát hành mã vận đơn Waybill.',
        module: 'M36',
        moduleName: 'Logistics & Fleet',
        coreEngine: 'OrchestrationEngine',
        databaseEffect: 'Ghi logistics_trips và waybills.',
        output: 'Lộ trình xe TRIP-2026-XXXX sẵn sàng xuất phát.',
        nextProcess: 'Tài xế nhận hàng tại cửa Dock và di chuyển theo lộ trình.',
        roleRequired: 'Điều phối viên Vận tải (Logistics Dispatcher)',
        rules: ['Không được xếp hàng vượt quá tải trọng đăng kiểm cho phép của phương tiện.'],
      },
    ],
  },
  {
    id: 'FLOW_CRM',
    name: 'CRM & Lead Management — Chăm sóc Khách hàng & Phễu Chuyển đổi',
    code: 'CRM_12',
    description: 'Tiếp nhận đầu mối tiềm năng (Leads), nuôi dưỡng cơ hội kinh doanh (Deals), báo giá và chuyển đổi thành Khách hàng B2B.',
    trigger: 'Khách hàng liên hệ qua Website, Hotline, Hội chợ triển lãm hoặc giới thiệu.',
    finalOutcome: 'Chuyển đổi thành công thành Khách hàng chính thức (Customer Master M07) và phát sinh Đơn SO (M13).',
    steps: [
      {
        stepNumber: 1,
        name: 'Tiếp nhận Đầu mối & Nuôi dưỡng Phễu Bán Hàng (Lead Qualification)',
        input: 'Tên công ty, người liên hệ, nhu cầu, ngân sách dự kiến',
        process: 'Phân loại mức độ tiềm năng (HOT/WARM/COLD), giao cho NVKD chăm sóc theo quy trình.',
        module: 'M12',
        moduleName: 'CRM / Leads',
        coreEngine: 'ProcessEngine',
        databaseEffect: 'Ghi crm_leads và crm_activities.',
        output: 'Cơ hội kinh doanh (Opportunity) đạt giai đoạn thương thảo hợp đồng.',
        nextProcess: 'Chuyển đổi sang Khách hàng B2B chính thức và tạo Đơn bán hàng SO.',
        roleRequired: 'Nhân viên Kinh doanh / Chuyên viên Marketing',
        rules: ['Không tạo khách hàng trùng lặp nếu đã có cùng Mã số thuế (Tax ID).'],
      },
    ],
  },
];

// 3. ERP BUSINESS GLOSSARY (Enterprise Terms in Vietnamese & English)
export const ERP_GLOSSARY: ErpGlossaryTerm[] = [
  {
    term: 'Physical Stock',
    vietnameseTerm: 'Tồn kho Vật lý',
    shortDefinition: 'Số lượng hàng hóa thực tế đang nằm trên kệ/trong kho.',
    businessMeaning: 'Đại diện cho số lượng đếm được bằng mắt thường trong nhà kho. Chỉ thay đổi khi có sự di chuyển vật lý (nhập kho, xuất kho, điều chỉnh sau kiểm kê).',
    whereUsed: ['M17 Inventory Core', 'M08 Warehouse Ops', 'M19 Stocktake'],
    example: 'Kho có 100 cuộn cáp đang nằm trên kệ A-01.',
    relatedConcepts: ['Allocated Stock', 'Available Stock', 'Stock Ledger'],
  },
  {
    term: 'Allocated Stock (Reserved Stock)',
    vietnameseTerm: 'Tồn kho Khoanh giữ (Tạm khóa)',
    shortDefinition: 'Số lượng hàng đã được giữ chỗ cho các đơn hàng bán hoặc lệnh sản xuất đang mở.',
    businessMeaning: 'Hàng vẫn nằm trên kệ nhưng không được phép bán hoặc cam kết cho khách hàng khác để chống bán vượt tồn.',
    whereUsed: ['M13 Sales Orders', 'M25 Manufacturing', 'M17 Inventory Core'],
    example: 'Khách đặt 30 cuộn cáp, hệ thống khóa 30 cuộn. Tồn giữ = 30.',
    relatedConcepts: ['Available Stock', 'Physical Stock', 'Order Fulfillment'],
  },
  {
    term: 'Available Stock',
    vietnameseTerm: 'Tồn kho Khả dụng',
    shortDefinition: 'Số lượng hàng hóa thực sự có thể nhận đơn bán mới ngay lập tức.',
    businessMeaning: 'Công thức bất biến: Available = Physical - Allocated. Luôn luôn phải lớn hơn hoặc bằng 0.',
    whereUsed: ['M13 Sales Orders', 'M16 POS Retail', 'M17 Inventory Core'],
    example: 'Physical 100 - Allocated 30 = Available 70 cuộn có thể bán tiếp.',
    relatedConcepts: ['Physical Stock', 'Allocated Stock', 'Safety Stock'],
  },
  {
    term: '3-Way Matching',
    vietnameseTerm: 'Đối soát 3 bên (PO - GRN - AP Invoice)',
    shortDefinition: 'Nguyên tắc kiểm soát tài chính đối chiếu Đơn mua, Phiếu nhập kho và Hóa đơn nhà cung cấp.',
    businessMeaning: 'Ngăn chặn gian lận chi tiền. Chỉ thanh toán khi hàng đã thực nhận đủ và giá đúng với hợp đồng.',
    whereUsed: ['M08 Purchase Orders', 'M31 Invoices AR/AP', 'M32 Payments'],
    example: 'PO đặt 10 cái giá 100k, Kho nhận 10 cái, Hóa đơn NCC đòi 10 cái x 100k = Khớp 100% -> Duyệt chi.',
    relatedConcepts: ['Procure-to-Pay', 'AP Invoice', 'Approval Matrix'],
  },
  {
    term: 'Single Writer Principle',
    vietnameseTerm: 'Nguyên tắc Một Cơ quan Ghi đơn nhất',
    shortDefinition: 'Chỉ một dịch vụ lõi duy nhất có quyền cập nhật bảng dữ liệu quan trọng.',
    businessMeaning: 'Bảo vệ tính toàn vẹn dữ liệu. InventoryService ghi kho, AccountingEngine ghi sổ cái GL, CostingEngine tính giá vốn. Không module nào được ghi tắt.',
    whereUsed: ['M17 Inventory Core', 'M30 General Ledger', 'M31 Invoices'],
    example: 'M16 POS hay M13 SO muốn xuất kho đều phải gọi qua InventoryService.postTransaction().',
    relatedConcepts: ['Data Lineage', 'ACID Transaction', 'Audit Trail'],
  },
  {
    term: 'Blind Stocktake (Blind Count)',
    vietnameseTerm: 'Kiểm kê Đếm Mù',
    shortDefinition: 'Hình thức kiểm kê che giấu số liệu tồn kho trên sổ sách đối với nhân viên đếm.',
    businessMeaning: 'Nhân viên kiểm kho không biết trong kho đang có bao nhiêu cái trên lý thuyết để tránh xu hướng "đếm đại cho khớp", bảo đảm tính trung thực tuyệt đối.',
    whereUsed: ['M19 Stocktake', 'M14 WMS Extended'],
    example: 'Phiếu in ra cho thủ kho chỉ có cột SKU và vị trí, cột số lượng bị để trống để tự điền.',
    relatedConcepts: ['Variance Analysis', 'Stock Adjustment', 'Audit Trail'],
  },
  {
    term: 'FEFO (First Expired, First Out)',
    vietnameseTerm: 'Hết hạn trước, Xuất trước',
    shortDefinition: 'Quy tắc ưu tiên xuất các lô hàng có ngày hết hạn sớm nhất ra trước.',
    businessMeaning: 'Đặc biệt bắt buộc đối với ngành thực phẩm, dược phẩm, hóa chất để hạn chế tối đa hàng hết date gây lãng phí.',
    whereUsed: ['M22 Lots & Batches', 'M18 Warehouse Ops', 'M14 WMS Extended'],
    example: 'Lô A hạn T8/2026, Lô B hạn T12/2026 -> Hệ thống tự động chỉ định xuất Lô A trước.',
    relatedConcepts: ['FIFO', 'Lot Number', 'Shelf Life'],
  },
  {
    term: 'Double-Entry General Ledger',
    vietnameseTerm: 'Sổ cái Định khoản Kép (Nợ / Có)',
    shortDefinition: 'Nguyên tắc kế toán: Mọi giao dịch đều có ít nhất 1 tài khoản Nợ và 1 tài khoản Có, Tổng Nợ = Tổng Có.',
    businessMeaning: 'Nguyên lý toán học của kế toán doanh nghiệp bảo đảm không thất thoát tiền tệ. Cân đối bảng kế toán.',
    whereUsed: ['M30 General Ledger', 'M31 Invoices', 'M32 Payments'],
    example: 'Mua máy tính bằng tiền mặt: Nợ TK 211 (Tăng tài sản) 20M / Có TK 111 (Giảm tiền mặt) 20M.',
    relatedConcepts: ['Chart of Accounts', 'Balance Sheet', 'Trial Balance'],
  },
  {
    term: 'COGS (Cost of Goods Sold)',
    vietnameseTerm: 'Giá vốn Hàng bán',
    shortDefinition: 'Chi phí trực tiếp cấu thành nên sản phẩm được bán ra trong kỳ.',
    businessMeaning: 'Dùng để xác định lợi nhuận gộp (Doanh thu - Giá vốn). Do Central Costing Engine tính toán theo phương pháp bình quân hoặc FIFO.',
    whereUsed: ['M30 General Ledger', 'M37 BI Analytics', 'M13 Sales Orders'],
    example: 'Bán chiếc điện thoại 10 triệu, giá vốn nhập vào 7 triệu -> Lợi nhuận gộp = 3 triệu.',
    relatedConcepts: ['Cost Layers', 'Weighted Average', 'P&L Statement'],
  },
  {
    term: 'In-transit Stock',
    vietnameseTerm: 'Hàng Đang Đi Đường',
    shortDefinition: 'Hàng hóa đã rời khỏi kho xuất nhưng chưa nhập vào kho đích trong chu trình chuyển kho.',
    businessMeaning: 'Hàng thuộc về doanh nghiệp nhưng không nằm tại kho cụ thể nào, chịu trách nhiệm bởi đơn vị vận tải.',
    whereUsed: ['M21 Internal Transfers', 'M36 Logistics'],
    example: 'Chuyển 50 cái từ Hà Nội vào TP.HCM, trên đường đi trạng thái là IN_TRANSIT.',
    relatedConcepts: ['Inter-branch Transfer', 'Delivery Note', 'Physical Stock'],
  },
];

// 4. BUSINESS DECISION ASSISTANT KNOWLEDGE BASE
export const DECISION_INTENTS: DecisionIntent[] = [
  {
    intentId: 'INTENT_RECEIVE_GOODS',
    userQueryKeywords: ['nhập hàng', 'mua hàng', 'nhận hàng', 'nhập kho', 'nhập nhà cung cấp', 'nhập vật tư'],
    summaryIntent: 'Nhập hàng hóa / vật tư vào hệ thống kho',
    explanation: 'Nghiệp vụ đưa hàng hóa vào kho có thể phát sinh từ 4 nguồn gốc khác nhau. Để tránh rủi ro hạch toán sai tài chính, cần phân biệt nguồn nhập.',
    requiresDisambiguation: true,
    disambiguationQuestion: 'Bạn muốn nhập hàng từ nguồn gốc nào dưới đây?',
    options: [
      {
        id: 'OPT_P2P_PO',
        title: 'Nhập hàng mua từ Nhà Cung Cấp (Theo Đơn Mua PO)',
        description: 'Nhập hàng theo hợp đồng mua sắm với nhà cung cấp bên ngoài. Có đối soát đơn giá và công nợ AP.',
        targetModuleId: 'M08',
        targetModuleName: 'M08 - Purchase Orders & Nhận Hàng P2P',
        route: '/purchase',
        flowName: 'Procure-to-Pay (P2P)',
        requiredData: ['Mã Đơn mua hàng PO', 'Phiếu giao hàng của NCC', 'Số lượng thực nhận', 'Số Lô / Serial (nếu có)'],
        requiredRole: 'Thủ kho trưởng / Quản lý Kho (WAREHOUSE_CHIEF / ADMIN)',
        nextStep: 'Tiếp nhận Hóa đơn GTGT từ NCC để làm thủ tục Đối soát 3 bên tại M31 Invoices AR/AP.',
        riskLevel: 'LOW',
      },
      {
        id: 'OPT_TRANSFER_IN',
        title: 'Nhập hàng chuyển từ Chi nhánh / Kho khác (Internal Transfer)',
        description: 'Nhận hàng do chi nhánh khác gửi về kho của bạn sau quá trình vận chuyển In-transit.',
        targetModuleId: 'M21',
        targetModuleName: 'M21 - Chuyển Kho Nội Bộ (Internal Transfers)',
        route: '/transfer',
        flowName: 'Internal Transfer Flow',
        requiredData: ['Mã phiếu chuyển kho TRF-XXXX', 'Biên bản bàn giao của xe vận chuyển'],
        requiredRole: 'Thủ kho chi nhánh nhận (WAREHOUSE_CHIEF)',
        nextStep: 'Xác nhận số lượng thực tế nhận được để giải phóng trạng thái In-transit sang Physical Stock.',
        riskLevel: 'LOW',
      },
      {
        id: 'OPT_MFG_RECEIPT',
        title: 'Nhập kho Thành phẩm Sản xuất từ Phân xưởng',
        description: 'Nghiệm thu sản phẩm hoàn thành từ dây chuyền lắp ráp theo Lệnh sản xuất (MO).',
        targetModuleId: 'M25',
        targetModuleName: 'M25 - Sản Xuất MES & Định Mức BOM',
        route: '/manufacturing',
        flowName: 'Manufacturing Finished Goods Receipt',
        requiredData: ['Mã Lệnh sản xuất MO-XXXX', 'Biên bản nghiệm thu chất lượng QC Đạt chuẩn'],
        requiredRole: 'Quản lý Sản xuất (PLANT_MGR) / Thủ kho Thành phẩm',
        nextStep: 'Tự động đóng lệnh sản xuất và kết chuyển chi phí TK 154 sang TK 155/156.',
        riskLevel: 'MEDIUM',
      },
      {
        id: 'OPT_ADJUSTMENT_IN',
        title: 'Nhập tăng điều chỉnh do thừa hàng sau Kiểm kê',
        description: 'Xử lý chênh lệch kiểm kê khi phát hiện hàng thực tế nhiều hơn sổ sách.',
        targetModuleId: 'M10',
        targetModuleName: 'M10 - Điều Chỉnh & Xử Lý Chênh Lệch Kho',
        route: '/stock-adjustment',
        flowName: 'Stocktake Variance Reconciliation',
        requiredData: ['Biên bản kiểm kê M09', 'Lý do chênh lệch thừa', 'Phê duyệt của Quản lý Kho & Kế toán'],
        requiredRole: 'Kế toán Kho / CFO phê duyệt (CFO / ADMIN)',
        nextStep: 'Ghi sổ cái kho ADJUSTMENT_IN và hạch toán Có TK 711 hoặc 3381.',
        riskLevel: 'HIGH',
        warningMessage: 'Tuyệt đối không dùng phiếu điều chỉnh để nhập hàng mua bán thông thường vì sẽ làm sai lệch giá vốn và dòng tiền thuế.',
      },
    ],
  },
  {
    intentId: 'INTENT_SELL_GOODS',
    userQueryKeywords: ['bán hàng', 'xuất bán', 'tạo đơn hàng', 'bán buôn', 'bán sỉ', 'bán lẻ', 'thu ngân', 'pos'],
    summaryIntent: 'Bán hàng và xuất hóa đơn cho khách hàng',
    explanation: 'Quy trình bán hàng được chia thành Bán buôn B2B (có hợp đồng, công nợ, giao hàng) và Bán lẻ POS (thu tiền ngay tại quầy).',
    requiresDisambiguation: true,
    disambiguationQuestion: 'Bạn đang thực hiện bán hàng theo kênh nào?',
    options: [
      {
        id: 'OPT_B2B_SALES',
        title: 'Bán hàng B2B / Bán buôn (Đơn hàng SO & Giao vận)',
        description: 'Tạo đơn đặt hàng bán sỉ cho doanh nghiệp, có quản lý hạn mức nợ, giữ chỗ tồn kho và xuất hóa đơn VAT.',
        targetModuleId: 'M13',
        targetModuleName: 'M13 - Đơn Hàng B2B & Chu trình O2C',
        route: '/sales',
        flowName: 'Order-to-Cash (O2C)',
        requiredData: ['Khách hàng B2B (M07)', 'Danh sách SKU & Đơn giá (M41)', 'Điều khoản thanh toán', 'Địa chỉ giao hàng'],
        requiredRole: 'Nhân viên Kinh doanh / Quản lý Bán hàng (SALES_DIR / ADMIN)',
        nextStep: 'Hệ thống tự động khoanh giữ tồn kho và chuyển lệnh xuất kho cho bộ phận WMS.',
        riskLevel: 'LOW',
      },
      {
        id: 'OPT_POS_RETAIL',
        title: 'Bán lẻ tại Quầy / Thu ngân POS (Thanh toán tức thì)',
        description: 'Quầy bán lẻ, quét mã vạch sản phẩm, nhận tiền mặt/quẹt thẻ/VietQR và in hóa đơn trao tay cho khách.',
        targetModuleId: 'M16',
        targetModuleName: 'M16 - Quầy Bán Lẻ & Thu Ngân POS',
        route: '/pos',
        flowName: 'Point-of-Sale Real-time Flow',
        requiredData: ['Quét mã vạch SKU', 'Phương thức thanh toán (Tiền mặt / VietQR)', 'Khách hàng thành viên (tùy chọn)'],
        requiredRole: 'Thu ngân viên (CASHIER / OPERATOR)',
        nextStep: 'Hệ thống lập tức trừ tồn kho vật lý và ghi nhận doanh thu tiền mặt vào quỹ.',
        riskLevel: 'LOW',
      },
    ],
  },
  {
    intentId: 'INTENT_TRANSFER_STOCK',
    userQueryKeywords: ['chuyển hàng', 'chuyển kho', 'chuyển chi nhánh', 'điều chuyển kho', 'gửi hàng đi kho khác'],
    summaryIntent: 'Chuyển hàng hóa giữa hai kho hoặc hai chi nhánh',
    explanation: 'Điều chuyển kho nội bộ là giao dịch nguyên tử (Atomic). Hàng xuất khỏi kho nguồn sẽ đi vào trạng thái In-transit và chỉ nhập vào kho đích khi bên nhận xác nhận.',
    requiresDisambiguation: false,
    options: [
      {
        id: 'OPT_INTERNAL_TRANSFER',
        title: 'Khởi tạo Lệnh Chuyển Kho Nội Bộ (M21)',
        description: 'Lập phiếu chuyển kho giữa hai vị trí kho trong cùng công ty hoặc giữa các chi nhánh.',
        targetModuleId: 'M21',
        targetModuleName: 'M21 - Chuyển Kho Nội Bộ & In-transit',
        route: '/transfer',
        flowName: 'Inter-warehouse In-transit Transfer',
        requiredData: ['Kho xuất (Source)', 'Kho nhập (Destination)', 'Danh sách SKU & Số lượng', 'Đơn vị vận chuyển'],
        requiredRole: 'Thủ kho trưởng / Quản lý Kho (WAREHOUSE_CHIEF / ADMIN)',
        nextStep: 'Thủ kho xuất duyệt xuất hàng -> Trạng thái chuyển IN_TRANSIT -> Kho nhận kiểm đếm và nhận hàng.',
        riskLevel: 'LOW',
      },
    ],
  },
  {
    intentId: 'INTENT_STOCK_VARIANCE',
    userQueryKeywords: ['tồn kho bị lệch', 'lệch kho', 'thừa hàng', 'thiếu hàng', 'sai tồn kho', 'mất hàng'],
    summaryIntent: 'Xử lý chênh lệch số liệu tồn kho giữa sổ sách và thực tế',
    explanation: 'Khi phát hiện lệch tồn, KHÔNG ĐƯỢC tự ý sửa số liệu. Phải tuân thủ quy trình: Lập đợt kiểm kê đếm mù (M09) -> Lập báo cáo chênh lệch -> Phê duyệt phiếu điều chỉnh (M10).',
    requiresDisambiguation: false,
    options: [
      {
        id: 'OPT_VARIANCE_PROCESS',
        title: 'Quy trình Chuẩn: Kiểm Kê M09 & Điều Chỉnh M10',
        description: 'Thực hiện đếm mù xác thực số lượng thực tế, sau đó tạo phiếu điều chỉnh có giải trình và phê duyệt cấp quản lý.',
        targetModuleId: 'M19',
        targetModuleName: 'M19 - Kiểm Kê Định Kỳ & Blind Count',
        route: '/stocktake',
        flowName: 'Stocktake & Variance Reconciliation',
        requiredData: ['Phạm vi kiểm kê (Kho / Khu vực)', 'Số lượng đếm thực tế', 'Biên bản giải trình nguyên nhân'],
        requiredRole: 'Thủ kho trưởng + Kế toán kho + CFO duyệt',
        nextStep: 'Tạo phiếu điều chỉnh tại M10 Stock Adjustment để hạch toán cân đối sổ cái.',
        riskLevel: 'HIGH',
        warningMessage: 'Mọi phiếu điều chỉnh kho đều được ghi vào Nhật ký kiểm toán bất biến SHA-256 để chống gian lận.',
      },
    ],
  },
  {
    intentId: 'INTENT_CUSTOMER_RETURNS',
    userQueryKeywords: ['khách trả hàng', 'đổi trả hàng', 'rma', 'hàng lỗi trả về', 'hoàn hàng'],
    summaryIntent: 'Tiếp nhận hàng khách trả lại và hoàn tiền hoặc đổi mới',
    explanation: 'Hàng trả lại từ khách phải qua phân hệ RMA M15 để kiểm định chất lượng trước khi quyết định tái nhập kho hay hủy phế liệu.',
    requiresDisambiguation: false,
    options: [
      {
        id: 'OPT_RMA_PROCESS',
        title: 'Tiếp nhận & Xử lý Phiếu RMA (M15)',
        description: 'Tạo phiếu yêu cầu đổi trả RMA liên kết với đơn bán hàng SO gốc để cấn trừ công nợ hoặc hoàn tiền.',
        targetModuleId: 'M15',
        targetModuleName: 'M15 - Đổi Trả Hàng & Quản Lý RMA',
        route: '/returns',
        flowName: 'Returns & RMA Workflow',
        requiredData: ['Mã đơn hàng SO gốc', 'SKU hàng trả', 'Lý do trả hàng', 'Biên bản kiểm tra kỹ thuật QC'],
        requiredRole: 'Nhân viên CSKH / Kỹ thuật viên QC (OPERATOR / MANAGER)',
        nextStep: 'QC kiểm định -> Tái nhập kho thành phẩm hoặc chuyển kho phế liệu -> Kế toán xuất hóa đơn điều chỉnh giảm.',
        riskLevel: 'MEDIUM',
      },
    ],
  },
];

// 5. TRAINING ACADEMY SCENARIOS (Guided Real-World Practice)
export const TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: 'SCENARIO_01_P2P_100',
    title: 'Thực hành Nhập kho 100 sản phẩm từ Nhà Cung Cấp (PO -> GRN -> AP)',
    domain: 'P2P / SRM',
    difficulty: 'CƠ BẢN',
    durationMinutes: 15,
    objective: 'Hiểu rõ nguyên tắc PO không làm tăng kho, chỉ có GRN qua InventoryService mới cập nhật tồn và 3-Way Matching sinh hóa đơn AP.',
    businessContext: 'Công ty cần nhập 100 cuộn Cáp quang Single-mode từ Công ty Thiết bị Viễn thông VinaTel để chuẩn bị dự án mới.',
    initialState: 'Tồn kho SKU Cáp quang tại Kho Hà Nội hiện có: Physical = 20, Allocated = 0, Available = 20.',
    steps: [
      {
        stepIndex: 1,
        title: 'Khởi tạo Đơn mua hàng PO',
        instruction: 'Mở phân hệ M08 Purchase Orders, tạo một PO mới với NCC VinaTel, số lượng 100 cuộn, đơn giá 250,000 VND/cuộn.',
        moduleId: 'M08',
        targetAction: 'CREATE_PO',
        dataPayload: { supplierId: 'SUP-001', sku: 'SKU-CAB-001', qty: 100, unitPrice: 250000 },
        expectedResult: 'PO chuyển sang trạng thái APPROVED. Tồn kho tại M17 vẫn là 20 (chưa thay đổi).',
        verificationPoints: [
          'Kiểm tra bảng purchase_orders có bản ghi PO mới.',
          'Kiểm tra M17 Inventory Core: Physical Stock vẫn bằng 20 (Chứng minh PO không tăng kho).',
        ],
      },
      {
        stepIndex: 2,
        title: 'Tiếp nhận hàng & Xuất phiếu Nhập kho GRN',
        instruction: 'Tại M08 hoặc M17, thực hiện tiếp nhận lô hàng 100 cuộn theo mã PO vừa tạo, kiểm tra số lô và xác nhận nhận hàng.',
        moduleId: 'M17',
        targetAction: 'RECEIVE_GRN',
        dataPayload: { poId: 'PO-2026-AUTO', receivedQty: 100, lotNo: 'LOT-2026-09-A' },
        expectedResult: 'InventoryService.postTransaction() được gọi. Physical Stock tăng lên 120, Available tăng lên 120.',
        verificationPoints: [
          'stock_ledger được ghi thêm 1 dòng RECEIPT (+100).',
          'stock_balances cập nhật physicalQty = 120, availableQty = 120.',
          'CostingEngine tạo cost_layers với đơn giá 250,000 VND.',
        ],
      },
      {
        stepIndex: 3,
        title: 'Đối soát 3 bên & Phát hành Hóa đơn Phải Trả AP',
        instruction: 'Mở M31 Invoices AR/AP, chọn hóa đơn NCC gửi đến, đối soát 3-Way Matching với PO và GRN vừa hoàn tất.',
        moduleId: 'M31',
        targetAction: 'APPROVE_AP_INVOICE',
        dataPayload: { invoiceTotal: 27500000, vatAmount: 2500000 }, // 10% VAT
        expectedResult: 'Hóa đơn AP được chấp thuận. Bút toán GL ghi nhận: Nợ 156 (25M), Nợ 1331 (2.5M) / Có 331 (27.5M).',
        verificationPoints: [
          'Bảng invoices có bản ghi AP_INVOICE trạng thái APPROVED.',
          'Sổ cái GL có bút toán cân đối Nợ = Có = 27,500,000 VND.',
        ],
      },
    ],
    finalVerification: [
      'Tồn kho tăng đúng 100 đơn vị mà không bị nhân đôi (Idempotency).',
      'Công nợ nhà cung cấp ghi nhận chính xác trên sổ cái.',
      'Toàn bộ quá trình được ghi vết tại Audit Ledger SHA-256.',
    ],
  },
  {
    id: 'SCENARIO_02_O2C_B2B',
    title: 'Thực hành Bán hàng B2B O2C với Khoanh giữ Tồn Kho (Reservation)',
    domain: 'O2C / COMMERCE',
    difficulty: 'TRUNG CẤP',
    durationMinutes: 20,
    objective: 'Nắm vững quy trình khoanh giữ tồn kho (Allocated Stock), tính COGS tự động khi xuất kho và phát hành hóa đơn nợ AR.',
    businessContext: 'Khách hàng Tập đoàn Xây dựng An Phát đặt mua 40 cuộn Cáp quang giao hàng trong 3 ngày.',
    initialState: 'Tồn kho SKU Cáp quang: Physical = 120, Allocated = 0, Available = 120.',
    steps: [
      {
        stepIndex: 1,
        title: 'Tạo Đơn bán hàng SO & Khoanh giữ Tồn',
        instruction: 'Mở M13 Sales Orders, lập đơn SO bán 40 cuộn cho Khách hàng An Phát với giá 350,000 VND/cuộn.',
        moduleId: 'M13',
        targetAction: 'CREATE_SO_AND_RESERVE',
        dataPayload: { customerId: 'CUST-002', sku: 'SKU-CAB-001', qty: 40, unitPrice: 350000 },
        expectedResult: 'Hệ thống khoanh giữ: Physical = 120, Allocated = 40, Available = 80.',
        verificationPoints: [
          'Đơn SO ở trạng thái RESERVED.',
          'Available Stock giảm đúng 40, Physical Stock không đổi.',
        ],
      },
      {
        stepIndex: 2,
        title: 'Xuất kho giao hàng & Giảm tồn vật lý',
        instruction: 'Mở M18 Warehouse Ops / M17, thực hiện xuất kho thực tế theo phiếu SO.',
        moduleId: 'M17',
        targetAction: 'ISSUE_DELIVERY',
        dataPayload: { soId: 'SO-2026-AUTO', issueQty: 40 },
        expectedResult: 'Physical giảm về 80, Allocated giải phóng về 0, Available = 80. CostingEngine tính giá vốn COGS.',
        verificationPoints: [
          'stock_ledger ghi ISSUE (-40).',
          'Sổ cái GL hạch toán COGS: Nợ 632 / Có 156 (40 x 250k = 10,000,000 VND).',
        ],
      },
    ],
    finalVerification: [
      'Tồn kho khả dụng phản ánh chính xác trong suốt quá trình.',
      'Giá vốn COGS tính đúng theo chi phí nhập kho trước đó.',
    ],
  },
  {
    id: 'SCENARIO_03_BLIND_STOCKTAKE',
    title: 'Thực hành Kiểm kê Đếm Mù (Blind Count) & Xử lý Chênh lệch Kho',
    domain: 'INVENTORY / WMS',
    difficulty: 'NÂNG CAO',
    durationMinutes: 25,
    objective: 'Thực hiện kiểm đếm mù, phát hiện chênh lệch thiếu và lập phiếu điều chỉnh hợp lệ không vi phạm quy tắc kế toán.',
    businessContext: 'Cuối tháng thực hiện kiểm kê kho phụ kiện. Số sách ghi nhận 50 cái, thực tế đếm được 48 cái (thiếu 2 cái).',
    initialState: 'Tồn sổ sách sản phẩm: 50 cái.',
    steps: [
      {
        stepIndex: 1,
        title: 'Khởi tạo Đợt kiểm kê Đếm Mù',
        instruction: 'Mở M19 Stocktake, tạo đợt kiểm kê mới ở chế độ Blind Count. Nhân viên đếm không nhìn thấy số 50.',
        moduleId: 'M19',
        targetAction: 'CREATE_BLIND_STOCKTAKE',
        dataPayload: { warehouseId: 'WH-MAIN', blindMode: true },
        expectedResult: 'Phiếu đếm che giấu cột tồn sổ sách. Trạng thái đợt kiểm kê chuyển sang COUNTING.',
        verificationPoints: [
          'Cột Tồn hệ thống trên phiếu kiểm đếm bị ẩn hoàn toàn.',
        ],
      },
      {
        stepIndex: 2,
        title: 'Nhập số đếm thực tế & Tính Variance',
        instruction: 'Thủ kho nhập số thực đếm 48 cái. Hệ thống tự động so khớp và tính chênh lệch âm 2 cái.',
        moduleId: 'M19',
        targetAction: 'SUBMIT_COUNT_RESULT',
        dataPayload: { countedQty: 48 },
        expectedResult: 'Hệ thống báo chênh lệch Variance = -2 cái (Thiếu hụt). Yêu cầu lập phiếu giải trình.',
        verificationPoints: [
          'Variance được tính toán tự động và hiển thị màu đỏ cảnh báo.',
        ],
      },
      {
        stepIndex: 3,
        title: 'Lập Phiếu Điều Chỉnh Kho (M10)',
        instruction: 'Chuyển sang M10 Stock Adjustment, lập phiếu điều chỉnh giảm 2 cái, gửi CFO phê duyệt.',
        moduleId: 'M10',
        targetAction: 'SUBMIT_ADJUSTMENT',
        dataPayload: { adjustQty: -2, reason: 'Hao hụt tự nhiên trong bảo quản' },
        expectedResult: 'Sau khi duyệt, InventoryService trừ 2 cái trên sổ cái. Physical Stock cập nhật về đúng 48.',
        verificationPoints: [
          'Sổ cái kho stock_ledger ghi ADJUSTMENT_OUT (-2).',
          'Physical Stock = 48, khớp với thực tế ngoài kho.',
          'Hạch toán chi phí hao hụt Nợ 1381 / Có 156.',
        ],
      },
    ],
    finalVerification: [
      'Không chỉnh sửa trực tiếp bảng stock_balances.',
      'Có đầy đủ chữ ký duyệt của cấp quản lý và hạch toán đúng tài khoản hao hụt.',
    ],
  },
];
