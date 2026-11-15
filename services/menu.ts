import { z } from "zod";
import { HttpError } from "@/lib/api-error";
import { pesosTextoACentavos } from "@/lib/money";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { registrarBitacora } from "@/services/bitacora";

type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];

const NEGOCIO = "11111111-1111-1111-1111-111111111111";

const crearSchema = z.object({
  nombre: z.string().trim().min(1).max(60),
  categoria: z.string().trim().min(1).max(30),
  precioPesos: z.string().min(1),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).max(9999).optional(),
});

const actualizarSchema = z.object({
  nombre: z.string().trim().min(1).max(60).optional(),
  categoria: z.string().trim().min(1).max(30).optional(),
  precioPesos: z.string().min(1).optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).max(9999).optional(),
});

export type MenuItemCrearInput = z.infer<typeof crearSchema>;
export type MenuItemActualizarInput = z.infer<typeof actualizarSchema>;

export async function listarMenu(soloActivos: boolean): Promise<MenuItemRow[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("menu_items")
    .select("*")
    .eq("negocio_id", NEGOCIO)
    .order("categoria", { ascending: true })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (soloActivos) {
    query = query.eq("activo", true);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error("No se pudo cargar el menú");
  }
  return data ?? [];
}

export async function crearItem(
  input: unknown,
  actorMeseroId: string,
): Promise<MenuItemRow> {
  const body = crearSchema.parse(input);
  const precio = pesosTextoACentavos(body.precioPesos);
  if (precio <= 0) {
    throw new HttpError("El precio debe ser mayor a cero", 400);
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      negocio_id: NEGOCIO,
      nombre: body.nombre,
      categoria: body.categoria,
      precio_centavos: precio,
      activo: body.activo ?? true,
      orden: body.orden ?? 0,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error("No se pudo crear el platillo");
  }
  await registrarBitacora(actorMeseroId, "menu_crear", {
    menuItemId: data.id,
    nombre: data.nombre,
    precioCentavos: data.precio_centavos,
  });
  return data;
}

export async function actualizarItem(
  id: string,
  input: unknown,
  actorMeseroId: string,
): Promise<MenuItemRow> {
  if (!z.string().uuid().safeParse(id).success) {
    throw new HttpError("Platillo inválido", 400);
  }
  const body = actualizarSchema.parse(input);
  if (
    body.nombre === undefined &&
    body.categoria === undefined &&
    body.precioPesos === undefined &&
    body.activo === undefined &&
    body.orden === undefined
  ) {
    throw new HttpError("Nada que actualizar", 400);
  }

  const patch: Database["public"]["Tables"]["menu_items"]["Update"] = {};
  if (body.nombre !== undefined) {
    patch.nombre = body.nombre;
  }
  if (body.categoria !== undefined) {
    patch.categoria = body.categoria;
  }
  if (body.precioPesos !== undefined) {
    const precio = pesosTextoACentavos(body.precioPesos);
    if (precio <= 0) {
      throw new HttpError("El precio debe ser mayor a cero", 400);
    }
    patch.precio_centavos = precio;
  }
  if (body.activo !== undefined) {
    patch.activo = body.activo;
  }
  if (body.orden !== undefined) {
    patch.orden = body.orden;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("menu_items")
    .update(patch)
    .eq("id", id)
    .eq("negocio_id", NEGOCIO)
    .select("*")
    .maybeSingle();
  if (error) {
    throw new Error("No se pudo actualizar el platillo");
  }
  if (!data) {
    throw new HttpError("Platillo no encontrado", 404);
  }
  await registrarBitacora(actorMeseroId, "menu_editar", {
    menuItemId: data.id,
    cambios: patch,
  });
  return data;
}
