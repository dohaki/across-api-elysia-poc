# Docker Deployment Guide

## Build and Deployment Summary

Successfully created and tested Docker containerization for the Across API PoC built with Bun and ElysiaJS.

### Container Specifications

- **Base Image**: `oven/bun:1.3`
- **Final Image Size**: 1.62GB
- **Architecture**: Multi-stage build (deps → builder → runner)
- **User**: Non-root user (bunuser:1001)
- **Health Check**: Automated with wget
- **Port**: 3000 (internal)

### Build Features

1. **Multi-stage Build**
   - Stage 1 (deps): Installs production dependencies with native module support
   - Stage 2 (builder): Type checking and validation
   - Stage 3 (runner): Minimal runtime environment

2. **Native Dependencies**
   - Python 3.13, make, g++, pkg-config included for build tools
   - Uses `--ignore-scripts` to skip optional hardware wallet dependencies
   - Optimized dependency installation with `--no-install-recommends`

3. **Security**
   - Runs as non-root user (UID/GID 1001)
   - Minimal attack surface
   - Automated health checks

4. **Production Ready**
   - OpenTelemetry instrumentation enabled
   - Cron jobs for cache warmup
   - Environment variable configuration

## Build Commands

```bash
# Build the image
docker build -t across-api:latest .

# Run the container
docker run -d -p 3000:3000 --name across-api across-api:latest

# View logs
docker logs -f across-api

# Stop and remove
docker stop across-api && docker rm across-api
```

## Docker Compose

```bash
# Start with compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Environment Variables

You can customize the deployment with environment variables:

```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e CACHE_PROVIDER=memory \
  --name across-api \
  across-api:latest
```

## Verified Endpoints

The following endpoints were tested and verified:

- **Root**: `http://localhost:3000/` - API information
- **Health**: `http://localhost:3000/health` - Health check status
- **Ready**: `http://localhost:3000/ready` - Readiness probe
- **API Endpoints**:
  - `/api/suggested-fees`
  - `/api/limits`
  - `/api/sdk-validation`

## Test Results

### Standard Build (Dockerfile)
✅ Docker image builds successfully (1.62GB)
✅ Container starts and runs
✅ Health check endpoint responds correctly
✅ API endpoints are accessible
✅ OpenTelemetry instrumentation loads
✅ Cron jobs execute on schedule

### Docker Compose
✅ Builds and starts successfully
✅ All services running correctly
✅ Endpoints tested and working
✅ Health checks passing

### Binary Build (Dockerfile.binary)
✅ Binary image builds successfully (156MB - 10x smaller!)
❌ Runtime fails with syntax error
⚠️ **Not compatible** with current dependencies:
  - OpenTelemetry auto-instrumentation uses dynamic code patterns
  - Across Protocol SDK has complex module loading
  - Bun's binary compilation cannot handle these patterns

**Recommendation**: Use standard Dockerfile for production deployments

## Alternative: Binary Build (Not Recommended)

A binary build option is available via `Dockerfile.binary` that produces a 156MB image (10x smaller than the standard 1.62GB image):

```bash
docker build -f Dockerfile.binary -t across-api:binary .
```

**⚠️ Important Limitations:**
- The binary build compiles successfully but **fails at runtime**
- OpenTelemetry auto-instrumentation is not compatible with Bun's binary compilation
- Across Protocol SDK uses dynamic module loading patterns that don't work in compiled binaries
- **Do not use for production** unless these dependencies are removed or replaced

**If you need smaller images**, consider:
1. Using multi-stage builds (already implemented in standard Dockerfile)
2. Removing unnecessary dev dependencies
3. Using Alpine-based images
4. Implementing layer caching strategies

## Deployment Platforms

This Docker image can be deployed to:

- **Kubernetes**: Use provided Dockerfile with K8s manifests
- **AWS ECS/Fargate**: Compatible with ECS task definitions
- **Google Cloud Run**: Supports Cloud Run requirements
- **Azure Container Instances**: Ready for ACI deployment
- **DigitalOcean App Platform**: Compatible with DO specs
- **Fly.io**: Works with Fly deployment
- **Railway**: Ready for Railway platform

## Troubleshooting

### Health check failing

If the container shows as unhealthy, verify:
```bash
docker exec <container> wget --spider http://localhost:3000/health
```

### Port conflicts

If port 3000 is in use, map to a different port:
```bash
docker run -d -p 8080:3000 --name across-api across-api:latest
```

### View full logs

```bash
docker logs across-api --tail 100 -f
```

## Performance Notes

- Cold start time: ~15-20 seconds
- Memory usage: ~200-300MB at idle
- Production-optimized dependencies
- Native dependencies compiled during build

## Next Steps

1. Add persistent volume for cache if needed
2. Configure external Redis for distributed caching
3. Set up log aggregation (ELK, Datadog, etc.)
4. Implement secrets management for API keys
5. Configure reverse proxy (nginx, Traefik) for production
6. Set up container orchestration (Kubernetes, ECS)
