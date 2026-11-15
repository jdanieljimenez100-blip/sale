# Checklist de demo — Sale

## Publicar (manual — falta login local)

```bash
# 1) Repo público
# Instala gh o crea el repo en GitHub y:
git remote add origin https://github.com/<tu-usuario>/sale.git
git push -u origin master

# 2) Vercel
npx vercel login
npx vercel --prod
# En el dashboard de Vercel agrega las env del .env.example
```

## Antes de salir a escena

1. Variables en Vercel (y local `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (opcional; hay RPCs `sale_*` si falta)
   - `DEMO_ACCESS_TOKEN` (local demo: `sale-demo-2026`)
   - `PEY_MODE=mock` para ensayo sin banco; `real` para $0.01
   - Si `real`: `PEY_API_KEY`, `PEY_WEBHOOK_SECRET`, `PEY_BANK_ACCOUNT_RESTAURANTE`, `PEY_BANK_ACCOUNT_MESERO`
2. En la app, guarda el token de demo en la barra superior.
3. En portal.pey.mx, webhook: `https://<tu-app>/api/webhooks/pey`

## Ensayo local verificado

`npm run dev` + cobrar Mesa 1 + Simular pago → cuenta `pagada`. OK el 14 nov 2026.

## Guion (mock)

1. Abre `/cuentas` → ves 3 mesas.
2. Entra a Mesa 1 → Cobrar total → QR.
3. Pulsa **Simular pago**.
4. Pantalla verde **Pagado** + sonido.
5. Elige propina 10% → segundo QR → Simular pago.
6. `/propinas` muestra la propina.
7. Mesa 2 → Dividir en 2 → paga cada QR.
8. `/cobro-rapido` con 1 centavo.
9. `/reporte` suma el día.

## Guion (real, $0.01)

1. `PEY_MODE=real` y cuentas CoDi activas en pey.
2. Cobrar total de una mesa (seed está en 1 centavo = $0.01).
3. Paga con la app del banco.
4. Confirma que el webhook marcó pagado (sin tocar el navegador).
5. Reenvía el mismo webhook desde pey logs → un solo pago (idempotencia).

## Entrega hackatón

- Repo público
- URL en vivo
- Formulario: https://forms.gle/dfXTnL8ethxoGNk49
