import type { ReactElement } from "react";
import { MeseroChrome } from "@/components/MeseroChrome";
import { ReporteDesempeno } from "@/components/ReporteDesempeno";

export default function ReportePage(): ReactElement {
  return (
    <MeseroChrome>
      <header>
        <h1 className="text-3xl font-semibold">Reporte</h1>
        <p className="mt-2 text-neutral-700">
          Admin ve todos; mesero ve su desempeño (hora CDMX).
        </p>
      </header>
      <ReporteDesempeno />
    </MeseroChrome>
  );
}
