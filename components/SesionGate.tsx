"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { SesionProvider, type SesionYo } from "@/components/SesionContext";
import { apiFetch } from "@/lib/client-api";

export function SesionGate({
  children,
  rol,
}: {
  children: ReactNode;
  rol?: "admin";
}): ReactElement {
  const router = useRouter();
  const [yo, setYo] = useState<SesionYo | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<SesionYo>("/api/auth/yo");
        if (rol === "admin" && data.rol !== "admin") {
          router.replace("/cuentas");
          return;
        }
        setYo(data);
      } catch {
        router.replace("/entrar");
      } finally {
        setListo(true);
      }
    })();
  }, [router, rol]);

  if (!listo || !yo) {
    return <p className="rounded-2xl bg-white/70 p-4">Cargando…</p>;
  }
  return <SesionProvider yo={yo}>{children}</SesionProvider>;
}
