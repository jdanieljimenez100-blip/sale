import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getServerEnv } from "@/lib/env";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const VERSION = "v1";

/** Decodifica y valida que la llave maestra sea base64 de exactamente 32 bytes. */
export function parsePeySecretsKey(raw: string): Buffer {
  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    throw new Error("PEY_SECRETS_KEY inválida (base64)");
  }
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `PEY_SECRETS_KEY debe decodificar a exactamente ${KEY_BYTES} bytes`,
    );
  }
  return key;
}

function leerLlaveMaestra(): Buffer {
  const raw = getServerEnv().PEY_SECRETS_KEY;
  if (!raw) {
    throw new Error("Falta PEY_SECRETS_KEY");
  }
  return parsePeySecretsKey(raw);
}

function aBase64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function desdeBase64Url(texto: string): Buffer {
  const padded =
    texto.length % 4 === 0 ? texto : texto + "=".repeat(4 - (texto.length % 4));
  const b64 = padded.replaceAll("-", "+").replaceAll("_", "/");
  return Buffer.from(b64, "base64");
}

/**
 * Cifra un secreto con AES-256-GCM.
 * Formato: `v1.<iv>.<tag>.<datos>` (cada parte base64url).
 * `aad` debe ser `${negocioId}:${campo}` para amarrar el ciphertext al restaurante.
 */
export function cifrarSecreto(texto: string, aad: string): string {
  const key = leerLlaveMaestra();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const encrypted = Buffer.concat([
    cipher.update(texto, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    aBase64Url(iv),
    aBase64Url(tag),
    aBase64Url(encrypted),
  ].join(".");
}

/**
 * Descifra un secreto producido por `cifrarSecreto`.
 * Falla si la versión, el tag, la AAD o la llave no coinciden.
 */
export function descifrarSecreto(cifrado: string, aad: string): string {
  const key = leerLlaveMaestra();
  const partes = cifrado.split(".");
  if (partes.length !== 4 || partes[0] !== VERSION) {
    throw new Error("Formato de secreto inválido");
  }
  const [, ivB64, tagB64, dataB64] = partes;
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Formato de secreto inválido");
  }
  const iv = desdeBase64Url(ivB64);
  const tag = desdeBase64Url(tagB64);
  const data = desdeBase64Url(dataB64);
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error("Formato de secreto inválido");
  }
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return plain.toString("utf8");
}
