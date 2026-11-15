import { hashPin, validarPin, verificarPin } from "@/lib/auth/pin";
import type { RolSesion } from "@/lib/auth/sesion";
import { HttpError } from "@/lib/api-error";
import { getServerEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type MeseroRow = Database["public"]["Tables"]["meseros"]["Row"];

const MENSAJE_PIN = "PIN incorrecto";

export async function loginConPin(input: {
  meseroId: string;
  pin: string;
}): Promise<{
  meseroId: string;
  rol: RolSesion;
  nombre: string;
  sesionVersion: number;
}> {
  const supabase = createServiceClient();
  const { data: mesero, error } = await supabase
    .from("meseros")
    .select("*")
    .eq("id", input.meseroId)
    .maybeSingle();

  if (error || !mesero || !mesero.pin_hash) {
    throw new HttpError(MENSAJE_PIN, 401);
  }

  const { data: reserva, error: errReserva } = await supabase.rpc(
    "sale_pin_reservar_intento",
    { p_mesero_id: mesero.id },
  );
  if (errReserva) {
    throw new Error("No se pudo validar el PIN");
  }
  if (reserva === "bloqueado") {
    throw new HttpError("Demasiados intentos. Espera unos minutos.", 423);
  }

  const ok = verificarPin(input.pin, mesero.pin_hash);
  if (!ok) {
    throw new HttpError(MENSAJE_PIN, 401);
  }

  if (!mesero.activo) {
    throw new HttpError(MENSAJE_PIN, 401);
  }

  await supabase
    .from("meseros")
    .update({
      pin_intentos_fallidos: 0,
      pin_bloqueado_hasta: null,
    })
    .eq("id", mesero.id);

  return {
    meseroId: mesero.id,
    rol: mesero.rol,
    nombre: mesero.nombre,
    sesionVersion: mesero.sesion_version,
  };
}

export async function obtenerSesionActual(
  meseroId: string,
): Promise<{ meseroId: string; nombre: string; rol: RolSesion } | null> {
  const mesero = await obtenerMeseroAuth(meseroId);
  if (!mesero || !mesero.activo) {
    return null;
  }
  return { meseroId: mesero.id, nombre: mesero.nombre, rol: mesero.rol };
}

export async function obtenerMeseroAuth(
  meseroId: string,
): Promise<MeseroRow | null> {
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

export async function hayAdminConPin(): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .select("id")
    .eq("rol", "admin")
    .not("pin_hash", "is", null)
    .limit(1);
  if (error) {
    throw new Error("No se pudo verificar setup");
  }
  return (data?.length ?? 0) > 0;
}

export async function setupPrimerAdmin(input: {
  demoToken: string;
  nombre: string;
  pin: string;
}): Promise<{ meseroId: string; nombre: string }> {
  if (await hayAdminConPin()) {
    throw new HttpError("Not Found", 404);
  }
  const expected = getServerEnv().DEMO_ACCESS_TOKEN;
  if (input.demoToken !== expected) {
    throw new HttpError("Token inválido", 401);
  }
  validarPin(input.pin, "admin");
  const nombre = input.nombre.trim();
  if (nombre.length < 1 || nombre.length > 80) {
    throw new Error("Nombre inválido");
  }

  const pinHash = hashPin(input.pin);
  const supabase = createServiceClient();

  const { data: existente } = await supabase
    .from("meseros")
    .select("*")
    .ilike("nombre", nombre)
    .limit(1)
    .maybeSingle();

  if (existente) {
    const { data, error } = await supabase
      .from("meseros")
      .update({
        rol: "admin",
        pin_hash: pinHash,
        pin_intentos_fallidos: 0,
        pin_bloqueado_hasta: null,
        activo: true,
      })
      .eq("id", existente.id)
      .select("id, nombre")
      .single();
    if (error || !data) {
      throw new Error("No se pudo promover al admin");
    }
    return { meseroId: data.id, nombre: data.nombre };
  }

  const { data, error } = await supabase
    .from("meseros")
    .insert({
      negocio_id: "11111111-1111-1111-1111-111111111111",
      nombre,
      rol: "admin",
      pin_hash: pinHash,
      activo: true,
    })
    .select("id, nombre")
    .single();
  if (error || !data) {
    throw new Error("No se pudo crear el admin");
  }
  return { meseroId: data.id, nombre: data.nombre };
}

export async function listarMeserosActivosLogin(): Promise<
  Array<{ id: string; nombre: string }>
> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .select("id, nombre")
    .eq("activo", true)
    .not("pin_hash", "is", null)
    .order("nombre", { ascending: true });
  if (error) {
    throw new Error("No se pudieron listar meseros");
  }
  return data ?? [];
}
