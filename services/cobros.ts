import type { RolSesion } from "@/lib/auth/sesion";
import { inicioDelDiaMexicoCity } from "@/lib/dia-mexico";
import { getServerEnv } from "@/lib/env";
import { puedeModificarMesa } from "@/lib/mesa-reglas";
import { getPeyClient } from "@/lib/pey";
import type { PeyWebhookPayload } from "@/lib/pey";
import { normalizarNumRef } from "@/lib/pey/num-ref";
import { montoAlRegenerarConsumo } from "@/lib/qr-estado";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database, TipoCobro } from "@/lib/supabase/types";
import { obtenerCuenta, recalcularEstadoCuenta } from "@/services/cuentas";
import { resolverDestinoPropina } from "@/services/propina-destino";

type CobroRow = Database["public"]["Tables"]["cobros"]["Row"];

export type CrearCobroAppInput = {
  cuentaId?: string;
  meseroId?: string;
  tipo: TipoCobro;
  montoCentavos: number;
  concepto: string;
  bankAccountId?: string;
  cobroOrigenId?: string;
  /** Texto del que se toman los dígitos para numRef de pey (p. ej. la mesa). */
  numRef?: string;
};

export async function crearCobroApp(
  input: CrearCobroAppInput,
): Promise<CobroRow> {
  if (!Number.isInteger(input.montoCentavos) || input.montoCentavos <= 0) {
    throw new Error("Monto inválido");
  }

  let bankAccountId = input.bankAccountId;
  if (!bankAccountId) {
    if (input.tipo === "propina") {
      const destino = await resolverDestinoPropina({
        meseroId: input.meseroId,
        cuentaId: input.cuentaId,
      });
      bankAccountId = destino.bankAccountId;
    } else {
      bankAccountId = getServerEnv().PEY_BANK_ACCOUNT_RESTAURANTE;
    }
  }

  const pey = getPeyClient();
  const creado = await pey.crearCobro({
    montoCentavos: input.montoCentavos,
    concepto: input.concepto,
    bankAccountId,
    numRef: normalizarNumRef(input.numRef),
  });

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("sale_insert_cobro", {
    p_cuenta_id: input.cuentaId ?? null,
    p_mesero_id: input.meseroId ?? null,
    p_tipo: input.tipo,
    p_monto_centavos: input.montoCentavos,
    p_pey_qr_id: creado.peyQrId,
    p_qr_string: creado.qrString,
    p_concepto: input.concepto,
    p_cobro_origen_id: input.cobroOrigenId ?? null,
  });

  if (error || !data) {
    throw new Error("No se pudo guardar el cobro");
  }
  return data;
}

export async function regenerarCobro(cobroId: string): Promise<CobroRow> {
  const actual = await obtenerCobro(cobroId);
  if (!actual) {
    throw new Error("Cobro no encontrado");
  }
  if (actual.estado !== "pendiente") {
    throw new Error("Solo se puede regenerar un QR pendiente");
  }

  let numRef = "1";
  let montoCentavos = actual.monto_centavos;
  if (actual.tipo === "consumo") {
    if (!actual.cuenta_id) {
      throw new Error("Cobro de consumo sin mesa");
    }
    const cuenta = await obtenerCuenta(actual.cuenta_id);
    if (!cuenta) {
      throw new Error("Cuenta no encontrada");
    }
    const restante = cuenta.total_centavos - cuenta.pagado_consumo_centavos;
    montoCentavos = montoAlRegenerarConsumo({
      estado: actual.estado,
      montoCentavos: actual.monto_centavos,
      restanteCentavos: restante,
    });
    numRef = cuenta.mesa;
  }

  const supabase = createServiceClient();
  const { error: expError } = await supabase
    .from("cobros")
    .update({ estado: "expirado" })
    .eq("id", cobroId)
    .eq("estado", "pendiente");
  if (expError) {
    throw new Error("No se pudo reemplazar el QR");
  }

  return crearCobroApp({
    cuentaId: actual.cuenta_id ?? undefined,
    meseroId: actual.mesero_id ?? undefined,
    tipo: actual.tipo,
    montoCentavos,
    concepto: actual.concepto,
    cobroOrigenId: actual.cobro_origen_id ?? undefined,
    numRef,
  });
}

export async function nombreNegocioDeCobro(
  cobro: CobroRow,
): Promise<string> {
  const supabase = createServiceClient();
  const negocioId = cobro.negocio_id;
  if (negocioId) {
    const { data: negocio } = await supabase
      .from("negocios")
      .select("nombre")
      .eq("id", negocioId)
      .maybeSingle();
    if (negocio?.nombre) {
      return negocio.nombre;
    }
  }
  return "Sale";
}

export async function obtenerCobro(cobroId: string): Promise<CobroRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cobros")
    .select("*")
    .eq("id", cobroId)
    .maybeSingle();
  if (error) {
    throw new Error("No se pudo leer el cobro");
  }
  return data;
}

export async function obtenerCobroPorPeyQrId(
  peyQrId: string,
): Promise<CobroRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cobros")
    .select("*")
    .eq("pey_qr_id", peyQrId)
    .maybeSingle();
  if (error) {
    throw new Error("No se pudo buscar el cobro");
  }
  return data;
}

export async function aplicarPagoWebhook(args: {
  eventId: string;
  payload: PeyWebhookPayload;
}): Promise<{ applied: boolean; cobroId: string | null }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("sale_mark_cobro_pagado", {
    p_pey_qr_id: args.payload.codiQrId,
    p_event_id: args.eventId,
    p_transaction_id: args.payload.transactionId,
    p_pagado_at: new Date(args.payload.datePaid * 1000).toISOString(),
  });

  if (error) {
    throw new Error("No se pudo aplicar el pago");
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("RPC sale_mark_cobro_pagado sin resultado");
  }

  if (row.applied && row.cuenta_id && row.tipo === "consumo") {
    await recalcularEstadoCuenta(row.cuenta_id);
  }

  return { applied: row.applied, cobroId: row.cobro_id };
}

export async function expirarConsumoPendiente(cuentaId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("sale_expire_consumo_pendientes", {
    p_cuenta_id: cuentaId,
  });
  if (error) {
    throw new Error("No se pudieron actualizar los cobros anteriores");
  }
  return typeof data === "number" ? data : 0;
}

export async function cobrarTotalCuenta(
  cuentaId: string,
  sesion: { meseroId: string; rol: RolSesion },
): Promise<CobroRow> {
  const cuenta = await obtenerCuenta(cuentaId);
  if (!cuenta) {
    throw new Error("Cuenta no encontrada");
  }
  puedeModificarMesa({
    rol: sesion.rol,
    sesionMeseroId: sesion.meseroId,
    cuentaMeseroId: cuenta.mesero_id,
  });
  const restante = cuenta.total_centavos - cuenta.pagado_consumo_centavos;
  if (restante <= 0) {
    throw new Error("La cuenta ya está cubierta");
  }
  await expirarConsumoPendiente(cuentaId);
  return crearCobroApp({
    cuentaId,
    meseroId: cuenta.mesero_id,
    tipo: "consumo",
    montoCentavos: restante,
    concepto: `Mesa ${cuenta.mesa} — consumo`,
    numRef: cuenta.mesa,
  });
}

export async function listarPropinasMesero(
  meseroId: string,
  negocioId: string,
): Promise<CobroRow[]> {
  const supabase = createServiceClient();
  const inicioHoy = inicioDelDiaMexicoCity();
  const { data, error } = await supabase
    .from("cobros")
    .select("*")
    .eq("negocio_id", negocioId)
    .eq("mesero_id", meseroId)
    .eq("tipo", "propina")
    .eq("estado", "pagado")
    .gte("pagado_at", inicioHoy.toISOString())
    .order("pagado_at", { ascending: false });
  if (error) {
    throw new Error("No se pudieron listar propinas");
  }
  return data;
}
