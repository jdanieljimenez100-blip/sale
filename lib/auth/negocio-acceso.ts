import type { RolSesion } from "@/lib/auth/sesion";

export type AccesoNegocioRow = {
  negocio_id: string;
  rol: string;
};

export type MeseroParaAcceso = {
  negocio_id: string;
  rol: RolSesion;
};

/**
 * Resuelve el negocio activo y el rol efectivo.
 * - Mismo negocio del mesero → rol del mesero.
 * - Otro negocio con fila admin en negocio_accesos → admin.
 * - Sin acceso → null.
 */
export function resolverAccesoNegocio(input: {
  mesero: MeseroParaAcceso;
  negocioPedido: string;
  accesos: AccesoNegocioRow[];
}): { negocioId: string; rol: RolSesion } | null {
  const { mesero, negocioPedido, accesos } = input;
  if (negocioPedido === mesero.negocio_id) {
    return { negocioId: negocioPedido, rol: mesero.rol };
  }
  const cruzado = accesos.find(
    (a) => a.negocio_id === negocioPedido && a.rol === "admin",
  );
  if (cruzado) {
    return { negocioId: negocioPedido, rol: "admin" };
  }
  return null;
}
