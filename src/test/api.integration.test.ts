/**
 * API Integration Tests
 * Test the ElysiaJS API endpoints using Eden client
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { treaty } from "@elysiajs/eden";
import type { App } from "../index";

// Create Eden client for type-safe API testing
const api = treaty<App>("http://localhost:3000");

describe("API Integration Tests", () => {
  describe("Health Endpoints", () => {
    it("should return healthy status", async () => {
      const { data, error } = await api.health.get();

      expect(error).toBeNull();
      expect(data?.status).toBe("healthy");
      expect(data?.timestamp).toBeDefined();
      expect(data?.uptime).toBeGreaterThan(0);
    });

    it("should return ready status", async () => {
      const { data, error } = await api.ready.get();

      expect(error).toBeNull();
      expect(data?.status).toBe("ready");
      expect(data?.cache).toBe("connected");
    });
  });

  describe("Fees API", () => {
    it("should return suggested fees with valid params", async () => {
      const { data, error } = await api.api["suggested-fees"].get({
        query: {
          amount: "1000000",
          inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          outputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          destinationChainId: "10",
        },
      });

      expect(error).toBeNull();
      expect(data?.relayFeePct).toBeDefined();
      expect(data?.lpFeePct).toBeDefined();
      expect(data?.estimatedFillTimeSec).toBeGreaterThan(0);
      expect(data?.timestamp).toBeDefined();
      expect(data?.isAmountTooLow).toBe(false);
      expect(data?.totalRelayFee).toBeDefined();
      expect(data?.totalRelayFee.pct).toBeDefined();
      expect(data?.totalRelayFee.total).toBeDefined();
    });

    it("should validate input parameters", async () => {
      const { error } = await api.api["suggested-fees"].get({
        // @ts-expect-error Testing validation
        query: {
          amount: "invalid",
        },
      });

      expect(error).toBeDefined();
      expect(error?.status).toBe(400);
    });

    it("should detect amounts that are too low", async () => {
      const { data, error } = await api.api["suggested-fees"].get({
        query: {
          amount: "100", // Very low amount
          inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          outputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          destinationChainId: "10",
        },
      });

      expect(error).toBeNull();
      expect(data?.isAmountTooLow).toBe(true);
    });

    it("should include exclusivity info when depositor provided", async () => {
      const { data, error } = await api.api["suggested-fees"].get({
        query: {
          amount: "1000000",
          inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          outputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          destinationChainId: "10",
          depositor: "0x0000000000000000000000000000000000000001",
        },
      });

      expect(error).toBeNull();
      expect(data?.exclusiveRelayer).toBeDefined();
      expect(data?.exclusivityDeadline).toBeDefined();
    });

    it("should use cache on subsequent requests", async () => {
      const params = {
        query: {
          amount: "5000000",
          inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          outputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          destinationChainId: "10",
        },
      };

      // First request
      const first = await api.api["suggested-fees"].get(params);
      const firstTimestamp = first.data?.timestamp;

      // Second request (should hit cache, same timestamp)
      const second = await api.api["suggested-fees"].get(params);
      const secondTimestamp = second.data?.timestamp;

      expect(firstTimestamp).toBe(secondTimestamp);
    });
  });

  describe("Limits API", () => {
    it("should return deposit limits", async () => {
      const { data, error } = await api.api.limits.get({
        query: {
          token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          destinationChainId: "10",
        },
      });

      expect(error).toBeNull();
      expect(data?.minDeposit).toBeDefined();
      expect(data?.maxDeposit).toBeDefined();
      expect(data?.maxDepositInstant).toBeDefined();
      expect(data?.maxDepositShortDelay).toBeDefined();
      expect(data?.recommendedDepositInstant).toBeDefined();

      // Verify limits make sense
      expect(BigInt(data!.minDeposit)).toBeLessThan(
        BigInt(data!.maxDeposit)
      );
      expect(BigInt(data!.maxDepositInstant)).toBeLessThan(
        BigInt(data!.maxDeposit)
      );
    });

    it("should validate token address format", async () => {
      const { error } = await api.api.limits.get({
        // @ts-expect-error Testing validation
        query: {
          token: "invalid-address",
          destinationChainId: "10",
        },
      });

      expect(error).toBeDefined();
      expect(error?.status).toBe(400);
    });
  });

  describe("SDK Validation", () => {
    it("should validate SDK compatibility", async () => {
      const { data, error } = await api.api["sdk-validation"].get();

      expect(error).toBeNull();
      expect(data?.sdkVersion).toBeDefined();
      expect(data?.chainsSupported).toBeDefined();
      expect(Array.isArray(data?.chainsSupported)).toBe(true);
      expect(data?.constantsAvailable).toBe(true);
    });
  });
});
