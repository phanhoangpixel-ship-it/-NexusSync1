import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types/index';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from '../../../../components/shell/DomainWorkspaceShell';
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
  HelpCircle,
  BarChart3,
  TrendingUp,
  Award,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  History,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Flame,
  ThumbsUp,
  Copy,
  Settings,
  Send,
  Wrench,
  FileText,
  UserCheck,
  Lock,
  Unlock,
  Eye,
  Star,
  Activity,
  Calendar,
  Zap,
  Play,
  Pause
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface ServiceDeskWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export type ServiceDeskTab = 'queue' | 'new_ticket' | 'sla_matrix' | 'access_requests' | 'equipment_eam' | 'kpi_audit';

export interface ITTicket {
  id: number;
  ticketCode: string;
  subject: string;
  description?: string;
  type?: string;
  impact?: string;
  urgency?: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  category?: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
  requesterId?: number;
  requesterName?: string;
  requesterEmail?: string;
  requesterDepartment?: string;
  assignedAgentId?: number;
  assignedAgentName?: string;
  slaHours?: number;
  responseDueAt?: string;
  resolveDueAt?: string;
  slaPausedAt?: string;
  slaPausedSeconds?: number;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  rootCause?: string;
  resolutionNote?: string;
  assetId?: number;
  assetCode?: string;
  assetName?: string;
  serialId?: number;
  serialNumber?: string;
  workOrderId?: number;
  workOrderCode?: string;
  isSlaBreached?: boolean;
  feedbackScore?: number;
  feedbackComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SLAPolicy {
  id: number;
  policyCode: string;
  policyName: string;
  priority: string;
  responseHours: number;
  resolutionHours: number;
  warning75ThresholdPct: number;
  warning90ThresholdPct: number;
  businessHoursOnly: boolean;
  description?: string;
  isActive: boolean;
}

export interface AccessRequest {
  id: number;
  requestCode: string;
  ticketId?: number;
  requesterId: number;
  requesterName: string;
  requesterEmail?: string;
  targetUserId: number;
  targetUserName: string;
  targetUserRole?: string;
  requestedPermissionOrRole: string;
  isHighRisk: boolean;
  reason: string;
  durationDays: number;
  expiresAt?: string;
  status: 'PENDING_MANAGER_APPROVAL' | 'PENDING_SECURITY_APPROVAL' | 'APPROVED_PENDING_FULFILLMENT' | 'FULFILLED' | 'REJECTED' | 'REVOKED' | 'EXPIRED';
  managerApproverName?: string;
  managerApprovedAt?: string;
  securityApproverName?: string;
  securityApprovedAt?: string;
  fulfilledByName?: string;
  fulfilledAt?: string;
  createdAt: string;
}

export interface KPIData {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  slaBreachedCount: number;
  slaOnTimeRate: number;
  avgResolutionHours: number;
  avgCsat: number;
  totalSurveys: number;
  categoryBacklog: Record<string, number>;
  priorityDistribution: { URGENT: number; HIGH: number; NORMAL: number; LOW: number };
}

export function ServiceDeskWorkspace({ onSelectEntity, onNotify }: ServiceDeskWorkspaceProps) {
  // Session Tab Hook
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<ServiceDeskTab>('m38_service_desk_tab', 'queue');

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // State Management
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<SLAPolicy[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected Ticket & Detail View
  const [selectedTicket, setSelectedTicket] = useState<ITTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');

  // Modals & Action States
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ isOpen: false, title: '', message: '' });
  const [resolveModalOpen, setResolveModalOpen] = useState<boolean>(false);
  const [resolveRootCause, setResolveRootCause] = useState<string>('');
  const [resolveNote, setResolveNote] = useState<string>('');
  const [closeModalOpen, setCloseModalOpen] = useState<boolean>(false);
  const [csatRating, setCsatRating] = useState<number>(5);
  const [csatComment, setCsatComment] = useState<string>('');

  // Form State for New Ticket
  const [newSubject, setNewSubject] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('TECHNICAL_SUPPORT');
  const [newType, setNewType] = useState<'INCIDENT' | 'SERVICE_REQUEST' | 'ACCESS_REQUEST' | 'EQUIPMENT_DEFECT'>('INCIDENT');
  const [newImpact, setNewImpact] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('LOW');
  const [newUrgency, setNewUrgency] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('LOW');
  const [newRequesterName, setNewRequesterName] = useState<string>('Nguyễn Văn Hùng');
  const [newRequesterDept, setNewRequesterDept] = useState<string>('Kho Vận');
  const [newAssetCode, setNewAssetCode] = useState<string>('');
  const [newSerialNumber, setNewSerialNumber] = useState<string>('');

  // Form State for Access Request
  const [arTargetName, setArTargetName] = useState<string>('Lê Thị Mai (Kế toán)');
  const [arPermission, setArPermission] = useState<string>('accounting:post_gl');
  const [arReason, setArReason] = useState<string>('Cần quyền ghi sổ cái kế toán để hạch toán chứng từ cuối tháng.');
  const [arDuration, setArDuration] = useState<number>(30);

  // Virtual Time Simulation (?asOf=) for SLA testing
  const [virtualHourOffset, setVirtualHourOffset] = useState<number>(0);
  const [slaReport, setSlaReport] = useState<any>(null);

  // Computed Priority from Impact x Urgency
  const computedPriority = useMemo(() => {
    const imp = newImpact;
    const urg = newUrgency;
    if (imp === 'CRITICAL' && urg === 'CRITICAL') return 'URGENT';
    if (imp === 'CRITICAL' || urg === 'CRITICAL') return 'HIGH';
    if (imp === 'HIGH' && urg === 'HIGH') return 'HIGH';
    if (imp === 'HIGH' || urg === 'HIGH') return 'NORMAL';
    if (imp === 'MEDIUM' && urg === 'MEDIUM') return 'NORMAL';
    return 'LOW';
  }, [newImpact, newUrgency]);

  // Load Main Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tktRes, slaRes, arRes, kpiRes] = await Promise.all([
        fetch('/api/service-desk/tickets').then(r => r.json()),
        fetch('/api/service-desk/sla-policies').then(r => r.json()),
        fetch('/api/service-desk/access-requests').then(r => r.json()),
        fetch('/api/service-desk/kpi').then(r => r.json())
      ]);

      if (tktRes.success) setTickets(tktRes.data || []);
      if (slaRes.success) setSlaPolicies(slaRes.data || []);
      if (arRes.success) setAccessRequests(arRes.data || []);
      if (kpiRes.success) setKpi(kpiRes.data || null);
    } catch (err) {
      console.warn('[ServiceDesk] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch Virtual SLA calculation when offset changes
  const evaluateSlaWithOffset = useCallback(async (hoursOffset: number) => {
    try {
      let url = '/api/service-desk/sla';
      if (hoursOffset !== 0) {
        const simTime = new Date(Date.now() + hoursOffset * 3600 * 1000).toISOString();
        url += `?asOf=${encodeURIComponent(simTime)}`;
      }
      const res = await fetch(url).then(r => r.json());
      if (res.success) {
        setSlaReport(res.data);
      }
    } catch (e) {
      console.warn('SLA report error', e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sla_matrix') {
      evaluateSlaWithOffset(virtualHourOffset);
    }
  }, [activeTab, virtualHourOffset, evaluateSlaWithOffset]);

  // Load ticket details when selected
  const loadTicketDetail = async (ticket: ITTicket) => {
    setSelectedTicket(ticket);
    onSelectEntity({
      id: ticket.id,
      code: ticket.ticketCode,
      name: ticket.subject,
      type: 'TICKET',
      module: 'M38'
    });

    try {
      const res = await fetch(`/api/service-desk/tickets/${ticket.id}`).then(r => r.json());
      if (res.success && res.data) {
        setTicketMessages(res.data.messages || []);
        setTicketHistory(res.data.history || []);
      }
    } catch (e) {
      console.warn('Detail load error', e);
    }
  };

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = searchQuery === '' ||
        t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.requesterName && t.requesterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.assignedAgentName && t.assignedAgentName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      const matchesType = typeFilter === 'ALL' || t.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, typeFilter]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // Handler: Create Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      onNotify('danger', 'Thiếu thông tin', 'Vui lòng nhập tiêu đề sự cố.');
      return;
    }

    try {
      const res = await fetch('/api/service-desk/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `tkt-${Date.now()}-${Math.random().toString(36).substring(7)}`
        },
        body: JSON.stringify({
          subject: newSubject,
          description: newDesc,
          type: newType,
          impact: newImpact,
          urgency: newUrgency,
          priority: computedPriority,
          category: newCategory,
          requesterName: newRequesterName,
          requesterDepartment: newRequesterDept,
          assetCode: newAssetCode || undefined,
          serialNumber: newSerialNumber || undefined,
        })
      }).then(r => r.json());

      if (res.success) {
        onNotify('success', 'Tạo phiếu thành công', `Mã phiếu: ${res.data.ticketCode} (Ưu tiên: ${res.data.priority})`);
        setNewSubject('');
        setNewDesc('');
        setActiveTab('queue');
        loadData();
      } else {
        onNotify('danger', 'Lỗi tạo phiếu', res.error || 'Không thể tạo phiếu.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi kết nối', err.message);
    }
  };

  // Handler: Accept Ticket (Agent accepts -> IN_PROGRESS)
  const handleAcceptTicket = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/service-desk/tickets/${ticketId}/accept`, { method: 'POST' }).then(r => r.json());
      if (res.success) {
        onNotify('success', 'Tiếp nhận thành công', 'Phiếu đã chuyển sang Đang xử lý (IN_PROGRESS)');
        loadData();
        if (selectedTicket && selectedTicket.id === ticketId) {
          loadTicketDetail({ ...selectedTicket, status: 'IN_PROGRESS' });
        }
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    }
  };

  // Handler: SLA Pause / Resume
  const handleTogglePause = async (ticket: ITTicket) => {
    const isPaused = ticket.status === 'PENDING';
    const endpoint = isPaused ? `/api/service-desk/tickets/${ticket.id}/resume` : `/api/service-desk/tickets/${ticket.id}/pause`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: isPaused ? 'Khôi phục xử lý' : 'Chờ thông tin/linh kiện' })
      }).then(r => r.json());

      if (res.success) {
        onNotify('info', isPaused ? 'Đã khôi phục SLA' : 'Đã tạm dừng SLA', res.message);
        loadData();
        if (selectedTicket && selectedTicket.id === ticket.id) {
          loadTicketDetail({ ...selectedTicket, status: res.status });
        }
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    }
  };

  // Handler: Resolve Ticket
  const handleConfirmResolve = async () => {
    if (!selectedTicket) return;
    if (!resolveRootCause.trim() || !resolveNote.trim()) {
      onNotify('danger', 'Thiếu dữ liệu', 'Bắt buộc nhập Nguyên nhân gốc và Giải pháp xử lý.');
      return;
    }

    try {
      const res = await fetch(`/api/service-desk/tickets/${selectedTicket.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootCause: resolveRootCause,
          resolutionNote: resolveNote
        })
      }).then(r => r.json());

      if (res.success) {
        onNotify('success', 'Giải quyết thành công', `Phiếu ${selectedTicket.ticketCode} đã chuyển sang RESOLVED.`);
        setResolveModalOpen(false);
        setResolveRootCause('');
        setResolveNote('');
        loadData();
        loadTicketDetail({ ...selectedTicket, status: 'RESOLVED', rootCause: resolveRootCause, resolutionNote: resolveNote });
      } else {
        onNotify('danger', 'Lỗi', res.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi kết nối', err.message);
    }
  };

  // Handler: Close Ticket with Survey
  const handleConfirmClose = async () => {
    if (!selectedTicket) return;

    try {
      const res = await fetch(`/api/service-desk/tickets/${selectedTicket.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackScore: csatRating,
          feedbackComment: csatComment
        })
      }).then(r => r.json());

      if (res.success) {
        onNotify('success', 'Nghiệm thu đóng phiếu', `Phiếu ${selectedTicket.ticketCode} đã đóng hoàn tất và khóa Read-Only.`);
        setCloseModalOpen(false);
        loadData();
        loadTicketDetail({ ...selectedTicket, status: 'CLOSED', feedbackScore: csatRating, feedbackComment: csatComment });
      } else {
        onNotify('danger', 'Lỗi', res.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    }
  };

  // Handler: Send Message Comment
  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      const res = await fetch(`/api/service-desk/tickets/${selectedTicket.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      }).then(r => r.json());

      if (res.success) {
        setNewMessage('');
        loadTicketDetail(selectedTicket);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi gửi tin', err.message);
    }
  };

  // Handler: Create M27 Work Order from Ticket
  const handleCreateWorkOrder = (ticket: ITTicket) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Phát hành Lệnh bảo trì thiết bị sang M27 EAM',
      message: `Hệ thống sẽ tạo Work Order bảo dưỡng/sửa chữa cho thiết bị gắn với phiếu ${ticket.ticketCode}. Tiếp tục?`,
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/service-desk/tickets/${ticket.id}/create-work-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: ticket.description, priority: ticket.priority })
          }).then(r => r.json());

          if (res.success) {
            onNotify('success', 'Tạo Lệnh bảo trì thành công', res.message);
            loadData();
          } else {
            onNotify('danger', 'Lỗi', res.error);
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi kết nối', err.message);
        }
      }
    });
  };

  // Handler: Create Access Request
  const handleCreateAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arPermission.trim() || !arReason.trim()) {
      onNotify('danger', 'Thiếu thông tin', 'Vui lòng chọn quyền và lý do yêu cầu.');
      return;
    }

    try {
      const res = await fetch('/api/service-desk/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `ar-${Date.now()}`
        },
        body: JSON.stringify({
          requesterId: 2,
          requesterName: 'Nguyễn Văn Hùng (Trưởng kho)',
          targetUserId: 3,
          targetUserName: arTargetName,
          requestedPermissionOrRole: arPermission,
          reason: arReason,
          durationDays: arDuration
        })
      }).then(r => r.json());

      if (res.success) {
        onNotify('success', 'Khởi tạo Yêu cầu cấp quyền', `Mã yêu cầu: ${res.data.requestCode}`);
        setArReason('');
        loadData();
      } else {
        onNotify('danger', 'Lỗi', res.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    }
  };

  // Handler: Approve Access Request (Manager / Security)
  const handleApproveAccess = async (req: AccessRequest, stage: 'MANAGER' | 'SECURITY') => {
    const endpoint = stage === 'MANAGER'
      ? `/api/service-desk/access-requests/${req.id}/approve-manager`
      : `/api/service-desk/access-requests/${req.id}/approve-security`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: `Đã thẩm định và duyệt cấp ${stage}` })
      }).then(r => r.json());

      if (res.success) {
        onNotify('success', 'Phê duyệt thành công', `Yêu cầu ${req.requestCode} đã chuyển trạng thái.`);
        loadData();
      } else {
        onNotify('danger', 'Lỗi phê duyệt (SoD)', res.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    }
  };

  // Handler: Fulfill Access Request (Execute via M04)
  const handleFulfillAccess = async (req: AccessRequest) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kích hoạt Cấp quyền người dùng (M04 Execution)',
      message: `Thực hiện ghi nhận phân quyền ${req.requestedPermissionOrRole} cho người dùng ${req.targetUserName}. Quyền sẽ có hiệu lực trong ${req.durationDays} ngày. Tiếp tục?`,
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/service-desk/access-requests/${req.id}/fulfill`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: 'Quản trị viên SuperAdmin kích hoạt quyền hạn' })
          }).then(r => r.json());

          if (res.success) {
            onNotify('success', 'Cấp quyền hoàn tất', `Quyền đã được kích hoạt thành công cho ${req.targetUserName}`);
            loadData();
          } else {
            onNotify('danger', 'Lỗi cấp quyền', res.error);
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi', err.message);
        }
      }
    });
  };

  // Priority Badge Color Helper
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"><Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" /> P1 - URGENT</span>;
      case 'HIGH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> P2 - HIGH</span>;
      case 'NORMAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" /> P3 - NORMAL</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">P4 - LOW</span>;
    }
  };

  // Status Badge Color Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Mới tạo (OPEN)</span>;
      case 'ASSIGNED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">Đã phân công</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><Timer className="w-3 h-3 animate-spin text-amber-600 dark:text-amber-400" /> Đang xử lý</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"><Pause className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Tạm dừng SLA</span>;
      case 'RESOLVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Đã giải quyết</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"><Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Đã đóng (Read-Only)</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">M38 — IT Service Desk & ITSM</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">ITIL v4 Compliant</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Single Writer Authority</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tiếp nhận sự cố nội bộ, quản trị cam kết SLA, phân tách nhiệm vụ cấp quyền (SoD) & liên kết bảo trì M27 EAM</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setRefreshing(true); loadData(); }}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </button>
          <button
            onClick={() => setActiveTab('new_ticket')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Mở phiếu sự cố mới
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      {kpi && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 px-6 py-3 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng phiếu tiếp nhận</div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">{kpi.totalTickets}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Đang xử lý / Tồn đọng</div>
            <div className="text-xl font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400 mt-1">{kpi.openTickets}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Đã giải quyết / Đóng</div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">{kpi.resolvedTickets}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-rose-600 dark:text-rose-400">Vi phạm SLA</div>
            <div className="text-xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400 mt-1">{kpi.slaBreachedCount}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Tỷ lệ đúng hạn SLA</div>
            <div className="text-xl font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-400 mt-1">{kpi.slaOnTimeRate}%</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400">CSAT Hài lòng</div>
            <div className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
              {kpi.avgCsat} <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-2 shadow-xs sticky top-0 z-20">
        <button
          onClick={() => scrollTabs('left')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          title="Cuộn sang trái"
          aria-label="Cuộn sang trái"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={tabsContainerRef}
          className="flex items-center gap-1 overflow-x-auto scroll-smooth no-scrollbar flex-1 py-1"
        >
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 py-3 px-3.5 rounded-lg text-xs font-semibold border-b-2 transition whitespace-nowrap shrink-0 ${
              activeTab === 'queue'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Hàng đợi phiếu</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono tabular-nums">
              {tickets.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('new_ticket')}
            className={`flex items-center gap-2 py-3 px-3.5 rounded-lg text-xs font-semibold border-b-2 transition whitespace-nowrap shrink-0 ${
              activeTab === 'new_ticket'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Tạo phiếu & Impact Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('sla_matrix')}
            className={`flex items-center gap-2 py-3 px-3.5 rounded-lg text-xs font-semibold border-b-2 transition whitespace-nowrap shrink-0 ${
              activeTab === 'sla_matrix'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>SLA & Virtual Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('access_requests')}
            className={`flex items-center gap-2 py-3 px-3.5 rounded-lg text-xs font-semibold border-b-2 transition whitespace-nowrap shrink-0 ${
              activeTab === 'access_requests'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Cấp quyền & SoD</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono tabular-nums">
              {accessRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('equipment_eam')}
            className={`flex items-center gap-2 py-3 px-3.5 rounded-lg text-xs font-semibold border-b-2 transition whitespace-nowrap shrink-0 ${
              activeTab === 'equipment_eam'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Thiết bị & Bảo trì M27</span>
          </button>
          <button
            onClick={() => setActiveTab('kpi_audit')}
            className={`flex items-center gap-2 py-3 px-3.5 rounded-lg text-xs font-semibold border-b-2 transition whitespace-nowrap shrink-0 ${
              activeTab === 'kpi_audit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>KPI & Kiểm toán M02</span>
          </button>
        </div>

        <button
          onClick={() => scrollTabs('right')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          title="Cuộn sang phải"
          aria-label="Cuộn sang phải"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* TAB 1: TICKET QUEUE */}
        {activeTab === 'queue' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Table & Filters */}
            <div className={`${selectedTicket ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col gap-4`}>
              {/* Search & Filter Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Tìm theo mã ticket, tiêu đề, người báo, kỹ thuật viên..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Mọi trạng thái</option>
                    <option value="OPEN">Mới tạo (OPEN)</option>
                    <option value="ASSIGNED">Đã phân công (ASSIGNED)</option>
                    <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                    <option value="PENDING">Tạm dừng SLA (PENDING)</option>
                    <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
                    <option value="CLOSED">Đã đóng (CLOSED)</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Mọi ưu tiên</option>
                    <option value="URGENT">P1 - URGENT</option>
                    <option value="HIGH">P2 - HIGH</option>
                    <option value="NORMAL">P3 - NORMAL</option>
                    <option value="LOW">P4 - LOW</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Mã phiếu</th>
                        <th className="p-3">Tiêu đề sự cố</th>
                        <th className="p-3 text-center">Mức ưu tiên</th>
                        <th className="p-3">Người yêu cầu</th>
                        <th className="p-3">Kỹ thuật viên</th>
                        <th className="p-3 text-center">Trạng thái</th>
                        <th className="p-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {paginatedTickets.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                            Không có phiếu yêu cầu nào phù hợp bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        paginatedTickets.map(t => (
                          <tr
                            key={t.id}
                            onClick={() => loadTicketDetail(t)}
                            className={`hover:bg-blue-50/50 dark:hover:bg-blue-950/40 cursor-pointer transition ${selectedTicket?.id === t.id ? 'bg-blue-50/80 dark:bg-blue-950/60 font-medium' : ''}`}
                          >
                            <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                              {t.ticketCode}
                            </td>
                            <td className="p-3 max-w-[220px] truncate">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">{t.subject}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{t.category} • {t.type}</div>
                            </td>
                            <td className="p-3 text-center">
                              {getPriorityBadge(t.priority)}
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-slate-800 dark:text-slate-200">{t.requesterName || 'N/A'}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">{t.requesterDepartment || 'Nội bộ'}</div>
                            </td>
                            <td className="p-3">
                              {t.assignedAgentName ? (
                                <span className="text-slate-800 dark:text-slate-200 font-medium">{t.assignedAgentName}</span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold italic">Chưa phân công</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {getStatusBadge(t.status)}
                            </td>
                            <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {t.status === 'OPEN' || t.status === 'ASSIGNED' ? (
                                  <button
                                    onClick={() => handleAcceptTicket(t.id)}
                                    className="p-1 px-2 text-[11px] bg-blue-600 text-white font-medium rounded hover:bg-blue-700 shadow-sm"
                                  >
                                    Tiếp nhận
                                  </button>
                                ) : null}

                                {t.status === 'IN_PROGRESS' ? (
                                  <button
                                    onClick={() => { setSelectedTicket(t); setResolveModalOpen(true); }}
                                    className="p-1 px-2 text-[11px] bg-emerald-600 text-white font-medium rounded hover:bg-emerald-700 shadow-sm"
                                  >
                                    Giải quyết
                                  </button>
                                ) : null}

                                {t.status === 'RESOLVED' ? (
                                  <button
                                    onClick={() => { setSelectedTicket(t); setCloseModalOpen(true); }}
                                    className="p-1 px-2 text-[11px] bg-slate-700 dark:bg-slate-600 text-white font-medium rounded hover:bg-slate-800 dark:hover:bg-slate-500 shadow-sm"
                                  >
                                    Đóng phiếu
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                  <PaginationControl
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredTickets.length / pageSize) || 1}
                    totalItems={filteredTickets.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Ticket Drawer / Detail Inspector */}
            {selectedTicket && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">{selectedTicket.ticketCode}</span>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedTicket.subject}</h2>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status & Priority Row */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase">Trạng thái</div>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase text-right">Ưu tiên</div>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mô tả chi tiết:</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded border border-slate-200 dark:border-slate-700 mt-1 whitespace-pre-wrap">
                    {selectedTicket.description || 'Không có mô tả bổ sung.'}
                  </div>
                </div>

                {/* Hardware / Asset Info if any */}
                {(selectedTicket.assetCode || selectedTicket.serialNumber) && (
                  <div className="bg-amber-50/50 dark:bg-amber-950/40 p-3 rounded-md border border-amber-200 dark:border-amber-800/60 text-xs">
                    <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Thiết bị liên quan:
                    </div>
                    <div className="mt-1 text-slate-700 dark:text-slate-300 font-mono">
                      Mã tài sản: <span className="font-bold">{selectedTicket.assetCode || 'N/A'}</span>
                      {selectedTicket.serialNumber && <span> • Serial: {selectedTicket.serialNumber}</span>}
                    </div>
                    {!selectedTicket.workOrderId && selectedTicket.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleCreateWorkOrder(selectedTicket)}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 text-white font-medium rounded text-[11px] hover:bg-amber-700"
                      >
                        <Wrench className="w-3 h-3" /> Tạo lệnh bảo trì M27
                      </button>
                    )}
                    {selectedTicket.workOrderCode && (
                      <div className="mt-2 text-emerald-700 dark:text-emerald-300 font-medium">
                        ✓ Đã liên kết Lệnh bảo trì: <span className="font-mono font-bold">{selectedTicket.workOrderCode}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Root Cause & Resolution if Resolved */}
                {selectedTicket.rootCause && (
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3 rounded-md border border-emerald-200 dark:border-emerald-800/60 text-xs">
                    <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Kết quả khắc phục:
                    </div>
                    <div className="mt-1 text-slate-800 dark:text-slate-200">
                      <strong>Nguyên nhân gốc:</strong> {selectedTicket.rootCause}
                    </div>
                    <div className="mt-1 text-slate-800 dark:text-slate-200">
                      <strong>Giải pháp:</strong> {selectedTicket.resolutionNote}
                    </div>
                  </div>
                )}

                {/* Action Buttons Toolbar */}
                {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'CANCELLED' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {selectedTicket.status === 'IN_PROGRESS' || selectedTicket.status === 'PENDING' ? (
                      <button
                        onClick={() => handleTogglePause(selectedTicket)}
                        className="flex-1 py-1.5 px-2.5 text-xs font-semibold rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 flex items-center justify-center gap-1"
                      >
                        {selectedTicket.status === 'PENDING' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        {selectedTicket.status === 'PENDING' ? 'Tiếp tục SLA' : 'Tạm dừng SLA'}
                      </button>
                    ) : null}

                    {selectedTicket.status === 'IN_PROGRESS' ? (
                      <button
                        onClick={() => setResolveModalOpen(true)}
                        className="flex-1 py-1.5 px-2.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Giải quyết
                      </button>
                    ) : null}

                    {selectedTicket.status === 'RESOLVED' ? (
                      <button
                        onClick={() => setCloseModalOpen(true)}
                        className="flex-1 py-1.5 px-2.5 text-xs font-semibold rounded bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 flex items-center justify-center gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" /> Đóng & Nghiệm thu
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Discussion Stream */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex-1 flex flex-col gap-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Trao đổi nội bộ ({ticketMessages.length})</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {ticketMessages.length === 0 ? (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center py-3">Chưa có trao đổi nào.</div>
                    ) : (
                      ticketMessages.map((m, idx) => (
                        <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{m.senderName}</span>
                            <span className="font-mono tabular-nums">{new Date(m.createdAt).toLocaleTimeString('vi-VN')}</span>
                          </div>
                          <div className="mt-1 text-slate-700 dark:text-slate-300">{m.message}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {selectedTicket.status !== 'CLOSED' && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        type="text"
                        placeholder="Nhập phản hồi kỹ thuật..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                        className="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE TICKET & IMPACT MATRIX */}
        {activeTab === 'new_ticket' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Mở phiếu sự cố / Yêu cầu dịch vụ mới</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Hệ thống tự động cấp số theo dãy M03 và tính SLA cam kết</p>
              </div>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tiêu đề sự cố / yêu cầu <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Máy in mã vạch Zebra tại Kho Aistle 01 bị kẹt giấy và mất kết nối IP"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại yêu cầu (ITSM Type)</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INCIDENT">INCIDENT (Sự cố gián đoạn vận hành)</option>
                    <option value="SERVICE_REQUEST">SERVICE_REQUEST (Yêu cầu dịch vụ / Hỗ trợ)</option>
                    <option value="ACCESS_REQUEST">ACCESS_REQUEST (Yêu cầu cấp quyền tài khoản)</option>
                    <option value="EQUIPMENT_DEFECT">EQUIPMENT_DEFECT (Hỏng hóc thiết bị phần cứng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Danh mục nghiệp vụ</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TECHNICAL_SUPPORT">Hỗ trợ kỹ thuật phần mềm</option>
                    <option value="HARDWARE">Thiết bị phần cứng / Máy in / PDA</option>
                    <option value="NETWORK_WIFI">Mạng nội bộ / WiFi Kho / VPN</option>
                    <option value="ERP_MODULE">Lỗi hệ thống phân hệ ERP</option>
                    <option value="ACCESS_SECURITY">Tài khoản & Phân quyền bảo mật</option>
                  </select>
                </div>
              </div>

              {/* IMPACT & URGENCY MATRIX */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
                  <span>Ma trận Phân loại Mức độ ưu tiên (ITIL Priority Matrix)</span>
                  <span className="text-xs">{getPriorityBadge(computedPriority)}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mức độ ảnh hưởng (Impact)</label>
                    <select
                      value={newImpact}
                      onChange={(e: any) => setNewImpact(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CRITICAL">CRITICAL (Toàn công ty / Toàn kho bị dừng)</option>
                      <option value="HIGH">HIGH (Một phòng ban / Dây chuyền bị gián đoạn)</option>
                      <option value="MEDIUM">MEDIUM (Một nhóm người dùng bị ảnh hưởng)</option>
                      <option value="LOW">LOW (Cá nhân / Ảnh hưởng không đáng kể)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mức độ khẩn cấp (Urgency)</label>
                    <select
                      value={newUrgency}
                      onChange={(e: any) => setNewUrgency(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CRITICAL">CRITICAL (Cần xử lý ngay lập tức, không có lối tránh)</option>
                      <option value="HIGH">HIGH (Thời gian chịu đựng ngắn, ảnh hưởng tiến độ)</option>
                      <option value="MEDIUM">MEDIUM (Có phương án thay thế tạm thời)</option>
                      <option value="LOW">LOW (Có thể xếp lịch xử lý sau)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Người yêu cầu báo cáo</label>
                  <input
                    type="text"
                    value={newRequesterName}
                    onChange={(e) => setNewRequesterName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bộ phận / Chi nhánh</label>
                  <input
                    type="text"
                    value={newRequesterDept}
                    onChange={(e) => setNewRequesterDept(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã thiết bị M27 EAM (nếu có)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: IT-AST-PRN-004"
                    value={newAssetCode}
                    onChange={(e) => setNewAssetCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số Serial / IMEI M23 (nếu có)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: ZEBRA-SN-998811"
                    value={newSerialNumber}
                    onChange={(e) => setNewSerialNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô tả sự cố & Thông báo lỗi</label>
                <textarea
                  rows={4}
                  placeholder="Ghi rõ hiện tượng, thời điểm xảy ra, các thao tác đã thử..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"
                >
                  Phát hành phiếu sự cố
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: SLA MATRIX & VIRTUAL SIMULATION */}
        {activeTab === 'sla_matrix' && (
          <div className="space-y-6">
            {/* SLA Policies Table */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chính sách Cam kết Dịch vụ (SLA Policies)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Quy định thời hạn phản hồi và xử lý theo chuẩn cấp độ ưu tiên ITIL</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Mã SLA</th>
                      <th className="p-3">Tên chính sách</th>
                      <th className="p-3 text-center">Ưu tiên</th>
                      <th className="p-3 text-right">Phản hồi tối đa</th>
                      <th className="p-3 text-right">Giải quyết tối đa</th>
                      <th className="p-3 text-center">Lịch áp dụng</th>
                      <th className="p-3">Mô tả cam kết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {slaPolicies.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.policyCode}</td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{p.policyName}</td>
                        <td className="p-3 text-center">{getPriorityBadge(p.priority)}</td>
                        <td className="p-3 text-right font-mono font-semibold tabular-nums">{p.responseHours * 60} phút</td>
                        <td className="p-3 text-right font-mono font-semibold tabular-nums">{p.resolutionHours} giờ</td>
                        <td className="p-3 text-center">
                          {p.businessHoursOnly ? (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Giờ hành chính</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800">24/7/365</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* VIRTUAL TIME SIMULATOR (?asOf=) */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Mô phỏng Kiểm thử SLA & Cảnh báo Leo thang (?asOf= Virtual Simulator)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mô phỏng thời gian ảo để kiểm tra mốc 75%, 90% và Vi phạm SLA mà không kích hoạt gửi email/thông báo thật</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Độ lệch thời gian ảo:</span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md border border-slate-200 dark:border-slate-700">
                    {[-2, 0, 1.5, 3, 6, 24].map(h => (
                      <button
                        key={h}
                        onClick={() => { setVirtualHourOffset(h); evaluateSlaWithOffset(h); }}
                        className={`px-2.5 py-1 text-xs font-mono font-semibold rounded ${virtualHourOffset === h ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        {h > 0 ? `+${h}h` : `${h}h`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {slaReport && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="text-slate-500 dark:text-slate-400">Thời gian mô phỏng (asOf)</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{new Date(slaReport.asOf).toLocaleString('vi-VN')}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="text-slate-500 dark:text-slate-400">Tổng phiếu đang theo dõi</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{slaReport.totalActive}</div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-800/60 text-xs">
                      <div className="text-amber-700 dark:text-amber-300 font-medium">Cảnh báo ngưỡng 75% / 90%</div>
                      <div className="font-mono font-bold text-amber-800 dark:text-amber-200 mt-1 tabular-nums">{slaReport.warningCount} phiếu</div>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-800/60 text-xs">
                      <div className="text-rose-700 dark:text-rose-300 font-medium">Vi phạm SLA (Breached)</div>
                      <div className="font-mono font-bold text-rose-800 dark:text-rose-200 mt-1 tabular-nums">{slaReport.breachedCount} phiếu</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5">Mã phiếu</th>
                          <th className="p-2.5">Tiêu đề</th>
                          <th className="p-2.5 text-center">Ưu tiên</th>
                          <th className="p-2.5 text-right">% Thời gian dùng</th>
                          <th className="p-2.5 text-right">Giờ còn lại</th>
                          <th className="p-2.5 text-center">Trạng thái SLA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {slaReport.tickets?.map((t: any) => (
                          <tr key={t.ticketId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">{t.ticketCode}</td>
                            <td className="p-2.5 max-w-[240px] truncate text-slate-900 dark:text-slate-200">{t.subject}</td>
                            <td className="p-2.5 text-center">{getPriorityBadge(t.priority)}</td>
                            <td className="p-2.5 text-right font-mono font-semibold tabular-nums">{t.percentUsed}%</td>
                            <td className="p-2.5 text-right font-mono tabular-nums">{t.remainingHours}h</td>
                            <td className="p-2.5 text-center">
                              {t.isBreached ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">VI PHẠM SLA</span>
                              ) : t.slaStatus === 'WARNING_90' ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">CẢNH BÁO 90%</span>
                              ) : t.slaStatus === 'WARNING_75' ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">CẢNH BÁO 75%</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">TRONG HẠN</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ACCESS REQUESTS (F09 SoD) */}
        {activeTab === 'access_requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Left */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Yêu cầu Cấp quyền ERP mới
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Tuân thủ nghiêm ngặt nguyên tắc Phân tách nhiệm vụ (SoD)</p>
              </div>

              <form onSubmit={handleCreateAccessRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Người nhận quyền (Target User)</label>
                  <input
                    type="text"
                    value={arTargetName}
                    onChange={(e) => setArTargetName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quyền / Vai trò đề xuất</label>
                  <select
                    value={arPermission}
                    onChange={(e) => setArPermission(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value="accounting:post_gl">accounting:post_gl (Ghi sổ cái M30 - Rủi ro cao)</option>
                    <option value="pricing:override_approval">pricing:override_approval (Duyệt giá M41 - Rủi ro cao)</option>
                    <option value="inventory:force_adjust">inventory:force_adjust (Điều chỉnh kho M20 - Rủi ro cao)</option>
                    <option value="sales.approve">sales.approve (Duyệt đơn hàng bán M13)</option>
                    <option value="purchase.approve">purchase.approve (Duyệt đơn đặt mua M08)</option>
                    <option value="eam.wo_update">eam.wo_update (Cập nhật lệnh bảo dưỡng M27)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Thời hạn hiệu lực (Ngày)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={arDuration}
                    onChange={(e) => setArDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lý do & Mục đích nghiệp vụ</label>
                  <textarea
                    rows={3}
                    value={arReason}
                    onChange={(e) => setArReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 shadow-sm mt-2"
                >
                  Gửi yêu cầu phê duyệt
                </button>
              </form>
            </div>

            {/* List Right */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Danh sách Yêu cầu & Trạng thái Phê duyệt đa cấp</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Mã yêu cầu</th>
                      <th className="p-3">Người thụ hưởng</th>
                      <th className="p-3">Quyền đề xuất</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3 text-right">Thao tác phê duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {accessRequests.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{r.requestCode}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{r.targetUserName}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">Người xin: {r.requesterName}</div>
                        </td>
                        <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {r.requestedPermissionOrRole}
                          {r.isHighRisk && <span className="block text-[10px] text-rose-600 dark:text-rose-400 font-sans font-bold">★ Quyền rủi ro cao</span>}
                        </td>
                        <td className="p-3 text-center">
                          {r.status === 'PENDING_MANAGER_APPROVAL' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Chờ QL trực tiếp</span>
                          )}
                          {r.status === 'PENDING_SECURITY_APPROVAL' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Chờ Bảo mật</span>
                          )}
                          {r.status === 'APPROVED_PENDING_FULFILLMENT' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Chờ Admin cấp</span>
                          )}
                          {r.status === 'FULFILLED' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Đã kích hoạt</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status === 'PENDING_MANAGER_APPROVAL' && (
                              <button
                                onClick={() => handleApproveAccess(r, 'MANAGER')}
                                className="px-2 py-1 bg-amber-600 text-white font-medium rounded text-[11px] hover:bg-amber-700 shadow-sm"
                              >
                                Quản lý duyệt
                              </button>
                            )}

                            {r.status === 'PENDING_SECURITY_APPROVAL' && (
                              <button
                                onClick={() => handleApproveAccess(r, 'SECURITY')}
                                className="px-2 py-1 bg-purple-600 text-white font-medium rounded text-[11px] hover:bg-purple-700 shadow-sm"
                              >
                                Bảo mật duyệt
                              </button>
                            )}

                            {r.status === 'APPROVED_PENDING_FULFILLMENT' && (
                              <button
                                onClick={() => handleFulfillAccess(r)}
                                className="px-2.5 py-1 bg-emerald-600 text-white font-medium rounded text-[11px] hover:bg-emerald-700 shadow-sm"
                              >
                                Cấp quyền M04
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EQUIPMENT & EAM INTEGRATION */}
        {activeTab === 'equipment_eam' && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Quản trị Sự cố Thiết bị & Tích hợp 2 chiều M27 EAM
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Khi Work Order M27 hoàn tất bảo dưỡng, phiếu sự cố M38 tự động được chuyển sang RESOLVED</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Mã Ticket</th>
                    <th className="p-3">Thiết bị / Tài sản</th>
                    <th className="p-3">Số Serial M23</th>
                    <th className="p-3">Lệnh bảo trì M27</th>
                    <th className="p-3 text-center">Trạng thái Phiếu</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {tickets.filter(t => t.assetCode || t.serialNumber || t.workOrderCode).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{t.ticketCode}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{t.assetCode || 'N/A'}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{t.serialNumber || 'N/A'}</td>
                      <td className="p-3">
                        {t.workOrderCode ? (
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{t.workOrderCode}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">Chưa phát lệnh WO</span>
                        )}
                      </td>
                      <td className="p-3 text-center">{getStatusBadge(t.status)}</td>
                      <td className="p-3 text-right">
                        {!t.workOrderCode && t.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleCreateWorkOrder(t)}
                            className="px-2.5 py-1 bg-blue-600 text-white font-medium rounded text-[11px] hover:bg-blue-700 shadow-sm"
                          >
                            Tạo WO M27
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: KPI & AUDIT REPORT */}
        {activeTab === 'kpi_audit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart 1: Priority Distribution */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">Phân bổ Sự cố theo Mức độ Ưu tiên</h4>
                <div className="h-56">
                  {kpi && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'P1 - URGENT', count: kpi.priorityDistribution.URGENT, fill: '#e11d48' },
                        { name: 'P2 - HIGH', count: kpi.priorityDistribution.HIGH, fill: '#d97706' },
                        { name: 'P3 - NORMAL', count: kpi.priorityDistribution.NORMAL, fill: '#2563eb' },
                        { name: 'P4 - LOW', count: kpi.priorityDistribution.LOW, fill: '#64748b' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                        <YAxis fontSize={10} stroke="#94a3b8" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Category Backlog */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">Tồn đọng theo Danh mục Nghiệp vụ</h4>
                <div className="h-56">
                  {kpi && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(kpi.categoryBacklog).map(([k, v]) => ({ name: k, count: v }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                        <YAxis fontSize={10} stroke="#94a3b8" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Cam kết Tính Bất biến & Kiểm toán Chuỗi băm SHA-256 (M02 Compliance)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toàn bộ thao tác mở phiếu, cập nhật SLA, đổi ưu tiên, phê duyệt cấp quyền và đóng phiếu đều được ký số và ghi nhật ký bất biến vào Sổ cái Kiểm toán M02.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RESOLVE MODAL */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Giải quyết phiếu {selectedTicket?.ticketCode}
              </h3>
              <button onClick={() => setResolveModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nguyên nhân gốc rễ (Root Cause) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đứt cáp mạng LAN kết nối Switch trung tâm"
                  value={resolveRootCause}
                  onChange={(e) => setResolveRootCause(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giải pháp kỹ thuật (Resolution Notes) <span className="text-rose-500">*</span></label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Đã bấm lại đầu mạng Cat6 và kiểm tra Ping thông suốt"
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setResolveModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmResolve}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 shadow-sm"
              >
                Xác nhận giải quyết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE & CSAT SURVEY MODAL */}
      {closeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Nghiệm thu & Đóng phiếu {selectedTicket?.ticketCode}
              </h3>
              <button onClick={() => setCloseModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Phiếu sau khi đóng sẽ được chuyển sang chế độ <strong>Read-Only vĩnh viễn</strong> để bảo đảm tính toàn vẹn dữ liệu.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Đánh giá mức độ hài lòng (CSAT)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCsatRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star className={`w-6 h-6 ${star <= csatRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  ))}
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 ml-2">{csatRating} / 5 Sao</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ý kiến đóng góp (tùy chọn)</label>
                <textarea
                  rows={2}
                  placeholder="Kỹ thuật viên xử lý nhanh, thái độ chuyên nghiệp..."
                  value={csatComment}
                  onChange={(e) => setCsatComment(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setCloseModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm"
              >
                Xác nhận đóng phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL CONFIRM DIALOG */}
      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
}
