#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/supabase-push-db.sh [--dry-run] [--types]

Privacy-preserving credential flow:
  1. Prefer a one-time shell variable:
       export SUPABASE_DB_URL='postgresql://postgres:<password>@host:5432/postgres?sslmode=require'
       scripts/supabase-push-db.sh

  2. Or provide non-secret connection parts and enter the password interactively:
       export SUPABASE_DB_HOST='db.example.com'
       export SUPABASE_DB_USER='postgres'
       scripts/supabase-push-db.sh

Supported variables:
  SUPABASE_DB_URL       Full Postgres URL. Highest priority.
  DATABASE_URL          Full Postgres URL fallback.
  SUPABASE_DB_HOST      Postgres host when building the URL interactively.
  SUPABASE_DB_PORT      Defaults to 5432.
  SUPABASE_DB_NAME      Defaults to postgres.
  SUPABASE_DB_USER      Defaults to postgres.
  SUPABASE_DB_PASSWORD  Optional password for non-interactive use.
  SUPABASE_DB_SSLMODE   Defaults to require.

Do not put DB credentials in the frontend .env file.
USAGE
}

DRY_RUN=0
GENERATE_TYPES=0

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
      ;;
    --types)
      GENERATE_TYPES=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf "Unknown argument: %s\n\n" "$arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

urlencode() {
  node -e "console.log(encodeURIComponent(process.argv[1]))" "$1"
}

read_hidden() {
  local prompt="$1"
  local value
  printf "%s" "$prompt" >&2
  stty -echo
  read -r value
  stty echo
  printf "\n" >&2
  printf "%s" "$value"
}

DB_URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"

if [ -z "$DB_URL" ]; then
  DB_HOST="${SUPABASE_DB_HOST:-}"
  if [ -z "$DB_HOST" ]; then
    printf "Postgres host: " >&2
    read -r DB_HOST
  fi

  DB_PORT="${SUPABASE_DB_PORT:-5432}"
  DB_NAME="${SUPABASE_DB_NAME:-postgres}"
  DB_USER="${SUPABASE_DB_USER:-postgres}"
  DB_SSLMODE="${SUPABASE_DB_SSLMODE:-require}"

  if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
    DB_PASSWORD="$SUPABASE_DB_PASSWORD"
  else
    DB_PASSWORD="$(read_hidden "Postgres password for ${DB_USER}@${DB_HOST}: ")"
  fi

  ENCODED_USER="$(urlencode "$DB_USER")"
  ENCODED_PASSWORD="$(urlencode "$DB_PASSWORD")"
  ENCODED_DB_NAME="$(urlencode "$DB_NAME")"
  DB_URL="postgresql://${ENCODED_USER}:${ENCODED_PASSWORD}@${DB_HOST}:${DB_PORT}/${ENCODED_DB_NAME}?sslmode=${DB_SSLMODE}"
fi

SAFE_URL="$(node -e "const u = new URL(process.argv[1]); if (u.password) u.password = '***'; console.log(u.toString())" "$DB_URL")"
printf "Using database: %s\n" "$SAFE_URL" >&2

npx supabase migration list --db-url "$DB_URL"

if [ "$DRY_RUN" -eq 1 ]; then
  npx supabase db push --db-url "$DB_URL" --dry-run
else
  npx supabase db push --db-url "$DB_URL"
fi

if [ "$GENERATE_TYPES" -eq 1 ]; then
  npx supabase gen types typescript --db-url "$DB_URL" --schema public > src/lib/database.types.ts
fi
