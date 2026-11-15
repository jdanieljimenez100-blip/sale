"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { Boton } from "@/components/ui/Boton";
import { Monto } from "@/components/ui/Monto";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";
import { pesosTextoACentavos } from "@/lib/money";
import type { CobroRow, CuentaConDetalle } from "@/services/cuentas";
import { avanceDivision } from "@/services/dividir-avance";

type Props = { cuentaId: string };
type CuentaResponse = { cuenta: CuentaConDetalle };
type DividirResponse = { cobros: CobroRow[] };

function partirIgual(restante: number, n: number): number[] {
  const base = Math.floor(restante / n);
  const sobra = restante - base * n;
  return Array.from({ length: n }, (_, index) =>
    index === 0 ? base + sobra : base,
  ).filter((monto) => monto > 0);
}

export function DividirCuenta({ cuentaId }: Props): ReactElement {
  const [cuenta, setCuenta] = useState<CuentaConDetalle | null>(null);
  const [partes, setPartes] = useState(2);
  const [otro, setOtro] = useState(false);
  const [otroN, setOtroN] = useState("5");
  const [montosPesos, setMontosPesos] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    const data = await apiFetch<CuentaResponse>(`/api/cuentas/${cuentaId}`);
    setCuenta(data.cuenta);
  }, [cuentaId]);

  useEffect(() => {
    void cargar().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Error");
    });
    const timer = window.setInterval(() => {
      void cargar().catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [cargar]);

  const restante = cuenta
    ? cuenta.total_centavos - cuenta.pagado_consumo_centavos
    : 0;
  const nEfectivo = otro ? Number.parseInt(otroN, 10) || 0 : partes;
  const preview = useMemo(() => {
    if (!cuenta || nEfectivo < 2) {
      return [];
    }
    return partirIgual(restante, nEfectivo);
  }, [cuenta, nEfectivo, restante]);

  async function crearIgual(): Promise<void> {
    if (nEfectivo < 2) {
      setError("Elige al menos 2 personas");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch<DividirResponse>(`/api/cuentas/${cuentaId}/dividir`, {
        method: "POST",
        withDemoToken: true,
        body: JSON.stringify({ modo: "igual", partes: nEfectivo }),
      });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function crearMontos(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const montosCentavos = montosPesos
        .split(",")
        .map((s) => pesosTextoACentavos(s.trim()));
      await apiFetch<DividirResponse>(`/api/cuentas/${cuentaId}/dividir`, {
        method: "POST",
        withDemoToken: true,
        body: JSON.stringify({ modo: "montos", montosCentavos }),
      });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!cuenta) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const avance = avanceDivision(cuenta.cobros);
  const activos = cuenta.cobros.filter(
    (c) => c.tipo === "consumo" && c.estado !== "expirado",
  );
  const hayPendiente = cuenta.cobros.some(
    (c) => c.tipo === "consumo" && c.estado === "pendiente",
  );
  const montoPorPersona =
    preview.length > 0 ? preview[0] ?? 0 : Math.floor(restante / Math.max(nEfectivo, 1));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[32px] font-semibold text-tinta text-pretty">
        Dividir mesa {cuenta.mesa}
      </h1>
      <p className="text-tinta-suave">
        Restante <Monto centavos={restante} />.
      </p>

      {avance.total > 0 ? (
        <div className="rounded-hoja border border-linea bg-superficie p-4">
          <p className="font-semibold text-tinta">
            {avance.pagaron} de {avance.total} pagaron
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-linea">
            <div
              className="h-full rounded-full bg-pagada-solido"
              style={{
                width: `${avance.total ? (avance.pagaron / avance.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {hayPendiente ? (
        <p className="rounded-boton bg-parcial-bg px-3 py-2 text-[15px] text-parcial-fg">
          Esto reemplaza el QR que estaba abierto.
        </p>
      ) : null}

      <section className="rounded-hoja border border-linea bg-superficie p-4">
        <p className="mb-3 text-[15px] font-medium text-tinta">
          ¿Entre cuántas personas?
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[2, 3, 4].map((n) => {
            const monto = partirIgual(restante, n)[0] ?? 0;
            return (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setOtro(false);
                  setPartes(n);
                }}
                className={`pressable flex min-h-14 flex-col items-center justify-center rounded-boton text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
                  !otro && partes === n
                    ? "bg-primario text-primario-tinta"
                    : "border border-linea text-tinta"
                }`}
              >
                <span>
                  {n} · <Monto centavos={monto} />
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setOtro(true)}
            className={`pressable min-h-14 rounded-boton font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
              otro
                ? "bg-primario text-primario-tinta"
                : "border border-linea text-tinta"
            }`}
          >
            Otro
          </button>
        </div>
        {otro ? (
          <input
            name="otroN"
            autoComplete="off"
            className="mt-3 min-h-12 w-full rounded-boton border border-linea px-3"
            value={otroN}
            onChange={(e) => setOtroN(e.target.value)}
            inputMode="numeric"
            placeholder="Número de personas…"
          />
        ) : null}

        {preview.length > 0 ? (
          <ul className="mt-4 space-y-1 text-[15px] text-tinta">
            {preview.map((centavos, i) => (
              <li key={`p-${i}`}>
                Persona {i + 1}: <Monto centavos={centavos} />
              </li>
            ))}
          </ul>
        ) : nEfectivo >= 2 ? (
          <p className="mt-4 text-[15px] text-tinta-suave">
            {nEfectivo} · <Monto centavos={montoPorPersona} /> aprox.
          </p>
        ) : null}

        <Boton
          tamano="lg"
          className="mt-4"
          disabled={busy}
          onClick={() => {
            void crearIgual();
          }}
        >
          Crear QR
        </Boton>
      </section>

      <section className="rounded-hoja border border-linea bg-superficie p-4">
        <label className="flex flex-col gap-2 text-[15px] text-tinta">
          Montos en pesos (separados por coma)
          <input
            name="montosPesos"
            autoComplete="off"
            className="min-h-12 rounded-boton border border-linea px-3"
            value={montosPesos}
            onChange={(e) => setMontosPesos(e.target.value)}
            placeholder="0.02,0.01,0.01…"
          />
        </label>
        <Boton
          variante="secundario"
          tamano="lg"
          className="mt-3"
          disabled={busy}
          onClick={() => {
            void crearMontos();
          }}
        >
          Crear QR por montos
        </Boton>
      </section>

      <ul className="divide-y divide-linea rounded-hoja border border-linea bg-superficie">
        {activos.map((cobro, index) => (
          <li key={cobro.id}>
            <Link
              href={`/cobros/${cobro.id}`}
              className="pressable flex min-h-14 items-center justify-between px-4 text-tinta hover:bg-fondo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primario"
            >
              <span>
                Persona {index + 1} · <Monto centavos={cobro.monto_centavos} />
              </span>
              <span className="text-[15px] text-tinta-suave">{cobro.estado}</span>
            </Link>
          </li>
        ))}
      </ul>

      {error ? (
        <p className="text-peligro" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
