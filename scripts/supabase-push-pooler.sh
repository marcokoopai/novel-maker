#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-icmrxekocgkkbzxzjzla}"
POOLER_HOST="${SUPABASE_POOLER_HOST:-aws-1-ap-northeast-1.pooler.supabase.com}"

if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
  DB_PASS="$SUPABASE_DB_PASSWORD"
else
  printf "Supabase database password for %s: " "$PROJECT_REF" >&2
  stty -echo
  read -r DB_PASS
  stty echo
  printf "\n" >&2
fi

ENCODED_DB_PASS="$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$DB_PASS")"
DB_URL="postgresql://postgres.${PROJECT_REF}:${ENCODED_DB_PASS}@${POOLER_HOST}:5432/postgres?sslmode=require"

npx supabase migration list --db-url "$DB_URL"
npx supabase db push --db-url "$DB_URL"
