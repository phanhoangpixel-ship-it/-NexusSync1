export interface LeadItem {
  id: number;
  leadCode: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  source: 'WEBSITE' | 'REFERRAL' | 'EVENT' | 'COLD_CALL' | 'SOCIAL_MEDIA' | 'DIRECT_INQUIRY' | string;
  interest?: string;
  salespersonName?: string;
  value: number;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  createdAt?: string;
}

export interface OpportunityItem {
  id: number;
  code: string;
  leadId?: number;
  customerId?: number;
  customerName?: string;
  name: string;
  value: number;
  probability: number;
  expectedCloseDate?: string;
  salespersonName?: string;
  stage: 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  createdAt?: string;
}

export interface CrmActivityItem {
  id: number;
  leadId?: number;
  customerId?: number;
  activityType: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'VISIT' | 'CHAT';
  subject: string;
  description?: string;
  performedBy: string;
  date: string;
  createdAt?: string;
}

export interface QuotationLineItem {
  id?: number;
  productId?: number;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  total: number;
}

export interface CrmQuotationItem {
  id: number;
  quotationCode: string;
  leadId?: number;
  customerId?: number;
  customerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  title: string;
  issueDate: string;
  validUntil: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentTerms: string;
  deliveryTerms: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED_TO_SO';
  convertedSalesOrderId?: number;
  convertedSalesOrderCode?: string;
  salespersonName?: string;
  itemsPayload?: string;
  notes?: string;
  createdAt?: string;
}

export interface CrmAnalyticsData {
  totalLeads: number;
  totalPipelineValue: number;
  winRate: string;
  wonCount: number;
  totalQuotations: number;
  totalQuotationsValue: number;
  stageBreakdown: {
    NEW: number;
    CONTACTED: number;
    QUALIFIED: number;
    PROPOSAL: number;
    NEGOTIATION: number;
    WON: number;
    LOST: number;
  };
  opportunitiesCount: number;
}
