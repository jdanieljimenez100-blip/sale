import type { ReactElement } from "react";
import Link from "next/link";
import { MeseroChrome } from "@/components/MeseroChrome";
import { PropinasAjustes } from "@/components/PropinasAjustes";

export default function AjustesPage(): ReactElement {
  return (
    <MeseroChrome rol="admin">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-800">Sale</p>
        <h1 className="mt-2 text-3xl font-semibold">Ajustes</h1>
        <p className="mt-2 text-neutral-700">Solo administración</p>
      </header>
      <PropinasAjustes />
      <Link href="/ajustes/menu" className="min-h-12 text-emerald-900 underline">
        Menú
      </Link>
      <Link href="/equipo" className="min-h-12 text-emerald-900 underline">
        Equipo (meseros)
      </Link>
      <Link href="/cuentas" className="min-h-12 text-neutral-700 underline">
        Volver a mesas
      </Link>
    </MeseroChrome>
  );
}
