import assert from "node:assert/strict";
import test from "node:test";
import {
  calcularMontoPropinaPorcentaje,
  decidirReusoPropina,
  resolverDecisionPropina,
} from "../lib/propina";

void test("calcularMontoPropinaPorcentaje redondea y mínimo 1 centavo", () => {
  assert.equal(calcularMontoPropinaPorcentaje(1, 10), 1);
  assert.equal(calcularMontoPropinaPorcentaje(15, 10), 2);
  assert.equal(calcularMontoPropinaPorcentaje(100, 15), 15);
});

void test("resolverDecisionPropina rechaza porcentaje no permitido", () => {
  assert.throws(() =>
    resolverDecisionPropina({
      montoConsumoCentavos: 100,
      porcentajesPermitidos: [10, 15, 20],
      porcentaje: 12,
    }),
  );
});

void test("resolverDecisionPropina limita monto al 100% del consumo", () => {
  assert.throws(() =>
    resolverDecisionPropina({
      montoConsumoCentavos: 50,
      porcentajesPermitidos: [10, 15, 20],
      montoCentavos: 51,
    }),
  );
  const ok = resolverDecisionPropina({
    montoConsumoCentavos: 50,
    porcentajesPermitidos: [10, 15, 20],
    montoCentavos: 50,
  });
  assert.equal(ok.tipo, "monto");
  if (ok.tipo === "monto") {
    assert.equal(ok.montoCentavos, 50);
  }
});

void test("resolverDecisionPropina ninguna", () => {
  assert.deepEqual(
    resolverDecisionPropina({
      montoConsumoCentavos: 100,
      porcentajesPermitidos: [10],
      ninguna: true,
    }),
    { tipo: "ninguna" },
  );
});

void test("decidirReusoPropina crea si no hay o está expirada", () => {
  assert.deepEqual(decidirReusoPropina({ existente: null }), {
    accion: "crear",
  });
  assert.deepEqual(
    decidirReusoPropina({
      existente: {
        id: "p1",
        estado: "expirado",
        createdAt: "2026-11-14T12:00:00.000Z",
      },
    }),
    { accion: "crear" },
  );
});

void test("decidirReusoPropina devuelve pagada o pendiente fresca", () => {
  assert.deepEqual(
    decidirReusoPropina({
      existente: {
        id: "p2",
        estado: "pagado",
        createdAt: "2026-11-14T12:00:00.000Z",
      },
    }),
    { accion: "devolver", cobroId: "p2" },
  );
  const ahora = new Date("2026-11-14T12:05:00.000Z");
  assert.deepEqual(
    decidirReusoPropina({
      existente: {
        id: "p3",
        estado: "pendiente",
        createdAt: "2026-11-14T12:00:00.000Z",
      },
      ahora,
    }),
    { accion: "devolver", cobroId: "p3" },
  );
});

void test("decidirReusoPropina regenera pendiente vencida (600 s)", () => {
  const ahora = new Date("2026-11-14T12:10:00.000Z");
  assert.deepEqual(
    decidirReusoPropina({
      existente: {
        id: "p4",
        estado: "pendiente",
        createdAt: "2026-11-14T12:00:00.000Z",
      },
      ahora,
    }),
    { accion: "regenerar", cobroId: "p4" },
  );
});
