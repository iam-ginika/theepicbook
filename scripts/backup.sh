#!/usr/bin/env bash
# Logical backup of the EpicBook database to backups/ on the host.
# Credentials are read inside the container, so they never reach the terminal.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
file="backups/bookstore_$(date -u +%Y%m%dT%H%M%SZ).sql"
docker compose exec -T database sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --no-tablespaces --routines --triggers "$MYSQL_DATABASE"' \
  > "$file.tmp"
tail -n 1 "$file.tmp" | grep -q "Dump completed" || { echo "Backup incomplete: $file.tmp" >&2; exit 1; }
mv "$file.tmp" "$file"
chmod 600 "$file"
ls -l "$file"
