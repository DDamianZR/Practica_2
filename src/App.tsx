import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { Controls } from "./components/Controls";
import { TruthTable } from "./components/TruthTable";
import { TimingDiagram } from "./components/TimingDiagram";
import { FlipFlopChain } from "./components/FlipFlopChain";
import { CircuitBoard } from "./components/CircuitBoard";
import { Tabs, type TabItem } from "./components/Tabs";
import { useAutoRun } from "./lib/clock";
import { useShortcuts } from "./lib/shortcuts";
import { useIsMobile } from "./lib/useMediaQuery";

const TAB_STORAGE_KEY = "sipo:tab";

const TAB_ITEMS = [
  { id: "circuit", label: "Circuito" },
  { id: "flipflop", label: "Flip-Flops" },
  { id: "timing", label: "Tiempos" },
  { id: "truth", label: "Tabla" },
] as const satisfies readonly TabItem[];

type TabId = (typeof TAB_ITEMS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TAB_ITEMS.some((t) => t.id === value);
}

function useActiveTab(): [TabId, (id: TabId) => void] {
  const [tab, setTab] = useState<TabId>("circuit");

  useEffect(() => {
    const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
    if (isTabId(stored)) setTab(stored);
  }, []);

  const update = (id: TabId) => {
    setTab(id);
    window.localStorage.setItem(TAB_STORAGE_KEY, id);
  };

  return [tab, update];
}

function Panel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-panel p-4">
      <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">{title}</h2>
      {children ?? <div className="text-muted">TODO</div>}
    </section>
  );
}

const PANELS: Record<TabId, { title: string; content: ReactNode }> = {
  circuit: { title: "Circuit Board", content: <CircuitBoard /> },
  flipflop: { title: "Flip-Flop Chain", content: <FlipFlopChain /> },
  timing: { title: "Timing Diagram", content: <TimingDiagram /> },
  truth: { title: "Truth Table", content: <TruthTable /> },
};

export default function App() {
  useAutoRun();
  useShortcuts();

  const isMobile = useIsMobile();
  const [tab, setTab] = useActiveTab();

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-full flex-col gap-4 p-4">
        <Controls />

        <main>
          {isMobile ? (
            <div className="flex flex-col gap-3">
              <Tabs items={TAB_ITEMS} active={tab} onChange={(id) => setTab(id as TabId)} />
              <Panel title={PANELS[tab].title}>{PANELS[tab].content}</Panel>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {TAB_ITEMS.map(({ id }) => (
                <Panel key={id} title={PANELS[id].title}>
                  {PANELS[id].content}
                </Panel>
              ))}
            </div>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
