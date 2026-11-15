-- Reserva atómica un intento de PIN (contador + bloqueo 5 min a los 5 fallos).
-- Solo service_role; no se concede a anon/authenticated.

CREATE OR REPLACE FUNCTION public.sale_pin_reservar_intento(p_mesero_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_out text;
BEGIN
  WITH prev AS (
    SELECT
      id,
      pin_intentos_fallidos,
      pin_bloqueado_hasta
    FROM public.meseros
    WHERE id = p_mesero_id
    FOR UPDATE
  ),
  upd AS (
    UPDATE public.meseros AS m
    SET
      pin_intentos_fallidos = CASE
        WHEN p.pin_bloqueado_hasta IS NOT NULL AND p.pin_bloqueado_hasta > now()
          THEN p.pin_intentos_fallidos
        WHEN p.pin_intentos_fallidos + 1 >= 5 THEN 0
        ELSE p.pin_intentos_fallidos + 1
      END,
      pin_bloqueado_hasta = CASE
        WHEN p.pin_bloqueado_hasta IS NOT NULL AND p.pin_bloqueado_hasta > now()
          THEN p.pin_bloqueado_hasta
        WHEN p.pin_intentos_fallidos + 1 >= 5 THEN now() + interval '5 minutes'
        ELSE p.pin_bloqueado_hasta
      END
    FROM prev AS p
    WHERE m.id = p.id
    RETURNING
      CASE
        WHEN p.pin_bloqueado_hasta IS NOT NULL AND p.pin_bloqueado_hasta > now()
          THEN 'bloqueado'
        ELSE 'ok'
      END AS resultado
  )
  SELECT resultado INTO v_out FROM upd;

  IF v_out IS NULL THEN
    RETURN 'bloqueado';
  END IF;
  RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.sale_pin_reservar_intento(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_pin_reservar_intento(uuid) TO service_role;
