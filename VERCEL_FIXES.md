# Vercel Deployment Fix - ES Module Import Paths

## Issue

When deploying to Vercel with Node.js runtime, the application crashed with:

```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/var/task/src/shared/cache'
is not supported resolving ES modules imported from /var/task/src/index.js
```

## Root Cause

**Node.js ES modules require explicit file paths with extensions.** Directory imports (without `/index.js`) are not supported.

While TypeScript and Bun allow:
```typescript
import { something } from "./shared/cache";
```

Node.js ES modules require:
```typescript
import { something } from "./shared/cache/index.js";
```

**Note**: The extension must be `.js` even though source files are `.ts`, because the runtime expects the compiled JavaScript output.

## Solution

All relative imports must explicitly include the file path with `.js` extension:

### ❌ Before (Doesn't work on Vercel Node.js)

```typescript
// src/index.ts
import { createCacheProviderFromEnv } from "./shared/cache";
import { initTelemetry } from "./shared/telemetry";
import { errorHandler } from "./middleware/error-handler";
import { createFeesModule } from "./modules/fees";

// src/modules/fees/index.ts
import { FeesService } from "./service";
import { SuggestedFeesQueryModel } from "./model";
import type { ICacheProvider } from "../../shared/cache";

// src/modules/fees/service.ts
import type { ICacheProvider } from "../../shared/cache";
import { withSpan } from "../../shared/telemetry";
import type { SuggestedFeesQuery } from "./model";
```

### ✅ After (Works on Vercel Node.js)

```typescript
// src/index.ts
import { createCacheProviderFromEnv } from "./shared/cache/index.js";
import { initTelemetry } from "./shared/telemetry/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createFeesModule } from "./modules/fees/index.js";

// src/modules/fees/index.ts
import { FeesService } from "./service.js";
import { SuggestedFeesQueryModel } from "./model.js";
import type { ICacheProvider } from "../../shared/cache/index.js";

// src/modules/fees/service.ts
import type { ICacheProvider } from "../../shared/cache/index.js";
import { withSpan } from "../../shared/telemetry/index.js";
import type { SuggestedFeesQuery } from "./model.js";
```

## Files Changed

1. **`src/index.ts`**
   - Fixed 4 imports

2. **`src/modules/fees/index.ts`**
   - Fixed 3 imports

3. **`src/modules/fees/service.ts`**
   - Fixed 3 imports

**Total**: 10 imports fixed

## Why This Works

### Local Development (Bun/Node with ts-node)
- TypeScript compiler handles module resolution
- Bun has smart module resolution
- Works with or without `.js` extensions

### Vercel Production (Node.js ES Modules)
- Node.js strictly follows ES module spec
- Requires explicit paths with extensions
- Extensions must match runtime files (`.js`)
- Directory imports not supported

## Verification

Test locally with Node.js ES modules:

```bash
# Install dependencies
bun install --ignore-scripts

# Test with Vercel CLI (simulates production)
vercel dev

# Or test with Node.js directly
node --loader tsx src/index.ts
```

Expected: Server starts without import errors

## Prevention

When adding new files, always use explicit imports:

```typescript
// ✅ Correct
import { Something } from "./path/to/file.js";
import { Something } from "./path/to/directory/index.js";

// ❌ Wrong (will fail on Vercel)
import { Something } from "./path/to/file";
import { Something } from "./path/to/directory";
```

**Rule**: All relative imports in `src/` must end with `.js` extension.

## TypeScript Configuration

Our `tsconfig.json` is already configured for ES modules:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true
  }
}
```

And `package.json`:

```json
{
  "type": "module"
}
```

These settings enable ES module support but still require explicit `.js` extensions in import paths for Node.js compatibility.

## Testing on Vercel

After fixing imports:

```bash
# Deploy to preview
vercel deploy

# Test endpoints
curl https://your-deployment.vercel.app/health
curl https://your-deployment.vercel.app/api/sdk-validation

# Check logs
vercel logs --follow
```

Expected: No import errors, endpoints respond correctly.

## Additional Notes

### Why `.js` and not `.ts`?

Node.js ES modules load the **runtime** files (JavaScript), not the source files (TypeScript). Even though we write `.ts` files, the import paths must reference the `.js` files that exist at runtime.

### Does this affect type checking?

No. TypeScript understands that `.js` imports refer to `.ts` files during development. This is standard practice for TypeScript projects targeting ES modules.

### Does this work with Bun?

Yes. Bun's module resolution handles both:
- `./file.js` (explicit)
- `./file` (implicit)

So using `.js` extensions works everywhere.

## Related Documentation

- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Vercel Node.js Runtime](https://vercel.com/docs/functions/runtimes/node-js)

---

**Status**: ✅ Fixed and deployed

**Date**: 2026-01-07

All imports now use explicit `.js` extensions for Vercel Node.js runtime compatibility.
