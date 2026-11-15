import type { ReactElement } from "react";
import Link from "next/link";
import { CuentaDetalle } from "@/components/CuentaDetalle";
import { MeseroChrome } from "@/components/MeseroChrome";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CuentaPage({
  params,
}: Props): Promise<ReactElement> {
  const { id } = await params;
  return (
    <MeseroChrome>
      <Link href="/cuentas" className="text-sm text-neutral-700 underline">
        ← Mesas
      </Link>
      <CuentaDetalle cuentaId={id} />
    </MeseroChrome>
  );
}
