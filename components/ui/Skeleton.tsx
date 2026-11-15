import type { ReactElement } from "react";

export function Skeleton({
  className = "",
}: {
  className?: string;
}): ReactElement {
  return (
    <div
      className={`rounded-boton bg-linea/70 ${className}`}
      aria-hidden
    />
  );
}
