"use client";

let unlocked = false;
let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!sharedCtx) {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

/** Desbloquea el audio en el primer toque (iOS/Android). */
export function instalarUnlockAudio(): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const unlock = (): void => {
    const ctx = getCtx();
    if (!ctx) {
      return;
    }
    void ctx.resume().then(() => {
      unlocked = true;
    });
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  return () => {
    window.removeEventListener("pointerdown", unlock);
  };
}

/** Beep corto. Solo suena si el audio ya se desbloqueó con un toque. */
export function beep(): void {
  if (!unlocked) {
    return;
  }
  const ctx = getCtx();
  if (!ctx || ctx.state !== "running") {
    return;
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.value = 0.05;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  window.setTimeout(() => {
    osc.stop();
  }, 350);
}
