# Hướng Dẫn Dev & Deploy - LifeOS

Tài liệu này hướng dẫn chi tiết quy trình phát triển (development) và triển khai (deployment) cho ứng dụng LifeOS, bao gồm: chạy môi trường local với Docker Compose, triển khai lên GCP VM thông qua CI/CD tự động, và triển khai lên Google Cloud Run.

---

## Mục Lục

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu Trúc Dự Án](#2-cấu-trúc-dự-án)
3. [Yêu Cầu Hệ Thống](#3-yêu-cầu-hệ-thống)
4. [Phát Triển Local (Development)](#4-phát-triển-local-development)
5. [Triển Khai Production lên GCP VM](#5-triển-khai-production-lên-gcp-vm)
6. [Triển Khai Google Cloud Run](#6-triển-khai-google-cloud-run)
7. [Quản Lý Secrets](#7-quản-lý-secrets)
8. [Di Chuyển Database](#8-di-chuyển-database)
9. [Rollback và Khắc Phục Sự Cố](#9-rollback-và-khắc-phục-sự-cố)
10. [Monitoring](#10-monitoring)

---

## 1. Tổng Quan Kiến Trúc

### 1.1 Sơ Đồ Kiến Trúc

```mermaid
graph TD
    Client["Client Browser"]
    
    subgraph CloudRun["Google Cloud Run (Production)"]
        Web["Web Frontend<br/>(nginx:alpine)"]
        Gateway["API Gateway<br/>(nginx:alpine)"]
    end
    
    subgraph GCP["Google Cloud Platform"]
        CloudSQLAuth["Cloud SQL<br/>(lifeos_auth)"]
        CloudSQLKnowledge["Cloud SQL<br/>(lifeos_knowledge)"]
        SQLProxy["Cloud SQL Auth<br/>Proxy"]
    end
    
    Client -->|"HTTPS"| Web
    Web -->|"API calls"| Gateway
    
    Gateway -->|"POST /api/auth/**"| Auth["Auth Service<br/>(Node.js)"]
    Gateway -->|"POST /api/knowledge/**"| Knowledge["Knowledge Service<br/>(Node.js)"]
    
    Auth --> SQLProxy
    Knowledge --> SQLProxy
    SQLProxy --> CloudSQLAuth
    SQLProxy --> CloudSQLKnowledge
```

### 1.2 Kiến Trúc Triển Khai VM

```mermaid
graph TD
    subgraph GCPVM["GCP VM Instance"]
        Docker["Docker Engine"]
        subgraph Containers
            Web["Web (nginx)"]
            Gateway["API Gateway (nginx)"]
            Auth["Auth Service (Node.js)"]
            Knowledge["Knowledge Service (Node.js)"]
            Postgres["PostgreSQL 15"]
        end
    end
    
    Client["Client Browser"] -->|"HTTPS:8080"| Docker
    Web --> Gateway
    Gateway --> Auth
    Gateway --> Knowledge
    Auth --> Postgres
    Knowledge --> Postgres
```

### 1.3 Các Dịch Vụ

| Service | Port | Mô tả | Database |
|---------|------|--------|--------|
| **auth-service** | 3000 | Xác thực người dùng, JWT | lifeos_auth |
| **knowledge-service** | 3002 | Quản lý kiến thức, upload file | lifeos_knowledge |
| **api-gateway** | 8080 | Reverse proxy, routing, auth | - |
| **web** | 8080 | Frontend React (production build) | - |
| **postgres** | 5432 | Database PostgreSQL 15 | - |

---

## 2. Cấu Trúc Dự Án

```
life-os/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # CI/CD → GCP VM (auto on push main)
│       ├── deploy-staging.yml      # Manual → Cloud Run Staging
│       ├── deploy-production.yml   # Manual → Cloud Run Production
│       └── release.yml             # Build & push images on tag v*
│
├── docker/
│   └── postgres-init.sql           # Khởi tạo databases
│
├── docker-compose.yml              # Development (default)
├── docker-compose.prod.yml         # Production overrides (kết hợp với base)
├── docker-compose.cloudrun.yml      # Reference cho Cloud Run
│
├── services/
│   ├── auth-service/
│   │   ├── Dockerfile              # 4 stage: dev, builder, prod, cloudrun
│   │   ├── cloud-run-entrypoint.sh # Entrypoint cho Cloud Run
│   │   ├── prisma/schema.prisma   # Schema database auth
│   │   └── .env                    # Environment variables (local)
│   │
│   ├── knowledge-service/
│   │   ├── Dockerfile              # 4 stage: dev, builder, prod, cloudrun
│   │   ├── cloud-run-entrypoint.sh # Entrypoint cho Cloud Run
│   │   ├── prisma/schema.prisma   # Schema database knowledge
│   │   └── .env                    # Environment variables (local)
│   │
│   └── api-gateway/
│       ├── Dockerfile              # 3 stage: dev, prod, cloudrun
│       └── nginx/
│           ├── snippets/
│           │   ├── cors.conf       # CORS configuration
│           │   └── proxy_params.conf # Proxy headers
│           └── conf.d/
│               ├── nginx.conf.dev
│               ├── nginx.conf.prod
│               └── default.conf.cloudrun
│
└── web/
    ├── Dockerfile                  # 3 stage: builder, prod, cloudrun
    └── nginx.conf                  # nginx config cho frontend
```

---

## 3. Yêu Cầu Hệ Thống

### 3.1 Yêu Cầu Chung

| Component | Yêu cầu |
|-----------|----------|
| Docker | Docker Engine 20.10+ |
| Docker Compose | v2.0+ (`docker compose`) |
| Node.js | v22 (để chạy local development) |
| Git | Phiên bản mới nhất |

### 3.2 Cài Đặt Docker Compose

```bash
# Kiểm tra Docker đã cài đặt chưa
docker --version
docker compose version

# Nếu chưa có docker compose (v2), cài đặt:
# Windows/Mac: Cài Docker Desktop
# Linux:
sudo apt update
sudo apt install docker-compose-plugin
```

---

## 4. Phát Triển Local (Development)

### 4.1 Thiết Lập Môi Trường

**Bước 1: Clone repository và cài đặt dependencies**

```bash
git clone <repository-url>
cd life-os
```

**Bước 2: Tạo file `.env` cho các services**

Tạo file `.env` trong thư mục `services/auth-service/`:

```bash
# services/auth-service/.env
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=lifeos_auth
DATABASE_URL=postgresql://user:password@postgres:5432/lifeos_auth
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=15m
PORT=3000
NODE_ENV=development
```

Tạo file `.env` trong thư mục `services/knowledge-service/`:

```bash
# services/knowledge-service/.env
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=lifeos_knowledge
DATABASE_URL=postgresql://user:password@postgres:5432/lifeos_knowledge
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=15m
PORT=3002
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### 4.2 Khởi Chạy Môi Trường Development

```bash
# Khởi chạy tất cả services (development mode)
docker compose up

# Hoặc chạy background và xem logs
docker compose up -d
docker compose logs -f

# Chạy với build lại
docker compose up --build
```

**Các services sẽ được khởi chạy:**

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:8080 |
| Auth Service | http://localhost:3000 |
| Knowledge Service | http://localhost:3002 |
| PostgreSQL | localhost:5432 |

### 4.3 Hot Reload

Trong chế độ development, các thư mục source code được mount vào container qua volumes, cho phép hot reload khi chỉnh sửa code:

```yaml
# docker-compose.yml
auth-service:
  volumes:
    - ./services/auth-service:/usr/src/app    # Mount source code
    - /usr/src/app/node_modules              # Giữ nguyên node_modules
```

### 4.4 Chạy Tests

```bash
# Auth Service
cd services/auth-service
npm ci
npx prisma generate
npm run test

# Knowledge Service
cd services/knowledge-service
npm ci
npx prisma generate
npm run test

# API Gateway
cd services/api-gateway
npm ci
npm run test
```

### 4.5 Database Migrations (Development)

```bash
# Auth Service - Tạo migration
cd services/auth-service
npx prisma migrate dev --name init

# Knowledge Service - Tạo migration
cd services/knowledge-service
npx prisma migrate dev --name init

# Hoặc push schema trực tiếp (không tạo migration file)
npx prisma db push
```

### 4.6 Dừng Môi Trường Development

```bash
# Dừng và xóa containers
docker compose down

# Dừng và xóa cả volumes (xóa database)
docker compose down -v

# Dừng và xóa containers, images, networks
docker compose down --rmi all
```

### 4.7 Truy Cập Database

```bash
# Kết nối PostgreSQL từ host
psql -h localhost -p 5432 -U user -d lifeos_auth

# Hoặc sử dụng Docker exec
docker exec -it lifeos_postgres psql -U user -d lifeos_auth
```

---

## 5. Triển Khai Production lên GCP VM

### 5.1 Tổng Quan Quy Trình

```mermaid
flowchart LR
    A[Push code to main] --> B[GitHub Actions]
    B --> C{Test Jobs}
    C -->|Pass| D[Build Docker Images]
    C -->|Fail| E[Notify & Stop]
    D --> F[Push to GHCR.io]
    F --> G[SSH to GCP VM]
    G --> H[Pull Images]
    H --> I[Update .env]
    I --> J[docker compose up]
    J --> K[Health Check]
    K --> L[Cleanup]
```

Triển khai production lên GCP VM được thực hiện **tự động** mỗi khi có push vào nhánh `main` thông qua GitHub Actions workflow `deploy.yml`.

### 5.2 Chuẩn Bị GCP VM

**Yêu cầu VM:**

- OS: Ubuntu 20.04 LTS hoặc mới hơn
- Docker Engine 20.10+
- Docker Compose v2
- 2 vCPU, 4GB RAM (tối thiểu)
- Firewall cho phép port 8080

**Cài đặt Docker trên VM:**

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Docker Compose
sudo apt install docker-compose-plugin

# Thêm user vào docker group
sudo usermod -aG docker $USER

# Đăng nhập GHCR.io
echo "$GH_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
```

### 5.3 Cấu Hình GitHub Secrets

Cần thiết lập các secrets sau trong GitHub repository (`Settings > Secrets and variables > Actions`):

| Secret | Mô tả | Ví dụ |
|--------|--------|--------|
| `GCP_VM_HOST` | IP hoặc hostname của VM | `123.456.789.0` |
| `GCP_VM_USER` | SSH username | `ubuntu` |
| `GCP_VM_SSH_KEY` | Private SSH key | `-----BEGIN OPENSSH...` |
| `GH_PACKAGE_TOKEN` | GitHub PAT với quyền packages | `ghp_xxx` |
| `POSTGRES_USER` | PostgreSQL username | `lifeos_user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `strong-password-here` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `super-secret-jwt-key-min-32` |

### 5.4 Chuẩn Bị Network cho Production

Trên GCP VM, tạo Docker network external trước khi deploy:

```bash
# Đăng nhập VM qua SSH
ssh ubuntu@$GCP_VM_HOST

# Tạo network
docker network create lifeos-network

# Kiểm tra
docker network ls
```

### 5.5 Quy Trình Deploy Tự Động

**Trigger:** Push vào nhánh `main`

**Các bước thực hiện:**

1. **Checkout code** - GitHub Actions checkout repository
2. **Run Tests** - Chạy test cho tất cả services
3. **Build Images** - Build Docker images với target `production`
4. **Push to GHCR.io** - Push images lên GitHub Container Registry
5. **SCP files to VM** - Copy docker-compose.prod.yml và source code
6. **Create .env files** - Tạo file env trên VM qua SSH
7. **Login GHCR.io on VM** - Đăng nhập GHCR trên VM
8. **Pull images** - Pull images mới nhất
9. **Stop old containers** - Dừng containers cũ
10. **Start new containers** - Khởi chạy containers mới
11. **Health check** - Kiểm tra trạng thái
12. **Cleanup** - Dọn dẹp Docker resources

### 5.6 Deploy Thủ Công lên VM

Nếu cần deploy thủ công:

```bash
# SSH vào VM
ssh ubuntu@$GCP_VM_HOST

# Di chuyển vào thư mục project
cd ~/lifeos

# Pull code mới nhất (nếu cần)
git pull origin main

# Pull Docker images
docker compose -f docker-compose.prod.yml pull

# Dừng containers cũ
docker compose -f docker-compose.prod.yml down --remove-orphans

# Khởi chạy production
docker compose -f docker-compose.prod.yml up -d

# Kiểm tra logs
docker compose -f docker-compose.prod.yml logs -f
```

### 5.7 Kiểm Tra Sau Deploy

```bash
# Kiểm tra trạng thái containers
docker compose -f docker-compose.prod.yml ps

# Kiểm tra health endpoints
curl http://localhost:8080/health
curl http://localhost:3000/health
curl http://localhost:3002/health

# Kiểm tra logs
docker compose -f docker-compose.prod.yml logs --tail=100
```

### 5.8 Lệnh Hữu Ích trên VM

```bash
# Xem tất cả containers
docker ps -a

# Restart một service cụ thể
docker compose -f docker-compose.prod.yml restart auth-service

# Rebuild một service cụ thể
docker compose -f docker-compose.prod.yml up -d --build auth-service

# Xem resource usage
docker stats

# Backup database
docker exec lifeos_postgres pg_dump -U user lifeos_auth > backup_auth.sql
docker exec lifeos_postgres pg_dump -U user lifeos_knowledge > backup_knowledge.sql
```

---

## 6. Triển Khai Google Cloud Run

### 6.1 Tổng Quan Quy Trình

Cloud Run deployment gồm 2 workflow riêng biệt:

1. **`release.yml`** - Tự động trigger khi tạo tag `v*.*.*`
2. **`deploy-staging.yml`** - Deploy thủ công lên môi trường staging
3. **`deploy-production.yml`** - Deploy thủ công lên production

```mermaid
flowchart TD
    A[Create tag v*.*.*] --> B[release.yml]
    B --> C[Build all images]
    C --> D[Push to Artifact Registry]
    D --> E[Create release PR]
    
    E --> F[Run deploy-staging.yml]
    F --> G[Deploy to Staging]
    G --> H[Manual Testing]
    
    H --> I[Run deploy-production.yml]
    I --> J[Deploy to Production]
```

### 6.2 Chuẩn Bị Google Cloud Platform

**1. Tạo GCP Project và enable APIs:**

```bash
# Set project
gcloud config set project hoangphuc3604

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  servicenetworking.googleapis.com \
  vpcaccess.googleapis.com
```

**2. Cấu hình Artifact Registry:**

```bash
# Tạo Artifact Registry repository
gcloud artifacts repositories create lifeos-registry \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="LifeOS Docker images"

# Configure Docker authentication
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

**3. Thiết lập VPC Network cho Cloud Run:**

```bash
# Tạo VPC network riêng
gcloud compute networks create lifeos-vpc --subnet-mode=custom --bgp-routing-mode=regional

# Tạo subnet cho Cloud Run
gcloud compute networks subnets create lifeos-subnet --network=lifeos-vpc --region=asia-southeast1 --range=10.0.0.0/24

# Tạo Serverless VPC Access connector
gcloud compute networks vpc-access connectors create lifeos-connector --region=asia-southeast1 --network=lifeos-vpc --range=10.8.0.0/28
```

**4. Tạo Cloud SQL instances:**

```bash
# Tạo Cloud SQL cho Auth Service
gcloud sql instances create lifeos-auth-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --network=projects/hoangphuc3604/global/networks/lifeos-vpc \
  --no-assign-ip \
  --enable-google-private-path

# Tạo Cloud SQL cho Knowledge Service
gcloud sql instances create lifeos-knowledge-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --network=projects/hoangphuc3604/global/networks/lifeos-vpc \
  --no-assign-ip \
  --enable-google-private-path

# Tạo databases
gcloud sql databases create lifeos_auth --instance=lifeos-auth-db
gcloud sql databases create lifeos_knowledge --instance=lifeos-knowledge-db

# Tạo users
gcloud sql users create lifeos_auth_user \
  --instance=lifeos-auth-db \
  --password=YOUR_PASSWORD

gcloud sql users create lifeos_knowledge_user \
  --instance=lifeos-knowledge-db \
  --password=YOUR_PASSWORD
```

### 6.3 Cấu Hình GitHub Secrets cho Cloud Run

| Secret | Mô tả |
|--------|--------|
| `GCP_PROJECT_ID` | GCP Project ID (`hoangphuc3604`) |
| `GCP_PROJECT_NUMBER` | GCP Project Number |
| `GCP_SA_KEY` | Service Account key JSON |
| `JWT_SECRET` | JWT signing secret |
| `AUTH_DATABASE_URL` | Auth Cloud SQL connection string (`postgresql://lifeos_auth_user:password@/lifeos_auth?host=/cloudsql/...`) |
| `KNOWLEDGE_DATABASE_URL` | Knowledge Cloud SQL connection string |
| `API_GATEWAY_URL` | API Gateway URL sau khi deploy |
| `PRODUCTION_DOMAIN` | Production domain (e.g., example.com) |

### 6.4 Workflow Release (Tự Động)

**Trigger:** Tạo git tag theo format `v*.*.*`

```bash
# Tạo và push tag để trigger release
git tag v1.0.0
git push origin v1.0.0
```

**Quy trình:**

1. Checkout code
2. Authenticate với GCP
3. Configure Docker cho Artifact Registry
4. Build và push 4 images:
   - `asia-southeast1-docker.pkg.dev/PROJECT/lifeos-registry/auth-service:TAG`
   - `asia-southeast1-docker.pkg.dev/PROJECT/lifeos-registry/knowledge-service:TAG`
   - `asia-southeast1-docker.pkg.dev/PROJECT/lifeos-registry/api-gateway:TAG`
   - `asia-southeast1-docker.pkg.dev/PROJECT/lifeos-registry/web:TAG`

### 6.5 Deploy lên Staging (Thủ Công)

**Trigger:** Manual workflow dispatch

**Cách thực hiện:**

1. Vào GitHub Actions
2. Chọn workflow `Deploy to Staging - Cloud Run`
3. Click "Run workflow"
4. Nhập tag (ví dụ: `v1.0.0` hoặc `latest`)
5. Click "Run"

**Services được deploy lên Staging:**

| Service | URL |
|---------|-----|
| Auth Service | https://lifeos-auth-[hash]-uc.a.run.app |
| Knowledge Service | https://lifeos-knowledge-[hash]-uc.a.run.app |
| API Gateway | https://lifeos-gateway-[hash]-uc.a.run.app |
| Web | https://lifeos-frontend-[hash]-uc.a.run.app |

### 6.6 Deploy lên Production (Thủ Công)

**Trigger:** Manual workflow dispatch (cần xác nhận environment production)

**Cách thực hiện:**

1. Vào GitHub Actions
2. Chọn workflow `Deploy to Production - Cloud Run`
3. Click "Run workflow"
4. Nhập tag (ví dụ: `v1.0.0`) - **bắt buộc**
5. Click "Run"
6. Xác nhận deployment trong Production environment

**Services được deploy lên Production:**

| Service | URL |
|---------|-----|
| Auth Service | https://auth-service.example.com |
| Knowledge Service | https://knowledge-service.example.com |
| API Gateway | https://api-gateway.example.com |
| Web | https://example.com |

### 6.7 Cấu Hình Domain cho Cloud Run

```bash
# Map custom domain cho Web (production)
gcloud run domain-mappings create \
  --service=frontend \
  --domain=example.com \
  --region=asia-southeast1

# Kiểm tra DNS records cần thêm
gcloud run domain-mappings describe --service=frontend --domain=example.com --region=asia-southeast1
```

### 6.8 Kiểm Tra Deployment

```bash
# Kiểm tra services
gcloud run services list --region=asia-southeast1

# Kiểm tra logs
gcloud run logs read --service=auth-service --region=asia-southeast1 --limit=50

# Kiểm tra revisions
gcloud run revisions list --service=auth-service --region=asia-southeast1
```

---

## 7. Quản Lý Secrets

### 7.1 Nguyên Tắc Quan Trọng

> **KHÔNG BAO GIỜ commit các file `.env` chứa secrets vào Git!**

### 7.2 Cấu Trúc Secrets

**Development (.env files - không commit):**
```
services/
├── auth-service/.env
├── knowledge-service/.env
└── api-gateway/.env (nếu có)
```

**Production Secrets (GitHub Secrets):**

| Service | Secrets cần thiết |
|---------|------------------|
| GCP VM | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `GH_PACKAGE_TOKEN` |
| Cloud Run | `GCP_SA_KEY`, `JWT_SECRET`, `*_DATABASE_URL`, `*_CLOUD_SQL_INSTANCE` |

### 7.3 Best Practices

1. **Sử dụng secrets manager**: Cân nhắc sử dụng GCP Secret Manager thay vì GitHub Secrets cho production
2. **Rotation**: Thay đổi JWT_SECRET và database passwords định kỳ
3. **Audit**: Theo dõi ai có quyền truy cập secrets
4. **Minimum privilege**: Chỉ cấp quyền cần thiết cho Service Account

---

## 8. Di Chuyển Database

### 8.1 Migration trong Development

```bash
cd services/auth-service
npx prisma migrate dev --name add_new_field
npx prisma migrate deploy

cd services/knowledge-service
npx prisma migrate dev --name add_new_table
npx prisma migrate deploy
```

### 8.2 Migration trong Production (VM)

```bash
# SSH vào VM
ssh ubuntu@$GCP_VM_HOST
cd ~/lifeos

# Chạy migration cho Auth Service
docker compose -f docker-compose.prod.yml exec auth-service npx prisma migrate deploy

# Chạy migration cho Knowledge Service
docker compose -f docker-compose.prod.yml exec knowledge-service npx prisma migrate deploy
```

### 8.3 Migration trong Cloud Run

Migration cần được chạy trước khi deploy:

```bash
# Cloud Run không hỗ trợ migrate trực tiếp
# Cách 1: Tạo init container trong deployment

# Cách 2: Chạy migration qua Cloud SQL Proxy
gcloud sql connect lifeos-auth-db --user=lifeos_auth_user
```

### 8.4 Backup & Restore

```bash
# Backup
docker exec lifeos_postgres pg_dump -U user lifeos_auth > backup_auth.sql
docker exec lifeos_postgres pg_dump -U user lifeos_knowledge > backup_knowledge.sql

# Restore
docker exec -i lifeos_postgres psql -U user lifeos_auth < backup_auth.sql
docker exec -i lifeos_postgres psql -U user lifeos_knowledge < backup_knowledge.sql
```

---

## 9. Rollback và Khắc Phục Sự Cố

### 9.1 Rollback trên GCP VM

```bash
# Xác định image version trước đó
docker images | grep lifeos

# Pull image cũ
docker pull ghcr.io/OWNER/lifeos-auth:SHA_OLD

# Update docker-compose.prod.yml để dùng image cũ
# Hoặc restart với image hiện tại nhưng không rebuild
docker compose -f docker-compose.prod.yml up -d --no-build

# Nếu cần rollback code:
git log --oneline
git revert COMMIT_SHA
git push origin main
```

### 9.2 Rollback trên Cloud Run

```bash
# Xem các revisions
gcloud run revisions list --service=auth-service --region=asia-southeast1

# Rollback về revision cũ
gcloud run services update-traffic auth-service \
  --to-revisions=REVISION_NAME=100 \
  --region=asia-southeast1
```

### 9.3 Khắc Phục Sự Cố Thường Gặp

#### Container không khởi động được

```bash
# Xem logs chi tiết
docker compose logs service-name

# Kiểm tra config
docker compose config

# Restart service
docker compose restart service-name
```

#### Database connection failed

```bash
# Kiểm tra postgres container
docker compose ps postgres

# Kiểm tra health
docker compose exec postgres pg_isready

# Xem logs
docker compose logs postgres
```

#### Image pull failed

```bash
# Kiểm tra đăng nhập GHCR
docker login ghcr.io

# Pull image thủ công
docker pull ghcr.io/OWNER/lifeos-auth:latest

# Kiểm tra credentials
cat ~/.docker/config.json
```

#### Cloud Run deployment failed

```bash
# Kiểm tra logs
gcloud run logs read --service=auth-service --region=asia-southeast1

# Kiểm tra service account permissions
gcloud projects get-iam-policy hoangphuc3604

# Kiểm tra Cloud SQL connection
gcloud sql connect lifeos-auth-db --user=lifeos_auth_user
```

---

## 10. Monitoring

### 10.1 Container Health Checks

```bash
# Kiểm tra health tất cả containers
docker compose ps

# Kiểm tra health endpoint
curl http://localhost:8080/health
curl http://localhost:3000/health
curl http://localhost:3002/health
```

### 10.2 Cloud Run Logging

```bash
# Xem logs real-time
gcloud run logs read --service=auth-service --region=asia-southeast1 --follow

# Xem logs theo thời gian
gcloud run logs read \
  --service=auth-service \
  --region=asia-southeast1 \
  --start-time=2024-01-01T00:00:00Z

# Xem logs theo request ID
gcloud run logs read \
  --service=auth-service \
  --region=asia-southeast1 \
  --filter="resource.labels.request_id=REQUEST_ID"
```

### 10.3 Cloud Monitoring

```bash
# Tạo alerting policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count"'

# Xem metrics
gcloud monitoring metrics list
```

---

## Quick Reference

### Lệnh Thường Dùng

| Mục đích | Lệnh |
|----------|------|
| Dev: Start | `docker compose up` |
| Dev: Rebuild | `docker compose up --build` |
| Dev: Stop | `docker compose down` |
| Prod: Deploy | Push to `main` (auto) |
| Cloud Run: Release | `git tag v1.0.0 && git push` |
| Cloud Run: Staging | Run `deploy-staging.yml` workflow |
| Cloud Run: Production | Run `deploy-production.yml` workflow |
| Check logs | `docker compose logs -f` |
| Check status | `docker compose ps` |
| Shell into container | `docker exec -it CONTAINER_NAME sh` |

### Cổng Dịch Vụ

| Service | Development | Production (VM) | Cloud Run |
|---------|-------------|------------------|-----------|
| Web | http://localhost:3000 | http://VM_IP:3000 | https://web.HOST |
| API Gateway | http://localhost:8080 | http://VM_IP:8080 | https://api.HOST |
| Auth Service | http://localhost:3000 | internal | internal |
| Knowledge Service | http://localhost:3002 | internal | internal |
| PostgreSQL | localhost:5432 | internal | N/A |

### Environment Variables Quan Trọng

**Auth Service:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key
- `JWT_EXPIRATION` - Token expiry (default: 15m)

**Knowledge Service:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key
- `UPLOAD_DIR` - Upload directory (default: ./uploads)
- `MAX_FILE_SIZE` - Max file size in bytes (default: 10485760)

**API Gateway:**
- `AUTH_SERVICE_URL` - Auth service URL
- `KNOWLEDGE_SERVICE_URL` - Knowledge service URL
- `ALLOWED_ORIGINS` - CORS allowed origins
