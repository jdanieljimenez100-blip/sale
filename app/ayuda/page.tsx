import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";
import { TEMAS_AYUDA } from "@/lib/ayuda/temas";

export const metadata: Metadata = {
  title: "Ayuda — Sale",
  description: "Guías para meseros y admins: cobro CoDi, pey, propinas y más",
};

export default function AyudaIndexPage(): ReactElement {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-4 py-8 text-tinta">
      <header className="mb-6">
        <p className="text-[15px] text-tinta-suave">Sale</p>
        <h1 className="mt-1 text-[32px] font-semibold tracking-tight text-pretty">
          Ayuda
        </h1>
        <p className="mt-2 text-[15px] text-tinta-suave text-pretty">
          Guías cortas para el salón y para conectar pey. Sin jerga innecesaria.
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {TEMAS_AYUDA.map((tema) => (
          <li key={tema.slug}>
            <Link
              href={`/ayuda/${tema.slug}`}
              className="pressable flex min-h-14 flex-col gap-1 rounded-hoja border border-linea bg-superficie px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              <span className="text-[17px] font-semibold text-tinta">
                {tema.titulo}
              </span>
              <span className="text-[15px] text-tinta-suave text-pretty">
                {tema.resumen}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8">
        <Link
          href="/entrar"
          className="text-[15px] font-medium text-primario underline underline-offset-2"
        >
          Ir a entrar
        </Link>
        {" · "}
        <Link
          href="/privacidad"
          className="text-[15px] font-medium text-primario underline underline-offset-2"
        >
          Privacidad
        </Link>
      </p>
    </main>
  );
}
