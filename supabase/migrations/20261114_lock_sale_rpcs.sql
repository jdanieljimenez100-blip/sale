-- Cierra las RPCs sale_* (SECURITY DEFINER) para que solo el servidor las use.
--
-- Por qué: la anon key es pública (NEXT_PUBLIC_*). Si anon puede ejecutar
-- sale_mark_cobro_pagado, cualquiera puede marcar un cobro como pagado
-- directo contra Supabase, sin pasar por el webhook de pey.
--
-- Requisito: SUPABASE_SERVICE_ROLE_KEY configurada en .env.local y en Vercel
-- ANTES de aplicar esto; si no, la app ya no podrá escribir.
--
-- Usa las firmas reales de pg_proc, así no depende de los tipos exactos
-- de cada argumento.

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'sale_insert_cobro',
        'sale_mark_cobro_pagado',
        'sale_set_cuenta_estado'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END
$$;

-- Verificación (debe regresar solo service_role, postgres y similares; nunca anon):
-- SELECT p.proname, r.rolname
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- CROSS JOIN pg_roles r
-- WHERE n.nspname = 'public'
--   AND p.proname LIKE 'sale\_%'
--   AND has_function_privilege(r.oid, p.oid, 'EXECUTE')
--   AND r.rolname IN ('anon', 'authenticated', 'service_role');

-- TODO: copiar al repo la definición de las RPCs y el seed, que hoy solo
-- existen en el proyecto remoto. Para obtenerlas:
-- SELECT pg_get_functiondef(p.oid)
-- FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname LIKE 'sale\_%';
