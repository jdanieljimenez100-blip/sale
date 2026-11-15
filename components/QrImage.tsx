"use client";

import { useEffect, useState, type ReactElement } from "react";
import QRCode from "qrcode";

export function QrImage({
  value,
  label,
}: {
  value: string;
  label: string;
}): ReactElement {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(value, { margin: 2, width: 320 })
      .then((url) => {
        if (!cancelled) {
          setSrc(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudo generar el QR");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (error) {
    return <p className="text-red-700">{error}</p>;
  }
  if (!src) {
    return <p className="text-neutral-600">Generando QR…</p>;
  }
  return (
    <img
      src={src}
      alt={label}
      className="mx-auto h-72 w-72 rounded-2xl bg-white p-3 shadow"
    />
  );
}
