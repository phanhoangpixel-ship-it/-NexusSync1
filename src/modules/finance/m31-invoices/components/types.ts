export interface M31InvoicesArApWorkspaceProps {
    onSelectEntity?: (entity: any) => void;
    onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message?: string) => void;
}
