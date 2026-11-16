import type { FormEvent, ReactElement } from "react";
import { Boton } from "@/components/ui/Boton";
import type { NegocioLogin } from "@/lib/entrar";

export function PasoBienvenida({
  tituloId,
  mostrarFormCodigo,
  negocio,
  codigoBorrador,
  onCodigoChange,
  onConfirmarCodigo,
  onCambiarRestaurante,
  onContinuar,
}: {
  tituloId: string;
  mostrarFormCodigo: boolean;
  negocio: NegocioLogin | null;
  codigoBorrador: string;
  onCodigoChange: (valor: string) => void;
  onConfirmarCodigo: () => void;
  onCambiarRestaurante: () => void;
  onContinuar: () => void;
}): ReactElement {
  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onConfirmarCodigo();
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby={tituloId}>
      <header className="flex flex-col gap-2">
        <p className="text-[22px] font-bold text-primario">Sale</p>
        <h1
          id={tituloId}
          tabIndex={-1}
          className="text-[32px] font-semibold leading-tight text-tinta text-pretty outline-none"
        >
          Bienvenida
        </h1>
        <p className="text-[17px] text-tinta-suave">
          Cobra con CoDi en segundos
        </p>
      </header>

      {mostrarFormCodigo || !negocio ? (
        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1 text-[15px] text-tinta">
            Código del restaurante
            <input
              name="codigo"
              autoComplete="off"
              spellCheck={false}
              className="min-h-14 rounded-boton border border-linea bg-superficie px-3 font-mono text-[17px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
              placeholder="ej. demo"
              value={codigoBorrador}
              onChange={(event) => onCodigoChange(event.target.value)}
              required
            />
          </label>
          <Boton type="submit" tamano="lg">
            Continuar
          </Boton>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-hoja border border-linea bg-superficie px-4 py-4">
            <p className="text-[13px] text-tinta-suave">Restaurante</p>
            <p className="mt-1 text-[22px] font-semibold text-tinta text-pretty">
              {negocio.nombre}
            </p>
            <button
              type="button"
              onClick={onCambiarRestaurante}
              className="mt-3 min-h-12 text-left text-[15px] font-medium text-primario underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              Cambiar restaurante
            </button>
          </div>
          <Boton tamano="lg" onClick={onContinuar}>
            Continuar
          </Boton>
        </div>
      )}
    </section>
  );
}
