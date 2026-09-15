import React, { useState, useEffect, useMemo } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import {
  Sparkles,
  FlaskConical,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Download,
  Layers,
  FileText,
  Beaker,
  ShieldCheck,
  Cpu,
  Clock,
  X,
  Search,
  Check,
  Eye,
  Activity,
  Award,
  Sliders,
  Send,
  Zap,
  Tag,
  ArrowRight,
  TrendingUp,
  Share2
} from 'lucide-react';
import { RDSubTab } from "./types";

export const M06InnovationRDWorkspace: React.FC<M06InnovationRDWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<RDSubTab>('M06', 'projects');
  const [loading, setLoading] = useState<boolean>(true);

  // Rule #19: ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [patents, setPatents] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);

  // Filter & Search states
  const [projectSearch, setProjectSearch] = useState('');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState('ALL');
  const [projectStatusFilter, setProjectStatusFilter] = useState('ALL');

  const [formulaSearch, setFormulaSearch] = useState('');
  const [patentSearch, setPatentSearch] = useState('');
  const [trialSearch, setTrialSearch] = useState('');

  // Modals & Panels
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateFormulaModal, setShowCreateFormulaModal] = useState(false);
  const [showCreatePatentModal, setShowCreatePatentModal] = useState(false);
  const [showCreateTrialModal, setShowCreateTrialModal] = useState(false);
  const [selectedFormulaForDetail, setSelectedFormulaForDetail] = useState<any | null>(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<any | null>(null);

  // AI Gemini Advisor State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiContextProject, setAiContextProject] = useState<any | null>(null);

  // Form States - Project
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjCategory, setNewProjCategory] = useState('Bán dẫn & Phần cứng');
  const [newProjLead, setNewProjLead] = useState('Dr. Hoàng Minh Tuấn');
  const [newProjBudget, setNewProjBudget] = useState('10000000000');
  const [newProjDeadline, setNewProjDeadline] = useState('2026-12-31');
  const [newProjTrl, setNewProjTrl] = useState(4);
  const [newProjDesc, setNewProjDesc] = useState('');

  // Form States - Formula
  const [newFormulaName, setNewFormulaName] = useState('');
  const [newFormulaVersion, setNewFormulaVersion] = useState('v1.0');
  const [newFormulaAuthor, setNewFormulaAuthor] = useState('Phòng Thí Nghiệm R&D');
  const [newFormulaYield, setNewFormulaYield] = useState('95.0');
  const [newFormulaBatch, setNewFormulaBatch] = useState('10');
  const [newFormulaComponents, setNewFormulaComponents] = useState(
    'Silicon Wafer 300mm: 1 tấm (12500000), EUV Photoresist: 25 ml (8400000)'
  );

  // Form States - Patent
  const [newPatentTitle, setNewPatentTitle] = useState('');
  const [newPatentInventors, setNewPatentInventors] = useState('');
  const [newPatentJurisdiction, setNewPatentJurisdiction] = useState('Cục Sở Hữu Trí Tuệ Việt Nam & WIPO');
  const [newPatentAbstract, setNewPatentAbstract] = useState('');

  // Form States - Trial
  const [newTrialName, setNewTrialName] = useState('');
  const [newTrialType, setNewTrialType] = useState('Thermal & Frequency Stress Test');
  const [newTrialSampleSize, setNewTrialSampleSize] = useState('20');
  const [newTrialScore, setNewTrialScore] = useState('95.0');
  const [newTrialNotes, setNewTrialNotes] = useState('');

  // --------------------------------------------------------------------------
  // API LOADERS
  // --------------------------------------------------------------------------
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [projRes, formRes, patRes, trialRes] = await Promise.all([
        fetch('/api/rd/projects'),
        fetch('/api/rd/formulas'),
        fetch('/api/rd/patents'),
        fetch('/api/rd/trials'),
      ]);

      if (projRes.ok) {
        const data = await projRes.json();
        setProjects(Array.isArray(data) ? data : []);
      }
      if (formRes.ok) {
        const data = await formRes.json();
        setFormulas(Array.isArray(data) ? data : []);
      }
      if (patRes.ok) {
        const data = await patRes.json();
        setPatents(Array.isArray(data) ? data : []);
      }
      if (trialRes.ok) {
        const data = await trialRes.json();
        setTrials(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải dữ liệu', err.message || 'Không thể kết nối đến máy chủ R&D.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // --------------------------------------------------------------------------
  // USER ACTIONS - PROJECTS
  // --------------------------------------------------------------------------
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên đề tài R&D.');
      return;
    }

    try {
      const res = await fetch('/api/rd/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProjTitle.trim(),
          category: newProjCategory,
          lead: newProjLead,
          budget: Number(newProjBudget) || 5000000000,
          deadline: newProjDeadline,
          trlLevel: newProjTrl,
          description: newProjDesc,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setProjects([created, ...projects]);
        setShowCreateProjectModal(false);
        setNewProjTitle('');
        setNewProjDesc('');
        onNotify('success', 'Khởi tạo đề tài thành công', `Đã lưu dự án R&D [${created.projectCode}]: ${created.title}`);
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi tạo đề tài', err.error || 'Máy chủ từ chối yêu cầu.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    }
  };

  const handleApproveProject = (project: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Nghiệm Thu Đề Tài Khoa Học [${project.projectCode}]?`,
      message: `Hội đồng Khoa học & Công nghệ sẽ xác nhận nghiệm thu hoàn thành đề tài "${project.title}". Tiến độ sẽ cập nhật 100% và chuyển trạng thái sang COMPLETED (Sẵn sàng chuyển giao công nghệ sang M25 Sản Xuất).`,
      variant: 'primary',
      confirmText: 'Xác Nhận Nghiệm Thu',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/rd/projects/${project.id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approver: 'Hội đồng Khoa học NexusSync R&D' }),
          });
          if (res.ok) {
            const data = await res.json();
            setProjects(projects.map(p => p.id === project.id ? data.project : p));
            onNotify('success', 'Nghiệm thu thành công', data.message);
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi nghiệm thu', err.message);
        }
      },
    });
  };

  const handleSelectProject = (project: any) => {
    setSelectedProjectForDetail(project);
    onSelectEntity({
      entityType: 'RD_PROJECT',
      entityId: project.projectCode || String(project.id),
      displayName: project.title,
      moduleCode: 'M06',
      metadata: {
        category: project.category,
        lead: project.lead,
        status: project.status,
        progress: `${project.progress}%`,
        trlLevel: `TRL ${project.trlLevel}`,
        budget: project.budget,
      },
    });
    onNotify('info', 'Đã tải dự án R&D', `Chi tiết [${project.projectCode}] sẵn sàng trên Context Bar.`);
  };

  // --------------------------------------------------------------------------
  // USER ACTIONS - FORMULAS
  // --------------------------------------------------------------------------
  const handleCreateFormulaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormulaName.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên công thức BOM.');
      return;
    }

    const rawComps = newFormulaComponents.split(',').map(s => {
      const parts = s.trim().split(':');
      return {
        name: parts[0]?.trim() || 'Thành phần',
        qty: 1,
        unit: parts[1]?.trim() || 'đơn vị',
        cost: 1000000
      };
    });

    try {
      const res = await fetch('/api/rd/formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFormulaName.trim(),
          version: newFormulaVersion,
          author: newFormulaAuthor,
          yieldRate: Number(newFormulaYield) || 95.0,
          testBatchSize: Number(newFormulaBatch) || 10,
          components: rawComps,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setFormulas([created, ...formulas]);
        setShowCreateFormulaModal(false);
        setNewFormulaName('');
        onNotify('success', 'Lưu công thức thành công', `Đã lưu định mức R&D BOM [${created.formulaCode}]: ${created.name}`);
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi lưu công thức', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    }
  };

  const handleApproveFormula = (formula: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Phê Duyệt Công Thức BOM [${formula.formulaCode}] Chuyển Giao M25?`,
      message: `Công thức định mức kỹ thuật "${formula.name}" (Phiên bản ${formula.version}) sẽ được cấp mã định mức chuẩn và đồng bộ sang phân hệ Sản Xuất M25 (Manufacturing MES). Bạn có chắc chắn phê duyệt?`,
      variant: 'primary',
      confirmText: 'Phê Duyệt & Chuyển Giao',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/rd/formulas/${formula.id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approver: 'TS. Nguyễn An Hòa (Giám đốc R&D)' }),
          });
          if (res.ok) {
            const data = await res.json();
            setFormulas(formulas.map(f => f.id === formula.id ? { ...f, status: 'APPROVED', approvedBy: data.formula.approvedBy } : f));
            onNotify('success', 'Phê duyệt thành công', data.message);
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi duyệt công thức', err.message);
        }
      },
    });
  };

  // --------------------------------------------------------------------------
  // USER ACTIONS - PATENTS
  // --------------------------------------------------------------------------
  const handleCreatePatentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatentTitle.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên sáng chế.');
      return;
    }

    try {
      const res = await fetch('/api/rd/patents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPatentTitle.trim(),
          inventors: newPatentInventors || 'Đội ngũ R&D NexusSync',
          jurisdiction: newPatentJurisdiction,
          abstract: newPatentAbstract,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setPatents([created, ...patents]);
        setShowCreatePatentModal(false);
        setNewPatentTitle('');
        setNewPatentAbstract('');
        onNotify('success', 'Nộp đơn sáng chế thành công', `Đã ghi nhận mã đơn [${created.patentCode}]: ${created.title}`);
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi đăng ký', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    }
  };

  // --------------------------------------------------------------------------
  // USER ACTIONS - TRIALS
  // --------------------------------------------------------------------------
  const handleCreateTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrialName.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên bài thử nghiệm.');
      return;
    }

    try {
      const res = await fetch('/api/rd/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialName: newTrialName.trim(),
          testType: newTrialType,
          sampleSize: Number(newTrialSampleSize) || 10,
          score: Number(newTrialScore) || 95.0,
          resultNotes: newTrialNotes,
          performedBy: 'Kỹ sư Kiểm định Phòng Lab',
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTrials([created, ...trials]);
        setShowCreateTrialModal(false);
        setNewTrialName('');
        setNewTrialNotes('');
        onNotify('success', 'Lưu thử nghiệm thành công', `Đã ghi nhận báo cáo đo kiểm [${created.trialCode}]: ${created.trialName}`);
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi lưu thử nghiệm', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    }
  };

  // --------------------------------------------------------------------------
  // AI GEMINI R&D ADVISOR
  // --------------------------------------------------------------------------
  const handleConsultAiAdvisor = async (project: any) => {
    setAiContextProject(project);
    setAiLoading(true);
    setAiAdvice(null);
    try {
      const res = await fetch('/api/rd/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptType: 'FORMULATION',
          projectTitle: project.title,
          category: project.category,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAdvice(data.analysis);
        onNotify('info', 'AI Gemini R&D Advisor', 'Đã tạo báo cáo khuyến nghị khoa học.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi AI', err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // EXPORT CSV
  // --------------------------------------------------------------------------
  const handleExportCSV = () => {
    const csvHeader = "ProjectCode,Title,Category,Lead,Status,Progress,Budget,TRL,Deadline\n";
    const csvRows = projects.map(p =>
      `"${p.projectCode || ''}","${(p.title || '').replace(/"/g, '""')}","${p.category || ''}","${p.lead || ''}","${p.status || ''}","${p.progress || 0}%","${p.budget || 0}","TRL ${p.trlLevel || 3}","${p.deadline || ''}"`
    ).join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `innovation_rd_projects_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', 'File CSV dữ liệu đề tài R&D đã sẵn sàng.');
  };

  // --------------------------------------------------------------------------
  // FILTERED DATA & PAGINATION
  // --------------------------------------------------------------------------
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch = (p.projectCode?.toLowerCase().includes(projectSearch.toLowerCase()) ?? false) ||
        (p.title?.toLowerCase().includes(projectSearch.toLowerCase()) ?? false) ||
        (p.lead?.toLowerCase().includes(projectSearch.toLowerCase()) ?? false);
      const matchCategory = projectCategoryFilter === 'ALL' || p.category === projectCategoryFilter;
      const matchStatus = projectStatusFilter === 'ALL' || p.status === projectStatusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [projects, projectSearch, projectCategoryFilter, projectStatusFilter]);

  const pagination = usePagination({
    totalItems: filteredProjects.length,
    initialPageSize: 10,
  });

  const paginatedProjects = useMemo(() => {
    return filteredProjects.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [filteredProjects, pagination.startIndex, pagination.endIndex]);

  const filteredFormulas = useMemo(() => {
    return formulas.filter((f) => {
      return (f.formulaCode?.toLowerCase().includes(formulaSearch.toLowerCase()) ?? false) ||
        (f.name?.toLowerCase().includes(formulaSearch.toLowerCase()) ?? false) ||
        (f.author?.toLowerCase().includes(formulaSearch.toLowerCase()) ?? false);
    });
  }, [formulas, formulaSearch]);

  const filteredPatents = useMemo(() => {
    return patents.filter((pat) => {
      return (pat.patentCode?.toLowerCase().includes(patentSearch.toLowerCase()) ?? false) ||
        (pat.title?.toLowerCase().includes(patentSearch.toLowerCase()) ?? false) ||
        (pat.inventors?.toLowerCase().includes(patentSearch.toLowerCase()) ?? false);
    });
  }, [patents, patentSearch]);

  const filteredTrials = useMemo(() => {
    return trials.filter((t) => {
      return (t.trialCode?.toLowerCase().includes(trialSearch.toLowerCase()) ?? false) ||
        (t.trialName?.toLowerCase().includes(trialSearch.toLowerCase()) ?? false) ||
        (t.performedBy?.toLowerCase().includes(trialSearch.toLowerCase()) ?? false);
    });
  }, [trials, trialSearch]);

  // KPI Metrics Calculation
  const inProgressProjectsCount = projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'TESTING').length;
  const approvedFormulasCount = formulas.filter(f => f.status === 'APPROVED').length;
  const grantedPatentsCount = patents.filter(pat => pat.status === 'GRANTED').length;
  const avgTrialScore = trials.length > 0
    ? (trials.reduce((acc, t) => acc + (Number(t.score) || 0), 0) / trials.length).toFixed(1)
    : '96.2';

  return (
    <div id="m06-innovation-rd-workspace" className="space-y-6">
      {/* -------------------------------------------------------------------- */}
      {/* L0: WORKSPACE BANNER                                                 */}
      {/* -------------------------------------------------------------------- */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30">
                M06 • INNOVATION & R&D PORTAL
              </span>
              <span className="text-xs text-slate-300 font-mono hidden sm:inline">
                Technology Readiness Level (TRL 1-9) • ISO/IEC 17025 • WIPO IP
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Trung Tâm Sáng Kiến, Nghiên Cứu & Phát Triển Sản Phẩm Mới (R&D Hub)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-export-rd-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo CSV</span>
          </button>
          <button
            id="btn-refresh-rd"
            onClick={loadAllData}
            disabled={loading}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* L2: KPI SUMMARY STRIP                                                */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Đề tài R&D */}
        <div id="kpi-active-projects" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Đề Tài R&D Triển Khai</span>
            <FlaskConical className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
            {inProgressProjectsCount} <span className="text-xs text-slate-400 font-normal">/ {projects.length} đề tài</span>
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Thang đo TRL 1 - 9 hoàn thiện</span>
          </p>
        </div>

        {/* KPI 2: Công thức R&D BOM */}
        <div id="kpi-approved-formulas" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Công Thức Đã Duyệt M25</span>
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {approvedFormulasCount} <span className="text-xs text-slate-400 font-normal">công thức BOM</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sẵn sàng sản xuất thí điểm</span>
          </p>
        </div>

        {/* KPI 3: Bằng Sáng Chế & IP */}
        <div id="kpi-granted-patents" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sáng Chế Cấp Bằng (IP)</span>
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400 mt-1">
            {grantedPatentsCount} <span className="text-xs text-slate-400 font-normal">/ {patents.length} đơn nộp</span>
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Bảo hộ độc quyền WIPO / VN</span>
          </p>
        </div>

        {/* KPI 4: Thử nghiệm Lab */}
        <div id="kpi-trial-score" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Độ Tin Cậy Phòng Lab</span>
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
            {avgTrialScore}% <span className="text-xs text-slate-400 font-normal">đạt chỉ tiêu</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Chuẩn thử nghiệm ISO/IEC 17025</span>
          </p>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* L1: SUB-TABS NAVIGATION BAR (M41 MASTER SPEC)                         */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            id="tab-rd-projects"
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'projects'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FlaskConical className="w-4 h-4 shrink-0" />
            <span>1. Đề Tài R&amp;D &amp; Giai Đoạn TRL</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'projects' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {projects.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-rd-formulas"
            onClick={() => setActiveTab('formulas')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'formulas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span>2. Công Thức R&amp;D BOM &amp; Định Mức</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'formulas' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {formulas.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-rd-patents"
            onClick={() => setActiveTab('patents')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'patents'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>3. Sở Hữu Trí Tuệ &amp; Sáng Chế</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'patents' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {patents.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-rd-trials"
            onClick={() => setActiveTab('trials')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'trials'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>4. Thử Nghiệm Lab &amp; Kiểm Chuẩn</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'trials' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {trials.length}
            </span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            R&amp;D Authority
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            TRL 1-9 &amp; BOM Engineering
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* TAB 1: ĐỀ TÀI R&D                                                    */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-search-rd-projects"
                  type="text"
                  placeholder="Tìm theo mã RD, tên đề tài, chủ nhiệm..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <select
                id="select-filter-rd-category"
                value={projectCategoryFilter}
                onChange={(e) => setProjectCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Tất cả lĩnh vực</option>
                <option value="Bán dẫn & Phần cứng">Bán dẫn & Phần cứng</option>
                <option value="Công nghệ Xanh">Công nghệ Xanh</option>
                <option value="Phần mềm AI">Phần mềm AI</option>
                <option value="Công nghệ Sinh học">Công nghệ Sinh học</option>
              </select>

              <select
                id="select-filter-rd-status"
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="IN_PROGRESS">Đang Thực Hiện</option>
                <option value="TESTING">Thử Nghiệm Mẫu</option>
                <option value="COMPLETED">Đã Nghiệm Thu</option>
              </select>
            </div>

            <button
              id="btn-open-create-project-modal"
              onClick={() => setShowCreateProjectModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Khởi Tạo Đề Tài R&D Mới</span>
            </button>
          </div>

          {/* Master Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Mã Đề Tài</th>
                    <th className="py-3 px-4">Tên Đề Tài & Lĩnh Vực</th>
                    <th className="py-3 px-4">Chủ Nhiệm Đề Tài</th>
                    <th className="py-3 px-4">Cấp TRL</th>
                    <th className="py-3 px-4">Tiến Độ (%)</th>
                    <th className="py-3 px-4">Ngân Sách (VND)</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {paginatedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Không tìm thấy đề tài R&D phù hợp với điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedProjects.map((p) => {
                      const isCompleted = p.status === 'COMPLETED';
                      const isTesting = p.status === 'TESTING';

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 block w-fit">
                              {p.projectCode || p.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {p.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {p.category} • Hạn chót: <span className="font-mono">{p.deadline}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                            {p.lead}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded font-mono font-bold text-[11px] border border-blue-200 dark:border-blue-800">
                              TRL {p.trlLevel || 3}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-28 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1">
                              <div
                                className={`h-full ${
                                  p.progress >= 90
                                    ? 'bg-emerald-500'
                                    : p.progress >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${p.progress || 0}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              {p.progress || 0}%
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {typeof p.budget === 'number'
                              ? p.budget.toLocaleString('vi-VN') + ' đ'
                              : p.budget}
                          </td>
                          <td className="py-3 px-4">
                            {isCompleted ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full border">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Nghiệm Thu
                              </span>
                            ) : isTesting ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 text-xs font-bold rounded-full border">
                                <FlaskConical className="w-3 h-3 mr-1" />
                                Thử Nghiệm
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 text-xs font-bold rounded-full border">
                                <Activity className="w-3 h-3 mr-1" />
                                Đang Nghiên Cứu
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                title="Tư vấn AI Gemini R&D"
                                onClick={() => handleConsultAiAdvisor(p)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                              <button
                                title="Xem chi tiết & gửi Context Rail"
                                onClick={() => handleSelectProject(p)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {!isCompleted && (
                                <button
                                  title="Nghiệm thu đề tài"
                                  onClick={() => handleApproveProject(p)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Nghiệm Thu</span>
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
            {filteredProjects.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <PaginationControl pagination={pagination} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 2: CÔNG THỨC R&D BOM & ĐỊNH MỨC                                  */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'formulas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-formulas"
                type="text"
                placeholder="Tìm mã công thức, tên định mức, tác giả..."
                value={formulaSearch}
                onChange={(e) => setFormulaSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              id="btn-open-create-formula-modal"
              onClick={() => setShowCreateFormulaModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thiết Lập Công Thức R&D BOM Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filteredFormulas.map((f) => {
              const isApproved = f.status === 'APPROVED';
              const comps = Array.isArray(f.components) ? f.components : [];

              return (
                <div
                  key={f.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        {f.formulaCode || f.id}
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-[10px] font-bold rounded-full border">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Đã Phê Duyệt M25
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 text-[10px] font-bold rounded-full border">
                          <Clock className="w-3 h-3 mr-1" />
                          Chờ Duyệt BOM
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                      {f.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                      Phiên bản: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{f.version || 'v1.0'}</span> • Tác giả: {f.author}
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Thành phần định mức ({comps.length}):
                      </span>
                      {comps.slice(0, 3).map((comp: any, idx: number) => (
                        <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex justify-between font-mono">
                          <span>• {typeof comp === 'string' ? comp : comp.name}</span>
                          {comp.unit && <span className="text-slate-400">{comp.qty} {comp.unit}</span>}
                        </div>
                      ))}
                      {comps.length > 3 && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold pt-1">
                          + {comps.length - 3} thành phần phụ gia khác...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedFormulaForDetail(f);
                        onSelectEntity({
                          entityType: 'RD_FORMULA',
                          entityId: f.formulaCode || String(f.id),
                          displayName: f.name,
                          moduleCode: 'M06',
                          metadata: { version: f.version, status: f.status, author: f.author },
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Chi Tiết</span>
                    </button>

                    {!isApproved && (
                      <button
                        onClick={() => handleApproveFormula(f)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Duyệt & Chuyển M25</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 3: SỞ HỮU TRÍ TUỆ & SÁNG CHẾ                                     */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'patents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-patents"
                type="text"
                placeholder="Tìm mã sáng chế, tên bằng phát minh, tác giả..."
                value={patentSearch}
                onChange={(e) => setPatentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              id="btn-open-create-patent-modal"
              onClick={() => setShowCreatePatentModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nộp Đơn Đăng Ký Sáng Chế Mới</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Mã Sáng Chế</th>
                    <th className="py-3 px-4">Tên Sáng Chế / Giải Pháp Hữu Ích</th>
                    <th className="py-3 px-4">Tác Giả / Nhóm Sáng Chế</th>
                    <th className="py-3 px-4">Ngày Nộp Đơn</th>
                    <th className="py-3 px-4">Cơ Quan Bảo Hộ</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {filteredPatents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Chưa có dữ liệu bằng sáng chế phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredPatents.map((pat) => {
                      const isGranted = pat.status === 'GRANTED';

                      return (
                        <tr
                          key={pat.id}
                          className="hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 block w-fit">
                              {pat.patentCode || pat.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {pat.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {pat.abstract || 'Không có mô tả tóm tắt.'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                            {pat.inventors}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {pat.filingDate}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {pat.jurisdiction || 'Cục SHTT Việt Nam'}
                          </td>
                          <td className="py-3 px-4">
                            {isGranted ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full border">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                Đã Cấp Bằng
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 text-xs font-bold rounded-full border">
                                <Clock className="w-3 h-3 mr-1" />
                                Chờ Thẩm Định
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
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 4: THỬ NGHIỆM LAB & CHỨNG NHẬN MẪU                               */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'trials' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-trials"
                type="text"
                placeholder="Tìm mã thử nghiệm, tên bài kiểm tra, kỹ sư..."
                value={trialSearch}
                onChange={(e) => setTrialSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              id="btn-open-create-trial-modal"
              onClick={() => setShowCreateTrialModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi Nhận Bài Thử Nghiệm Lab Mới</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Mã Đo Kiểm</th>
                    <th className="py-3 px-4">Tên Thử Nghiệm / Phép Đo</th>
                    <th className="py-3 px-4">Loại Bài Test</th>
                    <th className="py-3 px-4">Số Mẫu (Sample)</th>
                    <th className="py-3 px-4">Điểm Đạt (%)</th>
                    <th className="py-3 px-4">Kỹ Sư Đo Kiểm</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {filteredTrials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có dữ liệu bài đo kiểm nào.
                      </td>
                    </tr>
                  ) : (
                    filteredTrials.map((t) => {
                      const isPassed = t.status === 'PASSED';

                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 block w-fit">
                              {t.trialCode || t.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {t.trialName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {t.resultNotes}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                            {t.testType}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {t.sampleSize} mẫu
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {t.score || 95.0}%
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {t.performedBy}
                          </td>
                          <td className="py-3 px-4">
                            {isPassed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full border">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Đạt Chuẩn
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 text-xs font-bold rounded-full border">
                                <Activity className="w-3 h-3 mr-1" />
                                Đang Đo Kiểm
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
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* AI GEMINI R&D ADVISOR SIDE DRAWER                                   */}
      {/* -------------------------------------------------------------------- */}
      {aiContextProject && (
        <div className="bg-gradient-to-r from-purple-900/90 to-indigo-950/90 text-white p-6 rounded-2xl border border-purple-500/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
              <h3 className="font-bold text-base">
                Trợ Lý Khoa Học AI Gemini — Phân Tích & Tối Ưu Hóa R&D
              </h3>
            </div>
            <button
              onClick={() => setAiContextProject(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-xs text-purple-200">
            Đang phân tích đề tài: <span className="font-bold text-white font-mono">{aiContextProject.projectCode}</span> — {aiContextProject.title}
          </div>

          {aiLoading ? (
            <div className="flex items-center gap-2 text-xs text-purple-300 py-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang tính toán ma trận TRL, mô phỏng phản ứng và đối chiếu bằng sáng chế...</span>
            </div>
          ) : (
            <div className="bg-purple-950/60 p-4 rounded-xl border border-purple-400/20 text-xs leading-relaxed whitespace-pre-wrap font-sans text-purple-100">
              {aiAdvice}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: TẠO ĐỀ TÀI R&D MỚI                                            */}
      {/* -------------------------------------------------------------------- */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-600" />
                <span>Khởi Tạo Đề Tài Nghiên Cứu R&D Mới</span>
              </h3>
              <button
                onClick={() => setShowCreateProjectModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Đề Tài R&D *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cảm biến quang học siêu nhạy ứng dụng IoT"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lĩnh Vực Công Nghệ
                  </label>
                  <select
                    value={newProjCategory}
                    onChange={(e) => setNewProjCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Bán dẫn & Phần cứng">Bán dẫn & Phần cứng</option>
                    <option value="Công nghệ Xanh">Công nghệ Xanh</option>
                    <option value="Phần mềm AI">Phần mềm AI</option>
                    <option value="Công nghệ Sinh học">Công nghệ Sinh học</option>
                    <option value="Vật liệu Mới">Vật liệu Mới</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cấp Độ Sẵn Sàng (TRL)
                  </label>
                  <select
                    value={newProjTrl}
                    onChange={(e) => setNewProjTrl(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  >
                    <option value={1}>TRL 1 - Nguyên lý cơ bản</option>
                    <option value={2}>TRL 2 - Định hình ý tưởng</option>
                    <option value={3}>TRL 3 - Bằng chứng khái niệm (PoC)</option>
                    <option value={4}>TRL 4 - Thử nghiệm Lab</option>
                    <option value={5}>TRL 5 - Xác thực môi trường liên quan</option>
                    <option value={6}>TRL 6 - Nguyên mẫu môi trường thực</option>
                    <option value={7}>TRL 7 - Trình diễn thực địa</option>
                    <option value={8}>TRL 8 - Thẩm định hoàn chỉnh</option>
                    <option value={9}>TRL 9 - Ứng dụng thương mại</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chủ Nhiệm Đề Tài
                  </label>
                  <input
                    type="text"
                    value={newProjLead}
                    onChange={(e) => setNewProjLead(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngân Sách Dự Kiến (VND)
                  </label>
                  <input
                    type="number"
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô Tả Mục Tiêu Kỹ Thuật
                </label>
                <textarea
                  rows={3}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Mô tả mục tiêu chuyển giao và các chỉ tiêu đo kiểm dự kiến..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Lưu & Khởi Tạo Đề Tài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: THIẾT LẬP CÔNG THỨC R&D BOM MỚI                               */}
      {/* -------------------------------------------------------------------- */}
      {showCreateFormulaModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Thiết Lập Công Thức R&D BOM & Định Mức</span>
              </h3>
              <button
                onClick={() => setShowCreateFormulaModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFormulaSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Công Thức / Hợp Chất BOM *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hợp kim Titan siêu nhẹ v3.0"
                  value={newFormulaName}
                  onChange={(e) => setNewFormulaName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phiên Bản
                  </label>
                  <input
                    type="text"
                    value={newFormulaVersion}
                    onChange={(e) => setNewFormulaVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hiệu Suất Thu Hồi (Yield %)
                  </label>
                  <input
                    type="number"
                    value={newFormulaYield}
                    onChange={(e) => setNewFormulaYield(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thành Phần & Định Mức (Phân tách bằng dấu phẩy)
                </label>
                <textarea
                  rows={3}
                  value={newFormulaComponents}
                  onChange={(e) => setNewFormulaComponents(e.target.value)}
                  placeholder="VD: Titan Grade 5: 85%, Nano Carbon Tube: 10%, Silicon Binder: 5%"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFormulaModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Lưu Công Thức BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: ĐĂNG KÝ BẰNG SÁNG CHẾ                                         */}
      {/* -------------------------------------------------------------------- */}
      {showCreatePatentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Nộp Hồ Sơ Đăng Ký Bảo Hộ Sáng Chế (IP)</span>
              </h3>
              <button
                onClick={() => setShowCreatePatentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Sáng Chế / Giải Pháp Hữu Ích *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thuật toán đồng bộ Outbox Event Bus phi tập trung"
                  value={newPatentTitle}
                  onChange={(e) => setNewPatentTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tác Giả / Nhóm Nhà Khoa Học
                </label>
                <input
                  type="text"
                  value={newPatentInventors}
                  onChange={(e) => setNewPatentInventors(e.target.value)}
                  placeholder="VD: Dr. Hoàng Minh Tuấn, KS. Đỗ Đức Long"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cơ Quan Thẩm Quyền Bảo Hộ
                </label>
                <input
                  type="text"
                  value={newPatentJurisdiction}
                  onChange={(e) => setNewPatentJurisdiction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tóm Tắt Bản Yêu Cầu Bảo Hộ (Abstract / Claims)
                </label>
                <textarea
                  rows={3}
                  value={newPatentAbstract}
                  onChange={(e) => setNewPatentAbstract(e.target.value)}
                  placeholder="Mô tả điểm mới và tính sáng tạo công nghệ..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePatentModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Ghi Nhận Đơn Sáng Chế
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: GHI NHẬN BÀI THỬ NGHIỆM LAB MỚI                               */}
      {/* -------------------------------------------------------------------- */}
      {showCreateTrialModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600" />
                <span>Ghi Nhận Kết Quả Đo Kiểm Phòng Lab</span>
              </h3>
              <button
                onClick={() => setShowCreateTrialModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrialSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Phép Thử / Bài Đo Kiểm *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kiểm tra độ bền mỏi uốn và sốc nhiệt 1000 chu kỳ"
                  value={newTrialName}
                  onChange={(e) => setNewTrialName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Loại Phép Đo
                  </label>
                  <select
                    value={newTrialType}
                    onChange={(e) => setNewTrialType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Thermal & Frequency Stress Test">Thermal & Frequency Stress Test</option>
                    <option value="Drop & Impact Reliability">Drop & Impact Reliability</option>
                    <option value="Chemical & Soil Bio-degradation">Chemical & Soil Bio-degradation</option>
                    <option value="Signal Integrity & EMI Purity">Signal Integrity & EMI Purity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Điểm Đạt (%)
                  </label>
                  <input
                    type="number"
                    value={newTrialScore}
                    onChange={(e) => setNewTrialScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi Chú Kết Quả & Tiêu Chuẩn Áp Dụng
                </label>
                <textarea
                  rows={3}
                  value={newTrialNotes}
                  onChange={(e) => setNewTrialNotes(e.target.value)}
                  placeholder="VD: Mẫu thử nghiệm đạt chuẩn ISO/IEC 17025 không có hiện tượng nứt vi mô..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTrialModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Lưu Báo Cáo Đo Kiểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: CHI TIẾT CÔNG THỨC R&D BOM                                    */}
      {/* -------------------------------------------------------------------- */}
      {selectedFormulaForDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  {selectedFormulaForDetail.formulaCode}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                  {selectedFormulaForDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFormulaForDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Phiên Bản</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {selectedFormulaForDetail.version}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Hiệu Suất (Yield)</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {selectedFormulaForDetail.yieldRate || 95.0}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Tác Giả</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedFormulaForDetail.author}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Trạng Thái Duyệt</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedFormulaForDetail.status === 'APPROVED' ? 'Đã duyệt chuyển giao M25' : 'Đang thử nghiệm'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 uppercase text-[10px] tracking-wider">
                  Bảng Thành Phần & Tỷ Lệ Phối Trộn Định Mức:
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-700/50 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Tên Thành Phần</th>
                        <th className="py-2 px-3 text-right">Định Mức</th>
                        <th className="py-2 px-3 text-right">Chi Phí Ước Tính</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                      {Array.isArray(selectedFormulaForDetail.components) &&
                        selectedFormulaForDetail.components.map((c: any, i: number) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {typeof c === 'string' ? c : c.name}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                              {c.qty ? `${c.qty} ${c.unit || ''}` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-blue-600 dark:text-blue-400">
                              {c.cost ? Number(c.cost).toLocaleString('vi-VN') + ' đ' : '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
              <button
                onClick={() => setSelectedFormulaForDetail(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* CONFIRM DIALOG (Rule #19 Compliance)                                 */}
      {/* -------------------------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant || 'primary'}
        confirmText={confirmDialog.confirmText || 'Xác Nhận'}
        cancelText={confirmDialog.cancelText || 'Hủy Bỏ'}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default M06InnovationRDWorkspace;
