import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServiceClient();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("cobros")
      .select("*")
      .eq("estado", "pagado")
      .gte("pagado_at", start.toISOString());

    if (error) {
      throw new Error(error.message);
    }

    const cobros = data ?? [];
    const consumo = cobros
      .filter((c) => c.tipo === "consumo")
      .reduce((s, c) => s + c.monto_centavos, 0);
    const propina = cobros
      .filter((c) => c.tipo === "propina")
      .reduce((s, c) => s + c.monto_centavos, 0);

    return NextResponse.json({
      cobros,
      totalConsumoCentavos: consumo,
      totalPropinaCentavos: propina,
      totalCentavos: consumo + propina,
    });
  } catch (error) {
    return jsonError(error);
  }
}
