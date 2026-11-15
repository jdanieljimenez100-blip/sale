"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import { leerMeseroDevice } from "@/lib/mesero-device";
import type { Database } from "@/lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
type CrearResponse = { cobro: Cobro };

export function CobroRapidoForm(): ReactElement {
  const router = useRouter();
  const [centavos, setCentavos] = useState("1");
  const [concepto, setConcepto] = useState("Cobro rápido");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const meseroId = leerMeseroDevice();
      if (!meseroId) {
        throw new Error("Elige quién atiende en Mesas antes de cobrar.");
      }
      const montoCentavos = Number.parseInt(centavos, 10);
      const data = await apiFetch<CrearResponse>("/api/cobros", {
        method: "POST",
        withDemoToken: true,
        body: JSON.stringify({
          meseroId,
          tipo: "consumo",
          montoCentavos,
          concepto,
        }),
      });
      router.push(`/cobros/${data.cobro.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm">
        Monto en centavos
        <input
          className="min-h-14 rounded-2xl border px-4 text-lg"
          value={centavos}
          onChange={(e) => setCentavos(e.target.value)}
          inputMode="numeric"
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Concepto
        <input
          className="min-h-14 rounded-2xl border px-4 text-lg"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          required
        />
      </label>
      {error ? <p className="text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="min-h-14 rounded-2xl bg-emerald-800 text-lg font-semibold text-white disabled:opacity-50"
      >
        Cobrar
      </button>
    </form>
  );
}
