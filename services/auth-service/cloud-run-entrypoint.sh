#!/bin/sh
set -e

echo "Starting Cloud SQL Auth Proxy..."
/cloud-sql-proxy --port 5432 ${CLOUD_SQL_INSTANCE} &
PROXY_PID=$!

echo "Waiting for Cloud SQL Auth Proxy to be ready..."
sleep 3

echo "Starting application..."
exec "$@"
