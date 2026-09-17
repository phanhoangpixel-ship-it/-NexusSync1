import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SelectedEntityContext } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { DeepLinkBanner } from '../../../../components/common/DeepLinkBanner';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import {
  ShieldCheck,
  Star,
  Award,
  TrendingUp,
  RefreshCw,
  Download,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
  FileText,
  BarChart3,
  Truck
} from 'lucide-react';

import { SupplierItem, ScorecardItem, SupplierAuditItem, FrameworkContractItem } from './m11Types';
import { M11WorkspaceHeader } from './M11WorkspaceHeader';
import { M11LifecyclePipeline } from './M11LifecyclePipeline';
import { M11MetricCards } from './M11MetricCards';
import { M11ScorecardsTab } from './M11ScorecardsTab';
import { M11PerformanceTab } from './M11PerformanceTab';
import { M11ContractsTab } from './M11ContractsTab';
import { M11AuditsTab } from './M11AuditsTab';
import { M11AnalyticsTab } from './M11AnalyticsTab';
import { M11ScorecardDetailModal } from './M11ScorecardDetailModal';
import { M11NewScorecardModal } from './M11NewScorecardModal';
import { M11NewAuditModal } from './M11NewAuditModal';
import { M11RenewContractModal } from './M11RenewContractModal';
import { M11NewContractModal } from './M11NewContractModal';
import { M11ScoringConfigModal } from './M11ScoringConfigModal';

interface M11SrmSupplierMgmtWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

const DEFAULT_AUDITS: SupplierAuditItem[] = [
  {
    id: 'AUD-001',
    auditCode: 'AUD-2026-001',
    supplierId: 1,
    supplierName: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
    supplierCode: 'SUP-001',
    auditType: 'FACTORY_CAPACITY',
    leadAuditor: 'Đoàn Thanh tra Nhà máy SGS',
    auditDate: '10/08/2026',
    score: 96,
    result: 'PASSED',
    findingsCount: 1,
    criticalIssues: 0,
    recommendations: 'Dây chuyền phòng sạch Cleanroom Class 100 đạt chuẩn quốc tế. Cấp chứng chỉ phê duyệt đối tác chiến lược.',
    status: 'COMPLETED'
  },
  {
    id: 'AUD-002',
    auditCode: 'AUD-2026-002',
    supplierId: 2,
    supplierName: 'Tập đoàn Hóa chất & Phụ gia Xanh',
    supplierCode: 'SUP-002',
    auditType: 'ESG_ENVIRONMENT',
    leadAuditor: 'Chuyên gia Môi trường & ESG Bureau Veritas',
    auditDate: '15/07/2026',
    score: 92,
    result: 'PASSED',
    findingsCount: 2,
    criticalIssues: 0,
    recommendations: 'Hệ thống xử lý nước thải và khí thải đạt chuẩn QCVN. Đề nghị bổ sung báo cáo giảm thiểu phát thải carbon định kỳ.',
    status: 'COMPLETED'
  },
  {
    id: 'AUD-003',
    auditCode: 'AUD-2026-003',
    supplierId: 3,
    supplierName: 'Công ty TNHH Thiết bị Đo lường Quang Học',
    supplierCode: 'SUP-003',
    auditType: 'QUALITY_ISO',
    leadAuditor: 'Tổ Kiểm định Chất lượng ISO 9001:2015',
    auditDate: '20/06/2026',
    score: 78,
    result: 'PASSED_WITH_CONDITIONS',
    findingsCount: 4,
    criticalIssues: 1,
    recommendations: 'Phát hiện thiết bị hiệu chuẩn sai số chưa kiểm định lại sau 12 tháng. Yêu cầu nộp kế hoạch khắc phục (CAPA) trong vòng 30 ngày.',
    status: 'COMPLETED'
  }
];

export const M11SrmSupplierMgmtWorkspace: React.FC<M11SrmSupplierMgmtWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'scorecards' | 'performance' | 'contracts' | 'audits' | 'analytics'>('M11', 'scorecards');

  // Suppliers & Scorecards state
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [scorecards, setScorecards] = useState<ScorecardItem[]>([]);
  const [contracts, setContracts] = useState<FrameworkContractItem[]>([]);
  const [audits, setAudits] = useState<SupplierAuditItem[]>(() => {
    const saved = localStorage.getItem('nexus_srm_audits');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_AUDITS;
      }
    }
    return DEFAULT_AUDITS;
  });

  // Modals state
  const [selectedScForModal, setSelectedScForModal] = useState<ScorecardItem | null>(null);
  const [isNewScModalOpen, setIsNewScModalOpen] = useState<boolean>(false);
  const [preSelectedSupplierId, setPreSelectedSupplierId] = useState<number | undefined>(undefined);
  const [isNewAuditModalOpen, setIsNewAuditModalOpen] = useState<boolean>(false);
  const [isScoringConfigOpen, setIsScoringConfigOpen] = useState<boolean>(false);

  // Contract Modals state
  const [selectedContractForRenew, setSelectedContractForRenew] = useState<FrameworkContractItem | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState<boolean>(false);
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState<boolean>(false);

  // Confirm dialog state
  const [confirmDialogState, setConfirmDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Fetch Framework Contracts (BPA) from backend
  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/purchase/contracts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (res.ok) {
        const data: FrameworkContractItem[] = await res.json();
        setContracts(data);
      }
    } catch (err) {
      console.warn('Could not fetch purchase contracts:', err);
    }
  }, []);

  // Fetch real suppliers from backend
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Không thể tải danh sách nhà cung cấp`);
      }
      const data: SupplierItem[] = await res.json();
      setSuppliers(data);

      // Aggregate all scorecards across suppliers
      const allScs: ScorecardItem[] = [];
      data.forEach((supp) => {
        if (supp.scorecards && Array.isArray(supp.scorecards) && supp.scorecards.length > 0) {
          supp.scorecards.forEach((sc) => {
            allScs.push({
              ...sc,
              supplierId: supp.id,
              supplierName: supp.name,
              supplierCode: supp.code,
            });
          });
        } else {
          // Synthetic current scorecard from supplier baseline metrics
          const score = supp.compositeScore || 85;
          const status = score >= 90 ? 'EXCELLENT' : score >= 75 ? 'GOOD' : 'WARNING';
          allScs.push({
            id: `SC-2026-${String(supp.id).padStart(3, '0')}`,
            supplierId: supp.id,
            supplierName: supp.name,
            supplierCode: supp.code,
            period: 'Q3/2026',
            otifRate: supp.otifRate || (score >= 90 ? '98.5%' : score >= 80 ? '95.2%' : '88.0%'),
            qualityScore: supp.qualityScore || (score >= 90 ? '99.2%' : score >= 80 ? '96.5%' : '90.0%'),
            complianceScore: supp.complianceScore || (score >= 90 ? '100%' : '98%'),
            serviceScore: '92%',
            overallRating: `${(score / 20).toFixed(1)} / 5.0 (${status === 'EXCELLENT' ? 'Strategic' : 'Preferred'})`,
            compositeScore: score,
            status,
            evaluator: 'Hội đồng Mua sắm & SRM',
            evaluationDate: '15/08/2026',
            notes: supp.notes || 'Hồ sơ đối tác đã được ghi nhận trong hệ thống Master Data M09.',
          });
        }
      });

      setScorecards(allScs);
      await fetchContracts();
    } catch (err: any) {
      console.error('Error fetching suppliers for M11:', err);
      onNotify('danger', 'Lỗi kết nối', err.message || 'Không thể đồng bộ dữ liệu SRM.');
    } finally {
      setLoading(false);
    }
  }, [fetchContracts, onNotify]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Persist audits
  const handleSaveAudit = async (newAuditData: Partial<SupplierAuditItem>) => {
    const newAudit: SupplierAuditItem = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      auditCode: `AUD-2026-${Date.now().toString().slice(-3)}`,
      supplierId: newAuditData.supplierId || 1,
      supplierName: newAuditData.supplierName || 'Nhà Cung Cấp',
      supplierCode: newAuditData.supplierCode || 'SUP-001',
      auditType: newAuditData.auditType || 'FACTORY_CAPACITY',
      leadAuditor: newAuditData.leadAuditor || 'Kiểm toán viên SRM',
      auditDate: newAuditData.auditDate || new Date().toISOString().slice(0, 10),
      score: newAuditData.score ?? 90,
      result: newAuditData.result || 'PASSED',
      findingsCount: newAuditData.findingsCount ?? 0,
      criticalIssues: newAuditData.criticalIssues ?? 0,
      recommendations: newAuditData.recommendations || 'Không phát sinh lỗi nghiêm trọng.',
      status: newAuditData.status || 'COMPLETED',
    };

    const updated = [newAudit, ...audits];
    setAudits(updated);
    localStorage.setItem('nexus_srm_audits', JSON.stringify(updated));

    onNotify('success', 'Kiểm toán thành công', `Đã lưu biên bản kiểm toán cho đối tác: ${newAudit.supplierName}`);
  };

  // Submit Scorecard via POST /api/suppliers/:id/scorecards
  const handleSubmitScorecard = async (payload: {
    supplierId: number;
    period: string;
    otifRate: number;
    qualityScore: number;
    complianceScore: number;
    serviceScore: number;
    evaluator: string;
    notes: string;
  }) => {
    const res = await fetch(`/api/suppliers/${payload.supplierId}/scorecards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({
        period: payload.period,
        otifRate: payload.otifRate,
        qualityScore: payload.qualityScore,
        complianceScore: payload.complianceScore,
        serviceScore: payload.serviceScore,
        evaluator: payload.evaluator,
        notes: payload.notes,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Lỗi máy chủ (${res.status})`);
    }

    const json = await res.json();
    onNotify('success', 'Chấm điểm thành công', json.message || 'Đã phát hành thẻ điểm SRM mới.');
    await fetchSuppliers();
  };

  // Select Scorecard & Set Entity Context
  const handleSelectScorecard = (sc: ScorecardItem) => {
    setSelectedScForModal(sc);
    onSelectEntity({
      type: 'SRM_SCORECARD',
      id: sc.id,
      code: sc.id,
      title: sc.supplierName,
      status: sc.status,
      lineage: [
        { id: sc.id, type: 'Thẻ điểm SRM', code: sc.id, relation: 'CURRENT_SCORECARD', status: sc.status },
        { id: 'M11-SRM', type: 'Phân hệ M11', code: 'M11_SRM_MGMT', relation: 'PARENT_MODULE', status: 'ACTIVE' },
        { id: `SUP-${sc.supplierId || '001'}`, type: 'Nhà Cung Cấp M09', code: sc.supplierCode || 'SUP-001', relation: 'SOURCE_SUPPLIER', status: 'ACTIVE' }
      ],
      auditTrail: [
        { id: 1, action: 'INSPECT_SRM_SCORECARD', timestamp: new Date().toISOString(), user: 'admin', sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
      ],
      glEntries: []
    });
    onNotify('info', 'Đã nạp đối tượng', `Đã chọn thẻ điểm ${sc.id} (${sc.supplierName}) vào Thanh Ngữ cảnh Đối Tượng.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvHeader = "ScorecardID,SupplierName,SupplierCode,Period,OTIFRate,QualityScore,ComplianceScore,OverallRating,Status\n";
    const csvRows = scorecards.map(s => `"${s.id}","${s.supplierName}","${s.supplierCode || ''}","${s.period}","${s.otifRate}","${s.qualityScore}","${s.complianceScore}","${s.overallRating}","${s.status}"`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `srm_scorecards_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', 'Đã tải xuống tệp CSV báo cáo hiệu suất SRM Scorecards.');
  };

  // High-level statistics
  const stats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const totalScorecards = scorecards.length;
    const tierACount = suppliers.filter((s) => s.performanceTier?.includes('Tier A')).length;
    const tierBCount = suppliers.filter((s) => s.performanceTier?.includes('Tier B') || !s.performanceTier).length;
    const tierCCount = suppliers.filter((s) => s.performanceTier?.includes('Tier C')).length;

    let totalOtif = 0;
    let totalQuality = 0;
    suppliers.forEach((s) => {
      totalOtif += parseFloat(s.otifRate || '95');
      totalQuality += parseFloat(s.qualityScore || '98');
    });

    const avgOtif = totalSuppliers > 0 ? `${(totalOtif / totalSuppliers).toFixed(1)}%` : '96.5%';
    const avgQuality = totalSuppliers > 0 ? `${(totalQuality / totalSuppliers).toFixed(1)}%` : '98.2%';

    return {
      totalSuppliers,
      totalScorecards,
      tierACount,
      tierBCount,
      tierCCount,
      avgOtif,
      avgQuality,
    };
  }, [suppliers, scorecards]);

  return (
    <div className="space-y-4 pb-12 relative text-slate-800 dark:text-slate-100">
      {/* 1. Header Banner */}
      <M11WorkspaceHeader
        loading={loading}
        onRefresh={fetchSuppliers}
        onExportCSV={handleExportCSV}
        onOpenNewScorecard={() => {
          setPreSelectedSupplierId(undefined);
          setIsNewScModalOpen(true);
        }}
        onOpenNewAudit={() => setIsNewAuditModalOpen(true)}
        onOpenScoringConfig={() => setIsScoringConfigOpen(true)}
        onNavigateToM09={() => {
          window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/suppliers', moduleId: 'M09' } }));
          onNotify('info', 'Chuyển Hướng', 'Đang mở Phân hệ M09 Danh mục Nhà cung cấp & Điều khoản.');
        }}
      />

      {/* 2. DeepLinkBanner to M09 Unified View */}
      <DeepLinkBanner
        targetModule="M09"
        targetRoute="/suppliers"
        title="Tính năng Đánh giá Thẻ điểm NCC (SRM Scorecards) đồng bộ hai chiều với Phân hệ M09 Suppliers SRM"
        description="Toàn bộ hồ sơ đối tác, lịch sử đơn hàng PO (M08) và bảng thẻ điểm hiệu suất NCC (OTIF, Quality, Compliance) được kết nối Single Source of Truth qua API /api/suppliers và outbox transactional events."
        actionText="Mở Danh Mục M09 →"
        badgeText="M09 UNIFIED SRM"
        variant="amber"
        onNavigate={() => {
          sessionStorage.setItem('workspace_tab_M09', JSON.stringify('evaluation'));
          onNotify('info', 'Chuyển hướng SRM', 'Đang mở Tab Đánh giá Thẻ điểm NCC trên Phân hệ M09.');
        }}
      />

      {/* 3. Lifecycle Pipeline (Acts as the primary SRM workflow stage navigator) */}
      <M11LifecyclePipeline
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        scorecardsCount={scorecards.length}
        suppliersCount={suppliers.length}
        contractsCount={contracts.length}
        auditsCount={audits.length}
      />

      {/* 4. Metric Overview Cards */}
      <M11MetricCards
        totalSuppliers={stats.totalSuppliers}
        totalScorecards={stats.totalScorecards}
        avgOtif={stats.avgOtif}
        avgQuality={stats.avgQuality}
        tierACount={stats.tierACount}
        tierBCount={stats.tierBCount}
        tierCCount={stats.tierCCount}
      />

      {/* 5. Active Tab Content */}
      {activeTab === 'scorecards' && (
        <M11ScorecardsTab
          scorecards={scorecards}
          suppliers={suppliers}
          loading={loading}
          onRefresh={fetchSuppliers}
          onSelectScorecard={handleSelectScorecard}
          onOpenNewScorecard={(suppId) => {
            setPreSelectedSupplierId(suppId);
            setIsNewScModalOpen(true);
          }}
        />
      )}

      {activeTab === 'performance' && (
        <M11PerformanceTab
          suppliers={suppliers}
          loading={loading}
          onRefresh={fetchSuppliers}
          onOpenScorecardForSupplier={(suppId) => {
            setPreSelectedSupplierId(suppId);
            setIsNewScModalOpen(true);
          }}
        />
      )}

      {activeTab === 'contracts' && (
        <M11ContractsTab
          contracts={contracts}
          suppliers={suppliers}
          onOpenNewContractModal={() => setIsNewContractModalOpen(true)}
          onOpenRenewModal={(contract) => {
            setSelectedContractForRenew(contract);
            setIsRenewModalOpen(true);
          }}
          onSelectEntity={onSelectEntity}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'audits' && (
        <M11AuditsTab
          audits={audits}
          suppliers={suppliers}
          loading={loading}
          onRefresh={fetchSuppliers}
          onOpenNewAudit={() => setIsNewAuditModalOpen(true)}
        />
      )}

      {activeTab === 'analytics' && (
        <M11AnalyticsTab
          suppliers={suppliers}
          scorecards={scorecards}
          audits={audits}
        />
      )}

      {/* 7. Modals */}
      <M11ScorecardDetailModal
        scorecard={selectedScForModal}
        onClose={() => setSelectedScForModal(null)}
        onNavigateToM09={() => {
          window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/suppliers', moduleId: 'M09' } }));
          onNotify('info', 'Chuyển Hướng', 'Đang mở Phân hệ M09 Danh mục Nhà cung cấp & Điều khoản.');
        }}
      />

      <M11NewScorecardModal
        isOpen={isNewScModalOpen}
        onClose={() => setIsNewScModalOpen(false)}
        suppliers={suppliers}
        preSelectedSupplierId={preSelectedSupplierId}
        onSubmitScorecard={handleSubmitScorecard}
        onNotify={onNotify}
      />

      <M11NewAuditModal
        isOpen={isNewAuditModalOpen}
        onClose={() => setIsNewAuditModalOpen(false)}
        suppliers={suppliers}
        onSubmitAudit={handleSaveAudit}
        onNotify={onNotify}
      />

      <M11RenewContractModal
        isOpen={isRenewModalOpen}
        onClose={() => {
          setIsRenewModalOpen(false);
          setSelectedContractForRenew(null);
        }}
        contract={selectedContractForRenew}
        onRenewSuccess={fetchContracts}
        onNotify={onNotify}
      />

      <M11NewContractModal
        isOpen={isNewContractModalOpen}
        onClose={() => setIsNewContractModalOpen(false)}
        suppliers={suppliers}
        onSuccess={fetchContracts}
        onNotify={onNotify}
      />

      <M11ScoringConfigModal
        isOpen={isScoringConfigOpen}
        onClose={() => setIsScoringConfigOpen(false)}
        onNotify={onNotify}
        onRefresh={fetchSuppliers}
      />

      {/* 8. Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogState.isOpen}
        title={confirmDialogState.title}
        description={confirmDialogState.description}
        confirmText={confirmDialogState.confirmText || 'Xác nhận'}
        variant={confirmDialogState.variant || 'warning'}
        onConfirm={() => {
          confirmDialogState.onConfirm();
          setConfirmDialogState((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialogState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default M11SrmSupplierMgmtWorkspace;
