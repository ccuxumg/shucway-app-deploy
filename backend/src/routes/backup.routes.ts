import { Router } from 'express';
import { getFullBackup, getIncrementalBackup } from '../controllers/backup.controller';

const router = Router();

// Ruta para backup completo
router.get('/full', getFullBackup);

// Ruta para backup incremental (simulado para free tier)
router.get('/incremental', getIncrementalBackup);

export default router;