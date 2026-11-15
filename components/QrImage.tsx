"use client";

import { useEffect, useState, type ReactElement } from "react";
import QRCode from "qrcode";
import { Skeleton } from "@/components/ui/Skeleton";

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
    void QRCode.toDataURL(value, { margin: 2, width: 360 })
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
    return (
      <p className="text-peligro" role="alert">
        {error}
      </p>
    );
  }
  if (!src) {
    return (
      <Skeleton className="mx-auto h-[min(80vw,360px)] w-[min(80vw,360px)]" />
    );
  }
  return (
    <img
      src={src}
      alt={label}
      width={360}
      height={360}
      className="mx-auto w-[min(80vw,360px)] rounded-hoja border border-linea bg-superficie p-4"
    />
  );
}
