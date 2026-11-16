# API HTTP (`app/api`)

Auth: **sesión** = cookie `sale_sesion` vía `requireSesion` (HMAC + DB).
El token lleva `n` = `negocioId` activo. Sin `n` → inválido (re-login).
Rol efectivo y acceso al negocio se resuelven en servidor
(`meseros` + `negocio_accesos`), no solo desde la cookie.

**Admin** = rol efectivo admin en el negocio de la sesión. Errores típicos:
`401` sin sesión, `403` sin permiso/origen, `400` validación, `404` no
encontrado (también si el recurso es de otro restaurante).

Cookie no sensible `sale_restaurante` (slug, 1 año, SameSite=Lax) recuerda
el local en `/entrar`.

De pey solo usamos lo documentado en [docs.pey.mx](https://docs.pey.mx):
`POST /codi/qr`, `GET /bank-account/:id`, webhooks
`codi.qr.payment_received` y `bank.account.updated` — **no** inventamos
campos. Cada restaurante guarda su API key y secreto cifrados (o
`usa_pey_entorno` usa las vars de entorno del servidor).

## Públicas / bootstrap

| Método | Ruta | Quién | Entrada | Salida | Notas |
|---|---|---|---|---|---|
| GET | `/api/auth/login-lista` | Pública | `?r=<slug>` | `{ meseros, slug }` o `{ necesitaRestaurante: true }` | Sin `r`: un negocio → lo usa; varios → pide restaurante |
| POST | `/api/auth/login` | Pública + Origin | `{ meseroId, pin, r? }` | `{ meseroId, nombre, rol }` + Set-Cookie | Si `r`, mesero debe ser de ese negocio; mismo mensaje "PIN incorrecto" |
| POST | `/api/auth/logout` | Cookie | — | ok + limpia cookie | |
| GET | `/api/setup` | Pública | — | `{ disponible }` o 404 | Solo si no hay admin con PIN |
| POST | `/api/setup` | Pública + Origin | `{ demoToken, nombre, pin }` | `{ admin }` | Primer admin en negocio `slug=demo` |
| POST | `/api/webhooks/pey` | pey (firma) | body + headers Standard Webhooks | ack | Solo negocios con `usa_pey_entorno`; marca con `p_negocio_id` |
| POST | `/api/webhooks/pey/[negocioId]` | pey (firma) | body + headers Standard Webhooks | ack | Secreto del restaurante; apiKeyId sticky; mark scoped |

## Sesión (cualquier rol)

| Método | Ruta | Entrada | Salida |
|---|---|---|---|
| GET | `/api/auth/yo` | — | `{ meseroId, nombre, rol, negocio, negocios }` |
| POST | `/api/auth/cambiar-negocio` | `{ negocioId }` | `{ negocioId, rol }` + nueva cookie | Acceso vía home o `negocio_accesos` admin |
| GET | `/api/cuentas` | — | mesas + resumen | Filtrado por `sesion.negocioId` |
| GET | `/api/cuentas/[id]` | — | detalle cuenta | `assertMismoNegocio` |
| POST | `/api/cuentas/abrir` | `{ mesa, meseroId? }` | `{ cuenta }` | `negocioId` de sesión |
| POST | `/api/cuentas/[id]/partidas` | menú o libre admin | cuenta actualizada | + assert negocio |
| DELETE | `/api/partidas/[id]` | — | cuenta | assert vía cuenta de la partida |
| POST | `/api/cuentas/[id]/cobrar` | — | `{ cobro }` | + ownership + negocio |
| POST | `/api/cuentas/[id]/dividir` | `{ modo, partes\|montosCentavos }` | `{ cobros }` | + ownership + negocio |
| POST | `/api/cuentas/[id]/cerrar` | — | `{ cuenta }` | + negocio |
| GET | `/api/cuentas/[id]/ticket` | — | `{ token, folio }` | ownership; solo si pagada |
| POST | `/api/cobros` | consumo rápido | `{ cobro }` | cuenta debe ser del negocio |
| GET | `/api/cobros/[id]` | — | `{ cobro }` | assert negocio |
| POST | `/api/cobros/[id]/regenerar` | — | nuevo QR | assert negocio |
| GET | `/api/cobros/[id]/propina-info` | — | info para UI propina | assert negocio |
| POST | `/api/cobros/[id]/propina` | decisión propina | cobro propina / omitida | assert negocio |
| POST | `/api/cobros/[id]/resena` | `{ estrellas, comentario? }` | ok | assert negocio |
| GET | `/api/meseros` | — | lista meseros del negocio | |
| GET | `/api/meseros/[id]/propinas` | — | propias o admin | assert negocio |
| GET | `/api/menu` | `?todos=1` solo admin | items del negocio | |
| GET | `/api/reporte` | rango query | desempeño | filtrado por negocio (+ mesero si no admin) |
| POST | `/api/dev/simular-pago` | mock interno | simula webhook | solo sesión; modo demo; assert negocio |

## Solo admin

| Método | Ruta | Entrada | Salida |
|---|---|---|---|
| POST | `/api/meseros` | alta mesero | mesero | `negocio_id` = sesión (nunca del body) |
| PATCH | `/api/meseros/[id]` | pin/rol/activo/pey | mesero | assert negocio |
| DELETE | `/api/meseros/[id]` | — | `{ ok }` | Falla si hay mesas/reseñas o es el último admin |
| PATCH | `/api/meseros/[id]/cuenta-pey` | `{ peyBankAccountId }` | mesero | assert negocio |
| POST | `/api/menu` | alta ítem | ítem | `negocio_id` = sesión |
| PATCH | `/api/menu/[id]` | editar ítem | ítem | filtrado por negocio |
| GET/PUT | `/api/negocio/propinas` | porcentajes / reparto cocina | config | negocio de sesión |
| GET | `/api/negocio/pey` | — | `{ configurado, apiKeyUltimos4, webhookUrl, ultimoWebhookAt, cuentaRestaurante }` | Nunca expone key/secret |
| PUT | `/api/negocio/pey` | `{ apiKey?, webhookSecret?, bankAccountId? }` | mismo shape que GET | Cifra llaves; verifica bank-account; bitácora últimos 4 |

Página pública **sin API**: `/ticket/[token]` (server component; lookup por
token, sin sesión) y `/privacidad`. Entrada: `/entrar?r=<slug>`.
