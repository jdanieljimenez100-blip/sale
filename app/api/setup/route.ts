import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, HttpError } from "@/lib/api-error";
import { assertOriginMismoHost } from "@/lib/auth/require";
import { hayAdminConPin, setupPrimerAdmin } from "@/services/auth";

const bodySchema = z.object({
  demoToken: z.string().min(1),
  nombre: z.string().trim().min(1).max(80),
  pin: z.string().regex(/^\d{6}$/),
});

export async function GET(): Promise<NextResponse> {
  try {
    if (await hayAdminConPin()) {
      throw new HttpError("Not Found", 404);
    }
    return NextResponse.json({ ok: true, disponible: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertOriginMismoHost(request);
    if (await hayAdminConPin()) {
      throw new HttpError("Not Found", 404);
    }
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);
    const admin = await setupPrimerAdmin({
      demoToken: body.demoToken,
      nombre: body.nombre,
      pin: body.pin,
    });
    return NextResponse.json({ admin });
  } catch (error) {
    return jsonError(error);
  }
}
