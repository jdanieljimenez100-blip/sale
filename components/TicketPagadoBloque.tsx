"use client";

import { useEffect, useState, type ReactElement } from "react";
import { QrImage } from "@/components/QrImage";
import { apiFetch } from "@/lib/client-api";

type TicketApi =
  | { disponible: true; token: string; folio: number }
  | { disponible: false; mensaje: string };

type CuentaLite = {
  cuenta: { estado: string };
};

export function TicketPagadoBloque({
  cuentaId,
}: {
  cuentaId: string;
}): ReactElement {
  const [ticket, setTicket] = useState<TicketApi | null>(null);
  const [estadoCuenta, setEstadoCuenta] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [cuentaData, ticketData] = await Promise.all([
          apiFetch<CuentaLite>(`/api/cuentas/${cuentaId}`),
          apiFetch<TicketApi>(`/api/cuentas/${cuentaId}/ticket`),
        ]);
        if (!cancelled) {
          setEstadoCuenta(cuentaData.cuenta.estado);
          setTicket(ticketData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cuentaId]);

  if (error) {
    return (
      <p className="text-[15px] text-peligro" role="alert">
        {error}
      </p>
    );
  }

  if (!ticket || estadoCuenta === null) {
    return (
      <p className="rounded-hoja border border-linea bg-superficie p-4 text-[15px] text-tinta-suave">
        Cargando ticket…
      </p>
    );
  }

  if (estadoCuenta !== "pagada" || !ticket.disponible) {
    return (
      <section className="rounded-hoja border border-linea bg-superficie p-4 text-left">
        <h2 className="text-[17px] font-semibold text-tinta">
          Ticket del cliente
        </h2>
        <p className="mt-2 text-[15px] text-tinta-suave">
          El ticket aparece cuando la mesa quede pagada
        </p>
      </section>
    );
  }

  const url = `${origin}/ticket/${ticket.token}`;

  async function copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se pudo copiar el enlace");
    }
  }

  return (
    <section className="rounded-hoja border border-linea bg-superficie p-4 text-left">
      <h2 className="text-[17px] font-semibold text-tinta">
        Ticket del cliente
      </h2>
      <p className="mt-1 text-[15px] text-tinta-suave">Folio {ticket.folio}</p>
      {origin ? (
        <div className="mt-3">
          <QrImage value={url} label={`Ticket folio ${ticket.folio}`} />
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => {
          void copiar();
        }}
        className="pressable mt-3 min-h-12 w-full rounded-boton border border-linea font-semibold text-tinta"
      >
        {copiado ? "Enlace copiado" : "Copiar enlace"}
      </button>
    </section>
  );
}
