import assert from "node:assert/strict";
import test from "node:test";
import {
  celdaCsv,
  centavosATextoPesos,
  filasACsv,
} from "../lib/reporte-export";

void test("celdaCsv neutraliza fórmulas = + - @", () => {
  assert.equal(celdaCsv("=SUMA"), "'=SUMA");
  assert.equal(celdaCsv("+1"), "'+1");
  assert.equal(celdaCsv("-1"), "'-1");
  assert.equal(celdaCsv("@x"), "'@x");
});

void test("celdaCsv escapa comillas y comas", () => {
  assert.equal(celdaCsv('diga "hola"'), '"diga ""hola"""');
  assert.equal(celdaCsv("a,b"), '"a,b"');
  assert.equal(celdaCsv("normal"), "normal");
});

void test("filasACsv incluye BOM y acentos", () => {
  const csv = filasACsv(["Mesero", "Nota"], [["José", "café"]]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes("José"));
  assert.ok(csv.includes("café"));
  assert.ok(csv.includes("\r\n"));
});

void test("centavosATextoPesos sin flotantes", () => {
  assert.equal(centavosATextoPesos(0), "0.00");
  assert.equal(centavosATextoPesos(5), "0.05");
  assert.equal(centavosATextoPesos(100), "1.00");
  assert.equal(centavosATextoPesos(123456), "1234.56");
});
