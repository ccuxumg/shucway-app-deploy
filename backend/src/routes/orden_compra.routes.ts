import { Router } from 'express';
import { getOrdenesCompra } from '../controllers/orden_compra.controller';
import { validate } from '../middlewares/validator.middleware';
import { z } from 'zod';

const router = Router();

// Validación para query params (opcional, e.g., filtros)
const querySchema = z.object({
  estado: z.string().optional(),
});

router.get('/', validate(querySchema), getOrdenesCompra);

export default router;