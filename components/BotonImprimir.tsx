"use client";

import type { ReactElement } from "react";
import { Boton } from "@/components/ui/Boton";

/** Dispara el diálogo de impresión del navegador (Guardar PDF). */
export function BotonImprimir(): ReactElement {
  return (
    <Boton
      type="button"
      variante="primario"
      className="no-print"
      onClick={() => window.print()}
    >
      Guardar PDF / Imprimir
    </Boton>
  );
}
