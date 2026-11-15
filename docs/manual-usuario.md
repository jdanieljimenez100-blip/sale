# Manual de usuario — Sale

Lenguaje simple para el equipo del restaurante y el cliente.

---

## Mesero

### Entrar

1. Abre la app y elige tu nombre.
2. Teclea tu PIN (4 dígitos).
3. Si fallas muchas veces, esperas **5 minutos** (bloqueo de seguridad).

### Abrir mesa

En **Mesas**, abre una mesa con su número. Queda a tu nombre.

### Agregar platillos

En el detalle de la mesa: elige la categoría, toca el platillo, ajusta
cantidad, escribe una **nota** si hace falta (sin datos personales) y
**Agregar**. El total se actualiza solo.

### Cobrar

- **Cobrar total:** genera el QR CoDi de toda la cuenta.
- **Dividir:** reparte en partes iguales o por montos; cada parte tiene su QR.

Muestra el QR al cliente. Si el QR **vence**, regenera uno nuevo desde la
pantalla del cobro (no inventes un pago a mano).

### Propina y reseña

Cuando el consumo está pagado, el flujo ofrece propina (va a **tu** cuenta
CoDi en pey, si el admin la configuró) y una reseña opcional del servicio.

### Mis propinas y reporte

Desde el menú puedes ver propinas del día y tu desempeño (solo tu fila).

### Cerrar mesa

Cuando la mesa está **pagada**, ciérrala para liberar el número.

### Salir

Usa cerrar sesión al terminar tu turno.

---

## Admin

### Primer acceso

Si aún no hay admin, usa la pantalla de **setup** del despliegue (token de
entorno del servidor; no es el login diario). Luego entras con tu PIN de
6 dígitos.

### Equipo

- Alta de meseros y PIN.
- Cambiar rol (mesero / admin). No quites el último admin.
- Desactivar cuentas (revoca su sesión).
- Asignar la **cuenta pey** del mesero (ULID de pey; la CLABE está en pey,
  no en Sale).

### Menú y precios

En **Ajustes → Menú**: categorías, precios, activar/desactivar platillos.

### Propinas del negocio

Porcentajes sugeridos y, si aplica, reparto a cocina.

### Reporte del equipo

El reporte de desempeño muestra a todos los meseros (ventas, propinas,
reseñas).

### Bitácora

Las acciones sensibles (login, cambios de PIN/rol, cuenta pey, etc.)
quedan registradas en el servidor para auditoría.

---

## Cliente

1. Escanea el QR CoDi con la app de tu banco y confirma el pago.
2. Cuando la mesa queda pagada, puedes escanear el **ticket** (enlace o QR
   que te muestre el mesero) para ver el detalle y guardarlo o imprimirlo.
3. El ticket **no** muestra tu nombre ni tu cuenta.

---

## Problemas frecuentes

| Problema | Qué hacer |
|---|---|
| PIN bloqueado 5 min | Espera; no reinicies a lo loco. Si urge, un admin puede resetear el PIN. |
| El pago no se refleja | Confirma en el banco. Espera unos segundos (webhook). No marques “pagado” a mano: solo el servidor con webhook válido. Regenera QR si venció y el cliente aún no pagó. |
| No se puede cerrar la mesa | Debe estar en estado **pagada**. Si falta consumo, cobra el resto. |
| No veo el ticket | Aparece cuando la mesa completa está pagada. En pago parcial aún no. |
| Olvidé el PIN | Pide a un admin que asigne uno nuevo (eso cierra tus sesiones viejas). |
