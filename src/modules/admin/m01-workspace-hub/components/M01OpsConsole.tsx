import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as Icons from 'lucide-react';
import { ModuleDefinition, MODULE_REGISTRY } from '../../../../config/moduleRegistry';
import { UserSession } from '../../../../types';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';
import {
  m01WorkspaceApi,
  FlowSpanItem,
  ObservabilityHealthData,
  ModuleTopologyItem
} from '../services/m01WorkspaceApi';
import { CorrelationRcaTraceModal } from './CorrelationRcaTraceModal';

export type OpsConsoleViewMode = 'LIVE' | 'SIMULATION';
export type OpsChainPreset = 'ALL' | 'P2P' | 'O2C' | 'POS' | 'INVENTORY' | 'MANUFACTURING' | 'RETURNS' | 'FINANCE' | 'FULL_E2E';

export interface RemediationGuidance {
  errorCode: string;
  name: string;
  description: string;
  solution: string;
  responsibleService: string;
  domainAuthority: string;
  prevention: string;
  canRetry: boolean;
}

export const BUSINESS_RULES: Record<string, Record<string, RemediationGuidance>> = {
  M17: {
    NEGATIVE_STOCK_BLOCKED: {
      errorCode: 'NEGATIVE_STOCK_BLOCKED',
      name: 'Chặn xuất kho âm (Negative Stock Violation)',
      description: 'Lệnh xuất kho vượt quá số lượng tồn kho khả dụng (Available To Promise - ATP) tại chi nhánh/vị trí.',
      solution: 'Kiểm tra tồn kho thực tế, nhập kho bổ sung từ PO hoặc thực hiện kiểm kê M19 và tạo phiếu điều chỉnh M20 qua InventoryService.postTransaction().',
      responsibleService: 'InventoryService.postTransaction()',
      domainAuthority: 'Inventory Authority (M17)',
      prevention: 'Kích hoạt cảnh báo mức tồn tối thiểu (Reorder Point) và khóa đặt hàng khi ATP = 0.',
      canRetry: true
    },
    SERIAL_ALREADY_DISPATCHED: {
      errorCode: 'SERIAL_ALREADY_DISPATCHED',
      name: 'Mã Serial/IMEI đã xuất',
      description: 'Mã định danh serial/IMEI đã được ghi nhận xuất kho trong chứng từ trước đó.',
      solution: 'Quét lại mã serial vật lý hoặc kiểm tra lịch sử thiết bị trên M23.',
      responsibleService: 'InventoryService.postTransaction()',
      domainAuthority: 'Inventory Authority (M17)',
      prevention: 'Áp dụng mã vạch 2D 2-step verification khi xuất kho.',
      canRetry: false
    }
  },
  M30: {
    CLOSED_PERIOD_FORBIDDEN: {
      errorCode: 'CLOSED_PERIOD_FORBIDDEN',
      name: 'Hạch toán vào kỳ kế toán đã khóa',
      description: 'Chứng từ có ngày ghi sổ thuộc kỳ kế toán đã đóng và chốt số liệu báo cáo tài chính.',
      solution: 'Mở khóa kỳ kế toán tạm thời trong M30 (yêu cầu quyền Kế toán trưởng) hoặc hạch toán vào ngày đầu của kỳ kế toán đang mở qua AccountingService.postJournal().',
      responsibleService: 'AccountingService.postJournal()',
      domainAuthority: 'Accounting Authority (M30)',
      prevention: 'Cấu hình cảnh báo trước 3 ngày khi sắp đến hạn chốt kỳ kế toán.',
      canRetry: false
    },
    UNBALANCED_JOURNAL_ENTRY: {
      errorCode: 'UNBALANCED_JOURNAL_ENTRY',
      name: 'Bút toán không cân đối Nợ - Có',
      description: 'Tổng phát sinh Nợ không bằng tổng phát sinh Có trong giao dịch hạch toán.',
      solution: 'Kiểm tra lại tài khoản định khoản và số tiền trên từng dòng bút toán.',
      responsibleService: 'AccountingService.postJournal()',
      domainAuthority: 'Accounting Authority (M30)',
      prevention: 'Áp dụng client-side constraint trước khi gửi request hạch toán.',
      canRetry: true
    }
  },
  M42: {
    ERR_COSTING_LAYER_DEPLETED: {
      errorCode: 'ERR_COSTING_LAYER_DEPLETED',
      name: 'Cạn kiệt lớp chi phí tồn kho (Cost Layer Depleted)',
      description: 'Động cơ giá vốn không tìm thấy lớp chi phí FIFO hoặc chi phí nhập khẩu landed cost tương ứng để phân bổ.',
      solution: 'Chạy lại Động cơ phân bổ chi phí M42 qua CostingService / LandedCostEngine để bổ sung cost layers cho lô hàng.',
      responsibleService: 'CostingService.allocateLandedCost()',
      domainAuthority: 'Costing Authority (M42)',
      prevention: 'Bắt buộc hoàn tất phân bổ chi phí mua hàng trước khi xuất kho bán hàng.',
      canRetry: true
    }
  },
  M32: {
    OVERDRAFT_GUARD_BLOCKED: {
      errorCode: 'OVERDRAFT_GUARD_BLOCKED',
      name: 'Vượt hạn mức chi quỹ / Ngân hàng thấu chi',
      description: 'Lệnh thanh toán vượt quá số dư khả dụng trên tài khoản quỹ hoặc ngân hàng chỉ định.',
      solution: 'Nạp thêm tiền vào tài khoản quỹ, điều chuyển vốn nội bộ hoặc trình duyệt hạn mức thấu chi đặc biệt trong M32.',
      responsibleService: 'TreasuryService.createPaymentOrder()',
      domainAuthority: 'Treasury & Cash Management (M32)',
      prevention: 'Cấu hình cash-flow forecasting trước khi phát hành lệnh chi.',
      canRetry: true
    }
  },
  M08: {
    BUDGET_GUARD_EXCEEDED: {
      errorCode: 'BUDGET_GUARD_EXCEEDED',
      name: 'Vượt hạn mức ngân sách mua hàng',
      description: 'Giá trị đơn mua hàng (PO) vượt định mức ngân sách được cấp cho phòng ban/dự án.',
      solution: 'Trình duyệt phê duyệt vượt ngân sách cấp Giám đốc hoặc điều chỉnh giảm số lượng mua trong M08.',
      responsibleService: 'PurchaseService.createOrder()',
      domainAuthority: 'Procurement (M08)',
      prevention: 'Theo dõi real-time hạn mức ngân sách phòng ban.',
      canRetry: false
    }
  },
  M05: {
    DLQ_QUARANTINED: {
      errorCode: 'DLQ_QUARANTINED',
      name: 'Sự kiện Outbox cách ly vào Dead Letter Queue (DLQ)',
      description: 'Sự kiện đã retry quá 3 lần thất bại và bị cô lập để tránh nghẽn hàng đợi EventBus.',
      solution: 'Kiểm tra log chi tiết trong M05 EventBus, sửa lỗi dữ liệu tiêu thụ và kích hoạt Replay từ Dead Letter Queue.',
      responsibleService: 'EventBusService.replayDlqEvent()',
      domainAuthority: 'EventBus Authority (M05)',
      prevention: 'Bổ sung timeout và circuit-breaker cho subscriber.',
      canRetry: true
    }
  },
  M41: {
    PRICING_RULE_CONFLICT: {
      errorCode: 'PRICING_RULE_CONFLICT',
      name: 'Xung đột chính sách giá và chiết khấu',
      description: 'Tồn tại 2 bảng giá hoặc chương trình khuyến mãi cùng ưu tiên cho đối tượng khách hàng.',
      solution: 'Truy cập M41 Pricing Engine, điều chỉnh mức độ ưu tiên hoặc ngày hiệu lực của chính sách giá.',
      responsibleService: 'PricingEngine.resolvePrice()',
      domainAuthority: 'Pricing Authority (M41)',
      prevention: 'Quy chuẩn ma trận ưu tiên chính sách giá.',
      canRetry: true
    }
  }
};

export interface IncidentItem {
  id: string;
  moduleCode: string;
  moduleName: string;
  errorCode: string;
  errorMessage: string;
  count: number;
  severity: 'CAO' | 'TRUNG BÌNH' | 'THẤP';
  sourceType: 'AUDIT' | 'EVENT' | 'SIMULATION';
  correlationId: string;
  lastOccurredAt: string;
  upstreamSuspects: string[];
  downstreamImpacted: string[];
  latestSpanId?: number;
  isSimulated?: boolean;
}

// Module Pipeline Topology for Upstream / Downstream graph resolution
const PIPELINE_GRAPH: Record<string, { up: string[]; down: string[]; name: string; isAuthority?: boolean }> = {
  M04: { up: [], down: ['M05', 'M01'], name: 'Phân Quyền RBAC' },
  M05: { up: ['M04'], down: ['M01', 'M02', 'M08', 'M13', 'M17', 'M30'], name: 'EventBus Hub' },
  M02: { up: ['M05'], down: ['M01', 'M37'], name: 'Audit Trail' },
  M01: { up: ['M02', 'M05'], down: ['M37'], name: 'Workspace Hub' },
  M07: { up: [], down: ['M08', 'M12', 'M13', 'M16', 'M41'], name: 'Master Data' },
  M41: { up: ['M07'], down: ['M12', 'M13', 'M16'], name: 'Pricing Engine', isAuthority: true },
  M09: { up: [], down: ['M10', 'M08'], name: 'Nhà Cung Cấp SRM' },
  M10: { up: ['M09'], down: ['M08'], name: 'Mua Sắm Chiến Lược' },
  M08: { up: ['M09', 'M10'], down: ['M17', 'M31'], name: 'Đơn Mua Hàng PO' },
  M12: { up: ['M07', 'M41'], down: ['M13'], name: 'CRM & Báo Giá' },
  M13: { up: ['M12', 'M41'], down: ['M17', 'M15', 'M31'], name: 'Đơn Bán Hàng SO' },
  M15: { up: ['M13'], down: ['M39', 'M17', 'M31'], name: 'Đổi Trả RMA' },
  M16: { up: ['M07', 'M41'], down: ['M17', 'M32', 'M30'], name: 'POS Thu Ngân' },
  M39: { up: ['M08', 'M17', 'M25'], down: ['M17'], name: 'Kiểm Soát KCS QC' },
  M17: { up: ['M08', 'M13', 'M16', 'M25', 'M39'], down: ['M18', 'M19', 'M20', 'M21', 'M22', 'M23', 'M36', 'M42', 'M31', 'M30'], name: 'Kho Trung Tâm WMS', isAuthority: true },
  M18: { up: ['M17'], down: ['M19'], name: 'Vị Trí Ô Kệ Bin' },
  M19: { up: ['M18'], down: ['M20'], name: 'Kiểm Kê Kho' },
  M20: { up: ['M19'], down: ['M17', 'M30'], name: 'Điều Chỉnh Tồn' },
  M21: { up: ['M17'], down: ['M17'], name: 'Điều Chuyển Kho' },
  M22: { up: ['M17'], down: ['M17'], name: 'Lô Hạn FEFO' },
  M23: { up: ['M17'], down: ['M17'], name: 'Serial & IMEI' },
  M06: { up: [], down: ['M25'], name: 'R&D Công Thức' },
  M25: { up: ['M06', 'M17'], down: ['M26', 'M39', 'M17'], name: 'Lệnh Sản Xuất WO' },
  M26: { up: ['M25'], down: ['M08'], name: 'Nhu Cầu Vật Tư MRP' },
  M36: { up: ['M17'], down: ['M31', 'M30'], name: 'Giao Vận TMS' },
  M42: { up: ['M08', 'M17'], down: ['M30'], name: 'Động Cơ Giá Vốn COGS', isAuthority: true },
  M31: { up: ['M08', 'M13', 'M15', 'M17', 'M36'], down: ['M32', 'M30'], name: 'Hóa Đơn AR/AP' },
  M32: { up: ['M31', 'M16'], down: ['M33', 'M30'], name: 'Ngân Quỹ & Thu Chi' },
  M33: { up: ['M32'], down: ['M30'], name: 'Đối Soát Sao Kê' },
  M30: { up: ['M08', 'M13', 'M16', 'M17', 'M20', 'M31', 'M32', 'M33', 'M36', 'M42'], down: ['M34', 'M37'], name: 'Sổ Cái Kế Toán GL', isAuthority: true },
  M34: { up: ['M30'], down: ['M37'], name: 'Hợp Nhất BCTC' },
  M37: { up: ['M30', 'M34', 'M01'], down: [], name: 'Báo Cáo Quản Trị BI' },
};

// Preset chain visual layout nodes
const PRESET_NODES: Record<OpsChainPreset, Array<{ id: string; label: string; x: number; y: number }>> = {
  P2P: [
    { id: 'M09', label: 'NCC (M09)', x: 50, y: 140 },
    { id: 'M10', label: 'RFQ (M10)', x: 190, y: 140 },
    { id: 'M08', label: 'PO (M08)', x: 330, y: 140 },
    { id: 'M17', label: 'GRN (M17)', x: 470, y: 140 },
    { id: 'M39', label: 'KCS (M39)', x: 470, y: 40 },
    { id: 'M31', label: 'AP (M31)', x: 610, y: 140 },
    { id: 'M32', label: 'Quỹ (M32)', x: 750, y: 140 },
    { id: 'M30', label: 'GL (M30)', x: 890, y: 140 },
  ],
  O2C: [
    { id: 'M07', label: 'Khách (M07)', x: 50, y: 140 },
    { id: 'M41', label: 'Giá (M41)', x: 190, y: 140 },
    { id: 'M12', label: 'CRM (M12)', x: 330, y: 140 },
    { id: 'M13', label: 'SO (M13)', x: 470, y: 140 },
    { id: 'M17', label: 'ATP (M17)', x: 610, y: 140 },
    { id: 'M36', label: 'TMS (M36)', x: 750, y: 140 },
    { id: 'M31', label: 'AR (M31)', x: 890, y: 140 },
    { id: 'M30', label: 'GL (M30)', x: 890, y: 240 },
  ],
  POS: [
    { id: 'M07', label: 'SKU (M07)', x: 80, y: 140 },
    { id: 'M41', label: 'Giá (M41)', x: 260, y: 140 },
    { id: 'M16', label: 'POS (M16)', x: 440, y: 140 },
    { id: 'M17', label: 'Xuất (M17)', x: 620, y: 140 },
    { id: 'M32', label: 'VietQR (M32)', x: 800, y: 140 },
    { id: 'M30', label: 'GL (M30)', x: 800, y: 240 },
  ],
  INVENTORY: [
    { id: 'M17', label: 'Core WMS (M17)', x: 100, y: 140 },
    { id: 'M18', label: 'Bin (M18)', x: 300, y: 60 },
    { id: 'M19', label: 'Kiểm kê (M19)', x: 500, y: 60 },
    { id: 'M20', label: 'Điều chỉnh (M20)', x: 700, y: 60 },
    { id: 'M21', label: 'Chuyển kho (M21)', x: 300, y: 220 },
    { id: 'M22', label: 'Lô FEFO (M22)', x: 500, y: 220 },
    { id: 'M23', label: 'Serial (M23)', x: 700, y: 220 },
    { id: 'M30', label: 'GL (M30)', x: 880, y: 140 },
  ],
  MANUFACTURING: [
    { id: 'M06', label: 'R&D (M06)', x: 80, y: 140 },
    { id: 'M25', label: 'WO (M25)', x: 240, y: 140 },
    { id: 'M26', label: 'MRP (M26)', x: 400, y: 140 },
    { id: 'M39', label: 'QC (M39)', x: 560, y: 140 },
    { id: 'M17', label: 'Kho TP (M17)', x: 720, y: 140 },
    { id: 'M42', label: 'Giá vốn (M42)', x: 880, y: 140 },
    { id: 'M30', label: 'GL (M30)', x: 880, y: 240 },
  ],
  RETURNS: [
    { id: 'M13', label: 'SO gốc (M13)', x: 80, y: 140 },
    { id: 'M15', label: 'RMA (M15)', x: 240, y: 140 },
    { id: 'M39', label: 'QC (M39)', x: 400, y: 140 },
    { id: 'M17', label: 'Nhập hoàn (M17)', x: 560, y: 140 },
    { id: 'M31', label: 'Credit Note (M31)', x: 720, y: 140 },
    { id: 'M32', label: 'Hoàn tiền (M32)', x: 880, y: 140 },
    { id: 'M30', label: 'GL (M30)', x: 720, y: 240 },
  ],
  FINANCE: [
    { id: 'M31', label: 'AR/AP (M31)', x: 100, y: 140 },
    { id: 'M32', label: 'Ngân Quỹ (M32)', x: 280, y: 140 },
    { id: 'M33', label: 'Sao Kê (M33)', x: 460, y: 140 },
    { id: 'M30', label: 'GL (M30)', x: 640, y: 140 },
    { id: 'M34', label: 'Hợp Nhất (M34)', x: 820, y: 140 },
  ],
  FULL_E2E: [
    { id: 'M07', label: 'Master Data (M07)', x: 80, y: 70 },
    { id: 'M41', label: 'Giá (M41)', x: 80, y: 210 },
    { id: 'M08', label: 'PO (M08)', x: 280, y: 70 },
    { id: 'M13', label: 'SO (M13)', x: 280, y: 210 },
    { id: 'M17', label: 'Core WMS (M17)', x: 500, y: 140 },
    { id: 'M42', label: 'COGS (M42)', x: 700, y: 70 },
    { id: 'M31', label: 'AR/AP (M31)', x: 700, y: 210 },
    { id: 'M30', label: 'GL (M30)', x: 880, y: 140 },
  ],
  ALL: [
    { id: 'M08', label: 'PO (M08)', x: 100, y: 70 },
    { id: 'M13', label: 'SO (M13)', x: 100, y: 210 },
    { id: 'M17', label: 'Core WMS (M17)', x: 360, y: 140 },
    { id: 'M25', label: 'MES (M25)', x: 620, y: 70 },
    { id: 'M36', label: 'TMS (M36)', x: 620, y: 210 },
    { id: 'M30', label: 'GL (M30)', x: 860, y: 140 },
  ]
};

interface M01OpsConsoleProps {
  currentUser?: UserSession;
  onSelectModule?: (module: ModuleDefinition) => void;
  onOpenWorkQueue?: () => void;
  onOpenOmnibar?: () => void;
  onSwitchToObservabilityTab?: () => void;
}

export const M01OpsConsole: React.FC<M01OpsConsoleProps> = ({
  currentUser,
  onSelectModule,
  onOpenWorkQueue,
  onOpenOmnibar,
  onSwitchToObservabilityTab
}) => {
  const [viewMode, setViewMode] = useState<OpsConsoleViewMode>('LIVE');
  const [activePreset, setActivePreset] = useState<OpsChainPreset>('FULL_E2E');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedCorrelationId, setSelectedCorrelationId] = useState<string | null>(null);
  const [isRcaOpen, setIsRcaOpen] = useState<boolean>(false);

  // Spans & Telemetry State
  const [spans, setSpans] = useState<FlowSpanItem[]>([]);
  const [healthData, setHealthData] = useState<ObservabilityHealthData | null>(null);
  const [topologyModules, setTopologyModules] = useState<ModuleTopologyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [remediatingId, setRemediatingId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Simulated incidents pool
  const [simulatedIncidents, setSimulatedIncidents] = useState<IncidentItem[]>([]);

  // 1. Fetch Real Live Data from Backend Read-Models
  const fetchLiveData = useCallback(async () => {
    try {
      const [hRes, tRes, sRes] = await Promise.all([
        m01WorkspaceApi.getObservabilityHealth().catch(() => null),
        m01WorkspaceApi.getObservabilityTopology().catch(() => null),
        m01WorkspaceApi.getSpans({ page: 1, pageSize: 50 }).catch(() => ({ items: [], spans: [], total: 0 }))
      ]);

      if (hRes) setHealthData(hRes);
      if (tRes) setTopologyModules(tRes.modules || []);
      const loadedSpans = sRes.items || sRes.spans || [];
      setSpans(loadedSpans);
    } catch (err) {
      console.error('Ops Console live data error:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchLiveData();
      setLoading(false);
    };
    init();
    const interval = setInterval(fetchLiveData, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Group real errors from spans into Incidents according to specifications
  const realIncidents = useMemo<IncidentItem[]>(() => {
    const failedSpans = spans.filter((s) => s.status === 'FAILED');
    const groupMap = new Map<string, IncidentItem>();

    failedSpans.forEach((s) => {
      const mod = s.moduleCode || 'M01';
      // Extract or infer error code from metadataMasked or errorReason
      let errCode = 'SERVICE_ERROR';
      if (s.errorReason) {
        if (s.errorReason.includes('NEGATIVE_STOCK')) errCode = 'NEGATIVE_STOCK_BLOCKED';
        else if (s.errorReason.includes('CLOSED_PERIOD')) errCode = 'CLOSED_PERIOD_FORBIDDEN';
        else if (s.errorReason.includes('COSTING_LAYER') || s.errorReason.includes('DEPLETED')) errCode = 'ERR_COSTING_LAYER_DEPLETED';
        else if (s.errorReason.includes('OVERDRAFT')) errCode = 'OVERDRAFT_GUARD_BLOCKED';
        else if (s.errorReason.includes('BUDGET')) errCode = 'BUDGET_GUARD_EXCEEDED';
        else if (s.errorReason.includes('DLQ')) errCode = 'DLQ_QUARANTINED';
        else if (s.errorReason.includes('SERIAL')) errCode = 'SERIAL_ALREADY_DISPATCHED';
        else if (s.errorReason.includes('UNBALANCED')) errCode = 'UNBALANCED_JOURNAL_ENTRY';
      }

      const key = `${mod}:${errCode}`;
      const pipe = PIPELINE_GRAPH[mod] || { up: [], down: [], name: s.moduleRaw || mod };
      const downCount = pipe.down.length;

      // Severity rules:
      // High: M17, M30, M41, M42 OR downstream >= 6
      // Medium: downstream >= 3
      // Low: downstream < 3
      let severity: 'CAO' | 'TRUNG BÌNH' | 'THẤP' = 'THẤP';
      if (['M17', 'M30', 'M41', 'M42'].includes(mod) || downCount >= 6) {
        severity = 'CAO';
      } else if (downCount >= 3) {
        severity = 'TRUNG BÌNH';
      }

      if (groupMap.has(key)) {
        const item = groupMap.get(key)!;
        item.count += 1;
        if (new Date(s.occurredAt) > new Date(item.lastOccurredAt)) {
          item.lastOccurredAt = s.occurredAt;
          item.correlationId = s.correlationId || item.correlationId;
          item.latestSpanId = s.id;
        }
      } else {
        groupMap.set(key, {
          id: `inc-${key}-${s.id}`,
          moduleCode: mod,
          moduleName: pipe.name,
          errorCode: errCode,
          errorMessage: s.errorReason || `Lỗi thực thi dịch vụ tại phân hệ ${mod}`,
          count: 1,
          severity,
          sourceType: s.sourceType,
          correlationId: s.correlationId || `CORR-${mod}-${Date.now().toString().slice(-4)}`,
          lastOccurredAt: s.occurredAt,
          upstreamSuspects: pipe.up,
          downstreamImpacted: pipe.down,
          latestSpanId: s.id,
          isSimulated: false
        });
      }
    });

    return Array.from(groupMap.values());
  }, [spans]);

  // Combined incidents based on current mode
  const activeIncidents = useMemo<IncidentItem[]>(() => {
    if (viewMode === 'SIMULATION') {
      return simulatedIncidents;
    }
    return realIncidents;
  }, [viewMode, simulatedIncidents, realIncidents]);

  // Currently selected incident object
  const selectedIncident = useMemo(() => {
    return activeIncidents.find((inc) => inc.id === selectedIncidentId) || activeIncidents[0] || null;
  }, [activeIncidents, selectedIncidentId]);

  // Set of modules with open incidents
  const faultModuleCodes = useMemo(() => {
    const set = new Set<string>();
    activeIncidents.forEach((inc) => set.add(inc.moduleCode));
    return set;
  }, [activeIncidents]);

  // Suspected upstream & impacted downstream for selected incident
  const upstreamSuspectSet = useMemo(() => {
    if (!selectedIncident) return new Set<string>();
    return new Set(selectedIncident.upstreamSuspects);
  }, [selectedIncident]);

  const downstreamImpactSet = useMemo(() => {
    if (!selectedIncident) return new Set<string>();
    return new Set(selectedIncident.downstreamImpacted);
  }, [selectedIncident]);

  // Counts by severity
  const severityCounts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    activeIncidents.forEach((i) => {
      if (i.severity === 'CAO') high++;
      else if (i.severity === 'TRUNG BÌNH') medium++;
      else low++;
    });
    return { high, medium, low, total: activeIncidents.length };
  }, [activeIncidents]);

  // 2. Incident Simulation Handlers
  const handleSimulateIncident = (moduleCode: string, errorCode: string) => {
    const pipe = PIPELINE_GRAPH[moduleCode] || { up: [], down: [], name: moduleCode };
    const downCount = pipe.down.length;
    let severity: 'CAO' | 'TRUNG BÌNH' | 'THẤP' = 'THẤP';
    if (['M17', 'M30', 'M41', 'M42'].includes(moduleCode) || downCount >= 6) {
      severity = 'CAO';
    } else if (downCount >= 3) {
      severity = 'TRUNG BÌNH';
    }

    const rule = BUSINESS_RULES[moduleCode]?.[errorCode];
    const newSim: IncidentItem = {
      id: `sim-${moduleCode}-${errorCode}-${Date.now()}`,
      moduleCode,
      moduleName: pipe.name,
      errorCode,
      errorMessage: rule?.description || `Mô phỏng sự cố ${errorCode} tại phân hệ ${moduleCode}`,
      count: 1,
      severity,
      sourceType: 'SIMULATION',
      correlationId: `SIM-CORR-${moduleCode}-${Math.floor(1000 + Math.random() * 9000)}`,
      lastOccurredAt: new Date().toISOString(),
      upstreamSuspects: pipe.up,
      downstreamImpacted: pipe.down,
      isSimulated: true
    };

    setSimulatedIncidents((prev) => {
      const idx = prev.findIndex((p) => p.moduleCode === moduleCode && p.errorCode === errorCode);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], count: copy[idx].count + 1, lastOccurredAt: new Date().toISOString() };
        return copy;
      }
      return [newSim, ...prev];
    });

    setViewMode('SIMULATION');
    setSelectedIncidentId(newSim.id);
    setActionNotice({
      message: `Đã kích hoạt mô phỏng sự cố [${errorCode}] trên ${moduleCode}. Xem bản đồ và cột đề xuất xử lý bên phải.`,
      type: 'warning'
    });
  };

  const handleResolveSimulatedIncident = (incidentId: string) => {
    setSimulatedIncidents((prev) => prev.filter((i) => i.id !== incidentId));
    if (selectedIncidentId === incidentId) {
      setSelectedIncidentId(null);
    }
    setActionNotice({
      message: 'Sự cố mô phỏng đã được khắc phục hoàn tất.',
      type: 'success'
    });
  };

  const handleClearAllSimulations = () => {
    setSimulatedIncidents([]);
    setSelectedIncidentId(null);
    setViewMode('LIVE');
    setActionNotice({
      message: 'Đã xóa toàn bộ sự cố mô phỏng và chuyển về chế độ LIVE.',
      type: 'success'
    });
  };

  // 3. Retry / Remediate Real Event Handler
  const handleRemediateEvent = (incident: IncidentItem) => {
    if (incident.sourceType === 'AUDIT') {
      setActionNotice({
        message: 'BỊ CHẶN: Bản ghi kiểu AUDIT là nhật ký kiểm toán bất biến theo Luật Kế toán & Kiểm toán ISO, không được phép retry trực tiếp.',
        type: 'warning'
      });
      return;
    }

    if (!incident.latestSpanId) {
      setActionNotice({
        message: 'Không tìm thấy ID span khả dụng để retry.',
        type: 'error'
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Kích hoạt Retry cho sự cố [${incident.moduleCode} - ${incident.errorCode}]`,
      message: `Hệ thống sẽ gọi lại cơ chế EventBus để phát lại sự kiện lỗi (Correlation: ${incident.correlationId}). Thao tác tuân thủ Single-Writer Authority, không ghi tắt trực tiếp cơ sở dữ liệu.`,
      variant: 'warning',
      confirmText: 'Xác nhận Retry',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setRemediatingId(incident.latestSpanId!);
        try {
          await m01WorkspaceApi.remediateSpan(incident.latestSpanId!);
          await fetchLiveData();
          setActionNotice({
            message: `Đã gửi tín hiệu retry thành công cho ${incident.moduleCode}. Hệ thống đang cập nhật trạng thái.`,
            type: 'success'
          });
        } catch (err: any) {
          setActionNotice({
            message: `Lỗi khi gọi remediation: ${err.message || err}`,
            type: 'error'
          });
        } finally {
          setRemediatingId(null);
        }
      }
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLiveData();
    setRefreshing(false);
  };

  const handleSyncProjector = async () => {
    setSyncing(true);
    try {
      await m01WorkspaceApi.triggerSnapshotSync(true);
      await fetchLiveData();
      setActionNotice({
        message: 'Đồng bộ snapshot Observability Projector hoàn tất.',
        type: 'success'
      });
    } catch (err: any) {
      setActionNotice({
        message: `Lỗi đồng bộ projector: ${err.message || err}`,
        type: 'error'
      });
    } finally {
      setSyncing(false);
    }
  };

  // Preset nodes
  const currentNodes = PRESET_NODES[activePreset] || PRESET_NODES.FULL_E2E;

  return (
    <div className="w-full space-y-4 font-sans text-slate-200 select-none antialiased">
      {/* Rule #19 Confirm Dialog */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* RCA Trace Modal */}
      <CorrelationRcaTraceModal
        isOpen={isRcaOpen}
        onClose={() => setIsRcaOpen(false)}
        correlationId={selectedCorrelationId}
        onRemediated={fetchLiveData}
      />

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
          actionNotice.type === 'success' ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300' :
          actionNotice.type === 'warning' ? 'bg-amber-950/70 border-amber-700/80 text-amber-300' :
          'bg-rose-950/70 border-rose-700/80 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' && <Icons.CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {actionNotice.type === 'warning' && <Icons.AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
            {actionNotice.type === 'error' && <Icons.AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 hover:bg-black/20 rounded-lg cursor-pointer"
          >
            <Icons.X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER: OPS CONSOLE CONTROL STRIP & STATS
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-4 rounded-2xl bg-[#091122] border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
            <Icons.ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-white tracking-wide">
                BÀN ĐIỀU HÀNH VẬN HÀNH &amp; PHÁT HIỆN SỰ CỐ (OPS CONSOLE)
              </h2>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider ${
                viewMode === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80' : 'bg-amber-950 text-amber-300 border border-amber-800/80'
              }`}>
                {viewMode === 'LIVE' ? '● LIVE TELEMETRY' : '⚡ SIMULATION MODE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Theo dõi luồng dữ liệu thời gian thực, phát hiện nghẽn/sự cố và đề xuất hướng xử lý theo bộ luật Single-Writer Authority
            </p>
          </div>
        </div>

        {/* Action Controls & Simulation Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('LIVE')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'LIVE' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dữ liệu thật (LIVE)
            </button>
            <button
              onClick={() => setViewMode('SIMULATION')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'SIMULATION' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mô phỏng (SIM)
            </button>
          </div>

          {/* Quick Simulation Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 border border-amber-800/80 text-xs font-bold transition-all cursor-pointer"
            >
              <Icons.Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Mô phỏng sự cố</span>
              <Icons.ChevronDown className="w-3 h-3 text-amber-400" />
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-64 p-2 rounded-xl bg-[#0f172a] border border-slate-700 shadow-xl hidden group-hover:block z-50 space-y-1 text-xs">
              <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Chọn lỗi mẫu thử nghiệm
              </div>
              <button
                onClick={() => handleSimulateIncident('M17', 'NEGATIVE_STOCK_BLOCKED')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
              >
                <span>M17: Xuất kho âm (ATP)</span>
                <span className="text-[10px] font-mono text-rose-400 font-bold">Cao</span>
              </button>
              <button
                onClick={() => handleSimulateIncident('M30', 'CLOSED_PERIOD_FORBIDDEN')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
              >
                <span>M30: Khóa sổ kỳ kế toán</span>
                <span className="text-[10px] font-mono text-rose-400 font-bold">Cao</span>
              </button>
              <button
                onClick={() => handleSimulateIncident('M42', 'ERR_COSTING_LAYER_DEPLETED')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
              >
                <span>M42: Cạn Cost Layer</span>
                <span className="text-[10px] font-mono text-rose-400 font-bold">Cao</span>
              </button>
              <button
                onClick={() => handleSimulateIncident('M32', 'OVERDRAFT_GUARD_BLOCKED')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
              >
                <span>M32: Quỹ tiền thấu chi</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">TB</span>
              </button>
              <button
                onClick={() => handleSimulateIncident('M08', 'BUDGET_GUARD_EXCEEDED')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
              >
                <span>M08: Vượt ngân sách PO</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">TB</span>
              </button>
              <button
                onClick={() => handleSimulateIncident('M05', 'DLQ_QUARANTINED')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
              >
                <span>M05: Dead Letter Queue (DLQ)</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">TB</span>
              </button>
              {simulatedIncidents.length > 0 && (
                <button
                  onClick={handleClearAllSimulations}
                  className="w-full text-left px-2.5 py-1.5 mt-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-bold flex items-center gap-1.5 cursor-pointer border border-rose-800/60"
                >
                  <Icons.Trash2 className="w-3 h-3" />
                  <span>Xóa hết mô phỏng</span>
                </button>
              )}
            </div>
          </div>

          {/* Refresh & Projector Sync */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <Icons.RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleSyncProjector}
            disabled={syncing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Icons.Layers className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Đồng bộ Snapshot</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEVERITY COUNTERS STRIP
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#091122] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Tổng sự cố đang mở</span>
            <span className="text-xl font-bold font-mono text-white tabular-nums">{severityCounts.total}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-cyan-400 flex items-center justify-center font-bold font-mono">
            {severityCounts.total}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-300 block">Mức độ: CAO (Critical)</span>
            <span className="text-xl font-bold font-mono text-rose-400 tabular-nums">{severityCounts.high}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-900/80 text-rose-200 flex items-center justify-center font-bold">
            <Icons.AlertOctagon className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-300 block">Mức độ: TRUNG BÌNH</span>
            <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">{severityCounts.medium}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-900/80 text-amber-200 flex items-center justify-center font-bold">
            <Icons.AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Mức độ: THẤP</span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">{severityCounts.low}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center font-bold">
            <Icons.Info className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN WORKSPACE CANVAS (2-COLUMN SPLIT):
          LEFT: Interactive Flow Map with Auto-Coloring
          RIGHT: Open Incidents & Actionable Remediation Guidance
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: INTERACTIVE MAP (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 shadow-sm space-y-3">
            {/* Preset Selector Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Icons.Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white tracking-wider">
                  BẢN ĐỒ MẠCH LUỒNG &amp; TRẠNG THÁI SỰ CỐ
                </h3>
              </div>

              {/* Preset Buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                {(['FULL_E2E', 'P2P', 'O2C', 'POS', 'INVENTORY', 'MANUFACTURING', 'RETURNS', 'FINANCE'] as OpsChainPreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setActivePreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      activePreset === preset
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Legend */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800 flex-wrap">
              <span className="font-bold text-slate-300 font-sans">Chú giải màu sắc:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-600 inline-block border border-rose-400"></span>
                <span className="text-rose-300 font-semibold">Có sự cố (Incident)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-amber-500 bg-amber-950/60 inline-block"></span>
                <span className="text-amber-300 font-semibold">Thượng nguồn nghi vấn (Upstream)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-rose-500 bg-rose-950/60 inline-block"></span>
                <span className="text-rose-300 font-semibold">Hạ nguồn bị ảnh hưởng (Downstream)</span>
              </div>
            </div>

            {/* SVG Visual Canvas */}
            <div className="relative w-full h-[360px] bg-[#050b14] rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
              <svg className="w-full h-full" viewBox="0 0 980 320">
                <defs>
                  <linearGradient id="edgeGradNormal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="edgeGradFault" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="glowRose" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Grid Lines */}
                <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4">
                  {[40, 80, 120, 160, 200, 240, 280].map((y) => (
                    <line key={y} x1="0" y1={y} x2="980" y2={y} />
                  ))}
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
                    <line key={x} x1={x} y1="0" x2={x} y2="320" />
                  ))}
                </g>

                {/* Connecting Lines between sequential nodes in preset */}
                {currentNodes.map((node, idx) => {
                  if (idx === currentNodes.length - 1) return null;
                  const next = currentNodes[idx + 1];
                  const isFaultPath = faultModuleCodes.has(node.id) || faultModuleCodes.has(next.id);
                  return (
                    <g key={`edge-${node.id}-${next.id}`}>
                      <line
                        x1={node.x + 35}
                        y1={node.y + 20}
                        x2={next.x + 35}
                        y2={next.y + 20}
                        stroke={isFaultPath ? '#f43f5e' : '#0284c7'}
                        strokeWidth={isFaultPath ? 2.5 : 1.5}
                        strokeDasharray={isFaultPath ? '6 4' : '4 3'}
                        className={isFaultPath ? 'animate-pulse' : ''}
                      />
                    </g>
                  );
                })}

                {/* Visual Node Rectangles */}
                {currentNodes.map((node) => {
                  const isFault = faultModuleCodes.has(node.id);
                  const isSelected = selectedIncident?.moduleCode === node.id;
                  const isUpstream = upstreamSuspectSet.has(node.id);
                  const isDownstream = downstreamImpactSet.has(node.id);

                  // Color styling based on incident rules
                  let rectFill = '#0f172a';
                  let strokeColor = '#334155';
                  let strokeWidth = 1.5;
                  let filter = undefined;

                  if (isFault) {
                    rectFill = '#881337'; // deep rose
                    strokeColor = '#f43f5e';
                    strokeWidth = 2.5;
                    filter = 'url(#glowRose)';
                  } else if (isUpstream) {
                    rectFill = '#451a03'; // deep amber
                    strokeColor = '#f59e0b'; // amber border
                    strokeWidth = 2.5;
                    filter = 'url(#glowAmber)';
                  } else if (isDownstream) {
                    rectFill = '#4c0519'; // rose tint
                    strokeColor = '#f43f5e'; // red border
                    strokeWidth = 2.5;
                  } else if (isSelected) {
                    strokeColor = '#38bdf8';
                    strokeWidth = 2.5;
                  }

                  const pipe = PIPELINE_GRAPH[node.id];

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() => {
                        const targetInc = activeIncidents.find((i) => i.moduleCode === node.id);
                        if (targetInc) setSelectedIncidentId(targetInc.id);
                      }}
                    >
                      {/* Node Box */}
                      <rect
                        width="80"
                        height="44"
                        rx="8"
                        fill={rectFill}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        filter={filter}
                      />

                      {/* Header bar for authority domain */}
                      {pipe?.isAuthority && (
                        <rect width="80" height="4" rx="2" fill="#38bdf8" />
                      )}

                      {/* Module Code */}
                      <text
                        x="40"
                        y="18"
                        textAnchor="middle"
                        fill={isFault ? '#ffe4e6' : isUpstream ? '#fef3c7' : '#ffffff'}
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {node.id}
                      </text>

                      {/* Label */}
                      <text
                        x="40"
                        y="34"
                        textAnchor="middle"
                        fill={isFault ? '#fecdd3' : isUpstream ? '#fde68a' : '#94a3b8'}
                        fontSize="9"
                      >
                        {node.label.replace(`(${node.id})`, '').trim()}
                      </text>

                      {/* Fault Badge Indicator */}
                      {isFault && (
                        <circle cx="72" cy="8" r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="1" className="animate-ping" />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Quick Summary Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Chu trình: <strong className="text-white">{activePreset}</strong> ({currentNodes.length} phân hệ)</span>
              <span>Tổng số node trong mạng: <strong className="text-cyan-400 font-mono">42 modules</strong></span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: OPEN INCIDENTS & ACTIONABLE REMEDIATION GUIDANCE (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Panel 1: SỰ CỐ ĐANG MỞ (Grouped Incidents) */}
          <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Icons.AlertOctagon className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-white tracking-wider">
                  SỰ CỐ ĐANG MỞ ({activeIncidents.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Gộp theo Module &amp; Mã lỗi
              </span>
            </div>

            {activeIncidents.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center space-y-2">
                <Icons.CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-emerald-400">HỆ THỐNG HOẠT ĐỘNG HOÀN HẢO</h4>
                <p className="text-[11px] text-slate-400">
                  Không có sự cố ghi nhận trong chu kỳ hiện tại. Bạn có thể bấm <strong className="text-amber-300">"Mô phỏng sự cố"</strong> ở trên để kiểm tra cơ chế phản ứng.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {activeIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-950/70 border-rose-500 shadow-md'
                          : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-rose-900/90 text-rose-200 font-mono font-bold text-[11px] border border-rose-700">
                            {inc.moduleCode}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight">
                              {inc.errorCode}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {inc.moduleName}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                            inc.severity === 'CAO' ? 'bg-rose-900 text-rose-200 border border-rose-700' :
                            inc.severity === 'TRUNG BÌNH' ? 'bg-amber-900 text-amber-200 border border-amber-700' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {inc.severity}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">
                            {inc.count > 1 ? `x${inc.count} lần` : '1 lần'}
                          </span>
                        </div>
                      </div>

                      {inc.isSimulated && (
                        <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/60">
                          <span>[MÔ PHỎNG SỰ CỐ]</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveSimulatedIncident(inc.id);
                            }}
                            className="hover:underline text-rose-300 cursor-pointer"
                          >
                            Khắc phục →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel 2: ĐỀ XUẤT XỬ LÝ (Actionable Guidance from BUSINESS_RULES) */}
          <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Icons.Compass className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white tracking-wider">
                  ĐỀ XUẤT XỬ LÝ THEO LUẬT DOANH NGHIỆP
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Single-Writer Rules
              </span>
            </div>

            {selectedIncident ? (
              (() => {
                const guidance = BUSINESS_RULES[selectedIncident.moduleCode]?.[selectedIncident.errorCode] || {
                  errorCode: selectedIncident.errorCode,
                  name: `Sự cố ${selectedIncident.errorCode}`,
                  description: selectedIncident.errorMessage,
                  solution: `Kiểm tra dịch vụ thẩm quyền tại phân hệ ${selectedIncident.moduleCode}. Tuân thủ nguyên tắc Single-Writer Authority, không ghi tắt trực tiếp vào bảng cơ sở dữ liệu.`,
                  responsibleService: `${selectedIncident.moduleCode} Authority Service`,
                  domainAuthority: `${selectedIncident.moduleName} Authority`,
                  prevention: 'Theo dõi log kiểm toán và đặt ngưỡng giám sát SLA.',
                  canRetry: selectedIncident.sourceType === 'EVENT'
                };

                return (
                  <div className="space-y-3 text-xs">
                    {/* Incident Summary Card */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{guidance.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">Mã: {selectedIncident.errorCode}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {guidance.description}
                      </p>
                    </div>

                    {/* Actionable Solution */}
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                        <Icons.CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>HƯỚNG XỬ LÝ KHUYẾN NGHỊ:</span>
                      </div>
                      <p className="text-slate-200 text-[11px] leading-relaxed">
                        {guidance.solution}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-emerald-900/60">
                        <span>Thẩm quyền ghi: <strong className="text-cyan-400">{guidance.responsibleService}</strong></span>
                      </div>
                    </div>

                    {/* Upstream & Downstream Resolution */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-900/60">
                        <span className="text-amber-300 font-bold block mb-0.5">Thượng nguồn nghi vấn:</span>
                        <span className="text-slate-300">
                          {selectedIncident.upstreamSuspects.length > 0 ? selectedIncident.upstreamSuspects.join(', ') : 'Không có (Root)'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-900/60">
                        <span className="text-rose-300 font-bold block mb-0.5">Hạ nguồn ảnh hưởng:</span>
                        <span className="text-slate-300 truncate block">
                          {selectedIncident.downstreamImpacted.length > 0 ? selectedIncident.downstreamImpacted.join(', ') : 'Không có'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-1 flex items-center gap-2">
                      {/* RCA Trace Lookup Button */}
                      <button
                        onClick={() => {
                          setSelectedCorrelationId(selectedIncident.correlationId);
                          setIsRcaOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <Icons.Search className="w-3.5 h-3.5" />
                        <span>Tra cứu RCA Trace</span>
                      </button>

                      {/* Remediation Action Button */}
                      {selectedIncident.isSimulated ? (
                        <button
                          onClick={() => handleResolveSimulatedIncident(selectedIncident.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <Icons.Check className="w-3.5 h-3.5" />
                          <span>Khắc phục mô phỏng</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemediateEvent(selectedIncident)}
                          disabled={remediatingId === selectedIncident.latestSpanId}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {remediatingId === selectedIncident.latestSpanId ? (
                            <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Icons.RotateCcw className="w-3.5 h-3.5" />
                          )}
                          <span>Thử lại sự kiện (Retry)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs italic">
                Chọn một sự cố ở danh sách phía trên để xem chi tiết đề xuất xử lý.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
