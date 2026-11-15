# Plan de UI — Sale

Quién lo usa: un mesero con una mano ocupada, en servicio, con prisa.
Qué tiene que pasar: ver qué mesa debe dinero, cobrar y confirmar el pago
en el menor número de toques. "Premium" aquí es legibilidad y respuesta
inmediata, no adorno.

Fuente de verdad del look. Cursor ejecuta **una fase por vez** (prompts de
la sección 5). Espera "OK" antes de la siguiente. Cada fase pasa
`npm run check`. Regla corta: `.cursor/rules/06-ui-sistema.mdc`.

---

## 1. Qué está mal hoy

| Problema | Dónde | Por qué importa en servicio |
|---|---|---|
| El verde es a la vez marca y "pagada" | `bg-emerald-800` en botones, tabs, nav; chip pagada verde | El estado deja de significar algo. Verde por todos lados = no se ve "pagó". |
| Acción principal al fondo del scroll | `CuentaDetalle`: "Cobrar total" debajo de partidas e historial | Con 8 partidas, cobrar exige scroll. Debe estar fija al pulgar. |
| Nav de admin en dos filas | `NavInferior`: 6 items en `grid-cols-3` | ~120 px de chrome; toques fallan en el bolsillo. |
| Abrir mesa empuja la lista | `AbrirMesa` se expande inline arriba | La lista salta; el teclado tapa el formulario. |
| Lista de una columna, tarjeta grande | `MesaCard` en `CuentasLista` | Con 10 mesas hay que scrollear para ver el salón. |
| `window.confirm` para quitar partida | `CuentaDetalle.quitar` | Diálogo del sistema, lento y feo en móvil. |
| Tokens definidos, clases sueltas | `globals.css` tiene `--acento`; componentes usan `emerald-*` y `bg-[#f3efe6]` | Cambiar el look toca 20 archivos. |
| Fondo crema + degradado + Segoe UI | `body` en `globals.css` | Look genérico (tell AI). Segoe no existe en Android → Roboto. |
| Eyebrow "SALE" en mayúsculas | `cuentas`, `equipo`, `ajustes`, `entrar`, `CobroPantalla`, `PagadoPantalla` | Tracking + ALL CAPS = plantilla, no producto. |
| Cargas como texto plano | "Cargando mesas…" | Parpadeo y salto de layout. |
| Montos sin cifras tabulares | Todo `formatearMxn` | Los números bailan con el poll de 2 s. |
| Texto de sonido en el QR | `CobroPantalla`: "Toca la pantalla…" | Compite con el QR que el cliente debe escanear. |

---

## 2. Qué tomamos (y qué no)

**Sí**
- Chip de estado legible; acciones al pulgar; "Mis mesas / Todas" como tabs.
- Menos tarjetas con sombra; más densidad.
- Animación solo para confirmar acción: hoja Abrir mesa, QR, cambio a pagada.
- `prefers-reduced-motion`. Solo `transform` / `opacity` / color.
- Tipografía propia (no Inter, no Segoe).
- Auditoría final con `.agents/skills/web-design-guidelines`.

**No (por ahora)**
- Instalar `motion`, shadcn, Radix, Basil, Magic UI, Animate UI. Las 4
  animaciones salen con CSS (`@starting-style`, `transition`, `<dialog>`).
  Si hace falta layout animation después, se pide aprobación con caso concreto.
- Copiar layouts de repos o templates. Solo densidad y jerarquía.
- Animar el filtro de la lista: el poll de 2 s re-renderiza y se siente nervioso.
- Dark mode en la demo. Tokens lo permiten después. QR siempre claro (escáner).

---

## 3. Sistema visual

### Color

La marca deja de ser verde. **Verde = pagada, y nada más.**

| Token | Hex | Uso |
|---|---|---|
| `--fondo` | `#EDEFEA` | Fondo de app. Gris piedra frío, plano, sin degradado. |
| `--superficie` | `#FFFFFF` | Listas, hojas, QR. |
| `--linea` | `#D5D9D1` | Divisores de 1 px (en lugar de sombras). |
| `--tinta` | `#15181A` | Texto principal. |
| `--tinta-suave` | `#5B6168` | Secundario. Contraste ≥ 4.5:1 sobre fondo. |
| `--primario` | `#1D3C8F` | Azul talavera. Botones principales, tab/nav activas, foco. |
| `--primario-tinta` | `#FFFFFF` | Texto sobre primario. |
| `--peligro` | `#B42318` | Quitar, errores. |
| `--pendiente-bg` / `--pendiente-fg` | `#E2E5E0` / `#3F444A` | Pendiente. |
| `--parcial-bg` / `--parcial-fg` | `#FCE7A8` / `#6E4400` | Pago parcial. |
| `--pagada-bg` / `--pagada-fg` | `#CBEED6` / `#0E5A2D` | Chip pagada. |
| `--pagada-solido` | `#15803D` | Bloque "Pagado", barra de progreso. |

`themeColor` en `app/layout.tsx` → `#1D3C8F`.

Estado = color + forma (nunca solo color): `○ Pendiente`, `◐ Parcial`,
`● Pagada` (SVG inline de 10 px, no emoji).

### Tipografía

- **Barlow** (`next/font/google`, pesos 500/600/700): señalética, lectura
  de un vistazo.
- **Barlow Semi Condensed 600/700** solo para número de mesa y montos grandes.
- Montos con `font-variant-numeric: tabular-nums`. Si la fuente no lo
  soporta, reportarlo antes de seguir.
- Escala: 13 / 15 / 17 / 22 / 32 / 48 px. Cuerpo 17 px en móvil.
- Nada de etiquetas en MAYÚSCULAS con tracking.

### Forma y espacio

- Radio: 12 px botones/inputs, 16 px hojas/bloques. No `rounded-3xl`.
- Sin `shadow-*` en listas. Separación con `--linea` 1 px.
  Única sombra: hoja inferior y barra de acción fija.
- Toque mínimo: 48 px. Botón principal: 56 px, ancho completo, verbo + monto
  ("Cobrar $480.00").

### Movimiento (solo CSS)

```css
--dur-rapida: 120ms;   /* press */
--dur: 180ms;          /* hoja, chips */
--ease: cubic-bezier(0.2, 0.8, 0.2, 1);
```

Exactamente estas animaciones:

1. **Press**: `active:scale-[0.98]` en botones, `--dur-rapida`.
2. **Hoja inferior** (Abrir mesa, Agregar partida, Más): `<dialog>` nativo,
   `translateY(100%) → 0` + backdrop `opacity`, con `@starting-style`.
3. **Cambio a pagada**: chip con `transition` de color; anillo
   `--pagada-solido` que aparece y se desvanece una vez (600 ms) en esa
   tarjeta. Solo al detectar cambio de estado entre polls, **no** en cada
   render ni en el primer paint.
4. **Pagado**: check con `stroke-dashoffset` (300 ms) + monto en `opacity`.
   Un momento, sin confeti.

Todo dentro de `@media (prefers-reduced-motion: no-preference)`.
Sin stagger, glow, marquee ni skeleton shimmer (skeleton estático sí).

---

## 4. Diseño por pantalla

### Chrome (`MeseroChrome`, `EncabezadoSesion`, `NavInferior`)

```
┌──────────────────────────────┐
│ Ana                    Salir │  sticky ~44 px
├──────────────────────────────┤
│ …contenido…                  │
├──────────────────────────────┤
│ [▦ Mesas][⚡ Rápido][$ Prop][▤ Rep][⋯ Más*] │  64 px fija
└──────────────────────────────┘
```

- Una sola fila siempre. Ícono SVG inline + etiqueta 13 px.
- Mesero: 4 items. Admin: 5 — el quinto es **Más**, hoja con Equipo,
  Ajustes y Salir.
- Activo: texto/ícono `--primario` + barra de 3 px arriba. Sin relleno sólido.
- `padding-bottom: env(safe-area-inset-bottom)`.

### Mesas (`CuentasLista`, `AbrirMesa`)

```
┌──────────────────────────────┐
│ Por cobrar        $3,240.00  │  línea fuerte
│ Cobrado hoy $8,910 · 7 mesas │  secundaria
│ [ Mis mesas | Todas ]        │  segmentado
├──────────────┬───────────────┤
│ 12      ◐    │ 4       ○     │  grid 2 cols
│ $480 falta   │ $1,120 falta  │  (3 en ≥ sm)
│ ▓▓▓▓░░░ Ana  │ ░░░░░░ Luis   │
├──────────────┴───────────────┤
│ ▸ Cerradas hoy (5)           │  <details> cerrado
├──────────────────────────────┤
│ [      + Abrir mesa       ]  │  fija sobre la nav
└──────────────────────────────┘
```

- Orden: parcial → pendiente → número de mesa.
- Tarjeta: mesa Semi Condensed 32 px, monto que falta, chip, barra 4 px;
  nombre del mesero solo en "Todas".
- **Abrir mesa** → hoja: input 48 px con `autoFocus`, select de mesero solo
  admin, botón "Abrir mesa 12" (refleja lo tecleado). Cargando: "Abriendo…".
- Vacío: "No tienes mesas abiertas" + el mismo botón. Carga: 4 skeletons.

### Detalle de mesa (`CuentaDetalle`)

```
┌──────────────────────────────┐
│ ← Mesas                      │
│ Mesa 12              ◐ Parcial│
│ Falta $480.00                │  48 px tabular
│ de $1,200.00 · Ana           │
├──────────────────────────────┤
│ Partidas (filas + divisor)   │
│ + Agregar partida → hoja     │
├──────────────────────────────┤
│ Cobros                       │
├──────────────────────────────┤
│ [ Dividir ] [ Cobrar $480 ]  │  fija sobre nav
└──────────────────────────────┘
```

- Barra fija: "Dividir" 1/3 + "Cobrar $X" 2/3. Si pagada: solo "Cerrar mesa".
- Quitar: primer toque → "¿Quitar? Sí" en `--peligro` por 3 s. Sin `window.confirm`.
- "Mesa pagada": franja `--pagada-bg` con check, no bloque verde enorme.

### Cobro QR (`CobroPantalla`) — la ve el cliente

- Fondo `--superficie`, sin nav.
- Monto 48 px; negocio debajo; QR `min(80vw, 360px)` con margen blanco 16 px.
- Vencimiento: barra que se vacía + "Vence en 4:12".
- "Esperando pago" con punto que pulsa en opacidad (reduced-motion OK).
- Screen Wake Lock mientras el QR esté activo (feature detect; si no, no-op).
- Quitar "Toca la pantalla…" del flujo; aviso discreto en `AudioUnlock` si hace falta.
- Vencido / reemplazado: mismo layout, mensaje + botón.

### Pagado (`PagadoPantalla`)

- Fondo `--pagada-solido`, check dibujado, "Pagado" + monto. Sin sombra.
- Propinas en grid 3 (10/15/20 %). "Otra cantidad" y "Sin propina" debajo.
- Reseña: estrellas 56 px.

### Dividir y Cobro rápido

- Mismos tokens. Dividir: "3 · $160" en cada botón de número.
- Cobro rápido: monto 32 px tabular; "Cobrar $X" fijo abajo.

### Resto (fase 5)

`PropinasLista`, `PropinasAjustes`, `EquipoPantalla`, `ReporteDesempeno`,
`EntrarPantalla`, `SetupPantalla` y headers de `app/*/page.tsx`: mismos
tokens, sin emerald ni ALL CAPS.

---

## 5. Prompts listos (Fase 0 → 5)

Pega **un** bloque por turno en Agent mode. No avances si `npm run check` falla.
No instales paquetes. Respeta `.cursor/rules/06-ui-sistema.mdc`.

### Fase 0 — Tokens y piezas base

```
Lee docs/specs/ui-plan.md secciones 3 y 4, y .cursor/rules/06-ui-sistema.mdc.
No instales paquetes.

1. app/globals.css: reemplaza :root con los tokens de color, radio y
   movimiento de la sección 3. Quita el degradado del body. Exponlos a
   Tailwind v4 con @theme (bg-fondo, text-tinta, bg-primario, etc.).
   Agrega .tabular { font-variant-numeric: tabular-nums }.
2. app/layout.tsx: carga Barlow (500/600/700) y Barlow Semi Condensed
   (600/700) con next/font/google como variables CSS. themeColor #1D3C8F.
3. Crea components/ui/ (sin lógica de negocio, sin fetch):
   Boton (primario/secundario/peligro; md 48px / lg 56px; prop cargando),
   Chip (reemplaza EstadoBadge; formas ○◐● en SVG),
   Hoja (<dialog> + @starting-style; Esc y tap en fondo; restore focus),
   Monto (formatearMxn + tabular), Skeleton (estático).
4. EstadoBadge reexporta Chip para no romper imports.
5. No toques pantallas todavía.
Al final: npm run check y reporta el resultado.
```

### Fase 1 — Chrome

```
Con components/ui/ de la fase 0, rediseña EncabezadoSesion, NavInferior y
MeseroChrome según "Chrome" en docs/specs/ui-plan.md y 06-ui-sistema.mdc.
Nav de una fila; admin ve "Más" (Hoja: Equipo, Ajustes, Salir).
Íconos SVG inline. Safe area abajo. Cero emerald-* y cero bg-[#…] aquí.
npm run check.
```

### Fase 2 — Mesas

```
Rediseña CuentasLista y AbrirMesa según "Mesas" en docs/specs/ui-plan.md.
No cambies carga, polling ni Supabase realtime.
- Resumen 2 líneas, segmentado, grid 2/3 cols, Cerradas en <details>,
  Abrir mesa fijo → Hoja (admin: select meseros activos, tú preseleccionado).
- Anillo "pagada": useRef de estado previo por id; dispara solo al pasar
  a pagada; nunca en primer render ni en cada poll.
- Skeleton y vacío.
npm run check.
```

### Fase 3 — Detalle de mesa

```
Rediseña CuentaDetalle según "Detalle de mesa" en docs/specs/ui-plan.md.
Misma lógica y mismas APIs.
- Barra fija: Dividir 1/3 + Cobrar $X 2/3; si pagada, solo Cerrar mesa.
  Encima de NavInferior.
- Agregar partida en Hoja.
- Quitar en dos toques (3 s), sin window.confirm.
- Partidas y cobros como filas con divisor, sin tarjetas.
npm run check.
```

### Fase 4 — Cobro y Pagado

```
Rediseña CobroPantalla y PagadoPantalla según docs/specs/ui-plan.md.
No toques polling, redirect, beep ni vistaQrCobro.
- QR grande en superficie blanca, barra de vencimiento, punto "esperando".
- Screen Wake Lock con feature detection; release al desmontar o al
  dejar de estar activo.
- Pagado: check stroke-dashoffset; propinas grid 3.
- Movimiento solo bajo prefers-reduced-motion: no-preference.
npm run check.
```

### Fase 5 — Resto y auditoría

```
Aplica tokens y components/ui/ a DividirCuenta, CobroRapidoForm,
PropinasLista, PropinasAjustes, EquipoPantalla, ReporteDesempeno,
EntrarPantalla, SetupPantalla y headers de app/*/page.tsx.
Elimina emerald-*, rounded-3xl, shadow-* y hex sueltos en components/ y app/.
Luego audita con .agents/skills/web-design-guidelines sobre components/ y
app/; corrige lo reportado. Lista lo que no corregiste y por qué.
npm run check.
```

---

## 6. Checklist por fase

En celular o DevTools 375 × 812:

- [ ] ¿Cobrar una mesa en ≤ 2 toques sin scroll desde Mesas?
- [ ] ¿Pendiente / parcial / pagada se distinguen en escala de grises?
- [ ] ¿Algo verde que no signifique "pagada"?
- [ ] ¿Algún monto baila con el polling?
- [ ] Con "reducir movimiento", ¿no se mueve nada?
- [ ] ¿Toques ≥ 48 px? ¿Foco de teclado visible?
- [ ] ¿La hoja de Abrir mesa deja el input visible con el teclado?
