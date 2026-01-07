/**
 * OpenTelemetry Instrumentation Setup
 * Provides distributed tracing for ElysiaJS application
 */

import { trace, context, SpanStatusCode, type Span } from "@opentelemetry/api";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import type { Context } from "elysia";

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK
 */
export function initTelemetry(serviceName = "across-api-poc") {
  // Skip if already initialized
  if (sdk) {
    console.log("OpenTelemetry already initialized");
    return sdk;
  }

  // Skip telemetry in test environment
  if (process.env.NODE_ENV === "test") {
    console.log("Skipping OpenTelemetry in test environment");
    return null;
  }

  const resource = Resource.default().merge(
    new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
    })
  );

  const traceExporter = new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      "http://localhost:4318/v1/traces",
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs instrumentation to reduce noise
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
      }),
    ],
  });

  try {
    sdk.start();
    console.log("OpenTelemetry instrumentation started successfully");
  } catch (error) {
    console.error("Failed to start OpenTelemetry:", error);
  }

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    try {
      await sdk?.shutdown();
      console.log("OpenTelemetry SDK shut down successfully");
    } catch (error) {
      console.error("Error shutting down OpenTelemetry SDK:", error);
    }
  });

  return sdk;
}

/**
 * Get the tracer instance
 */
export function getTracer(name = "across-api-poc") {
  return trace.getTracer(name);
}

/**
 * Create a span for a specific operation
 */
export function createSpan(
  name: string,
  attributes?: Record<string, string | number | boolean>
): Span {
  const tracer = getTracer();
  const span = tracer.startSpan(name, {
    attributes,
  });
  return span;
}

/**
 * Execute function within a span context
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const span = createSpan(name, attributes);

  try {
    const result = await context.with(trace.setSpan(context.active(), span), () =>
      fn(span)
    );
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * ElysiaJS middleware for automatic request tracing
 */
export function tracingMiddleware() {
  return {
    beforeHandle({ request, path, set }: Context) {
      const span = createSpan(`HTTP ${request.method} ${path}`, {
        "http.method": request.method,
        "http.url": request.url,
        "http.route": path,
      });

      // Store span in context for downstream use
      (set as any)._span = span;
    },

    afterHandle({ set, response }: Context) {
      const span = (set as any)._span as Span | undefined;
      if (span) {
        const status = response instanceof Response ? response.status : 200;
        span.setAttribute("http.status_code", status);
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
      }
    },

    onError({ set, error }: Context & { error: Error }) {
      const span = (set as any)._span as Span | undefined;
      if (span) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.recordException(error);
        span.end();
      }
    },
  };
}

/**
 * Helper to add attributes to current span
 */
export function addSpanAttributes(
  attributes: Record<string, string | number | boolean>
) {
  const span = trace.getActiveSpan();
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
}

/**
 * Helper to add event to current span
 */
export function addSpanEvent(name: string, attributes?: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}
