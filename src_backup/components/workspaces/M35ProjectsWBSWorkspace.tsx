import React, { useState, useEffect, useRef } from 'react';
import { CurrencyInput } from '../common/CurrencyInput';
import { SelectedEntityContext } from '../../types';
import { downloadProjectReportPdf } from '../../utils/pdfExporter';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import {
  ProjectMaster,
  WbsNode,
  ResourceItem,
  TimesheetEntry,
  ProjectDocument,
  ProjectRiskItem,
  ProjectStatus,
  ProjectCategory,
  DependencyType,
} from '../../types/m35Types';
import {
  INITIAL_M35_PROJECTS,
  INITIAL_M35_WBS,
  INITIAL_M35_RESOURCES,
  INITIAL_M35_TIMESHEETS,
  INITIAL_M35_DOCUMENTS,
  INITIAL_M35_RISKS,
} from '../../data/m35SeedData';
import {
  Kanban,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  PieChart,
  Layers,
  Calendar,
  User,
  Building2,
  ChevronRight,
  ChevronDown,
  Download,
  BookOpen,
  BarChart3,
  ShieldAlert,
  ArrowRight,
  Zap,
  Briefcase,
  Sliders,
  Check,
  X,
  Edit2,
  Users,
  HardHat,
  Package,
  FileCheck,
  Award,
  Link,
  Target,
  FileSpreadsheet,
  Eye,
  UploadCloud,
  Paperclip,
  FileUp,
  Trash2,
} from 'lucide-react';

interface M35Props {
  onSelectEntity?: (entity: SelectedEntityContext) => void;
  onNotify?: any;
}

type TabType =
  | 'PORTFOLIO'
  | 'PLANNING'
  | 'WBS_TREE'
  | 'RESOURCES'
  | 'SCHEDULE_GANTT'
  | 'JOB_COSTING'
  | 'TIMESHEETS'
  | 'EVM_ENGINE'
  | 'DOCUMENTS'
  | 'REPORTS';

export const M35ProjectsWBSWorkspace: React.FC<M35Props> = ({
  onSelectEntity,
  onNotify,
}) => {
  // Master State
  const [projects, setProjects] = useState<ProjectMaster[]>(INITIAL_M35_PROJECTS);
  const [wbsNodes, setWbsNodes] = useState<WbsNode[]>(INITIAL_M35_WBS);
  const [resources, setResources] = useState<ResourceItem[]>(INITIAL_M35_RESOURCES);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(INITIAL_M35_TIMESHEETS);
  const [documents, setDocuments] = useState<ProjectDocument[]>(INITIAL_M35_DOCUMENTS);
  const [risks, setRisks] = useState<ProjectRiskItem[]>(INITIAL_M35_RISKS);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('PRJ-1');
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<TabType>('M35', 'PORTFOLIO');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals
  const [showCreateProjectModal, setShowCreateProjectModal] = useState<boolean>(false);
  const [showWbsModal, setShowWbsModal] = useState<boolean>(false);
  const [showTimesheetModal, setShowTimesheetModal] = useState<boolean>(false);
  const [showDocumentModal, setShowDocumentModal] = useState<boolean>(false);
  const [editingWbsNode, setEditingWbsNode] = useState<WbsNode | null>(null);

  // New Document Form State & File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const [newDocForm, setNewDocForm] = useState({
    name: '',
    category: 'DELIVERABLE' as ProjectDocument['category'],
    uploadedBy: 'Phan Hoàng Pixel (PM)',
    size: '4.2 MB',
    status: 'APPROVED' as ProjectDocument['status'],
  });

  // New Project Form State
  const [newProjectForm, setNewProjectForm] = useState({
    code: `PRJ-2026-00${projects.length + 1}`,
    name: '',
    category: 'ERP_IT' as ProjectCategory,
    client: '',
    manager: 'Nguyễn Văn An (PM Senior)',
    branch: 'BR_HO',
    businessUnit: 'Khối Công Nghệ Thông Tin',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    contractValueVND: 3500000000,
    budgetVND: 2500000000,
    description: '',
    charterObjective: '',
    scopeSummary: '',
  });

  // New Timesheet Form State
  const [newTimesheetForm, setNewTimesheetForm] = useState({
    employeeName: 'Phan Hoàng Pixel',
    wbsCode: '2.2',
    wbsTaskName: 'Xây dựng Module M35 Projects & WBS',
    date: new Date().toISOString().slice(0, 10),
    hoursLogged: 8,
    hourlyRateVND: 280000,
    notes: 'Tiếp tục phát triển các màn hình Job Costing & Timesheet ERP',
  });

  // Load initial data from Backend API on mount
  useEffect(() => {
    const loadProjectsData = async () => {
      try {
        const [prjRes, resRes, docRes, riskRes] = await Promise.all([
          fetch('/api/projects').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/projects/resources').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/projects/documents').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/projects/risks').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        if (prjRes && Array.isArray(prjRes) && prjRes.length > 0) {
          setProjects(prjRes);
          if (!prjRes.some((p: ProjectMaster) => p.id === selectedProjectId)) {
            setSelectedProjectId(prjRes[0].id);
          }
        }
        if (resRes && Array.isArray(resRes) && resRes.length > 0) setResources(resRes);
        if (docRes && Array.isArray(docRes) && docRes.length > 0) setDocuments(docRes);
        if (riskRes && Array.isArray(riskRes) && riskRes.length > 0) setRisks(riskRes);
      } catch (err) {
        console.warn('Could not fetch projects API data, keeping seed fallback:', err);
      }
    };

    loadProjectsData();
  }, []);

  // Active Selected Project
  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Project WBS Tasks
  const projectWbsNodes = wbsNodes.filter((w) => w.projectId === currentProject?.id);

  // Dynamic Financials & EVM Engine Metrics
  const totalContractValue = currentProject?.contractValueVND || 0;
  const bac = currentProject?.budgetVND || 0;
  const actualCost = currentProject?.actualCostVND || 0;
  const committedCost = currentProject?.committedCostVND || 0;
  const progressPct = currentProject?.progressPct || 0;

  // EVM Formula Outputs
  const ev = Math.round(bac * (progressPct / 100)); // Earned Value
  const pv = Math.round(bac * 0.70); // Planned Value baseline (70% target)
  const cv = ev - actualCost; // Cost Variance
  const sv = ev - pv; // Schedule Variance
  const cpi = actualCost > 0 ? ev / actualCost : 1; // CPI
  const spi = pv > 0 ? ev / pv : 1; // SPI
  const eac = cpi > 0 ? Math.round(bac / cpi) : bac; // Estimate at Completion
  const vac = bac - eac; // Variance at Completion

  // Job Costing Profitability
  const totalCost = actualCost + committedCost;
  const estimatedGrossProfit = totalContractValue - (actualCost > 0 ? actualCost : bac);
  const grossMarginPct = totalContractValue > 0 ? ((estimatedGrossProfit / totalContractValue) * 100) : 0;

  // Filtered Projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      (p.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.manager || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.name) {
      if (onNotify) onNotify('Vui lòng nhập tên dự án!', 'warning');
      return;
    }

    const newPrj: ProjectMaster = {
      id: `PRJ-${projects.length + 1}`,
      code: newProjectForm.code,
      name: newProjectForm.name,
      category: newProjectForm.category,
      client: newProjectForm.client || 'Khách hàng Nội bộ',
      manager: newProjectForm.manager || 'Nguyễn Văn An',
      branch: newProjectForm.branch,
      startDate: newProjectForm.startDate,
      endDate: newProjectForm.endDate,
      status: 'PLANNED',
      currency: 'VND',
      contractNumber: `HD-2026/NEXUS-${newProjectForm.code}`,
      businessUnit: newProjectForm.businessUnit,
      contractValueVND: newProjectForm.contractValueVND,
      budgetVND: newProjectForm.budgetVND,
      committedCostVND: 0,
      actualCostVND: 0,
      progressPct: 0,
      laborCostVND: 0,
      materialCostVND: 0,
      equipmentCostVND: 0,
      externalServiceCostVND: 0,
      overheadCostVND: 0,
      riskLevel: 'LOW',
      description: newProjectForm.description || 'Dự án mới tạo',
      charterObjective: newProjectForm.charterObjective || 'Số hóa & hoàn thành mục tiêu kinh doanh',
      scopeSummary: newProjectForm.scopeSummary || 'Phạm vi theo hợp đồng',
    };

    setProjects([newPrj, ...projects]);
    setSelectedProjectId(newPrj.id);
    setShowCreateProjectModal(false);

    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProjectForm),
      });
    } catch (err) {
      console.warn('Sync new project to server fallback:', err);
    }

    if (onNotify) onNotify(`Đã tạo dự án mới [${newPrj.code}] thành công!`, 'success');
  };

  const handleUpdateProjectStatus = async (newStatus: ProjectStatus) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === currentProject.id ? { ...p, status: newStatus } : p))
    );

    try {
      await fetch(`/api/projects/${currentProject.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.warn('Sync project status to server fallback:', err);
    }

    if (onNotify) onNotify(`Đã chuyển trạng thái dự án [${currentProject.code}] sang ${newStatus}!`, 'info');
  };

  const handleSaveWbsNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWbsNode) return;

    const existingIndex = wbsNodes.findIndex((w) => w.id === editingWbsNode.id);
    let updated: WbsNode[];
    if (existingIndex >= 0) {
      updated = wbsNodes.map((w) => (w.id === editingWbsNode.id ? editingWbsNode : w));
    } else {
      updated = [...wbsNodes, editingWbsNode];
    }

    setWbsNodes(updated);

    // Recalculate Project Overall Progress
    const pNodes = updated.filter((w) => w.projectId === editingWbsNode.projectId);
    const avgProgress =
      pNodes.length > 0 ? Math.round(pNodes.reduce((acc, curr) => acc + curr.progressPct, 0) / pNodes.length) : 0;
    const totalActual = pNodes.reduce((acc, curr) => acc + curr.actualCostVND, 0);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === editingWbsNode.projectId
          ? { ...p, progressPct: avgProgress, actualCostVND: totalActual }
          : p
      )
    );

    setShowWbsModal(false);
    const savedNode = editingWbsNode;
    setEditingWbsNode(null);

    try {
      await fetch(`/api/projects/${savedNode.projectId}/wbs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedNode),
      });
    } catch (err) {
      console.warn('Sync WBS node to server fallback:', err);
    }

    if (onNotify) onNotify(`Đã lưu tác vụ WBS [${savedNode.code}]!`, 'success');
  };

  const handleAddTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    const laborCost = newTimesheetForm.hoursLogged * newTimesheetForm.hourlyRateVND;
    const newTs: TimesheetEntry = {
      id: `TS-${Date.now()}`,
      projectId: currentProject.id,
      employeeName: newTimesheetForm.employeeName,
      wbsCode: newTimesheetForm.wbsCode,
      wbsTaskName: newTimesheetForm.wbsTaskName,
      date: newTimesheetForm.date,
      hoursLogged: newTimesheetForm.hoursLogged,
      hourlyRateVND: newTimesheetForm.hourlyRateVND,
      laborCostVND: laborCost,
      notes: newTimesheetForm.notes,
      status: 'APPROVED',
    };

    setTimesheets([newTs, ...timesheets]);

    // Update Project Labor Cost & Actual Cost
    setProjects((prev) =>
      prev.map((p) =>
        p.id === currentProject.id
          ? {
              ...p,
              laborCostVND: p.laborCostVND + laborCost,
              actualCostVND: p.actualCostVND + laborCost,
            }
          : p
      )
    );

    setShowTimesheetModal(false);

    try {
      await fetch(`/api/projects/${currentProject.id}/timesheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTimesheetForm),
      });
    } catch (err) {
      console.warn('Sync timesheet to server fallback:', err);
    }

    if (onNotify) onNotify(`Đã ghi nhận ${newTimesheetForm.hoursLogged} giờ làm việc cho ${newTimesheetForm.employeeName}!`, 'success');
  };

  // File Upload Handlers for Document Management
  const processSelectedFile = (file: File) => {
    setUploadedFileName(file.name);

    // Format readable size
    let formattedSize = '1.0 MB';
    if (file.size < 1024 * 1024) {
      formattedSize = `${Math.max(1, Math.round(file.size / 1024))} KB`;
    } else {
      formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Auto-detect category based on filename keywords
    const lowerName = file.name.toLowerCase();
    let detectedCat: ProjectDocument['category'] = 'DELIVERABLE';
    if (lowerName.includes('contract') || lowerName.includes('hop_dong') || lowerName.includes('phu_luc')) {
      detectedCat = 'CONTRACT';
    } else if (lowerName.includes('charter') || lowerName.includes('dieu_le') || lowerName.includes('quyet_dinh')) {
      detectedCat = 'CHARTER';
    } else if (lowerName.includes('spec') || lowerName.includes('thiet_ke') || lowerName.includes('drawing') || lowerName.endsWith('.dwg')) {
      detectedCat = 'DESIGN_SPEC';
    } else if (lowerName.includes('uat') || lowerName.includes('test') || lowerName.includes('kiem_thu') || lowerName.includes('qa')) {
      detectedCat = 'UAT_REPORT';
    }

    setNewDocForm((prev) => ({
      ...prev,
      name: file.name,
      size: formattedSize,
      category: detectedCat,
    }));

    if (onNotify) {
      onNotify(`Đã nhận tệp: "${file.name}" (${formattedSize}) từ máy tính!`, 'info');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearSelectedFile = () => {
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setNewDocForm((prev) => ({
      ...prev,
      name: '',
      size: '4.2 MB',
    }));
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocForm.name) {
      if (onNotify) onNotify('Vui lòng chọn tệp từ máy tính hoặc nhập tên tài liệu!', 'warning');
      return;
    }

    const docCode = `DOC-${newDocForm.category.slice(0, 4)}-${String(documents.length + 1).padStart(2, '0')}`;
    const newDoc: ProjectDocument = {
      id: `DOC-${Date.now()}`,
      projectId: currentProject.id,
      code: docCode,
      name: newDocForm.name,
      category: newDocForm.category,
      uploadedBy: newDocForm.uploadedBy,
      uploadDate: new Date().toISOString().slice(0, 10),
      size: newDocForm.size,
      status: newDocForm.status,
    };

    setDocuments([newDoc, ...documents]);
    setShowDocumentModal(false);
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setNewDocForm({
      name: '',
      category: 'DELIVERABLE',
      uploadedBy: 'Phan Hoàng Pixel (PM)',
      size: '4.2 MB',
      status: 'APPROVED',
    });

    try {
      await fetch('/api/projects/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc),
      });
    } catch (err) {
      console.warn('Sync document to server fallback:', err);
    }

    if (onNotify) onNotify(`Đã tải lên và lưu trữ hồ sơ [${newDoc.name}] thành công!`, 'success');
  };

  const handleUpdateDocStatus = async (docId: string, newStatus: ProjectDocument['status']) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
    );

    try {
      await fetch(`/api/projects/documents/${docId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.warn('Sync doc status to server fallback:', err);
    }

    if (onNotify) onNotify(`Đã cập nhật trạng thái tài liệu sang ${newStatus}!`, 'info');
  };

  const handleExportPdf = () => {
    try {
      const fileName = downloadProjectReportPdf(currentProject, projectWbsNodes);
      if (onNotify) onNotify(`Đã xuất Báo Cáo Dự Án & EVM [${currentProject.code}] (${fileName})!`, 'success');
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('Lỗi xuất file PDF báo cáo dự án', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Control Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border border-indigo-900/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              MODULE M35 • PROJECT & SERVICE MANAGEMENT
            </span>
            <span className="text-[11px] text-slate-300 font-mono">Projects, WBS & Job Costing Engine</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Kanban className="w-5 h-5 text-indigo-400" />
            <span>Quản Lý Dự Án, Cấu Trúc WBS & Quản Trị EVM / Job Costing</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl">
            Tổ chức dự án theo 10 phân hệ chuẩn mực: Khởi tạo Project Portfolio &rarr; Charter & Planning &rarr; WBS Tree 4 Cấp &rarr; Nguồn Lực & Timesheet &rarr; Lịch Thi Công Gantt &rarr; Job Costing & EVM Engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateProjectModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Dự Án Mới</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Key Performance Indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Contract Value & Gross Margin */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Giá Trị Hợp Đồng (Doanh Thu)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-mono font-bold text-slate-900">
            {totalContractValue.toLocaleString('vi-VN')} VNĐ
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Lợi Nhuận Gộp (Margin):</span>
            <span className="font-bold text-emerald-600">{grossMarginPct.toFixed(1)}% ({estimatedGrossProfit.toLocaleString('vi-VN')} VNĐ)</span>
          </div>
        </div>

        {/* Budget at Completion (BAC) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Ngân Sách Gốc (BAC)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-mono font-bold text-slate-900">
            {bac.toLocaleString('vi-VN')} VNĐ
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Cam kết (PO/PR):</span>
            <span className="font-mono font-bold text-slate-700">{committedCost.toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>

        {/* Earned Value (EV) & Progress */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Giá Trị Thu Được (EV)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-mono font-bold text-emerald-700">
            {ev.toLocaleString('vi-VN')} VNĐ
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Tiến độ thực tế:</span>
            <span className="font-bold text-indigo-600">{progressPct}% Complete</span>
          </div>
        </div>

        {/* Actual Cost (AC) & CPI */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Chi Phí Thực Tế (AC)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-mono font-bold text-slate-900">
            {actualCost.toLocaleString('vi-VN')} VNĐ
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Chỉ số CPI:</span>
            <span className={`font-mono font-bold ${cpi >= 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {cpi.toFixed(2)} ({cpi >= 1 ? 'Tiết kiệm' : 'Vượt NS'})
            </span>
          </div>
        </div>

        {/* Schedule SPI & EAC Forecast */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Dự Báo Ngân Sách (EAC)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-mono font-bold text-slate-900">
            {eac.toLocaleString('vi-VN')} VNĐ
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Chỉ số SPI:</span>
            <span className={`font-mono font-bold ${spi >= 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {spi.toFixed(2)} ({spi >= 1 ? 'Đúng hạn' : 'Chậm hạn'})
            </span>
          </div>
        </div>
      </div>

      {/* 3. Project Selector & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Chọn Dự Án:</span>
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedProjectId(p.id);
                  if (onSelectEntity) {
                    onSelectEntity({
                      type: 'M35',
                      id: p.id,
                      code: p.code,
                      title: p.name,
                      status: p.status,
                      lineage: [
                        { id: `prj-${p.id}`, type: 'Dự án M35', code: p.code, relation: 'PROJECT_MASTER', status: p.status },
                        { id: `gl-${p.id}`, type: 'Ngân sách GL', code: `GL-${p.code}`, relation: 'BUDGET_LINE', status: 'BALANCED' },
                      ],
                    });
                  }
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer ${
                  selectedProjectId === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.code} — {p.name.length > 22 ? `${p.name.slice(0, 22)}...` : p.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã, tên dự án, PM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* ================= TẦNG L1: SUB-TABS NAVIGATION BAR (M41 MASTER SPEC) ================= */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('PORTFOLIO')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'PORTFOLIO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>01. Portfolio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PLANNING')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'PLANNING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 shrink-0" />
              <span>02. Planning</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('WBS_TREE')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'WBS_TREE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>03. Cây WBS</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'WBS_TREE' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {projectWbsNodes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RESOURCES')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'RESOURCES'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>04. Nguồn Lực</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SCHEDULE_GANTT')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'SCHEDULE_GANTT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>05. Tiến Độ Gantt</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('JOB_COSTING')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'JOB_COSTING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>06. Chi Phí Job</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TIMESHEETS')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'TIMESHEETS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>07. Timesheets</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'TIMESHEETS' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {timesheets.filter((t) => t.projectId === currentProject?.id).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('EVM_ENGINE')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'EVM_ENGINE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>08. EVM Engine</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DOCUMENTS')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'DOCUMENTS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>09. Tài Liệu</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'DOCUMENTS' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {documents.filter((d) => d.projectId === currentProject?.id).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REPORTS')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'REPORTS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>10. Báo Cáo</span>
            </button>
          </div>

          <div className="hidden 2xl:flex items-center gap-3 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold shrink-0 border-l border-slate-200 dark:border-slate-700 pl-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PMBOK &amp; EVM Standards</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              WBS Engine v2
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tab Views Content */}

      {/* TAB 01: PORTFOLIO MANAGEMENT */}
      {activeTab === 'PORTFOLIO' && (
        <div className="space-y-6">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-indigo-600 uppercase tracking-wider">01. PROJECT PORTFOLIO & STATUS LIFECYCLE</span>
                <h3 className="text-base font-bold text-slate-900">{currentProject?.code} — {currentProject?.name}</h3>
                <p className="text-xs text-slate-500">{currentProject?.description}</p>
              </div>

              {/* Status Change Lifecycle Controls */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 mr-1">Trạng thái:</span>
                {(['DRAFT', 'PLANNED', 'APPROVED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED'] as ProjectStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateProjectStatus(st)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                      currentProject?.status === st
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 block font-semibold">Khách Hàng / Đối Tác:</span>
                <span className="font-bold text-slate-900 text-sm">{currentProject?.client}</span>
                <span className="text-[11px] text-slate-400 block pt-1">Số HĐ: {currentProject?.contractNumber}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 block font-semibold">Khối Nghiệp Vụ / BU:</span>
                <span className="font-bold text-slate-900 text-sm">{currentProject?.businessUnit}</span>
                <span className="text-[11px] text-slate-400 block pt-1">PM: {currentProject?.manager}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 block font-semibold">Thời Gian Thực Hiện:</span>
                <span className="font-bold text-slate-900 text-sm">{currentProject?.startDate} &rarr; {currentProject?.endDate}</span>
                <span className="text-[11px] text-slate-400 block pt-1">Chi nhánh: {currentProject?.branch}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 block font-semibold">Phân Loại Dự Án:</span>
                <span className="font-bold text-indigo-700 text-sm">{currentProject?.category}</span>
                <span className="text-[11px] text-slate-400 block pt-1">Rủi ro: RỦI RO {currentProject?.riskLevel}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Tiến Độ Thi Công Tổng Thể Dự Án:</span>
                <span className="font-mono font-bold text-indigo-700">{progressPct}% Hoàn Thành</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Portfolio Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Danh Sách Portfolio Dự Án Tập Đoàn ({filteredProjects.length})
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Mã Dự Án</th>
                    <th className="py-2.5 px-3">Tên Dự Án</th>
                    <th className="py-2.5 px-3">Khách Hàng</th>
                    <th className="py-2.5 px-3">PM Phụ Trách</th>
                    <th className="py-2.5 px-3 text-right">Giá Trị HĐ (VND)</th>
                    <th className="py-2.5 px-3 text-right">Ngân Sách (BAC)</th>
                    <th className="py-2.5 px-3 text-center">Tiến Độ</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProjects.map((prj) => (
                    <tr
                      key={prj.id}
                      onClick={() => setSelectedProjectId(prj.id)}
                      className={`hover:bg-indigo-50/40 transition cursor-pointer ${
                        selectedProjectId === prj.id ? 'bg-indigo-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{prj.code}</td>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">{prj.name}</td>
                      <td className="py-2.5 px-3 text-slate-700">{prj.client}</td>
                      <td className="py-2.5 px-3 text-slate-700">{prj.manager}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-bold">{prj.contractValueVND.toLocaleString('vi-VN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-bold">{prj.budgetVND.toLocaleString('vi-VN')}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prj.progressPct}%` }} />
                          </div>
                          <span className="font-mono text-[10px]">{prj.progressPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                          {prj.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 02: PLANNING & CHARTER */}
      {activeTab === 'PLANNING' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600" />
                02. Project Charter, Scope & Baseline Objectives
              </h3>
              <p className="text-xs text-slate-500">Dự án: {currentProject?.code} — {currentProject?.name}</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200">
              Mã HĐ: {currentProject?.contractNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-500" />
                Mục Tiêu Chiến Lược (Project Objectives)
              </h4>
              <p className="text-slate-700 leading-relaxed font-medium">{currentProject?.charterObjective}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4 text-indigo-600" />
                Tóm Tắt Phạm Vi (Project Scope Summary)
              </h4>
              <p className="text-slate-700 leading-relaxed font-medium">{currentProject?.scopeSummary}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Các Mốc Nghiệm Thu Quan Trọng (Project Baseline Milestones)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-600 block">MILESTONE M1</span>
                <span className="font-bold text-slate-900 text-xs block">Phê Duyệt Blueprint & Charter</span>
                <span className="text-[11px] text-emerald-600 font-bold block">✓ Đã Phê Duyệt (15/03/2026)</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-600 block">MILESTONE M2</span>
                <span className="font-bold text-slate-900 text-xs block">Hoàn Thành Lập Trình Core</span>
                <span className="text-[11px] text-amber-600 font-bold block">⏳ Đang Thi Công (Target 31/07)</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-600 block">MILESTONE M3</span>
                <span className="font-bold text-slate-900 text-xs block">Nghiệm Thu UAT & Go-Live</span>
                <span className="text-[11px] text-slate-500 block">Chờ nghiệm thu (Target 30/10)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 03: WBS TREE HIERARCHY */}
      {activeTab === 'WBS_TREE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                03. Cấu Trúc Phân Chia Công Việc 4 Cấp (WBS Hierarchy: Phase &rarr; Work Package &rarr; Task)
              </h3>
              <p className="text-xs text-slate-500">Dự án: {currentProject?.code} — {currentProject?.name}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingWbsNode({
                  id: `WBS-${Date.now()}`,
                  projectId: currentProject.id,
                  code: `${projectWbsNodes.length + 1}.0`,
                  name: 'Tác vụ WBS mới',
                  level: 1,
                  assignee: 'Nguyễn Văn An',
                  startDate: currentProject.startDate,
                  endDate: currentProject.endDate,
                  durationDays: 30,
                  plannedCostVND: 500000000,
                  actualCostVND: 0,
                  progressPct: 0,
                  status: 'NOT_STARTED',
                  deliverable: 'Báo cáo nghiệm thu',
                  dependencyType: 'FS',
                });
                setShowWbsModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Hạng Mục WBS</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Mã WBS</th>
                  <th className="py-2.5 px-3">Tên Hạng Mục Công Việc</th>
                  <th className="py-2.5 px-3">Phụ Trách</th>
                  <th className="py-2.5 px-3">Thời Gian</th>
                  <th className="py-2.5 px-3">Phụ Thuộc</th>
                  <th className="py-2.5 px-3 text-right">Chi Phí KH (VND)</th>
                  <th className="py-2.5 px-3 text-right">Chi Phí TT (VND)</th>
                  <th className="py-2.5 px-3 text-center">Tiến Độ</th>
                  <th className="py-2.5 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projectWbsNodes.map((w) => (
                  <tr
                    key={w.id}
                    className={`hover:bg-slate-50 transition ${
                      w.level === 1 ? 'bg-indigo-50/20 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                      {w.level === 2 ? '  └ ' : w.level === 3 ? '    └── ' : ''}{w.code}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 font-medium">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {w.isCriticalPath && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-bold rounded">
                              CRITICAL PATH
                            </span>
                          )}
                          <span>{w.name}</span>
                        </div>
                        {w.deliverable && (
                          <span className="text-[10px] text-slate-400 block">Sản phẩm: {w.deliverable}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{w.assignee}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {w.startDate} &rarr; {w.endDate} ({w.durationDays} ngày)
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-600">
                      {w.dependencyCode ? `${w.dependencyCode} (${w.dependencyType || 'FS'})` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {w.plannedCostVND.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                      {w.actualCostVND.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${w.progressPct}%` }} />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-700">{w.progressPct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWbsNode(w);
                          setShowWbsModal(true);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded border border-slate-300 transition cursor-pointer"
                      >
                        Cập Nhật
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 04: RESOURCE MANAGEMENT */}
      {activeTab === 'RESOURCES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                04. Resource Allocation & Capacity Utilization (Con Người, Thiết Bị & Vật Tư)
              </h3>
              <p className="text-xs text-slate-500">Phân bổ nguồn lực thi công & định mức đơn giá giờ/ngày</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((res) => {
              const utilPct = Math.round((res.allocatedHours / res.capacityHours) * 100);
              return (
                <div key={res.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{res.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      res.type === 'PEOPLE'
                        ? 'bg-blue-100 text-blue-800'
                        : res.type === 'EQUIPMENT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {res.type}
                    </span>
                  </div>
                  <p className="text-slate-500">{res.role}</p>
                  <div className="pt-2 border-t border-slate-200 font-mono space-y-1">
                    <div className="flex justify-between">
                      <span>Đơn giá định mức:</span>
                      <span className="font-bold text-slate-800">{res.unitRateVND.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Giờ phân bổ:</span>
                      <span className="font-bold text-indigo-700">{res.allocatedHours}h / {res.capacityHours}h</span>
                    </div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Công suất:</span>
                      <span className="font-bold">{utilPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${utilPct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 05: SCHEDULE & GANTT */}
      {activeTab === 'SCHEDULE_GANTT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                05. Sơ Đồ Tiến Độ Gantt & Đường Găng (Critical Path Timeline)
              </h3>
              <p className="text-xs text-slate-500">Mô phỏng thời gian thi công thực tế & mối phụ thuộc FS/SS/FF/SF</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block shrink-0" />
                <span>Tiến độ WBS</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
                <span>Đường găng (Critical Path)</span>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {projectWbsNodes.map((w) => (
              <div key={w.id} className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold font-mono text-indigo-700">{w.code} — {w.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {w.startDate} &rarr; {w.endDate} ({w.progressPct}%)
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-200 rounded-lg overflow-hidden relative p-0.5">
                  <div
                    className={`h-full rounded-md transition-all duration-500 ${
                      w.isCriticalPath ? 'bg-gradient-to-r from-rose-500 to-indigo-600' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.max(w.progressPct, 5)}%` }}
                  >
                    <span className="text-[9px] font-mono font-bold text-white px-1 block text-right">
                      {w.progressPct}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 06: BUDGET & JOB COSTING */}
      {activeTab === 'JOB_COSTING' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                06. Job Costing & Project Profitability Analysis
              </h3>
              <p className="text-xs text-slate-500">Báo cáo bóc tách chi phí 5 cấu phần & Lợi nhuận gộp dự án</p>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Lợi Nhuận Gộp Ước Tính: {estimatedGrossProfit.toLocaleString('vi-VN')} VNĐ ({grossMarginPct.toFixed(1)}%)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold font-sans text-slate-800 text-sm block">Bóc Tách Chi Phí Thực Tế (Job Cost Breakdown)</span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">1. Chi phí nhân công (Labor Cost):</span>
                <span className="font-bold text-slate-900">{currentProject.laborCostVND.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">2. Chi phí vật tư (Material Cost):</span>
                <span className="font-bold text-slate-900">{currentProject.materialCostVND.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">3. Chi phí máy móc (Equipment Cost):</span>
                <span className="font-bold text-slate-900">{currentProject.equipmentCostVND.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">4. Thầu phụ & Dịch vụ ngoài (External):</span>
                <span className="font-bold text-slate-900">{currentProject.externalServiceCostVND.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">5. Chi phí quản lý chung (Overhead):</span>
                <span className="font-bold text-slate-900">{currentProject.overheadCostVND.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold font-sans text-slate-800 text-sm block">Đối Soát Ngân Sách & Cam Kết (Budget Variance)</span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Tổng Ngân Sách Gốc (BAC):</span>
                <span className="font-bold text-indigo-700">{bac.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Chi phí đã cam kết (Committed PO):</span>
                <span className="font-bold text-amber-700">{committedCost.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Chi phí thực tế xuất quỹ (AC):</span>
                <span className="font-bold text-slate-900">{actualCost.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Ngân sách còn lại (Remaining):</span>
                <span className="font-bold text-emerald-700">{(bac - actualCost).toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 07: TIMESHEETS & EXECUTION */}
      {activeTab === 'TIMESHEETS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                07. Daily Employee Timesheet Logging & Labor Job Costing
              </h3>
              <p className="text-xs text-slate-500">Chấm công dự án thời gian thực tự động hạch toán Chi phí Nhân công (Labor Cost)</p>
            </div>

            <button
              type="button"
              onClick={() => setShowTimesheetModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ghi Nhân Giờ Làm (Timesheet)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Ngày</th>
                  <th className="py-2.5 px-3">Nhân Viên</th>
                  <th className="py-2.5 px-3">Mã WBS & Task</th>
                  <th className="py-2.5 px-3 text-center">Số Giờ (Hours)</th>
                  <th className="py-2.5 px-3 text-right">Đơn Giá Giờ (VNĐ)</th>
                  <th className="py-2.5 px-3 text-right">Chi Phí Nhân Công (VNĐ)</th>
                  <th className="py-2.5 px-3">Ghi Chú Công Việc</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {timesheets
                  .filter((t) => t.projectId === currentProject?.id)
                  .map((ts) => (
                    <tr key={ts.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-600">{ts.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{ts.employeeName}</td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="font-mono font-bold text-indigo-700 mr-1.5">[{ts.wbsCode}]</span>
                        {ts.wbsTaskName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums font-semibold text-slate-800">{ts.hoursLogged}h</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-slate-600">{ts.hourlyRateVND.toLocaleString('vi-VN')}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-indigo-700">{ts.laborCostVND.toLocaleString('vi-VN')}</td>
                      <td className="py-2.5 px-3 text-slate-600">{ts.notes}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {ts.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 08: EVM ENGINE */}
      {activeTab === 'EVM_ENGINE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              08. Earned Value Management Metric Engine (ISO 21508 Standard)
            </h3>
            <p className="text-xs text-slate-500">Đo lường chỉ số EVM trên hệ thống NexusSync ERP Engine</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <span className="font-bold font-sans text-slate-800 text-sm block">1. Chỉ Số Lõi EVM Metrics</span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Ngân sách gốc (BAC):</span>
                <span className="font-bold text-slate-900">{bac.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Giá trị kế hoạch (PV):</span>
                <span className="font-bold text-slate-900">{pv.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Giá trị thu được (EV):</span>
                <span className="font-bold text-emerald-700">{ev.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Chi phí thực tế (AC):</span>
                <span className="font-bold text-slate-900">{actualCost.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <span className="font-bold font-sans text-slate-800 text-sm block">2. Chỉ Số Hiệu Suất & Dự Báo (Performance Indexes)</span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Chỉ số chi phí CPI (EV/AC):</span>
                <span className={`font-bold ${cpi >= 1 ? 'text-emerald-700' : 'text-rose-600'}`}>{cpi.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Chỉ số tiến độ SPI (EV/PV):</span>
                <span className={`font-bold ${spi >= 1 ? 'text-emerald-700' : 'text-rose-600'}`}>{spi.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Dự báo EAC (BAC/CPI):</span>
                <span className="font-bold text-indigo-700">{eac.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Chênh lệch hoàn thành (VAC):</span>
                <span className={`font-bold ${vac >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{vac.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 09: DOCUMENTS & ATTACHMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                09. Project Documents, Contracts & Deliverable Records
              </h3>
              <p className="text-xs text-slate-500">Quản lý hồ sơ pháp lý, hợp đồng kinh tế, bản vẽ thiết kế kỹ thuật, biên bản UAT & sản phẩm nghiệm thu</p>
            </div>
            <button
              type="button"
              onClick={() => setShowDocumentModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm / Tải Lên Tài Liệu</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">Tổng Hồ Sơ Dự Án</span>
              <span className="text-lg font-bold text-slate-900">
                {documents.filter((d) => d.projectId === currentProject?.id).length} TÀI LIỆU
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">Hợp Đồng & Pháp Lý</span>
              <span className="text-lg font-bold text-indigo-700">
                {documents.filter((d) => d.projectId === currentProject?.id && (d.category === 'CONTRACT' || d.category === 'CHARTER')).length} HỒ SƠ
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">Thiết Kế & UAT Specs</span>
              <span className="text-lg font-bold text-purple-700">
                {documents.filter((d) => d.projectId === currentProject?.id && (d.category === 'DESIGN_SPEC' || d.category === 'UAT_REPORT')).length} BẢN VẼ/UAT
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">Sản Phẩm Nghiệm Thu</span>
              <span className="text-lg font-bold text-emerald-700">
                {documents.filter((d) => d.projectId === currentProject?.id && d.category === 'DELIVERABLE').length} DELIVERABLES
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {documents.filter((d) => d.projectId === currentProject?.id).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                Chưa có tài liệu nào được đính kèm cho dự án [{currentProject?.code}]. Nhấp &quot;Thêm / Tải Lên Tài Liệu&quot; để tạo mới.
              </div>
            ) : (
              documents
                .filter((d) => d.projectId === currentProject?.id)
                .map((doc) => {
                  const getCategoryBadge = (cat: ProjectDocument['category']) => {
                    switch (cat) {
                      case 'CHARTER':
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">CHARTER</span>;
                      case 'CONTRACT':
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">CONTRACT</span>;
                      case 'DESIGN_SPEC':
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">DESIGN SPEC</span>;
                      case 'UAT_REPORT':
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">UAT REPORT</span>;
                      case 'DELIVERABLE':
                      default:
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">DELIVERABLE</span>;
                    }
                  };

                  return (
                    <div key={doc.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 transition rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-2xs">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{doc.name}</span>
                            {getCategoryBadge(doc.category)}
                          </div>
                          <span className="text-slate-400 text-[11px] font-mono block mt-0.5">
                            Mã: <strong className="text-slate-600">{doc.code}</strong> • Kích thước: {doc.size} • Người tạo: {doc.uploadedBy} • Ngày: {doc.uploadDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <select
                          value={doc.status}
                          onChange={(e) => handleUpdateDocStatus(doc.id, e.target.value as ProjectDocument['status'])}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer outline-hidden transition ${
                            doc.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : doc.status === 'ARCHIVED'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="REVIEW">REVIEW</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            if (onNotify) onNotify(`Mở xem trước tài liệu [${doc.name}]...`, 'info');
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Xem</span>
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* TAB 10: REPORTS & PROFITABILITY ANALYTICS */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                10. Total Project Profitability & Performance Report
              </h3>
              <p className="text-xs text-slate-500">Báo cáo tổng hợp hiệu quả tài chính & tiến độ dự án NexusSync ERP</p>
            </div>
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Báo Cáo PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold font-sans text-slate-800 text-sm block">Hiệu Số Doanh Thu & Lợi Nhuận</span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Doanh Thu Hợp Đồng:</span>
                <span className="font-bold text-slate-900">{totalContractValue.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Tổng Chi Phí Dự Ước:</span>
                <span className="font-bold text-slate-900">{actualCost.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Lợi Nhuận Gộp (Gross Profit):</span>
                <span className="font-bold text-emerald-700">{estimatedGrossProfit.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold font-sans text-slate-800 text-sm block">Tỷ Suất Lợi Nhuận Gộp</span>
              <div className="text-2xl font-bold text-emerald-700 py-2">
                {grossMarginPct.toFixed(1)}% MARGIN
              </div>
              <p className="text-slate-500 font-sans text-[11px]">Đạt chỉ tiêu biên lợi nhuận &gt; 20% cho dự án B2B/EPC/IT.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold font-sans text-slate-800 text-sm block">Đánh Giá Tiến Độ & Rủi Ro</span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Tiến Độ Thực Tế:</span>
                <span className="font-bold text-indigo-700">{progressPct}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Cảnh Báo Rủi Ro:</span>
                <span className="font-bold text-amber-600">MỨC ĐỘ {currentProject.riskLevel}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW PROJECT */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                Khởi Tạo Dự Án Mới (Project Master)
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Dự Án *</label>
                  <input
                    type="text"
                    required
                    value={newProjectForm.code}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại Hình Dự Án</label>
                  <select
                    value={newProjectForm.category}
                    onChange={(e: any) => setNewProjectForm({ ...newProjectForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="ERP_IT">ERP / IT Software</option>
                    <option value="EPC_CONSTRUCTION">EPC Construction</option>
                    <option value="RD_INNOVATION">R&D Innovation</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Dự Án *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Triển khai Hệ thống ERP Phase 3"
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khách Hàng / Chủ Đầu Tư</label>
                  <input
                    type="text"
                    placeholder="Tập đoàn NexusSync"
                    value={newProjectForm.client}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, client: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PM Phụ Trách</label>
                  <input
                    type="text"
                    value={newProjectForm.manager}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CurrencyInput
                    label="Giá Trị Hợp Đồng (Doanh Thu VNĐ)"
                    value={newProjectForm.contractValueVND}
                    onChange={(val) => setNewProjectForm({ ...newProjectForm, contractValueVND: val })}
                    showBadge={true}
                    showPresets={true}
                  />
                </div>
                <div>
                  <CurrencyInput
                    label="Tổng Ngân Sách Gốc (BAC VNĐ)"
                    value={newProjectForm.budgetVND}
                    onChange={(val) => setNewProjectForm({ ...newProjectForm, budgetVND: val })}
                    showBadge={true}
                    showPresets={true}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  Tạo Dự Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT WBS NODE */}
      {showWbsModal && editingWbsNode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                Cập Nhật Hạng Mục WBS [{editingWbsNode.code}]
              </h3>
              <button
                type="button"
                onClick={() => setShowWbsModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWbsNode} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Hạng Mục WBS</label>
                <input
                  type="text"
                  value={editingWbsNode.name}
                  onChange={(e) => setEditingWbsNode({ ...editingWbsNode, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhân Sự Phụ Trách</label>
                <input
                  type="text"
                  value={editingWbsNode.assignee}
                  onChange={(e) => setEditingWbsNode({ ...editingWbsNode, assignee: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <CurrencyInput
                  label="Chi Phí Thực Tế (AC - VNĐ)"
                  value={editingWbsNode.actualCostVND}
                  onChange={(val) => setEditingWbsNode({ ...editingWbsNode, actualCostVND: val })}
                  showBadge={true}
                  showPresets={true}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Tiến Độ Hoàn Thành (%):</label>
                  <span className="font-mono font-bold text-indigo-700">{editingWbsNode.progressPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editingWbsNode.progressPct}
                  onChange={(e) => setEditingWbsNode({ ...editingWbsNode, progressPct: Number(e.target.value) })}
                  className="w-full cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWbsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Lưu WBS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TIMESHEET LOG */}
      {showTimesheetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Ghi Nhận Giờ Làm (Daily Timesheet)
              </h3>
              <button
                type="button"
                onClick={() => setShowTimesheetModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTimesheet} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Nhân Viên</label>
                <input
                  type="text"
                  required
                  value={newTimesheetForm.employeeName}
                  onChange={(e) => setNewTimesheetForm({ ...newTimesheetForm, employeeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã WBS</label>
                  <input
                    type="text"
                    required
                    value={newTimesheetForm.wbsCode}
                    onChange={(e) => setNewTimesheetForm({ ...newTimesheetForm, wbsCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Giờ (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    required
                    value={newTimesheetForm.hoursLogged}
                    onChange={(e) => setNewTimesheetForm({ ...newTimesheetForm, hoursLogged: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <CurrencyInput
                  label="Đơn Giá Giờ (VNĐ/hr)"
                  value={newTimesheetForm.hourlyRateVND}
                  onChange={(val) => setNewTimesheetForm({ ...newTimesheetForm, hourlyRateVND: val })}
                  showBadge={true}
                  showPresets={true}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú Công Việc</label>
                <textarea
                  rows={2}
                  value={newTimesheetForm.notes}
                  onChange={(e) => setNewTimesheetForm({ ...newTimesheetForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTimesheetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Ghi Timesheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: UPLOAD / CREATE DOCUMENT */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Thêm Hồ Sơ / Tài Liệu / Sản Phẩm Nghiệm Thu
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDocumentModal(false);
                  handleClearSelectedFile();
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dự Án Áp Dụng</label>
                <input
                  type="text"
                  disabled
                  value={`[${currentProject?.code}] ${currentProject?.name}`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                />
              </div>

              {/* Computer File Import / Drag-and-Drop Area */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn Tệp Từ Máy Tính (Import Local File)
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.zip,.rar,.png,.jpg,.jpeg,.txt"
                />

                {!uploadedFileName ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isDraggingFile
                        ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/80 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div className="p-2.5 rounded-full bg-white border border-slate-200 text-indigo-600 shadow-2xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        Kéo & thả tệp từ máy tính vào đây, hoặc{' '}
                        <span className="text-indigo-600 underline font-extrabold hover:text-indigo-700">
                          chọn tệp từ máy tính
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Hỗ trợ: PDF, Word (DOCX), Excel (XLSX), DWG, ZIP, Ảnh (PNG, JPG)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate text-xs">
                          {uploadedFileName}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          Đã nạp tệp từ máy tính • Dung lượng: {newDocForm.size}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        Đổi tệp
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSelectedFile}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Hủy chọn tệp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Hồ Sơ / Tài Liệu Hiển Thị *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bien_Ban_Nghiem_Thu_UAT_Phase2.pdf"
                  value={newDocForm.name}
                  onChange={(e) => setNewDocForm({ ...newDocForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân Loại Hồ Sơ</label>
                  <select
                    value={newDocForm.category}
                    onChange={(e) => setNewDocForm({ ...newDocForm, category: e.target.value as ProjectDocument['category'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="DELIVERABLE">DELIVERABLE (Sản phẩm nghiệm thu)</option>
                    <option value="CONTRACT">CONTRACT (Hợp đồng & Phụ lục)</option>
                    <option value="CHARTER">CHARTER (Điều lệ dự án)</option>
                    <option value="DESIGN_SPEC">DESIGN SPEC (Bản vẽ / Thiết kế)</option>
                    <option value="UAT_REPORT">UAT REPORT (Biên bản kiểm thử)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dung Lượng Tệp</label>
                  <input
                    type="text"
                    value={newDocForm.size}
                    onChange={(e) => setNewDocForm({ ...newDocForm, size: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Người Tải Lên / Ký Duyệt</label>
                  <input
                    type="text"
                    value={newDocForm.uploadedBy}
                    onChange={(e) => setNewDocForm({ ...newDocForm, uploadedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng Thái Ban Đầu</label>
                  <select
                    value={newDocForm.status}
                    onChange={(e) => setNewDocForm({ ...newDocForm, status: e.target.value as ProjectDocument['status'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                  >
                    <option value="APPROVED">APPROVED (Đã duyệt)</option>
                    <option value="REVIEW">REVIEW (Đang thẩm định)</option>
                    <option value="DRAFT">DRAFT (Bản nháp)</option>
                    <option value="ARCHIVED">ARCHIVED (Lưu trữ)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDocumentModal(false);
                    handleClearSelectedFile();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                >
                  Lưu & Lưu Trữ Hồ Sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};
