# API HTTP (`app/api`)

Auth: **sesión** = cookie `sale_sesion` vía `requireSesion` (HMAC + DB).
**Admin** = sesión con rol admin en base. Errores típicos: `401` sin sesión,
`403` sin permiso/origen, `400` validación, `404` no encontrado.

De pey solo usamos lo documentado en [docs.pey.mx](https://docs.pey.mx):
crear cobro QR, webhook Standard Webhooks, identificadores de cuenta
(ULID) — **no** inventamos campos.

## Públicas / bootstrap

| Método | Ruta | Quién | Entrada | Salida | Notas |
|---|---|---|---|---|---|
| GET | `/api/auth/login-lista` | Pública | — | `{ meseros: [{id,nombre}] }` | Activos con PIN |
| POST | `/api/auth/login` | Pública + Origin | `{ meseroId, pin }` | `{ meseroId, nombre, rol }` + Set-Cookie | Sin devolver el PIN |
| POST | `/api/auth/logout` | Cookie | — | ok + limpia cookie | |
| GET | `/api/setup` | Pública | — | `{ disponible }` o 404 | Solo si no hay admin con PIN |
| POST | `/api/setup` | Pública + Origin | `{ demoToken, nombre, pin }` | `{ admin }` | Primer admin; token de entorno (no es login diario) |
| POST | `/api/webhooks/pey` | pey (firma) | body + headers Standard Webhooks | ack | Marca pagado; idempotente por event id |

## Sesión (cualquier rol)

| Método | Ruta | Entrada | Salida |
|---|---|---|---|
| GET | `/api/auth/yo` | — | sesión actual |
| GET | `/api/cuentas` | — | mesas + resumen |
| GET | `/api/cuentas/[id]` | — | detalle cuenta |
| POST | `/api/cuentas/abrir` | `{ mesa, meseroId? }` | `{ cuenta }` |
| POST | `/api/cuentas/[id]/partidas` | menú `{ menuItemId, cantidad, notas? }` o libre admin `{ descripcion, cantidad, precioPesos, notas? }` | cuenta actualizada |
| DELETE | `/api/partidas/[id]` | — | cuenta |
| POST | `/api/cuentas/[id]/cobrar` | — | `{ cobro }` | + `puedeModificarMesa` |
| POST | `/api/cuentas/[id]/dividir` | `{ modo, partes\|montosCentavos }` | `{ cobros }` | + ownership |
| POST | `/api/cuentas/[id]/cerrar` | — | `{ cuenta }` |
| GET | `/api/cuentas/[id]/ticket` | — | `{ token, folio }` | ownership; solo si pagada |
| POST | `/api/cobros` | consumo rápido | `{ cobro }` |
| GET | `/api/cobros/[id]` | — | `{ cobro }` |
| POST | `/api/cobros/[id]/regenerar` | — | nuevo QR |
| GET | `/api/cobros/[id]/propina-info` | — | info para UI propina |
| POST | `/api/cobros/[id]/propina` | decisión propina | cobro propina / omitida |
| POST | `/api/cobros/[id]/resena` | `{ estrellas, comentario? }` | ok |
| GET | `/api/meseros` | — | lista pública meseros |
| GET | `/api/meseros/[id]/propinas` | — | propias o admin |
| GET | `/api/menu` | `?todos=1` solo admin | items activos (o todos admin) |
| GET | `/api/reporte` | rango query | desempeño (mesero filtrado en servidor) |
| POST | `/api/dev/simular-pago` | mock interno | simula webhook | solo sesión; modo demo |

## Solo admin

| Método | Ruta | Entrada | Salida |
|---|---|---|---|
| POST | `/api/meseros` | alta mesero | mesero |
| PATCH | `/api/meseros/[id]` | pin/rol/activo/pey | mesero |
| DELETE | `/api/meseros/[id]` | — | `{ ok }` | Falla si hay mesas/reseñas o es el último admin |
| PATCH | `/api/meseros/[id]/cuenta-pey` | `{ peyBankAccountId }` | mesero |
| POST | `/api/menu` | alta ítem | ítem |
| PATCH | `/api/menu/[id]` | editar ítem | ítem |
| GET/PUT | `/api/negocio/propinas` | porcentajes / reparto cocina | config |

Página pública **sin API**: `/ticket/[token]` (server component) y
`/privacidad`.
