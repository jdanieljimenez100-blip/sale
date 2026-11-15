import { QR_EXPIRATION_SECONDS } from "@/lib/money";

export type VistaQr =
  | { tipo: "activo"; segundosRestantes: number }
  | { tipo: "vencido" }
  | { tipo: "reemplazado" }
  | { tipo: "pagado" };

/** Regla de UI del QR: vencido solo si pendiente y pasaron 600 s. */
export function vistaQrCobro(input: {
  estado: "pendiente" | "pagado" | "expirado";
  createdAt: Date;
  ahora?: Date;
}): VistaQr {
  if (input.estado === "pagado") {
    return { tipo: "pagado" };
  }
  if (input.estado === "expirado") {
    return { tipo: "reemplazado" };
  }
  const ahora = input.ahora ?? new Date();
  const elapsed = Math.floor(
    (ahora.getTime() - input.createdAt.getTime()) / 1000,
  );
  const segundosRestantes = Math.max(0, QR_EXPIRATION_SECONDS - elapsed);
  if (segundosRestantes <= 0) {
    return { tipo: "vencido" };
  }
  return { tipo: "activo", segundosRestantes };
}

/**
 * Monto al regenerar un cobro de consumo: solo pendiente, y no más
 * de lo que aún falta por cobrar en la cuenta.
 */
export function montoAlRegenerarConsumo(input: {
  estado: "pendiente" | "pagado" | "expirado";
  montoCentavos: number;
  restanteCentavos: number;
}): number {
  if (input.estado !== "pendiente") {
    throw new Error("Solo se puede regenerar un QR pendiente");
  }
  if (input.restanteCentavos <= 0) {
    throw new Error("La cuenta ya está cubierta");
  }
  return Math.min(input.montoCentavos, input.restanteCentavos);
}
