# ========================================
# Multi-stage Dockerfile for Auth Service
# Supports: development, production, cloudrun
# ========================================

# Stage 1: Development - Full dependencies with dev tools
FROM node:22-alpine AS development
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "run", "start:dev"]

# Stage 2: Builder - Build artifacts
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production runtime (for VM/docker-compose.prod)
FROM node:22-alpine AS production
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app
USER nodejs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "dist/main"]

# Stage 4: Cloud Run runtime (with Cloud SQL Auth Proxy)
FROM node:22-alpine AS cloudrun
WORKDIR /usr/src/app
COPY --from=gcr.io/cloud-sql-connectors/cloud-sql-proxy:alpine /cloud-sql-proxy /cloud-sql-proxy
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY cloud-run-entrypoint.sh /cloud-run-entrypoint.sh
RUN chmod +x /cloud-run-entrypoint.sh
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app
USER nodejs
EXPOSE 8080
CMD ["/cloud-run-entrypoint.sh"]
