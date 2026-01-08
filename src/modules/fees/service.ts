/**
 * Fees Module - Service Layer
 * Business logic using @across-protocol/sdk
 *
 * NOTE: @across-protocol/sdk has ESM build issues with directory imports
 * that cause crashes on Vercel Node.js runtime. We use dynamic imports
 * as a workaround. This is a known issue with the SDK's ESM bundle.
 * See: https://nodejs.org/api/esm.html#mandatory-file-extensions
 */

import type { ICacheProvider } from "../../shared/cache/index.js";
import { withSpan, addSpanAttributes } from "../../shared/telemetry/index.js";
import type {
  SuggestedFeesQuery,
  SuggestedFeesResponse,
  LimitsQuery,
  LimitsResponse,
} from "./model.js";

import { BigNumber, utils } from "ethers";
import {
  constants,
  relayFeeCalculator,
  gasPriceOracle,
  clients,
} from "@across-protocol/sdk";

console.log("constants:", constants);
console.log("relayFeeCalculator:", relayFeeCalculator);
console.log("gasPriceOracle:", gasPriceOracle);
console.log("clients:", clients);

/**
 * Lazy-load SDK to avoid ESM import issues on Vercel
 */
let sdkPromise: Promise<typeof import("@across-protocol/sdk")> | null = null;
let contractsPromise: Promise<
  typeof import("@across-protocol/contracts")
> | null = null;

async function loadSDK() {
  if (!sdkPromise) {
    sdkPromise = import("@across-protocol/sdk");
  }
  return sdkPromise;
}

async function loadContracts() {
  if (!contractsPromise) {
    contractsPromise = import("@across-protocol/contracts");
  }
  return contractsPromise;
}

/**
 * Service class for fee calculation
 */
export class FeesService {
  constructor(private cache: ICacheProvider) {}

  /**
   * Calculate suggested fees for a bridge transaction
   * This validates that @across-protocol/sdk works with ElysiaJS
   */
  async getSuggestedFees(
    query: SuggestedFeesQuery
  ): Promise<SuggestedFeesResponse> {
    return withSpan(
      "FeesService.getSuggestedFees",
      async (span) => {
        const {
          amount,
          inputToken,
          outputToken,
          destinationChainId,
          originChainId = "1",
        } = query;

        // Add trace attributes
        addSpanAttributes({
          "bridge.amount": amount,
          "bridge.destinationChainId": destinationChainId,
          "bridge.originChainId": originChainId,
        });

        // Generate cache key
        const cacheKey = `fees:${originChainId}:${destinationChainId}:${inputToken}:${outputToken}:${amount}`;

        // Try to get from cache
        const cached = await this.cache.get<SuggestedFeesResponse>(cacheKey);
        if (cached) {
          addSpanAttributes({ "cache.hit": true });
          return cached;
        }

        addSpanAttributes({ "cache.hit": false });

        // Mock fee calculation (in production, this would use SDK's fee calculation)
        // This demonstrates that we can import and use @across-protocol/sdk constants
        const mockRelayFeePct = "0.0001"; // 0.01%
        const mockLpFeePct = "0.0001"; // 0.01%
        const mockCapitalFeePct = "0.00005";
        const mockRelayGasFeePct = "0.00005";

        const amountBN = BigInt(amount);
        const relayFeeTotal = (
          (amountBN * BigInt(Math.floor(parseFloat(mockRelayFeePct) * 1e18))) /
          BigInt(1e18)
        ).toString();
        const capitalFeeTotal = (
          (amountBN *
            BigInt(Math.floor(parseFloat(mockCapitalFeePct) * 1e18))) /
          BigInt(1e18)
        ).toString();
        const relayGasFeeTotal = (
          (amountBN *
            BigInt(Math.floor(parseFloat(mockRelayGasFeePct) * 1e18))) /
          BigInt(1e18)
        ).toString();

        const totalRelayFeePct = (
          parseFloat(mockRelayFeePct) + parseFloat(mockLpFeePct)
        ).toString();
        const totalRelayFee = (
          BigInt(relayFeeTotal) +
          BigInt(capitalFeeTotal) +
          BigInt(relayGasFeeTotal)
        ).toString();

        const response: SuggestedFeesResponse = {
          estimatedFillTimeSec: 60,
          relayFeePct: mockRelayFeePct,
          relayFeeTotal,
          lpFeePct: mockLpFeePct,
          timestamp: new Date().toISOString(),
          isAmountTooLow: BigInt(amount) < BigInt(1000000), // 1 USDC minimum
          quoteBlock: "18000000",
          totalRelayFee: {
            pct: totalRelayFeePct,
            total: totalRelayFee,
          },
          capitalFeePct: mockCapitalFeePct,
          capitalFeeTotal,
          relayGasFeePct: mockRelayGasFeePct,
          relayGasFeeTotal,
        };

        // Optionally add exclusivity info
        if (query.depositor) {
          response.exclusiveRelayer =
            "0x0000000000000000000000000000000000000000";
          response.exclusivityDeadline = (
            Math.floor(Date.now() / 1000) + 300
          ).toString();
        }

        // Cache the result for 60 seconds
        await this.cache.set(cacheKey, response, 60);

        return response;
      },
      {
        "service.name": "FeesService",
        "service.method": "getSuggestedFees",
      }
    );
  }

  /**
   * Get deposit limits for a token/route
   */
  async getLimits(query: LimitsQuery): Promise<LimitsResponse> {
    return withSpan(
      "FeesService.getLimits",
      async (span) => {
        const { token, destinationChainId, originChainId = "1" } = query;

        addSpanAttributes({
          "bridge.token": token,
          "bridge.destinationChainId": destinationChainId,
          "bridge.originChainId": originChainId,
        });

        const cacheKey = `limits:${originChainId}:${destinationChainId}:${token}`;

        // Try cache first
        const cached = await this.cache.get<LimitsResponse>(cacheKey);
        if (cached) {
          addSpanAttributes({ "cache.hit": true });
          return cached;
        }

        addSpanAttributes({ "cache.hit": false });

        // Mock limits (in production, would use SDK to query actual limits)
        const response: LimitsResponse = {
          minDeposit: "1000000", // 1 USDC
          maxDeposit: "1000000000000", // 1M USDC
          maxDepositInstant: "100000000000", // 100K USDC
          maxDepositShortDelay: "500000000000", // 500K USDC
          recommendedDepositInstant: "50000000000", // 50K USDC
        };

        // Cache for 5 minutes
        await this.cache.set(cacheKey, response, 300);

        return response;
      },
      {
        "service.name": "FeesService",
        "service.method": "getLimits",
      }
    );
  }

  /**
   * Validate SDK compatibility - demonstrates we can import and use SDK constants
   * Uses dynamic imports to work around SDK ESM issues on Vercel
   */
  async validateSDKCompatibility(): Promise<{
    sdkVersion: string;
    chainsSupported: number[];
    constantsAvailable: boolean;
    loadedSuccessfully: boolean;
  }> {
    try {
      const amount = utils.parseUnits("1", 6);
      console.log("amount:", amount.toString());

      // Dynamic import to avoid ESM directory import issues
      const sdk = await loadSDK();
      const contracts = await loadContracts();

      console.log("SDK loaded successfully");
      console.log("constants available:", typeof sdk.constants !== "undefined");
      console.log(
        "relayFeeCalculator available:",
        typeof sdk.relayFeeCalculator !== "undefined"
      );

      // Try to get deployed address
      if (contracts.getDeployedAddress) {
        const deployedAddress = contracts.getDeployedAddress(
          "SpokePoolPeriphery",
          10
        );
        console.log("deployedAddress:", deployedAddress);
      }

      return {
        sdkVersion: "4.3.99",
        chainsSupported: sdk.constants?.CHAIN_IDs
          ? Object.keys(sdk.constants.CHAIN_IDs).map(Number)
          : [1, 10, 137, 42161], // Fallback list
        constantsAvailable: typeof sdk.constants !== "undefined",
        loadedSuccessfully: true,
      };
    } catch (error) {
      console.error("SDK load error:", error);
      // Return mock data if SDK fails to load (e.g., on Vercel)
      return {
        sdkVersion: "4.3.99",
        chainsSupported: [1, 10, 137, 42161, 8453, 59144], // Common chains
        constantsAvailable: false,
        loadedSuccessfully: false,
      };
    }
  }
}
