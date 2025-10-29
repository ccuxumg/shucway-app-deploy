// backend/src/app.ts
import express, { Application } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import routes from './routes';

const app: Application = express();

// Confianza en proxy (Vercel) para cabeceras de origen/IP
app.set('trust proxy', 1);

// Seguridad básica
app.use(helmet());

// ========= CORS =========
const safeSplit = (s?: string) =>
  (s ? s.split(',').map(o => o.trim()).filter(Boolean) : []);

const allowList = safeSplit(config.cors?.origin);

// OJO: si usas cookies en el futuro, mantén credentials:true en ambos lados
const corsOptions: CorsOptions =
  allowList.length > 0
    ? {
        origin(origin, cb) {
          // Permite server-to-server (curl, Postman) sin Origin
          if (!origin) return cb(null, true);

          const ok = allowList.includes(origin);
          if (config.env === 'development') {
            logger.debug(`[CORS] origin="${origin}" allow=${ok}`);
          }
          return ok ? cb(null, true) : cb(new Error('Not allowed by CORS'));
        },
        credentials: true,
      }
    : {
        origin: true,
        credentials: true,
      };

// Aplica CORS a todas las peticiones
app.use(cors(corsOptions));
// **MUY IMPORTANTE**: responder también el preflight (OPTIONS)
app.options('*', cors(corsOptions));
// ========================

// Rate limiting (después de CORS para no bloquear preflights)
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

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger de requests en desarrollo
if (config.env === 'development') {
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

// Rutas API
app.use('/api', routes);

// Healthcheck (útil para probar CORS rápido)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: config.env, cors_allow: allowList });
});

// Ruta raíz informativa
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

// Errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
