#!/bin/sh
set -e

PORT=${PORT:-8080}
export PORT

npx prisma migrate deploy || true

exec node dist/main.js
