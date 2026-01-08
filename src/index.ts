/**
 * Across API PoC - Main Application
 * ElysiaJS application with Across Protocol SDK integration
 */

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { cron } from "@elysiajs/cron";
import { node } from "@elysiajs/node";
import { openapi } from "@elysiajs/openapi";

import { createCacheProviderFromEnv } from "./shared/cache/index.js";
import { initTelemetry } from "./shared/telemetry/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createFeesModule } from "./modules/fees/index.js";

// Initialize OpenTelemetry (must be done before creating app)
initTelemetry("across-api-poc");

// Initialize cache provider
const cache = createCacheProviderFromEnv();

/**
 * Create ElysiaJS application
 */
export const app = new Elysia({ adapter: node() })
  // Error handling
  .use(errorHandler)

  // CORS configuration
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    })
  )

  // OpenAPI documentation
  .use(openapi())

  // Example cron job (validates @elysiajs/cron plugin)
  .use(
    cron({
      name: "cache-warmup",
      pattern: "*/5 * * * *", // Every 5 minutes
      run() {
        console.log(
          "[Cron] Cache warmup executed at",
          new Date().toISOString()
        );
        // In production, this would warm up frequently accessed cache keys
      },
    })
  )

  // Health check endpoint
  .get(
    "/health",
    () => ({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cache: cache ? "connected" : "disconnected",
    }),
    {
      detail: {
        tags: ["Health"],
        summary: "Health check",
        description: "Check if the API is healthy",
      },
    }
  )

  // Ready check endpoint
  .get(
    "/ready",
    async () => {
      // Verify cache is working
      try {
        await cache.set("_ready_check", "ok", 10);
        const value = await cache.get("_ready_check");

        return {
          status: "ready",
          cache: value === "ok" ? "connected" : "error",
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          status: "not_ready",
          cache: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      detail: {
        tags: ["Health"],
        summary: "Readiness check",
        description: "Check if the API is ready to serve traffic",
      },
    }
  )

  // Mount fees module
  .use(createFeesModule(cache))

  // Root endpoint
  .get("/", () => ({
    name: "Across Protocol API - ElysiaJS PoC",
    version: "0.1.0",
    docs: "/swagger",
    endpoints: {
      health: "/health",
      ready: "/ready",
      fees: "/api/suggested-fees",
      limits: "/api/limits",
      sdkValidation: "/api/sdk-validation",
    },
  }));

// Export TypeScript type for Eden client
export type App = typeof app;

// Default export for Vercel deployment
// Vercel will use this export and automatically handle the request lifecycle
export default app;
