-- Realigns the detalle_venta sequence with the current maximum id_detalle to avoid duplicate key errors
SELECT setval(
  'detalle_venta_id_detalle_seq',
  COALESCE((SELECT MAX(id_detalle) FROM public.detalle_venta), 0) + 1,
  false
);
