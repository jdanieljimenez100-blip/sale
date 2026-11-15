import type { ReactElement } from "react";
import { MeseroChrome } from "@/components/MeseroChrome";
import { ReporteDia } from "@/components/ReporteDia";

export default function ReportePage(): ReactElement {
  return (
    <MeseroChrome>
      <header>
        <h1 className="text-3xl font-semibold">Reporte del día</h1>
        <p className="mt-2 text-neutral-700">Solo cobros confirmados (hora CDMX).</p>
      </header>
      <ReporteDia />
    </MeseroChrome>
  );
}
