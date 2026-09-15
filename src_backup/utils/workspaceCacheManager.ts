/**
 * NexusSync ERP - Enterprise Workspace Memory & Cache Manager
 * Automatic Cache Eviction & Garbage Collection for Unmounted/Closed Workspaces
 */

export interface WorkspaceCacheItem {
  moduleId: string;
  moduleName: string;
  domain: string;
  lastActive: number;
  isMounted: boolean;
  estimatedMemoryKB: number;
  cachedDataCount: number;
  cleanupCount: number;
}

export interface CacheManagerStats {
  totalCachedWorkspaces: number;
  activeWorkspacesCount: number;
  inactiveWorkspacesCount: number;
  estimatedTotalMemoryMB: number;
  estimatedFreedMemoryMB: number;
  totalCleaningCycles: number;
  lastCleanedAt: number | null;
  autoCleaningEnabled: boolean;
  retentionMinutes: number;
}

type StatsListener = (stats: CacheManagerStats) => void;

class WorkspaceCacheManager {
  private cacheRegistry = new Map<string, WorkspaceCacheItem>();
  private listeners = new Set<StatsListener>();
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
  private autoCleaningEnabled: boolean = true;
  private retentionMinutes: number = 3; // Default 3 minutes before inactive cache is evicted
  private maxInactiveWorkspaces: number = 3;
  private totalFreedMemoryMB: number = 0;
  private totalCleaningCycles: number = 0;
  private lastCleanedAt: number | null = null;

  constructor() {
    this.startPeriodicAutoCleanup();
  }

  /**
   * Configure cache manager parameters from System Preferences
   */
  public configure(options: {
    autoCleaningEnabled?: boolean;
    retentionMinutes?: number;
    maxInactiveWorkspaces?: number;
  }) {
    if (options.autoCleaningEnabled !== undefined) {
      this.autoCleaningEnabled = options.autoCleaningEnabled;
    }
    if (options.retentionMinutes !== undefined) {
      this.retentionMinutes = options.retentionMinutes;
    }
    if (options.maxInactiveWorkspaces !== undefined) {
      this.maxInactiveWorkspaces = options.maxInactiveWorkspaces;
    }

    if (this.autoCleaningEnabled && !this.cleanupIntervalId) {
      this.startPeriodicAutoCleanup();
    } else if (!this.autoCleaningEnabled && this.cleanupIntervalId) {
      this.stopPeriodicAutoCleanup();
    }

    this.notifyListeners();
  }

  /**
   * Register or mark a workspace as active / mounted
   */
  public markWorkspaceActive(moduleId: string, moduleName: string, domain: string, estimatedKB: number = 15360) {
    const existing = this.cacheRegistry.get(moduleId);
    const now = Date.now();

    if (existing) {
      existing.isMounted = true;
      existing.lastActive = now;
      existing.estimatedMemoryKB = Math.max(existing.estimatedMemoryKB, estimatedKB);
    } else {
      this.cacheRegistry.set(moduleId, {
        moduleId,
        moduleName,
        domain,
        lastActive: now,
        isMounted: true,
        estimatedMemoryKB: estimatedKB,
        cachedDataCount: 1,
        cleanupCount: 0,
      });
    }

    // Automatically check if other closed workspaces need eviction
    if (this.autoCleaningEnabled) {
      this.checkAndEvictOldWorkspaces(moduleId);
    }

    this.notifyListeners();
  }

  /**
   * Mark a workspace as closed / unmounted
   */
  public markWorkspaceInactive(moduleId: string) {
    const existing = this.cacheRegistry.get(moduleId);
    if (existing) {
      existing.isMounted = false;
      existing.lastActive = Date.now();
    }

    if (this.autoCleaningEnabled) {
      // Run eviction check
      this.checkAndEvictOldWorkspaces();
    }

    this.notifyListeners();
  }

  /**
   * Check inactive workspaces and evict those that exceed TTL or Max Count
   */
  public checkAndEvictOldWorkspaces(currentActiveModuleId?: string): { evictedModules: string[]; freedMB: number } {
    const now = Date.now();
    const ttlMs = this.retentionMinutes * 60 * 1000;
    const evictedModules: string[] = [];
    let freedKB = 0;

    // 1. Evict by TTL for inactive workspaces
    const inactiveWorkspaces: WorkspaceCacheItem[] = [];
    for (const [modId, item] of this.cacheRegistry.entries()) {
      if (!item.isMounted && modId !== currentActiveModuleId) {
        if (now - item.lastActive >= ttlMs) {
          freedKB += this.purgeSingleWorkspaceMemory(modId);
          evictedModules.push(modId);
        } else {
          inactiveWorkspaces.push(item);
        }
      }
    }

    // 2. If remaining inactive workspaces exceed max limit, evict LRU (Least Recently Used)
    if (inactiveWorkspaces.length > this.maxInactiveWorkspaces) {
      // Sort oldest first
      inactiveWorkspaces.sort((a, b) => a.lastActive - b.lastActive);
      const toEvict = inactiveWorkspaces.slice(0, inactiveWorkspaces.length - this.maxInactiveWorkspaces);

      for (const item of toEvict) {
        if (!evictedModules.includes(item.moduleId)) {
          freedKB += this.purgeSingleWorkspaceMemory(item.moduleId);
          evictedModules.push(item.moduleId);
        }
      }
    }

    const freedMB = Number((freedKB / 1024).toFixed(2));
    if (evictedModules.length > 0) {
      this.totalFreedMemoryMB += freedMB;
      this.totalCleaningCycles += 1;
      this.lastCleanedAt = now;
      this.triggerGarbageCollection();
      this.notifyListeners();
    }

    return { evictedModules, freedMB };
  }

  /**
   * Internal purge for a specific workspace memory footprint
   */
  private purgeSingleWorkspaceMemory(moduleId: string): number {
    const item = this.cacheRegistry.get(moduleId);
    if (!item) return 0;

    const memoryKB = item.estimatedMemoryKB;
    
    // Clear any module-specific session caches / temporary filter state
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        // Exclude lightweight tab state (nexus_workspace_tab_) from eviction so tabs remain remembered
        if (
          key &&
          !key.startsWith('nexus_workspace_tab_') &&
          (key.includes(moduleId) || key.startsWith(`nexus_cache_${moduleId}`))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // Ignore storage errors in restricted contexts
    }

    // Dispatch DOM custom event so any active workspace instances can clean up blobs/canvases
    try {
      window.dispatchEvent(
        new CustomEvent('nexus:workspace-cache-purged', {
          detail: { moduleId, timestamp: Date.now() },
        })
      );
    } catch {}

    // Delete or mark evicted from registry
    this.cacheRegistry.delete(moduleId);
    return memoryKB;
  }

  /**
   * Manually purge all inactive/closed workspaces immediately
   */
  public purgeAllInactiveWorkspaces(): { count: number; freedMB: number } {
    let freedKB = 0;
    let count = 0;
    const now = Date.now();

    for (const [modId, item] of Array.from(this.cacheRegistry.entries())) {
      if (!item.isMounted) {
        freedKB += this.purgeSingleWorkspaceMemory(modId);
        count++;
      }
    }

    const freedMB = Number((freedKB / 1024).toFixed(2));
    if (count > 0) {
      this.totalFreedMemoryMB += freedMB;
      this.totalCleaningCycles += 1;
      this.lastCleanedAt = now;
      this.triggerGarbageCollection();
      this.notifyListeners();
    }

    return { count, freedMB };
  }

  /**
   * Browser GC trigger hint
   */
  private triggerGarbageCollection() {
    // If running in environment with window.gc enabled (Chromium flag)
    if (typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch {}
    }
  }

  /**
   * Periodic background check for long-running sessions (runs every 30s)
   */
  private startPeriodicAutoCleanup() {
    if (this.cleanupIntervalId) return;

    this.cleanupIntervalId = setInterval(() => {
      if (this.autoCleaningEnabled) {
        // Use requestIdleCallback if available to avoid UI jank during busy tasks
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            this.checkAndEvictOldWorkspaces();
          });
        } else {
          this.checkAndEvictOldWorkspaces();
        }
      }
    }, 30000);
  }

  private stopPeriodicAutoCleanup() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Get current statistics
   */
  public getStats(): CacheManagerStats {
    let totalKB = 0;
    let activeCount = 0;
    let inactiveCount = 0;

    for (const item of this.cacheRegistry.values()) {
      totalKB += item.estimatedMemoryKB;
      if (item.isMounted) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    }

    // Try reading real Chrome performance.memory if accessible
    let estimatedTotalMB = Number((totalKB / 1024).toFixed(2));
    if (typeof window !== 'undefined' && (performance as any).memory) {
      const usedJSHeap = (performance as any).memory.usedJSHeapSize;
      if (usedJSHeap) {
        estimatedTotalMB = Number((usedJSHeap / (1024 * 1024)).toFixed(2));
      }
    }

    return {
      totalCachedWorkspaces: this.cacheRegistry.size,
      activeWorkspacesCount: activeCount,
      inactiveWorkspacesCount: inactiveCount,
      estimatedTotalMemoryMB: estimatedTotalMB,
      estimatedFreedMemoryMB: Number(this.totalFreedMemoryMB.toFixed(2)),
      totalCleaningCycles: this.totalCleaningCycles,
      lastCleanedAt: this.lastCleanedAt,
      autoCleaningEnabled: this.autoCleaningEnabled,
      retentionMinutes: this.retentionMinutes,
    };
  }

  /**
   * Subscribe to cache stats changes
   */
  public subscribe(listener: StatsListener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener(this.getStats());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const stats = this.getStats();
    this.listeners.forEach((listener) => {
      try {
        listener(stats);
      } catch (err) {
        console.error('Error in cache stats listener:', err);
      }
    });
  }
}

// Export singleton instance
export const workspaceCacheManager = new WorkspaceCacheManager();
