import { useEffect } from "react";
import { useRegisterStore } from "../store/registerStore";
import { pulseWithSound } from "./clock";

export function useShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      const s = useRegisterStore.getState();
      switch (e.key) {
        case " ":
          e.preventDefault();
          pulseWithSound();
          break;
        case "c":
        case "C":
          s.clear();
          break;
        case "0":
          s.setData(0);
          break;
        case "1":
          s.setData(1);
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
