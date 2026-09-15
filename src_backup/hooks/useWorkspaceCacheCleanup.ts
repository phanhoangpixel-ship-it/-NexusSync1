import { useEffect, useRef } from 'react';
import { workspaceCacheManager } from '../utils/workspaceCacheManager';

interface UseWorkspaceCacheCleanupOptions {
  moduleId: string;
  moduleName: string;
  domain: string;
  estimatedMemoryKB?: number;
  onEvict?: () => void;
}

/**
 * Hook to automatically register a Workspace component with the WorkspaceCacheManager
 * and clean up detached memory / references when unmounted or evicted.
 */
export function useWorkspaceCacheCleanup({
  moduleId,
  moduleName,
  domain,
  estimatedMemoryKB = 16384, // ~16MB estimated per rich ERP module
  onEvict,
}: UseWorkspaceCacheCleanupOptions) {
  const onEvictRef = useRef(onEvict);
  onEvictRef.current = onEvict;

  useEffect(() => {
    // 1. Mark workspace as active when mounted
    workspaceCacheManager.markWorkspaceActive(moduleId, moduleName, domain, estimatedMemoryKB);

    // 2. Listen for eviction events
    const handleEviction = (event: Event) => {
      const customEvent = event as CustomEvent<{ moduleId: string; timestamp: number }>;
      if (customEvent.detail && customEvent.detail.moduleId === moduleId) {
        if (onEvictRef.current) {
          onEvictRef.current();
        }
      }
    };

    window.addEventListener('nexus:workspace-cache-purged', handleEviction);

    // 3. Mark as inactive when unmounting
    return () => {
      workspaceCacheManager.markWorkspaceInactive(moduleId);
      window.removeEventListener('nexus:workspace-cache-purged', handleEviction);
    };
  }, [moduleId, moduleName, domain, estimatedMemoryKB]);
}
