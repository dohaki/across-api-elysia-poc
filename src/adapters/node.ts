/**
 * Node.js HTTP Server Adapter
 * Run ElysiaJS app as a standard Node.js HTTP server
 */

import { app } from "../index";

const port = process.env.PORT || 3000;

// Create a Node.js HTTP server from Elysia app
app.listen(port, () => {
  console.log(`
🚀 Across API PoC running on Node.js

  Port: ${port}
  Environment: ${process.env.NODE_ENV || "development"}
  Cache: ${process.env.CACHE_PROVIDER || "memory"}

📚 Swagger Docs: http://localhost:${port}/swagger
🏥 Health Check: http://localhost:${port}/health
  `);
});
