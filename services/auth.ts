import { hashPin, validarPin, verificarPin } from "@/lib/auth/pin";
import type { RolSesion } from "@/lib/auth/sesion";
import { HttpError } from "@/lib/api-error";
import { demoTokenValido } from "@/lib/demo-auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { registrarBitacora } from "@/services/bitacora";

type MeseroRow = Database["public"]["Tables"]["meseros"]["Row"];

const MENSAJE_PIN = "PIN incorrecto";

export async function loginConPin(input: {
  meseroId: string;
  pin: string;
  /** Si se indica, el mesero debe pertenecer a ese negocio. */
  negocioId?: string;
}): Promise<{
  meseroId: string;
  rol: RolSesion;
  nombre: string;
  sesionVersion: number;
  negocioId: string;
}> {
  const supabase = createServiceClient();
  const { data: mesero, error } = await supabase
    .from("meseros")
    .select("*")
    .eq("id", input.meseroId)
    .maybeSingle();

  if (error || !mesero || !mesero.pin_hash) {
    await registrarBitacora(input.meseroId, "login_fallido", {
      motivo: "mesero_o_pin_ausente",
    });
    throw new HttpError(MENSAJE_PIN, 401);
  }

  if (input.negocioId && mesero.negocio_id !== input.negocioId) {
    await registrarBitacora(mesero.id, "login_fallido", {
      motivo: "negocio",
    });
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
    await registrarBitacora(mesero.id, "login_bloqueo", {});
    throw new HttpError("Demasiados intentos. Espera unos minutos.", 423);
  }

  const ok = verificarPin(input.pin, mesero.pin_hash);
  if (!ok) {
    await registrarBitacora(mesero.id, "login_fallido", { motivo: "pin" });
    const { data: trasFallo } = await supabase
      .from("meseros")
      .select("pin_bloqueado_hasta")
      .eq("id", mesero.id)
      .maybeSingle();
    if (
      trasFallo?.pin_bloqueado_hasta &&
      new Date(trasFallo.pin_bloqueado_hasta).getTime() > Date.now()
    ) {
      await registrarBitacora(mesero.id, "login_bloqueo", {});
    }
    throw new HttpError(MENSAJE_PIN, 401);
  }

  if (!mesero.activo) {
    await registrarBitacora(mesero.id, "login_fallido", {
      motivo: "inactivo",
    });
    throw new HttpError(MENSAJE_PIN, 401);
  }

  await supabase
    .from("meseros")
    .update({
      pin_intentos_fallidos: 0,
      pin_bloqueado_hasta: null,
    })
    .eq("id", mesero.id);

  await registrarBitacora(mesero.id, "login_ok", { rol: mesero.rol });

  return {
    meseroId: mesero.id,
    rol: mesero.rol,
    nombre: mesero.nombre,
    sesionVersion: mesero.sesion_version,
    negocioId: mesero.negocio_id,
  };
}

export async function obtenerSesionActual(
  meseroId: string,
): Promise<{
  meseroId: string;
  nombre: string;
  rol: RolSesion;
  negocioId: string;
} | null> {
  const mesero = await obtenerMeseroAuth(meseroId);
  if (!mesero || !mesero.activo) {
    return null;
  }
  return {
    meseroId: mesero.id,
    nombre: mesero.nombre,
    rol: mesero.rol,
    negocioId: mesero.negocio_id,
  };
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
  if (!demoTokenValido(input.demoToken)) {
    throw new HttpError("Token inválido", 401);
  }
  validarPin(input.pin, "admin");
  const nombre = input.nombre.trim();
  if (nombre.length < 1 || nombre.length > 80) {
    throw new Error("Nombre inválido");
  }

  const pinHash = hashPin(input.pin);
  const supabase = createServiceClient();

  const { data: demo, error: errDemo } = await supabase
    .from("negocios")
    .select("id")
    .eq("slug", "demo")
    .maybeSingle();
  if (errDemo || !demo) {
    throw new Error("No se encontró el negocio demo");
  }

  const { data, error } = await supabase
    .from("meseros")
    .insert({
      negocio_id: demo.id,
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

export async function listarMeserosActivosLogin(
  negocioId: string,
): Promise<Array<{ id: string; nombre: string }>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meseros")
    .select("id, nombre")
    .eq("negocio_id", negocioId)
    .eq("activo", true)
    .not("pin_hash", "is", null)
    .order("nombre", { ascending: true });
  if (error) {
    throw new Error("No se pudieron listar meseros");
  }
  return data ?? [];
}

const SLUG_RE = /^[a-z0-9-]{3,40}$/;

export function slugValido(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export async function obtenerNegocioPorSlug(
  slug: string,
): Promise<NegocioResumen | null> {
  if (!slugValido(slug)) {
    return null;
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("negocios")
    .select("id, nombre, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throw new Error("No se pudo leer negocio");
  }
  return data;
}

export type LoginListaResultado =
  | { meseros: Array<{ id: string; nombre: string }>; slug: string }
  | { necesitaRestaurante: true };

/**
 * Lista pública de meseros para /entrar.
 * Con slug: solo ese negocio. Sin slug: un negocio único, o pide restaurante.
 */
export async function listarLoginPublico(
  slug: string | null,
): Promise<LoginListaResultado> {
  const supabase = createServiceClient();

  if (slug) {
    const negocio = await obtenerNegocioPorSlug(slug);
    if (!negocio) {
      return { meseros: [], slug };
    }
    const meseros = await listarMeserosActivosLogin(negocio.id);
    return { meseros, slug: negocio.slug };
  }

  const { data: negocios, error } = await supabase
    .from("negocios")
    .select("id, slug")
    .order("created_at", { ascending: true })
    .limit(2);
  if (error) {
    throw new Error("No se pudieron listar negocios");
  }
  if (!negocios || negocios.length === 0) {
    return { meseros: [], slug: "" };
  }
  if (negocios.length > 1) {
    return { necesitaRestaurante: true };
  }
  const unico = negocios[0]!;
  const meseros = await listarMeserosActivosLogin(unico.id);
  return { meseros, slug: unico.slug };
}

export type NegocioResumen = {
  id: string;
  nombre: string;
  slug: string;
};

/** Negocio home + accesos admin cruzados. */
export async function listarNegociosAccesibles(
  meseroId: string,
): Promise<NegocioResumen[]> {
  const supabase = createServiceClient();
  const { data: mesero, error } = await supabase
    .from("meseros")
    .select("negocio_id")
    .eq("id", meseroId)
    .maybeSingle();
  if (error || !mesero) {
    throw new Error("No se pudo leer mesero");
  }

  const { data: accesos, error: errAccesos } = await supabase
    .from("negocio_accesos")
    .select("negocio_id")
    .eq("mesero_id", meseroId)
    .eq("rol", "admin");
  if (errAccesos) {
    throw new Error("No se pudieron listar accesos");
  }

  const ids = new Set<string>([mesero.negocio_id]);
  for (const a of accesos ?? []) {
    ids.add(a.negocio_id);
  }

  const { data: negocios, error: errNeg } = await supabase
    .from("negocios")
    .select("id, nombre, slug")
    .in("id", [...ids])
    .order("nombre", { ascending: true });
  if (errNeg) {
    throw new Error("No se pudieron listar negocios");
  }
  return negocios ?? [];
}

export async function obtenerNegocioPorId(
  negocioId: string,
): Promise<NegocioResumen | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("negocios")
    .select("id, nombre, slug")
    .eq("id", negocioId)
    .maybeSingle();
  if (error) {
    throw new Error("No se pudo leer negocio");
  }
  return data;
}
