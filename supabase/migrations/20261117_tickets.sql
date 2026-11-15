-- Ticket escaneable: token opaco, solo tras cuenta pagada.
-- RLS activo, sin policies: solo service_role.
-- El token NO vive en cuentas (cuentas tiene SELECT público).

CREATE TABLE IF NOT EXISTS public.tickets (
  cuenta_id uuid PRIMARY KEY REFERENCES public.cuentas(id) ON DELETE CASCADE,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  folio integer GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tickets_token_uidx ON public.tickets (token);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

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

  IF nuevo = 'pagada' THEN
    INSERT INTO public.tickets (cuenta_id)
    VALUES (p_cuenta_id)
    ON CONFLICT (cuenta_id) DO NOTHING;
  END IF;

  RETURN row;
END;
$function$;

REVOKE ALL ON FUNCTION public.sale_recalc_cuenta(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_recalc_cuenta(uuid) TO service_role;
