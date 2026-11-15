import type { ReactElement } from "react";
import Link from "next/link";
import { DemoTokenBar } from "@/components/DemoTokenBar";
import { MeseroChrome } from "@/components/MeseroChrome";
import { MeseroSelector } from "@/components/MeseroSelector";
import { PropinasAjustes } from "@/components/PropinasAjustes";

export default function AjustesPage(): ReactElement {
  return (
    <MeseroChrome>
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-800">Sale</p>
        <h1 className="mt-2 text-3xl font-semibold">Ajustes</h1>
        <p className="mt-2 text-neutral-700">Configurar este dispositivo</p>
      </header>
      <MeseroSelector />
      <section className="rounded-2xl bg-white/90 p-4">
        <h2 className="mb-2 text-lg font-semibold">Token de demo</h2>
        <p className="mb-3 text-sm text-neutral-600">
          Lo pide la app para cobrar y simular. En producción usa el de Vercel.
        </p>
        <DemoTokenBar />
      </section>
      <PropinasAjustes />
      <Link href="/equipo" className="min-h-12 text-emerald-900 underline">
        Equipo (meseros)
      </Link>
      <Link href="/cuentas" className="min-h-12 text-neutral-700 underline">
        Volver a mesas
      </Link>
    </MeseroChrome>
  );
}
