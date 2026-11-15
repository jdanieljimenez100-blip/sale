-- Bitácora de acciones sensibles. Solo service_role.

CREATE TABLE IF NOT EXISTS public.bitacora (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesero_id uuid REFERENCES public.meseros(id),
  accion text NOT NULL,
  detalle jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bitacora_created_idx
  ON public.bitacora (created_at DESC);

ALTER TABLE public.bitacora ENABLE ROW LEVEL SECURITY;
