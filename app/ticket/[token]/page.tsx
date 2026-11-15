import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { TicketCliente } from "@/components/TicketCliente";
import { formatearMxn } from "@/lib/money";
import { obtenerTicketPorToken } from "@/services/ticket";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Ticket",
};

type Props = { params: Promise<{ token: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function TicketPage({
  params,
}: Props): Promise<ReactElement> {
  const { token } = await params;
  if (!UUID_RE.test(token)) {
    notFound();
  }
  const ticket = await obtenerTicketPorToken(token);
  if (!ticket) {
    notFound();
  }

  return (
    <TicketCliente
      negocioNombre={ticket.negocioNombre}
      folio={ticket.folio}
      mesa={ticket.mesa}
      meseroNombre={ticket.meseroNombre}
      pagadoEl={ticket.pagadoEl}
      partidas={ticket.partidas.map((p) => ({
        ...p,
        precioTexto: formatearMxn(p.precioUnitarioCentavos),
        importeTexto: formatearMxn(p.importeCentavos),
      }))}
      subtotalTexto={formatearMxn(ticket.subtotalCentavos)}
      pagosConsumo={ticket.pagosConsumo.map((p) => ({
        montoTexto: formatearMxn(p.montoCentavos),
        hora: p.hora,
        transaccionUltimos4: p.transaccionUltimos4,
      }))}
      propinas={ticket.propinas.map((p) => ({
        montoTexto: formatearMxn(p.montoCentavos),
      }))}
      propinasTexto={formatearMxn(ticket.propinasCentavos)}
      totalTexto={formatearMxn(ticket.totalPagadoCentavos)}
    />
  );
}
