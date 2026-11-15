import type { ReactElement } from "react";
import Link from "next/link";
import { PropinasLista } from "@/components/PropinasLista";

export default function PropinasPage(): ReactElement {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-8">
      <Link href="/cuentas" className="text-sm underline">
        ← Cuentas
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">Mis propinas — Hoy</h1>
        <p className="mt-2 text-neutral-700">
          Del mesero elegido en Mesas (Atiende). Solo hoy (hora CDMX).
        </p>
      </header>
      <PropinasLista />
    </main>
  );
}
