/**
 * Fees Module - Service Layer
 * Business logic using @across-protocol/sdk
 */

import {
  constants,
  relayFeeCalculator,
  gasPriceOracle,
  clients,
} from "@across-protocol/sdk";
import { getDeployedAddress } from "@across-protocol/contracts";
import type { ICacheProvider } from "../../shared/cache";
import { withSpan, addSpanAttributes } from "../../shared/telemetry";
import type {
  SuggestedFeesQuery,
  SuggestedFeesResponse,
  LimitsQuery,
  LimitsResponse,
} from "./model";

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
   */
  validateSDKCompatibility(): {
    sdkVersion: string;
    chainsSupported: number[];
    constantsAvailable: boolean;
  } {
    const deployedAddress = getDeployedAddress("SpokePoolPeriphery", 10);
    console.log("deployedAddress", deployedAddress);
    const defaultRelayer = relayFeeCalculator.getDefaultRelayer(10);
    console.log("defaultRelayer", defaultRelayer);
    console.log("gasPriceOracle", gasPriceOracle);
    console.log("clients", clients.HubPoolClient);
    return {
      sdkVersion: "4.3.99", // Would be from package.json
      chainsSupported: Object.keys(constants.CHAIN_IDs).map(Number),
      constantsAvailable: typeof constants !== "undefined",
    };
  }
}
