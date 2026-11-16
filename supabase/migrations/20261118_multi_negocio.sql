-- Multi-negocio: slug, accesos admin cruzados, cobros.negocio_id,
-- cierra lecturas públicas. Compatible con app actual (sale_insert_cobro
-- conserva firma de 8 args y rellena negocio_id dentro del RPC).

-- 1) negocios.slug
ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.negocios
SET slug = 'demo'
WHERE id = '11111111-1111-1111-1111-111111111111'
  AND (slug IS NULL OR slug = '');

ALTER TABLE public.negocios
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.negocios
  DROP CONSTRAINT IF EXISTS negocios_slug_format;

ALTER TABLE public.negocios
  ADD CONSTRAINT negocios_slug_format
  CHECK (slug ~ '^[a-z0-9-]{3,40}$');

CREATE UNIQUE INDEX IF NOT EXISTS negocios_slug_uidx
  ON public.negocios (slug);

-- 2) negocio_accesos (solo service_role; RLS sin policies)
CREATE TABLE IF NOT EXISTS public.negocio_accesos (
  mesero_id uuid NOT NULL REFERENCES public.meseros(id) ON DELETE CASCADE,
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  rol text NOT NULL CHECK (rol IN ('admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (mesero_id, negocio_id)
);

ALTER TABLE public.negocio_accesos ENABLE ROW LEVEL SECURITY;

-- 3) cobros.negocio_id
ALTER TABLE public.cobros
  ADD COLUMN IF NOT EXISTS negocio_id uuid REFERENCES public.negocios(id);

UPDATE public.cobros c
SET negocio_id = cu.negocio_id
FROM public.cuentas cu
WHERE c.cuenta_id = cu.id
  AND c.negocio_id IS NULL;

UPDATE public.cobros c
SET negocio_id = m.negocio_id
FROM public.meseros m
WHERE c.mesero_id = m.id
  AND c.negocio_id IS NULL;

-- Cobros huérfanos sin cuenta ni mesero: asignar al demo si existe
UPDATE public.cobros
SET negocio_id = '11111111-1111-1111-1111-111111111111'
WHERE negocio_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.negocios n
    WHERE n.id = '11111111-1111-1111-1111-111111111111'
  );

ALTER TABLE public.cobros
  ALTER COLUMN negocio_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS cobros_negocio_estado_pagado_idx
  ON public.cobros (negocio_id, estado, pagado_at);

-- 4) sale_insert_cobro: misma firma; inserta negocio_id derivado
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
  v_negocio_id uuid;
BEGIN
  IF p_monto_centavos IS NULL OR p_monto_centavos <= 0 THEN
    RAISE EXCEPTION 'monto inválido';
  END IF;

  IF p_cuenta_id IS NOT NULL THEN
    SELECT cu.negocio_id INTO v_negocio_id
    FROM public.cuentas cu
    WHERE cu.id = p_cuenta_id;
  END IF;

  IF v_negocio_id IS NULL AND p_mesero_id IS NOT NULL THEN
    SELECT m.negocio_id INTO v_negocio_id
    FROM public.meseros m
    WHERE m.id = p_mesero_id;
  END IF;

  IF v_negocio_id IS NULL THEN
    RAISE EXCEPTION 'negocio_id no resoluble';
  END IF;

  INSERT INTO public.cobros (
    cuenta_id, mesero_id, tipo, monto_centavos, estado,
    pey_qr_id, qr_string, concepto, cobro_origen_id, negocio_id
  ) VALUES (
    p_cuenta_id, p_mesero_id, p_tipo, p_monto_centavos, 'pendiente',
    p_pey_qr_id, p_qr_string, p_concepto, p_cobro_origen_id, v_negocio_id
  )
  RETURNING * INTO row;
  RETURN row;
END;
$function$;

REVOKE ALL ON FUNCTION public.sale_insert_cobro(uuid, uuid, public.tipo_cobro, integer, text, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_insert_cobro(uuid, uuid, public.tipo_cobro, integer, text, text, text, uuid)
  TO service_role;

-- 5) bitacora.negocio_id nullable
ALTER TABLE public.bitacora
  ADD COLUMN IF NOT EXISTS negocio_id uuid REFERENCES public.negocios(id);

CREATE INDEX IF NOT EXISTS bitacora_negocio_created_idx
  ON public.bitacora (negocio_id, created_at DESC);

-- 6) Cerrar lecturas públicas
DROP POLICY IF EXISTS cuentas_select_public ON public.cuentas;
DROP POLICY IF EXISTS partidas_select_public ON public.partidas;
DROP POLICY IF EXISTS cobros_select_public ON public.cobros;
DROP POLICY IF EXISTS meseros_select_public ON public.meseros;
DROP POLICY IF EXISTS negocios_select_public ON public.negocios;

REVOKE SELECT ON TABLE public.cuentas FROM anon, authenticated;
REVOKE SELECT ON TABLE public.partidas FROM anon, authenticated;
REVOKE SELECT ON TABLE public.cobros FROM anon, authenticated;
REVOKE SELECT ON TABLE public.meseros FROM anon, authenticated;
REVOKE SELECT ON TABLE public.negocios FROM anon, authenticated;
