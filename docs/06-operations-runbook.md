# 06 - EpicBook operations runbook

Run all commands from the repository root on the VM. `.env` must exist.

**Never run `docker compose down -v` in normal operations.** It deletes the database volume.

## Startup

`docker compose up -d --build --wait`

Startup order is database, then backend and frontend, then reverse-proxy. `--wait` returns once all are healthy. A first run takes longer because MySQL seeds the database.

## Shutdown without deleting data

`docker compose down`

Containers and networks are removed. The `db_data` volume, `backups/` and `logs/proxy/` remain. For an OS reboot, no shutdown is required; `restart: unless-stopped` brings the stack back.

## Health and logs

| Need | Command |
|---|---|
| Service status | `docker compose ps` |
| Public health | `curl -i http://<VM_PUBLIC_IP>/health` |
| Backend logs | `docker compose logs --tail=100 backend` |
| Database logs | `docker compose logs --tail=100 database` |
| Proxy access log | `tail -n 50 logs/proxy/access.log` |
| Proxy error log | `tail -n 50 logs/proxy/error.log` |

## Safe restarts

| Service | Command | Impact |
|---|---|---|
| reverse-proxy | `docker compose restart reverse-proxy` | Site unavailable for a few seconds |
| Reload proxy config only | `docker compose exec reverse-proxy nginx -s reload` | None |
| frontend | `docker compose restart frontend` | Styles and images fail briefly |
| backend | `docker compose restart backend` | Pages and API return 502 until it is back |
| database | Take a backup, then `docker compose restart database` | Data pages return 503 until MySQL is healthy; backend reconnects on its own |

After any restart, wait for `healthy` in `docker compose ps`.

## Backup

`scripts/backup.sh` writes `backups/bookstore_<UTC timestamp>.sql` and fails if the dump is incomplete. Recommended: daily, retaining 7 daily and 4 weekly, with a copy off the VM.

## Restore

1. Take a fresh backup with `scripts/backup.sh`.
2. Run `scripts/restore.sh backups/<file>.sql`.
3. Complete the verification checklist below.

## Secret rotation (high level)

1. Take a backup.
2. Generate a new value (letters and digits only, because it goes in a connection URL).
3. Change the password inside MySQL with `ALTER USER`. Changing `.env` alone has no effect on an existing database, because the `MYSQL_*` variables are only applied at first initialisation.
4. Update `.env` on the VM.
5. Recreate the consumers with `docker compose up -d backend database`.
6. Run the checklist below, then revoke the old value everywhere it was used, including CI/CD secrets.

If a secret may have been exposed, rotate it immediately and review the logs.

## Post-incident verification checklist

- [ ] `docker compose ps` shows all four services healthy
- [ ] `/health` returns 200 through the public IP
- [ ] Home page loads with book data
- [ ] `/assets/css/style.css` returns 200
- [ ] `/api/cart` returns 200
- [ ] Book count matches the expected value
- [ ] Only port 80 is published; `docker compose ps` shows no other host ports
- [ ] `logs/proxy/error.log` has no new errors
- [ ] Backend logs have no repeating errors
- [ ] Incident, cause and fix are recorded
