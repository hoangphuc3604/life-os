# GCP Cloud Run - Manual Deployment Guide

## Prerequisites

- GCP Project created with billing enabled
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
- [Docker](https://www.docker.com/products/docker-desktop/) installed
- Authenticated: `gcloud auth login`

## 1. Setup GCP Project

Set your project as default (replace `hoangphuc3604` with your actual GCP Project ID):

```bash
gcloud config set project hoangphuc3604
```

Enable required APIs:

```bash
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 2. Create Artifact Registry

Create a Docker repository to store your container images (replace `hoangphuc3604`):

```bash
gcloud artifacts repositories create lifeos-registry --repository-format=docker --location=asia-southeast1 --description="LifeOS Docker images"
```

Configure Docker authentication:

```bash
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

## 3. Create Cloud SQL Instances

Create PostgreSQL instances for each service:

```bash
gcloud sql instances create lifeos-auth-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=asia-southeast1
```

```bash
gcloud sql instances create lifeos-knowledge-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=asia-southeast1
```

Create databases:

```bash
gcloud sql databases create lifeos_auth --instance=lifeos-auth-db
```

```bash
gcloud sql databases create lifeos_knowledge --instance=lifeos-knowledge-db
```

Create database users (replace `YOUR_AUTH_DB_PASSWORD` and `YOUR_KNOWLEDGE_DB_PASSWORD` with strong passwords):

```bash
gcloud sql users create lifeos_auth_user --instance=lifeos-auth-db --password=YOUR_AUTH_DB_PASSWORD
```

```bash
gcloud sql users create lifeos_knowledge_user --instance=lifeos-knowledge-db --password=YOUR_KNOWLEDGE_DB_PASSWORD
```

> Save these passwords securely. You will need them when deploying services.

## 4. Build & Push Images

All commands run from the project root directory. Replace `hoangphuc3604` with your GCP Project ID throughout.

Build images with the `cloudrun` target:

```bash
docker build --target cloudrun -t asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/auth-service:latest ./services/auth-service
```

```bash
docker build --target cloudrun -t asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/knowledge-service:latest ./services/knowledge-service
```

```bash
docker build --target cloudrun -t asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/api-gateway:latest ./services/api-gateway
```

For the web frontend, replace `YOUR_API_GATEWAY_URL` with the API Gateway Cloud Run URL (deploy web last after getting the gateway URL):

```bash
docker build --target cloudrun --build-arg VITE_API_GATEWAY_URL=YOUR_API_GATEWAY_URL -t asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/web:latest ./web
```

Push all images:

```bash
docker push asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/auth-service:latest
```

```bash
docker push asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/knowledge-service:latest
```

```bash
docker push asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/api-gateway:latest
```

```bash
docker push asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/web:latest
```

## 5. Deploy to Cloud Run

### 5.1 Deploy Auth Service

Replace the following placeholders:
- `hoangphuc3604` - GCP Project ID
- `YOUR_AUTH_DB_PASSWORD` - Password from step 3
- `YOUR_JWT_SECRET` - A strong secret string (min 32 characters)

```bash
gcloud run deploy auth-service --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/auth-service:latest --region asia-southeast1 --platform managed --allow-unauthenticated --add-cloudsql-instances hoangphuc3604:asia-southeast1:lifeos-auth-db --set-env-vars "NODE_ENV=production,DATABASE_URL=postgresql://lifeos_auth_user:YOUR_AUTH_DB_PASSWORD@localhost:5432/lifeos_auth?host=/cloudsql/hoangphuc3604:asia-southeast1:lifeos-auth-db,JWT_SECRET=YOUR_JWT_SECRET"
```

> **Note**: Backend services use `--allow-unauthenticated` because they only receive traffic from the API Gateway, which provides the external access control layer. Direct internet access is prevented by Cloud Run's network architecture.

Get the auth service URL:

```bash
gcloud run services describe auth-service --region asia-southeast1 --format="value(status.url)"
```

### 5.2 Deploy Knowledge Service

Replace the same placeholders plus `YOUR_KNOWLEDGE_DB_PASSWORD`:

```bash
gcloud run deploy knowledge-service --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/knowledge-service:latest --region asia-southeast1 --platform managed --allow-unauthenticated --add-cloudsql-instances hoangphuc3604:asia-southeast1:lifeos-knowledge-db --set-env-vars "NODE_ENV=production,DATABASE_URL=postgresql://lifeos_knowledge_user:YOUR_KNOWLEDGE_DB_PASSWORD@localhost:5432/lifeos_knowledge?host=/cloudsql/hoangphuc3604:asia-southeast1:lifeos-knowledge-db,JWT_SECRET=YOUR_JWT_SECRET,UPLOAD_DIR=/usr/src/app/uploads,MAX_FILE_SIZE=10485760"
```

Get the knowledge service URL:

```bash
gcloud run services describe knowledge-service --region asia-southeast1 --format="value(status.url)"
```

### 5.3 Deploy API Gateway

Replace `YOUR_AUTH_SERVICE_URL` and `YOUR_KNOWLEDGE_SERVICE_URL` with the URLs from steps 5.1 and 5.2.
Extract the hostnames (without `https://`) for the HOST variables:

```bash
gcloud run deploy api-gateway --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/api-gateway:latest --region asia-southeast1 --platform managed --allow-unauthenticated --port 8080 --set-env-vars "AUTH_SERVICE_URL=YOUR_AUTH_SERVICE_URL,KNOWLEDGE_SERVICE_URL=YOUR_KNOWLEDGE_SERVICE_URL,AUTH_SERVICE_HOST=YOUR_AUTH_SERVICE_HOST,KNOWLEDGE_SERVICE_HOST=YOUR_KNOWLEDGE_SERVICE_HOST"
```

> **Example**: If your auth service URL is `https://auth-service-7qoifunzta-as.a.run.app`, then:
> - `AUTH_SERVICE_URL=https://auth-service-7qoifunzta-as.a.run.app`
> - `AUTH_SERVICE_HOST=auth-service-7qoifunzta-as.a.run.app`

Get the gateway URL:

```bash
gcloud run services describe api-gateway --region asia-southeast1 --format="value(status.url)"
```

### 5.4 Deploy Web Frontend

Before deploying web, rebuild the image with the correct API Gateway URL from step 5.3:

```bash
docker build --target cloudrun --build-arg VITE_API_GATEWAY_URL=YOUR_API_GATEWAY_URL -t asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/web:latest ./web
```

```bash
docker push asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/web:latest
```

```bash
gcloud run deploy web --image asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/web:latest --region asia-southeast1 --platform managed --allow-unauthenticated --port 8080
```

## 6. Deploy via GCP Console (UI)

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click **Create Service**
3. Select **Deploy one revision from an existing container image**
4. Click **Select** and browse to your image in Artifact Registry (`asia-southeast1-docker.pkg.dev/hoangphuc3604/lifeos-registry/...`)
5. Set **Region** to `asia-southeast1`
6. Under **Authentication**, choose the appropriate option:
   - Backend services (auth, knowledge): **Require authentication**
   - Gateway and web: **Allow unauthenticated invocations**
7. Expand **Container, Networking, Security**:
   - Set **Container port** (8080 for gateway/web, leave default for backend)
   - Under **Variables & Secrets**, add environment variables as listed in step 5
   - For backend services, under **Cloud SQL connections**, add the instance connection
8. Click **Create**

## 7. Verify Deployment

List all deployed services:

```bash
gcloud run services list --region asia-southeast1
```

Test health endpoints (replace URLs with your actual service URLs):

```bash
curl https://auth-service-XXXXX.asia-southeast1.run.app/health
```

```bash
curl https://knowledge-service-XXXXX.asia-southeast1.run.app/health
```

```bash
curl https://api-gateway-XXXXX.asia-southeast1.run.app/health
```

```bash
curl https://web-XXXXX.asia-southeast1.run.app/health
```

View service logs:

```bash
gcloud run logs read --service=auth-service --region=asia-southeast1 --limit=50
```

## 8. Useful Commands

Update a service with new environment variables:

```bash
gcloud run services update auth-service --region asia-southeast1 --set-env-vars "KEY=VALUE"
```

View current revisions:

```bash
gcloud run revisions list --service=auth-service --region=asia-southeast1
```

Rollback to a previous revision:

```bash
gcloud run services update-traffic auth-service --region asia-southeast1 --to-revisions=REVISION_NAME=100
```

Delete a service:

```bash
gcloud run services delete SERVICE_NAME --region asia-southeast1
```

## 9. Clean Up Resources (To Avoid Costs)

If you are just testing and want to avoid incurring charges on Google Cloud Platform, you must delete the resources you created. **Deleting the project will delete everything**, but if you want to keep the project and only delete the LifeOS resources, run the following commands.

### 9.1 Delete Cloud Run Services

This deletes all deployed microservices:

```bash
gcloud run services delete auth-service --region asia-southeast1 --quiet
gcloud run services delete knowledge-service --region asia-southeast1 --quiet
gcloud run services delete api-gateway --region asia-southeast1 --quiet
gcloud run services delete web --region asia-southeast1 --quiet
```

### 9.2 Delete Cloud SQL Instances

> **WARNING**: This will permanently delete your databases and all data inside them.

```bash
gcloud sql instances delete lifeos-auth-db --quiet
gcloud sql instances delete lifeos-knowledge-db --quiet
```

### 9.3 Delete Artifact Registry Repository

This deletes all pushed Docker images:

```bash
gcloud artifacts repositories delete lifeos-registry --location=asia-southeast1 --quiet
```
