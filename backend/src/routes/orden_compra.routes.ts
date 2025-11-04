import { Router } from 'express';
import { getOrdenesCompra, getOrdenCompraById, updateOrdenCompra, deleteOrdenCompra } from '../controllers/orden_compra.controller';
import { crearOrdenCompra, crearDetalleOrdenCompra } from '../controllers/orden_compra_create.controller';
import { validate } from '../middlewares/validator.middleware';
import { authenticateToken } from '../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();

// Validación para query params (opcional, e.g., filtros)
const querySchema = z.object({
  estado: z.string().optional(),
});

router.get('/', validate(querySchema), getOrdenesCompra);
router.get('/:id', getOrdenCompraById);
router.post('/', authenticateToken, crearOrdenCompra);
router.put('/:id', authenticateToken, updateOrdenCompra);
router.delete('/:id', authenticateToken, deleteOrdenCompra);
router.post('/detalle', authenticateToken, crearDetalleOrdenCompra);

export default router;