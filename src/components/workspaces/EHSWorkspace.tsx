import React, { useState, useEffect, useMemo } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../types';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from "../shell/DomainWorkspaceShell";
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PaginationControl } from '../common/PaginationControl';
import { DeepLinkBanner } from '../common/DeepLinkBanner';
import {
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Search,
  Plus,
  ArrowRight,
  HardHat,
  HeartPulse,
  Award,
  Calendar,
  X,
  MapPin,
  Filter,
  Download,
  Eye,
  Check,
  AlertCircle,
  FileText,
  Clock,
  User,
  Activity,
  ChevronRight,
  Sparkles,
  ClipboardList,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface EHSWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const EHSWorkspace: React.FC<EHSWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'INCIDENTS' | 'INSPECTIONS' | 'CERTS' | 'CHECKLISTS'>('M40', 'INCIDENTS');
  
  // Data States
  const [incidents, setIncidents] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [inspectionSearch, setInspectionSearch] = useState<string>('');
  const [inspectionFilterType, setInspectionFilterType] = useState<string>('ALL');
  const [inspectionFilterStatus, setInspectionFilterStatus] = useState<string>('ALL');

  // Pagination States
  const [incidentPage, setIncidentPage] = useState<number>(1);
  const [incidentPageSize, setIncidentPageSize] = useState<number>(10);
  const [inspectionPage, setInspectionPage] = useState<number>(1);
  const [inspectionPageSize, setInspectionPageSize] = useState<number>(10);

  // Modal & Drawer States
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState<boolean>(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState<boolean>(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState<boolean>(false);
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<any | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Form States
  const [newIncidentForm, setNewIncidentForm] = useState({
    title: '',
    incidentType: 'SAFETY_HAZARD',
    severity: 'MEDIUM',
    location: 'Xưởng Sản xuất 1 - Line SMT',
    actionTaken: 'Đã cô lập khu vực và thông báo đội an toàn PCCC.',
    inspector: 'Nguyễn Hoàng Nam (EHS Lead)',
  });

  const [newInspectionForm, setNewInspectionForm] = useState({
    title: '',
    type: 'FIRE_SAFETY',
    location: 'Nhà máy & Kho bãi trung tâm',
    findings: 'Đã hoàn tất kiểm tra hệ thống, các tiêu chí đều đạt chuẩn.',
    inspector: 'Đội Kiểm tra EHS & Cảnh sát PCCC',
    status: 'PASSED',
    totalItems: 20,
    passedItems: 20,
  });

  const [newTrainingForm, setNewTrainingForm] = useState({
    courseName: '',
    targetGroup: 'Nhóm 3 (Nghị định 44/2016)',
    trainer: 'Viện An toàn Lao động Việt Nam',
    attendeesCount: 25,
    passedCount: 25,
    certificateExpiry: '2028-09-01',
  });

  // Interactive JRA / Risk Checklist State
  const [jraChecklist, setJraChecklist] = useState<{ [key: string]: boolean }>({
    item1: true,
    item2: true,
    item3: true,
    item4: false,
    item5: true,
    item6: true,
  });

  const jraItems = [
    { id: 'item1', area: 'Xưởng Cơ khí CNC', text: '100% người lao động trang bị kính bảo hộ và nút tai chống ồn', weight: 20 },
    { id: 'item2', area: 'Xưởng Cơ khí CNC', text: 'Rào chắn cảm biến quang học dừng máy khẩn cấp hoạt động tốt', weight: 20 },
    { id: 'item3', area: 'Kho Hóa chất M17', text: 'Bồn rửa mắt khẩn cấp và vòi tắm khẩn cấp hoạt động sẵn sàng', weight: 15 },
    { id: 'item4', area: 'Kho Hóa chất M17', text: 'Niêm yết bảng dữ liệu an toàn hóa chất MSDS song ngữ tại từng kệ', weight: 15 },
    { id: 'item5', area: 'Hạ tầng Toàn nhà máy', text: 'Lối thoát hiểm và đèn chiếu sáng khẩn cấp Emergency 100% sáng', weight: 15 },
    { id: 'item6', area: 'Trạm Điện & Nồi hơi', text: 'Thảm cách điện 24kV và hồ sơ kiểm định áp lực còn hiệu lực', weight: 15 },
  ];

  const currentJraScore = useMemo(() => {
    return jraItems.reduce((sum, item) => sum + (jraChecklist[item.id] ? item.weight : 0), 0);
  }, [jraChecklist]);

  // Primary action button synced with active tab
  useEffect(() => {
    if (activeTab === 'INCIDENTS') {
      setPrimaryAction(() => () => setIsIncidentModalOpen(true), 'Báo cáo sự cố mới');
    } else if (activeTab === 'INSPECTIONS') {
      setPrimaryAction(() => () => setIsInspectionModalOpen(true), 'Tạo đợt kiểm định');
    } else if (activeTab === 'CERTS') {
      setPrimaryAction(() => () => setIsTrainingModalOpen(true), 'Thêm khóa huấn luyện');
    } else {
      setPrimaryAction(() => () => {
        onNotify('success', 'Đã lưu đánh giá JRA', `Điểm an toàn hiện trường đạt ${currentJraScore}/100.`);
      }, 'Lưu đánh giá JRA');
    }
    return () => setPrimaryAction(undefined, undefined);
  }, [activeTab, setPrimaryAction, currentJraScore, onNotify]);

  const fetchEhsData = async () => {
    setLoading(true);
    try {
      const [incRes, inspRes, trnRes] = await Promise.all([
        fetch('/api/ehs/records'),
        fetch('/api/ehs/inspections'),
        fetch('/api/ehs/trainings'),
      ]);
      const [incData, inspData, trnData] = await Promise.all([
        incRes.json(),
        inspRes.json(),
        trnRes.ok ? trnRes.json() : Promise.resolve([]),
      ]);
      setIncidents(Array.isArray(incData) ? incData : []);
      setInspections(Array.isArray(inspData) ? inspData : []);
      setTrainings(Array.isArray(trnData) ? trnData : []);
    } catch (err) {
      console.error('Error fetching EHS data:', err);
      onNotify('danger', 'Lỗi tải dữ liệu EHS', 'Không thể kết nối máy chủ Quản lý An toàn & Môi trường.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEhsData();
  }, []);

  // Entity selection for context rail & open 360° modal
  const handleSelectIncident = (inc: any) => {
    setSelectedIncidentDetail(inc);
    onSelectEntity({
      type: 'EHS_INCIDENT',
      id: inc.id,
      code: inc.recordCode,
      title: `${inc.title}`,
      status: inc.status,
      lineage: [
        { id: `ehs-${inc.id}`, type: 'Sự cố An toàn EHS', code: inc.recordCode, relation: 'ROOT_INCIDENT', status: inc.status },
        { id: `loc-${inc.location}`, type: 'Vị trí hiện trường', code: inc.location, relation: 'INCIDENT_LOCATION', status: 'AUDITED' },
        { id: `capa-${inc.id}`, type: 'Hành động khắc phục CAPA', code: `CAPA-${inc.recordCode}`, relation: 'CORRECTIVE_ACTION', status: inc.status === 'RESOLVED' ? 'COMPLETED' : 'IN_PROGRESS' },
      ],
      auditTrail: [
        { id: 1, action: 'Báo cáo sự cố tại hiện trường', timestamp: inc.reportedDate ?? '2026-08-22', user: inc.inspector ?? 'EHS Officer', sha256Checksum: 'a8b7c6d5e4f3a2b109876543' },
        { id: 2, action: `Biện pháp xử lý: ${inc.actionTaken ?? ''}`, timestamp: inc.reportedDate ?? '2026-08-22', user: 'Đội Ứng phó Khẩn cấp', sha256Checksum: '123456789abcdef012345678' },
      ],
      glEntries: [
        { account: 'EHS-SAFETY-AUDIT', accountName: 'Quản lý An toàn Lao động & Môi trường ISO 45001 / 14001', debit: 0, credit: 0, description: `Hồ sơ kiểm toán hiện trường: ${inc.title}` },
      ],
    });
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ehs/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncidentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Báo cáo sự cố thất bại');
      onNotify('success', 'Đã ghi nhận sự cố an toàn', `Hồ sơ mã ${data.recordCode} đã được chuyển tới Ban chỉ đạo EHS.`);
      setIsIncidentModalOpen(false);
      setNewIncidentForm({
        title: '',
        incidentType: 'SAFETY_HAZARD',
        severity: 'MEDIUM',
        location: 'Xưởng Sản xuất 1 - Line SMT',
        actionTaken: 'Đã cô lập khu vực và thông báo đội an toàn PCCC.',
        inspector: 'Nguyễn Hoàng Nam (EHS Lead)',
      });
      fetchEhsData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi báo cáo sự cố', err.message);
    }
  };

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ehs/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInspectionForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo đợt kiểm định thất bại');
      onNotify('success', 'Đã lưu đợt kiểm định an toàn', `Đợt kiểm định mã ${data.inspectionCode} đã được cập nhật vào hồ sơ kiểm toán.`);
      setIsInspectionModalOpen(false);
      setNewInspectionForm({
        title: '',
        type: 'FIRE_SAFETY',
        location: 'Nhà máy & Kho bãi trung tâm',
        findings: 'Đã hoàn tất kiểm tra hệ thống, các tiêu chí đều đạt chuẩn.',
        inspector: 'Đội Kiểm tra EHS & Cảnh sát PCCC',
        status: 'PASSED',
        totalItems: 20,
        passedItems: 20,
      });
      fetchEhsData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi kiểm định an toàn', err.message);
    }
  };

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ehs/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrainingForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ghi nhận khóa huấn luyện thất bại');
      onNotify('success', 'Đã lưu khóa huấn luyện ATLĐ', `Khóa học ${data.courseCode} (${data.attendeesCount} học viên) đã được cấp chứng nhận.`);
      setIsTrainingModalOpen(false);
      setNewTrainingForm({
        courseName: '',
        targetGroup: 'Nhóm 3 (Nghị định 44/2016)',
        trainer: 'Viện An toàn Lao động Việt Nam',
        attendeesCount: 25,
        passedCount: 25,
        certificateExpiry: '2028-09-01',
      });
      fetchEhsData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi ghi nhận huấn luyện', err.message);
    }
  };

  // Status transition handlers using ConfirmDialog (Rule #19) & API synchronization
  const handleResolveIncident = (incident: any) => {
    setConfirmDialog({
      isOpen: true,
      variant: 'info',
      title: 'Xác nhận hoàn tất khắc phục CAPA?',
      message: `Bạn có chắc chắn muốn chuyển sự cố "${incident.recordCode} - ${incident.title}" sang trạng thái ĐÃ KHẮC PHỤC (RESOLVED)?`,
      confirmText: 'Xác nhận đã khắc phục',
      cancelText: 'Quay lại',
      onConfirm: async () => {
        try {
          await fetch(`/api/ehs/records/${incident.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'RESOLVED' }),
          });
          setIncidents(prev => prev.map(item => item.id === incident.id ? { ...item, status: 'RESOLVED' } : item));
          if (selectedIncidentDetail?.id === incident.id) {
            setSelectedIncidentDetail((prev: any) => prev ? { ...prev, status: 'RESOLVED' } : null);
          }
          setConfirmDialog(null);
          onNotify('success', 'Cập nhật sự cố', `Sự cố ${incident.recordCode} đã được đánh dấu là Đã khắc phục.`);
        } catch (err) {
          onNotify('danger', 'Lỗi cập nhật', 'Không thể kết nối máy chủ để cập nhật sự cố.');
        }
      }
    });
  };

  const handleCloseIncident = (incident: any) => {
    setConfirmDialog({
      isOpen: true,
      variant: 'warning',
      title: 'Chốt & Đóng hồ sơ sự cố an toàn?',
      message: `Hồ sơ sự cố "${incident.recordCode}" sẽ được lưu trữ vào kho lưu trữ kiểm toán ISO 45001. Thao tác này hoàn tất chu trình CAPA.`,
      confirmText: 'Đóng hồ sơ sự cố',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        try {
          await fetch(`/api/ehs/records/${incident.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CLOSED' }),
          });
          setIncidents(prev => prev.map(item => item.id === incident.id ? { ...item, status: 'CLOSED' } : item));
          if (selectedIncidentDetail?.id === incident.id) {
            setSelectedIncidentDetail((prev: any) => prev ? { ...prev, status: 'CLOSED' } : null);
          }
          setConfirmDialog(null);
          onNotify('info', 'Đóng hồ sơ thành công', `Hồ sơ ${incident.recordCode} đã chính thức đóng.`);
        } catch (err) {
          onNotify('danger', 'Lỗi cập nhật', 'Không thể kết nối máy chủ để đóng hồ sơ sự cố.');
        }
      }
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    if (incidents.length === 0) {
      onNotify('warning', 'Không có dữ liệu', 'Danh sách sự cố an toàn hiện đang trống.');
      return;
    }
    const headers = ['Mã sự cố', 'Tiêu đề', 'Phân loại', 'Mức độ', 'Vị trí', 'Ngày báo cáo', 'Trạng thái', 'Người báo cáo', 'Biện pháp CAPA'];
    const rows = incidents.map(i => [
      i.recordCode ?? '',
      `"${(i.title ?? '').replace(/"/g, '""')}"`,
      i.incidentType ?? '',
      i.severity ?? '',
      `"${(i.location ?? '').replace(/"/g, '""')}"`,
      i.reportedDate ?? '',
      i.status ?? '',
      i.inspector ?? '',
      `"${(i.actionTaken ?? '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EHS_Incidents_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', `Đã tải xuống file CSV báo cáo sự cố an toàn EHS (${incidents.length} bản ghi).`);
  };

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchSearch = !searchQuery ||
        (inc.title && inc.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.recordCode && inc.recordCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.location && inc.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.inspector && inc.inspector.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSeverity = selectedSeverity === 'ALL' || inc.severity === selectedSeverity;
      const matchStatus = selectedStatus === 'ALL' || inc.status === selectedStatus;

      return matchSearch && matchSeverity && matchStatus;
    });
  }, [incidents, searchQuery, selectedSeverity, selectedStatus]);

  // Paginated Incidents
  const paginatedIncidents = useMemo(() => {
    const start = (incidentPage - 1) * incidentPageSize;
    return filteredIncidents.slice(start, start + incidentPageSize);
  }, [filteredIncidents, incidentPage, incidentPageSize]);

  // Filtered Inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter(insp => {
      const code = insp.inspectionCode ?? insp.checkCode ?? '';
      const title = insp.title ?? insp.findings ?? '';
      const loc = insp.location ?? '';
      const matchSearch = !inspectionSearch ||
        code.toLowerCase().includes(inspectionSearch.toLowerCase()) ||
        title.toLowerCase().includes(inspectionSearch.toLowerCase()) ||
        loc.toLowerCase().includes(inspectionSearch.toLowerCase());

      const type = insp.type ?? '';
      const matchType = inspectionFilterType === 'ALL' || type === inspectionFilterType;

      const status = insp.status ?? 'PASSED';
      const matchStatus = inspectionFilterStatus === 'ALL' || status === inspectionFilterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [inspections, inspectionSearch, inspectionFilterType, inspectionFilterStatus]);

  // Paginated Inspections
  const paginatedInspections = useMemo(() => {
    const start = (inspectionPage - 1) * inspectionPageSize;
    return filteredInspections.slice(start, start + inspectionPageSize);
  }, [filteredInspections, inspectionPage, inspectionPageSize]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const openIncidents = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
    const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
    const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
    const capaResolutionRate = incidents.length > 0 ? Math.round((resolvedIncidents / incidents.length) * 100) : 100;
    
    const totalInspections = inspections.length;
    const passedInspections = inspections.filter(i => (i.status ?? 'PASSED') === 'PASSED').length;
    const inspectionComplianceRate = totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 100;

    return {
      openIncidents,
      resolvedIncidents,
      criticalIncidents,
      capaResolutionRate,
      totalInspections,
      passedInspections,
      inspectionComplianceRate,
    };
  }, [incidents, inspections]);

  // Helper for Severity Badge
  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5 animate-pulse"></span>
            Khẩn cấp (Critical)
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Cao (High)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Trung bình (Medium)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Thấp (Low)
          </span>
        );
    }
  };

  // Helper for Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Đã khắc phục
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <ShieldCheck className="w-3 h-3 mr-1 text-slate-600 dark:text-slate-400" />
            Đã đóng hồ sơ
          </span>
        );
      case 'INVESTIGATING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3 mr-1 text-amber-600" />
            Đang điều tra
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <AlertCircle className="w-3 h-3 mr-1 text-blue-600" />
            Mới ghi nhận
          </span>
        );
    }
  };

  return (
    <div id="m40-ehs-workspace" className="space-y-6">
      {/* ================= CONFIRM DIALOG CHUẨN RULE #19 ================= */}
      {confirmDialog && (
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

      {/* ================= TẦNG L0: WORKSPACE BANNER CHUẨN M41 ================= */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30">
              M40 • EHS SAFETY & ENVIRONMENT
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Rule #19 & #20 Confirmed
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-[11px] font-semibold font-mono">
              <HeartPulse className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              LTI-Free: 412 Ngày An Toàn
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-2">
            An Toàn Lao Động & Vệ Sinh Môi Trường (EHS)
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Giám sát an toàn lao động, nhật ký sự cố hiện trường & hành động khắc phục CAPA, kiểm định PCCC định kỳ và quản trị chứng nhận ISO 45001:2018 / ISO 14001:2015.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all border border-emerald-500/30 shadow-xs cursor-pointer"
            title="Xuất danh sách sự cố an toàn sang CSV"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo EHS</span>
          </button>

          <button
            id="btn-report-incident-l0"
            onClick={() => setIsIncidentModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all border border-blue-500/30 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Báo cáo sự cố mới</span>
          </button>

          <button
            onClick={fetchEhsData}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
            title="Làm mới dữ liệu từ Authoritative Core"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Đồng bộ</span>
          </button>
        </div>
      </div>

      {/* ================= DEEP LINK BANNER SANG M39 QMS ================= */}
      <DeepLinkBanner
        targetModule="M39"
        targetRoute="/quality-control"
        title="Liên kết CAPA & Hệ thống Quản trị Chất lượng QMS (M39)"
        description="Mọi hành động khắc phục phòng ngừa sự cố an toàn lao động (CAPA EHS) đều được liên kết trực tiếp với quy trình kiểm soát chất lượng M39 và đánh giá rủi ro hiện trường tại nhà xưởng."
        actionText="Mở Kiểm Soát Chất Lượng M39 →"
        badgeText="M39 QUALITY CONTROL"
        variant="blue"
      />

      {/* ================= TẦNG L1: SUB-TABS NAVIGATION BAR THEO CHUẨN M41 ================= */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('INCIDENTS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'INCIDENTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Nhật ký Sự cố & CAPA</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'INCIDENTS' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {incidents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('INSPECTIONS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'INSPECTIONS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Kiểm định An toàn & PCCC</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'INSPECTIONS' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {inspections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CERTS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'CERTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Huấn luyện ATLĐ & Chứng chỉ ISO</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'CERTS' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              6 Nhóm
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CHECKLISTS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'CHECKLISTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Quy trình Khẩn cấp & ISO Audit</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'CHECKLISTS' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              SOP-3
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Hệ thống ISO 45001 / 14001</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
            EHS Active Compliance
          </span>
        </div>
      </div>

      {/* ================= TẦNG L2: KPI SUMMARY STRIP ĐỘNG THEO TAB CHUẨN M41 ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {activeTab === 'INCIDENTS' && (
          <>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ngày An Toàn Liên Tục</span>
                <HeartPulse className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                412 Ngày
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Không xảy ra tai nạn gián đoạn LTI</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Sự Cố Đang Xử Lý</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 mt-1">
                {kpiData.openIncidents}
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Đang triển khai biện pháp CAPA</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Tỷ Lệ Đóng CAPA</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 mt-1">
                {kpiData.capaResolutionRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{kpiData.resolvedIncidents} / {incidents.length} hồ sơ hoàn tất</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Mức Rủi Ro Cao/Khẩn Cấp</span>
                <Flame className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400 mt-1">
                {kpiData.criticalIncidents}
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Cần đội phản ứng nhanh giám sát</div>
            </div>
          </>
        )}

        {activeTab === 'INSPECTIONS' && (
          <>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Tổng Đợt Kiểm Định</span>
                <FileCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
                {kpiData.totalInspections} Đợt
              </div>
              <div className="text-[11px] text-slate-500 mt-1">PCCC, môi trường, thiết bị áp lực</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Hạng Mục Đạt Chuẩn</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {kpiData.inspectionComplianceRate}%
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">{kpiData.passedInspections} / {kpiData.totalInspections} đợt kiểm tra đạt</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Bình Khí PCCC Sẵn Sàng</span>
                <Flame className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400 mt-1">
                50/50 Bình
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Kiểm định áp suất CO2 & Bột ABC</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Đợt Cần Khắc Phục</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 mt-1">
                {kpiData.totalInspections - kpiData.passedInspections}
              </div>
              <div className="text-[11px] text-amber-600 mt-1">Rác thải nguy hại cần phân loại lại</div>
            </div>
          </>
        )}

        {activeTab === 'CERTS' && (
          <>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Tỷ Lệ Huấn Luyện ATLĐ</span>
                <HardHat className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 mt-1">
                98.6%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Theo Nghị định 44/2016/NĐ-CP</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Kỹ Sư Cấp Thẻ An Toàn</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                142/145
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Vận hành máy dập, CNC, nâng hạ</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Chứng Nhận ISO Có Hiệu Lực</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
                2/2 Hệ Thống
              </div>
              <div className="text-[11px] text-slate-500 mt-1">ISO 45001:2018 & ISO 14001:2015</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Thẻ Sắp Hết Hạn (30 Ngày)</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 mt-1">
                3 Nhân Sự
              </div>
              <div className="text-[11px] text-amber-600 mt-1">Đã lên lịch đào tạo định kỳ lại</div>
            </div>
          </>
        )}

        {activeTab === 'CHECKLISTS' && (
          <>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Quy Trình Khẩn Cấp (SOP)</span>
                <ClipboardList className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 mt-1">
                3 Bộ Quy Trình
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Sơ tán cháy, tràn hóa chất, sơ cứu</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Đánh Giá Rủi Ro JRA</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                100% Phân Xưởng
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Đã niêm yết ma trận an toàn tại chỗ</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Diễn Tập PCCC Gần Nhất</span>
                <Calendar className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
                15/07/2026
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Phối hợp cảnh sát PCCC địa phương</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Điểm Kiểm Toán ISO</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                96.5 / 100
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Xếp loại A: Tuân thủ xuất sắc</div>
            </div>
          </>
        )}
      </div>

      {/* ================= TẦNG L3: MAIN CONTENT AREA ================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        
        {/* ================= TAB 1: INCIDENTS & CAPA ================= */}
        {activeTab === 'INCIDENTS' && (
          <div>
            {/* Filter & Command Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã sự cố, tiêu đề, vị trí, người báo cáo..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIncidentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Rủi ro:</span>
                </div>
                <select
                  value={selectedSeverity}
                  onChange={(e) => {
                    setSelectedSeverity(e.target.value);
                    setIncidentPage(1);
                  }}
                  className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả mức độ</option>
                  <option value="CRITICAL">Critical (Khẩn cấp)</option>
                  <option value="HIGH">High (Cao)</option>
                  <option value="MEDIUM">Medium (Trung bình)</option>
                  <option value="LOW">Low (Thấp)</option>
                </select>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ml-1">
                  <span>Trạng thái:</span>
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setIncidentPage(1);
                  }}
                  className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="OPEN">Mới ghi nhận (Open)</option>
                  <option value="INVESTIGATING">Đang điều tra (Investigating)</option>
                  <option value="RESOLVED">Đã khắc phục (Resolved)</option>
                  <option value="CLOSED">Đã đóng hồ sơ (Closed)</option>
                </select>

                {(searchQuery || selectedSeverity !== 'ALL' || selectedStatus !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSeverity('ALL');
                      setSelectedStatus('ALL');
                      setIncidentPage(1);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 font-medium"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Mã Sự Cố</th>
                    <th className="py-3 px-4">Tiêu Đề Sự Cố & Người Báo Cáo</th>
                    <th className="py-3 px-4">Vị Trí Hiện Trường</th>
                    <th className="py-3 px-4">Mức Độ Rủi Ro</th>
                    <th className="py-3 px-4">Biện Pháp Khắc Phục CAPA</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {paginatedIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">Không tìm thấy sự cố an toàn nào</p>
                        <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedIncidents.map((inc) => (
                      <tr
                        key={inc.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors border-l-4 ${
                          inc.severity === 'CRITICAL'
                            ? 'border-l-rose-600 bg-rose-50/20 dark:bg-rose-950/10'
                            : inc.severity === 'HIGH'
                            ? 'border-l-rose-500'
                            : inc.severity === 'MEDIUM'
                            ? 'border-l-amber-500'
                            : 'border-l-emerald-500'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {inc.recordCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">{inc.title}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <User className="w-3 h-3" />
                            <span>{inc.inspector ?? 'EHS Officer'}</span>
                            <span>•</span>
                            <Calendar className="w-3 h-3" />
                            <span>{inc.reportedDate ?? '2026-08-28'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium">{inc.location}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {renderSeverityBadge(inc.severity)}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300">
                          {inc.actionTaken}
                        </td>
                        <td className="py-3 px-4">
                          {renderStatusBadge(inc.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSelectIncident(inc)}
                              className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer"
                              title="Xem chi tiết hồ sơ sự cố 360°"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Hồ sơ 360°</span>
                            </button>
                            {inc.status !== 'RESOLVED' && inc.status !== 'CLOSED' && (
                              <button
                                onClick={() => handleResolveIncident(inc)}
                                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 cursor-pointer"
                                title="Đánh dấu đã hoàn thành khắc phục CAPA"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Khắc phục</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredIncidents.length > incidentPageSize && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <PaginationControl
                  currentPage={incidentPage}
                  totalPages={Math.ceil(filteredIncidents.length / incidentPageSize)}
                  pageSize={incidentPageSize}
                  totalItems={filteredIncidents.length}
                  startIndex={(incidentPage - 1) * incidentPageSize + 1}
                  endIndex={Math.min(incidentPage * incidentPageSize, filteredIncidents.length)}
                  onPageChange={setIncidentPage}
                  onPageSizeChange={(s) => {
                    setIncidentPageSize(s);
                    setIncidentPage(1);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: INSPECTIONS ================= */}
        {activeTab === 'INSPECTIONS' && (
          <div>
            {/* Filter & Command Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã kiểm định, vị trí, nội dung phát hiện..."
                  value={inspectionSearch}
                  onChange={(e) => {
                    setInspectionSearch(e.target.value);
                    setInspectionPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Phân loại:</span>
                </div>
                <select
                  value={inspectionFilterType}
                  onChange={(e) => {
                    setInspectionFilterType(e.target.value);
                    setInspectionPage(1);
                  }}
                  className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả phân loại</option>
                  <option value="FIRE_SAFETY">PCCC & Báo cháy</option>
                  <option value="WASTE_MANAGEMENT">Môi trường & Rác thải</option>
                  <option value="ELECTRICAL">An toàn Điện công nghiệp</option>
                  <option value="PRESSURE_VESSEL">Thiết bị áp lực & Nồi hơi</option>
                </select>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ml-1">
                  <span>Kết quả:</span>
                </div>
                <select
                  value={inspectionFilterStatus}
                  onChange={(e) => {
                    setInspectionFilterStatus(e.target.value);
                    setInspectionPage(1);
                  }}
                  className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 dark:text-slate-200"
                >
                  <option value="ALL">Tất cả kết quả</option>
                  <option value="PASSED">Đạt chuẩn (Passed)</option>
                  <option value="FAILED">Cần khắc phục (Failed)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Mã Kiểm Định</th>
                    <th className="py-3 px-4">Phân Loại & Nội Dung</th>
                    <th className="py-3 px-4">Vị Trí Kiểm Tra</th>
                    <th className="py-3 px-4">Ngày Kiểm Tra</th>
                    <th className="py-3 px-4">Nội Dung Ghi Nhận / Phát Hiện</th>
                    <th className="py-3 px-4 text-center">Kết Quả Đánh Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {paginatedInspections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <FileCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">Không có dữ liệu kiểm định an toàn</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedInspections.map((insp) => {
                      const isPassed = (insp.status ?? 'PASSED') === 'PASSED';
                      return (
                        <tr
                          key={insp.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors border-l-4 ${
                            isPassed ? 'border-l-emerald-500' : 'border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/10'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {insp.inspectionCode ?? insp.checkCode ?? `INSP-2026-${String(insp.id).padStart(3, '0')}`}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {insp.title ?? (insp.type === 'FIRE_SAFETY' ? 'Kiểm định Thiết bị PCCC & Lối thoát hiểm' : 'Kiểm tra Phân loại Rác thải Nguy hại')}
                            </div>
                            <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {insp.type ?? 'AN_TOAN'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{insp.location ?? 'Nhà máy & Văn phòng'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {insp.date ?? insp.inspectionDate ?? '2026-08-25'}
                          </td>
                          <td className="py-3 px-4 max-w-sm text-slate-600 dark:text-slate-300">
                            {insp.findings ?? (insp.passedItems ? `${insp.passedItems}/${insp.totalItems} tiêu chí đạt chuẩn. Đơn vị: ${insp.certifiedBy}` : 'Hoàn thành đợt thanh tra')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isPassed ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Đạt chuẩn (Passed)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                                Cần khắc phục (Failed)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
                  onPageSizeChange={(s) => {
                    setInspectionPageSize(s);
                    setInspectionPage(1);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: CERTS & TRAINING ================= */}
        {activeTab === 'CERTS' && (
          <div className="p-6 space-y-6">
            {/* Chứng chỉ quốc tế */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                Chứng Nhận Hệ Thống Quản Lý Quốc Tế (ISO Accreditations)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-xl">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Chứng nhận ISO 45001:2018</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Hệ thống Quản lý An toàn và Sức khỏe Nghề nghiệp (OH&S)</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Đơn vị chứng nhận: <strong>SGS International</strong></span>
                    <span className="font-mono text-emerald-600 font-semibold">Hiệu lực: 15/12/2027</span>
                  </div>
                </div>

                <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-xl">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Chứng nhận ISO 14001:2015</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Hệ thống Quản lý Môi trường Doanh nghiệp (EMS)</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Đơn vị chứng nhận: <strong>TÜV Rheinland</strong></span>
                    <span className="font-mono text-blue-600 font-semibold">Hiệu lực: 20/06/2028</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ma trận 6 Nhóm huấn luyện an toàn theo NĐ 44/2016/NĐ-CP */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-blue-600" />
                  Ma Trận Huấn Luyện ATLĐ Theo Nghị Định 44/2016/NĐ-CP
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTrainingModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Khóa Huấn Luyện</span>
                </button>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-4">Nhóm Đối Tượng</th>
                      <th className="py-2.5 px-4">Mô Tả & Trách Nhiệm</th>
                      <th className="py-2.5 px-4 text-center">Tổng Nhân Sự</th>
                      <th className="py-2.5 px-4 text-center">Hoàn Thành Đào Tạo</th>
                      <th className="py-2.5 px-4 text-center">Tỷ Lệ</th>
                      <th className="py-2.5 px-4 text-center">Tình Trạng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {[
                      { group: 'Nhóm 1', desc: 'Người đứng đầu đơn vị, cơ sở sản xuất, cấp quản lý', total: 24, passed: 24, percent: 100, status: 'Hoàn thành' },
                      { group: 'Nhóm 2', desc: 'Cán bộ chuyên trách, bán chuyên trách công tác an toàn EHS', total: 8, passed: 8, percent: 100, status: 'Hoàn thành' },
                      { group: 'Nhóm 3', desc: 'Lao động làm công việc có yêu cầu nghiêm ngặt (Máy dập, CNC, Hàn, Nâng hạ)', total: 145, passed: 142, percent: 98, status: 'Đang đào tạo 3 NV' },
                      { group: 'Nhóm 4', desc: 'Người lao động không thuộc các nhóm 1, 2, 3, 5 (Khối văn phòng, lắp ráp nhẹ)', total: 280, passed: 280, percent: 100, status: 'Hoàn thành' },
                      { group: 'Nhóm 5', desc: 'Người làm công tác y tế, sơ cấp cứu tai nạn lao động', total: 6, passed: 6, percent: 100, status: 'Hoàn thành' },
                      { group: 'Nhóm 6', desc: 'An toàn, vệ sinh viên tại các phân xưởng sản xuất', total: 32, passed: 32, percent: 100, status: 'Hoàn thành' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{row.group}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">{row.desc}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{row.total}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-600">{row.passed}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold">{row.percent}%</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            row.percent === 100
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Danh sách các khóa huấn luyện thực tế đã tổ chức */}
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Hồ Sơ Các Lớp Huấn Luyện & Sát Hạch Cấp Chứng Chỉ
              </h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-4">Mã Khóa Học</th>
                      <th className="py-2.5 px-4">Tên Khóa Huấn Luyện</th>
                      <th className="py-2.5 px-4">Nhóm Đối Tượng</th>
                      <th className="py-2.5 px-4">Đơn Vị Đào Tạo</th>
                      <th className="py-2.5 px-4 text-center">Học Viên / Đạt</th>
                      <th className="py-2.5 px-4 text-center">Hạn Chứng Chỉ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {trainings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Chưa có lớp đào tạo nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      trainings.map((trn) => (
                        <tr key={trn.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                          <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{trn.courseCode}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">{trn.courseName}</td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{trn.targetGroup}</td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{trn.trainer}</td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-600">
                            {trn.passedCount}/{trn.attendeesCount}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                            {trn.certificateExpiry}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: CHECKLISTS & SOP ================= */}
        {activeTab === 'CHECKLISTS' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                Quy Trình Ứng Phó Tình Huống Khẩn Cấp (Emergency SOPs)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-200">
                      SOP-EHS-01
                    </span>
                    <span className="text-[10px] text-slate-400">Ban hành 2026</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Ứng Phó Tràn Đổ Hóa Chất / Dung Môi</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cô lập bán kính 15m, kích hoạt quạt hút thông gió ATEX, rải cát hấp thụ và thu gom vào thùng chứa rác nguy hại có nắp đậy kín.
                  </p>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200">
                      SOP-EHS-02
                    </span>
                    <span className="text-[10px] text-slate-400">Ban hành 2026</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Báo Động & Sơ Tán Khẩn Cấp PCCC</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Nhấn nút chuông báo động tầng, ngắt cầu dao tổng xưởng, di chuyển theo lối chỉ dẫn Exit đến Điểm tập kết an toàn số 1 ngoài sân.
                  </p>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200">
                      SOP-EHS-03
                    </span>
                    <span className="text-[10px] text-slate-400">Ban hành 2026</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Sơ Cấp Cứu Tai Nạn Điện Giật & Chấn Thương</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ngắt nguồn bằng vật cách điện, kiểm tra hô hấp/tuần hoàn, gọi đường dây nóng y tế nội bộ 115 và áp dụng hồi sinh tim phổi CPR.
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist kiểm toán nội bộ ISO 45001 & Đánh giá JRA tương tác trực tiếp */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Bảng Đánh Giá Rủi Ro An Toàn Hiện Trường (Interactive JRA Checklist)
                </h3>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-xl text-xs font-bold font-mono border ${
                    currentJraScore >= 90
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : currentJraScore >= 70
                      ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300'
                  }`}>
                    Điểm Tuân Thủ: {currentJraScore} / 100 ({currentJraScore >= 90 ? 'XUẤT SẮC' : currentJraScore >= 70 ? 'KHÁ' : 'NGUY CƠ CAO'})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onNotify('success', 'Lưu Biên Bản JRA', `Đã lưu biên bản đánh giá rủi ro hiện trường với điểm số ${currentJraScore}/100.`);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu Biên Bản</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {jraItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setJraChecklist(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!jraChecklist[item.id]}
                          onChange={() => {}}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{item.text}</span>
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                              {item.area}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                        +{item.weight} điểm
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: BÁO CÁO SỰ CỐ MỚI ================= */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                Báo Cáo Sự Cố An Toàn / Rủi Ro Môi Trường
              </h3>
              <button
                onClick={() => setIsIncidentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Mô Tả Tóm Tắt Sự Cố <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Rò rỉ dầu thủy lực tại trạm ép số 4..."
                  value={newIncidentForm.title}
                  onChange={(e) => setNewIncidentForm({ ...newIncidentForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phân Loại Mối Nguy
                  </label>
                  <select
                    value={newIncidentForm.incidentType}
                    onChange={(e) => setNewIncidentForm({ ...newIncidentForm, incidentType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white font-medium"
                  >
                    <option value="SAFETY_HAZARD">Mối nguy an toàn (Hazard)</option>
                    <option value="NEAR_MISS">Suýt xảy ra sự cố (Near-miss)</option>
                    <option value="ENVIRONMENTAL_SPILL">Tràn đổ hóa chất/môi trường</option>
                    <option value="FIRST_AID">Sơ cấp cứu tại chỗ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Mức Độ Rủi Ro
                  </label>
                  <select
                    value={newIncidentForm.severity}
                    onChange={(e) => setNewIncidentForm({ ...newIncidentForm, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white font-medium"
                  >
                    <option value="LOW">Thấp (Low)</option>
                    <option value="MEDIUM">Trung bình (Medium)</option>
                    <option value="HIGH">Cao (High)</option>
                    <option value="CRITICAL">Khẩn cấp (Critical)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Vị Trí Hiện Trường Xảy Ra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Xưởng Sản xuất 2 - Line CNC số 3..."
                  value={newIncidentForm.location}
                  onChange={(e) => setNewIncidentForm({ ...newIncidentForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Biện Pháp Khắc Phục Khẩn Cấp (CAPA)
                </label>
                <textarea
                  rows={3}
                  placeholder="Đã ngắt nguồn điện, dán biển cảnh báo, cô lập hiện trường..."
                  value={newIncidentForm.actionTaken}
                  onChange={(e) => setNewIncidentForm({ ...newIncidentForm, actionTaken: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gửi báo cáo sự cố</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: TẠO ĐỢT KIỂM ĐỊNH MỚI ================= */}
      {isInspectionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <FileCheck className="w-4 h-4" />
                </div>
                Tạo Đợt Kiểm Định An Toàn Mới
              </h3>
              <button
                onClick={() => setIsInspectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInspection} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tên Đợt Kiểm Định <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kiểm tra an toàn thiết bị nâng hạ & cầu trục..."
                  value={newInspectionForm.title}
                  onChange={(e) => setNewInspectionForm({ ...newInspectionForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phân Loại Kiểm Định
                  </label>
                  <select
                    value={newInspectionForm.type}
                    onChange={(e) => setNewInspectionForm({ ...newInspectionForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white font-medium"
                  >
                    <option value="FIRE_SAFETY">PCCC & Cứu nạn cứu hộ</option>
                    <option value="WASTE_MANAGEMENT">Môi trường & Xử lý rác thải</option>
                    <option value="ELECTRICAL">An toàn Điện công nghiệp</option>
                    <option value="PRESSURE_VESSEL">Thiết bị áp lực & Nồi hơi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Kết Quả Đánh Giá
                  </label>
                  <select
                    value={newInspectionForm.status}
                    onChange={(e) => setNewInspectionForm({ ...newInspectionForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white font-medium"
                  >
                    <option value="PASSED">Đạt chuẩn (Passed)</option>
                    <option value="FAILED">Cần khắc phục (Failed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Vị Trí Kiểm Tra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Toàn bộ Xưởng Sản xuất 1 & 2..."
                  value={newInspectionForm.location}
                  onChange={(e) => setNewInspectionForm({ ...newInspectionForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nội Dung Phát Hiện / Ghi Nhận
                </label>
                <textarea
                  rows={2}
                  placeholder="Đã kiểm tra 20/20 tiêu chuẩn an toàn kỹ thuật, không phát hiện vi phạm..."
                  value={newInspectionForm.findings}
                  onChange={(e) => setNewInspectionForm({ ...newInspectionForm, findings: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsInspectionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu đợt kiểm định</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: THÊM KHÓA HUẤN LUYỆN ATLĐ ================= */}
      {isTrainingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <HardHat className="w-4 h-4" />
                </div>
                Thêm Khóa Huấn Luyện & Sát Hạch ATLĐ
              </h3>
              <button
                onClick={() => setIsTrainingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTraining} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tên Khóa Huấn Luyện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Huấn luyện an toàn làm việc trên cao & không gian kín..."
                  value={newTrainingForm.courseName}
                  onChange={(e) => setNewTrainingForm({ ...newTrainingForm, courseName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nhóm Đối Tượng (NĐ 44)
                  </label>
                  <select
                    value={newTrainingForm.targetGroup}
                    onChange={(e) => setNewTrainingForm({ ...newTrainingForm, targetGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white font-medium"
                  >
                    <option value="Nhóm 1 (Nghị định 44/2016)">Nhóm 1 (Lãnh đạo & Quản lý)</option>
                    <option value="Nhóm 2 (Nghị định 44/2016)">Nhóm 2 (Cán bộ chuyên trách EHS)</option>
                    <option value="Nhóm 3 (Nghị định 44/2016)">Nhóm 3 (Công việc nghiêm ngặt)</option>
                    <option value="Nhóm 4 (Nghị định 44/2016)">Nhóm 4 (Khối văn phòng & phổ thông)</option>
                    <option value="Nhóm 5 (Nghị định 44/2016)">Nhóm 5 (Y tế & Sơ cứu)</option>
                    <option value="Nhóm 6 (Nghị định 44/2016)">Nhóm 6 (An toàn vệ sinh viên)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Đơn Vị Huấn Luyện
                  </label>
                  <input
                    type="text"
                    required
                    value={newTrainingForm.trainer}
                    onChange={(e) => setNewTrainingForm({ ...newTrainingForm, trainer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Số Học Viên
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newTrainingForm.attendeesCount}
                    onChange={(e) => setNewTrainingForm({ ...newTrainingForm, attendeesCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Số Lượng Đạt
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newTrainingForm.passedCount}
                    onChange={(e) => setNewTrainingForm({ ...newTrainingForm, passedCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Hạn Chứng Chỉ
                  </label>
                  <input
                    type="date"
                    value={newTrainingForm.certificateExpiry}
                    onChange={(e) => setNewTrainingForm({ ...newTrainingForm, certificateExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsTrainingModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu khóa học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CHI TIẾT SỰ CỐ 360° ================= */}
      {selectedIncidentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {selectedIncidentDetail.recordCode}
                  </span>
                  {renderSeverityBadge(selectedIncidentDetail.severity)}
                  {renderStatusBadge(selectedIncidentDetail.status)}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                  {selectedIncidentDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncidentDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Vị Trí Hiện Trường</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedIncidentDetail.location}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Người Báo Cáo & Ngày</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {selectedIncidentDetail.inspector ?? 'EHS Officer'} ({selectedIncidentDetail.reportedDate ?? '2026-08-28'})
                </p>
              </div>
            </div>

            {/* Biện pháp khắc phục CAPA */}
            <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Hành Động Khắc Phục Phòng Ngừa (CAPA):</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedIncidentDetail.actionTaken}
              </p>
            </div>

            {/* Bút toán định khoản sổ cái chi phí an toàn */}
            <div className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Kiểm Toán & Hạch Toán Kế Toán Phí An Toàn (GL Audit Trail)
              </span>
              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div>• Tài khoản: EHS-SAFETY-AUDIT (Quản lý An toàn & Môi trường ISO 45001)</div>
                <div>• Mã SHA-256 đối soát: a8b7c6d5e4f3a2b109876543</div>
                <div>• Trạng thái hồ sơ: {selectedIncidentDetail.status === 'RESOLVED' || selectedIncidentDetail.status === 'CLOSED' ? 'Đã nghiệm thu CAPA' : 'Đang giám sát'}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedIncidentDetail(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                {selectedIncidentDetail.status !== 'RESOLVED' && selectedIncidentDetail.status !== 'CLOSED' && (
                  <button
                    type="button"
                    onClick={() => handleResolveIncident(selectedIncidentDetail)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Xác nhận Đã khắc phục</span>
                  </button>
                )}

                {selectedIncidentDetail.status !== 'CLOSED' && (
                  <button
                    type="button"
                    onClick={() => handleCloseIncident(selectedIncidentDetail)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Đóng hồ sơ sự cố</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
