# 03 - Health checks and startup order

## Health checks

| Service       | Check                                             | Healthy means                                                                                                                       |
|---------------|---------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| database      | `mysqladmin ping -h 127.0.0.1`                    | MySQL answers on TCP. First-run seeding uses the socket only, so this stays unhealthy until seeding has finished                    |
| backend       | `wget` to `http://127.0.0.1:8080/health`          | Express is listening and Sequelize can reach MySQL. BusyBox `wget` ships in the Alpine runtime image, so nothing extra is installed |
| frontend      | `wget` to `http://127.0.0.1/assets/css/style.css` | Nginx is serving a real file from the web root                                                                                      |
| reverse-proxy | `wget` to `http://127.0.0.1/health`               | The proxy can resolve the backend and carry a request end to end                                                                    |

## Startup order

1. `database` starts and becomes healthy.
2. `backend` starts (`depends_on: database: condition: service_healthy`) and becomes healthy. `frontend` starts in parallel and becomes healthy.
3. `reverse-proxy` starts (`depends_on: frontend` and `backend`, both `condition: service_healthy`).

A plain `depends_on` list only waits for a container to start. MySQL can take a minute on first run while it seeds, and the backend exits if `sequelize.sync()` cannot connect, so the condition is required.

## Recovery behaviour

All services use `restart: unless-stopped`. `depends_on` only applies at startup. If MySQL goes away later, `/health` returns 503, the backend stays up, and its connection pool reconnects when MySQL returns.
