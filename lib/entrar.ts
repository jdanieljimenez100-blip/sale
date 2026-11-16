import { slugValido } from "@/lib/negocio-slug";

export const COOKIE_RESTAURANTE = "sale_restaurante";

export const MSG_RESTAURANTE = "No encontramos ese restaurante";
export const MSG_BLOQUEO = "Demasiados intentos. Intenta en 5 minutos";
export const MSG_PIN = "PIN incorrecto";
export const PIN_MIN = 4;
export const PIN_MAX = 6;

export type MeseroLogin = { id: string; nombre: string };
export type NegocioLogin = { nombre: string; slug: string };
export type LoginListaOk = {
  meseros: MeseroLogin[];
  slug?: string;
  negocio?: NegocioLogin;
};
export type LoginListaRespuesta = LoginListaOk | { necesitaRestaurante: true };
export type PasoEntrar = 1 | 2 | 3;

export function leerSlugCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE_RESTAURANTE}=`));
  if (!match) {
    return null;
  }
  const valor = decodeURIComponent(match.slice(COOKIE_RESTAURANTE.length + 1));
  return slugValido(valor) ? valor : null;
}

export function guardarSlugCookie(slug: string): void {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_RESTAURANTE}=${encodeURIComponent(slug)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function borrarSlugCookie(): void {
  document.cookie = `${COOKIE_RESTAURANTE}=; path=/; max-age=0; samesite=lax`;
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return "?";
  }
  if (partes.length === 1) {
    return partes[0]!.slice(0, 2).toUpperCase();
  }
  return `${partes[0]![0] ?? ""}${partes[1]![0] ?? ""}`.toUpperCase();
}
