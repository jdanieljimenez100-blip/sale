"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import { getStoredDemoToken } from "@/lib/demo-token";

/** Solo pantallas del mesero. Nunca en QR/Pagado del comensal. */
export function TokenAviso(): ReactElement | null {
  const [falta, setFalta] = useState(false);

  useEffect(() => {
    setFalta(getStoredDemoToken().trim().length === 0);
  }, []);

  if (!falta) {
    return null;
  }

  return (
    <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-950">
      Falta configurar este dispositivo.{" "}
      <Link href="/ajustes" className="font-semibold underline">
        Ir a Ajustes
      </Link>
    </p>
  );
}
