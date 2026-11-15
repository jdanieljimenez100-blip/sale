-- Una propina máxima por pago de consumo (cobro_origen_id).
-- Actualiza sale_insert_cobro para aceptar el origen.

ALTER TABLE public.cobros
  ADD COLUMN IF NOT EXISTS cobro_origen_id uuid REFERENCES public.cobros(id);

CREATE UNIQUE INDEX IF NOT EXISTS cobros_propina_origen_uidx
  ON public.cobros (cobro_origen_id)
  WHERE tipo = 'propina';

DROP FUNCTION IF EXISTS public.sale_insert_cobro(uuid, uuid, public.tipo_cobro, integer, text, text, text);

CREATE OR REPLACE FUNCTION public.sale_insert_cobro(
  p_cuenta_id uuid,
  p_mesero_id uuid,
  p_tipo public.tipo_cobro,
  p_monto_centavos integer,
  p_pey_qr_id text,
  p_qr_string text,
  p_concepto text,
  p_cobro_origen_id uuid DEFAULT NULL
)
RETURNS public.cobros
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
    cuenta_id, mesero_id, tipo, monto_centavos, estado,
    pey_qr_id, qr_string, concepto, cobro_origen_id
  ) VALUES (
    p_cuenta_id, p_mesero_id, p_tipo, p_monto_centavos, 'pendiente',
    p_pey_qr_id, p_qr_string, p_concepto, p_cobro_origen_id
  )
  RETURNING * INTO row;
  RETURN row;
END;
$function$;

REVOKE ALL ON FUNCTION public.sale_insert_cobro(uuid, uuid, public.tipo_cobro, integer, text, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_insert_cobro(uuid, uuid, public.tipo_cobro, integer, text, text, text, uuid)
  TO service_role;
