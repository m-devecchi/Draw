// Suoni generati con la Web Audio API: nessun file da scaricare, nessuna
// richiesta di rete, pochi byte di codice. Note di una scala pentatonica,
// che suona sempre allegra qualunque sia l'ordine dei tocchi.

const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0]; // Do Re Mi Sol La
const MUTE_KEY = "colora-muted";

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // Su iOS il contesto parte sospeso: si riattiva al primo tocco.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // localStorage non disponibile: il silenzio vale per questa sessione
  }
}

/** Nota singola con inviluppo morbido (niente "click" di attacco). */
function tone(
  frequency: number,
  startAt: number,
  duration: number,
  volume: number
) {
  const ac = audioContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  const t0 = ac.currentTime + startAt;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Tocco su un'area: nota della scala, sale col numero di aree colorate. */
export function playFill(step: number) {
  if (isMuted()) return;
  tone(SCALE[Math.abs(step) % SCALE.length], 0, 0.22, 0.18);
}

/** Gomma: nota breve e più bassa. */
export function playErase() {
  if (isMuted()) return;
  tone(392.0, 0, 0.16, 0.12);
}

/** Disegno completato: arpeggio festoso. */
export function playComplete() {
  if (isMuted()) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(f, i * 0.11, 0.45, 0.2)
  );
}
