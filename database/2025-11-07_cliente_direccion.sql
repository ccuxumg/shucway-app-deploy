-- Adds optional direccion/NIT field expected by the backend when administrating clientes
ALTER TABLE public.cliente
  ADD COLUMN IF NOT EXISTS direccion VARCHAR(150);

UPDATE public.cliente
   SET direccion = COALESCE(direccion, 'CF');
