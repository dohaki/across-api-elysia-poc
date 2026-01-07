/**
 * Cache Module - Exports and Factory
 */

export type { ICacheProvider, CacheConfig } from "./interface";
export { UpstashCacheProvider } from "./upstash";
export { MemoryCacheProvider } from "./memory";

import type { ICacheProvider, CacheConfig } from "./interface";
import { UpstashCacheProvider } from "./upstash";
import { MemoryCacheProvider } from "./memory";

/**
 * Factory function to create cache provider based on configuration
 */
export function createCacheProvider(config: CacheConfig): ICacheProvider {
  switch (config.provider) {
    case "upstash":
      return new UpstashCacheProvider(config);
    case "memory":
      return new MemoryCacheProvider();
    default:
      throw new Error(`Unsupported cache provider: ${config.provider}`);
  }
}

/**
 * Create cache provider from environment variables
 */
export function createCacheProviderFromEnv(): ICacheProvider {
  const provider = (process.env.CACHE_PROVIDER || "memory") as CacheConfig["provider"];

  const config: CacheConfig = {
    provider,
    upstash:
      provider === "upstash"
        ? {
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
          }
        : undefined,
    defaultTTL: process.env.CACHE_DEFAULT_TTL
      ? parseInt(process.env.CACHE_DEFAULT_TTL, 10)
      : 300, // 5 minutes default
  };

  return createCacheProvider(config);
}
