#!/bin/sh
set -e

PORT=${PORT:-8080}
export PORT

echo "Starting Cloud SQL Auth Proxy with Unix socket..."
mkdir -p /cloudsql
/chmod +x /cloud-sql-proxy
/cloud-sql-proxy --unix-socket /cloudsql ${CLOUD_SQL_INSTANCE} &
PROXY_PID=$!

echo "Waiting for Cloud SQL Auth Proxy to be ready..."
sleep 3

echo "Starting application on PORT=$PORT..."
exec "$@"
