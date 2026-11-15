/** Reglas puras de mesas (abrir / partida / cerrar). */

export function validarNumeroMesa(mesa: string): string {
  const t = mesa.trim();
  if (!/^[1-9]\d{0,2}$/.test(t)) {
    throw new Error("La mesa debe ser un número de 1 a 999");
  }
  const n = Number.parseInt(t, 10);
  if (n < 1 || n > 999) {
    throw new Error("La mesa debe ser un número de 1 a 999");
  }
  return String(n);
}

export function validarDescripcionPartida(descripcion: string): string {
  const t = descripcion.trim();
  if (t.length < 1 || t.length > 80) {
    throw new Error("La descripción debe tener entre 1 y 80 caracteres");
  }
  return t;
}

export function validarCantidadPartida(cantidad: number): number {
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
    throw new Error("La cantidad debe ser entre 1 y 99");
  }
  return cantidad;
}

export function puedeAgregarPartida(input: {
  cerradaAt: string | null;
  estado: "pendiente" | "parcial" | "pagada";
}): void {
  if (input.cerradaAt) {
    throw new Error("La mesa ya está cerrada");
  }
  if (input.estado === "pagada") {
    throw new Error("La mesa ya está pagada");
  }
}

export function puedeQuitarPartida(input: {
  cerradaAt: string | null;
  tieneCobroConsumoActivo: boolean;
}): void {
  if (input.cerradaAt) {
    throw new Error("La mesa ya está cerrada");
  }
  if (input.tieneCobroConsumoActivo) {
    throw new Error("No se puede quitar: ya hay cobros de consumo");
  }
}

export function puedeCerrarMesa(input: {
  cerradaAt: string | null;
  estado: "pendiente" | "parcial" | "pagada";
}): void {
  if (input.cerradaAt) {
    throw new Error("La mesa ya está cerrada");
  }
  if (input.estado !== "pagada") {
    throw new Error("Solo se cierra una mesa pagada");
  }
}

export function puedeModificarMesa(input: {
  rol: "mesero" | "admin";
  sesionMeseroId: string;
  cuentaMeseroId: string;
}): void {
  if (input.rol === "admin") {
    return;
  }
  if (input.sesionMeseroId !== input.cuentaMeseroId) {
    throw new Error("Solo puedes modificar tus mesas");
  }
}
