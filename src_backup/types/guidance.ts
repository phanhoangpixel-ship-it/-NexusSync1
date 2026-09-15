// NexusSync ERP — Cross-Cutting Business Guidance & Next Best Action Types
// Strictly respects Core ERP as Source of Truth, Single-Writer Authorities, and RBAC

import { UserSession } from './index';

export type BusinessDomainCategory = 
  | 'P2P' 
  | 'O2C' 
  | 'INVENTORY' 
  | 'RETURNS' 
  | 'MANUFACTURING' 
  | 'FINANCE' 
  | 'ASSET_MAINTENANCE' 
  | 'LOGISTICS';

export type UserExpertiseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export interface BusinessGuidanceContext {
  user: UserSession;
  currentBranch: string;
  currentWarehouse?: string;
  currentModuleId: string;
  currentModuleName: string;
  selectedEntity?: {
    type: string;
    id: string | number;
    code: string;
    status: string;
    data?: any;
  } | null;
  permissions: string[];
}

export interface DisambiguationChoice {
  id: string;
  title: string;
  description: string;
  targetModuleId: string;
  targetModuleName: string;
  targetRoute: string;
  suggestedAction: string;
  businessReason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warningMessage?: string;
}

export interface BusinessIntentResult {
  intentId: string;
  rawQuery: string;
  recognizedIntent: string;
  category: BusinessDomainCategory;
  suggestedProcess: string;
  targetModuleId: string;
  targetModuleName: string;
  targetRoute: string;
  confidence: number;
  requiresDisambiguation: boolean;
  disambiguationPrompt?: string;
  choices: DisambiguationChoice[];
  businessReason: string;
}

export interface ActionContract {
  actionId: string;
  label: string;
  purpose: string;
  requiredState: string[];
  requiredPermission: string[];
  preconditions: string[];
  targetModuleId: string;
  targetRoute: string;
  executionEndpoint?: string;
  executionMethod?: 'GET' | 'POST' | 'PUT' | 'MODAL';
  expectedResult: string;
  resultingState: string;
  businessReason: string;
  warnings?: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresConfirmation: boolean;
  coreEngine: string;
  databaseEffect: string;
  auditRequirement: string;
}

export interface NextBestAction {
  actionId: string;
  label: string;
  category: string;
  businessReason: string;
  preconditions: string[];
  expectedResult: string;
  resultingState: string;
  targetModuleId: string;
  targetRoute: string;
  contract: ActionContract;
  isExecutable: boolean;
  blockedReason?: string;
  priority: 'PRIMARY' | 'SECONDARY' | 'OPTIONAL';
  disclosure: {
    beginner: {
      nextStepTitle: string;
      actionButtonText: string;
      simpleGuidance: string;
    };
    intermediate: {
      whyReason: string;
      expectedOutcome: string;
      impactSummary: string;
    };
    expert: {
      businessRules: string[];
      coreEngine: string;
      apiEndpoint: string;
      databaseEffect: string;
      auditRule: string;
      eventTriggered?: string;
    };
  };
}

export interface EntityBusinessState {
  entityType: string;
  entityId: string | number;
  entityCode: string;
  currentState: string;
  stateLabel: string;
  allowedTransitions: string[];
  blockedTransitions: { state: string; reason: string }[];
  availableActions: ActionContract[];
  blockedActions: { action: ActionContract; reason: string }[];
  journeyId?: string;
  currentStepIndex?: number;
  totalSteps?: number;
}

export interface BusinessGpsStep {
  stepIndex: number;
  name: string;
  code: string;
  moduleId: string;
  moduleName: string;
  status: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'BLOCKED';
  preconditions: string[];
  output: string;
  allowedRoles: string[];
}

export interface BusinessJourneyTracker {
  id: string;
  name: string;
  code: string;
  category: BusinessDomainCategory;
  description: string;
  totalSteps: number;
  currentStepIndex: number;
  steps: BusinessGpsStep[];
  currentActionSummary: string;
  remainingStepsCount: number;
  nextStepRequirement: string;
}

export interface BusinessGuardAlert {
  isMisaligned: boolean;
  currentModuleId: string;
  currentModuleName: string;
  detectedIntent: string;
  suggestedModuleId: string;
  suggestedModuleName: string;
  suggestedRoute: string;
  reason: string;
  correctJourney: string;
  actionChoices: {
    label: string;
    targetModuleId: string;
    targetRoute: string;
  }[];
}

export interface MyWorkPendingItem {
  id: string;
  sourceModuleId: string;
  sourceModuleName: string;
  entityType: string;
  entityId: string | number;
  businessReference: string;
  title: string;
  currentState: string;
  stateLabel: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueTimeText: string;
  isOverdue: boolean;
  amountText?: string;
  nextAction: NextBestAction;
  targetRoute: string;
}
