import express, { Application } from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import routes from './routes';

// Crear aplicación Express
const app: Application = express();

// Middlewares de seguridad
app.use(helmet());

// Utilidad segura para dividir CORS_ORIGIN
const safeSplit = (s?: string) =>
  (s ? s.split(',').map(o => o.trim()).filter(Boolean) : []);

const allowList = safeSplit(config.cors?.origin);

// Si hay lista, validamos; si no, permitimos todo (útil mientras configuras)
const corsOptions: CorsOptions =
  allowList.length > 0
    ? {
        origin(origin, cb) {
          if (!origin) return cb(null, true); // server to server / curl
          return allowList.includes(origin)
            ? cb(null, true)
            : cb(new Error('Not allowed by CORS'));
        },
        credentials: true,
      }
    : { origin: true, credentials: true };

app.use(cors(corsOptions));

// Rate limiting (solo en producción)
if (config.env === 'production') {
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
}

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

// Rutas
app.use('/api', routes);

// Ruta raíz
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

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
