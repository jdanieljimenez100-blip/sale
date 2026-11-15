import type { ReactElement } from "react";
import Link from "next/link";
import { CuentasLista } from "@/components/CuentasLista";
import { MeseroChrome } from "@/components/MeseroChrome";
import { MeseroSelector } from "@/components/MeseroSelector";

export const dynamic = "force-dynamic";

export default function CuentasPage(): ReactElement {
  return (
    <MeseroChrome>
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-800">Sale</p>
        <h1 className="mt-2 text-3xl font-semibold">Mesas</h1>
        <p className="mt-2 text-base text-neutral-700">
          Cobro CoDi. Estados en vivo.
        </p>
      </header>
      <MeseroSelector />
      <Link href="/ajustes" className="text-sm text-emerald-900 underline">
        Ajustes del dispositivo
      </Link>
      <CuentasLista />
    </MeseroChrome>
  );
}
