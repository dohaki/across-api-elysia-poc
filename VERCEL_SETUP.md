# Vercel Deployment Setup - Summary

This document summarizes the configuration changes made to prepare the Across API PoC for Vercel deployment with Node.js runtime and Fluid Compute.

## ✅ Changes Made

### 1. Package Configuration (`package.json`)

**Added Scripts**:
```json
{
  "scripts": {
    "dev:vercel": "vercel dev",        // Local Vercel simulation
    "deploy": "vercel deploy",          // Preview deployment
    "deploy:prod": "vercel deploy --prod" // Production deployment
  }
}
```

**Added Peer Dependencies** (for pnpm compatibility):
```json
{
  "dependencies": {
    "@sinclair/typebox": "^0.33.15",
    "openapi-types": "^12.1.3"
  }
}
```

**Already Configured**:
- ✅ `"type": "module"` - Required for Node.js ES modules on Vercel

### 2. Application Entry Point (`src/index.ts`)

**Default Export Added**:
```typescript
// Export TypeScript type for Eden client
export type App = typeof app;

// Default export for Vercel deployment
// Vercel will use this export and automatically handle the request lifecycle
export default app;

// Start server if running directly with Bun/Node (not on Vercel)
// Vercel doesn't use this - it directly uses the default export
if (import.meta.main) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    // ... startup logs
  });
}
```

**Key Points**:
- ✅ Default export of `app` for Vercel
- ✅ `app.listen()` only called when running locally
- ✅ Vercel uses the exported app directly without calling `listen()`

### 3. Vercel Configuration (`vercel.json`)

**Created Configuration**:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "bun install --ignore-scripts",
  "installCommand": "bun install --ignore-scripts",
  "functions": {
    "src/index.ts": {
      "runtime": "nodejs",     // Node.js runtime (Fluid Compute enabled)
      "maxDuration": 60,       // 60 second timeout
      "memory": 1024           // 1GB memory
    }
  }
}
```

**Key Points**:
- ✅ **Runtime**: `nodejs` (not `bun`) for production stability
- ✅ **Fluid Compute**: Automatically enabled for Node.js runtime
- ✅ **Entry Point**: `src/index.ts` automatically detected
- ✅ **Build Command**: Uses `--ignore-scripts` to skip native module builds

### 4. Documentation

**Created Files**:
- ✅ `DEPLOYMENT.md` - Comprehensive deployment guide
  - Environment variable setup
  - CLI and Git-based deployment
  - Configuration options
  - Troubleshooting
  - Production checklist

**Updated Files**:
- ✅ `QUICKSTART.md` - Added Vercel deployment section

## 🏗️ How It Works

### Vercel Detection Flow

1. **Zero-Config Detection**:
   - Vercel detects `elysia` in `package.json` dependencies
   - Looks for entry point at `src/index.ts` or `index.ts`
   - Finds default export of Elysia app

2. **Build Process**:
   ```bash
   # Vercel runs:
   bun install --ignore-scripts  # Install dependencies
   # No build step needed - TypeScript handled by Vercel
   ```

3. **Runtime Execution**:
   - Vercel imports `src/index.ts`
   - Uses the default export (Elysia app)
   - Wraps app in Vercel Function infrastructure
   - Enables Fluid Compute automatically

4. **Request Handling**:
   ```
   Incoming Request
   → Vercel Edge Network
   → Vercel Function (Node.js runtime)
   → Your ElysiaJS app (default export)
   → Response
   ```

### Fluid Compute Benefits

Automatically enabled on Node.js runtime:

✅ **Active CPU Billing**: Pay for CPU time, not idle time
✅ **Smart Concurrency**: Optimizes concurrent request handling
✅ **Cold Start Prevention**: Keeps functions warm during traffic
✅ **Background Processing**: Supports async operations

## 📋 Deployment Checklist

### Before First Deploy

- [x] ✅ `"type": "module"` in package.json
- [x] ✅ Default export in `src/index.ts`
- [x] ✅ `vercel.json` configured for Node.js runtime
- [ ] Set environment variables in Vercel Dashboard:
  - `CACHE_PROVIDER=upstash`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `CORS_ORIGIN` (optional)
  - `OTEL_EXPORTER_OTLP_ENDPOINT` (optional)

### Deploy Steps

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project (first time only)
vercel link

# 4. Set environment variables
vercel env add CACHE_PROVIDER
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN --sensitive

# 5. Deploy to preview
npm run deploy

# 6. Test preview deployment
curl https://your-preview.vercel.app/health

# 7. Deploy to production
npm run deploy:prod
```

## 🔍 Verification

### Verify Configuration Locally

```bash
# Test with Vercel dev server
npm run dev:vercel

# Should start Vercel's local environment
# Simulates Vercel's production environment
```

### Verify Deployment

```bash
# Check health endpoint
curl https://your-deployment.vercel.app/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-01-06T...",
  "uptime": 123.45,
  "cache": "connected"
}

# Check SDK compatibility
curl https://your-deployment.vercel.app/api/sdk-validation

# Expected response:
{
  "sdkVersion": "4.3.99",
  "chainsSupported": [1, 10, 137, ...],
  "constantsAvailable": true
}

# Check Swagger docs
open https://your-deployment.vercel.app/swagger
```

## ⚙️ Configuration Options

### Adjust Function Limits (Pro Plan)

```json
{
  "functions": {
    "src/index.ts": {
      "runtime": "nodejs",
      "maxDuration": 300,    // 5 minutes (Pro plan)
      "memory": 3008         // 3GB (Pro plan)
    }
  }
}
```

### Use Bun Runtime (Alternative)

```json
{
  "functions": {
    "src/index.ts": {
      "runtime": "bun@latest",
      "maxDuration": 60
    }
  }
}
```

**Note**: Bun runtime doesn't support Fluid Compute yet. Use Node.js for Fluid Compute benefits.

## 🚨 Common Issues & Solutions

### Issue: Build Fails with node-hid Error

**Solution**: Already configured - we use `--ignore-scripts`:
```json
{
  "buildCommand": "bun install --ignore-scripts"
}
```

### Issue: Function Times Out

**Solution 1**: Increase timeout (requires Pro plan)
```json
{
  "functions": {
    "src/index.ts": {
      "maxDuration": 300
    }
  }
}
```

**Solution 2**: Optimize slow operations with caching

### Issue: Cache Not Working

**Checklist**:
1. Verify `UPSTASH_REDIS_REST_URL` is set
2. Verify `UPSTASH_REDIS_REST_TOKEN` is set
3. Verify `CACHE_PROVIDER=upstash` is set
4. Check Upstash Redis is accessible from Vercel region

### Issue: CORS Errors

**Solution**: Set `CORS_ORIGIN` environment variable:
```bash
vercel env add CORS_ORIGIN https://your-frontend.com
```

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Specific deployment
vercel logs <deployment-url>
```

### View Metrics

Dashboard → Analytics → Functions:
- Invocation count
- CPU time (with Fluid Compute)
- Memory usage
- Error rate
- Duration (P50, P95, P99)

## 📚 Resources

- **Vercel ElysiaJS Docs**: https://vercel.com/docs/frameworks/backend/elysia
- **ElysiaJS Vercel Integration**: https://elysiajs.com/integrations/vercel
- **Fluid Compute Docs**: https://vercel.com/docs/fluid-compute
- **Vercel Functions**: https://vercel.com/docs/functions
- **Full Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## ✅ Configuration Summary

| Item | Status | Notes |
|------|--------|-------|
| ES Modules | ✅ Configured | `"type": "module"` in package.json |
| Default Export | ✅ Configured | `export default app` in src/index.ts |
| Node.js Runtime | ✅ Configured | `vercel.json` with `runtime: "nodejs"` |
| Fluid Compute | ✅ Auto-Enabled | Enabled by default on Node.js |
| Build Command | ✅ Configured | `--ignore-scripts` to skip native builds |
| Deployment Scripts | ✅ Added | `npm run deploy` and `deploy:prod` |
| Documentation | ✅ Complete | DEPLOYMENT.md, QUICKSTART.md updated |

---

**Ready to deploy!** 🚀

```bash
npm run deploy
```

The PoC is fully configured for Vercel deployment with Node.js runtime and Fluid Compute.
