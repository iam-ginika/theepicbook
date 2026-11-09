# 07 - Reliability test record

Precondition: all four services healthy. No container was removed, and no volume or data was deleted.

| Test | Failure action | Observed failure | Recovery action | Final verification |
|---|---|---|---|---|
| Backend outage | `docker compose stop backend` | FILL IN (expected: `/health` and `/` return 502, static files still 200) | `docker compose start backend` | FILL IN (expected: backend healthy, `/health` 200, home page 200) |
| Database outage | `docker compose stop database` | FILL IN (expected: `/health`, `/` and `/api/cart` return 503 "Database unavailable"; backend stays running) | `docker compose start database` | FILL IN (expected: database and backend healthy, `/` and `/api/cart` 200, book count unchanged) |

The backend was changed so a database error returns a clear 503. In the original code, a failed query in an `async` route becomes an unhandled promise rejection, which stops the Node.js process on current versions.
