import type { Database } from "@/lib/supabase/types";

type CobroRow = Database["public"]["Tables"]["cobros"]["Row"];

/** Cuenta solo cobros de consumo activos (ignora expirados). */
export function avanceDivision(cobros: CobroRow[]): {
  pagaron: number;
  total: number;
} {
  const activos = cobros.filter(
    (c) => c.tipo === "consumo" && c.estado !== "expirado",
  );
  return {
    pagaron: activos.filter((c) => c.estado === "pagado").length,
    total: activos.length,
  };
}
