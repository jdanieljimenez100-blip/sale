import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import {
  indiceTema,
  obtenerTema,
  TEMAS_AYUDA,
} from "@/lib/ayuda/temas";

type Props = { params: Promise<{ tema: string }> };

export function generateStaticParams(): Array<{ tema: string }> {
  return TEMAS_AYUDA.map((t) => ({ tema: t.slug }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { tema: slug } = await params;
  const tema = obtenerTema(slug);
  if (!tema) {
    return { title: "Ayuda — Sale" };
  }
  return {
    title: `${tema.titulo} — Ayuda Sale`,
    description: tema.resumen,
  };
}

export default async function AyudaTemaPage({
  params,
}: Props): Promise<ReactElement> {
  const { tema: slug } = await params;
  const tema = obtenerTema(slug);
  if (!tema) {
    notFound();
  }
  const actual = tema;

  const i = indiceTema(slug);
  const anterior = i > 0 ? TEMAS_AYUDA[i - 1] : undefined;
  const siguiente =
    i >= 0 && i < TEMAS_AYUDA.length - 1 ? TEMAS_AYUDA[i + 1] : undefined;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-4 py-8 text-tinta">
      <p className="text-[15px] text-tinta-suave">
        <Link
          href="/ayuda"
          className="font-medium text-primario underline underline-offset-2"
        >
          Ayuda
        </Link>
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-pretty">
        {actual.titulo}
      </h1>
      <p className="mt-2 text-[15px] text-tinta-suave text-pretty">
        {actual.resumen}
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {actual.secciones.map((sec) => (
          <section key={sec.titulo} className="flex flex-col gap-3">
            <h2 className="text-[17px] font-semibold text-tinta text-pretty">
              {sec.titulo}
            </h2>
            {sec.parrafos.map((p, idx) => (
              <p
                key={`${sec.titulo}-p-${idx}`}
                className="text-[15px] leading-relaxed text-tinta text-pretty"
              >
                {p}
              </p>
            ))}
            {sec.pasos && sec.pasos.length > 0 ? (
              <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-tinta">
                {sec.pasos.map((paso, idx) => (
                  <li
                    key={`${sec.titulo}-paso-${idx}`}
                    className="text-pretty"
                  >
                    {paso}
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        ))}
      </div>

      <nav
        className="mt-10 flex flex-col gap-3 border-t border-linea pt-6"
        aria-label="Navegación de ayuda"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {anterior ? (
            <Link
              href={`/ayuda/${anterior.slug}`}
              className="pressable inline-flex min-h-12 items-center rounded-boton border border-linea bg-superficie px-4 text-[15px] font-semibold text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              ← {anterior.titulo}
            </Link>
          ) : (
            <span />
          )}
          {siguiente ? (
            <Link
              href={`/ayuda/${siguiente.slug}`}
              className="pressable inline-flex min-h-12 items-center rounded-boton bg-primario px-4 text-[15px] font-semibold text-primario-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              {siguiente.titulo} →
            </Link>
          ) : null}
        </div>
        <Link
          href="/ayuda"
          className="text-[15px] font-medium text-primario underline underline-offset-2"
        >
          Volver a Ayuda
        </Link>
      </nav>
    </main>
  );
}
