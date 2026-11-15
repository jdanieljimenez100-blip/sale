"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { AbrirMesa } from "@/components/AbrirMesa";
import { EstadoBadge } from "@/components/EstadoBadge";
import { useSesion } from "@/components/SesionContext";
import { Monto } from "@/components/ui/Monto";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { EstadoCuenta } from "@/lib/supabase/types";
import type { CuentaListaItem, ResumenMesas } from "@/services/cuentas";

type CuentasResponse = {
  cuentas: CuentaListaItem[];
  cerradasHoy: CuentaListaItem[];
  resumen: ResumenMesas;
};

export function CuentasLista(): ReactElement {
  const yo = useSesion();
  const [cuentas, setCuentas] = useState<CuentaListaItem[]>([]);
  const [cerradasHoy, setCerradasHoy] = useState<CuentaListaItem[]>([]);
  const [resumen, setResumen] = useState<ResumenMesas | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "mias">(
    yo.rol === "admin" ? "todas" : "mias",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevEstados = useRef<Map<string, EstadoCuenta>>(new Map());
  const [anilloIds, setAnilloIds] = useState<Set<string>>(() => new Set());

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<CuentasResponse>("/api/cuentas");
      setCuentas(data.cuentas);
      setCerradasHoy(data.cerradasHoy ?? []);
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

    let channel: ReturnType<
      ReturnType<typeof getBrowserSupabase>["channel"]
    > | null = null;
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

  useEffect(() => {
    const prev = prevEstados.current;
    const disparados: string[] = [];
    for (const cuenta of cuentas) {
      const anterior = prev.get(cuenta.id);
      if (
        anterior !== undefined &&
        anterior !== "pagada" &&
        cuenta.estado === "pagada"
      ) {
        disparados.push(cuenta.id);
      }
      prev.set(cuenta.id, cuenta.estado);
    }
    if (disparados.length === 0) {
      return;
    }
    setAnilloIds((actual) => {
      const next = new Set(actual);
      for (const id of disparados) {
        next.add(id);
      }
      return next;
    });
    const timers = disparados.map((id) =>
      window.setTimeout(() => {
        setAnilloIds((actual) => {
          const next = new Set(actual);
          next.delete(id);
          return next;
        });
      }, 700),
    );
    return () => {
      for (const t of timers) {
        window.clearTimeout(t);
      }
    };
  }, [cuentas]);

  const visibles = useMemo(() => {
    const base =
      filtro === "mias"
        ? cuentas.filter((c) => c.mesero_id === yo.meseroId)
        : cuentas;
    const abiertas = [...base].sort((a, b) => {
      const rank = (e: string): number =>
        e === "parcial" ? 0 : e === "pendiente" ? 1 : 2;
      return rank(a.estado) - rank(b.estado) || a.mesa.localeCompare(b.mesa);
    });
    const cerradas =
      filtro === "mias"
        ? cerradasHoy.filter((c) => c.mesero_id === yo.meseroId)
        : cerradasHoy;
    return { abiertas, cerradas };
  }, [cuentas, cerradasHoy, filtro, yo.meseroId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-hoja bg-peligro/10 p-4 text-peligro" role="alert">
        {error}
      </p>
    );
  }

  const mostrarMesero = filtro === "todas";

  return (
    <div className="relative flex flex-col gap-4 pb-20">
      {resumen ? (
        <div className="rounded-hoja border border-linea bg-superficie px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[15px] font-semibold text-tinta">Por cobrar</p>
            <p className="font-mesa text-[22px] font-bold tabular text-tinta">
              <Monto centavos={resumen.porCobrarCentavos} />
            </p>
          </div>
          <p className="mt-1 text-[13px] text-tinta-suave">
            Cobrado hoy <Monto centavos={resumen.cobradoHoyCentavos} /> ·{" "}
            {resumen.mesasAbiertas}{" "}
            {resumen.mesasAbiertas === 1 ? "mesa" : "mesas"}
          </p>
        </div>
      ) : null}

      <div
        className="flex rounded-boton border border-linea bg-superficie p-1"
        role="tablist"
        aria-label="Filtro de mesas"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filtro === "mias"}
          onClick={() => setFiltro("mias")}
          className={`pressable min-h-12 flex-1 rounded-[10px] text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
            filtro === "mias"
              ? "bg-primario text-primario-tinta"
              : "text-tinta-suave hover:text-tinta"
          }`}
        >
          Mis mesas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filtro === "todas"}
          onClick={() => setFiltro("todas")}
          className={`pressable min-h-12 flex-1 rounded-[10px] text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
            filtro === "todas"
              ? "bg-primario text-primario-tinta"
              : "text-tinta-suave hover:text-tinta"
          }`}
        >
          Todas
        </button>
      </div>

      {visibles.abiertas.length === 0 ? (
        <div className="rounded-hoja border border-linea bg-superficie px-4 py-8 text-center">
          <p className="text-[17px] text-tinta">
            {filtro === "mias"
              ? "No tienes mesas abiertas"
              : "No hay mesas abiertas"}
          </p>
          <div className="mx-auto mt-4 max-w-xs">
            <AbrirMesa />
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibles.abiertas.map((cuenta) => (
            <MesaCard
              key={cuenta.id}
              cuenta={cuenta}
              mostrarMesero={mostrarMesero}
              anillo={anilloIds.has(cuenta.id)}
            />
          ))}
        </ul>
      )}

      {visibles.cerradas.length > 0 ? (
        <details className="rounded-hoja border border-linea bg-superficie">
          <summary className="min-h-12 cursor-pointer list-none px-4 py-3 text-[15px] font-semibold text-tinta marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>▸</span>
              Cerradas hoy ({visibles.cerradas.length})
            </span>
          </summary>
          <ul className="grid grid-cols-2 gap-2 border-t border-linea p-2 sm:grid-cols-3">
            {visibles.cerradas.map((cuenta) => (
              <MesaCard
                key={cuenta.id}
                cuenta={cuenta}
                mostrarMesero={mostrarMesero}
                anillo={false}
              />
            ))}
          </ul>
        </details>
      ) : null}

      {visibles.abiertas.length > 0 ? (
        <div
          className="barra-accion-fija fixed inset-x-0 z-30 mx-auto max-w-lg px-4 pt-2"
          style={{
            bottom: "calc(4rem + env(safe-area-inset-bottom))",
          }}
        >
          <AbrirMesa />
        </div>
      ) : null}
    </div>
  );
}

function MesaCard({
  cuenta,
  mostrarMesero,
  anillo,
}: {
  cuenta: CuentaListaItem;
  mostrarMesero: boolean;
  anillo: boolean;
}): ReactElement {
  const pct =
    cuenta.total_centavos > 0
      ? Math.min(
          100,
          Math.round(
            (cuenta.pagado_consumo_centavos / cuenta.total_centavos) * 100,
          ),
        )
      : 0;

  return (
    <li>
      <Link
        href={`/cuentas/${cuenta.id}`}
        className={`pressable block rounded-hoja border border-linea bg-superficie px-3 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
          anillo ? "anillo-pagada" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-mesa text-[32px] font-bold leading-none text-tinta">
            {cuenta.mesa}
          </p>
          <EstadoBadge estado={cuenta.estado} />
        </div>
        <p className="mt-2 text-[15px] font-semibold tabular text-tinta">
          <Monto centavos={cuenta.restante_centavos} /> falta
        </p>
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-linea"
          aria-hidden
        >
          <div
            className={`h-full rounded-full ${
              cuenta.estado === "pagada" ? "bg-pagada-solido" : "bg-primario"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {mostrarMesero ? (
          <p className="mt-1 truncate text-[13px] text-tinta-suave">
            {cuenta.mesero_nombre}
          </p>
        ) : null}
      </Link>
    </li>
  );
}
