import { AnimatePresence, motion } from "framer-motion";
import { useRegisterStore } from "../store/registerStore";
import type { Mode } from "../types/register";

const MODE_NAMES: Record<Mode, string> = {
  SIPO: "Serial In · Parallel Out",
  PISO: "Parallel In · Serial Out",
  PIPO: "Parallel In · Parallel Out",
};

export function ModeBadge() {
  const mode = useRegisterStore((s) => s.mode);

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 rounded-2xl border border-hi/40 bg-hi/10 px-4 py-2 shadow-glowCyan"
        >
          <span className="font-mono text-2xl font-bold tracking-widest text-hi">{mode}</span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{MODE_NAMES[mode]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
