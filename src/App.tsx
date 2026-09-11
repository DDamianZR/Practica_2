import type { ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";
import clsx from "clsx";
import { Controls } from "./components/Controls";
import { TruthTable } from "./components/TruthTable";
import { TimingDiagram } from "./components/TimingDiagram";
import { FlipFlopChain } from "./components/FlipFlopChain";
import { CircuitBoard } from "./components/CircuitBoard";
import { ModeBadge } from "./components/ModeBadge";
import { SerialOutput } from "./components/SerialOutput";
import { useRegisterStore } from "./store/registerStore";
import { useAutoRun } from "./lib/clock";
import { useShortcuts } from "./lib/shortcuts";
import { ensureAudio } from "./lib/sound";
import type { Mode } from "./types/register";

const MODES: Mode[] = ["SIPO", "PISO", "PIPO"];

function Panel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </section>
  );
}

function ModeSelector() {
  const mode = useRegisterStore((s) => s.mode);
  const setMode = useRegisterStore((s) => s.setMode);

  return (
    <div role="tablist" aria-label="Selector de modo" className="flex gap-1 rounded-xl border border-line bg-panel2 p-1">
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => setMode(m)}
          className={clsx(
            "rounded-lg px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors duration-150",
            mode === m ? "bg-hi/15 text-hi" : "text-muted hover:text-text",
          )}
        >
          {m}
        </button>
      ))}
    </div>
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
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel2 text-muted transition-shadow duration-200 hover:shadow-glowCyan hover:text-hi"
    >
      {soundOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
    </motion.button>
  );
}

function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-panel p-4">
      <h1 className="font-mono text-sm uppercase tracking-widest text-text">
        Registro de Corrimiento <span className="text-muted">·</span> 4 bits
      </h1>
      <div className="flex items-center gap-3">
        <ModeSelector />
        <SoundToggle />
      </div>
    </header>
  );
}

export default function App() {
  useAutoRun();
  useShortcuts();

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
        <Header />

        <main className="flex flex-col gap-4">
          <Panel title="Panel de simulación">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <ModeBadge />
              </div>
              <FlipFlopChain />
              <Controls />
              <SerialOutput />
            </div>
          </Panel>

          <Panel title="Carta de tiempos">
            <TimingDiagram />
          </Panel>

          <Panel title="Tabla de verdad">
            <TruthTable />
          </Panel>

          <Panel title="Circuito Arduino">
            <CircuitBoard />
          </Panel>
        </main>
      </div>
    </MotionConfig>
  );
}
