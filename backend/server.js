"use strict";

const express = require("express");
const exphbs = require("express-handlebars");

// Requiring our models for syncing
const db = require("./models");

const PORT = process.env.PORT || 8080;

const app = express();
app.disable("x-powered-by");

// One line per request on stdout. Path only: no query strings, headers or cookies.
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    if (req.path !== "/health") {
      console.log(JSON.stringify({
        time: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - started
      }));
    }
  });
  next();
});

// Parse application body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Ready only when the database answers. Used by Docker and the reverse proxy.
app.get("/health", async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Health check failed:", err.name);
    res.status(503).json({ status: "unavailable" });
  }
});

require("./routes/cart-api-routes")(app);

console.log("going to html route");
app.use("/", require("./routes/html-routes"));
app.use("/cart", require("./routes/html-routes"));
app.use("/gallery", require("./routes/html-routes"));

// Clear failure for the browser; the error name goes to the logs, connection details do not.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const dbDown = /^Sequelize(Connection|HostNotFound|HostNotReachable|AccessDenied)/.test(err.name);
  console.error(JSON.stringify({ time: new Date().toISOString(), path: req.path, error: err.name }));
  res.status(dbDown ? 503 : 500).json({ error: dbDown ? "Database unavailable" : "Internal server error" });
});

db.sequelize.sync().then(function () {
  const server = app.listen(PORT, function () {
    console.log("App listening on PORT " + PORT);
  });

  // Node as PID 1 ignores SIGTERM unless it is handled, which makes docker stop wait 10s.
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down");
    server.close(() => db.sequelize.close().finally(() => process.exit(0)));
  });
}).catch((err) => {
  console.error("Database sync failed:", err.name);
  process.exit(1);
});
