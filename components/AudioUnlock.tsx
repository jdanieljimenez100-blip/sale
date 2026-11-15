"use client";

import { useEffect, type ReactElement } from "react";
import { instalarUnlockAudio } from "@/lib/sonido";

/** Montado en el layout: desbloquea el audio con el primer toque. */
export function AudioUnlock(): ReactElement | null {
  useEffect(() => instalarUnlockAudio(), []);
  return null;
}
