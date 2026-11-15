"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn } from "@/lib/money";
import type { CobroRow, CuentaConDetalle } from "@/services/cuentas";
import { avanceDivision } from "@/services/dividir-avance";

type Props = { cuentaId: string };
type CuentaResponse = { cuenta: CuentaConDetalle };
type DividirResponse = { cobros: CobroRow[] };

export function DividirCuenta({ cuentaId }: Props): ReactElement {
  const [cuenta, setCuenta] = useState<CuentaConDetalle | null>(null);
  const [partes, setPartes] = useState("2");
  const [montosTexto, setMontosTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    const data = await apiFetch<CuentaResponse>(`/api/cuentas/${cuentaId}`);
    setCuenta(data.cuenta);
  }, [cuentaId]);

  useEffect(() => {
    void cargar().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Error");
    });
    const timer = window.setInterval(() => {
      void cargar().catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [cargar]);

  async function dividirIgual(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const n = Number.parseInt(partes, 10);
      await apiFetch<DividirResponse>(`/api/cuentas/${cuentaId}/dividir`, {
        method: "POST",
        withDemoToken: true,
        body: JSON.stringify({ modo: "igual", partes: n }),
      });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function dividirMontos(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const montosCentavos = montosTexto
        .split(",")
        .map((s) => Number.parseInt(s.trim(), 10));
      await apiFetch<DividirResponse>(`/api/cuentas/${cuentaId}/dividir`, {
        method: "POST",
        withDemoToken: true,
        body: JSON.stringify({ modo: "montos", montosCentavos }),
      });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!cuenta) {
    return <p className="rounded-2xl bg-white/70 p-4">Cargando…</p>;
  }

  const avance = avanceDivision(cuenta.cobros);
  const restante = cuenta.total_centavos - cuenta.pagado_consumo_centavos;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-semibold">Dividir mesa {cuenta.mesa}</h1>
      <p className="text-neutral-700">
        Restante {formatearMxn(restante)}. Avance: {avance.pagaron} de{" "}
        {avance.total || "—"} pagaron.
      </p>

      <section className="rounded-2xl bg-white/90 p-4">
        <label className="flex flex-col gap-2 text-sm">
          Partes iguales
          <input
            className="min-h-12 rounded-xl border px-3"
            value={partes}
            onChange={(e) => setPartes(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void dividirIgual();
          }}
          className="mt-3 min-h-14 w-full rounded-2xl bg-emerald-800 font-semibold text-white"
        >
          Crear QR por partes iguales
        </button>
      </section>

      <section className="rounded-2xl bg-white/90 p-4">
        <label className="flex flex-col gap-2 text-sm">
          Montos en centavos (separados por coma)
          <input
            className="min-h-12 rounded-xl border px-3"
            value={montosTexto}
            onChange={(e) => setMontosTexto(e.target.value)}
            placeholder="1,1"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void dividirMontos();
          }}
          className="mt-3 min-h-14 w-full rounded-2xl border border-emerald-800 font-semibold text-emerald-900"
        >
          Crear QR por montos
        </button>
      </section>

      <ul className="flex flex-col gap-2">
        {cuenta.cobros
          .filter((c) => c.tipo === "consumo")
          .map((cobro) => (
            <li key={cobro.id}>
              <Link
                href={`/cobros/${cobro.id}`}
                className="flex min-h-14 items-center justify-between rounded-2xl bg-white/90 px-4"
              >
                <span>{cobro.concepto}</span>
                <span>
                  {formatearMxn(cobro.monto_centavos)} · {cobro.estado}
                </span>
              </Link>
            </li>
          ))}
      </ul>

      {error ? <p className="text-red-700">{error}</p> : null}
    </div>
  );
}
