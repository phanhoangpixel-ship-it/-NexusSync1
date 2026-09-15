import React, { useState, useEffect, useCallback } from 'react';
import { SelectedEntityContext } from '../../types';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import {
  LeadItem,
  OpportunityItem,
  CrmActivityItem,
  CrmQuotationItem,
  CrmAnalyticsData
} from './m12/m12Types';
import { M12WorkspaceHeader } from './m12/M12WorkspaceHeader';
import { M12LifecyclePipeline } from './m12/M12LifecyclePipeline';
import { M12MetricCards } from './m12/M12MetricCards';
import { M12LeadsTab } from './m12/M12LeadsTab';
import { M12PipelineTab } from './m12/M12PipelineTab';
import { M12QuotationsTab } from './m12/M12QuotationsTab';
import { M12ActivitiesTab } from './m12/M12ActivitiesTab';
import { M12AnalyticsTab } from './m12/M12AnalyticsTab';
import { M12NewLeadModal } from './m12/M12NewLeadModal';
import { M12NewQuotationModal } from './m12/M12NewQuotationModal';
import { M12ConvertLeadModal } from './m12/M12ConvertLeadModal';
import { M12LeadDetailModal } from './m12/M12LeadDetailModal';

interface M12CrmLeadsWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M12CrmLeadsWorkspace: React.FC<M12CrmLeadsWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'leads' | 'pipeline' | 'quotations' | 'activities' | 'analytics'>('M12', 'leads');

  // Backend States
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [quotations, setQuotations] = useState<CrmQuotationItem[]>([]);
  const [activities, setActivities] = useState<CrmActivityItem[]>([]);
  const [analytics, setAnalytics] = useState<CrmAnalyticsData | null>(null);

  // Modal States
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isNewQuotationModalOpen, setIsNewQuotationModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isLeadDetailModalOpen, setIsLeadDetailModalOpen] = useState(false);

  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

  // Fetch all CRM data from backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, oppsRes, quotesRes, actsRes, analyticsRes] = await Promise.all([
        fetch('/api/crm/leads'),
        fetch('/api/crm/opportunities'),
        fetch('/api/crm/quotations'),
        fetch('/api/crm/activities'),
        fetch('/api/crm/analytics'),
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(Array.isArray(data) ? data : []);
      }
      if (oppsRes.ok) {
        const data = await oppsRes.json();
        setOpportunities(Array.isArray(data) ? data : []);
      }
      if (quotesRes.ok) {
        const data = await quotesRes.json();
        setQuotations(Array.isArray(data) ? data : []);
      }
      if (actsRes.ok) {
        const data = await actsRes.json();
        setActivities(Array.isArray(data) ? data : []);
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load CRM data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lead selection & Context inspector syncing
  const handleSelectLead = (lead: LeadItem) => {
    setSelectedLead(lead);
    setIsLeadDetailModalOpen(true);

    onSelectEntity({
      type: 'CRM_LEAD',
      id: String(lead.id),
      code: lead.leadCode,
      title: lead.company,
      status: lead.status,
      lineage: [
        { id: String(lead.id), type: 'Khách hàng tiềm năng CRM', code: lead.leadCode, relation: 'CURRENT_LEAD', status: lead.status },
        { id: 'M12-CRM', type: 'Phân hệ M12', code: 'M12_CRM_LEADS', relation: 'PARENT_MODULE', status: 'ACTIVE' },
        { id: 'M03-CUST', type: 'Khách hàng Master Data', code: 'M03_CUSTOMERS', relation: 'TARGET_ENTITY', status: lead.status === 'WON' ? 'CONVERTED' : 'PROSPECT' },
      ],
      auditTrail: [
        {
          id: 1,
          action: 'INSPECT_CRM_LEAD_360',
          timestamp: new Date().toISOString(),
          user: lead.salespersonName || 'admin',
          sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
      ],
      glEntries: [],
    });
    onNotify('info', 'Đã tải hồ sơ Lead 360°', `Đã chọn ${lead.company} (${lead.leadCode}) vào Thanh Ngữ cảnh Đối Tượng.`);
  };

  // Create new lead
  const handleCreateLead = async (leadData: Partial<LeadItem>) => {
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo Lead');

      onNotify('success', 'Tiếp nhận Lead thành công', data.message || `Đã thêm ${leadData.company}`);
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tiếp nhận Lead', err.message);
    }
  };

  // Update lead status
  const handleUpdateLeadStatus = async (leadId: number, status: LeadItem['status']) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái Lead');
      onNotify('success', 'Cập nhật giai đoạn thành công', `Đã chuyển Lead #${leadId} sang trạng thái ${status}.`);
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi cập nhật', err.message);
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: number) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Không thể xóa Lead');
      onNotify('info', 'Đã xóa Lead', `Lead #${leadId} đã được xóa khỏi hệ thống.`);
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi xóa Lead', err.message);
    }
  };

  // Convert lead to B2B Customer (M03)
  const handleConfirmConvert = async (leadId: number, conversionPayload: any) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversionPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể chuyển đổi Lead');

      onNotify('success', 'Chuyển đổi B2B thành công!', data.message);
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi chuyển đổi', err.message);
    }
  };

  // Create new quotation
  const handleCreateQuotation = async (quotationData: any) => {
    try {
      const res = await fetch('/api/crm/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotationData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể lập báo giá');

      onNotify('success', 'Lập Báo Giá thành công', data.message || `Đã phát hành báo giá ${quotationData.title}`);
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi phát hành báo giá', err.message);
    }
  };

  // Update quotation status
  const handleUpdateQuotationStatus = async (quotationId: number, status: CrmQuotationItem['status']) => {
    try {
      const res = await fetch(`/api/crm/quotations/${quotationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái Báo giá');
      onNotify('success', 'Cập nhật Báo Giá', `Trạng thái báo giá #${quotationId} đã cập nhật thành ${status}.`);
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi cập nhật', err.message);
    }
  };

  // Convert Quotation directly to Sales Order (M13)
  const handleConvertQuotationToSO = async (quotationId: number) => {
    try {
      const res = await fetch(`/api/crm/quotations/${quotationId}/convert-to-so`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi chuyển đổi Báo giá sang Đơn bán hàng SO');

      onNotify('success', 'Chốt Đơn Bán Hàng M13 thành công!', data.message);
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi chuyển đổi sang SO', err.message);
    }
  };

  // Add CRM Activity
  const handleAddActivity = async (activityData: Partial<CrmActivityItem>) => {
    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi ghi nhận hoạt động');

      onNotify('success', 'Ghi nhận thành công', `Đã thêm hoạt động: ${activityData.subject}`);
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi ghi nhận', err.message);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvHeader = 'Mã Lead,Công Ty,Người Liên Hệ,Email,Số Điện Thoại,Nguồn,Giai Đoạn,Quy Mô Dự Kiến (VND),Phụ Trách\n';
    const csvRows = leads
      .map(
        (l) =>
          `"${l.leadCode}","${l.company}","${l.name}","${l.email || ''}","${l.phone || ''}","${l.source}","${l.status}","${l.value}","${l.salespersonName || 'Admin'}"`
      )
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crm_leads_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', 'Đã tải xuống tệp CSV danh sách Leads & Pipeline CRM.');
  };

  const totalPipelineValue = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  const wonCount = leads.filter((l) => l.status === 'WON').length;
  const winRate = leads.length > 0 ? `${((wonCount / leads.length) * 100).toFixed(1)}%` : '0%';
  const totalQuotationsValue = quotations.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);

  return (
    <div className="space-y-6 pb-12 relative">
      {/* 1. Header Banner */}
      <M12WorkspaceHeader
        loading={loading}
        onRefresh={fetchData}
        onOpenNewLead={() => setIsNewLeadModalOpen(true)}
        onOpenNewQuotation={() => {
          setSelectedLead(null);
          setIsNewQuotationModalOpen(true);
        }}
        onExportCSV={handleExportCSV}
      />

      {/* 2. Top Metric Cards */}
      <M12MetricCards
        totalLeads={leads.length}
        totalPipelineValue={totalPipelineValue}
        winRate={winRate}
        totalQuotations={quotations.length}
        totalQuotationsValue={totalQuotationsValue}
      />

      {/* 3. Lifecycle Pipeline Navigator (Single Stage Navigator) */}
      <M12LifecyclePipeline
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        leadsCount={leads.length}
        oppsCount={opportunities.length}
        quotationsCount={quotations.length}
        activitiesCount={activities.length}
      />

      {/* 4. Active Tab Content */}
      {activeTab === 'leads' && (
        <M12LeadsTab
          leads={leads}
          onSelectLead={handleSelectLead}
          onOpenConvertModal={(lead) => {
            setSelectedLead(lead);
            setIsConvertModalOpen(true);
          }}
          onOpenNewQuotationForLead={(lead) => {
            setSelectedLead(lead);
            setIsNewQuotationModalOpen(true);
          }}
          onUpdateLeadStatus={handleUpdateLeadStatus}
          onDeleteLead={handleDeleteLead}
          onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
          onSelectEntity={onSelectEntity}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'pipeline' && (
        <M12PipelineTab
          leads={leads}
          opportunities={opportunities}
          onUpdateLeadStatus={handleUpdateLeadStatus}
          onSelectLead={handleSelectLead}
          onOpenConvertModal={(lead) => {
            setSelectedLead(lead);
            setIsConvertModalOpen(true);
          }}
        />
      )}

      {activeTab === 'quotations' && (
        <M12QuotationsTab
          quotations={quotations}
          onOpenNewQuotationModal={() => {
            setSelectedLead(null);
            setIsNewQuotationModalOpen(true);
          }}
          onConvertToSalesOrder={handleConvertQuotationToSO}
          onUpdateQuotationStatus={handleUpdateQuotationStatus}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'activities' && (
        <M12ActivitiesTab
          activities={activities}
          leads={leads}
          onAddActivity={handleAddActivity}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'analytics' && (
        <M12AnalyticsTab
          leads={leads}
          quotations={quotations}
        />
      )}

      {/* 5. Modals */}
      <M12NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onSubmit={handleCreateLead}
        onNotify={onNotify}
      />

      <M12NewQuotationModal
        isOpen={isNewQuotationModalOpen}
        preselectedLead={selectedLead}
        leads={leads}
        onClose={() => setIsNewQuotationModalOpen(false)}
        onSubmit={handleCreateQuotation}
        onNotify={onNotify}
      />

      <M12ConvertLeadModal
        isOpen={isConvertModalOpen}
        lead={selectedLead}
        onClose={() => setIsConvertModalOpen(false)}
        onConfirmConvert={handleConfirmConvert}
        onNotify={onNotify}
      />

      <M12LeadDetailModal
        isOpen={isLeadDetailModalOpen}
        lead={selectedLead}
        activities={activities}
        quotations={quotations}
        onClose={() => setIsLeadDetailModalOpen(false)}
        onOpenConvertModal={(lead) => {
          setSelectedLead(lead);
          setIsConvertModalOpen(true);
        }}
        onOpenNewQuotationForLead={(lead) => {
          setSelectedLead(lead);
          setIsNewQuotationModalOpen(true);
        }}
        onUpdateLeadStatus={handleUpdateLeadStatus}
      />
    </div>
  );
};

export default M12CrmLeadsWorkspace;
