import type { ReactElement } from "react";
import Link from "next/link";
import { DemoTokenBar } from "@/components/DemoTokenBar";
import { EquipoPantalla } from "@/components/EquipoPantalla";

export const dynamic = "force-dynamic";

export default function EquipoPage(): ReactElement {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-800">Sale</p>
        <h1 className="mt-2 text-3xl font-semibold">Equipo</h1>
        <p className="mt-2 text-neutral-700">
          Meseros del negocio. El ID de cuenta pey se guarda solo en el servidor.
        </p>
      </header>
      <DemoTokenBar />
      <EquipoPantalla />
      <Link href="/cuentas" className="underline">
        Volver a mesas
      </Link>
    </main>
  );
}
