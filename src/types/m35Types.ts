export type ProjectStatus = 'DRAFT' | 'PLANNED' | 'APPROVED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CLOSED';
export type ProjectCategory = 'EPC_CONSTRUCTION' | 'ERP_IT' | 'RD_INNOVATION' | 'INFRASTRUCTURE' | 'SERVICE_CONSULTING';
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface ProjectMaster {
  id: string;
  code: string;
  name: string;
  category: ProjectCategory;
  client: string;
  manager: string;
  branch: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  currency: string;
  contractNumber?: string;
  businessUnit: string;
  
  // Budget & Financials
  contractValueVND: number; // Revenue
  budgetVND: number; // BAC
  committedCostVND: number;
  actualCostVND: number;
  progressPct: number;
  
  // Job Costing Breakdown
  laborCostVND: number;
  materialCostVND: number;
  equipmentCostVND: number;
  externalServiceCostVND: number;
  overheadCostVND: number;

  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  description?: string;
  charterObjective?: string;
  scopeSummary?: string;
}

export interface WbsNode {
  id: string;
  projectId: string;
  code: string; // e.g., 1.0, 1.1, 1.1.1
  name: string;
  level: 1 | 2 | 3 | 4; // Phase -> Work Package -> Task -> Subtask
  parentId?: string;
  assignee: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  plannedCostVND: number;
  actualCostVND: number;
  progressPct: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  isCriticalPath?: boolean;
  isMilestone?: boolean;
  deliverable?: string;
  dependencyCode?: string; // Code of dependent task
  dependencyType?: DependencyType;
}

export interface ResourceItem {
  id: string;
  name: string;
  role: string;
  type: 'PEOPLE' | 'EQUIPMENT' | 'MATERIAL';
  unitRateVND: number; // Hourly rate for people, daily rate for equipment, unit cost for material
  allocatedHours: number;
  capacityHours: number;
  assignedTasksCount: number;
}

export interface TimesheetEntry {
  id: string;
  projectId: string;
  employeeName: string;
  wbsCode: string;
  wbsTaskName: string;
  date: string;
  hoursLogged: number;
  hourlyRateVND: number;
  laborCostVND: number;
  notes: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  code: string;
  name: string;
  category: 'CHARTER' | 'CONTRACT' | 'DESIGN_SPEC' | 'DELIVERABLE' | 'UAT_REPORT';
  uploadedBy: string;
  uploadDate: string;
  size: string;
  status: 'APPROVED' | 'DRAFT' | 'ARCHIVED';
}

export interface ProjectRiskItem {
  id: string;
  projectId: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigation: string;
  owner: string;
  status: 'OPEN' | 'MITIGATED' | 'CLOSED';
}
