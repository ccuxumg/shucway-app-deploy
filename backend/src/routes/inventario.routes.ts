import { Router } from 'express';
import { inventarioController } from '../controllers/inventario.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  requireCajero,
  requireAdministrador,
} from '../middlewares/roleGuard.middleware';

const router = Router();

// ================================================================
// 📦 RUTAS DE INVENTARIO
// ================================================================

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ================== CATEGORÍAS DE INSUMOS ==================
// Nivel mínimo: Cajero (30) para consultar, Administrador (80) para modificar

router.get('/categorias', requireCajero, inventarioController.getCategoriasInsumo.bind(inventarioController));
router.get('/categorias/:id', requireCajero, inventarioController.getCategoriaInsumoById.bind(inventarioController));

// ================== INSUMOS ==================
// Nivel mínimo: Cajero (30) para consultar, Administrador (80) para modificar

router.get('/insumos', requireCajero, inventarioController.getInsumos.bind(inventarioController));
router.get('/insumos/:id', requireCajero, inventarioController.getInsumoById.bind(inventarioController));
router.post('/insumos', requireAdministrador, inventarioController.createInsumo.bind(inventarioController));
router.put('/insumos/:id', requireAdministrador, inventarioController.updateInsumo.bind(inventarioController));
router.delete('/insumos/:id', requireAdministrador, inventarioController.deleteInsumo.bind(inventarioController));

// ================== LOTES ==================
// Nivel mínimo: Cajero (30) para consultar, Administrador (80) para modificar

router.get('/insumos/:idInsumo/lotes', requireCajero, inventarioController.getLotesByInsumo.bind(inventarioController));
router.get('/lotes/:id', requireCajero, inventarioController.getLoteById.bind(inventarioController));
router.post('/lotes', requireAdministrador, inventarioController.createLote.bind(inventarioController));
router.delete('/lotes/:id', requireAdministrador, inventarioController.deleteLote.bind(inventarioController));

// ================== MOVIMIENTOS ==================
// Nivel mínimo: Cajero (30) para consultar y registrar

router.get('/movimientos', requireCajero, inventarioController.getMovimientos.bind(inventarioController));
router.post('/movimientos', requireCajero, inventarioController.createMovimiento.bind(inventarioController));

// ================== STOCK ==================
// Nivel mínimo: Cajero (30)

router.get('/stock', requireCajero, inventarioController.getStockActual.bind(inventarioController));
router.get('/stock/bajo', requireCajero, inventarioController.getInsumosStockBajo.bind(inventarioController));

export default router;
