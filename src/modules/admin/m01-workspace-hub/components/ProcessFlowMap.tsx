import React, { useState, useMemo, useRef, useCallback } from 'react';
import * as Icons from 'lucide-react';
import { MODULE_REGISTRY, ModuleDefinition } from '../../../../config/moduleRegistry';

export type ProcessChainType = 
  | 'ALL' 
  | 'P2P' 
  | 'O2C' 
  | 'POS'
  | 'INVENTORY' 
  | 'MANUFACTURING' 
  | 'RETURNS'
  | 'FINANCE'
  | 'FULL_E2E'
  | 'GOVERNANCE';

export type ViewMode = 'live' | 'paused' | 'simulation';

export type ConnectionType = 'READ' | 'WRITE' | 'EVENT' | 'DEPENDENCY';

export interface ProcessNode {
  id: string; // e.g. 'M08', 'DB'
  name: string;
  category: 'Commercial' | 'Procurement' | 'Inventory' | 'Manufacturing' | 'Finance' | 'Pricing' | 'Costing' | 'Quality' | 'Logistics' | 'System' | 'Database';
  icon: string;
  x: number;
  y: number;
  stage: string;
  route?: string;
  isSingleWriter?: boolean;
  authorityDomain?: string;
}

export interface ProcessEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: ConnectionType;
  apiEndpoint?: string;
  service?: string;
  authorityNote?: string;
  correlationFlow?: string;
}

interface ProcessFlowMapProps {
  chainType: ProcessChainType;
  onChangeChainType: (type: ProcessChainType) => void;
  topologyHealthMap: Map<string, { status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'NO_DATA'; score: number | null; errorCount: number; totalActions?: number }>;
  onSelectNode: (node: ProcessNode, def?: ModuleDefinition) => void;
  onSelectEdge: (edge: ProcessEdge) => void;
  onSelectModule?: (def: ModuleDefinition) => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
}

// Category Color Map according to Design Specifications
export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; ring: string; iconBg: string }> = {
  Commercial: { bg: '#0284c7', border: '#38bdf8', text: '#38bdf8', ring: '#0284c7', iconBg: 'rgba(2, 132, 199, 0.15)' },
  Procurement: { bg: '#ea580c', border: '#fb923c', text: '#fb923c', ring: '#ea580c', iconBg: 'rgba(234, 88, 12, 0.15)' },
  Inventory: { bg: '#2563eb', border: '#60a5fa', text: '#60a5fa', ring: '#2563eb', iconBg: 'rgba(37, 99, 235, 0.15)' },
  Manufacturing: { bg: '#7c3aed', border: '#c084fc', text: '#c084fc', ring: '#7c3aed', iconBg: 'rgba(124, 58, 237, 0.15)' },
  Finance: { bg: '#d97706', border: '#fbbf24', text: '#fbbf24', ring: '#d97706', iconBg: 'rgba(217, 119, 6, 0.15)' },
  Pricing: { bg: '#059669', border: '#34d399', text: '#34d399', ring: '#059669', iconBg: 'rgba(5, 150, 105, 0.15)' },
  Costing: { bg: '#c026d3', border: '#f472b6', text: '#f472b6', ring: '#c026d3', iconBg: 'rgba(192, 38, 211, 0.15)' },
  Quality: { bg: '#0d9488', border: '#2dd4bf', text: '#2dd4bf', ring: '#0d9488', iconBg: 'rgba(13, 148, 136, 0.15)' },
  Logistics: { bg: '#0891b2', border: '#22d3ee', text: '#22d3ee', ring: '#0891b2', iconBg: 'rgba(8, 145, 178, 0.15)' },
  System: { bg: '#4f46e5', border: '#818cf8', text: '#818cf8', ring: '#4f46e5', iconBg: 'rgba(79, 70, 229, 0.15)' },
  Database: { bg: '#0f172a', border: '#10b981', text: '#10b981', ring: '#10b981', iconBg: 'rgba(16, 185, 129, 0.15)' }
};

// Rich presets reflecting complete enterprise pipeline connections
const CHAIN_DEFINITIONS: Record<ProcessChainType, { title: string; subtitle: string; nodes: ProcessNode[]; edges: ProcessEdge[] }> = {
  P2P: {
    title: 'Chuỗi Cung Ứng & Mua Hàng (Procure-to-Pay — P2P)',
    subtitle: 'Nhà cung cấp ➔ RFQ Đấu thầu ➔ PO ➔ Kho vận GRN ➔ Đối soát 3-Way AP ➔ Thanh toán ➔ Sổ cái GL',
    nodes: [
      { id: 'M09', name: 'Nhà Cung Cấp (SRM)', category: 'Procurement', icon: 'Truck', x: 60, y: 150, stage: '1. Định danh NCC', route: '/suppliers' },
      { id: 'M10', name: 'Mua Sắm Chiến Lược (RFQ)', category: 'Procurement', icon: 'Award', x: 200, y: 150, stage: '2. Đấu thầu chào giá', route: '/strategic-sourcing' },
      { id: 'M08', name: 'Đơn Mua Hàng (PO)', category: 'Procurement', icon: 'ShoppingCart', x: 340, y: 150, stage: '3. Phát hành PO', route: '/purchase' },
      { id: 'M17', name: 'Kho Trung Tâm (GRN)', category: 'Inventory', icon: 'PackageCheck', x: 480, y: 150, stage: '4. Nhập kho vật lý', route: '/inventory', isSingleWriter: true, authorityDomain: 'Inventory Authority' },
      { id: 'M39', name: 'Kiểm Tra QC', category: 'Quality', icon: 'CheckCircle2', x: 480, y: 50, stage: 'Giám định chất lượng', route: '/quality-control' },
      { id: 'M31', name: 'Hóa Đơn Phải Trả (AP)', category: 'Finance', icon: 'Receipt', x: 640, y: 150, stage: '5. 3-Way Matching', route: '/invoices' },
      { id: 'M32', name: 'Thanh Toán Ngân Quỹ', category: 'Finance', icon: 'CreditCard', x: 780, y: 150, stage: '6. Lệnh chi quỹ', route: '/treasury' },
      { id: 'M30', name: 'Sổ Cái Kế Toán (GL)', category: 'Finance', icon: 'Landmark', x: 920, y: 150, stage: '7. Bút toán Nợ/Có', route: '/gl', isSingleWriter: true, authorityDomain: 'Accounting Authority' },
      { id: 'DB', name: 'LibSQL Ledger', category: 'Database', icon: 'Database', x: 700, y: 260, stage: 'Persisted Ledger' },
    ],
    edges: [
      { id: 'e-p2p-1', source: 'M09', target: 'M10', label: 'Hồ sơ năng lực', type: 'READ', apiEndpoint: '/api/suppliers/profiles' },
      { id: 'e-p2p-2', source: 'M10', target: 'M08', label: 'Báo giá trúng thầu', type: 'WRITE', apiEndpoint: '/api/purchases/rfq-award' },
      { id: 'e-p2p-3', source: 'M08', target: 'M17', label: 'Chỉ thị nhập kho (GRN)', type: 'WRITE', apiEndpoint: '/api/inventory/grn', service: 'InventoryService.postTransaction()', authorityNote: 'M17 là single writer cho tồn kho khi nhập hàng' },
      { id: 'e-p2p-qc', source: 'M17', target: 'M39', label: 'Biên bản lấy mẫu', type: 'EVENT', apiEndpoint: '/api/quality/inspections' },
      { id: 'e-p2p-qc-ret', source: 'M39', target: 'M17', label: 'Chứng nhận đạt chuẩn', type: 'WRITE', apiEndpoint: '/api/quality/release' },
      { id: 'e-p2p-4', source: 'M17', target: 'M31', label: 'Biên bản nhận hàng', type: 'READ', apiEndpoint: '/api/invoices/ap/match', authorityNote: 'Đối soát 3-Way Match giữa PO-GRN-Invoice' },
      { id: 'e-p2p-5', source: 'M31', target: 'M32', label: 'Lệnh thanh toán AP', type: 'WRITE', apiEndpoint: '/api/treasury/payment-orders' },
      { id: 'e-p2p-6', source: 'M32', target: 'M30', label: 'Bút toán chi tiền', type: 'WRITE', apiEndpoint: '/api/finance/journal', service: 'AccountingService.postJournal()', authorityNote: 'M30 là single writer cho kế toán' },
      { id: 'e-p2p-db1', source: 'M17', target: 'DB', label: 'Ghi stock_balances', type: 'WRITE' },
      { id: 'e-p2p-db2', source: 'M30', target: 'DB', label: 'Ghi accounting_entries', type: 'WRITE' },
    ]
  },

  O2C: {
    title: 'Chuỗi Bán Hàng & Phân Phối (Order-to-Cash — O2C)',
    subtitle: 'Khách hàng ➔ Động cơ giá ➔ Báo giá CRM ➔ SO ➔ Giữ chỗ tồn kho ➔ TMS Giao nhận ➔ Hóa đơn GTGT ➔ Sổ cái GL',
    nodes: [
      { id: 'M07', name: 'Master Data Khách Hàng', category: 'Commercial', icon: 'Users', x: 50, y: 150, stage: '1. Khách hàng & Hạn mức', route: '/master-data' },
      { id: 'M41', name: 'Động Cơ Giá (Pricing)', category: 'Pricing', icon: 'Calculator', x: 190, y: 150, stage: '2. Bảng giá & Chiết khấu', route: '/pricing', isSingleWriter: true, authorityDomain: 'Pricing Authority' },
      { id: 'M12', name: 'CRM & Báo Giá', category: 'Commercial', icon: 'FileSpreadsheet', x: 330, y: 150, stage: '3. Cơ hội & Báo giá', route: '/crm' },
      { id: 'M13', name: 'Đơn Bán Hàng (SO)', category: 'Commercial', icon: 'FileText', x: 470, y: 150, stage: '4. Tiếp nhận đơn hàng', route: '/sales' },
      { id: 'M17', name: 'Giữ Chỗ Tồn Kho (ATP)', category: 'Inventory', icon: 'Package', x: 610, y: 150, stage: '5. Khóa số lượng ATP', route: '/inventory', isSingleWriter: true, authorityDomain: 'Inventory Authority' },
      { id: 'M36', name: 'Giao Vận & Đội Xe (TMS)', category: 'Logistics', icon: 'Truck', x: 750, y: 150, stage: '6. Lập tải & POD', route: '/logistics' },
      { id: 'M31', name: 'Hóa Đơn GTGT (AR)', category: 'Finance', icon: 'Receipt', x: 890, y: 150, stage: '7. Ký số & Thu nợ', route: '/invoices' },
      { id: 'M30', name: 'Sổ Cái Doanh Thu (GL)', category: 'Finance', icon: 'Landmark', x: 890, y: 260, stage: '8. Hạch toán doanh thu', route: '/gl', isSingleWriter: true, authorityDomain: 'Accounting Authority' },
      { id: 'DB', name: 'LibSQL Ledger', category: 'Database', icon: 'Database', x: 540, y: 260, stage: 'Persisted Ledger' },
    ],
    edges: [
      { id: 'e-o2c-1', source: 'M07', target: 'M41', label: 'Nhóm giá đối tác', type: 'READ', apiEndpoint: '/api/master-data/customers' },
      { id: 'e-o2c-2', source: 'M41', target: 'M12', label: 'Snapshot giá niêm yết', type: 'READ', apiEndpoint: '/api/pricing/resolve', authorityNote: 'M41 giải quyết chiết khấu bậc thang' },
      { id: 'e-o2c-3', source: 'M12', target: 'M13', label: 'Chuyển đổi thành SO', type: 'WRITE', apiEndpoint: '/api/sales/orders/create' },
      { id: 'e-o2c-4', source: 'M13', target: 'M17', label: 'Yêu cầu giữ chỗ (ATP)', type: 'WRITE', apiEndpoint: '/api/inventory/reserve', service: 'InventoryService.postTransaction()', authorityNote: 'M17 trừ allocated_quantity' },
      { id: 'e-o2c-5', source: 'M17', target: 'M36', label: 'Lệnh điều phối xe', type: 'EVENT', apiEndpoint: '/api/logistics/dispatch' },
      { id: 'e-o2c-6', source: 'M36', target: 'M31', label: 'Xác nhận giao POD', type: 'WRITE', apiEndpoint: '/api/invoices/issue' },
      { id: 'e-o2c-7', source: 'M31', target: 'M30', label: 'Bút toán doanh thu AR', type: 'WRITE', apiEndpoint: '/api/finance/journal', service: 'AccountingService.postJournal()' },
      { id: 'e-o2c-db1', source: 'M17', target: 'DB', label: 'stock_ledger', type: 'WRITE' },
      { id: 'e-o2c-db2', source: 'M30', target: 'DB', label: 'journal_entries', type: 'WRITE' },
    ]
  },

  POS: {
    title: 'Bán Lẻ Tại Quầy & Ca Bán Hàng (POS & Retail)',
    subtitle: 'Master Data SKU ➔ Giá M41 ➔ Thu ngân POS M16 ➔ Giảm tồn kho tức thời M17 ➔ Thanh toán M32 ➔ Hạch toán M30',
    nodes: [
      { id: 'M07', name: 'Master Data SKU', category: 'Commercial', icon: 'Barcode', x: 80, y: 150, stage: 'Mã vạch & Danh mục', route: '/master-data' },
      { id: 'M41', name: 'Chính Sách Giá & KM', category: 'Pricing', icon: 'Tag', x: 260, y: 150, stage: 'Khuyến mãi tức thì', route: '/pricing', isSingleWriter: true, authorityDomain: 'Pricing Authority' },
      { id: 'M16', name: 'Quầy Thu Ngân (POS)', category: 'Commercial', icon: 'Store', x: 440, y: 150, stage: 'Mở ca & Quét mã', route: '/pos' },
      { id: 'M17', name: 'Xuất Kho Bán Lẻ', category: 'Inventory', icon: 'Boxes', x: 620, y: 150, stage: 'Giảm tồn kho tức thì', route: '/inventory', isSingleWriter: true, authorityDomain: 'Inventory Authority' },
      { id: 'M32', name: 'Thu Ngân Quỹ & VietQR', category: 'Finance', icon: 'QrCode', x: 800, y: 150, stage: 'Tiền mặt & QR code', route: '/treasury' },
      { id: 'M30', name: 'Hạch Toán Doanh Thu Ca', category: 'Finance', icon: 'Landmark', x: 800, y: 260, stage: 'Kết ca ghi sổ', route: '/gl', isSingleWriter: true, authorityDomain: 'Accounting Authority' },
      { id: 'DB', name: 'LibSQL Ledger', category: 'Database', icon: 'Database', x: 440, y: 260, stage: 'Persisted Ledger' },
    ],
    edges: [
      { id: 'e-pos-1', source: 'M07', target: 'M16', label: 'Quét Barcode SKU', type: 'READ', apiEndpoint: '/api/pos/barcode' },
      { id: 'e-pos-2', source: 'M41', target: 'M16', label: 'Áp chương trình KM', type: 'READ', apiEndpoint: '/api/pricing/promotions' },
      { id: 'e-pos-3', source: 'M16', target: 'M17', label: 'postTransaction() xuất', type: 'WRITE', apiEndpoint: '/api/inventory/pos-deduct', service: 'InventoryService.postTransaction()', authorityNote: 'M17 trừ tồn kho ngay tại quầy' },
      { id: 'e-pos-4', source: 'M16', target: 'M32', label: 'Tạo QR thanh toán', type: 'WRITE', apiEndpoint: '/api/treasury/pos-payment' },
      { id: 'e-pos-5', source: 'M32', target: 'M30', label: 'Kết ca ghi sổ Nợ/Có', type: 'WRITE', apiEndpoint: '/api/finance/shift-close' },
      { id: 'e-pos-db', source: 'M17', target: 'DB', label: 'Ghi stock_balances', type: 'WRITE' },
    ]
  },

  INVENTORY: {
    title: 'Hệ Sinh Thái Kho Vận Đơn Nhất (WMS & Stock Control)',
    subtitle: 'M17 là Single Writer duy nhất cho tồn kho. M18, M19, M20, M21, M22, M23, M24 đều ủy quyền qua M17',
    nodes: [
      { id: 'M17', name: 'Lõi Tồn Kho (Core WMS)', category: 'Inventory', icon: 'Layers', x: 100, y: 100, stage: 'Single Writer Tồn Kho', route: '/inventory', isSingleWriter: true, authorityDomain: 'Inventory Authority' },
      { id: 'M18', name: 'Vị Trí & Không Gian Kho', category: 'Inventory', icon: 'Grid', x: 320, y: 60, stage: 'Bin/Location Slotting', route: '/warehouse' },
      { id: 'M19', name: 'Kiểm Kê Kho Định Kỳ', category: 'Inventory', icon: 'ClipboardList', x: 540, y: 60, stage: 'Phiên kiểm đếm', route: '/stocktake' },
      { id: 'M20', name: 'Điều Chỉnh Tồn Kho', category: 'Inventory', icon: 'Sliders', x: 760, y: 60, stage: 'Xử lý chênh lệch', route: '/adjustment' },
      { id: 'M21', name: 'Điều Chuyển Nội Bộ', category: 'Inventory', icon: 'ArrowLeftRight', x: 320, y: 200, stage: 'Luân chuyển chi nhánh', route: '/transfers' },
      { id: 'M22', name: 'Lô Hàng & Hạn Dùng FEFO', category: 'Inventory', icon: 'Calendar', x: 540, y: 200, stage: 'Kiểm soát hạn dùng', route: '/lots' },
      { id: 'M23', name: 'Serials & IMEI Điện Tử', category: 'Inventory', icon: 'QrCode', x: 760, y: 200, stage: 'Truy vết mã thiết bị', route: '/serials' },
      { id: 'M30', name: 'Sổ Cái Chênh Lệch (GL)', category: 'Finance', icon: 'Landmark', x: 920, y: 130, stage: 'Hạch toán hao hụt', route: '/gl', isSingleWriter: true, authorityDomain: 'Accounting Authority' },
      { id: 'DB', name: 'LibSQL Storage', category: 'Database', icon: 'Database', x: 100, y: 260, stage: 'Persisted stock_ledger' },
    ],
    edges: [
      { id: 'e-inv-1', source: 'M17', target: 'M18', label: 'Bản đồ vị trí Bin', type: 'READ', apiEndpoint: '/api/warehouse/locations' },
      { id: 'e-inv-2', source: 'M18', target: 'M19', label: 'Snapshot số đếm', type: 'READ', apiEndpoint: '/api/stocktake/snapshot' },
      { id: 'e-inv-3', source: 'M19', target: 'M20', label: 'Chênh lệch thừa/thiếu', type: 'WRITE', apiEndpoint: '/api/adjustment/from-stocktake' },
      { id: 'e-inv-4', source: 'M20', target: 'M17', label: 'postTransaction() bù trừ', type: 'WRITE', apiEndpoint: '/api/inventory/adjust', service: 'InventoryService.postTransaction()', authorityNote: 'M20 ủy quyền hoàn toàn cho M17 ghi tồn' },
      { id: 'e-inv-5', source: 'M17', target: 'M21', label: 'Xuất kho điều chuyển', type: 'EVENT', apiEndpoint: '/api/transfers/dispatch' },
      { id: 'e-inv-6', source: 'M17', target: 'M22', label: 'Xuất FEFO lô cũ trước', type: 'READ', apiEndpoint: '/api/lots/fefo' },
      { id: 'e-inv-7', source: 'M17', target: 'M23', label: 'Khóa Serial xuất kho', type: 'WRITE', apiEndpoint: '/api/serials/lock' },
      { id: 'e-inv-8', source: 'M20', target: 'M30', label: 'Bút toán chênh lệch kho', type: 'WRITE', apiEndpoint: '/api/finance/journal', service: 'AccountingService.postJournal()' },
      { id: 'e-inv-db', source: 'M17', target: 'DB', label: 'Cập nhật stock_balances', type: 'WRITE' },
    ]
  },

  MANUFACTURING: {
    title: 'Sản Xuất, BOM & Phân Bổ Giá Thành (MES & Costing)',
    subtitle: 'Công thức R&D M06 ➔ BOM/WO M25 ➔ MRP M26 ➔ QC M39 ➔ Nhập kho M17 ➔ Phân bổ giá thành M42 ➔ Sổ cái M30',
    nodes: [
      { id: 'M06', name: 'R&D & Nghiên Cứu', category: 'Manufacturing', icon: 'FlaskConical', x: 60, y: 150, stage: '1. Công thức thử nghiệm', route: '/innovation-rd' },
      { id: 'M25', name: 'Định Mức BOM & Lệnh SX', category: 'Manufacturing', icon: 'Factory', x: 220, y: 150, stage: '2. Lệnh sản xuất (WO)', route: '/manufacturing' },
      { id: 'M26', name: 'Cân Đối Nhu Cầu (MRP)', category: 'Manufacturing', icon: 'Network', x: 380, y: 150, stage: '3. Nhu cầu nguyên vật liệu', route: '/supply-chain' },
      { id: 'M39', name: 'Kiểm Soát Chất Lượng', category: 'Quality', icon: 'CheckCircle2', x: 540, y: 150, stage: '4. Giám định KCS', route: '/quality-control' },
      { id: 'M17', name: 'Nhập Kho Thành Phẩm', category: 'Inventory', icon: 'PackageCheck', x: 700, y: 150, stage: '5. postTransaction() nhập', route: '/inventory', isSingleWriter: true, authorityDomain: 'Inventory Authority' },
      { id: 'M42', name: 'Động Cơ Giá Thành (COGS)', category: 'Costing', icon: 'Coins', x: 860, y: 150, stage: '6. Phân bổ chi phí đích danh', route: '/cost-allocation', isSingleWriter: true, authorityDomain: 'Costing Authority' },
      { id: 'M30', name: 'Sổ Cái Giá Thành (GL)', category: 'Finance', icon: 'Landmark', x: 860, y: 260, stage: '7. Kết chuyển TK 154/632', route: '/gl', isSingleWriter: true, authorityDomain: 'Accounting Authority' },
      { id: 'DB', name: 'LibSQL Storage', category: 'Database', icon: 'Database', x: 540, y: 260, stage: 'Persisted cost_layers' },
    ],
    edges: [
      { id: 'e-mfg-1', source: 'M06', target: 'M25', label: 'Chuyển giao định mức BOM', type: 'WRITE', apiEndpoint: '/api/manufacturing/bom' },
      { id: 'e-mfg-2', source: 'M25', target: 'M26', label: 'Phát sinh nhu cầu MRP', type: 'READ', apiEndpoint: '/api/supply-chain/mrp' },
      { id: 'e-mfg-3', source: 'M26', target: 'M39', label: 'Kiểm tra mẫu lô KCS', type: 'EVENT', apiEndpoint: '/api/quality/wo-qc' },
      { id: 'e-mfg-4', source: 'M39', target: 'M17', label: 'Lệnh nhập kho thành phẩm', type: 'WRITE', apiEndpoint: '/api/inventory/mfg-receipt', service: 'InventoryService.postTransaction()' },
      { id: 'e-mfg-5', source: 'M17', target: 'M42', label: 'Số lượng thực nhập', type: 'WRITE', apiEndpoint: '/api/costing/allocate', service: 'CostingService / LandedCostEngine', authorityNote: 'M42 là single writer cho giá thành COGS' },
      { id: 'e-mfg-6', source: 'M42', target: 'M30', label: 'Bút toán kết chuyển giá thành', type: 'WRITE', apiEndpoint: '/api/finance/journal', service: 'AccountingService.postJournal()' },
      { id: 'e-mfg-db', source: 'M42', target: 'DB', label: 'Ghi cost_layers', type: 'WRITE' },
    ]
  },

  RETURNS: {
    title: 'Đổi Trả Hàng & Hoàn Tiền (Returns Management & Refund — RMA)',
    subtitle: 'Đơn SO gốc M13 ➔ Tiếp nhận RMA M15 ➔ Giám định KCS M39 ➔ Nhập hoàn kho M17 ➔ Credit Note M31 ➔ Hoàn tiền M32 ➔ Sổ cái M30',
    nodes: [
      { id: 'M13', name: 'Đơn Bán Hàng Gốc (SO)', category: 'Commercial', icon: 'FileText', x: 70, y: 150, stage: '1. Truy xuất SO gốc', route: '/sales' },
      { id: 'M15', name: 'Yêu Cầu Đổi Trả (RMA)', category: 'Commercial', icon: 'RotateCcw', x: 230, y: 150, stage: '2. Tiếp nhận & Thẩm định', route: '/returns' },
      { id: 'M39', name: 'Kiểm Định Hàng Hoàn', category: 'Quality', icon: 'CheckCircle2', x: 390, y: 150, stage: '3. Giám định KCS lỗi', route: '/quality-control' },
      { id: 'M17', name: 'Nhập Kho Hoàn Hàng', category: 'Inventory', icon: 'PackageCheck', x: 550, y: 150, stage: '4. postTransaction() hoàn kho', route: '/inventory', isSingleWriter: true, authorityDomain: 'Inventory Authority' },
      { id: 'M31', name: 'Credit Note Giảm Trừ', category: 'Finance', icon: 'Receipt', x: 710, y: 150, stage: '5. Hóa đơn điều chỉnh AR', route: '/invoices' },
      { id: 'M32', name: 'Lệnh Hoàn Tiền (Refund)', category: 'Finance', icon: 'CreditCard', x: 870, y: 150, stage: '6. Chi trả hoàn tiền', route: '/treasury' },
      { id: 'M30', name: 'Sổ Cái Hoàn Nhập (GL)', category: 'Finance', icon: 'Landmark', x: 710, y: 260, stage: '7. Hoàn nhập doanh thu/giá vốn', route: '/gl', isSingleWriter: true, authorityDomain: 'Accounting Authority' },
      { id: 'DB', name: 'LibSQL Storage', category: 'Database', icon: 'Database', x: 550, y: 260, stage: 'Persisted Ledger' },
    ],
    edges: [
      { id: 'e-ret-1', source: 'M13', target: 'M15', label: 'Đối soát đơn hàng gốc', type: 'READ', apiEndpoint: '/api/returns/from-so' },
      { id: 'e-ret-2', source: 'M15', target: 'M39', label: 'Yêu cầu kiểm định KCS', type: 'EVENT', apiEndpoint: '/api/quality/rma-inspection' },
      { id: 'e-ret-3', source: 'M39', target: 'M17', label: 'Biên bản chấp thuận nhập lại', type: 'WRITE', apiEndpoint: '/api/inventory/rma-receive', service: 'InventoryService.postTransaction()', authorityNote: 'M17 là single writer cho tồn kho' },
      { id: 'e-ret-4', source: 'M17', target: 'M31', label: 'Xác nhận số lượng hoàn kho', type: 'READ', apiEndpoint: '/api/invoices/credit-note' },
      { id: 'e-ret-5', source: 'M31', target: 'M32', label: 'Lệnh chi hoàn tiền', type: 'WRITE', apiEndpoint: '/api/treasury/refund' },
      { id: 'e-ret-6', source: 'M31', target: 'M30', label: 'Bút toán giảm trừ doanh thu', type: 'WRITE', apiEndpoint: '/api/finance/journal', service: 'AccountingService.postJournal()' },
      { id: 'e-ret-db1', source: 'M17', target: 'DB', label: 'Hoàn nhập stock_balances', type: 'WRITE' },
      { id: 'e-ret-db2', source: 'M30', target: 'DB', label: 'Ghi accounting_entries', type: 'WRITE' },
    ]
  },

  FINANCE: {
    title: 'Chu Trình Tài Chính, Ngân Quỹ & Hợp Nhất (Finance & Treasury)',
    subtitle: 'Hóa đơn AR/AP ➔ Thu chi ngân quỹ ➔ Đối soát sao kê ngân hàng ➔ Sổ cái General Ledger ➔ BCTC Hợp nhất',
    nodes: [
      { id: 'M31', name: 'Hóa Đơn AR / AP', category: 'Finance', icon: 'Receipt', x: 80, y: 150, stage: '1. Đối soát công nợ', route: '/invoices' },
      { id: 'M32', name: 'Thanh Toán & Quỹ Tiền', category: 'Finance', icon: 'CreditCard', x: 260, y: 150, stage: '2. Lệnh chi & Phiếu thu', route: '/treasury' },
      { id: 'M33', name: 'Đối Soát Ngân Hàng', category: 'Finance', icon: 'Landmark', x: 440, y: 150, stage: '3. Host-to-Host Bank Rec', route: '/bank-reconciliation' },
      { id: 'M30', name: 'Sổ Cái Kế Toán (GL)', category: 'Finance', icon: 'FileSpreadsheet', x: 620, y: 150, stage: '4. Bút toán kép Nợ/Có', route: '/gl', isSingleWriter: true, authorityDomain: 'Accounting Authority' },
      { id: 'M34', name: 'Hợp Nhất BCTC Toàn Tập Đoàn', category: 'Finance', icon: 'PieChart', x: 800, y: 150, stage: '5. Loại trừ giao dịch nội bộ', route: '/financial-consolidation' },
      { id: 'DB', name: 'LibSQL Financial Ledger', category: 'Database', icon: 'Database', x: 620, y: 260, stage: 'accounting_entries' },
    ],
    edges: [
      { id: 'e-fin-1', source: 'M31', target: 'M32', label: 'Chỉ thị thanh toán', type: 'WRITE', apiEndpoint: '/api/treasury/pay' },
      { id: 'e-fin-2', source: 'M32', target: 'M33', label: 'Sao kê chi tiền thực tế', type: 'READ', apiEndpoint: '/api/bank/statement-match' },
      { id: 'e-fin-3', source: 'M33', target: 'M30', label: 'Bút toán đối soát số dư', type: 'WRITE', apiEndpoint: '/api/finance/reconciliation-entry', service: 'AccountingService.postJournal()', authorityNote: 'M30 là single writer duy nhất cho kế toán' },
      { id: 'e-fin-4', source: 'M30', target: 'M34', label: 'Bảng cân đối phát sinh', type: 'READ', apiEndpoint: '/api/consolidation/trial-balance' },
      { id: 'e-fin-db', source: 'M30', target: 'DB', label: 'Ghi accounting_entries', type: 'WRITE' },
    ]
  },

  GOVERNANCE: {
    title: 'Quản Trị, Bảo Mật, Sự Kiện & Kiểm Toán (Governance & EDA)',
    subtitle: 'Xác thực RBAC ➔ Luồng sự kiện Outbox M05 ➔ Sổ cái kiểm toán M02 ➔ Phóng chiếu M01 ➔ Báo cáo BI M37',
    nodes: [
      { id: 'M04', name: 'Phân Quyền RBAC', category: 'System', icon: 'Key', x: 80, y: 150, stage: '1. JWT & Role RLS', route: '/superadmin' },
      { id: 'M05', name: 'EventBus & EDA Hub', category: 'System', icon: 'Radio', x: 260, y: 150, stage: '2. Outbox Pattern', route: '/eventbus' },
      { id: 'M02', name: 'Sổ Cái Kiểm Toán (Audit)', category: 'System', icon: 'ShieldCheck', x: 440, y: 150, stage: '3. SHA-256 Tamper-Proof', route: '/audit' },
      { id: 'M01', name: 'Workspace Hub & Observability', category: 'System', icon: 'LayoutDashboard', x: 640, y: 150, stage: '4. Phóng chiếu Read-Model', route: '/workspace' },
      { id: 'M37', name: 'Báo Cáo Quản Trị (BI)', category: 'System', icon: 'BarChart3', x: 840, y: 150, stage: '5. Phân tích điều hành', route: '/analytics' },
      { id: 'DB', name: 'LibSQL Storage', category: 'Database', icon: 'Database', x: 440, y: 260, stage: 'audit_logs & flow_spans' },
    ],
    edges: [
      { id: 'e-gov-1', source: 'M04', target: 'M05', label: 'Ủy quyền Token & Event', type: 'READ', apiEndpoint: '/api/auth/verify' },
      { id: 'e-gov-2', source: 'M05', target: 'M02', label: 'Outbox Event Stream', type: 'EVENT', apiEndpoint: '/api/events/outbox' },
      { id: 'e-gov-3', source: 'M02', target: 'M01', label: 'Observability Projector (15s)', type: 'READ', apiEndpoint: '/api/workspace/observability/sync', authorityNote: 'M01 đọc Audit/Event để tính flow_spans' },
      { id: 'e-gov-4', source: 'M01', target: 'M37', label: 'Chỉ số KPI tổng hợp', type: 'READ', apiEndpoint: '/api/analytics/feed' },
      { id: 'e-gov-db1', source: 'M02', target: 'DB', label: 'Ghi audit_logs', type: 'WRITE' },
      { id: 'e-gov-db2', source: 'M01', target: 'DB', label: 'Ghi flow_spans read-model', type: 'WRITE' },
    ]
  },

  FULL_E2E: {
    title: 'Chu Trình Doanh Nghiệp Toàn Diện (Cross-Enterprise Full E2E)',
    subtitle: 'Master Data M07 ➔ Giá M41 ➔ Bán M13 ➔ Kho M17 ➔ Phân bổ giá thành M42 ➔ Hóa đơn M31 ➔ Sổ cái M30',
    nodes: [
      { id: 'M07', name: 'Master Data Đối Tác', category: 'Commercial', icon: 'Users', x: 80, y: 80, stage: 'Khách & NCC', route: '/master-data' },
      { id: 'M41', name: 'Động Cơ Giá Bán', category: 'Pricing', icon: 'Calculator', x: 80, y: 210, stage: 'Single Writer Giá', route: '/pricing', isSingleWriter: true, authorityDomain: 'Pricing Authority' },
      { id: 'M08', name: 'Mua Hàng (PO)', category: 'Procurement', icon: 'ShoppingCart', x: 280, y: 80, stage: 'Cung Ứng', route: '/purchase' },
      { id: 'M13', name: 'Bán Hàng (SO)', category: 'Commercial', icon: 'FileText', x: 280, y: 210, stage: 'Thương Mại', route: '/sales' },
      { id: 'M17', name: 'Kho Trung Tâm (WMS)', category: 'Inventory', icon: 'Package', x: 500, y: 140, stage: 'Single Writer Tồn Kho', route: '/inventory', isSingleWriter: true, authorityDomain: 'Inventory Authority' },
      { id: 'M42', name: 'Động Cơ Giá Vốn (COGS)', category: 'Costing', icon: 'Coins', x: 680, y: 80, stage: 'Single Writer Giá Vốn', route: '/cost-allocation', isSingleWriter: true, authorityDomain: 'Costing Authority' },
      { id: 'M31', name: 'Hóa Đơn AR / AP', category: 'Finance', icon: 'Receipt', x: 680, y: 210, stage: 'Hóa Đơn GTGT', route: '/invoices' },
      { id: 'M30', name: 'Sổ Cái Tài Chính (GL)', category: 'Finance', icon: 'Landmark', x: 880, y: 140, stage: 'Single Writer Kế Toán', route: '/gl', isSingleWriter: true, authorityDomain: 'Accounting Authority' },
      { id: 'DB', name: 'LibSQL Enterprise Core', category: 'Database', icon: 'Database', x: 500, y: 260, stage: 'NexusSync Enterprise Storage' },
    ],
    edges: [
      { id: 'e-e2e-1', source: 'M07', target: 'M41', label: 'Bảng giá đối tác', type: 'READ' },
      { id: 'e-e2e-2', source: 'M41', target: 'M13', label: 'Snapshot giá bán', type: 'READ' },
      { id: 'e-e2e-3', source: 'M08', target: 'M17', label: 'Nhập kho mua hàng (GRN)', type: 'WRITE', service: 'InventoryService.postTransaction()' },
      { id: 'e-e2e-4', source: 'M13', target: 'M17', label: 'Giữ chỗ xuất bán (ATP)', type: 'WRITE', service: 'InventoryService.postTransaction()' },
      { id: 'e-e2e-5', source: 'M17', target: 'M42', label: 'Số lượng thực xuất', type: 'WRITE', service: 'CostingService' },
      { id: 'e-e2e-6', source: 'M17', target: 'M31', label: 'Biên bản xuất/nhập', type: 'READ' },
      { id: 'e-e2e-7', source: 'M42', target: 'M30', label: 'Bút toán giá vốn TK 632', type: 'WRITE', service: 'AccountingService.postJournal()' },
      { id: 'e-e2e-8', source: 'M31', target: 'M30', label: 'Bút toán công nợ & thuế', type: 'WRITE', service: 'AccountingService.postJournal()' },
      { id: 'e-e2e-db1', source: 'M17', target: 'DB', label: 'stock_ledger', type: 'WRITE' },
      { id: 'e-e2e-db2', source: 'M30', target: 'DB', label: 'accounting_entries', type: 'WRITE' },
    ]
  },

  ALL: {
    title: 'Tổng Thể Mạch Tín Hiệu Doanh Nghiệp (Enterprise Global Circuit)',
    subtitle: 'Mạng lưới điều phối đa phân hệ: Commercial ➔ Logistics ➔ Manufacturing ➔ Finance ➔ LibSQL Database',
    nodes: [
      { id: 'M08', name: 'Mua Hàng (PO)', category: 'Procurement', icon: 'ShoppingCart', x: 80, y: 70, stage: 'Cung Ứng', route: '/purchase' },
      { id: 'M13', name: 'Bán Hàng (SO)', category: 'Commercial', icon: 'FileText', x: 80, y: 210, stage: 'Thương Mại', route: '/sales' },
      { id: 'M17', name: 'Kho Trung Tâm (WMS)', category: 'Inventory', icon: 'Package', x: 340, y: 140, stage: 'Kho Vận Đơn Nhất', route: '/inventory', isSingleWriter: true, authorityDomain: 'Inventory Authority' },
      { id: 'M25', name: 'Sản Xuất (MES)', category: 'Manufacturing', icon: 'Factory', x: 580, y: 70, stage: 'Chế Tạo', route: '/manufacturing' },
      { id: 'M36', name: 'Giao Vận (TMS)', category: 'Logistics', icon: 'Truck', x: 580, y: 210, stage: 'Phân Phối', route: '/logistics' },
      { id: 'M30', name: 'Sổ Cái Tài Chính (GL)', category: 'Finance', icon: 'Landmark', x: 820, y: 140, stage: 'Hạch Toán Cuối', route: '/gl', isSingleWriter: true, authorityDomain: 'Accounting Authority' },
      { id: 'DB', name: 'LibSQL Enterprise Core', category: 'Database', icon: 'Database', x: 460, y: 260, stage: 'Storage Engine' },
    ],
    edges: [
      { id: 'e-all-1', source: 'M08', target: 'M17', label: 'Nhập kho mua hàng', type: 'WRITE', service: 'InventoryService.postTransaction()' },
      { id: 'e-all-2', source: 'M13', target: 'M17', label: 'Giữ chỗ xuất bán (ATP)', type: 'WRITE', service: 'InventoryService.postTransaction()' },
      { id: 'e-all-3', source: 'M17', target: 'M25', label: 'Xuất kho vật tư SX', type: 'WRITE' },
      { id: 'e-all-4', source: 'M25', target: 'M17', label: 'Nhập kho thành phẩm', type: 'WRITE' },
      { id: 'e-all-5', source: 'M17', target: 'M36', label: 'Xuất kho bàn giao xe', type: 'READ' },
      { id: 'e-all-6', source: 'M17', target: 'M30', label: 'Bút toán xuất/nhập GL', type: 'WRITE', service: 'AccountingService.postJournal()' },
      { id: 'e-all-7', source: 'M36', target: 'M30', label: 'Đối soát cước & COD', type: 'EVENT' },
      { id: 'e-all-db1', source: 'M17', target: 'DB', label: 'stock_balances', type: 'WRITE' },
      { id: 'e-all-db2', source: 'M30', target: 'DB', label: 'accounting_entries', type: 'WRITE' },
    ]
  }
};

export const ProcessFlowMap: React.FC<ProcessFlowMapProps> = ({
  chainType,
  onChangeChainType,
  topologyHealthMap,
  onSelectNode,
  onSelectEdge,
  onSelectModule,
  viewMode,
  onChangeViewMode,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const currentChain = CHAIN_DEFINITIONS[chainType] || CHAIN_DEFINITIONS.ALL;

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(0.65, prev + delta), 1.6));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleAutoLayout = () => {
    handleResetZoom();
  };

  // Node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, ProcessNode>();
    currentChain.nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [currentChain]);

  // Registry map for richer info
  const registryMap = useMemo(() => {
    const map = new Map<string, ModuleDefinition>();
    MODULE_REGISTRY.forEach(m => map.set(m.moduleId, m));
    return map;
  }, []);

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click pan
    // If clicking on a node or edge, don't start canvas pan
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-element')) return;

    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const isLive = viewMode === 'live';
  const isSimulation = viewMode === 'simulation';
  const isPaused = viewMode === 'paused';

  return (
    <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-md p-4 sm:p-5 flex flex-col h-full min-h-[580px] relative overflow-hidden select-none">
      {/* Background Circuit Grid effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1e293b 1px, transparent 1px),
            linear-gradient(to bottom, #1e293b 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Header of Map */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs border border-blue-400/40">
            <Icons.Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5 font-mono">
                <span>{currentChain.title}</span>
              </h4>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                isLive 
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80' 
                  : isSimulation
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isLive ? '● LIVE' : isSimulation ? '⚡ SIMULATION' : '❚❚ PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xl">
              {currentChain.subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher: LIVE / PAUSED / SIMULATION */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => onChangeViewMode('live')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                isLive
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Xem luồng dữ liệu thời gian thực từ backend"
            >
              LIVE
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('paused')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                isPaused
                  ? 'bg-slate-700 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tạm dừng animation dòng tín hiệu"
            >
              PAUSED
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('simulation')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                isSimulation
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mô phỏng trực quan dòng dữ liệu tốc độ cao (không ghi DB)"
            >
              <Icons.Zap className="w-3 h-3" />
              <span>SIMULATION</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => handleZoom(0.1)}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer transition-all"
              title="Phóng to (+)"
            >
              <Icons.ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer transition-all"
              title="Thu nhỏ (-)"
            >
              <Icons.ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleAutoLayout}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer transition-all text-[10px] font-mono font-bold px-2"
              title="Căn giữa & Khôi phục 100%"
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      {/* Preset filter bar */}
      <div className="relative z-10 flex items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-none border-b border-slate-800/80">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Icons.GitFork className="w-3 h-3 text-blue-400" />
          <span>Presets:</span>
        </span>
        {(['ALL', 'P2P', 'O2C', 'POS', 'INVENTORY', 'MANUFACTURING', 'FINANCE', 'FULL_E2E', 'GOVERNANCE'] as ProcessChainType[]).map((type) => {
          const isActive = chainType === type;
          const labels: Record<ProcessChainType, string> = {
            ALL: 'Toàn cảnh (Circuit)',
            P2P: 'Mua hàng (P2P)',
            O2C: 'Bán hàng (O2C)',
            POS: 'Bán lẻ (POS)',
            INVENTORY: 'Kho vận (WMS)',
            MANUFACTURING: 'Sản xuất & BOM',
            FINANCE: 'Tài chính & Sổ cái',
            FULL_E2E: 'Chu trình Full E2E',
            GOVERNANCE: 'Quản trị & EDA',
          };
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChangeChainType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer font-mono ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-bold border border-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              {labels[type]}
            </button>
          );
        })}
      </div>

      {/* Interactive SVG Viewport */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative flex-1 w-full mt-3 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <svg
          viewBox="0 0 1020 320"
          className="w-full h-full min-h-[360px] select-none"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          <defs>
            {/* Connection Markers */}
            <marker id="arrow-read" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow-write" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
            </marker>
            <marker id="arrow-event" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#c084fc" />
            </marker>
            <marker id="arrow-dep" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
            </marker>

            {/* Glowing filter */}
            <filter id="circuit-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Connections (Edges) */}
          {currentChain.edges.map((edge) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;

            const isHovered = hoveredEdgeId === edge.id;
            const isWrite = edge.type === 'WRITE';
            const isEvent = edge.type === 'EVENT';
            const isRead = edge.type === 'READ';

            let strokeColor = '#64748b'; // default
            let markerId = 'url(#arrow-dep)';
            let strokeDash = undefined;
            let strokeWidth = isHovered ? 2.5 : 1.75;
            let packetColor = '#38bdf8';

            if (isWrite) {
              strokeColor = isHovered ? '#818cf8' : '#6366f1';
              markerId = 'url(#arrow-write)';
              strokeWidth = isHovered ? 3 : 2;
              packetColor = '#818cf8';
            } else if (isEvent) {
              strokeColor = isHovered ? '#d8b4fe' : '#a855f7';
              markerId = 'url(#arrow-event)';
              strokeDash = '5,4';
              packetColor = '#c084fc';
            } else if (isRead) {
              strokeColor = isHovered ? '#7dd3fc' : '#38bdf8';
              markerId = 'url(#arrow-read)';
              packetColor = '#38bdf8';
            }

            // Circuit-style smooth bezier curve
            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const cx1 = src.x + dx * 0.45;
            const cy1 = src.y;
            const cx2 = src.x + dx * 0.55;
            const cy2 = tgt.y;
            const pathD = `M ${src.x} ${src.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tgt.x} ${tgt.y}`;

            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2 - 8;

            return (
              <g
                key={edge.id}
                className="interactive-element cursor-pointer group"
                onClick={() => onSelectEdge(edge)}
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
              >
                {/* Wider hit-area */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" />

                {/* Main signal line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  markerEnd={markerId}
                  className="transition-colors duration-150"
                />

                {/* Animated Moving Data Packet (●) along the path */}
                {!isPaused && (
                  <circle r={isSimulation ? 3.5 : 2.5} fill={packetColor} filter="url(#circuit-glow)">
                    <animateMotion
                      path={pathD}
                      dur={isSimulation ? '1.2s' : '2.6s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Edge Text Badge */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-45"
                    y="-9"
                    width="90"
                    height="18"
                    rx="4"
                    fill="#0f172a"
                    stroke={isHovered ? strokeColor : '#334155'}
                    strokeWidth="1"
                    className="shadow-xs"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill={isHovered ? '#ffffff' : '#cbd5e1'}
                    className="text-[9px] font-mono font-medium select-none"
                  >
                    {edge.label.length > 15 ? edge.label.slice(0, 14) + '…' : edge.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Render Nodes */}
          {currentChain.nodes.map((node) => {
            const isDatabase = node.id === 'DB';
            const healthData = topologyHealthMap.get(node.id);
            const isDegraded = healthData?.status === 'DEGRADED';
            const isCritical = healthData?.status === 'CRITICAL';

            const catColor = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.System;
            const statusColor = isCritical ? '#ef4444' : isDegraded ? '#f59e0b' : '#10b981';

            const isHovered = hoveredNodeId === node.id;
            const def = registryMap.get(node.id);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="interactive-element cursor-pointer group"
                onClick={() => onSelectNode(node, def)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Glow ring on hover */}
                {isHovered && (
                  <circle
                    r={isDatabase ? 36 : 30}
                    fill="none"
                    stroke={catColor.border}
                    strokeWidth="2.5"
                    strokeOpacity="0.4"
                    className="animate-pulse"
                  />
                )}

                {/* Outer status ring */}
                <circle
                  r={isDatabase ? 28 : 24}
                  fill="#090d16"
                  stroke={isHovered ? catColor.border : '#1e293b'}
                  strokeWidth="2"
                  className="shadow-md transition-all duration-150"
                />

                {/* Status Indicator arc */}
                {!isDatabase && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={statusColor}
                    strokeWidth="2.5"
                    strokeDasharray="42 110"
                    strokeLinecap="round"
                  />
                )}

                {/* Single-Writer Authority Badge or DB icon */}
                {node.isSingleWriter && (
                  <circle
                    cx="18"
                    cy="-18"
                    r="6"
                    fill="#4f46e5"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}

                {/* Inner ID label */}
                <text
                  x="0"
                  y="-1"
                  textAnchor="middle"
                  fill={catColor.text}
                  className="text-[11px] font-bold font-mono select-none tracking-wider"
                >
                  {node.id}
                </text>

                {/* Node Title / Subtitle below circle */}
                <text
                  x="0"
                  y="36"
                  textAnchor="middle"
                  fill="#f1f5f9"
                  className="text-[10px] font-bold font-sans select-none tracking-tight"
                >
                  {node.name.length > 20 ? node.name.slice(0, 19) + '…' : node.name}
                </text>

                {/* Stage subtitle */}
                <text
                  x="0"
                  y="48"
                  textAnchor="middle"
                  fill="#94a3b8"
                  className="text-[8.5px] font-mono select-none"
                >
                  {node.stage}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend / Guidance Footer Strip */}
        <div className="absolute bottom-2.5 left-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-300 font-bold uppercase tracking-wider">Signals:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-400" />
              <span>READ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-indigo-500" />
              <span>WRITE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-purple-400 border-dashed" />
              <span>EVENT (Outbox)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 border border-white" />
              <span className="font-semibold text-indigo-300">Single-Writer Authority</span>
            </div>
            <span className="text-slate-600">|</span>
            <span>Click node / edge để xem Inspector</span>
          </div>
        </div>
      </div>
    </div>
  );
};
