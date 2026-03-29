# GCP Production Deployment Guide

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Chuẩn bị GCP Project](#2-chuẩn-bị-gcp-project)
3. [Thiết lập Cloud SQL](#3-thiết-lập-cloud-sql)
4. [Cấu hình Docker cho Cloud Run](#4-cấu-hình-docker-cho-cloud-run)
5. [Deploy API Gateway lên Cloud Run](#5-deploy-api-gateway-lên-cloud-run)
6. [Deploy Backend Services lên Cloud Run](#6-deploy-backend-services-lên-cloud-run)
7. [Deploy Frontend lên Cloud Run](#7-deploy-frontend-lên-cloud-run)
8. [Thiết lập CI/CD Pipeline](#8-thiết-lập-cicd-pipeline)
9. [Kiểm tra và Monitoring](#9-kiểm-tra-và-monitoring)
10. [Chi phí ước tính (Free Trial $300)](#10-chi-phí-ước-tính-free-trial-300)

---

## 1. Tổng quan kiến trúc

### 1.1 Sơ đồ kiến trúc Production

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GCP Cloud                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           VPC Network                                    ││
│  │                                                                          ││
│  │   ┌──────────────┐         ┌──────────────┐                            ││
│  │   │  Cloud Run    │         │  Cloud Run    │                            ││
│  │   │ auth-service  │◄───────▶│knowledge-svc  │                            ││
│  │   │  :3000        │         │   :3002       │                            ││
│  │   └──────┬───────┘         └───────┬───────┘                            ││
│  │          │                         │                                    ││
│  │          └────────────┬─────────────┘                                    ││
│  │                       │                                                  ││
│  │                       ▼                                                  ││
│  │              ┌─────────────────┐                                         ││
│  │              │ Cloud SQL Auth   │                                         ││
│  │              │    Proxy         │                                         ││
│  │              └────────┬─────────┘                                         ││
│  │                       │                                                  ││
│  │                       ▼                                                  ││
│  │              ┌─────────────────┐     ┌─────────────────┐                ││
│  │              │   Cloud SQL      │     │   Cloud Run     │                ││
│  │              │  ┌───────────┐   │     │   Frontend      │                ││
│  │              │  │ lifeos_  │   │     │    :8080        │                ││
│  │              │  │ auth     │   │     └────────┬────────┘                ││
│  │              │  ├───────────┤   │              │                         ││
│  │              │  │ lifeos_   │   │              │                         ││
│  │              │  │ knowledge │   │              ▼                         ││
│  │              │  └───────────┘   │      ┌─────────────────┐               ││
│  │              │   PostgreSQL     │      │   Cloud CDN     │               ││
│  │              │    15            │      │   (Static)      │               ││
│  │              └─────────────────┘      └─────────────────┘               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│                              GitHub Actions                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ci.yml → test only (PR/push)                                           ││
│  │  release.yml → build & push images (on tag)                             ││
│  │  deploy.yml → deploy to Cloud Run (manual/tag)                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 API Gateway - Nginx Reverse Proxy

API Gateway sử dụng **nginx** làm reverse proxy với các chức năng:


| Route              | Backend                  | Auth | Mô tả                                |
| ------------------ | ------------------------ | ---- | ------------------------------------ |
| `/api/auth/`*      | `auth-service:3000`      | ❌    | Authentication endpoints             |
| `/api/knowledge/*` | `knowledge-service:3002` | ✅    | Knowledge endpoints (JWT validation) |
| `/api/protected/*` | `auth-service:3000`      | ✅    | Protected auth endpoints             |


### 1.3 Danh sách Services


| Service             | Port | Cloud Run URL                          | Database           | Auth |
| ------------------- | ---- | -------------------------------------- | ------------------ | ---- |
| `api-gateway`       | 8080 | `lifeos-gateway-[hash]-uc.a.run.app`   | -                  | ❌    |
| `auth-service`      | 3000 | `lifeos-auth-[hash]-uc.a.run.app`      | `lifeos_auth`      | ❌    |
| `knowledge-service` | 3002 | `lifeos-knowledge-[hash]-uc.a.run.app` | `lifeos_knowledge` | ✅    |
| `frontend`          | 8080 | `lifeos-frontend-[hash]-uc.a.run.app`  | -                  | ❌    |


### 1.4 Data Flow

```
Browser Request
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Nginx)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. Validate JWT cho /api/knowledge/*                      │  │
│  │  2. Extract X-User-Id, X-User-Email từ token               │  │
│  │  3. Forward request đến backend services                   │  │
│  │  4. Handle CORS                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
      │
      ├──▶ Auth Service (JWT validation, login, register)
      │
      └──▶ Knowledge Service (file storage, knowledge management)
```

### 1.5 So sánh: Có API Gateway vs Không có


| Khía cạnh                | Có API Gateway ✅            | Không có API Gateway          |
| ------------------------ | --------------------------- | ----------------------------- |
| **Kiến trúc**            | Client → Gateway → Services | Client → Services trực tiếp   |
| **Authentication**       | Tập trung tại Gateway       | Mỗi service tự validate JWT   |
| **CORS**                 | Xử lý tập trung             | Mỗi service phải handle riêng |
| **Số lượng Public URLs** | 1 (Gateway)                 | 2+ (mỗi service 1 URL)        |
| **Chi phí**              | Thêm 1 Cloud Run            | Tiết kiệm ~$5-10/tháng        |
| **Độ phức tạp**          | Cao hơn                     | Đơn giản hơn                  |


**Chọn Có API Gateway** vì: Dễ quản lý hơn, URL public duy nhất, authentication tập trung.

---

## 2. Chuẩn bị GCP Project

### 2.1 Tạo GCP Project (nếu chưa có)

```bash
# Cài đặt Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Đăng nhập
gcloud auth login

# Tạo project mới
gcloud projects create hoangphuc3604 --name="LifeOS Production"

# Set project làm default
gcloud config set project hoangphuc3604

# Enable billing (required for Cloud SQL, Cloud Run)
# Làm theo hướng dẫn trong console để link billing account
```

### 2.2 Enable APIs cần thiết

```bash
# Enable các APIs cần thiết
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com servicenetworking.googleapis.com vpcaccess.googleapis.com
```

### 2.3 Cấu hình Artifact Registry

```bash
# Tạo Artifact Registry để lưu Docker images (lưu ý: dùng asia-southeast1 thay vì asia-southeast1)
gcloud artifacts repositories create lifeos-registry --repository-format=docker --location=asia-southeast1 --description="LifeOS Docker images"

# Cấu hình Docker authentication
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

> **Lưu ý:** Artifact Registry sử dụng `asia-southeast1` thay vì `asia-southeast1`

### 2.4 Thiết lập VPC Network

```bash
# Tạo VPC network riêng
gcloud compute networks create lifeos-vpc --subnet-mode=custom --bgp-routing-mode=regional

# Tạo subnet cho Cloud Run
gcloud compute networks subnets create lifeos-subnet --network=lifeos-vpc --region=asia-southeast1 --range=10.0.0.0/24

# Tạo Serverless VPC Access connector (để Cloud Run kết nối VPC)
gcloud compute networks vpc-access connectors create lifeos-connector --region=asia-southeast1 --network=lifeos-vpc --range=10.8.0.0/28
```

---

## 3. Thiết lập Cloud SQL

### 3.1 Tạo Cloud SQL Instances

```bash
# Tạo Cloud SQL instance cho Auth Service
gcloud sql instances create lifeos-auth-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=asia-southeast1 --storage-type=SSD --storage-size=10GB --network=projects/hoangphuc3604/global/networks/lifeos-vpc --no-assign-ip --enable-google-private-path

# Tạo Cloud SQL instance cho Knowledge Service
gcloud sql instances create lifeos-knowledge-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=asia-southeast1 --storage-type=SSD --storage-size=10GB --network=projects/hoangphuc3604/global/networks/lifeos-vpc --no-assign-ip --enable-google-private-path
```

### 3.2 Tạo Databases và Users

```bash
# Tạo database cho auth-service
gcloud sql databases create lifeos_auth --instance=lifeos-auth-db

# Tạo user cho auth-service
gcloud sql users create lifeos_auth_user --instance=lifeos-auth-db --password=YOUR_SECURE_PASSWORD

# Tạo database cho knowledge-service
gcloud sql databases create lifeos_knowledge --instance=lifeos-knowledge-db

# Tạo user cho knowledge-service
gcloud sql users create lifeos_knowledge_user --instance=lifeos-knowledge-db --password=YOUR_SECURE_PASSWORD
```

### 3.3 Cấu hình Private IP

```bash
# Lấy Private IP của các instances
gcloud sql instances describe lifeos-auth-db --format="value(ipAddresses.ipAddress)"

gcloud sql instances describe lifeos-knowledge-db --format="value(ipAddresses.ipAddress)"

# Kết quả sẽ có dạng:
# lifeos-auth-db: 10.0.0.3
# lifeos-knowledge-db: 10.0.0.4
```

---

## 4. Cấu hình Docker cho Cloud Run

### 4.1 Cập nhật Dockerfile cho Auth Service

```dockerfile
# services/auth-service/Dockerfile.cloudrun
FROM node:22-alpine AS production

WORKDIR /usr/src/app

# Cài đặt Cloud SQL Auth Proxy
COPY --from=gcr.io/cloud-sql-connectors/cloud-sql-proxy:alpine /cloud-sql-proxy /cloud-sql-proxy

# Cài đặt openssl cho Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build
RUN npm run build

# Tạo entrypoint script
RUN chmod +x cloud-run-entrypoint.sh

EXPOSE 3000

CMD ["./cloud-run-entrypoint.sh"]
```

### 4.2 Tạo Entry Point Script cho Cloud Run

```bash
#!/bin/sh
# services/auth-service/cloud-run-entrypoint.sh

# Khởi động Cloud SQL Auth Proxy
echo "Starting Cloud SQL Auth Proxy..."
/cloud-sql-proxy --port 5432 hoangphuc3604:asia-southeast1:lifeos-auth-db &

# Đợi proxy khởi động
sleep 3

# Chạy ứng dụng
echo "Starting application..."
exec "$@"
```

### 4.3 Cập nhật Dockerfile cho Knowledge Service

```dockerfile
# services/knowledge-service/Dockerfile.cloudrun
FROM node:22-alpine AS production

WORKDIR /usr/src/app

# Cài đặt Cloud SQL Auth Proxy
COPY --from=gcr.io/cloud-sql-connectors/cloud-sql-proxy:alpine /cloud-sql-proxy /cloud-sql-proxy

# Cài đặt openssl
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Tạo thư mục uploads
RUN mkdir -p uploads

# Copy source code
COPY . .

# Build
RUN npm run build

# Tạo entrypoint script
RUN chmod +x cloud-run-entrypoint.sh

EXPOSE 3002

CMD ["./cloud-run-entrypoint.sh"]
```

### 4.4 Tạo Entry Point Script cho Knowledge Service

```bash
#!/bin/sh
# services/knowledge-service/cloud-run-entrypoint.sh

# Khởi động Cloud SQL Auth Proxy
echo "Starting Cloud SQL Auth Proxy..."
/cloud-sql-proxy --port 5432 hoangphuc3604:asia-southeast1:lifeos-knowledge-db &

# Đợi proxy khởi động
sleep 3

# Chạy ứng dụng
echo "Starting application..."
exec "$@"
```

### 4.5 Dockerfile cho API Gateway (Cloud Run)

API Gateway cần config nginx để proxy đến các backend services (auth-service, knowledge-service). Vì trên Cloud Run các services không có internal DNS cố định, ta cần sử dụng service URLs.

```dockerfile
# services/api-gateway/Dockerfile.cloudrun
FROM nginx:alpine

# Copy nginx config
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/snippets/*.conf /etc/nginx/snippets/

# Health check endpoint
RUN echo '# Health check' > /usr/share/nginx/html/health.html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

### 4.6 Nginx Config cho API Gateway (Cloud Run)

Cần cập nhật nginx config để proxy đến Cloud Run service URLs (thay vì Docker network names).

```nginx
# services/api-gateway/nginx/conf.d/default.conf.cloudrun

# Auth Service configuration - sẽ được set qua env variable
set $auth_service "${AUTH_SERVICE_URL}";

# Knowledge Service configuration - sẽ được set qua env variable
set $knowledge_service "${KNOWLEDGE_SERVICE_URL}";

server {
    listen 8080;
    server_name localhost;

    # Health check endpoint
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    location /api/auth/ {
        # Proxy đến auth-service Cloud Run
        proxy_pass $auth_service/auth/;
        include /etc/nginx/snippets/proxy_params.conf;
        include /etc/nginx/snippets/cors.conf;

        if ($request_method = OPTIONS) {
            return 204;
        }
    }

    location = /auth/validate {
        internal;
        proxy_pass $auth_service/auth/validate;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_set_header X-Original-URI $request_uri;
        proxy_set_header Authorization $http_authorization;
    }

    location /api/knowledge/ {
        if ($request_method = OPTIONS) {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
            return 204;
        }

        auth_request /auth/validate;
        auth_request_set $user_id $upstream_http_x_user_id;
        auth_request_set $user_email $upstream_http_x_user_email;

        proxy_set_header Authorization "";
        proxy_set_header X-User-Id $user_id;
        proxy_set_header X-User-Email $user_email;

        # Proxy đến knowledge-service Cloud Run
        proxy_pass $knowledge_service/;
        include /etc/nginx/snippets/proxy_params.conf;
        include /etc/nginx/snippets/cors.conf;
    }

    location /api/protected/ {
        if ($request_method = OPTIONS) {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
            return 204;
        }

        auth_request /auth/validate;
        auth_request_set $user_id $upstream_http_x_user_id;
        auth_request_set $user_email $upstream_http_x_user_email;

        proxy_set_header Authorization "";
        proxy_set_header X-User-Id $user_id;
        proxy_set_header X-User-Email $user_email;

        proxy_pass $auth_service/auth/public-protected;
        include /etc/nginx/snippets/proxy_params.conf;
        include /etc/nginx/snippets/cors.conf;
    }

    location / {
        return 404;
    }
}
```

**Lưu ý:** Trên Cloud Run, các services giao tiếp qua public URLs. Cần deploy theo thứ tự:

1. Auth Service (deploy trước để lấy URL)
2. Knowledge Service (deploy trước để lấy URL)
3. API Gateway (deploy cuối với URLs của 2 services trên)

### 4.7 Dockerfile cho Frontend (Cloud Run)

```dockerfile
# web/Dockerfile.cloudrun
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build React app
ENV REACT_APP_API_GATEWAY_URL=https://lifeos-gateway-[hash]-uc.a.run.app
RUN npm run build

# Multi-stage: Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

### 4.6 Nginx Config cho Frontend

```nginx
# web/nginx.conf
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # React Router - SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (tùy chọn - hoặc có thể gọi trực tiếp)
    location /api/ {
        proxy_pass https://lifeos-gateway-[hash]-uc.a.run.app/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 5. Deploy API Gateway lên Cloud Run

### 5.1 Deploy Order

**Quan trọng:** Cần deploy theo thứ tự để API Gateway có thể proxy đúng:

```
1. Auth Service → Lấy URL
2. Knowledge Service → Lấy URL
3. API Gateway → Dùng URLs từ bước 1 & 2
4. Frontend → Dùng API Gateway URL
```

### 5.2 Deploy Auth Service (Bước 1)

```bash
# Build và push image lên Artifact Registry
gcloud builds submit services/auth-service --tag asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/auth-service:latest

# Deploy lên Cloud Run
gcloud run deploy auth-service --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/auth-service:latest --region asia-southeast1 --platform managed --no-allow-unauthenticated --vpc-connector lifeos-connector --vpc-egress all-traffic --set-env-vars "NODE_ENV=production" --set-env-vars "CLOUD_SQL_INSTANCE=hoangphuc3604:asia-southeast1:lifeos-auth-db" --set-env-vars "DATABASE_URL=postgresql://lifeos_auth_user:password@127.0.0.1:5432/lifeos_auth" --set-env-vars "JWT_SECRET=YOUR_JWT_SECRET" --set-env-vars "PORT=8080" --memory 512Mi --cpu 1 --min-instances 0 --max-instances 10 --concurrency 80 --timeout 60s

# Lấy Auth Service URL
AUTH_URL=$(gcloud run services describe auth-service --region asia-southeast1 --format="value(status.url)")
echo "Auth Service URL: $AUTH_URL"
```

### 5.3 Deploy Knowledge Service (Bước 2)

```bash
# Build và push image
gcloud builds submit services/knowledge-service --tag asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/knowledge-service:latest

# Deploy lên Cloud Run
gcloud run deploy knowledge-service --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/knowledge-service:latest --region asia-southeast1 --platform managed --no-allow-unauthenticated --vpc-connector lifeos-connector --vpc-egress all-traffic --set-env-vars "NODE_ENV=production" --set-env-vars "CLOUD_SQL_INSTANCE=hoangphuc3604:asia-southeast1:lifeos-knowledge-db" --set-env-vars "DATABASE_URL=postgresql://lifeos_knowledge_user:password@127.0.0.1:5432/lifeos_knowledge" --set-env-vars "JWT_SECRET=YOUR_JWT_SECRET" --set-env-vars "UPLOAD_DIR=./uploads" --set-env-vars "MAX_FILE_SIZE=10485760" --memory 512Mi --cpu 1 --min-instances 0 --max-instances 10 --concurrency 80 --timeout 60s

# Lấy Knowledge Service URL
KNOWLEDGE_URL=$(gcloud run services describe knowledge-service --region asia-southeast1 --format="value(status.url)")
echo "Knowledge Service URL: $KNOWLEDGE_URL"
```

### 5.4 Deploy API Gateway (Bước 3)

```bash
# Build và push image
gcloud builds submit services/api-gateway --tag asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/api-gateway:latest

# Deploy API Gateway với service URLs
gcloud run deploy api-gateway --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/api-gateway:latest --region asia-southeast1 --platform managed --allow-unauthenticated --set-env-vars "AUTH_SERVICE_URL=https://lifeos-auth-[hash]-uc.a.run.app" --set-env-vars "KNOWLEDGE_SERVICE_URL=https://lifeos-knowledge-[hash]-uc.a.run.app" --port 8080 --memory 256Mi --cpu 1 --min-instances 0 --max-instances 10 --concurrency 100

# Lấy API Gateway URL
GATEWAY_URL=$(gcloud run services describe api-gateway --region asia-southeast1 --format="value(status.url)")
echo "API Gateway URL: $GATEWAY_URL"
```

**Lưu ý:** Thay `[hash]` bằng hash thực tế của services hoặc update URLs sau khi deploy thành công.

---

```bash
# Auth Service URL
gcloud run services describe auth-service --region asia-southeast1 --format="value(status.url)"

# Knowledge Service URL
gcloud run services describe knowledge-service --region asia-southeast1 --format="value(status.url)"

# Frontend URL
gcloud run services describe frontend --region asia-southeast1 --format="value(status.url)"

# Kết quả mẫu:
# https://lifeos-auth-abc123-uc.a.run.app
# https://lifeos-knowledge-xyz789-uc.a.run.app
# https://lifeos-frontend-def456-uc.a.run.app
```

---

## 6. Deploy Frontend lên Cloud Run

### 6.1 Cập nhật API Configuration

Sau khi deploy services, cập nhật frontend để sử dụng đúng URLs:

```typescript
// web/src/lib/api/client.ts
const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 
  'https://lifeos-gateway-abc123-uc.a.run.app';

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/api/auth`,
  KNOWLEDGE: `${API_BASE_URL}/api/knowledge`,
};
```

### 6.2 Environment Variables

Tạo file `.env.production`:

```bash
# web/.env.production
REACT_APP_API_GATEWAY_URL=https://lifeos-gateway-abc123-uc.a.run.app
REACT_APP_AUTH_SERVICE_URL=https://lifeos-auth-abc123-uc.a.run.app
REACT_APP_KNOWLEDGE_SERVICE_URL=https://lifeos-knowledge-xyz789-uc.a.run.app
```

### 6.3 Rebuild và Redeploy Frontend

```bash
cd web

# Build với production env
REACT_APP_API_GATEWAY_URL=https://lifeos-gateway-abc123-uc.a.run.app npm run build

# Push image
gcloud builds submit web --tag asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/frontend:latest

# Redeploy
gcloud run deploy frontend --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/frontend:latest --region asia-southeast1
```

---

## 7. Thiết lập CI/CD Pipeline

### 7.1 File ci.yml - Chỉ Test

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

env:
  NODE_VERSION: '22'

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run type-check

  test-services:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth-service, knowledge-service, api-gateway]
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: ${{ matrix.service }}/package-lock.json

      - name: Install and test ${{ matrix.service }}
        working-directory: ./${{ matrix.service }}
        run: |
          npm ci
          npx prisma generate
          npm run test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install and test frontend
        working-directory: ./web
        run: |
          npm ci
          npm run test
```

### 7.2 File release.yml - Build và Push Images

```yaml
# .github/workflows/release.yml
name: Release Pipeline

on:
  push:
    tags:
      - 'v*.*.*'

env:
  REGISTRY: asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry
  NODE_VERSION: '22'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      # Authenticate to Google Cloud
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      # Setup gcloud
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      # Set lower case owner
      - name: Set version variables
        run: |
          echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV
          echo "SHORT_SHA=${GITHUB_SHA::8}" >> $GITHUB_ENV

      # Build API Gateway
      - name: Build and push API Gateway
        run: |
          gcloud builds submit services/api-gateway \
            --tag ${{ env.REGISTRY }}/api-gateway:${{ env.VERSION }} \
            --file services/api-gateway/Dockerfile.cloudrun

      # Build Auth Service
      - name: Build and push Auth Service
        run: |
          gcloud builds submit services/auth-service \
            --tag ${{ env.REGISTRY }}/auth-service:${{ env.VERSION }} \
            --file services/auth-service/Dockerfile.cloudrun

      # Build Knowledge Service
      - name: Build and push Knowledge Service
        run: |
          gcloud builds submit services/knowledge-service \
            --tag ${{ env.REGISTRY }}/knowledge-service:${{ env.VERSION }} \
            --file services/knowledge-service/Dockerfile.cloudrun

      # Build Frontend
      - name: Build and push Frontend
        env:
          REACT_APP_API_GATEWAY_URL: ${{ secrets.API_GATEWAY_URL }}
        run: |
          cd web
          REACT_APP_API_GATEWAY_URL=${{ secrets.API_GATEWAY_URL }} npm run build
          gcloud builds submit web \
            --tag ${{ env.REGISTRY }}/frontend:${{ env.VERSION }} \
            --file web/Dockerfile.cloudrun

      # Tag as latest
      - name: Tag as latest
        run: |
          gcloud artifacts docker tags add \
            ${{ env.REGISTRY }}/api-gateway:${{ env.VERSION }} \
            ${{ env.REGISTRY }}/api-gateway:latest
          
          gcloud artifacts docker tags add \
            ${{ env.REGISTRY }}/auth-service:${{ env.VERSION }} \
            ${{ env.REGISTRY }}/auth-service:latest
          
          gcloud artifacts docker tags add \
            ${{ env.REGISTRY }}/knowledge-service:${{ env.VERSION }} \
            ${{ env.REGISTRY }}/knowledge-service:latest
          
          gcloud artifacts docker tags add \
            ${{ env.REGISTRY }}/frontend:${{ env.VERSION }} \
            ${{ env.REGISTRY }}/frontend:latest
```

### 7.3 File deploy.yml - Deploy lên Cloud Run

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - staging
  release:
    types: [published]

env:
  REGISTRY: asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry
  PROJECT_ID: hoangphuc3604
  REGION: asia-southeast1

jobs:
  deploy-services:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'production' }}
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Set version
        run: |
          if [[ "${{ github.event_name }}" == "release" ]]; then
            echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV
          else
            echo "VERSION=latest" >> $GITHUB_ENV
          fi

      # Deploy Auth Service FIRST (needed by API Gateway)
      - name: Deploy Auth Service
        run: |
          gcloud run deploy auth-service \
            --image ${{ env.REGISTRY }}/auth-service:${{ env.VERSION }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --no-allow-unauthenticated \
            --vpc-connector lifeos-connector \
            --vpc-egress all-traffic \
            --set-env-vars "NODE_ENV=production" \
            --set-env-vars "CLOUD_SQL_INSTANCE=hoangphuc3604:asia-southeast1:lifeos-auth-db" \
            --set-env-vars "DATABASE_URL=${{ secrets.AUTH_DATABASE_URL }}" \
            --set-env-vars "JWT_SECRET=${{ secrets.JWT_SECRET }}" \
            --set-env-vars "JWT_EXPIRATION=15m" \
            --memory 512Mi \
            --cpu 1 \
            --min-instances 0 \
            --max-instances 10 \
            --concurrency 80 \
            --timeout 60s

      # Get Auth Service URL
      - name: Get Auth Service URL
        id: auth-url
        run: |
          AUTH_URL=$(gcloud run services describe auth-service --region ${{ env.REGION }} --format='value(status.url)')
          echo "auth_url=$AUTH_URL" >> $GITHUB_OUTPUT

      # Deploy Knowledge Service SECOND (needed by API Gateway)
      - name: Deploy Knowledge Service
        run: |
          gcloud run deploy knowledge-service \
            --image ${{ env.REGISTRY }}/knowledge-service:${{ env.VERSION }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --no-allow-unauthenticated \
            --vpc-connector lifeos-connector \
            --vpc-egress all-traffic \
            --set-env-vars "NODE_ENV=production" \
            --set-env-vars "CLOUD_SQL_INSTANCE=hoangphuc3604:asia-southeast1:lifeos-knowledge-db" \
            --set-env-vars "DATABASE_URL=${{ secrets.KNOWLEDGE_DATABASE_URL }}" \
            --set-env-vars "JWT_SECRET=${{ secrets.JWT_SECRET }}" \
            --set-env-vars "JWT_EXPIRATION=15m" \
            --set-env-vars "PORT=8080" \
            --set-env-vars "UPLOAD_DIR=./uploads" \
            --set-env-vars "MAX_FILE_SIZE=10485760" \
            --memory 512Mi \
            --cpu 1 \
            --min-instances 0 \
            --max-instances 10 \
            --concurrency 80 \
            --timeout 60s

      # Get Knowledge Service URL
      - name: Get Knowledge Service URL
        id: knowledge-url
        run: |
          KNOWLEDGE_URL=$(gcloud run services describe knowledge-service --region ${{ env.REGION }} --format='value(status.url)')
          echo "knowledge_url=$KNOWLEDGE_URL" >> $GITHUB_OUTPUT

      # Deploy API Gateway LAST (needs backend URLs)
      - name: Deploy API Gateway
        run: |
          gcloud run deploy api-gateway \
            --image ${{ env.REGISTRY }}/api-gateway:${{ env.VERSION }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "AUTH_SERVICE_URL=${{ steps.auth-url.outputs.auth_url }}" \
            --set-env-vars "KNOWLEDGE_SERVICE_URL=${{ steps.knowledge-url.outputs.knowledge_url }}" \
            --port 8080 \
            --memory 256Mi \
            --cpu 1 \
            --min-instances 0 \
            --max-instances 10 \
            --concurrency 100

      # Deploy Frontend
      - name: Deploy Frontend
        run: |
          gcloud run deploy frontend \
            --image ${{ env.REGISTRY }}/frontend:${{ env.VERSION }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --port 8080 \
            --memory 256Mi \
            --cpu 1 \
            --min-instances 0 \
            --max-instances 5 \
            --concurrency 1000

      # Get URLs
      - name: Get deployed URLs
        run: |
          echo "=== Deployed URLs ==="
          echo "API Gateway: $(gcloud run services describe api-gateway --region ${{ env.REGION }} --format='value(status.url)')"
          echo "Auth Service: $(gcloud run services describe auth-service --region ${{ env.REGION }} --format='value(status.url)')"
          echo "Knowledge Service: $(gcloud run services describe knowledge-service --region ${{ env.REGION }} --format='value(status.url)')"
          echo "Frontend: $(gcloud run services describe frontend --region ${{ env.REGION }} --format='value(status.url)')"

      # Run database migrations
      - name: Run Prisma migrations
        run: |
          # Migration for Auth Service
          echo "DATABASE_URL=${{ secrets.AUTH_DATABASE_URL }}" > services/auth-service/.env
          cd services/auth-service && npx prisma migrate deploy
          
          # Migration for Knowledge Service
          echo "DATABASE_URL=${{ secrets.KNOWLEDGE_DATABASE_URL }}" > services/knowledge-service/.env
          cd ../knowledge-service && npx prisma migrate deploy
```

### 8.4 Cấu hình GitHub Secrets

Thêm các secrets sau vào GitHub repository:


| Secret Name              | Mô tả                                | Ví dụ giá trị                                                 |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------- |
| `GCP_SA_KEY`             | JSON key của Service Account         | `{...}`                                                       |
| `AUTH_DATABASE_URL`      | Connection string cho auth DB        | `postgresql://user:pass@/lifeos_auth?host=/cloudsql/...`      |
| `KNOWLEDGE_DATABASE_URL` | Connection string cho knowledge DB   | `postgresql://user:pass@/lifeos_knowledge?host=/cloudsql/...` |
| `JWT_SECRET`             | Secret key cho JWT                   | `your-secure-jwt-secret`                                      |
| `API_GATEWAY_URL`        | URL của API Gateway (sau khi deploy) | `https://lifeos-gateway-abc123-uc.a.run.app`                  |


### 7.5 Tạo Service Account cho GitHub Actions

```bash
# Tạo Service Account
gcloud iam service-accounts create github-actions --display-name="GitHub Actions CI/CD"

# Grant các quyền cần thiết
gcloud projects add-iam-policy-binding hoangphuc3604 --member="serviceAccount:github-actions@hoangphuc3604.iam.gserviceaccount.com" --role="roles/run.admin"

gcloud projects add-iam-policy-binding hoangphuc3604 --member="serviceAccount:github-actions@hoangphuc3604.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding hoangphuc3604 --member="serviceAccount:github-actions@hoangphuc3604.iam.gserviceaccount.com" --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding hoangphuc3604 --member="serviceAccount:github-actions@hoangphuc3604.iam.gserviceaccount.com" --role="roles/iam.serviceAccountUser"

# Tạo và download key
gcloud iam service-accounts keys create github-actions-key.json --iam-account=github-actions@hoangphuc3604.iam.gserviceaccount.com

# Copy nội dung file này vào GitHub Secret GCP_SA_KEY
cat github-actions-key.json
```

---

## 8. Kiểm tra và Monitoring

### 8.1 Kiểm tra Services

```bash
# Kiểm tra trạng thái các services
gcloud run services list --region asia-southeast1

# Xem logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# Test auth service health
curl $(gcloud run services describe auth-service --region asia-southeast1 --format="value(status.url)")/health

# Test knowledge service health
curl $(gcloud run services describe knowledge-service --region asia-southeast1 --format="value(status.url)")/health
```

### 8.2 Cấu hình Logging và Monitoring

```bash
# Enable Cloud Operations
gcloud services enable cloudlogging.googleapis.com monitoring.googleapis.com

# Tạo log-based metric cho monitoring
gcloud logging metrics create error-rate --description="Error rate for LifeOS services" --log-filter='resource.type="cloud_run_revision" severity>=ERROR'
```

### 8.3 Cấu hình Alerts

Trong GCP Console → Monitoring → Alerting:

1. **CPU Usage Alert**: Alert khi CPU > 80% trong 5 phút
2. **Memory Usage Alert**: Alert khi Memory > 80%
3. **Latency Alert**: Alert khi P99 latency > 2s
4. **Error Rate Alert**: Alert khi 5xx errors > 5%

---

## 10. Chi phí ước tính (Free Trial $300)

### 10.1 Tổng quan chi phí hàng tháng

Với kiến trúc gồm 4 services (API Gateway, Auth Service, Knowledge Service, Frontend) + 2 Cloud SQL instances:


| Dịch vụ               | SKU             | Free Tier/tháng        | Chi phí ước tính |
| --------------------- | --------------- | ---------------------- | ---------------- |
| **Cloud Run**         |                 |                        |                  |
| - API Gateway         | vCPU, GB-second | 400,000 GB-sec         | $0-3             |
| - Auth Service        | vCPU, GB-second | miễn phí               | $0-2             |
| - Knowledge Service   | vCPU, GB-second | miễn phí               | $0-2             |
| - Frontend            | vCPU, GB-second | miễn phí               | $0-1             |
| **Cloud SQL**         |                 |                        |                  |
| - Auth DB             | db-f1-micro     | **MIỄN PHÍ VĨNH VIỄN** | $0               |
| - Knowledge DB        | db-f1-micro     | **MIỄN PHÍ VĨNH VIỄN** | $0               |
| **Cloud Build**       | Build minutes   | 120 min                | $5-15            |
| **Artifact Registry** | Storage         | 0.5 GB                 | $0-1             |
| **Network Egress**    | Outbound        | ~1 GB                  | $0-2             |
| **VPC Connector**     | Instance hours  | 100 hours              | $0-3             |
|                       |                 | **Tổng cộng**          | **$5-27/tháng**  |


### 10.2 Chi tiết tính toán cho Cloud Run

**Giả định:** 1,000 users active, mỗi user 50 requests/ngày

```
Tổng requests/tháng = 1,000 users × 50 requests × 30 ngày = 1,500,000 requests
```


| Service           | vCPU | Memory | Requests/tháng | Compute Cost | Egress Cost | Tổng  |
| ----------------- | ---- | ------ | -------------- | ------------ | ----------- | ----- |
| API Gateway       | 1    | 256MB  | 1,500,000      | ~$2          | ~$1         | ~$3   |
| Auth Service      | 1    | 512MB  | 500,000        | ~$1          | ~$0.5       | ~$1.5 |
| Knowledge Service | 1    | 512MB  | 1,000,000      | ~$1.5        | ~$0.5       | ~$2   |
| Frontend          | 1    | 256MB  | 1,500,000      | ~$1          | ~$1         | ~$2   |


**Chi phí Cloud Run Always Free:**

- 2,000,000 requests/tháng ✅
- 400,000 vCPU-giây/tháng ✅
- 200,000 GB-giây/tháng ✅

### 10.3 Chi tiết tính toán cho Cloud SQL

**2 instances db-f1-micro (Always Free):**


| Instance            | Tier        | Instance hours | Storage | Tổng   |
| ------------------- | ----------- | -------------- | ------- | ------ |
| lifeos-auth-db      | db-f1-micro | 730h (24×30)   | 10GB    | **$0** |
| lifeos-knowledge-db | db-f1-micro | 730h (24×30)   | 10GB    | **$0** |


**Lưu ý:** db-f1-micro là shared-core instance, miễn phí vĩnh viễn trong limit.

### 10.4 Chi tiết tính toán cho Cloud Build

**Mỗi lần release:**

- Auth Service: ~2 phút build
- Knowledge Service: ~2 phút build
- API Gateway: ~1 phút build
- Frontend: ~3 phút build


| Release/tháng | Tổng minutes | Chi phí (120min miễn phí) |
| ------------- | ------------ | ------------------------- |
| 2 releases    | 16 min       | $0 (trong free tier)      |
| 4 releases    | 32 min       | $0 (trong free tier)      |
| 8 releases    | 64 min       | $0 (trong free tier)      |
| 12 releases   | 96 min       | $0 (trong free tier)      |


### 10.5 Chi phí khi Free Trial hết ($300)


| Phase         | Tháng đầu | Các tháng sau |
| ------------- | --------- | ------------- |
| **Miễn phí**  | ~$0-5     | ~$5-27        |
| **Trial hết** |           | ~$5-27/tháng  |


### 10.6 So sánh: Always Free vs Paid


| Dịch vụ               | Always Free Limit                       | Paid Pricing            |
| --------------------- | --------------------------------------- | ----------------------- |
| Cloud Run             | 2M requests, 400K GB-sec, 180K vCPU-sec | $0.00002400/vCPU-giây   |
| Cloud SQL db-f1-micro | 1 instance vĩnh viễn                    | ~$7-9/tháng nếu upgrade |
| Cloud Build           | 120 phút/tháng                          | $0.0035/giây            |
| Artifact Registry     | 0.5 GB                                  | $0.10/GB/tháng          |


### 10.7 Recommendations để tối ưu chi phí

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chiến lược tiết kiệm                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 🚫 Tắt không cần thiết                                       │
│     - Xóa Cloud SQL instances không dùng                        │
│     - Limit Cloud Build concurrent builds = 1                    │
│     - Sử dụng min-instances = 0 cho tất cả services             │
│                                                                  │
│  2. 📦 Cache hiệu quả                                           │
│     - Enable Cloud Run built-in caching                         │
│     - Sử dụng CDN cho frontend static assets                     │
│                                                                  │
│  3. 🔧 Tối ưu Docker images                                      │
│     - Multi-stage builds để giảm image size                     │
│     - Alpine-based images để giảm storage                       │
│                                                                  │
│  4. 📊 Monitoring chặt chẽ                                     │
│     - Set billing budget alerts ($50, $100)                     │
│     - Theo dõi Cloud Run metrics thường xuyên                   │
│                                                                  │
│  5. 🎯 Production-ready                                        │
│     - Chỉ enable production khi cần                            │
│     - Dùng staging để test trước                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.8 Billing Budget Alert Setup

```bash
# Tạo budget alert
gcloud billing budgets create --billing-account=BILLING_ACCOUNT_ID --display-name="LifeOS Budget Alert" --budget-amount=100USD --threshold-rule-rule=PERCENTAGE=0.5 --threshold-rule-rule=PERCENTAGE=0.9

# Tạo notification
gcloud billing budgets create --billing-account=BILLING_ACCOUNT_ID --notification-channel=CHANNEL_ID --threshold-rule-rule=PERCENTAGE=0.8
```

### 10.9 Free Trial $300 sử dụng được bao lâu?


| Mức sử dụng             | Chi phí/tháng | Trial $300 dùng được |
| ----------------------- | ------------- | -------------------- |
| Rất thấp (dev only)     | $5-10         | 5-6 tháng            |
| Trung bình (production) | $15-25        | 1-2 tháng            |
| Cao (nhiều releases)    | $25-40        | < 1 tháng            |


**Khuyến nghị:** Khi trial hết, chi phí ~$5-27/tháng - rẻ hơn nhiều so với VPS truyền thống.

### 10.10 Các chi phí ẩn cần tránh


| Chi phí             | Nguyên nhân                         | Cách tránh              |
| ------------------- | ----------------------------------- | ----------------------- |
| Cloud SQL egress    | Truy cập từ Cloud Run bên ngoài VPC | Đặt Cloud Run trong VPC |
| Cloud Build storage | Lưu logs quá lâu                    | Tự động xóa sau 7 ngày  |
| Artifact Registry   | Quá nhiều old images                | Auto-delete sau 30 ngày |
| Cloud Monitoring    | Advanced features                   | Chỉ dùng basic          |
| Cloud Logging       | Lưu quá nhiều logs                  | Set retention = 7 ngày  |


---

## 11. Troubleshooting

### 10.1 Lỗi thường gặp

#### Lỗi 1: Cloud SQL Auth Proxy không kết nối được

```bash
# Kiểm tra VPC connector
gcloud compute networks vpc-access connectors describe lifeos-connector --region asia-southeast1

# Kiểm tra Cloud SQL IAM permissions
gcloud projects add-iam-policy-binding hoangphuc3604 --member="serviceAccount:hoangphuc3604@appspot.gserviceaccount.com" --role="roles/cloudsql.client"
```

#### Lỗi 2: Image không tìm thấy

```bash
# Kiểm tra Artifact Registry
gcloud artifacts repositories describe lifeos-registry --location=asia-southeast1

# List images
gcloud artifacts docker images list asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry
```

#### Lỗi 3: Deployment thất bại

```bash
# Xem chi tiết lỗi
gcloud run services describe auth-service --region asia-southeast1

# Xem Cloud Build logs
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

### 10.2 Rollback Strategy

```bash
# Rollback về version cũ
gcloud run deploy auth-service --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/auth-service:[PREVIOUS_TAG] --region asia-southeast1
```

---

## 11. Checklist Triển khai

### Chuẩn bị

- Tạo GCP Project
- Enable APIs cần thiết
- Tạo Service Account cho GitHub Actions
- Thêm GitHub Secrets

### Infrastructure

- Tạo VPC Network
- Tạo VPC Connector
- Tạo Cloud SQL instances (2)
- Tạo databases và users
- Tạo Artifact Registry

### Docker

- Cập nhật Dockerfile cho auth-service (Cloud SQL Auth Proxy)
- Cập nhật Dockerfile cho knowledge-service (Cloud SQL Auth Proxy)
- Tạo Dockerfile cho api-gateway (Cloud Run)
- Tạo nginx config cho api-gateway (proxy đến Cloud Run URLs)
- Tạo Dockerfile cho frontend
- Tạo cloud-run-entrypoint.sh scripts

### Deployment Order (QUAN TRỌNG)

1. [ ] Deploy auth-service lên Cloud Run (không authenticated)
2. [ ] Deploy knowledge-service lên Cloud Run (không authenticated)
3. [ ] Deploy api-gateway lên Cloud Run (authenticated, dùng URLs từ 1&2)
4. [ ] Deploy frontend lên Cloud Run (authenticated)
5. [ ] Run Prisma migrations
6. [ ] Test tất cả endpoints

### CI/CD

- Tạo ci.yml workflow (test only)
- Tạo release.yml workflow (build & push images)
- Tạo deploy.yml workflow (deploy to Cloud Run)
- Test CI pipeline với PR
- Test Release & Deploy với tag

### Monitoring

- Cấu hình Cloud Logging
- Cấu hình Alerts
- Thiết lập Budget notifications

---

## 12. Quick Commands

> **Lưu ý:** Tất cả commands viết 1 dòng để dễ copy. Region: `asia-southeast1` (Singapore).

### 12.1 Chuẩn bị GCP Project

```bash
# 1. Set project làm default
gcloud config set project hoangphuc3604

# 2. Enable các APIs cần thiết
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com servicenetworking.googleapis.com vpcaccess.googleapis.com

# 3. Tạo Artifact Registry (lưu ý: dùng asia-southeast1)
gcloud artifacts repositories create lifeos-registry --repository-format=docker --location=asia-southeast1 --description="LifeOS Docker images"

# 4. Cấu hình Docker authentication
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

### 12.2 Thiết lập VPC Network

```bash
# 1. Tạo VPC network
gcloud compute networks create lifeos-vpc --subnet-mode=custom --bgp-routing-mode=regional

# 2. Tạo subnet
gcloud compute networks subnets create lifeos-subnet --network=lifeos-vpc --region=asia-southeast1 --range=10.0.0.0/24

# 3. Tạo Serverless VPC Access connector
gcloud compute networks vpc-access connectors create lifeos-connector --region=asia-southeast1 --network=lifeos-vpc --range=10.8.0.0/28
```

### 12.3 Tạo Cloud SQL Instances

```bash
# 1. Tạo Cloud SQL cho Auth Service
gcloud sql instances create lifeos-auth-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=asia-southeast1 --storage-type=SSD --storage-size=10GB --network=projects/hoangphuc3604/global/networks/lifeos-vpc --no-assign-ip --enable-google-private-path

# 2. Tạo Cloud SQL cho Knowledge Service
gcloud sql instances create lifeos-knowledge-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=asia-southeast1 --storage-type=SSD --storage-size=10GB --network=projects/hoangphuc3604/global/networks/lifeos-vpc --no-assign-ip --enable-google-private-path

# 3. Tạo database cho auth-service
gcloud sql databases create lifeos_auth --instance=lifeos-auth-db

# 4. Tạo user cho auth-service
gcloud sql users create lifeos_auth_user --instance=lifeos-auth-db --password=YOUR_SECURE_PASSWORD

# 5. Tạo database cho knowledge-service
gcloud sql databases create lifeos_knowledge --instance=lifeos-knowledge-db

# 6. Tạo user cho knowledge-service
gcloud sql users create lifeos_knowledge_user --instance=lifeos-knowledge-db --password=YOUR_SECURE_PASSWORD
```

### 12.4 Build Docker Images

```bash
# Build API Gateway
gcloud builds submit services/api-gateway --tag asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/api-gateway:latest --file services/api-gateway/Dockerfile.cloudrun

# Build Auth Service
gcloud builds submit services/auth-service --tag asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/auth-service:latest --file services/auth-service/Dockerfile.cloudrun

# Build Knowledge Service
gcloud builds submit services/knowledge-service --tag asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/knowledge-service:latest --file services/knowledge-service/Dockerfile.cloudrun

# Build Frontend
gcloud builds submit web --tag asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/frontend:latest
```

### 12.5 Deploy Services (THỨ TỰ RẤT QUAN TRỌNG!)

```bash
# Bước 1: Deploy Auth Service (không public)
gcloud run deploy auth-service --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/auth-service:latest --region=asia-southeast1 --no-allow-unauthenticated --vpc-connector=lifeos-connector --set-env-vars "NODE_ENV=production" --set-env-vars "CLOUD_SQL_INSTANCE=hoangphuc3604:asia-southeast1:lifeos-auth-db" --set-env-vars "DATABASE_URL=postgresql://lifeos_auth_user:password@127.0.0.1:5432/lifeos_auth" --set-env-vars "JWT_SECRET=YOUR_JWT_SECRET" --memory=512Mi --cpu=1 --min-instances=0 --max-instances=10

# Lấy Auth URL
AUTH_URL=$(gcloud run services describe auth-service --region=asia-southeast1 --format='value(status.url)')

# Bước 2: Deploy Knowledge Service (không public)
gcloud run deploy knowledge-service --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/knowledge-service:latest --region=asia-southeast1 --no-allow-unauthenticated --vpc-connector=lifeos-connector --set-env-vars "NODE_ENV=production" --set-env-vars "CLOUD_SQL_INSTANCE=hoangphuc3604:asia-southeast1:lifeos-knowledge-db" --set-env-vars "DATABASE_URL=postgresql://lifeos_knowledge_user:password@127.0.0.1:5432/lifeos_knowledge" --set-env-vars "JWT_SECRET=YOUR_JWT_SECRET" --memory=512Mi --cpu=1 --min-instances=0 --max-instances=10

# Lấy Knowledge URL
KNOWLEDGE_URL=$(gcloud run services describe knowledge-service --region=asia-southeast1 --format='value(status.url)')

# Bước 3: Deploy API Gateway (public, cần URLs từ bước 1&2)
gcloud run deploy api-gateway --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/api-gateway:latest --region=asia-southeast1 --allow-unauthenticated --set-env-vars="AUTH_SERVICE_URL=$AUTH_URL" --set-env-vars="KNOWLEDGE_SERVICE_URL=$KNOWLEDGE_URL" --port=8080 --memory=256Mi --cpu=1 --min-instances=0

# Bước 4: Deploy Frontend (public)
gcloud run deploy frontend --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/frontend:latest --region=asia-southeast1 --allow-unauthenticated --port=8080 --memory=256Mi --cpu=1 --min-instances=0
```

### 12.6 Kiểm tra URLs

```bash
# Xem tất cả services
gcloud run services list --region=asia-southeast1

# Kiểm tra API Gateway
curl $(gcloud run services describe api-gateway --region=asia-southeast1 --format='value(status.url)')/health
```

### 12.7 Tạo Service Account cho GitHub Actions

```bash
# Tạo Service Account
gcloud iam service-accounts create github-actions --display-name="GitHub Actions CI/CD"

# Grant quyền Cloud Run Admin
gcloud projects add-iam-policy-binding hoangphuc3604 --member="serviceAccount:github-actions@hoangphuc3604.iam.gserviceaccount.com" --role="roles/run.admin"

# Grant quyền Artifact Registry Writer
gcloud projects add-iam-policy-binding hoangphuc3604 --member="serviceAccount:github-actions@hoangphuc3604.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"

# Grant quyền Cloud Build
gcloud projects add-iam-policy-binding hoangphuc3604 --member="serviceAccount:github-actions@hoangphuc3604.iam.gserviceaccount.com" --role="roles/cloudbuild.builds.builder"

# Tạo và download key
gcloud iam service-accounts keys create github-actions-key.json --iam-account=github-actions@hoangphuc3604.iam.gserviceaccount.com
```

