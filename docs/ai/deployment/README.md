---
phase: deployment
title: Deployment Strategy
description: Define deployment process, infrastructure, and release procedures
---

# Deployment Strategy

## Infrastructure
**Where will the application run?**

- Google Cloud Platform (GCP)
- Google Cloud Run (Serverless container platform)
- Google Cloud SQL (PostgreSQL 15)
- Google Artifact Registry (Docker images)

## Deployment Pipeline
**How do we deploy changes?**

### CI Pipeline (GitHub Actions)
- **Workflow:** `.github/workflows/ci.yml`
- **Trigger:** Push/PR to any branch
- **Purpose:** Run tests only, no deployment
- **No auto-deploy** - Deployment is manual via deploy script

### Manual Deployment (Script)
- **Script:** `scripts/deploy-cloudrun.sh`
- **Usage:** `./deploy-cloudrun.sh`
- **Options:**
  - `--skip-build` - Use existing Docker images
  - `--skip-health` - Skip health checks
  - `--rollback` - Rollback to previous version

## Environment Configuration

### Development
- Local Docker Compose
- PostgreSQL in Docker
- Hot reload enabled

### Production (Cloud Run)
- Fully containerized microservices
- Cloud SQL for database (managed PostgreSQL)
- VPC for secure connectivity
- No auto-scaling (configurable min/max instances)

## Deployment Steps

1. **Push code to GitHub**
   - CI workflow runs tests automatically
   - Tests must pass before manual deployment

2. **Run deploy script**
   ```bash
   cd scripts
   ./deploy-cloudrun.sh
   ```

3. **Verify deployment**
   - Script performs health checks
   - Returns service URLs

## Database Migrations

### Local Development
```bash
cd services/auth-service
npx prisma migrate deploy
```

### Cloud Run
Migrations must be run before or after deployment:
```bash
# Connect to Cloud SQL and run migrations manually
gcloud sql connect lifeos-auth-db --user=lifeos_auth_user
```

## Secrets Management

### Configuration File
- `scripts/config.env` - Deployment configuration (gitignored)
- `scripts/config.env.example` - Template for configuration

### Required Secrets
- JWT_SECRET - JWT signing key
- Database credentials - Stored in config.env

## Rollback Plan

### Using Deploy Script
```bash
./deploy-cloudrun.sh --rollback
```

### Manual Rollback
```bash
# Get previous revision
gcloud run revisions list --service=auth-service --region=asia-southeast1

# Rollback to previous revision
gcloud run services update-traffic auth-service \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=asia-southeast1
```
