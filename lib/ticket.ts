/** Helpers puros del ticket escaneable (sin I/O). */

export type TicketPartidaCalc = {
  nombre: string;
  cantidad: number;
  precioUnitarioCentavos: number;
  notas: string | null;
};

export type TicketPartidaVista = TicketPartidaCalc & {
  importeCentavos: number;
};

export function importePartida(
  cantidad: number,
  precioUnitarioCentavos: number,
): number {
  if (!Number.isInteger(cantidad) || !Number.isInteger(precioUnitarioCentavos)) {
    throw new Error("Cantidad y precio deben ser enteros");
  }
  if (cantidad < 0 || precioUnitarioCentavos < 0) {
    throw new Error("Cantidad y precio no pueden ser negativos");
  }
  return cantidad * precioUnitarioCentavos;
}

export function mapearPartidasTicket(
  partidas: TicketPartidaCalc[],
): TicketPartidaVista[] {
  return partidas.map((p) => ({
    ...p,
    importeCentavos: importePartida(p.cantidad, p.precioUnitarioCentavos),
  }));
}

export function subtotalPartidasCentavos(
  partidas: TicketPartidaCalc[],
): number {
  return mapearPartidasTicket(partidas).reduce(
    (suma, p) => suma + p.importeCentavos,
    0,
  );
}

/** Propinas se suman aparte del subtotal de consumo. */
export function totalPagadoCentavos(
  subtotalCentavos: number,
  propinasCentavos: number,
): number {
  if (
    !Number.isInteger(subtotalCentavos) ||
    !Number.isInteger(propinasCentavos)
  ) {
    throw new Error("Montos deben ser enteros en centavos");
  }
  return subtotalCentavos + propinasCentavos;
}

export function sumaPropinasCentavos(montos: number[]): number {
  let suma = 0;
  for (const m of montos) {
    if (!Number.isInteger(m) || m < 0) {
      throw new Error("Propina inválida");
    }
    suma += m;
  }
  return suma;
}

export function primerNombre(nombreCompleto: string): string {
  const t = nombreCompleto.trim();
  if (!t) {
    return "Mesero";
  }
  return t.split(/\s+/)[0] ?? "Mesero";
}

/** Fecha/hora de pago en CDMX, legible en ticket. */
export function formatearFechaPagoCdmx(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) {
    throw new Error("Fecha inválida");
  }
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatearHoraCdmx(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) {
    throw new Error("Fecha inválida");
  }
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
