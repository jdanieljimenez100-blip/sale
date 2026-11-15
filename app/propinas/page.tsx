import type { ReactElement } from "react";
import { MeseroChrome } from "@/components/MeseroChrome";
import { PropinasLista } from "@/components/PropinasLista";

export default function PropinasPage(): ReactElement {
  return (
    <MeseroChrome>
      <header>
        <h1 className="text-3xl font-semibold">Mis propinas — Hoy</h1>
        <p className="mt-2 text-neutral-700">
          Del mesero elegido en Atiende. Solo hoy (hora CDMX).
        </p>
      </header>
      <PropinasLista />
    </MeseroChrome>
  );
}
