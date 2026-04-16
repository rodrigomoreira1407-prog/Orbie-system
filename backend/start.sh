#!/bin/sh
set -e

# Map Portuguese Railway env var names to English equivalents
export DATABASE_URL="${DATABASE_URL:-${URL_DO_BANCO_DE_DADOS}}"
export FRONTEND_URL="${FRONTEND_URL:-${URL_FRONTEND}}"
export PORT="${PORT:-${PORTA}}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-${ANTROPIC_API_KEY}}"

# Derive DIRECT_URL for Prisma migrations (prisma db push).
# Prisma 5 requires a direct (non-pgBouncer) connection for DDL migrations.
# Replaces any port in the DATABASE_URL with 5432 and strips query string params.
if [ -z "$DIRECT_URL" ]; then
  export DIRECT_URL="$(echo "$DATABASE_URL" | sed 's|:\([0-9]*\)\(/[^?]*\).*$|:5432\2|')"
fi

echo "Starting Prisma schema migration..."
node node_modules/.bin/prisma db push --accept-data-loss --skip-generate

echo "Starting Orbie backend..."
exec node src/server.js
