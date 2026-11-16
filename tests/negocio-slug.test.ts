import assert from "node:assert/strict";
import test from "node:test";
import { slugValido } from "../lib/negocio-slug";

void test("slugValido acepta minúsculas, números y guion de 3 a 40", () => {
  assert.equal(slugValido("abc"), true);
  assert.equal(slugValido("mi-local"), true);
  assert.equal(slugValido("a1b"), true);
  assert.equal(slugValido("x".repeat(40)), true);
});

void test("slugValido rechaza cortos, largos y caracteres inválidos", () => {
  assert.equal(slugValido("ab"), false);
  assert.equal(slugValido("x".repeat(41)), false);
  assert.equal(slugValido("Mi-Local"), false);
  assert.equal(slugValido("con espacio"), false);
  assert.equal(slugValido("ñoño"), false);
  assert.equal(slugValido(""), false);
});
