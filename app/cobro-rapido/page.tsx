import type { ReactElement } from "react";
import { CobroRapidoForm } from "@/components/CobroRapidoForm";
import { MeseroChrome } from "@/components/MeseroChrome";

export default function CobroRapidoPage(): ReactElement {
  return (
    <MeseroChrome>
      <header>
        <h1 className="text-3xl font-semibold">Cobro rápido</h1>
        <p className="mt-2 text-neutral-700">Sin mesa. Monto en pesos.</p>
      </header>
      <CobroRapidoForm />
    </MeseroChrome>
  );
}
