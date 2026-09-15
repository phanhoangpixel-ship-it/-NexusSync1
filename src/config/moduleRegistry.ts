export interface ModuleDefinition {
  moduleId: string;
  moduleName: string;
  code: string;
  domain: string;
  group: string;
  route: string;
  readEndpoint: string;
  approvalProvider?: boolean;
  permissions: string[];
  description: string;
  iconName: string;
  workspaceId?: string;
}

export interface EnvironmentProfile {
  id: string;
  name: string;
  description: string;
  allowedModules: string[];
}

export const ENVIRONMENT_PROFILES: EnvironmentProfile[] = [
  {
    id: 'RETAIL',
    name: 'Nhà bán lẻ (Retail)',
    description: 'Tối ưu cho cửa hàng bán lẻ, chuỗi shop, siêu thị mini. Ưu tiên POS, bán hàng, tồn kho và chăm sóc khách hàng.',
    allowedModules: [
      'M01', 'M02', 'M03', 'M04', // System modules
      'M07', // Customers & Item Master
      'M12', // CRM / Leads
      'M13', // Sales Orders (O2C)
      'M14', // Sales Commission
      'M15', // Returns & RMA
      'M17', // Inventory Core
      'M19', // Stocktake
      'M21', // Internal Transfers
      'M22', // Lots & Batches
      'M23', // Serials & IMEI
      'M08', // Purchase Orders
      'M09', // Suppliers SRM
      'M31', // Invoices AR/AP
      'M32', // Payments & Cash
      'M37', // BI & Analytics
      'M41', // Pricing & Commercial Management
    ]
  },
  {
    id: 'MANUFACTURING',
    name: 'Nhà máy sản xuất (Manufacturing)',
    description: 'Tối ưu cho nhà máy sản xuất, chế biến. Ưu tiên MES, BOM, MRP, bảo trì thiết bị, chất lượng QC.',
    allowedModules: [
      'M01', 'M02', 'M03', 'M04', // System modules
      'M06', // Innovation R&D
      'M07', // Customers & Item Master
      'M08', // Purchase Orders
      'M09', // Suppliers SRM
      'M10', // Strategic Sourcing
      'M11', // SRM Supplier Mgmt
      'M17', // Inventory Core
      'M19', // Stocktake
      'M22', // Lots & Batches
      'M25', // Manufacturing & BOM
      'M26', // Supply Chain SCM
      'M27', // EAM Asset Maintenance
      'M28', // HR & Payroll
      'M30', // Finance & GL
      'M31', // Invoices AR/AP
      'M35', // Projects & WBS
      'M39', // Quality Control QMS
      'M40', // EHS Safety
      'M37', // BI & Analytics
      'M41', // Pricing & Commercial Management
    ]
  },
  {
    id: 'DISTRIBUTION',
    name: 'Nhà phân phối (Distribution)',
    description: 'Tối ưu cho doanh nghiệp phân phối, thương mại sỉ, vận tải logistics. Ưu tiên quản lý kho hàng lớn, giao hàng, đối soát công nợ.',
    allowedModules: [
      'M01', 'M02', 'M03', 'M04', // System modules
      'M07', // Customers & Item Master
      'M08', // Purchase Orders
      'M09', // Suppliers SRM
      'M10', // Strategic Sourcing
      'M12', // CRM / Leads
      'M13', // Sales Orders (O2C)
      'M14', // Sales Commission
      'M15', // Returns & RMA
      'M17', // Inventory Core
      'M18', // Warehouse Management
      'M19', // Stocktake
      'M21', // Internal Transfers
      'M22', // Lots & Batches
      'M24', // WMS Extended
      'M30', // Finance & GL
      'M31', // Invoices AR/AP
      'M32', // Payments & Cash
      'M33', // Bank Reconciliation
      'M36', // Logistics & Fleet
      'M37', // BI & Analytics
      'M41', // Pricing & Commercial Management
    ]
  },
  {
    id: 'FULL_ERP',
    name: 'Quản trị tập đoàn (Full ERP)',
    description: 'Môi trường hợp nhất toàn diện, mở khóa tất cả các phân hệ và quyền hạn hệ thống.',
    allowedModules: ['*']
  }
];

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // 01. Thương Mại & Bán Hàng (Commercial & Sales) - 7 modules
  {
    moduleId: 'M16',
    code: 'M16',
    moduleName: 'POS Retail & Counter',
    domain: 'POS / RETAIL',
    group: '01. Thương Mại & Bán Hàng (Commercial & Sales)',
    route: '/pos',
    readEndpoint: '/api/shift/active',
    approvalProvider: false,
    permissions: ['pos', 'sales', 'cashier', 'manager', 'admin'],
    description: 'Quản lý ca làm việc thu ngân, két tiền mặt, đối soát doanh thu POS, thu/chi và chốt ca bán hàng lẻ.',
    iconName: 'Store',
    workspaceId: 'WS23_POS'
  },
  {
    moduleId: 'M07',
    code: 'M07',
    moduleName: 'Enterprise Master Data (Items & Customers)',
    domain: 'MASTER DATA / CORE',
    group: '01. Thương Mại & Bán Hàng (Commercial & Sales)',
    route: '/customers',
    readEndpoint: '/api/customers',
    approvalProvider: false,
    permissions: ['sales', 'finance', 'admin', 'manager'],
    description: 'Dữ liệu chủ nền tảng doanh nghiệp (Item/SKU Master, Đơn vị tính UOM, Hồ sơ Khách hàng B2B & Hạn mức công nợ).',
    iconName: 'Database',
    workspaceId: 'WS02_CRM'
  },
  {
    moduleId: 'M12',
    code: 'M12',
    moduleName: 'CRM / Khách hàng tiềm năng',
    domain: 'O2C / COMMERCE',
    group: '01. Thương Mại & Bán Hàng (Commercial & Sales)',
    route: '/crm',
    readEndpoint: '/api/crm/leads',
    approvalProvider: false,
    permissions: ['sales', 'manager', 'admin'],
    description: 'Quản lý quan hệ khách hàng, leads, cơ hội bán hàng & phễu chuyển đổi.',
    iconName: 'UserCheck',
    workspaceId: 'WS02_CRM'
  },
  {
    moduleId: 'M13',
    code: 'M13',
    moduleName: 'Sales Orders (O2C)',
    domain: 'O2C / COMMERCE',
    group: '01. Thương Mại & Bán Hàng (Commercial & Sales)',
    route: '/sales',
    readEndpoint: '/api/sales/orders',
    approvalProvider: true,
    permissions: ['sales', 'manager', 'admin'],
    description: 'Đơn đặt hàng B2B, giữ chỗ tồn kho (Allocated Qty), quy trình Order-to-Cash (O2C) & hàng chờ xử lý xuất kho.',
    iconName: 'ShoppingCart',
    workspaceId: 'WS03_SALES'
  },
  {
    moduleId: 'M14',
    code: 'M14',
    moduleName: 'Sales Commission',
    domain: 'O2C / COMMERCE',
    group: '01. Thương Mại & Bán Hàng (Commercial & Sales)',
    route: '/commission',
    readEndpoint: '/api/commission/plans',
    approvalProvider: true,
    permissions: ['sales', 'finance', 'cfo', 'admin'],
    description: 'Quản lý hoa hồng bán hàng, thưởng doanh số & chiết khấu bậc thang.',
    iconName: 'Percent',
    workspaceId: 'WS03_SALES'
  },
  {
    moduleId: 'M15',
    code: 'M15',
    moduleName: 'Returns & RMA',
    domain: 'O2C / COMMERCE',
    group: '01. Thương Mại & Bán Hàng (Commercial & Sales)',
    route: '/returns',
    readEndpoint: '/api/returns',
    approvalProvider: true,
    permissions: ['sales', 'warehouse', 'manager', 'admin'],
    description: 'Đổi trả hàng RMA từ khách hàng hoặc trả hàng về nhà cung cấp.',
    iconName: 'RotateCcw',
    workspaceId: 'WS22_RMA'
  },
  {
    moduleId: 'M41',
    code: 'M41',
    moduleName: 'Pricing & Commercial Management',
    domain: 'SALES / COMMERCIAL',
    group: '01. Thương Mại & Bán Hàng (Commercial & Sales)',
    route: '/pricing-management',
    readEndpoint: '/api/pricing/items',
    approvalProvider: true,
    permissions: ['admin', 'manager', 'cfo'],
    description: 'Quản lý cơ cấu giá, giá sỉ bậc thang, chiết khấu & thặng dư tối ưu.',
    iconName: 'Calculator',
    workspaceId: 'WS30_PRICING'
  },

  // 02. Mua Sắm & Cung Ứng (Procurement & Sourcing) - 4 modules
  {
    moduleId: 'M08',
    code: 'M08',
    moduleName: 'Purchase Orders (P2P)',
    domain: 'P2P / SRM',
    group: '02. Mua Sắm & Cung Ứng (Procurement & Sourcing)',
    route: '/purchase',
    readEndpoint: '/api/purchase/orders',
    approvalProvider: true,
    permissions: ['purchase', 'manager', 'admin', 'cfo'],
    description: 'Đơn mua hàng PO nhà cung cấp, quy trình Procure-to-Pay (P2P), 3-Way Matching & luồng phê duyệt mua hàng.',
    iconName: 'ShoppingBag',
    workspaceId: 'WS04_PURCHASE'
  },
  {
    moduleId: 'M09',
    code: 'M09',
    moduleName: 'Suppliers SRM',
    domain: 'P2P / SRM',
    group: '02. Mua Sắm & Cung Ứng (Procurement & Sourcing)',
    route: '/suppliers',
    readEndpoint: '/api/suppliers',
    approvalProvider: false,
    permissions: ['purchase', 'finance', 'admin', 'manager'],
    description: 'Hồ sơ nhà cung cấp SRM, điều khoản thanh toán & hạn mức nợ.',
    iconName: 'Truck',
    workspaceId: 'WS04_PURCHASE'
  },
  {
    moduleId: 'M10',
    code: 'M10',
    moduleName: 'Strategic Sourcing',
    domain: 'P2P / SRM',
    group: '02. Mua Sắm & Cung Ứng (Procurement & Sourcing)',
    route: '/strategic-sourcing',
    readEndpoint: '/api/sourcing/rfqs',
    approvalProvider: true,
    permissions: ['purchase', 'manager', 'admin'],
    description: 'Đấu thầu mua hàng, yêu cầu báo giá RFQ & chào giá nhà cung cấp.',
    iconName: 'SearchCode',
    workspaceId: 'WS24_SOURCING'
  },
  {
    moduleId: 'M11',
    code: 'M11',
    moduleName: 'SRM Supplier Mgmt',
    domain: 'P2P / SRM',
    group: '02. Mua Sắm & Cung Ứng (Procurement & Sourcing)',
    route: '/srm',
    readEndpoint: '/api/srm/scorecards',
    approvalProvider: false,
    permissions: ['purchase', 'manager', 'admin'],
    description: 'Đánh giá thẻ điểm nhà cung cấp (Scorecard), quản lý chất lượng NCC & in báo cáo SRM.',
    iconName: 'ShieldCheck',
    workspaceId: 'WS25_SRM'
  },

  // 03. Kho Vận & Hậu Cần (Warehouse & Logistics) - 9 modules
  {
    moduleId: 'M17',
    code: 'M17',
    moduleName: 'Trung Tâm Vận Hành Kho & WMS',
    domain: 'INVENTORY / WMS',
    group: '03. Kho Vận & Hậu Cần (Warehouse & Logistics)',
    route: '/inventory',
    readEndpoint: '/api/products',
    approvalProvider: false,
    permissions: ['inventory.read', 'warehouse', 'manager', 'admin', 'cfo', 'warehouse.operator', 'warehouse.supervisor', 'warehouse.manager'],
    description: 'Trung tâm Vận hành Kho & WMS tổng hợp (M17-M24): Tồn kho lõi, Kho/Vị trí, Kiểm kê, Điều chỉnh, Chuyển kho, Lô/Batch, Serial & WMS Extended.',
    iconName: 'Warehouse',
    workspaceId: 'WS05_MASTER_WMS'
  },
  {
    moduleId: 'M18',
    code: 'M18',
    moduleName: 'Warehouse Management',
    domain: 'INVENTORY / WMS',
    group: '03. Kho Vận & Hậu Cần (Warehouse & Logistics)',
    route: '/warehouse',
    readEndpoint: '/api/warehouses',
    approvalProvider: false,
    permissions: ['warehouse', 'manager', 'admin'],
    description: 'Trung tâm điều hành kho vận tổng hợp: Inbound, Outbound, Transfer, Control, Traceability & Setup vị trí.',
    iconName: 'Warehouse',
    workspaceId: 'WS06_WAREHOUSE'
  },
  {
    moduleId: 'M19',
    code: 'M19',
    moduleName: 'Stocktake / Kiểm kê',
    domain: 'INVENTORY / WMS',
    group: '03. Kho Vận & Hậu Cần (Warehouse & Logistics)',
    route: '/stocktake',
    readEndpoint: '/api/stocktakes',
    approvalProvider: true,
    permissions: ['stocktake.view', 'warehouse', 'manager', 'admin'],
    description: 'Kiểm kê kho định kỳ, kiểm đếm mù (Blind Stocktake), báo cáo chênh lệch variance.',
    iconName: 'ClipboardCheck',
    workspaceId: 'WS07_STOCKTAKE'
  },
  {
    moduleId: 'M20',
    code: 'M20',
    moduleName: 'Stock Adjustment',
    domain: 'INVENTORY / WMS',
    group: '03. Kho Vận & Hậu Cần (Warehouse & Logistics)',
    route: '/stock-adjustment',
    readEndpoint: '/api/stock-adjustments',
    approvalProvider: true,
    permissions: ['stock.adjust', 'warehouse', 'manager', 'admin'],
    description: 'Xử lý phiếu điều chỉnh tăng/giảm kho với kiểm toán định khoản kép và xác thực số dư realtime M17.',
    iconName: 'SlidersHorizontal',
    workspaceId: 'WS08_ADJUSTMENT'
  },
  {
    moduleId: 'M21',
    code: 'M21',
    moduleName: 'Internal Transfers',
    domain: 'INVENTORY / WMS',
    group: '03. Kho Vận & Hậu Cần (Warehouse & Logistics)',
    route: '/transfer',
    readEndpoint: '/api/stock-transfers',
    approvalProvider: true,
    permissions: ['stock.transfer', 'warehouse', 'manager', 'admin'],
    description: 'Yêu cầu & phê duyệt chuyển kho nội bộ giữa các chi nhánh, theo dõi hàng đi đường (In-transit).',
    iconName: 'ArrowLeftRight',
    workspaceId: 'WS09_TRANSFER'
  },
  {
    moduleId: 'M22',
    code: 'M22',
    moduleName: 'Lots & Batches',
    domain: 'INVENTORY / WMS',
    group: '03. Kho Vận & Hậu Cần (Warehouse & Logistics)',
    route: '/lots',
    readEndpoint: '/api/lots',
    approvalProvider: false,
    permissions: ['warehouse', 'manager', 'admin'],
    description: 'Quản lý lô sản xuất, ngày sản xuất, hạn sử dụng (Expiry Date) & cảnh báo xuất hàng FEFO/FIFO.',
    iconName: 'Tags',
    workspaceId: 'WS10_LOTS'
  },
  {
    moduleId: 'M23',
    code: 'M23',
    moduleName: 'Serials & IMEI',
    domain: 'INVENTORY / WMS',
    group: '03. Kho Vận & Hậu Cần (Warehouse & Logistics)',
    route: '/serials',
    readEndpoint: '/api/serials',
    approvalProvider: false,
    permissions: ['warehouse', 'manager', 'admin'],
    description: 'Truy xuất & quản lý mã Serial/IMEI chi tiết cho từng đơn vị sản phẩm.',
    iconName: 'QrCode',
    workspaceId: 'WS11_SERIALS'
  },
  {
    moduleId: 'M24',
    code: 'M24',
    moduleName: 'WMS Extended',
    domain: 'INVENTORY / WMS',
    group: '03. Kho Vận & Hậu Cần (Warehouse & Logistics)',
    route: '/wms-extended',
    readEndpoint: '/api/wms/wave-picks',
    approvalProvider: false,
    permissions: ['warehouse', 'manager', 'admin'],
    description: 'Kho vận nâng cao 6 Tab: Wave Picking, Replenishment, Bin Allocation, Packing LPN, Dock Appointment, Carrier Freight.',
    iconName: 'Layers',
    workspaceId: 'WS12_WMS_EXT'
  },
  {
    moduleId: 'M36',
    code: 'M36',
    moduleName: 'Logistics & Fleet',
    domain: 'LOGISTICS / TMS',
    group: '03. Kho Vận & Hậu Cần (Warehouse & Logistics)',
    route: '/logistics',
    readEndpoint: '/api/logistics/deliveries',
    approvalProvider: false,
    permissions: ['logistics', 'manager', 'admin'],
    description: 'Hậu cần & vận tải, quản lý chuyến xe delivery, điều vận 3PL & mã vận đơn.',
    iconName: 'Navigation',
    workspaceId: 'WS17_LOGISTICS'
  },

  // 04. Sản Xuất & Vận Hành (Manufacturing & Operations) - 7 modules
  {
    moduleId: 'M06',
    code: 'M06',
    moduleName: 'Innovation R&D',
    domain: 'MASTER DATA',
    group: '04. Sản Xuất & Vận Hành (Manufacturing & Operations)',
    route: '/rd',
    readEndpoint: '/api/rd/projects',
    approvalProvider: false,
    permissions: ['admin', 'manager'],
    description: 'Nghiên cứu & phát triển sản phẩm mới R&D, quản lý công thức & thử nghiệm.',
    iconName: 'Sparkles',
    workspaceId: 'WS05_INVENTORY'
  },
  {
    moduleId: 'M25',
    code: 'M25',
    moduleName: 'Manufacturing & BOM',
    domain: 'MES / MRP / SCP',
    group: '04. Sản Xuất & Vận Hành (Manufacturing & Operations)',
    route: '/manufacturing',
    readEndpoint: '/api/manufacturing/orders',
    approvalProvider: true,
    permissions: ['manufacturing', 'manager', 'admin'],
    description: 'Điều hành sản xuất MES, Lệnh sản xuất (MO), Định mức nguyên vật liệu BOM & xuất nhập vật tư.',
    iconName: 'Cpu',
    workspaceId: 'WS13_MES'
  },
  {
    moduleId: 'M26',
    code: 'M26',
    moduleName: 'Supply Chain SCM',
    domain: 'MES / MRP / SCP',
    group: '04. Sản Xuất & Vận Hành (Manufacturing & Operations)',
    route: '/supply-chain',
    readEndpoint: '/api/supply-chain/plans',
    approvalProvider: false,
    permissions: ['manager', 'admin', 'cfo'],
    description: 'Quy hoạch cung ứng MRP, dự báo nhu cầu & tháp cân bằng cung cầu SCM.',
    iconName: 'GitBranch',
    workspaceId: 'WS14_SCM'
  },
  {
    moduleId: 'M27',
    code: 'M27',
    moduleName: 'EAM Asset Maintenance',
    domain: 'EAM / CMMS',
    group: '04. Sản Xuất & Vận Hành (Manufacturing & Operations)',
    route: '/eam',
    readEndpoint: '/api/eam/assets',
    approvalProvider: false,
    permissions: ['eam', 'manager', 'admin'],
    description: 'Quản lý thiết bị tài sản, lập lịch bảo trì định kỳ PM & danh mục phụ tùng thay thế.',
    iconName: 'Wrench',
    workspaceId: 'WS15_EAM'
  },
  {
    moduleId: 'M28',
    code: 'M28',
    moduleName: 'HR & Payroll',
    domain: 'HR / HCM',
    group: '04. Sản Xuất & Vận Hành (Manufacturing & Operations)',
    route: '/hr',
    readEndpoint: '/api/hr/employees',
    approvalProvider: true,
    permissions: ['hr', 'manager', 'admin', 'cfo'],
    description: 'Quản trị nhân sự HRM, hồ sơ nhân viên, chấm công, bảo hiểm & bảng lương tự động.',
    iconName: 'UserPlus',
    workspaceId: 'WS18_FINANCE'
  },
  {
    moduleId: 'M35',
    code: 'M35',
    moduleName: 'Projects & WBS',
    domain: 'PROJECT / COSTING',
    group: '04. Sản Xuất & Vận Hành (Manufacturing & Operations)',
    route: '/projects',
    readEndpoint: '/api/projects',
    approvalProvider: false,
    permissions: ['manager', 'admin', 'cfo'],
    description: 'Quản lý dự án, cấu trúc WBS, tiến độ công việc & tính toán chi phí dự án.',
    iconName: 'Kanban',
    workspaceId: 'WS16_PROJECTS'
  },

  // 05. Tài Chính & Kế Toán (Finance & Accounting) - 5 modules
  {
    moduleId: 'M30',
    code: 'M30',
    moduleName: 'Finance & GL',
    domain: 'FINANCE / FICO',
    group: '05. Tài Chính & Kế Toán (Finance & Accounting)',
    route: '/finance',
    readEndpoint: '/api/finance/accounts',
    approvalProvider: false,
    permissions: ['finance', 'cfo', 'admin', 'manager'],
    description: 'Sổ cái tổng hợp GL (General Ledger), bút toán định khoản kép (Single Writer GL) & Bảng cân đối kế toán.',
    iconName: 'BookOpen',
    workspaceId: 'WS18_FINANCE'
  },
  {
    moduleId: 'M31',
    code: 'M31',
    moduleName: 'Finance & Accounting (AR/AP/VAT)',
    domain: 'FINANCE / FICO',
    group: '05. Tài Chính & Kế Toán (Finance & Accounting)',
    route: '/invoices',
    readEndpoint: '/api/invoices',
    approvalProvider: true,
    permissions: ['finance', 'cfo', 'admin', 'manager'],
    description: 'Module tổng FINANCE & ACCOUNTING: Công nợ Phải Thu AR, Phải Trả AP, Central Tax Engine Authority (Thuế GTGT), Payments, GL & Báo Báo Tài Chính.',
    iconName: 'DollarSign',
    workspaceId: 'WS19_INVOICES'
  },
  {
    moduleId: 'M32',
    code: 'M32',
    moduleName: 'Payments & Cash',
    domain: 'FINANCE / FICO',
    group: '05. Tài Chính & Kế Toán (Finance & Accounting)',
    route: '/payments',
    readEndpoint: '/api/payments',
    approvalProvider: true,
    permissions: ['finance', 'cfo', 'admin'],
    description: 'Quản lý quỹ tiền mặt, phiếu thu/phiếu chi & dòng tiền.',
    iconName: 'Coins',
    workspaceId: 'WS20_PAYMENTS'
  },
  {
    moduleId: 'M33',
    code: 'M33',
    moduleName: 'Bank Reconciliation',
    domain: 'FINANCE / FICO',
    group: '05. Tài Chính & Kế Toán (Finance & Accounting)',
    route: '/bank-reconciliation',
    readEndpoint: '/api/bank/statements',
    approvalProvider: false,
    permissions: ['finance', 'cfo', 'admin'],
    description: 'Đối soát tài khoản ngân hàng, sổ phụ ngân hàng & tích hợp VietQR.',
    iconName: 'Landmark',
    workspaceId: 'WS21_BANK'
  },
  {
    moduleId: 'M34',
    code: 'M34',
    moduleName: 'Financial Consolidation',
    domain: 'FINANCE / FICO',
    group: '05. Tài Chính & Kế Toán (Finance & Accounting)',
    route: '/financial-consolidation',
    readEndpoint: '/api/finance/consolidation',
    approvalProvider: false,
    permissions: ['cfo', 'admin'],
    description: 'Hợp nhất báo cáo tài chính đa chi nhánh & tập đoàn.',
    iconName: 'GitMerge',
    workspaceId: 'WS18_FINANCE'
  },

  // 00. Core Workspace Hub (Trung Tâm Điều Phối Toàn Cục)
  {
    moduleId: 'M01',
    code: 'M01',
    moduleName: 'Workspace Hub',
    domain: 'CORE / IAM',
    group: '00. Core Hub (Trung Tâm Điều Phối)',
    route: '/workspace',
    readEndpoint: '/api/workspace/summary',
    approvalProvider: false,
    permissions: ['public', 'operator', 'manager', 'admin', 'cfo', 'warehouse', 'sales'],
    description: 'Trung tâm điều phối toàn diện, WorkQueue hàng chờ công việc SLA theo vai trò, tháp KPI sparklines & ma trận 29 Workspaces.',
    iconName: 'LayoutDashboard',
    workspaceId: 'WS01_HUB'
  },

  // 06. Quản Trị & Hệ Thống (Governance & System) - 9 modules
  {
    moduleId: 'M02',
    code: 'M02',
    moduleName: 'Audit Compliance',
    domain: 'GOVERNANCE / AUDIT',
    group: '06. Quản Trị & Hệ Thống (Governance & System)',
    route: '/audit',
    readEndpoint: '/api/audit/logs',
    approvalProvider: false,
    permissions: ['admin', 'cfo'],
    description: 'Nhật ký kiểm toán truy vết thao tác & bảo mật chuỗi Hash Checksum SHA-256.',
    iconName: 'Fingerprint',
    workspaceId: 'WS28_DMS'
  },
  {
    moduleId: 'M03',
    code: 'M03',
    moduleName: 'System Settings',
    domain: 'CORE / IAM',
    group: '06. Quản Trị & Hệ Thống (Governance & System)',
    route: '/system-settings',
    readEndpoint: '/api/settings',
    approvalProvider: false,
    permissions: ['admin', 'cfo'],
    description: 'Cấu hình tham số hệ thống toàn cục, tỷ giá, đa tiền tệ & quy tắc tạo mã.',
    iconName: 'Settings',
    workspaceId: 'WS01_HUB'
  },
  {
    moduleId: 'M04',
    code: 'M04',
    moduleName: 'SuperAdmin RBAC Portal',
    domain: 'CORE / IAM',
    group: '06. Quản Trị & Hệ Thống (Governance & System)',
    route: '/super-admin',
    readEndpoint: '/api/rbac/roles',
    approvalProvider: false,
    permissions: ['SUPER_ADMIN', 'admin'],
    description: 'Cổng quản trị tối cao SuperAdmin, phân quyền RBAC hạt nhân, gán role & quản lý multi-tenant.',
    iconName: 'Shield',
    workspaceId: 'WS01_HUB'
  },
  {
    moduleId: 'M05',
    code: 'M05',
    moduleName: 'EventBus & EDA',
    domain: 'GOVERNANCE / AUDIT',
    group: '06. Quản Trị & Hệ Thống (Governance & System)',
    route: '/event-bus',
    readEndpoint: '/api/events/outbox',
    approvalProvider: false,
    permissions: ['admin'],
    description: 'Trục sự kiện EventBus, tích hợp bất đồng bộ & Outbox Pattern.',
    iconName: 'Zap',
    workspaceId: 'WS26_SERVICEDESK'
  },
  {
    moduleId: 'M29',
    code: 'M29',
    moduleName: 'DMS Documents',
    domain: 'GOVERNANCE / AUDIT',
    group: '06. Quản Trị & Hệ Thống (Governance & System)',
    route: '/dms',
    readEndpoint: '/api/dms/documents',
    approvalProvider: false,
    permissions: ['admin', 'manager', 'operator'],
    description: 'Quản lý tài liệu số hóa DMS, lưu trữ hợp đồng & chứng từ điện tử.',
    iconName: 'FileText',
    workspaceId: 'WS28_DMS'
  },
  {
    moduleId: 'M37',
    code: 'M37',
    moduleName: 'BI & Analytics Reports',
    domain: 'GOVERNANCE / AUDIT',
    group: '06. Quản Trị & Hệ Thống (Governance & System)',
    route: '/reports',
    readEndpoint: '/api/reports/summary',
    approvalProvider: false,
    permissions: ['cfo', 'manager', 'admin'],
    description: 'Báo cáo phân tích thông minh BI, tháp báo cáo P&L, doanh thu, giá vốn.',
    iconName: 'BarChart3',
    workspaceId: 'WS18_FINANCE'
  },
  {
    moduleId: 'M38',
    code: 'M38',
    moduleName: 'Service Desk / Sự cố IT',
    domain: 'GOVERNANCE / AUDIT',
    group: '06. Quản Trị & Hệ Thống (Governance & System)',
    route: '/issue',
    readEndpoint: '/api/issues',
    approvalProvider: false,
    permissions: ['admin', 'operator', 'manager'],
    description: 'Xử lý sự cố, yêu cầu hỗ trợ IT Ticketing & báo lỗi nội bộ.',
    iconName: 'HelpCircle',
    workspaceId: 'WS26_SERVICEDESK'
  },
  {
    moduleId: 'M39',
    code: 'M39',
    moduleName: 'Quality Control QMS',
    domain: 'GOVERNANCE / AUDIT',
    group: '06. Quản Trị & Hệ Thống (Governance & System)',
    route: '/quality',
    readEndpoint: '/api/quality/plans',
    approvalProvider: true,
    permissions: ['quality', 'manager', 'admin'],
    description: 'Kiểm soát chất lượng QMS (IQC, PQC, OQC), kế hoạch kiểm tra & xử lý hàng giữ.',
    iconName: 'Award',
    workspaceId: 'WS27_QUALITY'
  },
  {
    moduleId: 'M40',
    code: 'M40',
    moduleName: 'EHS Safety & Environment',
    domain: 'GOVERNANCE / AUDIT',
    group: '06. Quản Trị & Hệ Thống (Governance & System)',
    route: '/ehs',
    readEndpoint: '/api/ehs/records',
    approvalProvider: false,
    permissions: ['admin', 'manager'],
    description: 'An toàn lao động, vệ sinh môi trường & bảo hộ PCCC.',
    iconName: 'ShieldAlert',
    workspaceId: 'WS29_EHS'
  },
  {
    moduleId: 'M42',
    code: 'M42',
    moduleName: 'Phân bổ Chi phí & COGS',
    domain: 'FINANCE / CONTROLLING',
    group: '05. Tài Chính & Kế Toán (Finance & Accounting)',
    route: '/cogs',
    readEndpoint: '/api/cogs/allocation',
    approvalProvider: true,
    permissions: ['cfo', 'accountant', 'manager', 'admin'],
    description: 'Quản lý trung tâm chi phí (Cost Pools), phân bổ chi phí gián tiếp (ABC) và tính toán giá vốn hàng bán (COGS).',
    iconName: 'Calculator',
    workspaceId: 'WS31_COGS'
  },
];

export const WORKSPACES = [
  { id: 'WS01_HUB', name: 'Workspace Hub & Điều phối', group: 'CORE', primaryModule: 'M01' },
  { id: 'WS02_CRM', name: 'CRM & Bán hàng tiềm năng', group: 'SALES', primaryModule: 'M12' },
  { id: 'WS03_SALES', name: 'Đơn hàng B2B & O2C', group: 'SALES', primaryModule: 'M13' },
  { id: 'WS04_PURCHASE', name: 'Mua sắm & Chuỗi P2P', group: 'PROCUREMENT', primaryModule: 'M08' },
  { id: 'WS05_MASTER_WMS', name: 'Trung Tâm Vận Hành Kho & Master WMS', group: 'INVENTORY', primaryModule: 'M17' },
  { id: 'WS06_WAREHOUSE', name: 'Vị trí Bin/Rack & Vận hành', group: 'INVENTORY', primaryModule: 'M18' },
  { id: 'WS07_STOCKTAKE', name: 'Kiểm kê định kỳ & Blind Count', group: 'INVENTORY', primaryModule: 'M19' },
  { id: 'WS08_ADJUSTMENT', name: 'Điều chỉnh & Xử lý chênh lệch', group: 'INVENTORY', primaryModule: 'M20' },
  { id: 'WS09_TRANSFER', name: 'Chuyển kho nội bộ & In-transit', group: 'INVENTORY', primaryModule: 'M21' },
  { id: 'WS10_LOTS', name: 'Quản lý Lô SX & FEFO', group: 'INVENTORY', primaryModule: 'M22' },
  { id: 'WS11_SERIALS', name: 'Mã Serial & IMEI', group: 'INVENTORY', primaryModule: 'M23' },
  { id: 'WS12_WMS_EXT', name: 'WMS Mở rộng & Wave Picking', group: 'INVENTORY', primaryModule: 'M24' },
  { id: 'WS13_MES', name: 'Sản xuất MES & Định mức BOM', group: 'MANUFACTURING', primaryModule: 'M25' },
  { id: 'WS14_SCM', name: 'Kế hoạch cung ứng MRP & SCM', group: 'MANUFACTURING', primaryModule: 'M26' },
  { id: 'WS15_EAM', name: 'Quản lý thiết bị & Bảo trì EAM', group: 'MAINTENANCE', primaryModule: 'M27' },
  { id: 'WS16_PROJECTS', name: 'Dự án, WBS & Chi phí', group: 'PROJECTS', primaryModule: 'M35' },
  { id: 'WS17_LOGISTICS', name: 'Điều vận Logistics & Fleet', group: 'LOGISTICS', primaryModule: 'M36' },
  { id: 'WS18_FINANCE', name: 'Sổ cái tổng hợp & Tài chính GL', group: 'FINANCE', primaryModule: 'M30' },
  { id: 'WS19_INVOICES', name: 'Hóa đơn AR / AP & Thuế', group: 'FINANCE', primaryModule: 'M31' },
  { id: 'WS20_PAYMENTS', name: 'Quỹ tiền mặt & Thu chi', group: 'FINANCE', primaryModule: 'M32' },
  { id: 'WS21_BANK', name: 'Đối soát ngân hàng & VietQR', group: 'FINANCE', primaryModule: 'M33' },
  { id: 'WS22_RMA', name: 'Đổi trả hàng & Quản lý RMA', group: 'SALES', primaryModule: 'M15' },
  { id: 'WS23_POS', name: 'Quầy bán lẻ & Thu ngân POS', group: 'SALES', primaryModule: 'M16' },
  { id: 'WS24_SOURCING', name: 'Đấu thầu mua hàng & RFQ', group: 'PROCUREMENT', primaryModule: 'M10' },
  { id: 'WS25_SRM', name: 'Đánh giá nhà cung cấp SRM', group: 'PROCUREMENT', primaryModule: 'M11' },
  { id: 'WS26_SERVICEDESK', name: 'Hỗ trợ kỹ thuật IT Desk', group: 'GOVERNANCE', primaryModule: 'M38' },
  { id: 'WS27_QUALITY', name: 'Kiểm soát chất lượng QMS', group: 'GOVERNANCE', primaryModule: 'M39' },
  { id: 'WS28_DMS', name: 'Số hóa tài liệu & Chứng từ DMS', group: 'GOVERNANCE', primaryModule: 'M29' },
  { id: 'WS29_EHS', name: 'An toàn lao động & Môi trường EHS', group: 'GOVERNANCE', primaryModule: 'M40' },
  { id: 'WS30_PRICING', name: 'Cơ cấu Giá & Chính sách Thương mại', group: 'SALES', primaryModule: 'M41' },
  { id: 'WS31_COGS', name: 'Phân bổ Chi phí & Giá vốn COGS', group: 'FINANCE', primaryModule: 'M42' },
];

export const SYSTEM_ROLES = [
  { id: 'CFO', name: 'CFO / Kế toán trưởng', department: 'Tài chính - Kế toán', badgeColor: 'purple' },
  { id: 'ADMIN', name: 'ERP Admin (Quản trị hệ thống)', department: 'Công nghệ thông tin', badgeColor: 'blue' },
  { id: 'WAREHOUSE_CHIEF', name: 'Thủ kho trưởng', department: 'Quản lý kho vận', badgeColor: 'amber' },
  { id: 'PURCHASE_DIR', name: 'Giám đốc mua hàng (CPO)', department: 'Mua sắm - Cung ứng', badgeColor: 'teal' },
  { id: 'SALES_DIR', name: 'Giám đốc kinh doanh (CSO)', department: 'Kinh doanh & Thị trường', badgeColor: 'emerald' },
  { id: 'PLANT_MGR', name: 'Quản lý sản xuất', department: 'Khối Sản xuất & Kỹ thuật', badgeColor: 'rose' },
];

export const BRANCHES = [
  { id: 'BR_HO', name: 'Trụ sở chính (Hà Nội)', code: 'HN-HQ', isDefault: true },
  { id: 'BR_HCM', name: 'Chi nhánh TP. Hồ Chí Minh', code: 'HCM-BR' },
  { id: 'BR_DN', name: 'Kho Logistics Miền Trung (Đà Nẵng)', code: 'DN-WMS' },
  { id: 'BR_CT', name: 'Kho Vệ Tinh Tây Nam Bộ (Cần Thơ)', code: 'CT-WH' },
];
