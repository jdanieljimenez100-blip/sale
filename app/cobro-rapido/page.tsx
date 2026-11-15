import type { ReactElement } from "react";
import { CobroRapidoForm } from "@/components/CobroRapidoForm";
import { MeseroChrome } from "@/components/MeseroChrome";

export default function CobroRapidoPage(): ReactElement {
  return (
    <MeseroChrome>
      <header>
        <h1 className="text-[32px] font-semibold text-tinta text-pretty">
          Cobro rápido
        </h1>
        <p className="mt-1 text-[15px] text-tinta-suave">
          Sin mesa. Monto en pesos.
        </p>
      </header>
      <CobroRapidoForm />
    </MeseroChrome>
  );
}
