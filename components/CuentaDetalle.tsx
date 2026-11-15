"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { EstadoBadge } from "@/components/EstadoBadge";
import { apiFetch } from "@/lib/client-api";
import { etiquetaEstadoCobro, formatearMxn } from "@/lib/money";
import type { CobroRow, CuentaConDetalle } from "@/services/cuentas";

type Props = { cuentaId: string };
type CuentaResponse = { cuenta: CuentaConDetalle };
type CobrarResponse = { cobro: CobroRow };

function horaCorta(iso: string | null): string {
  if (!iso) {
    return "";
  }
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function CuentaDetalle({ cuentaId }: Props): ReactElement {
  const router = useRouter();
  const [cuenta, setCuenta] = useState<CuentaConDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<CuentaResponse>(`/api/cuentas/${cuentaId}`);
      setCuenta(data.cuenta);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }, [cuentaId]);

  useEffect(() => {
    void cargar();
    const timer = window.setInterval(() => {
      void cargar();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [cargar]);

  async function cobrarTotal(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<CobrarResponse>(
        `/api/cuentas/${cuentaId}/cobrar`,
        { method: "POST", withDemoToken: true },
      );
      router.push(`/cobros/${data.cobro.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cobrar");
      setBusy(false);
    }
  }

  if (error && !cuenta) {
    return <p className="rounded-2xl bg-red-100 p-4 text-red-800">{error}</p>;
  }
  if (!cuenta) {
    return <p className="rounded-2xl bg-white/70 p-4">Cargando mesa…</p>;
  }

  const restante = cuenta.total_centavos - cuenta.pagado_consumo_centavos;
  const propinas = cuenta.cobros.filter(
    (c) => c.tipo === "propina" && c.estado === "pagado",
  );
  const historial = cuenta.cobros.filter((c) => c.tipo === "consumo");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Mesa {cuenta.mesa}</h1>
          <p className="mt-1 text-neutral-700">{cuenta.mesero_nombre}</p>
        </div>
        <EstadoBadge estado={cuenta.estado} />
      </div>

      {cuenta.estado === "pagada" ? (
        <div className="rounded-3xl bg-emerald-700 px-5 py-8 text-center text-white">
          <p className="text-3xl font-bold">Mesa pagada ✓</p>
          {propinas.length > 0 ? (
            <ul className="mt-4 space-y-1 text-left text-sm">
              {propinas.map((p) => (
                <li key={p.id}>
                  {p.concepto}: {formatearMxn(p.monto_centavos)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-emerald-50">Sin propinas registradas.</p>
          )}
        </div>
      ) : (
        <p className="text-4xl font-bold tracking-tight">
          Falta por cobrar {formatearMxn(restante)}
        </p>
      )}

      <section className="rounded-2xl bg-white/90 p-4">
        <h2 className="mb-3 text-lg font-semibold">Partidas</h2>
        <ul className="flex flex-col gap-2">
          {cuenta.partidas.map((partida) => (
            <li key={partida.id} className="flex justify-between gap-3 text-sm">
              <span>
                {partida.cantidad}× {partida.descripcion}
              </span>
              <span>
                {formatearMxn(partida.cantidad * partida.precio_centavos)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white/90 p-4">
        <h2 className="mb-3 text-lg font-semibold">Historial de cobros</h2>
        {historial.length === 0 ? (
          <p className="text-sm text-neutral-600">Aún no hay cobros.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {historial.map((cobro) => (
              <li key={cobro.id}>
                <Link
                  href={`/cobros/${cobro.id}`}
                  className="flex min-h-12 items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 text-sm"
                >
                  <span>
                    {etiquetaEstadoCobro(cobro.estado)} ·{" "}
                    {formatearMxn(cobro.monto_centavos)}
                  </span>
                  <span className="text-neutral-500">
                    {horaCorta(cobro.pagado_at ?? cobro.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <p className="rounded-2xl bg-red-100 p-3 text-red-800">{error}</p>
      ) : null}

      {cuenta.estado !== "pagada" ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy || restante <= 0}
            onClick={() => {
              void cobrarTotal();
            }}
            className="min-h-14 rounded-2xl bg-emerald-800 text-lg font-semibold text-white disabled:opacity-50"
          >
            {restante <= 0
              ? "Cuenta cubierta"
              : `Cobrar total (${formatearMxn(restante)})`}
          </button>
          <Link
            href={`/cuentas/${cuentaId}/dividir`}
            className="flex min-h-14 items-center justify-center rounded-2xl border border-emerald-800 text-lg font-semibold text-emerald-900"
          >
            Dividir cuenta
          </Link>
        </div>
      ) : null}
    </div>
  );
}
