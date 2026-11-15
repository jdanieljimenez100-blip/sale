# Sale

Punto de venta web para restaurantes en México. Cobra con CoDi vía pey
(QR) y el estado "pagado" cambia solo en el servidor, con un webhook válido.

## Stack

Next.js (App Router), TypeScript, Tailwind, Supabase, zod, PWA, Vercel.
Dinero en centavos (enteros). Solo web responsive. Móvil nativo: etapa futura.

## Comandos

```bash
npm run dev        # Next.js local
npm run build      # producción
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit, strict
npm run test       # node --test
npm run check      # lint + typecheck + test
```

Si un comando falla, dilo. No lo sustituyas sin avisar.

## Dónde está cada cosa

- `app/` pantallas. Server Components por defecto.
- `components/` UI reutilizable, sin lógica de negocio.
- `app/api/` rutas HTTP y webhook de pey.
- `lib/` reglas de negocio y el único cliente pey.
- `services/` acceso a datos.
- `docs/specs/` spec, plan y tareas (Fase 5).
- `.cursor/rules/` reglas del agente.
- `.agents/skills/` skills de UI, Next.js, Supabase y pruebas.

## Límites

No inventes endpoints ni campos de pey. Secretos solo en entorno del servidor.
`.cursor/mcp.json` es local. La plantilla sin secretos es `.cursor/mcp.json.example`.
No instales paquetes ni skills sin aprobación.
