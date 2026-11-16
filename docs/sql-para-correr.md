# SQL que debes correr tú (en este orden)

No lo aplica el agente al remoto. SQL Editor de Supabase:

## 1) Reset + seed de demo (Ana, Luis, 3 mesas)

Copia y ejecuta todo el archivo:

`supabase/reset-demo.sql`

Deja:
- Ana `22222222-2222-2222-2222-222222222222` (mesas 1 y 2)
- Luis `22222222-2222-2222-2222-222222222223` sin cuenta pey (mesa 3)
- Mesa 1 = 1¢, Mesa 2 = 4¢ (4 partidas), Mesa 3 = 2¢
- Sin cobros ni reseñas; cuentas en `pendiente`

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

## 5) Tabla de reseñas

`supabase/migrations/20261116_resenas.sql`

Tabla `resenas` con RLS (sin policies). Una reseña por cobro de consumo.

## 6) Config de propinas del negocio

`supabase/migrations/20261116_negocio_propinas.sql`

Columnas `negocios.propina_porcentajes` y `negocios.reparto_cocina_pct`.

## 7) Índice único de propina solo activas

`supabase/migrations/20261116_propina_origen_uidx_activas.sql`

Recrea `cobros_propina_origen_uidx` para permitir regenerar el QR de propina
(`WHERE tipo = 'propina' AND estado <> 'expirado'`).
Si ya lo corriste en remoto, no lo vuelvas a ejecutar.

## 8) PIN / rol en meseros

`supabase/migrations/20261116_meseros_pin_sesion.sql`

## 9) Abrir / cerrar mesas + RPCs

`supabase/migrations/20261116_cuentas_abrir_cerrar.sql`

## 10) Bitácora

`supabase/migrations/20261116_bitacora.sql`

## 11) Versión de sesión revocable

`supabase/migrations/20261116_meseros_sesion_version.sql`

Columna `meseros.sesion_version` (int not null default 0). Se incrementa al
cambiar PIN, rol o activo; el token HMAC lleva `v` y debe coincidir.

## 12) Bloqueo atómico de PIN

`supabase/migrations/20261116_sale_pin_reservar_intento.sql`

RPC `sale_pin_reservar_intento(uuid)` → `'ok' | 'bloqueado'`. Solo
`service_role`. Se llama antes de verificar el PIN.

## 13) Menú + partidas con notas

`supabase/migrations/20261117_menu_items.sql`

- Tabla `menu_items` (RLS sin policies).
- Columnas `partidas.notas` y `partidas.menu_item_id`.
- Reemplaza `sale_agregar_partida` (args extra `p_notas`, `p_menu_item_id`;
  si hay menú, snapshot de nombre/precio del platillo activo).

Luego, si aún no tienes el menú demo, corre el bloque de `menu_items` en:

`supabase/seed.sql`

## 14) Tickets escaneables

`supabase/migrations/20261117_tickets.sql`

- Tabla `tickets` (cuenta_id PK, token único, folio identity; RLS sin policies).
- Actualiza `sale_recalc_cuenta` para insertar ticket al pasar a `pagada`
  (`ON CONFLICT DO NOTHING`).

## 15) Multi-negocio (aislamiento por restaurante)

`supabase/migrations/20261118_multi_negocio.sql`

Puede correrse **antes** del deploy de la app (la firma de `sale_insert_cobro`
no cambia; el RPC rellena `cobros.negocio_id` solo).

- `negocios.slug` UNIQUE NOT NULL (demo → `'demo'`); check `^[a-z0-9-]{3,40}$`.
- Tabla `negocio_accesos` (admin cruzado; RLS sin policies).
- `cobros.negocio_id` NOT NULL + índice `(negocio_id, estado, pagado_at)`.
- `bitacora.negocio_id` nullable.
- DROP policies `*_select_public` y `REVOKE SELECT` de anon/authenticated
  sobre cuentas, partidas, cobros, meseros, negocios.

## 16) pey por negocio (llaves cifradas + RPCs con negocio)

`supabase/migrations/20261119_pey_por_negocio.sql`

Puede correrse **antes** del deploy de la app (conserva `sale_insert_cobro`
y el `sale_mark_cobro_pagado` de 4 args; la app nueva usa los RPCs con
`p_negocio_id`).

- Columnas en `negocios`: `pey_api_key_cifrada`, `pey_webhook_secret_cifrado`,
  `pey_api_key_ultimos4`, `pey_api_key_id`, `pey_webhook_ultimo_at`,
  `usa_pey_entorno` (default false; `slug = 'demo'` → true),
  `pey_bank_account_codi_status`.
- RPC nueva `sale_crear_cobro(..., p_negocio_id)`: valida cuenta/mesero
  (o admin en `negocio_accesos`) e inserta con ese `negocio_id`.
  `sale_insert_cobro` se conservó temporalmente (drop en §17).
- Overload `sale_mark_cobro_pagado(..., p_negocio_id)`: solo marca si
  `cobros.negocio_id` coincide; si no, `applied=false` y `cobro_id` null.
- REVOKE PUBLIC/anon/authenticated; GRANT service_role en RPCs nuevas.

## 17) Drop RPCs legados de cobro (Fase 3c)

`supabase/migrations/20261120_drop_legacy_cobro_rpcs.sql`

Correr **después** de que la app desplegada ya use `sale_crear_cobro` y
`sale_mark_cobro_pagado` con `p_negocio_id` (migración 16 / pey por negocio).

- `DROP FUNCTION` `sale_insert_cobro` (8 args: cuenta, mesero, tipo, monto,
  pey ids, concepto, origen).
- `DROP FUNCTION` `sale_mark_cobro_pagado` (4 args: pey_qr, event, transaction,
  pagado_at) — se conserva el overload con `p_negocio_id`.

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

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cobros'
  AND column_name = 'cobro_origen_id';

SELECT relrowsecurity FROM pg_class
WHERE relname = 'resenas';

SELECT propina_porcentajes, reparto_cocina_pct
FROM public.negocios
WHERE id = '11111111-1111-1111-1111-111111111111';
```
