// backend/src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import routes from './routes';

const app: Application = express();

/* --------------------------- Seguridad básica --------------------------- */
app.use(helmet());

/* ------------------------------ CORS ----------------------------------- */
// Dominios explícitos desde env (coma separados)
const raw = (config.cors?.origin ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Acepta el dominio principal y también los “preview deployments” de Vercel
const previewRegex = /^https:\/\/shucway-app-front-[\w-]+\.vercel\.app$/i;

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;                  // server-to-server / curl
  if (raw.includes(origin)) return true;     // coincide con la lista
  if (previewRegex.test(origin)) return true; // preview de Vercel
  return false;
};

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    cb(null, isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
// Responder explícitamente preflight a todo
app.options('*', cors(corsOptions));

/* --------------------------- Rate limiting ------------------------------ */
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: 'Demasiadas solicitudes, intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

/* --------------------------- Parsers & logs ----------------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.env === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

/* ------------------------------- Rutas ---------------------------------- */
app.use('/api', routes);

// Healthcheck (útil para probar CORS y disponibilidad)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    env: config.env,
    cors_allow: raw,
    time: new Date().toISOString(),
  });
});

// Info raíz
app.get('/', (_req: Request, res: Response) => {
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

/* --------------------------- Manejo de errores -------------------------- */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
