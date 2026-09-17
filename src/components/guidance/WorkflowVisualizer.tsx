import React, { useState, useMemo } from 'react';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Database,
  Lock,
  Workflow,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';

// =========================================================================
// 1. STATE MACHINE & PROCESS DEFINITIONS
// =========================================================================

export interface ProcessStageDefinition {
  stageIndex: number;
  stateCode: string;
  label: string;
  moduleId: string;
  moduleName: string;
  actorRole: string;
  engineAuthority: string;
  transitionEvent: string;
  description: string;
  preconditions: string[];
  allowedTransitions: string[];
  blockedTransitions: { targetState: string; reason: string }[];
  databaseEffect: string;
  auditRequirement: string;
}

export interface BusinessProcessDefinition {
  id: 'P2P' | 'O2C' | 'INVENTORY' | 'RETURNS' | 'MANUFACTURING';
  code: string;
  name: string;
  vietnameseName: string;
  categoryLabel: string;
  description: string;
  defaultModuleId: string;
  stages: ProcessStageDefinition[];
}

export const BUSINESS_PROCESS_STATE_MACHINES: BusinessProcessDefinition[] = [
  {
    id: 'P2P',
    code: 'P2P_CORE',
    name: 'Procure-to-Pay (P2P)',
    vietnameseName: 'Chu Trình Thu Mua Đến Thanh Toán',
    categoryLabel: 'Procurement & AP',
    description: 'Quy trình thu mua tiêu chuẩn từ khi lập nhu cầu mua hàng, phê duyệt hạn mức, tiếp nhận kho vật lý qua Single Writer, đối soát 3 chiều, và thanh toán hóa đơn công nợ NCC.',
    defaultModuleId: 'M08',
    stages: [
      {
        stageIndex: 1,
        stateCode: 'DRAFT',
        label: 'Lập Đơn Mua PO',
        moduleId: 'M08',
        moduleName: 'Purchase Orders',
        actorRole: 'PURCHASE_OFFICER',
        engineAuthority: 'ProcurementService',
        transitionEvent: 'SUBMIT_PO',
        description: 'Tạo đơn đặt hàng nháp, chỉ định Nhà cung cấp (M09) và danh mục hàng hóa.',
        preconditions: ['Nhà cung cấp đã active trong M09 Master', 'Đơn giá khớp bảng giá thỏa thuận'],
        allowedTransitions: ['SUBMITTED', 'CANCELLED'],
        blockedTransitions: [
          { targetState: 'RECEIVED', reason: 'Không thể nhận kho khi PO chưa được cấp thẩm quyền phê duyệt.' },
          { targetState: 'INVOICED', reason: 'Không thể tạo hóa đơn khi chưa có đơn hàng và chứng từ giao hàng.' },
        ],
        databaseEffect: 'Ghi bản ghi purchase_orders với status = DRAFT',
        auditRequirement: 'Lưu SHA-256 draft hash',
      },
      {
        stageIndex: 2,
        stateCode: 'SUBMITTED',
        label: 'Chờ Phê Duyệt PO',
        moduleId: 'M08',
        moduleName: 'Purchase Orders',
        actorRole: 'PROCUREMENT_MGR / CFO',
        engineAuthority: 'AuthorityManager',
        transitionEvent: 'APPROVE_PO',
        description: 'Kiểm soát trần ngân sách thu mua theo kỳ và phân quyền tài chính.',
        preconditions: ['Tổng giá trị PO nằm trong hạn mức phê duyệt của cấp duyệt', 'Ngân sách phòng ban còn dư'],
        allowedTransitions: ['APPROVED', 'REJECTED'],
        blockedTransitions: [
          { targetState: 'RECEIVED', reason: 'Phải chờ phê duyệt chính thức trước khi cho phép kho tiếp nhận hàng.' },
        ],
        databaseEffect: 'Cập nhật status = SUBMITTED, khóa sửa đổi dòng hàng',
        auditRequirement: 'Ghi nhật ký yêu cầu phê duyệt',
      },
      {
        stageIndex: 3,
        stateCode: 'APPROVED',
        label: 'Đã Duyệt PO',
        moduleId: 'M08',
        moduleName: 'Purchase Orders',
        actorRole: 'PROCUREMENT_LEAD',
        engineAuthority: 'ProcurementService',
        transitionEvent: 'RECEIVE_GRN',
        description: 'PO có hiệu lực ràng buộc pháp lý, sẵn sàng phát hành cho NCC giao hàng đến cổng kho.',
        preconditions: ['Chữ ký số hợp lệ của cấp phê duyệt'],
        allowedTransitions: ['RECEIVED', 'CANCELLED'],
        blockedTransitions: [
          { targetState: 'INVOICED', reason: 'Bắt buộc phải nhận hàng GRN và đối soát 3 chiều trước khi thanh toán.' },
        ],
        databaseEffect: 'Cập nhật status = APPROVED trong purchase_orders. Tồn kho chưa thay đổi.',
        auditRequirement: 'Lưu điện tử timestamp duyệt đơn',
      },
      {
        stageIndex: 4,
        stateCode: 'RECEIVED',
        label: 'Nhập Kho Hàng GRN',
        moduleId: 'M17',
        moduleName: 'Inventory Core',
        actorRole: 'WAREHOUSE_CHIEF',
        engineAuthority: 'InventoryService (Single Writer)',
        transitionEvent: '3WAY_MATCH',
        description: 'Kiểm đếm số lượng thực tế tại cổng nhận hàng, ghi tăng tồn kho vật lý và tạo lớp giá vốn (Cost Layer).',
        preconditions: ['Đơn PO đã APPROVED', 'Hàng vượt qua kiểm tra ngoại quan', 'Quét mã Lô/Hạn M22 hoặc Serial M23'],
        allowedTransitions: ['MATCHED', 'RETURNED_TO_VENDOR'],
        blockedTransitions: [
          { targetState: 'COMPLETED', reason: 'Phải hoàn tất hạch toán công nợ và kế toán đối soát 3 bên.' },
        ],
        databaseEffect: 'postTransaction(RECEIPT): Tăng Physical Stock trong stock_balances; Ghi nhận stock_ledger; Tạo cost_layers FIFO/AVCO',
        auditRequirement: 'Bắt buộc lưu mã phiếu nhập GRN và người lập',
      },
      {
        stageIndex: 5,
        stateCode: 'MATCHED',
        label: 'Đối Soát 3 Chiều',
        moduleId: 'M31',
        moduleName: 'Invoices AR/AP',
        actorRole: 'ACCOUNTANT',
        engineAuthority: 'AccountingEngine',
        transitionEvent: 'CREATE_AP_INVOICE',
        description: 'Tự động so khớp 3 chứng từ: Đơn mua (PO) - Phiếu nhập (GRN) - Hóa đơn GTGT của NCC.',
        preconditions: ['GRN.quantity == PO.quantity (dung sai <= 2%)', 'Hóa đơn NCC hợp lệ trên Tổng cục Thuế'],
        allowedTransitions: ['INVOICED', 'MATCH_DISCREPANCY'],
        blockedTransitions: [
          { targetState: 'COMPLETED', reason: 'Chưa sinh hóa đơn AP và chưa làm ủy nhiệm chi ngân hàng.' },
        ],
        databaseEffect: 'Ghi matching_records với trạng thái MATCHED 100%',
        auditRequirement: 'Lưu bảng đối soát kiểm toán tài chính',
      },
      {
        stageIndex: 6,
        stateCode: 'INVOICED',
        label: 'Ghi Nhận Hóa Đơn AP',
        moduleId: 'M31',
        moduleName: 'Invoices AR/AP',
        actorRole: 'CHIEF_ACCOUNTANT',
        engineAuthority: 'AccountingEngine (Single Writer GL)',
        transitionEvent: 'PAY_AP_VENDOR',
        description: 'Ghi nhận nghĩa vụ nợ phải trả Nhà cung cấp vào Sổ cái Kế toán (TK 331).',
        preconditions: ['Kết quả đối soát 3 chiều hợp lệ', 'Mã số thuế NCC hợp lệ'],
        allowedTransitions: ['COMPLETED'],
        blockedTransitions: [
          { targetState: 'DRAFT', reason: 'Hóa đơn tài chính không được phép revert về draft khi đã ghi sổ cái.' },
        ],
        databaseEffect: 'Hạch toán Sổ cái GL: Nợ TK 156 (hoặc 152), Nợ TK 1331 (Thuế GTGT) / Có TK 331 (Phải trả NCC)',
        auditRequirement: 'Lưu số hóa đơn điện tử CQT',
      },
      {
        stageIndex: 7,
        stateCode: 'COMPLETED',
        label: 'Thanh Toán UNC Tất Toán',
        moduleId: 'M32',
        moduleName: 'Payments & Treasury',
        actorRole: 'TREASURER / CFO',
        engineAuthority: 'TreasuryService & AccountingEngine',
        transitionEvent: 'CLOSE_PO_JOURNEY',
        description: 'Xuất ủy nhiệm chi ngân hàng thanh toán nợ cho NCC, hoàn tất toàn bộ chu trình mua hàng khép kín.',
        preconditions: ['Lệnh chi tiền được CFO phê duyệt', 'Số dư tài khoản ngân hàng TK 112 đủ thanh toán'],
        allowedTransitions: [],
        blockedTransitions: [
          { targetState: 'RECEIVED', reason: 'Chu trình đã hoàn tất tất toán, không thể mở lại nhận hàng.' },
        ],
        databaseEffect: 'Hạch toán GL: Nợ TK 331 / Có TK 112. Đóng PO status = COMPLETED',
        auditRequirement: 'Lưu mã giao dịch ngân hàng điện tử',
      },
    ],
  },
  {
    id: 'O2C',
    code: 'O2C_CORE',
    name: 'Order-to-Cash (O2C)',
    vietnameseName: 'Chu Trình Bán Hàng & Thu Tiền',
    categoryLabel: 'Sales & AR',
    description: 'Quy trình thương mại chuẩn từ báo giá, duyệt đơn bán, khoanh giữ tồn kho chống bán vượt, soạn hàng, xuất kho tính giá vốn COGS, phát hành hóa đơn VAT và thu tiền.',
    defaultModuleId: 'M13',
    stages: [
      {
        stageIndex: 1,
        stateCode: 'DRAFT',
        label: 'Lập Đơn Bán SO',
        moduleId: 'M13',
        moduleName: 'Sales Orders',
        actorRole: 'SALES_OFFICER',
        engineAuthority: 'PriceResolutionService & OrchestrationEngine',
        transitionEvent: 'SUBMIT_SO',
        description: 'Tạo đơn bán hàng, tra cứu chính sách giá M41 và thông tin khách hàng M07.',
        preconditions: ['Khách hàng M07 đang Active', 'Đơn giá lấy từ Price Matrix M41'],
        allowedTransitions: ['SUBMITTED', 'CANCELLED'],
        blockedTransitions: [
          { targetState: 'RESERVED', reason: 'Không thể khoanh giữ tồn khi đơn chưa được gửi duyệt.' },
          { targetState: 'SHIPPED', reason: 'Nghiêm cấm xuất kho khi chưa có phê duyệt bán hàng.' },
        ],
        databaseEffect: 'Ghi sales_orders với status = DRAFT',
        auditRequirement: 'Lưu hash báo giá ban đầu',
      },
      {
        stageIndex: 2,
        stateCode: 'SUBMITTED',
        label: 'Kiểm Tra Tín Dụng & Duyệt',
        moduleId: 'M13',
        moduleName: 'Sales Orders',
        actorRole: 'SALES_DIR / CREDIT_CONTROLLER',
        engineAuthority: 'AuthorityManager',
        transitionEvent: 'APPROVE_SO',
        description: 'Thẩm định hạn mức tín dụng (Credit Limit) và chiết khấu đặc biệt.',
        preconditions: ['Tổng công nợ hiện tại + Đơn mới <= Hạn mức tín dụng'],
        allowedTransitions: ['APPROVED', 'REJECTED'],
        blockedTransitions: [
          { targetState: 'SHIPPED', reason: 'Chưa được phê duyệt hạn mức nợ thương mại.' },
        ],
        databaseEffect: 'Khóa sửa đổi đơn hàng, cập nhật status = SUBMITTED',
        auditRequirement: 'Lưu kết quả kiểm tra Credit Limit',
      },
      {
        stageIndex: 3,
        stateCode: 'APPROVED',
        label: 'Đã Phê Duyệt Đơn Bán',
        moduleId: 'M13',
        moduleName: 'Sales Orders',
        actorRole: 'SALES_DIR',
        engineAuthority: 'OrchestrationEngine',
        transitionEvent: 'RESERVE_STOCK',
        description: 'Đơn hàng được chấp thuận về giá và nợ, kích hoạt khoanh giữ tồn kho.',
        preconditions: ['Đã ký duyệt thương mại'],
        allowedTransitions: ['RESERVED', 'CANCELLED'],
        blockedTransitions: [
          { targetState: 'SHIPPED', reason: 'Cần khoanh giữ và soạn hàng trước khi giao vận.' },
        ],
        databaseEffect: 'status = APPROVED trong sales_orders',
        auditRequirement: 'Lưu chữ ký điện tử phê duyệt',
      },
      {
        stageIndex: 4,
        stateCode: 'RESERVED',
        label: 'Khoanh Giữ Tồn Kho',
        moduleId: 'M17',
        moduleName: 'Inventory Core',
        actorRole: 'WAREHOUSE_MGR',
        engineAuthority: 'InventoryService (Single Writer)',
        transitionEvent: 'FULFILL_ORDER',
        description: 'Khóa số lượng hàng trong kho để chống Over-selling trong lúc nhân viên soạn hàng.',
        preconditions: ['Tồn khả dụng Available >= Số lượng đặt trên đơn'],
        allowedTransitions: ['FULFILLING', 'CANCEL_RESERVATION'],
        blockedTransitions: [
          { targetState: 'COMPLETED', reason: 'Chưa thực hiện xuất kho và thu tiền khách hàng.' },
        ],
        databaseEffect: 'Available giảm, Allocated tăng; Physical không đổi. Bất biến kho được bảo vệ.',
        auditRequirement: 'Ghi ledger event ALLOCATE_RESERVATION',
      },
      {
        stageIndex: 5,
        stateCode: 'FULFILLING',
        label: 'Soạn Hàng & Đóng Gói',
        moduleId: 'M17',
        moduleName: 'Warehouse Ops',
        actorRole: 'WAREHOUSE_OPERATOR',
        engineAuthority: 'WMSExtended',
        transitionEvent: 'DISPATCH_SHIP',
        description: 'Thủ kho nhặt hàng theo danh sách Wave Pick, dán tem mã vận đơn Waybill M36.',
        preconditions: ['Đã khoanh giữ RESERVED thành công', 'In phiếu nhặt hàng picking list'],
        allowedTransitions: ['SHIPPED'],
        blockedTransitions: [
          { targetState: 'DRAFT', reason: 'Hàng đã đóng gói trên pallet không thể tùy tiện hoàn tác nháp.' },
        ],
        databaseEffect: 'Cập nhật packing_status = PACKED',
        auditRequirement: 'Lưu mã kiện hàng barcode',
      },
      {
        stageIndex: 6,
        stateCode: 'SHIPPED',
        label: 'Xuất Kho Giao Vận & COGS',
        moduleId: 'M36',
        moduleName: 'Logistics TMS',
        actorRole: 'LOGISTICS_LEAD',
        engineAuthority: 'InventoryService & CostingEngine',
        transitionEvent: 'ISSUE_INVOICE',
        description: 'Hàng rời khỏi kho vật lý, ghi giảm Physical Stock và tính giá vốn hàng bán COGS.',
        preconditions: ['Biên bản bàn giao vận tải POD có chữ ký lái xe'],
        allowedTransitions: ['INVOICED', 'DELIVERY_FAILED'],
        blockedTransitions: [
          { targetState: 'RESERVED', reason: 'Hàng đã xuất khỏi cửa kho không thể revert về trạng thái tạm giữ.' },
        ],
        databaseEffect: 'Trừ Physical Stock; Giải phóng Allocated; Hạch toán COGS: Nợ TK 632 / Có TK 156',
        auditRequirement: 'Lưu số phiếu xuất kho và chữ ký số vận đơn',
      },
      {
        stageIndex: 7,
        stateCode: 'INVOICED',
        label: 'Phát Hành Hóa Đơn AR',
        moduleId: 'M31',
        moduleName: 'Invoices AR/AP',
        actorRole: 'ACCOUNTANT',
        engineAuthority: 'AccountingEngine (Single Writer GL)',
        transitionEvent: 'COLLECT_PAYMENT',
        description: 'Phát hành hóa đơn điện tử GTGT hợp pháp và ghi nhận công nợ phải thu (TK 131).',
        preconditions: ['Biên bản giao hàng POD hoàn tất', 'Thông tin thuế khách hàng chính xác'],
        allowedTransitions: ['COMPLETED'],
        blockedTransitions: [
          { targetState: 'DRAFT', reason: 'Hóa đơn đã ký số cơ quan thuế không được phép xóa.' },
        ],
        databaseEffect: 'Hạch toán GL: Nợ TK 131 / Có TK 511, Có TK 3331 (Thuế GTGT phải nộp)',
        auditRequirement: 'Lưu mã tra cứu hóa đơn điện tử',
      },
      {
        stageIndex: 8,
        stateCode: 'COMPLETED',
        label: 'Thu Tiền Tất Toán',
        moduleId: 'M32',
        moduleName: 'Payments & Treasury',
        actorRole: 'TREASURER',
        engineAuthority: 'TreasuryService & AccountingEngine',
        transitionEvent: 'CLOSE_O2C_JOURNEY',
        description: 'Nhận thanh toán qua VietQR/Ngân hàng, cấn trừ công nợ phải thu về 0.',
        preconditions: ['Báo có ngân hàng hoặc phiếu thu tiền mặt'],
        allowedTransitions: [],
        blockedTransitions: [
          { targetState: 'SHIPPED', reason: 'Đơn hàng đã thanh toán xong không được sửa trạng thái giao nhận.' },
        ],
        databaseEffect: 'Hạch toán GL: Nợ TK 112 (hoặc 111) / Có TK 131. Dư nợ đơn = 0',
        auditRequirement: 'Lưu mã đối soát thanh toán điện tử',
      },
    ],
  },
  {
    id: 'INVENTORY',
    code: 'INV_CORE',
    name: 'Stocktake & Adjustment',
    vietnameseName: 'Kiểm Kê Đếm Mù & Bù Trừ Tồn Kho',
    categoryLabel: 'Inventory Integrity',
    description: 'Quy trình kiểm kê khách quan nhằm bảo vệ tính toàn vẹn tồn kho: Niêm phong kho -> Đếm mù che giấu số liệu sổ sách -> Tính chênh lệch -> CFO duyệt phiếu M20 -> Single Writer cập nhật sổ cái kho.',
    defaultModuleId: 'M19',
    stages: [
      {
        stageIndex: 1,
        stateCode: 'PLANNING',
        label: 'Lập Kế Hoạch Niêm Phong',
        moduleId: 'M19',
        moduleName: 'Stocktake M19',
        actorRole: 'WAREHOUSE_MGR',
        engineAuthority: 'InventoryService',
        transitionEvent: 'START_BLIND_COUNT',
        description: 'Xác định phạm vi khu vực kiểm kê và tạm khóa xuất nhập kho đối với SKU liên quan.',
        preconditions: ['Thông báo trước cho các bộ phận bán hàng và sản xuất'],
        allowedTransitions: ['COUNTING', 'CANCELLED'],
        blockedTransitions: [
          { targetState: 'APPROVED', reason: 'Không thể duyệt điều chỉnh khi chưa tiến hành kiểm đếm.' },
        ],
        databaseEffect: 'Ghi bản ghi stocktakes status = PLANNING, gán cờ freeze_transactions',
        auditRequirement: 'Lưu thời điểm niêm phong kho',
      },
      {
        stageIndex: 2,
        stateCode: 'COUNTING',
        label: 'Tiến Hành Đếm Mù (Blind Count)',
        moduleId: 'M19',
        moduleName: 'Stocktake M19',
        actorRole: 'WAREHOUSE_OPERATOR',
        engineAuthority: 'InventoryService',
        transitionEvent: 'SUBMIT_VARIANCE',
        description: 'Tổ kiểm kê độc lập đếm thực tế trên kệ, hệ thống hoàn toàn giấu cột số lượng tồn trên sổ.',
        preconditions: ['Nhân viên đếm chéo độc lập với thủ kho phụ trách khu vực'],
        allowedTransitions: ['VARIANCE_DETECTED'],
        blockedTransitions: [
          { targetState: 'POSTED', reason: 'Phải đối chiếu chênh lệch và có phê duyệt cấp cao trước khi ghi sổ.' },
        ],
        databaseEffect: 'Ghi bản ghi stocktake_counts với actual_qty',
        auditRequirement: 'Lưu chữ ký kiểm đếm viên',
      },
      {
        stageIndex: 3,
        stateCode: 'VARIANCE_DETECTED',
        label: 'Chốt Số Liệu & Tính Lệch',
        moduleId: 'M19',
        moduleName: 'Stocktake M19',
        actorRole: 'WAREHOUSE_CHIEF',
        engineAuthority: 'InventoryService',
        transitionEvent: 'CREATE_M20_ADJUSTMENT',
        description: 'Hệ thống tự động so khớp: Variance = Actual - System. Nếu có lệch, phát sinh yêu cầu lập phiếu M20.',
        preconditions: ['100% SKU trong danh mục kiểm kê đã nhập kết quả đếm'],
        allowedTransitions: ['PENDING_APPROVAL'],
        blockedTransitions: [
          { targetState: 'POSTED', reason: 'Phiếu điều chỉnh bắt buộc phải qua phê duyệt thẩm quyền (Rule #19).' },
        ],
        databaseEffect: 'Cập nhật variance_qty trong bảng stocktake_items',
        auditRequirement: 'Lưu báo cáo kiểm kê chênh lệch tổng hợp',
      },
      {
        stageIndex: 4,
        stateCode: 'PENDING_APPROVAL',
        label: 'Lập Phiếu Điều Chỉnh M20',
        moduleId: 'M20',
        moduleName: 'Stock Adjustment',
        actorRole: 'ACCOUNTANT',
        engineAuthority: 'AuthorityManager',
        transitionEvent: 'APPROVE_ADJUSTMENT',
        description: 'Lập phiếu M20 giải trình nguyên nhân (hao hụt, hỏng hóc, chênh lệch nhập xuất) gửi CFO.',
        preconditions: ['Đầy đủ biên bản giải trình và kết luận hội đồng kiểm kê'],
        allowedTransitions: ['APPROVED', 'REJECTED'],
        blockedTransitions: [
          { targetState: 'POSTED', reason: 'Chưa có chữ ký phê duyệt của CFO.' },
        ],
        databaseEffect: 'Ghi stock_adjustments status = PENDING_APPROVAL',
        auditRequirement: 'Lưu hồ sơ giải trình sai lệch',
      },
      {
        stageIndex: 5,
        stateCode: 'APPROVED',
        label: 'Phê Duyệt Thẩm Quyền CFO',
        moduleId: 'M20',
        moduleName: 'Stock Adjustment',
        actorRole: 'CFO / PLANT_MGR',
        engineAuthority: 'AuthorityManager',
        transitionEvent: 'POST_LEDGER',
        description: 'Cấp thẩm quyền tài chính tối cao chấp thuận bù trừ chênh lệch tồn kho.',
        preconditions: ['Quyền CFO hoặc Super Admin', 'Hạn mức điều chỉnh nằm trong thẩm quyền'],
        allowedTransitions: ['POSTED'],
        blockedTransitions: [
          { targetState: 'PLANNING', reason: 'Phiếu đã duyệt không thể quay lại lập kế hoạch.' },
        ],
        databaseEffect: 'Cập nhật status = APPROVED trong stock_adjustments',
        auditRequirement: 'Bắt buộc lưu chữ ký số thẩm quyền của CFO',
      },
      {
        stageIndex: 6,
        stateCode: 'POSTED',
        label: 'Ghi Sổ Cái Kho & GL Kế Toán',
        moduleId: 'M20',
        moduleName: 'Stock Adjustment',
        actorRole: 'CHIEF_ACCOUNTANT',
        engineAuthority: 'InventoryService & AccountingEngine',
        transitionEvent: 'CLOSE_ADJUSTMENT_CYCLE',
        description: 'InventoryService ghi sổ kho đưa tồn về số thực tế; Accounting hạch toán tài khoản 1381/3381.',
        preconditions: ['Chữ ký số hợp lệ của CFO'],
        allowedTransitions: [],
        blockedTransitions: [
          { targetState: 'PENDING_APPROVAL', reason: 'Sổ cái kho là bất biến, đã ghi không thể sửa đổi.' },
        ],
        databaseEffect: 'postTransaction(ADJUSTMENT): Ghi stock_ledger; Hạch toán GL Nợ 1381 / Có 156 (hoặc ngược lại)',
        auditRequirement: 'Ghi Audit Trail SHA-256 điều chỉnh kho',
      },
    ],
  },
  {
    id: 'RETURNS',
    code: 'RMA_CORE',
    name: 'Customer Returns (RMA)',
    vietnameseName: 'Đổi Trả Hàng & Thu Hồi Sản Phẩm',
    categoryLabel: 'After-Sales & RMA',
    description: 'Quy trình tiếp nhận xử lý khiếu nại khách hàng, kiểm định kỹ thuật QC độc lập, phê duyệt phương án (đổi mới, hoàn tiền hoặc sửa chữa), tái nhập kho và xuất Credit Note.',
    defaultModuleId: 'M15',
    stages: [
      {
        stageIndex: 1,
        stateCode: 'DRAFT',
        label: 'Tiếp Nhận Đơn RMA',
        moduleId: 'M15',
        moduleName: 'Returns & RMA',
        actorRole: 'OPERATOR',
        engineAuthority: 'OrchestrationEngine',
        transitionEvent: 'RECEIVE_RMA_PHYSICAL',
        description: 'Tiếp nhận thông tin đổi trả từ khách hàng, đối chiếu mã đơn SO gốc.',
        preconditions: ['Mã đơn hàng SO gốc hợp lệ', 'Sản phẩm còn trong thời hạn bảo hành/đổi trả'],
        allowedTransitions: ['RECEIVED', 'CANCELLED'],
        blockedTransitions: [
          { targetState: 'REFUNDED', reason: 'Chưa nhận hàng vật lý và chưa kiểm định QC.' },
        ],
        databaseEffect: 'Ghi rma_records status = DRAFT',
        auditRequirement: 'Lưu lý do trả hàng ban đầu của khách',
      },
      {
        stageIndex: 2,
        stateCode: 'RECEIVED',
        label: 'Tiếp Nhận Tại Cổng Kho',
        moduleId: 'M15',
        moduleName: 'Returns & RMA',
        actorRole: 'WAREHOUSE_OPERATOR',
        engineAuthority: 'InventoryService',
        transitionEvent: 'INSPECT_QC',
        description: 'Nhận kiện hàng thực tế tại khu vực kiểm định RMA, dán tem mã theo dõi.',
        preconditions: ['Hàng thực tế đã có mặt tại kho tiếp nhận'],
        allowedTransitions: ['INSPECTED'],
        blockedTransitions: [
          { targetState: 'REFUNDED', reason: 'Bắt buộc phải có kết luận kiểm định QC trước khi giải quyết.' },
        ],
        databaseEffect: 'Cập nhật status = RECEIVED, lưu vị trí lưu tạm khu RMA',
        auditRequirement: 'Ghi nhận thời điểm nhận hàng vật lý',
      },
      {
        stageIndex: 3,
        stateCode: 'INSPECTED',
        label: 'Kiểm Định Chất Lượng QC',
        moduleId: 'M39',
        moduleName: 'Quality Control',
        actorRole: 'QC_INSPECTOR',
        engineAuthority: 'QualityControlService',
        transitionEvent: 'APPROVE_DISPOSITION',
        description: 'Đánh giá mức độ hư hỏng (lỗi do nhà sản xuất vs lỗi người dùng) và đề xuất phương án.',
        preconditions: ['Kỹ thuật viên QC hoàn tất kiểm tra chức năng'],
        allowedTransitions: ['APPROVED', 'REJECTED'],
        blockedTransitions: [
          { targetState: 'REFUNDED', reason: 'Cần phê duyệt phương án xử lý của Quản lý.' },
        ],
        databaseEffect: 'Ghi biên bản kiểm định qc_inspection_reports',
        auditRequirement: 'Lưu ảnh chụp ngoại quan và kết quả đo lường',
      },
      {
        stageIndex: 4,
        stateCode: 'APPROVED',
        label: 'Duyệt Phương Án Xử Lý',
        moduleId: 'M15',
        moduleName: 'Returns & RMA',
        actorRole: 'WAREHOUSE_MGR / SALES_MGR',
        engineAuthority: 'AuthorityManager',
        transitionEvent: 'POST_RETURN_AND_CREDIT',
        description: 'Chấp thuận phương án: Đổi sản phẩm mới, Hoàn tiền Credit Note hoặc Hủy phế.',
        preconditions: ['Kết luận kiểm định QC Đạt tiêu chuẩn đổi trả'],
        allowedTransitions: ['REFUNDED'],
        blockedTransitions: [
          { targetState: 'DRAFT', reason: 'Phương án đã duyệt không được đảo ngược.' },
        ],
        databaseEffect: 'Cập nhật disposition = REFUND_AND_RESTOCK',
        auditRequirement: 'Lưu quyết định phê duyệt xử lý RMA',
      },
      {
        stageIndex: 5,
        stateCode: 'REFUNDED',
        label: 'Nhập Kho & Xuất Credit Note',
        moduleId: 'M31',
        moduleName: 'Invoices & Credit Notes',
        actorRole: 'ACCOUNTANT',
        engineAuthority: 'InventoryService & AccountingEngine',
        transitionEvent: 'CLOSE_RMA_JOURNEY',
        description: 'InventoryService ghi nhận hàng nhập kho trở lại; Kế toán xuất hóa đơn điều chỉnh giảm Credit Note.',
        preconditions: ['Duyệt phương án hoàn tất'],
        allowedTransitions: [],
        blockedTransitions: [
          { targetState: 'RECEIVED', reason: 'Chu trình RMA đã tất toán tài chính.' },
        ],
        databaseEffect: 'Tái nhập kho: postTransaction(RETURN); GL: Nợ TK 521, Nợ TK 3331 / Có TK 131',
        auditRequirement: 'Lưu mã hóa đơn điều chỉnh giảm theo Thông tư 78',
      },
    ],
  },
  {
    id: 'MANUFACTURING',
    code: 'MFG_CORE',
    name: 'Manufacturing & MES',
    vietnameseName: 'Lệnh Sản Xuất & Chế Tạo',
    categoryLabel: 'Production & MES',
    description: 'Từ thiết kế định mức vật tư BOM, phát hành Lệnh sản xuất MO, xuất kho nguyên vật liệu, điều độ dây chuyền gia công, nghiệm thu kiểm định OQC đến nhập kho thành phẩm.',
    defaultModuleId: 'M25',
    stages: [
      {
        stageIndex: 1,
        stateCode: 'DRAFT',
        label: 'Định Mức BOM & Lập MO',
        moduleId: 'M25',
        moduleName: 'Manufacturing & BOM',
        actorRole: 'PRODUCTION_PLANNER',
        engineAuthority: 'ManufacturingService',
        transitionEvent: 'RELEASE_MO',
        description: 'Xác định số lượng thành phẩm cần sản xuất và tra cứu định mức nguyên vật liệu BOM.',
        preconditions: ['Định mức BOM đang ở trạng thái ACTIVE', 'Mã thành phẩm hợp lệ trong M06'],
        allowedTransitions: ['RELEASED', 'CANCELLED'],
        blockedTransitions: [
          { targetState: 'ISSUED', reason: 'Phải phát lệnh sản xuất chính thức trước khi xuất vật tư.' },
        ],
        databaseEffect: 'Ghi manufacturing_orders với status = DRAFT',
        auditRequirement: 'Lưu phiên bản định mức BOM áp dụng',
      },
      {
        stageIndex: 2,
        stateCode: 'RELEASED',
        label: 'Phát Lệnh Sản Xuất MO',
        moduleId: 'M25',
        moduleName: 'Manufacturing & BOM',
        actorRole: 'PLANT_MGR',
        engineAuthority: 'ManufacturingService',
        transitionEvent: 'ISSUE_MATERIALS',
        description: 'Ban hành lệnh sản xuất chính thức xuống xưởng, sẵn sàng nhận vật tư.',
        preconditions: ['Kế hoạch sản xuất tuần được duyệt', 'Dây chuyền máy móc sẵn sàng'],
        allowedTransitions: ['ISSUED', 'CANCELLED'],
        blockedTransitions: [
          { targetState: 'COMPLETED', reason: 'Chưa tiến hành sản xuất và chưa có thành phẩm.' },
        ],
        databaseEffect: 'Cập nhật status = RELEASED trong manufacturing_orders',
        auditRequirement: 'Lưu lệnh phát hành sản xuất có chữ ký Quản đốc',
      },
      {
        stageIndex: 3,
        stateCode: 'ISSUED',
        label: 'Xuất Nguyên Vật Liệu',
        moduleId: 'M17',
        moduleName: 'Inventory Core',
        actorRole: 'WAREHOUSE_OPERATOR',
        engineAuthority: 'InventoryService (Single Writer)',
        transitionEvent: 'START_PRODUCTION',
        description: 'Thủ kho xuất kho NVL theo định mức BOM bàn giao cho tổ trưởng dây chuyền.',
        preconditions: ['Tồn kho nguyên vật liệu đủ đáp ứng định mức BOM'],
        allowedTransitions: ['IN_PRODUCTION'],
        blockedTransitions: [
          { targetState: 'COMPLETED', reason: 'Chưa thực hiện lắp ráp và kiểm tra OQC.' },
        ],
        databaseEffect: 'postTransaction(ISSUE): Giảm tồn NVL; Hạch toán GL Nợ TK 154 (Chi phí SX dở dang) / Có TK 152',
        auditRequirement: 'Lưu số phiếu xuất kho nguyên liệu sản xuất',
      },
      {
        stageIndex: 4,
        stateCode: 'IN_PRODUCTION',
        label: 'Gia Công Dây Chuyền',
        moduleId: 'M25',
        moduleName: 'Manufacturing & BOM',
        actorRole: 'LINE_SUPERVISOR',
        engineAuthority: 'ManufacturingService',
        transitionEvent: 'INSPECT_OQC',
        description: 'Vận hành máy móc, ghi nhận giờ công nhân và hoàn thành lắp ráp sản phẩm.',
        preconditions: ['NVL đã có mặt tại trạm sản xuất'],
        allowedTransitions: ['QC_PASSED', 'QC_FAILED'],
        blockedTransitions: [
          { targetState: 'COMPLETED', reason: 'Bắt buộc qua kiểm định OQC trước khi nhập kho thành phẩm.' },
        ],
        databaseEffect: 'Ghi nhận nhật ký máy và chi phí nhân công trực tiếp',
        auditRequirement: 'Lưu log ca máy',
      },
      {
        stageIndex: 5,
        stateCode: 'QC_PASSED',
        label: 'Nghiệm Thu Kiểm Tra OQC',
        moduleId: 'M39',
        moduleName: 'Quality Control',
        actorRole: 'QC_INSPECTOR',
        engineAuthority: 'QualityControlService',
        transitionEvent: 'RECEIVE_FINISHED_GOODS',
        description: 'Kiểm tra thông số kỹ thuật và độ an toàn của lô thành phẩm, dán tem QC Pass.',
        preconditions: ['Lô sản phẩm hoàn tất gia công', 'Tỷ lệ lỗi nằm trong dung sai cho phép'],
        allowedTransitions: ['COMPLETED'],
        blockedTransitions: [
          { targetState: 'DRAFT', reason: 'Lô hàng đã nghiệm thu không thể hủy lệnh.' },
        ],
        databaseEffect: 'Ghi chứng nhận oqc_pass_certificates',
        auditRequirement: 'Lưu phiếu nghiệm thu kiểm tra xuất xưởng',
      },
      {
        stageIndex: 6,
        stateCode: 'COMPLETED',
        label: 'Nhập Kho Thành Phẩm',
        moduleId: 'M17',
        moduleName: 'Inventory Core',
        actorRole: 'WAREHOUSE_CHIEF',
        engineAuthority: 'InventoryService & CostingEngine',
        transitionEvent: 'CLOSE_MO_CYCLE',
        description: 'InventoryService nhập kho thành phẩm vào kho lưu trữ, kết chuyển giá thành sản xuất.',
        preconditions: ['Biên bản nghiệm thu QC Pass có chữ ký của KCS'],
        allowedTransitions: [],
        blockedTransitions: [
          { targetState: 'ISSUED', reason: 'Lệnh sản xuất đã đóng hoàn tất.' },
        ],
        databaseEffect: 'postTransaction(RECEIPT): Tăng Physical Stock thành phẩm; GL Nợ TK 155 / Có TK 154',
        auditRequirement: 'Ghi phiếu nhập kho thành phẩm và thẻ kho',
      },
    ],
  },
];

// =========================================================================
// 2. WORKFLOW VISUALIZER COMPONENT (Pure Vector Non-Interactive SVG Timeline)
// =========================================================================

interface WorkflowVisualizerProps {
  currentModuleId?: string;
  initialProcessId?: 'P2P' | 'O2C' | 'INVENTORY' | 'RETURNS' | 'MANUFACTURING';
  userRole?: string;
  className?: string;
  onNavigateToModule?: (moduleId: string) => void;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  currentModuleId = 'M08',
  initialProcessId,
  userRole = 'ADMIN',
  className = '',
  onNavigateToModule,
}) => {
  // Determine process based on module ID or initial prop
  const detectedProcessId = useMemo<'P2P' | 'O2C' | 'INVENTORY' | 'RETURNS' | 'MANUFACTURING'>(() => {
    if (initialProcessId) return initialProcessId;
    if (['M08', 'M09', 'M10', 'M32'].includes(currentModuleId)) return 'P2P';
    if (['M13', 'M14', 'M36', 'M41'].includes(currentModuleId)) return 'O2C';
    if (['M19', 'M20'].includes(currentModuleId)) return 'INVENTORY';
    if (['M15', 'M39'].includes(currentModuleId)) return 'RETURNS';
    if (['M25', 'M26', 'M27'].includes(currentModuleId)) return 'MANUFACTURING';
    if (['M17', 'M18', 'M31'].includes(currentModuleId)) return 'P2P'; // High frequency cross-module default
    return 'P2P';
  }, [currentModuleId, initialProcessId]);

  const [selectedProcessId, setSelectedProcessId] = useState<'P2P' | 'O2C' | 'INVENTORY' | 'RETURNS' | 'MANUFACTURING'>(detectedProcessId);

  const activeProcess: BusinessProcessDefinition = useMemo(() => {
    return BUSINESS_PROCESS_STATE_MACHINES.find((p) => p.id === selectedProcessId) || BUSINESS_PROCESS_STATE_MACHINES[0];
  }, [selectedProcessId]);

  // Determine stage based on currentModuleId within the active process
  const defaultStageIndex = useMemo<number>(() => {
    const matched = activeProcess.stages.find((s) => s.moduleId === currentModuleId);
    if (matched) return matched.stageIndex;
    // Sensible middle stage highlighting for inspection
    if (activeProcess.id === 'P2P') return 4; // RECEIVED (Nhập Kho GRN)
    if (activeProcess.id === 'O2C') return 4; // RESERVED (Khoanh Giữ Tồn Kho)
    if (activeProcess.id === 'INVENTORY') return 3; // VARIANCE_DETECTED
    if (activeProcess.id === 'RETURNS') return 3; // INSPECTED
    if (activeProcess.id === 'MANUFACTURING') return 3; // ISSUED
    return 1;
  }, [activeProcess, currentModuleId]);

  const [currentStageIndex, setCurrentStageIndex] = useState<number>(defaultStageIndex);

  // Sync stage if active process changes
  const handleSelectProcess = (pId: 'P2P' | 'O2C' | 'INVENTORY' | 'RETURNS' | 'MANUFACTURING') => {
    setSelectedProcessId(pId);
    const proc = BUSINESS_PROCESS_STATE_MACHINES.find((p) => p.id === pId);
    if (proc) {
      const match = proc.stages.find((s) => s.moduleId === currentModuleId);
      if (match) setCurrentStageIndex(match.stageIndex);
      else {
        // Pick prominent middle stage
        const mid = Math.min(Math.max(3, Math.ceil(proc.stages.length / 2)), proc.stages.length);
        setCurrentStageIndex(mid);
      }
    }
  };

  const activeStage = useMemo(() => {
    return activeProcess.stages.find((s) => s.stageIndex === currentStageIndex) || activeProcess.stages[0];
  }, [activeProcess, currentStageIndex]);

  // Math coordinates for non-interactive SVG timeline
  const svgWidth = 1060;
  const svgHeight = 240;
  const totalStages = activeProcess.stages.length;
  const startX = 80;
  const endX = svgWidth - 80;
  const stepX = (endX - startX) / (totalStages - 1);
  const centerY = 115;

  return (
    <div
      id="workflow-visualizer-container"
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
            <Workflow className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Workflow Visualizer
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                Sơ Đồ Tiến Trình Nghiệp Vụ Vector SVG
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              {activeProcess.name} — {activeProcess.vietnameseName}
            </h3>
          </div>
        </div>

        {/* Process Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {BUSINESS_PROCESS_STATE_MACHINES.map((proc) => {
            const isSelected = proc.id === selectedProcessId;
            return (
              <button
                key={proc.id}
                type="button"
                onClick={() => handleSelectProcess(proc.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-800/80 dark:bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {proc.code.replace('_CORE', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description & Stage State Selector Controls */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          {activeProcess.description}
        </p>

        {/* Stage Highlight Simulator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            Giai Đoạn Mô Phỏng:
          </span>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 shadow-2xs">
            {activeProcess.stages.map((stg) => {
              const isSelected = stg.stageIndex === currentStageIndex;
              return (
                <button
                  key={stg.stageIndex}
                  type="button"
                  onClick={() => setCurrentStageIndex(stg.stageIndex)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title={`${stg.stageIndex}. ${stg.label} (${stg.stateCode})`}
                >
                  {stg.stageIndex}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              const match = activeProcess.stages.find((s) => s.moduleId === currentModuleId);
              if (match) setCurrentStageIndex(match.stageIndex);
            }}
            className="px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors cursor-pointer"
            title="Tự động nhảy về giai đoạn khớp với phân hệ bạn đang đứng"
          >
            Khớp Phân Hệ ({currentModuleId})
          </button>
        </div>
      </div>

      {/* NON-INTERACTIVE SVG TIMELINE CANVAS */}
      <div className="p-4 bg-slate-900/5 dark:bg-slate-950/40 flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="min-w-[980px] w-full max-w-5xl py-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none overflow-visible"
            role="img"
            aria-label={`Sơ đồ tiến trình ${activeProcess.name} với giai đoạn hiện tại là ${activeStage.label}`}
          >
            {/* SVG Definitions */}
            <defs>
              {/* Arrow markers for stage transitions */}
              <marker
                id="arrow-completed"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>

              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb" />
              </marker>

              <marker
                id="arrow-upcoming"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
              </marker>

              {/* Radial glow for the active user stage */}
              <radialGradient id="activeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>

              {/* Linear gradient for completed bar */}
              <linearGradient id="completedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>

              {/* Subtle drop shadow filter for active badge */}
              <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" floodColor="#0f172a" />
              </filter>
            </defs>

            {/* Background subtle timeline track */}
            <line
              x1={startX}
              y1={centerY}
              x2={endX}
              y2={centerY}
              stroke="#e2e8f0"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Connecting transition lines between sequential stages */}
            {activeProcess.stages.slice(0, -1).map((stg, i) => {
              const x1 = startX + i * stepX;
              const x2 = startX + (i + 1) * stepX;
              const isPast = stg.stageIndex < currentStageIndex;
              const isCurrentlyTransitioning = stg.stageIndex === currentStageIndex;

              let strokeColor = '#cbd5e1';
              let strokeWidth = 2.5;
              let strokeDash = '5,4';
              let marker = 'url(#arrow-upcoming)';

              if (isPast) {
                strokeColor = '#10b981';
                strokeWidth = 4;
                strokeDash = 'none';
                marker = 'url(#arrow-completed)';
              } else if (isCurrentlyTransitioning) {
                strokeColor = '#3b82f6';
                strokeWidth = 3;
                strokeDash = '6,4';
                marker = 'url(#arrow-active)';
              }

              // Event trigger label at midpoint
              const midX = (x1 + x2) / 2;
              const labelY = centerY - 14;

              return (
                <g key={`transition-${stg.stageIndex}`}>
                  {/* Transition line */}
                  <line
                    x1={x1 + 24}
                    y1={centerY}
                    x2={x2 - 24}
                    y2={centerY}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    markerEnd={marker}
                  />

                  {/* Transition event text pill */}
                  <g transform={`translate(${midX}, ${labelY})`}>
                    <rect
                      x="-44"
                      y="-9"
                      width="88"
                      height="18"
                      rx="5"
                      fill={isPast ? '#ecfdf5' : isCurrentlyTransitioning ? '#eff6ff' : '#f8fafc'}
                      stroke={isPast ? '#a7f3d0' : isCurrentlyTransitioning ? '#bfdbfe' : '#e2e8f0'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isPast ? '#065f46' : isCurrentlyTransitioning ? '#1d4ed8' : '#64748b'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {stg.transitionEvent}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Render Nodes for each stage */}
            {activeProcess.stages.map((stg, i) => {
              const nodeX = startX + i * stepX;
              const isCompleted = stg.stageIndex < currentStageIndex;
              const isCurrent = stg.stageIndex === currentStageIndex;
              const isUpcoming = stg.stageIndex > currentStageIndex;

              return (
                <g key={`node-${stg.stageIndex}`} transform={`translate(${nodeX}, ${centerY})`}>
                  {/* Current stage pulsing outer halo */}
                  {isCurrent && (
                    <>
                      <circle cx="0" cy="0" r="40" fill="url(#activeGlow)" />
                      <circle
                        cx="0"
                        cy="0"
                        r="32"
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="1.5"
                        strokeDasharray="4,2"
                      />
                    </>
                  )}

                  {/* Node Circle */}
                  {isCompleted && (
                    <circle
                      cx="0"
                      cy="0"
                      r="20"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="3"
                      filter="drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))"
                    />
                  )}

                  {isCurrent && (
                    <circle
                      cx="0"
                      cy="0"
                      r="24"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="3.5"
                      filter="drop-shadow(0 4px 6px rgba(37, 99, 235, 0.4))"
                    />
                  )}

                  {isUpcoming && (
                    <circle
                      cx="0"
                      cy="0"
                      r="18"
                      fill="#ffffff"
                      stroke="#cbd5e1"
                      strokeWidth="2.5"
                    />
                  )}

                  {/* Node Center Icon / Number */}
                  {isCompleted && (
                    <path
                      d="M -5 0 L -1 4 L 6 -3"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {isCurrent && (
                    <circle cx="0" cy="0" r="7" fill="#ffffff" />
                  )}

                  {isUpcoming && (
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {String(stg.stageIndex).padStart(2, '0')}
                    </text>
                  )}

                  {/* TOP BADGE: CURRENT STAGE POINTER OR STATE CODE */}
                  {isCurrent ? (
                    <g transform="translate(0, -48)" filter="url(#badgeShadow)">
                      {/* Pointer flag */}
                      <rect
                        x="-62"
                        y="-12"
                        width="124"
                        height="24"
                        rx="8"
                        fill="#1e3a8a"
                        stroke="#60a5fa"
                        strokeWidth="1.5"
                      />
                      {/* Downward pin triangle */}
                      <path d="M -5 12 L 0 17 L 5 12 Z" fill="#1e3a8a" />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        BƯỚC HIỆN TẠI (STAGE {stg.stageIndex})
                      </text>
                    </g>
                  ) : (
                    <g transform="translate(0, -32)">
                      <rect
                        x="-36"
                        y="-9"
                        width="72"
                        height="18"
                        rx="4"
                        fill={isCompleted ? '#ecfdf5' : '#f8fafc'}
                        stroke={isCompleted ? '#a7f3d0' : '#e2e8f0'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill={isCompleted ? '#065f46' : '#64748b'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {stg.stateCode}
                      </text>
                    </g>
                  )}

                  {/* BOTTOM LABELS: Stage Name, Module, and Single Writer Engine */}
                  <g transform="translate(0, 36)">
                    {/* Stage Label */}
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={isCurrent ? '#1e3a8a' : isCompleted ? '#0f172a' : '#475569'}
                      fontSize={isCurrent ? '12' : '11'}
                      fontWeight={isCurrent ? 'bold' : '600'}
                      fontFamily="sans-serif"
                    >
                      {stg.label}
                    </text>

                    {/* Module Tag */}
                    <g transform="translate(0, 16)">
                      <rect
                        x="-28"
                        y="-8"
                        width="56"
                        height="16"
                        rx="4"
                        fill={isCurrent ? '#dbeafe' : isCompleted ? '#f0fdf4' : '#f1f5f9'}
                        stroke={isCurrent ? '#93c5fd' : isCompleted ? '#bbf7d0' : '#e2e8f0'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill={isCurrent ? '#1e40af' : isCompleted ? '#166534' : '#64748b'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {stg.moduleId}
                      </text>
                    </g>

                    {/* Authority snippet */}
                    <text
                      x="0"
                      y="38"
                      textAnchor="middle"
                      fill={isCurrent ? '#2563eb' : '#94a3b8'}
                      fontSize="9"
                      fontWeight="500"
                      fontFamily="monospace"
                    >
                      {stg.actorRole.split(' ')[0]}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* SVG Timeline Legend Strip */}
      <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Đã hoàn thành (Recorded in Ledger)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-blue-700 inline-block shrink-0" />
            <span className="text-slate-900 dark:text-white font-bold">Giai đoạn hiện tại (Active State Authority)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white dark:bg-slate-800 border-2 border-dashed border-slate-400 dark:border-slate-600 inline-block shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Giai đoạn tiếp theo (Upcoming / Blocked)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>Non-interactive SVG Timeline (Deterministic State Machine)</span>
        </div>
      </div>

      {/* STATE MACHINE CONTRACT DRILLDOWN: Inspecting Current Highlighted Stage */}
      <div className="p-5 bg-slate-50/70 dark:bg-slate-900 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-2xs">
              {activeStage.stageIndex}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeStage.label}
                </h4>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  STATE: {activeStage.stateCode}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeStage.moduleId} - {activeStage.moduleName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeStage.description}
              </p>
            </div>
          </div>

          {onNavigateToModule && (
            <button
              type="button"
              onClick={() => onNavigateToModule(activeStage.moduleId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <span>Mở Phân Hệ {activeStage.moduleId}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 Architectural Columns based on State Machine */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Box 1: Single Writer & Authority */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-white font-bold mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Thẩm Quyền Đơn Ghi (Single Writer)</span>
            </div>
            <div className="space-y-1.5 text-slate-600 dark:text-slate-300 flex-1">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Domain Service:</span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-[11px]">{activeStage.engineAuthority}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Vai trò thực hiện:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeStage.actorRole}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Sự kiện kích hoạt:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{activeStage.transitionEvent}</span>
              </div>
            </div>
          </div>

          {/* Box 2: Preconditions */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-white font-bold mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Điều Kiện Tiên Quyết (Preconditions)</span>
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 flex-1 list-disc list-inside">
              {activeStage.preconditions.map((p, idx) => (
                <li key={idx} className="leading-snug">{p}</li>
              ))}
            </ul>
          </div>

          {/* Box 3: State Transitions (Allowed & Blocked) */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-white font-bold mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Quy Tắc Chuyển Trạng Thái</span>
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider block">
                  Được phép chuyển đến:
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {activeStage.allowedTransitions.length > 0 ? (
                    activeStage.allowedTransitions.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Trạng thái kết thúc (Terminal)</span>
                  )}
                </div>
              </div>

              {activeStage.blockedTransitions.length > 0 && (
                <div>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold tracking-wider block">
                    Bị chặn & Lý do bất biến:
                  </span>
                  <div className="space-y-1 mt-0.5">
                    {activeStage.blockedTransitions.map((b, idx) => (
                      <div key={idx} className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                        <span className="font-mono font-bold text-rose-700 dark:text-rose-400">🚫 {b.targetState}:</span> {b.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Box 4: Database Effect & Audit */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-white font-bold mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tác Động Cơ Sở Dữ Liệu</span>
            </div>
            <div className="space-y-1.5 text-slate-600 dark:text-slate-300 flex-1">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Hạch toán & Sổ cái:</span>
                <p className="text-[11px] font-mono text-slate-800 dark:text-slate-200 leading-snug">{activeStage.databaseEffect}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kiểm toán Audit:</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">{activeStage.auditRequirement}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
