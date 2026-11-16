export type EstadoConexionPey =
  | "sin_conectar"
  | "servidor"
  | "conectado"
  | "recibiendo";

/**
 * Precedencia: entorno demo → recibiendo (webhook visto) → conectado → sin conectar.
 */
export function estadoConexionPey(input: {
  configurado: boolean;
  usaEntorno: boolean;
  ultimoWebhookAt: string | null;
}): EstadoConexionPey {
  if (input.usaEntorno) {
    return "servidor";
  }
  if (input.configurado && input.ultimoWebhookAt) {
    return "recibiendo";
  }
  if (input.configurado) {
    return "conectado";
  }
  return "sin_conectar";
}

export function etiquetaEstadoConexionPey(
  estado: EstadoConexionPey,
  ultimoWebhookAt: string | null,
  formatearFecha: (iso: string) => string,
): string {
  switch (estado) {
    case "servidor":
      return "Usando la configuración del servidor";
    case "recibiendo":
      return ultimoWebhookAt
        ? `Recibiendo pagos (último aviso: ${formatearFecha(ultimoWebhookAt)})`
        : "Recibiendo pagos";
    case "conectado":
      return "Conectado";
    case "sin_conectar":
      return "Sin conectar";
  }
}
