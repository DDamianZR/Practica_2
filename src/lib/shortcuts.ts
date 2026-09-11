import { useEffect } from "react";
import { useRegisterStore } from "../store/registerStore";
import { cycleModeWithSound, pulseWithSound } from "./clock";
import type { Bit } from "../types/register";

const DIP_KEYS: Record<string, number> = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
  "5": 4,
  "6": 5,
  "7": 6,
  "8": 7,
};

export function useShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      const s = useRegisterStore.getState();
      if (e.key in DIP_KEYS) {
        const index = DIP_KEYS[e.key];
        const current = s.dip[index];
        const flipped: Bit = current === 1 ? 0 : 1;
        s.setDip(index, flipped);
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          pulseWithSound();
          break;
        case "c":
        case "C":
          s.clear();
          break;
        case "m":
        case "M":
          cycleModeWithSound();
          break;
        case "p":
        case "P":
          if (s.running) s.pause();
          else s.play();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
