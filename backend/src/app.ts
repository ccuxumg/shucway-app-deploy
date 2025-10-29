import express, { Application } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.middleware";
import routes from "./routes";

const app: Application = express();

// Seguridad
app.use(helmet());

// CORS
const allowList = (config.cors?.origin ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions: CorsOptions =
  allowList.length
    ? {
        origin(origin, cb) {
          if (!origin) return cb(null, true);
          cb(allowList.includes(origin) ? null : new Error("Not allowed by CORS"), true);
        },
        credentials: true
      }
    : { origin: true, credentials: true };

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Rate limit solo a /api/*
app.use("/api/", rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false
}));

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logs dev
if (config.env === "development") {
  app.use((req, _res, next) => { logger.debug(`${req.method} ${req.url}`); next(); });
}

// MONTAJE DE RUTAS: prefijo /api AQUÍ
app.use("/api", routes);

// Healthcheck y raíz
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: config.env, allowList });
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Shucway API - Backend funcionando",
    version: "1.0.0",
    stack: "Node.js + Express + TypeScript"
  });
});

// 404 y errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

