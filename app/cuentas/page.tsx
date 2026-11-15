import type { ReactElement } from "react";
import { CuentasLista } from "@/components/CuentasLista";
import { MeseroChrome } from "@/components/MeseroChrome";

export const dynamic = "force-dynamic";

export default function CuentasPage(): ReactElement {
  return (
    <MeseroChrome>
      <header>
        <h1 className="text-[32px] font-semibold text-tinta text-pretty">
          Mesas
        </h1>
        <p className="mt-1 text-[15px] text-tinta-suave">
          Cobro CoDi. Estados en vivo.
        </p>
      </header>
      <CuentasLista />
    </MeseroChrome>
  );
}
