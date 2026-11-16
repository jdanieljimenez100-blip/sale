import type { ReactElement } from "react";
import Link from "next/link";
import { MeseroChrome } from "@/components/MeseroChrome";

export default function AjustesPage(): ReactElement {
  return (
    <MeseroChrome rol="admin">
      <header>
        <h1 className="text-[32px] font-semibold text-tinta text-pretty">
          Ajustes
        </h1>
        <p className="mt-1 text-[15px] text-tinta-suave">Solo administración</p>
      </header>
      <Link
        href="/ajustes/restaurante"
        className="flex min-h-12 items-center text-[15px] font-semibold text-primario underline underline-offset-2"
      >
        Este restaurante
      </Link>
      <Link
        href="/ajustes/menu"
        className="flex min-h-12 items-center text-[15px] font-semibold text-primario underline underline-offset-2"
      >
        Menú
      </Link>
      <Link
        href="/equipo"
        className="flex min-h-12 items-center text-[15px] font-semibold text-primario underline underline-offset-2"
      >
        Equipo (meseros)
      </Link>
      <Link
        href="/ayuda"
        className="flex min-h-12 items-center text-[15px] font-semibold text-primario underline underline-offset-2"
      >
        Ayuda
      </Link>
      <Link
        href="/cuentas"
        className="flex min-h-12 items-center text-[15px] text-tinta-suave underline underline-offset-2"
      >
        Volver a mesas
      </Link>
    </MeseroChrome>
  );
}
