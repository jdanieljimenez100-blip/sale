"use client";

import type { ReactElement } from "react";
import { Boton } from "@/components/ui/Boton";

export default function ErrorCuenta({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactElement {
  return (
    <div className="flex flex-col gap-4 rounded-hoja border border-linea bg-superficie p-4">
      <p className="text-[17px] font-semibold text-tinta" role="alert">
        Algo salió mal al mostrar la mesa
      </p>
      <p className="text-[15px] text-tinta-suave">
        Puedes intentar de nuevo sin perder el resto de la sesión.
      </p>
      <Boton
        onClick={() => {
          reset();
        }}
      >
        Recargar
      </Boton>
    </div>
  );
}
