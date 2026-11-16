import { NextResponse } from "next/server";
import { procesarWebhookPeyNegocio } from "@/services/webhook-pey";

type Params = { params: Promise<{ negocioId: string }> };

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  const { negocioId } = await context.params;
  const result = await procesarWebhookPeyNegocio(request, negocioId);
  return NextResponse.json(result.body, { status: result.status });
}
