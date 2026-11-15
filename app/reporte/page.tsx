import type { ReactElement } from "react";
import { MeseroChrome } from "@/components/MeseroChrome";
import { ReporteDesempeno } from "@/components/ReporteDesempeno";

export default function ReportePage(): ReactElement {
  return (
    <MeseroChrome>
      <header>
        <h1 className="text-[32px] font-semibold text-tinta text-pretty">
          Reporte
        </h1>
        <p className="mt-1 text-[15px] text-tinta-suave">
          Admin ve todos; mesero ve su desempeño (hora CDMX).
        </p>
      </header>
      <ReporteDesempeno />
    </MeseroChrome>
  );
}
