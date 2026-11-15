"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn, pesosTextoACentavos } from "@/lib/money";
import { calcularMontoPropinaPorcentaje } from "@/lib/propina";
import type { Database } from "@/lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
type CobroResponse = { cobro: Cobro };
type PropinaInfo = {
  mensaje: string;
  meseroNombre: string;
  mesa: string | null;
  tieneCuentaMesero: boolean;
  porcentajes: number[];
};
type PropinaResponse =
  | { ok: true; omitida: true }
  | { cobro: Cobro; yaExistia: boolean };

export function PagadoPantalla({ cobroId }: { cobroId: string }): ReactElement {
  const router = useRouter();
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [propinaInfo, setPropinaInfo] = useState<PropinaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otra, setOtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [paso, setPaso] = useState<"propina" | "despues">("propina");

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<CobroResponse>(`/api/cobros/${cobroId}`);
        setCobro(data.cobro);
        if (data.cobro.tipo === "consumo") {
          const info = await apiFetch<PropinaInfo>(
            `/api/cobros/${cobroId}/propina-info`,
          );
          setPropinaInfo(info);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    })();
  }, [cobroId]);

  async function enviarPropina(
    body: { porcentaje: number } | { montoCentavos: number } | { ninguna: true },
  ): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<PropinaResponse>(
        `/api/cobros/${cobroId}/propina`,
        {
          method: "POST",
          withDemoToken: true,
          body: JSON.stringify(body),
        },
      );
      if ("omitida" in data) {
        setPaso("despues");
        setBusy(false);
        return;
      }
      router.push(`/cobros/${data.cobro.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear propina");
      setBusy(false);
    }
  }

  if (error && !cobro) {
    return <p className="rounded-2xl bg-red-100 p-4 text-red-800">{error}</p>;
  }
  if (!cobro) {
    return <p className="rounded-2xl bg-white/70 p-4">Confirmando pago…</p>;
  }

  if (cobro.tipo === "propina") {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="rounded-3xl bg-emerald-600 px-6 py-16 text-white shadow-lg">
          <h1 className="text-5xl font-bold">¡Gracias!</h1>
          <p className="mt-4 text-2xl">{formatearMxn(cobro.monto_centavos)}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/cuentas")}
          className="min-h-14 rounded-2xl bg-neutral-900 text-lg font-semibold text-white"
        >
          Volver a Mesas
        </button>
      </div>
    );
  }

  const porcentajes = propinaInfo?.porcentajes ?? [10, 15, 20];

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="rounded-3xl bg-emerald-600 px-6 py-16 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.25em]">Listo</p>
        <h1 className="mt-4 text-5xl font-bold">Pagado</h1>
        <p className="mt-4 text-2xl">{formatearMxn(cobro.monto_centavos)}</p>
      </div>

      {paso === "propina" ? (
        <section className="rounded-2xl bg-white/90 p-4 text-left">
          <h2 className="text-xl font-semibold">¿Propina para el mesero?</h2>
          {propinaInfo ? (
            <p className="mt-1 text-sm text-neutral-700">{propinaInfo.mensaje}</p>
          ) : null}
          <div className="mt-4 grid grid-cols-1 gap-2">
            {porcentajes.map((pct) => {
              const monto = calcularMontoPropinaPorcentaje(
                cobro.monto_centavos,
                pct,
              );
              return (
                <button
                  key={pct}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void enviarPropina({ porcentaje: pct });
                  }}
                  className="min-h-14 rounded-xl bg-emerald-800 text-base font-semibold text-white disabled:opacity-50"
                >
                  {pct}% · {formatearMxn(monto)}
                </button>
              );
            })}
          </div>
          <label className="mt-4 flex flex-col gap-1 text-sm">
            Otra cantidad (pesos)
            <input
              className="min-h-12 rounded-xl border px-3"
              value={otra}
              onChange={(event) => setOtra(event.target.value)}
              inputMode="decimal"
              placeholder="12.50"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              try {
                const monto = pesosTextoACentavos(otra);
                void enviarPropina({ montoCentavos: monto });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Monto inválido");
              }
            }}
            className="mt-2 min-h-14 w-full rounded-xl bg-neutral-900 font-semibold text-white disabled:opacity-50"
          >
            Cobrar otra cantidad
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void enviarPropina({ ninguna: true });
            }}
            className="mt-3 min-h-14 w-full rounded-xl border border-neutral-400 font-semibold"
          >
            Sin propina
          </button>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => router.push("/cuentas")}
          className="min-h-14 rounded-2xl bg-neutral-900 text-lg font-semibold text-white"
        >
          Volver a Mesas
        </button>
      )}

      {error ? <p className="text-red-700">{error}</p> : null}
    </div>
  );
}
