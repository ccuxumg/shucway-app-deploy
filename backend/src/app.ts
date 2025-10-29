import express, { Application } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import routes from './routes';

// Crear aplicación Express
const app: Application = express();

/* ================= Seguridad básica ================= */
// Para APIs: desactivar CORP (evita bloquear recursos cross-origin).
app.use(helmet({ crossOriginResourcePolicy: false }));

/* ================= CORS robusto ================= */
// Normaliza CORS_ORIGIN: separa por coma/espacio/; , trimea y quita '/' final
const allowlist = (config.cors?.origin || '')
  .split(/[,\s;]+/)
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // Permite llamadas server-to-server (sin header Origin)
    if (!origin) return cb(null, true);
    const clean = origin.replace(/\/$/, '');
    const ok = allowlist.includes(clean);
    if (ok) return cb(null, true);
    return cb(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // cache de preflight (24h)
};

app.use(cors(corsOptions));
// Responder explícitamente preflights a cualquier ruta
app.options('*', cors(corsOptions));

/* ================= Rate limiting ================= */
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Demasiadas solicitudes, por favor intenta más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

/* ================= Parsers ================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ================= Logger en desarrollo ================= */
if (config.env === 'development') {
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

/* ================= Rutas ================= */
app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Shucway API - Backend funcionando',
    version: '1.0.0',
    stack: 'Node.js + Express + TypeScript',
    database: 'Supabase PostgreSQL (sin Supabase Auth)',
    storage: 'Supabase Storage',
    authentication: 'JWT personalizado con bcrypt',
  });
});

/* ================= Errores ================= */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
