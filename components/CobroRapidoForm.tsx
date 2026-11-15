"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Monto } from "@/components/ui/Monto";
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

  const previewCentavos = ((): number => {
    if (!pesos.trim()) {
      return 0;
    }
    try {
      return pesosTextoACentavos(pesos);
    } catch {
      return 0;
    }
  })();

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
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="flex flex-col gap-4 pb-24"
    >
      <label className="flex flex-col gap-2 text-[15px] text-tinta">
        Monto en pesos
        <input
          name="monto"
          autoComplete="off"
          className="min-h-14 rounded-boton border border-linea bg-superficie px-4 font-mesa text-[32px] font-bold tabular text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          value={pesos}
          onChange={(e) => setPesos(e.target.value)}
          inputMode="decimal"
          placeholder="0.01…"
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-[15px] text-tinta">
        Concepto
        <input
          name="concepto"
          autoComplete="off"
          className="min-h-14 rounded-boton border border-linea bg-superficie px-4 text-[17px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          required
        />
      </label>
      {error ? (
        <p className="text-peligro" role="alert">
          {error}
        </p>
      ) : null}
      <div
        className="barra-accion-fija fixed inset-x-0 z-30 mx-auto max-w-lg bg-superficie px-4 pt-2"
        style={{
          bottom: "calc(4rem + env(safe-area-inset-bottom))",
        }}
      >
        <Boton type="submit" tamano="lg" disabled={busy || previewCentavos <= 0}>
          {previewCentavos > 0 ? (
            <>
              Cobrar <Monto centavos={previewCentavos} />
            </>
          ) : (
            "Cobrar"
          )}
        </Boton>
      </div>
    </form>
  );
}
