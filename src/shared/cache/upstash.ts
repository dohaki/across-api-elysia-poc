/**
 * Upstash Redis Cache Provider
 * Production-ready cache implementation using Upstash Redis
 */

import { Redis } from "@upstash/redis";
import type { ICacheProvider, CacheConfig } from "./interface";

export class UpstashCacheProvider implements ICacheProvider {
  private redis: Redis;
  private defaultTTL?: number;

  constructor(config: CacheConfig) {
    if (!config.upstash?.url || !config.upstash?.token) {
      throw new Error(
        "Upstash configuration required: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN"
      );
    }

    this.redis = new Redis({
      url: config.upstash.url,
      token: config.upstash.token,
    });

    this.defaultTTL = config.defaultTTL;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get<T>(key);
      return value;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  async set<T = unknown>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const ttl = ttlSeconds ?? this.defaultTTL;
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error("Cache FLUSH error:", error);
      throw error;
    }
  }

  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];
      const values = await this.redis.mget<T>(...keys);
      return values;
    } catch (error) {
      console.error(`Cache MGET error for keys ${keys.join(", ")}:`, error);
      return keys.map(() => null);
    }
  }

  async mset<T = unknown>(
    entries: Array<{ key: string; value: T; ttlSeconds?: number }>
  ): Promise<void> {
    try {
      // Upstash doesn't support MSET with individual TTLs, so we batch SET operations
      await Promise.all(
        entries.map(({ key, value, ttlSeconds }) =>
          this.set(key, value, ttlSeconds)
        )
      );
    } catch (error) {
      console.error("Cache MSET error:", error);
      throw error;
    }
  }

  /**
   * Get the underlying Redis client for advanced operations
   */
  getClient(): Redis {
    return this.redis;
  }
}
