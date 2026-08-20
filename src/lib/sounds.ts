// Suoni generati con la Web Audio API: nessun file da scaricare, nessuna
// richiesta di rete, pochi byte di codice. Note di una scala pentatonica,
// che suona sempre allegra qualunque sia l'ordine dei tocchi.

const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0]; // Do Re Mi Sol La
const MUTE_KEY = "colora-muted";

let ctx: AudioContext | null = null;
let unlocked = false;

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
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * Sblocco dell'audio, da chiamare al primo tocco dell'utente.
 *
 * Su iPhone servono due accorgimenti che nessun'altra piattaforma richiede:
 * 1. `audioSession.type = "playback"` (Safari 16.4+), altrimenti la Web
 *    Audio finisce nella categoria "ambient" e **il tasto silenzioso
 *    laterale la zittisce**: l'app sembra muta pur funzionando.
 * 2. un buffer silenzioso avviato dentro il gesto dell'utente, che è ciò
 *    che iOS considera un vero "consenso" a suonare.
 */
export function unlockAudio() {
  if (unlocked || typeof window === "undefined") return;
  unlocked = true;

  const session = (
    navigator as Navigator & { audioSession?: { type: string } }
  ).audioSession;
  if (session) {
    try {
      session.type = "playback";
    } catch {
      // proprietà non scrivibile su questo browser: si prosegue
    }
  }

  const ac = audioContext();
  if (!ac) return;
  const source = ac.createBufferSource();
  source.buffer = ac.createBuffer(1, 1, 22050);
  source.connect(ac.destination);
  source.start(0);
}

/** Riattiva il contesto se il sistema l'ha sospeso (app in background). */
export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
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
  // Contesto ancora sospeso: si programma la nota solo dopo il risveglio,
  // altrimenti currentTime e' fermo e la nota risulta gia' passata.
  if (ac.state === "suspended") {
    void ac.resume().then(() => schedule(ac, frequency, startAt, duration, volume));
    return;
  }
  schedule(ac, frequency, startAt, duration, volume);
}

function schedule(
  ac: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number
) {
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
