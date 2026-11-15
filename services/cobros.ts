import { getServerEnv } from "@/lib/env";
import { getPeyClient } from "@/lib/pey";
import type { PeyWebhookPayload } from "@/lib/pey";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database, TipoCobro } from "@/lib/supabase/types";
import { obtenerCuenta, recalcularEstadoCuenta } from "@/services/cuentas";

type CobroRow = Database["public"]["Tables"]["cobros"]["Row"];

export type CrearCobroAppInput = {
  cuentaId?: string;
  meseroId?: string;
  tipo: TipoCobro;
  montoCentavos: number;
  concepto: string;
  bankAccountId?: string;
};

export async function crearCobroApp(
  input: CrearCobroAppInput,
): Promise<CobroRow> {
  if (!Number.isInteger(input.montoCentavos) || input.montoCentavos <= 0) {
    throw new Error("Monto inválido");
  }

  const env = getServerEnv();
  const bankAccountId =
    input.bankAccountId ??
    (input.tipo === "propina"
      ? env.PEY_BANK_ACCOUNT_MESERO
      : env.PEY_BANK_ACCOUNT_RESTAURANTE);

  const pey = getPeyClient();
  const creado = await pey.crearCobro({
    montoCentavos: input.montoCentavos,
    concepto: input.concepto,
    bankAccountId,
    numRef: input.cuentaId?.replaceAll("-", "").slice(0, 7),
  });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cobros")
    .insert({
      cuenta_id: input.cuentaId ?? null,
      mesero_id: input.meseroId ?? null,
      tipo: input.tipo,
      monto_centavos: input.montoCentavos,
      estado: "pendiente",
      pey_qr_id: creado.peyQrId,
      qr_string: creado.qrString,
      concepto: input.concepto,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo guardar el cobro: ${error?.message ?? "sin data"}`);
  }
  return data;
}

export async function obtenerCobro(cobroId: string): Promise<CobroRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cobros")
    .select("*")
    .eq("id", cobroId)
    .maybeSingle();
  if (error) {
    throw new Error(`No se pudo leer cobro: ${error.message}`);
  }
  return data;
}

export async function aplicarPagoWebhook(args: {
  eventId: string;
  payload: PeyWebhookPayload;
}): Promise<{ applied: boolean; cobroId: string | null }> {
  const supabase = createServiceClient();

  const { data: existingEvent } = await supabase
    .from("cobros")
    .select("id")
    .eq("webhook_event_id", args.eventId)
    .maybeSingle();
  if (existingEvent) {
    return { applied: false, cobroId: existingEvent.id };
  }

  const { data: cobro, error } = await supabase
    .from("cobros")
    .select("*")
    .eq("pey_qr_id", args.payload.codiQrId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error buscando cobro: ${error.message}`);
  }
  if (!cobro) {
    // En mock el id local es peyQrId; en real el webhook usa codiQrId de Banxico.
    // Intentamos también por coincidencia exacta ya hecha; si no hay, no inventamos.
    throw new Error(`Cobro no encontrado para pey_qr_id=${args.payload.codiQrId}`);
  }

  if (cobro.estado === "pagado") {
    const { error: touchError } = await supabase
      .from("cobros")
      .update({ webhook_event_id: args.eventId })
      .eq("id", cobro.id)
      .is("webhook_event_id", null);
    if (touchError) {
      // Unique conflict = already processed
      return { applied: false, cobroId: cobro.id };
    }
    return { applied: false, cobroId: cobro.id };
  }

  const { error: updateError } = await supabase
    .from("cobros")
    .update({
      estado: "pagado",
      pey_transaction_id: args.payload.transactionId,
      webhook_event_id: args.eventId,
      pagado_at: new Date(args.payload.datePaid * 1000).toISOString(),
    })
    .eq("id", cobro.id)
    .eq("estado", "pendiente");

  if (updateError) {
    if (updateError.code === "23505") {
      return { applied: false, cobroId: cobro.id };
    }
    throw new Error(`No se pudo marcar pagado: ${updateError.message}`);
  }

  if (cobro.cuenta_id && cobro.tipo === "consumo") {
    await recalcularEstadoCuenta(cobro.cuenta_id);
  }

  return { applied: true, cobroId: cobro.id };
}

export async function cobrarTotalCuenta(cuentaId: string): Promise<CobroRow> {
  const cuenta = await obtenerCuenta(cuentaId);
  if (!cuenta) {
    throw new Error("Cuenta no encontrada");
  }
  const restante = cuenta.total_centavos - cuenta.pagado_consumo_centavos;
  if (restante <= 0) {
    throw new Error("La cuenta ya está cubierta");
  }
  return crearCobroApp({
    cuentaId,
    meseroId: cuenta.mesero_id,
    tipo: "consumo",
    montoCentavos: restante,
    concepto: `Mesa ${cuenta.mesa} — consumo`,
  });
}

export async function listarPropinasMesero(meseroId: string): Promise<CobroRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cobros")
    .select("*")
    .eq("mesero_id", meseroId)
    .eq("tipo", "propina")
    .eq("estado", "pagado")
    .order("pagado_at", { ascending: false });
  if (error) {
    throw new Error(`No se pudieron listar propinas: ${error.message}`);
  }
  return data;
}
