-- PIN, rol y bloqueo en meseros.
-- No se concede SELECT de columnas nuevas a anon/authenticated
-- (el grant por columna actual solo cubre id, negocio_id, nombre, created_at).

ALTER TABLE public.meseros
  ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'mesero',
  ADD COLUMN IF NOT EXISTS pin_hash text NULL,
  ADD COLUMN IF NOT EXISTS pin_intentos_fallidos smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_bloqueado_hasta timestamptz NULL,
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

ALTER TABLE public.meseros
  DROP CONSTRAINT IF EXISTS meseros_rol_check;

ALTER TABLE public.meseros
  ADD CONSTRAINT meseros_rol_check CHECK (rol IN ('mesero', 'admin'));

-- Defensa: columnas sensibles sin grant a anon/authenticated.
REVOKE SELECT (
  rol, pin_hash, pin_intentos_fallidos, pin_bloqueado_hasta, activo,
  pey_bank_account_id
) ON TABLE public.meseros FROM anon, authenticated;
