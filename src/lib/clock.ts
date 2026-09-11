import { useEffect } from "react";
import { useRegisterStore } from "../store/registerStore";
import { ensureAudio, tick } from "./sound";

export function pulseWithSound(): void {
  const s = useRegisterStore.getState();
  s.pulseClock();
  if (s.soundOn) {
    void ensureAudio().then(tick);
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
