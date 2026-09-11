import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useRegisterStore } from "../store/registerStore";
import {
  buildColumns,
  COL,
  LABEL_W,
  PAD,
  ROW,
  ROW_COUNT,
  ROW_LABELS,
  highY,
} from "../lib/waveform";

const DATA_ROW_STROKE = ["stroke-muted", "stroke-data"] as const;
const Q_ROW_STROKE = ["stroke-muted", "stroke-hi2"] as const;

export function TimingDiagram() {
  const history = useRegisterStore((s) => s.history);
  const columns = useMemo(() => buildColumns(history), [history]);
  const numColumns = columns.length;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [numColumns]);

  const svgWidth = numColumns * COL;
  const svgHeight = PAD * 2 + ROW_COUNT * ROW;
  const markerX = numColumns * COL;
  const lastLevels = columns[columns.length - 1]?.levels.slice(1) ?? [0, 0, 0, 0, 0, 0, 0, 0];

  return (
    <div className="flex">
      <div className="flex-none" style={{ width: LABEL_W, paddingTop: PAD }}>
        {ROW_LABELS.map((label) => (
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
          width={svgWidth}
          height={svgHeight}
          style={{ width: svgWidth, height: svgHeight, maxWidth: "none" }}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label={`Diagrama de tiempos, ${numColumns - 1} pulsos. Estado actual Q0..Q7 = ${lastLevels.join("")}`}
        >
          {Array.from({ length: numColumns + 1 }, (_, i) => (
            <line
              key={i}
              x1={i * COL}
              x2={i * COL}
              y1={PAD}
              y2={PAD + ROW_COUNT * ROW}
              className="stroke-line"
              strokeWidth={1}
            />
          ))}

          {columns.map((col) => (
            <motion.g
              key={col.index}
              initial={col.index === numColumns - 1 ? { opacity: 0, x: col.index * COL + 10 } : false}
              animate={{ opacity: 1, x: col.index * COL }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <path
                d={col.clkLow}
                fill="none"
                className="stroke-muted"
                strokeWidth={1.75}
                strokeLinejoin="round"
              />
              {col.clkHigh && (
                <>
                  <path
                    d={col.clkHigh}
                    fill="none"
                    className="stroke-warn"
                    strokeWidth={1.75}
                    strokeLinejoin="round"
                  />
                  <polygon
                    points={`${COL / 2},${highY(0) - 5} ${COL / 2 - 4},${highY(0) + 2} ${COL / 2 + 4},${highY(0) + 2}`}
                    className="fill-warn"
                  />
                </>
              )}

              {col.rowPaths.map((d, r) => {
                const strokeClass = r === 0 ? DATA_ROW_STROKE[col.levels[r]] : Q_ROW_STROKE[col.levels[r]];
                return (
                  <path
                    key={r}
                    d={d}
                    fill="none"
                    className={strokeClass}
                    strokeWidth={1.75}
                    strokeLinejoin="round"
                  />
                );
              })}
            </motion.g>
          ))}

          <motion.line
            animate={{ x1: markerX, x2: markerX }}
            initial={false}
            transition={{ duration: 0.18, ease: "easeOut" }}
            y1={PAD}
            y2={PAD + ROW_COUNT * ROW}
            className="stroke-hi"
            strokeWidth={1}
            strokeOpacity={0.35}
          />
        </svg>
      </div>
    </div>
  );
}
