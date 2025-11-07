-- Realigns the venta sequence with the current maximum id_venta to avoid duplicate key errors
SELECT setval(
  'venta_id_venta_seq',
  COALESCE((SELECT MAX(id_venta) FROM public.venta), 0) + 1,
  false
);
