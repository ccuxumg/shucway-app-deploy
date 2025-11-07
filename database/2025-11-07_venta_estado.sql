-- Adds estado tracking to ventas to align with backend expectations
ALTER TABLE public.venta
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente';

ALTER TABLE public.venta
  ADD CONSTRAINT chk_venta_estado
    CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada'));

UPDATE public.venta
   SET estado = COALESCE(estado, 'pendiente');
