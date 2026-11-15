import { peyUlidUltimos4 } from "@/services/bitacora";
import { createServiceClient } from "@/lib/supabase/server";
import {
  formatearFechaPagoCdmx,
  formatearHoraCdmx,
  mapearPartidasTicket,
  primerNombre,
  subtotalPartidasCentavos,
  sumaPropinasCentavos,
  totalPagadoCentavos,
} from "@/lib/ticket";

export type TicketPublico = {
  negocioNombre: string;
  folio: number;
  mesa: string;
  meseroNombre: string;
  pagadoEl: string;
  partidas: Array<{
    nombre: string;
    cantidad: number;
    precioUnitarioCentavos: number;
    importeCentavos: number;
    notas: string | null;
  }>;
  subtotalCentavos: number;
  pagosConsumo: Array<{
    montoCentavos: number;
    hora: string;
    transaccionUltimos4: string | null;
  }>;
  propinas: Array<{
    montoCentavos: number;
  }>;
  propinasCentavos: number;
  totalPagadoCentavos: number;
};

export type TicketMeta = {
  token: string;
  folio: number;
};

export async function obtenerTicketPorToken(
  token: string,
): Promise<TicketPublico | null> {
  const supabase = createServiceClient();
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("cuenta_id, folio, created_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !ticket) {
    return null;
  }

  const { data: cuenta, error: cuentaError } = await supabase
    .from("cuentas")
    .select("id, mesa, mesero_id, negocio_id, estado")
    .eq("id", ticket.cuenta_id)
    .maybeSingle();
  if (cuentaError || !cuenta || cuenta.estado !== "pagada") {
    return null;
  }

  const [
    { data: negocio },
    { data: mesero },
    { data: partidas },
    { data: cobros },
  ] = await Promise.all([
    supabase.from("negocios").select("nombre").eq("id", cuenta.negocio_id).maybeSingle(),
    supabase.from("meseros").select("nombre").eq("id", cuenta.mesero_id).maybeSingle(),
    supabase
      .from("partidas")
      .select("descripcion, cantidad, precio_centavos, notas")
      .eq("cuenta_id", cuenta.id),
    supabase
      .from("cobros")
      .select(
        "tipo, estado, monto_centavos, pagado_at, pey_transaction_id, created_at",
      )
      .eq("cuenta_id", cuenta.id)
      .eq("estado", "pagado")
      .order("pagado_at", { ascending: true }),
  ]);

  const partidasCalc = (partidas ?? []).map((p) => ({
    nombre: p.descripcion,
    cantidad: p.cantidad,
    precioUnitarioCentavos: p.precio_centavos,
    notas: p.notas,
  }));
  const partidasVista = mapearPartidasTicket(partidasCalc);
  const subtotal = subtotalPartidasCentavos(partidasCalc);

  const consumos = (cobros ?? []).filter((c) => c.tipo === "consumo");
  const propinasRows = (cobros ?? []).filter((c) => c.tipo === "propina");
  const propinasCentavos = sumaPropinasCentavos(
    propinasRows.map((p) => p.monto_centavos),
  );

  const ultimaFecha =
    consumos
      .map((c) => c.pagado_at)
      .filter((v): v is string => typeof v === "string")
      .at(-1) ?? ticket.created_at;

  return {
    negocioNombre: negocio?.nombre ?? "Sale",
    folio: ticket.folio,
    mesa: cuenta.mesa,
    meseroNombre: primerNombre(mesero?.nombre ?? "Mesero"),
    pagadoEl: formatearFechaPagoCdmx(ultimaFecha),
    partidas: partidasVista,
    subtotalCentavos: subtotal,
    pagosConsumo: consumos.map((c) => ({
      montoCentavos: c.monto_centavos,
      hora: formatearHoraCdmx(c.pagado_at ?? c.created_at),
      transaccionUltimos4: peyUlidUltimos4(c.pey_transaction_id),
    })),
    propinas: propinasRows.map((p) => ({
      montoCentavos: p.monto_centavos,
    })),
    propinasCentavos,
    totalPagadoCentavos: totalPagadoCentavos(subtotal, propinasCentavos),
  };
}

export async function obtenerTicketMetaPorCuenta(
  cuentaId: string,
): Promise<TicketMeta | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("token, folio")
    .eq("cuenta_id", cuentaId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return { token: data.token, folio: data.folio };
}
