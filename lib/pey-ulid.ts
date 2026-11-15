import { z } from "zod";

/** ULID de pey (docs: bankAccountId). */
export const peyUlidSchema = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "ID de cuenta pey inválido (ULID)");
