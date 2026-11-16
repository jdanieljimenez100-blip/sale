# Modelo de datos

Montos siempre en **centavos enteros**. RPCs: `REVOKE` de PUBLIC/anon/
authenticated; `GRANT EXECUTE` solo a `service_role`.

Aislamiento multi-negocio: cada restaurante es un `negocios` con `slug`.
Las consultas de la app filtran por `negocio_id` de la sesión. Lecturas
públicas vía anon/authenticated están cerradas (sin policies SELECT
abiertas en tablas operativas).

## Tablas clave

| Tabla | Columnas clave | Notas |
|---|---|---|
| `negocios` | `nombre`, `slug` UNIQUE, `pey_bank_account_id`, `propina_porcentajes`, `reparto_cocina_pct` | `slug` `^[a-z0-9-]{3,40}$`; demo = `demo` |
| `negocio_accesos` | `(mesero_id, negocio_id)` PK, `rol` (`admin`) | Admin cruzado; RLS sin policies |
| `meseros` | `negocio_id`, `nombre`, `rol`, `pin_hash`, `pin_intentos_*`, `activo`, `sesion_version`, `pey_bank_account_id` | PIN scrypt; ULID pey sin CLABE |
| `cuentas` | `negocio_id`, `mesa`, `mesero_id`, `estado`, `total_centavos`, `cerrada_at` | Sin SELECT público; **sin token de ticket** |
| `partidas` | `descripcion`, `cantidad`, `precio_centavos`, `notas`, `menu_item_id` | Snapshot de precio/nombre del menú; negocio vía cuenta |
| `menu_items` | `negocio_id`, `nombre`, `categoria`, `precio_centavos`, `activo`, `orden` | RLS sin policies |
| `cobros` | `negocio_id` NOT NULL, `tipo`, `monto_centavos`, `estado`, `pey_qr_id`, `pey_transaction_id`, `webhook_event_id`, `cobro_origen_id`, `pagado_at` | Índice `(negocio_id, estado, pagado_at)` |
| `resenas` | `cobro_id`, `mesero_id`, `estrellas`, `comentario` | Una por cobro de consumo; negocio vía cobro/cuenta |
| `tickets` | `cuenta_id` PK, `token` unique, `folio` identity | Nace al pasar a pagada; público por token |
| `bitacora` | `mesero_id`, `negocio_id` nullable, `accion`, `detalle` jsonb | Sin PIN; pey últimos 4 |

## Índices / unicidad relevantes

- `negocios.slug` único.
- Propina activa por origen: índice único parcial sobre
  `cobros_propina_origen_uidx` (`tipo = propina` y `estado <> expirado`).
- `cobros (negocio_id, estado, pagado_at)`.
- `tickets.token` único.
- Unicidad de mesa abierta (conflicto 23505 al abrir) vía RPC/constraints
  de abrir cuenta.

## RPCs (`service_role` únicamente)

| Función | Para qué |
|---|---|---|
| `sale_insert_cobro` | Persistir cobro + QR; **deriva `negocio_id`** de cuenta o mesero (firma 8 args sin cambio) |
| `sale_mark_cobro_pagado` | Marcar pagado desde webhook (idempotente; lookup por pey ids) |
| `sale_set_cuenta_estado` | Ajuste de estado (legado / casos puntuales) |
| `sale_recalc_cuenta` | Recalcular totales/estado; inserta ticket si `pagada` |
| `sale_expire_consumo_pendientes` | Expirar QR de consumo al regenerar/cobrar |
| `sale_abrir_cuenta` | Abrir mesa (`p_negocio_id`) |
| `sale_agregar_partida` | Partida libre o desde menú (+ notas) |
| `sale_quitar_partida` | Quitar partida |
| `sale_cerrar_cuenta` | Cerrar mesa pagada |
| `sale_pin_reservar_intento` | Contador/bloqueo PIN atómico |

Ningún rol `anon` / `authenticated` debe poder ejecutar estas funciones.
