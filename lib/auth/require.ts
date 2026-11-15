import { getServerEnv } from "@/lib/env";
import { HttpError } from "@/lib/api-error";
import {
  COOKIE_SESION,
  verificarTokenSesion,
  type PayloadSesion,
  type RolSesion,
} from "@/lib/auth/sesion";

function leerCookie(request: Request, nombre: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) {
    return null;
  }
  for (const parte of raw.split(";")) {
    const idx = parte.indexOf("=");
    if (idx < 0) {
      continue;
    }
    const key = parte.slice(0, idx).trim();
    if (key === nombre) {
      return decodeURIComponent(parte.slice(idx + 1).trim());
    }
  }
  return null;
}

/** Exige mismo Origin que el Host en mutaciones (CSRF básico). */
export function assertOriginMismoHost(request: Request): void {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return;
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    // Same-origin navigations / algunos clientes sin Origin en POST same-site.
    const referer = request.headers.get("referer");
    if (!referer) {
      throw new HttpError("Origen no permitido", 403);
    }
    try {
      const refHost = new URL(referer).host;
      const reqHost = request.headers.get("host");
      if (!reqHost || refHost !== reqHost) {
        throw new HttpError("Origen no permitido", 403);
      }
      return;
    } catch {
      throw new HttpError("Origen no permitido", 403);
    }
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError("Origen no permitido", 403);
  }
  const reqHost = request.headers.get("host");
  if (!reqHost || originHost !== reqHost) {
    throw new HttpError("Origen no permitido", 403);
  }
}

export function requireSesion(
  request: Request,
  opts?: { rol?: RolSesion },
): PayloadSesion {
  assertOriginMismoHost(request);
  const token = leerCookie(request, COOKIE_SESION);
  if (!token) {
    throw new HttpError("Inicia sesión", 401);
  }
  const secret = getServerEnv().SESSION_SECRET;
  const payload = verificarTokenSesion(token, secret);
  if (!payload) {
    throw new HttpError("Inicia sesión", 401);
  }
  if (opts?.rol === "admin" && payload.rol !== "admin") {
    throw new HttpError("No tienes permiso", 403);
  }
  return payload;
}
