import type { EstadoCuenta } from "@/lib/supabase/types";

export function calcularEstadoCuenta(
  totalCentavos: number,
  pagadoConsumoCentavos: number,
): EstadoCuenta {
  if (pagadoConsumoCentavos <= 0) {
    return "pendiente";
  }
  if (pagadoConsumoCentavos >= totalCentavos) {
    return "pagada";
  }
  return "parcial";
}
