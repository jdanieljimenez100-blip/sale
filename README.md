# Sale

Punto de venta web para restaurantes en México. Cobra con CoDi vía [pey](https://docs.pey.mx) (QR); el estado **pagado** solo cambia en el servidor con un webhook válido.

**Demo en vivo:** https://hackaton-five-red.vercel.app

### Credenciales de demo (hackatón)

| Quién | Rol | PIN |
|---|---|---|
| Ana | mesero | `1245` |
| Luis | mesero | `1245` |
| Jorge | admin | `258963` |

Entrar en `/entrar` → elegir nombre → PIN.  
Setup (solo si aún no hay admin): `/setup` con token `sale-demo-2026`.

## Funcionalidades

- PIN por mesero y roles **mesero** / **admin**
- Mesas con menú y notas
- Cobro CoDi vía pey (QR + Standard Webhooks firmados)
- División de cuenta y propina a la cuenta pey del mesero
- Reseñas y reporte de desempeño
- Ticket escaneable y bitácora de auditoría

## Seguridad

- **Pagado** solo con webhook auténtico de pey
- Idempotencia por id de evento
- Montos en centavos enteros (sin flotantes)
- Secretos solo en el servidor (nunca `NEXT_PUBLIC_`)
- RPCs con `service_role`; RLS en tablas
- Sesión HMAC revocable y bloqueo atómico de PIN

## Arquitectura

```
Next.js (Vercel)
    │
    ▼
Supabase (RPCs + RLS)  ←→  pey API
                              │
pey webhook ───────────────►  /api/webhooks/pey
```

## Arranque local

1. Copia `.env.example` → `.env.local` y completa las variables (sin valores reales en el repo).
2. Aplica el SQL en el orden de [`docs/sql-para-correr.md`](docs/sql-para-correr.md).
3. Arranca y verifica:

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # lint + typecheck + test
```

## Documentación

- [Aviso de privacidad](/privacidad) (página pública) · [texto integral](docs/legal/aviso-privacidad.md)
- [Inventario de datos y ARCO](docs/legal/datos-personales.md)
- Técnica: [arquitectura](docs/tecnica/arquitectura.md) · [modelo de datos](docs/tecnica/modelo-datos.md) · [API](docs/tecnica/api.md) · [despliegue](docs/tecnica/despliegue.md)
- [Manual de usuario](docs/manual-usuario.md)
- [Orden de SQL](docs/sql-para-correr.md)

## Próximamente

- Reportes PDF / Excel
- Agente de IA para el dueño (consultas de ventas, alertas, resumen por WhatsApp, cierre de caja)
- Pantalla de cocina
- CFDI e inventario
- App nativa
