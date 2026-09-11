import { motion } from "framer-motion";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import { useRegisterStore } from "../store/registerStore";
import type { Bit, HistoryEntry, Mode, Reg } from "../types/register";

const EMPTY_REG: Reg = [0, 0, 0, 0];

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

const MODE_DEFINITIONS: Record<Mode, string> = {
  SIPO: "Entrada serie por D0: cada CLK desplaza el registro un lugar hacia Q3, metiendo el bit del DIP D0 por Q0.",
  PISO: "El primer CLK carga el DIP completo (D0..D3) en paralelo. Los siguientes CLK desplazan Q3 hacia la salida serie (SO), metiendo 0 por Q0.",
  PIPO: "Cada CLK copia el DIP completo (D0..D3) directamente a Q0..Q3, sin corrimiento.",
};

function BitCell({ value }: { value: Bit }) {
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

interface RowData {
  entry: HistoryEntry;
  prevReg: Reg;
}

function ModeLogRow({ row, mode }: { row: RowData; mode: Mode }) {
  const { entry, prevReg } = row;

  const rowContent = (() => {
    switch (mode) {
      case "SIPO":
        return (
          <>
            <td className="px-2 py-1 font-mono text-xs text-muted">{entry.cycle}</td>
            <td className="px-2 py-1"><BitCell value={entry.dip[0]} /></td>
            <td className="px-2 py-1 font-mono text-xs text-muted">{prevReg.join("")}</td>
            <td className="px-2 py-1 font-mono text-xs font-semibold text-text">{entry.reg.join("")}</td>
          </>
        );
      case "PISO":
        return entry.op === "LOAD" ? (
          <>
            <td className="px-2 py-1 font-mono text-xs text-muted">{entry.cycle}</td>
            <td className="px-2 py-1 font-mono text-[11px] font-semibold text-hi">LOAD</td>
            <td className="px-2 py-1 font-mono text-xs text-text">{entry.dip.join("")}</td>
            <td className="px-2 py-1 font-mono text-xs font-semibold text-text">{entry.reg.join("")}</td>
            <td className="px-2 py-1 font-mono text-xs text-muted">—</td>
          </>
        ) : (
          <>
            <td className="px-2 py-1 font-mono text-xs text-muted">{entry.cycle}</td>
            <td className="px-2 py-1 font-mono text-[11px] font-semibold text-hi2">SHIFT</td>
            <td className="px-2 py-1 font-mono text-xs text-muted">{prevReg.join("")}</td>
            <td className="px-2 py-1 font-mono text-xs font-semibold text-text">{entry.reg.join("")}</td>
            <td className="px-2 py-1 font-mono text-xs font-bold text-hi">{entry.serialOut}</td>
          </>
        );
      case "PIPO":
        return (
          <>
            <td className="px-2 py-1 font-mono text-xs text-muted">{entry.cycle}</td>
            <td className="px-2 py-1 font-mono text-xs text-text">{entry.dip.join("")}</td>
            <td className="px-2 py-1 font-mono text-xs font-semibold text-text">{entry.reg.join("")}</td>
          </>
        );
    }
  })();

  return (
    <motion.tr
      initial={{ opacity: 0, y: -8, backgroundColor: "rgba(34,211,238,.15)" }}
      animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-line/40 last:border-0"
    >
      {rowContent}
    </motion.tr>
  );
}

function ModeLog() {
  const [mode, history] = useRegisterStore(useShallow((s) => [s.mode, s.history]));

  const rows: RowData[] = history.map((entry, i) => ({
    entry,
    prevReg: i > 0 ? history[i - 1].reg : EMPTY_REG,
  }));
  const reversed = [...rows].reverse();
  const colSpan = mode === "PISO" ? 5 : mode === "SIPO" ? 4 : 3;

  return (
    <div>
      <div className="mb-2 rounded-lg border border-line/60 bg-panel2 px-3 py-2 font-mono text-[11px] text-muted">
        {MODE_DEFINITIONS[mode]}
      </div>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-line/60">
        <table className="w-full border-collapse text-center">
          <caption className="sr-only">Registro de operaciones, modo {mode}</caption>
          <thead className="sticky top-0 z-10 bg-panel2">
            <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
              <th scope="col" className="px-2 py-1.5 font-mono font-normal">#</th>
              {mode === "SIPO" && (
                <>
                  <th scope="col" className="px-2 py-1.5 font-mono font-normal">D0</th>
                  <th scope="col" className="px-2 py-1.5 font-mono font-normal">Q0Q1Q2Q3 actual</th>
                  <th scope="col" className="px-2 py-1.5 font-mono font-normal">Q0Q1Q2Q3 siguiente</th>
                </>
              )}
              {mode === "PISO" && (
                <>
                  <th scope="col" className="px-2 py-1.5 font-mono font-normal">Op</th>
                  <th scope="col" className="px-2 py-1.5 font-mono font-normal">entrada</th>
                  <th scope="col" className="px-2 py-1.5 font-mono font-normal">Q0Q1Q2Q3</th>
                  <th scope="col" className="px-2 py-1.5 font-mono font-normal">SO</th>
                </>
              )}
              {mode === "PIPO" && (
                <>
                  <th scope="col" className="px-2 py-1.5 font-mono font-normal">D0D1D2D3</th>
                  <th scope="col" className="px-2 py-1.5 font-mono font-normal">Q0Q1Q2Q3</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {reversed.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-2 py-4 text-xs text-muted">
                  Sin pulsos todavía. Presiona CLK para empezar.
                </td>
              </tr>
            )}
            {reversed.map((row) => (
              <ModeLogRow key={row.entry.cycle} row={row} mode={mode} />
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
      <ModeLog />
      <div>
        <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
          Tabla característica (flip-flop D)
        </h3>
        <CharacteristicTable />
      </div>
    </div>
  );
}
