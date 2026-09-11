import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useRegisterStore } from "../store/registerStore";
import { pulseWithSound } from "../lib/clock";
import { ensureAudio } from "../lib/sound";

function DipSwitch() {
  const data = useRegisterStore((s) => s.data);
  const setData = useRegisterStore((s) => s.setData);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">DATA · D12</span>
      <button
        type="button"
        role="switch"
        aria-checked={data === 1}
        aria-label={`Interruptor DATA, D12. Estado actual: ${data === 1 ? "encendido (1)" : "apagado (0)"}. Activar para cambiar.`}
        onClick={() => setData(data === 1 ? 0 : 1)}
        className={clsx(
          "relative h-8 w-14 rounded-full border transition-colors duration-200",
          data === 1 ? "border-hi2/60 bg-hi2/10" : "border-line bg-panel2",
        )}
      >
        <motion.span
          animate={{ x: data === 1 ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={clsx(
            "absolute top-1 h-6 w-6 rounded-full",
            data === 1 ? "bg-hi2 shadow-glow" : "bg-lo",
          )}
        />
      </button>
      <span className="font-mono text-xs font-bold text-text">{data}</span>
    </div>
  );
}

function ClkButton() {
  const cycle = useRegisterStore((s) => s.cycle);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">CLK · D10</span>
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
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">CLR · D11</span>
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

function SpeakerOnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16.5 8.5a4.5 4.5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M19 6a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function AutoRunControls() {
  const running = useRegisterStore((s) => s.running);
  const speedBpm = useRegisterStore((s) => s.speedBpm);
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

function SequenceLoader() {
  const loadSequence = useRegisterStore((s) => s.loadSequence);
  const [value, setValue] = useState("");
  const isValid = /^[01]+$/.test(value);

  const submit = () => {
    if (!isValid) return;
    loadSequence(value);
    setValue("");
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Secuencia</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[01]+"
          placeholder="10110001"
          value={value}
          onChange={(e) => setValue(e.target.value.trim())}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          aria-label="Secuencia binaria a cargar"
          className={clsx(
            "w-28 rounded-lg border bg-panel2 px-2 py-1.5 font-mono text-xs text-text placeholder:text-muted/60",
            value.length > 0 && !isValid ? "border-danger" : "border-line",
          )}
        />
        <motion.button
          type="button"
          aria-label="Cargar secuencia"
          onClick={submit}
          disabled={!isValid}
          whileTap={{ scale: 0.97 }}
          className="rounded-lg border border-hi/60 bg-hi/10 px-3 py-1.5 font-mono text-xs font-semibold text-hi transition-shadow duration-200 hover:shadow-glowCyan disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
        >
          Cargar
        </motion.button>
      </div>
    </div>
  );
}

function SoundToggle() {
  const soundOn = useRegisterStore((s) => s.soundOn);
  const toggleSound = useRegisterStore((s) => s.toggleSound);

  return (
    <motion.button
      type="button"
      aria-label={soundOn ? "Silenciar sonido" : "Activar sonido"}
      aria-pressed={soundOn}
      onClick={() => {
        if (!soundOn) void ensureAudio();
        toggleSound();
      }}
      whileTap={{ scale: 0.97 }}
      className="flex h-9 w-9 items-center justify-center self-end rounded-full border border-line bg-panel2 text-muted transition-shadow duration-200 hover:shadow-glowCyan hover:text-hi"
    >
      {soundOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
    </motion.button>
  );
}

export function Controls() {
  return (
    <header className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-line bg-panel p-4">
      <h1 className="font-mono text-sm uppercase tracking-widest text-text">
        SIPO <span className="text-muted">·</span> 8 bits
      </h1>
      <DipSwitch />
      <ClkButton />
      <ClrButton />
      <AutoRunControls />
      <SequenceLoader />
      <SoundToggle />
    </header>
  );
}
