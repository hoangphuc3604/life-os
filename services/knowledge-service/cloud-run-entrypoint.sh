#!/bin/sh
set -e

PORT=${PORT:-8080}
export PORT

echo "Starting Cloud SQL Auth Proxy on TCP port 5432..."
echo "CLOUD_SQL_INSTANCE=${CLOUD_SQL_INSTANCE}"
/cloud-sql-proxy --port 5432 --log-debug ${CLOUD_SQL_INSTANCE} &
PROXY_PID=$!

echo "Waiting for Cloud SQL Auth Proxy to be ready..."
sleep 5

echo "Running database migrations..."
npx prisma migrate deploy || echo "Migrations may already be applied"

echo "Starting application on PORT=$PORT..."
exec "$@" 2>&1
