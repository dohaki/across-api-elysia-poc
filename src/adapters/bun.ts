/**
 * Bun Native Server Adapter
 * Run ElysiaJS app with Bun's native server
 */

import { appWithCronJobs } from "../index";

const port = process.env.PORT || 3000;

// Bun.serve provides better performance than the default Elysia listener
export default {
  port,
  fetch: appWithCronJobs.fetch,
  development: process.env.NODE_ENV !== "production",
};

console.log(`
🚀 Across API PoC running on Bun (native server)

  Port: ${port}
  Environment: ${process.env.NODE_ENV || "development"}
  Cache: ${process.env.CACHE_PROVIDER || "memory"}

📚 Swagger Docs: http://localhost:${port}/swagger
🏥 Health Check: http://localhost:${port}/health
`);
