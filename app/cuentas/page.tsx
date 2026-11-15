import type { ReactElement } from "react";
import Link from "next/link";
import { CuentasLista } from "@/components/CuentasLista";
import { DemoTokenBar } from "@/components/DemoTokenBar";

export const dynamic = "force-dynamic";

export default function CuentasPage(): ReactElement {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-8 pb-28">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-800">Sale</p>
        <h1 className="mt-2 text-3xl font-semibold">Cuentas</h1>
        <p className="mt-2 text-base text-neutral-700">
          Mesas abiertas con cobro CoDi. Estados en vivo.
        </p>
      </header>
      <DemoTokenBar />
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link className="underline" href="/propinas">
          Mis propinas
        </Link>
        <Link className="underline" href="/reporte">
          Reporte del día
        </Link>
        <Link className="underline" href="/cobro-rapido">
          Cobro rápido
        </Link>
      </nav>
      <CuentasLista />
      <Link
        href="/cobro-rapido"
        className="fixed bottom-6 right-6 inline-flex min-h-14 min-w-36 items-center justify-center rounded-full bg-emerald-800 px-6 text-lg font-semibold text-white shadow-lg"
      >
        Cobrar
      </Link>
    </main>
  );
}
