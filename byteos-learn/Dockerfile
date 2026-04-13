# ByteOS Learn — Production Dockerfile
# Multi-stage build for optimized production image with BASE_PATH support

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies for native modules (if needed)
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables (NEXT_PUBLIC_* must be available at build time)
ARG NEXT_PUBLIC_BASE_PATH=""
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""

ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Debug: show what was built
RUN echo "=== Contents of .next/standalone ===" && \
    ls -la .next/standalone && \
    echo "=== Looking for server.js in standalone ===" && \
    find .next/standalone -name "server.js" 2>/dev/null

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output - Next.js monorepo structure has nested directories
# The standalone output preserves the project structure under .next/standalone/
COPY --from=builder /app/.next/standalone ./

# Check if server.js is in a subdirectory and move it to root
RUN if [ -f app/server.js ]; then \
        echo "Found server.js in app/ - moving to root"; \
        mv app/* . 2>/dev/null || true; \
    fi

# Copy static files and public assets
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Note: byteos-learn does not have a prisma directory (uses Supabase directly)

# Debug: show final structure
RUN echo "=== Final /app structure ===" && ls -la /app && \
    echo "=== server.js location ===" && find /app -name "server.js" -maxdepth 3

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (can be overridden by PORT env var)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3001}/ || exit 1

# Start the application
CMD ["node", "server.js"]
