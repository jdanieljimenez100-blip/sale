import {
  validarPropinaPorcentajes,
  validarRepartoCocinaPct,
} from "@/lib/negocio-propinas";
import { PROPINA_PORCENTAJES_DEFAULT } from "@/lib/propina";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type NegocioRow = Database["public"]["Tables"]["negocios"]["Row"];

const NEGOCIO_DEMO_ID = "11111111-1111-1111-1111-111111111111";

export type ConfigPropinasNegocio = {
  propinaPorcentajes: number[];
  repartoCocinaPct: number;
};

export { validarPropinaPorcentajes, validarRepartoCocinaPct };

export async function obtenerNegocioDemo(): Promise<NegocioRow> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("negocios")
    .select("*")
    .eq("id", NEGOCIO_DEMO_ID)
    .maybeSingle();
  if (error || !data) {
    throw new Error("No se encontró el negocio");
  }
  return data;
}

export async function obtenerConfigPropinasNegocio(): Promise<ConfigPropinasNegocio> {
  try {
    const negocio = await obtenerNegocioDemo();
    const porcentajes =
      negocio.propina_porcentajes?.length > 0
        ? [...negocio.propina_porcentajes]
        : [...PROPINA_PORCENTAJES_DEFAULT];
    return {
      propinaPorcentajes: porcentajes,
      repartoCocinaPct: negocio.reparto_cocina_pct ?? 0,
    };
  } catch {
    return {
      propinaPorcentajes: [...PROPINA_PORCENTAJES_DEFAULT],
      repartoCocinaPct: 0,
    };
  }
}

export async function porcentajesPropinaPorCuenta(
  cuentaId: string | null,
): Promise<number[]> {
  if (!cuentaId) {
    return [...PROPINA_PORCENTAJES_DEFAULT];
  }
  const supabase = createServiceClient();
  const { data: cuenta } = await supabase
    .from("cuentas")
    .select("negocio_id")
    .eq("id", cuentaId)
    .maybeSingle();
  if (!cuenta?.negocio_id) {
    return [...PROPINA_PORCENTAJES_DEFAULT];
  }
  const { data: negocio } = await supabase
    .from("negocios")
    .select("propina_porcentajes")
    .eq("id", cuenta.negocio_id)
    .maybeSingle();
  if (!negocio?.propina_porcentajes?.length) {
    return [...PROPINA_PORCENTAJES_DEFAULT];
  }
  return [...negocio.propina_porcentajes];
}

export async function actualizarConfigPropinas(input: {
  propinaPorcentajes: number[];
  repartoCocinaPct: number;
}): Promise<ConfigPropinasNegocio> {
  const porcentajes = validarPropinaPorcentajes(input.propinaPorcentajes);
  const reparto = validarRepartoCocinaPct(input.repartoCocinaPct);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("negocios")
    .update({
      propina_porcentajes: porcentajes,
      reparto_cocina_pct: reparto,
    })
    .eq("id", NEGOCIO_DEMO_ID)
    .select("propina_porcentajes, reparto_cocina_pct")
    .single();
  if (error || !data) {
    throw new Error("No se pudo guardar la configuración de propinas");
  }
  return {
    propinaPorcentajes: [...data.propina_porcentajes],
    repartoCocinaPct: data.reparto_cocina_pct,
  };
}
