import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/stats', dashboardController.getStats);
router.get('/ventas-semana', dashboardController.getVentasSemana);
router.get('/alertas', dashboardController.getAlertasRecientes);

export default router;
