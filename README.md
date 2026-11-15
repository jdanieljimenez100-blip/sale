# Sale

Punto de venta web para restaurantes en México. Cobra con CoDi vía [pey](https://docs.pey.mx). El estado **pagado** solo cambia en el servidor cuando llega un webhook auténtico.

## Stack

Next.js (App Router), TypeScript, Tailwind, Supabase, zod, PWA, Vercel.

## Arranque local

```bash
cp .env.example .env.local
# Completa SUPABASE_SERVICE_ROLE_KEY y DEMO_ACCESS_TOKEN
npm install
npm run dev
```

Abre http://localhost:3000/cuentas y guarda el token de demo en la barra.

## Scripts

```bash
npm run check   # lint + typecheck + test
npm run build
```

## Demo mock

1. Cobrar una mesa.
2. En la pantalla del QR, **Simular pago**.
3. Ver **Pagado** y opcionalmente crear propina.

## Seguridad

- Secretos solo en variables de servidor (nunca `NEXT_PUBLIC_` para llaves).
- `.env` y `.cursor/mcp.json` están en `.gitignore`.
- Logs de webhook: id, monto en centavos, resultado. Sin CLABE ni cuerpo crudo.
