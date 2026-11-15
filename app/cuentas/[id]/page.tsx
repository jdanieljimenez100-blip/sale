import type { ReactElement } from "react";
import Link from "next/link";
import { CuentaDetalle } from "@/components/CuentaDetalle";
import { DemoTokenBar } from "@/components/DemoTokenBar";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CuentaPage({ params }: Props): Promise<ReactElement> {
  const { id } = await params;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-8">
      <Link href="/cuentas" className="text-sm underline">
        ← Cuentas
      </Link>
      <DemoTokenBar />
      <CuentaDetalle cuentaId={id} />
    </main>
  );
}
