-- Mesas abiertas: cerrada_at NULL. Una mesa abierta por número de mesa.
-- RPCs solo service_role.

ALTER TABLE public.cuentas
  ADD COLUMN IF NOT EXISTS cerrada_at timestamptz NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cuentas_mesa_abierta_uidx
  ON public.cuentas (negocio_id, mesa)
  WHERE cerrada_at IS NULL;

CREATE OR REPLACE FUNCTION public.sale_recalc_cuenta(p_cuenta_id uuid)
RETURNS public.cuentas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  row public.cuentas;
  total integer;
  pagado integer;
  nuevo public.estado_cuenta;
BEGIN
  SELECT COALESCE(SUM(cantidad * precio_centavos), 0)::integer
    INTO total
  FROM public.partidas
  WHERE cuenta_id = p_cuenta_id;

  SELECT COALESCE(SUM(monto_centavos), 0)::integer
    INTO pagado
  FROM public.cobros
  WHERE cuenta_id = p_cuenta_id
    AND tipo = 'consumo'
    AND estado = 'pagado';

  IF pagado <= 0 THEN
    nuevo := 'pendiente';
  ELSIF pagado >= total AND total > 0 THEN
    nuevo := 'pagada';
  ELSE
    nuevo := 'parcial';
  END IF;

  UPDATE public.cuentas
  SET total_centavos = total, estado = nuevo
  WHERE id = p_cuenta_id
  RETURNING * INTO row;

  RETURN row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sale_abrir_cuenta(
  p_negocio_id uuid,
  p_mesero_id uuid,
  p_mesa text
)
RETURNS public.cuentas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  row public.cuentas;
BEGIN
  IF p_mesa IS NULL OR p_mesa !~ '^[1-9][0-9]{0,2}$' OR p_mesa::integer > 999 THEN
    RAISE EXCEPTION 'mesa inválida';
  END IF;
  INSERT INTO public.cuentas (negocio_id, mesero_id, mesa, estado, total_centavos)
  VALUES (p_negocio_id, p_mesero_id, p_mesa, 'pendiente', 0)
  RETURNING * INTO row;
  RETURN row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sale_agregar_partida(
  p_cuenta_id uuid,
  p_descripcion text,
  p_cantidad integer,
  p_precio_centavos integer
)
RETURNS public.cuentas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.cuentas;
BEGIN
  SELECT * INTO c FROM public.cuentas WHERE id = p_cuenta_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'cuenta no encontrada';
  END IF;
  IF c.cerrada_at IS NOT NULL THEN
    RAISE EXCEPTION 'mesa cerrada';
  END IF;
  IF c.estado = 'pagada' THEN
    RAISE EXCEPTION 'mesa pagada';
  END IF;
  IF p_descripcion IS NULL OR char_length(trim(p_descripcion)) < 1
     OR char_length(trim(p_descripcion)) > 80 THEN
    RAISE EXCEPTION 'descripción inválida';
  END IF;
  IF p_cantidad IS NULL OR p_cantidad < 1 OR p_cantidad > 99 THEN
    RAISE EXCEPTION 'cantidad inválida';
  END IF;
  IF p_precio_centavos IS NULL OR p_precio_centavos < 0 THEN
    RAISE EXCEPTION 'precio inválido';
  END IF;

  UPDATE public.cobros
  SET estado = 'expirado'
  WHERE cuenta_id = p_cuenta_id
    AND tipo = 'consumo'
    AND estado = 'pendiente';

  INSERT INTO public.partidas (cuenta_id, descripcion, cantidad, precio_centavos)
  VALUES (p_cuenta_id, trim(p_descripcion), p_cantidad, p_precio_centavos);

  RETURN public.sale_recalc_cuenta(p_cuenta_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.sale_quitar_partida(
  p_partida_id uuid
)
RETURNS public.cuentas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  p public.partidas;
  c public.cuentas;
  hay_consumo boolean;
BEGIN
  SELECT * INTO p FROM public.partidas WHERE id = p_partida_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'partida no encontrada';
  END IF;
  SELECT * INTO c FROM public.cuentas WHERE id = p.cuenta_id FOR UPDATE;
  IF c.cerrada_at IS NOT NULL THEN
    RAISE EXCEPTION 'mesa cerrada';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.cobros
    WHERE cuenta_id = c.id
      AND tipo = 'consumo'
      AND estado IN ('pendiente', 'pagado')
  ) INTO hay_consumo;
  IF hay_consumo THEN
    RAISE EXCEPTION 'ya hay cobros de consumo';
  END IF;
  DELETE FROM public.partidas WHERE id = p_partida_id;
  RETURN public.sale_recalc_cuenta(c.id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.sale_cerrar_cuenta(
  p_cuenta_id uuid
)
RETURNS public.cuentas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.cuentas;
BEGIN
  SELECT * INTO c FROM public.cuentas WHERE id = p_cuenta_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'cuenta no encontrada';
  END IF;
  IF c.estado <> 'pagada' THEN
    RAISE EXCEPTION 'solo se cierra una mesa pagada';
  END IF;
  IF c.cerrada_at IS NOT NULL THEN
    RETURN c;
  END IF;
  UPDATE public.cuentas
  SET cerrada_at = now()
  WHERE id = p_cuenta_id
  RETURNING * INTO c;
  RETURN c;
END;
$function$;

REVOKE ALL ON FUNCTION public.sale_recalc_cuenta(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_recalc_cuenta(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.sale_abrir_cuenta(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_abrir_cuenta(uuid, uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.sale_agregar_partida(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_agregar_partida(uuid, text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.sale_quitar_partida(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_quitar_partida(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.sale_cerrar_cuenta(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_cerrar_cuenta(uuid) TO service_role;
