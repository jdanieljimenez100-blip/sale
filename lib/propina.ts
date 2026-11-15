import { vistaQrCobro } from "@/lib/qr-estado";

export const PROPINA_PORCENTAJES_DEFAULT = [10, 15, 20] as const;

export type DecisionPropina =
  | { tipo: "porcentaje"; porcentaje: number; montoCentavos: number }
  | { tipo: "monto"; montoCentavos: number }
  | { tipo: "ninguna" };

/** Qué hacer con una propina ya ligada al consumo (ignorando expiradas). */
export type AccionPropinaExistente =
  | { accion: "crear" }
  | { accion: "devolver"; cobroId: string }
  | { accion: "regenerar"; cobroId: string };

export function decidirReusoPropina(input: {
  existente: {
    id: string;
    estado: "pendiente" | "pagado" | "expirado";
    createdAt: string;
  } | null;
  ahora?: Date;
}): AccionPropinaExistente {
  const row = input.existente;
  if (!row || row.estado === "expirado") {
    return { accion: "crear" };
  }
  if (row.estado === "pagado") {
    return { accion: "devolver", cobroId: row.id };
  }
  const vista = vistaQrCobro({
    estado: "pendiente",
    createdAt: new Date(row.createdAt),
    ahora: input.ahora,
  });
  if (vista.tipo === "vencido") {
    return { accion: "regenerar", cobroId: row.id };
  }
  return { accion: "devolver", cobroId: row.id };
}

export function calcularMontoPropinaPorcentaje(
  montoConsumoCentavos: number,
  porcentaje: number,
): number {
  if (!Number.isInteger(montoConsumoCentavos) || montoConsumoCentavos <= 0) {
    throw new Error("Monto de consumo inválido");
  }
  if (!Number.isInteger(porcentaje) || porcentaje < 1 || porcentaje > 50) {
    throw new Error("Porcentaje inválido");
  }
  return Math.max(1, Math.round((montoConsumoCentavos * porcentaje) / 100));
}

export function resolverDecisionPropina(input: {
  montoConsumoCentavos: number;
  porcentajesPermitidos: readonly number[];
  porcentaje?: number;
  montoCentavos?: number;
  ninguna?: boolean;
}): DecisionPropina {
  if (input.ninguna === true) {
    return { tipo: "ninguna" };
  }

  if (input.porcentaje !== undefined) {
    if (!input.porcentajesPermitidos.includes(input.porcentaje)) {
      throw new Error("Ese porcentaje de propina no está permitido");
    }
    return {
      tipo: "porcentaje",
      porcentaje: input.porcentaje,
      montoCentavos: calcularMontoPropinaPorcentaje(
        input.montoConsumoCentavos,
        input.porcentaje,
      ),
    };
  }

  if (input.montoCentavos !== undefined) {
    if (!Number.isInteger(input.montoCentavos) || input.montoCentavos < 1) {
      throw new Error("La propina debe ser al menos 1 centavo");
    }
    if (input.montoCentavos > input.montoConsumoCentavos) {
      throw new Error("La propina no puede ser mayor al consumo");
    }
    return { tipo: "monto", montoCentavos: input.montoCentavos };
  }

  throw new Error("Indica porcentaje, monto o ninguna");
}
