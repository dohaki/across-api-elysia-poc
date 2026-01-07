/**
 * Cache Provider Tests
 * Validate cache implementations work correctly
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { MemoryCacheProvider } from "../shared/cache/memory";

describe("MemoryCacheProvider", () => {
  let cache: MemoryCacheProvider;

  beforeEach(() => {
    cache = new MemoryCacheProvider();
  });

  it("should set and get values", async () => {
    await cache.set("test-key", "test-value");
    const value = await cache.get("test-key");
    expect(value).toBe("test-value");
  });

  it("should return null for non-existent keys", async () => {
    const value = await cache.get("non-existent");
    expect(value).toBeNull();
  });

  it("should handle TTL expiration", async () => {
    await cache.set("ttl-key", "ttl-value", 1); // 1 second TTL

    // Should exist immediately
    const immediate = await cache.get("ttl-key");
    expect(immediate).toBe("ttl-value");

    // Should expire after 1 second
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const expired = await cache.get("ttl-key");
    expect(expired).toBeNull();
  });

  it("should delete values", async () => {
    await cache.set("delete-me", "value");
    await cache.delete("delete-me");
    const value = await cache.get("delete-me");
    expect(value).toBeNull();
  });

  it("should check existence", async () => {
    await cache.set("exists", "value");
    expect(await cache.exists("exists")).toBe(true);
    expect(await cache.exists("not-exists")).toBe(false);
  });

  it("should handle mget", async () => {
    await cache.set("key1", "value1");
    await cache.set("key2", "value2");
    const values = await cache.mget(["key1", "key2", "key3"]);
    expect(values).toEqual(["value1", "value2", null]);
  });

  it("should handle mset", async () => {
    await cache.mset([
      { key: "multi1", value: "value1" },
      { key: "multi2", value: "value2", ttlSeconds: 10 },
    ]);

    expect(await cache.get<string>("multi1")).toBe("value1");
    expect(await cache.get<string>("multi2")).toBe("value2");
  });

  it("should flush all entries", async () => {
    await cache.set("key1", "value1");
    await cache.set("key2", "value2");
    await cache.flush();
    expect(await cache.get("key1")).toBeNull();
    expect(await cache.get("key2")).toBeNull();
  });

  it("should handle complex objects", async () => {
    const complexObj = {
      name: "test",
      nested: { value: 123 },
      array: [1, 2, 3],
    };
    await cache.set("complex", complexObj);
    const retrieved = await cache.get("complex");
    expect(retrieved).toEqual(complexObj);
  });
});
