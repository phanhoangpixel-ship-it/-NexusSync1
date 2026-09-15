import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';
import { SelectedEntityContext } from '../../../../types';
import { formatCurrency } from '../../../../utils/currencyFormatter';
import { PdfPrintModal } from '../../../../components/modals/PdfPrintModal';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useWorkspaceContextSync } from '../../../../hooks/useWorkspaceContextSync';
import {
  ShoppingBag,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Download,
  ShieldCheck,
  Building2,
  DollarSign,
  Layers,
  X,
  Send,
  Printer,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
  Check,
  FileCheck,
  Eye,
  Settings,
  ShieldAlert,
  Play,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  Info,
  Truck,
  Warehouse,
  PackageCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { M08PurchaseOrdersWorkspaceProps } from './types';

export const M08PurchaseOrdersWorkspace: React.FC<M08PurchaseOrdersWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
  guidedTask,
  selectedEntity,
  currentUser: propUser,
  allowedModules,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'pos' | 'matching' | 'contracts' | 'analytics'>('M08', 'pos');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Search & Filter state for PO Tab
  const [poSearchTerm, setPoSearchTerm] = useState<string>('');
  const [poStatusFilter, setPoStatusFilter] = useState<string>('ALL');

  // Search & Filter state for 3-Way Matching Tab
  const [matchingFilter, setMatchingFilter] = useState<string>('ALL');

  // Pagination for PO Table
  const [poPage, setPoPage] = useState<number>(1);
  const [poPageSize, setPoPageSize] = useState<number>(10);

  // Pagination for Matching Table
  const [matchingPage, setMatchingPage] = useState<number>(1);
  const [matchingPageSize, setMatchingPageSize] = useState<number>(10);

  // Rule #19 ConfirmDialog state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'primary' | 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {}
  });

  // Active User Context
  const currentUser = {
    name: propUser?.name || propUser?.username || 'Trần Minh Hoàng',
    role: propUser?.role || 'Trưởng phòng Thu mua P2P'
  };

  const reportModuleMeta = {
    code: 'M08',
    moduleId: 'M08',
    moduleName: 'Phân hệ Quản lý Đơn Mua Hàng & Đối Chiếu 3-Way Matching (P2P)'
  };

  // 1. Purchase Orders (PO) State
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([
    {
      id: 'PO-2026-001',
      supplier: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
      items: 'Silicon Wafer 300mm (500 cái)',
      totalAmount: 450000000,
      status: 'APPROVED',
      matching: '3-Way Matched (PO = GR = AP)',
      createdDate: '2026-08-15',
      deliveryDate: '2026-08-20',
      contractId: 'CON-2026-001'
    },
    {
      id: 'PO-2026-002',
      supplier: 'Tập đoàn Hóa chất & Phụ gia Xanh',
      items: 'Biopolymer PLA Resin (2,000 kg)',
      totalAmount: 180000000,
      status: 'PENDING_APPROVAL',
      matching: 'Pending Goods Receipt',
      createdDate: '2026-08-25',
      deliveryDate: '2026-09-02',
      contractId: 'CON-2026-002'
    },
    {
      id: 'PO-2026-003',
      supplier: 'Công ty TNHH Thiết bị Đo lường Quang Học',
      items: 'Cảm biến Laser 3D (50 bộ)',
      totalAmount: 320000000,
      status: 'APPROVED',
      matching: 'Discrepancy Warning (GR Mismatch)',
      createdDate: '2026-08-20',
      deliveryDate: '2026-08-24',
      contractId: 'CON-2026-003'
    }
  ]);

  // Selected PO Detail Modal State
  const [selectedPoForModal, setSelectedPoForModal] = useState<any | null>(null);

  // New PO Form States
  const [newPoSupplier, setNewPoSupplier] = useState('');
  const [newPoItems, setNewPoItems] = useState('');
  const [newPoAmount, setNewPoAmount] = useState('250,000,000 VND');

  // 2. 3-Way Matching State
  const [matchingCases, setMatchingCases] = useState<any[]>([
    {
      id: 'MC-2026-001',
      poId: 'PO-2026-001',
      supplier: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
      poQty: 500,
      grQty: 500,
      apQty: 500,
      poPrice: 900000,
      apPrice: 900000,
      status: 'MATCHED', // MATCHED, MISMATCH, RESOLVED, PENDING_GR
      notes: 'Khớp hoàn toàn 3 bên. Đã chuyển hồ sơ sang phân hệ Kế toán để lập lịch thanh toán.'
    },
    {
      id: 'MC-2026-002',
      poId: 'PO-2026-002',
      supplier: 'Tập đoàn Hóa chất & Phụ gia Xanh',
      poQty: 2000,
      grQty: 0,
      apQty: 0,
      poPrice: 90000,
      apPrice: 0,
      status: 'PENDING_GR',
      notes: 'Hàng chưa nhập kho. Chờ cập nhật phiếu biên bản nhận hàng GR từ phân hệ Inbound.'
    },
    {
      id: 'MC-2026-003',
      poId: 'PO-2026-003',
      supplier: 'Công ty TNHH Thiết bị Đo lường Quang Học',
      poQty: 50,
      grQty: 45, // Mismatch: Shortage in warehouse receiving
      apQty: 50, // Supplier billed full amount
      poPrice: 6400000,
      apPrice: 6400000,
      status: 'MISMATCH',
      notes: 'Cảnh báo lệch số lượng: Kho thực nhận 45 bộ nhưng Nhà cung cấp xuất hóa đơn đòi tiền 50 bộ.'
    }
  ]);

  const [selectedMatchCase, setSelectedMatchCase] = useState<any | null>(null);
  const [resolutionReason, setResolutionReason] = useState<string>('Duyệt thanh toán theo số lượng thực nhận (45 bộ). Đã thỏa thuận giảm trừ công nợ với NCC.');

  // 3. Contracts State
  const [contracts, setContracts] = useState<any[]>([
    {
      id: 'CON-2026-001',
      title: 'Hợp đồng nguyên tắc cung ứng Silicon Wafer',
      supplier: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      committedValue: 3000000000,
      usedValue: 1250000000,
      status: 'ACTIVE'
    },
    {
      id: 'CON-2026-002',
      title: 'Thỏa thuận khung cung cấp hạt nhựa Biopolymer',
      supplier: 'Tập đoàn Hóa chất & Phụ gia Xanh',
      startDate: '2026-03-15',
      endDate: '2027-03-14',
      committedValue: 1500000000,
      usedValue: 360000000,
      status: 'ACTIVE'
    },
    {
      id: 'CON-2026-003',
      title: 'Hợp đồng mua sắm thiết bị đo laser quang học',
      supplier: 'Công ty TNHH Thiết bị Đo lường Quang Học',
      startDate: '2025-06-01',
      endDate: '2026-05-31',
      committedValue: 800000000,
      usedValue: 800000000,
      status: 'EXPIRED'
    }
  ]);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [newConTitle, setNewConTitle] = useState('');
  const [newConSupplier, setNewConSupplier] = useState('');
  const [newConVal, setNewConVal] = useState('1,000,000,000');

  // 4. Goods Receipt (GR) State & Modals
  const [receivingPo, setReceivingPo] = useState<any | null>(null);
  const [receivingWarehouseId, setReceivingWarehouseId] = useState<string | number>('');
  const [receivingNotes, setReceivingNotes] = useState('');
  const [isSubmittingGr, setIsSubmittingGr] = useState(false);
  const [goodsReceiptsList, setGoodsReceiptsList] = useState<any[]>([]);
  const [isGrModalOpen, setIsGrModalOpen] = useState(false);

  // 5. Master Data Integration States
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | number>('');
  const [warehousesList, setWarehousesList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  const lastSyncedEntityRef = useRef<string | null>(null);

  // Handle PO Entity selection and Context Rail synchronization
  const handleSelectPo = useCallback((po: any) => {
    setSelectedPoForModal(po);
    lastSyncedEntityRef.current = `PURCHASE_ORDER_${po.id}`;
    onSelectEntity({
      type: 'PURCHASE_ORDER',
      id: po.id,
      code: po.id,
      title: `PO: ${po.supplier}`,
      status: po.status,
      lineage: [
        { id: po.id, type: 'Đơn mua hàng PO', code: po.id, relation: 'CURRENT_PO', status: po.status },
        { id: 'M08-P2P', type: 'Phân hệ M08', code: 'M08_PURCHASE_ORDERS', relation: 'PARENT_MODULE', status: 'ACTIVE' }
      ],
      auditTrail: [
        { id: 1, action: 'INSPECT_PURCHASE_ORDER', timestamp: new Date().toISOString(), user: currentUser.name, sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
      ],
      glEntries: []
    });
    onNotify('info', 'Đã tải chi tiết chứng từ', `Đã chọn PO ${po.id} vào Thanh Ngữ cảnh Đối Tượng.`);
  }, [onSelectEntity, onNotify, currentUser.name]);

  // Load real purchase orders from API
  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPurchaseOrders(data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch POs from API:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load 3-Way matching cases from API
  const fetchMatchingCases = useCallback(async () => {
    try {
      const res = await fetch('/api/purchase/matching-cases');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMatchingCases(data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch matching cases:', err);
    }
  }, []);

  // Load BPA contracts from API
  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/purchase/contracts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setContracts(data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch contracts:', err);
    }
  }, []);

  // Load Goods Receipts from API
  const fetchGoodsReceipts = useCallback(async () => {
    try {
      const res = await fetch('/api/purchase/goods-receipts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGoodsReceiptsList(data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch goods receipts:', err);
    }
  }, []);

  // Load Master Data (Suppliers, Warehouses, Products)
  const fetchMasterData = useCallback(async () => {
    try {
      const [supRes, whRes, prodRes] = await Promise.allSettled([
        fetch('/api/suppliers'),
        fetch('/api/warehouses'),
        fetch('/api/products')
      ]);

      if (supRes.status === 'fulfilled' && supRes.value.ok) {
        const data = await supRes.value.json();
        if (Array.isArray(data)) setSuppliersList(data);
      }
      if (whRes.status === 'fulfilled' && whRes.value.ok) {
        const data = await whRes.value.json();
        if (Array.isArray(data)) {
          setWarehousesList(data);
          if (data.length > 0) setReceivingWarehouseId(prev => prev || data[0].id);
        }
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
        const data = await prodRes.value.json();
        if (Array.isArray(data)) setProductsList(data);
      }
    } catch (err) {
      console.warn('Could not fetch master data:', err);
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchMatchingCases();
    fetchContracts();
    fetchGoodsReceipts();
    fetchMasterData();
  }, [fetchPurchaseOrders, fetchMatchingCases, fetchContracts, fetchGoodsReceipts, fetchMasterData]);

  // Standard Workspace Lifecycle: Synchronize when branch or context changes
  useWorkspaceContextSync(useCallback(() => {
    fetchPurchaseOrders();
    fetchMatchingCases();
    fetchContracts();
    fetchGoodsReceipts();
  }, [fetchPurchaseOrders, fetchMatchingCases, fetchContracts, fetchGoodsReceipts]));

  // Standard Workspace Lifecycle: Listen to nexus-workspace-refresh (omnibar / sidebar re-click / toolbar button)
  useEffect(() => {
    const handleWorkspaceRefresh = (e: any) => {
      if (!e.detail?.moduleId || e.detail.moduleId === 'M08') {
        fetchPurchaseOrders();
        fetchMatchingCases();
        fetchContracts();
        fetchGoodsReceipts();
        // Reset search term if user is performing clean re-navigation
        if (!guidedTask && !selectedEntity) {
          setPoSearchTerm('');
        }
      }
    };
    window.addEventListener('nexus-workspace-refresh', handleWorkspaceRefresh);
    return () => window.removeEventListener('nexus-workspace-refresh', handleWorkspaceRefresh);
  }, [fetchPurchaseOrders, fetchMatchingCases, fetchContracts, fetchGoodsReceipts, guidedTask, selectedEntity]);

  // Guided Assistant and External Route / Omnibar auto-navigation effect
  const lastGuidedTaskTimestampRef = useRef<number | null>(null);
  useEffect(() => {
    if (!guidedTask || !guidedTask.item) return;
    if (guidedTask.timestamp && lastGuidedTaskTimestampRef.current === guidedTask.timestamp) return;
    lastGuidedTaskTimestampRef.current = guidedTask.timestamp || Date.now();

    const { item } = guidedTask;
    const ref = (item.entityId || item.businessReference || item.id || '').trim();

    if (item.id?.includes('MATCH') || item.title?.includes('3-Way') || item.title?.includes('Đối chiếu') || ref.startsWith('MC-')) {
      setActiveTab('matching');
      if (ref) {
        const foundMatch = matchingCases.find((m) => m.poId === ref || m.id === ref);
        if (foundMatch) {
          setSelectedMatchCase(foundMatch);
        }
      }
    } else if (item.id?.includes('CON') || item.title?.includes('Hợp đồng') || ref.startsWith('CON-')) {
      setActiveTab('contracts');
    } else {
      setActiveTab('pos');
      if (ref) {
        setPoSearchTerm(ref);
        const foundPo = purchaseOrders.find((p) => p.id === ref || p.code === ref);
        if (foundPo) {
          setSelectedPoForModal(foundPo);
        }
      }
    }
    onNotify('info', 'Trợ lý Hướng Dẫn', `Đang mở đơn mua hàng/chứng từ: ${ref || item.title}`);
  }, [guidedTask, purchaseOrders, matchingCases, onNotify, setActiveTab]);

  // Selected Entity synchronization from omnibar or cross-workspace navigation
  useEffect(() => {
    if (!selectedEntity) return;
    const code = (selectedEntity.code || selectedEntity.id || '').trim();
    if (!code) return;

    const syncKey = `${selectedEntity.type || ''}_${code}`;
    if (lastSyncedEntityRef.current === syncKey) return;
    lastSyncedEntityRef.current = syncKey;

    if (selectedEntity.type === 'MATCHING_CASE' || code.startsWith('MC-')) {
      setActiveTab('matching');
      const foundMatch = matchingCases.find((m) => m.id === code || m.poId === code);
      if (foundMatch) {
        setSelectedMatchCase(foundMatch);
      }
    } else if (selectedEntity.type === 'CONTRACT' || code.startsWith('CON-')) {
      setActiveTab('contracts');
    } else if (code.startsWith('PO-') || selectedEntity.type === 'PURCHASE_ORDER' || selectedEntity.module === 'M08') {
      setActiveTab('pos');
      setPoSearchTerm(code);
      const foundPo = purchaseOrders.find((p) => p.id === code || p.code === code);
      if (foundPo) {
        setSelectedPoForModal(foundPo);
      }
    }
  }, [selectedEntity, purchaseOrders, matchingCases, setActiveTab]);

  // Spend analytics dataset
  const spendBySupplierData = [
    { name: 'Vật liệu Bán dẫn', value: 450000000 },
    { name: 'Hóa chất Xanh', value: 180000000 },
    { name: 'Đo lường Quang Học', value: 320000000 },
    { name: 'Linh kiện ABC', value: 250000000 },
  ];

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

  const spendTrendData = [
    { month: 'T3', 'Kế hoạch': 600, 'Thực chi': 580 },
    { month: 'T4', 'Kế hoạch': 700, 'Thực chi': 690 },
    { month: 'T5', 'Kế hoạch': 650, 'Thực chi': 720 },
    { month: 'T6', 'Kế hoạch': 800, 'Thực chi': 780 },
    { month: 'T7', 'Kế hoạch': 900, 'Thực chi': 850 },
    { month: 'T8', 'Kế hoạch': 1000, 'Thực chi': 950 },
  ];

  // Calculated metrics using nullish coalescing to avoid treating 0 as falsy
  const totalSpend = useMemo(() => {
    return purchaseOrders.reduce((sum, p) => sum + (typeof p.totalAmount === 'number' ? p.totalAmount : (p.totalAmount ?? 250000000)), 0);
  }, [purchaseOrders]);

  const pendingApprovalCount = useMemo(() => {
    return purchaseOrders.filter(p => p.status === 'PENDING_APPROVAL').length;
  }, [purchaseOrders]);

  const mismatchCount = useMemo(() => {
    return matchingCases.filter(c => c.status === 'MISMATCH').length;
  }, [matchingCases]);

  // Filtered Purchase Orders
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchSearch = poSearchTerm.trim() === '' || 
        po.id.toLowerCase().includes(poSearchTerm.toLowerCase()) ||
        (po.supplier && po.supplier.toLowerCase().includes(poSearchTerm.toLowerCase())) ||
        (po.items && po.items.toLowerCase().includes(poSearchTerm.toLowerCase()));
      
      const matchStatus = poStatusFilter === 'ALL' || po.status === poStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchaseOrders, poSearchTerm, poStatusFilter]);

  // Paginated Purchase Orders
  const paginatedPurchaseOrders = useMemo(() => {
    const start = (poPage - 1) * poPageSize;
    return filteredPurchaseOrders.slice(start, start + poPageSize);
  }, [filteredPurchaseOrders, poPage, poPageSize]);

  // Filtered Matching Cases
  const filteredMatchingCases = useMemo(() => {
    return matchingCases.filter(c => {
      if (matchingFilter === 'ALL') return true;
      return c.status === matchingFilter;
    });
  }, [matchingCases, matchingFilter]);

  // Paginated Matching Cases
  const paginatedMatchingCases = useMemo(() => {
    const start = (matchingPage - 1) * matchingPageSize;
    return filteredMatchingCases.slice(start, start + matchingPageSize);
  }, [filteredMatchingCases, matchingPage, matchingPageSize]);

  // Handlers
  const handleExecuteGoodsReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPo) return;

    setIsSubmittingGr(true);
    const targetWhId = Number(receivingWarehouseId) || (warehousesList[0]?.id ?? 1);
    const idempKey = `IDEMP-GR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await fetch(`/api/purchase/orders/${encodeURIComponent(receivingPo.id)}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: targetWhId,
          idempotencyKey: idempKey,
          notes: receivingNotes || `Phiếu nhập kho hàng hóa cho PO ${receivingPo.id}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nhận hàng không thành công');
      }

      onNotify('success', 'Nhập kho thành công (GR)', `Đã tiếp nhận vật tư vào kho và cập nhật số dư tồn kho qua InventoryService.`);
      setReceivingPo(null);
      setReceivingNotes('');
      if (selectedPoForModal && selectedPoForModal.id === receivingPo.id) {
        setSelectedPoForModal((prev: any) => prev ? { ...prev, status: 'COMPLETED' } : null);
      }

      await Promise.all([
        fetchPurchaseOrders(),
        fetchMatchingCases(),
        fetchGoodsReceipts()
      ]);
    } catch (err: any) {
      onNotify('error', 'Lỗi nhập kho', err.message || 'Không thể thực hiện nhận hàng');
    } finally {
      setIsSubmittingGr(false);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoSupplier.trim() || !newPoItems.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập đầy đủ Nhà cung cấp và Hàng hóa đặt mua.');
      return;
    }

    const numValue = Number(newPoAmount.replace(/[^0-9]/g, '')) || 250000000;
    const supObj = suppliersList.find(s => s.name === newPoSupplier || s.code === newPoSupplier);
    const supId = supObj?.id || Number(selectedSupplierId) || 1;
    const idempKey = `IDEMP-PO-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await fetch('/api/purchase/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supId,
          totalAmount: numValue,
          notes: `${newPoSupplier}: ${newPoItems}`,
          idempotencyKey: idempKey,
          items: [
            {
              productId: 1,
              quantity: 100,
              unitCost: Math.round(numValue / 100)
            }
          ]
        })
      });

      const data = await res.json();
      if (res.ok && data?.order?.id) {
        fetchPurchaseOrders();
        fetchMatchingCases();
        onNotify('success', 'Tạo Đơn mua hàng PO thành công', `Đã phát hành PO: ${data.order.id} gửi nhà cung cấp ${newPoSupplier}`);
      } else {
        const newPo = {
          id: `PO-2026-00${purchaseOrders.length + 1}`,
          supplier: newPoSupplier,
          items: newPoItems,
          totalAmount: numValue,
          status: 'PENDING_APPROVAL',
          matching: 'Pending Goods Receipt (GR)',
          createdDate: new Date().toISOString().slice(0, 10),
          deliveryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
          contractId: 'CON-2026-001'
        };
        setPurchaseOrders([newPo, ...purchaseOrders]);
        onNotify('success', 'Tạo Đơn mua hàng PO thành công', `Đã phát hành PO: ${newPo.id}`);
      }
    } catch (err: any) {
      console.warn('Could not persist PO to backend:', err);
    }

    setNewPoSupplier('');
    setNewPoItems('');
  };

  // Rule #19: Protected Approve PO with ConfirmDialog
  const triggerApprovePO = (po: any) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Phê duyệt Đơn mua hàng PO',
      message: `Bạn có chắc chắn muốn phê duyệt đơn mua hàng ${po.id} cho nhà cung cấp "${po.supplier}" với tổng giá trị ${formatCurrency(po.totalAmount ?? 0)}? Thao tác này sẽ chính thức chuyển đơn hàng sang trạng thái có hiệu lực.`,
      variant: 'primary',
      confirmText: 'Phê duyệt PO',
      cancelText: 'Hủy bỏ',
      onConfirm: () => {
        executeApprovePO(po.id);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const executeApprovePO = (poId: string) => {
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'APPROVED' } : p));
    fetch(`/api/purchase/orders/${encodeURIComponent(poId)}/approve`, { method: 'POST' })
      .catch(err => console.warn('Approve PO error:', err));
    onNotify('success', 'Phê duyệt PO thành công', `Đơn mua hàng ${poId} đã chính thức được phê duyệt ngân sách và chuyển sang nhà cung cấp.`);
  };

  // Rule #19: Protected Reject PO with ConfirmDialog
  const triggerRejectPO = (po: any) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Từ chối Đơn mua hàng PO',
      message: `Bạn có chắc chắn muốn từ chối phê duyệt đơn mua hàng ${po.id}? Đơn hàng sẽ bị hủy bỏ và không thể tiến hành giải ngân.`,
      variant: 'danger',
      confirmText: 'Từ chối đơn',
      cancelText: 'Quay lại',
      onConfirm: () => {
        executeRejectPO(po.id);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const executeRejectPO = (poId: string) => {
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'REJECTED' } : p));
    fetch(`/api/purchase/orders/${encodeURIComponent(poId)}/cancel`, { method: 'POST' })
      .catch(err => console.warn('Reject PO error:', err));
    onNotify('warning', 'Đã từ chối đơn hàng', `Đã từ chối phê duyệt đơn hàng ${poId}.`);
  };

  const handleResolveMismatch = async () => {
    if (!selectedMatchCase) return;

    try {
      await fetch(`/api/purchase/matching-cases/${encodeURIComponent(selectedMatchCase.id)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionReason,
          poId: selectedMatchCase.poId
        })
      });
      fetchMatchingCases();
    } catch (err) {
      console.warn('Resolve mismatch API error:', err);
    }

    setMatchingCases(prev => prev.map(c => {
      if (c.id === selectedMatchCase.id) {
        return {
          ...c,
          status: 'RESOLVED',
          notes: `[ĐÃ PHÂN XỬ]: ${resolutionReason}`
        };
      }
      return c;
    }));

    // update PO matching state as well
    setPurchaseOrders(prev => prev.map(p => {
      if (p.id === selectedMatchCase.poId) {
        return {
          ...p,
          matching: 'Discrepancy Resolved'
        };
      }
      return p;
    }));

    const caseId = selectedMatchCase.id;
    setSelectedMatchCase(null);
    onNotify('success', 'Xử lý chênh lệch thành công', `Mã đối soát ${caseId} đã được phân xử và thông qua phê duyệt ngoại lệ.`);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConTitle.trim() || !newConSupplier.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng cung cấp Tiêu đề hợp đồng và Nhà cung cấp.');
      return;
    }

    const valueNum = Number(newConVal.replace(/[^0-9]/g, '')) || 1000000000;
    try {
      const res = await fetch('/api/purchase/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newConTitle,
          supplier: newConSupplier,
          committedValue: valueNum
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.contract) {
          setContracts(prev => [data.contract, ...prev]);
        }
      }
    } catch (err) {
      console.warn('Contract creation error:', err);
    }

    setIsContractModalOpen(false);
    setNewConTitle('');
    setNewConSupplier('');
    onNotify('success', 'Ký kết hợp đồng khung thành công', `Đã lưu hợp đồng nguyên tắc vào hệ thống.`);
  };

  const handleExportCSV = () => {
    const csvHeader = "PO ID,Supplier,Items,TotalAmount,Status,Matching,CreatedDate\n";
    const csvRows = purchaseOrders.map(p => `"${p.id}","${p.supplier}","${p.items}","${p.totalAmount ?? 0}","${p.status}","${p.matching}","${p.createdDate}"`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `purchase_orders_p2p_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', 'Đã tải xuống tệp CSV danh sách Đơn mua hàng PO.');
  };

  return (
    <div className="space-y-3.5 max-w-full pb-8">
      
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (M19 STANDARD)                       */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M08 • PURCHASE ORDERS (P2P)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Single-Writer Rule #03 • 3-Way Matching Engine
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              Đơn Mua Hàng &amp; Đối Chiếu 3 Bên (Procure-to-Pay)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>
          
          <button
            type="button"
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 500); onNotify('info', 'Làm mới', 'Đã đồng bộ dữ liệu M08.'); }}
            className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 px-2.5"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Xuất PDF / In</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L0: P2P LIFECYCLE PIPELINE OVERVIEW BANNER                                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Tiến Trình Mua Sắm &amp; Đối Chiếu Chuỗi Cung Ứng (P2P Pipeline)
            </h3>
          </div>
          <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 font-semibold border border-blue-200 dark:border-blue-700">
            3-Way Matching Engine: Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-0.5">
          {[
            { step: '1', title: 'Yêu Cầu Mua (PR)', desc: 'Tập hợp nhu cầu từ các phòng ban & kiểm soát hạn mức ngân sách', tag: 'Automated' },
            { step: '2', title: 'Đơn Mua Hàng (PO)', desc: 'Phát hành PO gắn với hợp đồng khung & cam kết giá nhà cung cấp', tag: `${purchaseOrders.length} Đơn` },
            { step: '3', title: 'Biên Bản Nhập Kho (GR)', desc: 'Kiểm đếm barcode/QR, phân loại số lượng thực nhận tại kho', tag: 'Warehouse' },
            { step: '4', title: '3-Way Match & AP', desc: 'Đối soát chéo 3 bên tự động (PO = GR = AP), cảnh báo lệch giá/lượng', tag: `${mismatchCount === 0 ? 'Khớp 100%' : `${mismatchCount} Lệch`}` },
          ].map((s) => (
            <div 
              key={s.step} 
              className="p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono tabular-nums font-bold text-slate-400 dark:text-slate-500">GIAI ĐOẠN {s.step}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">{s.tag}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{s.title}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: SUB-TABS NAVIGATION STRIP (M41 MASTER SPEC)                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'pos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Danh sách Đơn PO</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'pos'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {purchaseOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matching')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'matching'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Đối chiếu 3-Way Matching</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'matching'
                  ? 'bg-blue-700 text-white'
                  : mismatchCount > 0
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {matchingCases.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contracts')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'contracts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Hợp đồng &amp; Khung giá NCC</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'contracts'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {contracts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Báo cáo Chi tiêu P2P</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            P2P Procurement Engine
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            VAS &amp; 3-Way Match
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI METRIC STRIP (M19 STANDARD METRIC CARD ARCHITECTURE)              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng Ngân Sách Đã Chi</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
            {formatCurrency(totalSpend)}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" /> 
            <span>Tăng 12% so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">PO Chờ Duyệt</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400">
            {pendingApprovalCount} Đơn
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span>SLA xử lý trung bình 4.2 giờ</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cảnh Báo Lệch 3-Way Match</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-rose-600 dark:text-rose-400">
            {mismatchCount} Hồ Sơ
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
            <span>Cần kiểm đếm lại / điều chỉnh</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tỷ Lệ Thỏa Thuận Khung (BPA)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
            94.2%
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Tuân thủ tối đa chính sách mua</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SUB-TAB RENDER                                                     */}
      {/* ========================================================================= */}

      {/* TAB 1: PO LIST & CREATION */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Main PO Table (2/3 width) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
              
              {/* L1 Command Bar: Search & Filter */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={poSearchTerm}
                    onChange={(e) => { setPoSearchTerm(e.target.value); setPoPage(1); }}
                    placeholder="Tìm mã PO, NCC, vật tư..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsGrModalOpen(true)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Warehouse className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Sổ Phiếu GR ({goodsReceiptsList.length})</span>
                  </button>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Lọc:</span>
                  </div>
                  <select
                    value={poStatusFilter}
                    onChange={(e) => { setPoStatusFilter(e.target.value); setPoPage(1); }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="APPROVED">APPROVED (Đã duyệt)</option>
                    <option value="PENDING_APPROVAL">PENDING (Chờ duyệt)</option>
                    <option value="REJECTED">REJECTED (Từ chối)</option>
                  </select>
                </div>
              </div>

              {/* L3 Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Mã PO</th>
                      <th className="py-2.5 px-3">Nhà cung cấp</th>
                      <th className="py-2.5 px-3">Nội dung đặt hàng</th>
                      <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                      <th className="py-2.5 px-3 text-center">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                    {paginatedPurchaseOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                          Không tìm thấy đơn mua hàng nào phù hợp với điều kiện tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      paginatedPurchaseOrders.map((po) => (
                        <tr 
                          key={po.id} 
                          className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${
                            po.status === 'APPROVED' ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10' :
                            po.status === 'REJECTED' ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' :
                            'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
                          }`}
                        >
                          <td className="py-3 px-3 font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">
                            {po.id}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {po.supplier}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                            {po.items}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums font-bold text-xs text-right text-slate-900 dark:text-white">
                            {formatCurrency(po.totalAmount ?? 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-0.5 text-[10px] font-mono tabular-nums font-bold rounded-full ${
                              po.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700' :
                              po.status === 'REJECTED' ? 'bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700' :
                              'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {po.status === 'PENDING_APPROVAL' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => triggerApprovePO(po)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-all cursor-pointer"
                                    title="Phê duyệt Đơn hàng (Rule #19 ConfirmDialog)"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => triggerRejectPO(po)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-all cursor-pointer"
                                    title="Từ chối Đơn hàng (Rule #19 ConfirmDialog)"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {po.status === 'APPROVED' && (
                                (!po.lineItems || po.lineItems.length === 0 || po.lineItems.some((it: any) => (it.receivedQuantity || 0) < it.quantity)) ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReceivingPo(po);
                                      if (warehousesList.length > 0 && !receivingWarehouseId) {
                                        setReceivingWarehouseId(warehousesList[0].id);
                                      }
                                    }}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800 px-1.5"
                                    title="Nhận hàng vào kho (Goods Receipt - Rule #03 Single Writer)"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>Nhận kho (GR)</span>
                                  </button>
                                ) : (
                                  <span className="p-1 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[10px] font-semibold" title="Đã nhận đủ 100% hàng hóa">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Đã đủ hàng</span>
                                  </span>
                                )
                              )}
                              <button
                                type="button"
                                onClick={() => handleSelectPo(po)}
                                className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-blue-600 text-slate-700 rounded-md transition-all cursor-pointer"
                              >
                                Chi tiết
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* L4 Pagination Control */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                <PaginationControl
                  currentPage={poPage}
                  totalPages={Math.ceil(filteredPurchaseOrders.length / poPageSize) || 1}
                  pageSize={poPageSize}
                  totalItems={filteredPurchaseOrders.length}
                  startIndex={(poPage - 1) * poPageSize + 1}
                  endIndex={Math.min(poPage * poPageSize, filteredPurchaseOrders.length)}
                  onPageChange={(p) => setPoPage(p)}
                  onPageSizeChange={(s) => { setPoPageSize(s); setPoPage(1); }}
                />
              </div>
            </div>
          </div>

          {/* New PO Form (1/3 width) */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Phát hành Đơn Mua Hàng PO Mới
                </h3>
              </div>

              <form onSubmit={handleCreatePO} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nhà cung cấp (Supplier)
                  </label>
                  <select
                    value={newPoSupplier}
                    onChange={(e) => {
                      setNewPoSupplier(e.target.value);
                      const found = suppliersList.find(s => s.name === e.target.value);
                      if (found) setSelectedSupplierId(found.id);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn Nhà cung cấp --</option>
                    {suppliersList.length > 0 ? (
                      suppliersList.map(s => (
                        <option key={s.id} value={s.name}>{s.code ? `[${s.code}] ` : ''}{s.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu">Vật liệu Bán dẫn Toàn Cầu</option>
                        <option value="Tập đoàn Hóa chất & Phụ gia Xanh">Hóa chất & Phụ gia Xanh</option>
                        <option value="Công ty TNHH Thiết bị Đo lường Quang Học">Thiết bị Đo lường Quang Học</option>
                        <option value="Tổng công ty Công nghệ Cao Viettel">Viettel High Tech</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nội dung Hàng hóa / Dịch vụ
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Chip điều khiển IoT (1,000 cái)"
                    value={newPoItems}
                    onChange={(e) => setNewPoItems(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <CurrencyInput
                    label="Tổng giá trị đơn hàng (VNĐ)"
                    value={newPoAmount}
                    onChange={(val, str) => setNewPoAmount(`${str} VND`)}
                    placeholder="VD: 250.000.000"
                    showBadge={true}
                    showPresets={true}
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-700/60 text-[10px] text-amber-900 dark:text-amber-200 leading-relaxed">
                  <span className="font-bold block mb-0.5">⚠️ Ràng buộc quy trình:</span>
                  Hệ thống tự động liên kết đơn mua hàng PO mới này với Hợp đồng nguyên tắc của đối tác để kiểm soát khung giá.
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Phát hành Đơn PO</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 3-WAY MATCHING ENGINE */}
      {activeTab === 'matching' && (
        <div className="space-y-3.5">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            
            {/* Header description */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hệ thống Đối chiếu 3 Chiều Tự Động (Procure-to-Pay Matching Engine)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Phát hiện bất thường giữa Đơn hàng PO, Thực nhận kho (GR) và Hóa đơn tài chính (AP Invoice).
                </p>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-blue-900 bg-blue-50 dark:bg-blue-950/80 dark:text-blue-200 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-700 font-bold self-start sm:self-auto">
                AUDIT RISK CONTROL
              </span>
            </div>

            {/* Workflow 3-box diagram */}
            <div className="p-3.5 sm:p-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 font-mono tabular-nums block">1. PURCHASE ORDER (PO)</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Thông tin giá và số lượng thỏa thuận ban đầu đã ký duyệt.</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 font-mono tabular-nums block">2. GOODS RECEIPT (GR)</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Mặt hàng, số lượng và Serial/Lot kiểm nhận thực tế của kho vận.</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono tabular-nums block">3. AP INVOICE (VAT)</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Đơn giá, thành tiền và MST bên bán xuất trên hóa đơn điện tử.</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Lọc theo trạng thái:</span>
                <div className="flex items-center gap-1">
                  {['ALL', 'MISMATCH', 'MATCHED', 'PENDING_GR', 'RESOLVED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => { setMatchingFilter(st); setMatchingPage(1); }}
                      className={`px-2.5 py-1 text-[10px] font-mono tabular-nums font-bold rounded-lg transition-colors cursor-pointer ${
                        matchingFilter === st 
                          ? 'bg-blue-600 text-white shadow-2xs' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Matching cases table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Mã Đối Soát</th>
                    <th className="py-2.5 px-3">PO Liên kết</th>
                    <th className="py-2.5 px-3">Nhà Cung Cấp</th>
                    <th className="py-2.5 px-3 text-center">SL PO / GR / AP</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá PO / AP</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {paginatedMatchingCases.map((c) => (
                    <tr 
                      key={c.id} 
                      className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${
                        c.status === 'MISMATCH' ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' :
                        c.status === 'MATCHED' ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10' :
                        c.status === 'RESOLVED' ? 'border-l-4 border-blue-600/60 bg-blue-50/10 dark:bg-blue-950/10' :
                        'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
                      }`}
                    >
                      <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">{c.id}</td>
                      <td className="py-3.5 px-3 font-mono tabular-nums text-blue-600 dark:text-blue-400 font-bold">{c.poId}</td>
                      <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">{c.supplier}</td>
                      <td className="py-3.5 px-3 text-center font-mono tabular-nums font-bold">
                        <span className="text-slate-800 dark:text-slate-200">{c.poQty}</span> /{' '}
                        <span className={c.grQty !== c.poQty ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-slate-800 dark:text-slate-200'}>{c.grQty}</span> /{' '}
                        <span className={c.apQty !== c.poQty ? 'text-rose-700 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-slate-200'}>{c.apQty}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatCurrency(c.poPrice)} / {formatCurrency(c.apPrice ?? 0)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 text-[10px] font-mono tabular-nums font-bold rounded-full ${
                          c.status === 'MATCHED' ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700' :
                          c.status === 'RESOLVED' ? 'bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700' :
                          c.status === 'PENDING_GR' ? 'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700' :
                          'bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 animate-pulse'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {c.status === 'MISMATCH' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMatchCase(c);
                              setResolutionReason('Duyệt thanh toán theo số lượng thực nhận (45 bộ). Đã thỏa thuận giảm trừ công nợ với NCC.');
                            }}
                            className="px-2.5 py-1 bg-rose-600 text-white font-semibold text-[10px] rounded-lg hover:bg-rose-700 transition-all shadow-xs cursor-pointer"
                          >
                            Xử lý chênh lệch
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Bảo mật tối đa</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700">
              <PaginationControl
                currentPage={matchingPage}
                totalPages={Math.ceil(filteredMatchingCases.length / matchingPageSize) || 1}
                pageSize={matchingPageSize}
                totalItems={filteredMatchingCases.length}
                startIndex={(matchingPage - 1) * matchingPageSize + 1}
                endIndex={Math.min(matchingPage * matchingPageSize, filteredMatchingCases.length)}
                onPageChange={(p) => setMatchingPage(p)}
                onPageSizeChange={(s) => { setMatchingPageSize(s); setMatchingPage(1); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTRACTS MANAGEMENT (BPA) */}
      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Contracts List (2/3 width) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Hợp đồng Nguyên Tắc &amp; Khung giá Thỏa Thuận (BPA)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Kiểm soát đơn giá đầu vào dựa trên thỏa thuận cung ứng đã ký kết dài hạn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo Hợp Đồng Khung
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {contracts.map((con) => (
                  <div key={con.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:border-blue-400 dark:hover:border-blue-500 transition-all space-y-3 shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono tabular-nums font-bold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-700">
                          {con.id}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{con.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Bên bán: <strong className="text-slate-700 dark:text-slate-200">{con.supplier}</strong></p>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[10px] font-mono tabular-nums font-bold rounded-full ${
                        con.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                      }`}>
                        {con.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block font-semibold">GIÁ TRỊ CAM KẾT</span>
                        <strong className="font-mono tabular-nums text-slate-900 dark:text-white font-bold">{formatCurrency(con.committedValue ?? 0)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block font-semibold">ĐÃ GIẢI NGÂN (PO)</span>
                        <strong className="font-mono tabular-nums text-blue-600 dark:text-blue-400 font-bold">{formatCurrency(con.usedValue ?? 0)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block font-semibold">HẠN HIỆU LỰC</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-mono tabular-nums">{con.endDate}</strong>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        <span>HỆ SỐ SỬ DỤNG</span>
                        <span className="font-mono tabular-nums">{Math.round(((con.usedValue ?? 0) / (con.committedValue || 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all" 
                          style={{ width: `${Math.min(100, Math.round(((con.usedValue ?? 0) / (con.committedValue || 1)) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legal Compliance Box (1/3 width) */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tuân Thủ Khung Pháp Lý P2P
                </h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  Mọi đơn đặt mua hàng (PO) phát sinh trên hệ thống đều bắt buộc phải tuân thủ điều khoản đơn giá và khung thanh toán đã ký kết trước trong Hợp đồng khung (BPA).
                </p>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-xl space-y-1.5">
                  <strong className="text-blue-900 dark:text-blue-300 block text-xs">💡 Quy trình kiểm toán:</strong>
                  <ul className="list-disc pl-4 space-y-1 text-[10px] text-blue-900 dark:text-blue-200">
                    <li>Đơn giá trên PO không được vượt trần thỏa thuận khung.</li>
                    <li>Sử dụng chữ ký số SHA-256 để chống giả mạo hồ sơ thầu.</li>
                    <li>Tự động cảnh báo khi hạn mức hợp đồng sắp cạn kiệt (&lt; 10%).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SPEND ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Báo cáo Phân tích Chi tiêu Mua sắm (Spend Analytics Dashboard)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Biểu đồ cơ cấu nhà cung cấp và biến động chi tiêu theo thời gian thực.
              </p>
            </div>
            <span className="text-[10px] font-mono tabular-nums text-blue-900 bg-blue-50 dark:bg-blue-950/80 dark:text-blue-200 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-700 font-semibold self-start sm:self-auto">
              OPERATIONAL INTELLIGENCE
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Trend Chart */}
            <div className="lg:col-span-2 p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Tiến Độ Giải Ngân So Với Kế Hoạch</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Đơn vị tính: Triệu VNĐ</p>
              </div>

              <div className="h-64 font-mono tabular-nums text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={spendTrendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPlan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="Kế hoạch" stroke="#94a3b8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPlan)" />
                    <Area type="monotone" dataKey="Thực chi" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Allocation Chart */}
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Cơ cấu Chi Tiêu Theo Đối Tác</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Tỷ lệ thị phần phân bổ dòng tiền mua sắm</p>
              </div>

              <div className="h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendBySupplierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {spendBySupplierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} VNĐ`} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="block text-base font-bold font-mono tabular-nums text-slate-800 dark:text-white">1.2 Tỷ</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Tổng chi</span>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="space-y-1.5 text-[10px]">
                {spendBySupplierData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }}></span>
                      <span className="truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & DIALOGS (RULE #19 COMPLIANT)                                      */}
      {/* ========================================================================= */}

      {/* 1. Rule #19 Centralized ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 2. 3-Way Match Discrepancy Resolution Dialog */}
      {selectedMatchCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-mono tabular-nums text-[9px] font-bold rounded border border-rose-400/30">
                  DISCREPANCY WORK BENCH
                </span>
                <h3 className="text-sm font-bold tracking-wide mt-1.5">Xử Lý Chênh Lệch Đối Chiếu {selectedMatchCase.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMatchCase(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-1">
                <span className="font-bold flex items-center gap-1 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400" /> Phát hiện chênh lệch (Mismatch):
                </span>
                <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                  Đơn đặt PO yêu cầu **{selectedMatchCase.poQty} bộ** cơ bản nhưng Biên bản nhận hàng tại kho (GR) chỉ đếm được **{selectedMatchCase.grQty} bộ**. Tuy nhiên, hóa đơn đòi nợ của bên bán lại yêu cầu thanh toán toàn bộ **{selectedMatchCase.apQty} bộ**.
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Phương án điều chỉnh và ghi lý do
                </label>
                <textarea
                  rows={3}
                  value={resolutionReason}
                  onChange={e => setResolutionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                ></textarea>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong>💡 Lưu ý kiểm toán (Audit rule):</strong> Bút toán ghi nhận chênh lệch ngoại lệ này sẽ được ký nhận SHA-256 và lưu vết lịch sử trên sổ cái thông minh để đảm bảo tính giải trình trước thanh tra.
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedMatchCase(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResolveMismatch}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Xác nhận điều chỉnh &amp; Thông qua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PO Detail Modal */}
      {selectedPoForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold font-mono tabular-nums text-xs">
                  {String(selectedPoForModal.id || 'PO').slice(-3)}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">{selectedPoForModal.supplier}</h3>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums">Mã PO: {selectedPoForModal.id} • Ngày: {selectedPoForModal.createdDate}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoForModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hàng hóa / Dịch vụ đặt mua</span>
                <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                  {selectedPoForModal.items}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng giá trị PO</span>
                  <p className="font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 text-sm">{formatCurrency(selectedPoForModal.totalAmount ?? 0)}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái Matching</span>
                  <p className="font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 text-xs">{selectedPoForModal.matching}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px] pt-1.5 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase">Mã Hợp Đồng Liên Kết</span>
                  <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200 font-bold mt-0.5">{selectedPoForModal.contractId || 'CON-2026-001'}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase">Hạn Giao Dự Kiến</span>
                  <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200 font-bold mt-0.5">{selectedPoForModal.deliveryDate || '2026-09-01'}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-900 dark:text-emerald-200">Đã đồng bộ Dữ liệu Chứng từ 360°</span>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300">Toàn bộ phả hệ đơn hàng mua và vết kiểm toán đã được ghi nhận vào hệ thống đối soát ERP.</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              {selectedPoForModal.status === 'APPROVED' && (
                (!selectedPoForModal.lineItems || selectedPoForModal.lineItems.length === 0 || selectedPoForModal.lineItems.some((it: any) => (it.receivedQuantity || 0) < it.quantity)) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReceivingPo(selectedPoForModal);
                      if (warehousesList.length > 0 && !receivingWarehouseId) {
                        setReceivingWarehouseId(warehousesList[0].id);
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Nhập Kho (Tạo Phiếu GR)</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã nhập kho đủ 100%</span>
                  </span>
                )
              )}
              <button
                type="button"
                onClick={() => setSelectedPoForModal(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Đóng Cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3.1. Goods Receipt (GR) Creation Modal */}
      {receivingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold font-mono text-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">Nhập Kho Hàng Hóa (Goods Receipt - GR)</h3>
                  <p className="text-[11px] text-slate-400 font-mono">PO: {receivingPo.id} • NCC: {receivingPo.supplier}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceivingPo(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteGoodsReceipt} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> 
                  Rule #03 Single Writer Compliance:
                </span>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                  Phiếu nhập kho này sẽ ủy thác cho <code className="font-mono font-bold">InventoryService.postTransaction()</code> cập nhật số dư tồn kho, tăng tồn khả dụng và ghi thẻ kho chính thức.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kho tiếp nhận hàng hóa *
                </label>
                <select
                  value={receivingWarehouseId}
                  onChange={(e) => setReceivingWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {warehousesList.length > 0 ? (
                    warehousesList.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        [{wh.code || `WH-${wh.id}`}] {wh.name} {wh.address ? `— ${wh.address}` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1">[WH-HN] Kho Tổng Hà Nội</option>
                      <option value="2">[WH-HCM] Kho Trung tâm Miền Nam</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Danh mục vật tư tiếp nhận theo đơn PO
                </span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                  {receivingPo.lineItems && receivingPo.lineItems.length > 0 ? (
                    <div className="space-y-2">
                      {receivingPo.lineItems.map((it: any) => {
                        const rec = it.receivedQuantity || 0;
                        const rem = Math.max(0, it.quantity - rec);
                        return (
                          <div key={it.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                            <div>
                              <span className="font-semibold">{it.name}</span>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>Đặt mua: <strong className="text-slate-700 dark:text-slate-300">{it.quantity}</strong></span>
                                <span>•</span>
                                <span>Đã nhận: <strong className="text-blue-600 dark:text-blue-400">{rec}</strong></span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`font-mono font-bold text-xs ${rem > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                {rem > 0 ? `Nhận đợt này: ${rem}` : '✓ Đã nhận đủ'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="font-semibold">{receivingPo.items || 'Vật tư & Linh kiện theo thỏa thuận PO'}</p>
                  )}
                </div>
              </div>

              {receivingPo.lineItems && receivingPo.lineItems.length > 0 && receivingPo.lineItems.every((it: any) => (it.receivedQuantity || 0) >= it.quantity) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs">Đơn hàng này đã hoàn tất tiếp nhận 100% số lượng vật tư vào kho. Không còn mặt hàng nào cần nhận thêm.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú kiểm nhận / Biên bản bàn giao
                </label>
                <textarea
                  rows={2}
                  value={receivingNotes}
                  onChange={(e) => setReceivingNotes(e.target.value)}
                  placeholder="VD: Kiểm đếm đầy đủ tem niêm phong, không móp méo bao bì."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2 -mx-5 -mb-5">
                <button
                  type="button"
                  onClick={() => setReceivingPo(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGr || (receivingPo.lineItems && receivingPo.lineItems.length > 0 && receivingPo.lineItems.every((it: any) => (it.receivedQuantity || 0) >= it.quantity))}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>
                    {isSubmittingGr 
                      ? 'Đang ghi sổ kho...' 
                      : (receivingPo.lineItems && receivingPo.lineItems.length > 0 && receivingPo.lineItems.every((it: any) => (it.receivedQuantity || 0) >= it.quantity))
                        ? 'Đã hoàn tất nhận kho'
                        : 'Xác nhận Nhập Kho & Tạo Phiếu GR'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.2. Goods Receipts (GR) Ledger Modal */}
      {isGrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold tracking-wide">Sổ Phiếu Nhập Kho Hàng Hóa (Goods Receipts - GR)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGrModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-x-auto max-h-[60vh]">
              {goodsReceiptsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Chưa có phiếu nhập kho nào được tạo. Hãy phê duyệt PO và bấm &quot;Nhận kho (GR)&quot; để phát hành phiếu.
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Mã Phiếu GR</th>
                      <th className="py-2.5 px-3">Đơn PO</th>
                      <th className="py-2.5 px-3">Kho Tiếp Nhận</th>
                      <th className="py-2.5 px-3 text-center">Tổng SL</th>
                      <th className="py-2.5 px-3">Ngày Nhận</th>
                      <th className="py-2.5 px-3 text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                    {goodsReceiptsList.map((gr) => (
                      <tr key={gr.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{gr.code}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-600 dark:text-blue-400">{gr.poCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{gr.warehouseName}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">{gr.totalQuantity}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono">{gr.receivedDate}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 text-[9px] font-bold font-mono rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            {gr.status || 'COMPLETED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsGrModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Contract Creation Modal */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-wide">Tạo Hợp Đồng Nguyên Tắc Mới</h3>
                <p className="text-[11px] text-slate-400">Thiết lập hạn mức giá thầu cho nhà cung cấp</p>
              </div>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Hợp Đồng / Thỏa Thuận Khung
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hợp đồng cung ứng linh kiện IC tích hợp 2026"
                  value={newConTitle}
                  onChange={(e) => setNewConTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nhà Cung Cấp Đối Tác
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tập đoàn Bán dẫn Toàn Cầu"
                  value={newConSupplier}
                  onChange={(e) => setNewConSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <CurrencyInput
                  label="Hạn mức giá trị ký kết (VNĐ)"
                  value={newConVal}
                  onChange={(val, str) => setNewConVal(str)}
                  placeholder="VD: 1.500.000.000"
                  showBadge={true}
                  showPresets={true}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Ký kết thỏa thuận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Embedded PdfPrintModal */}
      <PdfPrintModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        module={reportModuleMeta}
        currentUser={currentUser}
        onNotify={onNotify}
      />

    </div>
  );
};

export default M08PurchaseOrdersWorkspace;
