import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { inicioDelDiaMexicoCity } from "@/lib/dia-mexico";
import { createServiceClient } from "@/lib/supabase/server";

type PorMesero = {
  meseroId: string | null;
  nombre: string;
  consumoCentavos: number;
  propinaCentavos: number;
};

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServiceClient();
    const start = inicioDelDiaMexicoCity();

    const [{ data: cobros, error }, { data: meseros, error: meserosError }] =
      await Promise.all([
        supabase
          .from("cobros")
          .select("*")
          .eq("estado", "pagado")
          .gte("pagado_at", start.toISOString()),
        supabase.from("meseros").select("id, nombre"),
      ]);

    if (error || meserosError) {
      throw new Error("No se pudo armar el reporte");
    }

    const nombres = new Map(
      (meseros ?? []).map((m) => [m.id, m.nombre] as const),
    );
    const lista = cobros ?? [];
    const consumo = lista
      .filter((c) => c.tipo === "consumo")
      .reduce((s, c) => s + c.monto_centavos, 0);
    const propina = lista
      .filter((c) => c.tipo === "propina")
      .reduce((s, c) => s + c.monto_centavos, 0);

    const mapa = new Map<string, PorMesero>();
    for (const c of lista) {
      const key = c.mesero_id ?? "sin-mesero";
      const actual = mapa.get(key) ?? {
        meseroId: c.mesero_id,
        nombre: c.mesero_id
          ? (nombres.get(c.mesero_id) ?? "Mesero")
          : "Sin mesero",
        consumoCentavos: 0,
        propinaCentavos: 0,
      };
      if (c.tipo === "consumo") {
        actual.consumoCentavos += c.monto_centavos;
      } else {
        actual.propinaCentavos += c.monto_centavos;
      }
      mapa.set(key, actual);
    }

    return NextResponse.json({
      cobros: lista.map((c) => ({
        id: c.id,
        concepto: c.concepto,
        monto_centavos: c.monto_centavos,
        tipo: c.tipo,
      })),
      porMesero: [...mapa.values()].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es-MX"),
      ),
      totalConsumoCentavos: consumo,
      totalPropinaCentavos: propina,
      totalCentavos: consumo + propina,
    });
  } catch (error) {
    return jsonError(error);
  }
}
