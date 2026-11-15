-- Quita pey_bank_account_id de lo que anon/authenticated pueden leer
-- en meseros y negocios. El servidor sigue leyendo con service_role.
-- Realtime de cuentas/cobros no se toca.

REVOKE SELECT ON TABLE public.meseros FROM anon, authenticated;
GRANT SELECT (id, negocio_id, nombre, created_at) ON TABLE public.meseros TO anon, authenticated;

REVOKE SELECT ON TABLE public.negocios FROM anon, authenticated;
GRANT SELECT (id, nombre, created_at) ON TABLE public.negocios TO anon, authenticated;

-- Las policies SELECT existentes siguen aplicando a las columnas concedidas.
