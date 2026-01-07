/**
 * Cloudflare Workers Adapter
 * Deploy ElysiaJS app to Cloudflare Workers
 */

import { app } from "../index";

/**
 * Cloudflare Workers expects a default export with fetch method
 */
export default {
  fetch: app.fetch,
};
