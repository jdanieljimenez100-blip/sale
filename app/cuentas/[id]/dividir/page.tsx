import type { ReactElement } from "react";
import Link from "next/link";
import { DividirCuenta } from "@/components/DividirCuenta";
import { MeseroChrome } from "@/components/MeseroChrome";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function DividirPage({
  params,
}: Props): Promise<ReactElement> {
  const { id } = await params;
  return (
    <MeseroChrome>
      <Link
        href={`/cuentas/${id}`}
        className="text-[15px] font-semibold text-primario underline underline-offset-2"
      >
        ← Mesa
      </Link>
      <DividirCuenta cuentaId={id} />
    </MeseroChrome>
  );
}
