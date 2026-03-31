# LifeOS

Personal Knowledge & Resource Planning System using Microservices architecture.

## Architecture

| Service | Port | Description |
|---------|------|-------------|
| **auth-service** | 3000 | Authentication, JWT token management |
| **knowledge-service** | 3002 | Knowledge management, file uploads |
| **api-gateway** | 80/8080 | Nginx reverse proxy, routing, auth validation |
| **web** | 5173/8080 | React + Vite frontend |
| **postgres** | 5432 | PostgreSQL 15 database |

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

---

## Local Development (Without Docker for Services)

Run PostgreSQL and API Gateway via Docker, services natively for fastest feedback loop.

### 1. Start Database and API Gateway

```bash
docker compose up -d postgres api-gateway
```

PostgreSQL starts on port 5432, API Gateway on port 8080.

### 2. Start Auth Service

```bash
cd services/auth-service
cp .env.example .env
npm install
npm run start:dev
```

> When running natively, ensure `DATABASE_URL` in `.env` uses `localhost` as host.

### 3. Start Knowledge Service

```bash
cd services/knowledge-service
cp .env.example .env
npm install
npm run start:dev
```

> When running natively, ensure `DATABASE_URL` in `.env` uses `localhost` as host.

### 4. Start Frontend

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Local Development (Full Docker)

Run the entire backend stack in Docker.

### 1. Configure Environment

```bash
cp services/auth-service/.env.example services/auth-service/.env
cp services/knowledge-service/.env.example services/knowledge-service/.env
```

> In Docker, services use container names. The `DATABASE_URL` host must be `postgres` (not `localhost`).

### 2. Start All Services

```bash
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

### 3. Start Frontend

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

### Useful Commands

```bash
docker compose logs -f
docker compose down
docker compose down -v
```

---

## Production Deployment

### VM Deployment

Deploy using Docker Compose on a GCP VM (or any Linux server).

See [docs/deployment/vm-setup.md](docs/deployment/vm-setup.md) for full instructions.

Quick start:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Cloud Run Deployment

Deploy as serverless containers on Google Cloud Run.

See [docs/deployment/gcp-cloud-run-manual.md](docs/deployment/gcp-cloud-run-manual.md) for manual deployment.

Automated deployment uses GitHub Actions:
- **CI**: Tests run on push/PR to `main` ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))
- **Release**: Build & push images on tag `v*.*.*` ([`.github/workflows/release.yml`](.github/workflows/release.yml))
- **Deploy**: Manual deployment to production ([`.github/workflows/deploy-production.yml`](.github/workflows/deploy-production.yml))

---

## DATABASE_URL Host Reference

| Environment | Host | Reason |
|:---|:---|:---|
| **Local (Native)** | `localhost` | App runs on host OS, DB in Docker mapped to localhost |
| **Local (Docker)** | `postgres` | Both app and DB in Docker network, uses service name |
| **Production (VM)** | `postgres` | Same as Docker; services communicate via container names |
| **Cloud Run** | `localhost` via Cloud SQL Proxy | Cloud SQL Auth Proxy runs as sidecar on localhost |
