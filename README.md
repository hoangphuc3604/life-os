# LifeOS

LifeOS is a Personal Knowledge & Resource Planning System using a Microservices architecture.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development (Without Docker for Services)](#local-development-without-docker-for-services)
3. [Local Development (With Docker)](#local-development-with-docker)
4. [Production Deployment (GCP VM)](#production-deployment-gcp-vm)

---

## Prerequisites
Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v22 recommended)
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

---

## Local Development (Without Docker for Services)

Running the services natively on your machine gives you the fastest feedback loop for development. Since the application relies on PostgreSQL and NGINX (API Gateway), you will still need Docker to run auxiliary components.

### 1. Setup Database and API Gateway
First, spin up the PostgreSQL database and API Gateway via Docker:
```bash
docker compose up -d postgres api-gateway
```
*Note: This will start PostgreSQL on port 5432 and NGINX on port 8080.*

### 2. Setup Auth Service
Open a new terminal and navigate to the `auth-service` directory:
```bash
cd services/auth-service
```
Copy the environment variables template:
```bash
cp .env.example .env
```
> [!IMPORTANT]
> When running the service **natively** (locally outside Docker), ensure `DATABASE_URL` in `.env` points to `localhost`:
> `DATABASE_URL="postgresql://user:password@localhost:5432/lifeos_auth?schema=public"`
Install dependencies and start the service:
```bash
npm install
npm run start:dev
```
*(This command will automatically run Prisma generate/migrate and start the NestJS server on port 3000)*

### 3. Setup Knowledge Service
Open another terminal and navigate to the `knowledge-service` directory:
```bash
cd services/knowledge-service
```
Copy the environment variables template:
```bash
cp .env.example .env
```
> [!IMPORTANT]
> When running the service **natively**, ensure `DATABASE_URL` in `.env` points to `localhost`:
> `DATABASE_URL="postgresql://user:password@localhost:5432/lifeos_knowledge?schema=public"`
Install dependencies and start the service:
```bash
npm install
npm run start:dev
```
*(This command will automatically run Prisma generate/migrate and start the NestJS server on port 3002)*

### 4. Setup Frontend (Web)
Open a final terminal and navigate to the `web` directory:
```bash
cd web
```
Copy the environment variables template:
```bash
cp .env.example .env
```
Install dependencies and start the Vite dev server:
```bash
npm install
npm run dev
```
The frontend should now be accessible (usually at `http://localhost:5173`).

---

## Local Development (With Docker)

If you prefer to run the entire backend stack (Database, API Gateway, Auth Service, Knowledge Service) inside Docker:

### 1. Configure Environment Variables
Ensure the `.env` files are created for your services:
- Copy `services/auth-service/.env.example` to `services/auth-service/.env`
- Copy `services/knowledge-service/.env.example` to `services/knowledge-service/.env`

> [!NOTE]
> In the Docker environment, the services communicate using container names. The backend services are pre-configured to handle this via `docker-compose`, but if you manually edit `.env` files for Docker use, the host in `DATABASE_URL` must be `postgres` (not `localhost`).

### 2. Start Backend via Docker Compose
From the root of the project, run:
```bash
docker compose up -d --build
```
This will start all backend services. 
- API Gateway is accessible on port `8080`
- PostgreSQL is accessible on port `5432`

### 3. Start Frontend
The frontend should be run locally:
```bash
cd web
cp .env.example .env
npm install
npm run dev
```

---

## Production Deployment (GCP VM)

The project uses GitHub Actions for CI/CD. When code is pushed to the `main` branch, the pipeline automatically builds Docker images, pushes them to the GitHub Container Registry (GHCR), and deploys them to a Google Cloud Platform (GCP) Virtual Machine.

### Steps to set up a new GCP VM for Deployment:

1. **Provision a VM:**
   - Create a VM instance on GCP (e.g., Ubuntu 22.04 LTS).
   - Ensure the VM firewall allows incoming traffic on port `80`, `443` (if applicable), and port `8080` (API Gateway custom port if you decide to expose it directly).

2. **Install Docker on the VM:**
   SSH into your VM and install Docker and Docker compose:
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose-v2 -y
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker $USER
   ```
   *Logout and login again for the group changes to take effect.*

3. **Configure GitHub Secrets:**
   In your GitHub repository settings (`Settings` > `Secrets and variables` > `Actions`), add the following repository secrets:
   - `GCP_VM_HOST`: The external IP address of your GCP VM.
   - `GCP_VM_USER`: The SSH username for the VM.
   - `GCP_VM_SSH_KEY`: The private SSH key used to authenticate with the VM.
   - `POSTGRES_USER`: Database username.
   - `POSTGRES_PASSWORD`: Database password.
   - `JWT_SECRET`: A secure, secret string for JWT signing.
   - `GH_PACKAGE_TOKEN`: A GitHub Personal Access Token (PAT) with `read:packages` permissions, allowing the VM to pull images from GHCR.

4. **Deployment Process:**
   - Once the secrets are set up, pushing code to the `main` branch will automatically trigger the workflow (`.github/workflows/deploy.yml`).
   - The workflow runs tests, builds production images, copies production configurations (`docker-compose.prod.yml`) to the VM, creates `.env` files automatically, and pulls/starts the newest containers via Docker Compose.

```bash
ssh <user>@<gcp-vm-ip>
cd ~/lifeos
docker compose -f docker-compose.prod.yml logs -f
```

---

### Important: DATABASE_URL Host Difference
| Environment | Host in DATABASE_URL | Reason |
| :--- | :--- | :--- |
| **Local (Native)** | `localhost` | App runs on your OS, DB runs in Docker mapped to localhost |
| **Local (Docker)** | `postgres` | App and DB both run in the Docker network; app uses service name |
| **Production** | `postgres` | Same as Local Docker; services communicate via container names |

---
