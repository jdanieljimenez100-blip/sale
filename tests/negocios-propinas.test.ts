import assert from "node:assert/strict";
import test from "node:test";
import {
  validarPropinaPorcentajes,
  validarRepartoCocinaPct,
} from "../lib/negocio-propinas";

void test("validarPropinaPorcentajes acepta 1 a 3 enteros entre 1 y 50", () => {
  assert.deepEqual(validarPropinaPorcentajes([10]), [10]);
  assert.deepEqual(validarPropinaPorcentajes([10, 15, 20]), [10, 15, 20]);
});

void test("validarPropinaPorcentajes rechaza fuera de rango o cantidad inválida", () => {
  assert.throws(() => validarPropinaPorcentajes([]), /1 y 3/);
  assert.throws(() => validarPropinaPorcentajes([10, 15, 20, 25]), /1 y 3/);
  assert.throws(() => validarPropinaPorcentajes([0]), /1 y 50/);
  assert.throws(() => validarPropinaPorcentajes([51]), /1 y 50/);
  assert.throws(() => validarPropinaPorcentajes([10.5]), /entero/);
});

void test("validarRepartoCocinaPct acepta 0..50", () => {
  assert.equal(validarRepartoCocinaPct(0), 0);
  assert.equal(validarRepartoCocinaPct(50), 50);
});

void test("validarRepartoCocinaPct rechaza inválidos", () => {
  assert.throws(() => validarRepartoCocinaPct(-1), /0 y 50/);
  assert.throws(() => validarRepartoCocinaPct(51), /0 y 50/);
});
