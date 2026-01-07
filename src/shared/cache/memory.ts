/**
 * In-Memory Cache Provider
 * Useful for local development and testing
 */

import type { ICacheProvider } from "./interface";

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt?: number;
}

export class MemoryCacheProvider implements ICacheProvider {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map();
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T = unknown>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    };

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async flush(): Promise<void> {
    this.cache.clear();
  }

  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  async mset<T = unknown>(
    entries: Array<{ key: string; value: T; ttlSeconds?: number }>
  ): Promise<void> {
    for (const { key, value, ttlSeconds } of entries) {
      await this.set(key, value, ttlSeconds);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
