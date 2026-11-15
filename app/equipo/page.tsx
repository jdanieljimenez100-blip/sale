import type { ReactElement } from "react";
import Link from "next/link";
import { EquipoPantalla } from "@/components/EquipoPantalla";
import { MeseroChrome } from "@/components/MeseroChrome";

export const dynamic = "force-dynamic";

export default function EquipoPage(): ReactElement {
  return (
    <MeseroChrome rol="admin">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-800">Sale</p>
        <h1 className="mt-2 text-3xl font-semibold">Equipo</h1>
        <p className="mt-2 text-neutral-700">
          Meseros del negocio. El ID de cuenta pey solo vive en el servidor.
        </p>
      </header>
      <EquipoPantalla />
      <Link href="/ajustes" className="underline">
        Ajustes
      </Link>
    </MeseroChrome>
  );
}
