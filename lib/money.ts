/** Montos de la app siempre en centavos enteros. */

export function centavosAPesos(centavos: number): number {
  if (!Number.isInteger(centavos)) {
    throw new Error("El monto debe ser un entero en centavos");
  }
  if (centavos < 0) {
    throw new Error("El monto no puede ser negativo");
  }
  return centavos / 100;
}

export function pesosACentavos(pesos: number): number {
  if (!Number.isFinite(pesos) || pesos < 0) {
    throw new Error("Monto en pesos inválido");
  }
  return Math.round(pesos * 100);
}

/**
 * Convierte texto de pesos ("12.50", "12,50", "12") a centavos
 * sin usar aritmética de flotantes.
 */
export function pesosTextoACentavos(texto: string): number {
  const limpio = texto.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(limpio)) {
    throw new Error("Escribe un monto en pesos, por ejemplo 12.50");
  }
  const partes = limpio.split(".");
  const enteros = partes[0] ?? "0";
  const decimales = partes[1] ?? "";
  const pesosEnteros = Number.parseInt(enteros, 10);
  if (!Number.isInteger(pesosEnteros) || pesosEnteros < 0) {
    throw new Error("Monto inválido");
  }
  const cents = (decimales + "00").slice(0, 2);
  const fraccion = Number.parseInt(cents, 10);
  return pesosEnteros * 100 + fraccion;
}

export function formatearMxn(centavos: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(centavosAPesos(centavos));
}

export const QR_EXPIRATION_SECONDS = 600;

export function etiquetaEstadoCobro(
  estado: "pendiente" | "pagado" | "expirado",
): string {
  if (estado === "pagado") {
    return "Pagado";
  }
  if (estado === "expirado") {
    return "Reemplazado";
  }
  return "Esperando pago";
}
