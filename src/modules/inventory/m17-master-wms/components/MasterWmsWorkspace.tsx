import React, { useState, useEffect } from 'react';
import { 
  Warehouse, Boxes, Layers, ArrowDownUp, ClipboardCheck, SlidersHorizontal, 
  ArrowLeftRight, Tags, QrCode, Search, RefreshCw, ShieldCheck, Database, 
  CheckCircle2, AlertTriangle, FileText, Filter, ArrowRight, ChevronRight, 
  Package, Truck, DollarSign, BarChart2, Activity, Gauge, AlertOctagon,
  Clock, ShieldAlert, ArrowUpRight, Zap, CheckSquare, FileSpreadsheet, Download,
  History, Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { WarehouseProductsTab } from '../../m18-warehouse/components/WarehouseProductsTab';
import { MasterWmsWorkspaceProps } from './types';

export const MasterWmsWorkspace: React.FC<MasterWmsWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
  guidedTask,
  selectedEntity,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'FACILITIES' | 'PRODUCTS' | 'INSPECTION' | 'TIMELINE'>('PRODUCTS');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineActionFilter, setTimelineActionFilter] = useState('ALL');

  const [timelineEvents, setTimelineEvents] = useState([
    {
      id: 'EVT-1001',
      sku: 'SKU-MED-004',
      productName: 'Paracetamol 500mg USP Dược Phẩm',
      timestamp: '08/09/2026 14:15:20',
      actionType: 'KCS_INSPECT',
      actionLabel: 'Kiểm Định Chất Lượng KCS',
      warehouseName: 'Kho Tổng Trung Tâm (TP.HCM)',
      binLocation: 'BIN-B2-11',
      operator: 'Lê Thị KCS (QC Inspector)',
      previousState: 'Chờ kiểm định (Inspecting)',
      newState: 'Cận hạn / Chờ xử lý FEFO (Near Expiry)',
      referenceNo: 'KCS-REP-2026-881',
      notes: 'Lô hàng cận 22 ngày hết hạn, yêu cầu lập lệnh đẩy hàng ưu tiên xuất trước theo nguyên tắc FEFO.'
    },
    {
      id: 'EVT-1002',
      sku: 'SKU-MED-001',
      productName: 'Kháng sinh Ampicillin 500mg Chuẩn GMP',
      timestamp: '07/09/2026 09:30:10',
      actionType: 'RESERVE',
      actionLabel: 'Giữ Chỗ Tồn Kho (SO Allocation)',
      warehouseName: 'Kho Tổng Trung Tâm (TP.HCM)',
      binLocation: 'BIN-A1-04',
      operator: 'Nguyễn Văn Kho (Thủ Kho)',
      previousState: 'Khả dụng: 120 Hộp',
      newState: 'Khả dụng: 80 Hộp (Giữ chỗ 40)',
      referenceNo: 'SO-2026-9912',
      notes: 'Khóa kho 40 hộp phục vụ Đơn hàng Bệnh viện Đa khoa Quốc tế.'
    },
    {
      id: 'EVT-1003',
      sku: 'SKU-ELC-001',
      productName: 'Bộ điều khiển lập trình PLC Siemens S7-1200',
      timestamp: '06/09/2026 16:45:00',
      actionType: 'INBOUND',
      actionLabel: 'Nhập Kho Từ Nhà Cung Cấp',
      warehouseName: 'Kho Tổng Trung Tâm (TP.HCM)',
      binLocation: 'BIN-E4-01',
      operator: 'Trần Văn Nhập (Receiving Staff)',
      previousState: 'Hàng đang trên đường về (Incoming: 30)',
      newState: 'Tồn kho vật lý: 85 Bộ (Ready)',
      referenceNo: 'PO-2026-4401',
      notes: 'Kiểm tra đủ số lượng, serial thiết bị trùng khớp với hóa đơn VAT nhà cung cấp.'
    },
    {
      id: 'EVT-1004',
      sku: 'SKU-RAW-304',
      productName: 'Hạt nhựa nguyên sinh PP Yarn Grade (Bao 25kg)',
      timestamp: '08/09/2026 11:20:45',
      actionType: 'OUTBOUND',
      actionLabel: 'Xuất Kho Sản Xuất (Production Issue)',
      warehouseName: 'Kho Tổng Trung Tâm (TP.HCM)',
      binLocation: 'BIN-C1-09',
      operator: 'Phạm Văn Xuất (Dispatch Staff)',
      previousState: 'Tồn thực tế: 6000 Kg',
      newState: 'Tồn thực tế: 5400 Kg',
      referenceNo: 'WO-2026-1182',
      notes: 'Xuất cấp nguyên liệu cho Xưởng Ép Nhựa ca 1.'
    },
    {
      id: 'EVT-1005',
      sku: 'SKU-RAW-112',
      productName: 'Hóa chất phụ gia Polymer Tech (Chất trợ ngưng)',
      timestamp: '07/09/2026 17:00:12',
      actionType: 'QUARANTINE',
      actionLabel: 'Cách Ly KCS / Khóa Tồn Kho',
      warehouseName: 'Kho Lạnh Dược Phẩm & Hóa Chất (Bình Dương)',
      binLocation: 'COLD-Z1-01',
      operator: 'Đỗ Văn Kiểm (QA Manager)',
      previousState: 'Đạt chuẩn (Ready)',
      newState: 'Cách ly (Quarantined / Locked)',
      referenceNo: 'QC-INC-2026-09',
      notes: 'Phát hiện bao bì ẩm ướt nhẹ do điều kiện vận chuyển, tiến hành niêm phong kho lạnh chờ biên bản xử lý.'
    },
    {
      id: 'EVT-1006',
      sku: 'SKU-CHIP-3NM',
      productName: 'Vi Xử Lý AI 3nm Nexus-V1 NPU High Performance',
      timestamp: '08/09/2026 16:00:00',
      actionType: 'ADJUST',
      actionLabel: 'Kiểm Kê Định Kỳ & Điều Chỉnh Tồn Kho',
      warehouseName: 'Kho Tổng Trung Tâm (TP.HCM)',
      binLocation: 'BIN-S1-03',
      operator: 'Hồ Hoàng Kiểm Kê (Auditor)',
      previousState: 'Tồn sổ sách: 1240 Cái',
      newState: 'Tồn thực tế: 1250 Cái (+10 chênh lệch kiểm kê)',
      referenceNo: 'STK-2026-Q3',
      notes: 'Kiểm kê phòng sạch ESD định kỳ Q3, xác nhận chênh lệch +10 chip trong khay Tray JEDEC.'
    }
  ]);

  // Live and computed stats
  const [stats, setStats] = useState({
    totalPhysical: 18450,
    totalReserved: 1240,
    totalAvailable: 17210,
    inventoryValue: 4850000000,
    overallFullnessRate: 79.4,
    pendingStocktakes: 3,
    pendingAdjustments: 2,
    activeTransfers: 5,
    pickQueueCount: 12,
    packQueueCount: 8,
    shipQueueCount: 4,
    lowStockCount: 4,
    expiringLotsCount: 3,
    quarantinedLotsCount: 1,
  });

  // Capacity breakdown by zone / warehouse with operational status & stored inventory SKUs
  const [warehouseFullness, setWarehouseFullness] = useState([
    {
      id: 'WH-HCM-01',
      name: 'Kho Tổng Trung Tâm (TP. Hồ Chí Minh)',
      type: 'Kho Tổng / DC',
      totalSlots: 15000,
      occupiedSlots: 12650,
      fullnessRate: 84.3,
      status: 'OPTIMAL',
      operationalStatus: 'PROCESSING' as 'PROCESSING' | 'INSPECTING' | 'CLOSED', // 'PROCESSING' (Đang xử lý) | 'INSPECTING' (Chờ kiểm định) | 'CLOSED' (Đã đóng)
      temperature: '22°C - Standard',
      activeOrdersCount: 42,
      storedItems: [
        { sku: 'SKU-MED-001', name: 'Kháng sinh Ampicillin 500mg', quantity: 120, unit: 'Hộp', bin: 'BIN-A1-04' },
        { sku: 'SKU-MED-004', name: 'Paracetamol 500mg USP', quantity: 4200, unit: 'Hộp', bin: 'BIN-B2-11' },
        { sku: 'SKU-ELC-001', name: 'Bộ điều khiển PLC Siemens S7-1200', quantity: 85, unit: 'Bộ', bin: 'BIN-E4-01' },
        { sku: 'SKU-RAW-304', name: 'Hạt nhựa nguyên sinh PP Yarn Grade', quantity: 5400, unit: 'Kg', bin: 'BIN-C1-09' },
      ],
    },
    {
      id: 'WH-HN-02',
      name: 'Kho Vận Trung Chuyển (Hà Nội)',
      type: 'Hub Phân Phối',
      totalSlots: 10000,
      occupiedSlots: 7180,
      fullnessRate: 71.8,
      status: 'NORMAL',
      operationalStatus: 'PROCESSING' as 'PROCESSING' | 'INSPECTING' | 'CLOSED',
      temperature: '24°C - Standard',
      activeOrdersCount: 28,
      storedItems: [
        { sku: 'SKU-MCH-102', name: 'Vòng bi công nghiệp SKF 6205-2RS', quantity: 45, unit: 'Bộ', bin: 'BIN-H1-02' },
        { sku: 'SKU-CHM-088', name: 'Dung môi Isopropanol 99.8%', quantity: 1500, unit: 'Lít', bin: 'BIN-H3-15' },
        { sku: 'SKU-ELC-002', name: 'Cảm biến quang điện Omron E3Z', quantity: 320, unit: 'Cái', bin: 'BIN-H2-08' },
      ],
    },
    {
      id: 'WH-COLD-03',
      name: 'Kho Lạnh Dược Phẩm & Hóa Chất (Bình Dương)',
      type: 'Kho Chuyên Dụng (Cold Storage)',
      totalSlots: 4000,
      occupiedSlots: 3720,
      fullnessRate: 93.0,
      status: 'HIGH_ALERT',
      operationalStatus: 'INSPECTING' as 'PROCESSING' | 'INSPECTING' | 'CLOSED',
      temperature: '2°C - 8°C (Chilled)',
      activeOrdersCount: 15,
      storedItems: [
        { sku: 'SKU-RAW-112', name: 'Hóa chất phụ gia Polymer Tech', quantity: 850, unit: 'Kg', bin: 'COLD-Z1-01' },
        { sku: 'SKU-MED-004', name: 'Paracetamol 500mg USP', quantity: 1800, unit: 'Hộp', bin: 'COLD-Z2-04' },
        { sku: 'SKU-RAW-304', name: 'Hạt nhựa nguyên sinh PP Yarn Grade', quantity: 800, unit: 'Kg', bin: 'COLD-Z3-09' },
      ],
    },
    {
      id: 'WH-DN-04',
      name: 'Kho Hàng Miền Trung (Đà Nẵng)',
      type: 'Hub Trung Gian',
      totalSlots: 6000,
      occupiedSlots: 3680,
      fullnessRate: 61.3,
      status: 'NORMAL',
      operationalStatus: 'PROCESSING' as 'PROCESSING' | 'INSPECTING' | 'CLOSED',
      temperature: 'Ambient',
      activeOrdersCount: 19,
      storedItems: [
        { sku: 'SKU-PKG-009', name: 'Màng PE co quấn pallet 50cm x 3.2kg', quantity: 80, unit: 'Cuộn', bin: 'BIN-D1-01' },
        { sku: 'SKU-MCH-102', name: 'Vòng bi công nghiệp SKF 6205-2RS', quantity: 120, unit: 'Bộ', bin: 'BIN-D2-07' },
        { sku: 'SKU-MED-001', name: 'Kháng sinh Ampicillin 500mg', quantity: 350, unit: 'Hộp', bin: 'BIN-D3-12' },
      ],
    },
    {
      id: 'WH-CT-05',
      name: 'Kho Vệ Tinh Tây Nam Bộ (Cần Thơ)',
      type: 'Hub Phân Phối',
      totalSlots: 5000,
      occupiedSlots: 2150,
      fullnessRate: 43.0,
      status: 'NORMAL',
      operationalStatus: 'INSPECTING' as 'PROCESSING' | 'INSPECTING' | 'CLOSED',
      temperature: 'Ambient',
      activeOrdersCount: 8,
      storedItems: [
        { sku: 'SKU-MCH-102', name: 'Vòng bi công nghiệp SKF 6205-2RS', quantity: 45, unit: 'Bộ', bin: 'BIN-CT-03' },
        { sku: 'SKU-AGR-501', name: 'Phân bón vi sinh NPK sinh học', quantity: 1200, unit: 'Bao', bin: 'BIN-CT-10' },
      ],
    },
    {
      id: 'WH-HP-06',
      name: 'Kho Cảng Biển & Ngoại Quan (Hải Phòng)',
      type: 'Kho Chuyên Dụng (Cold Storage)',
      totalSlots: 8000,
      occupiedSlots: 0,
      fullnessRate: 0.0,
      status: 'NORMAL',
      operationalStatus: 'CLOSED' as 'PROCESSING' | 'INSPECTING' | 'CLOSED',
      temperature: 'Bảo trì hệ thống',
      activeOrdersCount: 0,
      storedItems: [
        { sku: 'SKU-PKG-009', name: 'Màng PE co quấn pallet 50cm x 3.2kg', quantity: 3200, unit: 'Cuộn', bin: 'SEALED-HP-01' },
      ],
    },
  ]);

  // Quick Filter States for Warehouses & SKU Query
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState<'ALL' | 'PROCESSING' | 'INSPECTING' | 'CLOSED'>('ALL');
  const [warehouseTypeFilter, setWarehouseTypeFilter] = useState<string>('ALL');
  const [warehouseSearchKeyword, setWarehouseSearchKeyword] = useState<string>('');
  const [searchTargetType, setSearchTargetType] = useState<'ALL' | 'SKU' | 'NAME' | 'WAREHOUSE'>('ALL');

  // Extract unique warehouse types for filter dropdown
  const uniqueWarehouseTypes = React.useMemo(() => {
    const types = Array.from(new Set(warehouseFullness.map(wh => wh.type)));
    return types;
  }, [warehouseFullness]);

  // Comprehensive list of all Master SKUs available across warehouses
  const masterSkuCatalog = React.useMemo(() => {
    const map = new Map<string, { sku: string; name: string; totalQty: number; unit: string; warehouses: { whId: string; whName: string; qty: number; bin: string }[] }>();
    warehouseFullness.forEach(wh => {
      wh.storedItems.forEach(item => {
        if (!map.has(item.sku)) {
          map.set(item.sku, {
            sku: item.sku,
            name: item.name,
            totalQty: 0,
            unit: item.unit,
            warehouses: [],
          });
        }
        const record = map.get(item.sku)!;
        record.totalQty += item.quantity;
        record.warehouses.push({
          whId: wh.id,
          whName: wh.name,
          qty: item.quantity,
          bin: item.bin,
        });
      });
    });
    return Array.from(map.values());
  }, [warehouseFullness]);

  // Matching SKU search results
  const matchingSkuResults = React.useMemo(() => {
    if (!warehouseSearchKeyword.trim()) return [];
    const kw = warehouseSearchKeyword.toLowerCase();
    return masterSkuCatalog.filter(item => 
      item.sku.toLowerCase().includes(kw) || item.name.toLowerCase().includes(kw)
    );
  }, [masterSkuCatalog, warehouseSearchKeyword]);

  // Filtered warehouses based on status, type, and keyword (Supports SKU, Item Name, and Warehouse Code/Name)
  const filteredWarehouses = React.useMemo(() => {
    return warehouseFullness.filter(wh => {
      // 1. Filter by operational status
      if (warehouseStatusFilter !== 'ALL' && wh.operationalStatus !== warehouseStatusFilter) {
        return false;
      }
      // 2. Filter by warehouse type
      if (warehouseTypeFilter !== 'ALL' && wh.type !== warehouseTypeFilter) {
        return false;
      }
      // 3. Filter by search keyword (Smart check: matches Warehouse ID, Warehouse Name, or any stored SKU / Item Name)
      if (warehouseSearchKeyword.trim()) {
        const kw = warehouseSearchKeyword.toLowerCase();
        const matchId = wh.id.toLowerCase().includes(kw);
        const matchName = wh.name.toLowerCase().includes(kw);
        const matchType = wh.type.toLowerCase().includes(kw);
        const matchStoredSku = wh.storedItems.some(
          item => item.sku.toLowerCase().includes(kw) || item.name.toLowerCase().includes(kw)
        );

        if (searchTargetType === 'SKU') {
          const matchExactSku = wh.storedItems.some(item => item.sku.toLowerCase().includes(kw));
          if (!matchExactSku) return false;
        } else if (searchTargetType === 'NAME') {
          const matchExactName = wh.storedItems.some(item => item.name.toLowerCase().includes(kw));
          if (!matchExactName) return false;
        } else if (searchTargetType === 'WAREHOUSE') {
          if (!matchId && !matchName && !matchType) return false;
        } else {
          // ALL mode
          if (!matchId && !matchName && !matchType && !matchStoredSku) return false;
        }
      }
      return true;
    });
  }, [warehouseFullness, warehouseStatusFilter, warehouseTypeFilter, warehouseSearchKeyword, searchTargetType]);

  // Count helper for status badges
  const statusCounts = React.useMemo(() => {
    return {
      all: warehouseFullness.length,
      processing: warehouseFullness.filter(w => w.operationalStatus === 'PROCESSING').length,
      inspecting: warehouseFullness.filter(w => w.operationalStatus === 'INSPECTING').length,
      closed: warehouseFullness.filter(w => w.operationalStatus === 'CLOSED').length,
    };
  }, [warehouseFullness]);

  // Safety Stock & Low Inventory Alerts
  const [safetyAlerts, setSafetyAlerts] = useState([
    {
      sku: 'SKU-MED-001',
      name: 'Kháng sinh Ampicillin 500mg (Hộp 10 vỉ)',
      warehouse: 'Kho Tổng TP.HCM',
      currentStock: 120,
      minSafetyStock: 500,
      shortageQty: 380,
      urgency: 'CRITICAL',
      suggestedAction: 'Cần lập lệnh điều chuyển hoặc PR mua hàng bổ sung khẩn cấp',
      targetModule: 'M21',
      targetRoute: '/transfer',
    },
    {
      sku: 'SKU-MCH-102',
      name: 'Vòng bi công nghiệp SKF 6205-2RS',
      warehouse: 'Kho Phân Phối Hà Nội',
      currentStock: 45,
      minSafetyStock: 150,
      shortageQty: 105,
      urgency: 'HIGH',
      suggestedAction: 'Tồn dưới ngưỡng min, đề xuất luân chuyển từ Kho Tổng',
      targetModule: 'M21',
      targetRoute: '/transfer',
    },
    {
      sku: 'SKU-RAW-304',
      name: 'Hạt nhựa nguyên sinh PP Yarn Grade',
      warehouse: 'Kho Lạnh Bình Dương',
      currentStock: 800,
      minSafetyStock: 2000,
      shortageQty: 1200,
      urgency: 'HIGH',
      suggestedAction: 'Nguyên liệu sắp hết cho kế hoạch sản xuất tuần tới',
      targetModule: 'M20',
      targetRoute: '/stock-adjustment',
    },
    {
      sku: 'SKU-PKG-009',
      name: 'Màng PE co quấn pallet 50cm x 3.2kg',
      warehouse: 'Kho Đà Nẵng',
      currentStock: 80,
      minSafetyStock: 200,
      shortageQty: 120,
      urgency: 'MEDIUM',
      suggestedAction: 'Sắp chạm ngưỡng tối thiểu',
      targetModule: 'M19',
      targetRoute: '/stocktake',
    },
  ]);

  // Expiring Lots & FEFO Compliance Alerts
  const [expiringAlerts, setExpiringAlerts] = useState([
    {
      lotNumber: 'LOT-2026-MED-09',
      sku: 'SKU-MED-004',
      name: 'Paracetamol 500mg USP',
      quantity: 4200,
      expiryDate: '25/09/2026',
      daysRemaining: 22,
      status: 'NEAR_EXPIRY',
      warehouse: 'Kho Tổng TP.HCM',
    },
    {
      lotNumber: 'LOT-2026-CHM-03',
      sku: 'SKU-CHM-088',
      name: 'Dung môi Isopropanol 99.8%',
      quantity: 1500,
      expiryDate: '10/10/2026',
      daysRemaining: 37,
      status: 'NEAR_EXPIRY',
      warehouse: 'Kho Lạnh Bình Dương',
    },
    {
      lotNumber: 'LOT-2026-QC-HOLD',
      sku: 'SKU-RAW-112',
      name: 'Hóa chất phụ gia Polymer Tech',
      quantity: 850,
      expiryDate: '15/12/2026',
      daysRemaining: 103,
      status: 'QUARANTINE',
      warehouse: 'Khu Cách Ly KCS (Zone Q)',
    },
  ]);

  // Inventory Inspection & Quarantine Items with Real-time Status Control
  const [inspectionItems, setInspectionItems] = useState([
    {
      id: 'INSP-ITEM-001',
      sku: 'SKU-MED-004',
      name: 'Kháng sinh Paracetamol 500mg USP',
      batchNo: 'LOT-2026-MED-09',
      warehouse: 'Kho Tổng Trung Tâm (TP.HCM)',
      quantity: 4200,
      unit: 'Hộp',
      inspector: 'Dược sĩ Nguyễn Văn An (KCS-01)',
      inspectionDate: '08/09/2026',
      operationalStatus: 'INSPECTING' as 'PROCESSING' | 'INSPECTING' | 'CLOSED',
      reason: 'Đang kiểm nghiệm độ hòa tan vi sinh theo lô',
    },
    {
      id: 'INSP-ITEM-002',
      sku: 'SKU-RAW-112',
      name: 'Hóa chất phụ gia Polymer Tech',
      batchNo: 'LOT-2026-QC-HOLD',
      warehouse: 'Kho Lạnh Dược Phẩm (Bình Dương)',
      quantity: 850,
      unit: 'Kg',
      inspector: 'Kỹ sư Lê Hoàng Nam (QC-03)',
      inspectionDate: '07/09/2026',
      operationalStatus: 'INSPECTING' as 'PROCESSING' | 'INSPECTING' | 'CLOSED',
      reason: 'Kiểm tra hàm lượng tạp chất & chứng nhận COA',
    },
    {
      id: 'INSP-ITEM-003',
      sku: 'SKU-CHM-088',
      name: 'Dung môi Isopropanol 99.8%',
      batchNo: 'LOT-2026-CHM-03',
      warehouse: 'Kho Vận Trung Chuyển (Hà Nội)',
      quantity: 1500,
      unit: 'Lít',
      inspector: 'Trần Thị Mai (KCS-02)',
      inspectionDate: '06/09/2026',
      operationalStatus: 'PROCESSING' as 'PROCESSING' | 'INSPECTING' | 'CLOSED',
      reason: 'Đã đạt tiêu chuẩn xuất xưởng, đang xử lý đóng gói',
    },
    {
      id: 'INSP-ITEM-004',
      sku: 'SKU-PKG-009',
      name: 'Màng PE co quấn pallet 50cm x 3.2kg',
      batchNo: 'LOT-2026-PKG-11',
      warehouse: 'Kho Cảng Biển (Hải Phòng)',
      quantity: 3200,
      unit: 'Cuộn',
      inspector: 'Phạm Minh Đức (QC-05)',
      inspectionDate: '02/09/2026',
      operationalStatus: 'CLOSED' as 'PROCESSING' | 'INSPECTING' | 'CLOSED',
      reason: 'Đã kết thúc kiểm định và niêm phong kho lưu trữ',
    },
    {
      id: 'INSP-ITEM-005',
      sku: 'SKU-MCH-102',
      name: 'Vòng bi công nghiệp SKF 6205-2RS',
      batchNo: 'LOT-2026-SKF-88',
      warehouse: 'Kho Vệ Tinh (Cần Thơ)',
      quantity: 45,
      unit: 'Bộ',
      inspector: 'Vũ Quốc Thái (QC-01)',
      inspectionDate: '08/09/2026',
      operationalStatus: 'INSPECTING' as 'PROCESSING' | 'INSPECTING' | 'CLOSED',
      reason: 'Chờ đối soát độ rung cơ học và CO/CQ',
    },
  ]);

  const [itemStatusFilter, setItemStatusFilter] = useState<'ALL' | 'PROCESSING' | 'INSPECTING' | 'CLOSED'>('ALL');
  const [itemSearchText, setItemSearchText] = useState('');
  const [inspectionCurrentPage, setInspectionCurrentPage] = useState(1);
  const [inspectionPageSize, setInspectionPageSize] = useState(5);

  // Handler for Updating Inspection Item Status with automatic Toast notification
  const handleUpdateItemStatus = (
    itemId: string, 
    newStatus: 'PROCESSING' | 'INSPECTING' | 'CLOSED'
  ) => {
    const targetItem = inspectionItems.find(i => i.id === itemId);
    if (!targetItem) return;

    const oldStatus = targetItem.operationalStatus;
    if (oldStatus === newStatus) return;

    // Rule #19: When transitioning from INSPECTING to CLOSED, display ConfirmDialog
    if (oldStatus === 'INSPECTING' && newStatus === 'CLOSED') {
      setConfirmDialog({
        isOpen: true,
        title: 'Xác Nhận Đóng Kiểm Định & Niêm Phong Mặt Hàng',
        message: `Bạn có chắc chắn muốn chuyển mặt hàng "${targetItem.name}" (SKU: ${targetItem.sku}, Lô: ${targetItem.batchNo}) từ trạng thái "Chờ kiểm định" sang "Đã đóng"? Thao tác này sẽ niêm phong và gửi thông báo cảnh báo tự động.`,
        confirmText: 'Xác Nhận Đóng',
        cancelText: 'Hủy Bỏ',
        variant: 'danger',
        onConfirm: () => {
          setInspectionItems(prev => prev.map(item => 
            item.id === itemId ? { ...item, operationalStatus: newStatus } : item
          ));
          setConfirmDialog(null);

          // Automatic Toast Notification
          onNotify(
            'warning',
            'Cảnh Báo: Mặt Hàng Đã Chuyển Sang "Đã Đóng"',
            `Mặt hàng "${targetItem.name}" (SKU: ${targetItem.sku}, Lô: ${targetItem.batchNo}) tại ${targetItem.warehouse} đã chuyển từ [Chờ kiểm định] sang [Đã đóng]. Quyền xuất kho tạm thời bị khóa.`
          );
        }
      });
    } else {
      setInspectionItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, operationalStatus: newStatus } : item
      ));

      if (newStatus === 'PROCESSING') {
        onNotify(
          'success', 
          'Cập Nhật Trạng Thái Mặt Hàng', 
          `Mặt hàng "${targetItem.name}" (${targetItem.sku}) đã chuyển sang trạng thái "Đang xử lý".`
        );
      } else if (newStatus === 'INSPECTING') {
        onNotify(
          'info', 
          'Chuyển Sang Chờ Kiểm Định', 
          `Mặt hàng "${targetItem.name}" (${targetItem.sku}) đã được đưa vào diện "Chờ kiểm định KCS".`
        );
      }
    }
  };

  // Handler for Updating Warehouse Status with automatic Toast notification
  const handleUpdateWarehouseStatus = (
    warehouseId: string, 
    newStatus: 'PROCESSING' | 'INSPECTING' | 'CLOSED'
  ) => {
    const targetWh = warehouseFullness.find(w => w.id === warehouseId);
    if (!targetWh) return;

    const oldStatus = targetWh.operationalStatus;
    if (oldStatus === newStatus) return;

    if (oldStatus === 'INSPECTING' && newStatus === 'CLOSED') {
      setConfirmDialog({
        isOpen: true,
        title: 'Xác Nhận Đóng Cơ Sở Kho',
        message: `Bạn có chắc chắn muốn chuyển cơ sở "${targetWh.name}" (${targetWh.id}) từ trạng thái "Chờ kiểm định" sang "Đã đóng"? Toàn bộ nghiệp vụ nhập/xuất tại cơ sở này sẽ tạm ngừng.`,
        confirmText: 'Đóng Cơ Sở Kho',
        cancelText: 'Hủy Bỏ',
        variant: 'danger',
        onConfirm: () => {
          setWarehouseFullness(prev => prev.map(w => 
            w.id === warehouseId ? { ...w, operationalStatus: newStatus } : w
          ));
          setConfirmDialog(null);

          // Automatic Toast Notification
          onNotify(
            'warning',
            'Cảnh Báo: Cơ Sở Kho Đã Chuyển Sang "Đã Đóng"',
            `Cơ sở kho "${targetWh.name}" (${targetWh.id}) đã chuyển trạng thái từ [Chờ kiểm định] sang [Đã đóng]. Hệ thống đã ngắt tự động luồng điều phối đơn hàng.`
          );
        }
      });
    } else {
      setWarehouseFullness(prev => prev.map(w => 
        w.id === warehouseId ? { ...w, operationalStatus: newStatus } : w
      ));

      if (newStatus === 'PROCESSING') {
        onNotify('success', 'Trạng Thái Vận Hành', `Cơ sở kho "${targetWh.name}" đã kích hoạt "Đang xử lý".`);
      } else if (newStatus === 'INSPECTING') {
        onNotify('info', 'Trạng Thái Vận Hành', `Cơ sở kho "${targetWh.name}" đã chuyển sang "Chờ kiểm định".`);
      }
    }
  };

  // Export Warehouses & Stored SKUs to Excel (.xlsx)
  const handleExportWarehouseExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Danh Sách Cơ Sở Kho
      const warehouseRows = filteredWarehouses.map((wh, idx) => {
        const statusText = wh.operationalStatus === 'PROCESSING' 
          ? 'Đang xử lý (PROCESSING)' 
          : wh.operationalStatus === 'INSPECTING' 
          ? 'Chờ kiểm định (INSPECTING)' 
          : 'Đã đóng (CLOSED)';
        
        const capacityStatusText = wh.status === 'HIGH_ALERT'
          ? 'Cảnh Báo Quá Tải (>90%)'
          : wh.status === 'OPTIMAL'
          ? 'Tối Ưu Vận Hành'
          : 'Bình Thường';

        const skuListStr = wh.storedItems.map(item => `${item.sku} - ${item.name} (${item.quantity} ${item.unit}, Ô: ${item.bin})`).join('; ');
        const totalItemsCount = wh.storedItems.reduce((sum, item) => sum + item.quantity, 0);

        return {
          'STT': idx + 1,
          'Mã Cơ Sở Kho': wh.id,
          'Tên Cơ Sở Kho': wh.name,
          'Loại Kho / Mục Đích': wh.type,
          'Trạng Thái Vận Hành (Badge)': statusText,
          'Trạng Thái Công Suất': capacityStatusText,
          'Tổng Dung Lượng (Slots)': wh.totalSlots,
          'Số Slot Đã Chiếm Dụng': wh.occupiedSlots,
          'Số Slot Khả Dụng': wh.totalSlots - wh.occupiedSlots,
          'Tỷ Lệ Lấp Đầy (%)': `${wh.fullnessRate}%`,
          'Điều Kiện Nhiệt Độ & Lưu Trữ': wh.temperature,
          'Số Lệnh Đang Xử Lý': wh.activeOrdersCount,
          'Số Loại Mặt Hàng (SKUs)': wh.storedItems.length,
          'Tổng Tồn Kho Mặt Hàng': totalItemsCount,
          'Danh Mục Mã SKU Lưu Trữ': skuListStr,
        };
      });

      const wsWarehouses = XLSX.utils.json_to_sheet(warehouseRows);
      wsWarehouses['!cols'] = [
        { wch: 6 },  // STT
        { wch: 16 }, // Mã Kho
        { wch: 34 }, // Tên Kho
        { wch: 22 }, // Loại Kho
        { wch: 30 }, // Trạng Thái Badge
        { wch: 24 }, // Trạng Thái Công Suất
        { wch: 24 }, // Tổng Slots
        { wch: 22 }, // Đã chiếm dụng
        { wch: 20 }, // Khả dụng
        { wch: 18 }, // Tỷ lệ lấp đầy
        { wch: 26 }, // Điều kiện nhiệt độ
        { wch: 20 }, // Số lệnh xử lý
        { wch: 22 }, // Số loại SKU
        { wch: 22 }, // Tổng tồn
        { wch: 70 }, // Danh mục SKU
      ];
      XLSX.utils.book_append_sheet(wb, wsWarehouses, 'Danh Sách Cơ Sở Kho');

      // Sheet 2: Chi Tiết Tồn Kho Theo Mã SKU
      const skuDetailRows: any[] = [];
      let skuIdx = 1;
      filteredWarehouses.forEach(wh => {
        wh.storedItems.forEach(item => {
          skuDetailRows.push({
            'STT': skuIdx++,
            'Mã Cơ Sở Kho': wh.id,
            'Tên Cơ Sở Kho': wh.name,
            'Mã SKU': item.sku,
            'Tên Mặt Hàng': item.name,
            'Vị Trí Ô Kệ (Bin Location)': item.bin,
            'Số Lượng Tồn Kho': item.quantity,
            'Đơn Vị Tính': item.unit,
            'Trạng Thái Hoạt Động Kho': wh.operationalStatus === 'PROCESSING' ? 'Đang xử lý' : wh.operationalStatus === 'INSPECTING' ? 'Chờ kiểm định' : 'Đã đóng',
            'Loại Kho': wh.type,
            'Điều Kiện Nhiệt Độ': wh.temperature,
          });
        });
      });

      const wsSkuDetails = XLSX.utils.json_to_sheet(skuDetailRows);
      wsSkuDetails['!cols'] = [
        { wch: 6 },  // STT
        { wch: 16 }, // Mã Kho
        { wch: 34 }, // Tên Kho
        { wch: 18 }, // Mã SKU
        { wch: 38 }, // Tên Mặt Hàng
        { wch: 26 }, // Vị Trí Ô Kệ
        { wch: 18 }, // Số Lượng Tồn
        { wch: 14 }, // ĐVT
        { wch: 24 }, // Trạng Thái Kho
        { wch: 22 }, // Loại Kho
        { wch: 24 }, // Nhiệt Độ
      ];
      XLSX.utils.book_append_sheet(wb, wsSkuDetails, 'Chi Tiết Mặt Hàng SKU');

      // Sheet 3: Danh Mục Kiểm Định KCS (Inspection Items)
      const inspectionRows = inspectionItems.map((item, idx) => ({
        'STT': idx + 1,
        'Mã Phiếu/Mục': item.id,
        'Mã SKU': item.sku,
        'Tên Mặt Hàng': item.name,
        'Số Lô Kiểm Định': item.batchNo,
        'Cơ Sở Kho': item.warehouse,
        'Số Lượng': item.quantity,
        'Đơn Vị Tính': item.unit,
        'Kiểm Định Viên': item.inspector,
        'Ngày Kiểm Tra': item.inspectionDate,
        'Trạng Thái Badge': item.operationalStatus === 'PROCESSING' ? 'Đang xử lý' : item.operationalStatus === 'INSPECTING' ? 'Chờ kiểm định' : 'Đã đóng',
        'Lý Do / Nội Dung Kiểm Nghiệm': item.reason,
      }));
      const wsInspection = XLSX.utils.json_to_sheet(inspectionRows);
      wsInspection['!cols'] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 16 },
        { wch: 36 },
        { wch: 22 },
        { wch: 32 },
        { wch: 14 },
        { wch: 12 },
        { wch: 28 },
        { wch: 16 },
        { wch: 20 },
        { wch: 45 },
      ];
      XLSX.utils.book_append_sheet(wb, wsInspection, 'Kiểm Định & Niêm Phong');

      // File Name with Timestamp
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `NexusSync_M17_MasterWMS_DanhSachKho_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fileName);

      onNotify(
        'success',
        'Xuất Excel Thành Công',
        `Đã xuất thành công tệp "${fileName}" gồm ${filteredWarehouses.length} cơ sở kho và danh mục SKU chi tiết.`
      );
    } catch (err: any) {
      console.error('Error exporting Excel in MasterWmsWorkspace:', err);
      onNotify('danger', 'Lỗi Xuất File', 'Không thể tạo tệp Excel. Vui lòng kiểm tra lại dữ liệu.');
    }
  };

  // Filtered Inspection Items
  const filteredInspectionItems = React.useMemo(() => {
    return inspectionItems.filter(item => {
      if (itemStatusFilter !== 'ALL' && item.operationalStatus !== itemStatusFilter) {
        return false;
      }
      if (itemSearchText.trim()) {
        const query = itemSearchText.toLowerCase();
        const matchSku = item.sku.toLowerCase().includes(query);
        const matchName = item.name.toLowerCase().includes(query);
        const matchBatch = item.batchNo.toLowerCase().includes(query);
        const matchWh = item.warehouse.toLowerCase().includes(query);
        if (!matchSku && !matchName && !matchBatch && !matchWh) return false;
      }
      return true;
    });
  }, [inspectionItems, itemStatusFilter, itemSearchText]);

  useEffect(() => {
    setInspectionCurrentPage(1);
  }, [itemStatusFilter, itemSearchText]);

  const paginatedInspectionItems = React.useMemo(() => {
    const start = (inspectionCurrentPage - 1) * inspectionPageSize;
    return filteredInspectionItems.slice(start, start + inspectionPageSize);
  }, [filteredInspectionItems, inspectionCurrentPage, inspectionPageSize]);

  const inspectionTotalPages = Math.ceil(filteredInspectionItems.length / inspectionPageSize) || 1;

  const fetchMasterWmsMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nexus_jwt') || '';
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
      const [invRes, adjRes, trfRes, stRes, prodRes] = await Promise.all([
        fetch('/api/inventory/balances', { headers: authHeaders }).then(r => r.json()).catch(() => []),
        fetch('/api/stock-adjustments', { headers: authHeaders }).then(r => r.json()).catch(() => []),
        fetch('/api/stock-transfers', { headers: authHeaders }).then(r => r.json()).catch(() => []),
        fetch('/api/stocktakes', { headers: authHeaders }).then(r => r.json()).catch(() => []),
        fetch('/api/products', { headers: authHeaders }).then(r => r.json()).catch(() => []),
      ]);
      
      let phys = 0;
      let resv = 0;
      let totalVal = 0;
      if (Array.isArray(invRes) && invRes.length > 0) {
        phys = invRes.reduce((acc, x) => acc + (Number(x.stockPhysical) || Number(x.quantity) || 0), 0);
        resv = invRes.reduce((acc, x) => acc + (Number(x.stockReserved) || Number(x.reserved) || 0), 0);
        totalVal = invRes.reduce((acc, x) => acc + ((Number(x.stockPhysical) || 0) * (Number(x.costPrice) || 0)), 0);
      }
      
      setStats(prev => ({
        ...prev,
        totalPhysical: phys || 18450,
        totalReserved: resv || 1240,
        totalAvailable: (phys - resv) || 17210,
        inventoryValue: totalVal > 0 ? totalVal : prev.inventoryValue,
        pendingStocktakes: Array.isArray(stRes) ? stRes.filter(s => s.status === 'PENDING' || s.status === 'IN_PROGRESS').length : 3,
        pendingAdjustments: Array.isArray(adjRes) ? adjRes.filter(a => a.status === 'PENDING' || a.status === 'DRAFT').length : 2,
        activeTransfers: Array.isArray(trfRes) ? trfRes.filter(t => t.status === 'IN_TRANSIT' || t.status === 'PENDING').length : 5,
        lowStockCount: Array.isArray(prodRes) ? prodRes.filter((p: any) => (Number(p.stockPhysical) || 0) <= (Number(p.minStock) || 5)).length : 4,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterWmsMetrics();
  }, []);

  // Centralized Navigation Dispatcher using nexus-navigate
  const handleNavigateToModule = (route: string, moduleId: string, actionDesc: string) => {
    window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route, moduleId } }));
    onNotify('info', 'Điều hướng Phân hệ', `Đang mở ${actionDesc} (${moduleId}).`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Confirm Dialog (Rule #19 compliant) */}
      {confirmDialog && confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Header Cockpit Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <Gauge className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                <span>Enterprise Cockpit Dashboard • Master WMS Hub</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded text-[10px] font-mono border border-emerald-200 dark:border-emerald-800">
                  COCKPIT ONLY
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Trung Tâm Điều Hành Kho & Master WMS</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bảng điều khiển giám sát tổng quan chỉ số lấp đầy, cảnh báo an toàn tồn kho và điều phối nghiệp vụ theo chuẩn Single Source of Truth.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="m17-btn-export-excel-header"
              type="button"
              onClick={handleExportWarehouseExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              title="Xuất toàn bộ danh sách kho, chỉ số lấp đầy và danh mục SKU ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => {
                fetchMasterWmsMetrics();
                onNotify('success', 'Đồng bộ Cockpit', 'Đã cập nhật số liệu chỉ số thời gian thực.');
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm Mới Số Liệu</span>
            </button>
          </div>
        </div>

        {/* Primary Operational Metrics Strip (CSS Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Tổng Tồn Vật Lý</div>
            <div className="text-xl font-bold font-mono tabular-nums text-right text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.totalPhysical.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Đang Giữ Chỗ (SO/WO)</div>
            <div className="text-xl font-bold font-mono tabular-nums text-right text-amber-600 dark:text-amber-400 mt-1">
              {stats.totalReserved.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Khả Dụng Xuất Kho</div>
            <div className="text-xl font-bold font-mono tabular-nums text-right text-blue-600 dark:text-blue-400 mt-1">
              {stats.totalAvailable.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Tỷ Lệ Lấp Đầy TB</div>
            <div className="text-xl font-bold font-mono tabular-nums text-right text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.overallFullnessRate}%
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Cảnh Báo An Toàn</div>
            <div className="text-xl font-bold font-mono tabular-nums text-right text-rose-600 dark:text-rose-400 mt-1">
              {stats.lowStockCount} SKU
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Giá Trị Tồn Kho</div>
            <div className="text-lg font-bold font-mono tabular-nums text-right text-purple-600 dark:text-purple-400 mt-1">
              {(stats.inventoryValue / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTION REDIRECTION MATRIX (Nexus-Navigate CTA Grid) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-indigo-900/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/50 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                DISTILL SINGLE SOURCE
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">Trung Tâm Điều Hướng Phân Hệ Chuyên Trách</h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Hub Master đóng vai trò Cockpit quan sát. Nhấp vào các tác vụ chuyên trách dưới đây để chuyển hướng thực thi phiếu nghiệp vụ.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-700">
            Single-Writer Ledger
          </span>
        </div>

        {/* 3 Main Action CTA Cards (M19, M21, M22) in CSS Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* CTA Card: M19 Stocktake */}
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-4 rounded-xl border border-white/10 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  M19 STOCKTAKE
                </span>
                <ClipboardCheck className="w-5 h-5 text-purple-300 group-hover:scale-110 transition" />
              </div>
              <h4 className="text-sm font-bold text-white">Kiểm Kê Kho Định Kỳ & Đột Xuất</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tạo đợt kiểm đếm mù (Blind Count), đối soát phương sai và tổng hợp biên bản chênh lệch tồn.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleNavigateToModule('/stocktake', 'M19', 'Phân hệ M19 Kiểm kê Kho')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Mở Phân hệ M19 Kiểm kê →</span>
              </button>
            </div>
          </div>

          {/* CTA Card: M21 Internal Transfers */}
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-4 rounded-xl border border-white/10 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  M21 INTERNAL TRANSFERS
                </span>
                <ArrowLeftRight className="w-5 h-5 text-blue-300 group-hover:scale-110 transition" />
              </div>
              <h4 className="text-sm font-bold text-white">Lệnh Chuyển Kho & Tái Bố Trí Vị Trí</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Thực hiện luân chuyển hàng hóa giữa các chi nhánh, di chuyển Bin-to-Bin với thẩm quyền ghi đơn vị duy nhất.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleNavigateToModule('/transfer', 'M21', 'Phân hệ M21 Điều chuyển Kho')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Mở Phân hệ M21 Chuyển kho →</span>
              </button>
            </div>
          </div>

          {/* CTA Card: M22 Lots & Batches */}
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-4 rounded-xl border border-white/10 transition-all flex flex-col justify-between group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  M22 LOTS & BATCHES
                </span>
                <Tags className="w-5 h-5 text-emerald-300 group-hover:scale-110 transition" />
              </div>
              <h4 className="text-sm font-bold text-white">Quản Lý Lô, Hạn Dùng & FEFO</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Theo dõi ngày sản xuất, hạn sử dụng, phong tỏa lô kém chất lượng và tuân thủ chiến lược FEFO.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleNavigateToModule('/lots', 'M22', 'Phân hệ M22 Quản lý Lô & Hạn dùng')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Mở Phân hệ M22 Lô & Hạn dùng →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Row (M18, M20, M23, M24) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <button
            onClick={() => handleNavigateToModule('/warehouse', 'M18', 'M18 Cấu trúc Vị trí & Bin')}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left flex items-center justify-between text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold">M18: Sơ Đồ Vị Trí & Bin</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => handleNavigateToModule('/stock-adjustment', 'M20', 'M20 Phiếu Điều Chỉnh Tồn Kho')}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left flex items-center justify-between text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-orange-400" />
              <span className="font-semibold">M20: Điều Chỉnh Tồn Kho</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => handleNavigateToModule('/serials', 'M23', 'M23 Quản lý Serial & IMEI')}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left flex items-center justify-between text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold">M23: Serial & IMEI</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => handleNavigateToModule('/wms-extended', 'M24', 'M24 WMS Extended Wave Pick & LPN')}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left flex items-center justify-between text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <span className="font-semibold">M24: WMS Nâng Cao</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* TOP WORKSPACE TAB NAVIGATION BAR (Tabs Điều Hướng Nghiệp Vụ Kho M17 - M41 Master Spec) */}
      <div 
        id="m17-main-workspace-tabs"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-3 min-w-0"
      >
        {/* Scrollable Tabs Container with No-Scrollbar */}
        <nav 
          aria-label="Phân hệ nghiệp vụ kho"
          className="flex-1 min-w-0 overflow-x-auto no-scrollbar flex items-center gap-1 sm:gap-1.5 py-0.5"
        >
          <button
            id="m17-tab-btn-products"
            type="button"
            onClick={() => setActiveMainTab('PRODUCTS')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeMainTab === 'PRODUCTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4 shrink-0" />
            <span className="shrink-0">Danh Mục Sản Phẩm</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ${
              activeMainTab === 'PRODUCTS' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              Nghiệp Vụ Kho
            </span>
          </button>

          <button
            id="m17-tab-btn-facilities"
            type="button"
            onClick={() => setActiveMainTab('FACILITIES')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeMainTab === 'FACILITIES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Warehouse className="w-4 h-4 shrink-0" />
            <span className="shrink-0">Cơ Sở &amp; Công Suất</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ${
              activeMainTab === 'FACILITIES' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {warehouseFullness.length} Kho
            </span>
          </button>

          <button
            id="m17-tab-btn-inspection"
            type="button"
            onClick={() => setActiveMainTab('INSPECTION')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeMainTab === 'INSPECTION'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span className="shrink-0">Kiểm Định KCS</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ${
              activeMainTab === 'INSPECTION' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {inspectionItems.length}
            </span>
          </button>

          <button
            id="m17-tab-btn-timeline"
            type="button"
            onClick={() => setActiveMainTab('TIMELINE')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeMainTab === 'TIMELINE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span className="shrink-0">Dòng Thời Gian &amp; Truy Vết</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ${
              activeMainTab === 'TIMELINE' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              Audit Trail
            </span>
          </button>
        </nav>

        {/* Right Info Strip - isolated with border and high breakpoint to prevent overlap */}
        <div className="hidden 2xl:flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800">
          <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            WMS Enterprise
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-semibold border border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap">
            Realtime Matrix
          </span>
        </div>
      </div>

      {/* TAB 1: PRODUCT INVENTORY LISTING (Danh Sách Sản Phẩm Trong Kho Với Đầy Đủ Nghiệp Vụ) */}
      {activeMainTab === 'PRODUCTS' && (
        <WarehouseProductsTab
          onNotify={onNotify}
          handleNavigateToModule={handleNavigateToModule}
          onRequestConfirm={setConfirmDialog}
        />
      )}

      {/* TAB 4: SKU TIMELINE & AUDIT TRAIL VIEW (Dòng Thời Gian Lịch Sử Thay Đổi Trạng Thái SKU) */}
      {activeMainTab === 'TIMELINE' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Dòng Thời Gian & Truy Vết Thay Đổi Trạng Thái SKU (Audit Trail Timeline)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Theo dõi chi tiết lịch sử vòng đời, biến động số lượng, KCS kiểm định và thao tác thủ kho theo thời gian thực.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTimelineSearch('');
                  setTimelineActionFilter('ALL');
                  const el = document.getElementById('today-timeline-item');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50/80', 'dark:bg-indigo-950/80');
                    setTimeout(() => {
                      el.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50/80', 'dark:bg-indigo-950/80');
                    }, 2500);
                  }
                  onNotify('info', 'Đã Nhảy Đến Hôm Nay', 'Đã định vị sự kiện dòng thời gian ngày hiện tại (08/09/2026)');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Nhảy Đến Hôm Nay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const ws = XLSX.utils.json_to_sheet(timelineEvents);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "SKU_Timeline_Audit");
                  XLSX.writeFile(wb, "SKU_Audit_Trail_Timeline.xlsx");
                  onNotify('success', 'Xuất Excel Thành Công', 'Đã xuất file lịch sử dòng thời gian SKU ra định dạng .xlsx');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Xuất Báo Cáo Timeline (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Filter Bar for Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 relative z-20 shadow-2xs">
            <div className="relative z-10">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã SKU, tên sản phẩm, số phiếu (PO/SO/KCS)..."
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={timelineActionFilter}
                onChange={(e) => setTimelineActionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ALL">Tất cả loại sự kiện dòng thời gian</option>
                <option value="INBOUND">Nhập kho (Inbound)</option>
                <option value="KCS_INSPECT">Kiểm định KCS</option>
                <option value="RESERVE">Giữ chỗ tồn (Allocation)</option>
                <option value="OUTBOUND">Xuất kho (Outbound)</option>
                <option value="QUARANTINE">Cách ly / Khóa (Quarantine)</option>
                <option value="ADJUST">Kiểm kê / Điều chỉnh</option>
              </select>
            </div>
          </div>

          {/* Vertical Timeline Feed */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {timelineEvents
              .filter(ev => {
                const matchSearch = timelineSearch === '' || 
                  ev.sku.toLowerCase().includes(timelineSearch.toLowerCase()) ||
                  ev.productName.toLowerCase().includes(timelineSearch.toLowerCase()) ||
                  ev.referenceNo.toLowerCase().includes(timelineSearch.toLowerCase()) ||
                  ev.operator.toLowerCase().includes(timelineSearch.toLowerCase());
                const matchFilter = timelineActionFilter === 'ALL' || ev.actionType === timelineActionFilter;
                return matchSearch && matchFilter;
              })
              .map((ev, index) => {
                let badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
                let dotBg = 'bg-indigo-600';
                if (ev.actionType === 'INBOUND') {
                  badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
                  dotBg = 'bg-emerald-600';
                } else if (ev.actionType === 'KCS_INSPECT') {
                  badgeBg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
                  dotBg = 'bg-amber-500';
                } else if (ev.actionType === 'QUARANTINE') {
                  badgeBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
                  dotBg = 'bg-rose-600';
                } else if (ev.actionType === 'OUTBOUND') {
                  badgeBg = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
                  dotBg = 'bg-blue-600';
                }

                return (
                  <div key={ev.id} className="relative group">
                    <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full ${dotBg} ring-4 ring-white dark:ring-slate-900 shadow-xs`} />
                    <div 
                      id={ev.timestamp.startsWith('08/09/2026') && index === 0 ? 'today-timeline-item' : undefined}
                      className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeBg}`}>
                            {ev.actionLabel}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {ev.sku}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {ev.productName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200/80 dark:border-slate-700/80">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{ev.timestamp}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Kho & Vị Trí Bin</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{ev.warehouseName} ({ev.binLocation})</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Biến Động Trạng Thái</span>
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <span className="text-amber-600 dark:text-amber-400">{ev.previousState}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ev.newState}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Người Thực Hiện / Ref</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{ev.operator} <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">[{ev.referenceNo}]</span></span>
                        </div>
                      </div>

                      {ev.notes && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 italic bg-indigo-50/50 dark:bg-indigo-950/30 px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                          💬 Ghi chú kiểm soát: {ev.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: FACILITIES & CAPACITY MATRIX */}
      {activeMainTab === 'FACILITIES' && (
        <div className="space-y-6">
          {/* DASHBOARD SECTION 1: INVENTORY FULLNESS & WAREHOUSE CAPACITY (CSS Grid Layout) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Chỉ Số Tỷ Lệ Lấp Đầy & Công Suất Kho (Inventory Fullness Index)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Theo dõi tải trọng thể tích, số slot pallet đã chiếm dụng và ngưỡng cảnh báo quá tải tại từng cơ sở kho.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  id="m17-btn-export-excel-section1"
                  type="button"
                  onClick={handleExportWarehouseExcel}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Xuất danh sách cơ sở kho đã lọc và danh mục SKU ra file Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Xuất Excel (.xlsx)</span>
                </button>
                <span className="text-xs font-mono text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 font-semibold">
                  Hiển thị: {filteredWarehouses.length}/{warehouseFullness.length} Cơ Sở
                </span>
              </div>
            </div>

        {/* QUICK FILTER BAR (Thanh Bộ Lọc Nhanh theo SKU, Tên Hàng, Trạng Thái & Loại Kho) */}
        <div 
          id="m17-warehouse-quick-filter-bar"
          className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/90 dark:border-slate-700/80 space-y-3.5 shadow-2xs relative z-20"
        >
          {/* Top Row: Status Segmented Controls + Target Selector + Search Box + Reset */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10">
            {/* Status Filter Segmented Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-indigo-500" />
                <span>Trạng thái:</span>
              </span>

              {/* All */}
              <button
                id="m17-filter-status-all"
                type="button"
                onClick={() => setWarehouseStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  warehouseStatusFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>Tất cả</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  warehouseStatusFilter === 'ALL' ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {statusCounts.all}
                </span>
              </button>

              {/* PROCESSING (Đang xử lý) */}
              <button
                id="m17-filter-status-processing"
                type="button"
                onClick={() => setWarehouseStatusFilter('PROCESSING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  warehouseStatusFilter === 'PROCESSING'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Đang xử lý</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  warehouseStatusFilter === 'PROCESSING' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {statusCounts.processing}
                </span>
              </button>

              {/* INSPECTING (Chờ kiểm định) */}
              <button
                id="m17-filter-status-inspecting"
                type="button"
                onClick={() => setWarehouseStatusFilter('INSPECTING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  warehouseStatusFilter === 'INSPECTING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>Chờ kiểm định</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  warehouseStatusFilter === 'INSPECTING' ? 'bg-amber-700 text-white' : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                }`}>
                  {statusCounts.inspecting}
                </span>
              </button>

              {/* CLOSED (Đã đóng) */}
              <button
                id="m17-filter-status-closed"
                type="button"
                onClick={() => setWarehouseStatusFilter('CLOSED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  warehouseStatusFilter === 'CLOSED'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <AlertOctagon className="w-3 h-3 text-slate-400" />
                <span>Đã đóng</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  warehouseStatusFilter === 'CLOSED' ? 'bg-slate-800 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  {statusCounts.closed}
                </span>
              </button>
            </div>

            {/* Target Selector, Warehouse Type & SKU / Item Search Box */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Scope Target */}
              <div className="relative">
                <select
                  id="m17-search-scope-select"
                  value={searchTargetType}
                  onChange={(e) => setSearchTargetType(e.target.value as any)}
                  className="h-8.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 pr-6 font-medium shadow-2xs cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  title="Chọn phạm vi tìm kiếm"
                >
                  <option value="ALL">Tất cả mục tiêu</option>
                  <option value="SKU">Chỉ Mã SKU</option>
                  <option value="NAME">Chỉ Tên hàng</option>
                  <option value="WAREHOUSE">Chỉ Tên/Mã kho</option>
                </select>
              </div>

              {/* Warehouse Type Filter Select */}
              <div className="relative">
                <select
                  id="m17-filter-warehouse-type"
                  value={warehouseTypeFilter}
                  onChange={(e) => setWarehouseTypeFilter(e.target.value)}
                  className="h-8.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 pr-7 font-medium shadow-2xs cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả Loại kho</option>
                  {uniqueWarehouseTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Enhanced SKU / Item Name / Warehouse Search Box */}
              <div className="relative min-w-[220px] sm:min-w-[260px] flex-1">
                <Search className="w-3.5 h-3.5 text-indigo-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="m17-search-warehouse-input"
                  type="text"
                  placeholder="Tìm Mã SKU, Tên hàng, Mã kho..."
                  value={warehouseSearchKeyword}
                  onChange={(e) => setWarehouseSearchKeyword(e.target.value)}
                  className="h-8.5 w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs pl-8 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs placeholder:text-slate-400 font-medium"
                />
                {warehouseSearchKeyword && (
                  <button
                    type="button"
                    onClick={() => setWarehouseSearchKeyword('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                    title="Xóa từ khóa"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Clear Filter Button */}
              {(warehouseStatusFilter !== 'ALL' || warehouseTypeFilter !== 'ALL' || warehouseSearchKeyword.trim() !== '' || searchTargetType !== 'ALL') && (
                <button
                  id="m17-btn-reset-warehouse-filters"
                  type="button"
                  onClick={() => {
                    setWarehouseStatusFilter('ALL');
                    setWarehouseTypeFilter('ALL');
                    setWarehouseSearchKeyword('');
                    setSearchTargetType('ALL');
                  }}
                  className="h-8.5 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Xóa toàn bộ bộ lọc"
                >
                  Xóa lọc
                </button>
              )}

              {/* Quick Export Excel Button */}
              <button
                id="m17-btn-quick-export-excel"
                type="button"
                onClick={handleExportWarehouseExcel}
                className="h-8.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 whitespace-nowrap"
                title="Xuất danh sách kho & tồn SKU ra file Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Quick SKU Suggestion Chips for Fast Query */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Boxes className="w-3.5 h-3.5 text-indigo-500" />
              <span>SKU Phổ Biến:</span>
            </span>

            {[
              { sku: 'SKU-MED-004', label: 'Paracetamol 500mg' },
              { sku: 'SKU-MCH-102', label: 'Vòng bi SKF' },
              { sku: 'SKU-RAW-112', label: 'Polymer Tech' },
              { sku: 'SKU-CHM-088', label: 'Dung môi Isopropanol' },
              { sku: 'SKU-MED-001', label: 'Ampicillin 500mg' },
              { sku: 'SKU-PKG-009', label: 'Màng PE' },
              { sku: 'SKU-RAW-304', label: 'Hạt nhựa PP' },
              { sku: 'SKU-ELC-001', label: 'PLC Siemens' },
            ].map((chip) => {
              const isSelected = warehouseSearchKeyword.toLowerCase() === chip.sku.toLowerCase() || warehouseSearchKeyword.toLowerCase() === chip.label.toLowerCase();
              return (
                <button
                  key={chip.sku}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setWarehouseSearchKeyword('');
                    } else {
                      setWarehouseSearchKeyword(chip.sku);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600'
                  }`}
                  title={`Tìm kiếm nhanh SKU ${chip.sku} - ${chip.label}`}
                >
                  <span className="font-mono font-bold text-[10px]">{chip.sku}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({chip.label})</span>
                </button>
              );
            })}
          </div>

          {/* Instant SKU / Item Query Result Panel (Hiển thị khi tìm thấy SKU / Tên Hàng) */}
          {matchingSkuResults.length > 0 && (
            <div className="bg-indigo-50/80 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-indigo-600 text-white rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Tìm thấy {matchingSkuResults.length} mặt hàng SKU phù hợp trên hệ thống Master WMS:
                  </span>
                </div>
                <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-semibold">
                  Tồn kho phân bổ thời gian thực
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {matchingSkuResults.map(res => (
                  <div 
                    key={res.sku}
                    className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/60 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          {res.sku}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{res.name}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white shrink-0">
                        Tổng: {res.totalQty.toLocaleString()} {res.unit}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-[10px] text-slate-400 font-medium">Lưu tại:</span>
                      {res.warehouses.map(w => (
                        <span 
                          key={w.whId}
                          className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-[10px] border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                        >
                          <strong className="text-slate-900 dark:text-white">{w.whId}:</strong>
                          <span>{w.qty.toLocaleString()} {res.unit}</span>
                          <span className="text-indigo-600 dark:text-indigo-400">({w.bin})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filtered Warehouse Capacity Cards in CSS Grid */}
        {filteredWarehouses.length === 0 ? (
          <div className="py-10 px-4 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <Warehouse className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Không tìm thấy cơ sở kho hoặc mặt hàng phù hợp</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Không có cơ sở kho nào khớp với từ khóa &quot;{warehouseSearchKeyword}&quot; hoặc trạng thái đã chọn. Hãy thử điều chỉnh hoặc xóa bộ lọc.
            </p>
            <button
              onClick={() => {
                setWarehouseStatusFilter('ALL');
                setWarehouseTypeFilter('ALL');
                setWarehouseSearchKeyword('');
                setSearchTargetType('ALL');
              }}
              className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Xem Tất Cả Cơ Sở Kho</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredWarehouses.map((wh) => {
              const isClosed = wh.operationalStatus === 'CLOSED';
              const isInspecting = wh.operationalStatus === 'INSPECTING';

              // Matching items in this specific warehouse
              const matchedWarehouseItems = warehouseSearchKeyword.trim()
                ? wh.storedItems.filter(i => 
                    i.sku.toLowerCase().includes(warehouseSearchKeyword.toLowerCase()) || 
                    i.name.toLowerCase().includes(warehouseSearchKeyword.toLowerCase())
                  )
                : [];
              
              return (
                <div 
                  key={wh.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isClosed
                      ? 'bg-slate-100/70 dark:bg-slate-800/30 border-slate-300/80 dark:border-slate-700 opacity-75'
                      : wh.status === 'HIGH_ALERT'
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-2xs'
                      : isInspecting
                      ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-2xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
                  }`}
                >
                  <div>
                    {/* Top Row: ID + Operational Status Badge + Fullness Badge */}
                    <div className="flex items-center justify-between mb-2 gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                        {wh.id}
                      </span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Operational Status Badge with high-contrast color scheme & icons */}
                        {wh.operationalStatus === 'PROCESSING' && (
                          <span 
                            id={`badge-status-processing-${wh.id}`}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 shadow-2xs"
                            title="Kho đang vận hành và xử lý đơn hàng xuất/nhập"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse mr-1 shrink-0" />
                            <span>Đang xử lý</span>
                          </span>
                        )}

                        {wh.operationalStatus === 'INSPECTING' && (
                          <span 
                            id={`badge-status-inspecting-${wh.id}`}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 shadow-2xs"
                            title="Khu vực đang trong đợt kiểm định chất lượng hoặc kiểm kê đối soát"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 mr-1 shrink-0" />
                            <span>Chờ kiểm định</span>
                          </span>
                        )}

                        {wh.operationalStatus === 'CLOSED' && (
                          <span 
                            id={`badge-status-closed-${wh.id}`}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-2xs"
                            title="Kho đang tạm đóng hoặc bảo trì kỹ thuật"
                          >
                            <AlertOctagon className="w-3 h-3 text-slate-500 dark:text-slate-400 mr-1 shrink-0" />
                            <span>Đã đóng</span>
                          </span>
                        )}

                        {/* Fullness Rate */}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isClosed
                            ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                            : wh.status === 'HIGH_ALERT'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        }`}>
                          {wh.fullnessRate}%
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1" title={wh.name}>
                      {wh.name}
                    </h4>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{wh.type}</span>
                      <span className="text-[10px] text-slate-400 font-mono truncate ml-1">{wh.temperature}</span>
                    </div>

                    {/* Matching Stored SKU Highlight inside Warehouse Card */}
                    {matchedWarehouseItems.length > 0 && (
                      <div className="mb-2.5 p-1.5 bg-indigo-50/90 dark:bg-indigo-950/60 rounded-lg border border-indigo-200 dark:border-indigo-800/80 space-y-1">
                        <div className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                          <span>Mặt hàng khớp tìm kiếm:</span>
                        </div>
                        {matchedWarehouseItems.map(item => (
                          <div key={item.sku} className="text-[10px] font-mono flex items-center justify-between text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.sku}</span>
                            <span>{item.quantity.toLocaleString()} {item.unit} ({item.bin})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Warehouse Operational Status Action */}
                    <div className="mb-2.5 flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-slate-400 font-medium">Đổi trạng thái:</span>
                      <div className="flex items-center gap-1">
                        {wh.operationalStatus !== 'PROCESSING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateWarehouseStatus(wh.id, 'PROCESSING')}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-all"
                            title="Chuyển sang Đang xử lý"
                          >
                            Xử lý
                          </button>
                        )}
                        {wh.operationalStatus !== 'INSPECTING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateWarehouseStatus(wh.id, 'INSPECTING')}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 cursor-pointer transition-all"
                            title="Chuyển sang Chờ kiểm định"
                          >
                            Kiểm định
                          </button>
                        )}
                        {wh.operationalStatus !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateWarehouseStatus(wh.id, 'CLOSED')}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer transition-all"
                            title="Chuyển sang Đã đóng (Tự động gửi thông báo Toast nếu từ Chờ kiểm định)"
                          >
                            Đóng kho
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar & Footer Details */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isClosed
                            ? 'bg-slate-400'
                            : wh.fullnessRate >= 90 
                            ? 'bg-rose-500' 
                            : wh.fullnessRate >= 75 
                            ? 'bg-indigo-600' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${wh.fullnessRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>{isClosed ? 'Đang tạm dừng' : 'Slot Đã Dùng:'}</span>
                      <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300">
                        {isClosed ? '0 / ' + wh.totalSlots.toLocaleString() : `${wh.occupiedSlots.toLocaleString()} / ${wh.totalSlots.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DASHBOARD SECTION 2: SAFETY ALERTS & EXPIRING LOTS (CSS Grid Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Safety Stock Alerts (Cảnh báo tồn tối thiểu) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Cảnh Báo Tồn Kho An Toàn (Safety Stock Alerts)
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded text-[11px] font-mono font-bold border border-rose-200 dark:border-rose-900">
                {safetyAlerts.length} SKU Chạm Đáy
              </span>
            </div>

            <div className="space-y-2.5">
              {safetyAlerts.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/70 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                        {item.sku}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{item.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{item.warehouse}</span>
                      <span>•</span>
                      <span>Tồn hiện tại: <strong className="font-mono tabular-nums text-rose-600">{item.currentStock}</strong></span>
                      <span>/ Min: <span className="font-mono tabular-nums">{item.minSafetyStock}</span></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNavigateToModule(item.targetRoute, item.targetModule, `Xử lý điều chuyển SKU ${item.sku}`)}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border border-indigo-200/60 dark:border-indigo-800/60 cursor-pointer self-end sm:self-center"
                  >
                    Chuyển Kho →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Quy tắc bổ sung hàng:</span>
            <button
              onClick={() => handleNavigateToModule('/transfer', 'M21', 'Tạo lệnh chuyển kho bù hàng')}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Lập lệnh điều chuyển bù tồn tại M21</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Expiring Lots & Quarantine Monitor (Cảnh báo hạn dùng M22) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Kiểm Soát Lô Cận Date & Cách Ly (FEFO Monitor)
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded text-[11px] font-mono font-bold border border-amber-200 dark:border-amber-900">
                {expiringAlerts.length} Lô Cần Chú Ý
              </span>
            </div>

            <div className="space-y-2.5">
              {expiringAlerts.map((lot, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/70 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                        {lot.lotNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{lot.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>SL: <strong className="font-mono tabular-nums text-slate-700 dark:text-slate-300">{lot.quantity.toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>HSD: <strong className="font-mono">{lot.expiryDate}</strong></span>
                      <span>•</span>
                      <span className={lot.daysRemaining <= 30 ? 'text-rose-600 font-bold' : 'text-amber-600 font-semibold'}>
                        (Còn {lot.daysRemaining} ngày)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNavigateToModule('/lots', 'M22', `Xem chi tiết Lô ${lot.lotNumber}`)}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border border-amber-200/60 dark:border-amber-800/60 cursor-pointer self-end sm:self-center"
                  >
                    Xem Chi Tiết M22 →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Nguyên tắc xuất kho:</span>
            <button
              onClick={() => handleNavigateToModule('/lots', 'M22', 'Xem Báo Cáo FEFO tại Phân hệ M22')}
              className="text-amber-700 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem toàn bộ ma trận FEFO tại M22</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* TAB 3: DASHBOARD SECTION 3: INVENTORY ITEMS INSPECTION & QUARANTINE STATUS CONTROL */}
      {activeMainTab === 'INSPECTION' && (
      <div 
        id="m17-inspection-status-desk"
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Theo Dõi & Đóng Kiểm Định Mặt Hàng Kho (Inspection & Status Control)
              </h3>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded text-[10px] font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                AUTO TOAST NOTIFICATION
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý quy trình chuyển trạng thái kiểm định. Hệ thống tự động gửi cảnh báo Toast tức thì khi mặt hàng chuyển từ <strong>&quot;Chờ kiểm định&quot;</strong> sang <strong>&quot;Đã đóng&quot;</strong>.
            </p>
          </div>

          {/* Quick Simulation / Action Button */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              id="btn-simulate-inspect-to-closed"
              type="button"
              onClick={() => {
                const firstInspecting = inspectionItems.find(i => i.operationalStatus === 'INSPECTING');
                if (firstInspecting) {
                  handleUpdateItemStatus(firstInspecting.id, 'CLOSED');
                } else {
                  // If none is inspecting, reset the first one to inspecting then offer to close
                  setInspectionItems(prev => prev.map((item, idx) => idx === 0 ? { ...item, operationalStatus: 'INSPECTING' } : item));
                  onNotify('info', 'Khôi phục kiểm định', 'Đã chuyển mặt hàng đầu tiên sang "Chờ kiểm định". Bấm lại để kiểm tra thông báo Đã đóng.');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Mô phỏng quy trình kiểm định hoàn tất và gửi thông báo Toast tự động"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Mô Phỏng Đóng Kiểm Định → Toast</span>
            </button>
          </div>
        </div>

        {/* Filter Controls for Inspection Table */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 relative z-20">
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-500" />
              <span>Lọc:</span>
            </span>

            <button
              type="button"
              onClick={() => setItemStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                itemStatusFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Tất cả ({inspectionItems.length})
            </button>

            <button
              type="button"
              onClick={() => setItemStatusFilter('PROCESSING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                itemStatusFilter === 'PROCESSING'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đang xử lý ({inspectionItems.filter(i => i.operationalStatus === 'PROCESSING').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setItemStatusFilter('INSPECTING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                itemStatusFilter === 'INSPECTING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Chờ kiểm định ({inspectionItems.filter(i => i.operationalStatus === 'INSPECTING').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setItemStatusFilter('CLOSED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                itemStatusFilter === 'CLOSED'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertOctagon className="w-3 h-3 text-slate-400" />
              <span>Đã đóng ({inspectionItems.filter(i => i.operationalStatus === 'CLOSED').length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm SKU, tên hàng, số lô..."
              value={itemSearchText}
              onChange={(e) => setItemSearchText(e.target.value)}
              className="h-8 w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Table of Inspection Items */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-700/80 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3.5 py-2.5">Mã SKU / Tên Mặt Hàng</th>
                <th className="px-3.5 py-2.5">Số Lô & Cơ Sở Kho</th>
                <th className="px-3.5 py-2.5 text-right">Số Lượng</th>
                <th className="px-3.5 py-2.5">Kiểm Định Viên / Ngày</th>
                <th className="px-3.5 py-2.5 text-center">Trạng Thái</th>
                <th className="px-3.5 py-2.5 text-center">Hành Động Chuyển Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {paginatedInspectionItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Không có mặt hàng nào phù hợp với bộ lọc đã chọn.
                  </td>
                </tr>
              ) : (
                paginatedInspectionItems.map((item) => {
                  const isInspecting = item.operationalStatus === 'INSPECTING';
                  const isProcessing = item.operationalStatus === 'PROCESSING';
                  const isClosed = item.operationalStatus === 'CLOSED';

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors ${
                        isClosed ? 'bg-slate-50/30 dark:bg-slate-800/20 opacity-80' : ''
                      }`}
                    >
                      {/* SKU & Name */}
                      <td className="px-3.5 py-2.5">
                        <div className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {item.sku}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 italic line-clamp-1">{item.reason}</div>
                      </td>

                      {/* Lot & Warehouse */}
                      <td className="px-3.5 py-2.5">
                        <div className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {item.batchNo}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.warehouse}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {item.quantity.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                      </td>

                      {/* Inspector */}
                      <td className="px-3.5 py-2.5 text-[11px]">
                        <div className="text-slate-700 dark:text-slate-300">{item.inspector}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.inspectionDate}</div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-3.5 py-2.5 text-center">
                        {isProcessing && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                            <span>Đang xử lý</span>
                          </span>
                        )}
                        {isInspecting && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80">
                            <AlertTriangle className="w-3 h-3 text-amber-600 mr-1" />
                            <span>Chờ kiểm định</span>
                          </span>
                        )}
                        {isClosed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                            <AlertOctagon className="w-3 h-3 text-slate-500 mr-1" />
                            <span>Đã đóng</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isInspecting && (
                            <button
                              type="button"
                              onClick={() => handleUpdateItemStatus(item.id, 'CLOSED')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Đóng kiểm định mặt hàng này (Sẽ kích hoạt cảnh báo Toast tự động)"
                            >
                              <AlertOctagon className="w-3 h-3 text-rose-600" />
                              <span>Đóng Kiểm Định</span>
                            </button>
                          )}

                          {isClosed && (
                            <button
                              type="button"
                              onClick={() => handleUpdateItemStatus(item.id, 'PROCESSING')}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                              title="Mở lại xử lý xuất nhập"
                            >
                              Mở Lại
                            </button>
                          )}

                          {isProcessing && (
                            <button
                              type="button"
                              onClick={() => handleUpdateItemStatus(item.id, 'INSPECTING')}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-medium transition cursor-pointer"
                              title="Chuyển sang kiểm định"
                            >
                              Yêu Cầu KCS
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pinned Pagination for Inspection Tab */}
        <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <PaginationControl
            currentPage={inspectionCurrentPage}
            totalPages={inspectionTotalPages}
            pageSize={inspectionPageSize}
            totalItems={filteredInspectionItems.length}
            startIndex={filteredInspectionItems.length === 0 ? 0 : (inspectionCurrentPage - 1) * inspectionPageSize + 1}
            endIndex={Math.min(inspectionCurrentPage * inspectionPageSize, filteredInspectionItems.length)}
            onPageChange={setInspectionCurrentPage}
            onPageSizeChange={setInspectionPageSize}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>
      )}
    </div>
  );
};
