import type { ReactElement } from "react";
import Link from "next/link";
import { EquipoPantalla } from "@/components/EquipoPantalla";
import { MeseroChrome } from "@/components/MeseroChrome";

export const dynamic = "force-dynamic";

export default function EquipoPage(): ReactElement {
  return (
    <MeseroChrome rol="admin">
      <header>
        <h1 className="text-[32px] font-semibold text-tinta text-pretty">
          Equipo
        </h1>
        <p className="mt-1 text-[15px] text-tinta-suave">
          Meseros del negocio. El ID de cuenta pey solo vive en el servidor.
        </p>
      </header>
      <EquipoPantalla />
      <Link
        href="/ajustes"
        className="min-h-12 text-[15px] font-semibold text-primario underline underline-offset-2"
      >
        Ajustes
      </Link>
    </MeseroChrome>
  );
}
