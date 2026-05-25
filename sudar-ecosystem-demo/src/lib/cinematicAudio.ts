/**
 * Web Audio cues for launch demo, soft cinematic transitions (no harsh noise whoosh).
 */

export type AudioCue = "ambient" | "whoosh" | "click" | "success" | "title";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function envGain(
  context: AudioContext,
  peak: number,
  attack: number,
  release: number,
  duration: number
) {
  const g = context.createGain();
  const t = context.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration - release);
  return g;
}

/** Soft tonal sweep, closer to premium SaaS UI transitions than noise whoosh */
function playWhoosh(context: AudioContext, volume: number) {
  const t = context.currentTime;
  const dur = 0.42;
  const master = envGain(context, volume * 0.07, 0.02, 0.15, dur);

  const osc1 = context.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(180, t);
  osc1.frequency.exponentialRampToValueAtTime(520, t + dur * 0.7);

  const osc2 = context.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(90, t);
  osc2.frequency.exponentialRampToValueAtTime(220, t + dur);

  const lp = context.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(400, t);
  lp.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.5);
  lp.frequency.exponentialRampToValueAtTime(600, t + dur);

  osc1.connect(lp);
  osc2.connect(lp);
  lp.connect(master);
  master.connect(context.destination);

  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + dur);
  osc2.stop(t + dur);
}

function playClick(context: AudioContext, volume: number) {
  const osc = context.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.05);
  const g = envGain(context, volume * 0.06, 0.008, 0.04, 0.08);
  osc.connect(g);
  g.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.09);
}

function playSuccess(context: AudioContext, volume: number) {
  const freqs = [523.25, 659.25, 783.99];
  freqs.forEach((f, i) => {
    const osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const start = context.currentTime + i * 0.09;
    const g = context.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(volume * 0.05, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(g);
    g.connect(context.destination);
    osc.start(start);
    osc.stop(start + 0.24);
  });
}

function playTitle(context: AudioContext, volume: number) {
  const t = context.currentTime;
  const osc = context.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(196, t);
  osc.frequency.exponentialRampToValueAtTime(294, t + 0.55);
  const g = envGain(context, volume * 0.045, 0.1, 0.22, 0.6);
  osc.connect(g);
  g.connect(context.destination);
  osc.start(t);
  osc.stop(t + 0.62);
}

let ambientNodes: { osc: OscillatorNode; g: GainNode } | null = null;

export function startAmbient(volume: number) {
  const context = getCtx();
  if (!context || ambientNodes) return;
  const osc = context.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 110;
  const g = context.createGain();
  g.gain.value = volume * 0.008;
  osc.connect(g);
  g.connect(context.destination);
  osc.start();
  ambientNodes = { osc, g };
}

export function stopAmbient() {
  if (!ambientNodes) return;
  try {
    ambientNodes.osc.stop();
  } catch {
    /* already stopped */
  }
  ambientNodes = null;
}

export function resumeAudioContext() {
  const context = getCtx();
  if (context?.state === "suspended") void context.resume();
}

export function playCue(cue: AudioCue, volume = 1) {
  const context = getCtx();
  if (!context) return;
  switch (cue) {
    case "whoosh":
      playWhoosh(context, volume);
      break;
    case "click":
      playClick(context, volume);
      break;
    case "success":
      playSuccess(context, volume);
      break;
    case "title":
      playTitle(context, volume);
      break;
    case "ambient":
      startAmbient(volume);
      break;
    default:
      break;
  }
}
