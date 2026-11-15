"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn } from "@/lib/money";

type PorMesero = {
  meseroId: string | null;
  nombre: string;
  consumoCentavos: number;
  propinaCentavos: number;
};

type Reporte = {
  totalConsumoCentavos: number;
  totalPropinaCentavos: number;
  totalCentavos: number;
  porMesero: PorMesero[];
  cobros: Array<{ id: string; concepto: string; monto_centavos: number; tipo: string }>;
};

export function ReporteDia(): ReactElement {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<Reporte>("/api/reporte/dia");
      setReporte(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (error) {
    return <p className="rounded-2xl bg-red-100 p-4 text-red-800">{error}</p>;
  }
  if (!reporte) {
    return <p className="rounded-2xl bg-white/70 p-4">Cargando reporte…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/90 p-4">
          <p className="text-sm text-neutral-600">Consumo</p>
          <p className="text-xl font-semibold">
            {formatearMxn(reporte.totalConsumoCentavos)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/90 p-4">
          <p className="text-sm text-neutral-600">Propina</p>
          <p className="text-xl font-semibold">
            {formatearMxn(reporte.totalPropinaCentavos)}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-100 p-4">
          <p className="text-sm text-emerald-900">Total</p>
          <p className="text-xl font-semibold">
            {formatearMxn(reporte.totalCentavos)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl bg-white/90 p-4">
        <h2 className="text-lg font-semibold">Por mesero</h2>
        {reporte.porMesero.length === 0 ? (
          <p className="mt-2 text-neutral-600">Sin cobros pagados hoy.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {reporte.porMesero.map((m) => (
              <li
                key={m.meseroId ?? m.nombre}
                className="flex min-h-12 flex-col rounded-xl bg-neutral-50 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">{m.nombre}</span>
                <span>
                  Consumo {formatearMxn(m.consumoCentavos)} · Propina{" "}
                  {formatearMxn(m.propinaCentavos)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="flex flex-col gap-2">
        {reporte.cobros.map((c) => (
          <li
            key={c.id}
            className="flex min-h-12 items-center justify-between rounded-xl bg-white/80 px-3 text-sm"
          >
            <span>
              {c.tipo}: {c.concepto}
            </span>
            <span>{formatearMxn(c.monto_centavos)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
