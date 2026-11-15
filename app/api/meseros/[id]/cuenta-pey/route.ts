import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { assertDemoToken } from "@/lib/demo-auth";
import { peyUlidSchema } from "@/lib/pey-ulid";
import { uuidSchema } from "@/lib/uuid";
import { actualizarCuentaPeyMesero } from "@/services/meseros";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  peyBankAccountId: peyUlidSchema.nullable(),
});

export async function PATCH(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    assertDemoToken(request);
    const { id } = await context.params;
    uuidSchema.parse(id);
    const json: unknown = await request.json();
    const input = bodySchema.parse(json);
    const mesero = await actualizarCuentaPeyMesero(id, input.peyBankAccountId);
    return NextResponse.json({ mesero });
  } catch (error) {
    return jsonError(error);
  }
}
