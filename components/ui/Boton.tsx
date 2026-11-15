import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

type Variante = "primario" | "secundario" | "peligro";
type Tamano = "md" | "lg";

const variantes: Record<Variante, string> = {
  primario:
    "bg-primario text-primario-tinta hover:brightness-110 disabled:opacity-50",
  secundario:
    "border border-linea bg-superficie text-tinta hover:bg-fondo disabled:opacity-50",
  peligro:
    "bg-peligro text-white hover:brightness-110 disabled:opacity-50",
};

const tamanos: Record<Tamano, string> = {
  md: "min-h-12 rounded-boton px-4 text-[15px] font-semibold",
  lg: "min-h-14 rounded-boton px-4 text-lg font-semibold",
};

export function Boton({
  variante = "primario",
  tamano = "md",
  cargando = false,
  children,
  className = "",
  disabled,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`pressable inline-flex w-full items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${variantes[variante]} ${tamanos[tamano]} ${className}`}
      {...rest}
    >
      {cargando ? "Cargando…" : children}
    </button>
  );
}
