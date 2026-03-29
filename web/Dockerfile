# ========================================
# Multi-stage Dockerfile for Frontend Web
# Supports: production, cloudrun
# Note: Development uses docker-compose with volume mounts for hot reload
# ========================================

# Stage 1: Builder - Build artifacts
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_GATEWAY_URL=http://localhost:8080
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL
RUN npm run build

# Stage 2: Production runtime (for VM/docker-compose.prod)
FROM nginx:alpine AS production
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Cloud Run runtime
FROM nginx:alpine AS cloudrun
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
