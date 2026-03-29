#!/bin/sh
set -e

PORT=${PORT:-8080}
export PORT

echo "Starting Cloud SQL Auth Proxy..."
/cloud-sql-proxy --port 5432 ${CLOUD_SQL_INSTANCE} &
PROXY_PID=$!

echo "Waiting for Cloud SQL Auth Proxy to be ready..."
sleep 3

echo "Starting application on PORT=$PORT..."
exec "$@"
