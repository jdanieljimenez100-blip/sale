# Modelo de datos

Montos siempre en **centavos enteros**. RPCs: `REVOKE` de PUBLIC/anon/
authenticated; `GRANT EXECUTE` solo a `service_role`.

## Tablas clave

| Tabla | Columnas clave | Notas |
|---|---|---|
| `negocios` | `nombre`, `pey_bank_account_id`, `propina_porcentajes`, `reparto_cocina_pct` | Config del local |
| `meseros` | `nombre`, `rol`, `pin_hash`, `pin_intentos_*`, `activo`, `sesion_version`, `pey_bank_account_id` | PIN scrypt; ULID pey sin CLABE |
| `cuentas` | `mesa`, `mesero_id`, `estado`, `total_centavos`, `cerrada_at` | SELECT anon para Realtime de salón; **sin token de ticket** |
| `partidas` | `descripcion`, `cantidad`, `precio_centavos`, `notas`, `menu_item_id` | Snapshot de precio/nombre del menú |
| `menu_items` | `nombre`, `categoria`, `precio_centavos`, `activo`, `orden` | RLS sin policies |
| `cobros` | `tipo`, `monto_centavos`, `estado`, `pey_qr_id`, `pey_transaction_id`, `webhook_event_id`, `cobro_origen_id`, `pagado_at` | Consumo o propina |
| `resenas` | `cobro_id`, `mesero_id`, `estrellas`, `comentario` | Una por cobro de consumo |
| `tickets` | `cuenta_id` PK, `token` unique, `folio` identity | Nace al pasar a pagada |
| `bitacora` | `mesero_id`, `accion`, `detalle` jsonb | Sin PIN; pey últimos 4 |

## Índices / unicidad relevantes

- Propina activa por origen: índice único parcial sobre
  `cobros_propina_origen_uidx` (`tipo = propina` y `estado <> expirado`).
- `tickets.token` único.
- Unicidad de mesa abierta (conflicto 23505 al abrir) vía RPC/constraints
  de abrir cuenta.

## RPCs (`service_role` únicamente)

| Función | Para qué |
|---|---|---|
| `sale_insert_cobro` | Persistir cobro + QR |
| `sale_mark_cobro_pagado` | Marcar pagado desde webhook (idempotente) |
| `sale_set_cuenta_estado` | Ajuste de estado (legado / casos puntuales) |
| `sale_recalc_cuenta` | Recalcular totales/estado; inserta ticket si `pagada` |
| `sale_expire_consumo_pendientes` | Expirar QR de consumo al regenerar/cobrar |
| `sale_abrir_cuenta` | Abrir mesa |
| `sale_agregar_partida` | Partida libre o desde menú (+ notas) |
| `sale_quitar_partida` | Quitar partida |
| `sale_cerrar_cuenta` | Cerrar mesa pagada |
| `sale_pin_reservar_intento` | Contador/bloqueo PIN atómico |

Ningún rol `anon` / `authenticated` debe poder ejecutar estas funciones.
