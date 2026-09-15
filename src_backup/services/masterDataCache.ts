/**
 * NexusSync ERP - Enterprise Master Data In-Memory Caching Layer
 * High-performance, TTL-managed, reactive in-memory cache with atomic invalidation.
 * 
 * Target Master Data Domains:
 * 1. Products (Enriched with stock balance rollups & categories)
 * 2. Categories
 * 3. Product UOMs
 * 4. Customers
 * 5. Suppliers
 * 6. Warehouses & Locations
 * 7. Chart of Accounts (COA - TT200)
 */

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  hits: number;
  tags: string[];
}

export interface CacheMetrics {
  totalHits: number;
  totalMisses: number;
  hitRatio: number;
  keysCount: number;
  keys: {
    key: string;
    hits: number;
    ageSeconds: number;
    ttlRemainingSeconds: number;
    tags: string[];
  }[];
  invalidationsCount: number;
  lastInvalidatedAt: number | null;
}

export type MasterDataCacheKey =
  | 'products:enriched'
  | 'categories:all'
  | 'uoms:all'
  | 'customers:all'
  | 'suppliers:all'
  | 'warehouses:all'
  | 'locations:all'
  | 'accounts:all';

class MasterDataCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 60 * 1000; // 60 seconds default TTL
  private totalHits = 0;
  private totalMisses = 0;
  private invalidationsCount = 0;
  private lastInvalidatedAt: number | null = null;

  constructor() {
    // Periodic garbage collection for expired entries every 30s
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.evictExpired();
      }, 30000).unref?.();
    }
  }

  /**
   * Get an item from in-memory cache or calculate and set it atomically
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = this.defaultTTL,
    tags: string[] = []
  ): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (entry && entry.expiresAt > now) {
      entry.hits++;
      this.totalHits++;
      return entry.data as T;
    }

    // Cache miss or expired
    this.totalMisses++;
    const freshData = await fetcher();

    this.cache.set(key, {
      data: freshData,
      cachedAt: now,
      expiresAt: now + ttlMs,
      hits: 0,
      tags: tags.length > 0 ? tags : [key.split(':')[0]]
    });

    return freshData;
  }

  /**
   * Direct get without fetcher
   */
  public get<T>(key: string): T | null {
    const now = Date.now();
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > now) {
      entry.hits++;
      this.totalHits++;
      return entry.data as T;
    }
    return null;
  }

  /**
   * Direct set
   */
  public set<T>(key: string, data: T, ttlMs: number = this.defaultTTL, tags: string[] = []): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + ttlMs,
      hits: 0,
      tags: tags.length > 0 ? tags : [key.split(':')[0]]
    });
  }

  /**
   * Invalidate by exact key
   */
  public invalidate(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) {
      this.invalidationsCount++;
      this.lastInvalidatedAt = Date.now();
    }
    return existed;
  }

  /**
   * Invalidate all keys associated with a tag (e.g., 'products', 'suppliers', 'inventory')
   */
  public invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag) || key.startsWith(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      this.invalidationsCount++;
      this.lastInvalidatedAt = Date.now();
    }
    return count;
  }

  /**
   * Invalidate multiple tags or keys
   */
  public invalidateMany(tagsOrKeys: string[]): number {
    let count = 0;
    for (const item of tagsOrKeys) {
      count += this.invalidateByTag(item);
    }
    return count;
  }

  /**
   * Flush entire cache
   */
  public flushAll(): void {
    this.cache.clear();
    this.invalidationsCount++;
    this.lastInvalidatedAt = Date.now();
  }

  /**
   * Clean expired entries
   */
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get operational statistics & telemetry
   */
  public getMetrics(): CacheMetrics {
    const now = Date.now();
    const totalRequests = this.totalHits + this.totalMisses;
    const hitRatio = totalRequests > 0 ? Number(((this.totalHits / totalRequests) * 100).toFixed(2)) : 0;

    const keys = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      ageSeconds: Math.max(0, Math.floor((now - entry.cachedAt) / 1000)),
      ttlRemainingSeconds: Math.max(0, Math.ceil((entry.expiresAt - now) / 1000)),
      tags: entry.tags
    }));

    return {
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      hitRatio,
      keysCount: this.cache.size,
      keys,
      invalidationsCount: this.invalidationsCount,
      lastInvalidatedAt: this.lastInvalidatedAt
    };
  }
}

export const masterDataCache = new MasterDataCacheService();
