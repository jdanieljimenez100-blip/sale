-- pey por negocio: llaves cifradas, fuente demo vía entorno, RPCs con
-- p_negocio_id. Compatible con app desplegada (sale_insert_cobro y
-- sale_mark_cobro_pagado de 4 args se conservan; borrar en Fase 3c).

-- 1) Columnas pey en negocios
ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS pey_api_key_cifrada text,
  ADD COLUMN IF NOT EXISTS pey_webhook_secret_cifrado text,
  ADD COLUMN IF NOT EXISTS pey_api_key_ultimos4 text,
  ADD COLUMN IF NOT EXISTS pey_api_key_id text,
  ADD COLUMN IF NOT EXISTS pey_webhook_ultimo_at timestamptz,
  ADD COLUMN IF NOT EXISTS usa_pey_entorno boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pey_bank_account_codi_status text;

-- Solo el restaurante demo usa llaves de entorno por defecto.
UPDATE public.negocios
SET usa_pey_entorno = true
WHERE slug = 'demo';

-- 2) sale_crear_cobro: mismos 8 args de sale_insert_cobro + p_negocio_id
-- (borrar sale_insert_cobro en Fase 3c)
CREATE OR REPLACE FUNCTION public.sale_crear_cobro(
  p_cuenta_id uuid,
  p_mesero_id uuid,
  p_tipo public.tipo_cobro,
  p_monto_centavos integer,
  p_pey_qr_id text,
  p_qr_string text,
  p_concepto text,
  p_cobro_origen_id uuid,
  p_negocio_id uuid
)
RETURNS public.cobros
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  row public.cobros;
  v_cuenta_negocio uuid;
  v_mesero_negocio uuid;
  v_admin_acceso boolean := false;
BEGIN
  IF p_negocio_id IS NULL THEN
    RAISE EXCEPTION 'negocio_id requerido';
  END IF;

  IF p_monto_centavos IS NULL OR p_monto_centavos <= 0 THEN
    RAISE EXCEPTION 'monto inválido';
  END IF;

  IF p_cuenta_id IS NOT NULL THEN
    SELECT cu.negocio_id INTO v_cuenta_negocio
    FROM public.cuentas cu
    WHERE cu.id = p_cuenta_id;
    IF v_cuenta_negocio IS NULL THEN
      RAISE EXCEPTION 'cuenta no encontrada';
    END IF;
    IF v_cuenta_negocio <> p_negocio_id THEN
      RAISE EXCEPTION 'cuenta de otro negocio';
    END IF;
  END IF;

  IF p_mesero_id IS NOT NULL THEN
    SELECT m.negocio_id INTO v_mesero_negocio
    FROM public.meseros m
    WHERE m.id = p_mesero_id;
    IF v_mesero_negocio IS NULL THEN
      RAISE EXCEPTION 'mesero no encontrado';
    END IF;
    IF v_mesero_negocio <> p_negocio_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.negocio_accesos na
        WHERE na.mesero_id = p_mesero_id
          AND na.negocio_id = p_negocio_id
          AND na.rol = 'admin'
      ) INTO v_admin_acceso;
      IF NOT v_admin_acceso THEN
        RAISE EXCEPTION 'mesero sin acceso al negocio';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.cobros (
    cuenta_id, mesero_id, tipo, monto_centavos, estado,
    pey_qr_id, qr_string, concepto, cobro_origen_id, negocio_id
  ) VALUES (
    p_cuenta_id, p_mesero_id, p_tipo, p_monto_centavos, 'pendiente',
    p_pey_qr_id, p_qr_string, p_concepto, p_cobro_origen_id, p_negocio_id
  )
  RETURNING * INTO row;
  RETURN row;
END;
$function$;

REVOKE ALL ON FUNCTION public.sale_crear_cobro(
  uuid, uuid, public.tipo_cobro, integer, text, text, text, uuid, uuid
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_crear_cobro(
  uuid, uuid, public.tipo_cobro, integer, text, text, text, uuid, uuid
) TO service_role;

-- 3) Overload de sale_mark_cobro_pagado con p_negocio_id
-- (conserva la de 4 args para código desplegado)
CREATE OR REPLACE FUNCTION public.sale_mark_cobro_pagado(
  p_pey_qr_id text,
  p_event_id text,
  p_transaction_id text,
  p_pagado_at timestamp with time zone,
  p_negocio_id uuid
)
RETURNS TABLE(applied boolean, cobro_id uuid, cuenta_id uuid, tipo tipo_cobro)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.cobros;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.cobros
    WHERE webhook_event_id = p_event_id
      AND negocio_id = p_negocio_id
  ) THEN
    SELECT false, id, cobros.cuenta_id, cobros.tipo
      INTO applied, cobro_id, cuenta_id, tipo
    FROM public.cobros
    WHERE webhook_event_id = p_event_id
      AND negocio_id = p_negocio_id;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT * INTO c
  FROM public.cobros
  WHERE pey_qr_id = p_pey_qr_id
  FOR UPDATE;

  IF NOT FOUND OR c.negocio_id IS DISTINCT FROM p_negocio_id THEN
    applied := false;
    cobro_id := NULL;
    cuenta_id := NULL;
    tipo := NULL;
    RETURN NEXT;
    RETURN;
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
      AND negocio_id = p_negocio_id
    RETURNING * INTO c;

  IF NOT FOUND THEN
    applied := false;
    cobro_id := NULL;
    cuenta_id := NULL;
    tipo := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  applied := true;
  cobro_id := c.id;
  cuenta_id := c.cuenta_id;
  tipo := c.tipo;
  RETURN NEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.sale_mark_cobro_pagado(
  text, text, text, timestamptz, uuid
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_mark_cobro_pagado(
  text, text, text, timestamptz, uuid
) TO service_role;
