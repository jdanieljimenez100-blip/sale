# Inventario de datos personales y seguridad

> Plantilla operativa para la demo. Completar placeholders antes de uso real.

## Inventario

| Dato | Titular | Finalidad | Dónde se guarda | Quién accede | Plazo propuesto | Medida de seguridad |
|---|---|---|---|---|---|---|
| Nombre del mesero | Mesero | Identificar en login, mesas, ticket, reporte | `meseros.nombre` (Supabase) | App con sesión (service_role); ticket público muestra solo nombre de pila | [PLAZO DE CONSERVACIÓN] | RLS sin policies (solo service_role); ticket sin id interno |
| PIN | Mesero | Autenticación | Solo `meseros.pin_hash` (scrypt); nunca en claro ni en bitácora | Servidor al login | Mientras la cuenta esté activa + [PLAZO DE CONSERVACIÓN] | scrypt; bloqueo atómico RPC `sale_pin_reservar_intento` |
| Rol / activo | Mesero | Autorización | `meseros.rol`, `meseros.activo` | Sesión HMAC + lectura DB en cada request | Idem | Rol efectivo desde DB, no desde cookie |
| `sesion_version` | Mesero | Revocar sesión | `meseros.sesion_version` + claim `v` en cookie | Servidor | Mientras haya sesión válida | Cookie httpOnly; mismatch → 401 |
| Intentos / bloqueo PIN | Mesero | Seguridad | `pin_intentos_fallidos`, `pin_bloqueado_hasta` | Servidor | Corto (operativo) | RPC SECURITY DEFINER solo `service_role` |
| `pey_bank_account_id` (ULID) | Mesero / negocio | Destino de propinas / cobro restaurante | `meseros` / `negocios` | Solo servidor (admin al editar); **REVOKE SELECT a anon/authenticated** | [PLAZO DE CONSERVACIÓN] | Columna oculta a anon; bitácora solo últimos 4 |
| API key / secreto webhook pey | Negocio (titular operador) | Cobrar CoDi y verificar webhooks | `negocios.pey_api_key_cifrada`, `pey_webhook_secret_cifrado` (AES-256-GCM; AAD = negocio+campo); llave maestra `PEY_SECRETS_KEY` solo en env | Solo servidor (service_role); admin ve últimos 4 / URL webhook | Mientras el restaurante use pey + [PLAZO] | Cifrado en reposo; nunca `NEXT_PUBLIC_`; bitácora `pey_llaves_actualizar` solo últimos 4 |
| CLABE | Mesero (en pey) | Cuenta CoDi | **No en Sale**; en pey | pey | Según pey | Remisión a pey |
| Montos / hora de pago | Cliente (indirecto) | Confirmar cobro, ticket, reportes | `cobros` | Sesión; ticket público (montos) | [PLAZO DE CONSERVACIÓN] | Centavos enteros; "pagado" solo por webhook |
| `pey_transaction_id`, `pey_qr_id` | — (técnico pey) | Idempotencia / conciliación | `cobros` | Servidor; ticket muestra últimos 4 del transactionId | [PLAZO DE CONSERVACIÓN] | Idempotencia por `webhook_event_id` |
| Nombre / cuenta del cliente | Cliente | — | **No se reciben** | — | — | No aplica |
| Estrellas / comentario | Cliente (opcional) | Calidad del servicio | `resenas` | Admin/reporte; mesero ve las suyas | [PLAZO DE CONSERVACIÓN] o anonimizar antes | RLS sin policies; aviso de no poner datos personales |
| Ticket `token` | — | Acceso público al ticket | `tickets.token` | Cualquiera con el enlace | Mientras exista la cuenta/ticket | Token aleatorio; no en `cuentas` (SELECT público) |
| Bitácora (acción, detalle) | Mesero (actor) | Auditoría | `bitacora` | Solo servidor / admin operativo | [PLAZO DE CONSERVACIÓN] | Sin PIN; pey solo últimos 4 |
| Cookie `sale_sesion` | Mesero | Sesión | Navegador del dispositivo | Navegador + servidor (HMAC) | 12 horas | httpOnly, sameSite=lax; sin analítica |

**Roles legales:** el restaurante ([NOMBRE DEL RESTAURANTE]) es el
**responsable**; Sale es **encargado**; pey, Supabase y Vercel son
proveedores. Región: [REGIÓN DE SERVIDORES]. Contacto ARCO:
[CORREO DE PRIVACIDAD].

## Procedimiento corto ante vulneración

1. **Detectar:** alerta en logs, bitácora anómala, aviso del proveedor o
   reporte interno.
2. **Contener:** rotar `SESSION_SECRET`, `PEY_WEBHOOK_SECRET`,
   `DEMO_ACCESS_TOKEN` (setup/mock) y llaves de Supabase según alcance;
   forzar `sesion_version++` o desactivar cuentas afectadas; revocar
   acceso de service role comprometido.
3. **Evaluar impacto:** ¿afecta derechos de titulares (meseros/clientes)?
4. **Avisar:** si hay riesgo a derechos, notificar a titulares y, cuando
   aplique, a la autoridad, usando [CORREO DE PRIVACIDAD] y el canal del
   responsable.
5. **Registrar:** documentar hechos, medidas y fechas en bitácora interna
   del responsable (fuera o dentro de `bitacora` según política).

## Atención de solicitudes ARCO

1. Recibir solicitud en [CORREO DE PRIVACIDAD] e identificar titular
   (mesero por `mesero_id` / nombre; cliente por cobro o folio de ticket
   si aporta el enlace).
2. **Acceso / exportación:** consultar con service role tablas
   `meseros`, `cobros`, `resenas`, `bitacora`, `tickets` filtrando por
   `mesero_id` o `cobro_id`; entregar extracto sin secretos ni CLABE.
3. **Rectificación:** corregir nombre u otros datos editables vía admin.
4. **Cancelación / oposición:** desactivar mesero (`activo=false` + bump
   `sesion_version`); anonimizar o borrar `resenas.comentario`; no borrar
   cobros si hay obligación fiscal—anonimizar campos no esenciales.
5. Responder al titular dentro del plazo legal aplicable, dejando
   constancia de la fecha.
