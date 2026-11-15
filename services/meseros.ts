import type { MeseroPublico } from "@/lib/meseros-types";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type { MeseroPublico };

type MeseroRow = Database["public"]["Tables"]["meseros"]["Row"];

const NEGOCIO_DEMO = "11111111-1111-1111-1111-111111111111";

function aPublico(row: MeseroRow): MeseroPublico {
  return {
    id: row.id,
    nombre: row.nombre,
    tieneCuenta: Boolean(row.pey_bank_account_id),
  };
}

export async function listarMeserosPublicos(): Promise<MeseroPublico[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .select("id, nombre, pey_bank_account_id, negocio_id, created_at")
    .eq("negocio_id", NEGOCIO_DEMO)
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

export async function obtenerMeseroPublico(
  meseroId: string,
): Promise<MeseroPublico | null> {
  const row = await obtenerMesero(meseroId);
  return row ? aPublico(row) : null;
}

export async function crearMesero(input: {
  nombre: string;
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
      negocio_id: NEGOCIO_DEMO,
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
  return aPublico(data);
}
