import { createHmac, timingSafeEqual } from "node:crypto";

export type RolSesion = "mesero" | "admin";

export type PayloadSesion = {
  meseroId: string;
  rol: RolSesion;
  exp: number;
  /** Versión de sesión del mesero (meseros.sesion_version). */
  v: number;
};

export const COOKIE_SESION = "sale_sesion";
export const SESION_DURACION_MS = 12 * 60 * 60 * 1000;

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b.toString("base64url");
}

function firmar(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/** Serializa y firma: base64url(payload).HMAC-SHA256 */
export function crearTokenSesion(
  payload: PayloadSesion,
  secret: string,
): string {
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${firmar(payloadB64, secret)}`;
}

export function verificarTokenSesion(
  token: string,
  secret: string,
  ahoraMs: number = Date.now(),
): PayloadSesion | null {
  const punto = token.indexOf(".");
  if (punto <= 0 || punto === token.length - 1) {
    return null;
  }
  const payloadB64 = token.slice(0, punto);
  const firma = token.slice(punto + 1);
  const esperada = firmar(payloadB64, secret);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("meseroId" in parsed) ||
    !("rol" in parsed) ||
    !("exp" in parsed) ||
    !("v" in parsed)
  ) {
    return null;
  }
  const rec: {
    meseroId: unknown;
    rol: unknown;
    exp: unknown;
    v: unknown;
  } = parsed;
  if (
    typeof rec.meseroId !== "string" ||
    (rec.rol !== "mesero" && rec.rol !== "admin") ||
    typeof rec.exp !== "number" ||
    typeof rec.v !== "number" ||
    !Number.isInteger(rec.v)
  ) {
    return null;
  }
  if (ahoraMs >= rec.exp) {
    return null;
  }
  return { meseroId: rec.meseroId, rol: rec.rol, exp: rec.exp, v: rec.v };
}

export function payloadSesionNuevo(
  meseroId: string,
  rol: RolSesion,
  sesionVersion: number,
  ahoraMs: number = Date.now(),
): PayloadSesion {
  return {
    meseroId,
    rol,
    v: sesionVersion,
    exp: ahoraMs + SESION_DURACION_MS,
  };
}

export function opcionesCookieSesion(produccion: boolean): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: produccion,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESION_DURACION_MS / 1000),
  };
}
