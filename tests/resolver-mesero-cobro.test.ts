import assert from "node:assert/strict";
import test from "node:test";
import { resolverMeseroParaCobro } from "../lib/auth/resolver-mesero-cobro";

const SESION = "mesero-sesion";
const PEDIDO = "mesero-pedido";

void test("mesero siempre usa sesionMeseroId e ignora pedido", () => {
  const id = resolverMeseroParaCobro({
    rol: "mesero",
    sesionMeseroId: SESION,
    meseroIdPedido: PEDIDO,
  });
  assert.equal(id, SESION);
});

void test("admin con meseroIdPedido usa el pedido", () => {
  const id = resolverMeseroParaCobro({
    rol: "admin",
    sesionMeseroId: SESION,
    meseroIdPedido: PEDIDO,
  });
  assert.equal(id, PEDIDO);
});

void test("admin sin meseroIdPedido usa sesionMeseroId", () => {
  const id = resolverMeseroParaCobro({
    rol: "admin",
    sesionMeseroId: SESION,
  });
  assert.equal(id, SESION);
});
