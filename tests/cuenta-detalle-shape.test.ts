import assert from "node:assert/strict";
import test from "node:test";
import {
  armarCuentaConDetalle,
  type CobroRow,
  type CuentaConDetalle,
  type CuentaRow,
  type PartidaRow,
} from "../services/cuentas";

const cuentaBase: CuentaRow = {
  id: "11111111-1111-1111-1111-111111111111",
  negocio_id: "22222222-2222-2222-2222-222222222222",
  mesero_id: "33333333-3333-3333-3333-333333333333",
  mesa: "7",
  estado: "parcial",
  total_centavos: 25000,
  created_at: "2026-11-16T12:00:00.000Z",
  cerrada_at: null,
};

const partida: PartidaRow = {
  id: "44444444-4444-4444-4444-444444444444",
  cuenta_id: cuentaBase.id,
  descripcion: "Tacos",
  cantidad: 2,
  precio_centavos: 5000,
  notas: null,
  menu_item_id: null,
};

const cobroPagado: CobroRow = {
  id: "55555555-5555-5555-5555-555555555555",
  negocio_id: cuentaBase.negocio_id,
  cuenta_id: cuentaBase.id,
  mesero_id: cuentaBase.mesero_id,
  tipo: "consumo",
  estado: "pagado",
  monto_centavos: 10000,
  concepto: "Consumo",
  pey_qr_id: "qr-1",
  pey_transaction_id: "tx-1",
  qr_string: "codi://ejemplo",
  webhook_event_id: null,
  created_at: "2026-11-16T12:02:00.000Z",
  pagado_at: "2026-11-16T12:03:00.000Z",
  cobro_origen_id: null,
};

function clavesDetalle(cuenta: CuentaConDetalle): string[] {
  return Object.keys(cuenta).sort();
}

void test("armarCuentaConDetalle produce las claves de GET CuentaConDetalle", () => {
  const detalle = armarCuentaConDetalle({
    cuenta: cuentaBase,
    partidas: [partida],
    cobros: [cobroPagado],
    meseroNombre: "Ana",
  });

  assert.deepEqual(clavesDetalle(detalle), [
    "cerrada_at",
    "cobros",
    "created_at",
    "estado",
    "id",
    "mesa",
    "mesero_id",
    "mesero_nombre",
    "negocio_id",
    "pagado_consumo_centavos",
    "partidas",
    "total_centavos",
  ]);
  assert.ok(Array.isArray(detalle.partidas));
  assert.ok(Array.isArray(detalle.cobros));
  assert.equal(detalle.mesero_nombre, "Ana");
  assert.equal(detalle.pagado_consumo_centavos, 10000);
  assert.equal(detalle.partidas.length, 1);
  assert.equal(detalle.cobros.length, 1);
});

void test("armarCuentaConDetalle ignora cobros que no son consumo pagado", () => {
  const propina: CobroRow = {
    ...cobroPagado,
    id: "66666666-6666-6666-6666-666666666666",
    tipo: "propina",
    monto_centavos: 2000,
    concepto: "Propina",
  };
  const pendiente: CobroRow = {
    ...cobroPagado,
    id: "77777777-7777-7777-7777-777777777777",
    estado: "pendiente",
    monto_centavos: 5000,
    pagado_at: null,
    pey_transaction_id: null,
  };

  const detalle = armarCuentaConDetalle({
    cuenta: cuentaBase,
    partidas: [],
    cobros: [cobroPagado, propina, pendiente],
    meseroNombre: "Luis",
  });

  assert.equal(detalle.pagado_consumo_centavos, 10000);
  assert.deepEqual(
    clavesDetalle(detalle),
    clavesDetalle(
      armarCuentaConDetalle({
        cuenta: cuentaBase,
        partidas: [],
        cobros: [],
        meseroNombre: "x",
      }),
    ),
  );
});
