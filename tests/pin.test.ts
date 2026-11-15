import assert from "node:assert/strict";
import test from "node:test";
import { hashPin, validarPin, verificarPin } from "../lib/auth/pin";

void test("validarPin mesero 4 dígitos y admin 6", () => {
  assert.doesNotThrow(() => validarPin("2580", "mesero"));
  assert.doesNotThrow(() => validarPin("258014", "admin"));
  assert.throws(() => validarPin("25801", "mesero"), /4 dígitos/);
  assert.throws(() => validarPin("2580", "admin"), /6 dígitos/);
});

void test("validarPin rechaza triviales", () => {
  assert.throws(() => validarPin("0000", "mesero"), /obvio/);
  assert.throws(() => validarPin("1234", "mesero"), /obvio/);
  assert.throws(() => validarPin("123456", "admin"), /obvio/);
  assert.throws(() => validarPin("7777", "mesero"), /obvio/);
});

void test("hashPin y verificarPin round-trip timing-safe", () => {
  const h = hashPin("2580");
  assert.match(h, /^scrypt\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
  assert.equal(verificarPin("2580", h), true);
  assert.equal(verificarPin("2581", h), false);
  assert.equal(verificarPin("2580", "basura"), false);
});
