import assert from "node:assert/strict";
import test from "node:test";
import { validarInputResena } from "../lib/resena";

void test("validarInputResena acepta estrellas 1..5 sin comentario", () => {
  assert.deepEqual(validarInputResena({ estrellas: 5 }), {
    estrellas: 5,
    comentario: null,
  });
  assert.deepEqual(validarInputResena({ estrellas: 1, comentario: null }), {
    estrellas: 1,
    comentario: null,
  });
});

void test("validarInputResena hace trim y trata vacío como null", () => {
  assert.deepEqual(
    validarInputResena({ estrellas: 3, comentario: "  Muy bien  " }),
    { estrellas: 3, comentario: "Muy bien" },
  );
  assert.deepEqual(validarInputResena({ estrellas: 2, comentario: "   " }), {
    estrellas: 2,
    comentario: null,
  });
});

void test("validarInputResena rechaza estrellas fuera de rango o no enteras", () => {
  assert.throws(() => validarInputResena({ estrellas: 0 }), /1 y 5/);
  assert.throws(() => validarInputResena({ estrellas: 6 }), /1 y 5/);
  assert.throws(() => validarInputResena({ estrellas: 2.5 }), /1 y 5/);
});

void test("validarInputResena rechaza comentario mayor a 280", () => {
  assert.throws(
    () => validarInputResena({ estrellas: 4, comentario: "x".repeat(281) }),
    /280/,
  );
  assert.doesNotThrow(() =>
    validarInputResena({ estrellas: 4, comentario: "x".repeat(280) }),
  );
});
