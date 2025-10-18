import { Router } from 'express';
import authRoutes from './auth.routes';
import productosRoutes from './productos.routes';
import inventarioRoutes from './inventario.routes';
import clientesRoutes from './clientes.routes';
import ventasRoutes from './ventas.routes';
import usuariosRoutes from './usuarios.routes';

const router = Router();

// Rutas principales
router.use('/auth', authRoutes);
router.use('/productos', productosRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/clientes', clientesRoutes);
router.use('/ventas', ventasRoutes);
router.use('/usuarios', usuariosRoutes);

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
