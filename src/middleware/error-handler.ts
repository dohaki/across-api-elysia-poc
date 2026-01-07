/**
 * Global Error Handler Middleware
 * Provides consistent error responses and logging
 */

import type { Elysia } from "elysia";

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public details?: any) {
    super(400, message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends APIError {
  constructor(message = "Resource not found") {
    super(404, message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends APIError {
  constructor(message = "Rate limit exceeded") {
    super(429, message, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

export function errorHandler(app: Elysia) {
  return app.onError(({ code, error, set }) => {
    console.error("Error:", {
      code,
      message: error.message,
      stack: error.stack,
    });

    // Handle validation errors from Elysia
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: "Validation Error",
        message: error.message,
        code: "VALIDATION_ERROR",
      };
    }

    // Handle custom API errors
    if (error instanceof APIError) {
      set.status = error.statusCode;
      return {
        error: error.name,
        message: error.message,
        code: error.code,
        ...(error instanceof ValidationError && error.details
          ? { details: error.details }
          : {}),
      };
    }

    // Handle not found
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        error: "Not Found",
        message: "The requested resource was not found",
        code: "NOT_FOUND",
      };
    }

    // Handle internal server errors
    set.status = 500;
    return {
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message,
      code: "INTERNAL_ERROR",
    };
  });
}
