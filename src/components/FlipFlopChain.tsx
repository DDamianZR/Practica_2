import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import { useRegisterStore } from "../store/registerStore";
import type { Bit, Op } from "../types/register";

const FF_W = 108;
const FF_H = 92;
const GAP = 46;
const CHAIN_START_X = 96;
const CHAIN_Y = 78;
const CHIP_PAD = 20;
const DIP_Y = 18;
const LED_Y = CHAIN_Y + FF_H + 46;
const OUT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function ffX(index: number): number {
  return CHAIN_START_X + index * (FF_W + GAP);
}

const qAnchor = (i: number) => ({ x: ffX(i) + FF_W, y: CHAIN_Y + 22 });
const dAnchor = (i: number) => ({ x: ffX(i), y: CHAIN_Y + 22 });
const dipAnchor = (i: number) => ({ x: ffX(i) + 22, y: DIP_Y });
const ledAnchor = (i: number) => ({ x: ffX(i) + FF_W / 2, y: LED_Y });

function Wire({ d, active, colorClass }: { d: string; active: boolean; colorClass: string }) {
  return (
    <path
      d={d}
      fill="none"
      className={clsx("transition-colors duration-150", active ? colorClass : "stroke-line")}
      strokeWidth={1.75}
    />
  );
}

function FlipFlop({ index, value }: { index: number; value: Bit }) {
  const x = ffX(index);
  const qBar: Bit = value === 1 ? 0 : 1;

  return (
    <g transform={`translate(${x},${CHAIN_Y})`}>
      <rect width={FF_W} height={FF_H} rx={10} className="fill-panel2 stroke-line" strokeWidth={1.5} />
      <text x={FF_W / 2} y={13} textAnchor="middle" className="fill-muted" style={{ fontSize: 7, fontFamily: "monospace" }}>
        FF-D {index}
      </text>

      <text x={6} y={26} className="fill-text" style={{ fontSize: 8, fontFamily: "monospace" }}>D</text>
      <text x={FF_W - 6} y={26} textAnchor="end" className="fill-text" style={{ fontSize: 8, fontFamily: "monospace" }}>Q</text>
      <text x={FF_W - 6} y={70} textAnchor="end" className="fill-muted" style={{ fontSize: 7, fontFamily: "monospace" }}>Q̄</text>

      <polygon points={`8,${FF_H} 16,${FF_H} 12,${FF_H - 8}`} className="fill-warn" />
      <line x1={FF_W / 2} y1={FF_H} x2={FF_W / 2} y2={FF_H - 8} className="stroke-danger" strokeWidth={1.5} />

      <rect
        x={18}
        y={34}
        width={48}
        height={30}
        rx={6}
        className={clsx("transition-colors duration-[90ms]", value === 1 ? "fill-hi2/15 stroke-hi2" : "fill-lo/10 stroke-lo")}
        strokeWidth={1.25}
      />
      <text
        x={42}
        y={52}
        textAnchor="middle"
        dominantBaseline="middle"
        className={clsx("font-bold transition-colors duration-[90ms]", value === 1 ? "fill-hi2" : "fill-muted")}
        style={{ fontSize: 15, fontFamily: "monospace" }}
      >
        {value}
      </text>

      <rect x={72} y={54} width={22} height={16} rx={4} className="fill-panel stroke-line" strokeWidth={1} />
      <text x={83} y={65} textAnchor="middle" dominantBaseline="middle" className="fill-muted" style={{ fontSize: 8, fontFamily: "monospace" }}>
        {qBar}
      </text>

      <text x={FF_W / 2} y={FF_H - 4} textAnchor="middle" className="fill-muted/70" style={{ fontSize: 6, fontFamily: "monospace" }}>
        Q{index}
      </text>
    </g>
  );
}

function Led({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={11} className={lit ? "fill-hi2" : "fill-lo"} filter={lit ? "url(#ffLedGlow)" : undefined} style={{ transition: "fill 120ms" }} />
      <circle cx={x} cy={y} r={11} className="fill-none stroke-line" strokeWidth={1} />
    </g>
  );
}

function isShiftOp(op: Op | null): boolean {
  return op === "SHIFT" || op === "SHIFT_OUT";
}

function isLoadOp(op: Op | null): boolean {
  return op === "LOAD" || op === "PARALLEL";
}

export function FlipFlopChain() {
  const [cycle, reg, dip, history] = useRegisterStore(
    useShallow((s) => [s.cycle, s.reg, s.dip, s.history]),
  );
  const prefersReducedMotion = useReducedMotion();

  const lastOp: Op | null = history[history.length - 1]?.op ?? null;
  const shiftActive = isShiftOp(lastOp);
  const loadActive = isLoadOp(lastOp);
  const serialOutActive = lastOp === "SHIFT_OUT";

  const chipLeft = CHAIN_START_X - CHIP_PAD;
  const chipRight = ffX(3) + FF_W + CHIP_PAD;
  const chipTop = CHAIN_Y - CHIP_PAD;
  const chipBottom = CHAIN_Y + FF_H + CHIP_PAD;

  const svgWidth = chipRight + 70;
  const svgHeight = LED_Y + 60;
  const clkBusY = chipBottom + 16;
  const clrBusY = clkBusY + 18;

  const soArrow = { x: qAnchor(3).x + 44, y: qAnchor(3).y };

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ minWidth: svgWidth }}
        role="img"
        aria-label={`Cadena de 4 flip-flops D. Q0..Q3 = ${reg.join("")}`}
      >
        <defs>
          <filter id="ffLedGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* chip package */}
        <rect
          x={chipLeft}
          y={chipTop}
          width={chipRight - chipLeft}
          height={chipBottom - chipTop}
          rx={12}
          className="fill-panel/40 stroke-line"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
        <text x={(chipLeft + chipRight) / 2} y={chipBottom - 6} textAnchor="middle" className="fill-muted" style={{ fontSize: 7, fontFamily: "monospace" }}>
          REGISTRO DE CORRIMIENTO 4 BITS · SIPO / PISO / PIPO
        </text>

        {/* CLK / CLR busses */}
        <line x1={30} y1={clkBusY} x2={chipRight + 30} y2={clkBusY} className="stroke-line" strokeWidth={1} />
        <motion.line
          key={`clk-${cycle}`}
          x1={30}
          y1={clkBusY}
          x2={chipRight + 30}
          y2={clkBusY}
          className="stroke-warn"
          strokeWidth={1.5}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.6] }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        <text x={4} y={clkBusY + 3} className="fill-warn" style={{ fontSize: 8, fontFamily: "monospace" }}>CLK</text>

        <line x1={30} y1={clrBusY} x2={chipRight + 30} y2={clrBusY} className="stroke-line" strokeWidth={1} />
        <text x={4} y={clrBusY + 3} className="fill-danger" style={{ fontSize: 8, fontFamily: "monospace" }}>CLR</text>

        {Array.from({ length: 4 }, (_, i) => {
          const x = ffX(i);
          return (
            <g key={i}>
              <line x1={x + 12} y1={clkBusY} x2={x + 12} y2={CHAIN_Y + FF_H} className="stroke-line" strokeWidth={1} />
              <line x1={x + FF_W / 2} y1={clrBusY} x2={x + FF_W / 2} y2={CHAIN_Y + FF_H} className="stroke-line" strokeWidth={1} />
            </g>
          );
        })}

        {/* DIP wires (parallel load path) */}
        {Array.from({ length: 4 }, (_, i) => {
          const from = dipAnchor(i);
          const to = dAnchor(i);
          const active = loadActive || (i === 0 && lastOp === "SHIFT");
          return (
            <g key={i}>
              <Wire d={`M ${from.x} ${from.y} L ${from.x} ${to.y - 10} L ${to.x} ${to.y - 10} L ${to.x} ${to.y}`} active={active} colorClass="stroke-data" />
              <circle cx={from.x} cy={from.y} r={2.5} className="fill-data" />
              <text x={from.x} y={from.y - 6} textAnchor="middle" className="fill-data" style={{ fontSize: 7, fontFamily: "monospace" }}>
                D{i}={dip[i]}
              </text>
            </g>
          );
        })}

        {/* inter-FF chain wires (shift path) */}
        {Array.from({ length: 3 }, (_, i) => (
          <Wire
            key={i}
            d={`M ${qAnchor(i).x} ${qAnchor(i).y} L ${dAnchor(i + 1).x} ${dAnchor(i + 1).y}`}
            active={shiftActive}
            colorClass="stroke-hi2"
          />
        ))}

        {/* serial output stub after Q3 */}
        <Wire
          d={`M ${qAnchor(3).x} ${qAnchor(3).y} L ${soArrow.x} ${soArrow.y}`}
          active={serialOutActive}
          colorClass="stroke-hi"
        />
        <text x={soArrow.x + 6} y={soArrow.y + 3} className={clsx("font-mono", serialOutActive ? "fill-hi" : "fill-muted/60")} style={{ fontSize: 8 }}>
          SO
        </text>

        {/* chip + flip-flops */}
        {Array.from({ length: 4 }, (_, i) => (
          <FlipFlop key={i} index={i} value={reg[i]} />
        ))}

        {/* LEDs below each flip-flop */}
        {Array.from({ length: 4 }, (_, i) => {
          const a = ledAnchor(i);
          return (
            <g key={i}>
              <line x1={qAnchor(i).x - FF_W / 2 + 8} y1={CHAIN_Y + FF_H} x2={a.x} y2={a.y - 11} className={reg[i] === 1 ? "stroke-hi2" : "stroke-line"} strokeWidth={1.5} />
              <Led x={a.x} y={a.y} lit={reg[i] === 1} />
              <text x={a.x} y={a.y + 24} textAnchor="middle" className="fill-text" style={{ fontSize: 9, fontFamily: "monospace" }}>
                Q{i}
              </text>
            </g>
          );
        })}

        {/* propagation particles */}
        {cycle > 0 && !prefersReducedMotion && (
          <g key={`particles-${cycle}`}>
            {shiftActive &&
              Array.from({ length: 4 }, (_, k) => {
                if (k === 0) return null;
                const from = qAnchor(k - 1);
                const to = dAnchor(k);
                const lit = reg[k] === 1;
                return (
                  <motion.circle
                    key={`shift-${k}`}
                    r={4}
                    className={lit ? "fill-hi" : "fill-muted"}
                    initial={{ cx: from.x, cy: from.y, opacity: 1 }}
                    animate={{ cx: [from.x, to.x], cy: [from.y, to.y], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.22, delay: k * 0.03, ease: OUT_EASE, times: [0, 0.8, 1] }}
                  />
                );
              })}
            {loadActive &&
              Array.from({ length: 4 }, (_, k) => {
                const from = dipAnchor(k);
                const to = dAnchor(k);
                const lit = reg[k] === 1;
                return (
                  <motion.circle
                    key={`load-${k}`}
                    r={4}
                    className={lit ? "fill-hi" : "fill-muted"}
                    initial={{ cx: from.x, cy: from.y, opacity: 1 }}
                    animate={{ cx: [from.x, to.x], cy: [from.y, to.y], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.22, delay: k * 0.02, ease: OUT_EASE, times: [0, 0.8, 1] }}
                  />
                );
              })}
            {serialOutActive && (
              <motion.circle
                r={4.5}
                className="fill-hi"
                initial={{ cx: qAnchor(3).x, cy: qAnchor(3).y, opacity: 1 }}
                animate={{ cx: [qAnchor(3).x, soArrow.x + 10], cy: [qAnchor(3).y, soArrow.y], opacity: [1, 1, 0] }}
                transition={{ duration: 0.3, delay: 0.08, ease: OUT_EASE, times: [0, 0.85, 1] }}
              />
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
