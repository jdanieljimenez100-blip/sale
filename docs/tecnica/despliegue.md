# Despliegue

## Variables de entorno (solo nombres)

Nunca commits valores reales. Plantilla: `.env.example`.

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (cliente/navegador) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave anon (Realtime / lecturas permitidas) |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor: RPCs y escrituras (secreto) |
| `PEY_MODE` | `mock` \| `real` |
| `PEY_API_KEY` | API pey de entorno/demo (`usa_pey_entorno`) (secreto) |
| `PEY_WEBHOOK_SECRET` | Webhook de entorno/demo (secreto) |
| `PEY_BANK_ACCOUNT_RESTAURANTE` | ULID cuenta CoDi fallback de entorno (no es CLABE) |
| `PEY_SECRETS_KEY` | Base64 de 32 bytes; cifra API keys/secretos por restaurante en DB |
| `DEMO_ACCESS_TOKEN` | Solo setup primer admin y webhook mock interno (secreto) |
| `SESSION_SECRET` | Firma HMAC de `sale_sesion` (≥32 caracteres) |

En Vercel: definir secretos en el entorno correcto (Production / Preview).
`SESSION_SECRET` distinto por entorno si el repo es público.

## SQL

Aplica migraciones en el orden de
[`docs/sql-para-correr.md`](../sql-para-correr.md).

## Reset de demo

`supabase/reset-demo.sql` limpia cobros, tickets, partidas y cuentas de
demo y vuelve a sembrar mesas. **No** borra `menu_items`. Ejecutar solo
en proyectos de prueba.

## Rotación de secretos

1. Generar nuevo valor en el proveedor (pey / Supabase / Vercel).
2. Actualizar env en Vercel y redeploy.
3. Si rotas `SESSION_SECRET`: todas las sesiones quedan inválidas (esperado).
4. Si rotas `PEY_WEBHOOK_SECRET` (demo/entorno): coordina con el portal pey
   para no perder webhooks durante el cambio.
5. Rotación por restaurante: admin actualiza key/secreto en
   `PUT /api/negocio/pey` (Ajustes). Al cambiar la API key se limpia
   `pey_api_key_id` hasta el próximo webhook. Rotar también
   `PEY_SECRETS_KEY` implica re-cifrar todas las llaves guardadas.
6. Tras sospecha de fuga: además incrementa `sesion_version` de meseros
   afectados o desactívalos; revisa bitácora.
