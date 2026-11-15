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
| Día CDMX en reporte/propinas | OK |
| Audio en layout + router.push | OK |
| Repo público + Vercel | OK https://hackaton-five-red.vercel.app (mock) |
| Env en Vercel | OK (cuentas 200; webhook sin token → 401) |
| Reset seed Ana/Luis | OK (mesas en pendiente) |
| Guion mock en URL pública | OK Mesa 1 → cobrar → Simular → pagado |
| webhook sin token | OK → 401 |
| Pago real $0.01 | **Pendiente** (`PEY_MODE=real` + cuentas pey) |

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
   - Si `real`: `PEY_API_KEY`, `PEY_WEBHOOK_SECRET`, `PEY_BANK_ACCOUNT_RESTAURANTE`, `PEY_BANK_ACCOUNT_MESERO`
     (los `PEY_BANK_ACCOUNT_*` son el ID de pey de la cuenta, tipo ULID, con `codiStatus: ACTIVE`; no la CLABE)
   - `PEY_WEBHOOK_SECRET`: acepta con o sin prefijo `whsec_` (la app quita el prefijo si viene)
2. Con la service role ya puesta, aplica `supabase/migrations/20261114_lock_sale_rpcs.sql`
   (quita a `anon`/`authenticated` el permiso de ejecutar las RPCs `sale_*`).
3. En la app, guarda el token de demo en la barra superior.
4. En portal.mipey.mx, webhook: `https://<tu-app>/api/webhooks/pey`
5. Ensayo: Cobrar total → Dividir no debe dejar QR fantasma (quedan `expirado`).

## Guion (mock)

1. Abre `/cuentas` → ves 3 mesas.
2. Entra a Mesa 1 → Cobrar total → QR.
3. Toca la pantalla una vez (activa audio) → pulsa **Simular pago**.
4. Pantalla verde **Pagado** + beep.
5. Elige propina 10% → segundo QR → Simular pago.
6. `/propinas` muestra la propina.
7. Mesa 2 → Dividir en 2 → paga cada QR.
8. (Escena) Cobrar total y luego Dividir: el QR anterior queda expirado; avance solo cuenta activos.
9. `/cobro-rapido` con 1 centavo.
10. `/reporte` suma el día.
11. `curl` sin token a `/api/webhooks/pey` → error (no 200 applied).

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
