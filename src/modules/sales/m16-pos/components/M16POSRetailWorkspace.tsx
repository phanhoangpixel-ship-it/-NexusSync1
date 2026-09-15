import React from 'react';
import { M16POSWorkspace } from './M16POSWorkspace';

interface M16POSRetailWorkspaceProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onSelectEntity?: (entity: any) => void;
  guidedTask?: any;
}

export const M16POSRetailWorkspace: React.FC<M16POSRetailWorkspaceProps> = ({ onNotify, onSelectEntity, guidedTask }) => {
  return <M16POSWorkspace onNotify={onNotify} onSelectEntity={onSelectEntity} guidedTask={guidedTask} />;
};

export default M16POSRetailWorkspace;

