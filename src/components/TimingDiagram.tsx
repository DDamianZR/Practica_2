import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useRegisterStore } from "../store/registerStore";
import { downloadTimingPng, downloadTimingSvg } from "../lib/exportDiagram";
import {
  buildColumns,
  COL,
  LABEL_W,
  PAD,
  ROW,
  ROW_LABELS_BASE,
  SO_ROW_LABEL,
  edgeX,
  highY,
} from "../lib/waveform";

const D_ROW_STROKE = ["stroke-muted", "stroke-data"] as const;
const Q_ROW_STROKE = ["stroke-muted", "stroke-hi2"] as const;
const SO_ROW_STROKE = ["stroke-muted", "stroke-hi"] as const;

function rowStrokeClass(rowPathIndex: number, level: 0 | 1): string {
  if (rowPathIndex === 0) return D_ROW_STROKE[level];
  if (rowPathIndex >= 1 && rowPathIndex <= 4) return Q_ROW_STROKE[level];
  return SO_ROW_STROKE[level];
}

export function TimingDiagram() {
  const [mode, history] = useRegisterStore(useShallow((s) => [s.mode, s.history]));
  const clearTiming = useRegisterStore((s) => s.clearTiming);
  const prefersReducedMotion = useReducedMotion();
  const columns = useMemo(() => buildColumns(history), [history]);
  const numColumns = columns.length;
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const showSo = mode === "PISO";
  const rowLabels = showSo ? [...ROW_LABELS_BASE, SO_ROW_LABEL] : ROW_LABELS_BASE;
  const rowCount = rowLabels.length;
  const visibleRowPathCount = showSo ? 6 : 5; // D + Q0..Q3 (+ SO)

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [numColumns]);

  const svgWidth = numColumns * COL;
  const svgHeight = PAD * 2 + rowCount * ROW;
  const markerX = numColumns * COL;
  const lastReg = history[history.length - 1]?.reg ?? [0, 0, 0, 0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => clearTiming()}
          className="rounded-lg border border-line bg-panel2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors duration-150 hover:text-text"
        >
          Reiniciar carta
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Exportar</span>
          <button
            type="button"
            onClick={() => svgRef.current && downloadTimingSvg(svgRef.current, "carta-tiempos.svg")}
            className="rounded-lg border border-hi/50 bg-hi/10 px-3 py-1.5 font-mono text-[11px] font-semibold text-hi transition-shadow duration-150 hover:shadow-glowCyan"
          >
            SVG
          </button>
          <button
            type="button"
            onClick={() => svgRef.current && downloadTimingPng(svgRef.current, "carta-tiempos.png")}
            className="rounded-lg border border-hi/50 bg-hi/10 px-3 py-1.5 font-mono text-[11px] font-semibold text-hi transition-shadow duration-150 hover:shadow-glowCyan"
          >
            PNG
          </button>
        </div>
      </div>

      <div className="flex">
        <div className="flex-none" style={{ width: LABEL_W, paddingTop: PAD }}>
          {rowLabels.map((label) => (
            <div
              key={label}
              style={{ height: ROW }}
              className="flex items-center font-mono text-[10px] uppercase tracking-wider text-muted"
            >
              {label}
            </div>
          ))}
        </div>
        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            style={{ width: svgWidth, height: svgHeight, maxWidth: "none" }}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            role="img"
            aria-label={`Diagrama de tiempos, modo ${mode}, ${numColumns - 1} pulsos. Estado actual Q0..Q3 = ${lastReg.join("")}`}
          >
            {Array.from({ length: numColumns + 1 }, (_, i) => (
              <line
                key={i}
                x1={i * COL}
                x2={i * COL}
                y1={PAD}
                y2={PAD + rowCount * ROW}
                className="stroke-line"
                strokeWidth={1}
              />
            ))}

            {columns.map((col) => (
              <motion.g
                key={col.index}
                initial={!prefersReducedMotion && col.index === numColumns - 1 ? { opacity: 0, x: col.index * COL + 10 } : false}
                animate={{ opacity: 1, x: col.index * COL }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <path d={col.clkLow} fill="none" className="stroke-muted" strokeWidth={1.75} strokeLinejoin="round" />
                {col.clkHigh && (
                  <>
                    <path d={col.clkHigh} fill="none" className="stroke-warn" strokeWidth={1.75} strokeLinejoin="round" />
                    <polygon
                      points={`${COL / 2},${highY(0) - 5} ${COL / 2 - 4},${highY(0) + 2} ${COL / 2 + 4},${highY(0) + 2}`}
                      className="fill-warn"
                    />
                  </>
                )}

                {col.rowPaths.slice(0, visibleRowPathCount).map((d, r) => (
                  <path
                    key={r}
                    d={d}
                    fill="none"
                    className={rowStrokeClass(r, col.levels[r])}
                    strokeWidth={1.75}
                    strokeLinejoin="round"
                  />
                ))}
              </motion.g>
            ))}

            {columns.map((col) =>
              col.isPulse ? (
                <line
                  key={`edge-${col.index}`}
                  x1={edgeX(col.index)}
                  x2={edgeX(col.index)}
                  y1={PAD}
                  y2={PAD + rowCount * ROW}
                  className="stroke-hi"
                  strokeOpacity={0.22}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              ) : null,
            )}

            <motion.line
              animate={{ x1: markerX, x2: markerX }}
              initial={false}
              transition={{ duration: 0.18, ease: "easeOut" }}
              y1={PAD}
              y2={PAD + rowCount * ROW}
              className="stroke-hi"
              strokeWidth={1}
              strokeOpacity={0.35}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
