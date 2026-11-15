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

export type PeyClient = {
  crearCobro: (input: CrearCobroInput) => Promise<CrearCobroResult>;
  verificarWebhook: (request: Request) => Promise<VerificarWebhookResult>;
};
