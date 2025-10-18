import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthRequest, AuthUser } from '../types/express.types';
import { logger } from '../utils/logger';

// Middleware para verificar el token JWT
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    logger.info(`🔍 Auth Check - Path: ${req.path}`);
    logger.info(`🔍 Auth Header: ${authHeader ? 'Presente' : 'Ausente'}`);
    logger.info(`🔍 Token: ${token ? 'Presente (primeros 20 chars): ' + token.substring(0, 20) + '...' : 'Ausente'}`);

    if (!token) {
      logger.warn('❌ Token no proporcionado');
      res.status(401).json({
        success: false,
        error: 'Token no proporcionado'
      });
      return;
    }

    // Verificar token
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        logger.warn(`❌ Token inválido: ${err.message}`);
        res.status(403).json({
          success: false,
          error: 'Token inválido o expirado',
          details: err.message
        });
        return;
      }

      // Agregar usuario al request
      req.user = decoded as AuthUser;
      logger.info(`✅ Token válido - Usuario: ${req.user.email} (${req.user.role.nombre_rol})`);
      next();
    });
  } catch (error) {
    logger.error('Error en authenticateToken:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar autenticación'
    });
  }
};

// Middleware para verificar roles específicos
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      const userRole = req.user.role.nombre_rol;
      const hasRole = allowedRoles.includes(userRole);

      if (!hasRole) {
        logger.warn(
          `Usuario ${req.user.id_perfil} sin permisos. ` +
          `Requerido: ${allowedRoles.join(', ')}. Tiene: ${userRole}`
        );
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para realizar esta acción'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error en requireRoles:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar permisos'
      });
    }
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (!err) {
          req.user = decoded as AuthUser;
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Error en optionalAuth:', error);
    next();
  }
};
