import { HttpError } from "@/lib/api-error";
import {
  validarPropinaPorcentajes,
  validarRepartoCocinaPct,
} from "@/lib/negocio-propinas";
import { slugValido } from "@/lib/negocio-slug";
import { PROPINA_PORCENTAJES_DEFAULT } from "@/lib/propina";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { registrarBitacora } from "@/services/bitacora";

type NegocioRow = Database["public"]["Tables"]["negocios"]["Row"];

export type ConfigPropinasNegocio = {
  propinaPorcentajes: number[];
  repartoCocinaPct: number;
};

export type NegocioPerfil = {
  id: string;
  nombre: string;
  slug: string;
};

export { validarPropinaPorcentajes, validarRepartoCocinaPct };

export async function obtenerNegocio(
  negocioId: string,
): Promise<NegocioRow> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("negocios")
    .select("*")
    .eq("id", negocioId)
    .maybeSingle();
  if (error || !data) {
    throw new Error("No se encontró el negocio");
  }
  return data;
}

export async function obtenerPerfilNegocio(
  negocioId: string,
): Promise<NegocioPerfil> {
  const negocio = await obtenerNegocio(negocioId);
  return {
    id: negocio.id,
    nombre: negocio.nombre,
    slug: negocio.slug,
  };
}

export async function actualizarPerfilNegocio(input: {
  negocioId: string;
  nombre: string;
  slug: string;
  actorMeseroId: string;
}): Promise<NegocioPerfil> {
  const nombre = input.nombre.trim();
  const slug = input.slug.trim().toLowerCase();
  if (nombre.length < 2 || nombre.length > 80) {
    throw new HttpError("El nombre debe tener entre 2 y 80 caracteres", 400);
  }
  if (!slugValido(slug)) {
    throw new HttpError(
      "El código debe tener 3 a 40 caracteres: minúsculas, números o guion",
      400,
    );
  }

  const supabase = createServiceClient();
  const { data: conflicto, error: errConflicto } = await supabase
    .from("negocios")
    .select("id")
    .eq("slug", slug)
    .neq("id", input.negocioId)
    .maybeSingle();
  if (errConflicto) {
    throw new Error("No se pudo validar el código");
  }
  if (conflicto) {
    throw new HttpError("Ese código de restaurante ya existe", 409);
  }

  const { data, error } = await supabase
    .from("negocios")
    .update({ nombre, slug })
    .eq("id", input.negocioId)
    .select("id, nombre, slug")
    .single();
  if (error || !data) {
    throw new Error("No se pudo guardar el restaurante");
  }

  await registrarBitacora(
    input.actorMeseroId,
    "negocio_actualizar",
    { nombre: data.nombre, slug: data.slug },
    input.negocioId,
  );

  return data;
}

export async function obtenerConfigPropinasNegocio(
  negocioId: string,
): Promise<ConfigPropinasNegocio> {
  try {
    const negocio = await obtenerNegocio(negocioId);
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
  negocioId: string;
  propinaPorcentajes: number[];
  repartoCocinaPct: number;
  actorMeseroId?: string;
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
    .eq("id", input.negocioId)
    .select("propina_porcentajes, reparto_cocina_pct")
    .single();
  if (error || !data) {
    throw new Error("No se pudo guardar la configuración de propinas");
  }
  if (input.actorMeseroId) {
    await registrarBitacora(
      input.actorMeseroId,
      "ajuste_propinas",
      {
        propinaPorcentajes: porcentajes,
        repartoCocinaPct: reparto,
      },
      input.negocioId,
    );
  }
  return {
    propinaPorcentajes: [...data.propina_porcentajes],
    repartoCocinaPct: data.reparto_cocina_pct,
  };
}
