"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useSesion } from "@/components/SesionContext";
import { apiFetch } from "@/lib/client-api";

export function EncabezadoSesion(): ReactElement {
  const router = useRouter();
  const yo = useSesion();
  const esAdmin = yo.rol === "admin";

  async function salir(): Promise<void> {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // igual redirigimos
    }
    router.replace("/entrar");
  }

  return (
    <header className="sticky top-0 z-30 -mx-4 flex min-h-11 items-center justify-between gap-2 border-b border-linea bg-fondo/95 px-4 py-2 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <p className="truncate font-semibold text-tinta">{yo.nombre}</p>
        {esAdmin ? (
          <span className="shrink-0 rounded-boton bg-primario px-2 py-0.5 text-[13px] font-semibold text-primario-tinta">
            Admin
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href="/ayuda"
          aria-label="Ayuda"
          className="pressable inline-flex min-h-11 min-w-11 items-center justify-center rounded-boton text-[17px] font-semibold text-tinta-suave hover:bg-superficie hover:text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        >
          ?
        </Link>
        {!esAdmin ? (
          <button
            type="button"
            onClick={() => {
              void salir();
            }}
            className="pressable min-h-11 shrink-0 rounded-boton px-3 text-[15px] font-semibold text-tinta-suave underline underline-offset-2 hover:text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            Salir
          </button>
        ) : (
          <span className="sr-only">Sesión admin</span>
        )}
      </div>
    </header>
  );
}
