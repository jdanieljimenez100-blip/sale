# SQL que debes correr tú (en este orden)

No lo aplica el agente al remoto. SQL Editor de Supabase:

## 1) Reset + seed de demo (Ana, Luis, 3 mesas)

Copia y ejecuta todo el archivo:

`supabase/reset-demo.sql`

Deja:
- Ana `22222222-2222-2222-2222-222222222222` (mesas 1 y 2)
- Luis `22222222-2222-2222-2222-222222222223` sin cuenta pey (mesa 3)
- Mesa 1 = 1¢, Mesa 2 = 4¢ (4 partidas), Mesa 3 = 2¢
- Sin cobros; cuentas en `pendiente`

## 2) Permisos de RPCs (si aún no corriste el lock con anon/authenticated)

Si las RPCs ya están bloqueadas a `service_role`, puedes saltarte esto.
Si no, corre el cuerpo de:

`supabase/migrations/20261115_99_lock_sale_rpcs.sql`

## 3) Ocultar `pey_bank_account_id` a anon

Corre todo:

`supabase/migrations/20261115_hide_pey_bank_account_columns.sql`

Verifica que Realtime de mesas siga vivo en `/cuentas`.

## 4) Propina ligada al pago de consumo

`supabase/migrations/20261116_cobro_origen_propina.sql`

Agrega `cobros.cobro_origen_id` + índice único parcial y actualiza `sale_insert_cobro`.

## Verificación

```sql
SELECT p.proname, r.rolname,
       has_function_privilege(r.oid, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
  AND p.proname LIKE 'sale\_%'
  AND r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY 1, 2;
```

`anon` y `authenticated` deben salir `can_execute = false`.
