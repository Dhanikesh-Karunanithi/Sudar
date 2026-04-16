# ByteOS Studio — Production Dockerfile
# Multi-stage build for optimized production image with BASE_PATH support

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies for native modules (if needed)
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --legacy-peer-deps

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
COPY --from=builder /app/.next/standalone ./

# Copy prisma schema and migrations if needed at runtime
COPY --from=builder /app/prisma ./prisma

# Debug: show structure
RUN echo "=== /app structure ===" && ls -la /app && \
    echo "=== /app/app structure ===" && ls -la /app/app 2>/dev/null || true && \
    echo "=== Looking for server.js ===" && find /app -name "server.js" -maxdepth 3

# If server.js is in app/ subdirectory, we need to set up paths correctly
RUN if [ -f app/server.js ]; then \
        echo "server.js found in app/ - setting up correct paths"; \
        mkdir -p /app/app/.next; \
        ln -sf /app/.next/static /app/app/.next/static; \
        ln -sf /app/public /app/app/public; \
        ln -sf /app/prisma /app/app/prisma 2>/dev/null || true; \
    fi

# Copy static files and public assets (after symlink setup)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (can be overridden by PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/ || exit 1

# Start the application
CMD ["sh", "-c", "if [ -f server.js ]; then exec node server.js; elif [ -f app/server.js ]; then cd app && exec node server.js; else echo 'ERROR: server.js not found' && ls -la && exit 1; fi"]
