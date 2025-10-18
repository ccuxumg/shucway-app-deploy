import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.types';
import { usuariosService, UpdateUsuarioDTO } from '../services/usuarios.service';

// ================================================================
// 👥 CONTROLADOR DE USUARIOS
// ================================================================

export class UsuariosController {
  async getUsuarios(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;

      const filters = {
        estado: req.query.estado as string | undefined,
        searchValue: req.query.searchValue as string | undefined,
        telefono: req.query.telefono as string | undefined,
        fecha_inicio: req.query.fecha_inicio as string | undefined,
        fecha_fin: req.query.fecha_fin as string | undefined,
      };

      const result = await usuariosService.getUsuarios(page, pageSize, filters);

      res.json({
        success: true,
        data: result.data,
        count: result.count,
        page,
        pageSize,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsuarioById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const usuario = await usuariosService.getUsuarioById(id);

      if (!usuario) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUsuario(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateUsuarioDTO = req.body;

      const usuario = await usuariosService.updateUsuario(id, dto);

      res.json({
        success: true,
        data: usuario,
        message: 'Usuario actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstado(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { estado } = req.body;

      if (!['activo', 'desactivado', 'suspendido'].includes(estado)) {
        res.status(400).json({
          success: false,
          message: 'Estado inválido',
        });
        return;
      }

      const usuario = await usuariosService.cambiarEstado(id, estado);

      res.json({
        success: true,
        data: usuario,
        message: `Usuario ${estado} exitosamente`,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUsuario(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await usuariosService.deleteUsuario(id);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async getRolesByUsuario(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const roles = await usuariosService.getRolesByUsuario(id);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  async asignarRol(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = parseInt(req.params.id);
      const { idRol } = req.body;

      if (!idRol) {
        res.status(400).json({
          success: false,
          message: 'idRol es requerido',
        });
        return;
      }

      await usuariosService.asignarRol(idUsuario, idRol);

      res.json({
        success: true,
        message: 'Rol asignado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async removerRol(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const idUsuarioRol = parseInt(req.params.idUsuarioRol);
      await usuariosService.removerRol(idUsuarioRol);

      res.json({
        success: true,
        message: 'Rol removido exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async getEstadisticas(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await usuariosService.getEstadisticas();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usuariosController = new UsuariosController();
