import type { ReactElement, ReactNode } from "react";
import { NavInferior } from "@/components/NavInferior";
import { TokenAviso } from "@/components/TokenAviso";

export function MeseroChrome({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-4 py-8 pb-28">
      <TokenAviso />
      {children}
      <NavInferior />
    </main>
  );
}
