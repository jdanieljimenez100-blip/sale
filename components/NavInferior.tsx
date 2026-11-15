"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { useSesion } from "@/components/SesionContext";

const ITEMS_BASE = [
  { href: "/cuentas", label: "Mesas" },
  { href: "/cobro-rapido", label: "Cobro rápido" },
  { href: "/propinas", label: "Propinas" },
  { href: "/reporte", label: "Reporte" },
] as const;

const ITEMS_ADMIN = [
  { href: "/equipo", label: "Equipo" },
  { href: "/ajustes", label: "Ajustes" },
] as const;

export function NavInferior(): ReactElement {
  const pathname = usePathname();
  const { rol } = useSesion();
  const esAdmin = rol === "admin";
  const items = esAdmin ? [...ITEMS_BASE, ...ITEMS_ADMIN] : [...ITEMS_BASE];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-[#f3efe6]/95 backdrop-blur">
      <ul
        className={`mx-auto grid max-w-lg gap-1 px-2 py-2 ${
          esAdmin ? "grid-cols-3" : "grid-cols-4"
        }`}
      >
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-12 items-center justify-center rounded-xl px-1 text-center text-[11px] font-semibold leading-tight sm:min-h-14 sm:text-sm ${
                  active
                    ? "bg-emerald-800 text-white"
                    : "text-neutral-700 hover:bg-white/70"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
