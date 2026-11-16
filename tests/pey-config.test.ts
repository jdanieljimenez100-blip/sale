import assert from "node:assert/strict";
import test from "node:test";
import { decidirFuentePey } from "../services/pey-config";

void test("decidirFuentePey: llaves propias → base", () => {
  assert.equal(
    decidirFuentePey({ tieneLlaves: true, usaPeyEntorno: false }),
    "base",
  );
  assert.equal(
    decidirFuentePey({ tieneLlaves: true, usaPeyEntorno: true }),
    "base",
  );
});

void test("decidirFuentePey: sin llaves y usa entorno → entorno", () => {
  assert.equal(
    decidirFuentePey({ tieneLlaves: false, usaPeyEntorno: true }),
    "entorno",
  );
});

void test("decidirFuentePey: sin llaves ni entorno → falta", () => {
  assert.equal(
    decidirFuentePey({ tieneLlaves: false, usaPeyEntorno: false }),
    "falta",
  );
});
