# 02 - Environment variables and ports

## Components

| Component | Technology | Internal port | Published to host | Start command |
|---|---|---|---|---|
| reverse-proxy | Nginx 1.28 (Alpine) | 80 | **80** (only public port) | Nginx default |
| frontend | Nginx 1.28 (Alpine), static files from `frontend/public/` | 80 | No | Nginx default |
| backend | Node.js 22, Express 4, Handlebars views, Sequelize 6 | 8080 | No | `node server.js` (`npm start` in the repo) |
| database | MySQL 8.4 LTS | 3306 | No | MySQL default |

The repository's install guide targets MySQL 5.7, which is end of life, so this deployment uses 8.4 LTS.

## Environment-variable names

| Name | Used by | Source | Purpose |
|---|---|---|---|
| `MYSQL_DATABASE` | database, backend | `.env` | Database name. Must be `bookstore`, because the seed files run `USE bookstore` |
| `MYSQL_USER` | database, backend | `.env` | Application database user |
| `MYSQL_PASSWORD` | database, backend | `.env` | Application user's password |
| `MYSQL_ROOT_PASSWORD` | database | `.env` | MySQL root password; used for health checks and backups |
| `JAWSDB_URL` | backend | Built in `docker-compose.yml` from the values above | Connection string read by `config/config.json` in production |
| `NODE_ENV` | backend | `docker-compose.yml` | Set to `production` |
| `PORT` | backend | `docker-compose.yml` | Backend listen port |
| `BACKEND_IMAGE`, `FRONTEND_IMAGE` | Compose | Optional, set by CI/CD | Override local image tags with versioned tags |

Real values live only in `.env`, which is excluded by `.gitignore` and `.dockerignore`. `.env.example` lists the names with placeholders.

## Routes

| Path | Service |
|---|---|
| `/assets/` | frontend |
| `/api/` (`/api/cart`, `/api/cart/delete`) | backend. API prefix is `/api` |
| `/health` | backend |
| `/`, `/cart`, `/gallery`, `/category/:name` | backend |

## Persistent data

| Item | Location |
|---|---|
| MySQL data directory | `/var/lib/mysql`, stored in named volume `db_data` |
| Schema and seed files | `db/BuyTheBook_Schema.sql`, `db/author_seed.sql`, `db/books_seed.sql`, mounted into `/docker-entrypoint-initdb.d/` and run on first start only |
| Tables added at runtime | `Cartbook` and `Checkout`, created by Sequelize `sync()` |

## Health-check method

The original repository had no health endpoint, so `GET /health` was added to the backend. It runs a real database query through Sequelize and returns 200 when ready or 503 when the database cannot be reached. Details per service are in `03-healthchecks-and-depends-on.md`.
