import assert from "node:assert/strict";
import test from "node:test";
import {
  formatearFechaPagoCdmx,
  importePartida,
  primerNombre,
  subtotalPartidasCentavos,
  sumaPropinasCentavos,
  totalPagadoCentavos,
} from "../lib/ticket";

void test("importe y subtotal de partidas en centavos", () => {
  assert.equal(importePartida(2, 150), 300);
  const sub = subtotalPartidasCentavos([
    {
      nombre: "Taco",
      cantidad: 2,
      precioUnitarioCentavos: 1,
      notas: null,
    },
    {
      nombre: "Agua",
      cantidad: 1,
      precioUnitarioCentavos: 3,
      notas: "sin hielo",
    },
  ]);
  assert.equal(sub, 5);
});

void test("propinas se suman aparte del subtotal", () => {
  const subtotal = 100;
  const tips = sumaPropinasCentavos([10, 5]);
  assert.equal(tips, 15);
  assert.equal(totalPagadoCentavos(subtotal, tips), 115);
  assert.notEqual(totalPagadoCentavos(subtotal, tips), subtotal);
});

void test("formatearFechaPagoCdmx usa zona America/Mexico_City", () => {
  // 15 nov 2026 18:30 UTC = 12:30 CDMX
  const texto = formatearFechaPagoCdmx("2026-11-15T18:30:00.000Z");
  assert.match(texto, /15/);
  assert.match(texto, /11/);
  assert.match(texto, /2026/);
  assert.match(texto, /12:30/);
});

void test("primerNombre toma solo el primer token", () => {
  assert.equal(primerNombre("Ana López"), "Ana");
  assert.equal(primerNombre("  Luis  "), "Luis");
});
