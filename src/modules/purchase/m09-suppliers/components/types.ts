export interface M09SuppliersSRMWorkspaceProps {
    onSelectEntity: (entity: SelectedEntityContext) => void;
    onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
    currentUser?: UserSession;
    allowedModules?: string[];
}
