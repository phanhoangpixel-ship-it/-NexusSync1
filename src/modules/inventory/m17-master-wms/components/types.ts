export interface MasterWmsWorkspaceProps {
    onSelectEntity: (entity: SelectedEntityContext) => void;
    onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
    guidedTask?: { item: any; timestamp: number } | null;
    selectedEntity?: SelectedEntityContext | null;
}
