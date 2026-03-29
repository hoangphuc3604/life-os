#!/bin/bash

set -e

PROJECT_ID="hoangphuc3604"
REGION="asia-southeast1"
REGISTRY="asia-southeast1-docker.pkg.dev/${PROJECT_ID}/lifeos-registry"
API_GATEWAY_URL="https://api-gateway-${PROJECT_ID}.${REGION}.run.app"

echo "========================================="
echo "  Life-OS Cloud Run Deployment"
echo "========================================="
echo ""

echo ">>> [0/4] Setting up environment..."

gcloud auth configure-docker ${REGISTRY%/*} --quiet 2>/dev/null || true

echo ""
echo ">>> [1/4] Building and deploying backend services..."

echo "    Building auth-service..."
docker build \
  --build-arg NODE_ENV=prod \
  -t "${REGISTRY}/auth-service:latest" \
  services/auth-service

echo "    Pushing auth-service..."
docker push "${REGISTRY}/auth-service:latest"

echo "    Deploying auth-service..."
gcloud run deploy auth-service \
  --image "${REGISTRY}/auth-service:latest" \
  --region ${REGION} \
  --platform managed \
  --no-allow-unauthenticated \
  --vpc-connector lifeos-connector \
  --add-cloudsql-instances "${PROJECT_ID}:${REGION}:lifeos-auth-db" \
  --set-env-vars "NODE_ENV=prod" \
  --set-env-vars "DATABASE_URL=postgresql://lifeos_auth_user:password@localhost/lifeos_auth?host=/cloudsql/${PROJECT_ID}:${REGION}:lifeos-auth-db" \
  --set-env-vars "JWT_SECRET=${JWT_SECRET:?JWT_SECRET not set}" \
  --memory 512Mi --cpu 1 \
  --min-instances 0 --max-instances 10 \
  --concurrency 80 --timeout 300s

echo "    ✓ auth-service deployed"

echo ""
echo "    Building knowledge-service..."
docker build \
  --build-arg NODE_ENV=prod \
  -t "${REGISTRY}/knowledge-service:latest" \
  services/knowledge-service

echo "    Pushing knowledge-service..."
docker push "${REGISTRY}/knowledge-service:latest"

echo "    Deploying knowledge-service..."
gcloud run deploy knowledge-service \
  --image "${REGISTRY}/knowledge-service:latest" \
  --region ${REGION} \
  --platform managed \
  --no-allow-unauthenticated \
  --vpc-connector lifeos-connector \
  --add-cloudsql-instances "${PROJECT_ID}:${REGION}:lifeos-knowledge-db" \
  --set-env-vars "NODE_ENV=prod" \
  --set-env-vars "DATABASE_URL=postgresql://lifeos_knowledge_user:password@localhost/lifeos_knowledge?host=/cloudsql/${PROJECT_ID}:${REGION}:lifeos-knowledge-db" \
  --set-env-vars "JWT_SECRET=${JWT_SECRET}" \
  --set-env-vars "UPLOAD_DIR=./uploads" \
  --set-env-vars "MAX_FILE_SIZE=10485760" \
  --memory 512Mi --cpu 1 \
  --min-instances 0 --max-instances 10 \
  --concurrency 80 --timeout 300s

echo "    ✓ knowledge-service deployed"

echo ""
echo ">>> [2/4] Building and deploying API Gateway..."

echo "    Building api-gateway..."
docker build \
  --build-arg NODE_ENV=prod \
  -t "${REGISTRY}/api-gateway:latest" \
  services/api-gateway

echo "    Pushing api-gateway..."
docker push "${REGISTRY}/api-gateway:latest"

echo "    Deploying api-gateway..."
gcloud run deploy api-gateway \
  --image "${REGISTRY}/api-gateway:latest" \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 80 \
  --memory 256Mi --cpu 1 \
  --min-instances 0 --max-instances 10 \
  --concurrency 100

echo "    ✓ api-gateway deployed"

echo ""
echo ">>> [3/4] Building and deploying frontend..."

echo "    Building web frontend..."
docker build \
  --build-arg "VITE_API_GATEWAY_URL=${API_GATEWAY_URL}" \
  -t "${REGISTRY}/web:latest" \
  web

echo "    Pushing web..."
docker push "${REGISTRY}/web:latest"

echo "    Deploying web..."
gcloud run deploy web \
  --image "${REGISTRY}/web:latest" \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi --cpu 1 \
  --min-instances 0 --max-instances 10 \
  --concurrency 1000

echo "    ✓ web deployed"

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "Services:"
echo "  Web:         https://web-${PROJECT_ID}.${REGION}.run.app"
echo "  API Gateway: ${API_GATEWAY_URL}"
echo "  Auth:       https://auth-service-${PROJECT_ID}.${REGION}.run.app"
echo "  Knowledge:   https://knowledge-service-${PROJECT_ID}.${REGION}.run.app"
echo ""
