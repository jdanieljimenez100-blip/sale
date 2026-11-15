import assert from "node:assert/strict";
import test from "node:test";
import { calcularEstadoCuenta } from "../services/cuenta-estado";

void test("consumo parcial deja la cuenta en parcial", () => {
  assert.equal(calcularEstadoCuenta(100, 40), "parcial");
});

void test("consumo completo marca pagada aunque falte propina", () => {
  assert.equal(calcularEstadoCuenta(100, 100), "pagada");
});

void test("sin consumo confirmado sigue pendiente", () => {
  assert.equal(calcularEstadoCuenta(100, 0), "pendiente");
});
