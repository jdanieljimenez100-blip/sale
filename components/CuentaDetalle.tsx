"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { EstadoBadge } from "@/components/EstadoBadge";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn } from "@/lib/money";
import type { CobroRow } from "@/services/cuentas";
import type { CuentaConDetalle } from "@/services/cuentas";

type Props = { cuentaId: string };
type CuentaResponse = { cuenta: CuentaConDetalle };
type CobrarResponse = { cobro: CobroRow };

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
    return <p className="rounded-2xl bg-white/70 p-4">Cargando cuenta…</p>;
  }

  const restante = cuenta.total_centavos - cuenta.pagado_consumo_centavos;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Mesa {cuenta.mesa}</h1>
          <p className="mt-1 text-neutral-700">
            Total {formatearMxn(cuenta.total_centavos)} · Pagado{" "}
            {formatearMxn(cuenta.pagado_consumo_centavos)}
          </p>
        </div>
        <EstadoBadge estado={cuenta.estado} />
      </div>

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

      {error ? (
        <p className="rounded-2xl bg-red-100 p-3 text-red-800">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={busy || restante <= 0}
          onClick={() => {
            void cobrarTotal();
          }}
          className="min-h-14 rounded-2xl bg-emerald-800 text-lg font-semibold text-white disabled:opacity-50"
        >
          {restante <= 0 ? "Cuenta cubierta" : `Cobrar total (${formatearMxn(restante)})`}
        </button>
        <Link
          href={`/cuentas/${cuentaId}/dividir`}
          className="flex min-h-14 items-center justify-center rounded-2xl border border-emerald-800 text-lg font-semibold text-emerald-900"
        >
          Dividir cuenta
        </Link>
      </div>
    </div>
  );
}
