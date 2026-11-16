-- Fase 3c: elimina RPCs legados sin p_negocio_id.
-- App usa sale_crear_cobro y sale_mark_cobro_pagado(..., p_negocio_id).

DROP FUNCTION IF EXISTS public.sale_insert_cobro(
  uuid,
  uuid,
  public.tipo_cobro,
  integer,
  text,
  text,
  text,
  uuid
);

DROP FUNCTION IF EXISTS public.sale_mark_cobro_pagado(
  text,
  text,
  text,
  timestamptz
);
