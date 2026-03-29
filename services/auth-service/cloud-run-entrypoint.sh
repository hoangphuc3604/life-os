#!/bin/sh
set -e

PORT=${PORT:-8080}
export PORT

echo "Starting Cloud SQL Auth Proxy with Unix socket..."
mkdir -p /cloudsql
/cloud-sql-proxy --unix-socket /cloudsql ${CLOUD_SQL_INSTANCE} &
PROXY_PID=$!

echo "Waiting for Cloud SQL Auth Proxy to be ready..."
sleep 5

echo "Running database migrations..."
npx prisma migrate deploy || echo "Migrations may already be applied"

echo "Starting application on PORT=$PORT..."
exec "$@" 2>&1 | tee /dev/stderr
