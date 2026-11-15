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
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!ticket || estadoCuenta === null) {
    return (
      <p className="rounded-2xl bg-white/70 p-4 text-sm text-neutral-600">
        Cargando ticket…
      </p>
    );
  }

  if (estadoCuenta !== "pagada" || !ticket.disponible) {
    return (
      <section className="rounded-2xl bg-white/90 p-4 text-left">
        <h2 className="text-lg font-semibold">Ticket del cliente</h2>
        <p className="mt-2 text-sm text-neutral-700">
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
    <section className="rounded-2xl bg-white/90 p-4 text-left">
      <h2 className="text-lg font-semibold">Ticket del cliente</h2>
      <p className="mt-1 text-sm text-neutral-600">Folio {ticket.folio}</p>
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
        className="mt-3 min-h-12 w-full rounded-xl border font-semibold"
      >
        {copiado ? "Enlace copiado" : "Copiar enlace"}
      </button>
    </section>
  );
}
