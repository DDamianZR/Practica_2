import { motion } from "framer-motion";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import { useRegisterStore } from "../store/registerStore";
import { cycleModeWithSound, pulseWithSound } from "../lib/clock";
import { CLK_PIN, CLR_PIN, DIP_PINS, MODE_PIN } from "../lib/pinmap";

function DipToggle({ index, active }: { index: number; active: boolean }) {
  const value = useRegisterStore((s) => s.dip[index]);
  const setDip = useRegisterStore((s) => s.setDip);

  return (
    <div className={clsx("flex flex-col items-center gap-1 transition-opacity duration-200", !active && "opacity-40")}>
      <span className="font-mono text-[9px] uppercase tracking-wider text-muted">D{index} · {DIP_PINS[index]}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value === 1}
        aria-label={`Interruptor DIP D${index}, pin ${DIP_PINS[index]}. Estado actual: ${value === 1 ? "encendido (1)" : "apagado (0)"}. Activar para cambiar.`}
        onClick={() => setDip(index, value === 1 ? 0 : 1)}
        className={clsx(
          "relative h-7 w-12 rounded-full border transition-colors duration-200",
          value === 1 ? "border-hi2/60 bg-hi2/10" : "border-line bg-panel2",
        )}
      >
        <motion.span
          animate={{ x: value === 1 ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={clsx(
            "absolute top-1 h-5 w-5 rounded-full",
            value === 1 ? "bg-hi2 shadow-glow" : "bg-lo",
          )}
        />
      </button>
      <span className="font-mono text-[11px] font-bold text-text">{value}</span>
    </div>
  );
}

function DipBank() {
  const mode = useRegisterStore((s) => s.mode);

  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">DIP (D0..D7)</span>
      <div className="flex flex-wrap items-end gap-2.5">
        {Array.from({ length: 8 }, (_, i) => (
          <DipToggle key={i} index={i} active={mode !== "SIPO" || i === 0} />
        ))}
      </div>
    </div>
  );
}

function ClkButton() {
  const cycle = useRegisterStore((s) => s.cycle);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">CLK · {CLK_PIN}</span>
      <motion.button
        type="button"
        aria-label="Disparar pulso de reloj (CLK)"
        onClick={() => pulseWithSound()}
        whileTap={{ scale: 0.97 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-warn bg-panel2 text-warn shadow-none transition-shadow duration-200 hover:shadow-glowWarn"
      >
        <span className="relative z-10 font-mono text-[11px] font-bold tracking-wide">CLK</span>
        <motion.span
          key={cycle}
          initial={{ scale: 0.5, opacity: 0.7 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-warn"
        />
      </motion.button>
      <span className="font-mono text-[11px] text-muted">
        ciclo <span className="text-text">{cycle}</span>
      </span>
    </div>
  );
}

function ClrButton() {
  const clear = useRegisterStore((s) => s.clear);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">CLR · {CLR_PIN}</span>
      <motion.button
        type="button"
        aria-label="Limpiar registro (CLR)"
        onClick={() => clear()}
        whileTap={{ scale: 0.97 }}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-danger bg-transparent text-danger transition-shadow duration-200 hover:shadow-glowDanger"
      >
        <span className="font-mono text-[11px] font-bold tracking-wide">CLR</span>
      </motion.button>
    </div>
  );
}

function ModeButton() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">MODE · {MODE_PIN}</span>
      <motion.button
        type="button"
        aria-label="Cambiar de modo (SIPO → PISO → PIPO)"
        onClick={() => cycleModeWithSound()}
        whileTap={{ scale: 0.97 }}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-hi bg-transparent text-hi transition-shadow duration-200 hover:shadow-glowCyan"
      >
        <span className="font-mono text-[10px] font-bold tracking-wide">MODE</span>
      </motion.button>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M7 5.5v13a1 1 0 0 0 1.53.85l10.5-6.5a1 1 0 0 0 0-1.7l-10.5-6.5A1 1 0 0 0 7 5.5Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <rect x="6" y="5" width="4.5" height="14" rx="1" />
      <rect x="13.5" y="5" width="4.5" height="14" rx="1" />
    </svg>
  );
}

function AutoRunControls() {
  const [running, speedBpm] = useRegisterStore(useShallow((s) => [s.running, s.speedBpm]));
  const play = useRegisterStore((s) => s.play);
  const pause = useRegisterStore((s) => s.pause);
  const setSpeed = useRegisterStore((s) => s.setSpeed);

  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Auto-run</span>
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          aria-label={running ? "Pausar auto-run" : "Iniciar auto-run"}
          aria-pressed={running}
          onClick={() => (running ? pause() : play())}
          whileTap={{ scale: 0.97 }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel2 text-hi transition-shadow duration-200 hover:shadow-glowCyan"
        >
          {running ? <PauseIcon /> : <PlayIcon />}
        </motion.button>
        <input
          type="range"
          className="range-slider w-32"
          min={30}
          max={300}
          step={1}
          value={speedBpm}
          onChange={(e) => setSpeed(Number(e.target.value))}
          aria-label={`Velocidad de auto-run: ${speedBpm} BPM`}
        />
        <span className="w-16 font-mono text-xs text-muted">{speedBpm} BPM</span>
      </div>
    </div>
  );
}

export function Controls() {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-2xl border border-line bg-panel p-4">
      <DipBank />
      <ClkButton />
      <ClrButton />
      <ModeButton />
      <AutoRunControls />
    </div>
  );
}
