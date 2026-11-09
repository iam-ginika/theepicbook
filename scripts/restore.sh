#!/usr/bin/env bash
# Restores a logical backup into the running database. Usage: scripts/restore.sh backups/<file>.sql
set -euo pipefail
cd "$(dirname "$0")/.."
file="${1:?Usage: scripts/restore.sh backups/<file>.sql}"
[ -s "$file" ] || { echo "Backup not found or empty: $file" >&2; exit 1; }
docker compose exec -T database sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot "$MYSQL_DATABASE"' < "$file"
echo "Restored $file"
