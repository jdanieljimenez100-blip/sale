import assert from "node:assert/strict";
import test from "node:test";
import {
  estadoConexionPey,
  etiquetaEstadoConexionPey,
} from "../lib/pey-conexion";

void test("usaEntorno manda a servidor aunque haya webhook", () => {
  assert.equal(
    estadoConexionPey({
      configurado: true,
      usaEntorno: true,
      ultimoWebhookAt: "2026-11-15T18:30:00.000Z",
    }),
    "servidor",
  );
});

void test("configurado con ultimoWebhookAt → recibiendo", () => {
  assert.equal(
    estadoConexionPey({
      configurado: true,
      usaEntorno: false,
      ultimoWebhookAt: "2026-11-15T18:30:00.000Z",
    }),
    "recibiendo",
  );
});

void test("configurado sin webhook → conectado", () => {
  assert.equal(
    estadoConexionPey({
      configurado: true,
      usaEntorno: false,
      ultimoWebhookAt: null,
    }),
    "conectado",
  );
});

void test("sin configurar → sin_conectar", () => {
  assert.equal(
    estadoConexionPey({
      configurado: false,
      usaEntorno: false,
      ultimoWebhookAt: null,
    }),
    "sin_conectar",
  );
});

void test("etiqueta recibiendo incluye fecha formateada", () => {
  const texto = etiquetaEstadoConexionPey(
    "recibiendo",
    "2026-11-15T18:30:00.000Z",
    () => "15/11/2026, 12:30",
  );
  assert.equal(
    texto,
    "Recibiendo pagos (último aviso: 15/11/2026, 12:30)",
  );
});
