import assert from "node:assert/strict";
import test from "node:test";
import {
  calcularMontoPropinaPorcentaje,
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
