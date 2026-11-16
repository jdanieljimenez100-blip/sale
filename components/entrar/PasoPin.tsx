import type { ReactElement } from "react";
import { Boton } from "@/components/ui/Boton";
import { PIN_MAX, PIN_MIN, type MeseroLogin } from "@/lib/entrar";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"] as const;

export function PasoPin({
  tituloId,
  elegido,
  pin,
  busy,
  bloqueado,
  shake,
  onVolver,
  onDigito,
  onBorrar,
  onEntrar,
}: {
  tituloId: string;
  elegido: MeseroLogin;
  pin: string;
  busy: boolean;
  bloqueado: boolean;
  shake: boolean;
  onVolver: () => void;
  onDigito: (d: string) => void;
  onBorrar: () => void;
  onEntrar: () => void;
}): ReactElement {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={tituloId}>
      <header>
        <button
          type="button"
          onClick={onVolver}
          className="min-h-12 text-[15px] text-tinta-suave underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        >
          Volver a la lista
        </button>
        <h1
          id={tituloId}
          tabIndex={-1}
          className="mt-2 text-[32px] font-semibold leading-tight text-tinta text-pretty outline-none"
        >
          Hola, {elegido.nombre}
        </h1>
        <p className="mt-1 text-[15px] text-tinta-suave">Escribe tu PIN</p>
      </header>

      <div
        className={`flex min-h-14 items-center justify-center gap-2 ${shake ? "pin-shake" : ""}`}
        aria-label={`PIN: ${pin.length} de ${PIN_MAX} dígitos`}
      >
        {Array.from({ length: PIN_MAX }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className={`h-3 w-3 rounded-full ${
              i < pin.length ? "bg-tinta" : "bg-linea"
            }`}
          />
        ))}
      </div>
      <p className="text-center text-[13px] text-tinta-suave">
        {PIN_MIN} o {PIN_MAX} dígitos
      </p>

      <div className="grid grid-cols-3 gap-2">
        {TECLAS.map((tecla, i) => {
          if (tecla === "") {
            return <div key={`empty-${i}`} />;
          }
          return (
            <button
              key={tecla}
              type="button"
              disabled={busy || bloqueado}
              aria-label={tecla === "⌫" ? "Borrar" : undefined}
              onClick={() => {
                if (tecla === "⌫") {
                  onBorrar();
                  return;
                }
                onDigito(tecla);
              }}
              className="pressable flex min-h-16 items-center justify-center rounded-boton bg-tinta text-[22px] font-semibold text-primario-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:opacity-50"
            >
              {tecla}
            </button>
          );
        })}
      </div>
      <Boton
        tamano="lg"
        disabled={busy || bloqueado || pin.length < PIN_MIN}
        onClick={onEntrar}
      >
        Entrar
      </Boton>
    </section>
  );
}
