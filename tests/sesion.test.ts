import assert from "node:assert/strict";
import test from "node:test";
import {
  crearTokenSesion,
  payloadSesionNuevo,
  verificarTokenSesion,
} from "../lib/auth/sesion";

const SECRET = "x".repeat(32);

void test("verificarTokenSesion acepta token fresco", () => {
  const ahora = 1_700_000_000_000;
  const payload = payloadSesionNuevo("m1", "mesero", ahora);
  const token = crearTokenSesion(payload, SECRET);
  const leido = verificarTokenSesion(token, SECRET, ahora + 1000);
  assert.deepEqual(leido, payload);
});

void test("verificarTokenSesion rechaza firma alterada", () => {
  const payload = payloadSesionNuevo("m1", "admin");
  const token = crearTokenSesion(payload, SECRET);
  const malo = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
  assert.equal(verificarTokenSesion(malo, SECRET), null);
});

void test("verificarTokenSesion rechaza expirada", () => {
  const ahora = 1_700_000_000_000;
  const payload = payloadSesionNuevo("m1", "mesero", ahora);
  const token = crearTokenSesion(payload, SECRET);
  assert.equal(
    verificarTokenSesion(token, SECRET, payload.exp + 1),
    null,
  );
});

void test("verificarTokenSesion no confunde rol en payload alterado", () => {
  const payload = payloadSesionNuevo("m1", "mesero");
  const token = crearTokenSesion(payload, SECRET);
  const [payloadB64] = token.split(".");
  assert.ok(payloadB64);
  const json = JSON.parse(
    Buffer.from(payloadB64, "base64url").toString("utf8"),
  ) as { meseroId: string; rol: string; exp: number };
  json.rol = "admin";
  const alterado = `${Buffer.from(JSON.stringify(json)).toString("base64url")}.${token.split(".")[1]}`;
  assert.equal(verificarTokenSesion(alterado, SECRET), null);
});
