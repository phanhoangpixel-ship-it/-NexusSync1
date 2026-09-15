import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Layers, Factory, Package, ShoppingCart, Truck, ZoomIn, ZoomOut, 
  RotateCcw, Maximize2, Search, Filter, ShieldCheck, ArrowRight,
  Info, ExternalLink, Activity, CheckCircle2, ChevronRight, Download
} from 'lucide-react';
import { LotItem } from '../LotInventoryHistoryDrilldown';

export type TraceNodeType = 'SUPPLIER' | 'LOT' | 'WORK_ORDER' | 'FINISHED_GOOD' | 'SALES_ORDER';

export interface TraceGraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: TraceNodeType;
  code: string;
  name: string;
  subtitle?: string;
  quantity?: number;
  uom?: string;
  status: string;
  date?: string;
  operator?: string;
  workcenter?: string;
  qualityScore?: string;
  notes?: string;
  level: number; // 0: Supplier, 1: Raw Lot, 2: WO, 3: FG, 4: SO/Customer
  color?: string;
}

export interface TraceGraphLink extends d3.SimulationLinkDatum<TraceGraphNode> {
  id: string;
  source: string | TraceGraphNode;
  target: string | TraceGraphNode;
  relation: string;
  quantity?: number;
  uom?: string;
  date?: string;
}

interface LotDependencyGraphD3Props {
  lot: LotItem;
  onSelectEntity?: (entity: any) => void;
  onInspectWorkOrder?: (woIdOrCode: string | number) => void;
}

// Generate realistic traceability data graph based on the active Lot
export function generateTraceDataForLot(lot: LotItem): { nodes: TraceGraphNode[]; links: TraceGraphLink[] } {
  const nodes: TraceGraphNode[] = [];
  const links: TraceGraphLink[] = [];

  // Level 0: Supplier / PO Inbound
  const supplierId = `SUP-${lot.supplierLot || 'INBOUND'}`;
  nodes.push({
    id: supplierId,
    type: 'SUPPLIER',
    code: lot.supplierLot || 'PO-2026-INBOUND',
    name: lot.supplierLot?.startsWith('SUP') ? 'Nhà cung cấp Yaskawa Electric Corp' : 
          lot.supplierLot?.startsWith('SIEMENS') ? 'Siemens Industrial AG' :
          lot.supplierLot?.startsWith('PANAS') ? 'Panasonic Industry Global' : 'Nhà Cung Cấp Thiết Bị Công Nghiệp',
    subtitle: 'Đơn mua PO & Phiếu nhập kho GRN',
    quantity: lot.initialQty,
    uom: lot.uom,
    status: 'RECEIVED',
    date: lot.mfgDate,
    operator: 'Nguyễn Văn Nhập (Kho Vận)',
    qualityScore: '99.8% QC Passed',
    notes: `Nhập kho theo chứng từ CO/CQ số ${lot.supplierLot}`,
    level: 0,
  });

  // Level 1: The Root Raw Material / Component Lot
  const lotNodeId = `LOT-${lot.id}`;
  nodes.push({
    id: lotNodeId,
    type: 'LOT',
    code: lot.batchNumber,
    name: lot.productName,
    subtitle: `SKU: ${lot.sku} • Kho: ${lot.warehouse}`,
    quantity: lot.currentQty,
    uom: lot.uom,
    status: lot.status,
    date: lot.mfgDate,
    operator: 'Thủ kho phụ trách',
    qualityScore: 'CO/CQ Verified',
    notes: `Tồn kho hiện tại: ${lot.currentQty}/${lot.initialQty} ${lot.uom}. Hạn dùng: ${lot.expDate}`,
    level: 1,
  });

  // Link Supplier -> Lot
  links.push({
    id: `${supplierId}->${lotNodeId}`,
    source: supplierId,
    target: lotNodeId,
    relation: 'INBOUND_SUPPLY',
    quantity: lot.initialQty,
    uom: lot.uom,
    date: lot.mfgDate,
  });

  // Level 2, 3, 4: Work Orders (WO) that consumed this lot, and downstream FG & SO
  const consumedTotal = Math.max(0, lot.initialQty - lot.currentQty);
  
  if (lot.id === 'LOT-2026-001' || lot.sku.includes('ENG')) {
    // WO 1
    const wo1Id = 'WO-2026-101';
    const fg1Id = 'FG-LOT-ROBOT-01';
    const so1Id = 'SO-2026-881';

    nodes.push({
      id: wo1Id,
      type: 'WORK_ORDER',
      code: 'WO-2026-101',
      name: 'Lệnh SX: Cụm Cánh Tay Robot 6 Trục',
      subtitle: 'Xưởng Lắp ráp Tự động hóa #01',
      quantity: 180,
      uom: lot.uom,
      status: 'COMPLETED',
      date: '2026-02-10',
      operator: 'Trần Minh Tiến (Trưởng Chuyền)',
      workcenter: 'WC-ASSY-01 (Dây chuyền Robot)',
      qualityScore: '100% PASS',
      notes: 'Đã xuất kho 180 động cơ servo vào lệnh sản xuất WO-2026-101.',
      level: 2,
    });

    nodes.push({
      id: fg1Id,
      type: 'FINISHED_GOOD',
      code: 'LOT-FG-ROBOT-6AXIS',
      name: 'Thành phẩm: Robot Hàn Điểm 6 Trục Model NX',
      subtitle: 'SKU: FG-ROBOT-6AXIS (Số lượng: 15 Bộ)',
      quantity: 15,
      uom: 'Bộ',
      status: 'QC_APPROVED',
      date: '2026-02-15',
      operator: 'Tổ Kiểm định KCS',
      qualityScore: 'ISO-9001:2026',
      notes: 'Lô thành phẩm đạt tiêu chuẩn an toàn công nghiệp CE/UL.',
      level: 3,
    });

    nodes.push({
      id: so1Id,
      type: 'SALES_ORDER',
      code: 'SO-2026-881',
      name: 'Đơn Bán: VinFast Automotive Hải Phòng',
      subtitle: 'Dự án: Dây chuyền thân vỏ VF9',
      quantity: 10,
      uom: 'Bộ',
      status: 'DELIVERED',
      date: '2026-02-20',
      operator: 'Đội Vận chuyển Logistics',
      notes: 'Đã giao hàng và ký biên bản nghiệm thu kỹ thuật.',
      level: 4,
    });

    links.push({
      id: `${lotNodeId}->${wo1Id}`,
      source: lotNodeId,
      target: wo1Id,
      relation: 'CONSUMED_BY_WO',
      quantity: 180,
      uom: lot.uom,
      date: '2026-02-10',
    });

    links.push({
      id: `${wo1Id}->${fg1Id}`,
      source: wo1Id,
      target: fg1Id,
      relation: 'PRODUCED_FG',
      quantity: 15,
      uom: 'Bộ',
      date: '2026-02-15',
    });

    links.push({
      id: `${fg1Id}->${so1Id}`,
      source: fg1Id,
      target: so1Id,
      relation: 'FULFILLED_SO',
      quantity: 10,
      uom: 'Bộ',
      date: '2026-02-20',
    });

    // WO 2
    const wo2Id = 'WO-2026-104';
    const fg2Id = 'FG-LOT-CNC-202';
    const so2Id = 'SO-2026-895';

    nodes.push({
      id: wo2Id,
      type: 'WORK_ORDER',
      code: 'WO-2026-104',
      name: 'Lệnh SX: Máy Phay CNC 5 Trục Model X',
      subtitle: 'Xưởng Gia công Cơ khí Chính xác',
      quantity: 120,
      uom: lot.uom,
      status: 'COMPLETED',
      date: '2026-02-25',
      operator: 'Lê Hoàng Quân (Kỹ sư CNC)',
      workcenter: 'WC-CNC-02 (Trung tâm Gia công)',
      qualityScore: '99.5% PASS',
      notes: 'Tiêu thụ 120 động cơ servo làm trục dẫn hướng X/Y/Z.',
      level: 2,
    });

    nodes.push({
      id: fg2Id,
      type: 'FINISHED_GOOD',
      code: 'LOT-FG-CNC-PRO5X',
      name: 'Thành phẩm: Trung Tâm Gia Công CNC 5-Axis',
      subtitle: 'SKU: FG-CNC-5AXIS (Số lượng: 8 Máy)',
      quantity: 8,
      uom: 'Máy',
      status: 'QC_APPROVED',
      date: '2026-03-01',
      operator: 'KCS Cơ điện tử',
      qualityScore: 'Chính xác 0.001mm',
      notes: 'Hoàn tất chạy rà thử tải 72 giờ liên tục.',
      level: 3,
    });

    nodes.push({
      id: so2Id,
      type: 'SALES_ORDER',
      code: 'SO-2026-895',
      name: 'Đơn Bán: Thaco Chu Lai Automotive',
      subtitle: 'Hợp đồng trang bị xưởng dập khuôn',
      quantity: 4,
      uom: 'Máy',
      status: 'IN_TRANSIT',
      date: '2026-03-05',
      operator: 'Đoàn xe vận chuyển số 04',
      notes: 'Đang trên đường vận chuyển tới Chu Lai, Quảng Nam.',
      level: 4,
    });

    links.push({
      id: `${lotNodeId}->${wo2Id}`,
      source: lotNodeId,
      target: wo2Id,
      relation: 'CONSUMED_BY_WO',
      quantity: 120,
      uom: lot.uom,
      date: '2026-02-25',
    });

    links.push({
      id: `${wo2Id}->${fg2Id}`,
      source: wo2Id,
      target: fg2Id,
      relation: 'PRODUCED_FG',
      quantity: 8,
      uom: 'Máy',
      date: '2026-03-01',
    });

    links.push({
      id: `${fg2Id}->${so2Id}`,
      source: fg2Id,
      target: so2Id,
      relation: 'FULFILLED_SO',
      quantity: 4,
      uom: 'Máy',
      date: '2026-03-05',
    });

    // WO 3: R&D or maintenance test
    const wo3Id = 'WO-2026-118';
    nodes.push({
      id: wo3Id,
      type: 'WORK_ORDER',
      code: 'WO-2026-118',
      name: 'Lệnh Bảo Trì & Thử Tải Phòng R&D',
      subtitle: 'Phòng Thí nghiệm Độ bền Động cơ',
      quantity: 40,
      uom: lot.uom,
      status: 'IN_PROGRESS',
      date: '2026-03-08',
      operator: 'Đặng Quốc Hưng (R&D Lead)',
      workcenter: 'WC-LAB-01 (Phòng Thử Nghiệm)',
      qualityScore: 'Test Cycle #4',
      notes: 'Sử dụng 40 sản phẩm cho thử nghiệm kiểm tra giới hạn quá nhiệt.',
      level: 2,
    });

    links.push({
      id: `${lotNodeId}->${wo3Id}`,
      source: lotNodeId,
      target: wo3Id,
      relation: 'CONSUMED_BY_WO',
      quantity: 40,
      uom: lot.uom,
      date: '2026-03-08',
    });

  } else if (lot.id === 'LOT-2026-002' || lot.sku.includes('PLC')) {
    // PLC Siemens Lot
    const wo1Id = 'WO-2026-108';
    const fg1Id = 'FG-LOT-PANEL-PLC01';
    const so1Id = 'SO-2026-904';

    nodes.push({
      id: wo1Id,
      type: 'WORK_ORDER',
      code: 'WO-2026-108',
      name: 'Lệnh SX: Tủ Điện Điều Khiển SCADA 380V',
      subtitle: 'Xưởng Tủ bảng điện & SCADA',
      quantity: 45,
      uom: lot.uom,
      status: 'COMPLETED',
      date: '2026-03-12',
      operator: 'Hoàng Văn Lực (Kỹ sư Tự động hóa)',
      workcenter: 'WC-ELEC-01 (Dây chuyền Tủ điện)',
      qualityScore: '100% Đi dây chuẩn IEC',
      notes: 'Sử dụng 45 bộ PLC Siemens S1200 lắp ráp tủ điều khiển SCADA.',
      level: 2,
    });

    nodes.push({
      id: fg1Id,
      type: 'FINISHED_GOOD',
      code: 'LOT-FG-SCADA-PANEL',
      name: 'Thành phẩm: Tủ SCADA Điều Khiển Nước Thải',
      subtitle: 'SKU: FG-SCADA-WTP (Số lượng: 45 Tủ)',
      quantity: 45,
      uom: 'Tủ',
      status: 'QC_APPROVED',
      date: '2026-03-15',
      operator: 'KCS Tự động hóa',
      qualityScore: 'IP65 Tested',
      notes: 'Đã nạp firmware và lập trình giải thuật PID chuẩn.',
      level: 3,
    });

    nodes.push({
      id: so1Id,
      type: 'SALES_ORDER',
      code: 'SO-2026-904',
      name: 'Đơn Bán: Nhà Máy FPT Smart Factory Long An',
      subtitle: 'Gói thầu Hệ thống Xử lý Nước',
      quantity: 30,
      uom: 'Tủ',
      status: 'DELIVERED',
      date: '2026-03-18',
      operator: 'Bộ phận Bàn giao Dự án',
      notes: 'Đã đấu nối vận hành thử nghiệm tại nhà máy Long An.',
      level: 4,
    });

    links.push({
      id: `${lotNodeId}->${wo1Id}`,
      source: lotNodeId,
      target: wo1Id,
      relation: 'CONSUMED_BY_WO',
      quantity: 45,
      uom: lot.uom,
      date: '2026-03-12',
    });

    links.push({
      id: `${wo1Id}->${fg1Id}`,
      source: wo1Id,
      target: fg1Id,
      relation: 'PRODUCED_FG',
      quantity: 45,
      uom: 'Tủ',
      date: '2026-03-15',
    });

    links.push({
      id: `${fg1Id}->${so1Id}`,
      source: fg1Id,
      target: so1Id,
      relation: 'FULFILLED_SO',
      quantity: 30,
      uom: 'Tủ',
      date: '2026-03-18',
    });

    // WO 2
    const wo2Id = 'WO-2026-112';
    nodes.push({
      id: wo2Id,
      type: 'WORK_ORDER',
      code: 'WO-2026-112',
      name: 'Lệnh SX: Băng Tải Phân Loại Thông Minh',
      subtitle: 'Xưởng Băng tải & Logictics WMS',
      quantity: 20,
      uom: lot.uom,
      status: 'IN_PROGRESS',
      date: '2026-03-19',
      operator: 'Vũ Quốc Toàn',
      workcenter: 'WC-CONVEYOR-02',
      qualityScore: 'Testing',
      notes: '20 bộ PLC lập trình điều khiển động cơ servo băng tải.',
      level: 2,
    });

    links.push({
      id: `${lotNodeId}->${wo2Id}`,
      source: lotNodeId,
      target: wo2Id,
      relation: 'CONSUMED_BY_WO',
      quantity: 20,
      uom: lot.uom,
      date: '2026-03-19',
    });

  } else {
    // Generic fallback for any other lot
    const wo1Id = `WO-2026-${lot.id.replace(/\D/g, '').slice(-3) || '201'}`;
    const fg1Id = `FG-LOT-${lot.sku.slice(-4) || '888'}`;
    const so1Id = `SO-2026-${lot.id.replace(/\D/g, '').slice(-3) || '999'}`;

    const consumedQty = consumedTotal > 0 ? consumedTotal : Math.round(lot.initialQty * 0.7);

    nodes.push({
      id: wo1Id,
      type: 'WORK_ORDER',
      code: wo1Id,
      name: `Lệnh Sản Xuất: Chế tạo Module ${lot.productName}`,
      subtitle: 'Xưởng Sản Xuất Tích Hợp Trung Tâm',
      quantity: consumedQty,
      uom: lot.uom,
      status: 'COMPLETED',
      date: '2026-02-18',
      operator: 'Kỹ sư Trưởng Dây chuyền',
      workcenter: 'WC-MAIN-01 (Chuyền Chính)',
      qualityScore: '100% PASS',
      notes: `Đã tiêu thụ ${consumedQty} ${lot.uom} cho cụm thiết bị công nghiệp.`,
      level: 2,
    });

    nodes.push({
      id: fg1Id,
      type: 'FINISHED_GOOD',
      code: fg1Id,
      name: `Thành phẩm: Cụm Module ${lot.category}`,
      subtitle: `Lô sản phẩm hoàn chỉnh mã ${fg1Id}`,
      quantity: Math.max(1, Math.floor(consumedQty / 10)),
      uom: 'Cụm',
      status: 'QC_APPROVED',
      date: '2026-02-22',
      operator: 'Tổ Kiểm tra Chất lượng KCS',
      qualityScore: 'Đạt chuẩn ISO-9001',
      notes: 'Lô thành phẩm đã hoàn tất đóng gói và nhập kho thành phẩm.',
      level: 3,
    });

    nodes.push({
      id: so1Id,
      type: 'SALES_ORDER',
      code: so1Id,
      name: 'Đơn Bán Hàng: Tập Đoàn Công Nghiệp Quốc Tế',
      subtitle: 'Hợp đồng cung cấp thiết bị Q1/2026',
      quantity: Math.max(1, Math.floor(consumedQty / 15)),
      uom: 'Cụm',
      status: 'DELIVERED',
      date: '2026-02-28',
      operator: 'Bộ phận Giao nhận Logistics',
      notes: 'Đã xuất kho giao cho khách hàng theo hóa đơn điện tử.',
      level: 4,
    });

    links.push({
      id: `${lotNodeId}->${wo1Id}`,
      source: lotNodeId,
      target: wo1Id,
      relation: 'CONSUMED_BY_WO',
      quantity: consumedQty,
      uom: lot.uom,
      date: '2026-02-18',
    });

    links.push({
      id: `${wo1Id}->${fg1Id}`,
      source: wo1Id,
      target: fg1Id,
      relation: 'PRODUCED_FG',
      quantity: Math.max(1, Math.floor(consumedQty / 10)),
      uom: 'Cụm',
      date: '2026-02-22',
    });

    links.push({
      id: `${fg1Id}->${so1Id}`,
      source: fg1Id,
      target: so1Id,
      relation: 'FULFILLED_SO',
      quantity: Math.max(1, Math.floor(consumedQty / 15)),
      uom: 'Cụm',
      date: '2026-02-28',
    });
  }

  return { nodes, links };
}

export const LotDependencyGraphD3: React.FC<LotDependencyGraphD3Props> = ({ lot, onSelectEntity, onInspectWorkOrder }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedNode, setSelectedNode] = useState<TraceGraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'HIERARCHY' | 'FORCE'>('HIERARCHY');
  const [hoveredNode, setHoveredNode] = useState<TraceGraphNode | null>(null);

  // Generate Graph Data
  const graphData = useMemo(() => {
    return generateTraceDataForLot(lot);
  }, [lot]);

  // Set default selected node to the Lot or first WO
  useEffect(() => {
    const defaultNode = graphData.nodes.find(n => n.type === 'WORK_ORDER') || graphData.nodes.find(n => n.type === 'LOT');
    if (defaultNode) {
      setSelectedNode(defaultNode);
    }
  }, [graphData]);

  // D3 Rendering Hook
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 900;
    const height = 520;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    svg
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'overflow-hidden select-none');

    // Defs: Gradients, Drop Shadows & Arrow Markers
    const defs = svg.append('defs');

    // Arrow Marker
    defs.append('marker')
      .attr('id', 'arrow-head')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', '#94a3b8');

    // Highlighted Arrow Marker
    defs.append('marker')
      .attr('id', 'arrow-head-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', '#3b82f6');

    // Soft Drop Shadow Filter
    const filter = defs.append('filter')
      .attr('id', 'node-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '4')
      .attr('stdDeviation', '6')
      .attr('flood-color', '#0f172a')
      .attr('flood-opacity', '0.12');

    // Glow Filter for Selected Node
    const glow = defs.append('filter')
      .attr('id', 'glow-filter')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');
    glow.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Background Container
    const g = svg.append('g').attr('class', 'main-layer');

    // Zoom Behaviour
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Filter nodes if needed
    const filteredNodes = graphData.nodes.filter(n => {
      if (filterType !== 'ALL' && n.type !== filterType && n.type !== 'LOT') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return n.code.toLowerCase().includes(q) || n.name.toLowerCase().includes(q);
      }
      return true;
    });

    const activeNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = graphData.links.filter(l => {
      const srcId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const tgtId = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return activeNodeIds.has(srcId) && activeNodeIds.has(tgtId);
    });

    // Node positioning strategy
    const nodesCopy: TraceGraphNode[] = filteredNodes.map(d => ({ ...d }));
    const linksCopy: TraceGraphLink[] = filteredLinks.map(d => ({ ...d }));

    // Color definitions per node type
    const colorMap: Record<TraceNodeType, { bg: string; border: string; badge: string; text: string; ring: string }> = {
      SUPPLIER: { bg: '#f8fafc', border: '#94a3b8', badge: '#64748b', text: '#334155', ring: '#cbd5e1' },
      LOT: { bg: '#eff6ff', border: '#3b82f6', badge: '#2563eb', text: '#1e40af', ring: '#93c5fd' },
      WORK_ORDER: { bg: '#fef3c7', border: '#f59e0b', badge: '#d97706', text: '#92400e', ring: '#fcd34d' },
      FINISHED_GOOD: { bg: '#ecfdf5', border: '#10b981', badge: '#059669', text: '#065f46', ring: '#6ee7b7' },
      SALES_ORDER: { bg: '#faf5ff', border: '#a855f7', badge: '#9333ea', text: '#6b21a8', ring: '#d8b4fe' },
    };

    if (layoutMode === 'HIERARCHY') {
      // Calculate layered hierarchy columns (Level 0 -> Level 4)
      const levelColumns: Record<number, TraceGraphNode[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
      nodesCopy.forEach(n => {
        const lvl = Math.min(4, Math.max(0, n.level));
        levelColumns[lvl] = levelColumns[lvl] || [];
        levelColumns[lvl].push(n);
      });

      const colWidth = (width - 120) / 4;
      const startX = 60;

      Object.entries(levelColumns).forEach(([lvlStr, colNodes]) => {
        const lvl = Number(lvlStr);
        const colX = startX + lvl * colWidth;
        const totalInCol = colNodes.length;
        const spacingY = height / (totalInCol + 1);

        colNodes.forEach((node, idx) => {
          node.x = colX;
          node.y = (idx + 1) * spacingY;
          node.fx = colX;
          node.fy = (idx + 1) * spacingY;
        });
      });
    }

    // Initialize Force Simulation
    const simulation = d3.forceSimulation<TraceGraphNode>(nodesCopy)
      .force('link', d3.forceLink<TraceGraphNode, TraceGraphLink>(linksCopy)
        .id(d => d.id)
        .distance(layoutMode === 'HIERARCHY' ? 140 : 180)
        .strength(layoutMode === 'HIERARCHY' ? 0.3 : 0.8))
      .force('charge', d3.forceManyBody().strength(layoutMode === 'HIERARCHY' ? -150 : -450))
      .force('collide', d3.forceCollide().radius(60))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(layoutMode === 'HIERARCHY' ? 0.05 : 0.4));

    if (layoutMode === 'FORCE') {
      // Release fixed positions
      nodesCopy.forEach(n => {
        delete n.fx;
        delete n.fy;
      });
    }

    // Background Layer Indicators in HIERARCHY mode
    if (layoutMode === 'HIERARCHY') {
      const stageHeaders = [
        { level: 0, label: '1. NCC & INBOUND', sub: 'Nguồn gốc cung ứng' },
        { level: 1, label: '2. LÔ NGUYÊN LIỆU', sub: 'Tồn kho truy xuất' },
        { level: 2, label: '3. LỆNH SX (WO)', sub: 'Tiêu hao chế tạo' },
        { level: 3, label: '4. THÀNH PHẨM (FG)', sub: 'Lô sản phẩm đầu ra' },
        { level: 4, label: '5. ĐƠN BÁN / KHÁCH', sub: 'Phân phối tiêu thụ' },
      ];

      const colWidth = (width - 120) / 4;
      const startX = 60;

      const headerG = g.append('g').attr('class', 'stage-headers');
      stageHeaders.forEach((stg) => {
        const xPos = startX + stg.level * colWidth;
        
        // Vertical dashed column guide
        headerG.append('line')
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('y1', 40)
          .attr('y2', height - 20)
          .attr('stroke', '#e2e8f0')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4 4')
          .attr('opacity', 0.8);

        // Header pill
        const headerPill = headerG.append('g')
          .attr('transform', `translate(${xPos}, 24)`);

        headerPill.append('rect')
          .attr('x', -65)
          .attr('y', -14)
          .attr('width', 130)
          .attr('height', 24)
          .attr('rx', 12)
          .attr('fill', '#f1f5f9')
          .attr('stroke', '#cbd5e1')
          .attr('stroke-width', 1);

        headerPill.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 2)
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('fill', '#475569')
          .attr('font-family', 'ui-monospace, monospace')
          .text(stg.label);
      });
    }

    // Links Rendering Layer
    const linkGroup = g.append('g').attr('class', 'links-layer');

    const link = linkGroup.selectAll<SVGLineElement, TraceGraphLink>('.trace-link')
      .data(linksCopy)
      .enter()
      .append('line')
      .attr('class', 'trace-link')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', (d) => (d.relation === 'CONSUMED_BY_WO' ? 2.5 : 2))
      .attr('stroke-dasharray', (d) => (d.relation === 'CONSUMED_BY_WO' ? '6 3' : 'none'))
      .attr('stroke-opacity', 0.8)
      .attr('marker-end', 'url(#arrow-head)');

    // Link Labels (Quantity Consumed / Transferred)
    const linkLabelGroup = g.append('g').attr('class', 'link-labels-layer');
    const linkLabels = linkLabelGroup.selectAll<SVGGElement, TraceGraphLink>('.link-label')
      .data(linksCopy)
      .enter()
      .append('g')
      .attr('class', 'link-label pointer-events-none');

    linkLabels.append('rect')
      .attr('x', -35)
      .attr('y', -9)
      .attr('width', 70)
      .attr('height', 18)
      .attr('rx', 9)
      .attr('fill', '#ffffff')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('opacity', 0.95);

    linkLabels.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 3)
      .attr('font-size', '9.5px')
      .attr('font-weight', '700')
      .attr('fill', '#2563eb')
      .attr('font-family', 'ui-monospace, monospace')
      .text(d => d.quantity ? `${d.quantity} ${d.uom || ''}` : d.relation);

    // Nodes Rendering Layer
    const nodeGroup = g.append('g').attr('class', 'nodes-layer');

    const node = nodeGroup.selectAll<SVGGElement, TraceGraphNode>('.trace-node')
      .data(nodesCopy)
      .enter()
      .append('g')
      .attr('class', 'trace-node cursor-pointer')
      .attr('filter', 'url(#node-shadow)')
      .call(
        d3.drag<SVGGElement, TraceGraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            if (layoutMode !== 'HIERARCHY') {
              d.fx = null;
              d.fy = null;
            }
          })
      );

    // Node Outer Pill Container
    const cardWidth = 140;
    const cardHeight = 60;

    node.append('rect')
      .attr('class', 'node-card-bg transition-all duration-200')
      .attr('x', -cardWidth / 2)
      .attr('y', -cardHeight / 2)
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', 12)
      .attr('fill', d => colorMap[d.type]?.bg || '#ffffff')
      .attr('stroke', d => d.id === selectedNode?.id ? '#2563eb' : (colorMap[d.type]?.border || '#cbd5e1'))
      .attr('stroke-width', d => d.id === selectedNode?.id ? 2.5 : 1.5);

    // Type Badge Icon Container
    const badgeG = node.append('g')
      .attr('transform', `translate(${-cardWidth / 2 + 16}, ${-cardHeight / 2 + 16})`);

    badgeG.append('circle')
      .attr('r', 10)
      .attr('fill', d => colorMap[d.type]?.badge || '#3b82f6');

    // Type Label Pill on Top-Right
    node.append('text')
      .attr('x', cardWidth / 2 - 8)
      .attr('y', -cardHeight / 2 + 14)
      .attr('text-anchor', 'end')
      .attr('font-size', '8.5px')
      .attr('font-weight', '800')
      .attr('fill', d => colorMap[d.type]?.text || '#64748b')
      .attr('font-family', 'ui-monospace, monospace')
      .text(d => d.type === 'WORK_ORDER' ? 'WO PROD' : d.type);

    // Code Heading
    node.append('text')
      .attr('x', -cardWidth / 2 + 32)
      .attr('y', -cardHeight / 2 + 18)
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('fill', d => d.type === 'WORK_ORDER' ? '#b45309' : '#0f172a')
      .text(d => d.code.length > 13 ? `${d.code.slice(0, 12)}…` : d.code);

    // Name Subtitle (2-line truncate)
    node.append('text')
      .attr('x', -cardWidth / 2 + 10)
      .attr('y', 2)
      .attr('font-size', '9.5px')
      .attr('font-weight', '600')
      .attr('fill', '#334155')
      .text(d => d.name.length > 21 ? `${d.name.slice(0, 20)}…` : d.name);

    // Bottom Metric / Quantity Tag
    node.append('text')
      .attr('x', -cardWidth / 2 + 10)
      .attr('y', cardHeight / 2 - 10)
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('fill', d => d.type === 'WORK_ORDER' ? '#d97706' : '#2563eb')
      .text(d => d.quantity ? `SL: ${d.quantity.toLocaleString('vi-VN')} ${d.uom || ''}` : d.status);

    // Interactivity: Click & Hover
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
      
      // Update link styles for active connections
      link
        .attr('stroke', l => {
          const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return (srcId === d.id || tgtId === d.id) ? '#2563eb' : '#94a3b8';
        })
        .attr('stroke-width', l => {
          const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return (srcId === d.id || tgtId === d.id) ? 3 : 1.5;
        })
        .attr('marker-end', l => {
          const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return (srcId === d.id || tgtId === d.id) ? 'url(#arrow-head-active)' : 'url(#arrow-head)';
        });

      // Update Node border highlight
      node.selectAll('.node-card-bg')
        .attr('stroke', (n: any) => n.id === d.id ? '#2563eb' : (colorMap[n.type as TraceNodeType]?.border || '#cbd5e1'))
        .attr('stroke-width', (n: any) => n.id === d.id ? 2.5 : 1.5);
    });

    node.on('mouseenter', (event, d) => {
      setHoveredNode(d);
      d3.select(event.currentTarget)
        .select('.node-card-bg')
        .attr('stroke-width', 2.5);
    });

    node.on('mouseleave', (event, d) => {
      setHoveredNode(null);
      d3.select(event.currentTarget)
        .select('.node-card-bg')
        .attr('stroke-width', (n: any) => n.id === selectedNode?.id ? 2.5 : 1.5);
    });

    // Simulation Tick Event
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      linkLabels
        .attr('transform', d => {
          const x = ((d.source as any).x + (d.target as any).x) / 2;
          const y = ((d.source as any).y + (d.target as any).y) / 2;
          return `translate(${x}, ${y})`;
        });

      node
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, filterType, searchQuery, layoutMode]);

  // Controls Handlers
  const handleZoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.25);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.8);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
    }
  };

  // Quick stats for the graph
  const totalWOs = graphData.nodes.filter(n => n.type === 'WORK_ORDER').length;
  const totalFGs = graphData.nodes.filter(n => n.type === 'FINISHED_GOOD').length;
  const totalSOs = graphData.nodes.filter(n => n.type === 'SALES_ORDER').length;
  const totalConsumedQty = graphData.links
    .filter(l => l.relation === 'CONSUMED_BY_WO')
    .reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  return (
    <div className="space-y-4">
      {/* TRACEABILITY STATS HEADER STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Lô Nguyên Liệu</span>
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {lot.batchNumber}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            Tồn {lot.currentQty}/{lot.initialQty} {lot.uom}
          </div>
        </div>

        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Lệnh SX (WO) Đã Tiêu Thụ</span>
            <Factory className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {totalWOs} Lệnh Sản Xuất
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Đã tiêu hao: {totalConsumedQty} {lot.uom}
          </div>
        </div>

        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Thành Phẩm (FG) Tạo Ra</span>
            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {totalFGs} Lô Thành Phẩm
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            QC Approved 100%
          </div>
        </div>

        <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Đơn Bán Hàng (SO)</span>
            <ShoppingCart className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {totalSOs} Đơn Hàng Đã Giao
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            Truy xuất đến khách hàng cuối
          </div>
        </div>
      </div>

      {/* GRAPH TOOLBAR & FILTERS */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm mã WO, Lô, Đơn hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-white font-mono"
            />
          </div>

          {/* Filter Type */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterType === 'ALL' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setFilterType('WORK_ORDER')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'WORK_ORDER' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Factory className="w-3 h-3" />
              <span>Chỉ Lệnh SX (WO)</span>
            </button>
            <button
              onClick={() => setFilterType('FINISHED_GOOD')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'FINISHED_GOOD' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Thành Phẩm</span>
            </button>
            <button
              onClick={() => setFilterType('SALES_ORDER')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'SALES_ORDER' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ShoppingCart className="w-3 h-3" />
              <span>Đơn Hàng (SO)</span>
            </button>
          </div>

          {/* Layout Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setLayoutMode('HIERARCHY')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                layoutMode === 'HIERARCHY' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Chế độ Phân tầng Theo Quy Trình (DAG Flow)"
            >
              Phân Tầng (DAG)
            </button>
            <button
              onClick={() => setLayoutMode('FORCE')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                layoutMode === 'FORCE' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Chế độ Lực Tự Do (Force Directed)"
            >
              Mạng Lưới (Force)
            </button>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Đặt lại khung nhìn"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* D3 GRAPH CANVAS CONTAINER & DETAIL INSPECTOR PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SVG Canvas (8 cols on large screens) */}
        <div 
          ref={containerRef}
          className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden min-h-[520px] flex items-center justify-center"
        >
          {/* Watermark badge */}
          <div className="absolute top-3 left-3 pointer-events-none z-10 flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-800/90 text-slate-300 font-mono text-[10px] font-bold rounded-lg border border-slate-700 shadow-xs flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
              <span>D3 TRACEABILITY ENGINE • LIVE SVG</span>
            </span>
          </div>

          {/* Quick Legend at Bottom-Left */}
          <div className="absolute bottom-3 left-3 pointer-events-none z-10 bg-slate-800/90 backdrop-blur-xs p-2 rounded-xl border border-slate-700 text-[10px] space-y-1">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Chú giải nút & Luồng tiêu thụ:</div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> NCC/Inbound
              </span>
              <span className="flex items-center gap-1 text-blue-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Lô Gốc
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Lệnh SX (WO)
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Thành Phẩm (FG)
              </span>
              <span className="flex items-center gap-1 text-purple-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Đơn Hàng (SO)
              </span>
            </div>
          </div>

          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
        </div>

        {/* Selected Node Inspector Panel (4 cols on large screens) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs flex flex-col justify-between space-y-4">
          {selectedNode ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
                <div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider ${
                    selectedNode.type === 'WORK_ORDER' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300' :
                    selectedNode.type === 'LOT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-300' :
                    selectedNode.type === 'FINISHED_GOOD' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300' :
                    selectedNode.type === 'SALES_ORDER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-300' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {selectedNode.type === 'WORK_ORDER' ? 'LỆNH SẢN XUẤT (WO)' :
                     selectedNode.type === 'LOT' ? 'LÔ NGUYÊN VẬT LIỆU' :
                     selectedNode.type === 'FINISHED_GOOD' ? 'LÔ THÀNH PHẨM (FG)' :
                     selectedNode.type === 'SALES_ORDER' ? 'ĐƠN BÁN HÀNG (SO)' : 'NHÀ CUNG CẤP & INBOUND'}
                  </span>
                  <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                    {selectedNode.code}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                    {selectedNode.name}
                  </p>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="space-y-2.5 text-xs">
                {selectedNode.subtitle && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block">Thông tin chi tiết:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedNode.subtitle}</span>
                  </div>
                )}

                {selectedNode.type === 'WORK_ORDER' && (
                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
                    <div className="flex items-center justify-between text-amber-900 dark:text-amber-200">
                      <span className="font-medium text-[11px]">Tiêu hao nguyên liệu lô:</span>
                      <strong className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300">
                        {selectedNode.quantity} {selectedNode.uom}
                      </strong>
                    </div>
                    {selectedNode.workcenter && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Chuyền/Xưởng SX:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedNode.workcenter}</strong>
                      </div>
                    )}
                    {selectedNode.operator && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Trưởng chuyền phụ trách:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedNode.operator}</strong>
                      </div>
                    )}
                    {selectedNode.date && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Ngày thực thi lệnh:</span>
                        <strong className="font-mono text-slate-900 dark:text-white">{selectedNode.date}</strong>
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.qualityScore && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Kiểm tra chất lượng (QC):</span>
                    <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedNode.qualityScore}
                    </span>
                  </div>
                )}

                {selectedNode.date && selectedNode.type !== 'WORK_ORDER' && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Ngày ghi nhận:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{selectedNode.date}</span>
                  </div>
                )}

                {selectedNode.notes && (
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Ghi chú lưu vết:</span>
                    <p className="text-slate-600 dark:text-slate-300 italic text-[11px] leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/40">
                      "{selectedNode.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                {selectedNode.type === 'WORK_ORDER' && onInspectWorkOrder && (
                  <button
                    onClick={() => onInspectWorkOrder(selectedNode.code || selectedNode.id)}
                    className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Factory className="w-4 h-4" />
                    <span>Kiểm Tra Chi Tiết & Lịch Sử Lệnh SX (API)</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectEntity && onSelectEntity({
                    type: selectedNode.type,
                    id: selectedNode.id,
                    code: selectedNode.code,
                    title: selectedNode.name,
                    status: selectedNode.status,
                    lineage: [
                      { id: `lot-${lot.id}`, type: 'Lô Nguyên Liệu', code: lot.batchNumber, relation: 'ROOT_LOT', status: lot.status },
                      { id: selectedNode.id, type: selectedNode.type, code: selectedNode.code, relation: 'TRACE_NODE', status: selectedNode.status },
                    ],
                  })}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Đồng Bộ Sang Khung Ngữ Cảnh</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 my-auto">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-medium">Bấm vào bất kỳ nút nào trên đồ thị D3 để kiểm tra chi tiết tiêu hao và lưu vết.</p>
            </div>
          )}

          {/* Trace summary note */}
          <div className="bg-slate-50 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Tiêu Chuẩn Truy Xuất Nguồn Gốc 100%</span>
            </div>
            Dữ liệu đồ thị liên kết trực tiếp giữa các module <strong>M16 (Mua hàng)</strong> &rarr; <strong>M22 (Quản lý Lô)</strong> &rarr; <strong>M18 (Sản xuất MES / Lệnh WO)</strong> &rarr; <strong>M15 (Bán hàng O2C)</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
