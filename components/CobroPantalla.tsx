"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { QrImage } from "@/components/QrImage";
import { Boton } from "@/components/ui/Boton";
import { Monto } from "@/components/ui/Monto";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";
import { QR_EXPIRATION_SECONDS } from "@/lib/money";
import { vistaQrCobro } from "@/lib/qr-estado";
import { beep } from "@/lib/sonido";
import type { Database } from "@/lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
type CobroResponse = { cobro: Cobro; negocioNombre?: string };
type RegenerarResponse = { cobro: Cobro };

type WakeLockSentinelLike = {
  release: () => Promise<void>;
};

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
  const [ahora, setAhora] = useState(() => new Date());
  const redirected = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

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
    const id = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const vistaActiva =
    cobro != null &&
    vistaQrCobro({
      estado: cobro.estado,
      createdAt: new Date(cobro.created_at),
      ahora,
    }).tipo === "activo";

  useEffect(() => {
    let cancelled = false;

    async function adquirir(): Promise<void> {
      const nav = navigator as Navigator & {
        wakeLock?: {
          request: (type: "screen") => Promise<WakeLockSentinelLike>;
        };
      };
      if (!vistaActiva || !nav.wakeLock) {
        return;
      }
      try {
        const sentinel = await nav.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
      } catch {
        // Feature no disponible o denegada: no-op.
      }
    }

    async function liberar(): Promise<void> {
      const actual = wakeLockRef.current;
      wakeLockRef.current = null;
      if (actual) {
        try {
          await actual.release();
        } catch {
          // ignore
        }
      }
    }

    if (vistaActiva) {
      void adquirir();
    } else {
      void liberar();
    }

    function onVisibility(): void {
      if (document.visibilityState === "visible" && vistaActiva) {
        void adquirir();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void liberar();
    };
  }, [vistaActiva]);

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
      setError(
        err instanceof Error ? err.message : "No se pudo generar otro QR",
      );
      setBusy(false);
    }
  }

  if (error && !cobro) {
    return (
      <p className="rounded-hoja bg-peligro/10 p-4 text-peligro" role="alert">
        {error}
      </p>
    );
  }
  if (!cobro) {
    return (
      <div className="flex flex-col items-center gap-4" aria-busy="true">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-72 w-72" />
      </div>
    );
  }

  const vista = vistaQrCobro({
    estado: cobro.estado,
    createdAt: new Date(cobro.created_at),
    ahora,
  });

  const pctVencimiento =
    vista.tipo === "activo"
      ? Math.max(
          0,
          Math.min(100, (vista.segundosRestantes / QR_EXPIRATION_SECONDS) * 100),
        )
      : 0;

  return (
    <div className="flex flex-col gap-5 bg-superficie text-center">
      <div>
        <h1 className="font-mesa text-[48px] font-bold leading-none tabular text-tinta">
          <Monto centavos={cobro.monto_centavos} />
        </h1>
        <p className="mt-3 text-[17px] text-tinta-suave">{negocio}</p>
        <p className="mt-1 text-[15px] text-tinta-suave">
          Escanea con la app de tu banco (CoDi)
        </p>
      </div>

      {vista.tipo === "reemplazado" ? (
        <div className="rounded-hoja border border-linea bg-fondo p-5">
          <p className="text-[22px] font-semibold text-tinta">
            Este QR fue reemplazado
          </p>
          <Boton
            tamano="lg"
            className="mt-4"
            onClick={() => {
              if (cobro.cuenta_id) {
                router.push(`/cuentas/${cobro.cuenta_id}`);
              } else {
                router.push("/cuentas");
              }
            }}
          >
            Volver a la mesa
          </Boton>
        </div>
      ) : null}

      {vista.tipo === "vencido" ? (
        <div className="rounded-hoja border border-linea bg-fondo p-5">
          <p className="text-[22px] font-semibold text-tinta">Este QR venció</p>
          <Boton
            tamano="lg"
            className="mt-4"
            disabled={busy}
            onClick={() => {
              void generarOtro();
            }}
          >
            Generar otro
          </Boton>
        </div>
      ) : null}

      {vista.tipo === "activo" ? (
        <>
          <QrImage value={cobro.qr_string} label={`QR ${cobro.concepto}`} />
          <div className="mx-auto w-full max-w-[360px]">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-linea"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={QR_EXPIRATION_SECONDS}
              aria-valuenow={vista.segundosRestantes}
              aria-label="Tiempo restante del QR"
            >
              <div
                className="h-full rounded-full bg-pagada-solido transition-[width] duration-1000 ease-linear"
                style={{ width: `${pctVencimiento}%` }}
              />
            </div>
            <p className="mt-2 text-[15px] tabular text-tinta-suave">
              Vence en {Math.floor(vista.segundosRestantes / 60)}:
              {String(vista.segundosRestantes % 60).padStart(2, "0")}
            </p>
          </div>
          <p
            className="inline-flex items-center justify-center gap-2 text-[15px] text-tinta-suave"
            aria-live="polite"
          >
            <span
              className="punto-esperando inline-block h-2 w-2 rounded-full bg-primario"
              aria-hidden
            />
            Esperando pago
          </p>
        </>
      ) : null}

      {error ? (
        <p className="text-peligro" role="alert">
          {error}
        </p>
      ) : null}
      {permitirSimular && vista.tipo === "activo" ? (
        <Boton
          variante="secundario"
          tamano="lg"
          disabled={busy}
          onClick={() => {
            void simularPago();
          }}
          className="border-dashed"
        >
          Simular pago (solo mock)
        </Boton>
      ) : null}
    </div>
  );
}
