import type { ReactElement } from "react";
import Link from "next/link";
import { ReporteDia } from "@/components/ReporteDia";

export default function ReportePage(): ReactElement {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-8">
      <Link href="/cuentas" className="text-sm underline">
        ← Cuentas
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">Reporte del día</h1>
        <p className="mt-2 text-neutral-700">Solo cobros confirmados por webhook.</p>
      </header>
      <ReporteDia />
    </main>
  );
}
