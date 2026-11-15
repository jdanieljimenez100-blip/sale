"use client";

import {
  useEffect,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";

export function Hoja({
  abierta,
  onCerrar,
  titulo,
  children,
}: {
  abierta: boolean;
  onCerrar: () => void;
  titulo?: string;
  children: ReactNode;
}): ReactElement {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (abierta) {
      if (!el.open) {
        el.showModal();
      }
      return;
    }
    if (el.open) {
      el.close();
    }
  }, [abierta]);

  return (
    <dialog
      ref={ref}
      className="hoja-dialog mx-auto w-full max-w-lg"
      onClose={onCerrar}
      onClick={(event) => {
        const el = ref.current;
        if (!el) {
          return;
        }
        const rect = el.getBoundingClientRect();
        const fuera =
          event.clientY < rect.top ||
          event.clientY > rect.bottom ||
          event.clientX < rect.left ||
          event.clientX > rect.right;
        if (fuera) {
          onCerrar();
        }
      }}
    >
      <div className="flex flex-col gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto h-1 w-10 rounded-full bg-linea" aria-hidden />
        {titulo ? (
          <h2 className="text-lg font-semibold text-tinta">{titulo}</h2>
        ) : null}
        {children}
      </div>
    </dialog>
  );
}
