FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/admin-web/package*.json ./apps/admin-web/

RUN npm ci

COPY packages/shared-types/ ./packages/shared-types/
COPY apps/admin-web/ ./apps/admin-web/

RUN npm run build --workspace=@nirikshan/shared-types
RUN npm run build --workspace=@nirikshan/admin-web

FROM nginx:alpine

COPY --from=builder /app/apps/admin-web/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
