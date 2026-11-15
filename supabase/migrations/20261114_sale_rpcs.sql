-- Definiciones de las RPCs sale_* (extraídas del proyecto remoto con pg_get_functiondef).
-- Permisos: solo service_role (alineado con 20261115_99_lock_sale_rpcs.sql).

CREATE OR REPLACE FUNCTION public.sale_insert_cobro(
  p_cuenta_id uuid,
  p_mesero_id uuid,
  p_tipo tipo_cobro,
  p_monto_centavos integer,
  p_pey_qr_id text,
  p_qr_string text,
  p_concepto text
)
RETURNS cobros
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  row public.cobros;
BEGIN
  IF p_monto_centavos IS NULL OR p_monto_centavos <= 0 THEN
    RAISE EXCEPTION 'monto inválido';
  END IF;
  INSERT INTO public.cobros (
    cuenta_id, mesero_id, tipo, monto_centavos, estado, pey_qr_id, qr_string, concepto
  ) VALUES (
    p_cuenta_id, p_mesero_id, p_tipo, p_monto_centavos, 'pendiente', p_pey_qr_id, p_qr_string, p_concepto
  )
  RETURNING * INTO row;
  RETURN row;
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
    -- Comportamiento actual remoto: lanza. La ruta HTTP debe atraparlo y
    -- responder 200 applied=false para que pey no reintente. Ver P0.2c.
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

  UPDATE public.cobros
    SET estado = 'pagado',
        pey_transaction_id = p_transaction_id,
        webhook_event_id = p_event_id,
        pagado_at = p_pagado_at
    WHERE id = c.id AND estado = 'pendiente'
    RETURNING * INTO c;

  applied := true;
  cobro_id := c.id;
  cuenta_id := c.cuenta_id;
  tipo := c.tipo;
  RETURN NEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sale_set_cuenta_estado(
  p_cuenta_id uuid,
  p_estado estado_cuenta
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.cuentas SET estado = p_estado WHERE id = p_cuenta_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.sale_insert_cobro(uuid, uuid, public.tipo_cobro, integer, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sale_mark_cobro_pagado(text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sale_set_cuenta_estado(uuid, public.estado_cuenta) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.sale_insert_cobro(uuid, uuid, public.tipo_cobro, integer, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.sale_mark_cobro_pagado(text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.sale_set_cuenta_estado(uuid, public.estado_cuenta) TO service_role;
