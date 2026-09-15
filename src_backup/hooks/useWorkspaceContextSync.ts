import { useEffect, useRef } from 'react';

export interface ContextChangeEventDetail {
  branchId?: number | string | null;
  roleId?: number | null;
  roleName?: string;
  timestamp: number;
}

export const NEXUS_CONTEXT_CHANGED_EVENT = 'nexus:context-changed';

export function dispatchContextChange(detail: ContextChangeEventDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ContextChangeEventDetail>(NEXUS_CONTEXT_CHANGED_EVENT, { detail }));
  }
}

export function useWorkspaceContextSync(onReload: (detail: ContextChangeEventDetail) => void) {
  const reloadRef = useRef(onReload);
  reloadRef.current = onReload;

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ContextChangeEventDetail>;
      if (reloadRef.current) {
        reloadRef.current(customEvent.detail || { timestamp: Date.now() });
      }
    };

    window.addEventListener(NEXUS_CONTEXT_CHANGED_EVENT, handler);
    return () => {
      window.removeEventListener(NEXUS_CONTEXT_CHANGED_EVENT, handler);
    };
  }, []);
}
