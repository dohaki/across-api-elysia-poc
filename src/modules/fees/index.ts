/**
 * Fees Module - ElysiaJS Controller
 * HTTP endpoint definitions
 */

import { Elysia } from "elysia";
import { FeesService } from "./service.js";
import {
  SuggestedFeesQueryModel,
  SuggestedFeesResponseModel,
  LimitsQueryModel,
  LimitsResponseModel,
} from "./model.js";
import type { ICacheProvider } from "../../shared/cache/index.js";

/**
 * Create fees module with dependency injection
 */
export function createFeesModule(cache: ICacheProvider) {
  const feesService = new FeesService(cache);

  return new Elysia({ prefix: "/api" })
    .get(
      "/suggested-fees",
      async ({ query }) => {
        return feesService.getSuggestedFees(query);
      },
      {
        query: SuggestedFeesQueryModel,
        response: {
          200: SuggestedFeesResponseModel,
        },
        detail: {
          tags: ["Fees"],
          summary: "Get suggested fees for a bridge transaction",
          description:
            "Calculate optimal fees for bridging tokens between chains",
        },
      }
    )
    .get(
      "/limits",
      async ({ query }) => {
        return feesService.getLimits(query);
      },
      {
        query: LimitsQueryModel,
        response: {
          200: LimitsResponseModel,
        },
        detail: {
          tags: ["Fees"],
          summary: "Get deposit limits",
          description: "Get minimum and maximum deposit limits for a route",
        },
      }
    )
    .get(
      "/sdk-validation",
      () => {
        return feesService.validateSDKCompatibility();
      },
      {
        detail: {
          tags: ["Validation"],
          summary: "Validate SDK compatibility",
          description: "Test endpoint to validate @across-protocol/sdk works with ElysiaJS",
        },
      }
    );
}
