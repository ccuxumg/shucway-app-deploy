import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';

export class AuthController {
  // POST /api/auth/register
  async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.register(req.body);

      res.status(201).json({
        success: true,
        data: user,
        message: 'Usuario registrado exitosamente'
      });
    } catch (error: any) {
      logger.error('Error en register controller:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Error al registrar usuario'
      });
    }
  }

  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login exitoso'
      });
    } catch (error: any) {
      logger.error('Error en login controller:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Error al iniciar sesión'
      });
    }
  }

  // GET /api/auth/validate
  async validateToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      // El middleware ya validó el token
      res.status(200).json({
        success: true,
        data: req.user,
        message: 'Token válido'
      });
    } catch (error: any) {
      logger.error('Error en validateToken controller:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Error al validar token'
      });
    }
  }

  // POST /api/auth/refresh
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token no proporcionado'
        });
        return;
      }

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Token renovado exitosamente'
      });
    } catch (error: any) {
      logger.error('Error en refreshToken controller:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Error al renovar token'
      });
    }
  }

  // POST /api/auth/logout
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      // En JWT no hay "logout" real en el backend
      // El cliente simplemente elimina el token
      logger.info(`Logout: usuario ${req.user?.id_perfil}`);

      res.status(200).json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error: any) {
      logger.error('Error en logout controller:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cerrar sesión'
      });
    }
  }
}

export const authController = new AuthController();
