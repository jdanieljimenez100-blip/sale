import type { ReactElement } from "react";
import Link from "next/link";
import { DemoTokenBar } from "@/components/DemoTokenBar";
import { DividirCuenta } from "@/components/DividirCuenta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function DividirPage({
  params,
}: Props): Promise<ReactElement> {
  const { id } = await params;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-8">
      <Link href={`/cuentas/${id}`} className="text-sm underline">
        ← Cuenta
      </Link>
      <DemoTokenBar />
      <DividirCuenta cuentaId={id} />
    </main>
  );
}
