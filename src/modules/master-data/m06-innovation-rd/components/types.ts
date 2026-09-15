export interface M06InnovationRDWorkspaceProps {
    onSelectEntity: (entity: SelectedEntityContext) => void;
    onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export type RDSubTab = 'projects' | 'formulas' | 'patents' | 'trials';
