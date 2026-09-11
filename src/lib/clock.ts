import { useEffect } from "react";
import { useRegisterStore } from "../store/registerStore";
import { ensureAudio, modeChangeTone, serialBlip, tick } from "./sound";

export function pulseWithSound(): void {
  const before = useRegisterStore.getState();
  before.pulseClock();
  if (before.soundOn) {
    const after = useRegisterStore.getState();
    const last = after.history[after.history.length - 1];
    void ensureAudio().then(() => {
      tick();
      if (last && last.serialOut !== null) serialBlip();
    });
  }
}

export function cycleModeWithSound(): void {
  const s = useRegisterStore.getState();
  s.cycleMode();
  if (s.soundOn) {
    void ensureAudio().then(modeChangeTone);
  }
}

export function useAutoRun() {
  const running = useRegisterStore((s) => s.running);
  const speedBpm = useRegisterStore((s) => s.speedBpm);

  useEffect(() => {
    if (!running) return;

    const periodMs = 60000 / speedBpm;
    let id: ReturnType<typeof setTimeout>;

    const loop = () => {
      pulseWithSound();
      id = setTimeout(loop, periodMs);
    };
    id = setTimeout(loop, periodMs);

    return () => clearTimeout(id);
  }, [running, speedBpm]);
}
