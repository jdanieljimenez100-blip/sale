import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  crearTokenSesion,
  payloadSesionNuevo,
  verificarTokenSesion,
} from "../lib/auth/sesion";

const SECRET = "x".repeat(32);
const NEGOCIO = "11111111-1111-1111-1111-111111111111";

void test("verificarTokenSesion acepta token fresco", () => {
  const ahora = 1_700_000_000_000;
  const payload = payloadSesionNuevo("m1", "mesero", 0, NEGOCIO, ahora);
  const token = crearTokenSesion(payload, SECRET);
  const leido = verificarTokenSesion(token, SECRET, ahora + 1000);
  assert.deepEqual(leido, payload);
});

void test("verificarTokenSesion rechaza firma alterada", () => {
  const payload = payloadSesionNuevo("m1", "admin", 1, NEGOCIO);
  const token = crearTokenSesion(payload, SECRET);
  const malo = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
  assert.equal(verificarTokenSesion(malo, SECRET), null);
});

void test("verificarTokenSesion rechaza expirada", () => {
  const ahora = 1_700_000_000_000;
  const payload = payloadSesionNuevo("m1", "mesero", 0, NEGOCIO, ahora);
  const token = crearTokenSesion(payload, SECRET);
  assert.equal(
    verificarTokenSesion(token, SECRET, payload.exp + 1),
    null,
  );
});

void test("verificarTokenSesion no confunde rol en payload alterado", () => {
  const payload = payloadSesionNuevo("m1", "mesero", 2, NEGOCIO);
  const token = crearTokenSesion(payload, SECRET);
  const [payloadB64] = token.split(".");
  assert.ok(payloadB64);
  const json = JSON.parse(
    Buffer.from(payloadB64, "base64url").toString("utf8"),
  ) as { meseroId: string; rol: string; exp: number; v: number; n: string };
  json.rol = "admin";
  const alterado = `${Buffer.from(JSON.stringify(json)).toString("base64url")}.${token.split(".")[1]}`;
  assert.equal(verificarTokenSesion(alterado, SECRET), null);
});

void test("verificarTokenSesion rechaza sin campo v", () => {
  const payloadB64 = Buffer.from(
    JSON.stringify({
      meseroId: "m1",
      rol: "mesero",
      exp: Date.now() + 60_000,
      n: NEGOCIO,
    }),
  ).toString("base64url");
  const firma = createHmac("sha256", SECRET)
    .update(payloadB64)
    .digest("base64url");
  assert.equal(verificarTokenSesion(`${payloadB64}.${firma}`, SECRET), null);
});

void test("verificarTokenSesion rechaza sin campo n", () => {
  const payloadB64 = Buffer.from(
    JSON.stringify({
      meseroId: "m1",
      rol: "mesero",
      exp: Date.now() + 60_000,
      v: 0,
    }),
  ).toString("base64url");
  const firma = createHmac("sha256", SECRET)
    .update(payloadB64)
    .digest("base64url");
  assert.equal(verificarTokenSesion(`${payloadB64}.${firma}`, SECRET), null);
});
