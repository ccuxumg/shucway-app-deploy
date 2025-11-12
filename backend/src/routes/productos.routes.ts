import { Router } from 'express';
import { productosController } from '../controllers/productos.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  requireCajero,
  requireAdministrador,
} from '../middlewares/roleGuard.middleware';

const router = Router();

// ================================================================
// 🍔 RUTAS DE PRODUCTOS
// ================================================================

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ================== CATEGORÍAS ==================
// Nivel mínimo: Cajero (30) para consultar, Administrador (80) para modificar

router.get('/categorias', requireCajero, productosController.getCategorias.bind(productosController));
router.get('/categorias/:id', requireCajero, productosController.getCategoriaById.bind(productosController));
router.post('/categorias', requireAdministrador, productosController.createCategoria.bind(productosController));

// ================== PRODUCTOS ==================
// Nivel mínimo: Cajero (30) para consultar, Administrador (80) para modificar

router.get('/', requireCajero, productosController.getProductos.bind(productosController));
router.get('/:id', requireCajero, productosController.getProductoById.bind(productosController));
router.post('/', requireAdministrador, productosController.createProducto.bind(productosController));
router.put('/:id', requireAdministrador, productosController.updateProducto.bind(productosController));
router.delete('/:id', requireAdministrador, productosController.deleteProducto.bind(productosController));

// ================== VARIANTES ==================

router.get('/:idProducto/variantes', requireCajero, productosController.getVariantesByProducto.bind(productosController));
router.post('/variantes', requireAdministrador, productosController.createVariante.bind(productosController));
router.delete('/variantes/:id', requireAdministrador, productosController.deleteVariante.bind(productosController));

// ================== RECETAS ==================

router.get('/:idProducto/receta', requireCajero, productosController.getRecetaByProducto.bind(productosController));
router.post('/receta', requireAdministrador, productosController.createRecetaDetalle.bind(productosController));
router.delete('/receta/:id', requireAdministrador, productosController.deleteRecetaDetalle.bind(productosController));

export default router;
