import { Router } from 'express';
import { usuariosController } from '../controllers/usuarios.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireCajero, requireAdministrador } from '../middlewares/roleGuard.middleware';
import { AuthRequest } from '../types/express.types';

const router = Router();

// ================================================================
// 👥 RUTAS DE USUARIOS
// ================================================================

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// 🧪 ENDPOINT DE PRUEBA - Sin protección de roles (solo autenticación)
router.get('/test', (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Token válido - autenticación funcionando',
    user: req.user
  });
});

// Obtener usuarios (paginado con filtros) - Requiere Cajero (nivel 30)
router.get('/', requireCajero, usuariosController.getUsuarios);

// Obtener estadísticas de usuarios - Requiere Administrador (nivel 80)
router.get('/estadisticas', requireAdministrador, usuariosController.getEstadisticas);

// Obtener un usuario por ID - Requiere Cajero (nivel 30)
router.get('/:id', requireCajero, usuariosController.getUsuarioById);

// Actualizar usuario - Requiere Administrador (nivel 80)
router.put('/:id', requireAdministrador, usuariosController.updateUsuario);

// Cambiar estado de usuario - Requiere Administrador (nivel 80)
router.patch('/:id/estado', requireAdministrador, usuariosController.cambiarEstado);

// Eliminar usuario (soft delete) - Requiere Administrador (nivel 80)
router.delete('/:id', requireAdministrador, usuariosController.deleteUsuario);

// Obtener roles de un usuario - Requiere Cajero (nivel 30)
router.get('/:id/roles', requireCajero, usuariosController.getRolesByUsuario);

// Asignar rol a usuario - Requiere Administrador (nivel 80)
router.post('/:id/roles', requireAdministrador, usuariosController.asignarRol);

// Remover rol de usuario - Requiere Administrador (nivel 80)
router.delete('/roles/:idUsuarioRol', requireAdministrador, usuariosController.removerRol);

export default router;
