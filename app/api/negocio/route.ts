import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { SLUG_NEGOCIO_RE } from "@/lib/negocio-slug";
import {
  actualizarPerfilNegocio,
  obtenerPerfilNegocio,
} from "@/services/negocios";

const patchSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(SLUG_NEGOCIO_RE),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request, { rol: "admin" });
    const perfil = await obtenerPerfilNegocio(sesion.negocioId);
    return NextResponse.json(perfil);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request, { rol: "admin" });
    const json: unknown = await request.json();
    const body = patchSchema.parse(json);
    const perfil = await actualizarPerfilNegocio({
      negocioId: sesion.negocioId,
      nombre: body.nombre,
      slug: body.slug,
      actorMeseroId: sesion.meseroId,
    });
    return NextResponse.json(perfil);
  } catch (error) {
    return jsonError(error);
  }
}
