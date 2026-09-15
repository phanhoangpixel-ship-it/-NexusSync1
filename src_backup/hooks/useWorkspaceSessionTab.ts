import { useState, useCallback } from 'react';

/**
 * Hook to persist and restore active tabs within each Workspace module in sessionStorage.
 * Storage key format: `nexus_workspace_tab_${moduleId}` or customKey
 *
 * When switching between modules in long sessions, the previously selected tab
 * in each workspace is seamlessly remembered and restored.
 */
export function useWorkspaceSessionTab<T extends string>(
  moduleId: string,
  defaultTab: T,
  customKey?: string
): [T, (tab: T) => void] {
  const storageKey = customKey
    ? `nexus_workspace_tab_${customKey}`
    : `nexus_workspace_tab_${moduleId}`;

  const [activeTab, setActiveTabState] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const saved = window.sessionStorage.getItem(storageKey);
        if (saved) {
          return saved as T;
        }
      }
    } catch (e) {
      console.warn(`[NexusSync] Error reading tab for workspace ${moduleId}:`, e);
    }
    return defaultTab;
  });

  const setActiveTab = useCallback(
    (tab: T) => {
      setActiveTabState(tab);
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(storageKey, tab);
        }
      } catch (e) {
        console.warn(`[NexusSync] Error persisting tab for workspace ${moduleId}:`, e);
      }
    },
    [storageKey, moduleId]
  );

  return [activeTab, setActiveTab];
}
