"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { QrImage } from "@/components/QrImage";
import { apiFetch } from "@/lib/client-api";
import { QR_EXPIRATION_SECONDS, formatearMxn } from "@/lib/money";
import { beep } from "@/lib/sonido";
import type { Database } from "@/lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
type CobroResponse = { cobro: Cobro; negocioNombre?: string };
type RegenerarResponse = { cobro: Cobro };

export function CobroPantalla({
  cobroId,
  permitirSimular,
}: {
  cobroId: string;
  permitirSimular: boolean;
}): ReactElement {
  const router = useRouter();
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [negocio, setNegocio] = useState("Sale");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [segundos, setSegundos] = useState(QR_EXPIRATION_SECONDS);
  const redirected = useRef(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<CobroResponse>(`/api/cobros/${cobroId}`);
      setCobro(data.cobro);
      if (data.negocioNombre) {
        setNegocio(data.negocioNombre);
      }
      setError(null);
      if (data.cobro.estado === "pagado" && !redirected.current) {
        redirected.current = true;
        beep();
        router.push(`/cobros/${cobroId}/pagado`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }, [cobroId, router]);

  useEffect(() => {
    void cargar();
    const timer = window.setInterval(() => {
      void cargar();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [cargar]);

  useEffect(() => {
    if (!cobro) {
      return;
    }
    const tick = (): void => {
      const created = new Date(cobro.created_at).getTime();
      const restante = Math.max(
        0,
        QR_EXPIRATION_SECONDS - Math.floor((Date.now() - created) / 1000),
      );
      setSegundos(restante);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cobro]);

  async function simularPago(): Promise<void> {
    setBusy(true);
    try {
      await apiFetch("/api/dev/simular-pago", {
        method: "POST",
        withDemoToken: true,
        body: JSON.stringify({ cobroId }),
      });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo simular");
    } finally {
      setBusy(false);
    }
  }

  async function generarOtro(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<RegenerarResponse>(
        `/api/cobros/${cobroId}/regenerar`,
        { method: "POST", withDemoToken: true },
      );
      router.replace(`/cobros/${data.cobro.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar otro QR");
      setBusy(false);
    }
  }

  if (error && !cobro) {
    return <p className="rounded-2xl bg-red-100 p-4 text-red-800">{error}</p>;
  }
  if (!cobro) {
    return <p className="rounded-2xl bg-white/70 p-4">Cargando cobro…</p>;
  }

  const vencido =
    cobro.estado === "expirado" ||
    (cobro.estado === "pendiente" && segundos <= 0);

  return (
    <div className="flex flex-col gap-5 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-800">
          Escanea con la app de tu banco (CoDi)
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight">
          {formatearMxn(cobro.monto_centavos)}
        </h1>
        <p className="mt-3 text-lg text-neutral-800">{negocio}</p>
      </div>

      {vencido ? (
        <div className="rounded-2xl bg-amber-50 p-5">
          <p className="text-xl font-semibold">Este QR venció</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void generarOtro();
            }}
            className="mt-4 min-h-14 w-full rounded-2xl bg-emerald-800 text-base font-semibold text-white disabled:opacity-50"
          >
            Generar otro
          </button>
        </div>
      ) : (
        <>
          <QrImage value={cobro.qr_string} label={`QR ${cobro.concepto}`} />
          <p className="text-sm text-neutral-600">
            Vence en {Math.floor(segundos / 60)}:
            {String(segundos % 60).padStart(2, "0")}
          </p>
          <p className="text-sm text-neutral-600">
            Esperando pago… Toca la pantalla una vez para activar el sonido.
          </p>
        </>
      )}

      {error ? <p className="text-red-700">{error}</p> : null}
      {permitirSimular && !vencido ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void simularPago();
          }}
          className="min-h-14 rounded-2xl border border-dashed border-neutral-400 px-4 text-base font-semibold disabled:opacity-50"
        >
          Simular pago (solo mock)
        </button>
      ) : null}
    </div>
  );
}
