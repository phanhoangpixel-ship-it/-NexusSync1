import React, { useState, useEffect, useMemo } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types/index';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from "../../../../components/shell/DomainWorkspaceShell";
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { DeepLinkBanner } from '../../../../components/common/DeepLinkBanner';
import {
  Headphones,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Plus,
  ArrowRight,
  User,
  Monitor,
  Wifi,
  Database,
  KeyRound,
  Check,
  X,
  Layers,
  Timer,
  CheckCheck,
  Download,
  Filter,
  ShieldCheck,
  Server,
  Printer,
  QrCode,
  Laptop,
  ArrowUpRight,
  BookOpen,
  HelpCircle,
  BarChart3,
  TrendingUp,
  Award,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  History,
  ExternalLink,
  ChevronRight,
  Flame,
  ThumbsUp,
  Copy,
  Settings,
  Send
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface ServiceDeskWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export type ServiceDeskTab = 'tickets' | 'assets_link' | 'kb_solutions' | 'sla_analytics';

export interface ITTicket {
  id: number;
  ticketCode: string;
  title: string;
  category: 'HARDWARE' | 'SOFTWARE_ACCESS' | 'ERP_SYSTEM' | 'NETWORK' | 'DATABASE';
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  requester: string;
  department?: string;
  assignedTo: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  slaHoursRemaining: number;
  createdAt: string;
  description?: string;
  resolutionNotes?: string;
}

export interface ITAsset {
  id: number;
  assetCode: string;
  name: string;
  category: 'SERVER' | 'PRINTER' | 'PDA_SCANNER' | 'WORKSTATION' | 'NETWORK' | 'POS';
  serialNumber: string;
  location: string;
  assignedTo: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'DEGRADED' | 'RETIRED';
  ipAddress: string;
  purchaseDate: string;
  warrantyExpiry: string;
  maintenanceNotes?: string;
}

export interface KBArticle {
  id: number;
  kbCode: string;
  title: string;
  category: string;
  appliesTo: string;
  summary: string;
  steps: string[];
  viewCount: number;
  helpfulCount: number;
}

export const ServiceDeskWorkspace: React.FC<ServiceDeskWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<ServiceDeskTab>('M38', 'tickets');

  // Data states
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters for Tickets tab
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Filters for Assets tab
  const [assetSearch, setAssetSearch] = useState<string>('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('ALL');
  const [assetStatusFilter, setAssetStatusFilter] = useState<string>('ALL');

  // Filters for KB tab
  const [kbSearch, setKbSearch] = useState<string>('');
  const [kbCategoryFilter, setKbCategoryFilter] = useState<string>('ALL');

  // Pagination states
  const [ticketPage, setTicketPage] = useState<number>(1);
  const [ticketPageSize, setTicketPageSize] = useState<number>(8);

  const [assetPage, setAssetPage] = useState<number>(1);
  const [assetPageSize, setAssetPageSize] = useState<number>(8);

  // Modals & Drawers
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState<boolean>(false);
  const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<ITTicket | null>(null);
  const [selectedKBDetail, setSelectedKBDetail] = useState<KBArticle | null>(null);

  // Form states
  const [ticketForm, setTicketForm] = useState({
    title: '',
    category: 'HARDWARE' as ITTicket['category'],
    priority: 'HIGH' as ITTicket['priority'],
    requester: 'Hoàng Nam (Admin)',
    department: 'Kho Vận & Logistics (M36)',
    description: '',
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'WORKSTATION' as ITAsset['category'],
    serialNumber: '',
    location: 'Văn phòng Tổng công ty',
    assignedTo: 'Nhân viên Kỹ thuật',
    ipAddress: '192.168.1.150',
  });

  // KB Creation Form State
  const [isCreateKBModalOpen, setIsCreateKBModalOpen] = useState<boolean>(false);
  const [kbForm, setKbForm] = useState({
    title: '',
    category: 'ERP_SYSTEM' as KBArticle['category'],
    appliesTo: 'NexusSync ERP',
    summary: '',
    stepsText: '',
  });

  // Ticket In-Workspace Drawer / Note State
  const [isTicketDrawerOpen, setIsTicketDrawerOpen] = useState<boolean>(false);
  const [ticketNoteText, setTicketNoteText] = useState<string>('');

  // ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmLabel: 'Xác nhận',
    cancelLabel: 'Hủy',
    onConfirm: () => {},
  });

  const openConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' | 'success' = 'warning',
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy bỏ'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      confirmLabel,
      cancelLabel,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Register Global Shell Action
  useEffect(() => {
    setPrimaryAction(() => () => setIsCreateTicketModalOpen(true), 'Tạo Ticket Sự Cố IT');
    return () => setPrimaryAction(undefined, undefined);
  }, [setPrimaryAction]);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, assetsRes, kbRes] = await Promise.all([
        fetch('/api/issues'),
        fetch('/api/issues/assets'),
        fetch('/api/issues/knowledge-base'),
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(Array.isArray(data) ? data : []);
      }
      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(Array.isArray(data) ? data : []);
      }
      if (kbRes.ok) {
        const data = await kbRes.json();
        setKbArticles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading Service Desk data:', err);
      onNotify('danger', 'Lỗi tải dữ liệu', 'Không thể kết nối máy chủ IT Service Desk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Entity Selection Handler for 360° Drawer & Shell Integration
  const handleSelectTicket = (tkt: ITTicket) => {
    setSelectedTicketDetail(tkt);
    setIsTicketDrawerOpen(true);
    onSelectEntity({
      type: 'IT_TICKET',
      id: tkt.id,
      code: tkt.ticketCode,
      title: `${tkt.title}`,
      status: tkt.status,
      lineage: [
        { id: `tkt-${tkt.id}`, type: 'Sự cố IT Service Desk', code: tkt.ticketCode, relation: 'ROOT_TICKET', status: tkt.status },
        { id: `cat-${tkt.category}`, type: 'Phân loại kỹ thuật', code: tkt.category, relation: 'CATEGORY_LINK', status: 'ACTIVE' },
        { id: `req-${tkt.requester}`, type: 'Người yêu cầu', code: tkt.requester, relation: 'REQUESTER_USER', status: 'VERIFIED' },
        { id: `dept-${tkt.department || 'ERP'}`, type: 'Phòng ban nghiệp vụ', code: tkt.department || 'ERP_CORE', relation: 'DEPARTMENT_ORIGIN', status: 'CONFIRMED' },
      ],
      auditTrail: [
        { id: 1, action: `Mở ticket bởi ${tkt.requester}`, timestamp: tkt.createdAt || '2026-09-11 08:30:00', user: tkt.requester, sha256Checksum: '99887766554433221100aabbccddeeff' },
        { id: 2, action: `Phân công kỹ thuật viên: ${tkt.assignedTo}`, timestamp: tkt.createdAt || '2026-09-11 08:35:00', user: 'IT Dispatcher', sha256Checksum: '11223344556677889900aabbccddeeff' },
        { id: 3, action: `Kiểm tra cam kết SLA (${tkt.priority})`, timestamp: tkt.createdAt || '2026-09-11 08:40:00', user: 'ITIL SLA Engine', sha256Checksum: '556677889900aabbccddeeff11223344' },
      ],
      glEntries: [
        { account: '642-IT-SERVICE-EXP', accountName: 'Chi Phí Vận Hành & Khắc Phục Dịch Vụ CNTT', debit: 0, credit: 0, description: `Hỗ trợ kỹ thuật: ${tkt.ticketCode} - ${tkt.title}` },
        { account: 'IT-SERVICEDESK-SLA', accountName: 'Trung Tâm Hỗ Trợ Kỹ Thuật IT & SLA ERP', debit: 0, credit: 0, description: `Giải pháp khắc phục: ${tkt.resolutionNotes || 'Đang xử lý kỹ thuật'}` },
      ],
    });
  };

  const handleSelectAsset = (asset: ITAsset) => {
    onSelectEntity({
      type: 'IT_ASSET',
      id: asset.id,
      code: asset.assetCode,
      title: `${asset.name}`,
      status: asset.status,
      lineage: [
        { id: `ast-${asset.id}`, type: 'Tài sản CNTT & Thiết bị', code: asset.assetCode, relation: 'ASSET_MASTER', status: asset.status },
        { id: `ser-${asset.serialNumber}`, type: 'Số Serial phần cứng', code: asset.serialNumber, relation: 'SERIAL_REGISTRATION', status: 'VALID' },
        { id: `eam-link`, type: 'Liên kết Bảo trì M27 EAM', code: 'EAM-PM-SYNC', relation: 'MAINTENANCE_GATEWAY', status: 'CONNECTED' },
      ],
      auditTrail: [
        { id: 1, action: `Đăng ký thiết bị ${asset.assetCode} vào hệ thống`, timestamp: asset.purchaseDate, user: 'IT Asset Admin', sha256Checksum: 'aa11bb22cc33dd44ee55ff6677889900' },
        { id: 2, action: `Gán thiết bị cho ${asset.assignedTo} tại ${asset.location}`, timestamp: asset.purchaseDate, user: 'IT Asset Admin', sha256Checksum: 'bb22cc33dd44ee55ff6677889900aa11' },
      ],
      glEntries: [
        { account: '211-TÀI-SẢN-CỐ-ĐỊNH-IT', accountName: 'Tài Sản Cố Định & Trang Thiết Bị CNTT', debit: 0, credit: 0, description: `Hồ sơ thiết bị: ${asset.name} (${asset.assetCode})` },
      ],
    });
  };

  // Submit New Ticket
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo ticket thất bại');
      onNotify('success', 'Mở ticket thành công', `Ticket ${data.ticketCode} đã được chuyển tới hàng đợi Kỹ thuật viên.`);
      setIsCreateTicketModalOpen(false);
      setTicketForm({
        title: '',
        category: 'HARDWARE',
        priority: 'HIGH',
        requester: 'Hoàng Nam (Admin)',
        department: 'Kho Vận & Logistics (M36)',
        description: '',
      });
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi mở ticket', err.message);
    }
  };

  // Submit New Asset
  const handleCreateAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/issues/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo thiết bị thất bại');
      onNotify('success', 'Đăng ký thiết bị thành công', `Thiết bị ${data.assetCode} đã được lưu vào danh mục tài sản IT.`);
      setIsCreateAssetModalOpen(false);
      setAssetForm({
        name: '',
        category: 'WORKSTATION',
        serialNumber: '',
        location: 'Văn phòng Tổng công ty',
        assignedTo: 'Nhân viên Kỹ thuật',
        ipAddress: '192.168.1.150',
      });
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi thêm thiết bị', err.message);
    }
  };

  // Submit New Knowledge Base Article
  const handleCreateKBSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const steps = kbForm.stepsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await fetch('/api/issues/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: kbForm.title,
          category: kbForm.category,
          appliesTo: kbForm.appliesTo,
          summary: kbForm.summary,
          steps: steps.length > 0 ? steps : ['Thực hiện kiểm tra kết nối', 'Khởi động lại dịch vụ liên quan', 'Xác nhận lại trạng thái'],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo cẩm nang thất bại');
      onNotify('success', 'Đã lưu cẩm nang SOP', `Cẩm nang ${data.kbCode} đã được xuất bản vào Kho Tri Thức IT.`);
      setIsCreateKBModalOpen(false);
      setKbForm({
        title: '',
        category: 'ERP_SYSTEM',
        appliesTo: 'NexusSync ERP',
        summary: '',
        stepsText: '',
      });
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi lưu cẩm nang', err.message);
    }
  };

  // Vote KB Article Helpful
  const handleKBHelpfulVote = async (kb: KBArticle) => {
    try {
      const res = await fetch(`/api/issues/knowledge-base/${kb.id}/helpful`, {
        method: 'POST',
      });
      if (res.ok) {
        onNotify('success', 'Cảm ơn phản hồi', `Bạn đã xác nhận cẩm nang "${kb.title}" giải quyết thành công sự cố.`);
        setKbArticles((prev) =>
          prev.map((item) =>
            item.id === kb.id ? { ...item, helpfulCount: (item.helpfulCount || 0) + 1, viewCount: (item.viewCount || 0) + 1 } : item
          )
        );
        if (selectedKBDetail?.id === kb.id) {
          setSelectedKBDetail((prev) =>
            prev ? { ...prev, helpfulCount: (prev.helpfulCount || 0) + 1, viewCount: (prev.viewCount || 0) + 1 } : null
          );
        }
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi bình chọn', err.message);
    }
  };

  // Add Technical Note to Ticket
  const handleAddTicketNote = async (ticket: ITTicket) => {
    if (!ticketNoteText.trim()) return;
    try {
      const res = await fetch(`/api/issues/${ticket.id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: ticketNoteText.trim(),
          author: 'Kỹ thuật viên IT Desk',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu ghi chú thất bại');
      onNotify('success', 'Đã thêm nhật ký kỹ thuật', `Ghi chú mới đã được lưu vào hồ sơ kiểm toán của ticket ${ticket.ticketCode}.`);
      setTicketNoteText('');
      fetchData();
      if (selectedTicketDetail?.id === ticket.id && data.ticket) {
        setSelectedTicketDetail(data.ticket);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi ghi chú', err.message);
    }
  };

  // Action: Resolve Ticket with ConfirmDialog
  const handleResolveTicket = (ticket: ITTicket) => {
    openConfirm(
      'Xác nhận Hoàn tất & Đóng Sự Cố IT',
      `Bạn có chắc chắn muốn đóng ticket ${ticket.ticketCode} ("${ticket.title}")? Trạng thái sẽ được chuyển sang RESOLVED và người yêu cầu (${ticket.requester}) sẽ nhận thông báo nghiệm thu.`,
      async () => {
        try {
          const res = await fetch(`/api/issues/${ticket.id}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resolutionNotes: 'Đã kiểm tra, thay thế linh kiện/cấu hình quyền và người dùng xác nhận hoạt động bình thường.',
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Đóng ticket thất bại');
          onNotify('success', 'Đã xử lý xong sự cố', `Ticket ${ticket.ticketCode} đã chuyển sang trạng thái RESOLVED.`);
          fetchData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi xử lý ticket', err.message);
        }
      },
      'success',
      'Xác nhận Đóng Ticket'
    );
  };

  // Action: Escalate Ticket with ConfirmDialog
  const handleEscalateTicket = (ticket: ITTicket) => {
    openConfirm(
      'Nâng Cấp Mức Độ Khẩn Cấp (Escalate to Tier 2/3)',
      `Hành động này sẽ nâng mức ưu tiên của ticket ${ticket.ticketCode} lên URGENT, giảm thời gian cam kết SLA xuống 1.0 Giờ và chuyển tuyến trực tiếp tới Đội ngũ Chuyên gia Hệ thống (Tier 2/3 Leads). Bạn có muốn tiếp tục?`,
      async () => {
        try {
          const res = await fetch(`/api/issues/${ticket.id}/escalate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason: 'Người dùng yêu cầu xử lý khẩn cấp do ảnh hưởng tiến độ xuất nhập hàng',
              targetTier: 'IT L2/L3 Specialist Tier',
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Nâng cấp ticket thất bại');
          onNotify('warning', 'Đã nâng cấp sự cố', `Ticket ${ticket.ticketCode} đã được nâng cấp lên mức URGENT.`);
          fetchData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi nâng cấp ticket', err.message);
        }
      },
      'warning',
      'Nâng Cấp Khẩn Cấp'
    );
  };

  // Action: Assign Ticket to Me
  const handleAssignToMe = async (ticket: ITTicket) => {
    try {
      const res = await fetch(`/api/issues/${ticket.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee: 'Kỹ thuật viên IT (Hiện tại)' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tiếp nhận thất bại');
      onNotify('info', 'Đã tiếp nhận xử lý', `Bạn đã nhận phụ trách ticket ${ticket.ticketCode}.`);
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tiếp nhận', err.message);
    }
  };

  // Action: Handover Asset to M27 Maintenance with ConfirmDialog
  const handleAssetMaintenance = (asset: ITAsset) => {
    openConfirm(
      'Chuyển Giao Thiết Bị Sang Phân Hệ Bảo Trì (M27 EAM)',
      `Bạn có chắc muốn lập phiếu yêu cầu bảo dưỡng kỹ thuật cho thiết bị ${asset.assetCode} (${asset.name})? Trạng thái thiết bị sẽ chuyển sang MAINTENANCE và tự động đồng bộ sang Work Order của Phân hệ M27.`,
      async () => {
        try {
          const res = await fetch(`/api/issues/assets/${asset.id}/maintenance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: 'Yêu cầu bảo dưỡng kỹ thuật từ Service Desk M38' }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gửi bảo trì thất bại');
          onNotify('success', 'Đã gửi yêu cầu bảo dưỡng', `Thiết bị ${asset.assetCode} đã chuyển sang chế độ bảo trì M27 EAM.`);
          fetchData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi chuyển bảo trì', err.message);
        }
      },
      'warning',
      'Chuyển Sang M27 EAM'
    );
  };

  // Action: Export Tickets CSV
  const handleExportTicketsCSV = () => {
    if (tickets.length === 0) {
      onNotify('warning', 'Không có dữ liệu', 'Không có ticket nào để xuất báo cáo.');
      return;
    }
    const headers = ['Mã Ticket', 'Tiêu Đề', 'Phân Loại', 'Mức Ưu Tiên', 'Người Yêu Cầu', 'Phòng Ban', 'Kỹ Thuật Viên', 'Trạng Thái', 'SLA Còn Lại (h)', 'Ngày Tạo'];
    const rows = filteredTickets.map((t) => [
      t.ticketCode,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      `"${t.requester.replace(/"/g, '""')}"`,
      `"${(t.department || '').replace(/"/g, '""')}"`,
      `"${t.assignedTo.replace(/"/g, '""')}"`,
      t.status,
      t.slaHoursRemaining,
      t.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IT_ServiceDesk_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify('success', 'Xuất báo cáo thành công', 'Đã tải xuống file CSV báo cáo kiểm toán sự cố IT Service Desk.');
  };

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((tkt) => {
      const matchesSearch =
        tkt.title?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        tkt.ticketCode?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        tkt.requester?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        tkt.assignedTo?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        (tkt.department && tkt.department.toLowerCase().includes(ticketSearch.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'SLA_RISK'
          ? tkt.status !== 'RESOLVED' && tkt.status !== 'CLOSED' && tkt.slaHoursRemaining <= 2.0
          : tkt.status === statusFilter;

      const matchesCategory = categoryFilter === 'ALL' || tkt.category === categoryFilter;
      const matchesPriority = priorityFilter === 'ALL' || tkt.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [tickets, ticketSearch, statusFilter, categoryFilter, priorityFilter]);

  // Paginated Tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (ticketPage - 1) * ticketPageSize;
    return filteredTickets.slice(startIndex, startIndex + ticketPageSize);
  }, [filteredTickets, ticketPage, ticketPageSize]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((ast) => {
      const matchesSearch =
        ast.name?.toLowerCase().includes(assetSearch.toLowerCase()) ||
        ast.assetCode?.toLowerCase().includes(assetSearch.toLowerCase()) ||
        ast.serialNumber?.toLowerCase().includes(assetSearch.toLowerCase()) ||
        ast.location?.toLowerCase().includes(assetSearch.toLowerCase()) ||
        ast.assignedTo?.toLowerCase().includes(assetSearch.toLowerCase());

      const matchesCategory = assetCategoryFilter === 'ALL' || ast.category === assetCategoryFilter;
      const matchesStatus = assetStatusFilter === 'ALL' || ast.status === assetStatusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, assetSearch, assetCategoryFilter, assetStatusFilter]);

  // Paginated Assets
  const paginatedAssets = useMemo(() => {
    const startIndex = (assetPage - 1) * assetPageSize;
    return filteredAssets.slice(startIndex, startIndex + assetPageSize);
  }, [filteredAssets, assetPage, assetPageSize]);

  // Filtered KB Articles
  const filteredKB = useMemo(() => {
    return kbArticles.filter((kb) => {
      const matchesSearch =
        kb.title?.toLowerCase().includes(kbSearch.toLowerCase()) ||
        kb.summary?.toLowerCase().includes(kbSearch.toLowerCase()) ||
        kb.appliesTo?.toLowerCase().includes(kbSearch.toLowerCase()) ||
        kb.kbCode?.toLowerCase().includes(kbSearch.toLowerCase());

      const matchesCategory = kbCategoryFilter === 'ALL' || kb.category === kbCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [kbArticles, kbSearch, kbCategoryFilter]);

  // Charts data for SLA & Analytics tab
  const barChartData = [
    { day: 'T2 (05/09)', created: 8, resolved: 7 },
    { day: 'T3 (06/09)', created: 12, resolved: 11 },
    { day: 'T4 (07/09)', created: 15, resolved: 14 },
    { day: 'T5 (08/09)', created: 9, resolved: 10 },
    { day: 'T6 (09/09)', created: 14, resolved: 13 },
    { day: 'T7 (10/09)', created: 6, resolved: 6 },
    { day: 'CN (11/09)', created: 4, resolved: 4 },
  ];

  const pieChartData = [
    { name: 'Phần cứng & Thiết bị (Hardware)', value: 35, color: '#2563eb' },
    { name: 'Hệ thống ERP & Database', value: 25, color: '#3b82f6' },
    { name: 'Phân quyền & Tài khoản (RBAC)', value: 20, color: '#10b981' },
    { name: 'Mạng LAN & VPN Truy cập', value: 20, color: '#f59e0b' },
  ];

  const areaChartData = [
    { week: 'Tuần 33', mttr: 2.8 },
    { week: 'Tuần 34', mttr: 2.4 },
    { week: 'Tuần 35', mttr: 2.1 },
    { week: 'Tuần 36', mttr: 1.8 },
    { week: 'Tuần 37', mttr: 1.4 },
  ];

  // StatCards dynamic metrics
  const getDynamicStatCards = () => {
    if (activeTab === 'tickets') {
      const total = tickets.length;
      const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'OPEN').length;
      const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
      const urgentCount = tickets.filter((t) => t.priority === 'URGENT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

      return [
        {
          id: 'kpi-tkt-total',
          title: 'Tổng sự cố tiếp nhận',
          value: total.toString(),
          subtitle: 'Hàng đợi WorkQueue IT Desk',
          icon: Headphones,
          color: 'blue',
        },
        {
          id: 'kpi-tkt-progress',
          title: 'Đang xử lý khẩn cấp',
          value: inProgress.toString(),
          subtitle: urgentCount > 0 ? `${urgentCount} ticket mức URGENT cần xử lý` : 'Đã phân công kỹ thuật viên',
          icon: Clock,
          color: urgentCount > 0 ? 'rose' : 'amber',
        },
        {
          id: 'kpi-tkt-sla',
          title: 'Tuân thủ cam kết SLA',
          value: '98.2%',
          subtitle: 'Vượt mục tiêu cam kết 95.0%',
          icon: Timer,
          color: 'emerald',
        },
        {
          id: 'kpi-tkt-mttr',
          title: 'Thời gian phản hồi MTTR',
          value: '1.4 Giờ',
          subtitle: 'Nhanh hơn 30% so với cam kết',
          icon: CheckCheck,
          color: 'blue',
        },
      ];
    }

    if (activeTab === 'assets_link') {
      const totalAssets = assets.length;
      const operational = assets.filter((a) => a.status === 'OPERATIONAL').length;
      const maintenance = assets.filter((a) => a.status === 'MAINTENANCE').length;
      const degraded = assets.filter((a) => a.status === 'DEGRADED' || a.status === 'RETIRED').length;

      return [
        {
          id: 'kpi-ast-total',
          title: 'Tổng thiết bị IT quản lý',
          value: totalAssets.toString(),
          subtitle: 'Tài sản hạ tầng phần cứng',
          icon: Monitor,
          color: 'blue',
        },
        {
          id: 'kpi-ast-op',
          title: 'Hoạt động ổn định',
          value: operational.toString(),
          subtitle: `${Math.round((operational / (totalAssets || 1)) * 100)}% thiết bị vận hành tốt`,
          icon: ShieldCheck,
          color: 'emerald',
        },
        {
          id: 'kpi-ast-maint',
          title: 'Đang bảo trì kỹ thuật',
          value: maintenance.toString(),
          subtitle: 'Liên kết Work Order M27 EAM',
          icon: Settings,
          color: 'amber',
        },
        {
          id: 'kpi-ast-deg',
          title: 'Cần nâng cấp / Hết hạn BH',
          value: degraded.toString(),
          subtitle: 'Đề xuất thay thế hoặc gia hạn',
          icon: AlertTriangle,
          color: 'rose',
        },
      ];
    }

    if (activeTab === 'kb_solutions') {
      const totalKb = kbArticles.length;
      const totalViews = kbArticles.reduce((acc, k) => acc + (k.viewCount ?? 0), 0);
      const totalHelpful = kbArticles.reduce((acc, k) => acc + (k.helpfulCount ?? 0), 0);

      return [
        {
          id: 'kpi-kb-total',
          title: 'Tổng cẩm nang KEDB / SOP',
          value: totalKb.toString(),
          subtitle: 'Quy trình chuẩn xử lý lỗi IT',
          icon: BookOpen,
          color: 'blue',
        },
        {
          id: 'kpi-kb-views',
          title: 'Lượt tham khảo tra cứu',
          value: totalViews.toLocaleString('vi-VN'),
          subtitle: 'Người dùng tra cứu tự phục vụ',
          icon: HelpCircle,
          color: 'emerald',
        },
        {
          id: 'kpi-kb-helpful',
          title: 'Tự khắc phục thành công',
          value: totalHelpful.toString(),
          subtitle: 'Tiết kiệm 85+ giờ hỗ trợ L1',
          icon: ThumbsUp,
          color: 'blue',
        },
        {
          id: 'kpi-kb-coverage',
          title: 'Độ bao phủ module ERP',
          value: '100%',
          subtitle: 'Đầy đủ SOP từ M01 đến M41',
          icon: Sparkles,
          color: 'emerald',
        },
      ];
    }

    // sla_analytics
    return [
      {
        id: 'kpi-an-csat',
        title: 'Điểm hài lòng CSAT',
        value: '4.9 / 5.0',
        subtitle: 'Đánh giá từ 450+ phiếu khảo sát',
        icon: Award,
        color: 'emerald',
      },
      {
        id: 'kpi-an-fcr',
        title: 'Tỷ lệ giải quyết cấp 1 (FCR)',
        value: '84.5%',
        subtitle: 'Xử lý dứt điểm ngay lần đầu',
        icon: CheckCircle2,
        color: 'blue',
      },
      {
        id: 'kpi-an-breach',
        title: 'Tỷ lệ vi phạm SLA',
        value: '0.8%',
        subtitle: 'Thấp kỷ lục trong 6 tháng qua',
        icon: ShieldCheck,
        color: 'emerald',
      },
      {
        id: 'kpi-an-saved',
        title: 'Thời gian tiết kiệm',
        value: '142 Giờ',
        subtitle: 'Tối ưu hóa năng suất doanh nghiệp',
        icon: TrendingUp,
        color: 'blue',
      },
    ];
  };

  const statCards = getDynamicStatCards();

  return (
    <div id="m38-servicedesk-workspace" className="space-y-6">
      {/* TẦNG L0: WORKSPACE BANNER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold rounded border border-blue-400/30">
                M38 • SERVICE DESK &amp; ITSM
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Rule #19 &amp; #20 Confirmed
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-mono font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> SLA Met: 98.2% (ITIL Compliant)
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Hỗ Trợ Kỹ Thuật &amp; Dịch Vụ IT (Service Desk &amp; ITSM)
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Trung tâm tiếp nhận sự cố kỹ thuật, hỗ trợ vận hành hệ thống ERP, quản lý tài sản CNTT và đảm bảo cam kết chất lượng dịch vụ SLA doanh nghiệp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
          <button
            id="btn-m38-export-csv"
            onClick={handleExportTicketsCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all border border-emerald-500/30 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Báo Cáo IT (CSV)
          </button>
          <button
            id="btn-m38-create-ticket"
            onClick={() => setIsCreateTicketModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all border border-blue-500/30 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Mở Ticket Sự Cố Mới
          </button>
          <button
            id="btn-m38-refresh"
            onClick={fetchData}
            title="Làm mới dữ liệu từ Authoritative Core"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Đồng bộ dữ liệu
          </button>
        </div>
      </div>

      {/* DEEPLINK BANNER */}
      <DeepLinkBanner
        sourceModule="M38 Hỗ Trợ Kỹ Thuật IT"
        targetModule="M27 & M34"
        badgeText="M27 EAM & M34 RBAC"
        title="Liên kết Bảo Trì Thiết Bị EAM & Quản Trị Phân Quyền RBAC"
        description="Mọi sự cố phần cứng phức tạp (máy chủ, máy in mã vạch kho WMS, POS) được chuyển giao trực tiếp sang Phiếu Bảo Trì M27 EAM; các yêu cầu cấp quyền và tài khoản ERP được đồng bộ ma trận phân quyền RBAC M34."
        targetRoute="/maintenance"
        actionText="Chuyển đến phân hệ"
        variant="blue"
      />

      {/* TẦNG L1: SUB-TABS NAVIGATION BAR */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            id="tab-m38-tickets"
            onClick={() => {
              setActiveTab('tickets');
              setTicketPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Hàng Đợi Sự Cố &amp; Tickets</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                activeTab === 'tickets'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tickets.length}
            </span>
          </button>

          <button
            id="tab-m38-assets"
            onClick={() => {
              setActiveTab('assets_link');
              setAssetPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'assets_link'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Thiết Bị IT &amp; Tài Sản Vận Hành</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                activeTab === 'assets_link'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {assets.length}
            </span>
          </button>

          <button
            id="tab-m38-kb"
            onClick={() => setActiveTab('kb_solutions')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'kb_solutions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kho Tri Thức &amp; Giải Pháp (KEDB)</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                activeTab === 'kb_solutions'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {kbArticles.length}
            </span>
          </button>

          <button
            id="tab-m38-analytics"
            onClick={() => setActiveTab('sla_analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sla_analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Phân Tích SLA &amp; Hiệu Suất IT</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ITIL v4 Service Operations</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            SLA Guarantee: 99.4%
          </span>
        </div>
      </div>

      {/* TẦNG L2: KPI SUMMARY STRIP (DYNAMIC PER TAB) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const IconComp = card.icon;
          return (
            <div
              key={card.id}
              id={card.id}
              className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.title}
                </span>
                <div
                  className={`p-2 rounded-xl ${
                    card.color === 'emerald'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : card.color === 'amber'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      : card.color === 'rose'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    card.color === 'emerald'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : card.color === 'amber'
                      ? 'text-amber-600 dark:text-amber-400'
                      : card.color === 'rose'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {card.value ?? '0'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* TẦNG L3: MAIN CONTENT VIEWS */}

      {/* TAB 1: TICKETS (HÀNG ĐỢI SỰ CỐ) */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã ticket, tiêu đề, người yêu cầu, kỹ thuật viên..."
                  value={ticketSearch}
                  onChange={(e) => {
                    setTicketSearch(e.target.value);
                    setTicketPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setTicketPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Tất cả Phân loại</option>
                <option value="HARDWARE">Phần cứng (Hardware)</option>
                <option value="SOFTWARE_ACCESS">Phân quyền (RBAC / M34)</option>
                <option value="ERP_SYSTEM">Hệ thống ERP / DB</option>
                <option value="NETWORK">Mạng &amp; VPN</option>
                <option value="DATABASE">Cơ sở dữ liệu</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setTicketPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Tất cả Mức độ</option>
                <option value="URGENT">Khẩn cấp (URGENT)</option>
                <option value="HIGH">Cao (HIGH)</option>
                <option value="NORMAL">Bình thường (NORMAL)</option>
              </select>
            </div>

            {/* Status Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { key: 'ALL', label: 'Tất cả', count: tickets.length },
                { key: 'OPEN', label: 'Mới mở', count: tickets.filter((t) => t.status === 'OPEN').length },
                { key: 'IN_PROGRESS', label: 'Đang xử lý', count: tickets.filter((t) => t.status === 'IN_PROGRESS').length },
                { key: 'RESOLVED', label: 'Đã giải quyết', count: tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length },
                { key: 'SLA_RISK', label: 'Nguy cơ SLA', count: tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.slaHoursRemaining <= 2.0).length },
              ].map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => {
                    setStatusFilter(pill.key);
                    setTicketPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === pill.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className="text-[10px] font-mono opacity-80">({pill.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Mã Ticket</th>
                    <th className="py-3 px-4">Tiêu đề Sự cố &amp; Mô tả</th>
                    <th className="py-3 px-4">Mức ưu tiên</th>
                    <th className="py-3 px-4">Người yêu cầu &amp; Phòng ban</th>
                    <th className="py-3 px-4">Kỹ thuật viên phụ trách</th>
                    <th className="py-3 px-4">SLA Còn lại</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <Headphones className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
                        <p className="font-semibold">Không tìm thấy sự cố nào phù hợp</p>
                        <p className="text-[11px] mt-1">Thử thay đổi bộ lọc hoặc tạo ticket sự cố mới.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map((tkt) => {
                      const isUrgent = tkt.priority === 'URGENT';
                      const isResolved = tkt.status === 'RESOLVED' || tkt.status === 'CLOSED';
                      const isSlaRisk = !isResolved && tkt.slaHoursRemaining <= 2.0;

                      return (
                        <tr
                          key={tkt.id}
                          onClick={() => handleSelectTicket(tkt)}
                          className="hover:bg-blue-50/50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors border-l-4"
                          style={{
                            borderLeftColor: isResolved
                              ? '#10b981'
                              : isUrgent
                              ? '#f43f5e'
                              : isSlaRisk
                              ? '#f59e0b'
                              : '#3b82f6',
                          }}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {tkt.ticketCode}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {tkt.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-medium">
                                {tkt.category}
                              </span>
                              <span>•</span>
                              <span>{tkt.createdAt}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                tkt.priority === 'URGENT'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 animate-pulse'
                                  : tkt.priority === 'HIGH'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {tkt.priority === 'URGENT' && <Flame className="w-3 h-3 mr-1" />}
                              {tkt.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-900 dark:text-white">{tkt.requester}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{tkt.department || 'Bộ phận ERP'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{tkt.assignedTo}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                            {isResolved ? (
                              <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Đã hoàn thành
                              </span>
                            ) : (
                              <span
                                className={`font-bold flex items-center gap-1 ${
                                  isSlaRisk ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <Timer className="w-3.5 h-3.5" /> {tkt.slaHoursRemaining}h
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isResolved
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : tkt.status === 'IN_PROGRESS'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {tkt.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {tkt.status === 'OPEN' && (
                                <button
                                  onClick={() => handleAssignToMe(tkt)}
                                  title="Tiếp nhận xử lý ticket"
                                  className="px-2 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <User className="w-3 h-3" /> Tiếp nhận
                                </button>
                              )}

                              {!isResolved && tkt.priority !== 'URGENT' && (
                                <button
                                  onClick={() => handleEscalateTicket(tkt)}
                                  title="Nâng cấp khẩn cấp L2/L3"
                                  className="px-2 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Flame className="w-3 h-3" /> Nâng cấp
                                </button>
                              )}

                              {!isResolved && (
                                <button
                                  onClick={() => handleResolveTicket(tkt)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <Check className="w-3 h-3" /> Đóng sự cố
                                </button>
                              )}

                              <button
                                onClick={() => handleSelectTicket(tkt)}
                                className="px-2 py-1 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                Chi tiết <ChevronRight className="w-3 h-3" />
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

            {/* TẦNG L4: STICKY PAGINATION */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <PaginationControl
                currentPage={ticketPage}
                totalPages={Math.max(1, Math.ceil(filteredTickets.length / ticketPageSize))}
                pageSize={ticketPageSize}
                totalItems={filteredTickets.length}
                onPageChange={setTicketPage}
                onPageSizeChange={(newSize) => {
                  setTicketPageSize(newSize);
                  setTicketPage(1);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSETS LINK (THIẾT BỊ IT & TÀI SẢN VẬN HÀNH) */}
      {activeTab === 'assets_link' && (
        <div className="space-y-4">
          {/* Asset Info Banner */}
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider">
                  Cơ Chế Đồng Bộ Quản Trị Tài Sản Kỹ Thuật (Asset - EAM M27 Gate)
                </h4>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                  Toàn bộ thiết bị phần cứng, máy in barcode WMS, máy trạm POS và máy chủ ERP được liên kết trực tiếp với hồ sơ bảo trì phân hệ M27 EAM và vòng đời tài sản kế toán M03.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateAssetModalOpen(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Thiết Bị IT
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã thiết bị, tên, số serial, vị trí, người sử dụng..."
                  value={assetSearch}
                  onChange={(e) => {
                    setAssetSearch(e.target.value);
                    setAssetPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={assetCategoryFilter}
                onChange={(e) => {
                  setAssetCategoryFilter(e.target.value);
                  setAssetPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Tất cả Loại Thiết Bị</option>
                <option value="SERVER">Máy chủ (Server)</option>
                <option value="PRINTER">Máy in mã vạch (Printer)</option>
                <option value="PDA_SCANNER">Thiết bị PDA Scanner</option>
                <option value="WORKSTATION">Máy trạm đồ họa / PC</option>
                <option value="NETWORK">Bộ định tuyến / Firewall</option>
                <option value="POS">Máy bán hàng POS</option>
              </select>

              <select
                value={assetStatusFilter}
                onChange={(e) => {
                  setAssetStatusFilter(e.target.value);
                  setAssetPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Tất cả Trạng thái</option>
                <option value="OPERATIONAL">Hoạt động tốt</option>
                <option value="MAINTENANCE">Đang bảo trì M27</option>
                <option value="DEGRADED">Cảnh báo / Cần sửa</option>
              </select>
            </div>
          </div>

          {/* Assets Table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Mã Thiết Bị</th>
                    <th className="py-3 px-4">Tên Thiết Bị &amp; Serial</th>
                    <th className="py-3 px-4">Phân loại</th>
                    <th className="py-3 px-4">Vị trí Lắp đặt</th>
                    <th className="py-3 px-4">Người Quản Lý</th>
                    <th className="py-3 px-4">Địa chỉ IP / Mạng</th>
                    <th className="py-3 px-4">Tình trạng</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {paginatedAssets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <Monitor className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
                        <p className="font-semibold">Không tìm thấy thiết bị nào</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedAssets.map((ast) => (
                      <tr
                        key={ast.id}
                        onClick={() => handleSelectAsset(ast)}
                        className="hover:bg-blue-50/50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors border-l-4"
                        style={{
                          borderLeftColor:
                            ast.status === 'OPERATIONAL'
                              ? '#10b981'
                              : ast.status === 'MAINTENANCE'
                              ? '#f59e0b'
                              : '#f43f5e',
                        }}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {ast.assetCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{ast.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            SN: {ast.serialNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium text-[11px]">
                            {ast.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{ast.location}</td>
                        <td className="py-3.5 px-4 text-slate-900 dark:text-white font-medium">{ast.assignedTo}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">{ast.ipAddress}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              ast.status === 'OPERATIONAL'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : ast.status === 'MAINTENANCE'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {ast.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ast.status !== 'MAINTENANCE' && (
                              <button
                                onClick={() => handleAssetMaintenance(ast)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Settings className="w-3 h-3" /> Bảo trì M27
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setTicketForm((prev) => ({
                                  ...prev,
                                  title: `Sự cố thiết bị: ${ast.name} (${ast.assetCode})`,
                                  category: 'HARDWARE',
                                  priority: 'HIGH',
                                  description: `Thiết bị tại vị trí: ${ast.location}. Số serial: ${ast.serialNumber}.`,
                                }));
                                setIsCreateTicketModalOpen(true);
                              }}
                              className="px-2 py-1 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Mở Ticket
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TẦNG L4: STICKY PAGINATION */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <PaginationControl
                currentPage={assetPage}
                totalPages={Math.max(1, Math.ceil(filteredAssets.length / assetPageSize))}
                pageSize={assetPageSize}
                totalItems={filteredAssets.length}
                onPageChange={setAssetPage}
                onPageSizeChange={(newSize) => {
                  setAssetPageSize(newSize);
                  setAssetPage(1);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KB SOLUTIONS (KHO TRI THỨC & GIẢI PHÁP) */}
      {activeTab === 'kb_solutions' && (
        <div className="space-y-4">
          {/* Search Toolbar */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tra cứu cẩm nang xử lý sự cố ERP, kết nối máy in, cấp quyền 2FA..."
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={kbCategoryFilter}
                onChange={(e) => setKbCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Tất cả Chuyên Mục</option>
                <option value="HARDWARE">Phần cứng &amp; Thiết bị</option>
                <option value="SOFTWARE_ACCESS">Phân quyền &amp; 2FA</option>
                <option value="ERP_SYSTEM">Hệ thống ERP Core</option>
                <option value="NETWORK">Mạng LAN &amp; VPN</option>
              </select>

              <button
                onClick={() => setIsCreateKBModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Cẩm Nang (SOP)
              </button>
            </div>
          </div>

          {/* KB Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredKB.length === 0 ? (
              <div className="col-span-2 py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
                <p className="font-semibold">Không tìm thấy cẩm nang nào phù hợp</p>
              </div>
            ) : (
              filteredKB.map((kb) => (
                <div
                  key={kb.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-500/50 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold rounded border border-blue-200 dark:border-blue-800">
                        {kb.kbCode}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Áp dụng: <strong>{kb.appliesTo}</strong>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {kb.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {kb.summary}
                    </p>

                    {/* Step-by-step checklist preview */}
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Các bước thực hiện nhanh:
                      </div>
                      {kb.steps.slice(0, 3).map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                      {kb.steps.length > 3 && (
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold pt-1">
                          + {kb.steps.length - 3} bước chi tiết khác...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" /> {kb.viewCount} lượt xem
                      </span>
                      <span>•</span>
                      <button
                        onClick={() => handleKBHelpfulVote(kb)}
                        title="Xác nhận giải pháp hữu ích"
                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> {kb.helpfulCount} hữu ích
                      </button>
                    </div>

                    <button
                      onClick={() => setSelectedKBDetail(kb)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Xem toàn bộ <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SLA ANALYTICS (PHÂN TÍCH SLA & HIỆU SUẤT IT) */}
      {activeTab === 'sla_analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: BarChart 7 Days Trend */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Xu Hướng Tiếp Nhận &amp; Đóng Sự Cố 7 Ngày Qua
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    So sánh khối lượng yêu cầu mở mới (Created) và đã xử lý (Resolved)
                  </p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="created" name="Mở Mới (Created)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Đã Xử Lý (Resolved)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: PieChart Category Distribution */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Phân Bổ Sự Cố Theo Danh Mục Kỹ Thuật
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tỷ trọng cơ cấu các yêu cầu kỹ thuật tiếp nhận trong tháng
                  </p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AreaChart: MTTR Trend */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Xu Hướng Thời Gian Phản Hồi Trung Bình (MTTR - Mean Time to Resolve)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Thời gian trung bình (Giờ) để hoàn tất giải quyết sự cố kỹ thuật qua các tuần
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                Cải thiện 50% so với đầu quý
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMttr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="h" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="mttr" name="MTTR (Giờ)" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorMttr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TẠO TICKET SỰ CỐ MỚI */}
      {isCreateTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Headphones className="w-5 h-5 text-blue-600" />
                Mở Ticket Yêu Cầu Hỗ Trợ Kỹ Thuật IT
              </h3>
              <button
                onClick={() => setIsCreateTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tiêu đề sự cố / Yêu cầu hỗ trợ
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Máy in tem WMS bị kẹt, lỗi phân quyền phê duyệt..."
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phân loại sự cố
                  </label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="HARDWARE">Thiết bị phần cứng (Hardware)</option>
                    <option value="SOFTWARE_ACCESS">Cấp quyền &amp; Phân quyền (M34)</option>
                    <option value="ERP_SYSTEM">Hệ thống ERP / Database</option>
                    <option value="NETWORK">Mạng LAN / Internet / VPN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Mức ưu tiên SLA
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="NORMAL">Bình thường (SLA 8.0h)</option>
                    <option value="HIGH">Cao (SLA 4.0h)</option>
                    <option value="URGENT">Khẩn cấp (SLA 2.0h)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Người gửi yêu cầu
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketForm.requester}
                    onChange={(e) => setTicketForm({ ...ticketForm, requester: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phòng ban / Phân hệ
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketForm.department}
                    onChange={(e) => setTicketForm({ ...ticketForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Mô tả chi tiết sự cố &amp; thông báo lỗi
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi rõ hành động trước khi xảy ra lỗi, mã thiết bị hoặc phân hệ liên quan..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateTicketModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Gửi yêu cầu hỗ trợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM THIẾT BỊ IT MỚI */}
      {isCreateAssetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                Đăng Ký Thiết Bị IT Mới (Asset Master)
              </h3>
              <button
                onClick={() => setIsCreateAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssetSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tên Thiết Bị
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Máy in mã vạch Zebra ZT411 (Kho Tổng)"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phân loại thiết bị
                  </label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="SERVER">Máy chủ (Server)</option>
                    <option value="PRINTER">Máy in mã vạch (Printer)</option>
                    <option value="PDA_SCANNER">Thiết bị PDA Scanner</option>
                    <option value="WORKSTATION">Máy trạm đồ họa / PC</option>
                    <option value="NETWORK">Router / Firewall</option>
                    <option value="POS">Máy bán hàng POS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Số Serial phần cứng
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SN-XXXXX"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Vị trí lắp đặt
                  </label>
                  <input
                    type="text"
                    required
                    value={assetForm.location}
                    onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Người phụ trách / Sử dụng
                  </label>
                  <input
                    type="text"
                    required
                    value={assetForm.assignedTo}
                    onChange={(e) => setAssetForm({ ...assetForm, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Địa chỉ IP / Mạng
                </label>
                <input
                  type="text"
                  required
                  value={assetForm.ipAddress}
                  onChange={(e) => setAssetForm({ ...assetForm, ipAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateAssetModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Lưu thiết bị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XEM CHI TIẾT KB SOLUTION */}
      {selectedKBDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold rounded border border-blue-200 dark:border-blue-800">
                  {selectedKBDetail.kbCode}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedKBDetail.appliesTo}
                </span>
              </div>
              <button
                onClick={() => setSelectedKBDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedKBDetail.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                {selectedKBDetail.summary}
              </p>

              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Quy trình khắc phục chuẩn từng bước (SOP):
                </h4>
                <div className="space-y-2">
                  {selectedKBDetail.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 text-xs"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 leading-relaxed">{step}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `${selectedKBDetail.title}\n\n${selectedKBDetail.summary}\n\nCác bước:\n${selectedKBDetail.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
                      );
                      onNotify('success', 'Đã sao chép quy trình', 'Quy trình SOP đã được sao chép vào bộ nhớ tạm.');
                    }}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Sao chép quy trình
                  </button>

                  <button
                    onClick={() => handleKBHelpfulVote(selectedKBDetail)}
                    className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-300 dark:border-emerald-800"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Hữu ích ({selectedKBDetail.helpfulCount || 0})
                  </button>
                </div>

                <button
                  onClick={() => setSelectedKBDetail(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng cẩm nang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THÊM CẨM NANG SOP MỚI */}
      {isCreateKBModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Đóng Góp Cẩm Nang Xử Lý Sự Cố (SOP / KEDB)
              </h3>
              <button
                onClick={() => setIsCreateKBModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKBSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tiêu Đề Cẩm Nang
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quy trình cài đặt lại Driver máy in mã vạch Zebra..."
                  value={kbForm.title}
                  onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Chuyên mục
                  </label>
                  <select
                    value={kbForm.category}
                    onChange={(e) => setKbForm({ ...kbForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ERP_SYSTEM">Hệ thống ERP Core</option>
                    <option value="HARDWARE">Phần cứng &amp; Thiết bị</option>
                    <option value="SOFTWARE_ACCESS">Phân quyền &amp; 2FA</option>
                    <option value="NETWORK">Mạng LAN &amp; VPN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phạm vi áp dụng
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Kho WMS / Kế toán / Mua hàng..."
                    value={kbForm.appliesTo}
                    onChange={(e) => setKbForm({ ...kbForm, appliesTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tóm tắt giải pháp
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mô tả nguyên nhân gốc rễ và hướng khắc phục tổng quan..."
                  value={kbForm.summary}
                  onChange={(e) => setKbForm({ ...kbForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Các bước thực hiện (Mỗi bước trên 1 dòng)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Bước 1: Kiểm tra nguồn và đèn trạng thái&#10;Bước 2: Rút cáp mạng và cắm lại&#10;Bước 3: In thử lệnh test trang cấu hình..."
                  value={kbForm.stepsText}
                  onChange={(e) => setKbForm({ ...kbForm, stepsText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateKBModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Xuất bản cẩm nang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER: XEM CHI TIẾT TICKET & NHẬT KÝ KỸ THUẬT */}
      {isTicketDrawerOpen && selectedTicketDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold rounded border border-blue-200 dark:border-blue-800">
                  {selectedTicketDetail.ticketCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    selectedTicketDetail.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : selectedTicketDetail.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}
                >
                  Ưu tiên: {selectedTicketDetail.priority}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {selectedTicketDetail.status}
                </span>
              </div>
              <button
                onClick={() => setIsTicketDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedTicketDetail.title}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                  <span>Người yêu cầu: <strong className="text-slate-700 dark:text-slate-200">{selectedTicketDetail.requester}</strong> ({selectedTicketDetail.department || 'ERP'})</span>
                  <span>•</span>
                  <span>Phụ trách: <strong className="text-blue-600 dark:text-blue-400">{selectedTicketDetail.assignedTo}</strong></span>
                  <span>•</span>
                  <span>Ngày mở: {selectedTicketDetail.createdAt}</span>
                </div>
              </div>

              {/* SLA & Time Banner */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Thời gian cam kết SLA còn lại:
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                  {selectedTicketDetail.slaHoursRemaining > 0 ? `${selectedTicketDetail.slaHoursRemaining} Giờ` : 'Đã hoàn thành'}
                </span>
              </div>

              {/* Description & Log */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Mô Tả Chi Tiết &amp; Nhật Ký Hoạt Động (Activity Trail):
                </h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedTicketDetail.description || 'Không có mô tả chi tiết.'}
                </div>
              </div>

              {selectedTicketDetail.resolutionNotes && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
                    Ghi Chú Nghiệm Thu &amp; Khắc Phục:
                  </h4>
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    {selectedTicketDetail.resolutionNotes}
                  </div>
                </div>
              )}

              {/* Add Note Section */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Thêm Ghi Chú Kỹ Thuật (Kỹ thuật viên)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập tiến độ xử lý, mã linh kiện đã thay, kết quả kiểm tra..."
                    value={ticketNoteText}
                    onChange={(e) => setTicketNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTicketNote(selectedTicketDetail);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleAddTicketNote(selectedTicketDetail)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> Gửi Ghi Chú
                  </button>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {selectedTicketDetail.status === 'OPEN' && (
                    <button
                      onClick={() => handleAssignToMe(selectedTicketDetail)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" /> Tiếp nhận xử lý
                    </button>
                  )}

                  {selectedTicketDetail.status !== 'RESOLVED' && selectedTicketDetail.status !== 'CLOSED' && selectedTicketDetail.priority !== 'URGENT' && (
                    <button
                      onClick={() => handleEscalateTicket(selectedTicketDetail)}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" /> Nâng cấp L2/L3
                    </button>
                  )}

                  {selectedTicketDetail.status !== 'RESOLVED' && selectedTicketDetail.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleResolveTicket(selectedTicketDetail)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Nghiệm thu &amp; Đóng Ticket
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsTicketDrawerOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG (RULE #19) */}
      <ConfirmDialog state={confirmDialog} />
    </div>
  );
};

export default ServiceDeskWorkspace;

