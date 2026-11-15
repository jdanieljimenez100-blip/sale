import { NextResponse } from "next/server";
import { procesarWebhookPey } from "@/services/webhook-pey";

export async function POST(request: Request): Promise<NextResponse> {
  const result = await procesarWebhookPey(request);
  return NextResponse.json(result.body, { status: result.status });
}
