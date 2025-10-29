import express, { Application } from "express";
import cors from "cors";
import type { CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.middleware";
import routes from "./routes";

const app: Application = express();

/* ---- Seguridad base ---- */
app.use(helmet());

/* ---- CORS ---- */
const safeSplit = (s?: string) => (s ? s.split(",").map(o => o.trim()).filter(Boolean) : []);
const allowList = safeSplit(config.cors?.origin);

const corsOptions: CorsOptions =
  allowList.length > 0
    ? {
        origin(origin, cb) {
          if (!origin) return cb(null, true); // server-to-server
          return allowList.includes(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"));
        },
        credentials: true
      }
    : { origin: true, credentials: true };

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ---- Healthcheck (ARRIBA y fuera de límites) ---- */
app.get("/api/health", (_req, res) => {
  res
    .set("Cache-Control", "no-store")
    .status(200)
    .json({ ok: true, env: config.env, cors_allow: allowList });
});

/* ---- Rate limiting solo para /api (después de /api/health) ---- */
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: "Demasiadas solicitudes, por favor intenta más tarde" },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", limiter);

/* ---- Parsers ---- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ---- Logger dev ---- */
if (config.env === "development") {
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

/* ---- Rutas API ---- */
app.use("/api", routes);

/* ---- Raíz informativa ---- */
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Shucway API - Backend funcionando",
    version: "1.0.0",
    stack: "Node.js + Express + TypeScript",
    database: "Supabase PostgreSQL (sin Supabase Auth)",
    storage: "Supabase Storage",
    authentication: "JWT personalizado con bcrypt"
  });
});

/* ---- Errores ---- */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
