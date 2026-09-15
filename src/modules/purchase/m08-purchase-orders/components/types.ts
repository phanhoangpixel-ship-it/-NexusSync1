export interface M08PurchaseOrdersWorkspaceProps {
    onSelectEntity: (entity: SelectedEntityContext) => void;
    onNotify: (type: 'success' | 'danger' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
    guidedTask?: { item: any; timestamp: number } | null;
    selectedEntity?: SelectedEntityContext | null;
    currentUser?: any;
    allowedModules?: string[];
}
