import assert from "node:assert/strict";
import test from "node:test";
import { resolverAccesoNegocio } from "../lib/auth/negocio-acceso";

const MESERO_HOME = "n-home";
const MESERO_OTRO = "n-otro";
const MESERO_TERCERO = "n-tercero";

void test("mismo negocio usa rol del mesero (mesero)", () => {
  const r = resolverAccesoNegocio({
    mesero: { negocio_id: MESERO_HOME, rol: "mesero" },
    negocioPedido: MESERO_HOME,
    accesos: [],
  });
  assert.deepEqual(r, { negocioId: MESERO_HOME, rol: "mesero" });
});

void test("mismo negocio usa rol del mesero (admin)", () => {
  const r = resolverAccesoNegocio({
    mesero: { negocio_id: MESERO_HOME, rol: "admin" },
    negocioPedido: MESERO_HOME,
    accesos: [],
  });
  assert.deepEqual(r, { negocioId: MESERO_HOME, rol: "admin" });
});

void test("acceso admin cruzado concede admin en otro negocio", () => {
  const r = resolverAccesoNegocio({
    mesero: { negocio_id: MESERO_HOME, rol: "mesero" },
    negocioPedido: MESERO_OTRO,
    accesos: [{ negocio_id: MESERO_OTRO, rol: "admin" }],
  });
  assert.deepEqual(r, { negocioId: MESERO_OTRO, rol: "admin" });
});

void test("sin acceso a otro negocio → null", () => {
  const r = resolverAccesoNegocio({
    mesero: { negocio_id: MESERO_HOME, rol: "admin" },
    negocioPedido: MESERO_OTRO,
    accesos: [],
  });
  assert.equal(r, null);
});

void test("acceso a un negocio no abre otro", () => {
  const r = resolverAccesoNegocio({
    mesero: { negocio_id: MESERO_HOME, rol: "mesero" },
    negocioPedido: MESERO_TERCERO,
    accesos: [{ negocio_id: MESERO_OTRO, rol: "admin" }],
  });
  assert.equal(r, null);
});

void test("fila de acceso con rol distinto de admin no vale", () => {
  const r = resolverAccesoNegocio({
    mesero: { negocio_id: MESERO_HOME, rol: "mesero" },
    negocioPedido: MESERO_OTRO,
    accesos: [{ negocio_id: MESERO_OTRO, rol: "mesero" }],
  });
  assert.equal(r, null);
});
