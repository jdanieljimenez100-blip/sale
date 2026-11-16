import type { RolSesion } from "@/lib/auth/sesion";

/**
 * Quién queda como mesero del cobro rápido según rol.
 * La pertenencia al negocio (y activo) la valida el servicio, no esta fn.
 */
export function resolverMeseroParaCobro(input: {
  rol: RolSesion;
  sesionMeseroId: string;
  meseroIdPedido?: string;
}): string {
  if (input.rol === "mesero") {
    return input.sesionMeseroId;
  }
  return input.meseroIdPedido ?? input.sesionMeseroId;
}
