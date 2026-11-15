import type { ReactElement } from "react";
import type { EstadoCuenta } from "@/lib/supabase/types";

const estilos: Record<EstadoCuenta, string> = {
  pendiente: "bg-neutral-200 text-neutral-700",
  parcial: "bg-amber-200 text-amber-900",
  pagada: "bg-emerald-200 text-emerald-900",
};

const etiquetas: Record<EstadoCuenta, string> = {
  pendiente: "Pendiente",
  parcial: "Pago parcial",
  pagada: "Pagada",
};

export function EstadoBadge({
  estado,
}: {
  estado: EstadoCuenta;
}): ReactElement {
  return (
    <span
      className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ${estilos[estado]}`}
    >
      {etiquetas[estado]}
    </span>
  );
}
