import assert from "node:assert/strict";
import test from "node:test";
import { inicioDelDiaMexicoCity } from "../lib/dia-mexico";

void test("inicioDelDiaMexicoCity en invierno (CST, UTC-6)", () => {
  // 15 nov 2026 18:30 UTC = 12:30 CDMX → día 15
  const ahora = new Date("2026-11-15T18:30:00.000Z");
  const inicio = inicioDelDiaMexicoCity(ahora);
  assert.equal(inicio.toISOString(), "2026-11-15T06:00:00.000Z");
});

void test("inicioDelDiaMexicoCity cerca de medianoche CDMX (aún el día anterior en UTC)", () => {
  // 15 nov 2026 05:30 UTC = 14 nov 23:30 CDMX → día 14
  const ahora = new Date("2026-11-15T05:30:00.000Z");
  const inicio = inicioDelDiaMexicoCity(ahora);
  assert.equal(inicio.toISOString(), "2026-11-14T06:00:00.000Z");
});

void test("inicioDelDiaMexicoCity en julio (México sin DST desde 2022, UTC-6)", () => {
  // 15 jul 2026 18:30 UTC = 12:30 CDMX → día 15, offset -6
  const ahora = new Date("2026-07-15T18:30:00.000Z");
  const inicio = inicioDelDiaMexicoCity(ahora);
  assert.equal(inicio.toISOString(), "2026-07-15T06:00:00.000Z");
});
