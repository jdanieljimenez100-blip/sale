"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { QrImage } from "@/components/QrImage";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn } from "@/lib/money";
import { beep } from "@/lib/sonido";
import type { Database } from "@/lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
type CobroResponse = { cobro: Cobro };

export function CobroPantalla({
  cobroId,
  permitirSimular,
}: {
  cobroId: string;
  permitirSimular: boolean;
}): ReactElement {
  const router = useRouter();
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const redirected = useRef(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<CobroResponse>(`/api/cobros/${cobroId}`);
      setCobro(data.cobro);
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

  if (error && !cobro) {
    return <p className="rounded-2xl bg-red-100 p-4 text-red-800">{error}</p>;
  }
  if (!cobro) {
    return <p className="rounded-2xl bg-white/70 p-4">Cargando cobro…</p>;
  }

  return (
    <div className="flex flex-col gap-5 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-800">
          Escanea con tu banca
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {formatearMxn(cobro.monto_centavos)}
        </h1>
        <p className="mt-2 text-neutral-700">{cobro.concepto}</p>
      </div>
      <QrImage value={cobro.qr_string} label={`QR ${cobro.concepto}`} />
      <p className="text-sm text-neutral-600">
        Esperando pago… el estado solo cambia con el webhook. Toca la pantalla
        una vez para activar el sonido.
      </p>
      {error ? <p className="text-red-700">{error}</p> : null}
      {permitirSimular ? (
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
      {cobro.cuenta_id ? (
        <Link href={`/cuentas/${cobro.cuenta_id}`} className="underline">
          Volver a la cuenta
        </Link>
      ) : null}
    </div>
  );
}
