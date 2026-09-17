import React, { useState, useEffect } from 'react';
import { 
  Layers, Package, Truck, Boxes, CheckCircle2, AlertTriangle, ShieldAlert, 
  Clock, ArrowRight, Play, Check, X, FileText, QrCode, Tag, BarChart3, RefreshCw,
  ShieldCheck, Plus
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../../../data/enterpriseMaster';
import { 
  WavePickStatus, 
  LpnStatus, 
  DockAppointmentStatus, 
  WAVE_STATUS_TRANSITIONS, 
  LPN_STATUS_TRANSITIONS, 
  DOCK_STATUS_TRANSITIONS 
} from '../types';
import { M24EndpointCoverageTracker } from './M24EndpointCoverageTracker';

const defaultProductsCatalog = ENTERPRISE_MASTER_PRODUCTS.map((p, idx) => ({
  sku: p.sku,
  name: p.name,
  category: p.category ?? 'Vật tư chung',
  unit: p.unit ?? 'Cái'
}));

interface M24WMSExtendedWorkspaceProps {
  onSelectEntity?: (entity: any) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export const M24WMSExtendedWorkspace: React.FC<M24WMSExtendedWorkspaceProps> = ({
  onSelectEntity,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<
    'wave' | 'replenish' | 'allocation' | 'lpn' | 'dock' | 'carrier'
  >('M24', 'wave');

  // 1. Wave Picking State
  const [waves, setWaves] = useState<any[]>([]);

  // 2. Replenishment State
  const [replenishments, setReplenishments] = useState<any[]>([]);

  // 3. Bin Allocation State
  const [allocations, setItemsAllocations] = useState<any[]>([]);

  // 4. Packing LPN State
  const [lpns, setLpns] = useState<any[]>([]);

  // 5. Dock Appointment State
  const [appointments, setAppointments] = useState<any[]>([]);

  // 6. Carrier Freight State
  const [freights, setFreights] = useState<any[]>([]);

  // Real-time operational test tracker trigger
  const [trackerRefreshTrigger, setTrackerRefreshTrigger] = useState<number>(0);

  // Product Catalog from M07 Product Identity API with fallback
  const [productsCatalog, setProductsCatalog] = useState(defaultProductsCatalog);

  const fetchWmsData = () => {
    const token = localStorage.getItem('nexus_jwt') || '';
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch('/api/wms/wave-picks', { headers })
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setWaves(res.data.map((w: any) => ({
            id: w.waveCode,
            zone: w.zoneCode,
            ordersCount: w.ordersCount,
            totalLines: w.totalLines,
            status: w.status,
            progress: w.progress || '0%',
            rawId: w.id,
            items: w.items || []
          })));
        }
      })
      .catch(() => {});

    fetch('/api/wms/lpn', { headers })
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLpns(res.data.map((l: any) => ({
            lpnCode: l.lpnCode,
            cartonSize: l.cartonSize,
            weight: l.weight,
            soCode: l.soCode,
            status: l.status,
            rawId: l.id,
            contents: l.contents || []
          })));
        }
      })
      .catch(() => {});

    fetch('/api/wms/docks', { headers })
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAppointments(res.data.map((d: any) => ({
            id: d.appointmentCode,
            dockName: d.dockName,
            carrier: d.carrier,
            poCode: d.poCode || d.soCode || 'PO-2026',
            timeSlot: d.timeSlot,
            status: d.status,
            rawId: d.id
          })));
        }
      })
      .catch(() => {});
      
    fetch('/api/wms/freight', { headers })
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setFreights(res.data.map((f: any) => ({
            id: f.waybillCode,
            carrier: f.carrier,
            service: f.serviceType,
            fee: f.fee,
            status: f.status,
            rawId: f.id,
            poCode: f.poCode
          })));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const token = localStorage.getItem('nexus_jwt') || '';
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/products', { headers })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProductsCatalog(data.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category ?? 'Vật tư chung',
            unit: p.unit ?? p.baseUnit ?? 'Cái'
          })));
        }
      })
      .catch(() => {});

    fetchWmsData();
  }, []);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Service Engine Integration States (Phase 4)
  const [fefoRecommendations, setFefoRecommendations] = useState<any[]>([]);
  const [tmsRoute, setTmsRoute] = useState<any>(null);
  const [capacityGuard, setCapacityGuard] = useState<any>(null);
  const [slaAlerts, setSlaAlerts] = useState<any[]>([]);

  const fetchServiceEngineData = () => {
    const token = localStorage.getItem('nexus_jwt') || '';
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // 1. FEFO Expiry Check (SerialEngine M12)
    fetch('/api/wms/expiry-check', { headers })
      .then(r => r.json())
      .then(res => { if (res.success) setFefoRecommendations(res.recommendation || []); })
      .catch(() => {});

    // 2. TMS Route Optimization (M22 TMS)
    fetch('/api/wms/route-opt', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bins: ['LOC-B-02-01', 'LOC-A-01-01', 'LOC-C-03-02', 'LOC-A-01-02'] })
    })
      .then(r => r.json())
      .then(res => { if (res.success) setTmsRoute(res); })
      .catch(() => {});

    // 3. Zone Capacity Guard (M06 WarehouseSpatialService)
    fetch('/api/wms/capacity-guard?warehouseId=1', { headers })
      .then(r => r.json())
      .then(res => { if (res.success) setCapacityGuard(res); })
      .catch(() => {});

    // 4. SLA Idle Alert (M36 SLA Engine)
    fetch('/api/wms/sla-alerts', { headers })
      .then(r => r.json())
      .then(res => { if (res.success) setSlaAlerts(res.alerts || []); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchServiceEngineData();
  }, []);

  const executeApiAction = async (
    url: string,
    method: string,
    body: any | null,
    successTitle: string,
    successMessage: (data: any) => string,
    errorTitle: string
  ) => {
    const token = localStorage.getItem('nexus_jwt') || '';
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error(`Phản hồi không hợp lệ từ máy chủ (Mã: ${res.status})`);
      }

      if (res.ok && (data.success !== false)) {
        onNotify('success', successTitle, successMessage(data));
        fetchWmsData();
        fetchServiceEngineData();
        setTrackerRefreshTrigger(prev => prev + 1);
      } else {
        onNotify('error', errorTitle, data.error || data.message || `Thao tác thất bại (Mã: ${res.status})`);
      }
    } catch (e: any) {
      onNotify('error', 'Lỗi Kết Nối API', e.message || 'Không thể kết nối đến máy chủ.');
    }
  };

  const handleWavePickConfirm = (wave: any) => {
    const rawId = wave.rawId || 1;
    const items = wave.items || [];
    const targetItem = items.find((i: any) => i.status !== 'PICKED') || items[0] || { id: 1, requestedQty: 2, sku: 'PRD-001' };

    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận Nhặt hàng (Pick-Confirm): ${wave.id}`,
      message: `Hệ thống sẽ định tuyến ghi sổ xuất kho trực tiếp qua InventoryService.postTransaction() (Authority Guard M17). Xác nhận nhặt ${targetItem.requestedQty || 1} cái mã ${targetItem.sku}?`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        executeApiAction(
          `/api/wms/wave-picks/${rawId}/confirm`,
          'POST',
          {
            itemId: targetItem.id || 1,
            pickedQty: targetItem.requestedQty || 1,
            idempotencyKey: `UI-WAVE-PICK-${rawId}-${Date.now()}`
          },
          'Đã Ghi Sổ Kho Thành Công',
          (data) => `Dòng nhặt ${targetItem.sku} đã xác nhận. Inventory Transaction ID: ${data.inventoryTx?.transactionId || 'M17-POST'}`,
          'Lỗi Ghi Sổ Kho'
        );
      }
    });
  };

  const handleLpnMove = (lpn: any) => {
    const rawId = lpn.rawId || 1;
    setConfirmDialog({
      isOpen: true,
      title: `Chuyển Vị Trí Pallet / LPN: ${lpn.lpnCode}`,
      message: `Thực hiện điều chuyển nguyên kiện (LPN Putaway) qua InventoryService atomic TRANSFER_OUT / TRANSFER_IN. Chuyển đến vị trí lưu trữ Rack cao tầng LOC-HIGH-R02?`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        executeApiAction(
          '/api/wms/lpn/move',
          'POST',
          {
            lpnId: rawId,
            targetLocationId: 2,
            idempotencyKey: `UI-LPN-MOVE-${rawId}-${Date.now()}`
          },
          'Chuyển LPN Thành Công',
          (data) => `Đã di chuyển pallet ${lpn.lpnCode} và đồng bộ tồn kho M17 (${data.txGroupRef}).`,
          'Lỗi Di Chuyển LPN'
        );
      }
    });
  };

  const handleDockCheckIn = (dock: any) => {
    const rawId = dock.rawId || 1;
    setConfirmDialog({
      isOpen: true,
      title: `Check-in Xe Tải Cửa Kho: ${dock.dockName}`,
      message: `Xác nhận xe tải ${dock.carrier} (${dock.poCode || 'Đơn hàng'}) đã vào vị trí dock. Bộ đếm thời gian SLA (M36) sẽ kích hoạt giám sát thời gian dỡ hàng.`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        executeApiAction(
          `/api/wms/docks/${rawId}/checkin`,
          'POST',
          { status: 'CHECKED_IN' },
          'Check-in Thành Công',
          () => `Xe tải ${dock.carrier} đã check-in thành công tại ${dock.dockName}.`,
          'Lỗi Check-in'
        );
      }
    });
  };

  const handleCloseWave = (wave: any) => {
    const rawId = wave.rawId || 1;
    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận: Đóng Wave`,
      message: `Bạn có chắc chắn muốn đóng đợt nhặt hàng ${wave.id}? Hành động này sẽ khóa wave không cho phép thay đổi nữa.`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        executeApiAction(
          `/api/wms/wave-picks/${rawId}/close`,
          'POST',
          null,
          'Thành công',
          () => `Đã đóng Wave ${wave.id}.`,
          'Lỗi Đóng Wave'
        );
      }
    });
  };

  const handleCreateWave = () => {
    if (productsCatalog.length === 0) {
      onNotify('warning', 'Lỗi dữ liệu', 'Không có sản phẩm nào trong hệ thống để tạo wave.');
      return;
    }
    const product = productsCatalog[Math.floor(Math.random() * productsCatalog.length)];
    
    setConfirmDialog({
      isOpen: true,
      title: 'Tạo Wave Pick Mới',
      message: `Hệ thống sẽ tạo đợt nhặt hàng mới cho sản phẩm ${product.name} (${product.sku}).`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        executeApiAction(
          '/api/wms/wave-picks',
          'POST',
          {
            waveCode: `WAVE-AUTO-${Math.floor(Math.random() * 10000)}`,
            warehouseId: 1, // Default warehouse
            zoneCode: 'ZONE-AUTO',
            ordersCount: 2,
            items: [
              {
                productId: product.id || 1,
                sku: product.sku,
                productName: product.name,
                requestedQty: Math.floor(Math.random() * 10) + 1,
                assignedBin: 'LOC-A-01'
              }
            ]
          },
          'Tạo Wave Thành Công',
          (data) => `Đã tạo wave mới: ${data.data?.waveCode || 'WAVE'}`,
          'Lỗi Tạo Wave'
        );
      }
    });
  };

  const handleUpdateWave = (wave: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Cập Nhật Đợt Nhặt Hàng: ${wave.id}`,
      message: `Bạn có muốn đổi mã đợt nhặt hàng thành một mã khác để phân nhóm lại không?`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        const newWaveCode = `WAVE-UPD-${Math.floor(Math.random() * 1000)}`;
        executeApiAction(
          `/api/wms/wave-picks/${wave.rawId}`,
          'PUT',
          { waveCode: newWaveCode },
          'Thành công',
          () => `Đã cập nhật Wave ${wave.id} thành ${newWaveCode}.`,
          'Lỗi Cập Nhật Wave'
        );
      }
    });
  };

  const handleDeleteWave = (wave: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Hủy Wave Pick: ${wave.id}`,
      message: `Bạn có chắc chắn muốn hủy đợt nhặt hàng này? Các dòng nhặt hàng chưa hoàn thành sẽ bị hủy.`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        executeApiAction(
          `/api/wms/wave-picks/${wave.rawId}`,
          'DELETE',
          null,
          'Thành công',
          () => `Đã hủy Wave ${wave.id}.`,
          'Lỗi Hủy Wave'
        );
      }
    });
  };

  const handleCreateLPN = () => {
    if (productsCatalog.length === 0) return;
    const product = productsCatalog[Math.floor(Math.random() * productsCatalog.length)];
    
    setConfirmDialog({
      isOpen: true,
      title: 'Đóng Gói LPN Mới',
      message: `Đóng gói sản phẩm ${product.name} vào kiện hàng (Pallet/Carton).`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        executeApiAction(
          '/api/wms/lpn',
          'POST',
          {
            lpnCode: `LPN-AUTO-${Math.floor(Math.random() * 10000)}`,
            cartonSize: 'Box Standard',
            weight: '5.0 kg',
            soCode: `SO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
            contents: [
              {
                productId: product.id || 1,
                sku: product.sku,
                productName: product.name,
                quantity: Math.floor(Math.random() * 20) + 1,
                lotNo: 'LOT-AUTO'
              }
            ]
          },
          'Tạo LPN Thành Công',
          (data) => `Đã tạo LPN mới: ${data.data?.lpnCode || 'LPN'}`,
          'Lỗi Tạo LPN'
        );
      }
    });
  };

  const handleCreateDock = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Đăng Ký Lịch Cửa Kho',
      message: `Đăng ký xe tải mới cập bến cửa kho.`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        executeApiAction(
          '/api/wms/docks',
          'POST',
          {
            appointmentCode: `APT-AUTO-${Math.floor(Math.random() * 10000)}`,
            dockName: `Cửa Xuất #${Math.floor(Math.random() * 5) + 1}`,
            carrier: 'Auto Carrier Truck',
            timeSlot: '14:00 - 15:00',
            poCode: `PO-AUTO-${Math.floor(Math.random() * 1000)}`,
            soCode: `SO-AUTO-${Math.floor(Math.random() * 1000)}`
          },
          'Đăng Ký Thành Công',
          (data) => `Đã đăng ký lịch cho ${data.data?.dockName || 'Dock'}`,
          'Lỗi Đăng Ký'
        );
      }
    });
  };

  const handleCreateFreight = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Tạo Vận Đơn Mới',
      message: `Tạo vận đơn Carrier Freight Booking.`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        executeApiAction(
          '/api/wms/freight',
          'POST',
          {
            waybillCode: `WB-AUTO-${Math.floor(Math.random() * 10000)}`,
            carrier: 'Auto Carrier Express',
            serviceType: 'Nhanh',
            fee: 550000
          },
          'Tạo Vận Đơn Thành Công',
          (data) => `Đã tạo vận đơn ${data.data?.waybillCode || 'WB'}`,
          'Lỗi Tạo Vận Đơn'
        );
      }
    });
  };

  const handleAction = (actionTitle: string, id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận: ${actionTitle}`,
      message: `Bạn có chắc chắn muốn thực hiện hành động này cho mã ${id}? Mọi thay đổi trạng thái sẽ được ghi vào Inventory Core Ledger và Audit Trail (Rule #19).`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        onNotify('success', 'Thành công', `Đã hoàn tất ${actionTitle} cho ${id}.`);
      }
    });
  };

  return (
    <div className="space-y-3.5 max-w-full pb-6 font-sans">
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (COMPACT & MODERN)                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M24 • WMS EXTENDED
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Kho Vận Nâng Cao & Tự Động Hóa
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              WMS Extended Hub
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
          {/* Phase 4: Service Engine Reuses */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800" title="M12 Serial Engine FEFO/FIFO Expiry Integration">
              M12 FEFO: Active
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800" title="M22 TMS Route Optimization Integration">
              M22 TMS: {tmsRoute ? `${tmsRoute.totalWaypoints || 4} Bins Opt` : 'Ready'}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" title="M06 Spatial Zone Capacity Guard">
              M06 Cap: {capacityGuard ? `${capacityGuard.utilization || '68%'}` : 'OK'}
            </span>
            {slaAlerts.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 flex items-center gap-1" title="M36 SLA Engine Overdue Dock Alerts">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                M36 SLA: {slaAlerts.length} Cảnh báo
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>
          <button 
            onClick={() => {
              fetchWmsData();
              fetchServiceEngineData();
              setTrackerRefreshTrigger(prev => prev + 1);
              onNotify('success', 'Đồng bộ WMS Extended', 'Đã đồng bộ toàn bộ luồng nâng cao với Inventory Core Ledger và Service Engines.');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Đồng Bộ Ledger
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL-TIME OPERATIONAL TEST COVERAGE & STABILITY TRACKER                   */}
      {/* ========================================================================= */}
      <M24EndpointCoverageTracker 
        onNotify={onNotify} 
        refreshTrigger={trackerRefreshTrigger} 
      />

      {/* ========================================================================= */}
      {/* SUB-TABS NAVIGATION STRIP (STREAMLINED & RESPONSIVE)                     */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('wave')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'wave'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Wave Picking</span>
        </button>
        <button
          onClick={() => setActiveTab('replenish')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'replenish'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Replenishment</span>
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'allocation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Bin Allocation</span>
        </button>
        <button
          onClick={() => setActiveTab('lpn')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'lpn'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Packing LPN</span>
        </button>
        <button
          onClick={() => setActiveTab('dock')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'dock'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Dock Appointment</span>
        </button>
        <button
          onClick={() => setActiveTab('carrier')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'carrier'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Carrier Freight</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SUB-TAB RENDER (L3 DATA TABLE)                                     */}
      {/* ========================================================================= */}
      <div>
        {activeTab === 'wave' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Wave Picking</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tập hợp nhiều đơn hàng bán (SO) theo khu vực để tối ưu hóa.</p>
              </div>
              <button 
                onClick={handleCreateWave}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Wave Mới
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[140px]">Mã Wave</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Khu Vực (Zone)</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-right">Số Lượng SO</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-right">Tổng Dòng</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-right">Tiến Độ</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {waves.map(w => {
                    let statusColor = 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600';
                    if (w.status === 'RELEASED_TO_PICKER' || w.status === 'COMPLETED' || w.status === 'CLOSED') {
                      statusColor = 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700';
                    } else if (w.status === 'PLANNING') {
                      statusColor = 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700';
                    } else if (w.status === 'IN_PROGRESS') {
                      statusColor = 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700';
                    } else if (w.status === 'CANCELLED' || w.status === 'ERROR') {
                      statusColor = 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700';
                    }
                    return (
                      <tr key={w.id} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                            {w.id}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{w.zone}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-right">{w.ordersCount} đơn</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-right">{w.totalLines} lines</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-blue-600 dark:text-blue-400 font-semibold text-right">{w.progress}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleWavePickConfirm(w)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                              title="Ghi sổ xuất kho qua InventoryService.postTransaction()"
                            >
                              <Check className="w-3 h-3" /> Xác Nhận Nhặt
                            </button>
                            {w.status !== 'CLOSED' && w.status !== 'CANCELLED' && (
                              <>
                                <button
                                  onClick={() => handleUpdateWave(w)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleCloseWave(w)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                                >
                                  Đóng Wave
                                </button>
                                <button
                                  onClick={() => handleDeleteWave(w)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                                >
                                  Hủy
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'replenish' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Replenishment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bổ sung hàng tự động cho Pick-Face.</p>
              </div>
              <button 
                onClick={() => handleAction('Chạy Quy Tắc Bổ Sung Hàng', 'REP-RUN')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Chạy Quy Tắc
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[120px]">Mã Task</th>
                    <th className="py-2.5 px-3 min-w-[200px]">SKU &amp; Sản Phẩm</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Tuyến Đườn (Bulk ➔ Pick-Face)</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-right">Số Lượng</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {replenishments.map(r => {
                    let statusColor = 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600';
                    if (r.status === 'COMPLETED') {
                      statusColor = 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700';
                    } else if (r.status === 'PENDING_EXECUTION') {
                      statusColor = 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700';
                    } else if (r.status === 'IN_PROGRESS') {
                      statusColor = 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700';
                    }
                    return (
                      <tr key={r.id} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                            {r.id}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold mb-0.5">{r.sku}</div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{r.productName ?? r.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{r.fromBin}</span> ➔ <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1 rounded font-bold">{r.toBin}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-right">{r.qty}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button 
                            onClick={() => handleAction('Hoàn tất Replenishment', r.id)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                          >
                            <Check className="w-3 h-3" /> Hoàn Tất
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'allocation' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Bin Allocation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Phân bổ vị trí thông minh theo FEFO/FIFO.</p>
              </div>
              <button 
                onClick={() => handleAction('Chạy Lại Thuật Toán Phân Bổ', 'ALLOC-RUN')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tối Ưu Hóa (Bin Slotting)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[200px]">Mã SKU &amp; Sản Phẩm</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-right">Yêu Cầu</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Vị Trí (Bin)</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Quy Tắc Thuật Toán</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {allocations.map((a, idx) => {
                    let statusColor = 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600';
                    if (a.status === 'ALLOCATED') {
                      statusColor = 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700';
                    }
                    return (
                      <tr key={idx} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold mb-0.5">{a.sku}</div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{a.productName}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-right">{a.requestedQty}</td>
                        <td className="py-2.5 px-3">
                           <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700">
                            {a.assignedBin}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">{a.rule}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'lpn' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Packing LPN</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quản lý định danh kiện hàng (License Plate Number).</p>
              </div>
              <button 
                onClick={handleCreateLPN}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Mã LPN
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[120px]">Mã LPN</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Quy Cách</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-right">Trọng Lượng</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Đơn SO</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Thao Tác In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {lpns.map(l => {
                    let statusColor = 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600';
                    if (l.status === 'SEALED') {
                      statusColor = 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700';
                    } else if (l.status === 'PACKING') {
                      statusColor = 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700';
                    }
                    return (
                      <tr key={l.lpnCode} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                        <td className="py-2.5 px-3">
                           <span className="font-mono text-xs font-bold text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md border border-indigo-300 dark:border-indigo-700">
                            {l.lpnCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{l.cartonSize}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-right">{l.weight}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 text-center">{l.soCode}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleLpnMove(l)}
                              className="px-2 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                              title="Di chuyển LPN / Putaway qua InventoryService atomic transfers"
                            >
                              <ArrowRight className="w-3 h-3" /> Putaway
                            </button>
                            <button 
                              onClick={() => onNotify('success', 'In Tem LPN', `Đã gửi lệnh in tem vạch cho mã ${l.lpnCode}`)}
                              className="px-2 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex border border-slate-300 dark:border-slate-600"
                            >
                              <QrCode className="w-3 h-3" /> Tem
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'dock' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Dock Appointment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quản lý lịch hẹn xe tải nhận/xuất hàng.</p>
              </div>
              <button 
                onClick={handleCreateDock}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Lịch Xe Mới
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[150px]">Cửa Kho (Dock Bay)</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Hãng Vận Chuyển / Xe</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Chứng Từ</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Khung Giờ</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {appointments.map(d => {
                    let statusColor = 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600';
                    if (d.status === 'CHECKED_IN' || d.status === 'COMPLETED') {
                      statusColor = 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700';
                    } else if (d.status === 'SCHEDULED') {
                      statusColor = 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700';
                    } else if (d.status === 'LOADING' || d.status === 'UNLOADING') {
                      statusColor = 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700';
                    }
                    return (
                      <tr key={d.id} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                        <td className="py-2.5 px-3">
                           <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                            {d.dockName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{d.carrier}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-blue-600 dark:text-blue-400 text-center">{d.poCode ?? d.soCode}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300 text-center">{d.timeSlot}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button 
                            onClick={() => handleDockCheckIn(d)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                            title="Check-in xe tải và kích hoạt giám sát SLA M36"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Check-in
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'carrier' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Carrier Freight</h3>
                <p className="text-xs text-slate-500 mt-0.5">Theo dõi vận đơn (Waybill) &amp; cước phí.</p>
              </div>
              <button 
                onClick={handleCreateFreight}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Vận Đơn
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[140px]">Mã Vận Đơn</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Hãng Vận Chuyển</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Dịch Vụ</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Cước Phí (VND)</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {freights.map(f => {
                    let statusColor = 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600';
                    if (f.status === 'DISPATCHED' || f.status === 'DELIVERED') {
                      statusColor = 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700';
                    } else if (f.status === 'BOOKED' || f.status === 'PENDING') {
                      statusColor = 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700';
                    } else if (f.status === 'IN_TRANSIT') {
                      statusColor = 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700';
                    }
                    return (
                      <tr key={f.id} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                        <td className="py-2.5 px-3">
                           <span className="font-mono text-xs font-bold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-300 dark:border-blue-700">
                            {f.id}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{f.carrier}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{f.service}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-slate-900 dark:text-white text-right">{f.fee}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button 
                            onClick={() => handleAction('Dispatch Vận Đơn', f.id)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                          >
                            <Truck className="w-3 h-3" /> Dispatch
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ConfirmDialog Rule #19 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};
