export type DmsSubTab = 
  | 'vault' 
  | 'attachments' 
  | 'retention_hold' 
  | 'signing_seal' 
  | 'integrity_audit' 
  | 'missing_reports';

export enum DmsClassification {
  PUBLIC = "PUBLIC",
  INTERNAL = "INTERNAL",
  CONFIDENTIAL = "CONFIDENTIAL",
  RESTRICTED = "RESTRICTED",
}

export enum DmsStatus {
  DRAFT = "DRAFT",
  APPROVED = "APPROVED",
  SIGNED = "SIGNED",
  SEALED = "SEALED",
  SUPERSEDED = "SUPERSEDED",
  DISPOSED = "DISPOSED",
}

export enum DmsStorageTier {
  ACTIVE_VAULT = "ACTIVE_VAULT",
  COLD_GLACIER = "COLD_GLACIER",
}

export interface DmsWorkflowStep {
  step: number;
  name: string;
  role: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  user: string | null;
  signedAt: string | null;
}

export interface DmsDocument {
  id: number;
  docCode: string;
  title: string;
  category: string;
  categoryName: string;
  version: string;
  fileSize: string;
  format: string;
  status: DmsStatus;
  classification: DmsClassification;
  securityLevel?: string | null;
  sha256Hash: string | null;
  signedBy?: string | null;
  signedAt?: string | null;
  linkedModule?: string | null;
  refDocNo?: string | null;
  storageTier?: string | null;
  retentionYears?: number | null;
  expireDate?: string | null;
  workflowStage?: number | null;
  workflowSteps?: string | null;
  createdAt?: string | Date | null;

  entityType: string | null;
  entityId: string | null;
  retentionClass?: string | null;
  retentionUntil: string | Date | null;
  legalHold: boolean;
  supersedesId: number | null;
  hashScope?: string | null;
  sizeBytes?: number | null;
  mimeType?: string | null;
  idempotencyKey?: string | null;
  fileContentBase64?: string | null;
}

export interface RetentionPolicy {
  id: number;
  name: string;
  category: string;
  retentionYears: number;
  isDefault: boolean;
  description?: string | null;
}

export interface ESignatureRecord {
  id: number;
  docId: number;
  signerId?: number | null;
  signerName: string;
  signatureType: 'INTERNAL' | 'LEGAL_CA';
  hashValue: string;
  certificateSerial?: string | null;
  signedAt: string | Date;
}

export interface DmsArchiveRecord {
  id: number;
  docId: number;
  archivePath: string;
  archiveTier: string;
  archivedAt: string | Date;
}

export interface MissingAttachmentReportItem {
  id: string;
  module: string;
  moduleName: string;
  entityType: string;
  entityId: string;
  docNumber: string;
  title: string;
  date: string;
  creator: string;
  amount?: number | null;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedCategory: string;
  status: 'PENDING_UPLOAD';
}
