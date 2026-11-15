import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type RolPin = "mesero" | "admin";

const TRIVIALES = new Set([
  "0000",
  "1111",
  "2222",
  "3333",
  "4444",
  "5555",
  "6666",
  "7777",
  "8888",
  "9999",
  "1234",
  "000000",
  "111111",
  "222222",
  "333333",
  "444444",
  "555555",
  "666666",
  "777777",
  "888888",
  "999999",
  "123456",
]);

/** Valida formato del PIN según el rol. */
export function validarPin(pin: string, rol: RolPin): void {
  if (rol === "mesero") {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error("El PIN del mesero debe ser de 4 dígitos");
    }
  } else if (!/^\d{6}$/.test(pin)) {
    throw new Error("El PIN del admin debe ser de 6 dígitos");
  }
  if (TRIVIALES.has(pin) || todosIguales(pin)) {
    throw new Error("Elige un PIN menos obvio");
  }
}

function todosIguales(pin: string): boolean {
  return pin.split("").every((c) => c === pin[0]);
}

/** Hash scrypt con sal de 16 bytes: scrypt$<salt>$<hash> (base64url). */
export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

/** Verifica PIN contra hash almacenado (timing-safe). */
export function verificarPin(pin: string, almacenado: string): boolean {
  const partes = almacenado.split("$");
  if (partes.length !== 3 || partes[0] !== "scrypt") {
    return false;
  }
  const saltB64 = partes[1];
  const hashB64 = partes[2];
  if (!saltB64 || !hashB64) {
    return false;
  }
  let salt: Buffer;
  let esperado: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64url");
    esperado = Buffer.from(hashB64, "base64url");
  } catch {
    return false;
  }
  if (salt.length !== 16 || esperado.length === 0) {
    return false;
  }
  const actual = scryptSync(pin, salt, esperado.length);
  if (actual.length !== esperado.length) {
    return false;
  }
  return timingSafeEqual(actual, esperado);
}
