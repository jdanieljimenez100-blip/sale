import Link from "next/link";
import type { ReactElement } from "react";

type Props = {
  /** Texto extra bajo el aviso (p. ej. reseña). */
  extra?: string;
  className?: string;
};

/**
 * Aviso simplificado LFPDPPP + enlace al integral en /privacidad.
 * Solo presentación; sin lógica de negocio.
 */
export function AvisoPrivacidadSimplificado({
  extra,
  className = "",
}: Props): ReactElement {
  return (
    <p
      className={`text-[13px] leading-snug text-tinta-suave text-pretty ${className}`}
    >
      Usamos tus datos solo para operar el punto de venta, cobrar con CoDi y
      emitir el ticket. No rastreamos ni vendemos datos.{" "}
      <Link
        href="/privacidad"
        className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
      >
        Aviso de privacidad
      </Link>
      .
      {extra ? (
        <>
          {" "}
          <span className="block mt-1">{extra}</span>
        </>
      ) : null}
    </p>
  );
}
