# Aviso de privacidad integral

> **Plantilla para la demo; requiere revisión legal antes de uso real.**

Fecha de actualización: 15 de noviembre de 2026.

## 1. Identidad y domicilio del responsable

**Responsable del tratamiento:** [NOMBRE DEL RESTAURANTE], con domicilio en
[DOMICILIO].

**Encargado (operador de la plataforma Sale):** el proveedor de software Sale
trata datos por cuenta del responsable, conforme a las instrucciones de este.

Para ejercer derechos ARCO o consultas de privacidad: [CORREO DE PRIVACIDAD].

## 2. Datos personales que se recaban

### Titular: personal del restaurante (mesero / admin)

- Nombre
- Identificador interno de mesero
- Rol (mesero o admin) y estado activo/inactivo
- Hash del PIN (no se almacena el PIN en claro)
- Intentos fallidos y bloqueo temporal de PIN
- Versión de sesión (revocación)
- Referencia a la cuenta CoDi en pey (`pey_bank_account_id`, ULID de pey;
  **Sale no almacena la CLABE**; la CLABE vive en pey)
- Acciones registradas en bitácora (sin PIN; de la cuenta pey solo los
  últimos 4 caracteres cuando aplica)

### Titular: cliente / comensal

Sale **no** recibe el nombre ni la cuenta bancaria del cliente.

Datos relacionados con el servicio:

- Montos, hora de pago, `transactionId` y `codiQrId` que envía pey al
  confirmar un cobro
- Reseñas: estrellas (1–5) y comentario opcional (hasta 280 caracteres),
  ligados al cobro y al mesero
- Ticket público: folio, mesa, nombre de pila del mesero, partidas,
  montos e importes; se accede con un token aleatorio. **No incluye datos
  del cliente**

## 3. Finalidades

### Primarias (necesarias para el servicio)

- Operar el punto de venta (mesas, menú, partidas, roles)
- Cobrar con CoDi vía pey (generación de QR y confirmación por webhook)
- Emitir el ticket escaneable cuando la mesa queda pagada
- Calcular y dirigir propinas a la cuenta pey del mesero
- Seguridad: sesión, bloqueo de PIN, bitácora de acciones sensibles

### Secundarias (opcionales)

- Reseñas para medir la calidad del servicio del mesero

El rechazo de finalidades secundarias no impide el cobro ni el ticket.

## 4. Datos patrimoniales o financieros

Se trata la **referencia** a la cuenta CoDi del mesero en pey (ULID),
necesaria para depositar propinas. La CLABE y el detalle bancario del
mesero o del cliente **no** se almacenan en Sale; los administra pey
conforme a su propia documentación y aviso.

## 5. Transferencias y remisiones

| Destinatario | Rol | Tratamiento |
|---|---|---|
| pey | Proveedor de pagos CoDi | Crear cobros QR, webhooks firmados, cuentas bancarias |
| Supabase | Proveedor de base de datos | Almacenamiento y RPCs |
| Vercel | Proveedor de hosting | Ejecución de la aplicación web |

Región de servidores: **[REGIÓN DE SERVIDORES]**.

No se realizan transferencias a terceros con fines de mercadotecnia.
Las remisiones a proveedores se limitan a lo necesario para prestar el
servicio.

## 6. Derechos ARCO y revocación

Puede solicitar **Acceso, Rectificación, Cancelación u Oposición**, así
como la revocación del consentimiento para finalidades secundarias,
escribiendo a [CORREO DE PRIVACIDAD].

El procedimiento interno está descrito en
[`docs/legal/datos-personales.md`](./datos-personales.md).

## 7. Cookies y almacenamiento local

Sale usa una sola cookie necesaria:

- Nombre: `sale_sesion`
- Tipo: httpOnly, sameSite=lax
- Duración: 12 horas
- Finalidad: autenticar al mesero/admin en el dispositivo

No se usan cookies de analítica ni de rastreo. No se guarda el PIN ni
tokens de demo en `localStorage`.

## 8. Conservación

Plazo propuesto: **[PLAZO DE CONSERVACIÓN]** (p. ej. el tiempo que el
responsable mantenga la relación laboral/comercial más el exigido por
obligaciones fiscales o de seguridad). Al vencimiento se borran o
anonimizan, salvo retención legal.

## 9. Cambios al aviso

Cualquier cambio sustancial se publicará en `/privacidad` con la nueva
fecha de actualización. El uso continuo del servicio tras la publicación
implica conocimiento del aviso vigente.

## 10. Roles legales (resumen)

| Actor | Rol LFPDPPP |
|---|---|
| [NOMBRE DEL RESTAURANTE] | Responsable |
| Sale (plataforma) | Encargado |
| pey, Supabase, Vercel | Proveedores (encargados / remisiones) |
