"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn, pesosTextoACentavos } from "@/lib/money";
import type { CobroRow, CuentaConDetalle } from "@/services/cuentas";
import { avanceDivision } from "@/services/dividir-avance";

type Props = { cuentaId: string };
type CuentaResponse = { cuenta: CuentaConDetalle };
type DividirResponse = { cobros: CobroRow[] };

function partirIgual(restante: number, n: number): number[] {
  const base = Math.floor(restante / n);
  const sobra = restante - base * n;
  return Array.from({ length: n }, (_, index) =>
    index === 0 ? base + sobra : base,
  ).filter((monto) => monto > 0);
}

export function DividirCuenta({ cuentaId }: Props): ReactElement {
  const [cuenta, setCuenta] = useState<CuentaConDetalle | null>(null);
  const [partes, setPartes] = useState(2);
  const [otro, setOtro] = useState(false);
  const [otroN, setOtroN] = useState("5");
  const [montosPesos, setMontosPesos] = useState("");
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

  const restante = cuenta
    ? cuenta.total_centavos - cuenta.pagado_consumo_centavos
    : 0;
  const nEfectivo = otro ? Number.parseInt(otroN, 10) || 0 : partes;
  const preview = useMemo(() => {
    if (!cuenta || nEfectivo < 2) {
      return [];
    }
    return partirIgual(restante, nEfectivo);
  }, [cuenta, nEfectivo, restante]);

  async function crearIgual(): Promise<void> {
    if (nEfectivo < 2) {
      setError("Elige al menos 2 personas");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch<DividirResponse>(`/api/cuentas/${cuentaId}/dividir`, {
        method: "POST",
        withDemoToken: true,
        body: JSON.stringify({ modo: "igual", partes: nEfectivo }),
      });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function crearMontos(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const montosCentavos = montosPesos
        .split(",")
        .map((s) => pesosTextoACentavos(s.trim()));
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
  const activos = cuenta.cobros.filter(
    (c) => c.tipo === "consumo" && c.estado !== "expirado",
  );
  const hayPendiente = cuenta.cobros.some(
    (c) => c.tipo === "consumo" && c.estado === "pendiente",
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-semibold">Dividir mesa {cuenta.mesa}</h1>
      <p className="text-neutral-700">
        Restante {formatearMxn(restante)}.
      </p>

      {avance.total > 0 ? (
        <div className="rounded-2xl bg-white/90 p-4">
          <p className="font-semibold">
            {avance.pagaron} de {avance.total} pagaron
          </p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-emerald-700"
              style={{
                width: `${avance.total ? (avance.pagaron / avance.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {hayPendiente ? (
        <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-950">
          Esto reemplaza el QR que estaba abierto.
        </p>
      ) : null}

      <section className="rounded-2xl bg-white/90 p-4">
        <p className="mb-3 text-sm font-medium">¿Entre cuántas personas?</p>
        <div className="grid grid-cols-4 gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setOtro(false);
                setPartes(n);
              }}
              className={`min-h-14 rounded-xl font-semibold ${
                !otro && partes === n
                  ? "bg-emerald-800 text-white"
                  : "border border-neutral-300"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOtro(true)}
            className={`min-h-14 rounded-xl font-semibold ${
              otro ? "bg-emerald-800 text-white" : "border border-neutral-300"
            }`}
          >
            Otro
          </button>
        </div>
        {otro ? (
          <input
            className="mt-3 min-h-12 w-full rounded-xl border px-3"
            value={otroN}
            onChange={(e) => setOtroN(e.target.value)}
            inputMode="numeric"
            placeholder="Número de personas"
          />
        ) : null}

        {preview.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm">
            {preview.map((centavos, i) => (
              <li key={`p-${i}`}>
                Persona {i + 1}: {formatearMxn(centavos)}
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void crearIgual();
          }}
          className="mt-4 min-h-14 w-full rounded-2xl bg-emerald-800 font-semibold text-white disabled:opacity-50"
        >
          Crear QR
        </button>
      </section>

      <section className="rounded-2xl bg-white/90 p-4">
        <label className="flex flex-col gap-2 text-sm">
          Montos en pesos (separados por coma)
          <input
            className="min-h-12 rounded-xl border px-3"
            value={montosPesos}
            onChange={(e) => setMontosPesos(e.target.value)}
            placeholder="0.02,0.01,0.01"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void crearMontos();
          }}
          className="mt-3 min-h-14 w-full rounded-2xl border border-emerald-800 font-semibold text-emerald-900"
        >
          Crear QR por montos
        </button>
      </section>

      <ul className="flex flex-col gap-2">
        {activos.map((cobro, index) => (
          <li key={cobro.id}>
            <Link
              href={`/cobros/${cobro.id}`}
              className="flex min-h-14 items-center justify-between rounded-2xl bg-white/90 px-4"
            >
              <span>
                Persona {index + 1} · {formatearMxn(cobro.monto_centavos)}
              </span>
              <span className="text-sm text-neutral-600">{cobro.estado}</span>
            </Link>
          </li>
        ))}
      </ul>

      {error ? <p className="text-red-700">{error}</p> : null}
    </div>
  );
}
