import assert from "node:assert/strict";
import test from "node:test";
import {
  puedeAgregarPartida,
  puedeCerrarMesa,
  puedeModificarMesa,
  puedeQuitarPartida,
  validarNumeroMesa,
} from "../lib/mesa-reglas";

void test("validarNumeroMesa acepta 1..999", () => {
  assert.equal(validarNumeroMesa("4"), "4");
  assert.equal(validarNumeroMesa("999"), "999");
  assert.throws(() => validarNumeroMesa("0"), /1 a 999/);
  assert.throws(() => validarNumeroMesa("1000"), /1 a 999/);
  assert.throws(() => validarNumeroMesa("A1"), /1 a 999/);
});

void test("puedeAgregarPartida bloquea pagada o cerrada", () => {
  assert.doesNotThrow(() =>
    puedeAgregarPartida({ cerradaAt: null, estado: "pendiente" }),
  );
  assert.throws(
    () => puedeAgregarPartida({ cerradaAt: null, estado: "pagada" }),
    /pagada/,
  );
  assert.throws(
    () =>
      puedeAgregarPartida({
        cerradaAt: "2026-11-14T12:00:00Z",
        estado: "pendiente",
      }),
    /cerrada/,
  );
});

void test("puedeQuitarPartida exige sin cobros de consumo", () => {
  assert.throws(
    () =>
      puedeQuitarPartida({
        cerradaAt: null,
        tieneCobroConsumoActivo: true,
      }),
    /cobros/,
  );
});

void test("puedeCerrarMesa solo pagada", () => {
  assert.doesNotThrow(() =>
    puedeCerrarMesa({ cerradaAt: null, estado: "pagada" }),
  );
  assert.throws(
    () => puedeCerrarMesa({ cerradaAt: null, estado: "parcial" }),
    /pagada/,
  );
});

void test("puedeModificarMesa admin cualquier mesa", () => {
  assert.doesNotThrow(() =>
    puedeModificarMesa({
      rol: "admin",
      sesionMeseroId: "a",
      cuentaMeseroId: "b",
    }),
  );
  assert.throws(
    () =>
      puedeModificarMesa({
        rol: "mesero",
        sesionMeseroId: "a",
        cuentaMeseroId: "b",
      }),
    /tus mesas/,
  );
});
