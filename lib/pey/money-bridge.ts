import { centavosAPesos, pesosACentavos } from "@/lib/money";

/** Convierte centavos de Sale al amount que espera pey (MXN pesos). */
export function centavosParaPey(montoCentavos: number): number {
  return centavosAPesos(montoCentavos);
}

/** Convierte amount del webhook pey (MXN) a centavos de Sale. */
export function pesosDesdePey(amountPesos: number): number {
  return pesosACentavos(amountPesos);
}
