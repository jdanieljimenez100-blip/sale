"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import { pesosTextoACentavos } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
type CrearResponse = { cobro: Cobro };
type Yo = { meseroId: string };

export function CobroRapidoForm(): ReactElement {
  const router = useRouter();
  const [pesos, setPesos] = useState("0.01");
  const [concepto, setConcepto] = useState("Cobro rápido");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const yo = await apiFetch<Yo>("/api/auth/yo");
      const montoCentavos = pesosTextoACentavos(pesos);
      if (montoCentavos <= 0) {
        throw new Error("El monto debe ser mayor a cero");
      }
      const data = await apiFetch<CrearResponse>("/api/cobros", {
        method: "POST",
        body: JSON.stringify({
          meseroId: yo.meseroId,
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
        Monto en pesos
        <input
          className="min-h-14 rounded-2xl border px-4 text-lg"
          value={pesos}
          onChange={(e) => setPesos(e.target.value)}
          inputMode="decimal"
          placeholder="0.01"
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
