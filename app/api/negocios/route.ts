import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { SLUG_NEGOCIO_RE } from "@/lib/negocio-slug";
import { crearNegocio } from "@/services/negocios";

const postSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(SLUG_NEGOCIO_RE),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request, { rol: "admin" });
    const json: unknown = await request.json();
    const body = postSchema.parse(json);
    const negocio = await crearNegocio({
      nombre: body.nombre,
      slug: body.slug,
      actorMeseroId: sesion.meseroId,
    });
    return NextResponse.json(negocio, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
