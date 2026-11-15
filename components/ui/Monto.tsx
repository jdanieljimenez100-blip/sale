import type { ReactElement } from "react";
import { formatearMxn } from "@/lib/money";

export function Monto({
  centavos,
  className = "",
}: {
  centavos: number;
  className?: string;
}): ReactElement {
  return (
    <span className={`tabular ${className}`}>{formatearMxn(centavos)}</span>
  );
}
