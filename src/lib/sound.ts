import type * as ToneModule from "tone";

let Tone: typeof ToneModule | null = null;
let synth: ToneModule.MetalSynth | null = null;
let lastTickTime = 0;

export async function ensureAudio(): Promise<void> {
  if (synth) return;
  Tone = await import("tone");
  await Tone.start();
  synth = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
    harmonicity: 3.1,
    modulationIndex: 8,
    resonance: 3000,
    octaves: 0.5,
  }).toDestination();
  synth.volume.value = -18;
}

export function tick(): void {
  if (!synth || !Tone) return;
  // MetalSynth requires strictly increasing schedule times; rapid clicks can
  // otherwise land on the same Tone.now() value and throw.
  const t = Math.max(Tone.now(), lastTickTime + 0.001);
  synth.triggerAttackRelease("C5", "16n", t);
  lastTickTime = t;
}
