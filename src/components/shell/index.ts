/**
 * NexusSync ERP - L1-L4 Architecture Shell Index
 *
 * L1: GlobalHeader Layer (Persistent)
 * L2: PrimaryNavigation Layer (Sidebar, 6 Domain groups, 29+ workspaces)
 * L3: ContextRail Layer (Domain-Specific companion: actions, filters, stats, audit & ledger)
 * L4: DomainWorkspaceShell Layer (Reusable shell + EnterpriseTable, FormModal, ConfirmDialog)
 */

export { GlobalHeader } from './GlobalHeader';
export { PrimaryNavigation } from './PrimaryNavigation';
export { ContextRail } from './ContextRail';
export type { WorkspaceActionItem, SavedViewItem, QuickStatItem } from './ContextRail';
export { DomainWorkspaceShell, WorkspaceActionContext, useWorkspaceAction } from './DomainWorkspaceShell';
export { BranchSelector } from './BranchSelector';
export { EnvironmentProfileSelector } from './EnvironmentProfileSelector';
export { RoleSwitcher } from './RoleSwitcher';

// Reusable L4 Building Blocks for Workspaces
export { EnterpriseTable } from '../common/EnterpriseTable';
export type { ColumnDef, EnterpriseTableProps } from '../common/EnterpriseTable';
export { FormModal } from '../common/FormModal';
export type { FormModalProps } from '../common/FormModal';
export { ConfirmDialog } from '../common/ConfirmDialog';
