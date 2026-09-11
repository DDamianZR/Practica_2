import type { ReactNode } from "react";

function Panel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">{title}</h2>
      {children ?? <div className="text-muted">TODO</div>}
    </section>
  );
}

export default function App() {
  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <header className="rounded-2xl border border-line bg-panel p-4">
        <h1 className="font-mono text-sm uppercase tracking-widest text-text">
          SIPO · 8 bits
        </h1>
      </header>

      <main className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Circuit Board" />
        <Panel title="Flip-Flop Chain" />
        <Panel title="Timing Diagram" />
        <Panel title="Truth Table" />
      </main>
    </div>
  );
}
