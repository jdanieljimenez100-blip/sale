"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

const ITEMS = [
  { href: "/cuentas", label: "Mesas" },
  { href: "/cobro-rapido", label: "Cobro rápido" },
  { href: "/propinas", label: "Propinas" },
  { href: "/reporte", label: "Reporte" },
] as const;

export function NavInferior(): ReactElement {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-[#f3efe6]/95 backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-14 items-center justify-center rounded-xl px-1 text-center text-xs font-semibold sm:text-sm ${
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
