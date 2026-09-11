import { motion } from "framer-motion";
import clsx from "clsx";
import { useRegisterStore } from "../store/registerStore";
import type { HistoryEntry } from "../types/register";

interface CharacteristicRow {
  clr: string;
  clk: string;
  d: string;
  qNext: string;
  note: string;
}

const CHARACTERISTIC_ROWS: CharacteristicRow[] = [
  { clr: "0", clk: "X", d: "X", qNext: "0", note: "limpieza asíncrona" },
  { clr: "1", clk: "↑", d: "0", qNext: "0", note: "captura 0 en el flanco" },
  { clr: "1", clk: "↑", d: "1", qNext: "1", note: "captura 1 en el flanco" },
  { clr: "1", clk: "0/1/↓", d: "X", qNext: "Q(t)", note: "mantiene" },
];

function formatSerialLine(e: HistoryEntry): string {
  const cycleStr = (e.cycle < 10 ? " " : "") + e.cycle;
  const qStr = e.reg.map((bit, i) => `Q${i}=${bit} `).join("");
  const parallel = e.reg.join("");
  return `CLK ${cycleStr} | in=${e.data} | ${qStr}| paralelo(Q0..Q7)=${parallel}`;
}

function BitCell({ value }: { value: 0 | 1 }) {
  return (
    <span className={clsx("font-mono text-xs", value === 1 ? "font-bold text-hi2" : "text-muted")}>
      {value}
    </span>
  );
}

function CharacteristicTable() {
  return (
    <table className="w-full border-collapse text-center">
      <caption className="sr-only">Tabla característica del flip-flop D</caption>
      <thead>
        <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
          <th scope="col" className="px-2 py-1.5 font-mono font-normal">CLR</th>
          <th scope="col" className="px-2 py-1.5 font-mono font-normal">CLK</th>
          <th scope="col" className="px-2 py-1.5 font-mono font-normal">D</th>
          <th scope="col" className="px-2 py-1.5 font-mono font-normal">Q(t+1)</th>
          <th scope="col" className="px-2 py-2 text-left font-mono font-normal">Nota</th>
        </tr>
      </thead>
      <tbody>
        {CHARACTERISTIC_ROWS.map((row, i) => (
          <tr key={i} className="border-b border-line/60 last:border-0">
            <td className="px-2 py-1.5 font-mono text-xs text-text">{row.clr}</td>
            <td className="px-2 py-1.5 font-mono text-xs text-warn">{row.clk}</td>
            <td className="px-2 py-1.5 font-mono text-xs text-text">{row.d}</td>
            <td className="px-2 py-1.5 font-mono text-xs text-hi2">{row.qNext}</td>
            <td className="px-2 py-1.5 text-left font-mono text-[11px] text-muted">{row.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SequenceTable() {
  const history = useRegisterStore((s) => s.history);
  const rows = [...history].reverse();
  const latest = history[history.length - 1];

  return (
    <div>
      <div className="mb-2 truncate rounded-lg border border-line/60 bg-panel2 px-2 py-1.5 font-mono text-[11px] text-hi2">
        {latest ? formatSerialLine(latest) : "> a la espera del primer pulso de reloj…"}
      </div>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-line/60">
        <table className="w-full border-collapse text-center">
          <caption className="sr-only">Secuencia de estados del registro</caption>
          <thead className="sticky top-0 z-10 bg-panel2">
            <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
              <th scope="col" className="px-2 py-1.5 font-mono font-normal">#</th>
              <th scope="col" className="px-2 py-1.5 font-mono font-normal">D</th>
              {Array.from({ length: 8 }, (_, i) => (
                <th key={i} scope="col" className="px-1.5 py-1.5 font-mono font-normal">
                  Q{i}
                </th>
              ))}
              <th scope="col" className="px-2 py-1.5 font-mono font-normal">paralelo</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-2 py-4 text-xs text-muted">
                  Sin pulsos todavía. Presiona CLK o carga una secuencia.
                </td>
              </tr>
            )}
            {rows.map((entry) => (
              <motion.tr
                key={entry.cycle}
                initial={{ opacity: 0, y: -8, backgroundColor: "rgba(34,211,238,.15)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="border-b border-line/40 last:border-0"
              >
                <td className="px-2 py-1 font-mono text-xs text-muted">{entry.cycle}</td>
                <td className="px-2 py-1">
                  <BitCell value={entry.data} />
                </td>
                {entry.reg.map((bit, i) => (
                  <td key={i} className="px-1.5 py-1">
                    <BitCell value={bit} />
                  </td>
                ))}
                <td className="px-2 py-1 font-mono text-xs font-semibold text-text">
                  {entry.reg.join("")}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TruthTable() {
  return (
    <div className="flex flex-col gap-4">
      <SequenceTable />
      <div>
        <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
          Tabla característica (flip-flop D)
        </h3>
        <CharacteristicTable />
      </div>
    </div>
  );
}
