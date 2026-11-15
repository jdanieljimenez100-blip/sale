-- Expira cobros de consumo pendientes de una cuenta antes de crear otros.
-- Solo service_role. Los pagos tardíos de un cobro expirado igual se aplican
-- (sale_mark_cobro_pagado acepta pendiente o expirado).

CREATE OR REPLACE FUNCTION public.sale_expire_consumo_pendientes(p_cuenta_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  n integer;
BEGIN
  UPDATE public.cobros
    SET estado = 'expirado'
    WHERE cuenta_id = p_cuenta_id
      AND tipo = 'consumo'
      AND estado = 'pendiente';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sale_mark_cobro_pagado(
  p_pey_qr_id text,
  p_event_id text,
  p_transaction_id text,
  p_pagado_at timestamp with time zone
)
RETURNS TABLE(applied boolean, cobro_id uuid, cuenta_id uuid, tipo tipo_cobro)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.cobros;
BEGIN
  IF EXISTS (SELECT 1 FROM public.cobros WHERE webhook_event_id = p_event_id) THEN
    SELECT false, id, cobros.cuenta_id, cobros.tipo
      INTO applied, cobro_id, cuenta_id, tipo
    FROM public.cobros WHERE webhook_event_id = p_event_id;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT * INTO c FROM public.cobros WHERE pey_qr_id = p_pey_qr_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'cobro no encontrado';
  END IF;

  IF c.estado = 'pagado' THEN
    UPDATE public.cobros
      SET webhook_event_id = COALESCE(webhook_event_id, p_event_id)
      WHERE id = c.id AND webhook_event_id IS NULL;
    applied := false;
    cobro_id := c.id;
    cuenta_id := c.cuenta_id;
    tipo := c.tipo;
    RETURN NEXT;
    RETURN;
  END IF;

  -- pendiente o expirado (pago tardío): se aplica igual
  IF c.estado NOT IN ('pendiente', 'expirado') THEN
    applied := false;
    cobro_id := c.id;
    cuenta_id := c.cuenta_id;
    tipo := c.tipo;
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE public.cobros
    SET estado = 'pagado',
        pey_transaction_id = p_transaction_id,
        webhook_event_id = p_event_id,
        pagado_at = p_pagado_at
    WHERE id = c.id
      AND estado IN ('pendiente', 'expirado')
    RETURNING * INTO c;

  applied := true;
  cobro_id := c.id;
  cuenta_id := c.cuenta_id;
  tipo := c.tipo;
  RETURN NEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.sale_expire_consumo_pendientes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sale_expire_consumo_pendientes(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.sale_mark_cobro_pagado(text, text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sale_mark_cobro_pagado(text, text, text, timestamptz) TO service_role;
