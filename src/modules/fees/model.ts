/**
 * Fees Module - TypeBox Models
 * Schema definitions for fee-related endpoints
 */

import { t } from "elysia";

/**
 * Suggested Fees Query Schema
 */
export const SuggestedFeesQueryModel = t.Object({
  amount: t.String({
    description: "Amount to bridge in token decimals",
    pattern: "^\\d+$",
    examples: ["1000000"],
  }),
  inputToken: t.String({
    description: "Input token address",
    pattern: "^0x[a-fA-F0-9]{40}$",
    examples: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
  }),
  outputToken: t.String({
    description: "Output token address",
    pattern: "^0x[a-fA-F0-9]{40}$",
    examples: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
  }),
  destinationChainId: t.String({
    description: "Destination chain ID",
    pattern: "^\\d+$",
    examples: ["10", "137", "42161"],
  }),
  originChainId: t.Optional(
    t.String({
      description: "Origin chain ID (defaults to mainnet)",
      pattern: "^\\d+$",
      examples: ["1", "10", "137"],
    })
  ),
  depositor: t.Optional(
    t.String({
      description: "Depositor address for exclusivity routing",
      pattern: "^0x[a-fA-F0-9]{40}$",
    })
  ),
  recipient: t.Optional(
    t.String({
      description: "Recipient address",
      pattern: "^0x[a-fA-F0-9]{40}$",
    })
  ),
  message: t.Optional(
    t.String({
      description: "Optional message data",
    })
  ),
  skipAmountLimit: t.Optional(
    t.Boolean({
      description: "Skip amount limit validation",
      default: false,
    })
  ),
});

/**
 * Suggested Fees Response Schema
 */
export const SuggestedFeesResponseModel = t.Object({
  estimatedFillTimeSec: t.Number({
    description: "Estimated fill time in seconds",
    examples: [60],
  }),
  relayFeePct: t.String({
    description: "Relay fee percentage as decimal string",
    examples: ["0.0001"],
  }),
  relayFeeTotal: t.String({
    description: "Total relay fee in token units",
    examples: ["100"],
  }),
  lpFeePct: t.String({
    description: "LP fee percentage as decimal string",
    examples: ["0.0001"],
  }),
  timestamp: t.String({
    description: "Quote timestamp in ISO format",
    examples: ["2024-01-15T12:00:00Z"],
  }),
  isAmountTooLow: t.Boolean({
    description: "Whether amount is below minimum",
    examples: [false],
  }),
  quoteBlock: t.String({
    description: "Block number of quote",
    examples: ["18000000"],
  }),
  exclusiveRelayer: t.Optional(
    t.String({
      description: "Exclusive relayer address if applicable",
      pattern: "^0x[a-fA-F0-9]{40}$",
    })
  ),
  exclusivityDeadline: t.Optional(
    t.String({
      description: "Exclusivity deadline timestamp",
      examples: ["1705320000"],
    })
  ),
  totalRelayFee: t.Object({
    pct: t.String({
      description: "Total relay fee percentage",
      examples: ["0.0002"],
    }),
    total: t.String({
      description: "Total relay fee amount",
      examples: ["200"],
    }),
  }),
  capitalFeePct: t.String({
    description: "Capital fee percentage",
    examples: ["0.0001"],
  }),
  capitalFeeTotal: t.String({
    description: "Capital fee total",
    examples: ["100"],
  }),
  relayGasFeePct: t.String({
    description: "Relay gas fee percentage",
    examples: ["0.0001"],
  }),
  relayGasFeeTotal: t.String({
    description: "Relay gas fee total",
    examples: ["100"],
  }),
});

/**
 * Limits Query Schema
 */
export const LimitsQueryModel = t.Object({
  token: t.String({
    description: "Token address",
    pattern: "^0x[a-fA-F0-9]{40}$",
  }),
  destinationChainId: t.String({
    description: "Destination chain ID",
    pattern: "^\\d+$",
  }),
  originChainId: t.Optional(
    t.String({
      description: "Origin chain ID",
      pattern: "^\\d+$",
    })
  ),
});

/**
 * Limits Response Schema
 */
export const LimitsResponseModel = t.Object({
  minDeposit: t.String({
    description: "Minimum deposit amount",
    examples: ["1000000"],
  }),
  maxDeposit: t.String({
    description: "Maximum deposit amount",
    examples: ["1000000000000"],
  }),
  maxDepositInstant: t.String({
    description: "Maximum instant deposit amount",
    examples: ["100000000000"],
  }),
  maxDepositShortDelay: t.String({
    description: "Maximum deposit with short delay",
    examples: ["500000000000"],
  }),
  recommendedDepositInstant: t.String({
    description: "Recommended instant deposit amount",
    examples: ["50000000000"],
  }),
});

// Export types inferred from models
export type SuggestedFeesQuery = typeof SuggestedFeesQueryModel.static;
export type SuggestedFeesResponse = typeof SuggestedFeesResponseModel.static;
export type LimitsQuery = typeof LimitsQueryModel.static;
export type LimitsResponse = typeof LimitsResponseModel.static;
