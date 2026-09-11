import type { ReactNode } from "react";
import { Controls } from "./components/Controls";
import { TruthTable } from "./components/TruthTable";
import { TimingDiagram } from "./components/TimingDiagram";
import { FlipFlopChain } from "./components/FlipFlopChain";
import { CircuitBoard } from "./components/CircuitBoard";
import { useAutoRun } from "./lib/clock";
import { useShortcuts } from "./lib/shortcuts";

function Panel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">{title}</h2>
      {children ?? <div className="text-muted">TODO</div>}
    </section>
  );
}

export default function App() {
  useAutoRun();
  useShortcuts();

  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <Controls />

      <main className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Circuit Board">
          <CircuitBoard />
        </Panel>
        <Panel title="Flip-Flop Chain">
          <FlipFlopChain />
        </Panel>
        <Panel title="Timing Diagram">
          <TimingDiagram />
        </Panel>
        <Panel title="Truth Table">
          <TruthTable />
        </Panel>
      </main>
    </div>
  );
}
