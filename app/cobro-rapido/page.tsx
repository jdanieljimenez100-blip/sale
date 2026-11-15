import type { ReactElement } from "react";
import Link from "next/link";
import { CobroRapidoForm } from "@/components/CobroRapidoForm";
import { DemoTokenBar } from "@/components/DemoTokenBar";

export default function CobroRapidoPage(): ReactElement {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-8">
      <Link href="/cuentas" className="text-sm underline">
        ← Cuentas
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">Cobro rápido</h1>
        <p className="mt-2 text-neutral-700">Monto libre, QR inmediato.</p>
      </header>
      <DemoTokenBar />
      <CobroRapidoForm />
    </main>
  );
}
