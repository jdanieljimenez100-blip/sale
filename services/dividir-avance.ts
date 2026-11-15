import type { Database } from "@/lib/supabase/types";

type CobroRow = Database["public"]["Tables"]["cobros"]["Row"];

export function avanceDivision(cobros: CobroRow[]): {
  pagaron: number;
  total: number;
} {
  const consumo = cobros.filter((c) => c.tipo === "consumo");
  return {
    pagaron: consumo.filter((c) => c.estado === "pagado").length,
    total: consumo.length,
  };
}
