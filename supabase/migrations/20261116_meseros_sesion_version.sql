-- Versión de sesión: se incrementa al cambiar PIN, rol o activo.

ALTER TABLE public.meseros
  ADD COLUMN IF NOT EXISTS sesion_version integer NOT NULL DEFAULT 0;

REVOKE SELECT (sesion_version) ON TABLE public.meseros FROM anon, authenticated;
