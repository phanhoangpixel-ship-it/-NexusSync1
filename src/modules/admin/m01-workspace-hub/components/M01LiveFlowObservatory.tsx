import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as Icons from 'lucide-react';
import { ModuleDefinition, MODULE_REGISTRY } from '../../../../config/moduleRegistry';
import {
  m01WorkspaceApi,
  FlowSpanItem,
  ObservabilityHealthData,
  ModuleTopologyItem
} from '../services/m01WorkspaceApi';
import { CorrelationRcaTraceModal } from './CorrelationRcaTraceModal';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

export type ObservatoryMode = 'live' | 'sim' | 'pause' | 'inspect';
export type LogFilterType = 'ALL' | 'READ' | 'WRITE' | 'EVENT' | 'ERROR' | 'DATABASE';

interface Particle {
  id: string;
  edgeKey: string;
  type: 'R' | 'W' | 'E';
  isError: boolean;
  progress: number; // 0 to 1
  pathLength: number;
}

interface IncidentItem {
  id: string;
  moduleCode: string;
  code: string;
  desc: string;
  rec: string;
  count: number;
  time: string;
  source: string;
  correlationId?: string;
  severity: 'Cao' | 'Trung bình' | 'Thấp';
}

interface LogEntry {
  id: string;
  time: string;
  source: string;
  target: string;
  type: 'READ' | 'WRITE' | 'EVENT' | 'DATABASE';
  label: string;
  isError: boolean;
  tag: string;
  correlationId?: string;
}

interface NodeDef {
  id: string;
  lb?: string;
  name: string;
  k: string;
  api: string;
  ci: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface EdgeDef {
  key: string;
  source: string;
  target: string;
  type: 'R' | 'W' | 'E';
  label: string;
  pathData: string;
}

// Category Color Palette matching artifact specifications
const CATEGORY_COLORS: Record<string, string> = {
  md: '#22c55e',
  pu: '#fb923c',
  sa: '#ef4444',
  iv: '#3b82f6',
  wh: '#06b6d4',
  mf: '#a855f7',
  fi: '#eab308',
  pr: '#4ade80',
  co: '#f97316',
  sy: '#94a3b8'
};

// Single-Writer Domain Authorities
const SINGLE_WRITER_AUTHORITIES: Record<string, string> = {
  M17: 'Single writer tồn kho — InventoryService.postTransaction()',
  M30: 'Single writer sổ cái — AccountingEngine',
  M41: 'Thẩm quyền giá bán — PricingEngine',
  M42: 'Thẩm quyền giá vốn — CostingEngine'
};

// Domain Services Map
const DOMAIN_SERVICES: Record<string, string> = {
  M17: 'InventoryService.postTransaction()',
  M30: 'AccountingEngine.postJournal()',
  M42: 'CostingEngine',
  M41: 'PricingEngine',
  M08: 'PurchaseEngine',
  M13: 'SalesEngine',
  M32: 'TreasuryService',
  M31: 'InvoiceService',
  M25: 'ManufacturingEngine',
  M39: 'QualityService',
  M27: 'EamService',
  M28: 'HrService'
};

// Error Knowledge Base & Standard Rules
const ERROR_RULES: Record<string, [string, string, string]> = {
  M17: [
    'NEGATIVE_STOCK_BLOCKED',
    'Tồn khả dụng không đủ hoặc đang bị giữ chỗ',
    'Kiểm tra available = physical − reserved theo SKU/kho/vị trí. Nghi lệch số liệu: chạy Audit → Recalculate; chỉ Reconcile khi có quyền inventory:admin. Không UPDATE trực tiếp stock_balances.'
  ],
  M30: [
    'CLOSED_PERIOD_FORBIDDEN',
    'Bút toán rơi vào kỳ kế toán đã khóa',
    'Ghi vào kỳ đang mở hoặc dùng Storno Reversal (POST /api/finance/gl/reversal). Mở khóa kỳ cần CFO và để lại log M02.'
  ],
  M42: [
    'ERR_COSTING_LAYER_DEPLETED',
    'Xuất kho nhưng không đủ cost layer',
    'Kiểm tra Goods Receipt và cost layer của SKU; bổ sung nhập kho hoặc phân bổ landed cost qua M42. Không tự giả định giá vốn.'
  ],
  M32: [
    'OVERDRAFT_GUARD_BLOCKED',
    'Số dư quỹ/ngân hàng không đủ cho phiếu chi',
    'Kiểm tra bookBalance; chuyển quỹ nội bộ hoặc xin CFO duyệt override có lý do ghi vào audit.'
  ],
  M08: [
    'BUDGET_GUARD_EXCEEDED',
    'PO vượt ngân sách cost center',
    'Xem ngân sách còn lại (allocated − spent − committed) ở M30; giảm giá trị PO hoặc xin override kèm lý do.'
  ],
  M05: [
    'DLQ_QUARANTINED',
    'Event bị chuyển vào Dead Letter Queue',
    'Xem consumer lỗi, sửa nguyên nhân rồi POST /api/outbox/retry (idempotent, có audit M02).'
  ],
  M29: [
    'DOCUMENT_SEALED_IMMUTABLE',
    'Tài liệu đã niêm phong, không sửa tại chỗ',
    'Tạo phiên bản mới qua POST /api/dms/vault với supersedesId.'
  ],
  M31: [
    'DISCREPANCY_3WAY',
    'Hóa đơn AP lệch PO/GRN quá dung sai',
    'Đối chiếu số lượng/đơn giá của PO, GRN và hóa đơn; kế toán trưởng override sau khi giải trình.'
  ],
  M13: [
    'CREDIT_APPROVAL_REQUIRED',
    'Đơn vượt hạn mức hoặc khách nợ quá hạn',
    'Credit Manager duyệt tại POST /api/sales/orders/:id/approve hoặc yêu cầu khách thanh toán.'
  ],
  M15: [
    'RMA_LINEAGE_OR_FRAUD',
    'RMA không hợp lệ hoặc rủi ro gian lận',
    'Kiểm tra cửa sổ 30 ngày, lineage đơn giao và serial; điểm rủi ro cao cần Director override.'
  ]
};

const DEFAULT_ERROR_RULE: [string, string, string] = [
  'SERVICE_ERROR',
  'Yêu cầu thất bại, chưa rõ nguyên nhân',
  'Tra RCA theo correlationId và kiểm tra idempotencyKey. Span nguồn EVENT có thể retry qua M05; span nguồn AUDIT chỉ điều tra, không retry.'
];

// 6 Columns definition from Artifact
const COLUMNS_DEF = [
  {
    title: 'Thương mại & dữ liệu chủ',
    items: [
      'M07|Master Data|md|/api/customers · /api/products',
      'M12|CRM|sa|/api/crm/*',
      'M13|Sales Orders|sa|/api/sales/orders',
      'M14|Commission|sa|/api/commission/*',
      'M15|Returns RMA|sa|/api/returns',
      'M16|POS|sa|/api/shift/active',
      'M41|Pricing|pr|/api/pricing/items',
      'M43|Industry Profiles|md|/api/industry-profiles'
    ]
  },
  {
    title: 'Mua hàng',
    items: [
      'M09|Suppliers|pu|/api/suppliers',
      'M10|Sourcing RFQ|pu|/api/sourcing/*',
      'M08|Purchase Orders|pu|/api/purchase-orders',
      'M11|SRM Scorecards|pu|/api/srm/*'
    ]
  },
  {
    title: 'Kho & logistics',
    items: [
      'M17|Master WMS|iv|/api/inventory/*',
      'M18|Warehouse|wh|/api/warehouses',
      'M19|Stocktake|wh|/api/stocktakes',
      'M20|Stock Adjustment|wh|/api/stock-adjustments',
      'M21|Transfers|wh|/api/stock-transfers',
      'M22|Lots|wh|/api/lots',
      'M23|Serials|wh|/api/serials',
      'M24|WMS Extended|wh|/api/wms/*',
      'M36|Logistics TMS|wh|/api/logistics/*'
    ]
  },
  {
    title: 'Sản xuất & vận hành',
    items: [
      'M06|R&D|mf|/api/rd/*',
      'M25|Manufacturing|mf|/api/manufacturing/*',
      'M26|Supply Chain MRP|mf|/api/scm/*',
      'M27|EAM|mf|/api/eam/*',
      'M35|Projects WBS|mf|/api/projects/*',
      'M28|HR & Payroll|mf|/api/hr/*'
    ]
  },
  {
    title: 'Tài chính',
    items: [
      'M31|Invoices AR/AP|fi|/api/invoices',
      'M32|Payments|fi|/api/treasury/*',
      'M33|Bank Recon|fi|/api/bank/*',
      'M30|Accounting GL|fi|/api/finance/*',
      'M34|Consolidation|fi|/api/finance/consolidation/*',
      'M42|COGS Costing|co|/api/cogs/*'
    ]
  },
  {
    title: 'Quản trị & hệ thống',
    items: [
      'M01|Workspace Hub|sy|/api/workspace/*',
      'M02|Audit SHA-256|sy|/api/audit/logs',
      'M03|Settings|sy|/api/settings',
      'M04|RBAC|sy|/api/rbac/roles',
      'M05|EventBus Outbox|sy|/api/events/outbox',
      'M29|DMS Vault|sy|/api/dms/*',
      'M37|BI Analytics|sy|/api/analytics/*',
      'M38|Service Desk|sy|/api/service-desk/*',
      'M39|Quality QMS|sy|/api/quality/*',
      'M40|EHS|sy|/api/ehs/*'
    ]
  }
];

// Raw Edge Definition String
const RAW_EDGES_LIST = `CLI>M13:W:POST /api/sales/orders/create-b2b
CLI>M16:W:POST /api/sales-orders/pos
CLI>M12:W:POST /api/crm/leads
CLI>M08:W:POST /api/purchase-orders
CLI>M19:W:POST /api/stocktakes
CLI>M06:W:POST /api/rd/projects
M12>M07:W:POST /api/crm/leads/:id/convert
M12>M13:W:POST /api/crm/quotations/:id/convert-to-so
M43>M07:R:GET /api/industry-profiles
M13>M07:R:GET /api/customers/:id/credit
M13>M41:R:GET /api/pricing/items
M13>M17:W:POST /api/inventory/transactions
M13>M42:R:POST /api/cogs/calculate-order
M13>M31:W:POST /api/invoices
M16>M13:W:POST /api/sales/orders/convert-from-pos
M16>M17:W:POST /api/inventory/transactions
M16>M32:W:POST /api/treasury/gateway/collect
M09>M08:R:GET /api/suppliers
M10>M08:W:POST /api/sourcing/awards/:id/generate-po
M11>M08:R:GET /api/goods-receipts
M08>M17:W:POST /api/goods-receipts
M08>M42:W:POST /api/cogs/landed-cost
M08>M39:E:IQC được kích hoạt khi tạo Goods Receipt
M39>M17:W:POST /api/quality/batch-releases/:id/approve
M31>M08:R:POST /api/invoices/:id/3way-match
M31>M30:W:POST /api/invoices/:id/post-gl
M32>M30:W:POST /api/treasury/vouchers/:id/approve
M33>M32:W:POST /api/treasury/gateway/collect
M33>M31:W:POST /api/bank/webhook/vietqr
M17>M30:W:POST /api/finance/gl/entries
M17>M22:W:lot_balances
M17>M23:W:serial_numbers
M42>M30:W:POST /api/finance/gl/entries (Nợ 632 / Có 156)
M19>M20:W:POST /api/stocktakes/:id/complete
M20>M17:W:POST /api/stock-adjustments/:id/approve
M20>M42:R:resolve unit cost
M20>M30:W:POST /api/finance/gl/entries
M21>M17:W:POST /api/stock-transfers
M24>M17:W:POST /api/wms/wave-picks/:id/confirm
M24>M18:R:GET /api/wms/capacity-guard
M06>M25:W:POST /api/rd/boms
M06>M17:W:POST /api/rd/projects/:id/material-requisition
M26>M08:W:POST /api/scm/purchase-requisitions/:id/delegate-po
M26>M25:W:POST /api/scm/mo-suggestions
M26>M17:R:GET /api/inventory/balances
M25>M17:W:POST /api/manufacturing/work-orders/:id/issue-materials
M25>M42:R:GET /api/manufacturing/work-orders/:id/cost-variance
M25>M39:W:POST /api/manufacturing/work-orders/:id/qc-hold
M15>M17:W:POST /api/returns/rma/:id/disposition
M15>M30:W:POST /api/returns/credit-notes
M15>M39:W:POST /api/returns/rma/:id/inspect
M15>M14:E:returns.rma.completed
M36>M15:W:POST /api/logistics/shipments/:id/fail-delivery
M36>M13:R:GET /api/sales/orders
M36>M42:W:POST /api/logistics/freight
M28>M30:W:POST /api/hr/payroll/approve
M28>M32:W:POST /api/hr/payroll/:id/disburse
M14>M42:R:GET /api/cogs/transactions
M14>M28:W:POST /api/commission/payouts/:id/pay-via-payroll
M27>M17:W:POST /api/eam/work-orders/:id/issue-parts
M27>M08:W:POST /api/eam/spare-parts/purchase-order
M27>M40:R:GET /api/ehs/permits/asset/:id/active
M38>M27:W:POST /api/service-desk/tickets/:id/create-work-order
M38>M04:W:POST /api/rbac/users/:id/permissions
M35>M17:W:POST /api/projects/:id/material-issue
M35>M31:W:POST /api/projects/:id/billing
M34>M30:R:GET /api/finance/trial-balance
M37>M30:R:GET /api/finance/financial-statements
M37>M42:R:GET /api/cogs/transactions
M29>M05:E:dms.document.sealed.v1
M34>M05:E:finance.consolidation.run.completed.v1
M38>M05:E:servicedesk.ticket.*.v1
M40>M05:E:ehs.incident.logged.v1
M37>M05:E:analytics.report.exported.v1
M05>M14:E:order.fulfilled / invoice.paid
M02>M01:R:audit_logs → flow_spans
M05>M01:R:outbox_events → flow_spans
M17>DB:W:ghi cơ sở dữ liệu
M30>DB:W:ghi cơ sở dữ liệu
M42>DB:W:ghi cơ sở dữ liệu
M31>DB:W:ghi cơ sở dữ liệu
M32>DB:W:ghi cơ sở dữ liệu
M41>DB:W:ghi cơ sở dữ liệu`;

// Flow Presets
const FLOW_PRESETS: Record<string, string> = {
  P2P: 'M09>M08 M10>M08 M08>M17 M08>M42 M08>M39 M39>M17 M31>M08 M31>M30',
  O2C: 'CLI>M13 M12>M13 M13>M07 M13>M41 M13>M17 M13>M42 M13>M31 M31>M30 M37>M30',
  POS: 'CLI>M16 M16>M17 M16>M32 M32>M30 M16>M13',
  STOCKTAKE: 'CLI>M19 M19>M20 M20>M17 M20>M42 M20>M30',
  MFG: 'CLI>M06 M06>M25 M26>M25 M25>M17 M25>M42 M25>M39 M17>M30',
  RETURNS: 'M36>M15 M15>M39 M15>M17 M15>M30 M15>M14',
  PRICING: 'M43>M07 M13>M07 M13>M41',
  FINANCE: 'M31>M30 M32>M30 M33>M32 M28>M30 M34>M30 M37>M30'
};

FLOW_PRESETS.E2E = [
  FLOW_PRESETS.O2C,
  FLOW_PRESETS.P2P,
  FLOW_PRESETS.STOCKTAKE,
  FLOW_PRESETS.MFG,
  FLOW_PRESETS.RETURNS,
  FLOW_PRESETS.FINANCE
].join(' ');

// Business Preset Descriptions
const PRESET_DESCRIPTIONS: Record<string, { name: string; flow: string }> = {
  P2P: {
    name: 'Mua sắm đến Thanh toán (Procure-to-Pay)',
    flow: 'M09 NCC ➔ M10 Đấu thầu RFQ ➔ M08 Đơn PO ➔ M17 Nhập kho GRN ➔ M42 Landed Cost ➔ M39 KCS IQC ➔ M31 Hóa đơn AP ➔ M30 Sổ cái GL'
  },
  O2C: {
    name: 'Bán hàng đến Thu tiền (Order-to-Cash)',
    flow: 'Khách hàng ➔ M12 Báo giá CRM ➔ M13 Đơn SO ➔ M07 Khách ➔ M41 Giá bán ➔ M17 Giữ chỗ ATP ➔ M42 COGS ➔ M31 Hóa đơn AR ➔ M30 Sổ cái'
  },
  POS: {
    name: 'Bán lẻ & Thu ngân tại Quầy (Point of Sale)',
    flow: 'Khách mua tại quầy ➔ M16 POS Ca bán ➔ M17 Xuất kho trực tiếp ➔ M32 Cổng thu tiền ➔ M30 Bút toán doanh thu / VAT'
  },
  STOCKTAKE: {
    name: 'Kiểm kê & Điều chỉnh Tồn kho (Inventory Audit)',
    flow: 'Thủ kho ➔ M19 Phiếu kiểm kê ➔ M20 Điều chỉnh chênh lệch ➔ M17 postTransaction() cập nhật kho ➔ M42 Giá vốn ➔ M30 Sổ cái'
  },
  MFG: {
    name: 'Kế hoạch Sản xuất & Định mức BOM (Manufacturing)',
    flow: 'R&D BOM M06 ➔ M25 Lệnh sản xuất MO ➔ M26 Cung ứng MRP ➔ M17 Xuất NVL / Nhập TP ➔ M42 Giá thành ➔ M39 QC KCS ➔ M30 Sổ cái'
  },
  RETURNS: {
    name: 'Đổi trả hàng & Hoàn tiền (Returns & RMA)',
    flow: 'Giao hàng M36 ➔ M15 Yêu cầu RMA ➔ M39 Giám định hàng hoàn ➔ M17 Hoàn nhập kho ➔ M30 Hoàn nhập doanh thu ➔ M14 Thu hồi hoa hồng'
  },
  PRICING: {
    name: 'Định giá & Bảng giá Đối tác (Pricing Engine)',
    flow: 'M43 Hồ sơ ngành ➔ M07 Danh mục sản phẩm ➔ M13 Đơn bán ➔ M41 Áp dụng bảng giá & chiết khấu bậc thang'
  },
  FINANCE: {
    name: 'Tài chính, Ngân quỹ & Hợp nhất (Finance & Treasury)',
    flow: 'M31 Hóa đơn AR/AP ➔ M32 Lệnh chi ngân quỹ ➔ M33 Đối soát sao kê VietQR ➔ M28 Bảng lương ➔ M30 Sổ cái ➔ M34 Hợp nhất'
  },
  E2E: {
    name: 'Toàn trình Doanh nghiệp Toàn diện (Full Enterprise Circuit)',
    flow: 'Kết hợp toàn diện tất cả 8 mạch nghiệp vụ chuẩn: Thương mại ➔ Cung ứng ➔ Kho vận ➔ Sản xuất ➔ Tài chính ➔ Database'
  }
};

interface M01LiveFlowObservatoryProps {
  onSelectModule?: (def: ModuleDefinition) => void;
  onOpenWorkQueue?: () => void;
  onOpenOmnibar?: () => void;
}

export type FlowViewFilter = 'all' | 'active' | 'selected' | 'errors';

export const M01LiveFlowObservatory: React.FC<M01LiveFlowObservatoryProps> = ({
  onSelectModule,
}) => {
  // Mode state
  const [mode, setMode] = useState<ObservatoryMode>('sim');
  const [activePresetKey, setActivePresetKey] = useState<string>('P2P');
  const [liveStatusText, setLiveStatusText] = useState<string>('SIMULATION: tín hiệu mô phỏng, không ghi dữ liệu thật');
  const [eventsCount, setEventsCount] = useState<number>(0);

  // Contextual Flow Focus UI States
  const [flowViewFilter, setFlowViewFilter] = useState<FlowViewFilter>('all');
  const [hideUnrelated, setHideUnrelated] = useState<boolean>(true);
  const [animateActiveOnly, setAnimateActiveOnly] = useState<boolean>(true);

  // Inspector Selection State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);

  // RCA Modal state
  const [rcaCorrelationId, setRcaCorrelationId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Logs & Incidents
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<LogFilterType>('ALL');

  // SVG Zoom & Pan state
  const [viewBox, setViewBox] = useState<[number, number, number, number]>([0, 0, 1400, 730]);
  const isDraggingRef = useRef<{ startX: number; startY: number; startVB: [number, number, number, number]; moved: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Particles / Animation State
  const particlesRef = useRef<Particle[]>([]);
  const activeEdgesRef = useRef<Map<string, { count: number; isError: boolean }>>(new Map());
  const [, setFrameTick] = useState<number>(0);

  // Build Node Map
  const nodesMap = useMemo(() => {
    const map: Record<string, NodeDef> = {};
    
    // Client Node
    map.CLI = {
      id: 'CLI',
      lb: 'CLIENT',
      name: 'Web · Android · Users',
      k: 'sy',
      api: 'HTTP/REST vào API',
      ci: 0,
      x: 12,
      y: 250,
      w: 130,
      h: 80
    };

    // 6 Columns of ERP Modules
    COLUMNS_DEF.forEach((col, ci) => {
      col.items.forEach((itemStr, rowIdx) => {
        const [id, name, k, api] = itemStr.split('|');
        map[id] = {
          id,
          name,
          k,
          api,
          ci: ci + 1,
          x: 170 + ci * 205,
          y: 64 + rowIdx * 52,
          w: 150,
          h: 36
        };
      });
    });

    // DB Node
    map.DB = {
      id: 'DB',
      lb: 'DB',
      name: 'Database',
      k: 'sy',
      api: 'SQLite / LibSQL',
      ci: 9,
      x: 170,
      y: 650,
      w: 1165,
      h: 44
    };

    return map;
  }, []);

  // Compute Path helper
  const computeBezierPath = useCallback((sourceNode: NodeDef, targetNode: NodeDef): string => {
    const sy = sourceNode.y + sourceNode.h / 2;
    const ty = targetNode.y + targetNode.h / 2;

    if (sourceNode.ci < targetNode.ci) {
      const sx = sourceNode.x + sourceNode.w;
      const tx = targetNode.x;
      const c = Math.max(40, (tx - sx) * 0.45);
      return `M${sx} ${sy}C${sx + c} ${sy} ${tx - c} ${ty} ${tx} ${ty}`;
    }

    if (sourceNode.ci > targetNode.ci) {
      const sx = sourceNode.x;
      const tx = targetNode.x + targetNode.w;
      const c = Math.max(40, (sx - tx) * 0.45);
      return `M${sx} ${sy}C${sx - c} ${sy} ${tx + c} ${ty} ${tx} ${ty}`;
    }

    const sx = sourceNode.x + sourceNode.w;
    const tx = targetNode.x + targetNode.w;
    return `M${sx} ${sy}C${sx + 50} ${sy} ${tx + 50} ${ty} ${tx} ${ty}`;
  }, []);

  // Build Edges Map
  const edgesMap = useMemo(() => {
    const map: Record<string, EdgeDef> = {};
    const dbColumnCounter: Record<number, number> = {};

    RAW_EDGES_LIST.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const [connKey, typeKey, ...rest] = trimmed.split(':');
      const [sourceId, targetId] = connKey.split('>');
      const sourceNode = nodesMap[sourceId];
      const targetNode = nodesMap[targetId];

      if (!sourceNode || !targetNode) return;

      let pathData = '';
      if (targetId === 'DB') {
        const offset = 10 + 6 * ((dbColumnCounter[sourceNode.ci] = (dbColumnCounter[sourceNode.ci] || 0) + 1));
        pathData = `M${sourceNode.x + sourceNode.w} ${sourceNode.y + sourceNode.h / 2}H${sourceNode.x + sourceNode.w + offset}V650`;
      } else {
        pathData = computeBezierPath(sourceNode, targetNode);
      }

      map[connKey] = {
        key: connKey,
        source: sourceId,
        target: targetId,
        type: typeKey as 'R' | 'W' | 'E',
        label: rest.join(':'),
        pathData
      };
    });

    return map;
  }, [nodesMap, computeBezierPath]);

  // Non-DB Edge Keys
  const activeEdgeKeys = useMemo(() => {
    return Object.keys(edgesMap).filter((k) => !k.endsWith('>DB'));
  }, [edgesMap]);

  // Downstream Reachable Nodes calculation
  const getDownstreamNodes = useCallback((moduleId: string): Set<string> => {
    const reachable = new Set<string>();
    const queue = [moduleId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      Object.values(edgesMap).forEach((edge) => {
        if (edge.source === current && edge.target !== 'DB' && edge.target !== moduleId && !reachable.has(edge.target)) {
          reachable.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    return reachable;
  }, [edgesMap]);

  // Upstream Node Providers
  const getUpstreamNodes = useCallback((moduleId: string): string[] => {
    const up = new Set<string>();
    Object.values(edgesMap).forEach((edge) => {
      if (edge.target === moduleId && edge.source !== 'CLI') {
        up.add(edge.source);
      }
    });
    return Array.from(up);
  }, [edgesMap]);

  // Add Incident Handler
  const triggerAddIncident = useCallback((edgeOrNode: { source?: string; target: string; key?: string }, sourceTag: string) => {
    const mod = /^LIVE/.test(sourceTag)
      ? sourceTag.slice(-3)
      : edgeOrNode.target === 'DB'
      ? edgeOrNode.source || edgeOrNode.target
      : edgeOrNode.target;

    const rule = ERROR_RULES[mod] || DEFAULT_ERROR_RULE;
    const timeStr = new Date().toLocaleTimeString('vi-VN');
    const downstreamCount = getDownstreamNodes(mod).size;
    const isSingleWriter = Boolean(SINGLE_WRITER_AUTHORITIES[mod]);
    const severity: 'Cao' | 'Trung bình' | 'Thấp' = isSingleWriter || downstreamCount >= 6 ? 'Cao' : downstreamCount >= 3 ? 'Trung bình' : 'Thấp';

    setIncidents((prev) => {
      const existing = prev.find((x) => x.moduleCode === mod && x.code === rule[0]);
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, count: item.count + 1, time: timeStr } : item
        );
      }
      const newInc: IncidentItem = {
        id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        moduleCode: mod,
        code: rule[0],
        desc: rule[1],
        rec: rule[2],
        count: 1,
        time: timeStr,
        source: sourceTag,
        severity
      };
      return [newInc, ...prev].slice(0, 30);
    });
  }, [getDownstreamNodes]);

  // Append Log Entry
  const appendLog = useCallback((edge: EdgeDef, isErr: boolean, srcTag = 'SIM', corrId?: string) => {
    const entry: LogEntry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: new Date().toLocaleTimeString('vi-VN'),
      source: edge.source,
      target: edge.target,
      type: edge.target === 'DB' ? 'DATABASE' : edge.type === 'R' ? 'READ' : edge.type === 'W' ? 'WRITE' : 'EVENT',
      label: edge.label,
      isError: isErr,
      tag: srcTag,
      correlationId: corrId
    };

    setLogs((prev) => [entry, ...prev].slice(0, 200));
    setEventsCount((c) => c + 1);

    if (isErr) {
      triggerAddIncident(edge, srcTag);
    }
  }, [triggerAddIncident]);

  // Fire a single particle along an edge
  const fireSignal = useCallback((edgeKey: string, delayMs = 0, isErr = false, srcTag = 'SIM', corrId?: string) => {
    setTimeout(() => {
      const edge = edgesMap[edgeKey];
      if (!edge || particlesRef.current.length > 150) return;

      const pId = `P-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      particlesRef.current.push({
        id: pId,
        edgeKey,
        type: edge.type,
        isError: isErr,
        progress: 0,
        pathLength: 300
      });

      const currentActive = activeEdgesRef.current.get(edgeKey) || { count: 0, isError: false };
      activeEdgesRef.current.set(edgeKey, {
        count: currentActive.count + 1,
        isError: isErr || currentActive.isError
      });

      appendLog(edge, isErr, srcTag, corrId);
    }, delayMs);
  }, [edgesMap, appendLog]);

  // Cascade flow from a node
  const handleCascadeFromNode = useCallback((nodeId: string) => {
    const seen = new Set<string>([nodeId]);
    let frontier = [nodeId];
    let depth = 0;

    while (frontier.length > 0 && depth < 3) {
      const nextFrontier: string[] = [];
      frontier.forEach((src) => {
        Object.values(edgesMap)
          .filter((e) => e.source === src)
          .forEach((edge) => {
            fireSignal(edge.key, depth * 750, false, `NODE ${nodeId}`);
            if (!seen.has(edge.target)) {
              seen.add(edge.target);
              nextFrontier.push(edge.target);
            }
          });
      });
      frontier = nextFrontier;
      depth++;
    }
  }, [edgesMap, fireSignal]);

  // Run Flow Preset
  const handleRunPreset = useCallback((presetKey: string) => {
    setActivePresetKey(presetKey);
    const chainStr = FLOW_PRESETS[presetKey];
    if (!chainStr) return;
    const tokens = chainStr.split(' ');
    tokens.forEach((k, i) => {
      fireSignal(k, i * 650, false, `PRESET ${presetKey}`);
    });
  }, [fireSignal]);

  // Trigger Mock Incident
  const handleSimulateIncident = useCallback(() => {
    const writeEdges = activeEdgeKeys.filter((k) => edgesMap[k]?.type === 'W');
    if (writeEdges.length === 0) return;
    const randomEdgeKey = writeEdges[Math.floor(Math.random() * writeEdges.length)];
    fireSignal(randomEdgeKey, 0, true, 'SIM ERROR');
  }, [activeEdgeKeys, edgesMap, fireSignal]);

  // Live Mode Poller
  const pollLiveSpans = useCallback(async () => {
    try {
      try {
        const health = await m01WorkspaceApi.getObservabilityHealth();
        if (health) {
          setLiveStatusText(
            `LIVE · Điểm hệ thống ${health.systemScore ?? '—'} (${health.status || ''}) · ${health.modulesWithActivityToday || 0} module hoạt động`
          );
        }
      } catch {}

      const res = await m01WorkspaceApi.getSpans({ pageSize: 20 });
      const spansList = res.spans || [];

      if (spansList.length === 0) {
        setLiveStatusText('LIVE: Chưa ghi nhận span runtime mới trong phiên hiện tại');
        return;
      }

      spansList.forEach((span, i) => {
        const mod = (span.moduleCode || '').toUpperCase();
        const isBad = span.status === 'FAILED';
        const candidateKeys = activeEdgeKeys.filter((k) => k.startsWith(mod + '>')).slice(0, 3);

        if (isBad && candidateKeys.length === 0) {
          triggerAddIncident({ target: mod }, `LIVE span ${mod}`);
        }

        candidateKeys.forEach((k, j) => {
          fireSignal(k, i * 250, isBad && j === 0, `LIVE span ${mod}`, span.correlationId || undefined);
        });
      });
    } catch {
      setMode('sim');
      setLiveStatusText('LIVE không khả dụng (mất kết nối backend) → chuyển về SIMULATION');
    }
  }, [activeEdgeKeys, fireSignal, triggerAddIncident]);

  // Main animation loop & background simulation ticker
  useEffect(() => {
    let animFrameId: number;
    let lastTime = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (mode !== 'pause') {
        const speed = 320; // px/sec
        particlesRef.current = particlesRef.current.filter((p) => {
          p.progress += (dt * speed) / p.pathLength;
          if (p.progress >= 1) {
            const edge = edgesMap[p.edgeKey];
            if (edge) {
              const active = activeEdgesRef.current.get(p.edgeKey);
              if (active) {
                const nextCount = active.count - 1;
                if (nextCount <= 0) {
                  activeEdgesRef.current.delete(p.edgeKey);
                } else {
                  activeEdgesRef.current.set(p.edgeKey, { ...active, count: nextCount });
                }
              }

              // Propagate to DB for successful writes
              if (edge.type === 'W' && !p.isError) {
                const dbKey = `${edge.target}>DB`;
                if (edgesMap[dbKey]) {
                  fireSignal(dbKey, 50, false, 'DB SYNC');
                }
              }
            }
            return false;
          }
          return true;
        });

        setFrameTick(now);
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [mode, edgesMap, fireSignal]);

  // Simulation random traffic generator
  useEffect(() => {
    if (mode !== 'sim') return;

    const interval = setInterval(() => {
      if (activeEdgeKeys.length === 0) return;
      const randomKey = activeEdgeKeys[Math.floor(Math.random() * activeEdgeKeys.length)];
      const isRandomError = Math.random() < 0.04;
      fireSignal(randomKey, 0, isRandomError, 'SIM');
    }, 950);

    return () => clearInterval(interval);
  }, [mode, activeEdgeKeys, fireSignal]);

  // Live polling interval
  useEffect(() => {
    if (mode !== 'live') return;

    pollLiveSpans();
    const poller = setInterval(pollLiveSpans, 5000);
    return () => clearInterval(poller);
  }, [mode, pollLiveSpans]);

  // Zoom helpers
  const handleZoom = (factor: number) => {
    setViewBox(([x, y, w, h]) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const newW = w / factor;
      const newH = h / factor;
      return [cx - newW / 2, cy - newH / 2, newW, newH];
    });
  };

  const handleFitView = () => {
    setViewBox([0, 0, 1400, 730]);
  };

  // Drag & Pan handlers
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    isDraggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startVB: [...viewBox],
      moved: false
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current || !svgRef.current) return;
    const dx = e.clientX - isDraggingRef.current.startX;
    const dy = e.clientY - isDraggingRef.current.startY;

    if (Math.abs(dx) + Math.abs(dy) > 4) {
      isDraggingRef.current.moved = true;
    }

    if (isDraggingRef.current.moved) {
      const svgWidth = svgRef.current.clientWidth || 1400;
      const scale = isDraggingRef.current.startVB[2] / svgWidth;
      const newX = isDraggingRef.current.startVB[0] - dx * scale;
      const newY = isDraggingRef.current.startVB[1] - dy * scale;
      setViewBox([newX, newY, isDraggingRef.current.startVB[2], isDraggingRef.current.startVB[3]]);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    handleZoom(factor);
  };

  // Inspect selection
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeKey(null);
    setSelectedIncident(null);
    setFlowViewFilter('selected');
  };

  const handleSelectEdge = (edgeKey: string) => {
    setSelectedEdgeKey(edgeKey);
    setSelectedNodeId(null);
    setSelectedIncident(null);
    setFlowViewFilter('selected');
  };

  const handleSelectIncident = (inc: IncidentItem) => {
    setSelectedIncident(inc);
    setSelectedNodeId(inc.moduleCode);
    setSelectedEdgeKey(null);
    setFlowViewFilter('errors');
  };

  const handleClearFocus = () => {
    setSelectedNodeId(null);
    setSelectedEdgeKey(null);
    setSelectedIncident(null);
    setFlowViewFilter('all');
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (logFilter === 'ALL') return true;
      if (logFilter === 'ERROR') return l.isError;
      if (logFilter === 'DATABASE') return l.type === 'DATABASE';
      return l.type === logFilter;
    });
  }, [logs, logFilter]);

  // Contextual Flow Focus Hierarchy Resolver
  const focusContext = useMemo(() => {
    const hasSelection = Boolean(selectedNodeId || selectedEdgeKey || selectedIncident);
    const isFocusMode = hasSelection || flowViewFilter !== 'all';

    if (!isFocusMode) {
      return {
        isFocusMode: false,
        directNodes: new Set<string>(),
        dependencyNodes: new Set<string>(),
        directEdges: new Set<string>(),
        dependencyEdges: new Set<string>(),
        description: ''
      };
    }

    const directNodes = new Set<string>();
    const dependencyNodes = new Set<string>();
    const directEdges = new Set<string>();
    const dependencyEdges = new Set<string>();
    let description = '';

    // Case 1: Specific Node selected (e.g. M08, M17, M30)
    if (selectedNodeId) {
      const node = nodesMap[selectedNodeId];
      directNodes.add(selectedNodeId);
      description = `Phân hệ [${selectedNodeId}] ${node?.name || ''}`;

      // Direct incoming and outgoing edges
      Object.values(edgesMap).forEach((e) => {
        if (e.source === selectedNodeId) {
          directEdges.add(e.key);
          directNodes.add(e.target);
        } else if (e.target === selectedNodeId) {
          directEdges.add(e.key);
          directNodes.add(e.source);
        }
      });

      // 2nd-degree dependencies
      directNodes.forEach((nId) => {
        if (nId === selectedNodeId || nId === 'DB' || nId === 'CLI') return;
        Object.values(edgesMap).forEach((e) => {
          if (!directEdges.has(e.key)) {
            if (e.source === nId) {
              dependencyEdges.add(e.key);
              dependencyNodes.add(e.target);
            } else if (e.target === nId) {
              dependencyEdges.add(e.key);
              dependencyNodes.add(e.source);
            }
          }
        });
      });
    }
    // Case 2: Specific Edge selected (e.g. M08>M17:W)
    else if (selectedEdgeKey) {
      const edge = edgesMap[selectedEdgeKey];
      if (edge) {
        directEdges.add(edge.key);
        directNodes.add(edge.source);
        directNodes.add(edge.target);
        description = `Kết nối [${edge.source} ➔ ${edge.target}] ${edge.label || ''}`;

        // Inbound to source and outbound from target
        Object.values(edgesMap).forEach((e) => {
          if (e.key !== edge.key) {
            if (e.target === edge.source || e.source === edge.target) {
              dependencyEdges.add(e.key);
              dependencyNodes.add(e.source);
              dependencyNodes.add(e.target);
            }
          }
        });
      }
    }
    // Case 3: Specific Incident selected
    else if (selectedIncident) {
      const errMod = selectedIncident.moduleCode;
      directNodes.add(errMod);
      description = `Sự cố [${selectedIncident.code}] Phân hệ ${errMod}`;

      Object.values(edgesMap).forEach((e) => {
        if (e.source === errMod || e.target === errMod) {
          directEdges.add(e.key);
          directNodes.add(e.source);
          directNodes.add(e.target);
        }
      });
    }
    // Case 4: Filter Mode === 'active'
    else if (flowViewFilter === 'active') {
      description = `Các luồng đang truyền tín hiệu thời gian thực (${activeEdgesRef.current.size} kết nối)`;
      activeEdgesRef.current.forEach((_, edgeKey) => {
        const edge = edgesMap[edgeKey];
        if (edge) {
          directEdges.add(edge.key);
          directNodes.add(edge.source);
          directNodes.add(edge.target);
        }
      });
    }
    // Case 5: Filter Mode === 'errors'
    else if (flowViewFilter === 'errors') {
      description = `Tất cả sự cố & ngoại lệ đang mở (${incidents.length} sự cố)`;
      incidents.forEach((inc) => {
        directNodes.add(inc.moduleCode);
        Object.values(edgesMap).forEach((e) => {
          if (e.source === inc.moduleCode || e.target === inc.moduleCode) {
            directEdges.add(e.key);
            directNodes.add(e.source);
            directNodes.add(e.target);
          }
        });
      });
    }

    return {
      isFocusMode: true,
      directNodes,
      dependencyNodes,
      directEdges,
      dependencyEdges,
      description
    };
  }, [selectedNodeId, selectedEdgeKey, selectedIncident, flowViewFilter, edgesMap, nodesMap, incidents]);

  // Highlighted Upstream & Downstream Sets for Selected Incident or Node
  const activeDownstreamSet = useMemo(() => {
    if (selectedIncident) return getDownstreamNodes(selectedIncident.moduleCode);
    if (selectedNodeId) return getDownstreamNodes(selectedNodeId);
    return new Set<string>();
  }, [selectedIncident, selectedNodeId, getDownstreamNodes]);

  const activeUpstreamList = useMemo(() => {
    if (selectedIncident) return getUpstreamNodes(selectedIncident.moduleCode);
    if (selectedNodeId) return getUpstreamNodes(selectedNodeId);
    return [];
  }, [selectedIncident, selectedNodeId, getUpstreamNodes]);

  // Error Modules Set
  const errorModulesSet = useMemo(() => {
    return new Set(incidents.map((i) => i.moduleCode));
  }, [incidents]);

  return (
    <div className="w-full flex flex-col bg-[#eef2f8] dark:bg-[#0a111e] text-[#0f1a2e] dark:text-[#e6edf7] font-sans border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-md">
      {/* Rule #19 ConfirmDialog */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* RCA Trace Modal */}
      <CorrelationRcaTraceModal
        isOpen={Boolean(rcaCorrelationId)}
        onClose={() => setRcaCorrelationId(null)}
        correlationId={rcaCorrelationId || ''}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER: Mode switcher & Global counter summary
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="flex flex-wrap items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-[#111b2e] border-b border-slate-300 dark:border-[#2a3a57] text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Icons.Radio className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            NexusSync ERP · M01 Workspace Hub
          </h2>
        </div>

        <span className="hidden lg:inline text-slate-500 dark:text-[#8fa1bd]">
          Vận hành: luồng nghiệp vụ, sự cố và đề xuất xử lý (chỉ đọc)
        </span>

        {/* Dynamic Status Tag */}
        <div className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-[#2a3a57] bg-[#eef2f8] dark:bg-[#0a111e] font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-md">
          {mode === 'live' && <span className="text-emerald-500 font-bold mr-1.5">●</span>}
          {mode === 'sim' && <span className="text-amber-500 font-bold mr-1.5">◆</span>}
          {mode === 'pause' && <span className="text-slate-400 font-bold mr-1.5">❚❚</span>}
          {mode === 'inspect' && <span className="text-cyan-400 font-bold mr-1.5">🔍</span>}
          <span>{liveStatusText}</span>
        </div>

        <div className="flex-1" />

        {/* Summary Counter */}
        <div className="hidden sm:flex items-center gap-2 text-slate-500 dark:text-[#8fa1bd] text-[11px] font-mono">
          <span>{Object.keys(nodesMap).length - 2} module</span>
          <span>·</span>
          <span>{Object.keys(edgesMap).length} kết nối</span>
          <span>·</span>
          <span>
            sự kiện: <strong className="text-slate-900 dark:text-white tabular-nums">{eventsCount}</strong>
          </span>
          <span>·</span>
          <span>
            sự cố mở:{' '}
            <strong className={`${incidents.length > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'} tabular-nums`}>
              {incidents.length}
            </strong>
          </span>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1 bg-[#eef2f8] dark:bg-[#0a111e] p-1 rounded-lg border border-slate-300 dark:border-[#2a3a57]">
          {(['live', 'sim', 'pause', 'inspect'] as ObservatoryMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                if (m === 'live') {
                  setLiveStatusText('LIVE: Đang kết nối GET /api/workspace/observability/spans...');
                } else if (m === 'sim') {
                  setLiveStatusText('SIMULATION: Tín hiệu mô phỏng, không ghi dữ liệu thật');
                } else if (m === 'pause') {
                  setLiveStatusText('PAUSED: Đã tạm dừng chuyển động');
                } else if (m === 'inspect') {
                  setLiveStatusText('INSPECT: Chọn node hoặc kết nối để xem chi tiết');
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                mode === m
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m === 'live' ? 'LIVE' : m === 'sim' ? 'SIMULATION' : m === 'pause' ? 'PAUSED' : 'INSPECT'}
            </button>
          ))}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          NAVBAR: Process Chain Presets & View Controls
          ═══════════════════════════════════════════════════════════════════════ */}
      <nav className="flex flex-col gap-1.5 px-4 py-2 bg-[#f8fafc] dark:bg-[#0e1726] border-b border-slate-300 dark:border-[#2a3a57] text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 dark:text-[#8fa1bd] font-medium mr-1">Luồng nghiệp vụ:</span>

          {Object.keys(FLOW_PRESETS).map((pKey) => {
            const isActive = activePresetKey === pKey;
            return (
              <button
                key={pKey}
                type="button"
                onClick={() => handleRunPreset(pKey)}
                className={`px-2.5 py-1 rounded-md border font-mono text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'border-slate-300 dark:border-[#2a3a57] bg-white dark:bg-[#111b2e] text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {pKey}
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Simulate Incident Button */}
          <button
            type="button"
            onClick={handleSimulateIncident}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-[11px] cursor-pointer transition-all shadow-2xs"
          >
            <Icons.AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Mô phỏng sự cố</span>
          </button>

          <div className="flex-1" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleZoom(1.25)}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 dark:border-[#2a3a57] bg-white dark:bg-[#111b2e] text-slate-700 dark:text-slate-300 font-bold hover:border-blue-500 cursor-pointer"
              title="Phóng to"
            >
              ＋
            </button>
            <button
              type="button"
              onClick={() => handleZoom(0.8)}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 dark:border-[#2a3a57] bg-white dark:bg-[#111b2e] text-slate-700 dark:text-slate-300 font-bold hover:border-blue-500 cursor-pointer"
              title="Thu nhỏ"
            >
              －
            </button>
            <button
              type="button"
              onClick={handleFitView}
              className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-[#2a3a57] bg-white dark:bg-[#111b2e] text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer"
              title="Vừa khung nhìn"
            >
              Vừa khung
            </button>
          </div>
        </div>

        {/* Dynamic Business Flow Sequence Bar */}
        {activePresetKey && PRESET_DESCRIPTIONS[activePresetKey] && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-[11px]">
            <span className="font-bold text-blue-700 dark:text-blue-300 shrink-0 font-mono">
              [{activePresetKey}] {PRESET_DESCRIPTIONS[activePresetKey].name}:
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-mono text-[10.5px] truncate">
              {PRESET_DESCRIPTIONS[activePresetKey].flow}
            </span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            CONTEXTUAL FLOW FOCUS CONTROL BAR (Rule #19 & Anti-Slop Compliant)
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-1.5 bg-white dark:bg-[#111b2e] border border-slate-300 dark:border-[#2a3a57] rounded-xl text-xs shadow-2xs">
          {/* Left: Flow View Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Icons.Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>Chế độ quan sát (Flow View):</span>
            </span>

            <div className="flex items-center bg-[#eef2f8] dark:bg-[#0a111e] p-0.5 rounded-lg border border-slate-300 dark:border-[#2a3a57]">
              <button
                type="button"
                onClick={() => setFlowViewFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  flowViewFilter === 'all' && !focusContext.isFocusMode
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ● Tất cả (All)
              </button>

              <button
                type="button"
                onClick={() => setFlowViewFilter('active')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  flowViewFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ● Đang chạy (Active)
              </button>

              <button
                type="button"
                onClick={() => setFlowViewFilter('selected')}
                disabled={!selectedNodeId && !selectedEdgeKey}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer disabled:opacity-40 ${
                  flowViewFilter === 'selected' || (Boolean(selectedNodeId || selectedEdgeKey) && flowViewFilter !== 'errors')
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ● Tuyến đã chọn (Selected Path)
              </button>

              <button
                type="button"
                onClick={() => setFlowViewFilter('errors')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  flowViewFilter === 'errors' || selectedIncident
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ● Lỗi / Sự cố (Errors)
              </button>
            </div>
          </div>

          {/* Center / Right: Checkboxes & Clear Focus */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={hideUnrelated}
                onChange={(e) => setHideUnrelated(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>Ẩn kết nối không liên quan</span>
            </label>

            <label className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={animateActiveOnly}
                onChange={(e) => setAnimateActiveOnly(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>Chỉ phát hiệu ứng luồng đang chạy</span>
            </label>

            {/* Clear Focus Button */}
            {focusContext.isFocusMode && (
              <button
                type="button"
                onClick={handleClearFocus}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] cursor-pointer shadow-xs transition-all animate-pulse"
                title="Bỏ chọn để hiển thị lại toàn bộ bản đồ"
              >
                <Icons.XCircle className="w-3.5 h-3.5" />
                <span>Xóa Focus (Clear Focus)</span>
              </button>
            )}
          </div>
        </div>

        {/* Focus Banner Indicator if active */}
        {focusContext.isFocusMode && focusContext.description && (
          <div className="flex items-center justify-between px-3 py-1 bg-cyan-50/90 dark:bg-cyan-950/50 border border-cyan-300 dark:border-cyan-800 rounded-lg text-xs">
            <div className="flex items-center gap-1.5 text-cyan-800 dark:text-cyan-200 font-medium truncate">
              <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-cyan-200 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-100">
                Focus Mode Active
              </span>
              <span className="truncate">Đang làm nổi bật: <strong>{focusContext.description}</strong></span>
              <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">
                ({focusContext.directEdges.size} trực tiếp · {focusContext.dependencyEdges.size} phụ thuộc)
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearFocus}
              className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 hover:underline cursor-pointer ml-2 shrink-0"
            >
              Hiển thị toàn bộ ➔
            </button>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CANVAS: SVG Circuit Map (Left) + Right Drawer (Inspector/Incidents)
          ═══════════════════════════════════════════════════════════════════════ */}
      <main className="grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-[580px] bg-[#eef2f8] dark:bg-[#0a111e]">
        {/* SVG Interactive Canvas */}
        <div className="relative w-full h-[580px] overflow-hidden select-none">
          <svg
            ref={svgRef}
            viewBox={viewBox.join(' ')}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
            role="img"
            aria-label="Bản đồ luồng API và dữ liệu giữa các module NexusSync ERP"
          >
            {/* High-Fidelity SVG Glow Filters & Gradients */}
            <defs>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood floodColor="#38bdf8" floodOpacity="0.8" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feFlood floodColor="#fbbf24" floodOpacity="0.85" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feFlood floodColor="#c084fc" floodOpacity="0.8" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feFlood floodColor="#f87171" floodOpacity="0.9" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="node-active-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Column Headers */}
            {COLUMNS_DEF.map((c, ci) => (
              <text
                key={c.title}
                x={170 + ci * 205}
                y={44}
                className="text-[11px] font-semibold fill-slate-500 dark:fill-[#8fa1bd] font-sans select-none"
              >
                {c.title}
              </text>
            ))}

            {/* Connection Edges Layer */}
            <g className="edges-layer">
              {Object.values(edgesMap).map((edge) => {
                const isActive = activeEdgesRef.current.has(edge.key);
                const activeData = activeEdgesRef.current.get(edge.key);
                const isSelected = selectedEdgeKey === edge.key;

                // Determine Visual Priority Level
                let focusLevel: 1 | 2 | 3 = 1;
                if (focusContext.isFocusMode) {
                  if (focusContext.directEdges.has(edge.key) || isSelected) {
                    focusLevel = 1;
                  } else if (focusContext.dependencyEdges.has(edge.key)) {
                    focusLevel = 2;
                  } else {
                    focusLevel = 3;
                  }
                }

                // If Level 3 and hideUnrelated, completely suppress from render
                if (focusContext.isFocusMode && focusLevel === 3 && hideUnrelated && !isActive) {
                  return null;
                }

                let strokeColor = '#bcc8dc';
                let glowFilter = '';
                let activeGlowColor = '';

                if (isSelected || (focusContext.isFocusMode && focusLevel === 1)) {
                  strokeColor = '#0284c7';
                  glowFilter = 'url(#glow-cyan)';
                }

                if (isActive) {
                  if (activeData?.isError) {
                    strokeColor = '#dc2626';
                    activeGlowColor = '#ef4444';
                    glowFilter = 'url(#glow-red)';
                  } else if (edge.type === 'R') {
                    strokeColor = '#0284c7';
                    activeGlowColor = '#38bdf8';
                    glowFilter = 'url(#glow-cyan)';
                  } else if (edge.type === 'W') {
                    strokeColor = '#d97706';
                    activeGlowColor = '#fbbf24';
                    glowFilter = 'url(#glow-amber)';
                  } else {
                    strokeColor = '#7c3aed';
                    activeGlowColor = '#c084fc';
                    glowFilter = 'url(#glow-purple)';
                  }
                }

                // Opacity hierarchy
                let edgeOpacity = 0.75;
                if (focusContext.isFocusMode) {
                  if (focusLevel === 1) edgeOpacity = 1.0;
                  else if (focusLevel === 2) edgeOpacity = 0.28;
                  else edgeOpacity = 0.08;
                }
                if (isActive) edgeOpacity = 1.0;

                return (
                  <g key={edge.key} opacity={edgeOpacity}>
                    {/* Layer 1: Glowing Halo Aura Tube when Active or Selected */}
                    {(isActive || isSelected || (focusContext.isFocusMode && focusLevel === 1)) && (
                      <path
                        d={edge.pathData}
                        fill="none"
                        stroke={activeGlowColor || strokeColor}
                        strokeWidth={isActive ? 6.5 : 4.5}
                        strokeOpacity={0.55}
                        filter={glowFilter}
                        className="transition-all duration-150 animate-pulse"
                      />
                    )}

                    {/* Layer 2: Main Visual Path */}
                    <path
                      d={edge.pathData}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isActive ? 3.2 : isSelected || (focusContext.isFocusMode && focusLevel === 1) ? 2.6 : edge.type === 'W' ? 1.8 : 1.1}
                      strokeDasharray={edge.type === 'E' ? '4 3' : undefined}
                      className="transition-all duration-150"
                    />

                    {/* Layer 3: Thick hit test area for easy click */}
                    <path
                      d={edge.pathData}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      className="cursor-pointer"
                      onClick={() => handleSelectEdge(edge.key)}
                    />
                  </g>
                );
              })}
            </g>

            {/* Module Nodes Layer */}
            <g className="nodes-layer">
              {Object.values(nodesMap).map((n) => {
                const isSelected = selectedNodeId === n.id;
                const isDownstream = activeDownstreamSet.has(n.id);
                const isUpstream = activeUpstreamList.includes(n.id);
                const isBad = errorModulesSet.has(n.id);
                const isAuthority = Boolean(SINGLE_WRITER_AUTHORITIES[n.id]);
                const catColor = CATEGORY_COLORS[n.k] || '#94a3b8';

                // Focus Level for Node
                let nodeFocusLevel: 1 | 2 | 3 = 1;
                if (focusContext.isFocusMode) {
                  if (focusContext.directNodes.has(n.id) || isSelected) {
                    nodeFocusLevel = 1;
                  } else if (focusContext.dependencyNodes.has(n.id)) {
                    nodeFocusLevel = 2;
                  } else {
                    nodeFocusLevel = 3;
                  }
                }

                let nodeOpacity = 1.0;
                if (focusContext.isFocusMode) {
                  if (nodeFocusLevel === 1) nodeOpacity = 1.0;
                  else if (nodeFocusLevel === 2) nodeOpacity = 0.65;
                  else nodeOpacity = hideUnrelated ? 0.16 : 0.35;
                }

                // Check if this node is currently sending or receiving an active flow signal
                const isActivelyProcessing = Array.from(activeEdgesRef.current.keys()).some((edgeKey) => {
                  const edge = edgesMap[edgeKey];
                  return edge && (edge.source === n.id || edge.target === n.id);
                });

                let strokeColor = catColor;
                let strokeWidth = isAuthority ? 2.6 : 1.2;
                let fillColor = '#ffffff';

                if (isSelected || (focusContext.isFocusMode && nodeFocusLevel === 1)) {
                  strokeColor = '#0284c7';
                  strokeWidth = 3.2;
                } else if (isDownstream) {
                  strokeColor = '#dc2626';
                  strokeWidth = 3.2;
                } else if (isUpstream) {
                  strokeColor = '#f97316';
                  strokeWidth = 3.2;
                } else if (isActivelyProcessing) {
                  strokeColor = '#38bdf8';
                  strokeWidth = 2.8;
                }

                if (isBad) {
                  fillColor = 'rgba(220, 38, 38, 0.14)';
                }

                return (
                  <g
                    key={n.id}
                    tabIndex={0}
                    onClick={() => handleSelectNode(n.id)}
                    opacity={nodeOpacity}
                    className="cursor-pointer focus:outline-hidden group transition-opacity duration-150"
                  >
                    {/* Active Pulse Ring around Processing or Selected Node */}
                    {(isActivelyProcessing || isSelected || (focusContext.isFocusMode && nodeFocusLevel === 1 && isSelected)) && (
                      <rect
                        x={n.x - 3}
                        y={n.y - 3}
                        width={n.w + 6}
                        height={n.h + 6}
                        rx={9}
                        fill="none"
                        stroke={isSelected ? '#0284c7' : '#38bdf8'}
                        strokeWidth={2.0}
                        strokeDasharray={isSelected ? undefined : '4 2'}
                        className="animate-pulse"
                      />
                    )}

                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.w}
                      height={n.h}
                      rx={6}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      className="transition-all dark:fill-[#111b2e] group-hover:stroke-blue-400"
                    />

                    {n.id === 'DB' ? (
                      <text
                        x={n.x + n.w / 2}
                        y={n.y + 26}
                        textAnchor="middle"
                        className="text-[11px] font-mono fill-slate-500 dark:fill-[#8fa1bd] select-none font-bold"
                      >
                        DATABASE (SQLite / LibSQL) — stock_ledger · accounting_entries · cost_layers · audit_logs · outbox_events · flow_spans
                      </text>
                    ) : (
                      <>
                        <text
                          x={n.x + 8}
                          y={n.y + 15}
                          className="font-bold text-[12px] font-mono select-none"
                          fill={isBad ? '#dc2626' : catColor}
                        >
                          {n.lb || n.id}
                        </text>
                        <text
                          x={n.x + 8}
                          y={n.y + 29}
                          className="text-[10.5px] fill-slate-800 dark:fill-[#e6edf7] select-none font-medium"
                        >
                          {n.name}
                        </text>
                      </>
                    )}

                    {/* Authority Indicator Dot */}
                    {isAuthority && (
                      <circle
                        cx={n.x + n.w - 9}
                        cy={n.y + 9}
                        r={4}
                        fill="#eab308"
                        className="animate-pulse"
                      >
                        <title>{SINGLE_WRITER_AUTHORITIES[n.id]}</title>
                      </circle>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Particle Signal Layer */}
            <g className="particles-layer pointer-events-none">
              {particlesRef.current.map((p) => {
                const edge = edgesMap[p.edgeKey];
                if (!edge) return null;

                // Calculate exact point along Bezier curve
                const srcNode = nodesMap[edge.source];
                const tgtNode = nodesMap[edge.target];
                if (!srcNode || !tgtNode) return null;

                const sx = srcNode.x + srcNode.w;
                const sy = srcNode.y + srcNode.h / 2;
                const tx = tgtNode.x;
                const ty = tgtNode.y + tgtNode.h / 2;

                const t = Math.max(0, Math.min(1, p.progress));
                const mt = 1 - t;
                let curX = sx;
                let curY = sy;

                if (edge.target === 'DB') {
                  const offset = 10 + 6 * srcNode.ci;
                  const cornerX = srcNode.x + srcNode.w + offset;
                  if (t < 0.25) {
                    const subT = t / 0.25;
                    curX = sx + (cornerX - sx) * subT;
                    curY = sy;
                  } else {
                    const subT = (t - 0.25) / 0.75;
                    curX = cornerX;
                    curY = sy + (650 - sy) * subT;
                  }
                } else {
                  let cx1 = sx;
                  let cy1 = sy;
                  let cx2 = tx;
                  let cy2 = ty;

                  if (srcNode.ci < tgtNode.ci) {
                    const c = Math.max(40, (tx - sx) * 0.45);
                    cx1 = sx + c;
                    cy1 = sy;
                    cx2 = tx - c;
                    cy2 = ty;
                  } else if (srcNode.ci > tgtNode.ci) {
                    const c = Math.max(40, (sx - tx) * 0.45);
                    cx1 = sx - c;
                    cy1 = sy;
                    cx2 = tx + c;
                    cy2 = ty;
                  } else {
                    cx1 = sx + 50;
                    cy1 = sy;
                    cx2 = tx + 50;
                    cy2 = ty;
                  }

                  curX = mt * mt * mt * sx + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * tx;
                  curY = mt * mt * mt * sy + 3 * mt * mt * t * cy1 + 3 * mt * t * t * cy2 + t * t * t * ty;
                }

                if (p.isError) {
                  return (
                    <circle
                      key={p.id}
                      cx={curX}
                      cy={curY}
                      r={5}
                      fill="#dc2626"
                      className="shadow-sm"
                    />
                  );
                }

                if (p.type === 'R') {
                  return (
                    <circle
                      key={p.id}
                      cx={curX}
                      cy={curY}
                      r={3.5}
                      fill="#0284c7"
                      className="shadow-sm"
                    />
                  );
                }

                return (
                  <rect
                    key={p.id}
                    x={curX - 4}
                    y={curY - 4}
                    width={8}
                    height={8}
                    fill={p.type === 'W' ? '#d97706' : '#7c3aed'}
                    transform={p.type === 'E' ? `rotate(45 ${curX} ${curY})` : undefined}
                  />
                );
              })}
            </g>

            {/* Footer Legend Text inside Canvas */}
            <text
              x={170}
              y={718}
              className="text-[11px] font-mono fill-slate-500 dark:fill-[#8fa1bd]"
            >
              Business engines: InventoryService · CostingEngine · AccountingEngine · PricingEngine · SalesEngine · TreasuryService · InvoiceService. Mọi module ghi audit qua M02.
            </text>
          </svg>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            RIGHT ASIDE DRAWER: Incidents & Node/Edge Inspector
            ═══════════════════════════════════════════════════════════════════════ */}
        <aside className="border-t lg:border-t-0 lg:border-l border-slate-300 dark:border-[#2a3a57] bg-white dark:bg-[#111b2e] p-3.5 overflow-y-auto text-xs space-y-4">
          {/* Incident List Section */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center justify-between mb-2">
              <span>Sự cố đang mở ({incidents.length})</span>
              {incidents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIncidents([])}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </h3>

            {incidents.length === 0 ? (
              <p className="text-slate-400 text-[11px] italic">
                Chưa có sự cố. Bấm "Mô phỏng sự cố" để xem cách hệ thống phát hiện và đề xuất xử lý.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {incidents.slice(0, 8).map((inc) => (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => handleSelectIncident(inc)}
                    className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedIncident?.id === inc.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50'
                        : 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                        {inc.moduleCode} · {inc.code}
                      </span>
                      {inc.count > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-mono font-bold">
                          ×{inc.count}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Mức {inc.severity} · {inc.time} {inc.source.startsWith('LIVE') ? '· LIVE' : '· mô phỏng'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Inspector Detail View */}
          <div className="space-y-3">
            {/* INCIDENT DETAIL VIEW */}
            {selectedIncident ? (
              <div className="space-y-2.5">
                <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400">
                  {selectedIncident.moduleCode} — {selectedIncident.code}
                </h3>

                <dl className="grid grid-cols-[80px_1fr] gap-1.5 text-[11px]">
                  <dt className="text-slate-400 font-medium">Mức độ:</dt>
                  <dd className="font-semibold text-rose-600 dark:text-rose-300">
                    {selectedIncident.severity} ({getDownstreamNodes(selectedIncident.moduleCode).size} module hạ nguồn)
                  </dd>

                  <dt className="text-slate-400 font-medium">Nguồn:</dt>
                  <dd className="font-mono text-slate-700 dark:text-slate-300">{selectedIncident.source}</dd>

                  <dt className="text-slate-400 font-medium">Mô tả:</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{selectedIncident.desc}</dd>
                </dl>

                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-1">
                    Đề xuất xử lý:
                  </h4>
                  <p className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-[11px]">
                    {selectedIncident.rec}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-1">
                    Nghi vấn thượng nguồn (viền cam):
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {getUpstreamNodes(selectedIncident.moduleCode).join(', ') || '—'}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-1">
                    Ảnh hưởng hạ nguồn (viền đỏ):
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {Array.from(getDownstreamNodes(selectedIncident.moduleCode)).join(', ') || '—'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRcaCorrelationId(selectedIncident.correlationId || `corr-${selectedIncident.moduleCode}`)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    <Icons.Search className="w-3.5 h-3.5" />
                    <span>Tra cứu RCA Correlation Trace</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Chỉ đề xuất, không tự sửa dữ liệu. Thực thi qua panel M01 hoặc service thẩm quyền.
                  </p>
                </div>
              </div>
            ) : selectedEdgeKey ? (
              /* EDGE / CONNECTION INSPECTOR */
              (() => {
                const edge = edgesMap[selectedEdgeKey];
                if (!edge) return null;
                const methodMatch = edge.label.match(/^(GET|POST|PUT|PATCH|DELETE)\b/);
                const methodStr = methodMatch ? methodMatch[1] : '—';
                const srcNode = nodesMap[edge.source];
                const tgtNode = nodesMap[edge.target];

                return (
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400 font-mono">
                      {edge.source} → {edge.target}
                    </h3>

                    <dl className="grid grid-cols-[90px_1fr] gap-1.5 text-[11px]">
                      <dt className="text-slate-400">Nguồn:</dt>
                      <dd className="font-semibold text-slate-800 dark:text-slate-200">{srcNode?.name || edge.source}</dd>

                      <dt className="text-slate-400">Đích:</dt>
                      <dd className="font-semibold text-slate-800 dark:text-slate-200">{tgtNode?.name || edge.target}</dd>

                      <dt className="text-slate-400">Loại:</dt>
                      <dd className="font-mono font-bold text-slate-900 dark:text-white">
                        {edge.type === 'R' ? 'READ' : edge.type === 'W' ? 'WRITE' : 'EVENT'}
                      </dd>

                      <dt className="text-slate-400">Method:</dt>
                      <dd className="font-mono font-bold text-blue-600 dark:text-blue-400">{methodStr}</dd>

                      <dt className="text-slate-400">Endpoint/Event:</dt>
                      <dd className="font-mono text-slate-800 dark:text-slate-200 break-all">{edge.label}</dd>

                      <dt className="text-slate-400">Service:</dt>
                      <dd className="font-mono text-emerald-600 dark:text-emerald-400">
                        {DOMAIN_SERVICES[edge.target] || tgtNode?.name || '—'}
                      </dd>

                      <dt className="text-slate-400">Nguồn dữ liệu:</dt>
                      <dd className="text-slate-600 dark:text-slate-400">Tài liệu kiến trúc (tĩnh)</dd>

                      <dt className="text-slate-400">Tín hiệu:</dt>
                      <dd className="text-slate-600 dark:text-slate-400 font-mono">
                        {mode === 'live' ? 'LIVE (theo span)' : 'Mô phỏng, không ghi dữ liệu'}
                      </dd>
                    </dl>

                    <button
                      type="button"
                      onClick={() => fireSignal(edge.key, 0, false, 'MANUAL FIRE')}
                      className="w-full mt-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-pointer transition-all"
                    >
                      Phát tín hiệu thử nghiệm
                    </button>
                  </div>
                );
              })()
            ) : selectedNodeId ? (
              /* MODULE NODE INSPECTOR */
              (() => {
                const node = nodesMap[selectedNodeId];
                if (!node) return null;
                const authorityText = SINGLE_WRITER_AUTHORITIES[selectedNodeId];
                const incomingEdges = Object.values(edgesMap).filter((e) => e.target === selectedNodeId);
                const outgoingEdges = Object.values(edgesMap).filter((e) => e.source === selectedNodeId);

                return (
                  <div className="space-y-2.5">
                    <h3
                      className="font-bold text-sm"
                      style={{ color: CATEGORY_COLORS[node.k] || '#38bdf8' }}
                    >
                      {node.lb || node.id} — {node.name}
                    </h3>

                    <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{node.api}</p>

                    {authorityText && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 font-semibold text-[11px]">
                        ◆ {authorityText}
                      </div>
                    )}

                    {selectedNodeId === 'M01' && (
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-[11px]">
                        M01 không phải authority mới: chỉ đọc audit_logs (M02) và outbox_events (M05) rồi chiếu sang flow_spans / module_kpi_snapshots.
                      </div>
                    )}

                    {selectedNodeId !== 'DB' && selectedNodeId !== 'CLI' && (
                      <button
                        type="button"
                        onClick={() => handleCascadeFromNode(selectedNodeId)}
                        className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-xs transition-all"
                      >
                        Phát tín hiệu từ node này
                      </button>
                    )}

                    {/* Incoming Flows */}
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-1">Đi vào:</h4>
                      {incomingEdges.length === 0 ? (
                        <p className="text-slate-400 text-[11px]">Không có</p>
                      ) : (
                        <ul className="space-y-1 max-h-28 overflow-y-auto">
                          {incomingEdges.map((e) => (
                            <li key={e.key} className="flex items-center justify-between text-[11px]">
                              <button
                                type="button"
                                onClick={() => handleSelectEdge(e.key)}
                                className="text-blue-600 dark:text-blue-400 font-mono hover:underline cursor-pointer"
                              >
                                {e.source} → {e.target}
                              </button>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {e.type === 'R' ? 'READ' : e.type === 'W' ? 'WRITE' : 'EVENT'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Outgoing Flows */}
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-1">Đi ra:</h4>
                      {outgoingEdges.length === 0 ? (
                        <p className="text-slate-400 text-[11px]">Không có</p>
                      ) : (
                        <ul className="space-y-1 max-h-28 overflow-y-auto">
                          {outgoingEdges.map((e) => (
                            <li key={e.key} className="flex items-center justify-between text-[11px]">
                              <button
                                type="button"
                                onClick={() => handleSelectEdge(e.key)}
                                className="text-blue-600 dark:text-blue-400 font-mono hover:underline cursor-pointer"
                              >
                                {e.source} → {e.target}
                              </button>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {e.type === 'R' ? 'READ' : e.type === 'W' ? 'WRITE' : 'EVENT'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              /* DEFAULT GUIDE IN DRAWER */
              <div className="space-y-2.5">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cách đọc bản đồ</h3>
                <dl className="grid grid-cols-[20px_1fr] gap-1.5 text-[11px]">
                  <dt className="text-blue-500 font-bold">●</dt>
                  <dd className="text-slate-700 dark:text-slate-300">READ — tín hiệu tròn, đường mảnh</dd>
                  <dt className="text-amber-500 font-bold">■</dt>
                  <dd className="text-slate-700 dark:text-slate-300">WRITE — tín hiệu vuông, đường đậm</dd>
                  <dt className="text-purple-500 font-bold">◆</dt>
                  <dd className="text-slate-700 dark:text-slate-300">EVENT — tín hiệu thoi, đường nét đứt</dd>
                  <dt className="text-rose-500 font-bold">✕</dt>
                  <dd className="text-slate-700 dark:text-slate-300">ERROR — tín hiệu đỏ (chỉ mô phỏng)</dd>
                </dl>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Chấm vàng trên node là thẩm quyền ghi duy nhất (M17, M30, M41, M42). Bấm node hoặc đường nối để xem chi tiết.
                </p>
                <p className="text-[10px] text-slate-400 italic">
                  Nguồn: MODULE_MAP, API_CATALOG, BUSINESS_RULES (2026-09-27). M01 chỉ đọc M02/M05 để chiếu vào flow_spans.
                </p>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER: Real-time Log Stream & Type Filters
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-300 dark:border-[#2a3a57] bg-white dark:bg-[#111b2e] p-3 text-xs flex flex-col gap-2">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'READ', 'WRITE', 'EVENT', 'ERROR', 'DATABASE'] as LogFilterType[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setLogFilter(f)}
              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                logFilter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#eef2f8] dark:bg-[#0a111e] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#2a3a57] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Real-time Log Stream */}
        <div className="h-32 overflow-y-auto font-mono text-[11px] space-y-0.5 pr-2 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-400 text-center py-4">Chưa có luồng tín hiệu nào được ghi nhận.</div>
          ) : (
            filteredLogs.slice(0, 60).map((l) => {
              let colorClass = 'text-slate-700 dark:text-slate-300';
              if (l.isError) colorClass = 'text-rose-600 dark:text-rose-400 font-bold';
              else if (l.type === 'READ') colorClass = 'text-blue-600 dark:text-blue-400';
              else if (l.type === 'WRITE') colorClass = 'text-amber-600 dark:text-amber-400';
              else if (l.type === 'EVENT') colorClass = 'text-purple-600 dark:text-purple-400';
              else if (l.type === 'DATABASE') colorClass = 'text-emerald-600 dark:text-emerald-400';

              return (
                <div key={l.id} className={`whitespace-nowrap ${colorClass}`}>
                  <span className="text-slate-400">{l.time}</span>
                  {'  '}
                  <strong className="font-bold">{l.source} → {l.target}</strong>
                  {'  '}
                  <span>{l.type === 'DATABASE' ? 'WRITE→DB' : l.type}</span>
                  {'  '}
                  <span className="truncate max-w-sm inline-block align-bottom">{l.label}</span>
                  {'  '}
                  <span>{l.isError ? 'ERR (lỗi mô phỏng)' : 'OK'}</span>
                  {'  '}
                  <span className="text-slate-400">[{l.tag}]</span>
                </div>
              );
            })
          )}
        </div>
      </footer>
    </div>
  );
};
