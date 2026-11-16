import { obtenerMesero } from "@/services/meseros";
import { obtenerCuenta } from "@/services/cuentas";
import { obtenerConfigPey } from "@/services/pey-config";

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
  negocioId: string;
}): Promise<DestinoPropina> {
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

  let bankRestaurant: string | undefined;
  if (!bankFromMesero) {
    const config = await obtenerConfigPey(input.negocioId);
    bankRestaurant = config.bankAccountRestaurante;
  }

  const bankAccountId = bankFromMesero ?? bankRestaurant;

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
