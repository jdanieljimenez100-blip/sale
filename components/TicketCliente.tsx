"use client";

import type { ReactElement } from "react";
import { AvisoPrivacidadSimplificado } from "@/components/AvisoPrivacidadSimplificado";

type PartidaVista = {
  nombre: string;
  cantidad: number;
  precioTexto: string;
  importeTexto: string;
  notas: string | null;
};

type PagoVista = {
  montoTexto: string;
  hora: string;
  transaccionUltimos4: string | null;
};

type Props = {
  negocioNombre: string;
  folio: number;
  mesa: string;
  meseroNombre: string;
  pagadoEl: string;
  partidas: PartidaVista[];
  subtotalTexto: string;
  pagosConsumo: PagoVista[];
  propinas: Array<{ montoTexto: string }>;
  propinasTexto: string;
  totalTexto: string;
};

export function TicketCliente(props: Props): ReactElement {
  return (
    <>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .ticket-sheet {
            box-shadow: none !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <main className="mx-auto flex min-h-dvh w-full max-w-[380px] flex-col gap-4 px-4 py-8">
        <article className="ticket-sheet rounded-hoja border border-linea bg-superficie p-5 font-mono text-sm text-tinta">
          <header className="border-b border-dashed border-neutral-300 pb-3 text-center">
            <h1 className="font-sans text-xl font-bold tracking-tight">
              {props.negocioNombre}
            </h1>
            <p className="mt-2 tabular-nums">Folio {props.folio}</p>
            <p className="tabular-nums">Mesa {props.mesa}</p>
            <p>Mesero: {props.meseroNombre}</p>
            <p className="mt-1 tabular-nums">{props.pagadoEl}</p>
          </header>

          <ul className="mt-4 flex flex-col gap-3">
            {props.partidas.map((p, idx) => (
              <li key={`${p.nombre}-${idx}`}>
                <div className="flex justify-between gap-2">
                  <span>
                    {p.cantidad}× {p.nombre}
                  </span>
                  <span className="tabular-nums">{p.importeTexto}</span>
                </div>
                <p className="text-xs text-neutral-500 tabular-nums">
                  @ {p.precioTexto}
                </p>
                {p.notas ? (
                  <p className="text-xs text-neutral-500">{p.notas}</p>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-dashed border-neutral-300 pt-3">
            <div className="flex justify-between font-semibold tabular-nums">
              <span>Subtotal</span>
              <span>{props.subtotalTexto}</span>
            </div>
          </div>

          {props.pagosConsumo.length > 0 ? (
            <section className="mt-4">
              <h2 className="font-sans text-[13px] font-semibold text-tinta-suave">
                Pagos
              </h2>
              <ul className="mt-2 flex flex-col gap-1">
                {props.pagosConsumo.map((p, idx) => (
                  <li
                    key={`pago-${idx}`}
                    className="flex justify-between gap-2 tabular-nums"
                  >
                    <span>
                      {p.hora}
                      {p.transaccionUltimos4
                        ? ` · …${p.transaccionUltimos4}`
                        : ""}
                    </span>
                    <span>{p.montoTexto}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {props.propinas.length > 0 ? (
            <section className="mt-4">
              <h2 className="font-sans text-[13px] font-semibold text-tinta-suave">
                Propinas
              </h2>
              <ul className="mt-2 flex flex-col gap-1">
                {props.propinas.map((p, idx) => (
                  <li
                    key={`tip-${idx}`}
                    className="flex justify-between gap-2 tabular-nums"
                  >
                    <span>Propina</span>
                    <span>{p.montoTexto}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-1 flex justify-between tabular-nums">
                <span>Total propinas</span>
                <span>{props.propinasTexto}</span>
              </div>
            </section>
          ) : null}

          <div className="mt-4 border-t-2 border-neutral-900 pt-3">
            <div className="flex justify-between text-base font-bold tabular-nums">
              <span>Total pagado</span>
              <span>{props.totalTexto}</span>
            </div>
          </div>

          <p className="mt-6 text-center font-sans text-xs text-neutral-500">
            Gracias por tu visita
          </p>
        </article>

        <button
          type="button"
          className="no-print min-h-14 rounded-2xl bg-neutral-900 text-lg font-semibold text-white"
          onClick={() => window.print()}
        >
          Imprimir / Guardar PDF
        </button>

        <div className="no-print">
          <AvisoPrivacidadSimplificado />
        </div>
      </main>
    </>
  );
}
