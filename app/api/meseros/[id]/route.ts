import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { peyUlidSchema } from "@/lib/pey-ulid";
import { uuidSchema } from "@/lib/uuid";
import { actualizarMeseroAdmin } from "@/services/meseros";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  pin: z.string().optional(),
  rol: z.enum(["mesero", "admin"]).optional(),
  activo: z.boolean().optional(),
  peyBankAccountId: peyUlidSchema.nullable().optional(),
});

export async function PATCH(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    await requireSesion(request, { rol: "admin" });
    const { id } = await context.params;
    uuidSchema.parse(id);
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);
    const mesero = await actualizarMeseroAdmin({
      meseroId: id,
      pin: body.pin,
      rol: body.rol,
      activo: body.activo,
      peyBankAccountId: body.peyBankAccountId,
    });
    return NextResponse.json({ mesero });
  } catch (error) {
    return jsonError(error);
  }
}
