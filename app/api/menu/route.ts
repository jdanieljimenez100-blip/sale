import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { crearItem, listarMenu } from "@/services/menu";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const todos = url.searchParams.get("todos") === "1";
    if (todos) {
      await requireSesion(request, { rol: "admin" });
      const items = await listarMenu(false);
      return NextResponse.json({ items });
    }
    await requireSesion(request);
    const items = await listarMenu(true);
    return NextResponse.json({ items });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request, { rol: "admin" });
    const json: unknown = await request.json();
    const item = await crearItem(json, sesion.meseroId);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
