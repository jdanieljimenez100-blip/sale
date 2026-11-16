import type { ReactElement } from "react";
import Link from "next/link";
import { MeseroChrome } from "@/components/MeseroChrome";
import { RestaurantesLista } from "@/components/RestaurantesLista";

export const dynamic = "force-dynamic";

export default function AjustesRestaurantesPage(): ReactElement {
  return (
    <MeseroChrome rol="admin">
      <header>
        <h1 className="text-[32px] font-semibold text-tinta text-pretty">
          Restaurantes
        </h1>
        <p className="mt-1 text-[15px] text-tinta-suave">
          Crea sucursales y cambia a cuál atiendes.
        </p>
      </header>
      <RestaurantesLista />
      <Link
        href="/ajustes"
        className="flex min-h-12 items-center text-[15px] text-tinta-suave underline underline-offset-2"
      >
        Volver a ajustes
      </Link>
    </MeseroChrome>
  );
}
