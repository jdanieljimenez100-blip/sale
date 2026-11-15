import { getServerEnv } from "@/lib/env";
import { obtenerMesero } from "@/services/meseros";
import { obtenerCuenta } from "@/services/cuentas";

export type DestinoPropina = {
  bankAccountId: string | undefined;
  meseroNombre: string;
  tieneCuentaMesero: boolean;
  /** Texto para la UI del comensal. */
  mensaje: string;
  mesa: string | null;
};

export async function resolverDestinoPropina(input: {
  meseroId: string | null | undefined;
  cuentaId: string | null | undefined;
}): Promise<DestinoPropina> {
  const env = getServerEnv();
  let meseroNombre = "el mesero";
  let tieneCuentaMesero = false;
  let bankFromMesero: string | undefined;
  let mesa: string | null = null;

  if (input.meseroId) {
    const mesero = await obtenerMesero(input.meseroId);
    if (mesero) {
      meseroNombre = mesero.nombre;
      if (mesero.pey_bank_account_id) {
        tieneCuentaMesero = true;
        bankFromMesero = mesero.pey_bank_account_id;
      }
    }
  }

  if (input.cuentaId) {
    const cuenta = await obtenerCuenta(input.cuentaId);
    if (cuenta) {
      mesa = cuenta.mesa;
    }
  }

  const bankAccountId =
    bankFromMesero ?? env.PEY_BANK_ACCOUNT_RESTAURANTE ?? undefined;

  const mensaje = tieneCuentaMesero
    ? `Va directo a ${meseroNombre}`
    : `${meseroNombre} no tiene cuenta: va al restaurante`;

  return {
    bankAccountId,
    meseroNombre,
    tieneCuentaMesero,
    mensaje,
    mesa,
  };
}
