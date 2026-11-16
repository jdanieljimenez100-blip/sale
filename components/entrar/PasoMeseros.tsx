import type { ReactElement } from "react";
import { iniciales, type MeseroLogin } from "@/lib/entrar";

export function PasoMeseros({
  tituloId,
  meseros,
  onAtras,
  onElegir,
}: {
  tituloId: string;
  meseros: MeseroLogin[];
  onAtras: () => void;
  onElegir: (mesero: MeseroLogin) => void;
}): ReactElement {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={tituloId}>
      <header>
        <button
          type="button"
          onClick={onAtras}
          className="min-h-12 text-[15px] text-tinta-suave underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        >
          Atrás
        </button>
        <h1
          id={tituloId}
          tabIndex={-1}
          className="mt-2 text-[32px] font-semibold leading-tight text-tinta text-pretty outline-none"
        >
          ¿Quién atiende hoy?
        </h1>
      </header>
      {meseros.length === 0 ? (
        <p className="rounded-hoja border border-linea bg-superficie p-4 text-tinta-suave">
          No hay meseros con PIN. Ve a{" "}
          <a href="/setup" className="font-semibold text-primario underline">
            /setup
          </a>{" "}
          para el primer admin.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {meseros.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onElegir(m)}
                className="pressable flex min-h-14 w-full flex-col items-center justify-center gap-2 rounded-hoja border border-linea bg-superficie px-2 py-3 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
              >
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primario text-[15px] font-semibold text-primario-tinta"
                >
                  {iniciales(m.nombre)}
                </span>
                <span className="text-[15px] font-semibold text-tinta text-pretty">
                  {m.nombre}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
