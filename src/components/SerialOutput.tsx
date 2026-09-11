import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useRegisterStore } from "../store/registerStore";

export function SerialOutput() {
  const [mode, serialHistory] = useRegisterStore(useShallow((s) => [s.mode, s.serialHistory]));
  const active = mode === "PISO";
  const last = serialHistory[serialHistory.length - 1];

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-panel2 px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Salida serie (SO)</span>
      {active ? (
        <div className="flex items-center gap-4">
          <motion.span
            key={serialHistory.length}
            initial={{ scale: 0.7, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-hi bg-hi/10 font-mono text-2xl font-bold text-hi shadow-glowCyan"
          >
            {last ?? "–"}
          </motion.span>
          <div className="flex flex-wrap items-center gap-1 font-mono text-sm text-muted">
            {serialHistory.length === 0 ? (
              <span className="text-muted/60">esperando el primer bit expulsado…</span>
            ) : (
              serialHistory.map((bit, i) => (
                <span
                  key={i}
                  className={i === serialHistory.length - 1 ? "font-bold text-hi" : "text-text"}
                >
                  {bit}
                </span>
              ))
            )}
          </div>
        </div>
      ) : (
        <span className="font-mono text-xs text-muted/60">salida serie — solo en PISO</span>
      )}
    </div>
  );
}
