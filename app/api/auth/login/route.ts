import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { assertOriginMismoHost } from "@/lib/auth/require";
import {
  COOKIE_SESION,
  crearTokenSesion,
  opcionesCookieSesion,
  payloadSesionNuevo,
} from "@/lib/auth/sesion";
import { getServerEnv } from "@/lib/env";
import { uuidSchema } from "@/lib/uuid";
import { loginConPin, obtenerNegocioPorSlug, slugValido } from "@/services/auth";

const bodySchema = z.object({
  meseroId: uuidSchema,
  pin: z.string().min(4).max(6),
  r: z.string().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertOriginMismoHost(request);
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);

    let negocioId: string | undefined;
    if (body.r !== undefined && body.r.length > 0) {
      const slug = body.r.trim().toLowerCase();
      if (!slugValido(slug)) {
        return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
      }
      const negocio = await obtenerNegocioPorSlug(slug);
      if (!negocio) {
        return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
      }
      negocioId = negocio.id;
    }

    const sesion = await loginConPin({
      meseroId: body.meseroId,
      pin: body.pin,
      negocioId,
    });
    const token = crearTokenSesion(
      payloadSesionNuevo(
        sesion.meseroId,
        sesion.rol,
        sesion.sesionVersion,
        sesion.negocioId,
      ),
      getServerEnv().SESSION_SECRET,
    );
    const res = NextResponse.json({
      meseroId: sesion.meseroId,
      nombre: sesion.nombre,
      rol: sesion.rol,
    });
    res.cookies.set(
      COOKIE_SESION,
      token,
      opcionesCookieSesion(process.env.NODE_ENV === "production"),
    );
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
