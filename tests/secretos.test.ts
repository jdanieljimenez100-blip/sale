import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-test";
process.env.DEMO_ACCESS_TOKEN ??= "token-de-prueba";
process.env.SESSION_SECRET ??= "test-session-secret-min-32-characters!";
process.env.PEY_MODE ??= "mock";
process.env.PEY_SECRETS_KEY = randomBytes(32).toString("base64");

const {
  cifrarSecreto,
  descifrarSecreto,
  parsePeySecretsKey,
} = await import("../lib/secretos");

void test("cifrar/descifrar roundtrip con AAD", () => {
  const aad = "11111111-1111-1111-1111-111111111111:apiKey";
  const plain = "pey_sk_test_secreto";
  const cifrado = cifrarSecreto(plain, aad);
  assert.match(cifrado, /^v1\./);
  assert.equal(descifrarSecreto(cifrado, aad), plain);
});

void test("datos manipulados fallan al descifrar", () => {
  const aad = "neg:campo";
  const cifrado = cifrarSecreto("hola", aad);
  const partes = cifrado.split(".");
  const last = partes[3];
  assert.ok(last);
  const chars = last.split("");
  chars[0] = chars[0] === "A" ? "B" : "A";
  partes[3] = chars.join("");
  assert.throws(() => descifrarSecreto(partes.join("."), aad));
});

void test("AAD incorrecta falla", () => {
  const cifrado = cifrarSecreto("secreto", "neg-a:apiKey");
  assert.throws(() => descifrarSecreto(cifrado, "neg-b:apiKey"));
});

void test("llave de longitud incorrecta falla", () => {
  const corta = randomBytes(16).toString("base64");
  assert.throws(
    () => parsePeySecretsKey(corta),
    /exactamente 32 bytes/,
  );
  const ok = parsePeySecretsKey(randomBytes(32).toString("base64"));
  assert.equal(ok.length, 32);
});
