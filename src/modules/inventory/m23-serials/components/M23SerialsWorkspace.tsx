import React, { useState, useEffect } from 'react';
import { useWorkspaceAction } from "../../../../components/shell/DomainWorkspaceShell";
import {
  QrCode, Plus, Search, Filter, RefreshCw, CheckCircle2, AlertTriangle, 
  FileText, Calendar, ShieldCheck, Eye, Trash2, Layers, ArrowUpRight, Clock, 
  User, Wrench, ShieldAlert, Printer, Download, ArrowLeftRight, Check, X,
  MapPin, Building, Tag, Sparkles, Send, RotateCcw
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../../../data/enterpriseMaster';
import { jsPDF } from 'jspdf';
import { SerialTimelineEvent, SerialItem, SerialProfile, M23SerialsWorkspaceProps } from "./types";

const defaultProductsCatalog = ENTERPRISE_MASTER_PRODUCTS.map((p, idx) => ({
  sku: p.sku,
  name: p.name,
  category: p.category || 'Vật tư chung',
  unit: p.unit || 'Cái'
}));

const removeVietnameseTones = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};
export const M23SerialsWorkspace: React.FC<M23SerialsWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
  onNavigate
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [serials, setSerials] = useState<SerialItem[]>([
    {
      id: 'SN-001',
      serialNumber: 'IMEI-864201092837401',
      sku: 'SKU-PHN-012',
      productName: 'Điện thoại thông minh Enterprise Pro 5G',
      category: 'Thiết bị & Viễn thông',
      warehouse: 'WH-01 (Kho Tổng Hà Nội)',
      status: 'IN_STOCK',
      manufactureDate: '2026-06-15',
      warrantyMonths: 12,
      notes: 'Nhập kho từ đơn PO-2026-0089',
      timeline: [
        {
          id: 'TL-101',
          timestamp: '2026-06-15 08:30:00',
          type: 'CREATED',
          title: 'Nhập kho ban đầu (GRN)',
          description: 'Nhập kho thiết bị từ lô sản xuất theo đơn hàng PO-2026-0089',
          actor: 'Thủ kho Nguyễn Văn An',
          referenceDoc: 'PO-2026-0089',
          location: 'WH-01 (Kho Tổng Hà Nội)'
        },
        {
          id: 'TL-102',
          timestamp: '2026-06-15 10:15:00',
          type: 'QC_PASSED',
          title: 'Kiểm tra chất lượng IQC đạt chuẩn',
          description: 'Kiểm tra ngoại quan, kích hoạt màn hình và kết nối 5G đạt yêu cầu',
          actor: 'KCS Trần Thị Mai',
          referenceDoc: 'QC-2026-0412'
        }
      ]
    },
    {
      id: 'SN-002',
      serialNumber: 'IMEI-864201092837402',
      sku: 'SKU-PHN-012',
      productName: 'Điện thoại thông minh Enterprise Pro 5G',
      category: 'Thiết bị & Viễn thông',
      warehouse: 'WH-02 (Kho Chi nhánh Nam)',
      status: 'SOLD',
      customerName: 'Công ty Cổ phần Công nghệ Viettel',
      orderNumber: 'SO-2026-0120',
      warrantyStart: '2026-08-01',
      warrantyEnd: '2027-08-01',
      manufactureDate: '2026-06-15',
      warrantyMonths: 12,
      notes: 'Bán qua đơn hàng SO-2026-0120',
      timeline: [
        {
          id: 'TL-201',
          timestamp: '2026-06-15 08:30:00',
          type: 'CREATED',
          title: 'Nhập kho ban đầu',
          description: 'Nhập kho từ đơn hàng PO-2026-0089',
          actor: 'Thủ kho Nguyễn Văn An',
          referenceDoc: 'PO-2026-0089',
          location: 'WH-01 (Kho Tổng Hà Nội)'
        },
        {
          id: 'TL-202',
          timestamp: '2026-07-10 14:00:00',
          type: 'TRANSFER',
          title: 'Điều chuyển kho nội bộ',
          description: 'Điều chuyển từ Kho Tổng HN vào Kho Chi nhánh Nam để phục vụ giao hàng',
          actor: 'Điều phối viên Lê Văn Bình',
          referenceDoc: 'TRF-2026-0044',
          location: 'WH-02 (Kho Chi nhánh Nam)'
        },
        {
          id: 'TL-203',
          timestamp: '2026-08-01 09:20:00',
          type: 'SOLD',
          title: 'Xuất kho bán hàng',
          description: 'Bàn giao thiết bị kèm hóa đơn VAT cho Công ty CP Công nghệ Viettel',
          actor: 'NV Kinh doanh Hoàng Nam',
          referenceDoc: 'SO-2026-0120'
        },
        {
          id: 'TL-204',
          timestamp: '2026-08-01 09:25:00',
          type: 'WARRANTY_START',
          title: 'Kích hoạt bảo hành điện tử',
          description: 'Hệ thống tự động kích hoạt gói bảo hành 12 tháng chính hãng',
          actor: 'Hệ thống e-Warranty'
        }
      ]
    },
    {
      id: 'SN-003',
      serialNumber: 'MED-DEV-2026-9901',
      sku: 'SKU-MED-004',
      productName: 'Máy đo điện tâm đồ kỹ thuật số 12 đạo trình',
      category: 'Thiết bị Y tế',
      warehouse: 'WH-01 (Kho Tổng Hà Nội)',
      status: 'IN_STOCK',
      manufactureDate: '2026-05-10',
      warrantyMonths: 24,
      notes: 'Kiểm định chất lượng IQC đạt chuẩn',
      timeline: [
        {
          id: 'TL-301',
          timestamp: '2026-05-10 11:00:00',
          type: 'CREATED',
          title: 'Nhập kho thiết bị y tế chuẩn UDI',
          description: 'Nhập khẩu nguyên chiếc từ nhà máy BioMed CHLB Đức',
          actor: 'Thủ kho Y tế Phạm Hải',
          referenceDoc: 'PO-2026-0041'
        },
        {
          id: 'TL-302',
          timestamp: '2026-05-12 15:30:00',
          type: 'QC_PASSED',
          title: 'Hiệu chuẩn & Dán tem Viện Đo lường',
          description: 'Đã hoàn tất thử nghiệm xung điện tâm đồ đạt chuẩn CE/FDA',
          actor: 'Kỹ sư Lâm Tấn Đạt',
          referenceDoc: 'CERT-MED-9901'
        }
      ]
    },
    {
      id: 'SN-004',
      serialNumber: 'MED-DEV-2026-9902',
      sku: 'SKU-MED-004',
      productName: 'Máy đo điện tâm đồ kỹ thuật số 12 đạo trình',
      category: 'Thiết bị Y tế',
      warehouse: 'WH-01 (Kho Tổng Hà Nội)',
      status: 'WARRANTY',
      customerName: 'Bệnh viện Đa khoa Quốc tế Vinmec',
      orderNumber: 'SO-2026-0088',
      warrantyStart: '2026-03-12',
      warrantyEnd: '2028-03-12',
      manufactureDate: '2026-05-10',
      warrantyMonths: 24,
      notes: 'Đang bảo trì thay thế màn hình cảm ứng tại trạm kỹ thuật',
      timeline: [
        {
          id: 'TL-401',
          timestamp: '2026-03-12 09:10:00',
          type: 'SOLD',
          title: 'Bàn giao thiết bị bệnh viện',
          description: 'Bàn giao lắp đặt tại Khoa Hồi sức Cấp cứu - BV Vinmec',
          actor: 'Kỹ sư Triển khai Hoàng Nam',
          referenceDoc: 'SO-2026-0088'
        },
        {
          id: 'TL-402',
          timestamp: '2026-09-02 10:30:00',
          type: 'MAINTENANCE',
          title: 'Tiếp nhận yêu cầu bảo hành & sửa chữa',
          description: 'Khách hàng báo lỗi chớp màn hình cảm ứng. Tiếp nhận về trung tâm kỹ thuật bảo dưỡng',
          actor: 'Trưởng trạm DVKT Trần Văn Vũ',
          referenceDoc: 'RMA-2026-0019'
        }
      ]
    },
    {
      id: 'SN-005',
      serialNumber: 'MCH-SER-88210',
      sku: 'SKU-MCH-501',
      productName: 'Máy hàn quang tự động sợi cáp quang',
      category: 'Công cụ & Máy móc',
      warehouse: 'WH-03 (Kho Linh kiện CNC)',
      status: 'DEFECTIVE',
      manufactureDate: '2025-12-01',
      warrantyMonths: 12,
      notes: 'Lỗi bộ phóng điện hồ quang, chờ xuất trả nhà cung cấp',
      timeline: [
        {
          id: 'TL-501',
          timestamp: '2025-12-01 08:00:00',
          type: 'CREATED',
          title: 'Nhập kho dụng cụ & máy hàn',
          description: 'Nhập kho phục vụ thi công mạng ngoại vi',
          actor: 'Thủ kho Nguyễn Văn An'
        },
        {
          id: 'TL-502',
          timestamp: '2026-08-20 16:45:00',
          type: 'DEFECT',
          title: 'Ghi nhận lỗi hỏng kỹ thuật',
          description: 'Phát hiện suy hao hồ quang phóng điện không đạt chuẩn mối nối quang',
          actor: 'Tổ trưởng Cơ điện Vũ Hùng',
          referenceDoc: 'DEF-2026-008'
        }
      ]
    }
  ]);

  const [profiles, setProfiles] = useState<SerialProfile[]>([
    { id: 'PR-01', code: 'MEDICAL', name: 'Thiết bị Y tế & Đo lường', categoryType: 'MEDICAL', warrantyMonths: 24, prefix: 'MED-', description: 'Quản lý mã UDI, hiệu chuẩn định kỳ & kiểm định y tế.' },
    { id: 'PR-02', code: 'ELECTRONICS', name: 'Thiết bị Điện tử & IMEI', categoryType: 'ELECTRONICS', warrantyMonths: 12, prefix: 'IMEI-', description: 'Quản lý mã IMEI di động, MAC Address & bảo hành điện tử.' },
    { id: 'PR-03', code: 'MACHINERY', name: 'Máy móc & Thiết bị Công nghiệp', categoryType: 'MACHINERY', warrantyMonths: 18, prefix: 'MCH-', description: 'Quản lý số máy (Engine No), giờ vận hành & bảo trì định kỳ.' },
    { id: 'PR-04', code: 'CUSTOM', name: 'Linh kiện Chung / Tùy chỉnh', categoryType: 'CUSTOM', warrantyMonths: 12, prefix: 'SN-', description: 'Quy tắc mã hóa linh hoạt theo đơn hàng hoặc sản phẩm.' }
  ]);

  const [createProfileModal, setCreateProfileModal] = useState(false);
  const [newProfName, setNewProfName] = useState('');
  const [newProfCode, setNewProfCode] = useState('');
  const [newProfCategory, setNewProfCategory] = useState('CUSTOM');
  const [newProfPrefix, setNewProfPrefix] = useState('SN-');
  const [newProfWarranty, setNewProfWarranty] = useState('12');
  const [newProfDesc, setNewProfDesc] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [quickScanInput, setQuickScanInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'serials' | 'profiles' | 'history'>('M23', 'serials');
  const [internalCreateModal, setInternalCreateModal] = useState(false);

  // Inspector & Action Drawer State
  const [selectedSerial, setSelectedSerial] = useState<SerialItem | null>(null);
  const [actionModalType, setActionModalType] = useState<'SELL' | 'WARRANTY' | 'RESOLVE_WARRANTY' | 'TRANSFER' | 'DEFECTIVE' | null>(null);
  const [actionTargetSerial, setActionTargetSerial] = useState<SerialItem | null>(null);

  // Form states for actions
  const [actionCustomer, setActionCustomer] = useState('');
  const [actionOrderNo, setActionOrderNo] = useState('');
  const [actionWarehouse, setActionWarehouse] = useState('WH-02 (Kho Chi nhánh Nam)');
  const [actionReason, setActionReason] = useState('');

  // New serial form state
  const [newSerialNo, setNewSerialNo] = useState(`SN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newSku, setNewSku] = useState('SKU-PHN-012');
  const [newProductName, setNewProductName] = useState('Điện thoại thông minh Enterprise Pro 5G');
  const [newWarehouse, setNewWarehouse] = useState('WH-01 (Kho Tổng Hà Nội)');
  const [newNotes, setNewNotes] = useState('Đăng ký nhập kho mới');

  // Product Catalog from M07 Product Identity API with fallback
  const [productsCatalog, setProductsCatalog] = useState(defaultProductsCatalog);

  useEffect(() => {
    const token = localStorage.getItem('nexus_jwt') || '';
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/products', { headers })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProductsCatalog(data.map((p: any) => ({
            sku: p.sku,
            name: p.name,
            category: p.category || 'Vật tư chung',
            unit: p.unit || p.baseUnit || 'Cái'
          })));
        }
      })
      .catch(() => {});

    fetch('/api/serial-profiles', { headers })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProfiles(data);
        }
      })
      .catch(() => {});

    console.log('[M23 Diagnostics] Fetch Serials Payload / Request Initiated for endpoint: /api/serials');
    fetch('/api/serials', { headers })
      .then(async r => {
        const rawText = await r.text();
        let json;
        try {
          json = JSON.parse(rawText);
        } catch {
          json = rawText;
        }
        console.log('[M23 Diagnostics] Fetch Serials Raw Response:', {
          status: r.status,
          ok: r.ok,
          data: json
        });
        return json;
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSerials(data);
        }
      })
      .catch((err) => {
        console.error('[M23 Diagnostics] Fetch Serials Error:', err);
      });
  }, []);

  const handleSkuChange = (skuVal: string) => {
    setNewSku(skuVal);
    const found = productsCatalog.find(p => p.sku === skuVal);
    if (found) {
      setNewProductName(found.name);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleCloseModal = () => {
    setInternalCreateModal(false);
  };

  useEffect(() => {
    setPrimaryAction(() => () => setInternalCreateModal(true), 'Đăng Ký Serial/IMEI');
    return () => setPrimaryAction(undefined, undefined);
  }, [setPrimaryAction]);

  // Handle Inspect Serial Detail
  const handleInspectSerial = (serial: SerialItem) => {
    setSelectedSerial(serial);
    if (onSelectEntity) {
      onSelectEntity({
        type: 'SERIAL',
        id: serial.id,
        code: serial.serialNumber,
        title: `${serial.serialNumber} - ${serial.productName}`,
        status: serial.status,
        lineage: (serial.timeline || []).map((t, idx) => ({
          id: t.id || `L-${idx}`,
          nodeType: t.type,
          label: t.title,
          status: 'COMPLETED',
          timestamp: t.timestamp
        })),
        auditTrail: (serial.timeline || []).map((t, idx) => ({
          id: idx + 1,
          action: t.title,
          timestamp: t.timestamp,
          user: t.actor
        }))
      });
    }
  };

  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScanInput.trim()) return;
    const code = quickScanInput.trim().toUpperCase();
    const found = serials.find(s => s.serialNumber.toUpperCase() === code || s.serialNumber.toUpperCase().includes(code));
    if (found) {
      handleInspectSerial(found);
      onNotify('success', 'Quét mã vạch thành công', `Đã tìm thấy và mở hồ sơ 360° cho Serial: ${found.serialNumber}`);
      setQuickScanInput('');
    } else {
      onNotify('warning', 'Không tìm thấy Serial', `Không tìm thấy số Serial / IMEI "${code}" trong hệ thống kho.`);
    }
  };

  const handleCreateSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('nexus_jwt') || '';
    try {
      const res = await fetch('/api/serials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          serialNumber: newSerialNo,
          sku: newSku,
          warehouseId: 1,
          notes: newNotes,
          warrantyMonths: 12
        })
      });
      const data = await res.json();
      if (res.ok) {
        const r2 = await fetch('/api/serials', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        const list = await r2.json();
        if (Array.isArray(list)) setSerials(list);
        handleCloseModal();
        onNotify('success', 'Thành công', `Đã đăng ký số Serial / IMEI ${newSerialNo} thành công.`);
      } else {
        onNotify('error', 'Lỗi đăng ký', data.error || 'Không thể đăng ký serial mới.');
      }
    } catch (err: any) {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const newItem: SerialItem = {
        id: `SN-00${serials.length + 1}`,
        serialNumber: newSerialNo,
        sku: newSku,
        productName: newProductName,
        category: 'Thiết bị & Linh kiện',
        warehouse: newWarehouse,
        status: 'IN_STOCK',
        manufactureDate: new Date().toISOString().slice(0, 10),
        warrantyMonths: 12,
        notes: newNotes,
        timeline: [
          {
            id: `TL-${Date.now()}`,
            timestamp: nowStr,
            type: 'CREATED',
            title: 'Đăng ký & Nhập kho mới',
            description: newNotes || 'Đăng ký số Serial/IMEI vào hệ thống',
            actor: 'Thủ kho Hệ thống',
            location: newWarehouse
          }
        ]
      };
      setSerials([newItem, ...serials]);
      handleCloseModal();
      onNotify('success', 'Thành công (Local Fallback)', `Đã đăng ký số Serial / IMEI ${newSerialNo} thành công.`);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfName || !newProfCode || !newProfPrefix) {
      onNotify('error', 'Thiếu thông tin', 'Vui lòng điền đầy đủ Tên, Mã định danh và Tiền tố (Prefix).');
      return;
    }
    const token = localStorage.getItem('nexus_jwt') || '';
    try {
      const res = await fetch('/api/serial-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: newProfName,
          code: newProfCode,
          categoryType: newProfCategory,
          prefix: newProfPrefix,
          warrantyMonths: Number(newProfWarranty),
          description: newProfDesc
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfiles(prev => [...prev, data.profile]);
        setCreateProfileModal(false);
        setNewProfName('');
        setNewProfCode('');
        setNewProfPrefix('SN-');
        setNewProfDesc('');
        onNotify('success', 'Thành công', `Đã tạo hồ sơ ngành hàng "${newProfName}" thành công.`);
      } else {
        onNotify('error', 'Lỗi tạo hồ sơ', data.error || 'Không thể tạo hồ sơ ngành hàng.');
      }
    } catch (err: any) {
      const fallbackProf: SerialProfile = {
        id: `PR-${Date.now()}`,
        code: newProfCode.toUpperCase(),
        name: newProfName,
        categoryType: newProfCategory,
        prefix: newProfPrefix.toUpperCase(),
        warrantyMonths: Number(newProfWarranty) || 12,
        description: newProfDesc
      };
      setProfiles(prev => [...prev, fallbackProf]);
      setCreateProfileModal(false);
      onNotify('success', 'Thành công (Local)', `Đã tạo hồ sơ ngành hàng "${newProfName}" thành công.`);
    }
  };

  // Open Action Modal with proper setup
  const openActionModal = (serial: SerialItem, actionType: 'SELL' | 'WARRANTY' | 'RESOLVE_WARRANTY' | 'TRANSFER' | 'DEFECTIVE') => {
    setActionTargetSerial(serial);
    setActionModalType(actionType);
    if (actionType === 'SELL') {
      setActionCustomer(serial.customerName || 'Công ty TNHH Giải Pháp Công Nghệ Số');
      setActionOrderNo(`SO-2026-0${Math.floor(100 + Math.random() * 900)}`);
      setActionReason('Xuất bán hàng hóa theo hợp đồng thương mại');
    } else if (actionType === 'WARRANTY') {
      setActionReason('Tiếp nhận máy kiểm tra lỗi kỹ thuật từ khách hàng');
    } else if (actionType === 'RESOLVE_WARRANTY') {
      setActionReason('Đã hoàn tất bảo trì, thay thế linh kiện và kiểm định lại đạt chuẩn');
    } else if (actionType === 'TRANSFER') {
      setActionWarehouse(serial.warehouse.includes('WH-01') ? 'WH-02 (Kho Chi nhánh Nam)' : 'WH-01 (Kho Tổng Hà Nội)');
      setActionReason('Điều chuyển cân đối hàng tồn kho giữa các chi nhánh');
    } else if (actionType === 'DEFECTIVE') {
      setActionReason('Lỗi phần cứng không thể khắc phục tại chỗ, chuyển kho phế phẩm/chờ trả NCC');
    }
  };

  // Execute Action Submission with Rule #19 ConfirmDialog
  const handleExecuteAction = () => {
    if (!actionTargetSerial || !actionModalType) return;

    const s = actionTargetSerial;
    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);
    const todayDate = now.toISOString().slice(0, 10);
    const months = s.warrantyMonths || 12;
    const endDate = new Date(now.setMonth(now.getMonth() + months)).toISOString().slice(0, 10);

    let nextStatus: SerialItem['status'] = s.status;
    let actionTitle = '';
    let confirmPrompt = '';
    let newEvent: SerialTimelineEvent;

    if (actionModalType === 'SELL') {
      nextStatus = 'SOLD';
      actionTitle = 'Xác nhận Xuất bán Serial / IMEI';
      confirmPrompt = `Xuất bán mã ${s.serialNumber} cho khách hàng "${actionCustomer}" theo đơn hàng "${actionOrderNo}"?`;
      newEvent = {
        id: `TL-${Date.now()}`,
        timestamp: nowStr,
        type: 'SOLD',
        title: `Xuất bán cho ${actionCustomer}`,
        description: actionReason || `Bán theo đơn hàng ${actionOrderNo}`,
        actor: 'Nhân viên Kinh Doanh',
        referenceDoc: actionOrderNo
      };
    } else if (actionModalType === 'WARRANTY') {
      nextStatus = 'WARRANTY';
      actionTitle = 'Xác nhận Tiếp nhận Bảo hành';
      confirmPrompt = `Chuyển thiết bị ${s.serialNumber} sang trạng thái bảo hành sửa chữa?`;
      newEvent = {
        id: `TL-${Date.now()}`,
        timestamp: nowStr,
        type: 'MAINTENANCE',
        title: 'Tiếp nhận bảo hành & sửa chữa',
        description: actionReason || 'Tiếp nhận bảo trì từ khách hàng',
        actor: 'Kỹ thuật viên Trạm DVKT',
        referenceDoc: `RMA-${Date.now().toString().slice(-4)}`
      };
    } else if (actionModalType === 'RESOLVE_WARRANTY') {
      nextStatus = 'SOLD';
      actionTitle = 'Xác nhận Hoàn tất Bảo hành & Trả máy';
      confirmPrompt = `Hoàn tất xử lý bảo hành cho mã ${s.serialNumber} và bàn giao trả lại khách hàng?`;
      newEvent = {
        id: `TL-${Date.now()}`,
        timestamp: nowStr,
        type: 'RETURNED',
        title: 'Hoàn tất bảo hành & Bàn giao',
        description: actionReason || 'Đã sửa chữa và kiểm tra đạt tiêu chuẩn hoạt động',
        actor: 'Trưởng phòng Kỹ thuật'
      };
    } else if (actionModalType === 'TRANSFER') {
      nextStatus = s.status;
      actionTitle = 'Xác nhận Điều chuyển Kho';
      confirmPrompt = `Điều chuyển thiết bị ${s.serialNumber} từ ${s.warehouse} sang ${actionWarehouse}?`;
      newEvent = {
        id: `TL-${Date.now()}`,
        timestamp: nowStr,
        type: 'TRANSFER',
        title: `Điều chuyển đến ${actionWarehouse}`,
        description: actionReason || 'Điều chuyển tồn kho nội bộ',
        actor: 'Điều phối viên Kho',
        location: actionWarehouse
      };
    } else {
      nextStatus = 'DEFECTIVE';
      actionTitle = 'Xác nhận Báo Hỏng Thiết Bị';
      confirmPrompt = `Đánh dấu thiết bị ${s.serialNumber} là lỗi/hỏng kỹ thuật không thể xuất kho?`;
      newEvent = {
        id: `TL-${Date.now()}`,
        timestamp: nowStr,
        type: 'DEFECT',
        title: 'Ghi nhận lỗi / Hỏng hóc',
        description: actionReason || 'Lỗi phần cứng chờ xử lý',
        actor: 'Nhân viên KCS'
      };
    }

    setConfirmDialog({
      isOpen: true,
      title: actionTitle,
      message: confirmPrompt,
      variant: actionModalType === 'DEFECTIVE' ? 'danger' : 'primary',
      onConfirm: async () => {
        const token = localStorage.getItem('nexus_jwt') || '';
        const actionPayload = {
          actionType: actionModalType,
          customerName: actionCustomer,
          orderNumber: actionOrderNo,
          notes: actionReason
        };
        console.log('[M23 Diagnostics] Action Payload for serial', s.id, ':', actionPayload);
        try {
          const actionRes = await fetch(`/api/serials/${s.id}/actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(actionPayload)
          });
          const actionResJson = await actionRes.json();
          console.log('[M23 Diagnostics] Action Execution Raw Response:', actionResJson);

          const r2 = await fetch('/api/serials', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
          const list = await r2.json();
          console.log('[M23 Diagnostics] Refetch Serials List Raw Response after action:', list);
          if (Array.isArray(list)) {
            setSerials(list);
          } else {
            console.warn('[M23 Diagnostics] Refetch serials returned non-array:', list);
          }
        } catch (err) {
          console.error('[M23 Diagnostics] Action execution or refetch error:', err);
          // Fallback local update
          setSerials(prev => prev.map(item => {
            if (item.id === s.id) {
              const updated: SerialItem = {
                ...item,
                status: nextStatus,
                warehouse: actionModalType === 'TRANSFER' ? actionWarehouse : item.warehouse,
                customerName: actionModalType === 'SELL' ? actionCustomer : item.customerName,
                orderNumber: actionModalType === 'SELL' ? actionOrderNo : item.orderNumber,
                warrantyStart: actionModalType === 'SELL' ? todayDate : item.warrantyStart,
                warrantyEnd: actionModalType === 'SELL' ? endDate : item.warrantyEnd,
                timeline: [newEvent, ...(item.timeline || [])]
              };
              if (selectedSerial?.id === s.id) {
                setSelectedSerial(updated);
              }
              return updated;
            }
            return item;
          }));
        }

        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setActionModalType(null);
        setActionTargetSerial(null);
        onNotify('success', 'Thao tác thành công', `Đã cập nhật trạng thái số Serial/IMEI ${s.serialNumber}.`);
      }
    });
  };

  // Quick direct status update with confirmation
  const handleQuickStatusUpdate = (id: string, serialNo: string, targetStatus: SerialItem['status']) => {
    const statusLabels: Record<SerialItem['status'], string> = {
      IN_STOCK: 'Trong kho',
      SOLD: 'Đã bán',
      WARRANTY: 'Đang bảo hành',
      DEFECTIVE: 'Hỏng / Lỗi',
      IN_USE: 'Đang sử dụng nội bộ'
    };

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Thay đổi Trạng thái Serial / IMEI',
      message: `Chuyển trạng thái của mã ${serialNo} sang "${statusLabels[targetStatus]}"?`,
      variant: targetStatus === 'DEFECTIVE' ? 'danger' : 'primary',
      onConfirm: () => {
        setSerials(prev => prev.map(s => {
          if (s.id === id) {
            const eventType: SerialTimelineEvent['type'] = targetStatus === 'SOLD' ? 'SOLD' : targetStatus === 'WARRANTY' ? 'MAINTENANCE' : 'TRANSFER';
            const updated: SerialItem = { 
              ...s, 
              status: targetStatus,
              timeline: [
                {
                  id: `TL-${Date.now()}`,
                  timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                  type: eventType,
                  title: `Chuyển trạng thái: ${statusLabels[targetStatus]}`,
                  description: `Thao tác nhanh trên bảng dữ liệu`,
                  actor: 'Người dùng Hiện tại'
                },
                ...(s.timeline || [])
              ]
            };
            if (selectedSerial?.id === id) setSelectedSerial(updated);
            return updated;
          }
          return s;
        }));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        onNotify('success', 'Cập nhật thành công', `Mã ${serialNo} đã được chuyển sang trạng thái ${statusLabels[targetStatus]}.`);
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Số Serial/IMEI", "Mã SKU", "Tên Sản Phẩm", "Kho Lưu Trữ", "Trạng Thái", "Khách Hàng", "Hạn Bảo Hành", "Ngày Sản Xuất"];
    const rows = filteredSerials.map(s => [
      s.id,
      s.serialNumber,
      s.sku,
      `"${s.productName}"`,
      `"${s.warehouse}"`,
      s.status,
      `"${s.customerName || 'Nội bộ kho'}"`,
      s.warrantyEnd || 'Chưa kích hoạt',
      s.manufactureDate
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NexusSync_M23_Serials_IMEI_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất dữ liệu thành công', 'Đã tải xuống danh sách Serial & IMEI định dạng CSV.');
  };

  const filteredSerials = serials.filter(s => {
    const matchesSearch = (s.serialNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.productName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.sku || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.customerName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  const totalCount = serials.length;
  const inStockCount = serials.filter(s => s.status === 'IN_STOCK').length;
  const soldCount = serials.filter(s => s.status === 'SOLD').length;
  const warrantyCount = serials.filter(s => s.status === 'WARRANTY' || s.status === 'DEFECTIVE').length;

  const pagination = usePagination({
    totalItems: filteredSerials.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedSerials = pagination.paginatedData(filteredSerials);


  return (
    <div className="space-y-3.5 max-w-full pb-6 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 min-h-screen px-4 pt-4">
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (COMPACT & MODERN)                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:text-slate-200 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-700 dark:border-slate-600">
                M23 • SERIALS & IMEI
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-400 font-mono hidden sm:inline">
                Data Lineage 360°
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white dark:text-white leading-tight mt-0.5">
              Quản Lý Số Serial & IMEI
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TABS NAVIGATION STRIP (M41 MASTER SPEC)                               */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('serials')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'serials'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Danh Sách Serial / IMEI</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'serials' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'profiles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Hồ Sơ Ngành Hàng (Profiles)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Nhật Ký Vòng Đời (Audit Trail)</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Serial / IMEI Tracker
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            GS1-128 Validated
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI SUMMARY CARDS                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">Tổng Số Serial / IMEI</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <QrCode className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white dark:text-white tabular-nums">
              {totalCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> 100% WMS
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">Đang Trong Kho</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {inStockCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-400 font-medium">Sẵn sàng xuất</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">Đã Bán / Sở Hữu</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {soldCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-400 font-medium">Có thông tin khách hàng</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider">Bảo Hành / Lỗi</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
              {warrantyCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-400 font-medium">Cần xử lý kỹ thuật</span>
          </div>
        </div>
      </div>

      {/* Tab 1: Serial List */}
      {activeTab === 'serials' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-800 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm số serial, IMEI, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <form onSubmit={handleQuickScanSubmit} className="relative w-full sm:w-56">
                <QrCode className="w-4 h-4 text-indigo-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Quét nhanh Barcode / IMEI..."
                  value={quickScanInput}
                  onChange={(e) => setQuickScanInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </form>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="IN_STOCK">Trong kho (IN_STOCK)</option>
                <option value="SOLD">Đã bán (SOLD)</option>
                <option value="WARRANTY">Bảo hành (WARRANTY)</option>
                <option value="DEFECTIVE">Hỏng / Lỗi (DEFECTIVE)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Xuất Excel/CSV</span>
              </button>
              <button
                onClick={() => {
                  if (filteredSerials.length > 0) handleInspectSerial(filteredSerials[0]);
                }}
                className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">In Nhãn</span>
              </button>
              <button
                onClick={() => setInternalCreateModal(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Đăng Ký Serial</span>
              </button>
            </div>
          </div>

          <L3ContentState
            isLoading={false}
            error={null}
            isEmpty={filteredSerials.length === 0}
            onRetry={() => {}}
            emptyTitle="Không tìm thấy Serial / IMEI"
            emptyDescription="Không có dữ liệu phù hợp với điều kiện tìm kiếm và bộ lọc."
            emptyAction={{
              label: 'Đăng ký Serial mới',
              onClick: () => setInternalCreateModal(true),
              variant: 'primary'
            }}
            skeletonRows={6}
            minHeight="min-h-[420px]"
          >
            <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 shadow-2xs overflow-hidden">

          {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700 text-slate-600 dark:text-slate-400 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[140px]">Số Serial / IMEI</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Mã SKU & Sản Phẩm</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Kho / Vị Trí</th>
                      <th className="py-2.5 px-2 text-center min-w-[100px]">Trạng Thái</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Khách Hàng / Sở Hữu</th>
                      <th className="py-2.5 px-3 min-w-[100px]">Bảo Hành Đến</th>
                      <th className="py-2.5 px-3 text-right min-w-[150px]">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                    {paginatedSerials.map((s) => {
                      const isSelected = selectedSerial?.id === s.id;
                      const statusClass = 
                        s.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold' :
                        s.status === 'SOLD' ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold' :
                        s.status === 'WARRANTY' ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold' :
                        s.status === 'DEFECTIVE' ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold' :
                        'bg-slate-100 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-semibold';
                      
                      const borderColor = 
                        isSelected ? 'border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80 shadow-2xs' :
                        (s.status === 'WARRANTY' || s.status === 'DEFECTIVE') ? 'border-l-4 border-amber-500 bg-amber-50/20 dark:bg-amber-950/20' :
                        'border-l-4 border-transparent';

                      return (
                        <tr key={s.id} className={`transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${borderColor}`}>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleInspectSerial(s)}
                              className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                              title="Click để xem chi tiết hồ sơ thiết bị"
                            >
                              {s.serialNumber}
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-400 block">{s.sku}</span>
                            <span className="font-medium">{s.productName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 dark:text-slate-400">
                            {s.warehouse}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-md border ${statusClass}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {s.customerName ? (
                              <div>
                                <span className="font-medium text-slate-900 dark:text-white dark:text-white block">{s.customerName}</span>
                                {s.orderNumber && <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-400">Đơn: {s.orderNumber}</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400 italic">Nội bộ kho</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {s.warrantyEnd ? (
                              <span className="font-medium">{s.warrantyEnd}</span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400 italic">Chưa kích hoạt</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* IN_STOCK: Actions */}
                              {s.status === 'IN_STOCK' && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openActionModal(s, 'SELL'); }}
                                    className="px-2 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded transition-colors cursor-pointer"
                                  >
                                    Xuất bán
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openActionModal(s, 'TRANSFER'); }}
                                    className="px-2 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded transition-colors cursor-pointer"
                                  >
                                    Chuyển
                                  </button>
                                </>
                              )}

                              {/* SOLD: Actions */}
                              {s.status === 'SOLD' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); openActionModal(s, 'WARRANTY'); }}
                                  className="px-2 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 rounded transition-colors cursor-pointer"
                                >
                                  Bảo hành
                                </button>
                              )}

                              {/* WARRANTY: Actions */}
                              {s.status === 'WARRANTY' && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openActionModal(s, 'RESOLVE_WARRANTY'); }}
                                    className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded transition-colors cursor-pointer"
                                  >
                                    Trả máy
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openActionModal(s, 'DEFECTIVE'); }}
                                    className="px-2 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded transition-colors cursor-pointer"
                                  >
                                    Báo hỏng
                                  </button>
                                </>
                              )}

                              {/* DEFECTIVE: Actions */}
                              {s.status === 'DEFECTIVE' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(s.id, s.serialNumber, 'IN_STOCK'); }}
                                  className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded transition-colors cursor-pointer"
                                >
                                  Tái nhập
                                </button>
                              )}

                              <button
                                onClick={(e) => { e.stopPropagation(); handleInspectSerial(s); }}
                                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 dark:border-slate-700">
                <PaginationControl pagination={pagination} />
              </div>
            </div>
          </L3ContentState>
        </div>
      )}

      {/* Tab 2: Profiles */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cấu Hình Hồ Sơ & Tiền Tố Ngành Hàng (Serial Profiles)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quản lý quy tắc tiền tố mã định danh, chính sách bảo hành mặc định và thuộc tính chuyên ngành.</p>
            </div>
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('M43');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              Mở Phân Hệ M43 (Hồ Sơ Ngành Hàng)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p) => (
              <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-mono text-[10px] font-bold rounded">
                    {p.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Prefix: {p.prefix}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{p.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Bảo hành: <strong className="font-mono tabular-nums">{p.warrantyMonths}</strong> tháng</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">{p.categoryType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: History Audit Trail */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white dark:text-white">Nhật Ký Vòng Đời & Truy Vết Serial</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-0.5">Lịch sử giao dịch, biến động kho và các mốc bảo hành</p>
            </div>
            <span className="px-2 py-1 text-[10px] font-mono text-emerald-900 bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 rounded font-semibold tracking-wider">
              GL AUDIT LOG
            </span>
          </div>
          <div className="p-4 space-y-3">
            {serials.flatMap(s => (s.timeline || []).map(t => ({ ...t, serialNumber: s.serialNumber, sku: s.sku, productName: s.productName }))).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((event, idx) => (
              <div key={event.id || idx} className="p-3 bg-white dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900/50/80 dark:hover:bg-slate-700/60 transition-colors rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 flex items-start gap-3">
                <div className={`p-1.5 rounded-lg shrink-0 border ${
                  event.type === 'SOLD' ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700' :
                  event.type === 'MAINTENANCE' || event.type === 'DEFECT' ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700' :
                  event.type === 'TRANSFER' ? 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700' :
                  'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                }`}>
                  {event.type === 'SOLD' ? <User className="w-3.5 h-3.5" /> :
                   event.type === 'MAINTENANCE' ? <Wrench className="w-3.5 h-3.5" /> :
                   event.type === 'TRANSFER' ? <ArrowLeftRight className="w-3.5 h-3.5" /> :
                   <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white dark:text-white">{event.serialNumber}</span>
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 dark:border-slate-600">{event.sku}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 dark:text-slate-400 tabular-nums">{event.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-200 font-medium mt-1">{event.title}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 dark:text-slate-400 mt-0.5">{event.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-2 flex-wrap border-t border-slate-100 dark:border-slate-700/50 dark:border-slate-700/50 pt-2">
                    <span>Thực hiện: <strong className="text-slate-700 dark:text-slate-300">{event.actor}</strong></span>
                    {event.referenceDoc && <span className="font-mono">Tham chiếu: <strong className="text-slate-700 dark:text-slate-300">{event.referenceDoc}</strong></span>}
                    {event.location && <span>Kho/Vị trí: <strong className="text-slate-700 dark:text-slate-300">{event.location}</strong></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 360 Degree Serial Inspector Modal */}
      {selectedSerial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-700 dark:border-slate-700 my-8">
            {/* Modal Header */}
            <div className="px-5 py-3 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-bold text-lg tracking-tight">{selectedSerial.serialNumber}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedSerial.status === 'IN_STOCK' ? 'bg-emerald-500/20 text-emerald-300' :
                      selectedSerial.status === 'SOLD' ? 'bg-blue-500/20 text-blue-300' :
                      selectedSerial.status === 'WARRANTY' ? 'bg-amber-500/20 text-amber-300' :
                      selectedSerial.status === 'DEFECTIVE' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-purple-500/20 text-purple-300'
                    }`}>
                      {selectedSerial.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedSerial.productName} ({selectedSerial.sku})</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSerial(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Virtual Barcode & Identity Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400">Mã vạch chuẩn Code-128 / GS1-128</span>
                  <div className="font-mono font-bold text-xl tracking-widest text-slate-900 dark:text-white">
                    *{selectedSerial.serialNumber}*
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span>SKU: <strong className="font-mono text-indigo-600">{selectedSerial.sku}</strong></span>
                    <span>•</span>
                    <span>Kho: <strong>{selectedSerial.warehouse}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      try {
                        const doc = new jsPDF({
                          orientation: 'landscape',
                          unit: 'mm',
                          format: [80, 50]
                        });
                        
                        const cleanProduct = removeVietnameseTones(selectedSerial.productName);
                        
                        doc.setLineWidth(0.5);
                        doc.rect(2, 2, 76, 46);
                        
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(10);
                        doc.text('NEXUSSYNC ERP', 40, 8, { align: 'center' });
                        
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        const splitTitle = doc.splitTextToSize(cleanProduct, 70);
                        doc.text(splitTitle, 40, 14, { align: 'center' });
                        
                        doc.setFont('courier', 'bold');
                        doc.setFontSize(16);
                        doc.text(`*${selectedSerial.serialNumber}*`, 40, 28, { align: 'center' });
                        
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        doc.text(`SKU: ${selectedSerial.sku}`, 40, 36, { align: 'center' });
                        doc.text('CODE-128 / GS1-128 STANDARD', 40, 42, { align: 'center' });
                        doc.setFontSize(6);
                        doc.text(selectedSerial.warehouse, 40, 46, { align: 'center' });
                        
                        doc.save(`SerialLabel_${selectedSerial.serialNumber}.pdf`);
                        onNotify('success', 'Đã in tem mã vạch', `Đã xuất file PDF tem nhãn cho số máy ${selectedSerial.serialNumber}.`);
                      } catch (err) {
                        console.error('Error generating label PDF:', err);
                        onNotify('danger', 'Lỗi in ấn', 'Không thể tạo file PDF nhãn Serial lúc này.');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    In Nhãn Serial
                  </button>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    Thông Tin Sản Phẩm & Kho Vận
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 dark:text-slate-400">Tên sản phẩm:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedSerial.productName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 dark:text-slate-400">Mã SKU:</span>
                      <span className="font-mono font-semibold text-indigo-600">{selectedSerial.sku}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 dark:text-slate-400">Kho hiện tại:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedSerial.warehouse}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 dark:text-slate-400">Ngày sản xuất:</span>
                      <span className="font-mono text-slate-900 dark:text-white">{selectedSerial.manufactureDate}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Khách Hàng & Bảo Hành Điện Tử
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 dark:text-slate-400">Khách hàng sở hữu:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedSerial.customerName || 'Nội bộ kho (Chưa bán)'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 dark:text-slate-400">Đơn hàng xuất:</span>
                      <span className="font-mono text-slate-900 dark:text-white">{selectedSerial.orderNumber || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 dark:text-slate-400">Thời hạn bảo hành:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedSerial.warrantyMonths || 12} tháng</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 dark:text-slate-400">Hạn bảo hành đến:</span>
                      <span className="font-mono font-semibold text-emerald-600">{selectedSerial.warrantyEnd || 'Chưa kích hoạt'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Dòng Thời Gian Vòng Đời Thiết Bị (Data Lineage)
                </h4>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {(selectedSerial.timeline || []).map((t, idx) => (
                    <div key={t.id || idx} className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{t.title}</span>
                          <span className="font-mono text-[11px] text-slate-400">{t.timestamp}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{t.description}</p>
                        <div className="flex items-center gap-3 text-slate-400 text-[11px] pt-1">
                          <span>Người thực hiện: <strong>{t.actor}</strong></span>
                          {t.referenceDoc && <span className="font-mono">Số CT: <strong>{t.referenceDoc}</strong></span>}
                          {t.location && <span>Địa điểm: <strong>{t.location}</strong></span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer / Quick Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {selectedSerial.status === 'IN_STOCK' && (
                  <button
                    onClick={() => {
                      const item = selectedSerial;
                      setSelectedSerial(null);
                      openActionModal(item, 'SELL');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    Xuất Bán Hàng
                  </button>
                )}
                {selectedSerial.status === 'SOLD' && (
                  <button
                    onClick={() => {
                      const item = selectedSerial;
                      setSelectedSerial(null);
                      openActionModal(item, 'WARRANTY');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    Tiếp Nhận Bảo Hành
                  </button>
                )}
                {selectedSerial.status === 'WARRANTY' && (
                  <button
                    onClick={() => {
                      const item = selectedSerial;
                      setSelectedSerial(null);
                      openActionModal(item, 'RESOLVE_WARRANTY');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    Hoàn Tất Bảo Hành & Trả Máy
                  </button>
                )}
                <button
                  onClick={() => {
                    const item = selectedSerial;
                    setSelectedSerial(null);
                    openActionModal(item, 'TRANSFER');
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-lg shadow-xs transition-colors"
                >
                  Điều Chuyển Kho
                </button>
              </div>
              <button
                onClick={() => setSelectedSerial(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State Transition Action Modal */}
      {actionModalType && actionTargetSerial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-5 py-3 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base">
                  {actionModalType === 'SELL' && 'Quy Trình Xuất Bán Serial / IMEI'}
                  {actionModalType === 'WARRANTY' && 'Tiếp Nhận Bảo Hành & Sửa Chữa'}
                  {actionModalType === 'RESOLVE_WARRANTY' && 'Hoàn Tất Bảo Hành & Bàn Giao Thiết Bị'}
                  {actionModalType === 'TRANSFER' && 'Điều Chuyển Kho Nội Bộ'}
                  {actionModalType === 'DEFECTIVE' && 'Ghi Nhận Lỗi Hỏng Thiết Bị'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{actionTargetSerial.serialNumber}</p>
              </div>
              <button onClick={() => setActionModalType(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              {actionModalType === 'SELL' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Tên Khách Hàng / Đơn Vị Nhận</label>
                    <input
                      type="text"
                      required
                      value={actionCustomer}
                      onChange={(e) => setActionCustomer(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: Công ty Cổ phần Công nghệ Viettel"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Mã Đơn Bán Hàng (SO / POS Invoice)</label>
                    <input
                      type="text"
                      required
                      value={actionOrderNo}
                      onChange={(e) => setActionOrderNo(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: SO-2026-0128"
                    />
                  </div>
                </>
              )}

              {actionModalType === 'TRANSFER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Kho Đích Chuyển Đến</label>
                  <select
                    value={actionWarehouse}
                    onChange={(e) => setActionWarehouse(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="WH-01 (Kho Tổng Hà Nội)">WH-01 (Kho Tổng Hà Nội)</option>
                    <option value="WH-02 (Kho Chi nhánh Nam)">WH-02 (Kho Chi nhánh Nam)</option>
                    <option value="WH-03 (Kho Linh kiện CNC)">WH-03 (Kho Linh kiện CNC)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">
                  {actionModalType === 'WARRANTY' ? 'Mô tả hiện tượng lỗi / Yêu cầu sửa chữa' : 'Ghi chú nghiệp vụ'}
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập nội dung giải trình nghiệp vụ..."
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Thao tác sẽ tự động ghi nhật ký vào chuỗi sự kiện Data Lineage của thiết bị và cập nhật trạng thái kho tương ứng.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Xác Nhận Cập Nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Serial Modal */}
      {internalCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-5 py-3 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-base">Đăng Ký Số Serial / IMEI Mới</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleCreateSerial} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Số Serial / IMEI (Duy nhất)</label>
                <input
                  type="text"
                  required
                  value={newSerialNo}
                  onChange={(e) => setNewSerialNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập hoặc quét mã vạch Serial/IMEI"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Mã SKU & Sản Phẩm</label>
                <select
                  value={newSku}
                  onChange={(e) => handleSkuChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  {productsCatalog.map(p => (
                    <option key={p.sku} value={p.sku}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Kho Nhận Ban Đầu</label>
                <select
                  value={newWarehouse}
                  onChange={(e) => setNewWarehouse(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WH-01 (Kho Tổng Hà Nội)">WH-01 (Kho Tổng Hà Nội)</option>
                  <option value="WH-02 (Kho Chi nhánh Nam)">WH-02 (Kho Chi nhánh Nam)</option>
                  <option value="WH-03 (Kho Linh kiện CNC)">WH-03 (Kho Linh kiện CNC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Ghi Chú & Nguồn Nhập</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Nhập kho từ PO-2026-0090"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                >
                  Lưu & Đăng Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Serial Profile Modal */}
      {createProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-5 py-3 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-base">Thêm Hồ Sơ & Tiền Tố Ngành Hàng Mới</h3>
              <button onClick={() => setCreateProfileModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleCreateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Tên Nhóm Ngành Hàng</label>
                <input
                  type="text"
                  required
                  value={newProfName}
                  onChange={(e) => setNewProfName(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Thiết bị An ninh & Camera"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Mã Định Danh (Code)</label>
                  <input
                    type="text"
                    required
                    value={newProfCode}
                    onChange={(e) => setNewProfCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono uppercase text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: SECURITY"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Tiền Tố (Prefix)</label>
                  <input
                    type="text"
                    required
                    value={newProfPrefix}
                    onChange={(e) => setNewProfPrefix(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono uppercase text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: CAM-"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Loại Phân Loại</label>
                  <select
                    value={newProfCategory}
                    onChange={(e) => setNewProfCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value="CUSTOM">CUSTOM</option>
                    <option value="MEDICAL">MEDICAL</option>
                    <option value="ELECTRONICS">ELECTRONICS</option>
                    <option value="MACHINERY">MACHINERY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Bảo Hành (Tháng)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={newProfWarranty}
                    onChange={(e) => setNewProfWarranty(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase mb-1">Mô Tả Quy Tắc</label>
                <textarea
                  rows={2}
                  value={newProfDesc}
                  onChange={(e) => setNewProfDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả chi tiết quy chuẩn quản lý mã định danh ngành hàng này..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setCreateProfileModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                >
                  Tạo Hồ Sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rule #19 ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};
