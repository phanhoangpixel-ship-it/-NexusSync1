import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, Boxes, MapPin, Plus, Edit, Trash2, Printer, QrCode, AlertTriangle, 
  ShieldAlert, CheckCircle2, RefreshCw, ChevronRight, ChevronDown, Scale, Thermometer,
  ShieldCheck, ArrowUpRight, Search, Filter, X
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

export interface SpatialNode {
  id: number;
  warehouseId: number;
  type: 'ZONE' | 'AISLE' | 'RACK' | 'SHELF' | 'BIN';
  parentId: number | null;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  zoneType: 'GENERAL' | 'DRY' | 'COLD' | 'BULKY' | 'QUARANTINE' | 'HAZMAT';
  maxWeightCapacity: number;
  currentWeight: number;
  weightUtilizationPct: number;
  maxVolumeCapacity: number;
  currentVolume: number;
  volumeUtilizationPct: number;
  barcode?: string | null;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  humidityMax?: number | null;
  isPicking: boolean;
  isReceiving: boolean;
  isQuarantine: boolean;
  isDamaged: boolean;
  children?: SpatialNode[];
}

interface WarehouseSpatialTopologyViewProps {
  warehouseId: number;
  warehouseName: string;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const WarehouseSpatialTopologyView: React.FC<WarehouseSpatialTopologyViewProps> = ({
  warehouseId,
  warehouseName,
  onNotify
}) => {
  const [treeData, setTreeData] = useState<SpatialNode[]>([]);
  const [flatLocations, setFlatLocations] = useState<SpatialNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<SpatialNode | null>(null);
  const [filterZoneType, setFilterZoneType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingNode, setEditingNode] = useState<SpatialNode | null>(null);
  const [modalParentId, setModalParentId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<'ZONE' | 'AISLE' | 'RACK' | 'SHELF' | 'BIN'>('ZONE');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printNode, setPrintNode] = useState<SpatialNode | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    zoneType: 'GENERAL',
    maxWeightCapacity: 1000,
    maxVolumeCapacity: 5,
    temperatureMin: '',
    temperatureMax: '',
    isPicking: true,
    isReceiving: false,
    isQuarantine: false
  });

  // ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {},
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ'
  });

  const loadTopology = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('nexus_jwt') || '';
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [treeRes, flatRes] = await Promise.all([
        fetch(`/api/warehouse-locations/tree/${warehouseId}`, { headers }),
        fetch(`/api/warehouse-locations?warehouseId=${warehouseId}`, { headers })
      ]);

      if (!treeRes.ok) throw new Error('Không thể tải cấu trúc cây không gian kho');
      const tree: SpatialNode[] = await treeRes.json();
      const flat: SpatialNode[] = flatRes.ok ? await flatRes.json() : [];

      setTreeData(tree);
      setFlatLocations(flat);

      // Auto expand root zones and aisles
      const autoExpand: Record<number, boolean> = {};
      tree.forEach(z => {
        autoExpand[z.id] = true;
        if (z.children) {
          z.children.forEach(a => {
            autoExpand[a.id] = true;
          });
        }
      });
      setExpandedNodes(autoExpand);
    } catch (err: any) {
      onNotify('error', 'Lỗi tải cấu trúc kho', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId, onNotify]);

  useEffect(() => {
    loadTopology();
  }, [loadTopology]);

  const toggleExpand = (nodeId: number) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleOpenAddModal = (parentId: number | null, suggestedType: 'ZONE' | 'AISLE' | 'RACK' | 'SHELF' | 'BIN') => {
    setEditingNode(null);
    setModalParentId(parentId);
    setModalType(suggestedType);
    setFormData({
      code: '',
      name: '',
      description: '',
      zoneType: 'GENERAL',
      maxWeightCapacity: suggestedType === 'ZONE' ? 25000 : suggestedType === 'AISLE' ? 12000 : suggestedType === 'RACK' ? 5000 : 1200,
      maxVolumeCapacity: suggestedType === 'ZONE' ? 120 : suggestedType === 'AISLE' ? 60 : suggestedType === 'RACK' ? 25 : 4,
      temperatureMin: '',
      temperatureMax: '',
      isPicking: true,
      isReceiving: false,
      isQuarantine: suggestedType === 'ZONE' && formData.zoneType === 'QUARANTINE'
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (node: SpatialNode) => {
    setEditingNode(node);
    setModalParentId(node.parentId);
    setModalType(node.type);
    setFormData({
      code: node.code,
      name: node.name,
      description: node.description || '',
      zoneType: node.zoneType || 'GENERAL',
      maxWeightCapacity: node.maxWeightCapacity || 1000,
      maxVolumeCapacity: node.maxVolumeCapacity || 5,
      temperatureMin: node.temperatureMin !== null && node.temperatureMin !== undefined ? String(node.temperatureMin) : '',
      temperatureMax: node.temperatureMax !== null && node.temperatureMax !== undefined ? String(node.temperatureMax) : '',
      isPicking: node.isPicking,
      isReceiving: node.isReceiving,
      isQuarantine: node.isQuarantine
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      onNotify('warning', 'Thiếu dữ liệu', 'Vui lòng nhập đầy đủ mã và tên vị trí.');
      return;
    }

    try {
      const token = localStorage.getItem('nexus_jwt') || '';
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const payload = {
        warehouseId,
        type: modalType,
        parentId: modalParentId,
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        zoneType: formData.zoneType,
        maxWeightCapacity: Number(formData.maxWeightCapacity) || 1000,
        maxVolumeCapacity: Number(formData.maxVolumeCapacity) || 5,
        temperatureMin: formData.temperatureMin ? Number(formData.temperatureMin) : null,
        temperatureMax: formData.temperatureMax ? Number(formData.temperatureMax) : null,
        isPicking: formData.isPicking,
        isReceiving: formData.isReceiving,
        isQuarantine: formData.isQuarantine
      };

      const url = editingNode ? `/api/warehouse-locations/${editingNode.id}` : '/api/warehouse-locations';
      const method = editingNode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Lỗi khi lưu vị trí');
      }

      onNotify('success', editingNode ? 'Cập nhật thành công' : 'Thêm mới thành công', `Đã lưu vị trí ${formData.code}`);
      setIsAddEditModalOpen(false);
      loadTopology();
    } catch (err: any) {
      onNotify('error', 'Thất bại', err.message);
    }
  };

  const handleDeleteLocation = (node: SpatialNode) => {
    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận xóa vị trí ${node.code}?`,
      message: `Hành động này sẽ xóa vĩnh viễn vị trí '${node.name}' (${node.type}). Vị trí phải trống và không có nhánh con cấp dưới.`,
      variant: 'danger',
      confirmText: 'Xóa Vĩnh Viễn',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('nexus_jwt') || '';
          const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
          const res = await fetch(`/api/warehouse-locations/${node.id}`, { method: 'DELETE', headers });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || 'Không thể xóa vị trí');
          }
          onNotify('success', 'Đã xóa vị trí', `Đã xóa thành công vị trí ${node.code}`);
          loadTopology();
        } catch (err: any) {
          onNotify('error', 'Lỗi khi xóa', err.message);
        }
      }
    });
  };

  // Metrics computation
  const totalBins = flatLocations.filter(l => l.type === 'BIN').length;
  const totalRacks = flatLocations.filter(l => l.type === 'RACK').length;
  const totalZones = flatLocations.filter(l => l.type === 'ZONE').length;
  const totalCurrentWeight = flatLocations.filter(l => l.type === 'ZONE').reduce((acc, z) => acc + (z.currentWeight || 0), 0);
  const totalMaxWeight = flatLocations.filter(l => l.type === 'ZONE').reduce((acc, z) => acc + (z.maxWeightCapacity || 0), 0);
  const overallWeightPct = totalMaxWeight > 0 ? Number(((totalCurrentWeight / totalMaxWeight) * 100).toFixed(1)) : 0;
  const overloadAlertCount = flatLocations.filter(l => l.weightUtilizationPct >= 90).length;

  const getZoneBadge = (zoneType: string) => {
    switch (zoneType) {
      case 'COLD':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800"><Thermometer className="w-3 h-3" /> LẠNH 2-8°C</span>;
      case 'DRY':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">KHÔ (DRY)</span>;
      case 'BULKY':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">CỒNG KỀNH (BULKY)</span>;
      case 'QUARANTINE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"><ShieldAlert className="w-3 h-3" /> CÁCH LY KCS</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">TIÊU CHUẨN</span>;
    }
  };

  const getWeightGauge = (currentKg: number, maxKg: number, pct: number) => {
    const isOverload = pct >= 90;
    const isWarning = pct >= 70 && pct < 90;
    const barColor = isOverload ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
    const textColor = isOverload ? 'text-rose-600 dark:text-rose-400 font-bold' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300';

    return (
      <div className="w-48 space-y-1">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-mono text-slate-500"><Scale className="w-2.5 h-2.5 inline mr-1" />{currentKg.toLocaleString()} / {maxKg.toLocaleString()} kg</span>
          <span className={`font-mono tabular-nums ${textColor}`}>{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng Khu Vực (Zones)</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">{totalZones} Zones</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng Giá Kệ (Racks)</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">{totalRacks} Racks</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng Ô Kệ (Bins)</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">{totalBins} Bins</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tải Trọng Toàn Kho</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">{totalCurrentWeight.toLocaleString()} kg</div>
            <span className="text-[10px] text-slate-400 font-mono">Định mức: {totalMaxWeight.toLocaleString()} kg ({overallWeightPct}%)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-amber-600">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cảnh Báo Tải Trọng</span>
            <div className={`text-xl font-bold font-mono mt-1 ${overloadAlertCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {overloadAlertCount} Điểm Nóng
            </div>
            <span className="text-[10px] text-slate-400">{overloadAlertCount > 0 ? 'Cần hạ tải hoặc san hàng' : 'Tất cả vị trí an toàn'}</span>
          </div>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${overloadAlertCount > 0 ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-600'}`}>
            {overloadAlertCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã vị trí, tên, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <select
            value={filterZoneType}
            onChange={(e) => setFilterZoneType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">Tất cả đặc tính Zone</option>
            <option value="DRY">Zone Khô (DRY)</option>
            <option value="COLD">Zone Lạnh Y Tế (COLD)</option>
            <option value="BULKY">Zone Cồng Kềnh (BULKY)</option>
            <option value="QUARANTINE">Zone Cách Ly (QUARANTINE)</option>
          </select>

          <button
            onClick={loadTopology}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm Mới
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddModal(null, 'ZONE')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm Khu Vực (Zone) Mới
          </button>
        </div>
      </div>

      {/* Main Hierarchical Tree View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Sơ Đồ Phân Cấp Không Gian: {warehouseName} (5 Tầng: Zone → Aisle → Rack → Bin)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click vào nút (+) để mở rộng hoặc gán vị trí con
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            <p className="text-xs">Đang nạp cấu trúc không gian và tính toán tải trọng an toàn...</p>
          </div>
        ) : treeData.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Boxes className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chưa có vị trí nào được cấu hình cho kho này</p>
            <button
              onClick={() => handleOpenAddModal(null, 'ZONE')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Khởi Tạo Zone Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {treeData
              .filter(zone => filterZoneType === 'ALL' || zone.zoneType === filterZoneType)
              .map(zone => (
                <div key={zone.id} className="p-4 space-y-3">
                  {/* ZONE HEADER */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(zone.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                      >
                        {expandedNodes[zone.id] ? <ChevronDown className="w-4 h-4 text-indigo-600" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{zone.code}</span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{zone.name}</span>
                          {getZoneBadge(zone.zoneType)}
                          {zone.isQuarantine && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded">IQC HOLD</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {zone.children?.length || 0} Dãy Aisles • {zone.description || 'Khu vực lưu trữ WMS'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {getWeightGauge(zone.currentWeight, zone.maxWeightCapacity, zone.weightUtilizationPct)}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenAddModal(zone.id, 'AISLE')}
                          title="Thêm Aisle vào Zone này"
                          className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> <span className="text-[10px] font-semibold">Thêm Aisle</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(zone)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(zone)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AISLES (Level 2) */}
                  {expandedNodes[zone.id] && zone.children && (
                    <div className="pl-6 space-y-3 border-l-2 border-indigo-100 dark:border-indigo-900/40 ml-4">
                      {zone.children.map(aisle => (
                        <div key={aisle.id} className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={() => toggleExpand(aisle.id)}
                                className="p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                              >
                                {expandedNodes[aisle.id] ? <ChevronDown className="w-3.5 h-3.5 text-blue-600" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                              <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{aisle.code}</span>
                              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{aisle.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({aisle.children?.length || 0} Racks)</span>
                            </div>

                            <div className="flex items-center gap-4">
                              {getWeightGauge(aisle.currentWeight, aisle.maxWeightCapacity, aisle.weightUtilizationPct)}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenAddModal(aisle.id, 'RACK')}
                                  title="Thêm Rack vào Aisle này"
                                  className="p-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> <span className="text-[10px] font-semibold">Thêm Rack</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEditModal(aisle)}
                                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLocation(aisle)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* RACKS (Level 3) & BINS (Level 4/5) */}
                          {expandedNodes[aisle.id] && aisle.children && (
                            <div className="pl-6 space-y-2 border-l-2 border-blue-100 dark:border-blue-900/40 ml-3">
                              {aisle.children.map(rack => (
                                <div key={rack.id} className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Boxes className="w-4 h-4 text-emerald-600" />
                                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{rack.code}</span>
                                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{rack.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      {getWeightGauge(rack.currentWeight, rack.maxWeightCapacity, rack.weightUtilizationPct)}
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleOpenAddModal(rack.id, 'BIN')}
                                          className="p-1 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                                        >
                                          <Plus className="w-3 h-3" /> <span className="text-[10px] font-semibold">Thêm Ô Bin</span>
                                        </button>
                                        <button onClick={() => handleOpenEditModal(rack)} className="p-1 text-slate-400 hover:text-slate-600">
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => handleDeleteLocation(rack)} className="p-1 text-slate-400 hover:text-rose-600">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* BINS MATRIX IN RACK */}
                                  {rack.children && rack.children.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                      {rack.children.map(bin => {
                                        const isOver = bin.weightUtilizationPct >= 90;
                                        const isNear = bin.weightUtilizationPct >= 70 && bin.weightUtilizationPct < 90;
                                        return (
                                          <div
                                            key={bin.id}
                                            className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-all ${
                                              isOver 
                                                ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' 
                                                : isNear 
                                                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' 
                                                : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{bin.code}</span>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => {
                                                    setPrintNode(bin);
                                                    setIsPrintModalOpen(true);
                                                  }}
                                                  title="In tem mã vạch Barcode/QR"
                                                  className="p-1 text-slate-400 hover:text-indigo-600"
                                                >
                                                  <BarcodeIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => handleOpenEditModal(bin)}
                                                  className="p-1 text-slate-400 hover:text-slate-600"
                                                >
                                                  <Edit className="w-3 h-3" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteLocation(bin)}
                                                  className="p-1 text-slate-400 hover:text-rose-600"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>

                                            <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-medium">
                                              {bin.name}
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                              <span>Tải: {bin.currentWeight} / {bin.maxWeightCapacity} kg</span>
                                              <span className={`font-bold tabular-nums ${isOver ? 'text-rose-600' : isNear ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                {bin.weightUtilizationPct}%
                                              </span>
                                            </div>

                                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                              <div
                                                className={`h-full ${isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(100, bin.weightUtilizationPct)}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT LOCATION                                              */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {editingNode ? `Chỉnh Sửa Vị Trí (${modalType}): ${editingNode.code}` : `Thêm Mới Vị Trí (${modalType})`}
              </h3>
              <button onClick={() => setIsAddEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Mã Định Danh ({modalType} Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={modalType === 'ZONE' ? 'ZONE-DRY-01' : modalType === 'AISLE' ? 'AISLE-A01' : modalType === 'RACK' ? 'RACK-A01-R01' : 'BIN-A01-01'}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Đặc Tính Khu Vực (Zone Type)
                  </label>
                  <select
                    value={formData.zoneType}
                    onChange={(e) => setFormData({ ...formData, zoneType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="GENERAL">Tiêu chuẩn (GENERAL)</option>
                    <option value="DRY">Khô / Nhiệt độ phòng (DRY)</option>
                    <option value="COLD">Kho Lạnh Y Tế 2-8°C (COLD)</option>
                    <option value="BULKY">Cồng Kềnh / Pallet Nặng (BULKY)</option>
                    <option value="QUARANTINE">Cách Ly KCS / IQC (QUARANTINE)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Tên Mô Tả Vị Trí <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Kệ tầng 1 dãy Aisle A01 mặt tiền"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Physical Limits */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  Giới Hạn Tải Trọng & Thể Tích An Toàn
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 dark:text-slate-300">Tải trọng tối đa (kg):</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.maxWeightCapacity}
                      onChange={(e) => setFormData({ ...formData, maxWeightCapacity: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 dark:text-slate-300">Thể tích tối đa (m³):</label>
                    <input
                      type="number"
                      required
                      min={0.1}
                      step={0.1}
                      value={formData.maxVolumeCapacity}
                      onChange={(e) => setFormData({ ...formData, maxVolumeCapacity: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {formData.zoneType === 'COLD' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-300">Nhiệt độ tối thiểu (°C):</label>
                      <input
                        type="number"
                        placeholder="Vd: 2"
                        value={formData.temperatureMin}
                        onChange={(e) => setFormData({ ...formData, temperatureMin: e.target.value })}
                        className="w-full px-3 py-1.5 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-300">Nhiệt độ tối đa (°C):</label>
                      <input
                        type="number"
                        placeholder="Vd: 8"
                        value={formData.temperatureMax}
                        onChange={(e) => setFormData({ ...formData, temperatureMax: e.target.value })}
                        className="w-full px-3 py-1.5 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPicking}
                    onChange={(e) => setFormData({ ...formData, isPicking: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Cho phép lấy hàng (Pick Face)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isQuarantine}
                    onChange={(e) => setFormData({ ...formData, isQuarantine: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Khu vực Cách Ly KCS</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {editingNode ? 'Lưu Cập Nhật' : 'Tạo Vị Trí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINT BARCODE / QR LABEL FOR BIN                                 */}
      {/* ========================================================================= */}
      {isPrintModalOpen && printNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Tem Nhãn Vị Trí Ô Kệ WMS (Bin Barcode)
              </h3>
              <button onClick={() => setIsPrintModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <div className="w-28 h-28 bg-white dark:bg-slate-900 mx-auto rounded-xl p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                <QrCode className="w-20 h-20 text-slate-900 dark:text-white" />
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {printNode.code}
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                  {printNode.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Zone: {printNode.zoneType} • Max Load: {printNode.maxWeightCapacity} kg • Barcode: {printNode.barcode || printNode.code}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  onNotify('success', 'Lệnh in hoàn tất', `Đã gửi tem nhãn ${printNode.code} tới máy in nhiệt Barcode.`);
                  setIsPrintModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                In Tem Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

function BarcodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14" />
    </svg>
  );
}
