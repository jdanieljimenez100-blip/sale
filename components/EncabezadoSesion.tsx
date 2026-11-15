"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";

type Yo = { meseroId: string; nombre: string; rol: "mesero" | "admin" };

export function EncabezadoSesion(): ReactElement {
  const router = useRouter();
  const [yo, setYo] = useState<Yo | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setYo(await apiFetch<Yo>("/api/auth/yo"));
      } catch {
        setYo(null);
      }
    })();
  }, []);

  async function salir(): Promise<void> {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // igual redirigimos
    }
    router.replace("/entrar");
  }

  if (!yo) {
    return <div className="min-h-10" />;
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <p className="font-medium text-emerald-900">
        {yo.nombre}
        {yo.rol === "admin" ? " · Admin" : ""}
      </p>
      <button
        type="button"
        onClick={() => {
          void salir();
        }}
        className="min-h-10 rounded-xl px-3 font-semibold text-neutral-700 underline"
      >
        Cambiar de mesero
      </button>
    </div>
  );
}
