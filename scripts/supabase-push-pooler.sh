#!/usr/bin/env bash
set -euo pipefail

printf "scripts/supabase-push-pooler.sh is deprecated. Use scripts/supabase-push-db.sh instead.\n" >&2
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/supabase-push-db.sh" "$@"
