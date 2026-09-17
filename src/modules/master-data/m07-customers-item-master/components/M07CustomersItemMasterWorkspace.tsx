import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useDynamicContainerHeight } from '../../../../hooks/useDynamicContainerHeight';
import { ENTERPRISE_MASTER_PRODUCTS, ENTERPRISE_MASTER_CUSTOMERS, EnterpriseProduct, EnterpriseCustomer } from '../../../../data/enterpriseMaster';
import { formatNumber, parseNumber } from '../../../../utils/numberFormat';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import {
  Users,
  Package,
  CreditCard,
  Tag,
  Plus,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  DollarSign,
  ShieldCheck,
  FileText,
  X,
  Database,
  Search,
  Filter,
  Layers,
  Activity,
  Edit3,
  Trash2,
  Boxes,
  MapPin,
  Warehouse,
  Upload,
  Camera
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { M07CustomersItemMasterWorkspaceProps } from './types';

export const M07CustomersItemMasterWorkspace: React.FC<M07CustomersItemMasterWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const { containerRef, minHeightStyle } = useDynamicContainerHeight();
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'customers' | 'items' | 'credit' | 'pricing' | 'identity-matrix'>('M07', 'items');
  const [activeItemSku, setActiveItemSku] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // B2B Customers State
  const [customers, setCustomers] = useState<any[]>(ENTERPRISE_MASTER_CUSTOMERS);

  // Item Master SKUs State with Real-Time Inventory Quantities
  const [items, setItems] = useState<EnterpriseProduct[]>(() => {
    try {
      const saved = localStorage.getItem('NEXUSSYNC_ERP_ITEM_MASTER');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return ENTERPRISE_MASTER_PRODUCTS;
  });

  // Save items to localStorage whenever items change for real-time persistence across M17 & M07
  useEffect(() => {
    try {
      localStorage.setItem('NEXUSSYNC_ERP_ITEM_MASTER', JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  // Item Master Filters & Search
  const [itemSearch, setItemSearch] = useState(() => {
    try {
      return localStorage.getItem('nexussync_m07_search_query') || '';
    } catch {
      return '';
    }
  });
  const [debouncedItemSearch, setDebouncedItemSearch] = useState(itemSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedItemSearch(itemSearch);
      try {
        localStorage.setItem('nexussync_m07_search_query', itemSearch);
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [itemSearch]);

  const [itemCategoryFilter, setItemCategoryFilter] = useState('ALL');

  // Định dạng số chuẩn ERP: dấu chấm (.) phân cách hàng nghìn, dấu phẩy (,) phân cách thập phân (VD: 1900000.5 -> "1.900.000,50")
  const formatThousands = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null || val === '') return '';
    return formatNumber(val);
  };

  // Trích xuất giá trị số chuẩn từ chuỗi định dạng (VD: "1.900.000,50" -> 1900000.5)
  const parseThousands = (val: string | number | undefined | null): number => {
    if (val === undefined || val === null || val === '') return 0;
    return parseNumber(val);
  };

  // Comprehensive New SKU Form States (Fully Aligned with M17 WMS Attributes)
  const [newSkuCode, setNewSkuCode] = useState('');
  const [newSkuName, setNewSkuName] = useState('');
  const [newSkuCategory, setNewSkuCategory] = useState('Thiết bị CNTT');
  const [newSkuUnit, setNewSkuUnit] = useState('Cái');
  const [newSkuCost, setNewSkuCost] = useState('1.500.000');
  const [newSkuWholesale, setNewSkuWholesale] = useState('1.900.000');
  const [newSkuRetail, setNewSkuRetail] = useState('2.100.000');
  const [newSkuStock, setNewSkuStock] = useState('50');
  const [newSkuSafetyStock, setNewSkuSafetyStock] = useState('10');
  const [newSkuSupplier, setNewSkuSupplier] = useState('Công ty Cổ phần Cung ứng Toàn Cầu');
  const [newSkuTechSpecs, setNewSkuTechSpecs] = useState('Thông số kỹ thuật tiêu chuẩn công nghiệp');
  const [newSkuWarehouseId, setNewSkuWarehouseId] = useState('WH-HCM-01');
  const [newSkuBinLocation, setNewSkuBinLocation] = useState('BIN-A1-15');
  const [newSkuLotNo, setNewSkuLotNo] = useState('LOT-2026-09');
  const [newSkuPackSpec, setNewSkuPackSpec] = useState('Thùng carton chống tĩnh điện ESD');
  const [newSkuStorage, setNewSkuStorage] = useState('Kho khô mát, Tránh ẩm, Nhiệt độ < 28°C');
  const [newSkuImageUrl, setNewSkuImageUrl] = useState('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&auto=format&fit=crop&q=80');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setNewSkuImageUrl(uploadEvent.target.result as string);
          onNotify('success', 'Đã tải ảnh lên', `Đã chọn tệp ${file.name} từ máy tính thành công.`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera capture states & handlers
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraTargetField, setCameraTargetField] = useState<'new' | 'edit'>('new');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Edit item modal states & handlers
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editSkuName, setEditSkuName] = useState('');
  const [editSkuCategory, setEditSkuCategory] = useState('');
  const [editSkuCost, setEditSkuCost] = useState('');
  const [editSkuWholesale, setEditSkuWholesale] = useState('');
  const [editSkuRetail, setEditSkuRetail] = useState('');
  const [editSkuStock, setEditSkuStock] = useState('');
  const [editSkuImageUrl, setEditSkuImageUrl] = useState('');

  const startCamera = (target: 'new' | 'edit') => {
    setCameraTargetField(target);
    setShowCameraModal(true);
    setCameraError(null);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setCameraError("Không thể truy cập camera. Vui lòng cấp quyền camera trong trình duyệt hoặc sử dụng tính năng tải tệp/link.");
      });
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (cameraTargetField === 'new') {
          setNewSkuImageUrl(dataUrl);
        } else {
          setEditSkuImageUrl(dataUrl);
        }
        onNotify('success', 'Chụp ảnh thành công', 'Ảnh sản phẩm đã được ghi nhận từ camera trực tiếp.');
        stopCamera();
      }
    }
  };

  const handleEditItemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setEditSkuImageUrl(uploadEvent.target.result as string);
          onNotify('success', 'Đã tải ảnh lên', `Đã chọn tệp ${file.name} cho SKU chỉnh sửa.`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = (it: any) => {
    setEditingItem(it);
    setEditSkuName(it.name || '');
    setEditSkuCategory(it.category || 'Thiết bị CNTT');
    setEditSkuCost(formatThousands(it.costPrice ?? 0));
    setEditSkuWholesale(formatThousands(it.wholesalePrice ?? 0));
    setEditSkuRetail(formatThousands(it.retailPrice ?? 0));
    setEditSkuStock(formatThousands(it.stock ?? 0));
    setEditSkuImageUrl(it.imageUrl || '');
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updatedItems = items.map(it => {
      if (it.sku === editingItem.sku) {
        return {
          ...it,
          name: editSkuName,
          category: editSkuCategory,
          costPrice: parseThousands(editSkuCost),
          wholesalePrice: parseThousands(editSkuWholesale),
          retailPrice: parseThousands(editSkuRetail),
          stock: parseThousands(editSkuStock),
          imageUrl: editSkuImageUrl
        };
      }
      return it;
    });
    setItems(updatedItems);
    setEditingItem(null);
    onNotify('success', 'Cập nhật SKU thành công', `Đã lưu thông tin và hình ảnh mới cho mặt hàng [${editingItem.sku}].`);
  };

  // New Customer Form States
  const [newCustName, setNewCustName] = useState('');
  const [newCustTax, setNewCustTax] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('1.500.000.000 ₫');

  const [selectedEntityForModal, setSelectedEntityForModal] = useState<any | null>(null);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên doanh nghiệp khách hàng B2B.');
      return;
    }
    const newCust = {
      id: `CUST-B2B-00${customers.length + 1}`,
      name: newCustName,
      taxCode: newCustTax || '031' + Math.floor(1000000 + Math.random() * 9000000),
      creditLimit: newCustLimit,
      outstanding: '0 ₫',
      status: 'ACTIVE',
      tier: 'Standard'
    };
    setCustomers([newCust, ...customers]);
    setNewCustName('');
    setNewCustTax('');
    setNewCustLimit('1.500.000.000 ₫');
    onNotify('success', 'Thêm khách hàng thành công', `Đã đăng ký khách hàng B2B: ${newCust.name}`);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkuName.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên sản phẩm SKU.');
      return;
    }
    const skuCode = newSkuCode.trim() || `SKU-PRD-${Math.floor(100 + Math.random() * 900)}` ;
    const warehouseNamesMap: Record<string, string> = {
      'WH-HCM-01': 'Kho Tổng Trung Tâm (TP.HCM)',
      'WH-HN-02': 'Kho Vận Trung Chuyển (Hà Nội)',
      'WH-DN-04': 'Kho Hàng Miền Trung (Đà Nẵng)',
      'WH-COLD-03': 'Kho Lạnh & Phòng Sạch (Bình Dương)'
    };

    const newItem: EnterpriseProduct = {
      sku: skuCode,
      name: newSkuName.trim(),
      category: newSkuCategory,
      unit: newSkuUnit,
      costPrice: parseThousands(newSkuCost) || 1000000,
      wholesalePrice: parseThousands(newSkuWholesale) || 1300000,
      retailPrice: parseThousands(newSkuRetail) || 1500000,
      stock: parseThousands(newSkuStock) || 50,
      safetyStock: parseThousands(newSkuSafetyStock) || 10,
      supplier: newSkuSupplier.trim() || 'Công ty Cổ phần Cung ứng Toàn Cầu',
      technicalSpecs: newSkuTechSpecs.trim() || 'Thông số kỹ thuật tiêu chuẩn công nghiệp',
      status: 'ACTIVE',
      warehouseId: newSkuWarehouseId,
      warehouseName: warehouseNamesMap[newSkuWarehouseId] || 'Kho Tổng Trung Tâm (TP.HCM)',
      binLocation: newSkuBinLocation.trim() || 'BIN-A1-01',
      lotNo: newSkuLotNo.trim() || 'LOT-2026-01',
      packSpec: newSkuPackSpec.trim() || 'Hộp tiêu chuẩn',
      storageCondition: newSkuStorage.trim() || 'Nhiệt độ phòng',
      imageUrl: newSkuImageUrl.trim() || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&auto=format&fit=crop&q=80'
    };

    setItems([newItem, ...items]);
    setNewSkuCode('');
    setNewSkuName('');
    setNewSkuCost('1.500.000');
    setNewSkuWholesale('1.900.000');
    setNewSkuRetail('2.100.000');
    setNewSkuStock('50');
    setNewSkuSafetyStock('10');
    setNewSkuImageUrl('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&auto=format&fit=crop&q=80');
    onNotify('success', 'Khai báo Item Master thành công', `Đã thêm mặt hàng [${newItem.sku}] ${newItem.name} vào Kho ${newItem.warehouseName} với tồn kho ${newItem.stock} ${newItem.unit}.`);
  };

  const handleDeleteItem = (sku: string) => {
    setConfirmDialog({
      title: 'Xác Nhận Xóa SKU Khỏi Master',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn mã SKU "${sku}" khỏi danh mục Item Master? Thao tác này sẽ đồng bộ gỡ bỏ khỏi toàn hệ thống ERP.`,
      confirmLabel: 'Xác Nhận Xóa',
      cancelLabel: 'Hủy',
      variant: 'danger',
      onConfirm: () => {
        setItems(prev => prev.filter(i => i.sku !== sku));
        setConfirmDialog(null);
        onNotify('success', 'Đã Xóa SKU', `Đã gỡ bỏ mã SKU ${sku} khỏi Item Master.`);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleExportExcelItems = () => {
    const dataToExport = items.map(i => ({
      'Mã SKU': i.sku,
      'Tên Sản Phẩm': i.name,
      'Ngành Hàng': i.category,
      'Đơn Vị Tính': i.unit,
      'Giá Vốn (VND)': i.costPrice,
      'Giá Buôn (VND)': i.wholesalePrice,
      'Giá Lẻ (VND)': i.retailPrice,
      'Tồn Kho Thực Tế': i.stock,
      'Tồn An Toàn (Safety Stock)': i.safetyStock ?? 10,
      'Nhà Cung Cấp': i.supplier || 'N/A',
      'Thông Số Kỹ Thuật': i.technicalSpecs || 'N/A',
      'Mã Kho': i.warehouseId || 'WH-HCM-01',
      'Vị Trí Ô Kệ': i.binLocation || 'BIN-A1-01',
      'Số Lô (Lot No)': i.lotNo || 'LOT-2026',
      'Quy Cách Đóng Gói': i.packSpec || 'Tiêu chuẩn',
      'Điều Kiện Bảo Quản': i.storageCondition || 'Bình thường',
      'Trạng Thái': i.status
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Item_Master_SKUs");
    XLSX.writeFile(wb, "NexusSync_Item_Master_SKUs.xlsx");
    onNotify('success', 'Xuất Excel Thành Công', 'Đã tải xuống danh mục Item Master SKU định dạng .xlsx');
  };

  const handleSelectCustomer = (cust: any) => {
    setSelectedEntityForModal(cust);
    onSelectEntity({
      type: 'CUSTOMER_B2B',
      id: cust.id,
      code: cust.id,
      title: cust.name,
      status: cust.status,
      lineage: [
        { id: cust.id, type: 'Khách hàng B2B', code: cust.id, relation: 'CURRENT_CUSTOMER', status: cust.status },
        { id: 'M07-CUST', type: 'Phân hệ M07', code: 'M07_CUSTOMERS', relation: 'PARENT_MODULE', status: 'ACTIVE' }
      ],
      auditTrail: [
        { id: 1, action: 'INSPECT_CUSTOMER_PROFILE', timestamp: new Date().toISOString(), user: 'admin', sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
      ],
      glEntries: []
    });
    onNotify('info', 'Đã tải chi tiết khách hàng', `Đã chọn khách hàng ${cust.name} vào Thanh Ngữ cảnh Đối Tượng.`);
  };

  // Filtered items
  const filteredItems = items.filter(it => {
    const matchSearch = debouncedItemSearch === '' || 
      it.sku.toLowerCase().includes(debouncedItemSearch.toLowerCase()) ||
      it.name.toLowerCase().includes(debouncedItemSearch.toLowerCase());
    const matchCat = itemCategoryFilter === 'ALL' || it.category === itemCategoryFilter;
    return matchSearch && matchCat;
  });

  const categoriesList = Array.from(new Set(items.map(i => i.category)));

  const pagination = usePagination({
    totalItems: filteredItems.length,
    defaultPageSize: 25,
    syncWithUrl: true,
  });

  const paginatedItems = useMemo(() => {
    return pagination.paginatedData(filteredItems);
  }, [filteredItems, pagination.paginatedData]);

  // Computed summary stats
  const totalSkuCount = items.length;
  const totalStockUnits = items.reduce((acc, curr) => acc + (curr.stock ?? 0), 0);
  const totalInventoryValue = items.reduce((acc, curr) => acc + (curr.stock ?? 0) * (curr.costPrice ?? 0), 0);
  const lowStockCount = items.filter(i => (i.stock ?? 0) <= 15).length;

  return (
    <div ref={containerRef} style={minHeightStyle} className="space-y-6 pb-12 relative">
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}

      {/* Header Banner (L0 Master Header) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30">
              M07 • ITEM MASTER & B2B COMMERCE SSOT
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Catalog Governance Seal</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1.5 tracking-tight">
            Danh Mục Sản Phẩm (Item Master) & Kho Vận M17
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Khai báo đầy đủ thông số SKU, tồn kho, vị trí ô kệ, số lô và điều kiện bảo quản đồng bộ hoàn toàn với phân hệ Kho Vận M17 và Bảng Giá M41.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 400); onNotify('info', 'Làm Mới Dữ Liệu', 'Đã đồng bộ thời gian thực Item Master.'); }}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Đồng Bộ Trực Tiếp</span>
          </button>
          <button
            onClick={handleExportExcelItems}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar (L2 KPI Summary Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
            <span>Tổng Mã SKU Master</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
            {totalSkuCount}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Active Catalog SSOT</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
            <span>Tổng Tồn Kho Thực Tế</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 mt-1">
            {totalStockUnits.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Real-Time Qty (M17)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
            <span>Tổng Giá Trị Tồn Kho</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
            {totalInventoryValue.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Kho Vận Valuation</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
            <span>SKU Cảnh Báo Tồn Thấp</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400 mt-1">
            {lowStockCount}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>≤ 15 Units Ngưỡng Sàn</span>
          </div>
        </div>
      </div>

      {/* ================= TẦNG L1: SUB-TABS NAVIGATION BAR (M41 MASTER SPEC) ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'items'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Danh mục Vật tư & Hàng hóa (SKU)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'items' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {items.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'customers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Khách Hàng B2B & Đại Lý</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'customers' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {customers.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credit')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'credit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Hạn Mức Tín Dụng & Công Nợ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'pricing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0" />
            <span>Bảng Giá B2B (Tier Pricing)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('identity-matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'identity-matrix'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Identity Matrix (SSOT)</span>
          </button>
        </div>

        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Master Data Graph Active</span>
          </div>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">
            M07 SSOT
          </span>
        </div>
      </div>

      {/* Tab 1: Item Master SKU with Real-Time Inventory */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Danh mục Sản phẩm SKU Item Master</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Hiển thị số lượng tồn kho thời gian thực liên thông cùng kho M17</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-bold">
                    Hiển thị {filteredItems.length} / {items.length} SKU
                  </span>
                </div>
              </div>

              {/* Filter & Command Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã SKU hoặc tên sản phẩm..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={itemCategoryFilter}
                    onChange={(e) => setItemCategoryFilter(e.target.value)}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="ALL">Tất cả ngành hàng</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Master Data Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        <th className="py-3 px-3 text-center">Hình Ảnh</th>
                        <th className="py-3 px-3">Mã SKU</th>
                        <th className="py-3 px-3">Tên Sản Phẩm</th>
                        <th className="py-3 px-3">Ngành Hàng</th>
                        <th className="py-3 px-3">Kho & Vị Trí Ô Kệ</th>
                        <th className="py-3 px-3 text-right">Giá Vốn</th>
                        <th className="py-3 px-3 text-right">Tồn Kho (M17)</th>
                        <th className="py-3 px-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80 text-xs">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                            Không tìm thấy mã SKU nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        paginatedItems.map((it) => {
                          const isLowStock = (it.stock ?? 0) <= 15;
                          const isActive = activeItemSku === it.sku;
                          return (
                            <tr 
                              key={it.sku}
                              onClick={() => setActiveItemSku(it.sku)}
                              className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${
                                isActive
                                  ? 'border-l-4 border-blue-600 bg-blue-50/60 dark:bg-blue-950/60 shadow-xs'
                                  : isLowStock
                                  ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                                  : 'border-l-4 border-transparent'
                              }`}
                            >
                              <td className="py-3.5 px-3 text-center">
                                {it.imageUrl ? (
                                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto shadow-2xs">
                                    <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
                                    <Package className="w-4 h-4" />
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-3">
                                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                  {it.sku}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">{it.name}</td>
                              <td className="py-3.5 px-3">
                                <span className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium">
                                  {it.category}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">{it.warehouseName ?? 'Kho Tổng (TP.HCM)'}</div>
                                <div className="text-emerald-600 dark:text-emerald-400 font-medium">Vị trí: {it.binLocation ?? 'BIN-A1-01'} | Lô: {it.lotNo ?? 'LOT-2026'}</div>
                              </td>
                              <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-right text-slate-600 dark:text-slate-300 text-xs">
                                {(it.costPrice ?? 0).toLocaleString('vi-VN')} ₫
                              </td>
                              <td className="py-3.5 px-3 font-mono tabular-nums text-right">
                                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                                  isLowStock 
                                    ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700' 
                                    : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                                }`}>
                                  {(it.stock ?? 0).toLocaleString('vi-VN')} {it.unit}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => openEditModal(it)}
                                    className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                                    title="Chỉnh sửa & Chụp ảnh"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(it.sku)}
                                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                    title="Xóa SKU"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                  <PaginationControl {...pagination} />
                </div>
              </div>
            </div>
          </div>

          {/* Comprehensive New SKU Form with all M17 fields */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-3">
                <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Khai Báo SKU Mới (Đủ Trường M17)</h3>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã SKU Chuẩn *</label>
                  <input
                    type="text"
                    placeholder="VD: SKU-ELC-999"
                    value={newSkuCode}
                    onChange={(e) => setNewSkuCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Sản Phẩm *</label>
                  <input
                    type="text"
                    placeholder="VD: Màn hình cảm ứng công nghiệp 15 Inch"
                    value={newSkuName}
                    onChange={(e) => setNewSkuName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngành Hàng</label>
                    <select
                      value={newSkuCategory}
                      onChange={(e) => setNewSkuCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Thiết bị CNTT">Thiết bị CNTT</option>
                      <option value="Phụ kiện">Phụ kiện</option>
                      <option value="Thiết bị cơ khí">Thiết bị cơ khí</option>
                      <option value="Cảm biến IoT">Cảm biến IoT</option>
                      <option value="Thiết bị điện">Thiết bị điện</option>
                      <option value="Nguyên vật liệu">Nguyên vật liệu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đơn Vị Tính</label>
                    <input
                      type="text"
                      value={newSkuUnit}
                      onChange={(e) => setNewSkuUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Vốn (đ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={newSkuCost}
                      onChange={(e) => setNewSkuCost(formatThousands(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Buôn (đ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={newSkuWholesale}
                      onChange={(e) => setNewSkuWholesale(formatThousands(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Lẻ (đ)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={newSkuRetail}
                      onChange={(e) => setNewSkuRetail(formatThousands(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tồn Khởi Đầu</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={newSkuStock}
                      onChange={(e) => setNewSkuStock(formatThousands(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tồn An Toàn (Safety Stock)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={newSkuSafetyStock}
                      onChange={(e) => setNewSkuSafetyStock(formatThousands(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nhà Cung Cấp</label>
                  <input
                    type="text"
                    placeholder="VD: Công ty Cổ phần Cung ứng Toàn Cầu"
                    value={newSkuSupplier}
                    onChange={(e) => setNewSkuSupplier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Thông Số Kỹ Thuật</label>
                  <input
                    type="text"
                    placeholder="VD: Core i7, RAM 16GB, SSD 512GB"
                    value={newSkuTechSpecs}
                    onChange={(e) => setNewSkuTechSpecs(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Extended M17 Attributes Inputs */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-3">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Thuộc Tính Kho Vận M17</span>
                  
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kho Trực Thuộc</label>
                    <select
                      value={newSkuWarehouseId}
                      onChange={(e) => setNewSkuWarehouseId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    >
                      <option value="WH-HCM-01">Kho Tổng Trung Tâm (TP.HCM)</option>
                      <option value="WH-HN-02">Kho Vận Trung Chuyển (Hà Nội)</option>
                      <option value="WH-DN-04">Kho Hàng Miền Trung (Đà Nẵng)</option>
                      <option value="WH-COLD-03">Kho Lạnh & Phòng Sạch (Bình Dương)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vị Trí Ô Kệ (Bin)</label>
                      <input
                        type="text"
                        placeholder="VD: BIN-A1-20"
                        value={newSkuBinLocation}
                        onChange={(e) => setNewSkuBinLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số Lô (Lot No.)</label>
                      <input
                        type="text"
                        placeholder="VD: LOT-2026-09"
                        value={newSkuLotNo}
                        onChange={(e) => setNewSkuLotNo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quy Cách Đóng Gói</label>
                    <input
                      type="text"
                      placeholder="VD: Thùng carton chống tĩnh điện ESD"
                      value={newSkuPackSpec}
                      onChange={(e) => setNewSkuPackSpec(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Điều Kiện Bảo Quản</label>
                    <input
                      type="text"
                      placeholder="VD: Kho khô mát, Tránh ẩm, Nhiệt độ < 28°C"
                      value={newSkuStorage}
                      onChange={(e) => setNewSkuStorage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hình Ảnh Sản Phẩm (Tải từ máy tính hoặc Link URL)</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Link URL, chọn tệp hoặc chụp camera"
                          value={newSkuImageUrl}
                          onChange={(e) => setNewSkuImageUrl(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <label className="px-2.5 py-2 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900 cursor-pointer flex items-center gap-1 shrink-0 transition-colors" title="Tải tệp từ máy">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải tệp</span>
                          <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => startCamera('new')}
                          className="px-2.5 py-2 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                          title="Mở camera chụp ảnh trực tiếp"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Chụp ảnh</span>
                        </button>
                      </div>
                      {newSkuImageUrl && (
                        <div className="flex items-center gap-2.5 pt-1 px-1">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
                            <img src={newSkuImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Xem trước:</span> Ảnh đại diện sẵn sàng đồng bộ
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  <Plus className="w-4 h-4" />
                  <span>Khai Báo SKU & Đồng Bộ Kho M17</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Customers B2B */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Danh Sách Đối Tác Khách Hàng B2B</h3>
                <span className="text-xs font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 font-bold">
                  Active B2B Accounts
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        <th className="py-3 px-3">Mã KH</th>
                        <th className="py-3 px-3">Tên Doanh Nghiệp</th>
                        <th className="py-3 px-3 text-right">Hạn Mức Tín Dụng</th>
                        <th className="py-3 px-3 text-right">Dư Nợ Hiện Tại</th>
                        <th className="py-3 px-3">Xếp Hạng</th>
                        <th className="py-3 px-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80 text-xs">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150">
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-600">
                              {c.id}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                          <td className="py-3.5 px-3 font-mono tabular-nums text-right font-bold text-slate-700 dark:text-slate-300">{c.creditLimit}</td>
                          <td className="py-3.5 px-3 font-mono tabular-nums text-right font-bold text-rose-600 dark:text-rose-400">{c.outstanding}</td>
                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {c.tier}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => handleSelectCustomer(c)}
                              className="px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white rounded-lg transition-all cursor-pointer shadow-2xs"
                            >
                              Hồ Sơ 360°
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-3">
                <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Đăng Ký Khách Hàng B2B Mới</h3>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Doanh Nghiệp / Đối Tác</label>
                  <input
                    type="text"
                    placeholder="VD: Công ty TNHH Giải pháp Số"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Số Thuế</label>
                  <input
                    type="text"
                    placeholder="031xxxxxxx"
                    value={newCustTax}
                    onChange={(e) => setNewCustTax(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hạn Mức Tín Dụng Đề Xuất</label>
                  <input
                    type="text"
                    value={newCustLimit}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setNewCustLimit(digits ? `${Number(digits).toLocaleString('vi-VN')} ₫` : '');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đăng Ký Tài Khoản B2B</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Credit Limits */}
      {activeTab === 'credit' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Kiểm Soát Hạn Mức Tín Dụng & Công Nợ B2B</h3>
            <span className="text-xs font-mono text-amber-700 bg-amber-50 dark:bg-amber-950/80 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 font-bold">
              Risk Management
            </span>
          </div>

          <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2 shadow-xs">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>Chính Sách Cấp Tín Dụng Tự Động</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Hệ thống tự động khóa đơn hàng (Block O2C Order) khi dư nợ thực tế của khách hàng B2B vượt quá 90% hạn mức tín dụng được phê duyệt bởi phòng Tài chính - Kế toán.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Pricing */}
      {activeTab === 'pricing' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Chính Sách Bảng Giá Phân Cấp B2B (Tier Pricing)</h3>
            <span className="text-xs font-mono text-purple-700 bg-purple-50 dark:bg-purple-950/80 dark:text-purple-300 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 font-bold">
              Price Matrix
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Tier 1: Strategic Partners</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Chiết khấu đặc biệt 18% trên giá niêm yết Item Master.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Tier 2: VIP Gold Accounts</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Chiết khấu thương mại 12% theo sản lượng tháng.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tier 3: Standard B2B</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Áp dụng đơn giá chuẩn buôn sỉ theo SKU.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Identity Matrix (SSOT) */}
      {activeTab === 'identity-matrix' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Identity Matrix (Mã Định Danh Cốt Lõi Đa Phân Hệ)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Xác thực tính toàn vẹn Item Identity: M07 = M41 = M17 = M13 = M08</p>
            </div>
            <span className="text-xs font-mono text-indigo-700 bg-indigo-50 dark:bg-indigo-950/80 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              SSOT Synchronized
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-3">Item Name</th>
                    <th className="py-3 px-3">M07 (Master)</th>
                    <th className="py-3 px-3">M41 (Pricing)</th>
                    <th className="py-3 px-3">M17 (Inventory)</th>
                    <th className="py-3 px-3">M13 (Sales)</th>
                    <th className="py-3 px-3">M08 (Purchase)</th>
                    <th className="py-3 px-3 text-right">Identity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80 text-xs font-mono">
                  <tr className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150">
                    <td className="py-3.5 px-3 font-sans font-semibold text-slate-900 dark:text-white">Laptop Business 14</td>
                    <td className="py-3.5 px-3 font-bold text-blue-600 dark:text-blue-400">PRD-001</td>
                    <td className="py-3.5 px-3 text-purple-600 dark:text-purple-400">PRD-001</td>
                    <td className="py-3.5 px-3 text-amber-600 dark:text-amber-400">PRD-001</td>
                    <td className="py-3.5 px-3 text-blue-700 dark:text-blue-300">PRD-001</td>
                    <td className="py-3.5 px-3 text-indigo-600 dark:text-indigo-400">PRD-001</td>
                    <td className="py-3.5 px-3 text-right font-sans">
                      <span className="px-2.5 py-0.5 text-[11px] font-bold font-mono rounded-full bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 border">
                        M07=41=17=13=08
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer 360 modal */}
      {selectedEntityForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-[#1e293b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold font-mono">
                  {selectedEntityForModal.id}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">{selectedEntityForModal.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Mã số thuế: {selectedEntityForModal.taxCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntityForModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Hạn Mức Tín Dụng</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">{selectedEntityForModal.creditLimit}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Dư Nợ Hiện Tại</span>
                  <p className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">{selectedEntityForModal.outstanding}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Đã Đồng Bộ Hồ Sơ Khách Hàng 360°</span>
                  <span className="text-[11px] opacity-90">Toàn bộ phả hệ tài khoản và vết kiểm toán đã được ghi nhận vào hệ thống đối soát ERP.</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedEntityForModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold">Chụp Ảnh Sản Phẩm Trực Tiếp</h3>
              </div>
              <button onClick={stopCamera} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {cameraError ? (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  {cameraError}
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Đặt sản phẩm trước camera và nhấn nút chụp để lưu ảnh đại diện SKU.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              {!cameraError && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Chụp Ảnh Ngay</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-[#1e293b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold font-mono text-xs">
                  {editingItem.sku}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">Cập Nhật Thông Tin SKU & Hình Ảnh</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Mã hàng: {editingItem.sku}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Sản Phẩm *</label>
                <input
                  type="text"
                  value={editSkuName}
                  onChange={(e) => setEditSkuName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngành Hàng</label>
                  <input
                    type="text"
                    value={editSkuCategory}
                    onChange={(e) => setEditSkuCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tồn Kho</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={editSkuStock}
                    onChange={(e) => setEditSkuStock(formatThousands(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Vốn (đ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={editSkuCost}
                    onChange={(e) => setEditSkuCost(formatThousands(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Buôn (đ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={editSkuWholesale}
                    onChange={(e) => setEditSkuWholesale(formatThousands(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Lẻ (đ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={editSkuRetail}
                    onChange={(e) => setEditSkuRetail(formatThousands(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hình Ảnh Sản Phẩm (URL, Tải Tệp hoặc Chụp Camera)</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập link URL hoặc chọn tệp / chụp camera"
                      value={editSkuImageUrl}
                      onChange={(e) => setEditSkuImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <label className="px-2.5 py-2 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900 cursor-pointer flex items-center gap-1 shrink-0 transition-colors" title="Tải tệp từ máy">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Tải tệp</span>
                      <input type="file" accept="image/*" onChange={handleEditItemFileChange} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => startCamera('edit')}
                      className="px-2.5 py-2 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                      title="Mở camera chụp ảnh trực tiếp"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Chụp ảnh</span>
                    </button>
                  </div>
                  {editSkuImageUrl && (
                    <div className="flex items-center gap-2.5 pt-1 px-1">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
                        <img src={editSkuImageUrl} alt="Edit Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Xem trước ảnh mới:</span> Sẵn sàng lưu cập nhật
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default M07CustomersItemMasterWorkspace;
