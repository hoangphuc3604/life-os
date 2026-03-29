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

echo "Checking database connection..."
echo "DATABASE_URL: postgresql://\$AUTH_DB_USER:***@/lifeos_auth?host=/cloudsql/\$GCP_PROJECT_ID:\$REGION:lifeos-auth-db"

echo "Starting application on PORT=$PORT..."
exec "$@" 2>&1 | tee /dev/stderr
