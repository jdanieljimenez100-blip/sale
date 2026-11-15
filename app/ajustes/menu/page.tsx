import type { ReactElement } from "react";
import Link from "next/link";
import { MenuAjustes } from "@/components/MenuAjustes";
import { MeseroChrome } from "@/components/MeseroChrome";

export const dynamic = "force-dynamic";

export default function AjustesMenuPage(): ReactElement {
  return (
    <MeseroChrome rol="admin">
      <header>
        <h1 className="text-[32px] font-semibold text-tinta text-pretty">
          Menú
        </h1>
        <p className="mt-1 text-[15px] text-tinta-suave">
          Platillos por categoría. Precios en pesos; se guardan en centavos.
        </p>
      </header>
      <MenuAjustes />
      <Link
        href="/ajustes"
        className="flex min-h-12 items-center text-[15px] text-tinta-suave underline underline-offset-2"
      >
        Volver a ajustes
      </Link>
    </MeseroChrome>
  );
}
