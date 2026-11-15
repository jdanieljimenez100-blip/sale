import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PEY_MODE: z.enum(["mock", "real"]).default("mock"),
  PEY_API_KEY: z.string().optional(),
  PEY_WEBHOOK_SECRET: z.string().optional(),
  PEY_BANK_ACCOUNT_RESTAURANTE: z.string().optional(),
  PEY_BANK_ACCOUNT_MESERO: z.string().optional(),
  DEMO_ACCESS_TOKEN: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) {
    return cached;
  }
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Variables de entorno inválidas: ${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`,
    );
  }
  if (parsed.data.PEY_MODE === "real") {
    if (!parsed.data.PEY_API_KEY || !parsed.data.PEY_WEBHOOK_SECRET) {
      throw new Error("PEY_MODE=real requiere PEY_API_KEY y PEY_WEBHOOK_SECRET");
    }
  }
  cached = parsed.data;
  return cached;
}

export function getPublicSupabaseConfig(): {
  url: string;
  anonKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}
