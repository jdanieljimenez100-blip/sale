import type { ReactElement } from "react";
import { MeseroChrome } from "@/components/MeseroChrome";
import { PropinasLista } from "@/components/PropinasLista";

export default function PropinasPage(): ReactElement {
  return (
    <MeseroChrome>
      <header>
        <h1 className="text-[32px] font-semibold text-tinta text-pretty">
          Mis propinas — Hoy
        </h1>
        <p className="mt-1 text-[15px] text-tinta-suave">
          Del mesero en sesión. Solo hoy (hora CDMX).
        </p>
      </header>
      <PropinasLista />
    </MeseroChrome>
  );
}
