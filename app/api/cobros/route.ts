import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { assertDemoToken } from "@/lib/demo-auth";
import { crearCobroApp } from "@/services/cobros";

const bodySchema = z.object({
  cuentaId: z.string().uuid().optional(),
  meseroId: z.string().uuid().optional(),
  tipo: z.enum(["consumo", "propina"]),
  montoCentavos: z.number().int().positive(),
  concepto: z.string().min(1).max(120),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertDemoToken(request);
    const json: unknown = await request.json();
    const input = bodySchema.parse(json);
    const cobro = await crearCobroApp(input);
    return NextResponse.json({ cobro });
  } catch (error) {
    return jsonError(error);
  }
}
