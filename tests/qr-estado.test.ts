import assert from "node:assert/strict";
import test from "node:test";
import { montoAlRegenerarConsumo, vistaQrCobro } from "../lib/qr-estado";

void test("vistaQrCobro: pendiente fresco es activo", () => {
  const createdAt = new Date("2026-11-15T12:00:00.000Z");
  const ahora = new Date("2026-11-15T12:01:00.000Z");
  const vista = vistaQrCobro({ estado: "pendiente", createdAt, ahora });
  assert.equal(vista.tipo, "activo");
  if (vista.tipo === "activo") {
    assert.equal(vista.segundosRestantes, 540);
  }
});

void test("vistaQrCobro: pendiente a los 600 s es vencido", () => {
  const createdAt = new Date("2026-11-15T12:00:00.000Z");
  const ahora = new Date("2026-11-15T12:10:00.000Z");
  assert.deepEqual(
    vistaQrCobro({ estado: "pendiente", createdAt, ahora }),
    { tipo: "vencido" },
  );
});

void test("vistaQrCobro: expirado es reemplazado, no vencido", () => {
  const createdAt = new Date("2026-11-15T12:00:00.000Z");
  const ahora = new Date("2026-11-15T12:20:00.000Z");
  assert.deepEqual(
    vistaQrCobro({ estado: "expirado", createdAt, ahora }),
    { tipo: "reemplazado" },
  );
});

void test("montoAlRegenerarConsumo usa min(monto, restante)", () => {
  assert.equal(
    montoAlRegenerarConsumo({
      estado: "pendiente",
      montoCentavos: 4,
      restanteCentavos: 2,
    }),
    2,
  );
});

void test("montoAlRegenerarConsumo rechaza no pendiente o sin restante", () => {
  assert.throws(() =>
    montoAlRegenerarConsumo({
      estado: "expirado",
      montoCentavos: 1,
      restanteCentavos: 1,
    }),
  );
  assert.throws(() =>
    montoAlRegenerarConsumo({
      estado: "pendiente",
      montoCentavos: 1,
      restanteCentavos: 0,
    }),
  );
});
