import assert from "node:assert/strict";
import test from "node:test";
import { pesosTextoACentavos } from "../lib/money";

void test("pesosTextoACentavos convierte 12.50 a 1250", () => {
  assert.equal(pesosTextoACentavos("12.50"), 1250);
});

void test("pesosTextoACentavos acepta coma y enteros", () => {
  assert.equal(pesosTextoACentavos("12,5"), 1250);
  assert.equal(pesosTextoACentavos("0.01"), 1);
  assert.equal(pesosTextoACentavos("3"), 300);
});

void test("pesosTextoACentavos rechaza basura", () => {
  assert.throws(() => pesosTextoACentavos("abc"));
  assert.throws(() => pesosTextoACentavos("1.234"));
});
