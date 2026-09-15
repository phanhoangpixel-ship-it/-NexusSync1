import React, { useState, useEffect, useMemo } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../types';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from "../shell/DomainWorkspaceShell";
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PaginationControl } from '../common/PaginationControl';
import { DeepLinkBanner } from '../common/DeepLinkBanner';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Boxes,
  PackageCheck,
  Eye,
  Award,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface Props {
  onSelectEntity?: (entity: SelectedEntityContext | null) => void;
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, msg: string) => void;
}

interface QuarantineItem {
  id: string;
  sourceType: string;
  sourceRef: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  unit: string;
  supplierOrDept: string;
  receivedDate: string;
  status: string;
  lotNumber: string;
}

interface InspectionItem {
  id: string;
  type: string;
  item: string;
  date: string;
  status: string;
  inspector: string;
  notes?: string;
}

interface NCRItem {
  id: string;
  refId: string;
  severity: 'High' | 'Medium' | 'Low' | string;
  description: string;
  status: 'Open' | 'Closed' | string;
  action: string;
}

const initialQuarantineItems: QuarantineItem[] = [
  {
    id: 'Q-2026-001',
    sourceType: 'PO Inbound GRN',
    sourceRef: 'GRN-2026-084',
    itemSku: 'RM-STEEL-01',
    itemName: 'Thép Tấm Cuộn Cán Nóng SS400',
    quantity: 500,
    unit: 'Kg',
    supplierOrDept: 'Công ty CP Gang Thép Thái Nguyên',
    receivedDate: '02/09/2026',
    status: 'PENDING_INSPECTION',
    lotNumber: 'LOT-202609-01'
  },
  {
    id: 'Q-2026-002',
    sourceType: 'MES Work Order Output',
    sourceRef: 'WO-2026-042',
    itemSku: 'FG-VALVE-50',
    itemName: 'Van Công Nghiệp Khí Nén DN50',
    quantity: 60,
    unit: 'Bộ',
    supplierOrDept: 'Phân Xưởng Cơ Khí Chính Xác',
    receivedDate: '03/09/2026',
    status: 'PENDING_INSPECTION',
    lotNumber: 'LOT-202609-FG02'
  },
  {
    id: 'Q-2026-003',
    sourceType: 'PO Inbound GRN',
    sourceRef: 'GRN-2026-089',
    itemSku: 'ELEC-SENS-08',
    itemName: 'Cảm Biến Áp Suất Điện Tử 4-20mA',
    quantity: 120,
    unit: 'Cái',
    supplierOrDept: 'Omron Industrial Distributor',
    receivedDate: '03/09/2026',
    status: 'PENDING_INSPECTION',
    lotNumber: 'LOT-202609-E08'
  },
  {
    id: 'Q-2026-004',
    sourceType: 'MES Work Order Output',
    sourceRef: 'WO-2026-051',
    itemSku: 'ALUM-BRACKET-2',
    itemName: 'Khung Nhôm Định Hình Anodize 40x40',
    quantity: 350,
    unit: 'Mét',
    supplierOrDept: 'Tổ Gia Công Khung Vỏ',
    receivedDate: '05/09/2026',
    status: 'PENDING_INSPECTION',
    lotNumber: 'LOT-202609-AL04'
  }
];

const defaultInspections: InspectionItem[] = [
  { id: 'QA-2608-001', type: 'IQC (Đầu vào)', item: 'Linh kiện điện tử X', date: '28/08/2026', status: 'Passed', inspector: 'Nguyễn Văn A', notes: 'Dung sai điện áp kiểm tra đạt chuẩn ±0.5%' },
  { id: 'QA-2608-002', type: 'OQC (Đầu ra)', item: 'Máy bơm công nghiệp', date: '28/08/2026', status: 'Failed', inspector: 'Trần Thị B', notes: 'Áp lực thử tải không đạt 10 bar định mức' },
  { id: 'QA-2608-003', type: 'IPQC (Trong SX)', item: 'Vỏ máy nhựa định hình', date: '27/08/2026', status: 'Pending', inspector: 'Lê Văn C', notes: 'Đang kiểm tra độ co ngót và độ bóng bề mặt' },
  { id: 'QA-2608-004', type: 'IQC (Đầu vào)', item: 'Ốc vít thép không gỉ SUS304', date: '27/08/2026', status: 'Passed', inspector: 'Nguyễn Văn A', notes: 'Kiểm tra độ cứng và kiểm tra phun muối đạt' },
  { id: 'QA-2608-005', type: 'OQC (Đầu ra)', item: 'Hộp số giảm tốc NMRV-050', date: '26/08/2026', status: 'Passed', inspector: 'Phạm Minh D', notes: 'Tiếng ồn khi vận hành đạt < 65dB' },
  { id: 'QA-2608-006', type: 'IQC (Đầu vào)', item: 'Đồng đỏ tấm C1100 dày 2mm', date: '25/08/2026', status: 'Passed', inspector: 'Trần Thị B', notes: 'Chứng chỉ CO/CQ chuẩn, độ tinh khiết > 99.9%' }
];

const defaultNCRs: NCRItem[] = [
  { id: 'NCR-2608-01', refId: 'QA-2608-002', severity: 'High', description: 'Động cơ không đạt tốc độ vòng quay tiêu chuẩn (Thiếu 150 RPM)', status: 'Open', action: 'Rework (Quấn lại stator & thay vòng bi)' },
  { id: 'NCR-2608-02', refId: 'QA-2607-015', severity: 'Medium', description: 'Trầy xước bề mặt sơn tĩnh điện vượt quá 5% diện tích', status: 'Closed', action: 'Scrap & Xử lý bồi thường nhà cung ứng' },
  { id: 'NCR-2608-03', refId: 'QA-2608-009', severity: 'Low', description: 'Sai lệch nhãn dán thông số cảnh báo an toàn', status: 'Open', action: 'In lại nhãn & Dán bổ sung tại phân xưởng' }
];

const barData = [
  { name: 'T2', Passed: 45, Failed: 5 },
  { name: 'T3', Passed: 50, Failed: 8 },
  { name: 'T4', Passed: 60, Failed: 3 },
  { name: 'T5', Passed: 40, Failed: 2 },
  { name: 'T6', Passed: 55, Failed: 6 },
  { name: 'T7', Passed: 30, Failed: 1 },
];

const pieData = [
  { name: 'Đạt Chuẩn (Passed)', value: 280 },
  { name: 'Lỗi - Sửa Lại (Rework)', value: 15 },
  { name: 'Lỗi - Hủy Bỏ (Scrap)', value: 10 },
];
const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export const M39QualityControlWorkspace: React.FC<Props> = ({ onSelectEntity, onNotify }) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'quarantine_gate' | 'inspections' | 'ncrs' | 'analytics'>('M39', 'quarantine_gate');
  
  // Data States
  const [quarantineItems, setQuarantineItems] = useState<QuarantineItem[]>(initialQuarantineItems);
  const [inspections, setInspections] = useState<InspectionItem[]>(defaultInspections);
  const [ncrs, setNcrs] = useState<NCRItem[]>(defaultNCRs);
  const [loading, setLoading] = useState<boolean>(false);

  // Search & Filter States
  const [quarantineSearch, setQuarantineSearch] = useState<string>('');
  const [inspectionSearch, setInspectionSearch] = useState<string>('');
  const [inspectionTypeFilter, setInspectionTypeFilter] = useState<string>('ALL');
  const [inspectionStatusFilter, setInspectionStatusFilter] = useState<string>('ALL');
  const [ncrSearch, setNcrSearch] = useState<string>('');
  const [ncrSeverityFilter, setNcrSeverityFilter] = useState<string>('ALL');
  const [ncrStatusFilter, setNcrStatusFilter] = useState<string>('ALL');

  // Pagination States
  const [quarantinePage, setQuarantinePage] = useState<number>(1);
  const [quarantinePageSize, setQuarantinePageSize] = useState<number>(10);
  const [inspectionPage, setInspectionPage] = useState<number>(1);
  const [inspectionPageSize, setInspectionPageSize] = useState<number>(10);
  const [ncrPage, setNcrPage] = useState<number>(1);
  const [ncrPageSize, setNcrPageSize] = useState<number>(10);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailInspection, setDetailInspection] = useState<InspectionItem | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Form States for Create Modal
  const [formType, setFormType] = useState('IQC (Đầu vào)');
  const [formItem, setFormItem] = useState('');
  const [formInspector, setFormInspector] = useState('Nguyễn Văn A');
  const [formNotes, setFormNotes] = useState('');

  // Primary Shell Action Registration
  useEffect(() => {
    setPrimaryAction(() => () => setIsCreateModalOpen(true), 'Tạo phiếu QA');
    return () => setPrimaryAction(undefined, undefined);
  }, [setPrimaryAction]);

  // Load from real server APIs on mount
  const fetchData = async () => {
    try {
      setLoading(true);
      const [quarantineRes, inspRes, ncrRes] = await Promise.all([
        fetch('/api/quality/quarantine').catch(() => null),
        fetch('/api/quality/inspections').catch(() => null),
        fetch('/api/quality/ncrs').catch(() => null)
      ]);
      if (quarantineRes && quarantineRes.ok) {
        const data = await quarantineRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setQuarantineItems(data);
        }
      }
      if (inspRes && inspRes.ok) {
        const data = await inspRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setInspections(data);
        }
      }
      if (ncrRes && ncrRes.ok) {
        const data = await ncrRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setNcrs(data);
        }
      }
    } catch (err) {
      console.error("Failed to load quality data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Entity Selection Handler for Context Rail (Rule #04 No Orphan Data)
  const handleSelectQuarantineEntity = (item: QuarantineItem) => {
    onSelectEntity?.({
      type: 'QUARANTINE_LOT',
      id: String(item.id),
      code: item.lotNumber,
      title: `Lô cách ly: ${item.itemName} (${item.lotNumber})`,
      status: item.status,
      lineage: [
        { id: `lot-${item.lotNumber}`, type: 'Lô Hàng Cách Ly', code: item.lotNumber, relation: 'QUARANTINE_LOT', status: item.status },
        { id: `source-${item.sourceRef}`, type: item.sourceType, code: item.sourceRef, relation: 'SOURCE_ORDER', status: 'PENDING_RELEASE' },
        { id: `sku-${item.itemSku}`, type: 'SKU Mặt Hàng', code: item.itemSku, relation: 'INVENTORY_ITEM', status: 'RESTRICTED' },
      ],
      auditTrail: [
        { id: 1, action: `Tiếp nhận lô hàng vào kho cách ly từ ${item.sourceType}`, timestamp: item.receivedDate ?? '2026-09-02', user: item.supplierOrDept ?? 'Warehouse Inbound', sha256Checksum: 'e4f3a2b10987654321fedcba' }
      ],
      glEntries: [
        { account: 'INV-QUARANTINE-156', accountName: 'Hàng hóa đang chờ kiểm định KCS (Tạm giữ)', debit: 0, credit: 0, description: `Lô hàng cách ly ${item.lotNumber} - ${item.quantity} ${item.unit}` }
      ]
    });
  };

  const handleSelectInspectionEntity = (insp: InspectionItem) => {
    onSelectEntity?.({
      type: 'QUALITY_INSPECTION',
      id: String(insp.id),
      code: insp.id,
      title: `${insp.type} - ${insp.item}`,
      status: insp.status,
      lineage: [
        { id: `insp-${insp.id}`, type: 'Phiếu Kiểm Định Chất Lượng', code: insp.id, relation: 'ROOT_INSPECTION', status: insp.status },
        { id: `prod-${insp.item}`, type: 'Mặt Hàng Thẩm Định KCS', code: insp.item, relation: 'INSPECTED_PRODUCT', status: 'AUDITED' },
        { id: `iso-9001`, type: 'Tiêu chuẩn chất lượng', code: 'ISO 9001:2015 QMS', relation: 'QUALITY_FRAMEWORK', status: 'COMPLIANT' },
      ],
      auditTrail: [
        { id: 1, action: `Thực hiện kiểm tra chất lượng ${insp.type}`, timestamp: insp.date ?? '2026-08-28', user: insp.inspector ?? 'QC Inspector', sha256Checksum: 'qc89a7b6c5d4e3f210987654' },
        { id: 2, action: `Kết luận thẩm định KCS: ${insp.status}`, timestamp: insp.date ?? '2026-08-28', user: 'Trưởng bộ phận KCS', sha256Checksum: '76543210fedcba9876543210' },
      ],
      glEntries: [
        { account: 'QMS-QUALITY-AUDIT', accountName: 'Quản Lý Chất Lượng & Chi Phí Kiểm Định KCS (ISO 9001)', debit: 0, credit: 0, description: `Hồ sơ kiểm định: ${insp.id} - ${insp.item}` }
      ]
    });
  };

  const handleSelectNCREntity = (ncr: NCRItem) => {
    onSelectEntity?.({
      type: 'QUALITY_NCR',
      id: String(ncr.id),
      code: ncr.id,
      title: `Biên bản NCR: ${ncr.id} - ${ncr.description}`,
      status: ncr.status,
      lineage: [
        { id: `ncr-${ncr.id}`, type: 'Biên bản không phù hợp NCR', code: ncr.id, relation: 'ROOT_NCR', status: ncr.status },
        { id: `ref-${ncr.refId}`, type: 'Phiếu Nguồn Phát Hiện Lỗi', code: ncr.refId, relation: 'SOURCE_DEFECT_REF', status: 'FLAGGED' },
        { id: `disp-${ncr.action}`, type: 'Phương án xử lý', code: ncr.action, relation: 'DISPOSITION_ACTION', status: ncr.status === 'Closed' ? 'RESOLVED' : 'PENDING' }
      ],
      auditTrail: [
        { id: 1, action: `Lập biên bản không phù hợp: ${ncr.description}`, timestamp: '2026-08-28', user: 'QC Engineer', sha256Checksum: 'def0123456789abc89abcdef' },
        { id: 2, action: `Phê duyệt phương án xử lý: ${ncr.action}`, timestamp: '2026-08-29', user: 'QA Manager', sha256Checksum: '9876543210fedcba12345678' }
      ],
      glEntries: [
        { account: 'NCR-SCRAP-REWORK-632', accountName: 'Chi Phí Tổn Thất Do Lỗi Hỏng & Sửa Chữa Phế Phẩm', debit: 0, credit: 0, description: `Xử lý NCR ${ncr.id} (${ncr.action})` }
      ]
    });
  };

  // Rule #19 ConfirmDialog Handlers
  const handleApproveQuarantine = (item: QuarantineItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Nghiệm thu KCS & Giải phóng Tồn kho',
      message: `Bạn có chắc chắn muốn phê duyệt lô hàng ${item.lotNumber} (${item.quantity} ${item.unit} ${item.itemName}) đạt chuẩn chất lượng IQC/OQC? Tồn kho sẽ được chuyển ngay từ QUARANTINE sang AVAILABLE trong M17 Inventory Core.`,
      variant: 'primary',
      confirmText: 'Phê duyệt & Giải phóng kho',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setQuarantineItems(prev => prev.filter(q => q.id !== item.id));
        const newInsp: InspectionItem = {
          id: `QA-${Date.now().toString().slice(-4)}`,
          type: item.sourceType.includes('PO') ? 'IQC (Đầu vào)' : 'OQC (Đầu ra)',
          item: `${item.itemName} (${item.lotNumber})`,
          date: new Date().toLocaleDateString('vi-VN'),
          status: 'Passed',
          inspector: 'Trưởng nhóm QC (QA Approved)',
          notes: `Nghiệm thu đạt chuẩn kỹ thuật dung sai. Giải phóng ${item.quantity} ${item.unit} sang kho khả dụng (Available).`
        };
        setInspections(prev => [newInsp, ...prev]);
        setConfirmDialog(null);
        onNotify?.('success', 'Nghiệm thu KCS hoàn tất', `Lô hàng ${item.lotNumber} đã được giải phóng sang Tồn khả dụng (Available).`);

        try {
          await fetch(`/api/quality/quarantine/${item.id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (err) {
          console.error("API approve quarantine failed:", err);
        }
      }
    });
  };

  const handleRejectQuarantine = (item: QuarantineItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cảnh báo: Lập biên bản không phù hợp (NCR)',
      message: `Xác nhận lô hàng ${item.lotNumber} (${item.itemName}) KHÔNG ĐẠT tiêu chuẩn chất lượng. Hệ thống sẽ khóa xuất và tạo phiếu NCR xử lý đổi trả/hủy.`,
      variant: 'danger',
      confirmText: 'Khóa hàng & Lập NCR',
      cancelText: 'Xem xét lại',
      onConfirm: async () => {
        setQuarantineItems(prev => prev.filter(q => q.id !== item.id));
        const newNcr: NCRItem = {
          id: `NCR-2026-${Date.now().toString().slice(-3)}`,
          refId: item.sourceRef,
          severity: 'High',
          description: `Lô ${item.lotNumber} (${item.itemName}): Sai lệch thông số kỹ thuật và độ cứng`,
          status: 'Open',
          action: item.sourceType.includes('PO') ? 'Return to Vendor (RTV)' : 'Scrap / Rework'
        };
        setNcrs(prev => [newNcr, ...prev]);
        setConfirmDialog(null);
        onNotify?.('danger', 'Đã lập biên bản NCR', `Lô ${item.lotNumber} đã chuyển vào danh mục xử lý lỗi.`);

        try {
          await fetch(`/api/quality/quarantine/${item.id}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (err) {
          console.error("API reject quarantine failed:", err);
        }
      }
    });
  };

  const handleCloseNCR = (ncr: NCRItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Đóng Biên Bản NCR',
      message: `Xác nhận đã hoàn thành biện pháp xử lý: "${ncr.action}" cho biên bản ${ncr.id}? Trạng thái sẽ chuyển thành CLOSED.`,
      variant: 'warning',
      confirmText: 'Đóng biên bản NCR',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setNcrs(prev => prev.map(n => n.id === ncr.id ? { ...n, status: 'Closed' } : n));
        setConfirmDialog(null);
        onNotify?.('success', 'Đóng NCR thành công', `Biên bản ${ncr.id} đã hoàn tất khắc phục.`);

        try {
          await fetch(`/api/quality/ncrs/${ncr.id}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolutionNotes: 'Đã hoàn tất nghiệm thu khắc phục theo chuẩn ISO 9001' })
          });
        } catch (err) {
          console.error("API close NCR failed:", err);
        }
      }
    });
  };

  // Submit Create QA Ticket
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItem.trim()) {
      onNotify?.('warning', 'Thiếu thông tin', 'Vui lòng nhập tên hạng mục hoặc sản phẩm kiểm tra.');
      return;
    }

    try {
      const res = await fetch('/api/quality/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          item: formItem,
          inspector: formInspector,
          notes: formNotes
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setInspections(prev => [saved, ...prev]);
      } else {
        const fallbackInsp: InspectionItem = {
          id: `QA-${Date.now().toString().slice(-4)}`,
          type: formType,
          item: formItem,
          date: new Date().toLocaleDateString('vi-VN'),
          status: 'Pending',
          inspector: formInspector,
          notes: formNotes
        };
        setInspections(prev => [fallbackInsp, ...prev]);
      }

      onNotify?.('success', 'Tạo phiếu thành công', `Phiếu kiểm định ${formType} cho ${formItem} đã được tạo.`);
      setIsCreateModalOpen(false);
      setFormItem('');
      setFormNotes('');
    } catch (err) {
      console.error(err);
      onNotify?.('danger', 'Lỗi hệ thống', 'Không thể tạo phiếu kiểm định lúc này.');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Mã Phiếu', 'Loại Kiểm Tra', 'Hạng Mục / Sản Phẩm', 'Ngày KT', 'Người Phụ Trách', 'Trạng Thái', 'Ghi Chú'];
    const rows = inspections.map(i => [
      i.id,
      i.type,
      `"${i.item}"`,
      i.date,
      `"${i.inspector}"`,
      i.status,
      `"${i.notes || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_KCS_M39_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify?.('info', 'Đã xuất dữ liệu', 'Báo cáo kiểm định chất lượng đã được tải xuống.');
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Passed':
      case 'Closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {status === 'Passed' ? 'Đạt Chuẩn (Passed)' : 'Đã Đóng (Closed)'}
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Không Đạt (Failed)
          </span>
        );
      case 'Open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Đang Xử Lý (Open)
          </span>
        );
      case 'Pending':
      case 'PENDING_INSPECTION':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Chờ Kiểm Tra (Pending)
          </span>
        );
    }
  };

  // Filtering
  const filteredQuarantine = useMemo(() => {
    return quarantineItems.filter(item => {
      const q = quarantineSearch.toLowerCase();
      return (
        item.lotNumber.toLowerCase().includes(q) ||
        item.itemName.toLowerCase().includes(q) ||
        item.itemSku.toLowerCase().includes(q) ||
        item.sourceRef.toLowerCase().includes(q)
      );
    });
  }, [quarantineItems, quarantineSearch]);

  const filteredInspections = useMemo(() => {
    return inspections.filter(item => {
      const q = inspectionSearch.toLowerCase();
      const matchSearch = item.id.toLowerCase().includes(q) || item.item.toLowerCase().includes(q) || item.inspector.toLowerCase().includes(q);
      const matchType = inspectionTypeFilter === 'ALL' || item.type.includes(inspectionTypeFilter);
      const matchStatus = inspectionStatusFilter === 'ALL' || item.status === inspectionStatusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [inspections, inspectionSearch, inspectionTypeFilter, inspectionStatusFilter]);

  const filteredNCRs = useMemo(() => {
    return ncrs.filter(ncr => {
      const q = ncrSearch.toLowerCase();
      const matchSearch = ncr.id.toLowerCase().includes(q) || ncr.refId.toLowerCase().includes(q) || ncr.description.toLowerCase().includes(q);
      const matchSeverity = ncrSeverityFilter === 'ALL' || ncr.severity === ncrSeverityFilter;
      const matchStatus = ncrStatusFilter === 'ALL' || ncr.status === ncrStatusFilter;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [ncrs, ncrSearch, ncrSeverityFilter, ncrStatusFilter]);

  // Paginated Slices
  const paginatedQuarantine = useMemo(() => {
    const start = (quarantinePage - 1) * quarantinePageSize;
    return filteredQuarantine.slice(start, start + quarantinePageSize);
  }, [filteredQuarantine, quarantinePage, quarantinePageSize]);

  const paginatedInspections = useMemo(() => {
    const start = (inspectionPage - 1) * inspectionPageSize;
    return filteredInspections.slice(start, start + inspectionPageSize);
  }, [filteredInspections, inspectionPage, inspectionPageSize]);

  const paginatedNCRs = useMemo(() => {
    const start = (ncrPage - 1) * ncrPageSize;
    return filteredNCRs.slice(start, start + ncrPageSize);
  }, [filteredNCRs, ncrPage, ncrPageSize]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto space-y-6 p-6">
      {/* ConfirmDialog Rule #19 */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* ================= TẦNG L0: WORKSPACE BANNER ================= */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-1">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold rounded border border-blue-400/30">
                M39 • QUALITY CONTROL & QMS
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Rule #19 & #20 Confirmed
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-[11px] font-mono font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                Pass Rate: 98.4% (QMS Certified)
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Quản lý Chất lượng & Cổng KCS (Quality Control & QMS)
            </h1>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Kiểm soát quy trình nghiệm thu IQC/OQC/IPQC, giải phóng hàng cách ly (Quarantine Gate theo Rule #03) và xử lý sự không phù hợp (NCR/CAPA) theo tiêu chuẩn ISO 9001:2015.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all border border-emerald-500/30 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo KCS</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all border border-blue-500/30 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Phiếu QA Mới</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* ================= DEEP LINK BANNER SANG M40 EHS ================= */}
      <DeepLinkBanner
        targetModule="M40"
        targetRoute="/ehs"
        title="Liên kết Hành động Khắc phục CAPA & An Toàn Lao Động (M40)"
        description="Mọi biên bản không phù hợp (NCR/CAPA) và khiếm khuyết kỹ thuật tại xưởng sản xuất đều được liên kết trực tiếp với hồ sơ an toàn lao động M40, đánh giá rủi ro hiện trường JRA và hệ tiêu chuẩn ISO 45001 / ISO 14001."
        actionText="Mở An Toàn Lao Động M40 →"
        badgeText="M40 EHS SAFETY & ENVIRONMENT"
        variant="blue"
      />

      {/* ================= TẦNG L1: SUB-TABS NAVIGATION BAR ================= */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('quarantine_gate')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'quarantine_gate'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Cổng KCS & Tồn Cách Ly</span>
            {quarantineItems.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'quarantine_gate' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
              }`}>
                {quarantineItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspections')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'inspections'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span>Nhật ký Thanh tra (Inspections)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'inspections' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {inspections.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ncrs')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'ncrs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Báo cáo không phù hợp (NCR)</span>
            {ncrs.filter(n => n.status === 'Open').length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'ncrs' ? 'bg-blue-700 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
              }`}>
                {ncrs.filter(n => n.status === 'Open').length} mở
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Phân tích Chất lượng</span>
          </button>
        </div>

        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 font-semibold shrink-0 border-l border-slate-200 dark:border-slate-700 pl-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Kiểm soát Tiêu chuẩn ISO 9001</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">
            AQL Sampling Ready
          </span>
        </div>
      </div>

      {/* ================= TẦNG L2: DYNAMIC KPI SUMMARY STRIP ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {activeTab === 'quarantine_gate' && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Chờ Duyệt KCS (Quarantine)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">{quarantineItems.length}</span>
                  <span className="text-xs font-medium text-slate-500">Lô hàng cách ly</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Boxes className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng Khối Lượng Tạm Giữ</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {quarantineItems.reduce((acc, q) => acc + q.quantity, 0).toLocaleString('vi-VN')}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Đơn vị SKU</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nguồn Inbound PO (GRN)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {quarantineItems.filter(q => q.sourceType.includes('PO')).length}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Đơn mua hàng</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Thành Phẩm MES (WO)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {quarantineItems.filter(q => q.sourceType.includes('MES')).length}
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Lệnh xuất xưởng</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </>
        )}

        {activeTab === 'inspections' && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng Số Lượt Kiểm Định</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">{inspections.length}</span>
                  <span className="text-xs font-medium text-slate-500">Hồ sơ KCS</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ClipboardCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tỷ Lệ Đạt (Pass Rate)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                    {inspections.length > 0 ? Math.round((inspections.filter(i => i.status === 'Passed').length / inspections.length) * 100) : 0}%
                  </span>
                  <span className="text-xs font-medium text-emerald-600">+1.2% ISO 9001</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Không Đạt (Failed)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                    {inspections.filter(i => i.status === 'Failed').length}
                  </span>
                  <span className="text-xs font-medium text-rose-600">Cần tạo NCR</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400">
                <XCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Chờ Đánh Giá (Pending)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                    {inspections.filter(i => i.status === 'Pending').length}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Đang kiểm tra</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </>
        )}

        {activeTab === 'ncrs' && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">NCR Đang Mở (Open)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                    {ncrs.filter(n => n.status === 'Open').length}
                  </span>
                  <span className="text-xs font-medium text-rose-600">Cần xử lý</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nghiêm Trọng (High Severity)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {ncrs.filter(n => n.severity === 'High').length}
                  </span>
                  <span className="text-xs font-medium text-amber-600">Ưu tiên xử lý</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Đã Hoàn Tất Khắc Phục</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                    {ncrs.filter(n => n.status === 'Closed').length}
                  </span>
                  <span className="text-xs font-medium text-emerald-600">Đã đóng hồ sơ</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tỷ Lệ Xử Lý NCR</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                    {ncrs.length > 0 ? Math.round((ncrs.filter(n => n.status === 'Closed').length / ncrs.length) * 100) : 0}%
                  </span>
                  <span className="text-xs font-medium text-slate-500">QMS Standard</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tỷ Lệ Yield Chung</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">96.8%</span>
                  <span className="text-xs font-medium text-emerald-600">+0.6% vs tuần trước</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng Ca Kiểm Định (Tuần)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">305</span>
                  <span className="text-xs font-medium text-slate-500">Mẫu thử KCS</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tỷ Lệ Rework Phế Phẩm</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">4.9%</span>
                  <span className="text-xs font-medium text-amber-600">Trong ngưỡng cho phép</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Đạt Chuẩn ISO 9001:2015</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">100%</span>
                  <span className="text-xs font-medium text-emerald-600">Audit Ready</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================= TẦNG L3: MAIN CONTENT VIEWS ================= */}
      <div className="flex-1">
        {/* TAB 1: CỔNG KCS & TỒN KHO CÁCH LY */}
        {activeTab === 'quarantine_gate' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex flex-col overflow-hidden">
            {/* Rule #03 Information Notice */}
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Cổng Kiểm Định Nghiệm Thu & Tồn Kho Cách Ly (Quarantine Gate)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Hàng nhập từ Inbound PO (GRN) hoặc Thành phẩm MES (WO) được tự động giữ tại kho cách ly. Phê duyệt ĐẠT để giải phóng sang Tồn khả dụng (Available) theo tiêu chuẩn Rule #03.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 whitespace-nowrap self-start sm:self-auto font-mono">
                Rule #03 Single Writer Gate
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã lô, tên mặt hàng, SKU, đơn nguồn..."
                  value={quarantineSearch}
                  onChange={(e) => {
                    setQuarantineSearch(e.target.value);
                    setQuarantinePage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Hiển thị <span className="font-bold text-blue-600 dark:text-blue-400">{filteredQuarantine.length}</span> lô hàng chờ duyệt
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="px-5 py-3">Mã Lô (Lot #)</th>
                    <th className="px-5 py-3">Mặt Hàng & SKU</th>
                    <th className="px-5 py-3">Nguồn Gốc (PO/WO)</th>
                    <th className="px-5 py-3 text-right">Số Lượng Cách Ly</th>
                    <th className="px-5 py-3">Xuất Xứ / Bộ Phận</th>
                    <th className="px-5 py-3">Ngày Nhận</th>
                    <th className="px-5 py-3 text-center">Trạng Thái</th>
                    <th className="px-5 py-3 text-center">Hành Động Kiểm Định</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                  {paginatedQuarantine.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <PackageCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                        <p className="font-medium text-sm">Không còn lô hàng nào chờ kiểm định trong kho cách ly.</p>
                        <p className="text-xs text-slate-400 mt-1">Tất cả hàng hóa đã được thẩm định hoặc chuyển xử lý lỗi.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedQuarantine.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleSelectQuarantineEntity(item)}
                        className="hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition-colors border-l-4 border-l-blue-500 cursor-pointer"
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.lotNumber}
                          <div className="text-[10px] font-normal text-slate-400 font-mono">{item.id}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{item.itemName}</div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{item.itemSku}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                            {item.sourceType}
                          </span>
                          <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-semibold">
                            {item.sourceRef}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                          {item.quantity.toLocaleString('vi-VN')} {item.unit}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 max-w-[180px] truncate" title={item.supplierOrDept}>
                          {item.supplierOrDept}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                          {item.receivedDate}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleApproveQuarantine(item)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Nghiệm Thu Đạt</span>
                            </button>
                            <button
                              onClick={() => handleRejectQuarantine(item)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Lập NCR</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination L4 */}
            {filteredQuarantine.length > quarantinePageSize && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <PaginationControl
                  currentPage={quarantinePage}
                  totalPages={Math.ceil(filteredQuarantine.length / quarantinePageSize)}
                  pageSize={quarantinePageSize}
                  totalItems={filteredQuarantine.length}
                  startIndex={(quarantinePage - 1) * quarantinePageSize + 1}
                  endIndex={Math.min(quarantinePage * quarantinePageSize, filteredQuarantine.length)}
                  onPageChange={setQuarantinePage}
                  onPageSizeChange={(sz) => {
                    setQuarantinePageSize(sz);
                    setQuarantinePage(1);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NHẬT KÝ THANH TRA (INSPECTIONS AUDIT) */}
        {activeTab === 'inspections' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-[280px] flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm mã phiếu, sản phẩm, chuyên viên..."
                    value={inspectionSearch}
                    onChange={(e) => {
                      setInspectionSearch(e.target.value);
                      setInspectionPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={inspectionTypeFilter}
                  onChange={(e) => {
                    setInspectionTypeFilter(e.target.value);
                    setInspectionPage(1);
                  }}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả loại KCS</option>
                  <option value="IQC">IQC (Đầu vào)</option>
                  <option value="OQC">OQC (Đầu ra)</option>
                  <option value="IPQC">IPQC (Trong SX)</option>
                </select>

                <select
                  value={inspectionStatusFilter}
                  onChange={(e) => {
                    setInspectionStatusFilter(e.target.value);
                    setInspectionPage(1);
                  }}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả kết quả</option>
                  <option value="Passed">Đạt chuẩn (Passed)</option>
                  <option value="Failed">Không đạt (Failed)</option>
                  <option value="Pending">Chờ kiểm tra (Pending)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Phiếu KCS</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="px-5 py-3">Mã Phiếu QA</th>
                    <th className="px-5 py-3">Loại Kiểm Tra</th>
                    <th className="px-5 py-3">Hạng Mục / Sản Phẩm</th>
                    <th className="px-5 py-3">Ngày Kiểm Tra</th>
                    <th className="px-5 py-3">Chuyên Viên KCS</th>
                    <th className="px-5 py-3">Ghi Chú Dung Sai</th>
                    <th className="px-5 py-3 text-center">Kết Quả</th>
                    <th className="px-5 py-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                  {paginatedInspections.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                        <p className="font-medium text-sm">Không tìm thấy phiếu kiểm định nào phù hợp.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedInspections.map((row) => {
                      const isPassed = row.status === 'Passed';
                      const isFailed = row.status === 'Failed';
                      return (
                        <tr
                          key={row.id}
                          onClick={() => handleSelectInspectionEntity(row)}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors border-l-4 cursor-pointer ${
                            isPassed
                              ? 'border-l-emerald-500'
                              : isFailed
                              ? 'border-l-rose-500'
                              : 'border-l-amber-500'
                          }`}
                        >
                          <td className="px-5 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {row.id}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                              {row.type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                            {row.item}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                            {row.date}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                            {row.inspector}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={row.notes}>
                            {row.notes || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {getStatusBadge(row.status)}
                          </td>
                          <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setDetailInspection(row)}
                              className="px-2.5 py-1 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Chi tiết 360°</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination L4 */}
            {filteredInspections.length > inspectionPageSize && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <PaginationControl
                  currentPage={inspectionPage}
                  totalPages={Math.ceil(filteredInspections.length / inspectionPageSize)}
                  pageSize={inspectionPageSize}
                  totalItems={filteredInspections.length}
                  startIndex={(inspectionPage - 1) * inspectionPageSize + 1}
                  endIndex={Math.min(inspectionPage * inspectionPageSize, filteredInspections.length)}
                  onPageChange={setInspectionPage}
                  onPageSizeChange={(sz) => {
                    setInspectionPageSize(sz);
                    setInspectionPage(1);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BÁO CÁO KHÔNG PHÙ HỢP (NCR) */}
        {activeTab === 'ncrs' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-[280px] flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm mã NCR, mã phiếu nguồn, nội dung lỗi..."
                    value={ncrSearch}
                    onChange={(e) => {
                      setNcrSearch(e.target.value);
                      setNcrPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={ncrSeverityFilter}
                  onChange={(e) => {
                    setNcrSeverityFilter(e.target.value);
                    setNcrPage(1);
                  }}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả mức độ</option>
                  <option value="High">Nghiêm trọng (High)</option>
                  <option value="Medium">Trung bình (Medium)</option>
                  <option value="Low">Nhẹ (Low)</option>
                </select>

                <select
                  value={ncrStatusFilter}
                  onChange={(e) => {
                    setNcrStatusFilter(e.target.value);
                    setNcrPage(1);
                  }}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Open">Đang mở (Open)</option>
                  <option value="Closed">Đã đóng (Closed)</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Tổng cộng <span className="font-bold text-rose-600 dark:text-rose-400">{filteredNCRs.length}</span> biên bản NCR
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="px-5 py-3">Mã NCR</th>
                    <th className="px-5 py-3">Phiếu Nguồn Phát Hiện</th>
                    <th className="px-5 py-3">Mô Tả Lỗi Sai Lệch</th>
                    <th className="px-5 py-3 text-center">Mức Độ</th>
                    <th className="px-5 py-3">Biện Pháp Xử Lý (Disposition)</th>
                    <th className="px-5 py-3 text-center">Trạng Thái</th>
                    <th className="px-5 py-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                  {paginatedNCRs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                        <p className="font-medium text-sm">Không có biên bản NCR nào cần xử lý.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedNCRs.map((row) => {
                      const isHigh = row.severity === 'High';
                      const isMedium = row.severity === 'Medium';
                      return (
                        <tr
                          key={row.id}
                          onClick={() => handleSelectNCREntity(row)}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors border-l-4 cursor-pointer ${
                            isHigh
                              ? 'border-l-rose-500'
                              : isMedium
                              ? 'border-l-amber-500'
                              : 'border-l-blue-500'
                          }`}
                        >
                          <td className="px-5 py-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                            {row.id}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {row.refId}
                          </td>
                          <td className="px-5 py-3.5 max-w-sm truncate text-slate-900 dark:text-white" title={row.description}>
                            {row.description}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                              isHigh
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                : isMedium
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                            }`}>
                              {row.severity}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                            {row.action}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {getStatusBadge(row.status)}
                          </td>
                          <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            {row.status === 'Open' ? (
                              <button
                                onClick={() => handleCloseNCR(row)}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto transition-colors shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Đóng NCR</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono">Đã nghiệm thu</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination L4 */}
            {filteredNCRs.length > ncrPageSize && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <PaginationControl
                  currentPage={ncrPage}
                  totalPages={Math.ceil(filteredNCRs.length / ncrPageSize)}
                  pageSize={ncrPageSize}
                  totalItems={filteredNCRs.length}
                  startIndex={(ncrPage - 1) * ncrPageSize + 1}
                  endIndex={Math.min(ncrPage * ncrPageSize, filteredNCRs.length)}
                  onPageChange={setNcrPage}
                  onPageSizeChange={(sz) => {
                    setNcrPageSize(sz);
                    setNcrPage(1);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PHÂN TÍCH CHẤT LƯỢNG (ANALYTICS) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* BarChart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      Xu hướng kiểm tra chất lượng (7 ngày qua)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      So sánh tỷ lệ lô hàng đạt chuẩn (Passed) so với lỗi hỏng (Failed)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono">
                    Avg: 94.2% Pass
                  </span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <RechartsTooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                      <Legend />
                      <Bar dataKey="Passed" name="Đạt Chuẩn (Passed)" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} barSize={36} />
                      <Bar dataKey="Failed" name="Không Đạt (Failed)" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PieChart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Phân loại kết quả thẩm định (Tháng 09/2026)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tỷ trọng giữa sản phẩm đạt chuẩn, sửa lại và phế phẩm hủy bỏ
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-mono">
                    Total: 305 Ca
                  </span>
                </div>
                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => `${value} ca`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pareto Defect Breakdown Cards */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                Phân tích Nguyên nhân Lỗi phổ biến nhất (Six Sigma Pareto 80/20)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sai số kích thước / Dung sai</span>
                    <span className="text-xs font-bold text-rose-600 font-mono">48%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: '48%' }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Chủ yếu do dao phay mòn và hiệu chuẩn đồ gá gia công.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Trầy xước bề mặt / Ngoại quan</span>
                    <span className="text-xs font-bold text-amber-600 font-mono">26%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '26%' }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Phát sinh trong quá trình xếp dỡ và đóng gói vận chuyển.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lỗi áp suất / Độ kín khít</span>
                    <span className="text-xs font-bold text-blue-600 font-mono">16%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '16%' }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Lắp ráp gioăng làm kín chưa đúng lực siết mô-men.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sai lệch thông số điện tử</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">10%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                    <div className="bg-slate-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Nhiễu tín hiệu cảm biến trong môi trường điện từ cao.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL TẠO PHIẾU QA / KIỂM ĐỊNH ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tạo Phiếu QA / Kiểm Định Chất Lượng</h3>
                  <p className="text-xs text-slate-300">Khởi tạo hồ sơ KCS mới theo tiêu chuẩn QMS ISO 9001</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Loại Kiểm Tra KCS
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="IQC (Đầu vào)">IQC — Kiểm tra nguyên vật liệu đầu vào (Incoming QC)</option>
                  <option value="OQC (Đầu ra)">OQC — Kiểm tra thành phẩm xuất xưởng (Outgoing QC)</option>
                  <option value="IPQC (Trong SX)">IPQC — Kiểm tra công đoạn sản xuất (In-Process QC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hạng Mục / Sản Phẩm Cần Kiểm Tra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Động cơ servo 750W hoặc Thép tấm SS400..."
                  value={formItem}
                  onChange={(e) => setFormItem(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chuyên Viên Phụ Trách KCS
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên nhân viên kiểm định..."
                  value={formInspector}
                  onChange={(e) => setFormInspector(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi Chú Kỹ Thuật & Yêu Cầu Dung Sai
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả tiêu chuẩn dung sai kỹ thuật, giới hạn biên độ đo lường..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  Xác nhận Tạo Phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CHI TIẾT HỒ SƠ KCS 360° ================= */}
      {detailInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-900 to-[#1e293b] text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hồ Sơ Thẩm Định KCS 360°: {detailInspection.id}</h3>
                  <p className="text-xs text-slate-300">{detailInspection.type} • {detailInspection.item}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailInspection(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Mã Hồ Sơ</span>
                  <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{detailInspection.id}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Ngày Thực Hiện</span>
                  <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">{detailInspection.date}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Người Kiểm Định</span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">{detailInspection.inspector}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Trạng Thái KCS</span>
                  <div className="mt-0.5">{getStatusBadge(detailInspection.status)}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Ghi Chú Kỹ Thuật & Đánh Giá Dung Sai
                </h4>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {detailInspection.notes || 'Hạng mục kiểm tra đạt đầy đủ các chỉ số kỹ thuật dung sai, độ cứng và ngoại quan bề mặt.'}
                </div>
              </div>

              {/* Data Graph Lineage */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Cây Phả Hệ Dữ Liệu Doanh Nghiệp (Enterprise Lineage Graph)
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">Phiếu KCS Gốc: {detailInspection.id}</span>
                        <p className="text-[10px] text-slate-500">Mã kiểm định chất lượng trung tâm</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      ROOT_INSPECTION
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">Hệ Quy Chuẩn ISO 9001:2015</span>
                        <p className="text-[10px] text-slate-500">Hệ thống quản lý chất lượng nhà máy</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      COMPLIANT
                    </span>
                  </div>
                </div>
              </div>

              {/* Audit Checksum */}
              <div className="p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[11px] flex items-center justify-between">
                <span>Kiểm toán SHA-256 Checksum:</span>
                <span className="text-emerald-400 font-bold">qc89a7b6c5d4e3f2109876543210fedcba</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
              <button
                onClick={() => setDetailInspection(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
