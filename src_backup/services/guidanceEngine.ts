// NexusSync ERP — Authoritative Business Guidance & Next Best Action Engine
// Strictly enforces Core ERP Single-Writer Architecture, Deterministic State Transitions, and Progressive Disclosure

import {
  ActionContract,
  BusinessDomainCategory,
  BusinessGpsStep,
  BusinessGuardAlert,
  BusinessGuidanceContext,
  BusinessIntentResult,
  BusinessJourneyTracker,
  EntityBusinessState,
  MyWorkPendingItem,
  NextBestAction,
} from '../types/guidance';
import { UserSession } from '../types';

// =========================================================================
// 1. DETERMINISTIC ACTION CONTRACTS DICTIONARY (Level 1 Foundation)
// =========================================================================

export const ACTION_CONTRACTS: Record<string, ActionContract> = {
  // --- SALES ORDER (O2C) CONTRACTS ---
  'SO_SUBMIT': {
    actionId: 'SO_SUBMIT',
    label: 'Gửi Duyệt Đơn Bán Hàng',
    purpose: 'Chuyển đơn hàng từ nháp sang chờ xét duyệt hạn mức nợ và chính sách giá.',
    requiredState: ['DRAFT'],
    requiredPermission: ['SALES_ORDER_CREATE', 'SALES_ORDER_SUBMIT', '*'],
    preconditions: [
      'Đã chọn Khách hàng hợp lệ từ M07 Customer Master',
      'Đã chọn ít nhất 1 mặt hàng (SKU) có số lượng > 0',
      'Đơn giá khớp với chính sách giá hiệu lực tại M41 Price Resolution',
    ],
    targetModuleId: 'M13',
    targetRoute: '/sales',
    executionEndpoint: '/api/so/submit',
    executionMethod: 'POST',
    expectedResult: 'Đơn hàng được chốt dữ liệu và chuyển sang trạng thái SUBMITTED.',
    resultingState: 'SUBMITTED',
    businessReason: 'Ngăn chặn sửa đổi dữ liệu tự do sau khi đã gửi đi để đảm bảo tính toàn vẹn thương mại.',
    riskLevel: 'LOW',
    requiresConfirmation: false,
    coreEngine: 'OrchestrationEngine & PriceResolutionService',
    databaseEffect: 'Cập nhật status = SUBMITTED trong sales_orders',
    auditRequirement: 'Ghi nhật ký Audit SHA-256 hành động SUBMIT_SO',
  },
  'SO_APPROVE': {
    actionId: 'SO_APPROVE',
    label: 'Phê Duyệt Đơn Bán Hàng',
    purpose: 'Phê duyệt điều khoản thương mại, hạn mức công nợ và chiết khấu đặc biệt.',
    requiredState: ['SUBMITTED'],
    requiredPermission: ['SALES_DIR', 'SUPER_ADMIN', 'ADMIN', '*'],
    preconditions: [
      'Tổng dư nợ khách hàng không vượt hạn mức tín dụng Credit Limit',
      'Chiết khấu nằm trong khung phân quyền của cấp duyệt',
    ],
    targetModuleId: 'M13',
    targetRoute: '/sales',
    executionEndpoint: '/api/so/approve',
    executionMethod: 'POST',
    expectedResult: 'Đơn hàng được phê duyệt, sẵn sàng giữ chỗ tồn kho.',
    resultingState: 'APPROVED',
    businessReason: 'Bảo vệ ròng tiền và kiểm soát rủi ro nợ xấu trước khi cam kết xuất kho hàng hóa.',
    riskLevel: 'MEDIUM',
    requiresConfirmation: true,
    coreEngine: 'OrchestrationEngine & AuthorityManager',
    databaseEffect: 'Cập nhật status = APPROVED trong sales_orders',
    auditRequirement: 'Bắt buộc lưu chữ ký điện tử của người duyệt vào audit_logs',
  },
  'SO_RESERVE': {
    actionId: 'SO_RESERVE',
    label: 'Khoanh Giữ Tồn Kho (Reserve Stock)',
    purpose: 'Khóa số lượng hàng tồn tương ứng để đảm bảo đơn hàng có đủ hàng giao.',
    requiredState: ['APPROVED'],
    requiredPermission: ['INVENTORY_ALLOCATE', 'WAREHOUSE_MGR', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Tồn kho khả dụng (Available Stock) tại M17 >= Số lượng đặt hàng',
      'Kho chỉ định đang hoạt động bình thường',
    ],
    targetModuleId: 'M13',
    targetRoute: '/sales',
    executionEndpoint: '/api/inventory/reserve',
    executionMethod: 'POST',
    expectedResult: 'Tồn Available giảm, Tồn Allocated tăng; Physical không đổi. Không bị bán trùng lặp.',
    resultingState: 'RESERVED',
    businessReason: 'Tuân thủ bất biến kho: Available = Physical - Allocated >= 0, chống Over-selling.',
    riskLevel: 'MEDIUM',
    requiresConfirmation: false,
    coreEngine: 'InventoryService (Single Writer)',
    databaseEffect: 'Cập nhật stock_balances.allocatedQty và stock_balances.availableQty',
    auditRequirement: 'Ghi ledger event ALLOCATE_RESERVATION vào stock_ledger',
  },
  'SO_FULFILL': {
    actionId: 'SO_FULFILL',
    label: 'Lập Lệnh Soạn Hàng (Pick & Pack)',
    purpose: 'Xuất phiếu nhặt hàng cho nhân viên kho theo vị trí Bin/Kệ.',
    requiredState: ['RESERVED'],
    requiredPermission: ['WAREHOUSE_OPERATOR', 'WAREHOUSE_MGR', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Hàng hóa đã được khoanh giữ (RESERVED) thành công',
      'Nhân viên kho có mặt tại khu vực soạn hàng',
    ],
    targetModuleId: 'M17',
    targetRoute: '/inventory',
    executionEndpoint: '/api/orders/:id/pack',
    executionMethod: 'POST',
    expectedResult: 'Tạo danh sách Wave Pick / Picking List, chuyển trạng thái FULFILLING.',
    resultingState: 'FULFILLING',
    businessReason: 'Tối ưu hóa quãng đường di chuyển của nhân viên trong kho hàng lớn.',
    riskLevel: 'LOW',
    requiresConfirmation: false,
    coreEngine: 'InventoryService & WMSExtended',
    databaseEffect: 'Tạo bản ghi pick_lists và cập nhật meta fulfillmentStatus = PACKED',
    auditRequirement: 'Ghi nhận timestamp bắt đầu soạn hàng',
  },
  'SO_SHIP': {
    actionId: 'SO_SHIP',
    label: 'Xuất Kho Giao Hàng (Ship Dispatch)',
    purpose: 'Xuất hàng vật lý ra khỏi kho, chuyển giao cho đơn vị vận tải M36 Logistics.',
    requiredState: ['FULFILLING', 'RESERVED'],
    requiredPermission: ['WAREHOUSE_CHIEF', 'LOGISTICS_LEAD', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Hàng đã được đóng gói và dán mã vận đơn Waybill M36',
      'Có biên bản bàn giao xe tải hoặc đơn vị chuyển phát 3PL',
    ],
    targetModuleId: 'M36',
    targetRoute: '/dispatch',
    executionEndpoint: '/api/orders/:id/ship',
    executionMethod: 'POST',
    expectedResult: 'InventoryService trừ Physical Stock; CostingEngine tính giá vốn COGS (Nợ 632 / Có 156).',
    resultingState: 'SHIPPED',
    businessReason: 'Chuyển quyền sở hữu hàng hóa và ghi nhận chi phí xuất kho thực tế.',
    riskLevel: 'HIGH',
    requiresConfirmation: true,
    coreEngine: 'InventoryService & CostingEngine',
    databaseEffect: 'Ghi stock_ledger (ISSUE, -Qty), giải phóng allocatedQty, ghi journal COGS',
    auditRequirement: 'Bắt buộc lưu mã phiếu xuất kho và chứng thư số',
  },
  'SO_INVOICE': {
    actionId: 'SO_INVOICE',
    label: 'Phát Hành Hóa Đơn Bán Hàng (AR Invoice)',
    purpose: 'Xuất hóa đơn GTGT điện tử gửi khách hàng và ghi nhận doanh thu công nợ.',
    requiredState: ['SHIPPED'],
    requiredPermission: ['ACCOUNTANT', 'FINANCE_DIR', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Biên bản giao nhận POD đã có chữ ký xác nhận của khách hàng',
      'Đã kiểm tra mã số thuế và thông tin xuất hóa đơn VAT',
    ],
    targetModuleId: 'M31',
    targetRoute: '/invoices',
    executionEndpoint: '/api/invoices/sign',
    executionMethod: 'POST',
    expectedResult: 'Sinh số hóa đơn INV-2026-XXXX, bút toán GL: Nợ 131 / Có 511, Có 33311.',
    resultingState: 'INVOICED',
    businessReason: 'Tuân thủ Nghị định 123/TT78 về thời điểm xuất hóa đơn bán hàng.',
    riskLevel: 'HIGH',
    requiresConfirmation: true,
    coreEngine: 'AccountingEngine (Single Writer GL) & Central Tax Engine',
    databaseEffect: 'Chèn invoices, tạo journal_entries cân đối Nợ = Có',
    auditRequirement: 'Lưu mã hash hóa đơn điện tử cơ quan thuế cấp',
  },
  'SO_PAYMENT': {
    actionId: 'SO_PAYMENT',
    label: 'Thu Tiền / Ghi Nhận Thanh Toán (Collect Payment)',
    purpose: 'Ghi nhận dòng tiền thanh toán từ khách hàng qua Chuyển khoản VietQR hoặc Tiền mặt.',
    requiredState: ['INVOICED'],
    requiredPermission: ['TREASURER', 'ACCOUNTANT', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Có giao dịch báo có từ Ngân hàng (Bank Statement) hoặc Phiếu thu tiền mặt',
    ],
    targetModuleId: 'M32',
    targetRoute: '/payments',
    executionEndpoint: '/api/orders/:id/pay',
    executionMethod: 'POST',
    expectedResult: 'Tất toán công nợ AR khách hàng, ghi sổ cái: Nợ 112 / Có 131.',
    resultingState: 'PAID',
    businessReason: 'Hoàn tất chu trình dòng tiền Order-to-Cash của doanh nghiệp.',
    riskLevel: 'MEDIUM',
    requiresConfirmation: true,
    coreEngine: 'AccountingEngine & TreasuryService',
    databaseEffect: 'Cập nhật status hóa đơn PAID, giảm dư nợ khách hàng trong customer_balances',
    auditRequirement: 'Lưu mã tham chiếu ngân hàng (Bank Reference Code)',
  },

  // --- POS RETAIL & CASHIER CONTRACTS (M16) ---
  'POS_OPEN_SHIFT': {
    actionId: 'POS_OPEN_SHIFT',
    label: 'Mở Ca Thu Ngân POS',
    purpose: 'Bàn giao quỹ tiền mặt đầu ca và khởi động quầy bán lẻ M16.',
    requiredState: ['CLOSED'],
    requiredPermission: ['CASHIER', 'STORE_MGR', 'SUPER_ADMIN', '*'],
    preconditions: ['Kiểm đếm tiền mặt tồn quỹ đầu ca (Opening Float)'],
    targetModuleId: 'M16',
    targetRoute: '/pos',
    executionEndpoint: '/api/pos/shift/open',
    executionMethod: 'POST',
    expectedResult: 'Mở ca thu ngân thành công, ghi nhận số dư đầu ca vào két tiền.',
    resultingState: 'OPEN',
    businessReason: 'Kiểm soát dòng tiền mặt bán lẻ theo từng phiên làm việc của nhân viên thu ngân.',
    riskLevel: 'LOW',
    requiresConfirmation: false,
    coreEngine: 'POSSessionEngine',
    databaseEffect: 'Tạo bản ghi pos_shifts với opening_float',
    auditRequirement: 'Lưu mã nhân viên thu ngân mở ca',
  },
  'POS_CHECKOUT': {
    actionId: 'POS_CHECKOUT',
    label: 'Thanh Toán & In Bill POS',
    purpose: 'Quét mã vạch, tính tiền, nhận thanh toán VietQR/Tiền mặt và trừ kho tức thì.',
    requiredState: ['OPEN'],
    requiredPermission: ['CASHIER', 'STORE_MGR', 'SUPER_ADMIN', '*'],
    preconditions: ['Giỏ hàng có ít nhất 1 sản phẩm', 'Khách hàng thanh toán đủ số tiền'],
    targetModuleId: 'M16',
    targetRoute: '/pos',
    executionEndpoint: '/api/pos/checkout',
    executionMethod: 'POST',
    expectedResult: 'In hóa đơn bán lẻ, InventoryService trừ kho ngay lập tức, ghi doanh thu quầy.',
    resultingState: 'COMPLETED',
    businessReason: 'Giao dịch nhanh chóng, không qua quy trình khoanh giữ rườm rà nhưng vẫn đảm bảo sổ cái kho.',
    riskLevel: 'LOW',
    requiresConfirmation: false,
    coreEngine: 'POSService & InventoryService (Single Writer)',
    databaseEffect: 'Tạo sales_orders loại RETAIL, trừ stock_balances ngay lập tức',
    auditRequirement: 'Lưu log giao dịch POS và mã QR thanh toán',
  },

  // --- PURCHASE ORDER (P2P) CONTRACTS ---
  'PO_SUBMIT': {
    actionId: 'PO_SUBMIT',
    label: 'Gửi Duyệt Đơn Mua Hàng',
    purpose: 'Chuyển đơn mua từ nháp sang chờ xét duyệt ngân sách thu mua.',
    requiredState: ['DRAFT'],
    requiredPermission: ['PURCHASE_OFFICER', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Đã chọn Nhà cung cấp hợp lệ từ M09 Suppliers SRM',
      'Đã nhập danh mục hàng hóa, số lượng và đơn giá hợp đồng',
    ],
    targetModuleId: 'M08',
    targetRoute: '/purchase',
    executionEndpoint: '/api/po/submit',
    executionMethod: 'POST',
    expectedResult: 'PO chuyển sang trạng thái SUBMITTED, thông báo tới cấp quản lý.',
    resultingState: 'SUBMITTED',
    businessReason: 'Kiểm soát hạn mức mua sắm và ngăn chặn mua hàng ngoài kế hoạch.',
    riskLevel: 'LOW',
    requiresConfirmation: false,
    coreEngine: 'OrchestrationEngine',
    databaseEffect: 'Cập nhật status = SUBMITTED trong purchase_orders',
    auditRequirement: 'Ghi nhật ký Audit SHA-256',
  },
  'PO_APPROVE': {
    actionId: 'PO_APPROVE',
    label: 'Phê Duyệt Đơn Mua Hàng',
    purpose: 'Xác nhận ngân sách và cho phép gửi đơn đặt hàng chính thức tới Nhà cung cấp.',
    requiredState: ['SUBMITTED'],
    requiredPermission: ['PROCUREMENT_MGR', 'CFO', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Ngân sách phòng ban mua hàng còn đủ hạn mức',
      'Nhà cung cấp không nằm trong danh sách đen/nợ xấu',
    ],
    targetModuleId: 'M08',
    targetRoute: '/purchase',
    executionEndpoint: '/api/po/approve',
    executionMethod: 'POST',
    expectedResult: 'PO có trạng thái APPROVED. Tồn kho vật lý M17 KHÔNG ĐỔI (PO không tăng kho).',
    resultingState: 'APPROVED',
    businessReason: 'Quy tắc bất biến ERP: PO chỉ là cam kết thương mại, chỉ GRN mới tăng tồn.',
    riskLevel: 'MEDIUM',
    requiresConfirmation: true,
    coreEngine: 'OrchestrationEngine & AuthorityManager',
    databaseEffect: 'Cập nhật status = APPROVED trong purchase_orders',
    auditRequirement: 'Lưu chữ ký phê duyệt cấp quản lý',
  },
  'PO_RECEIVE_GRN': {
    actionId: 'PO_RECEIVE_GRN',
    label: 'Tiếp Nhận & Nhập Kho Vật Lý (Goods Receipt Note)',
    purpose: 'Kiểm đếm hàng thực tế tại cửa kho và cập nhật tăng tồn kho vật lý qua InventoryService.',
    requiredState: ['APPROVED'],
    requiredPermission: ['WAREHOUSE_CHIEF', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Đơn hàng PO đã được phê duyệt chính thức (APPROVED)',
      'Hàng hóa thực tế đã có mặt tại kho và vượt qua kiểm tra ngoại quan',
      'Đã quét mã Lô/Hạn sử dụng (M22) hoặc Serial IMEI (M23) nếu là hàng kiểm soát',
    ],
    targetModuleId: 'M17',
    targetRoute: '/inventory',
    executionEndpoint: '/api/inventory/receive',
    executionMethod: 'POST',
    expectedResult: 'InventoryService.postTransaction(RECEIPT): Tăng Physical Stock, tạo cost_layer giá nhập.',
    resultingState: 'RECEIVED',
    businessReason: 'Chỉ có thao tác này mới làm tăng tồn kho thực tế, bảo đảm nguyên tắc Single Writer.',
    riskLevel: 'HIGH',
    requiresConfirmation: true,
    warnings: ['Kiểm tra kỹ số lượng thực đếm để tránh chênh lệch với phiếu giao hàng của NCC.'],
    coreEngine: 'InventoryService (Single Writer) & CostingEngine',
    databaseEffect: 'Chèn stock_ledger (RECEIPT, +Qty), cập nhật stock_balances, tạo cost_layers',
    auditRequirement: 'Bắt buộc lưu mã phiếu nhập kho GRN và nhân viên nhận hàng',
  },
  'PO_3WAY_MATCH': {
    actionId: 'PO_3WAY_MATCH',
    label: 'Đối Soát 3 Bên (3-Way Matching: PO - GRN - Hóa Đơn)',
    purpose: 'Đối chiếu khớp ba chiều giữa Đơn mua hàng, Phiếu nhập kho và Hóa đơn GTGT của NCC.',
    requiredState: ['RECEIVED'],
    requiredPermission: ['ACCOUNTANT', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Số lượng trên GRN khớp số lượng PO (dung sai <= 2%)',
      'Đơn giá trên Hóa đơn NCC khớp đơn giá PO đã duyệt',
      'Hóa đơn NCC hợp lệ trên cổng hóa đơn điện tử Tổng cục Thuế',
    ],
    targetModuleId: 'M31',
    targetRoute: '/invoices',
    executionEndpoint: '/api/invoices/3way-match',
    executionMethod: 'POST',
    expectedResult: 'Xác nhận đối soát thành công, cho phép sinh hóa đơn phải trả AP.',
    resultingState: 'MATCHED',
    businessReason: 'Chốt chặn tài chính cốt lõi ngăn ngừa gian lận hoặc thất thoát dòng tiền thu mua.',
    riskLevel: 'MEDIUM',
    requiresConfirmation: false,
    coreEngine: 'AccountingEngine & TaxEngine',
    databaseEffect: 'Đánh dấu matching_status = MATCHED trong purchase_orders',
    auditRequirement: 'Lưu bảng đối soát 3 chiều vào hồ sơ chứng từ',
  },
  'PO_CREATE_AP_INVOICE': {
    actionId: 'PO_CREATE_AP_INVOICE',
    label: 'Ghi Nhận Hóa Đơn Phải Trả AP',
    purpose: 'Ghi nhận công nợ phải trả Nhà cung cấp vào sổ cái kế toán.',
    requiredState: ['MATCHED', 'RECEIVED'],
    requiredPermission: ['ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Đã hoàn tất đối soát 3 bên hợp lệ',
    ],
    targetModuleId: 'M31',
    targetRoute: '/invoices',
    executionEndpoint: '/api/invoices/ap/create',
    executionMethod: 'POST',
    expectedResult: 'Sinh hóa đơn AP, hạch toán Nợ 156 (hoặc 152), Nợ 1331 / Có 331.',
    resultingState: 'INVOICED',
    businessReason: 'Ghi nhận chính xác nghĩa vụ công nợ và thuế GTGT đầu vào được khấu trừ.',
    riskLevel: 'HIGH',
    requiresConfirmation: true,
    coreEngine: 'AccountingEngine (Single Writer GL)',
    databaseEffect: 'Chèn invoices loại AP_INVOICE, ghi journal_entries Nợ = Có',
    auditRequirement: 'Bắt buộc lưu mã số thuế và số hóa đơn NCC',
  },
  'PO_PAY_AP': {
    actionId: 'PO_PAY_AP',
    label: 'Thanh Toán Tiền Cho Nhà Cung Cấp',
    purpose: 'Thực hiện chi tiền thanh toán hóa đơn mua hàng qua Ủy nhiệm chi ngân hàng.',
    requiredState: ['INVOICED'],
    requiredPermission: ['CFO', 'CHIEF_ACCOUNTANT', 'TREASURER', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Đã duyệt Phiếu chi / Lệnh chi tiền tại M32 Payments & Treasury',
      'Tài khoản thanh toán còn đủ số dư',
    ],
    targetModuleId: 'M32',
    targetRoute: '/payments',
    executionEndpoint: '/api/payments/pay-vendor',
    executionMethod: 'POST',
    expectedResult: 'Tất toán nợ AP: Nợ 331 / Có 112, chuyển trạng thái PO sang COMPLETED.',
    resultingState: 'COMPLETED',
    businessReason: 'Hoàn tất toàn bộ chu trình Procure-to-Pay khép kín.',
    riskLevel: 'HIGH',
    requiresConfirmation: true,
    coreEngine: 'AccountingEngine & TreasuryService',
    databaseEffect: 'Giảm dư nợ TK 331, trừ số dư tài khoản ngân hàng TK 112',
    auditRequirement: 'Lưu mã tham chiếu giao dịch ngân hàng điện tử',
  },

  // --- INVENTORY & STOCK ADJUSTMENT CONTRACTS ---
  'STOCK_BLIND_COUNT': {
    actionId: 'STOCK_BLIND_COUNT',
    label: 'Tiến Hành Kiểm Kê Đếm Mù (Blind Count)',
    purpose: 'Đếm thực tế số lượng hàng trên kệ mà không nhìn thấy số tồn sổ sách.',
    requiredState: ['PLANNING', 'DRAFT'],
    requiredPermission: ['WAREHOUSE_OPERATOR', 'WAREHOUSE_CHIEF', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Khu vực kiểm kê đã được tạm khóa giao dịch xuất nhập',
      'Đã phân công tổ đếm chéo độc lập',
    ],
    targetModuleId: 'M19',
    targetRoute: '/stocktake',
    executionEndpoint: '/api/stocktake/start-blind-count',
    executionMethod: 'POST',
    expectedResult: 'Khởi tạo bảng đếm mù, ẩn cột tồn hệ thống, chuyển trạng thái COUNTING.',
    resultingState: 'COUNTING',
    businessReason: 'Bảo đảm tính khách quan tuyệt đối, loại trừ tâm lý "nhìn sổ đếm đại".',
    riskLevel: 'LOW',
    requiresConfirmation: false,
    coreEngine: 'InventoryService',
    databaseEffect: 'Cập nhật status = COUNTING trong stocktakes',
    auditRequirement: 'Ghi nhận thời gian niêm phong kho kiểm kê',
  },
  'STOCK_SUBMIT_VARIANCE': {
    actionId: 'STOCK_SUBMIT_VARIANCE',
    label: 'Chốt Kết Quả & Tính Lệch Kho (Calculate Variance)',
    purpose: 'So khớp số thực đếm với sổ sách và phát sinh báo cáo chênh lệch thừa/thiếu.',
    requiredState: ['COUNTING'],
    requiredPermission: ['WAREHOUSE_CHIEF', 'ACCOUNTANT', 'SUPER_ADMIN', '*'],
    preconditions: [
      '100% SKU trong phạm vi kiểm kê đã được nhập số lượng đếm',
    ],
    targetModuleId: 'M19',
    targetRoute: '/stocktake',
    executionEndpoint: '/api/stocktake/calculate-variance',
    executionMethod: 'POST',
    expectedResult: 'Hệ thống tính Variance = Actual - System. Nếu có lệch, kích hoạt tạo phiếu M20.',
    resultingState: 'VARIANCE_DETECTED',
    businessReason: 'Minh bạch hóa số liệu chênh lệch trước khi cấp thẩm quyền phê duyệt bù trừ.',
    riskLevel: 'MEDIUM',
    requiresConfirmation: false,
    coreEngine: 'InventoryService',
    databaseEffect: 'Cập nhật varianceQty trong stocktake_items',
    auditRequirement: 'Lưu bảng đối chiếu chi tiết kiểm đếm',
  },
  'STOCK_ADJUST_APPROVE': {
    actionId: 'STOCK_ADJUST_APPROVE',
    label: 'Phê Duyệt Phiếu Điều Chỉnh Kho (M20)',
    purpose: 'Cấp thẩm quyền xem xét nguyên nhân chênh lệch và phê duyệt điều chỉnh số dư kho.',
    requiredState: ['PENDING_APPROVAL', 'VARIANCE_DETECTED'],
    requiredPermission: ['CFO', 'PLANT_MGR', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Đã có biên bản giải trình nguyên nhân chênh lệch (Hao hụt tự nhiên / Mất mát / Nhập thừa)',
      'Hạn mức giá trị chênh lệch nằm trong thẩm quyền người duyệt',
    ],
    targetModuleId: 'M20',
    targetRoute: '/stock-adjustment',
    executionEndpoint: '/api/inventory/adjust',
    executionMethod: 'POST',
    expectedResult: 'Phiếu điều chỉnh được ký duyệt, sẵn sàng ghi sổ cái kho.',
    resultingState: 'APPROVED',
    businessReason: 'Ngăn chặn nhân viên tự ý điều chỉnh xóa dấu vết thất thoát hàng hóa.',
    riskLevel: 'HIGH',
    requiresConfirmation: true,
    warnings: ['Hành động này sẽ thay đổi giá trị tài sản kho trên báo cáo tài chính.'],
    coreEngine: 'StockAdjustmentService & AuthorityManager',
    databaseEffect: 'Cập nhật status = APPROVED trong stock_adjustments',
    auditRequirement: 'Bắt buộc ký số và ghi vết vào Audit Ledger SHA-256',
  },
  'STOCK_ADJUST_POST': {
    actionId: 'STOCK_ADJUST_POST',
    label: 'Ghi Sổ Cái Kho & Cân Đối Kế Toán',
    purpose: 'Thực thi giao dịch điều chỉnh qua Single Writer InventoryService và định khoản kế toán.',
    requiredState: ['APPROVED'],
    requiredPermission: ['CHIEF_ACCOUNTANT', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Phiếu điều chỉnh đã được phê duyệt đầy đủ cấp thẩm quyền',
    ],
    targetModuleId: 'M20',
    targetRoute: '/stock-adjustment',
    executionEndpoint: '/api/inventory/adjust/post',
    executionMethod: 'POST',
    expectedResult: 'Tồn Physical được cân đối lại đúng thực tế; Sổ cái GL hạch toán Nợ 1381/632 hoặc Có 711/3381.',
    resultingState: 'POSTED',
    businessReason: 'Đưa số liệu sổ sách trở về đúng với thực tế hiện hữu mà không phá vỡ tính toàn vẹn.',
    riskLevel: 'HIGH',
    requiresConfirmation: true,
    warnings: ['Không thể hoàn tác sau khi đã ghi sổ cái kho.'],
    coreEngine: 'InventoryService (Single Writer) & AccountingEngine',
    databaseEffect: 'Chèn stock_ledger (ADJUSTMENT_IN/OUT), cập nhật stock_balances, ghi journal_entries',
    auditRequirement: 'Lưu mã hash giao dịch bất biến SHA-256',
  },

  // --- RMA RETURNS CONTRACTS ---
  'RMA_INSPECT': {
    actionId: 'RMA_INSPECT',
    label: 'Kiểm Định Chất Lượng Hàng Trả (QC Inspection)',
    purpose: 'Kỹ thuật viên QC kiểm tra tình trạng hàng khách trả lại xem còn nguyên vẹn hay hư hỏng.',
    requiredState: ['RECEIVED', 'REQUESTED'],
    requiredPermission: ['QC_INSPECTOR', 'SUPER_ADMIN', '*'],
    preconditions: [
      'Hàng hóa vật lý đã được tiếp nhận tại cổng RMA',
      'Có số đơn hàng SO gốc hoặc hóa đơn bảo hành',
    ],
    targetModuleId: 'M15',
    targetRoute: '/returns',
    executionEndpoint: '/api/rma/INSPECT',
    executionMethod: 'POST',
    expectedResult: 'QC kết luận phân loại: PASS (Tái nhập bán lại) hoặc FAIL (Hủy / Đổi mới NCC).',
    resultingState: 'INSPECTED',
    businessReason: 'Phòng ngừa việc nhập nhầm hàng hỏng vào kho bán lẻ làm ảnh hưởng khách hàng khác.',
    riskLevel: 'LOW',
    requiresConfirmation: false,
    coreEngine: 'QualityService & ProcessEngine',
    databaseEffect: 'Cập nhật inspectionResult trong rmas',
    auditRequirement: 'Lưu biên bản ảnh chụp kiểm định QC',
  },
  'RMA_EXECUTE_REFUND': {
    actionId: 'RMA_EXECUTE_REFUND',
    label: 'Nhập Kho & Hoàn Tiền / Cấn Trừ Công Nợ',
    purpose: 'Nhập lại hàng vào kho thích hợp và phát hành Credit Note hoàn trả tiền cho khách.',
    requiredState: ['INSPECTED', 'APPROVED'],
    requiredPermission: ['ACCOUNTANT', 'SUPER_ADMIN', '*'],
    preconditions: [
      'QC đã có kết luận kiểm tra hợp lệ',
      'Khách hàng đồng ý phương án giải quyết (Đổi hàng hoặc Hoàn tiền)',
    ],
    targetModuleId: 'M15',
    targetRoute: '/returns',
    executionEndpoint: '/api/rma/EXECUTE_RETURN_AND_REFUND',
    executionMethod: 'POST',
    expectedResult: 'InventoryService nhập kho hàng trả; Kế toán xuất Credit Note giảm trừ công nợ Nợ 521 / Có 131.',
    resultingState: 'REFUNDED',
    businessReason: 'Giải quyết quyền lợi khách hàng hợp pháp và điều chỉnh đúng doanh thu/thuế VAT.',
    riskLevel: 'MEDIUM',
    requiresConfirmation: true,
    coreEngine: 'InventoryService & AccountingEngine',
    databaseEffect: 'Ghi stock_ledger (RETURN), sinh credit_notes, ghi bút toán điều chỉnh giảm',
    auditRequirement: 'Lưu mã hóa đơn điều chỉnh giảm theo Thông tư 78',
  },
};

// =========================================================================
// 2. BUSINESS JOURNEYS (Business GPS Tracks)
// =========================================================================

export const BUSINESS_JOURNEYS: BusinessJourneyTracker[] = [
  {
    id: 'JOURNEY_O2C',
    name: 'Order-to-Cash (O2C) — Chu Trình Bán Hàng & Thu Tiền',
    code: 'O2C_CORE',
    category: 'O2C',
    description: 'Quy trình chuẩn từ khi khách đặt hàng đến khi xuất kho, giao hàng, phát hành hóa đơn và thu tiền.',
    totalSteps: 7,
    currentStepIndex: 1,
    currentActionSummary: 'Lập & Gửi Duyệt Đơn Hàng SO',
    remainingStepsCount: 6,
    nextStepRequirement: 'Khách hàng duyệt báo giá và chốt danh sách SKU cần mua.',
    steps: [
      { stepIndex: 1, name: 'Tạo Đơn Hàng', code: 'CREATE_SO', moduleId: 'M13', moduleName: 'Sales Orders', status: 'CURRENT', preconditions: ['Khách hàng M07 hợp lệ', 'Giá bán M41'], output: 'SO ở trạng thái DRAFT', allowedRoles: ['SALES', 'ADMIN'] },
      { stepIndex: 2, name: 'Duyệt Đơn Hàng', code: 'APPROVE_SO', moduleId: 'M13', moduleName: 'Sales Orders', status: 'UPCOMING', preconditions: ['Kiểm tra hạn mức nợ Credit Limit'], output: 'SO ở trạng thái APPROVED', allowedRoles: ['SALES_DIR', 'ADMIN'] },
      { stepIndex: 3, name: 'Khoanh Giữ Tồn Kho', code: 'RESERVE_STOCK', moduleId: 'M17', moduleName: 'Inventory Core', status: 'UPCOMING', preconditions: ['Tồn khả dụng Available >= Số lượng đặt'], output: 'Allocated Stock tăng, Available giảm', allowedRoles: ['WAREHOUSE_MGR', 'ADMIN'] },
      { stepIndex: 4, name: 'Soạn Hàng (Fulfillment)', code: 'FULFILLMENT', moduleId: 'M17', moduleName: 'Warehouse Ops', status: 'UPCOMING', preconditions: ['In Picking List'], output: 'Hàng đóng gói sẵn sàng ở Dock', allowedRoles: ['WAREHOUSE_OPERATOR', 'ADMIN'] },
      { stepIndex: 5, name: 'Giao Vận & Xuất Kho', code: 'DELIVERY_SHIP', moduleId: 'M36', moduleName: 'Logistics TMS', status: 'UPCOMING', preconditions: ['Gán biển số xe M36', 'Biên bản POD'], output: 'Trừ tồn Physical Stock, tính COGS', allowedRoles: ['LOGISTICS_LEAD', 'ADMIN'] },
      { stepIndex: 6, name: 'Phát Hành Hóa Đơn', code: 'AR_INVOICE', moduleId: 'M31', moduleName: 'Invoices AR/AP', status: 'UPCOMING', preconditions: ['POD có chữ ký khách hàng'], output: 'Hóa đơn GTGT ký số CQT', allowedRoles: ['ACCOUNTANT', 'ADMIN'] },
      { stepIndex: 7, name: 'Thu Tiền Tất Toán', code: 'PAYMENT_COLLECT', moduleId: 'M32', moduleName: 'Payments & Treasury', status: 'UPCOMING', preconditions: ['Khách thanh toán VietQR/UNC'], output: 'Công nợ = 0, Tiền mặt/Bank tăng', allowedRoles: ['TREASURER', 'ADMIN'] },
    ],
  },
  {
    id: 'JOURNEY_P2P',
    name: 'Procure-to-Pay (P2P) — Chu Trình Mua Sắm Đến Thanh Toán',
    code: 'P2P_CORE',
    category: 'P2P',
    description: 'Quy trình mua hàng từ nhà cung cấp: Tạo PO -> Duyệt PO -> Nhận hàng GRN -> Đối soát 3 bên -> Chi tiền.',
    totalSteps: 6,
    currentStepIndex: 1,
    currentActionSummary: 'Lập Đơn Mua Hàng PO',
    remainingStepsCount: 5,
    nextStepRequirement: 'Nhu cầu vật tư phát sinh từ MRP hoặc tồn kho dưới mức Min-Stock.',
    steps: [
      { stepIndex: 1, name: 'Lập Đơn Mua PO', code: 'CREATE_PO', moduleId: 'M08', moduleName: 'Purchase Orders', status: 'CURRENT', preconditions: ['Chọn Nhà cung cấp M09', 'SKU & đơn giá'], output: 'PO ở trạng thái DRAFT', allowedRoles: ['PURCHASE_OFFICER', 'ADMIN'] },
      { stepIndex: 2, name: 'Duyệt Đơn Mua', code: 'APPROVE_PO', moduleId: 'M08', moduleName: 'Purchase Orders', status: 'UPCOMING', preconditions: ['Kiểm tra hạn mức ngân sách'], output: 'PO ở trạng thái APPROVED (Kho chưa đổi)', allowedRoles: ['PROCUREMENT_MGR', 'CFO', 'ADMIN'] },
      { stepIndex: 3, name: 'Nhập Kho Hàng GRN', code: 'RECEIVE_GRN', moduleId: 'M17', moduleName: 'Inventory Core', status: 'UPCOMING', preconditions: ['Hàng đến cửa kho', 'Kiểm đếm thực tế'], output: 'Tồn Physical Stock tăng qua Single Writer', allowedRoles: ['WAREHOUSE_CHIEF', 'ADMIN'] },
      { stepIndex: 4, name: 'Đối Soát 3 Bên', code: 'THREE_WAY_MATCH', moduleId: 'M31', moduleName: 'Invoices AR/AP', status: 'UPCOMING', preconditions: ['PO == GRN == Hóa đơn NCC (sai số <= 2%)'], output: 'Biên bản đối soát khớp 100%', allowedRoles: ['ACCOUNTANT', 'ADMIN'] },
      { stepIndex: 5, name: 'Ghi Nhận Hóa Đơn AP', code: 'AP_INVOICE', moduleId: 'M31', moduleName: 'Invoices AR/AP', status: 'UPCOMING', preconditions: ['3-Way Matching thành công'], output: 'Ghi nhận nợ NCC (TK 331)', allowedRoles: ['ACCOUNTANT', 'ADMIN'] },
      { stepIndex: 6, name: 'Thanh Toán Tiền NCC', code: 'AP_PAYMENT', moduleId: 'M32', moduleName: 'Payments & Treasury', status: 'UPCOMING', preconditions: ['Duyệt ủy nhiệm chi ngân hàng'], output: 'Tất toán hóa đơn, đóng chu trình PO', allowedRoles: ['CFO', 'TREASURER', 'ADMIN'] },
    ],
  },
  {
    id: 'JOURNEY_INVENTORY',
    name: 'Inventory Core & Stocktake — Kiểm Kê & Bù Trừ Tồn Kho',
    code: 'INV_CORE',
    category: 'INVENTORY',
    description: 'Quy trình kiểm đếm mù, xác định chênh lệch thừa/thiếu và điều chỉnh tồn kho bảo vệ tính toàn vẹn.',
    totalSteps: 4,
    currentStepIndex: 1,
    currentActionSummary: 'Khởi Tạo Đợt Kiểm Kê Đếm Mù',
    remainingStepsCount: 3,
    nextStepRequirement: 'Định kỳ cuối tháng hoặc khi phát hiện nghi vấn lệch tồn.',
    steps: [
      { stepIndex: 1, name: 'Tạo Đợt Đếm Mù', code: 'BLIND_STOCKTAKE', moduleId: 'M19', moduleName: 'Stocktake M19', status: 'CURRENT', preconditions: ['Niêm phong khu vực kho'], output: 'Phiếu đếm che giấu cột tồn sổ sách', allowedRoles: ['WAREHOUSE_CHIEF', 'ADMIN'] },
      { stepIndex: 2, name: 'Nhập Số Thực Đếm', code: 'ENTER_ACTUAL_COUNT', moduleId: 'M19', moduleName: 'Stocktake M19', status: 'UPCOMING', preconditions: ['Nhân viên kho hoàn tất kiểm đếm'], output: 'Tự động tính Variance = Actual - System', allowedRoles: ['WAREHOUSE_OPERATOR', 'ADMIN'] },
      { stepIndex: 3, name: 'Lập & Duyệt Phiếu M20', code: 'APPROVE_ADJUSTMENT', moduleId: 'M20', moduleName: 'Stock Adjustment', status: 'UPCOMING', preconditions: ['Giải trình nguyên nhân chênh lệch'], output: 'Phiếu điều chỉnh có chữ ký CFO', allowedRoles: ['CFO', 'PLANT_MGR', 'ADMIN'] },
      { stepIndex: 4, name: 'Ghi Sổ Cái Kho & GL', code: 'POST_STOCK_LEDGER', moduleId: 'M20', moduleName: 'Stock Adjustment', status: 'UPCOMING', preconditions: ['Chữ ký số hợp lệ'], output: 'InventoryService cập nhật tồn đúng thực tế', allowedRoles: ['CHIEF_ACCOUNTANT', 'ADMIN'] },
    ],
  },
  {
    id: 'JOURNEY_RETURNS',
    name: 'Customer Returns & RMA — Đổi Trả & Thu Hồi Sản Phẩm',
    code: 'RMA_CORE',
    category: 'RETURNS',
    description: 'Tiếp nhận hàng khách trả, kiểm định chất lượng QC và thực hiện tái nhập kho hoặc hoàn tiền.',
    totalSteps: 4,
    currentStepIndex: 1,
    currentActionSummary: 'Tiếp Nhận Yêu Cầu RMA',
    remainingStepsCount: 3,
    nextStepRequirement: 'Khách hàng gửi yêu cầu trả hàng kèm đơn SO gốc.',
    steps: [
      { stepIndex: 1, name: 'Tạo Yêu Cầu RMA', code: 'CREATE_RMA', moduleId: 'M15', moduleName: 'Returns & RMA', status: 'CURRENT', preconditions: ['Mã đơn hàng SO gốc hợp lệ'], output: 'Phiếu RMA-2026-XXXX trạng thái DRAFT', allowedRoles: ['OPERATOR', 'ADMIN'] },
      { stepIndex: 2, name: 'Kiểm Định QC', code: 'QC_INSPECT', moduleId: 'M15', moduleName: 'Returns & RMA', status: 'UPCOMING', preconditions: ['Nhận hàng vật lý tại cửa kho'], output: 'Biên bản kiểm tra QC (Đạt/Hỏng)', allowedRoles: ['QC_INSPECTOR', 'ADMIN'] },
      { stepIndex: 3, name: 'Duyệt Phương Án', code: 'APPROVE_DISPOSITION', moduleId: 'M15', moduleName: 'Returns & RMA', status: 'UPCOMING', preconditions: ['Kết luận QC hợp lệ'], output: 'Chỉ định: Nhập bán lại hoặc Hủy phế', allowedRoles: ['WAREHOUSE_MGR', 'ADMIN'] },
      { stepIndex: 4, name: 'Nhập Kho & Hoàn Tiền', code: 'REFUND_CREDIT_NOTE', moduleId: 'M31', moduleName: 'Invoices & Credit Notes', status: 'UPCOMING', preconditions: ['Duyệt phương án hoàn tất'], output: 'Credit Note giảm nợ, Tồn kho cập nhật', allowedRoles: ['ACCOUNTANT', 'ADMIN'] },
    ],
  },
  {
    id: 'JOURNEY_MANUFACTURING',
    name: 'Manufacturing & MES — Lệnh Sản Xuất & Định Mức BOM',
    code: 'MFG_CORE',
    category: 'MANUFACTURING',
    description: 'Từ Lệnh sản xuất MO -> Xuất vật tư theo BOM -> Lắp ráp -> Nghiệm thu QC -> Nhập kho thành phẩm.',
    totalSteps: 5,
    currentStepIndex: 1,
    currentActionSummary: 'Lập Lệnh Sản Xuất MO',
    remainingStepsCount: 4,
    nextStepRequirement: 'Kế hoạch sản xuất tuần hoặc đơn đặt hàng B2B có yêu cầu đóng gói riêng.',
    steps: [
      { stepIndex: 1, name: 'Lập Lệnh Sản Xuất MO', code: 'CREATE_MO', moduleId: 'M25', moduleName: 'Manufacturing & BOM', status: 'CURRENT', preconditions: ['Định mức BOM Active', 'Mã thành phẩm'], output: 'Lệnh MO trạng thái RELEASED', allowedRoles: ['PLANT_MGR', 'ADMIN'] },
      { stepIndex: 2, name: 'Xuất Vật Tư Theo BOM', code: 'ISSUE_MATERIALS', moduleId: 'M17', moduleName: 'Inventory Core', status: 'UPCOMING', preconditions: ['Tồn nguyên vật liệu sẵn sàng'], output: 'InventoryService trừ NVL, ghi Nợ 154', allowedRoles: ['WAREHOUSE_OPERATOR', 'ADMIN'] },
      { stepIndex: 3, name: 'Gia Công & Lắp Ráp', code: 'PRODUCTION_RUN', moduleId: 'M25', moduleName: 'Manufacturing & BOM', status: 'UPCOMING', preconditions: ['NVL đã có tại dây chuyền'], output: 'Ghi nhận giờ máy & nhân công', allowedRoles: ['LINE_SUPERVISOR', 'ADMIN'] },
      { stepIndex: 4, name: 'Kiểm Tra Chất Lượng OQC', code: 'OQC_INSPECTION', moduleId: 'M39', moduleName: 'Quality Control', status: 'UPCOMING', preconditions: ['Lô sản phẩm hoàn thành gia công'], output: 'Tem chứng nhận QC Pass', allowedRoles: ['QC_INSPECTOR', 'ADMIN'] },
      { stepIndex: 5, name: 'Nhập Kho Thành Phẩm', code: 'RECEIPT_FINISHED_GOODS', moduleId: 'M17', moduleName: 'Inventory Core', status: 'UPCOMING', preconditions: ['Phiếu nghiệm thu QC đạt chuẩn'], output: 'Tăng tồn thành phẩm, tính giá thành', allowedRoles: ['WAREHOUSE_CHIEF', 'ADMIN'] },
    ],
  },
];

// =========================================================================
// 3. BUSINESS INTENT RECOGNITION (Natural Language -> Business Intent)
// =========================================================================

export class BusinessGuidanceService {
  /**
   * Translates natural language query into concrete BusinessIntent.
   * Enforces disambiguation whenever multiple legitimate paths exist.
   */
  static parseIntent(query: string, context?: BusinessGuidanceContext): BusinessIntentResult {
    const q = (query || '').toLowerCase().trim();

    // 1. NHẬP HÀNG (Purchase vs Transfer vs Manufacturing vs Adjustment)
    if (q.includes('nhập hàng') || q.includes('nhận hàng') || q.includes('nhập kho') || q.includes('mua hàng') || q.includes('nhập từ supplier') || q.includes('nhập từ ncc')) {
      // Check if specifically mentioning supplier / vendor / purchasing
      if (q.includes('supplier') || q.includes('nhà cung cấp') || q.includes('ncc') || q.includes('mua') || q.includes('po')) {
        return {
          intentId: 'INTENT_P2P_PO_RECEIVING',
          rawQuery: query,
          recognizedIntent: 'Nhận hàng mua sắm từ Nhà Cung Cấp (Procure-to-Pay)',
          category: 'P2P',
          suggestedProcess: 'Đơn Mua Hàng M08 -> Tiếp Nhận GRN M17 -> Đối Soát 3 Bên M31',
          targetModuleId: 'M08',
          targetModuleName: 'M08 Purchase Orders',
          targetRoute: '/purchase',
          confidence: 0.98,
          requiresDisambiguation: false,
          businessReason: 'Nhận hàng từ đối tác bên ngoài bắt buộc phải có Đơn mua hàng PO để đối soát giá và nghĩa vụ thanh toán.',
          choices: [],
        };
      }

      // Check if specifically mentioning internal transfer
      if (q.includes('kho khác') || q.includes('chi nhánh') || q.includes('chuyển') || q.includes('điều chuyển')) {
        return {
          intentId: 'INTENT_INTERNAL_TRANSFER_IN',
          rawQuery: query,
          recognizedIntent: 'Nhận hàng chuyển từ chi nhánh / kho nội bộ (Internal Transfer)',
          category: 'INVENTORY',
          suggestedProcess: 'Chuyển Kho M21 -> Bàn Giao In-transit -> Xác Nhận Nhập Kho Đến',
          targetModuleId: 'M21',
          targetModuleName: 'M21 Internal Transfers',
          targetRoute: '/transfer',
          confidence: 0.95,
          requiresDisambiguation: false,
          businessReason: 'Hàng chuyển nội bộ không phát sinh công nợ bên ngoài, chỉ chuyển đổi vị trí và ghi nhận In-transit.',
          choices: [],
        };
      }

      // If ambiguous "nhập hàng": REQUIRE DISAMBIGUATION
      return {
        intentId: 'INTENT_RECEIVE_AMBIGUOUS',
        rawQuery: query,
        recognizedIntent: 'Nhập hàng hóa vào kho',
        category: 'P2P',
        suggestedProcess: 'Cần xác định nguồn gốc nhập hàng để đi đúng quy trình kế toán',
        targetModuleId: 'M08',
        targetModuleName: 'M08 Purchase Orders',
        targetRoute: '/purchase',
        confidence: 0.7,
        requiresDisambiguation: true,
        disambiguationPrompt: 'Bạn muốn nhập hàng hóa từ nguồn gốc nào dưới đây?',
        businessReason: 'Hệ thống ERP phân biệt rõ nguồn nhập để tránh sai lệch giá vốn và dòng tiền thuế GTGT.',
        choices: [
          {
            id: 'CHOICE_PO',
            title: '1. Nhập hàng mua từ Nhà Cung Cấp (PO -> GRN)',
            description: 'Nhập hàng có hóa đơn mua bán, đối soát công nợ phải trả NCC.',
            targetModuleId: 'M08',
            targetModuleName: 'M08 Purchase Orders & Nhận Hàng',
            targetRoute: '/purchase',
            suggestedAction: 'Tạo hoặc Chọn PO để nhận hàng GRN',
            businessReason: 'Có hợp đồng thương mại và nghĩa vụ thuế GTGT đầu vào.',
            riskLevel: 'LOW',
          },
          {
            id: 'CHOICE_TRANSFER',
            title: '2. Nhận hàng chuyển từ Kho/Chi nhánh khác (M21)',
            description: 'Hàng do chi nhánh khác điều chuyển đến kho của bạn.',
            targetModuleId: 'M21',
            targetModuleName: 'M21 Internal Transfers',
            targetRoute: '/transfer',
            suggestedAction: 'Xác nhận phiếu chuyển kho In-transit',
            businessReason: 'Hàng nội bộ công ty, không làm thay đổi tổng tài sản.',
            riskLevel: 'LOW',
          },
          {
            id: 'CHOICE_MFG',
            title: '3. Nhập kho Thành phẩm Sản xuất (M25)',
            description: 'Nghiệm thu sản phẩm hoàn thành từ xưởng sản xuất theo Lệnh MO.',
            targetModuleId: 'M25',
            targetModuleName: 'M25 Manufacturing & MES',
            targetRoute: '/manufacturing',
            suggestedAction: 'Nghiệm thu Lệnh sản xuất hoàn thành',
            businessReason: 'Kết chuyển chi phí TK 154 sang TK 155/156.',
            riskLevel: 'MEDIUM',
          },
          {
            id: 'CHOICE_ADJUSTMENT',
            title: '4. Điều chỉnh tăng tồn do thừa sau Kiểm kê (M20)',
            description: 'Xử lý chênh lệch thừa sau đợt kiểm kê thực tế.',
            targetModuleId: 'M20',
            targetModuleName: 'M20 Stock Adjustment',
            targetRoute: '/stock-adjustment',
            suggestedAction: 'Lập phiếu điều chỉnh kho có giải trình',
            businessReason: 'Chỉ dùng khi kiểm kê thực tế nhiều hơn sổ sách; cấm dùng để nhập hàng mua.',
            riskLevel: 'HIGH',
            warningMessage: 'Tuyệt đối cấm dùng phiếu điều chỉnh để nhập hàng mua vì sẽ vi phạm chế độ thuế và kế toán.',
          },
        ],
      };
    }

    // 2. BÁN HÀNG (B2B Sales Order vs Bán lẻ POS)
    if (q.includes('bán hàng') || q.includes('xuất bán') || q.includes('bán lẻ') || q.includes('pos') || q.includes('bán sỉ') || q.includes('thu ngân')) {
      if (q.includes('bán lẻ') || q.includes('pos') || q.includes('thu ngân') || q.includes('quầy')) {
        return {
          intentId: 'INTENT_POS_RETAIL',
          rawQuery: query,
          recognizedIntent: 'Bán lẻ tại quầy & Thu ngân POS',
          category: 'O2C',
          suggestedProcess: 'Quét Mã Vạch -> Thanh Toán Tiền Mặt/VietQR -> Trừ Kho Tức Thì',
          targetModuleId: 'M16',
          targetModuleName: 'M16 POS Retail & Cashier',
          targetRoute: '/pos',
          confidence: 0.98,
          requiresDisambiguation: false,
          businessReason: 'Giao dịch trao tay thu tiền ngay, không cần quy trình khoanh giữ giao vận phức tạp.',
          choices: [],
        };
      }

      if (q.includes('bán buôn') || q.includes('bán sỉ') || q.includes('hợp đồng') || q.includes('công nợ') || q.includes('đơn hàng') || q.includes('so')) {
        return {
          intentId: 'INTENT_B2B_SALES',
          rawQuery: query,
          recognizedIntent: 'Bán hàng B2B / Bán buôn theo Đơn hàng (Order-to-Cash)',
          category: 'O2C',
          suggestedProcess: 'Lập Đơn SO M13 -> Khoanh Giữ Tồn M17 -> Giao Vận M36 -> Hóa Đơn M31',
          targetModuleId: 'M13',
          targetModuleName: 'M13 Sales Orders',
          targetRoute: '/sales',
          confidence: 0.98,
          requiresDisambiguation: false,
          businessReason: 'Có thỏa thuận hạn mức công nợ, quản lý hàng giữ chỗ và xuất hóa đơn điện tử GTGT.',
          choices: [],
        };
      }

      // Ambiguous "bán hàng": DISAMBIGUATE
      return {
        intentId: 'INTENT_SALES_AMBIGUOUS',
        rawQuery: query,
        recognizedIntent: 'Bán hàng hóa cho khách hàng',
        category: 'O2C',
        suggestedProcess: 'Chọn kênh bán hàng phù hợp',
        targetModuleId: 'M13',
        targetModuleName: 'M13 Sales Orders',
        targetRoute: '/sales',
        confidence: 0.75,
        requiresDisambiguation: true,
        disambiguationPrompt: 'Bạn đang thực hiện bán hàng theo kênh nào?',
        businessReason: 'Bán lẻ POS thu tiền ngay tại quầy, còn Bán buôn B2B có chu trình khoanh giữ và xuất hóa đơn công nợ.',
        choices: [
          {
            id: 'CHOICE_B2B',
            title: '1. Bán buôn B2B / Đơn đặt hàng (M13)',
            description: 'Tạo đơn đặt hàng bán sỉ cho doanh nghiệp, có quản lý hạn mức nợ và giữ chỗ tồn kho.',
            targetModuleId: 'M13',
            targetModuleName: 'M13 Sales Orders B2B',
            targetRoute: '/sales',
            suggestedAction: 'Tạo đơn bán hàng SO mới',
            businessReason: 'Có hợp đồng, giao hàng tận nơi và đối soát công nợ.',
            riskLevel: 'LOW',
          },
          {
            id: 'CHOICE_POS',
            title: '2. Bán lẻ tại quầy / Thu ngân POS (M16)',
            description: 'Khách mua tại cửa hàng, quét mã vạch sản phẩm và thu tiền ngay.',
            targetModuleId: 'M16',
            targetModuleName: 'M16 POS Retail',
            targetRoute: '/pos',
            suggestedAction: 'Mở ca thu ngân và bán hàng',
            businessReason: 'Hệ thống trừ kho ngay lập tức và in hóa đơn trao tay.',
            riskLevel: 'LOW',
          },
        ],
      };
    }

    // 3. KHÁCH TRẢ HÀNG / ĐỔI TRẢ (RMA)
    if (q.includes('khách trả hàng') || q.includes('đổi trả') || q.includes('rma') || q.includes('hàng lỗi trả về') || q.includes('hoàn hàng') || q.includes('bảo hành')) {
      return {
        intentId: 'INTENT_RMA_RETURNS',
        rawQuery: query,
        recognizedIntent: 'Tiếp nhận hàng đổi trả từ khách hàng (Returns & RMA)',
        category: 'RETURNS',
        suggestedProcess: 'Phiếu RMA M15 -> Kiểm Định Kỹ Thuật QC -> Nhập Lại Kho / Hoàn Tiền',
        targetModuleId: 'M15',
        targetModuleName: 'M15 Returns & RMA',
        targetRoute: '/returns',
        confidence: 0.99,
        requiresDisambiguation: false,
        businessReason: 'Hàng trả lại bắt buộc phải qua khâu kiểm định chất lượng để phân loại trước khi cấn trừ tiền.',
        choices: [],
      };
    }

    // 4. LỆCH KHO / THỪA THIẾU HÀNG
    if (q.includes('kho bị lệch') || q.includes('lệch kho') || q.includes('sai tồn') || q.includes('mất hàng') || q.includes('thừa hàng') || q.includes('thiếu hàng') || q.includes('kiểm kê')) {
      return {
        intentId: 'INTENT_STOCK_VARIANCE',
        rawQuery: query,
        recognizedIntent: 'Xử lý chênh lệch tồn kho thực tế và sổ sách',
        category: 'INVENTORY',
        suggestedProcess: 'Kiểm Kê Đếm Mù M19 -> Xác Định Variance -> Phê Duyệt Phiếu Điều Chỉnh M20',
        targetModuleId: 'M19',
        targetModuleName: 'M19 Stocktake',
        targetRoute: '/stocktake',
        confidence: 0.96,
        requiresDisambiguation: false,
        businessReason: 'Không được tự ý sửa số lượng kho. Phải tuân thủ quy trình kiểm kê đếm mù và phê duyệt điều chỉnh có thẩm quyền.',
        choices: [],
      };
    }

    // 5. CHUYỂN KHO NỘI BỘ
    if (q.includes('chuyển hàng sang kho khác') || q.includes('chuyển kho') || q.includes('điều chuyển') || q.includes('chuyển chi nhánh')) {
      return {
        intentId: 'INTENT_INTERNAL_TRANSFER',
        rawQuery: query,
        recognizedIntent: 'Điều chuyển hàng hóa giữa hai kho hoặc chi nhánh (Internal Transfers)',
        category: 'INVENTORY',
        suggestedProcess: 'Lệnh Chuyển M21 -> Xuất Kho Nguồn -> Trạng Thái In-transit -> Kho Đích Xác Nhận',
        targetModuleId: 'M21',
        targetModuleName: 'M21 Internal Transfers',
        targetRoute: '/transfer',
        confidence: 0.98,
        requiresDisambiguation: false,
        businessReason: 'Đảm bảo tính nguyên tử (Atomic Transaction): Hàng xuất chưa đến kho đích sẽ nằm ở trạng thái In-transit bảo vệ số liệu.',
        choices: [],
      };
    }

    // 6. XỬ LÝ TIẾP ĐƠN HIỆN TẠI (Next Step Context)
    if (q.includes('xử lý tiếp') || q.includes('bước tiếp theo') || q.includes('làm gì tiếp') || q.includes('tiếp tục')) {
      return {
        intentId: 'INTENT_CONTINUE_WORKFLOW',
        rawQuery: query,
        recognizedIntent: 'Xác định bước tiếp theo cho chứng từ đang chọn',
        category: 'O2C',
        suggestedProcess: 'Đánh giá trạng thái hiện tại -> Đề xuất Next Best Action hợp lệ',
        targetModuleId: context?.currentModuleId || 'M13',
        targetModuleName: context?.currentModuleName || 'Sales Orders',
        targetRoute: '/sales',
        confidence: 0.9,
        requiresDisambiguation: false,
        businessReason: 'Tự động tính toán hành động tiếp theo dựa trên State Machine và quyền hạn của người dùng.',
        choices: [],
      };
    }

    // DEFAULT FALLBACK
    return {
      intentId: 'INTENT_EXPLORE',
      rawQuery: query,
      recognizedIntent: `Tìm kiếm nghiệp vụ liên quan: "${query}"`,
      category: 'O2C',
      suggestedProcess: 'Tra cứu danh mục chức năng hoặc liên hệ Trợ lý nghiệp vụ',
      targetModuleId: 'M01',
      targetModuleName: 'M01 Workspace Hub',
      targetRoute: '/hub',
      confidence: 0.5,
      requiresDisambiguation: false,
      businessReason: 'Không tìm thấy quy trình khớp chính xác; chuyển về Trung tâm làm việc để tìm kiếm chi tiết.',
      choices: [],
    };
  }

  // =========================================================================
  // 4. BUSINESS GUARD (Detects wrong module usage & prevents invalid actions)
  // =========================================================================

  /**
   * Evaluates if user is currently performing an action misaligned with the current module's authority.
   * e.g., Trying to receive supplier goods inside Stock Adjustment M20.
   */
  static checkBusinessGuard(
    currentModuleId: string,
    currentModuleName: string,
    userInputOrActionText: string
  ): BusinessGuardAlert {
    const text = (userInputOrActionText || '').toLowerCase();

    // Guard 1: User is in Stock Adjustment (M20) but input shows Supplier Receiving / Purchasing
    if (
      (currentModuleId === 'M20' || currentModuleId === 'M10') &&
      (text.includes('supplier') || text.includes('nhà cung cấp') || text.includes('ncc') || text.includes('mua hàng') || text.includes('100 sản phẩm') || text.includes('nhập hàng mới'))
    ) {
      return {
        isMisaligned: true,
        currentModuleId,
        currentModuleName,
        detectedIntent: 'Nhận hàng mua từ Nhà Cung Cấp (Supplier Receiving)',
        suggestedModuleId: 'M08',
        suggestedModuleName: 'M08 Purchase Orders & Nhận Hàng',
        suggestedRoute: '/purchase',
        reason: 'Phiếu Điều Chỉnh Kho (M20) chỉ dùng để xử lý chênh lệch sau kiểm kê thực tế. Không được dùng để nhập hàng mua vì sẽ vi phạm chế độ thuế GTGT và giá vốn.',
        correctJourney: 'Mua Sắm M08 -> Tiếp Nhận GRN M17 -> Ghi Nhận Công Nợ AP M31',
        actionChoices: [
          { label: 'Chuyển sang M08 Mua Hàng & Tiếp Nhận', targetModuleId: 'M08', targetRoute: '/purchase' },
          { label: 'Xem Hướng Dẫn Luồng Nghiệp Vụ Chuẩn', targetModuleId: 'M08', targetRoute: '/purchase' },
        ],
      };
    }

    // Guard 2: User is in Inventory Core (M17) trying to sell retail without invoice
    if (
      (currentModuleId === 'M17' || currentModuleId === 'M18') &&
      (text.includes('bán lẻ') || text.includes('thu tiền mặt') || text.includes('quầy') || text.includes('khách lẻ'))
    ) {
      return {
        isMisaligned: true,
        currentModuleId,
        currentModuleName,
        detectedIntent: 'Bán lẻ tại quầy & Thu ngân (POS Retail)',
        suggestedModuleId: 'M16',
        suggestedModuleName: 'M16 POS Retail & Cashier',
        suggestedRoute: '/pos',
        reason: 'Kho trung tâm M17 chỉ quản lý lưu trữ và xuất kho theo lệnh. Nghiệp vụ bán lẻ thu tiền phải thực hiện tại phân hệ M16 POS để in bill và quản lý ca thu ngân.',
        correctJourney: 'Quầy POS M16 -> Quét Mã Vạch -> Thu Ngân -> Trừ Kho Tự Động',
        actionChoices: [
          { label: 'Chuyển sang Quầy Thu Ngân M16', targetModuleId: 'M16', targetRoute: '/pos' },
        ],
      };
    }

    // Guard 3: User is in Sales Orders (M13) trying to do internal branch transfer
    if (
      currentModuleId === 'M13' &&
      (text.includes('chuyển sang chi nhánh') || text.includes('chuyển kho nội bộ') || text.includes('gửi kho hcm'))
    ) {
      return {
        isMisaligned: true,
        currentModuleId,
        currentModuleName,
        detectedIntent: 'Điều chuyển hàng hóa nội bộ (Internal Transfers)',
        suggestedModuleId: 'M21',
        suggestedModuleName: 'M21 Internal Transfers',
        suggestedRoute: '/transfer',
        reason: 'Đơn bán hàng M13 dùng cho khách hàng bên ngoài và phát sinh hóa đơn công nợ. Chuyển hàng giữa các kho của công ty phải dùng M21 để đưa vào trạng thái In-transit.',
        correctJourney: 'Chuyển Kho M21 -> In-transit -> Kho Đích Tiếp Nhận',
        actionChoices: [
          { label: 'Mở M21 Chuyển Kho Nội Bộ', targetModuleId: 'M21', targetRoute: '/transfer' },
        ],
      };
    }

    return {
      isMisaligned: false,
      currentModuleId,
      currentModuleName,
      detectedIntent: '',
      suggestedModuleId: '',
      suggestedModuleName: '',
      suggestedRoute: '',
      reason: '',
      correctJourney: '',
      actionChoices: [],
    };
  }

  // =========================================================================
  // 5. NEXT BEST ACTION ENGINE (Deterministic State + Preconditions + Contracts)
  // =========================================================================

  /**
   * Computes authoritative Next Best Action based on Current State, Entity Data, and User Permissions.
   */
  static getNextBestAction(
    entityType: 'SalesOrder' | 'PurchaseOrder' | 'StockAdjustment' | 'Stocktake' | 'RMA' | 'ManufacturingOrder',
    currentState: string,
    userRole: string = 'ADMIN',
    entityData: any = {}
  ): NextBestAction | null {
    const state = (currentState || 'DRAFT').toUpperCase();
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

    // 1. SALES ORDER FLOW
    if (entityType === 'SalesOrder') {
      if (state === 'DRAFT') {
        const contract = ACTION_CONTRACTS['SO_SUBMIT'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'O2C',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 1: Gửi Duyệt Đơn Bán Hàng',
              actionButtonText: 'Gửi Duyệt Đơn Hàng',
              simpleGuidance: 'Bấm nút này để chuyển đơn hàng cho Trưởng phòng Kinh doanh kiểm tra hạn mức nợ và duyệt giá.',
            },
            intermediate: {
              whyReason: 'Đơn hàng nháp chưa có hiệu lực ràng buộc; gửi duyệt để khoanh giữ tồn kho và kiểm tra hạn mức nợ.',
              expectedOutcome: 'Trạng thái chuyển sang SUBMITTED, khóa sửa đổi dữ liệu đơn giá và số lượng.',
              impactSummary: 'Chưa làm thay đổi tồn kho thực tế, bảo đảm an toàn bán hàng.',
            },
            expert: {
              businessRules: ['Quy tắc kiểm tra Credit Limit: Dư nợ hiện tại + Đơn mới <= Hạn mức M07.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/so/submit',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'SALES_ORDER_SUBMITTED_EVENT',
            },
          },
        };
      }

      if (state === 'SUBMITTED') {
        const contract = ACTION_CONTRACTS['SO_APPROVE'];
        const isAllowed = isAdmin || userRole === 'SALES_DIR';
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'O2C',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: isAllowed,
          blockedReason: isAllowed ? undefined : 'Yêu cầu quyền Giám đốc Kinh doanh (SALES_DIR) hoặc Admin để phê duyệt.',
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 2: Phê Duyệt Đơn Bán Hàng',
              actionButtonText: 'Phê Duyệt Đơn Hàng',
              simpleGuidance: 'Xác nhận thông tin khách hàng và chấp thuận cho kho chuẩn bị hàng xuất bán.',
            },
            intermediate: {
              whyReason: 'Ngăn chặn xuất hàng cho khách đang nợ quá hạn hoặc vượt trần tín dụng cho phép.',
              expectedOutcome: 'Đơn hàng được chấp thuận (APPROVED) và sẵn sàng khoanh giữ tồn kho.',
              impactSummary: 'Đơn hàng được phép chuyển tiếp sang bộ phận Kho và Vận chuyển.',
            },
            expert: {
              businessRules: ['Cấp duyệt phải có hạn mức phê duyệt chiết khấu tối thiểu tương ứng.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/so/approve',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'SALES_ORDER_APPROVED_EVENT',
            },
          },
        };
      }

      if (state === 'APPROVED') {
        const contract = ACTION_CONTRACTS['SO_RESERVE'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'O2C',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 3: Tạm Giữ Hàng Trong Kho (Khoanh Giữ)',
              actionButtonText: 'Khoanh Giữ Tồn Kho',
              simpleGuidance: 'Hệ thống sẽ giữ chỗ số hàng này trong kho để không ai khác bán mất trong lúc soạn hàng.',
            },
            intermediate: {
              whyReason: 'Chống tình trạng nhiều nhân viên cùng bán 1 món hàng (Over-selling).',
              expectedOutcome: 'Tồn khả dụng (Available) giảm xuống tương ứng, tồn vật lý (Physical) vẫn giữ nguyên.',
              impactSummary: 'Đơn hàng chuyển trạng thái RESERVED, bộ phận kho nhận lệnh soạn hàng.',
            },
            expert: {
              businessRules: ['Invariant: Available Stock = Physical Stock - Allocated Stock >= 0.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/inventory/reserve',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'INVENTORY_STOCK_ALLOCATED_EVENT',
            },
          },
        };
      }

      if (state === 'RESERVED') {
        const contract = ACTION_CONTRACTS['SO_FULFILL'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'O2C',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 4: Lấy Hàng & Đóng Gói (Pick & Pack)',
              actionButtonText: 'Tạo Phiếu Soạn Hàng',
              simpleGuidance: 'In danh sách vị trí kệ hàng để thủ kho lấy hàng và dán tem đóng thùng.',
            },
            intermediate: {
              whyReason: 'Tập hợp hàng hóa chính xác theo số Lô/Serial trước khi xe vận tải đến bốc hàng.',
              expectedOutcome: 'Trạng thái chuyển sang FULFILLING, hoàn tất đóng gói.',
              impactSummary: 'Hàng đã sẵn sàng ở cửa Dock xuất hàng.',
            },
            expert: {
              businessRules: ['Quy tắc xuất kho FEFO (Hạn sử dụng sớm ra trước) đối với hàng có hạn dùng.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/orders/:id/pack',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
            },
          },
        };
      }

      if (state === 'FULFILLING') {
        const contract = ACTION_CONTRACTS['SO_SHIP'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'O2C',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 5: Bàn Giao Xe Tải & Xuất Kho Thực Tế',
              actionButtonText: 'Xuất Bến Giao Hàng',
              simpleGuidance: 'Bàn giao hàng cho tài xế xe tải M36 và chính thức trừ số lượng hàng trong kho.',
            },
            intermediate: {
              whyReason: 'Hàng rời khỏi kho cần ghi nhận phiếu xuất kho hợp pháp và tính giá vốn hàng bán (COGS).',
              expectedOutcome: 'Tồn kho vật lý (Physical Stock) giảm; giá vốn COGS tự động tính toán.',
              impactSummary: 'Đơn hàng chuyển sang SHIPPED (Đang đi đường).',
            },
            expert: {
              businessRules: ['Single Writer InventoryService.postTransaction(ISSUE); Hạch toán Nợ 632 / Có 156.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/orders/:id/ship',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'GOODS_ISSUED_FOR_DELIVERY_EVENT',
            },
          },
        };
      }

      if (state === 'SHIPPED') {
        const contract = ACTION_CONTRACTS['SO_INVOICE'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'O2C',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 6: Xuất Hóa Đơn Điện Tử GTGT',
              actionButtonText: 'Phát Hành Hóa Đơn VAT',
              simpleGuidance: 'Tạo hóa đơn điện tử chính thức gửi cho khách hàng và ghi nhận số tiền khách nợ.',
            },
            intermediate: {
              whyReason: 'Tuân thủ quy định thuế sau khi khách đã nhận hàng (biên bản POD ký nhận).',
              expectedOutcome: 'Hóa đơn ký số có mã cơ quan thuế; ghi nhận công nợ AR.',
              impactSummary: 'Tạo khoản phải thu (TK 131) và ghi nhận doanh thu bán hàng (TK 511).',
            },
            expert: {
              businessRules: ['Bút toán kép: Nợ 131 / Có 511 (Doanh thu), Có 33311 (Thuế GTGT đầu ra).'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/invoices/sign',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'CUSTOMER_INVOICE_ISSUED_EVENT',
            },
          },
        };
      }

      if (state === 'INVOICED') {
        const contract = ACTION_CONTRACTS['SO_PAYMENT'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'O2C',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 7: Thu Tiền & Tất Toán Đơn Hàng',
              actionButtonText: 'Xác Nhận Thu Tiền',
              simpleGuidance: 'Khách hàng chuyển khoản hoặc trả tiền mặt, hệ thống đóng đơn hàng thành công.',
            },
            intermediate: {
              whyReason: 'Ghi nhận dòng tiền thực thu về quỹ hoặc tài khoản ngân hàng của doanh nghiệp.',
              expectedOutcome: 'Công nợ của khách hàng về 0; đơn hàng hoàn tất 100% chu trình O2C.',
              impactSummary: 'Chuyển trạng thái PAID và đóng hồ sơ giao dịch.',
            },
            expert: {
              businessRules: ['Hạch toán Nợ 112 (Tiền gửi NH) / Có 131 (Phải thu khách hàng).'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/orders/:id/pay',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'ORDER_PAYMENT_SETTLED_EVENT',
            },
          },
        };
      }
    }

    // 2. PURCHASE ORDER FLOW
    if (entityType === 'PurchaseOrder') {
      if (state === 'DRAFT') {
        const contract = ACTION_CONTRACTS['PO_SUBMIT'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'P2P',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 1: Gửi Duyệt Đơn Mua Hàng PO',
              actionButtonText: 'Gửi Duyệt PO',
              simpleGuidance: 'Gửi đơn mua hàng để Trưởng phòng Mua và Kế toán xem xét ngân sách chi tiêu.',
            },
            intermediate: {
              whyReason: 'Đơn mua phải được duyệt trước khi gửi cho Nhà cung cấp để bảo đảm có nguồn vốn chi trả.',
              expectedOutcome: 'PO chuyển sang trạng thái SUBMITTED.',
              impactSummary: 'Chưa ảnh hưởng tồn kho hay công nợ.',
            },
            expert: {
              businessRules: ['Kiểm tra hạn mức ngân sách mua hàng phòng ban trong niên độ tài chính.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/po/submit',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
            },
          },
        };
      }

      if (state === 'SUBMITTED') {
        const contract = ACTION_CONTRACTS['PO_APPROVE'];
        const isAllowed = isAdmin || userRole === 'PROCUREMENT_MGR' || userRole === 'CFO';
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'P2P',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: isAllowed,
          blockedReason: isAllowed ? undefined : 'Yêu cầu quyền Trưởng phòng Mua (PROCUREMENT_MGR) hoặc CFO để duyệt PO.',
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 2: Phê Duyệt Đơn Mua Hàng',
              actionButtonText: 'Phê Duyệt Đơn PO',
              simpleGuidance: 'Chấp thuận đơn đặt hàng. Lưu ý: Thao tác này CHƯA làm tăng số lượng trong kho.',
            },
            intermediate: {
              whyReason: 'Phê duyệt cam kết hợp đồng. Hàng chỉ vào kho khi thủ kho nhận hàng thực tế ở Bước 3.',
              expectedOutcome: 'PO ở trạng thái APPROVED, gửi thông báo đặt hàng cho Nhà cung cấp.',
              impactSummary: 'Tồn kho vật lý giữ nguyên 100%.',
            },
            expert: {
              businessRules: ['Quy tắc ERP: PO là cam kết thu mua, không phải là nghiệp vụ nhập kho vật lý.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/po/approve',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'PURCHASE_ORDER_APPROVED_EVENT',
            },
          },
        };
      }

      if (state === 'APPROVED') {
        const contract = ACTION_CONTRACTS['PO_RECEIVE_GRN'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'P2P',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 3: Nhập Hàng Vào Kho (Goods Receipt)',
              actionButtonText: 'Tạo Phiếu Nhập Kho GRN',
              simpleGuidance: 'Nhân viên kho kiểm đếm số lượng thực nhận và ghi tăng hàng trong kho.',
            },
            intermediate: {
              whyReason: 'Chỉ có thao tác Nhập Kho GRN mới làm tăng Tồn kho vật lý (Physical Stock) trong hệ thống.',
              expectedOutcome: 'Tồn kho tăng đúng số lượng thực nhận, cập nhật giá vốn lớp chi phí.',
              impactSummary: 'Đơn hàng chuyển sang RECEIVED, sẵn sàng đối soát 3 bên.',
            },
            expert: {
              businessRules: ['Single Writer: Gọi InventoryService.postTransaction(RECEIPT) để ghi sổ cái kho stock_ledger.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/inventory/receive',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'GOODS_RECEIPT_POSTED_EVENT',
            },
          },
        };
      }

      if (state === 'RECEIVED') {
        const contract = ACTION_CONTRACTS['PO_3WAY_MATCH'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'P2P',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 4: Đối Soát 3 Chiều (3-Way Matching)',
              actionButtonText: 'Kiểm Tra Đối Soát 3 Bên',
              simpleGuidance: 'So khớp Đơn mua (PO), Phiếu nhận kho (GRN) và Hóa đơn của NCC để bảo đảm đúng giá đúng lượng.',
            },
            intermediate: {
              whyReason: 'Ngăn chặn chi tiền vượt định mức hoặc thanh toán cho hàng hóa bị thiếu/hỏng.',
              expectedOutcome: 'Khớp số lượng và đơn giá (dung sai <= 2%), chuyển sang MATCHED.',
              impactSummary: 'Đủ điều kiện ghi nhận công nợ phải trả Nhà cung cấp.',
            },
            expert: {
              businessRules: ['Kiểm tra 3 điều kiện: PO.qty == GRN.qty; PO.price == Invoice.price; Tax code hợp lệ.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/invoices/3way-match',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
            },
          },
        };
      }

      if (state === 'MATCHED') {
        const contract = ACTION_CONTRACTS['PO_CREATE_AP_INVOICE'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'P2P',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 5: Ghi Nhận Hóa Đơn Công Nợ NCC',
              actionButtonText: 'Ghi Nhận Hóa Đơn AP',
              simpleGuidance: 'Ghi nhận số tiền phải trả cho Nhà cung cấp vào sổ sách kế toán.',
            },
            intermediate: {
              whyReason: 'Ghi nhận nghĩa vụ công nợ và khấu trừ thuế GTGT đầu vào hợp pháp theo quy định.',
              expectedOutcome: 'Tạo hóa đơn AP_INVOICE, tăng dư nợ tài khoản TK 331.',
              impactSummary: 'Chờ đến kỳ hạn thanh toán sẽ chi tiền.',
            },
            expert: {
              businessRules: ['Bút toán: Nợ 156 (hoặc 152), Nợ 1331 (Thuế GTGT) / Có 331 (Phải trả NCC).'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/invoices/ap/create',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'VENDOR_INVOICE_POSTED_EVENT',
            },
          },
        };
      }

      if (state === 'INVOICED') {
        const contract = ACTION_CONTRACTS['PO_PAY_AP'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'P2P',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Bước 6: Chi Tiền Thanh Toán Cho NCC',
              actionButtonText: 'Ủy Nhiệm Chi / Thanh Toán',
              simpleGuidance: 'Chuyển tiền trả cho Nhà cung cấp qua tài khoản ngân hàng và hoàn tất đơn hàng.',
            },
            intermediate: {
              whyReason: 'Hoàn thành nghĩa vụ hợp đồng, đóng chu trình mua sắm Procure-to-Pay.',
              expectedOutcome: 'Dư nợ NCC về 0; PO chuyển sang trạng thái COMPLETED.',
              impactSummary: 'Trừ số dư tài khoản tiền gửi ngân hàng (TK 112).',
            },
            expert: {
              businessRules: ['Hạch toán Nợ 331 / Có 112; Single Writer AccountingEngine.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/payments/pay-vendor',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'VENDOR_PAYMENT_SETTLED_EVENT',
            },
          },
        };
      }
    }

    // 3. STOCK ADJUSTMENT & STOCKTAKE FLOW
    if (entityType === 'StockAdjustment') {
      if (state === 'DRAFT' || state === 'PENDING_APPROVAL' || state === 'VARIANCE_DETECTED') {
        const contract = ACTION_CONTRACTS['STOCK_ADJUST_APPROVE'];
        const isAllowed = isAdmin || userRole === 'CFO' || userRole === 'PLANT_MGR';
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'INVENTORY',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: isAllowed,
          blockedReason: isAllowed ? undefined : 'Yêu cầu chữ ký phê duyệt của CFO hoặc Giám đốc nhà máy.',
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Phê Duyệt Điều Chỉnh Tồn Kho',
              actionButtonText: 'Duyệt Phiếu Điều Chỉnh',
              simpleGuidance: 'Cấp quản lý kiểm tra biên bản giải trình chênh lệch và đồng ý bù trừ số liệu kho.',
            },
            intermediate: {
              whyReason: 'Điều chỉnh kho làm thay đổi giá trị tài sản nên bắt buộc phải có chữ ký cấp thẩm quyền.',
              expectedOutcome: 'Phiếu được duyệt (APPROVED), cho phép ghi sổ cái kho.',
              impactSummary: 'Chống hành vi gian lận sửa số liệu kho tùy tiện.',
            },
            expert: {
              businessRules: ['Ghi vết Audit Ledger SHA-256 bất biến kèm chứng thư số người duyệt.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/inventory/adjust',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
            },
          },
        };
      }

      if (state === 'APPROVED') {
        const contract = ACTION_CONTRACTS['STOCK_ADJUST_POST'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'INVENTORY',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Ghi Sổ Cái Kho & Cân Đối Kế Toán',
              actionButtonText: 'Ghi Sổ Cái Kho (Post)',
              simpleGuidance: 'Thực hiện cập nhật số lượng tồn kho trên hệ thống cho khớp với số thực tế ngoài kho.',
            },
            intermediate: {
              whyReason: 'Đưa số lượng sổ sách về đúng thực tế và định khoản chi phí hao hụt hoặc thu nhập khác.',
              expectedOutcome: 'Tồn Physical Stock cập nhật; hạch toán kế toán Nợ 1381 hoặc Có 711.',
              impactSummary: 'Phiếu chuyển trạng thái POSTED, không thể hoàn tác.',
            },
            expert: {
              businessRules: ['Single Writer InventoryService.postTransaction(ADJUSTMENT); Định khoản Sổ cái kép GL.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/inventory/adjust/post',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'STOCK_ADJUSTMENT_POSTED_EVENT',
            },
          },
        };
      }
    }

    // 4. RMA RETURNS FLOW
    if (entityType === 'RMA') {
      if (state === 'REQUESTED' || state === 'RECEIVED') {
        const contract = ACTION_CONTRACTS['RMA_INSPECT'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'RETURNS',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Kiểm Định Kỹ Thuật QC Hàng Trả',
              actionButtonText: 'Tiến Hành Kiểm Định QC',
              simpleGuidance: 'Kiểm tra xem hàng khách trả còn nguyên seal hay đã hỏng hóc để quyết định hướng xử lý.',
            },
            intermediate: {
              whyReason: 'Hàng hỏng không được nhập vào kho bán lẻ; hàng tốt tái nhập bán tiếp; hàng lỗi hãng gửi trả NCC.',
              expectedOutcome: 'QC đưa ra kết luận ĐẠT hoặc HỎNG (INSPECTED).',
              impactSummary: 'Cơ sở để kế toán xuất hóa đơn điều chỉnh giảm.',
            },
            expert: {
              businessRules: ['Lưu biên bản kiểm tra kỹ thuật vào bảng rmas và dán mã phân loại kho.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/rma/INSPECT',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
            },
          },
        };
      }

      if (state === 'INSPECTED' || state === 'APPROVED') {
        const contract = ACTION_CONTRACTS['RMA_EXECUTE_REFUND'];
        return {
          actionId: contract.actionId,
          label: contract.label,
          category: 'RETURNS',
          businessReason: contract.businessReason,
          preconditions: contract.preconditions,
          expectedResult: contract.expectedResult,
          resultingState: contract.resultingState,
          targetModuleId: contract.targetModuleId,
          targetRoute: contract.targetRoute,
          contract,
          isExecutable: true,
          priority: 'PRIMARY',
          disclosure: {
            beginner: {
              nextStepTitle: 'Nhập Kho & Hoàn Tiền Cho Khách',
              actionButtonText: 'Hoàn Tiền & Nhập Kho',
              simpleGuidance: 'Đưa hàng vào kho thích hợp và chuyển tiền trả lại cho khách hàng.',
            },
            intermediate: {
              whyReason: 'Xuất Credit Note cấn trừ công nợ hoặc hoàn tiền, đồng thời InventoryService ghi nhận lại tồn kho.',
              expectedOutcome: 'Tồn kho cập nhật; công nợ khách hàng được giảm trừ.',
              impactSummary: 'RMA hoàn tất (REFUNDED).',
            },
            expert: {
              businessRules: ['Single Writer InventoryService.postTransaction(RETURN); Xuất Credit Note theo TT78.'],
              coreEngine: contract.coreEngine,
              apiEndpoint: contract.executionEndpoint || '/api/rma/EXECUTE_RETURN_AND_REFUND',
              databaseEffect: contract.databaseEffect,
              auditRule: contract.auditRequirement,
              eventTriggered: 'RMA_REFUND_COMPLETED_EVENT',
            },
          },
        };
      }
    }

    return null;
  }

  // =========================================================================
  // 6. MY WORK AGGREGATOR (Actionable Pending Records for Current User)
  // =========================================================================

  /**
   * Generates prioritized list of pending actionable work items for the user's role.
   * Clicking "XỬ LÝ" brings them directly to the right module, right record, right next action.
   */
  static getMyWorkItems(currentUser: UserSession, branchId: string = 'BR_HO'): MyWorkPendingItem[] {
    const role = currentUser.role || 'ADMIN';
    const items: MyWorkPendingItem[] = [];

    // Pending Sales Orders needing Approval / Reservation
    if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SALES_DIR') {
      items.push({
        id: 'MW-SO-1024',
        sourceModuleId: 'M13',
        sourceModuleName: 'Sales Orders',
        entityType: 'SalesOrder',
        entityId: 'SO-2026-1024',
        businessReference: 'SO-2026-1024',
        title: 'Đơn B2B An Phát — Chờ phê duyệt hạn mức nợ',
        currentState: 'SUBMITTED',
        stateLabel: 'Chờ Duyệt',
        priority: 'HIGH',
        dueTimeText: 'Còn 2 giờ (SLA 8h)',
        isOverdue: false,
        amountText: '185,000,000 VND',
        targetRoute: '/sales',
        nextAction: this.getNextBestAction('SalesOrder', 'SUBMITTED', role)!,
      });
    }

    // Pending Purchase Orders awaiting Receiving / 3-Way Match
    if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'WAREHOUSE_CHIEF' || role === 'PROCUREMENT_MGR') {
      items.push({
        id: 'MW-PO-2031',
        sourceModuleId: 'M08',
        sourceModuleName: 'Purchase Orders',
        entityType: 'PurchaseOrder',
        entityId: 'PO-2026-2031',
        businessReference: 'PO-2026-2031',
        title: 'Lô 100 Cuộn Cáp VinaTel — Xe giao đến cổng kho, chờ nhận GRN',
        currentState: 'APPROVED',
        stateLabel: 'Chờ Nhận Hàng (GRN)',
        priority: 'URGENT',
        dueTimeText: 'Đến hạn hôm nay',
        isOverdue: false,
        amountText: '250,000,000 VND',
        targetRoute: '/purchase',
        nextAction: this.getNextBestAction('PurchaseOrder', 'APPROVED', role)!,
      });
    }

    // Pending Stocktake Discrepancy Reconciliation
    if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CFO' || role === 'WAREHOUSE_MGR') {
      items.push({
        id: 'MW-SA-0042',
        sourceModuleId: 'M20',
        sourceModuleName: 'Stock Adjustment',
        entityType: 'StockAdjustment',
        entityId: 'SA-2026-0042',
        businessReference: 'SA-2026-0042',
        title: 'Kiểm kê Kho Hà Nội phát hiện thiếu 2 sản phẩm — Chờ duyệt bù trừ',
        currentState: 'PENDING_APPROVAL',
        stateLabel: 'Chờ Phê Duyệt',
        priority: 'HIGH',
        dueTimeText: 'Quá hạn 4 giờ',
        isOverdue: true,
        amountText: 'Chênh lệch: -14,500,000 VND',
        targetRoute: '/stock-adjustment',
        nextAction: this.getNextBestAction('StockAdjustment', 'PENDING_APPROVAL', role)!,
      });
    }

    // Pending RMA Inspection
    if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'QC_INSPECTOR' || role === 'OPERATOR') {
      items.push({
        id: 'MW-RMA-0018',
        sourceModuleId: 'M15',
        sourceModuleName: 'Returns & RMA',
        entityType: 'RMA',
        entityId: 'RMA-2026-0018',
        businessReference: 'RMA-2026-0018',
        title: 'Hàng trả SO-2026-0891 (Lỗi sạc pin) — Chờ kỹ thuật viên QC kiểm định',
        currentState: 'RECEIVED',
        stateLabel: 'Chờ Kiểm Định QC',
        priority: 'MEDIUM',
        dueTimeText: 'Hạn chót ngày mai',
        isOverdue: false,
        amountText: '32,000,000 VND',
        targetRoute: '/returns',
        nextAction: this.getNextBestAction('RMA', 'RECEIVED', role)!,
      });
    }

    return items;
  }
}
