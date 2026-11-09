# 04 - Proxy routing and CORS

**Selected proxy:** Nginx. Configuration: `proxy/default.conf`, mounted read-only into the `reverse-proxy` container.

## Routes

| Location | Upstream | Serves |
|---|---|---|
| `/assets/` | `http://frontend:80` | CSS, JavaScript and images |
| `= /health` | `http://backend:8080` | Application health endpoint |
| `/api/` | `http://backend:8080` | Cart API |
| `/` | `http://backend:8080` | Server-rendered pages: `/`, `/cart`, `/gallery`, `/category/:name` |

Upstreams use Docker Compose service names. Nginx uses Docker's DNS (`127.0.0.11`) and resolves the names per request, so a recreated container with a new IP is picked up without restarting the proxy.

Only `reverse-proxy` publishes a host port (80). The frontend, backend and database have no `ports:` entry.

## Was CORS required?

**No.** The browser loads pages, static files and API calls from the same origin, `http://<VM_PUBLIC_IP>`, and `public/assets/js/book.js` calls relative URLs such as `/api/cart`. Same-origin requests are not subject to CORS, so no `Access-Control-Allow-*` headers were added.
