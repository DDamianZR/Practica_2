import type * as ToneModule from "tone";

let Tone: typeof ToneModule | null = null;
let clickSynth: ToneModule.MetalSynth | null = null;
let toneSynth: ToneModule.Synth | null = null;
let lastClickTime = 0;
let lastToneTime = 0;

export async function ensureAudio(): Promise<void> {
  if (clickSynth) return;
  Tone = await import("tone");
  await Tone.start();
  clickSynth = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
    harmonicity: 3.1,
    modulationIndex: 8,
    resonance: 3000,
    octaves: 0.5,
  }).toDestination();
  clickSynth.volume.value = -18;
  toneSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.005, decay: 0.15, release: 0.1 },
  }).toDestination();
  toneSynth.volume.value = -16;
}

export function tick(): void {
  if (!clickSynth || !Tone) return;
  // MetalSynth requires strictly increasing schedule times; rapid clicks can
  // otherwise land on the same Tone.now() value and throw.
  const t = Math.max(Tone.now(), lastClickTime + 0.001);
  clickSynth.triggerAttackRelease("C5", "16n", t);
  lastClickTime = t;
}

export function modeChangeTone(): void {
  if (!toneSynth || !Tone) return;
  const t = Math.max(Tone.now(), lastToneTime + 0.001);
  toneSynth.triggerAttackRelease("E5", "8n", t);
  lastToneTime = t;
}

export function serialBlip(): void {
  if (!toneSynth || !Tone) return;
  const t = Math.max(Tone.now(), lastToneTime + 0.001);
  toneSynth.triggerAttackRelease("A5", "32n", t);
  lastToneTime = t;
}
