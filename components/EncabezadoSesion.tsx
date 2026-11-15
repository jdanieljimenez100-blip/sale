"use client";

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
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2">
        <p className="font-medium text-emerald-900">{yo.nombre}</p>
        {esAdmin ? (
          <span className="rounded-md bg-emerald-800 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            Admin
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => {
          void salir();
        }}
        className="min-h-10 rounded-xl px-3 font-semibold text-neutral-700 underline"
      >
        {esAdmin ? "Salir" : "Cambiar de mesero"}
      </button>
    </div>
  );
}
