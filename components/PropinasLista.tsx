"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Monto } from "@/components/ui/Monto";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";
import type { Database } from "@/lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
type Yo = { meseroId: string; nombre: string; rol: "mesero" | "admin" };
type Response = { propinas: Cobro[] };

export function PropinasLista(): ReactElement {
  const [propinas, setPropinas] = useState<Cobro[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [yo, setYo] = useState<Yo | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const sesion = await apiFetch<Yo>("/api/auth/yo");
      setYo(sesion);
      const data = await apiFetch<Response>(
        `/api/meseros/${sesion.meseroId}/propinas`,
      );
      setPropinas(data.propinas);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const timer = window.setInterval(() => {
      void cargar();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [cargar]);

  if (loading && propinas.length === 0) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (error && propinas.length === 0) {
    return (
      <p className="rounded-hoja bg-peligro/10 p-4 text-peligro" role="alert">
        {error}
      </p>
    );
  }

  const total = propinas.reduce((s, p) => s + p.monto_centavos, 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mesa text-[32px] font-bold tabular text-tinta">
        Hoy: <Monto centavos={total} />
      </p>
      {yo ? (
        <p className="text-[15px] text-tinta-suave">Propinas de {yo.nombre}</p>
      ) : null}
      {propinas.length === 0 ? (
        <p className="rounded-hoja border border-linea bg-superficie p-4 text-tinta-suave">
          Aún no hay propinas pagadas hoy.
        </p>
      ) : (
        <ul className="divide-y divide-linea rounded-hoja border border-linea bg-superficie">
          {propinas.map((p) => (
            <li
              key={p.id}
              className="flex min-h-14 items-center justify-between gap-3 px-4 text-tinta"
            >
              <span className="min-w-0 truncate">{p.concepto}</span>
              <span className="shrink-0 tabular">
                <Monto centavos={p.monto_centavos} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
