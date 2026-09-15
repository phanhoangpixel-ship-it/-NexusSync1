export interface M30GeneralLedgerWorkspaceProps {
    onSelectEntity?: (entity: any) => void;
    onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message?: string) => void;
}
