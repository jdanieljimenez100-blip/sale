"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { AvisoPrivacidadSimplificado } from "@/components/AvisoPrivacidadSimplificado";
import { TicketPagadoBloque } from "@/components/TicketPagadoBloque";
import { Boton } from "@/components/ui/Boton";
import { Monto } from "@/components/ui/Monto";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";
import { pesosTextoACentavos } from "@/lib/money";
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

type Paso = "propina" | "resena" | "listo";

function BloquePagado({
  titulo,
  centavos,
}: {
  titulo: string;
  centavos: number;
}): ReactElement {
  return (
    <div className="rounded-hoja bg-pagada-solido px-6 py-12 text-center text-white">
      <svg
        className="mx-auto"
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden
      >
        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="3" />
        <path
          className="pagado-check"
          pathLength="1"
          d="M16 29 L24 37 L40 19"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <h1 className="mt-4 text-[32px] font-bold">{titulo}</h1>
      <p className="pagado-monto mt-3 font-mesa text-[48px] font-bold leading-none tabular">
        <Monto centavos={centavos} />
      </p>
    </div>
  );
}

export function PagadoPantalla({ cobroId }: { cobroId: string }): ReactElement {
  const router = useRouter();
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [propinaInfo, setPropinaInfo] = useState<PropinaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otra, setOtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [paso, setPaso] = useState<Paso>("propina");
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [resenaEnviada, setResenaEnviada] = useState(false);

  const cobroResenaId =
    cobro?.tipo === "propina" ? cobro.cobro_origen_id : cobro?.id ?? null;

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<CobroResponse>(`/api/cobros/${cobroId}`);
        setCobro(data.cobro);
        if (data.cobro.tipo === "propina") {
          setPaso("resena");
          const origenId = data.cobro.cobro_origen_id;
          if (origenId) {
            const info = await apiFetch<PropinaInfo>(
              `/api/cobros/${origenId}/propina-info`,
            );
            setPropinaInfo(info);
          }
          return;
        }
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
        setPaso("resena");
        setBusy(false);
        return;
      }
      router.push(`/cobros/${data.cobro.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear propina");
      setBusy(false);
    }
  }

  async function enviarResena(): Promise<void> {
    if (!cobroResenaId || estrellas < 1) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/cobros/${cobroResenaId}/resena`, {
        method: "POST",
        withDemoToken: true,
        body: JSON.stringify({
          estrellas,
          comentario: comentario.trim() || null,
        }),
      });
      setResenaEnviada(true);
      setPaso("listo");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar la reseña",
      );
    } finally {
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
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const meseroNombre = propinaInfo?.meseroNombre ?? "el mesero";
  const porcentajes = propinaInfo?.porcentajes ?? [10, 15, 20];

  const bloqueResena =
    paso === "resena" && cobroResenaId ? (
      <section className="rounded-hoja border border-linea bg-superficie p-4 text-left">
        <h2 className="text-[22px] font-semibold text-tinta text-pretty">
          ¿Cómo te atendió {meseroNombre}?
        </h2>
        <div
          className="mt-4 flex justify-center gap-2"
          role="group"
          aria-label="Calificación"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} de 5 estrellas`}
              aria-pressed={estrellas === n}
              disabled={busy}
              onClick={() => setEstrellas(n)}
              className={`pressable flex min-h-14 min-w-14 items-center justify-center rounded-boton text-[28px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:opacity-50 ${
                estrellas >= n
                  ? "bg-parcial-bg text-parcial-fg"
                  : "bg-fondo text-tinta-suave"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <label className="mt-4 flex flex-col gap-1 text-[15px] text-tinta">
          Comentario (opcional)
          <textarea
            name="comentario"
            autoComplete="off"
            className="min-h-24 rounded-boton border border-linea px-3 py-2"
            maxLength={280}
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
            placeholder="Cuéntanos cómo te fue…"
          />
        </label>
        <AvisoPrivacidadSimplificado
          className="mt-3"
          extra="No escribas datos personales en tu comentario."
        />
        <Boton
          tamano="lg"
          className="mt-3"
          disabled={busy || estrellas < 1}
          onClick={() => {
            void enviarResena();
          }}
        >
          Enviar
        </Boton>
        <Boton
          variante="secundario"
          tamano="lg"
          className="mt-2"
          disabled={busy}
          onClick={() => setPaso("listo")}
        >
          Omitir
        </Boton>
      </section>
    ) : null;

  const bloqueTicket =
    cobro.cuenta_id != null ? (
      <TicketPagadoBloque cuentaId={cobro.cuenta_id} />
    ) : null;

  const bloqueListo =
    paso === "listo" || (cobro.tipo === "propina" && paso !== "resena") ? (
      <div className="flex flex-col gap-3">
        {resenaEnviada ? (
          <p className="rounded-hoja bg-pagada-bg p-4 text-[17px] font-medium text-pagada-fg">
            ¡Gracias por tu opinión!
          </p>
        ) : null}
        <Boton tamano="lg" onClick={() => router.push("/cuentas")}>
          Volver a Mesas
        </Boton>
      </div>
    ) : null;

  if (cobro.tipo === "propina") {
    return (
      <div className="flex flex-col gap-6 text-center">
        <BloquePagado titulo="¡Gracias!" centavos={cobro.monto_centavos} />
        {bloqueTicket}
        {bloqueResena}
        {paso === "listo" ? bloqueListo : null}
        {paso === "resena" ? (
          <button
            type="button"
            onClick={() => router.push("/cuentas")}
            className="min-h-12 text-[15px] text-tinta-suave underline underline-offset-2"
          >
            Cerrar sin calificar
          </button>
        ) : null}
        {error ? (
          <p className="text-peligro" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-center">
      <BloquePagado titulo="Pagado" centavos={cobro.monto_centavos} />

      {bloqueTicket}

      {paso === "propina" ? (
        <section className="rounded-hoja border border-linea bg-superficie p-4 text-left">
          <h2 className="text-[22px] font-semibold text-tinta text-pretty">
            ¿Propina para el mesero?
          </h2>
          {propinaInfo ? (
            <p className="mt-1 text-[15px] text-tinta-suave">
              {propinaInfo.mensaje}
            </p>
          ) : null}
          <div className="mt-4 grid grid-cols-3 gap-2">
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
                  className="pressable flex min-h-14 flex-col items-center justify-center rounded-boton bg-primario px-1 text-[15px] font-semibold text-primario-tinta hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:opacity-50"
                >
                  <span>{pct}%</span>
                  <span className="text-[13px] font-medium tabular opacity-90">
                    <Monto centavos={monto} />
                  </span>
                </button>
              );
            })}
          </div>
          <label className="mt-4 flex flex-col gap-1 text-[15px] text-tinta">
            Otra cantidad (pesos)
            <input
              name="otraPropina"
              autoComplete="off"
              className="min-h-12 rounded-boton border border-linea px-3"
              value={otra}
              onChange={(event) => setOtra(event.target.value)}
              inputMode="decimal"
              placeholder="12.50…"
            />
          </label>
          <Boton
            variante="secundario"
            tamano="lg"
            className="mt-2"
            disabled={busy}
            onClick={() => {
              try {
                const monto = pesosTextoACentavos(otra);
                void enviarPropina({ montoCentavos: monto });
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Monto inválido",
                );
              }
            }}
          >
            Cobrar otra cantidad
          </Boton>
          <Boton
            variante="secundario"
            tamano="lg"
            className="mt-3"
            disabled={busy}
            onClick={() => {
              void enviarPropina({ ninguna: true });
            }}
          >
            Sin propina
          </Boton>
        </section>
      ) : null}

      {bloqueResena}

      {paso === "listo" ? bloqueListo : null}

      {paso === "resena" ? (
        <button
          type="button"
          onClick={() => router.push("/cuentas")}
          className="min-h-12 text-[15px] text-tinta-suave underline underline-offset-2"
        >
          Cerrar sin calificar
        </button>
      ) : null}

      {error ? (
        <p className="text-peligro" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
