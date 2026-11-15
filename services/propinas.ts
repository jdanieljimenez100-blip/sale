import { resolverDecisionPropina } from "@/lib/propina";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { crearCobroApp, obtenerCobro } from "@/services/cobros";
import { porcentajesPropinaPorCuenta } from "@/services/negocios";
import { resolverDestinoPropina } from "@/services/propina-destino";

type CobroRow = Database["public"]["Tables"]["cobros"]["Row"];

export type ResultadoPropina =
  | { omitida: true }
  | { cobro: CobroRow; yaExistia: boolean };

export async function crearPropinaDesdeConsumo(input: {
  cobroConsumoId: string;
  porcentaje?: number;
  montoCentavos?: number;
  ninguna?: boolean;
}): Promise<ResultadoPropina> {
  const consumo = await obtenerCobro(input.cobroConsumoId);
  if (!consumo) {
    throw new Error("Cobro no encontrado");
  }
  if (consumo.tipo !== "consumo") {
    throw new Error("La propina solo aplica a un pago de consumo");
  }
  if (consumo.estado !== "pagado") {
    throw new Error("El consumo aún no está pagado");
  }

  const decision = resolverDecisionPropina({
    montoConsumoCentavos: consumo.monto_centavos,
    porcentajesPermitidos: await porcentajesPropinaPorCuenta(consumo.cuenta_id),
    porcentaje: input.porcentaje,
    montoCentavos: input.montoCentavos,
    ninguna: input.ninguna,
  });

  if (decision.tipo === "ninguna") {
    return { omitida: true };
  }

  const supabase = createServiceClient();
  const { data: existente } = await supabase
    .from("cobros")
    .select("*")
    .eq("tipo", "propina")
    .eq("cobro_origen_id", consumo.id)
    .maybeSingle();
  if (existente) {
    return { cobro: existente, yaExistia: true };
  }

  const destino = await resolverDestinoPropina({
    meseroId: consumo.mesero_id,
    cuentaId: consumo.cuenta_id,
  });
  const mesa = destino.mesa ?? "?";
  const concepto = `Propina · Mesa ${mesa} · ${destino.meseroNombre}`;

  const cobro = await crearCobroApp({
    cuentaId: consumo.cuenta_id ?? undefined,
    meseroId: consumo.mesero_id ?? undefined,
    tipo: "propina",
    montoCentavos: decision.montoCentavos,
    concepto,
    cobroOrigenId: consumo.id,
    numRef: mesa,
  });

  return { cobro, yaExistia: false };
}
