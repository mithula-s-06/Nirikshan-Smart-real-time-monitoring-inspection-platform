# ==============================================================================
# NIRIKSHAN Platform — Production Multi-Stage Container Image
# Department of Social Justice & Empowerment, Government of India
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Builder
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy root workspace and package manifests
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/validation/package*.json ./packages/validation/
COPY apps/api/package*.json ./apps/api/
COPY apps/admin-web/package*.json ./apps/admin-web/

# Install all workspace dependencies
RUN npm ci

# Copy full source trees
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY tsconfig.json ./

# Build shared packages
RUN npm run build:packages

# Build production frontend admin-web SPA
RUN npm run build:admin

# Build production backend API TypeScript
RUN npm run build:api

# Prune devDependencies for a lean production bundle
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment flags
ENV NODE_ENV=production
ENV PORT=5000
ENV SERVE_FRONTEND=true

# Add non-root system user for security compliance (GIGW / CERT-In requirement)
RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nirikshan

# Copy production runtime files from builder
COPY --from=builder --chown=nirikshan:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nirikshan:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder --chown=nirikshan:nodejs /app/packages/validation/dist ./packages/validation/dist
COPY --from=builder --chown=nirikshan:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nirikshan:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nirikshan:nodejs /app/apps/admin-web/dist ./apps/admin-web/dist
COPY --from=builder --chown=nirikshan:nodejs /app/package.json ./package.json

# Create uploads and logs directory with permissions
RUN mkdir -p ./uploads ./logs && chown -R nirikshan:nodejs ./uploads ./logs

# Switch to non-root user
USER nirikshan

# Expose primary port
EXPOSE 5000

# Healthcheck probe (GIGW 3.0 / Docker standard)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

# Start NIRIKSHAN Unified Server
CMD ["node", "apps/api/dist/server.js"]
