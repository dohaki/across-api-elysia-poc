# Deployment Guide - Across API PoC

This guide covers deploying the ElysiaJS PoC to Vercel with Node.js runtime and Fluid Compute.

## 📋 Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
- Vercel account
- Git repository (optional, but recommended)

## 🚀 Deploying to Vercel

### Method 1: Git-Based Deployment (Recommended)

#### 1. Push to Git Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: ElysiaJS PoC for Across API"

# Push to GitHub/GitLab/Bitbucket
git remote add origin <your-repo-url>
git push -u origin main
```

#### 2. Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect ElysiaJS configuration
5. Configure environment variables (see below)
6. Click "Deploy"

**Benefits**:
- ✅ Automatic deployments on git push
- ✅ Preview deployments for pull requests
- ✅ Instant rollback to previous deployments
- ✅ Branch-based environments

### Method 2: CLI Deployment

#### 1. Login to Vercel

```bash
vercel login
```

#### 2. Deploy to Preview Environment

```bash
# Deploy to preview URL
vercel deploy

# Or use npm script
npm run deploy
```

This creates a preview deployment with a unique URL.

#### 3. Deploy to Production

```bash
# Deploy to production
vercel deploy --prod

# Or use npm script
npm run deploy:prod
```

This deploys to your production domain.

## ⚙️ Configuration

### Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

#### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Cache Provider
CACHE_PROVIDER=upstash  # or "memory" for testing

# Upstash Redis (if using Upstash cache)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Cache TTL (optional)
CACHE_DEFAULT_TTL=300  # 5 minutes
```

#### Optional Variables

```bash
# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# OpenTelemetry (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otlp-endpoint.com/v1/traces
```

### Setting Environment Variables via CLI

```bash
# Add environment variable
vercel env add UPSTASH_REDIS_REST_URL

# Add secret (encrypted)
vercel env add UPSTASH_REDIS_REST_TOKEN --sensitive

# Add to specific environment (production, preview, development)
vercel env add NODE_ENV production --target production
```

### Setting Environment Variables via Dashboard

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable with appropriate scope:
   - **Production**: For `vercel deploy --prod`
   - **Preview**: For PR and branch deployments
   - **Development**: For `vercel dev` local development

## 🏗️ Build Configuration

The project is configured in `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "bun install --ignore-scripts",
  "installCommand": "bun install --ignore-scripts",
  "functions": {
    "src/index.ts": {
      "runtime": "nodejs",
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

### Configuration Options

- **`runtime`**: `"nodejs"` - Uses Node.js runtime (supports Fluid Compute)
- **`maxDuration`**: `60` - Maximum execution time (60 seconds)
- **`memory`**: `1024` - Memory allocation (1024 MB)

### Adjusting Configuration

To increase limits (requires Pro plan):

```json
{
  "functions": {
    "src/index.ts": {
      "runtime": "nodejs",
      "maxDuration": 300,  // 5 minutes (Pro plan)
      "memory": 3008       // 3 GB (Pro plan)
    }
  }
}
```

## 🔥 Fluid Compute

**Fluid Compute is automatically enabled** for all Vercel Functions on Node.js runtime.

### Benefits

✅ **Active CPU Billing**: Pay only for actual CPU usage, not idle time
✅ **Automatic Cold Start Prevention**: Keeps functions warm during traffic
✅ **Optimized Concurrency**: Better request handling
✅ **Background Processing**: Support for longer-running tasks

### Monitoring Fluid Compute

View metrics in Vercel Dashboard:
1. Go to your project
2. Click "Analytics" → "Functions"
3. See CPU time, execution count, and cost breakdown

## 🧪 Testing Deployment

### Test Preview Deployment

```bash
# Deploy to preview
vercel deploy

# Output will show preview URL:
# https://across-api-poc-abc123.vercel.app
```

Test endpoints:
```bash
# Health check
curl https://across-api-poc-abc123.vercel.app/health

# API documentation
open https://across-api-poc-abc123.vercel.app/swagger

# Test API endpoint
curl "https://across-api-poc-abc123.vercel.app/api/sdk-validation"
```

### Test Production Deployment

```bash
# Deploy to production
vercel deploy --prod

# Test production domain
curl https://your-domain.vercel.app/health
```

## 🔍 Monitoring & Debugging

### View Logs

```bash
# View real-time logs
vercel logs --follow

# View logs for specific deployment
vercel logs <deployment-url>

# View function logs in dashboard
# Project → Deployments → Click deployment → Functions tab
```

### View Function Metrics

Dashboard → Analytics → Functions:
- Invocation count
- CPU time used
- Memory usage
- Error rate
- Duration (P50, P95, P99)

### Enable OpenTelemetry

Set environment variable:
```bash
vercel env add OTEL_EXPORTER_OTLP_ENDPOINT
```

View traces in your observability platform (DataDog, New Relic, etc.)

## 🌐 Custom Domains

### Add Custom Domain

```bash
# Add domain via CLI
vercel domains add api.your-domain.com

# Or via dashboard:
# Project → Settings → Domains → Add Domain
```

### Configure DNS

Add CNAME record:
```
Type: CNAME
Name: api
Value: cname.vercel-dns.com
```

Vercel automatically provisions SSL certificate.

## 🔄 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install --ignore-scripts

      - name: Run tests
        run: bun test

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
```

Required secrets in GitHub:
- `VERCEL_TOKEN`: From Vercel Settings → Tokens
- `VERCEL_ORG_ID`: From `.vercel/project.json` after first deploy
- `VERCEL_PROJECT_ID`: From `.vercel/project.json` after first deploy

## 🚨 Troubleshooting

### Build Fails

**Issue**: `node-hid` native module compilation fails

**Solution**: We use `--ignore-scripts` in build command:
```json
{
  "buildCommand": "bun install --ignore-scripts"
}
```

### Import Error: ERR_UNSUPPORTED_DIR_IMPORT

**Issue**: Function crashes with `Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/var/task/src/shared/cache' is not supported`

**Cause**: Node.js ES modules require explicit file paths with `.js` extensions

**Solution**: All relative imports must include `/index.js` or `.js`:

```typescript
// ✅ Correct
import { something } from "./shared/cache/index.js";
import { something } from "./module/file.js";

// ❌ Wrong (causes error)
import { something } from "./shared/cache";
import { something } from "./module/file";
```

**This project is already fixed.** If you add new files, ensure imports use `.js` extensions.

See [VERCEL_FIXES.md](./VERCEL_FIXES.md) for detailed explanation.

### SDK Import Error: ERR_UNSUPPORTED_DIR_IMPORT (Third-Party Package)

**Issue**: `@across-protocol/sdk` crashes with directory import error on Vercel

**Cause**: The SDK's ESM build has directory imports without explicit file paths

**Solution**: We use dynamic imports to lazy-load the SDK:

```typescript
// Dynamic import works around SDK ESM issues
const sdk = await import("@across-protocol/sdk");
```

**Status**: ✅ **Workaround implemented** - SDK loads via dynamic imports

See [SDK_WORKAROUND.md](./SDK_WORKAROUND.md) for detailed explanation and alternatives.

**Note**: This is a third-party package issue, not our code. The SDK maintainers would need to fix their ESM build for proper Node.js compatibility.

### Function Times Out

**Issue**: Function exceeds 60 second timeout

**Solutions**:
1. Increase `maxDuration` in `vercel.json` (requires Pro plan)
2. Optimize slow operations (database queries, external API calls)
3. Use caching to reduce computation time

### Memory Errors

**Issue**: Function runs out of memory

**Solution**: Increase memory in `vercel.json`:
```json
{
  "functions": {
    "src/index.ts": {
      "memory": 3008  // Requires Pro plan
    }
  }
}
```

### Cache Not Working

**Issue**: Upstash Redis not connecting

**Checklist**:
1. Verify environment variables are set correctly
2. Check Upstash credentials in dashboard
3. Ensure `CACHE_PROVIDER=upstash` is set
4. Test connection in `/ready` endpoint

### CORS Errors

**Issue**: Frontend can't access API

**Solution**: Set `CORS_ORIGIN` environment variable:
```bash
vercel env add CORS_ORIGIN https://your-frontend-domain.com
```

## 📊 Performance Optimization

### Enable Caching

Use Upstash Redis for production:
```bash
vercel env add CACHE_PROVIDER upstash
vercel env add UPSTASH_REDIS_REST_URL <url>
vercel env add UPSTASH_REDIS_REST_TOKEN <token>
```

### Optimize Cold Starts

Fluid Compute automatically optimizes cold starts. Additional tips:
1. Keep bundle size small (use tree-shaking)
2. Lazy load heavy dependencies
3. Use caching for expensive computations
4. Minimize initialization code

### Monitor Performance

Use Vercel Analytics:
1. Enable "Speed Insights" in dashboard
2. Monitor Core Web Vitals
3. Track API response times
4. Set up alerts for slow functions

## 🔒 Security

### Environment Secrets

✅ Store secrets in Vercel environment variables (encrypted at rest)
✅ Never commit `.env` files to git
✅ Use `--sensitive` flag for sensitive values:
```bash
vercel env add API_KEY --sensitive
```

### Enable Vercel Firewall

1. Go to Project Settings → Security
2. Enable "Vercel Firewall"
3. Configure DDoS protection
4. Set rate limiting rules

### Secure Compute

For connecting to databases in other clouds:
1. Enable "Secure Compute" in settings
2. Configure private links
3. Use VPC peering if needed

## 📚 Additional Resources

- [Vercel ElysiaJS Documentation](https://vercel.com/docs/frameworks/backend/elysia)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Fluid Compute Documentation](https://vercel.com/docs/fluid-compute)
- [ElysiaJS Vercel Integration](https://elysiajs.com/integrations/vercel)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

## 🎯 Production Checklist

Before going to production:

- [ ] Set all required environment variables
- [ ] Configure Upstash Redis for caching
- [ ] Set up custom domain
- [ ] Enable Vercel Firewall
- [ ] Configure monitoring and alerts
- [ ] Set up OpenTelemetry (optional)
- [ ] Test all endpoints in preview environment
- [ ] Run load tests
- [ ] Configure CORS for your frontend
- [ ] Set up CI/CD pipeline
- [ ] Document API endpoints (via Swagger)
- [ ] Set up error tracking (Sentry, etc.)

---

**Ready to deploy?** 🚀

```bash
# Preview deployment
npm run deploy

# Production deployment
npm run deploy:prod
```

For questions or issues, consult the [README.md](./README.md) and [POC_FINDINGS.md](./POC_FINDINGS.md).
