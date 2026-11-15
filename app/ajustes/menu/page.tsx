import type { ReactElement } from "react";
import Link from "next/link";
import { MenuAjustes } from "@/components/MenuAjustes";
import { MeseroChrome } from "@/components/MeseroChrome";

export const dynamic = "force-dynamic";

export default function AjustesMenuPage(): ReactElement {
  return (
    <MeseroChrome rol="admin">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-800">Sale</p>
        <h1 className="mt-2 text-3xl font-semibold">Menú</h1>
        <p className="mt-2 text-neutral-700">
          Platillos por categoría. Precios en pesos; se guardan en centavos.
        </p>
      </header>
      <MenuAjustes />
      <Link href="/ajustes" className="min-h-12 text-neutral-700 underline">
        Volver a ajustes
      </Link>
    </MeseroChrome>
  );
}
