# Auditoría: filtros por negocio

Inventario de cada `.from(...)` y `.rpc(...)` en `services/` y `app/api/`
tras multi-negocio. Regenerado con ripgrep.

Convención: **sesión** = `sesion.negocioId` de `requireSesion`.
**assert** = `assertMismoNegocio` en la ruta API antes/después de cargar el recurso.

---

## Resumen

| Ámbito | Cómo se aísla |
|---|---|
| Listados (cuentas, cobros, meseros, menú, reporte) | `.eq("negocio_id", sesion.negocioId)` (o cobros vía `cobros.negocio_id`) |
| Recurso por id | assert 404 si `negocio_id` ≠ sesión |
| Webhook pey | Lookup por `pey_qr_id` / RPC firmada; **sin sesión** (intencional) |
| Ticket público | Lookup por `token`; **sin sesión** (intencional; comportamiento sin cambio) |
| `sale_insert_cobro` | Deriva `negocio_id` de cuenta o mesero dentro del RPC |

---

## Tabla

| archivo | consulta | cómo se filtra por negocio |
|---|---|---|
| `services/auth.ts` | `.from("meseros")` select por id (login) | Si body trae `r`→`negocioId`, exige `mesero.negocio_id === negocioId`; si no, home del mesero |
| `services/auth.ts` | `.rpc("sale_pin_reservar_intento")` | Por `p_mesero_id` ya validado en login |
| `services/auth.ts` | `.from("meseros")` update intentos / select tras fallo | Mismo mesero del login |
| `services/auth.ts` | `.from("meseros")` select id (hayAdminConPin) | Global de setup (primer admin); no lista datos de salón |
| `services/auth.ts` | `.from("negocios")` slug=`demo` (setup) | Negocio demo fijo por slug |
| `services/auth.ts` | `.from("meseros")` insert admin | `negocio_id` = id del slug `demo` |
| `services/auth.ts` | `.from("meseros")` listar login | `.eq("negocio_id", negocioId)` |
| `services/auth.ts` | `.from("negocios")` por slug / listar 1–2 | Público bootstrap login; no expone filas ajenas al slug pedido |
| `services/auth.ts` | `.from("meseros")` + `.from("negocio_accesos")` + `.from("negocios")` (listarNegociosAccesibles) | Solo home del mesero + filas admin de accesos |
| `services/auth.ts` | `.from("negocios")` por id | Id pedido (sesión / accesos) |
| `services/bitacora.ts` | `.from("bitacora")` insert | Columna `negocio_id` opcional cuando el caller la pasa |
| `services/cobros.ts` | `.rpc("sale_insert_cobro")` | RPC calcula `negocio_id` de cuenta o mesero |
| `services/cobros.ts` | `.from("cobros")` update expirar al regenerar | Por `id` del cobro ya cargado (ruta API hace assert) |
| `services/cobros.ts` | `.from("negocios")` nombreNegocioDeCobro | Por `cobro.negocio_id` |
| `services/cobros.ts` | `.from("cobros")` obtenerCobro / por pey_qr_id | Por id o `pey_qr_id`; API hace assert; webhook usa pey id |
| `services/cobros.ts` | `.rpc("sale_mark_cobro_pagado")` | Lookup por pey ids del webhook firmado, **no por sesión** |
| `services/cobros.ts` | `.rpc("sale_expire_consumo_pendientes")` | Por `p_cuenta_id` (cuenta ya validada en flujo de cobro) |
| `services/cobros.ts` | `.from("cobros")` listarPropinasMesero | `.eq("negocio_id", negocioId)` + mesero_id |
| `services/cuentas.ts` | `.from("cuentas")` abiertas / cerradas hoy | `.eq("negocio_id", negocioId)` |
| `services/cuentas.ts` | `.from("meseros")` nombres lista | `.eq("negocio_id", negocioId)` |
| `services/cuentas.ts` | `.from("cobros")` pagados / cobrado hoy | `.eq("negocio_id", negocioId)` |
| `services/cuentas.ts` | `.from("cuentas")` obtenerCuenta | Por id; rutas API hacen assert |
| `services/cuentas.ts` | `.from("partidas")` / `.from("cobros")` detalle | Por `cuenta_id` de la cuenta (ya scoped si hay assert) |
| `services/cuentas.ts` | `.from("meseros")` nombre detalle | Por `cuenta.mesero_id` |
| `services/cuentas.ts` | `.rpc("sale_recalc_cuenta")` | Por cuenta_id (webhook o flujo interno) |
| `services/menu.ts` | `.from("menu_items")` list/create/update/get | list/create/update: `.eq("negocio_id", …)`; get por id + update filtra negocio |
| `services/mesas.ts` | `.rpc("sale_abrir_cuenta")` | `p_negocio_id` = sesión |
| `services/mesas.ts` | `.rpc("sale_agregar_partida")` | Cuenta cargada; API assert antes |
| `services/mesas.ts` | `.from("partidas")` / `.from("cobros")` en quitar | Partida→cuenta; API assert vía `negocioIdDePartida` |
| `services/mesas.ts` | `.rpc("sale_quitar_partida")` | Tras ownership + assert |
| `services/mesas.ts` | `.from("partidas")` + `.from("cuentas")` negocioIdDePartida | Resuelve `cuentas.negocio_id` para assert |
| `services/mesas.ts` | `.rpc("sale_cerrar_cuenta")` | Tras assert en API |
| `services/meseros.ts` | `.from("meseros")` list | `.eq("negocio_id", negocioId)` |
| `services/meseros.ts` | `.from("meseros")` get/update/delete/create | create usa sesión; mutaciones API assert `mesero.negocio_id` |
| `services/meseros.ts` | `.from("meseros")` contarAdminsActivos | `.eq("negocio_id", negocioId)` |
| `services/meseros.ts` | `.from("cuentas")` count al eliminar | `.eq("mesero_id")` + `.eq("negocio_id", actual.negocio_id)` |
| `services/meseros.ts` | `.from("resenas")` count al eliminar | Por `mesero_id` (mesero ya assert de negocio) |
| `services/meseros.ts` | `.from("bitacora")` null mesero_id | Por mesero a eliminar (mismo negocio) |
| `services/negocios.ts` | `.from("negocios")` obtenerNegocio / update propinas | Por `negocioId` de sesión |
| `services/negocios.ts` | `.from("cuentas")` + `.from("negocios")` porcentajesPropinaPorCuenta | Via `cuenta.negocio_id` |
| `services/propinas.ts` | `.from("cobros")` propina existente | Por `cobro_origen_id` del consumo (API assert del consumo) |
| `services/reporte.ts` | `.from("cobros")` desempeño / pagos | `.eq("negocio_id", sesion.negocioId)` + `traerTodo` |
| `services/reporte.ts` | `.from("meseros")` | `.eq("negocio_id", sesion.negocioId)` |
| `services/reporte.ts` | `.from("negocios")` reparto | `.eq("id", sesion.negocioId)` |
| `services/reporte.ts` | `.from("resenas")` | `.in("cobro_id", cobrosDelNegocio)` |
| `services/reporte.ts` | `.from("cuentas")` mesas | `.eq("negocio_id")` + `.in("id", …)` |
| `services/resenas.ts` | `.from("resenas")` select/insert | Por cobro ya assert en API |
| `services/ticket.ts` | `.from("tickets")` por token | **Público**: lookup por token; sin sesión (intencional) |
| `services/ticket.ts` | `.from("cuentas")` / negocios / meseros / partidas / cobros | Encadenado al ticket/cuenta del token; **público** |
| `services/ticket.ts` | `.from("tickets")` meta por cuenta | Tras assert de cuenta en `/api/cuentas/[id]/ticket` |
| `app/api/auth/cambiar-negocio/route.ts` | `.from("meseros")` | Mesero de la sesión |
| `app/api/auth/cambiar-negocio/route.ts` | `.from("negocio_accesos")` | `.eq("mesero_id", sesion.meseroId)` + `resolverAccesoNegocio` |

> Nota: el resto de `app/api/**` no llama Supabase directo; usa `services/*`
> y aplica `assertMismoNegocio` / pasa `sesion.negocioId`.
> `lib/auth/require.ts` (fuera del alcance estricto services/api) carga
> `meseros` + `negocio_accesos` y valida `payload.n` con `resolverAccesoNegocio`.

---

## Conteos

- Filas en la tabla de auditoría: **58**
- Consultas públicas intencionales: ticket por token; login-lista por slug;
  webhook pey por ids firmados.
