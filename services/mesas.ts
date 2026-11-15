import { HttpError } from "@/lib/api-error";
import type { RolSesion } from "@/lib/auth/sesion";
import {
  puedeAgregarPartida,
  puedeCerrarMesa,
  puedeModificarMesa,
  puedeQuitarPartida,
  validarCantidadPartida,
  validarDescripcionPartida,
  validarNumeroMesa,
} from "@/lib/mesa-reglas";
import { pesosTextoACentavos } from "@/lib/money";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { registrarBitacora } from "@/services/bitacora";
import { obtenerCuenta } from "@/services/cuentas";

type CuentaRow = Database["public"]["Tables"]["cuentas"]["Row"];

const NEGOCIO = "11111111-1111-1111-1111-111111111111";

export async function abrirMesa(input: {
  mesa: string;
  meseroId: string;
  sesion: { meseroId: string; rol: RolSesion };
}): Promise<CuentaRow> {
  const mesa = validarNumeroMesa(input.mesa);
  const meseroId =
    input.sesion.rol === "admin" ? input.meseroId : input.sesion.meseroId;
  if (input.sesion.rol !== "admin" && meseroId !== input.sesion.meseroId) {
    throw new HttpError("Solo puedes abrir mesas a tu nombre", 403);
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("sale_abrir_cuenta", {
    p_negocio_id: NEGOCIO,
    p_mesero_id: meseroId,
    p_mesa: mesa,
  });
  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("Esa mesa ya está abierta");
    }
    throw new Error("No se pudo abrir la mesa");
  }
  await registrarBitacora(input.sesion.meseroId, "abrir_mesa", {
    cuentaId: data.id,
    mesa: data.mesa,
    meseroId,
  });
  return data;
}

export async function agregarPartida(
  input:
    | {
        cuentaId: string;
        menuItemId: string;
        cantidad: number;
        notas?: string | null;
        sesion: { meseroId: string; rol: RolSesion };
      }
    | {
        cuentaId: string;
        descripcion: string;
        cantidad: number;
        precioPesos: string;
        notas?: string | null;
        sesion: { meseroId: string; rol: RolSesion };
      },
): Promise<CuentaRow> {
  const cuenta = await obtenerCuenta(input.cuentaId);
  if (!cuenta) {
    throw new Error("Cuenta no encontrada");
  }
  puedeModificarMesa({
    rol: input.sesion.rol,
    sesionMeseroId: input.sesion.meseroId,
    cuentaMeseroId: cuenta.mesero_id,
  });
  puedeAgregarPartida({
    cerradaAt: cuenta.cerrada_at,
    estado: cuenta.estado,
  });
  const cantidad = validarCantidadPartida(input.cantidad);
  const notas = input.notas?.trim() ? input.notas.trim() : null;
  if (notas !== null && notas.length > 120) {
    throw new HttpError("Las notas no pueden pasar de 120 caracteres", 400);
  }

  const supabase = createServiceClient();
  const esMenu = "menuItemId" in input;
  const { data, error } = await supabase.rpc("sale_agregar_partida", {
    p_cuenta_id: input.cuentaId,
    p_descripcion: esMenu
      ? "."
      : validarDescripcionPartida(input.descripcion),
    p_cantidad: cantidad,
    p_precio_centavos: esMenu
      ? 0
      : pesosTextoACentavos(input.precioPesos),
    p_notas: notas,
    p_menu_item_id: esMenu ? input.menuItemId : null,
  });
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo agregar la partida");
  }
  return data;
}

export async function quitarPartida(input: {
  partidaId: string;
  sesion: { meseroId: string; rol: RolSesion };
}): Promise<CuentaRow> {
  const supabase = createServiceClient();
  const { data: partida } = await supabase
    .from("partidas")
    .select("*")
    .eq("id", input.partidaId)
    .maybeSingle();
  if (!partida) {
    throw new Error("Partida no encontrada");
  }
  const cuenta = await obtenerCuenta(partida.cuenta_id);
  if (!cuenta) {
    throw new Error("Cuenta no encontrada");
  }
  puedeModificarMesa({
    rol: input.sesion.rol,
    sesionMeseroId: input.sesion.meseroId,
    cuentaMeseroId: cuenta.mesero_id,
  });
  const { data: cobros } = await supabase
    .from("cobros")
    .select("id")
    .eq("cuenta_id", cuenta.id)
    .eq("tipo", "consumo")
    .in("estado", ["pendiente", "pagado"])
    .limit(1);
  puedeQuitarPartida({
    cerradaAt: cuenta.cerrada_at,
    tieneCobroConsumoActivo: (cobros?.length ?? 0) > 0,
  });
  const { data, error } = await supabase.rpc("sale_quitar_partida", {
    p_partida_id: input.partidaId,
  });
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo quitar la partida");
  }
  return data;
}

export async function cerrarMesa(input: {
  cuentaId: string;
  sesion: { meseroId: string; rol: RolSesion };
}): Promise<CuentaRow> {
  const cuenta = await obtenerCuenta(input.cuentaId);
  if (!cuenta) {
    throw new Error("Cuenta no encontrada");
  }
  puedeModificarMesa({
    rol: input.sesion.rol,
    sesionMeseroId: input.sesion.meseroId,
    cuentaMeseroId: cuenta.mesero_id,
  });
  puedeCerrarMesa({
    cerradaAt: cuenta.cerrada_at,
    estado: cuenta.estado,
  });
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("sale_cerrar_cuenta", {
    p_cuenta_id: input.cuentaId,
  });
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo cerrar la mesa");
  }
  await registrarBitacora(input.sesion.meseroId, "cerrar_mesa", {
    cuentaId: data.id,
    mesa: data.mesa,
  });
  return data;
}
