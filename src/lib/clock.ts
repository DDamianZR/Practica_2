import { useEffect } from "react";
import { useRegisterStore } from "../store/registerStore";

export function useAutoRun() {
  const running = useRegisterStore((s) => s.running);
  const speedBpm = useRegisterStore((s) => s.speedBpm);

  useEffect(() => {
    if (!running) return;

    const periodMs = 60000 / speedBpm;
    let id: ReturnType<typeof setTimeout>;

    const tick = () => {
      useRegisterStore.getState().pulseClock();
      id = setTimeout(tick, periodMs);
    };
    id = setTimeout(tick, periodMs);

    return () => clearTimeout(id);
  }, [running, speedBpm]);
}
