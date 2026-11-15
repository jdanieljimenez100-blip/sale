import { HttpError } from "@/lib/api-error";
import { validarInputResena } from "@/lib/resena";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { obtenerCobro } from "@/services/cobros";

type ResenaRow = Database["public"]["Tables"]["resenas"]["Row"];

export { validarInputResena } from "@/lib/resena";

export async function crearResenaDesdeConsumo(input: {
  cobroConsumoId: string;
  estrellas: number;
  comentario?: string | null;
}): Promise<ResenaRow> {
  const decision = validarInputResena({
    estrellas: input.estrellas,
    comentario: input.comentario,
  });

  const consumo = await obtenerCobro(input.cobroConsumoId);
  if (!consumo) {
    throw new Error("Cobro no encontrado");
  }
  if (consumo.tipo !== "consumo") {
    throw new Error("La reseña solo aplica a un pago de consumo");
  }
  if (consumo.estado !== "pagado") {
    throw new Error("El consumo aún no está pagado");
  }
  if (!consumo.mesero_id) {
    throw new Error("Este pago no tiene mesero asignado");
  }

  const supabase = createServiceClient();
  const { data: existente } = await supabase
    .from("resenas")
    .select("id")
    .eq("cobro_id", consumo.id)
    .maybeSingle();
  if (existente) {
    throw new HttpError("Ya calificaste este pago", 409);
  }

  const { data, error } = await supabase
    .from("resenas")
    .insert({
      cobro_id: consumo.id,
      mesero_id: consumo.mesero_id,
      cuenta_id: consumo.cuenta_id,
      estrellas: decision.estrellas,
      comentario: decision.comentario,
    })
    .select("*")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new HttpError("Ya calificaste este pago", 409);
    }
    throw new Error("No se pudo guardar la reseña");
  }
  return data;
}
