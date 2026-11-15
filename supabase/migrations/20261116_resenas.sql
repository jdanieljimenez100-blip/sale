-- Reseñas del comensal al mesero (una por cobro de consumo pagado).
-- RLS activo, sin policies: solo service_role.

CREATE TABLE IF NOT EXISTS public.resenas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cobro_id uuid NOT NULL UNIQUE REFERENCES public.cobros(id),
  mesero_id uuid NOT NULL REFERENCES public.meseros(id),
  cuenta_id uuid REFERENCES public.cuentas(id),
  estrellas smallint NOT NULL CHECK (estrellas >= 1 AND estrellas <= 5),
  comentario text NULL CHECK (
    comentario IS NULL OR char_length(comentario) <= 280
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resenas_mesero_created_idx
  ON public.resenas (mesero_id, created_at DESC);

ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;
