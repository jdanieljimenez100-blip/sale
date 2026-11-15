"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn } from "@/lib/money";
import { leerMeseroDevice } from "@/lib/mesero-device";
import type { Database } from "@/lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
type Response = { propinas: Cobro[] };

export function PropinasLista(): ReactElement {
  const [propinas, setPropinas] = useState<Cobro[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meseroId, setMeseroId] = useState<string | null>(null);

  useEffect(() => {
    setMeseroId(leerMeseroDevice());
  }, []);

  const cargar = useCallback(async (): Promise<void> => {
    const id = leerMeseroDevice();
    setMeseroId(id);
    if (!id) {
      setPropinas([]);
      setError("Elige quién atiende en Mesas (selector Atiende).");
      return;
    }
    try {
      const data = await apiFetch<Response>(`/api/meseros/${id}/propinas`);
      setPropinas(data.propinas);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }, []);

  useEffect(() => {
    void cargar();
    const timer = window.setInterval(() => {
      void cargar();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [cargar]);

  if (error && propinas.length === 0) {
    return <p className="rounded-2xl bg-red-100 p-4 text-red-800">{error}</p>;
  }

  const total = propinas.reduce((s, p) => s + p.monto_centavos, 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-2xl font-semibold">Hoy: {formatearMxn(total)}</p>
      {!meseroId ? (
        <p className="rounded-2xl bg-white/70 p-4">
          Elige un mesero en Mesas para ver sus propinas.
        </p>
      ) : propinas.length === 0 ? (
        <p className="rounded-2xl bg-white/70 p-4">Aún no hay propinas pagadas hoy.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {propinas.map((p) => (
            <li
              key={p.id}
              className="flex min-h-14 items-center justify-between rounded-2xl bg-white/90 px-4"
            >
              <span>{p.concepto}</span>
              <span>{formatearMxn(p.monto_centavos)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
