"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { EstadoBadge } from "@/components/EstadoBadge";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn } from "@/lib/money";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { CuentaListaItem, ResumenMesas } from "@/services/cuentas";

type CuentasResponse = { cuentas: CuentaListaItem[]; resumen: ResumenMesas };
type Yo = { meseroId: string; rol: "mesero" | "admin" };

export function CuentasLista(): ReactElement {
  const [cuentas, setCuentas] = useState<CuentaListaItem[]>([]);
  const [resumen, setResumen] = useState<ResumenMesas | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "mias">("mias");
  const [meseroId, setMeseroId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const yo = await apiFetch<Yo>("/api/auth/yo");
      setMeseroId(yo.meseroId);
      const data = await apiFetch<CuentasResponse>("/api/cuentas");
      setCuentas(data.cuentas);
      setResumen(data.resumen);
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
      // Polling cubre la demo.
    }

    return () => {
      window.clearInterval(timer);
      if (channel) {
        void getBrowserSupabase().removeChannel(channel);
      }
    };
  }, [cargar]);

  const visibles = useMemo(() => {
    const base =
      filtro === "mias" && meseroId
        ? cuentas.filter((c) => c.mesero_id === meseroId)
        : cuentas;
    const abiertas = base
      .filter((c) => c.estado !== "pagada")
      .sort((a, b) => {
        const rank = (e: string): number =>
          e === "parcial" ? 0 : e === "pendiente" ? 1 : 2;
        return rank(a.estado) - rank(b.estado) || a.mesa.localeCompare(b.mesa);
      });
    const cerradas = base
      .filter((c) => c.estado === "pagada")
      .sort((a, b) => a.mesa.localeCompare(b.mesa));
    return { abiertas, cerradas };
  }, [cuentas, filtro, meseroId]);

  if (loading) {
    return <p className="rounded-2xl bg-white/70 p-4">Cargando mesas…</p>;
  }
  if (error) {
    return <p className="rounded-2xl bg-red-100 p-4 text-red-800">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {resumen ? (
        <div className="grid grid-cols-3 gap-2">
          <ResumenChip label="Cobrado hoy" value={formatearMxn(resumen.cobradoHoyCentavos)} />
          <ResumenChip label="Por cobrar" value={formatearMxn(resumen.porCobrarCentavos)} />
          <ResumenChip label="Mesas abiertas" value={String(resumen.mesasAbiertas)} />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setFiltro("mias")}
          className={`min-h-12 rounded-xl text-sm font-semibold ${
            filtro === "mias" ? "bg-emerald-800 text-white" : "bg-white/80"
          }`}
        >
          Mis mesas
        </button>
        <button
          type="button"
          onClick={() => setFiltro("todas")}
          className={`min-h-12 rounded-xl text-sm font-semibold ${
            filtro === "todas" ? "bg-emerald-800 text-white" : "bg-white/80"
          }`}
        >
          Todas
        </button>
      </div>

      {visibles.abiertas.length === 0 ? (
        <p className="rounded-2xl bg-white/70 p-4">No hay mesas abiertas.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibles.abiertas.map((cuenta) => (
            <MesaCard key={cuenta.id} cuenta={cuenta} />
          ))}
        </ul>
      )}

      {visibles.cerradas.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Cerradas hoy</h2>
          <ul className="flex flex-col gap-3 opacity-90">
            {visibles.cerradas.map((cuenta) => (
              <MesaCard key={cuenta.id} cuenta={cuenta} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ResumenChip({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="rounded-2xl bg-white/90 px-2 py-3 text-center">
      <p className="text-[11px] text-neutral-600">{label}</p>
      <p className="mt-1 text-sm font-semibold sm:text-base">{value}</p>
    </div>
  );
}

function MesaCard({ cuenta }: { cuenta: CuentaListaItem }): ReactElement {
  const pct =
    cuenta.total_centavos > 0
      ? Math.min(
          100,
          Math.round((cuenta.pagado_consumo_centavos / cuenta.total_centavos) * 100),
        )
      : 0;
  return (
    <li>
      <Link
        href={`/cuentas/${cuenta.id}`}
        className="block rounded-2xl bg-white/90 px-4 py-3 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Mesa {cuenta.mesa}</p>
            <p className="text-sm text-neutral-600">{cuenta.mesero_nombre}</p>
          </div>
          <EstadoBadge estado={cuenta.estado} />
        </div>
        <p className="mt-2 text-sm">
          Falta {formatearMxn(cuenta.restante_centavos)} de{" "}
          {formatearMxn(cuenta.total_centavos)}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-emerald-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Link>
    </li>
  );
}
