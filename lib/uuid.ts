import { z } from "zod";

/** Acepta UUID hex 8-4-4-4-12 (incl. ids de seed de demo que no son RFC estrictos). */
export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "UUID inválido",
  );
