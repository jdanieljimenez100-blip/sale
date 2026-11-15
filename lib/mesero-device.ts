const STORAGE_KEY = "sale.meseroId";

export function leerMeseroDevice(): string | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function guardarMeseroDevice(meseroId: string): void {
  try {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, meseroId);
  } catch {
    // localStorage puede fallar en modo privado; no bloquea la demo.
  }
}
