import { HttpError } from "@/lib/api-error";
import type { MeseroPublico } from "@/lib/meseros-types";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { peyUlidUltimos4, registrarBitacora } from "@/services/bitacora";

export type { MeseroPublico };

type MeseroRow = Database["public"]["Tables"]["meseros"]["Row"];

function aPublico(row: MeseroRow): MeseroPublico {
  return {
    id: row.id,
    nombre: row.nombre,
    tieneCuenta: Boolean(row.pey_bank_account_id),
    rol: row.rol,
    activo: row.activo,
    tienePin: Boolean(row.pin_hash),
  };
}

export async function listarMeserosPublicos(
  negocioId: string,
): Promise<MeseroPublico[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .select("*")
    .eq("negocio_id", negocioId)
    .order("nombre", { ascending: true });
  if (error) {
    throw new Error("No se pudieron listar meseros");
  }
  return (data ?? []).map(aPublico);
}

export async function obtenerMesero(meseroId: string): Promise<MeseroRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .select("*")
    .eq("id", meseroId)
    .maybeSingle();
  if (error) {
    throw new Error("No se pudo leer mesero");
  }
  return data;
}

/**
 * Mesero activo del negocio indicado. 404 genérico si no existe,
 * es de otro restaurante o está inactivo.
 */
export async function obtenerMeseroDelNegocio(
  meseroId: string,
  negocioId: string,
): Promise<MeseroRow> {
  const mesero = await obtenerMesero(meseroId);
  if (!mesero || mesero.negocio_id !== negocioId || !mesero.activo) {
    throw new HttpError("No encontrado", 404);
  }
  return mesero;
}

export async function obtenerMeseroPublico(
  meseroId: string,
): Promise<MeseroPublico | null> {
  const row = await obtenerMesero(meseroId);
  return row ? aPublico(row) : null;
}

export async function crearMesero(input: {
  nombre: string;
  negocioId: string;
  peyBankAccountId?: string;
}): Promise<MeseroPublico> {
  const nombre = input.nombre.trim();
  if (nombre.length < 1 || nombre.length > 80) {
    throw new Error("Nombre inválido");
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .insert({
      negocio_id: input.negocioId,
      nombre,
      pey_bank_account_id: input.peyBankAccountId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error("No se pudo crear el mesero");
  }
  return aPublico(data);
}

export async function actualizarCuentaPeyMesero(
  meseroId: string,
  peyBankAccountId: string | null,
  actorMeseroId?: string,
  negocioId?: string | null,
): Promise<MeseroPublico> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .update({ pey_bank_account_id: peyBankAccountId })
    .eq("id", meseroId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar la cuenta pey del mesero");
  }
  await registrarBitacora(
    actorMeseroId ?? meseroId,
    "cuenta_pey",
    {
      meseroId,
      peyUltimos4: peyUlidUltimos4(peyBankAccountId),
    },
    negocioId ?? data.negocio_id,
  );
  return aPublico(data);
}

async function contarAdminsActivos(negocioId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .select("id")
    .eq("negocio_id", negocioId)
    .eq("rol", "admin")
    .eq("activo", true);
  if (error) {
    throw new Error("No se pudo contar admins");
  }
  return data?.length ?? 0;
}

export async function actualizarMeseroAdmin(input: {
  meseroId: string;
  pin?: string;
  rol?: "mesero" | "admin";
  activo?: boolean;
  peyBankAccountId?: string | null;
  actorMeseroId?: string;
}): Promise<MeseroPublico> {
  const { hashPin, validarPin } = await import("@/lib/auth/pin");
  const actual = await obtenerMesero(input.meseroId);
  if (!actual) {
    throw new Error("Mesero no encontrado");
  }

  const update: Database["public"]["Tables"]["meseros"]["Update"] = {};
  let invalidaSesion = false;
  let cambioPin = false;
  let cambioRol: string | undefined;
  let cambioActivo: boolean | undefined;
  if (input.pin !== undefined) {
    const rolParaPin = input.rol ?? actual.rol;
    validarPin(input.pin, rolParaPin);
    update.pin_hash = hashPin(input.pin);
    update.pin_intentos_fallidos = 0;
    update.pin_bloqueado_hasta = null;
    invalidaSesion = true;
    cambioPin = true;
  }
  if (input.rol !== undefined && input.rol !== actual.rol) {
    if (actual.rol === "admin" && input.rol === "mesero") {
      if ((await contarAdminsActivos(actual.negocio_id)) <= 1) {
        throw new Error("No puedes quitar el rol al último admin");
      }
    }
    update.rol = input.rol;
    invalidaSesion = true;
    cambioRol = input.rol;
  }
  if (input.activo !== undefined && input.activo !== actual.activo) {
    if (actual.rol === "admin" && input.activo === false) {
      if ((await contarAdminsActivos(actual.negocio_id)) <= 1) {
        throw new Error("No puedes desactivar al último admin");
      }
    }
    update.activo = input.activo;
    invalidaSesion = true;
    cambioActivo = input.activo;
  }
  if (input.peyBankAccountId !== undefined) {
    update.pey_bank_account_id = input.peyBankAccountId;
  }
  if (invalidaSesion) {
    update.sesion_version = actual.sesion_version + 1;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .update(update)
    .eq("id", input.meseroId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar el mesero");
  }

  const actor = input.actorMeseroId ?? input.meseroId;
  const sujeto = { meseroId: input.meseroId };
  const nid = actual.negocio_id;
  if (cambioPin) {
    await registrarBitacora(actor, "cambio_pin", sujeto, nid);
  }
  if (cambioRol !== undefined) {
    await registrarBitacora(
      actor,
      "cambio_rol",
      { ...sujeto, rol: cambioRol },
      nid,
    );
  }
  if (cambioActivo !== undefined) {
    await registrarBitacora(
      actor,
      "cambio_activo",
      { ...sujeto, activo: cambioActivo },
      nid,
    );
  }
  if (input.peyBankAccountId !== undefined) {
    await registrarBitacora(
      actor,
      "cuenta_pey",
      {
        ...sujeto,
        peyUltimos4: peyUlidUltimos4(input.peyBankAccountId),
      },
      nid,
    );
  }

  return aPublico(data);
}

/**
 * Elimina un mesero. Falla si es el último admin, si es uno mismo,
 * o si tiene mesas/reseñas (FK). En ese caso conviene Desactivar.
 */
export async function eliminarMeseroAdmin(input: {
  meseroId: string;
  actorMeseroId: string;
}): Promise<void> {
  if (input.meseroId === input.actorMeseroId) {
    throw new Error("No puedes eliminarte a ti mismo");
  }
  const actual = await obtenerMesero(input.meseroId);
  if (!actual) {
    throw new Error("Mesero no encontrado");
  }
  if (actual.rol === "admin" && actual.activo) {
    if ((await contarAdminsActivos(actual.negocio_id)) <= 1) {
      throw new Error("No puedes eliminar al último admin");
    }
  }

  const supabase = createServiceClient();
  const { count: cuentasCount, error: errCuentas } = await supabase
    .from("cuentas")
    .select("id", { count: "exact", head: true })
    .eq("mesero_id", input.meseroId)
    .eq("negocio_id", actual.negocio_id);
  if (errCuentas) {
    throw new Error("No se pudo verificar mesas del mesero");
  }
  if ((cuentasCount ?? 0) > 0) {
    throw new Error(
      "No se puede eliminar: tiene mesas en el historial. Usa Desactivar.",
    );
  }

  const { count: resenasCount, error: errResenas } = await supabase
    .from("resenas")
    .select("id", { count: "exact", head: true })
    .eq("mesero_id", input.meseroId);
  if (errResenas) {
    throw new Error("No se pudo verificar reseñas del mesero");
  }
  if ((resenasCount ?? 0) > 0) {
    throw new Error(
      "No se puede eliminar: tiene reseñas. Usa Desactivar.",
    );
  }

  await supabase
    .from("bitacora")
    .update({ mesero_id: null })
    .eq("mesero_id", input.meseroId);

  await registrarBitacora(
    input.actorMeseroId,
    "mesero_eliminar",
    {
      meseroId: input.meseroId,
      nombre: actual.nombre,
    },
    actual.negocio_id,
  );

  const { error } = await supabase
    .from("meseros")
    .delete()
    .eq("id", input.meseroId);
  if (error) {
    throw new Error("No se pudo eliminar el mesero");
  }
}
