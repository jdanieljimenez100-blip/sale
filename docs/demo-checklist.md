# Checklist de demo — Sale

## Estado (14–15 nov 2026)

| Ítem | Estado |
|------|--------|
| Mock E2E local (cobrar + Simular pago) | OK |
| numRef solo dígitos + webhook mock con `x-demo-token` | Committed |
| RPCs + seed en repo | Committed |
| Webhook endurecido (401/400/200/500 + monto) | Committed |
| Simular pago solo si `PEY_MODE=mock` | Committed |
| `/cobros/[id]/pagado` solo si `estado=pagado` | Committed |
| Beep con unlock en primer toque | Committed (probar iPhone) |
| Expirar consumo pendiente al cobrar/dividir | Migración aplicada en remoto |
| `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` | OK (JWT ~219) |
| Lock RPCs (`20261115_99_lock_sale_rpcs.sql`) | Aplicado: anon/authenticated sin EXECUTE |
| Smoke local post-lock (cobrar + Simular) | OK 14 nov 2026 |
| Seed Ana/Luis + `reset-demo.sql` | En repo — **tú corres** `docs/sql-para-correr.md` |
| ULID de Ana | Si es la primera vez, pon el ULID de Ana en `/equipo` (el reset no lo borra) |
| Día CDMX en reporte/propinas | OK |
| Audio en layout + router.push | OK |
| Repo público en GitHub | **PENDIENTE** (tú: crear repo público + push) |
| Vercel prod | Preview/deploy de prueba: https://hackaton-five-red.vercel.app — redeploy tras push |
| Env en Vercel | OK (cuentas 200; webhook sin token → 401) |
| Reset seed Ana/Luis | OK (mesas en pendiente) |
| Guion mock en URL pública | OK Mesa 1 → cobrar → Simular → pagado |
| webhook sin token | OK → 401 |
| Pago real $0.01 | OK cobro `b83d3d88…` Mesa 1 (webhook + tx) |
| Reenvío webhook → applied=false | Probar desde portal.mipey.mx (idempotencia DB OK) |

## Publicar (manual)

```bash
# 1) Repo público
git remote add origin https://github.com/<tu-usuario>/sale.git
git push -u origin master

# 2) Vercel
npx vercel login
npx vercel --prod
# En el dashboard agrega las env del .env.example
# DEMO_ACCESS_TOKEN de producción ≠ local
```

## Antes de salir a escena

1. Variables en Vercel (y local `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (**obligatoria**; solo servidor)
   - `DEMO_ACCESS_TOKEN` (en Vercel usa uno distinto al local: el repo es público)
   - `PEY_MODE=mock` para ensayo sin banco; `real` para $0.01
   - Si `real`: `PEY_API_KEY`, `PEY_WEBHOOK_SECRET`, `PEY_BANK_ACCOUNT_RESTAURANTE`
     (ULID de la cuenta CoDi ACTIVE del restaurante; no la CLABE)
   - El ULID de Ana (u otro mesero) se pone en **/equipo**, no en env.
     Ya no existe `PEY_BANK_ACCOUNT_MESERO`.
   - `PEY_WEBHOOK_SECRET`: acepta con o sin prefijo `whsec_` (la app quita el prefijo si viene)
2. Con la service role ya puesta, aplica `supabase/migrations/20261114_lock_sale_rpcs.sql`
   (quita a `anon`/`authenticated` el permiso de ejecutar las RPCs `sale_*`).
3. En la app, guarda el token de demo en la barra superior.
4. En portal.mipey.mx, webhook: `https://<tu-app>/api/webhooks/pey`
5. Ensayo: Cobrar total → Dividir no debe dejar QR fantasma (quedan `expirado`).

## Guion (mock) — ensayo

1. `/ajustes` → guarda token + elige **Atiende: Ana**.
2. Mesas → Mesa 1 Ana → Cobrar total → QR (sin barra de token).
3. Toca pantalla → **Simular pago** → Pagado + beep.
4. Propina 10% · $X → “Va directo a Ana” → Simular → ¡Gracias! → Mesas.
5. Atiende: Luis → Mesa 3 → Cobrar → propina → “Luis no tiene cuenta: va al restaurante”.
6. Mesa 2 → Dividir 4 → preview → crear QR → barra “N de 4 pagaron”.
7. Cobro rápido en pesos (0.01).
8. Reporte → desglose por mesero.
9. Webhook sin token → 401.

## Guion (real, $0.01)

1. Primero desplegar con `PEY_MODE=mock` y correr el guion en la URL pública.
2. Cambiar a `PEY_MODE=real` y cuentas CoDi activas en pey.
3. Cobrar total de una mesa (seed en 1 centavo = $0.01).
4. Paga con la app del banco.
5. Confirma webhook en log de Vercel (sin tocar el navegador).
6. Reenvía el mismo webhook desde portal → `applied: false`.

## Entrega hackatón

- Repo público
- URL en vivo
- Formulario: https://forms.gle/dfXTnL8ethxoGNk49
