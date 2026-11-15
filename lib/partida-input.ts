import { z } from "zod";

const notasSchema = z
  .string()
  .max(120)
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null) {
      return null;
    }
    const t = v.trim();
    return t.length === 0 ? null : t;
  });

/** Platillo del menú (mesero o admin). */
export const partidaMenuSchema = z.object({
  menuItemId: z.string().uuid(),
  cantidad: z.number().int().min(1).max(99),
  notas: notasSchema,
});

/** Libre (solo admin: "Otro"). */
export const partidaLibreSchema = z.object({
  descripcion: z.string().min(1).max(80),
  cantidad: z.number().int().min(1).max(99),
  precioPesos: z.string().min(1),
  notas: notasSchema,
});

export const partidaBodySchema = z.union([partidaMenuSchema, partidaLibreSchema]);

export type PartidaMenuInput = z.infer<typeof partidaMenuSchema>;
export type PartidaLibreInput = z.infer<typeof partidaLibreSchema>;
export type PartidaBody = z.infer<typeof partidaBodySchema>;

export function esPartidaMenu(body: PartidaBody): body is PartidaMenuInput {
  return "menuItemId" in body;
}
