# Spec — Sale

Plantilla viva. Si un dato de pey no está en docs.pey.mx, se marca
[NO DOCUMENTADO] y no se inventa.

## Qué

Punto de venta web para un restaurante. El mesero cobra con un QR CoDi
de pey. El comensal paga. El estado "pagado" cambia solo en el servidor,
cuando el webhook es auténtico.

## Por qué

La demo del Cursor Hackatón México tiene que verse de punta a punta,
con repositorio público y URL en vivo, el domingo 15 de noviembre
a la 1:00 PM (CDMX).

## Dentro

- Un negocio, un mesero y cuentas de mesa.
- Cobro del consumo, propina aparte, dividir cuenta, cobro rápido
  y reporte del día.
- Pagos de prueba de $0.01 MXN. No se reembolsan.

## Fuera

- App nativa (Capacitor, Expo, React Native).
- Funciones que no estén en el guion de la demo.

## Reglas

- El mismo webhook, dos veces, es un solo pago.
- La cuenta queda pagada cuando el consumo confirmado cubre el total.
  La propina no bloquea el cierre.
- Dinero en centavos enteros. El sistema no guarda dinero.
- Secretos solo en variables de entorno del servidor.
