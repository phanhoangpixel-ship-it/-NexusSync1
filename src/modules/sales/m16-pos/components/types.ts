export interface M16POSWorkspaceProps {
    onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
    onSelectEntity?: (entity: any) => void;
    guidedTask?: any;
}
