/**
 * Cache Provider Interface
 * Abstraction layer for cache implementations (Upstash Redis, in-memory, etc.)
 */

export interface ICacheProvider {
  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * Set value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds TTL in seconds (optional)
   */
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Delete value from cache
   * @param key Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if key exists in cache
   * @param key Cache key
   */
  exists(key: string): Promise<boolean>;

  /**
   * Flush all cache entries
   */
  flush(): Promise<void>;

  /**
   * Get multiple values at once
   * @param keys Array of cache keys
   */
  mget<T = unknown>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Set multiple values at once
   * @param entries Array of key-value-ttl tuples
   */
  mset<T = unknown>(
    entries: Array<{ key: string; value: T; ttlSeconds?: number }>
  ): Promise<void>;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  provider: "upstash" | "memory" | "redis";
  upstash?: {
    url: string;
    token: string;
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  defaultTTL?: number;
}
