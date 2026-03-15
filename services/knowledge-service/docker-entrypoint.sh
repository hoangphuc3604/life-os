#!/bin/sh
set -e

if [ "$NODE_ENV" = "production" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
fi

echo "Starting application..."
exec "$@"
