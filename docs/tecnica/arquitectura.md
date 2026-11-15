# Arquitectura — Sale

## Diagrama

```
Mesero / admin (navegador)
        │  cookie sale_sesion (HMAC)
        ▼
Next.js App Router  ──────────────────►  Vercel (hosting)
        │
        │  service_role (solo servidor)
        ▼
   Supabase Postgres
   · tablas + RLS (sin policies en tablas sensibles)
   · RPCs SECURITY DEFINER → solo service_role
        │
        │  crear cobro QR / consultar
        ▼
      pey API  ◄──────────────────────►  app del banco (cliente CoDi)
        │
        │  Standard Webhooks (firma)
        ▼
   POST /api/webhooks/pey
        │
        ▼
   sale_mark_cobro_pagado → sale_recalc_cuenta
   (si estado = pagada → INSERT tickets ON CONFLICT DO NOTHING)
```

## Flujo de cobro

1. El mesero (o admin de la mesa) llama a cobrar / dividir → el servidor
   crea un cobro vía cliente pey y persiste QR con RPC `sale_insert_cobro`.
2. El cliente escanea el QR CoDi y paga en su banco.
3. pey envía un webhook firmado (Standard Webhooks) a
   `/api/webhooks/pey`.
4. El servidor verifica la firma con `PEY_WEBHOOK_SECRET`.
5. Idempotencia: el event id se guarda; reenvíos no vuelven a marcar
   pagado.
6. `sale_mark_cobro_pagado` + `sale_recalc_cuenta` actualizan montos y
   estado de la cuenta. **Solo aquí** puede pasar a `pagada`.
7. Al quedar `pagada`, se inserta la fila en `tickets` (token aleatorio).

## Sesión y roles

- Login con PIN → cookie `sale_sesion` (payload: meseroId, rol, exp, `v`).
- Cada request protegida: `requireSesion` valida HMAC, lee mesero en DB
  (activo, rol real, `sesion_version`). Cookie que diga admin pero DB diga
  mesero → se trata como mesero.
- Cambio de PIN, rol o `activo` incrementa `sesion_version` → sesiones
  previas quedan inválidas.
- CSRF básico: mutaciones exigen Origin/Referer del mismo Host.

## Proveedores

| Servicio | Uso |
|---|---|
| Vercel | Hosting Next.js |
| Supabase | Postgres, Realtime (listas), service role |
| pey | Cobros CoDi, webhooks, cuentas bancarias |

Región de servidores: [REGIÓN DE SERVIDORES].
