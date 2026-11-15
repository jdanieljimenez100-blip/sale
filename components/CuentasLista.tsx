"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { EstadoBadge } from "@/components/EstadoBadge";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn } from "@/lib/money";
import type { CuentaRow } from "@/services/cuentas";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type CuentasResponse = { cuentas: CuentaRow[] };

export function CuentasLista(): ReactElement {
  const [cuentas, setCuentas] = useState<CuentaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<CuentasResponse>("/api/cuentas");
      setCuentas(data.cuentas);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const timer = window.setInterval(() => {
      void cargar();
    }, 2000);

    let channel: ReturnType<ReturnType<typeof getBrowserSupabase>["channel"]> | null =
      null;
    try {
      const supabase = getBrowserSupabase();
      channel = supabase
        .channel("cuentas-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cuentas" },
          () => {
            void cargar();
          },
        )
        .subscribe();
    } catch {
      // Polling cada 2 s ya cubre la demo.
    }

    return () => {
      window.clearInterval(timer);
      if (channel) {
        void getBrowserSupabase().removeChannel(channel);
      }
    };
  }, [cargar]);

  if (loading) {
    return <p className="rounded-2xl bg-white/70 p-4">Cargando cuentas…</p>;
  }
  if (error) {
    return (
      <p className="rounded-2xl bg-red-100 p-4 text-red-800">
        Error: {error}
      </p>
    );
  }
  if (cuentas.length === 0) {
    return (
      <p className="rounded-2xl bg-white/70 p-4">
        No hay mesas abiertas. Revisa el seed.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {cuentas.map((cuenta) => (
        <li key={cuenta.id}>
          <Link
            href={`/cuentas/${cuenta.id}`}
            className="flex min-h-20 items-center justify-between gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm"
          >
            <div>
              <p className="text-lg font-semibold">Mesa {cuenta.mesa}</p>
              <p className="text-sm text-neutral-600">
                {formatearMxn(cuenta.total_centavos)}
              </p>
            </div>
            <EstadoBadge estado={cuenta.estado} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
