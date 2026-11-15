-- Permite regenerar propina: el índice único solo aplica a propinas activas
-- (pendiente/pagado). Las expiradas no bloquean un nuevo cobro_origen_id.

DROP INDEX IF EXISTS public.cobros_propina_origen_uidx;

CREATE UNIQUE INDEX cobros_propina_origen_uidx
  ON public.cobros (cobro_origen_id)
  WHERE tipo = 'propina' AND estado <> 'expirado';
