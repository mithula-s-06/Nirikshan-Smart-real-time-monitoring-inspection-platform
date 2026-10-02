FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo manifest files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/validation/package*.json ./packages/validation/
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy sources
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build shared packages and API
RUN npm run build --workspace=@nirikshan/shared-types
RUN npm run build --workspace=@nirikshan/validation
RUN npm run build --workspace=@nirikshan/api

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/validation/package*.json ./packages/validation/
COPY apps/api/package*.json ./apps/api/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/validation/dist ./packages/validation/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 5000

CMD ["node", "apps/api/dist/server.js"]
