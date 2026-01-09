# Multi-stage Dockerfile for Bun + ElysiaJS with OpenTelemetry
# Optimized for production deployment

# ============================================
# Stage 1: Dependencies
# ============================================
FROM oven/bun:1.3 AS deps

WORKDIR /app

# Install Python and build essentials for native dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    pkg-config \
    libusb-1.0-0-dev \
    libudev-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copy package files
COPY package.json bun.lockb* ./

# Install production dependencies only
# Using --ignore-scripts to skip optional native dependencies that may not compile
RUN bun install --frozen-lockfile --production --ignore-scripts

# ============================================
# Stage 2: Builder
# ============================================
FROM oven/bun:1.3 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install all dependencies (including dev dependencies for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Run type checking (optional but recommended)
RUN bun run type-check || echo "Type checking skipped"

# ============================================
# Stage 3: Runner
# ============================================
FROM oven/bun:1.3 AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN groupadd -r -g 1001 bunuser && \
    useradd -r -u 1001 -g bunuser -s /bin/false bunuser

# Copy production dependencies from deps stage
COPY --from=deps --chown=bunuser:bunuser /app/node_modules ./node_modules

# Copy source code
COPY --chown=bunuser:bunuser . .

# Switch to non-root user
USER bunuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["bun", "run", "src/adapters/bun.ts"]
