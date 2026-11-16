import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { resolverAccesoNegocio } from "@/lib/auth/negocio-acceso";
import { requireSesion } from "@/lib/auth/require";
import {
  COOKIE_SESION,
  crearTokenSesion,
  opcionesCookieSesion,
  payloadSesionNuevo,
} from "@/lib/auth/sesion";
import { getServerEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/uuid";
import { registrarBitacora } from "@/services/bitacora";

const bodySchema = z.object({
  negocioId: uuidSchema,
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);

    const supabase = createServiceClient();
    const [{ data: mesero, error }, { data: accesos, error: errAccesos }] =
      await Promise.all([
        supabase
          .from("meseros")
          .select("id, rol, activo, sesion_version, negocio_id")
          .eq("id", sesion.meseroId)
          .maybeSingle(),
        supabase
          .from("negocio_accesos")
          .select("negocio_id, rol")
          .eq("mesero_id", sesion.meseroId),
      ]);

    if (error || !mesero || !mesero.activo || errAccesos) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }

    const acceso = resolverAccesoNegocio({
      mesero: { negocio_id: mesero.negocio_id, rol: mesero.rol },
      negocioPedido: body.negocioId,
      accesos: accesos ?? [],
    });
    if (!acceso) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const token = crearTokenSesion(
      payloadSesionNuevo(
        mesero.id,
        acceso.rol,
        mesero.sesion_version,
        acceso.negocioId,
      ),
      getServerEnv().SESSION_SECRET,
    );

    await registrarBitacora(mesero.id, "cambiar_negocio", {
      de: sesion.negocioId,
      a: acceso.negocioId,
    }, acceso.negocioId);

    const res = NextResponse.json({
      negocioId: acceso.negocioId,
      rol: acceso.rol,
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
