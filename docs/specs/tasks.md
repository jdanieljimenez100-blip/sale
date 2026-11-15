# Tareas — Sale

## 1. Datos

- [x] Tablas Negocio, Mesero, Cuenta, Partida y Cobro.
- [x] Id de pey único. Montos en centavos enteros.
- [x] Seed: 1 negocio, 1 mesero, 3 mesas abiertas.
- [x] `.env.example` sin valores secretos.

## 2. Servicios

- [x] `lib/pey/`: `crearCobro` y `verificarWebhook`. Modo real y modo mock.
- [x] Ningún otro archivo llama a pey.
- [x] Idempotencia por webhook-id / pey_qr_id y recálculo de cuenta.
- [x] La propina no bloquea el cierre.

## 3. API

- [x] Rutas de cuentas y cobros con zod.
- [x] Auth demo en mutaciones. El navegador no marca "pagado".
- [x] `POST /api/webhooks/pey`.

## 4. Pantallas

- [x] Cuentas y detalle.
- [x] QR y Pagado.
- [x] Propina y Mis propinas.
- [x] Dividir cuenta y cobro rápido.
- [x] Reporte del día.

## 5. Demo

- [ ] URL pública y webhook de pey.
- [ ] Ensayo con pagos reales de $0.01.
