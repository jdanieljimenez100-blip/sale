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
import { loginConPin } from "@/services/auth";

const bodySchema = z.object({
  meseroId: uuidSchema,
  pin: z.string().min(4).max(6),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertOriginMismoHost(request);
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);
    const sesion = await loginConPin(body);
    const token = crearTokenSesion(
      payloadSesionNuevo(sesion.meseroId, sesion.rol, sesion.sesionVersion),
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
