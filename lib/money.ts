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

export function formatearMxn(centavos: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(centavosAPesos(centavos));
}
