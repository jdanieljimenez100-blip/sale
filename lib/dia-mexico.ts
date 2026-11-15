/** Inicio del día civil en America/Mexico_City, como Instant UTC. */

const ZONA = "America/Mexico_City";

export type RangoReporteDias = 1 | 7 | 30;

/**
 * Inicio del rango (incluye hoy): medianoche CDMX de hace (dias - 1) días.
 * Hoy = 1, últimos 7 días = 7, últimos 30 = 30.
 */
export function inicioRangoMexicoCity(
  dias: RangoReporteDias,
  ahora: Date = new Date(),
): Date {
  const inicioHoy = inicioDelDiaMexicoCity(ahora);
  if (dias === 1) {
    return inicioHoy;
  }
  return new Date(inicioHoy.getTime() - (dias - 1) * 24 * 60 * 60 * 1000);
}

/**
 * Devuelve el instante UTC correspondiente a las 00:00:00.000
 * del día civil de `ahora` en Ciudad de México.
 */
export function inicioDelDiaMexicoCity(ahora: Date = new Date()): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);

  const year = Number(partes.find((p) => p.type === "year")?.value);
  const month = Number(partes.find((p) => p.type === "month")?.value);
  const day = Number(partes.find((p) => p.type === "day")?.value);
  if (!year || !month || !day) {
    throw new Error("No se pudo calcular la fecha en America/Mexico_City");
  }

  // Medianoche CDMX = UTC+6 en invierno (CST) o UTC+5 en verano (CDT).
  // Probamos ambos offsets y elegimos el que formatea al mismo día local a 00:00.
  for (const offsetHours of [6, 5]) {
    const candidate = new Date(Date.UTC(year, month - 1, day, offsetHours, 0, 0, 0));
    const check = new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(candidate);
    const y = Number(check.find((p) => p.type === "year")?.value);
    const m = Number(check.find((p) => p.type === "month")?.value);
    const d = Number(check.find((p) => p.type === "day")?.value);
    const h = Number(check.find((p) => p.type === "hour")?.value);
    const min = Number(check.find((p) => p.type === "minute")?.value);
    if (y === year && m === month && d === day && h === 0 && min === 0) {
      return candidate;
    }
  }

  // Respaldo: construir con formato ISO local y Temporal-like offset via toLocale.
  const asLocal = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00`;
  const probe = new Date(asLocal + "Z");
  const offsetMin = offsetMinutesAt(probe, ZONA);
  return new Date(probe.getTime() - offsetMin * 60_000);
}

function offsetMinutesAt(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  });
  const name = dtf.formatToParts(date).find((p) => p.type === "timeZoneName")?.value;
  // Ej: "GMT-6" | "GMT-5"
  const match = name?.match(/GMT([+-]\d+)(?::(\d+))?/i);
  if (!match) {
    return -360; // CST por defecto
  }
  const hours = Number(match[1]);
  const mins = Number(match[2] ?? "0");
  return hours * 60 + Math.sign(hours || 1) * mins;
}
