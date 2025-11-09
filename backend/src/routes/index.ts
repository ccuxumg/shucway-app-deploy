import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productosRoutes from './productos.routes.js';
import inventarioRoutes from './inventario.routes.js';
import comprasRoutes from './compras.routes.js';
import clientesRoutes from './clientes.routes.js';
import ventasRoutes from './ventas.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import proveedorRoutes from './proveedor.routes.js';
import ordenCompraRoutes from './orden_compra.routes.js';
import backupRoutes from './backup.routes.js';
import auditoriaRoutes from './auditoria.routes.js';
import reportesRoutes from './reportes.routes.js';
import gastosOperativosRoutes from './gastos_operativos.routes.js';
import cajaRoutes from './caja.routes.js';

const router = Router();

// Rutas principales
router.use('/auth', authRoutes);
router.use('/productos', productosRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/compras', comprasRoutes);
router.use('/clientes', clientesRoutes);
router.use('/ventas', ventasRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/ordenes-compra', ordenCompraRoutes);
router.use('/backup', backupRoutes);
router.use('/auditoria', auditoriaRoutes);
router.use('/reportes', reportesRoutes);
router.use('/gastos-operativos', gastosOperativosRoutes);
router.use('/caja', cajaRoutes);

// Rutas adicionales para compatibilidad con frontend
router.get('/db/tables-count', dashboardController.getTablesCount);
router.get('/config/recent-changes', dashboardController.getRecentChanges);

// Ruta de health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    supabase: 'PostgreSQL + Storage',
    auth: 'JWT personalizado (sin Supabase Auth)'
  });
});

export default router;
