"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
type CobroResponse = { cobro: Cobro };
type CrearResponse = { cobro: Cobro };
type PropinaInfo = {
  mensaje: string;
  meseroNombre: string;
  mesa: string | null;
  tieneCuentaMesero: boolean;
};

const PCTS = [10, 15, 20] as const;

export function PagadoPantalla({ cobroId }: { cobroId: string }): ReactElement {
  const router = useRouter();
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [propinaInfo, setPropinaInfo] = useState<PropinaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otra, setOtra] = useState("1");
  const [busy, setBusy] = useState(false);

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

  async function crearPropina(montoCentavos: number): Promise<void> {
    if (!cobro || !propinaInfo) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const mesa = propinaInfo.mesa ?? "?";
      const data = await apiFetch<CrearResponse>("/api/cobros", {
        method: "POST",
        withDemoToken: true,
        body: JSON.stringify({
          cuentaId: cobro.cuenta_id ?? undefined,
          meseroId: cobro.mesero_id ?? undefined,
          tipo: "propina",
          montoCentavos,
          concepto: `Propina · Mesa ${mesa} · ${propinaInfo.meseroNombre}`,
        }),
      });
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

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="rounded-3xl bg-emerald-600 px-6 py-16 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.25em]">Listo</p>
        <h1 className="mt-4 text-5xl font-bold">Pagado</h1>
        <p className="mt-4 text-2xl">{formatearMxn(cobro.monto_centavos)}</p>
      </div>

      {cobro.tipo === "consumo" ? (
        <section className="rounded-2xl bg-white/90 p-4 text-left">
          <h2 className="text-xl font-semibold">¿Propina para el mesero?</h2>
          {propinaInfo ? (
            <p className="mt-1 text-sm text-neutral-700">{propinaInfo.mensaje}</p>
          ) : null}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {PCTS.map((pct) => {
              const monto = Math.max(
                1,
                Math.round((cobro.monto_centavos * pct) / 100),
              );
              return (
                <button
                  key={pct}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void crearPropina(monto);
                  }}
                  className="min-h-14 rounded-xl bg-emerald-800 font-semibold text-white disabled:opacity-50"
                >
                  {pct}%
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Otra (centavos)
              <input
                className="min-h-12 rounded-xl border px-3"
                value={otra}
                onChange={(event) => setOtra(event.target.value)}
                inputMode="numeric"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const monto = Number.parseInt(otra, 10);
                if (Number.isInteger(monto) && monto > 0) {
                  void crearPropina(monto);
                }
              }}
              className="min-h-12 self-end rounded-xl bg-neutral-900 px-4 font-semibold text-white"
            >
              Cobrar
            </button>
          </div>
          <Link
            href={cobro.cuenta_id ? `/cuentas/${cobro.cuenta_id}` : "/cuentas"}
            className="mt-4 inline-flex min-h-12 items-center underline"
          >
            Sin propina
          </Link>
        </section>
      ) : (
        <Link href="/propinas" className="underline">
          Ver mis propinas
        </Link>
      )}

      {error ? <p className="text-red-700">{error}</p> : null}
    </div>
  );
}
