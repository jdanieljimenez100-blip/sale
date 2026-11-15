-- Porcentajes sugeridos de propina y reparto informativo a cocina.

ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS propina_porcentajes smallint[] NOT NULL DEFAULT '{10,15,20}',
  ADD COLUMN IF NOT EXISTS reparto_cocina_pct smallint NOT NULL DEFAULT 0;

ALTER TABLE public.negocios
  DROP CONSTRAINT IF EXISTS negocios_propina_porcentajes_check;

ALTER TABLE public.negocios
  ADD CONSTRAINT negocios_propina_porcentajes_check CHECK (
    cardinality(propina_porcentajes) BETWEEN 1 AND 3
    AND propina_porcentajes[1] BETWEEN 1 AND 50
    AND (
      cardinality(propina_porcentajes) < 2
      OR propina_porcentajes[2] BETWEEN 1 AND 50
    )
    AND (
      cardinality(propina_porcentajes) < 3
      OR propina_porcentajes[3] BETWEEN 1 AND 50
    )
  );

ALTER TABLE public.negocios
  DROP CONSTRAINT IF EXISTS negocios_reparto_cocina_pct_check;

ALTER TABLE public.negocios
  ADD CONSTRAINT negocios_reparto_cocina_pct_check CHECK (
    reparto_cocina_pct BETWEEN 0 AND 50
  );
