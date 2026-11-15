import type { ReactElement } from "react";
import type { EstadoCuenta } from "@/lib/supabase/types";

const estilos: Record<EstadoCuenta, string> = {
  pendiente: "bg-pendiente-bg text-pendiente-fg",
  parcial: "bg-parcial-bg text-parcial-fg",
  pagada: "bg-pagada-bg text-pagada-fg",
};

const etiquetas: Record<EstadoCuenta, string> = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  pagada: "Pagada",
};

function FormaEstado({ estado }: { estado: EstadoCuenta }): ReactElement {
  if (estado === "pagada") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <circle cx="5" cy="5" r="4.5" fill="currentColor" />
      </svg>
    );
  }
  if (estado === "parcial") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <circle
          cx="5"
          cy="5"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M5 1 A4 4 0 0 1 5 9 Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <circle
        cx="5"
        cy="5"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Chip({ estado }: { estado: EstadoCuenta }): ReactElement {
  return (
    <span
      className={`chip-estado inline-flex min-h-10 items-center gap-1.5 rounded-boton px-3 text-sm font-semibold ${estilos[estado]}`}
    >
      <FormaEstado estado={estado} />
      {etiquetas[estado]}
    </span>
  );
}
