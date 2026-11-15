# Plan — Sale

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind + PWA.
- Supabase `hxtsiwhanupwhrzirozh`. Realtime en `cuentas`/`cobros`; UI también hace poll cada 2 s.
- zod en API. pey en `lib/pey/` (mock|real). Despliegue Vercel.

## Pey documentado

- Base `https://api.pey.mx`, Bearer API key.
- `POST /codi/qr` → `id` + `qrString`.
- Webhook `codi.qr.payment_received`, Standard Webhooks, idempotencia `webhook-id`.
- `amount` del webhook en MXN pesos; Sale guarda centavos y convierte en `lib/pey/`.

## Modelo

negocios, meseros, cuentas, partidas, cobros (`pey_qr_id` UNIQUE).

## Auth demo

Header `x-demo-token` = `DEMO_ACCESS_TOKEN` en rutas que mutan.
QR/Pagado son públicos por id.
