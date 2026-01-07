/**
 * Vercel Serverless Adapter
 * Exports ElysiaJS app as Vercel serverless function
 */

import { app } from "../index";

/**
 * Vercel expects a default export of the fetch handler
 */
export default app.fetch;

/**
 * Vercel configuration for serverless functions
 */
export const config = {
  regions: ["iad1"], // Specify regions
  maxDuration: 60, // Max execution time in seconds
};
