import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types/index';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from "../../../../components/shell/DomainWorkspaceShell";
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import {
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  X,
  MapPin,
  Eye,
  AlertCircle,
  FileText,
  Lock,
  Droplets,
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface EHSWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

type EHSTab = 'INCIDENTS' | 'JSA_MATRIX' | 'CAPA_DESK' | 'AUDITS' | 'FIRE_SAFETY' | 'ENVIRONMENTAL' | 'PERMITS_LOTO';

export const EHSWorkspace: React.FC<EHSWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<EHSTab>('M40', 'INCIDENTS');
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  // Data States
  const [incidents, setIncidents] = useState<any[]>([]);
  const [jsaList, setJsaList] = useState<any[]>([]);
  const [capasList, setCapasList] = useState<any[]>([]);
  const [auditsList, setAuditsList] = useState<any[]>([]);
  const [fireEquipments, setFireEquipments] = useState<any[]>([]);
  const [environmentalRecords, setEnvironmentalRecords] = useState<any[]>([]);
  const [permitsList, setPermitsList] = useState<any[]>([]);
  const [kpiSummary, setKpiSummary] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters & Searches
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Modals & Drawers
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState<boolean>(false);
  const [isJsaModalOpen, setIsJsaModalOpen] = useState<boolean>(false);
  const [isCapaModalOpen, setIsCapaModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isFireEqModalOpen, setIsFireEqModalOpen] = useState<boolean>(false);
  const [isInspectEqModalOpen, setIsInspectEqModalOpen] = useState<boolean>(false);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState<boolean>(false);
  const [isPermitModalOpen, setIsPermitModalOpen] = useState<boolean>(false);
  
  const [selectedDetail, setSelectedDetail] = useState<{ type: string; data: any } | null>(null);
  const [selectedFireEqToInspect, setSelectedFireEqToInspect] = useState<any | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Forms
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    incidentType: 'SAFETY_HAZARD',
    severity: 'MEDIUM',
    warehouseId: '',
    locationDetail: '',
    description: '',
    immediateAction: '',
    reportedByName: 'Nguyễn Văn An (EHS Lead)',
    affectedEmployeeName: '',
  });

  const [jsaForm, setJsaForm] = useState({
    title: '',
    jobTitle: '',
    workArea: '',
    warehouseId: '',
    severityScore: 3,
    probabilityScore: 2,
    hazards: 'Ngã cao, Va quẹt xe nâng, Bỏng nhiệt',
    controlMeasures: 'Sử dụng còi báo hiệu, trang bị dây an toàn 2 móc, duy trì vạch ranh giới',
    assessedBy: 'Ban An toàn EHS',
    reviewDate: '2026-12-31',
  });

  const [capaForm, setCapaForm] = useState({
    title: '',
    actionType: 'CORRECTIVE',
    actionPlan: '',
    rootCauseSummary: '',
    assignedToName: '',
    warehouseId: '',
    dueDate: '2026-10-15',
  });

  const [auditForm, setAuditForm] = useState({
    title: 'Kiểm tra An toàn Lao động & PCCC Định kỳ',
    auditType: 'FIRE_SAFETY',
    warehouseId: '',
    auditorName: 'Cán bộ Thanh tra EHS',
    checklist: [
      { id: '1', category: 'PCCC', text: 'Toàn bộ bình chữa cháy và họng nước còn hạn kiểm định 6 tháng', isMandatory: true, status: 'PASS' },
      { id: '2', category: 'LỐI THOÁT', text: 'Lối thoát hiểm, biển chỉ dẫn Exit và đèn chiếu sáng khẩn cấp thông suốt', isMandatory: true, status: 'PASS' },
      { id: '3', category: 'BẢO HỘ PPE', text: '100% nhân sự tại hiện trường trang bị đầy đủ mũ/giày/kính bảo hộ', isMandatory: false, status: 'PASS' },
      { id: '4', category: 'ĐIỆN & KHÍ NÉN', text: 'Tủ điện đóng kín có khóa, dây cáp nguồn không trầy xước, thảm cách điện đạt chuẩn', isMandatory: true, status: 'PASS' },
      { id: '5', category: 'HÓA CHẤT & RÁC THẢI', text: 'Khu vực hóa chất có khay chống tràn và bảng dữ liệu an toàn MSDS', isMandatory: false, status: 'PASS' },
    ],
  });

  const [fireEqForm, setFireEqForm] = useState({
    equipmentCode: '',
    name: '',
    type: 'FIRE_EXTINGUISHER_ABC',
    warehouseId: '',
    specificLocation: '',
    lastInspectionDate: new Date().toISOString().slice(0, 10),
    weightKg: 4.0,
    pressureStatus: 'NORMAL',
  });

  const [inspectEqForm, setInspectEqForm] = useState({
    inspectionDate: new Date().toISOString().slice(0, 10),
    pressureStatus: 'NORMAL',
    notes: 'Đã cân trọng lượng bột và kiểm tra đồng hồ áp lực, niêm phong chì nguyên vẹn.',
  });

  const [envForm, setEnvForm] = useState({
    recordType: 'WASTE_WATER',
    warehouseId: '',
    parameterName: 'Nồng độ COD nước thải',
    measuredValue: 65,
    standardThreshold: 100,
    unit: 'mg/L',
    notes: 'Quan trắc mẫu nước xả sau xử lý sinh học',
    recordedBy: 'Trung tâm Quan trắc Môi trường ISO 14001',
  });

  const [permitForm, setPermitForm] = useState({
    permitType: 'LOTO_ISOLATION',
    targetAssetId: '',
    warehouseId: '',
    areaLocation: '',
    description: '',
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    applicantName: 'Trần Kỹ Thuật (Bảo trì)',
    lotoTagNumber: `LOTO-${Date.now().toString().slice(-4)}`,
  });

  // Fetch Master and EHS Data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        incRes, jsaRes, capaRes, audRes, fireRes, envRes, pmtRes, kpiRes, whRes, astRes
      ] = await Promise.all([
        fetch('/api/ehs/incidents'),
        fetch('/api/ehs/risk-assessments'),
        fetch('/api/ehs/capas'),
        fetch('/api/ehs/audits'),
        fetch('/api/ehs/fire-safety/equipment'),
        fetch('/api/ehs/environmental/records'),
        fetch('/api/ehs/permits'),
        fetch('/api/ehs/kpi'),
        fetch('/api/warehouses').catch(() => ({ ok: false, json: () => [] })),
        fetch('/api/eam/assets').catch(() => ({ ok: false, json: () => [] })),
      ]);

      const [
        incData, jsaData, capaData, audData, fireData, envData, pmtData, kpiData, whData, astData
      ] = await Promise.all([
        incRes.ok ? incRes.json() : [],
        jsaRes.ok ? jsaRes.json() : [],
        capaRes.ok ? capaRes.json() : [],
        audRes.ok ? audRes.json() : [],
        fireRes.ok ? fireRes.json() : [],
        envRes.ok ? envRes.json() : [],
        pmtRes.ok ? pmtRes.json() : [],
        kpiRes.ok ? kpiRes.json() : null,
        whRes.ok ? whRes.json() : [],
        astRes.ok ? astRes.json() : [],
      ]);

      setIncidents(Array.isArray(incData) ? incData : []);
      setJsaList(Array.isArray(jsaData) ? jsaData : []);
      setCapasList(Array.isArray(capaData) ? capaData : []);
      setAuditsList(Array.isArray(audData) ? audData : []);
      setFireEquipments(Array.isArray(fireData) ? fireData : []);
      setEnvironmentalRecords(Array.isArray(envData) ? envData : []);
      setPermitsList(Array.isArray(pmtData) ? pmtData : []);
      setKpiSummary(kpiData);
      setWarehouses(Array.isArray(whData) ? whData : []);
      setAssets(Array.isArray(astData) ? astData : []);
    } catch (err: any) {
      console.error('Error loading EHS dataset:', err);
      onNotify('danger', 'Lỗi tải dữ liệu EHS', 'Không thể nạp dữ liệu An toàn & Môi trường.');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Sync Primary Top-Right Button
  useEffect(() => {
    switch (activeTab) {
      case 'INCIDENTS':
        setPrimaryAction(() => () => setIsIncidentModalOpen(true), 'Báo cáo Sự cố mới');
        break;
      case 'JSA_MATRIX':
        setPrimaryAction(() => () => setIsJsaModalOpen(true), 'Lập Đánh giá JSA');
        break;
      case 'CAPA_DESK':
        setPrimaryAction(() => () => setIsCapaModalOpen(true), 'Mở phiếu CAPA');
        break;
      case 'AUDITS':
        setPrimaryAction(() => () => setIsAuditModalOpen(true), 'Chạy Audit An toàn');
        break;
      case 'FIRE_SAFETY':
        setPrimaryAction(() => () => setIsFireEqModalOpen(true), 'Thêm Thiết bị PCCC');
        break;
      case 'ENVIRONMENTAL':
        setPrimaryAction(() => () => setIsEnvModalOpen(true), 'Ghi nhận Quan trắc');
        break;
      case 'PERMITS_LOTO':
        setPrimaryAction(() => () => setIsPermitModalOpen(true), 'Cấp Giấy phép / LOTO');
        break;
      default:
        setPrimaryAction(undefined, undefined);
    }
    return () => setPrimaryAction(undefined, undefined);
  }, [activeTab, setPrimaryAction]);

  // --- FILTERED DATA COMPUTATION ---
  const filteredIncidents = useMemo(() => {
    return incidents.filter(item => {
      const matchQuery = !searchQuery || 
        (item.incidentNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.locationDetail || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeverity = selectedSeverity === 'ALL' || item.severity === selectedSeverity;
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      return matchQuery && matchSeverity && matchStatus;
    });
  }, [incidents, searchQuery, selectedSeverity, selectedStatus]);

  const filteredJsa = useMemo(() => {
    return jsaList.filter(item => {
      return !searchQuery || 
        (item.assessmentCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.workArea || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [jsaList, searchQuery]);

  const filteredCapas = useMemo(() => {
    return capasList.filter(item => {
      const matchQuery = !searchQuery || 
        (item.capaNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      return matchQuery && matchStatus;
    });
  }, [capasList, searchQuery, selectedStatus]);

  const filteredAudits = useMemo(() => {
    return auditsList.filter(item => {
      return !searchQuery || 
        (item.auditNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [auditsList, searchQuery]);

  const filteredFireEquipments = useMemo(() => {
    return fireEquipments.filter(item => {
      const matchQuery = !searchQuery || 
        (item.equipmentCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchQuery;
    });
  }, [fireEquipments, searchQuery]);

  const filteredEnvironmental = useMemo(() => {
    return environmentalRecords.filter(item => {
      const matchQuery = !searchQuery || 
        (item.recordNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.parameterName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchQuery;
    });
  }, [environmentalRecords, searchQuery]);

  const filteredPermits = useMemo(() => {
    return permitsList.filter(item => {
      const matchQuery = !searchQuery || 
        (item.permitNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.lotoTagNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      return matchQuery && matchStatus;
    });
  }, [permitsList, searchQuery, selectedStatus]);

  // --- ACTIONS ---

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ehs/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...incidentForm,
          warehouseId: incidentForm.warehouseId ? Number(incidentForm.warehouseId) : undefined,
          idempotencyKey: `INC-SUBMIT-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi gửi báo cáo sự cố');
      onNotify('success', 'Báo cáo sự cố thành công', `Hồ sơ mã ${data.incidentNumber || data.code} đã được chuyển tới Ban chỉ huy EHS.`);
      setIsIncidentModalOpen(false);
      setIncidentForm({
        title: '',
        incidentType: 'SAFETY_HAZARD',
        severity: 'MEDIUM',
        warehouseId: '',
        locationDetail: '',
        description: '',
        immediateAction: '',
        reportedByName: 'Nguyễn Văn An (EHS Lead)',
        affectedEmployeeName: '',
      });
      loadAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi báo cáo', err.message);
    }
  };

  const handleCloseIncident = (incident: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Đóng Hồ sơ Sự cố An toàn',
      message: `Bạn có chắc chắn muốn đóng hồ sơ sự cố ${incident.incidentNumber}? Sau khi đóng, hồ sơ sẽ chuyển sang chế độ CHỈ ĐỌC (Bất biến) để phục vụ kiểm toán M02.`,
      confirmLabel: 'Đóng sự cố & Khóa hồ sơ',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/ehs/incidents/${incident.id}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: 'Đã hoàn tất khắc phục và điều tra nguyên nhân gốc rễ.' }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi đóng sự cố');
          onNotify('success', 'Đã đóng sự cố', `Hồ sơ ${incident.incidentNumber} đã được niêm phong.`);
          setConfirmDialog(null);
          loadAllData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleCreateJsa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ehs/risk-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jsaForm.title || `JSA ${jsaForm.jobTitle}`,
          jobTitle: jsaForm.jobTitle,
          workArea: jsaForm.workArea,
          warehouseId: jsaForm.warehouseId ? Number(jsaForm.warehouseId) : undefined,
          severityScore: Number(jsaForm.severityScore),
          probabilityScore: Number(jsaForm.probabilityScore),
          hazardsJson: JSON.stringify(jsaForm.hazards.split(',').map(s => s.trim())),
          controlMeasures: jsaForm.controlMeasures,
          assessedBy: jsaForm.assessedBy,
          reviewDate: jsaForm.reviewDate,
          idempotencyKey: `JSA-SUBMIT-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo JSA');
      onNotify('success', 'Đã lập đánh giá JSA', `Bảng đánh giá ${data.assessmentCode || ''} (Mức rủi ro: ${data.riskLevel || ''}) đã được phê duyệt.`);
      setIsJsaModalOpen(false);
      loadAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi JSA', err.message);
    }
  };

  const handleCreateCapa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ehs/capas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...capaForm,
          warehouseId: capaForm.warehouseId ? Number(capaForm.warehouseId) : undefined,
          idempotencyKey: `CAPA-SUBMIT-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi mở CAPA');
      onNotify('success', 'Đã mở phiếu CAPA', `Phiếu ${data.capaNumber || ''} đã được giao cho người phụ trách.`);
      setIsCapaModalOpen(false);
      loadAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi CAPA', err.message);
    }
  };

  const handleVerifyCapa = (capa: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Nghiệm thu Hoàn thành CAPA',
      message: `Xác nhận nghiệm thu hiện trường cho phiếu ${capa.capaNumber} (${capa.title})?`,
      confirmLabel: 'Nghiệm thu đạt chuẩn',
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/ehs/capas/${capa.id}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verificationNotes: 'Đã kiểm tra hiện trường, các biện pháp an toàn đáp ứng chuẩn.' }),
          });
          if (!res.ok) throw new Error('Lỗi nghiệm thu');
          onNotify('success', 'Nghiệm thu thành công', `Phiếu CAPA ${capa.capaNumber} đã chuyển sang trạng thái VERIFIED.`);
          setConfirmDialog(null);
          loadAllData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleCloseCapa = (capa: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Đóng Phiếu CAPA',
      message: `Xác nhận đóng hoàn tất phiếu CAPA ${capa.capaNumber}?`,
      confirmLabel: 'Đóng phiếu CAPA',
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/ehs/capas/${capa.id}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!res.ok) throw new Error('Lỗi đóng CAPA');
          onNotify('success', 'Đã đóng phiếu CAPA', `Phiếu ${capa.capaNumber} đã được chuyển trạng thái CLOSED.`);
          setConfirmDialog(null);
          loadAllData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleExecuteAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ehs/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: auditForm.title,
          auditType: auditForm.auditType,
          warehouseId: auditForm.warehouseId ? Number(auditForm.warehouseId) : 1,
          auditorName: auditForm.auditorName,
          checklistItems: auditForm.checklist.map(c => ({
            itemDescription: c.text,
            category: c.category,
            isMandatory: c.isMandatory,
            status: c.status,
          })),
          idempotencyKey: `AUDIT-EXEC-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thực hiện audit');
      
      if (data.result === 'FAIL') {
        onNotify('danger', 'Audit KẾT QUẢ: FAILED', `Biên bản ${data.auditNumber} KHÔNG ĐẠT (Điểm: ${data.scorePercent}%). Hệ thống đã tự động tạo phiếu CAPA ${data.generatedCapa?.capaNumber || ''} để xử lý!`);
      } else {
        onNotify('success', 'Audit KẾT QUẢ: PASSED', `Biên bản ${data.auditNumber} ĐẠT CHUẨN AN TOÀN (${data.scorePercent}%).`);
      }
      setIsAuditModalOpen(false);
      loadAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi Audit', err.message);
    }
  };

  const handleCreateFireEq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ehs/fire-safety/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fireEqForm,
          warehouseId: fireEqForm.warehouseId ? Number(fireEqForm.warehouseId) : 1,
          weightKg: Number(fireEqForm.weightKg),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đăng ký thiết bị PCCC');
      onNotify('success', 'Đã đăng ký thiết bị PCCC', `Thiết bị ${data.equipmentCode} (${data.name}) đã được đưa vào sổ kiểm định.`);
      setIsFireEqModalOpen(false);
      loadAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi PCCC', err.message);
    }
  };

  const handleInspectFireEq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFireEqToInspect) return;
    try {
      const res = await fetch(`/api/ehs/fire-safety/equipment/${selectedFireEqToInspect.id}/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectEqForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi ghi nhận kiểm định');
      onNotify('success', 'Gia hạn kiểm định thành công', `Thiết bị ${data.equipmentCode} đã được gia hạn kiểm định đến ngày ${data.expiryDate}.`);
      setIsInspectEqModalOpen(false);
      setSelectedFireEqToInspect(null);
      loadAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi kiểm định', err.message);
    }
  };

  const handleCreateEnvRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ehs/environmental/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...envForm,
          warehouseId: envForm.warehouseId ? Number(envForm.warehouseId) : 1,
          measuredValue: Number(envForm.measuredValue),
          standardThreshold: Number(envForm.standardThreshold),
          idempotencyKey: `ENV-SUBMIT-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu quan trắc');
      if (data.complianceStatus === 'EXCEEDED') {
        onNotify('warning', 'Cảnh báo: Vượt ngưỡng QCVN', `Chỉ số ${data.parameterName} (${data.measuredValue} ${data.unit}) đã VƯỢT NGƯỠNG cho phép (${data.standardThreshold} ${data.unit}).`);
      } else {
        onNotify('success', 'Ghi nhận quan trắc', `Thông số ${data.parameterName} đạt chuẩn quy định.`);
      }
      setIsEnvModalOpen(false);
      loadAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi môi trường', err.message);
    }
  };

  const handleCreatePermit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedAsset = assets.find(a => a.id === Number(permitForm.targetAssetId));
      const res = await fetch('/api/ehs/permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...permitForm,
          targetAssetId: permitForm.targetAssetId ? Number(permitForm.targetAssetId) : undefined,
          targetAssetCode: selectedAsset?.code,
          targetAssetName: selectedAsset?.name,
          warehouseId: permitForm.warehouseId ? Number(permitForm.warehouseId) : 1,
          idempotencyKey: `PERMIT-SUBMIT-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cấp permit');
      onNotify('success', 'Đã cấp Giấy phép An toàn', `Giấy phép ${data.permitNumber} (${data.permitType}) đã được phê duyệt hiệu lực.`);
      setIsPermitModalOpen(false);
      loadAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi Permit', err.message);
    }
  };

  const handleClosePermit = (permit: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Đóng Giấy phép An toàn & Tháo Thẻ LOTO',
      message: `Xác nhận công việc đã kết thúc, hiện trường đã an toàn và hoàn tất tháo thẻ khóa ${permit.lotoTagNumber || permit.permitNumber}?`,
      confirmLabel: 'Đóng Permit & Tháo LOTO',
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/ehs/permits/${permit.id}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: 'Đã hoàn tất nghiệm thu an toàn sau bảo trì.' }),
          });
          if (!res.ok) throw new Error('Lỗi đóng permit');
          onNotify('success', 'Đã đóng giấy phép', `Giấy phép ${permit.permitNumber} đã được thanh toán an toàn.`);
          setConfirmDialog(null);
          loadAllData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Stats badges
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* 1. Header Toolbar & KPI Scorecard */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">M40 — An toàn Lao động & Môi trường (EHS)</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  ISO 45001 & ISO 14001
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhật ký sự cố, ma trận rủi ro JSA 5×5, kiểm định PCCC 6 tháng, CAPA và cấp phép cách ly nguồn năng lượng LOTO
              </p>
            </div>
          </div>

          {/* Quick Scorecard */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Số ngày An toàn</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums">{kpiSummary?.safeWorkingDays || 142} Ngày</div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">PCCC Quá hạn</div>
                <div className={`text-sm font-bold font-mono tabular-nums ${kpiSummary?.expiredFireEquipment > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {kpiSummary?.expiredFireEquipment || 0} Thiết bị
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">CAPA Đang mở</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums">{kpiSummary?.openCapas || 0} Phiếu</div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">LOTO Đang khóa</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums">{kpiSummary?.activePermits || 0} Máy</div>
              </div>
            </div>

            <button
              onClick={loadAllData}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Operational Tabs Navigation with Scroll Controls */}
        <div className="flex items-center justify-between gap-1 mt-4 border-b border-slate-200 dark:border-slate-800 -mb-4">
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
            className="flex items-center gap-1 overflow-x-auto scroll-smooth no-scrollbar flex-1 py-0.5"
          >
            {[
              { id: 'INCIDENTS', label: '1. Nhật ký Sự cố', icon: ShieldAlert, badge: incidents.filter(i => i.status !== 'CLOSED').length },
              { id: 'JSA_MATRIX', label: '2. Ma trận JSA 5×5', icon: BarChart3, badge: jsaList.length },
              { id: 'CAPA_DESK', label: '3. Bàn làm việc CAPA', icon: AlertCircle, badge: capasList.filter(c => c.status !== 'CLOSED').length },
              { id: 'AUDITS', label: '4. Kiểm tra & Checklist', icon: CheckSquare, badge: auditsList.length },
              { id: 'FIRE_SAFETY', label: '5. Thiết bị PCCC', icon: Flame, badge: fireEquipments.filter(f => f.expiryDate < todayStr).length, badgeDanger: true },
              { id: 'ENVIRONMENTAL', label: '6. Quan trắc Môi trường', icon: Droplets, badge: environmentalRecords.filter(e => e.complianceStatus === 'EXCEEDED').length, badgeDanger: true },
              { id: 'PERMITS_LOTO', label: '7. Giấy phép & Khóa LOTO', icon: Lock, badge: permitsList.filter(p => p.status === 'ACTIVE').length },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as EHSTab); setCurrentPage(1); setSearchQuery(''); }}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                      tab.badgeDanger
                        ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
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
      </div>

      {/* Search & Action Bar */}
      <div className="px-6 pt-4 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm thông tin theo mã, tên, vị trí..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {activeTab === 'INCIDENTS' && (
          <div className="flex items-center gap-2">
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">Tất cả Mức độ</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Báo cáo Sự cố
            </button>
          </div>
        )}

        {activeTab === 'JSA_MATRIX' && (
          <button
            onClick={() => setIsJsaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Lập JSA Mới
          </button>
        )}

        {activeTab === 'CAPA_DESK' && (
          <button
            onClick={() => setIsCapaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo phiếu CAPA
          </button>
        )}

        {activeTab === 'AUDITS' && (
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Chạy Audit Hiện trường
          </button>
        )}

        {activeTab === 'FIRE_SAFETY' && (
          <button
            onClick={() => setIsFireEqModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Đăng ký Thiết bị PCCC
          </button>
        )}

        {activeTab === 'ENVIRONMENTAL' && (
          <button
            onClick={() => setIsEnvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Ghi nhận Quan trắc
          </button>
        )}

        {activeTab === 'PERMITS_LOTO' && (
          <button
            onClick={() => setIsPermitModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Cấp Permit / LOTO
          </button>
        )}
      </div>

      {/* 3. Main Operational Content Workspace */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* TAB 1: INCIDENTS LOG */}
        {activeTab === 'INCIDENTS' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-3 px-4">Mã Sự cố</th>
                    <th className="py-3 px-4">Tiêu đề & Phân loại</th>
                    <th className="py-3 px-4">Mức độ (Severity)</th>
                    <th className="py-3 px-4">Địa điểm & Ngày</th>
                    <th className="py-3 px-4">Người báo cáo / Bị ảnh hưởng</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">
                        Chưa có hồ sơ sự cố nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map(inc => (
                      <tr key={inc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white tabular-nums">
                          {inc.incidentNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{inc.title}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{inc.incidentType}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            inc.severity === 'CRITICAL' ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
                            inc.severity === 'HIGH' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                            inc.severity === 'MEDIUM' ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {inc.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 dark:text-slate-200">{inc.locationDetail || inc.warehouseName}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">{inc.incidentDate}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 dark:text-slate-200">{inc.reportedByName || 'Chưa ghi nhận'}</div>
                          {inc.affectedEmployeeName && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-400">Nạn nhân: {inc.affectedEmployeeName}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            inc.status === 'CLOSED' ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                            inc.status === 'INVESTIGATING' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                            'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedDetail({ type: 'INCIDENT', data: inc })}
                              className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded border border-slate-200 dark:border-slate-700 text-xs"
                            >
                              Chi tiết
                            </button>
                            {inc.status !== 'CLOSED' && (
                              <button
                                onClick={() => handleCloseIncident(inc)}
                                className="px-2 py-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-800 text-xs font-medium"
                              >
                                Đóng
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
          </div>
        )}

        {/* TAB 2: JSA MATRIX 5x5 */}
        {activeTab === 'JSA_MATRIX' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Ma trận Đánh giá Rủi ro Công việc (JSA 5×5)</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Điểm rủi ro = Khả năng xảy ra (1-5) × Mức độ nghiêm trọng (1-5). Thang đo: LOW (1-4), MEDIUM (5-9), HIGH (10-14), EXTREME (15-25).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredJsa.map(jsa => (
                <div key={jsa.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{jsa.assessmentCode}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        jsa.riskLevel === 'EXTREME' ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                        jsa.riskLevel === 'HIGH' ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                        jsa.riskLevel === 'MEDIUM' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' :
                        'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      }`}>
                        {jsa.riskLevel} ({jsa.riskScore} điểm)
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">{jsa.jobTitle}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      {jsa.workArea}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 mb-3 space-y-1">
                      <div className="font-medium text-slate-700 dark:text-slate-200">Biện pháp kiểm soát:</div>
                      <div className="line-clamp-2 text-[11px] text-slate-600 dark:text-slate-300">{jsa.controlMeasures}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    <div>Đánh giá: {jsa.assessedBy}</div>
                    <button
                      onClick={() => setSelectedDetail({ type: 'JSA', data: jsa })}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold"
                    >
                      Chi tiết →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CAPA DESK */}
        {activeTab === 'CAPA_DESK' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-semibold">
                    <th className="py-3 px-4">Mã CAPA</th>
                    <th className="py-3 px-4">Nguồn phát sinh</th>
                    <th className="py-3 px-4">Nội dung khắc phục</th>
                    <th className="py-3 px-4">Người phụ trách</th>
                    <th className="py-3 px-4">Hạn hoàn thành</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCapas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">Không có phiếu CAPA nào.</td>
                    </tr>
                  ) : (
                    filteredCapas.map(capa => {
                      const isOverdue = capa.status !== 'CLOSED' && capa.dueDate < todayStr;
                      return (
                        <tr key={capa.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white tabular-nums">
                            {capa.capaNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {capa.sourceRefType}: {capa.sourceRefCode || `#${capa.sourceRefId}`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{capa.title}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{capa.actionPlan}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                            {capa.assignedToName || 'Chưa phân công'}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums">
                            <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                              {capa.dueDate} {isOverdue && '(Quá hạn)'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              capa.status === 'CLOSED' ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                              capa.status === 'VERIFIED' ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                              isOverdue ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
                              'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}>
                              {capa.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {capa.status === 'OPEN' || capa.status === 'IN_PROGRESS' ? (
                                <button
                                  onClick={() => handleVerifyCapa(capa)}
                                  className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-800"
                                >
                                  Nghiệm thu
                                </button>
                              ) : null}
                              {capa.status !== 'CLOSED' && (
                                <button
                                  onClick={() => handleCloseCapa(capa)}
                                  className="px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-800"
                                >
                                  Đóng
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: AUDITS & CHECKLISTS */}
        {activeTab === 'AUDITS' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-semibold">
                    <th className="py-3 px-4">Mã Audit</th>
                    <th className="py-3 px-4">Tên đợt kiểm tra</th>
                    <th className="py-3 px-4">Địa điểm & Ngày</th>
                    <th className="py-3 px-4">Thanh tra viên</th>
                    <th className="py-3 px-4 text-center">Tỷ lệ Đạt</th>
                    <th className="py-3 px-4 text-center">Kết luận</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAudits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">Chưa có đợt audit nào.</td>
                    </tr>
                  ) : (
                    filteredAudits.map(aud => (
                      <tr key={aud.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white tabular-nums">
                          {aud.auditNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{aud.title}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{aud.auditType}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 dark:text-slate-200">{aud.warehouseName || 'Kho Tổng'}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">{aud.auditDate}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{aud.auditorName}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                          {aud.scorePercent}% ({aud.passedItems}/{aud.totalItems})
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            aud.result === 'PASS'
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          }`}>
                            {aud.result}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedDetail({ type: 'AUDIT', data: aud })}
                            className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            Xem biên bản
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: FIRE SAFETY & EQUIPMENT REGISTRY */}
        {activeTab === 'FIRE_SAFETY' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-semibold">
                    <th className="py-3 px-4">Mã Thiết bị</th>
                    <th className="py-3 px-4">Tên & Chủng loại</th>
                    <th className="py-3 px-4">Vị trí lắp đặt</th>
                    <th className="py-3 px-4">Ngày kiểm định gần nhất</th>
                    <th className="py-3 px-4">Hạn kiểm định kế tiếp</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredFireEquipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">Không có thiết bị PCCC nào.</td>
                    </tr>
                  ) : (
                    filteredFireEquipments.map(fe => {
                      const isExpired = fe.expiryDate < todayStr;
                      return (
                        <tr key={fe.id} className={`transition-colors ${isExpired ? 'bg-rose-50/40 dark:bg-rose-950/30 hover:bg-rose-50/60 dark:hover:bg-rose-950/50' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'}`}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {fe.equipmentCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{fe.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{fe.type}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-800 dark:text-slate-200">{fe.specificLocation}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">{fe.warehouseName}</div>
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {fe.lastInspectionDate}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums">
                            <span className={isExpired ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                              {fe.expiryDate} {isExpired && '⚠️ Quá hạn'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isExpired ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse' : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}>
                              {isExpired ? 'EXPIRED (QUÁ HẠN)' : 'READY (ĐẠT CHUẨN)'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedFireEqToInspect(fe);
                                setIsInspectEqModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded border border-emerald-200 dark:border-emerald-800"
                            >
                              Kiểm định & Gia hạn
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: ENVIRONMENTAL MONITORING */}
        {activeTab === 'ENVIRONMENTAL' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-semibold">
                    <th className="py-3 px-4">Mã Bản ghi</th>
                    <th className="py-3 px-4">Loại hình</th>
                    <th className="py-3 px-4">Chỉ số Quan trắc</th>
                    <th className="py-3 px-4 text-right">Giá trị Đo</th>
                    <th className="py-3 px-4 text-right">Ngưỡng Quy định (QCVN)</th>
                    <th className="py-3 px-4 text-center">Đánh giá</th>
                    <th className="py-3 px-4 text-right">Ngày đo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEnvironmental.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">Chưa có số liệu quan trắc.</td>
                    </tr>
                  ) : (
                    filteredEnvironmental.map(env => (
                      <tr key={env.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white tabular-nums">
                          {env.recordNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {env.recordType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {env.parameterName}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                          {env.measuredValue} {env.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                          ≤ {env.standardThreshold} {env.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            env.complianceStatus === 'COMPLIANT'
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}>
                            {env.complianceStatus === 'COMPLIANT' ? 'ĐẠT CHUẨN' : 'VƯỢT NGƯỠNG'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {env.recordedDate}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: PERMITS & LOTO */}
        {activeTab === 'PERMITS_LOTO' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-semibold">
                    <th className="py-3 px-4">Mã Giấy phép</th>
                    <th className="py-3 px-4">Loại Giấy phép</th>
                    <th className="py-3 px-4">Tài sản liên kết (M27)</th>
                    <th className="py-3 px-4">Mã Thẻ LOTO</th>
                    <th className="py-3 px-4">Thời gian Hiệu lực</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPermits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">Không có giấy phép nào đang phát hành.</td>
                    </tr>
                  ) : (
                    filteredPermits.map(pmt => (
                      <tr key={pmt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {pmt.permitNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {pmt.permitType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {pmt.targetAssetCode ? (
                            <div>
                              <span className="font-mono font-medium text-slate-900 dark:text-white">{pmt.targetAssetCode}</span>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{pmt.targetAssetName}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic">Không gắn máy móc</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                          {pmt.lotoTagNumber || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] tabular-nums text-slate-700 dark:text-slate-300">
                          {pmt.validFrom} → {pmt.validTo}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            pmt.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' :
                            pmt.status === 'APPROVED' ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {pmt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {pmt.status !== 'CLOSED' && (
                            <button
                              onClick={() => handleClosePermit(pmt)}
                              className="px-2 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-800"
                            >
                              Đóng & Tháo LOTO
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. ALL MODALS & POPUPS */}

      {/* Modal 1: Báo cáo Sự cố Mới */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                Báo cáo Sự cố An toàn Lao động & Môi trường
              </h3>
              <button onClick={() => setIsIncidentModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tiêu đề Sự cố *</label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Chập điện tại máy CNC / Tràn hóa chất"
                  value={incidentForm.title}
                  onChange={e => setIncidentForm({ ...incidentForm, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Phân loại Sự cố</label>
                  <select
                    value={incidentForm.incidentType}
                    onChange={e => setIncidentForm({ ...incidentForm, incidentType: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    <option value="SAFETY_HAZARD">SAFETY_HAZARD (Mối nguy an toàn)</option>
                    <option value="NEAR_MISS">NEAR_MISS (Suýt xảy ra)</option>
                    <option value="FIRST_AID">FIRST_AID (Sơ cứu y tế)</option>
                    <option value="LOST_TIME">LOST_TIME (Mất ngày công LĐ)</option>
                    <option value="ENVIRONMENTAL_SPILL">ENVIRONMENTAL_SPILL (Tràn đổ môi trường)</option>
                    <option value="FIRE_HAZARD">FIRE_HAZARD (Sự cố Cháy nổ)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Mức độ Nghiêm trọng</label>
                  <select
                    value={incidentForm.severity}
                    onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    <option value="LOW">LOW (Thấp - Báo cáo 72h)</option>
                    <option value="MEDIUM">MEDIUM (Trung bình - Báo cáo 48h)</option>
                    <option value="HIGH">HIGH (Cao - Báo cáo 24h)</option>
                    <option value="CRITICAL">CRITICAL (Khẩn cấp - Báo cáo tức thì)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kho bãi / Chi nhánh M18</label>
                  <select
                    value={incidentForm.warehouseId}
                    onChange={e => setIncidentForm({ ...incidentForm, warehouseId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    <option value="">-- Chọn Kho bãi --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Vị trí cụ thể tại hiện trường</label>
                  <input
                    type="text"
                    placeholder="Vd: Dãy kệ A4 / Cụm máy CNC"
                    value={incidentForm.locationDetail}
                    onChange={e => setIncidentForm({ ...incidentForm, locationDetail: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Mô tả diễn biến sự cố *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mô tả chi tiết nguyên nhân phát sinh và thiệt hại ban đầu..."
                  value={incidentForm.description}
                  onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Hành động khắc phục tức thời</label>
                <input
                  type="text"
                  placeholder="Vd: Đã ngắt cầu dao tổng, cô lập bán kính 10m"
                  value={incidentForm.immediateAction}
                  onChange={e => setIncidentForm({ ...incidentForm, immediateAction: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Gửi Báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Lập Đánh giá JSA Mới */}
      {isJsaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Lập Bảng Đánh giá Rủi ro Công việc (JSA 5×5)
              </h3>
              <button onClick={() => setIsJsaModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJsa} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tiêu đề / Vị trí công việc *</label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Vận hành xe nâng nâng xếp hàng kệ tầng 4"
                  value={jsaForm.jobTitle}
                  onChange={e => setJsaForm({ ...jsaForm, jobTitle: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Khu vực làm việc *</label>
                  <input
                    type="text"
                    required
                    placeholder="Kho A - Khu vực xuất hàng"
                    value={jsaForm.workArea}
                    onChange={e => setJsaForm({ ...jsaForm, workArea: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kho bãi M18</label>
                  <select
                    value={jsaForm.warehouseId}
                    onChange={e => setJsaForm({ ...jsaForm, warehouseId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    <option value="">-- Chọn Kho bãi --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Khả năng xảy ra (1-5)</label>
                  <select
                    value={jsaForm.probabilityScore}
                    onChange={e => setJsaForm({ ...jsaForm, probabilityScore: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono font-bold"
                  >
                    <option value={1}>1 - Rất hiếm khi</option>
                    <option value={2}>2 - Ít khi xảy ra</option>
                    <option value={3}>3 - Có thể xảy ra</option>
                    <option value={4}>4 - Thường xuyên</option>
                    <option value={5}>5 - Rất thường xuyên</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Mức nghiêm trọng (1-5)</label>
                  <select
                    value={jsaForm.severityScore}
                    onChange={e => setJsaForm({ ...jsaForm, severityScore: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono font-bold"
                  >
                    <option value={1}>1 - Nhẹ / Không đáng kể</option>
                    <option value={2}>2 - Nhẹ / Sơ cứu</option>
                    <option value={3}>3 - Trung bình / Điều trị y tế</option>
                    <option value={4}>4 - Nặng / Mất ngày công</option>
                    <option value={5}>5 - Cực kỳ nghiêm trọng / Tử vong</option>
                  </select>
                </div>
                <div className="col-span-2 text-right font-mono font-bold text-xs text-emerald-800 dark:text-emerald-400">
                  Điểm rủi ro dự kiến: {jsaForm.probabilityScore * jsaForm.severityScore} điểm
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Biện pháp kiểm soát & giảm thiểu *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mô tả rào chắn an toàn, trang bị PPE, khóa LOTO..."
                  value={jsaForm.controlMeasures}
                  onChange={e => setJsaForm({ ...jsaForm, controlMeasures: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsJsaModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Lưu Đánh giá JSA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Mở Phiếu CAPA Mới */}
      {isCapaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Mở Phiếu Hành động Khắc phục & Phòng ngừa (CAPA)
              </h3>
              <button onClick={() => setIsCapaModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCapa} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tiêu đề Hành động CAPA *</label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Lắp đặt gờ giảm tốc và biển cảnh báo góc ngoặt kho B"
                  value={capaForm.title}
                  onChange={e => setCapaForm({ ...capaForm, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Loại hành động</label>
                  <select
                    value={capaForm.actionType}
                    onChange={e => setCapaForm({ ...capaForm, actionType: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    <option value="CORRECTIVE">CORRECTIVE (Khắc phục vi phạm)</option>
                    <option value="PREVENTIVE">PREVENTIVE (Phòng ngừa rủi ro)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Hạn hoàn thành *</label>
                  <input
                    type="date"
                    required
                    value={capaForm.dueDate}
                    onChange={e => setCapaForm({ ...capaForm, dueDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tóm tắt nguyên nhân gốc rễ (Root Cause)</label>
                <input
                  type="text"
                  placeholder="Vd: Thiếu tầm nhìn góc ngoặt do xếp hàng cao quá quy định"
                  value={capaForm.rootCauseSummary}
                  onChange={e => setCapaForm({ ...capaForm, rootCauseSummary: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Kế hoạch chi tiết xử lý *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mô tả từng bước thi công, mua sắm thiết bị và kiểm tra lại..."
                  value={capaForm.actionPlan}
                  onChange={e => setCapaForm({ ...capaForm, actionPlan: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCapaModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Giao CAPA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Audit Checklist Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Thực hiện Audit An toàn & Kiểm định PCCC Hiện trường
              </h3>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAudit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tên đợt kiểm tra</label>
                  <input
                    type="text"
                    required
                    value={auditForm.title}
                    onChange={e => setAuditForm({ ...auditForm, title: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Địa điểm Kho bãi M18</label>
                  <select
                    value={auditForm.warehouseId}
                    onChange={e => setAuditForm({ ...auditForm, warehouseId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">Danh mục Tiêu chuẩn Kiểm tra (Checklist Items):</div>
                {auditForm.checklist.map((item, idx) => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                        {item.isMandatory && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">*Bắt buộc</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1">{item.text}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newCl = [...auditForm.checklist];
                          newCl[idx].status = 'PASS';
                          setAuditForm({ ...auditForm, checklist: newCl });
                        }}
                        className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                          item.status === 'PASS' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        PASS
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newCl = [...auditForm.checklist];
                          newCl[idx].status = 'FAIL';
                          setAuditForm({ ...auditForm, checklist: newCl });
                        }}
                        className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                          item.status === 'FAIL' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        FAIL
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-200">
                💡 <strong>Quy tắc Tự động:</strong> Nếu trong kho tồn tại thiết bị PCCC quá hạn kiểm định 6 tháng hoặc có tiêu chuẩn bắt buộc FAIL, biên bản audit sẽ tự động kết luận <strong>FAILED</strong> và tạo phiếu CAPA xử lý!
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Hoàn tất & Đánh giá Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Đăng ký Thiết bị PCCC Mới */}
      {isFireEqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                Đăng ký Thiết bị PCCC & Kiểm định
              </h3>
              <button onClick={() => setIsFireEqModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFireEq} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Mã Thiết bị *</label>
                  <input
                    type="text"
                    required
                    placeholder="FE-WH01-005"
                    value={fireEqForm.equipmentCode}
                    onChange={e => setFireEqForm({ ...fireEqForm, equipmentCode: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Chủng loại</label>
                  <select
                    value={fireEqForm.type}
                    onChange={e => setFireEqForm({ ...fireEqForm, type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    <option value="FIRE_EXTINGUISHER_ABC">Bình bột ABC</option>
                    <option value="FIRE_EXTINGUISHER_CO2">Bình khí CO2</option>
                    <option value="HYDRANT">Họng nước cứu hỏa</option>
                    <option value="SMOKE_DETECTOR">Đầu báo khói quang</option>
                    <option value="ALARM_PANEL">Tủ báo cháy trung tâm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tên Thiết bị *</label>
                <input
                  type="text"
                  required
                  placeholder="Bình chữa cháy bột ABC 8kg"
                  value={fireEqForm.name}
                  onChange={e => setFireEqForm({ ...fireEqForm, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kho bãi</label>
                  <select
                    value={fireEqForm.warehouseId}
                    onChange={e => setFireEqForm({ ...fireEqForm, warehouseId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Vị trí lắp đặt cụ thể *</label>
                  <input
                    type="text"
                    required
                    placeholder="Cột A-04 Cửa xuất kho"
                    value={fireEqForm.specificLocation}
                    onChange={e => setFireEqForm({ ...fireEqForm, specificLocation: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Ngày kiểm định gần nhất</label>
                  <input
                    type="date"
                    required
                    value={fireEqForm.lastInspectionDate}
                    onChange={e => setFireEqForm({ ...fireEqForm, lastInspectionDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Trọng lượng (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fireEqForm.weightKg}
                    onChange={e => setFireEqForm({ ...fireEqForm, weightKg: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFireEqModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Kiểm định & Gia hạn PCCC */}
      {isInspectEqModalOpen && selectedFireEqToInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Gia hạn Kiểm định: {selectedFireEqToInspect.equipmentCode}
              </h3>
              <button onClick={() => setIsInspectEqModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInspectFireEq} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Ngày thực hiện kiểm định</label>
                <input
                  type="date"
                  required
                  value={inspectEqForm.inspectionDate}
                  onChange={e => setInspectEqForm({ ...inspectEqForm, inspectionDate: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Trạng thái Áp lực / Bột</label>
                <select
                  value={inspectEqForm.pressureStatus}
                  onChange={e => setInspectEqForm({ ...inspectEqForm, pressureStatus: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                >
                  <option value="NORMAL">NORMAL (Áp lực chuẩn trong vạch xanh)</option>
                  <option value="LOW">LOW (Tụt áp - Cần nạp sạc lại)</option>
                  <option value="HIGH">HIGH (Áp suất cao bất thường)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Ghi chú kiểm định</label>
                <textarea
                  rows={2}
                  value={inspectEqForm.notes}
                  onChange={e => setInspectEqForm({ ...inspectEqForm, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300">
                ✓ Thiết bị sẽ được tự động cộng thêm <strong>6 tháng hạn kiểm định mới</strong>.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInspectEqModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Lưu & Gia hạn 6 tháng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7: Ghi nhận Quan trắc Môi trường Mới */}
      {isEnvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Ghi nhận Số liệu Quan trắc Môi trường ISO 14001
              </h3>
              <button onClick={() => setIsEnvModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEnvRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Loại quan trắc *</label>
                  <select
                    value={envForm.recordType}
                    onChange={e => setEnvForm({ ...envForm, recordType: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    <option value="WASTE_WATER">WASTE_WATER (Nước thải công nghiệp)</option>
                    <option value="EXHAUST_GAS">EXHAUST_GAS (Khí thải xưởng)</option>
                    <option value="HAZARDOUS_WASTE">HAZARDOUS_WASTE (Rác thải nguy hại)</option>
                    <option value="NOISE_LEVEL">NOISE_LEVEL (Tiếng ồn môi trường)</option>
                    <option value="ENERGY_USAGE">ENERGY_USAGE (Tiêu thụ năng lượng)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kho bãi M18</label>
                  <select
                    value={envForm.warehouseId}
                    onChange={e => setEnvForm({ ...envForm, warehouseId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tên Chỉ số Quan trắc *</label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Nồng độ COD / pH / Độ ồn xưởng A"
                  value={envForm.parameterName}
                  onChange={e => setEnvForm({ ...envForm, parameterName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Giá trị đo *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={envForm.measuredValue}
                    onChange={e => setEnvForm({ ...envForm, measuredValue: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Ngưỡng chuẩn QCVN *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={envForm.standardThreshold}
                    onChange={e => setEnvForm({ ...envForm, standardThreshold: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Đơn vị *</label>
                  <input
                    type="text"
                    required
                    value={envForm.unit}
                    onChange={e => setEnvForm({ ...envForm, unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Ghi chú & Phương pháp lấy mẫu</label>
                <textarea
                  rows={2}
                  value={envForm.notes}
                  onChange={e => setEnvForm({ ...envForm, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEnvModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Ghi nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 8: Giấy phép An toàn & LOTO */}
      {isPermitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Cấp Giấy phép Làm việc An toàn & Khóa LOTO
              </h3>
              <button onClick={() => setIsPermitModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePermit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Loại Giấy phép *</label>
                  <select
                    value={permitForm.permitType}
                    onChange={e => setPermitForm({ ...permitForm, permitType: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                  >
                    <option value="LOTO_ISOLATION">LOTO_ISOLATION (Khóa cách ly năng lượng)</option>
                    <option value="HOT_WORK">HOT_WORK (Hàn cắt sinh nhiệt)</option>
                    <option value="WORKING_AT_HEIGHT">WORKING_AT_HEIGHT (Làm việc trên cao)</option>
                    <option value="CONFINED_SPACE">CONFINED_SPACE (Không gian kín)</option>
                    <option value="CHEMICAL_HANDLING">CHEMICAL_HANDLING (Tiếp xúc hóa chất độc)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Mã Thẻ Khóa LOTO</label>
                  <input
                    type="text"
                    value={permitForm.lotoTagNumber}
                    onChange={e => setPermitForm({ ...permitForm, lotoTagNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tài sản / Máy móc M27 liên kết (Optional)</label>
                <select
                  value={permitForm.targetAssetId}
                  onChange={e => setPermitForm({ ...permitForm, targetAssetId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                >
                  <option value="">-- Không liên kết máy móc cố định --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Từ ngày</label>
                  <input
                    type="date"
                    required
                    value={permitForm.validFrom}
                    onChange={e => setPermitForm({ ...permitForm, validFrom: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Đến ngày</label>
                  <input
                    type="date"
                    required
                    value={permitForm.validTo}
                    onChange={e => setPermitForm({ ...permitForm, validTo: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Khu vực thao tác *</label>
                <input
                  type="text"
                  required
                  placeholder="Xưởng Cơ khí Chế tạo - Line CNC 1"
                  value={permitForm.areaLocation}
                  onChange={e => setPermitForm({ ...permitForm, areaLocation: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Nội dung công việc & Biện pháp an toàn *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mô tả chi tiết phương thức cách ly điện 3 pha và áp suất khí nén..."
                  value={permitForm.description}
                  onChange={e => setPermitForm({ ...permitForm, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPermitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Phê duyệt & Kích hoạt LOTO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Inspector Drawer */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Chi tiết Hồ sơ EHS ({selectedDetail.type})
                </div>
                <button onClick={() => setSelectedDetail(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedDetail.type === 'INCIDENT' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{selectedDetail.data.incidentNumber}</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-1">{selectedDetail.data.title}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-400 dark:text-slate-400">Phân loại:</span> <strong className="text-slate-800 dark:text-slate-200">{selectedDetail.data.incidentType}</strong></div>
                    <div><span className="text-slate-400 dark:text-slate-400">Severity:</span> <strong className="text-rose-600 dark:text-rose-400">{selectedDetail.data.severity}</strong></div>
                    <div><span className="text-slate-400 dark:text-slate-400">Địa điểm:</span> <strong className="text-slate-800 dark:text-slate-200">{selectedDetail.data.locationDetail || selectedDetail.data.warehouseName}</strong></div>
                    <div><span className="text-slate-400 dark:text-slate-400">Trạng thái:</span> <strong className="text-emerald-700 dark:text-emerald-400">{selectedDetail.data.status}</strong></div>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 block mb-1">Mô tả diễn biến:</span>
                    <p className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed">{selectedDetail.data.description}</p>
                  </div>
                </div>
              )}

              {selectedDetail.type === 'JSA' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{selectedDetail.data.assessmentCode}</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-1">{selectedDetail.data.jobTitle}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 font-medium">
                    Mức rủi ro: {selectedDetail.data.riskLevel} ({selectedDetail.data.riskScore} điểm)
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 block mb-1">Biện pháp kiểm soát:</span>
                    <p className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed">{selectedDetail.data.controlMeasures}</p>
                  </div>
                </div>
              )}

              {selectedDetail.type === 'AUDIT' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{selectedDetail.data.auditNumber}</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-1">{selectedDetail.data.title}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-400 dark:text-slate-400">Tỷ lệ đạt:</span> <strong className="text-emerald-700 dark:text-emerald-400">{selectedDetail.data.scorePercent}%</strong></div>
                    <div><span className="text-slate-400 dark:text-slate-400">Kết luận:</span> <strong className={selectedDetail.data.result === 'PASS' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{selectedDetail.data.result}</strong></div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDetail(null)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Component (Rule #19) */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
};
