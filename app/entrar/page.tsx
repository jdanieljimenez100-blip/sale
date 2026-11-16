import Link from "next/link";
import type { ReactElement } from "react";
import { AvisoPrivacidadSimplificado } from "@/components/AvisoPrivacidadSimplificado";
import { DemoCredenciales } from "@/components/DemoCredenciales";
import { EntrarPantalla } from "@/components/EntrarPantalla";
import { slugValido } from "@/services/auth";

type Props = {
  searchParams: Promise<{ r?: string }>;
};

export default async function EntrarPage({
  searchParams,
}: Props): Promise<ReactElement> {
  const params = await searchParams;
  const rParam = params.r?.trim().toLowerCase() ?? "";
  const slugDesdeUrl = rParam && slugValido(rParam) ? rParam : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-4 py-8">
      <EntrarPantalla slugDesdeUrl={slugDesdeUrl} />
      <DemoCredenciales />
      <footer className="mt-auto flex flex-col gap-3 border-t border-linea pt-4">
        <Link
          href="/ayuda"
          className="text-[15px] font-medium text-primario underline underline-offset-2"
        >
          ¿Cómo funciona?
        </Link>
        <AvisoPrivacidadSimplificado />
      </footer>
    </main>
  );
}
