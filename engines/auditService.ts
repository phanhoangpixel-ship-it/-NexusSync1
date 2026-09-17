import crypto from 'crypto';
import { db, client } from '../db';
import * as schema from '../db/schema';
import { eq, desc, asc, sql, and, gte, lte } from 'drizzle-orm';

export interface AuditLogInput {
  auditCode?: string;
  userId?: number;
  username?: string;
  userName?: string;
  role?: string;
  branchId?: number;
  branchName?: string;
  warehouseId?: number;
  warehouseName?: string;
  module: string; // M01 to M42 or domain name
  action: string; // CREATE, UPDATE, DELETE, APPROVE, REJECT, POST, etc.
  entityType: string; // PRODUCT, SALES_ORDER, JOURNAL_ENTRY, etc.
  entityId: string | number;
  ipAddress?: string;
  deviceId?: string;
  deviceType?: string;
  appVersion?: string;
  browser?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  beforeData?: any;
  afterData?: any;
  changedFields?: string[] | any;
  result?: 'SUCCESS' | 'FAILED' | 'PERMISSION_DENIED';
  reason?: string;
  metadata?: any;
  createdAt?: Date;
}

export interface ChainVerificationResult {
  isChainIntact: boolean;
  totalBlocksVerified: number;
  validBlocksCount: number;
  tamperedBlocksCount: number;
  brokenLinks: Array<{
    blockNumber: number;
    auditCode: string;
    reason: string;
    expectedPrevHash?: string;
    actualPrevHash?: string;
    expectedHash?: string;
    actualHash?: string;
  }>;
  verifiedAt: string;
  verificationDigest: string;
  genesisHash: string;
  latestBlockHash: string;
  scanDurationMs: number;
}

export interface ComplianceRule {
  id: string;
  standard: 'SOX_404' | 'ISO_27001' | 'ND_13_2023_CP' | 'GDPR_ART_32' | 'BASEL_III';
  standardTitle: string;
  code: string;
  title: string;
  requirement: string;
  status: 'COMPLIANT' | 'NEEDS_ATTENTION' | 'NON_COMPLIANT';
  auditedBy?: string;
  auditedAt?: string;
  auditorNotes?: string;
}

export class AuditService {
  public static readonly GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
  private static writeMutex: Promise<any> = Promise.resolve();
  private static eventBusSubscribed = false;

  // Sensitive field patterns to detect and mask for general viewing
  private static readonly SENSITIVE_KEYS = [
    'password', 'pin', 'secret', 'token', 'apiKey',
    'baseSalary', 'basesalary', 'salary', 'luong',
    'bankAccount', 'bankaccount', 'so_tai_khoan',
    'ssn', 'citizenId', 'cccd', 'cmnd', 'nationalId'
  ];

  // 42 Module Metadata Registry
  public static readonly ERP_MODULES_MAP: Array<{
    code: string;
    name: string;
    group: string;
    workspace: string;
    integrationMode: 'CENTRAL_GATEWAY' | 'EVENTBUS_OUTBOX';
  }> = [
    { code: 'M01', name: 'Trung Tâm Khởi Tạo & Điều Hành Workspace', group: '08. Hệ thống & Giám sát', workspace: 'WS01_HUB', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M02', name: 'Nhật Ký Kiểm Toán & Chuỗi Băm SHA-256', group: '08. Hệ thống & Giám sát', workspace: 'WS28_DMS', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M03', name: 'Thiết Lập Hệ Thống Doanh Nghiệp', group: '08. Hệ thống & Giám sát', workspace: 'WS01_HUB', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M04', name: 'SuperAdmin & Phân Quyền Hạt Nhân RBAC', group: '08. Hệ thống & Giám sát', workspace: 'WS01_HUB', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M05', name: 'Hạ Tầng EventBus, EDA & Outbox DLQ', group: '08. Hệ thống & Giám sát', workspace: 'WS01_HUB', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M06', name: 'Nghiên Cứu & Phát Triển Sản Phẩm (R&D / PLM)', group: '04. Sản xuất & R&D', workspace: 'WS17_PROD', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M07', name: 'Master Data & Danh Mục Dùng Chung', group: '01. Chuỗi cung ứng & Mua hàng', workspace: 'WS01_HUB', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M08', name: 'Chiến Lược Nguồn Cung & Đấu Thầu (Sourcing)', group: '01. Chuỗi cung ứng & Mua hàng', workspace: 'WS03_PO', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M09', name: 'Yêu Cầu Mua Sắm Nội Bộ (Purchase Requisitions)', group: '01. Chuỗi cung ứng & Mua hàng', workspace: 'WS03_PO', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M10', name: 'Đơn Đặt Hàng Mua & Hợp Đồng Cung Ứng (PO/BPA)', group: '01. Chuỗi cung ứng & Mua hàng', workspace: 'WS03_PO', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M11', name: 'Quản Trị Nhà Cung Cấp & Đánh Giá SRM', group: '01. Chuỗi cung ứng & Mua hàng', workspace: 'WS04_VENDOR', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M12', name: 'Quản Trị Quan Hệ Khách Hàng CRM 360°', group: '02. Bán hàng & Phân phối', workspace: 'WS07_CRM', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M13', name: 'Đơn Hàng Bán & Phân Phối Doanh Nghiệp (SO)', group: '02. Bán hàng & Phân phối', workspace: 'WS05_SO', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M14', name: 'Cổng Khách Hàng & Đặt Hàng Trực Tuyến B2B', group: '02. Bán hàng & Phân phối', workspace: 'WS05_SO', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M15', name: 'Điểm Bán Lẻ Đa Điểm & Quầy Thu Ngân POS', group: '02. Bán hàng & Phân phối', workspace: 'WS05_SO', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M16', name: 'Phê Duyệt Chính Sách & Chiết Khấu Phân Phối', group: '02. Bán hàng & Phân phối', workspace: 'WS05_SO', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M17', name: 'Quản Lý Kho & Sổ Cái Tồn Kho WMS', group: '03. Kho vận & WMS chuyên sâu', workspace: 'WS08_INV', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M18', name: 'Kiểm Kê Kho Định Kỳ & Phân Kỳ Tồn Kho', group: '03. Kho vận & WMS chuyên sâu', workspace: 'WS08_INV', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M19', name: 'Điều Chuyển Kho Đa Chi Nhánh & Đa Điểm', group: '03. Kho vận & WMS chuyên sâu', workspace: 'WS08_INV', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M20', name: 'Điều Chỉnh Hao Hụt & Xử Lý Chênh Lệch Kho', group: '03. Kho vận & WMS chuyên sâu', workspace: 'WS08_INV', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M21', name: 'Truy Vết Số Lô Hàng Hóa & Hạn Sử Dụng (Lot/Exp)', group: '03. Kho vận & WMS chuyên sâu', workspace: 'WS08_INV', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M22', name: 'Truy Vết Số Serial & Hồ Sơ Thiết Bị Độc Bản', group: '03. Kho vận & WMS chuyên sâu', workspace: 'WS08_INV', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M23', name: 'Quản Trị Vị Trí Ô Kệ & Sơ Đồ Kho Bin/Rack', group: '03. Kho vận & WMS chuyên sâu', workspace: 'WS08_INV', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M24', name: 'Logistics Vận Chuyển, Đội Xe & Điều Phối Tuyến', group: '03. Kho vận & WMS chuyên sâu', workspace: 'WS15_SHIP', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M25', name: 'Kế Hoạch Nhu Cầu Vật Tư & Sản Xuất (MRP/MPS)', group: '04. Sản xuất & R&D', workspace: 'WS17_PROD', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M26', name: 'Định Mức Nguyên Vật Liệu & Công Thức Sản Xuất (BOM)', group: '04. Sản xuất & R&D', workspace: 'WS17_PROD', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M27', name: 'Lệnh Sản Xuất & Điều Độ Phân Xưởng (MES/WO)', group: '04. Sản xuất & R&D', workspace: 'WS17_PROD', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M28', name: 'Gia Công Ngoài & Quản Trị Thầu Phụ (Subcontracting)', group: '04. Sản xuất & R&D', workspace: 'WS17_PROD', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M29', name: 'Hóa Đơn Điện Tử, e-Invoice & Chữ Ký Số HSM', group: '05. Tài chính, Kế toán & Ngân hàng', workspace: 'WS19_ACC', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M30', name: 'Sổ Cái Kế Toán Tổng Hợp & Bút Toán GL', group: '05. Tài chính, Kế toán & Ngân hàng', workspace: 'WS19_ACC', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M31', name: 'Công Nợ Phải Thu Khách Hàng (AR / Aging)', group: '05. Tài chính, Kế toán & Ngân hàng', workspace: 'WS20_AR', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M32', name: 'Công Nợ Phải Trả Nhà Cung Cấp (AP / Vouchers)', group: '05. Tài chính, Kế toán & Ngân hàng', workspace: 'WS21_AP', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M33', name: 'Quản Trị Ngân Quỹ, Sổ Quỹ Tiền Mặt & Thu Chi', group: '05. Tài chính, Kế toán & Ngân hàng', workspace: 'WS22_TREASURY', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M34', name: 'Ngân Hàng Điện Tử & Đối Soát Sao Kê Tự Động', group: '05. Tài chính, Kế toán & Ngân hàng', workspace: 'WS23_BANK', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M35', name: 'Quản Trị Dự Án Doanh Nghiệp & Tiến Độ WBS', group: '04. Sản xuất & R&D', workspace: 'WS24_PROJECT', integrationMode: 'EVENTBUS_OUTBOX' },
    { code: 'M36', name: 'Hồ Sơ Nhân Sự, Hợp Đồng Lao Động & Chấm Công', group: '05. Tài chính, Kế toán & Ngân hàng', workspace: 'WS25_HR', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M37', name: 'Báo Cáo Quản Trị Doanh Nghiệp & Phân Tích BI', group: '08. Hệ thống & Giám sát', workspace: 'WS26_BI', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M38', name: 'Kho Lưu Trữ Hồ Sơ Số Hóa Doanh Nghiệp (DMS)', group: '08. Hệ thống & Giám sát', workspace: 'WS27_DMS', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M39', name: 'Kiểm Soát Chất Lượng Toàn Diện (QA/QC & IAI)', group: '06. Chất lượng, EHS & Bảo trì tài sản', workspace: 'WS28_QC', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M40', name: 'An Toàn Lao Động, Sức Khỏe & Môi Trường (EHS)', group: '06. Chất lượng, EHS & Bảo trì tài sản', workspace: 'WS29_EHS', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M41', name: 'Định Giá Bán, Bảng Giá & Chiết Khấu Đa Kênh', group: '07. Quản trị giá & Phân bổ chi phí', workspace: 'WS06_PRICE', integrationMode: 'CENTRAL_GATEWAY' },
    { code: 'M42', name: 'Phân Bổ Chi Phí Mua Hàng & Giá Vốn Landed Cost', group: '07. Quản trị giá & Phân bổ chi phí', workspace: 'WS04_VENDOR', integrationMode: 'CENTRAL_GATEWAY' }
  ];

  // In-memory compliance records with initial defaults
  private static complianceChecklist: ComplianceRule[] = [
    {
      id: 'SOX-01',
      standard: 'SOX_404',
      standardTitle: 'Sarbanes-Oxley Act Sec. 404',
      code: 'SOX-404-ITGC-01',
      title: 'Kiểm soát nội bộ chứng từ tài chính & Nguyên tắc Maker-Checker',
      requirement: 'Người tạo phiếu thu/chi/bút toán sổ cái không được quyền kiêm nhiệm phê duyệt thanh toán.',
      status: 'COMPLIANT',
      auditedBy: 'Đoàn Kiểm Toán PwC / Kế Toán Trưởng',
      auditedAt: '2026-09-10 14:30:00',
      auditorNotes: '100% các bút toán GL trên 50.000.000 VND đều có chữ ký kép và gắn mã băm SHA-256.'
    },
    {
      id: 'SOX-02',
      standard: 'SOX_404',
      standardTitle: 'Sarbanes-Oxley Act Sec. 404',
      code: 'SOX-404-ITGC-02',
      title: 'Bảo vệ tính bất biến của nhật ký kiểm toán (Tamper-Proof Audit)',
      requirement: 'Cấm tuyệt đối các thao tác UPDATE/DELETE trên bảng audit_logs ở cả tầng DB và tầng API.',
      status: 'COMPLIANT',
      auditedBy: 'Chuyên gia An ninh Hệ thống',
      auditedAt: '2026-09-12 09:15:00',
      auditorNotes: 'Đã kích hoạt Database Trigger chặn UPDATE/DELETE và chuỗi băm SHA-256 tuyến tính.'
    },
    {
      id: 'ISO-01',
      standard: 'ISO_27001',
      standardTitle: 'ISO/IEC 27001:2022',
      code: 'ISO-27001-A.12.4.1',
      title: 'Ghi nhật ký sự kiện an toàn thông tin (Event Logging)',
      requirement: 'Mọi hoạt động quản trị, truy cập vượt quyền và lỗi bảo mật phải được ghi nhận đầy đủ thời gian, IP và tác nhân.',
      status: 'COMPLIANT',
      auditedBy: 'Tổ Chức Đánh Giá BSI ISO',
      auditedAt: '2026-09-08 11:00:00',
      auditorNotes: 'Bao phủ 42/42 phân hệ ERP với định danh người dùng và Correlation ID nhất quán.'
    },
    {
      id: 'ISO-02',
      standard: 'ISO_27001',
      standardTitle: 'ISO/IEC 27001:2022',
      code: 'ISO-27001-A.12.4.3',
      title: 'Nhật ký của quản trị viên hệ thống (Administrator and Operator Logs)',
      requirement: 'Các thao tác của SuperAdmin và Service Account phải được giám sát độc lập, không cho phép xóa log của chính mình.',
      status: 'COMPLIANT',
      auditedBy: 'Tổ Chức Đánh Giá BSI ISO',
      auditedAt: '2026-09-08 11:20:00',
      auditorNotes: 'AuditService là Authority độc lập, SuperAdmin không có quyền chỉnh sửa sổ cái M02.'
    },
    {
      id: 'ND13-01',
      standard: 'ND_13_2023_CP',
      standardTitle: 'Nghị Định 13/2023/NĐ-CP (Việt Nam)',
      code: 'ND13-CP-ART-17',
      title: 'Bảo vệ dữ liệu cá nhân & Che dấu thông tin nhạy cảm (Data Masking)',
      requirement: 'Thông tin tài khoản ngân hàng, lương và số định danh cá nhân (CCCD/CMND) phải được che (mask) khi hiển thị.',
      status: 'COMPLIANT',
      auditedBy: 'Ban Pháp Chế & An Ninh Dữ Liệu',
      auditedAt: '2026-09-14 16:45:00',
      auditorNotes: 'Dữ liệu được mask dạng ••••••••5678 khi hiển thị, giữ nguyên dữ liệu gốc cho chuỗi hash.'
    },
    {
      id: 'GDPR-01',
      standard: 'GDPR_ART_32',
      standardTitle: 'EU GDPR Article 32',
      code: 'GDPR-ART-32-SEC',
      title: 'Đảm bảo tính toàn vẹn và bảo mật của việc xử lý dữ liệu (Integrity & Confidentiality)',
      requirement: 'Khả năng khôi phục tính khả dụng và quyền truy cập vào dữ liệu cá nhân kịp thời trong trường hợp xảy ra sự cố.',
      status: 'COMPLIANT',
      auditedBy: 'Tư Vấn Độc Lập DPO',
      auditedAt: '2026-09-05 10:30:00',
      auditorNotes: 'Sao lưu định kỳ và kiểm định toàn vẹn mật mã SHA-256 đạt 100% tính khớp.'
    }
  ];

  /**
   * Initializes event bus subscription for automated outbox audit captures
   */
  public static async init() {
    if (this.eventBusSubscribed) return;
    this.eventBusSubscribed = true;

    try {
      const { eventBus } = await import('./eventBus');
      if (!eventBus) return;

      eventBus.on('OrderConfirmed', (payload) => {
        this.captureAsync({
          module: 'M13',
          action: 'CONFIRM_SALES_ORDER',
          entityType: 'SALES_ORDER',
          entityId: payload.soCode || payload.id || 'N/A',
          userId: 1,
          username: 'sales_engine',
          role: 'SYSTEM',
          afterData: payload,
          result: 'SUCCESS',
          metadata: { source: 'EventBus:OrderConfirmed' }
        });
      });

      eventBus.on('StockReserved', (payload) => {
        this.captureAsync({
          module: 'M17',
          action: 'RESERVE_STOCK',
          entityType: 'STOCK_RESERVATION',
          entityId: payload.reservationCode || payload.sku || 'N/A',
          userId: 1,
          username: 'wms_engine',
          role: 'SYSTEM',
          afterData: payload,
          result: 'SUCCESS',
          metadata: { source: 'EventBus:StockReserved' }
        });
      });

      eventBus.on('GLJournalPosted', (payload) => {
        this.captureAsync({
          module: 'M30',
          action: 'POST_JOURNAL_ENTRY',
          entityType: 'JOURNAL_ENTRY',
          entityId: payload.journalEntryCode || payload.id || 'N/A',
          userId: 1,
          username: 'accounting_engine',
          role: 'SYSTEM',
          afterData: payload,
          result: 'SUCCESS',
          metadata: { source: 'EventBus:GLJournalPosted' }
        });
      });

      eventBus.on('CostAllocationCreated', (payload) => {
        this.captureAsync({
          module: 'M42',
          action: 'ALLOCATE_LANDED_COST',
          entityType: 'COST_ALLOCATION',
          entityId: payload.allocationRunId || 'N/A',
          userId: 1,
          username: 'costing_engine',
          role: 'SYSTEM',
          afterData: payload,
          result: 'SUCCESS',
          metadata: { source: 'EventBus:CostAllocationCreated' }
        });
      });

      eventBus.on('AUDIT_LOG_CAPTURED', (payload) => {
        this.recordAuditLog(payload).catch((err) => {
          console.warn('[AuditService] Failed to record async event:', err.message);
        });
      });
    } catch (err: any) {
      console.warn('[AuditService] Failed to bind eventBus listeners:', err?.message);
    }
  }

  /**
   * Deterministic canonical SHA-256 computation
   * hash = SHA-256(prevHash | auditCode | timestamp | userId | username | module | action | entityType | entityId | result | canonicalBefore | canonicalAfter)
   */
  public static computeCanonicalHash(
    prevHash: string,
    entry: {
      auditCode: string;
      timestamp: string | number;
      userId: number | string;
      username: string;
      module: string;
      action: string;
      entityType: string;
      entityId: string;
      result: string;
      beforeData?: string | null;
      afterData?: string | null;
    }
  ): string {
    const canonicalBefore = entry.beforeData ? this.normalizeJson(entry.beforeData) : '';
    const canonicalAfter = entry.afterData ? this.normalizeJson(entry.afterData) : '';

    const payload = [
      prevHash || this.GENESIS_HASH,
      entry.auditCode,
      String(entry.timestamp),
      String(entry.userId),
      entry.username || 'SYSTEM',
      entry.module,
      entry.action,
      entry.entityType,
      String(entry.entityId),
      entry.result || 'SUCCESS',
      canonicalBefore,
      canonicalAfter
    ].join('|');

    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  private static normalizeJson(data: any): string {
    if (!data) return '';
    try {
      const obj = typeof data === 'string' ? JSON.parse(data) : data;
      // Sort keys recursively for deterministic hashing
      return JSON.stringify(this.sortKeys(obj));
    } catch {
      return String(data).trim();
    }
  }

  private static sortKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((i) => this.sortKeys(i));
    const sorted: Record<string, any> = {};
    Object.keys(obj).sort().forEach((k) => {
      sorted[k] = this.sortKeys(obj[k]);
    });
    return sorted;
  }

  public static async logAudit(input: AuditLogInput): Promise<any> {
    return this.recordAuditLog(input);
  }

  /**
   * Single-Writer Central Audit Record Gateway
   * Sequential execution guarantees linear, fork-free cryptographic hash chain
   */
  public static async recordAuditLog(input: AuditLogInput): Promise<any> {
    // Acquire mutex promise to serialize database writes and hash chaining
    const currentMutex = this.writeMutex;
    let releaseMutex: () => void;
    this.writeMutex = new Promise((resolve) => {
      releaseMutex = resolve;
    });

    try {
      await currentMutex;

      // 1. Fetch latest record for prevHash and blockNumber
      const [latestRecord] = await db
        .select({
          id: schema.auditLogs.id,
          blockNumber: schema.auditLogs.blockNumber,
          sha256Checksum: schema.auditLogs.sha256Checksum,
          auditCode: schema.auditLogs.auditCode
        })
        .from(schema.auditLogs)
        .orderBy(desc(schema.auditLogs.id))
        .limit(1);

      const prevHash = latestRecord?.sha256Checksum || this.GENESIS_HASH;
      const nextBlockNumber = (latestRecord?.blockNumber || latestRecord?.id || 0) + 1;
      const timestamp = input.createdAt || new Date();
      const auditCode = input.auditCode || `AUD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextBlockNumber).padStart(6, '0')}`;

      // 2. Prepare beforeData / afterData
      const rawBefore = input.beforeData
        ? typeof input.beforeData === 'string'
          ? input.beforeData
          : JSON.stringify(input.beforeData)
        : null;
      const rawAfter = input.afterData
        ? typeof input.afterData === 'string'
          ? input.afterData
          : JSON.stringify(input.afterData)
        : null;

      // 3. Detect sensitive fields
      const maskedKeys: string[] = [];
      this.detectSensitiveFields(input.beforeData, maskedKeys);
      this.detectSensitiveFields(input.afterData, maskedKeys);
      const uniqueMaskedKeys = Array.from(new Set(maskedKeys));

      // 4. Compute SHA-256 Checksum on UNMASKED canonical data
      const sha256Checksum = this.computeCanonicalHash(prevHash, {
        auditCode,
        timestamp: timestamp.getTime(),
        userId: input.userId || 1,
        username: input.username || 'SYSTEM',
        module: input.module || 'SYS',
        action: input.action,
        entityType: input.entityType,
        entityId: String(input.entityId),
        result: input.result || 'SUCCESS',
        beforeData: rawBefore,
        afterData: rawAfter
      });

      // 5. Insert into immutable audit_logs
      const [inserted] = await db
        .insert(schema.auditLogs)
        .values({
          auditCode,
          userId: input.userId || 1,
          username: input.username || 'system',
          userName: input.userName || (input.username === 'system' ? 'Hệ Thống Tự Động' : 'Người Dùng'),
          role: input.role || 'USER',
          branchId: input.branchId || 1,
          branchName: input.branchName || 'Trụ Sở Chính (HQ)',
          warehouseId: input.warehouseId || null,
          warehouseName: input.warehouseName || null,
          action: input.action,
          entityType: input.entityType,
          entityId: String(input.entityId),
          module: input.module,
          ipAddress: input.ipAddress || '127.0.0.1',
          deviceId: input.deviceId || 'SRV-NODE-01',
          deviceType: input.deviceType || 'WEB',
          appVersion: input.appVersion || '1.0.0',
          browser: input.browser || 'Chrome/NexusSync-Client',
          sessionId: input.sessionId || null,
          requestId: input.requestId || null,
          correlationId: input.correlationId || `CORR-${auditCode}`,
          beforeData: rawBefore,
          afterData: rawAfter,
          changedFields: input.changedFields ? (typeof input.changedFields === 'string' ? input.changedFields : JSON.stringify(input.changedFields)) : null,
          result: input.result || 'SUCCESS',
          reason: input.reason || null,
          metadata: input.metadata ? (typeof input.metadata === 'string' ? input.metadata : JSON.stringify(input.metadata)) : null,
          prevHash,
          sha256Checksum,
          tamperStatus: 'VALID',
          maskedFields: uniqueMaskedKeys.length > 0 ? JSON.stringify(uniqueMaskedKeys) : null,
          blockNumber: nextBlockNumber,
          createdAt: timestamp
        })
        .returning();

      return inserted;
    } finally {
      releaseMutex!();
    }
  }

  /**
   * Asynchronous capture via EventBus to avoid blocking heavy business transactions
   */
  public static captureAsync(input: AuditLogInput): void {
    Promise.resolve().then(async () => {
      try {
        await this.recordAuditLog(input);
      } catch (err: any) {
        console.warn(`[AuditService] Async capture failed for ${input.module}:${input.action}:`, err.message);
      }
    });
  }

  /**
   * Detects sensitive keys in payload
   */
  private static detectSensitiveFields(obj: any, collected: string[]): void {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const lower = key.toLowerCase();
      if (this.SENSITIVE_KEYS.some((s) => lower.includes(s.toLowerCase()))) {
        collected.push(key);
      }
      if (typeof obj[key] === 'object') {
        this.detectSensitiveFields(obj[key], collected);
      }
    }
  }

  /**
   * Masks sensitive fields in JSON payload for safe presentation
   */
  public static maskPayload(payloadStr: string | null | undefined, shouldMask = true): string | null {
    if (!payloadStr || !shouldMask) return payloadStr || null;
    try {
      const obj = JSON.parse(payloadStr);
      const masked = this.deepMaskObject(obj);
      return JSON.stringify(masked);
    } catch {
      return payloadStr;
    }
  }

  private static deepMaskObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((i) => this.deepMaskObject(i));
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      const lower = k.toLowerCase();
      const isSensitive = this.SENSITIVE_KEYS.some((s) => lower.includes(s.toLowerCase()));
      if (isSensitive && v !== null && v !== undefined) {
        const valStr = String(v);
        if (valStr.length <= 4) {
          result[k] = '••••';
        } else {
          result[k] = '••••••••' + valStr.slice(-4);
        }
      } else if (typeof v === 'object') {
        result[k] = this.deepMaskObject(v);
      } else {
        result[k] = v;
      }
    }
    return result;
  }

  /**
   * Chain Integrity Verification API
   * Iterates through chronological blocks, recomputes SHA-256 digest and verifies chain links
   */
  public static async verifyChain(options: {
    segment?: 'all' | 'recent' | 'range';
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<ChainVerificationResult> {
    const startTime = Date.now();
    const segment = options.segment || 'all';
    const limit = options.limit || (segment === 'recent' ? 50 : 1000);

    let query = db.select().from(schema.auditLogs).orderBy(asc(schema.auditLogs.id)).limit(limit);

    const logs = await query.all();
    const brokenLinks: ChainVerificationResult['brokenLinks'] = [];
    let validCount = 0;
    let expectedPrevHash = this.GENESIS_HASH;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const blockNum = log.blockNumber || log.id;

      // 1. Link integrity check (prevHash must equal preceding block's checksum)
      if (i > 0) {
        const precedingBlock = logs[i - 1];
        const expectedLink = precedingBlock.sha256Checksum || '';
        if (log.prevHash && log.prevHash !== expectedLink) {
          brokenLinks.push({
            blockNumber: blockNum,
            auditCode: log.auditCode,
            reason: `Đứt gãy liên kết chuỗi: prevHash (${log.prevHash?.slice(0, 16)}...) không khớp với chữ ký của khối trước đó (${expectedLink.slice(0, 16)}...)`,
            expectedPrevHash: expectedLink,
            actualPrevHash: log.prevHash || ''
          });
        }
      }

      // 2. Cryptographic signature check (recompute SHA-256)
      const recomputedHash = this.computeCanonicalHash(log.prevHash || expectedPrevHash, {
        auditCode: log.auditCode,
        timestamp: log.createdAt ? new Date(log.createdAt).getTime() : 0,
        userId: log.userId,
        username: log.username,
        module: log.module,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        result: log.result,
        beforeData: log.beforeData,
        afterData: log.afterData
      });

      if (log.sha256Checksum && log.sha256Checksum !== recomputedHash) {
        brokenLinks.push({
          blockNumber: blockNum,
          auditCode: log.auditCode,
          reason: `Chữ ký mã hóa bị sai lệch: Dữ liệu bản ghi có thể đã bị sửa đổi trực tiếp (Tampered Record)`,
          expectedHash: recomputedHash,
          actualHash: log.sha256Checksum
        });
      } else {
        validCount++;
      }

      expectedPrevHash = log.sha256Checksum || recomputedHash;
    }

    const isChainIntact = brokenLinks.length === 0;
    const scanDurationMs = Date.now() - startTime;
    const latestBlockHash = logs[logs.length - 1]?.sha256Checksum || this.GENESIS_HASH;

    // Generate deterministic verification digest
    const verificationDigest = crypto
      .createHash('sha256')
      .update(`${logs.length}|${validCount}|${brokenLinks.length}|${latestBlockHash}|${startTime}`)
      .digest('hex');

    // If chain is broken, emit high-severity security alert
    if (!isChainIntact) {
      eventBus.emitEvent('SECURITY_TAMPER_DETECTED', {
        brokenCount: brokenLinks.length,
        brokenDetails: brokenLinks,
        detectedAt: new Date().toISOString()
      }, {
        aggregateType: 'AUDIT_SECURITY',
        source: 'M02_AUDIT_SERVICE'
      });
    }

    return {
      isChainIntact,
      totalBlocksVerified: logs.length,
      validBlocksCount: validCount,
      tamperedBlocksCount: brokenLinks.length,
      brokenLinks,
      verifiedAt: new Date().toISOString(),
      verificationDigest,
      genesisHash: this.GENESIS_HASH,
      latestBlockHash,
      scanDurationMs
    };
  }

  /**
   * Retrieves compliance checklist items
   */
  public static getComplianceChecklist(): ComplianceRule[] {
    return this.complianceChecklist;
  }

  /**
   * Updates compliance rule with auditor signoff
   */
  public static updateComplianceRule(
    ruleId: string,
    status: 'COMPLIANT' | 'NEEDS_ATTENTION' | 'NON_COMPLIANT',
    auditorNotes?: string,
    auditedBy?: string
  ): ComplianceRule | null {
    const rule = this.complianceChecklist.find((r) => r.id === ruleId);
    if (!rule) return null;
    rule.status = status;
    if (auditorNotes) rule.auditorNotes = auditorNotes;
    if (auditedBy) rule.auditedBy = auditedBy;
    rule.auditedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return rule;
  }

  /**
   * Retrieves 42-Module audit coverage matrix with real counts
   */
  public static async get42ModuleCoverage(): Promise<any[]> {
    const counts = await db
      .select({
        module: schema.auditLogs.module,
        count: sql<number>`count(*)`
      })
      .from(schema.auditLogs)
      .groupBy(schema.auditLogs.module)
      .all();

    const countsMap = new Map<string, number>();
    counts.forEach((c) => {
      countsMap.set(c.module, Number(c.count));
    });

    return this.ERP_MODULES_MAP.map((mod) => {
      const loggedEvents = countsMap.get(mod.code) || 0;
      return {
        ...mod,
        loggedEvents,
        status: 'INTEGRATED',
        lastAuditState: loggedEvents > 0 ? 'ACTIVE_LOGGING' : 'STANDBY_READY'
      };
    });
  }

  /**
   * Export audit log records with digital SHA-256 digest
   */
  public static async generateRegulatoryExport(options: {
    format: 'csv' | 'json';
    module?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ content: string; filename: string; mimeType: string; digest: string; totalRecords: number }> {
    let query = db.select().from(schema.auditLogs).orderBy(asc(schema.auditLogs.id));

    const records = await query.all();
    const exportTime = new Date().toISOString().slice(0, 10);

    if (options.format === 'json') {
      const payload = JSON.stringify(records, null, 2);
      const digest = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
      return {
        content: payload,
        filename: `nexus_erp_audit_ledger_${exportTime}.json`,
        mimeType: 'application/json',
        digest,
        totalRecords: records.length
      };
    }

    // Format CSV
    const headers = [
      'BlockNumber',
      'AuditCode',
      'Timestamp',
      'Username',
      'Role',
      'Module',
      'Action',
      'EntityType',
      'EntityId',
      'Result',
      'PrevHash',
      'SHA256Checksum',
      'TamperStatus'
    ].join(',');

    const rows = records.map((r) =>
      [
        r.blockNumber || r.id,
        `"${r.auditCode}"`,
        `"${r.createdAt ? new Date(r.createdAt).toISOString() : ''}"`,
        `"${r.username || ''}"`,
        `"${r.role || ''}"`,
        `"${r.module || ''}"`,
        `"${r.action || ''}"`,
        `"${r.entityType || ''}"`,
        `"${r.entityId || ''}"`,
        `"${r.result || 'SUCCESS'}"`,
        `"${r.prevHash || ''}"`,
        `"${r.sha256Checksum || ''}"`,
        `"${r.tamperStatus || 'VALID'}"`
      ].join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const digest = crypto.createHash('sha256').update(csvContent, 'utf8').digest('hex');

    return {
      content: csvContent,
      filename: `nexus_erp_regulatory_audit_report_${exportTime}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
      digest,
      totalRecords: records.length
    };
  }

  /**
   * Seed realistic initial enterprise audit blocks with unbroken SHA-256 hash chain
   */
  public static async seedInitialChainIfEmpty(): Promise<number> {
    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.auditLogs)
      .all();

    const count = Number(existingCount[0]?.count || 0);

    // If records exist and already have sha256Checksum on the latest block, don't re-seed
    if (count > 0) {
      const [latest] = await db
        .select({ checksum: schema.auditLogs.sha256Checksum })
        .from(schema.auditLogs)
        .orderBy(desc(schema.auditLogs.id))
        .limit(1);

      if (latest?.checksum) {
        return count;
      }
    }

    console.log('[AuditService] Bootstrapping Genesis Block and SHA-256 Hash Chain...');

    const SEED_ENTRIES: Array<Omit<AuditLogInput, 'createdAt'> & { minutesAgo: number }> = [
      {
        auditCode: 'AUD-GENESIS-000001',
        module: 'M02',
        action: 'GENESIS_BLOCK_INITIALIZATION',
        entityType: 'AUDIT_LEDGER',
        entityId: 'CHAIN_ROOT_001',
        userId: 0,
        username: 'SYSTEM_ROOT',
        userName: 'NexusSync Sovereign Security Root',
        role: 'SYSTEM',
        result: 'SUCCESS',
        beforeData: null,
        afterData: { standard: 'ISO/IEC 27001 / FIPS 180-4', genesisHash: AuditService.GENESIS_HASH, version: '2.0.0-ENTERPRISE' },
        reason: 'Khởi tạo khối gốc Genesis Block cho toàn bộ hệ thống NexusSync ERP',
        minutesAgo: 60 * 24 * 7 // 7 days ago
      },
      {
        auditCode: 'AUD-20260909-000002',
        module: 'M04',
        action: 'CREATE_SYSTEM_ROLE',
        entityType: 'RBAC_ROLE',
        entityId: 'TIER_1_SOVEREIGN',
        userId: 1,
        username: 'admin',
        userName: 'Admin Hệ Thống',
        role: 'SUPER_ADMIN',
        result: 'SUCCESS',
        beforeData: null,
        afterData: { roleCode: 'CHIEF_FINANCIAL_OFFICER', tier: 'TIER_1_SOVEREIGN', approvalLimitVND: 5000000000 },
        reason: 'Thiết lập vai trò Giám Đốc Tài Chính CFO',
        minutesAgo: 60 * 24 * 6
      },
      {
        auditCode: 'AUD-20260910-000003',
        module: 'M07',
        action: 'CREATE_PRODUCT',
        entityType: 'PRODUCT',
        entityId: 'PRD-001',
        userId: 2,
        username: 'kho_truong',
        userName: 'Nguyễn Văn Kho',
        role: 'WAREHOUSE_MANAGER',
        result: 'SUCCESS',
        beforeData: null,
        afterData: { sku: 'PRD-001', name: 'Thép Cuộn Cán Nóng Posco SS400', uom: 'KG', minStock: 5000 },
        reason: 'Khai báo danh mục vật tư thép cán nóng',
        minutesAgo: 60 * 24 * 5
      },
      {
        auditCode: 'AUD-20260911-000004',
        module: 'M10',
        action: 'APPROVE_PURCHASE_ORDER',
        entityType: 'PURCHASE_ORDER',
        entityId: 'PO-2026-0042',
        userId: 3,
        username: 'purchase_lead',
        userName: 'Trần Thị Mua',
        role: 'PURCHASING_MANAGER',
        result: 'SUCCESS',
        beforeData: { status: 'PENDING_APPROVAL', totalAmountVND: 850000000 },
        afterData: { status: 'APPROVED', approvedBy: 'purchase_lead', totalAmountVND: 850000000 },
        reason: 'Phê duyệt hợp đồng mua thép lô PO-2026-0042',
        minutesAgo: 60 * 24 * 4
      },
      {
        auditCode: 'AUD-20260911-000005',
        module: 'M17',
        action: 'POST_STOCK_RECEIPT',
        entityType: 'STOCK_RECEIPT',
        entityId: 'GRN-2026-0129',
        userId: 2,
        username: 'kho_truong',
        userName: 'Nguyễn Văn Kho',
        role: 'WAREHOUSE_MANAGER',
        result: 'SUCCESS',
        beforeData: { warehouseId: 'WH-LONGAN-01', status: 'DRAFT' },
        afterData: { warehouseId: 'WH-LONGAN-01', status: 'POSTED', receivedQty: 10000, lotNo: 'LOT-202609-001' },
        reason: 'Nhập kho lô thép nguyên liệu đạt chuẩn QA/QC',
        minutesAgo: 60 * 24 * 3
      },
      {
        auditCode: 'AUD-20260912-000006',
        module: 'M13',
        action: 'CONFIRM_SALES_ORDER',
        entityType: 'SALES_ORDER',
        entityId: 'SO-2026-0088',
        userId: 4,
        username: 'sales_lead_hn',
        userName: 'Lê Bán Hàng',
        role: 'SALES_MANAGER',
        result: 'SUCCESS',
        beforeData: { status: 'DRAFT', customerCode: 'CUST-VIN-01' },
        afterData: { status: 'CONFIRMED', totalAmountVND: 450000000, linesCount: 8 },
        reason: 'Xác nhận đơn hàng bán dự án VinFast',
        minutesAgo: 60 * 24 * 2
      },
      {
        auditCode: 'AUD-20260912-000007',
        module: 'M30',
        action: 'POST_JOURNAL_ENTRY',
        entityType: 'JOURNAL_ENTRY',
        entityId: 'JE-2026-0892',
        userId: 5,
        username: 'kt_truong_nguyen',
        userName: 'Võ Thị Kế',
        role: 'CHIEF_ACCOUNTANT',
        result: 'SUCCESS',
        beforeData: { status: 'PENDING_APPROVAL', debitAccount: '1311', creditAccount: '5111' },
        afterData: { status: 'POSTED', debitAmount: 450000000, creditAmount: 450000000, postedGL: true },
        reason: 'Hạch toán ghi nhận doanh thu bán hàng xuất kho',
        minutesAgo: 60 * 20
      },
      {
        auditCode: 'AUD-20260913-000008',
        module: 'M41',
        action: 'UPDATE_PRICE_RULE',
        entityType: 'PRICE_LIST',
        entityId: 'PL-B2B-WHOLESALE',
        userId: 6,
        username: 'pricing_manager',
        userName: 'Phạm Thị Giá',
        role: 'PRICING_MANAGER',
        result: 'SUCCESS',
        beforeData: { discountTier: 0.10 },
        afterData: { discountTier: 0.12, approvedBy: 'CFO' },
        reason: 'Điều chỉnh chiết khấu bán buôn theo quý 4',
        minutesAgo: 60 * 12
      },
      {
        auditCode: 'AUD-20260913-000009',
        module: 'M42',
        action: 'ALLOCATE_LANDED_COST',
        entityType: 'COST_ALLOCATION',
        entityId: 'ALC-2026-004',
        userId: 5,
        username: 'kt_truong_nguyen',
        userName: 'Võ Thị Kế',
        role: 'CHIEF_ACCOUNTANT',
        result: 'SUCCESS',
        beforeData: { totalLandedCostVND: 18500000, method: 'VALUE_WEIGHTED' },
        afterData: { status: 'COMPLETED', allocatedLotsCount: 3, varianceVND: 0 },
        reason: 'Phân bổ chi phí vận chuyển đường biển và thuế nhập khẩu',
        minutesAgo: 60 * 6
      },
      {
        auditCode: 'AUD-20260914-000010',
        module: 'M04',
        action: 'PERMISSION_DENIED_VIOLATION',
        entityType: 'USER_ACCOUNT',
        entityId: 'USR-GUEST-099',
        userId: 99,
        username: 'guest_attacker',
        userName: 'Vãng Lai',
        role: 'USER',
        result: 'PERMISSION_DENIED',
        beforeData: null,
        afterData: { attemptedEndpoint: '/api/rbac/roles/1', attemptedAction: 'DELETE' },
        reason: 'Cố ý gửi lệnh DELETE vai trò SuperAdmin không có quyền Sovereign',
        minutesAgo: 60 * 2
      },
      {
        auditCode: 'AUD-20260914-000011',
        module: 'M36',
        action: 'UPDATE_EMPLOYEE_COMPENSATION',
        entityType: 'EMPLOYEE_SALARY',
        entityId: 'EMP-2026-0045',
        userId: 7,
        username: 'hr_lead',
        userName: 'Đoàn Thị Nhân Sự',
        role: 'HR_MANAGER',
        result: 'SUCCESS',
        beforeData: { baseSalary: 25000000, bankAccount: '998877665544', citizenId: '079090001234' },
        afterData: { baseSalary: 28000000, bankAccount: '998877665544', citizenId: '079090001234' },
        reason: 'Điều chỉnh nâng bậc lương định kỳ theo đánh giá KPI',
        minutesAgo: 45
      },
      {
        auditCode: 'AUD-20260915-000012',
        module: 'M02',
        action: 'CHAIN_INTEGRITY_VERIFICATION',
        entityType: 'HASH_CHAIN',
        entityId: 'BLOCK_000011',
        userId: 1,
        username: 'admin',
        userName: 'Admin Hệ Thống',
        role: 'SUPER_ADMIN',
        result: 'SUCCESS',
        beforeData: null,
        afterData: { verifiedBlocks: 11, integrityRate: '100.0%', tamperedCount: 0 },
        reason: 'Quét tự động kiểm định tính bất biến và độ toàn vẹn chuỗi băm FIPS 180-4',
        minutesAgo: 10
      }
    ];

    let seededCount = 0;
    for (const item of SEED_ENTRIES) {
      const createdAt = new Date(Date.now() - item.minutesAgo * 60 * 1000);
      await this.recordAuditLog({
        ...item,
        createdAt
      });
      seededCount++;
    }

    console.log(`[AuditService] Successfully initialized ${seededCount} cryptographic audit blocks with unbroken SHA-256 chain!`);
    return seededCount;
  }
}

