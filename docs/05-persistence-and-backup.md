# 05 - Persistence and backup

| Item                     | Detail                                                                                                                                                    
|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------
| Data backed up           | The whole `bookstore` database: `Author`, `Book`, `Cart`, `Cartbook`, `Checkout` (schema and rows)                                                      
| Method                   | Logical backup with `mysqldump --single-transaction`, run by `scripts/backup.sh` inside the database container.                                           
| Location                 | `backups/` on the VM host, outside the container and excluded from Git. Files are `chmod 600`                                                            
| Filename pattern         | `bookstore_<UTC timestamp>.sql`                                                                                                                           
| Schedule recommendation  | Daily at a low-traffic hour using cron on the host, plus one backup immediately before any deployment or schema change                                    
| Retention recommendation | 7 daily and 4 weekly backups. Copy off the VM  

## Restore procedure

1. Confirm the stack is running and the database is healthy.
2. Choose the file in `backups/` and confirm it ends with the `Dump completed` line.
3. Take a fresh backup of the current state.
4. Run `scripts/restore.sh backups/<file>.sql`.
5. Verify row counts and the affected record, then check `/health` and the home page.

Do not use `docker compose down -v` or delete `db_data`. Neither is needed for a restore.

## Manual backup and restore test

| Step                                              | Result                                     |
|---------------------------------------------------|--------------------------------------------|
| Backup file                                       | bookstore_20261110T084105Z.sql             |
| Backup timestamp (UTC)                            | 2026-11-10 08:41:05 UTC                    |
| Test record                                       | `Book` id 54, "Three-Body Problem Trilogy" |
| Book count before                                 | 54                                         |
| After controlled delete of that record            | 53, test record absent                     |
| After restore                                     | 54, test record present                    |
| After `docker compose down` and `up -d` (no `-v`) | 54, test record present                    |
