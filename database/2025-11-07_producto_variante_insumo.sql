-- Adds optional insumo linkage to producto_variante so variants can reference an insumo
ALTER TABLE public.producto_variante
  ADD COLUMN IF NOT EXISTS id_insumo INTEGER REFERENCES public.insumo(id_insumo);

CREATE INDEX IF NOT EXISTS idx_producto_variante_id_insumo
  ON public.producto_variante (id_insumo);
