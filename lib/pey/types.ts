export type CrearCobroInput = {
  montoCentavos: number;
  concepto: string;
  bankAccountId?: string;
  numRef?: string;
  expirationSeconds?: number;
};

export type CrearCobroResult = {
  peyQrId: string;
  qrString: string;
  amountPesos: number;
};

export type PeyWebhookPayload = {
  amount: number;
  apiKeyId: string;
  bankAccountId?: string;
  codiQrId: string;
  concept: string;
  datePaid: number;
  numRef?: string;
  transactionId: string;
  type: string;
};

export type VerificarWebhookResult = {
  eventId: string;
  payload: PeyWebhookPayload;
};

/** Solo campos seguros de GET /bank-account/:id (nunca CLABE). */
export type PeyCuentaBancariaResumen = {
  id: string;
  alias: string | null;
  codiStatus: string | null;
};

export type PeyClient = {
  crearCobro: (input: CrearCobroInput) => Promise<CrearCobroResult>;
  verificarWebhook: (request: Request) => Promise<VerificarWebhookResult>;
  obtenerCuentaBancaria: (
    id: string,
  ) => Promise<PeyCuentaBancariaResumen | null>;
};

export type PeyClientCredentials = {
  apiKey: string;
  webhookSecret: string;
};
