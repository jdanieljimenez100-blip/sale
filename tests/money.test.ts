import assert from "node:assert/strict";
import test from "node:test";
import { centavosAPesos, pesosACentavos } from "../lib/money";

void test("1 centavo es 0.01 pesos para pey", () => {
  assert.equal(centavosAPesos(1), 0.01);
  assert.equal(pesosACentavos(0.01), 1);
});

void test("rechaza montos no enteros en centavos", () => {
  assert.throws(() => centavosAPesos(1.5));
  assert.throws(() => centavosAPesos(-1));
});
