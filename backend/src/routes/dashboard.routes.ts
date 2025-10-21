import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/stats', dashboardController.getStats);
router.get('/ventas-semana', dashboardController.getVentasSemana);
router.get('/alertas', dashboardController.getAlertasRecientes);
router.get('/available-tables', dashboardController.getAvailableTables);
router.get('/table-columns/:tableName', dashboardController.getTableColumns);
router.get('/table-data/:tableName', dashboardController.getTableData);
router.get('/inventory', dashboardController.getInventoryData);

export default router;
