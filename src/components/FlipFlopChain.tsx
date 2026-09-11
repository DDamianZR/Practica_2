import { motion } from "framer-motion";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import { useRegisterStore } from "../store/registerStore";
import type { Bit } from "../types/register";

const FF_W = 96;
const FF_H = 80;
const INNER_GAP = 14;
const CHIP_PAD = 12;
const CHIP_GAP = 44;
const CHAIN_START_X = 56;
const CHAIN_Y = 46;
const CHIP_W = CHIP_PAD * 2 + FF_W * 2 + INNER_GAP;
const D_IN_X = CHAIN_START_X - 36;
const BUS_CLK_Y = CHAIN_Y + FF_H + 26;
const BUS_CLR_Y = BUS_CLK_Y + 22;
const OUT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function ffX(index: number): number {
  const chip = Math.floor(index / 2);
  const slot = index % 2;
  return CHAIN_START_X + chip * (CHIP_W + CHIP_GAP) + slot * (FF_W + INNER_GAP);
}

const qAnchor = (i: number) => ({ x: ffX(i) + FF_W, y: CHAIN_Y + 20 });
const dAnchor = (i: number) => ({ x: ffX(i), y: CHAIN_Y + 20 });

function Wire({ x1, y1, x2, y2, active }: { x1: number; y1: number; x2: number; y2: number; active: boolean }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className={clsx("transition-colors duration-150", active ? "stroke-hi2" : "stroke-muted")}
      strokeWidth={1.75}
    />
  );
}

function ChipPackage({ x }: { x: number }) {
  const h = CHIP_PAD * 2 + FF_H;
  return (
    <g transform={`translate(${x},${CHAIN_Y - CHIP_PAD})`}>
      <rect
        x={0}
        y={0}
        width={CHIP_W}
        height={h}
        rx={8}
        className="fill-panel/50 stroke-line"
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <circle cx={0} cy={h / 2} r={4} className="fill-bg stroke-line" strokeWidth={1} />
      <circle cx={CHIP_W} cy={h / 2} r={4} className="fill-bg stroke-line" strokeWidth={1} />
      <circle cx={12} cy={0} r={3} className="fill-bg stroke-line" strokeWidth={1} />
      <text x={CHIP_W / 2} y={h - 4} textAnchor="middle" className="fill-muted" style={{ fontSize: 6, fontFamily: "monospace" }}>
        74LS74 · DUAL D FLIP-FLOP
      </text>
    </g>
  );
}

function FlipFlop({ index, value }: { index: number; value: Bit }) {
  const x = ffX(index);
  const qBar: Bit = value === 1 ? 0 : 1;

  return (
    <g transform={`translate(${x},${CHAIN_Y})`}>
      <rect width={FF_W} height={FF_H} rx={10} className="fill-panel2 stroke-line" strokeWidth={1.5} />
      <text x={FF_W / 2} y={11} textAnchor="middle" className="fill-muted" style={{ fontSize: 7, fontFamily: "monospace" }}>
        74LS74
      </text>

      {/* D pin */}
      <text x={6} y={24} className="fill-text" style={{ fontSize: 8, fontFamily: "monospace" }}>D</text>

      {/* Q pin */}
      <text x={FF_W - 6} y={24} textAnchor="end" className="fill-text" style={{ fontSize: 8, fontFamily: "monospace" }}>Q</text>

      {/* Q̄ pin */}
      <text x={FF_W - 6} y={64} textAnchor="end" className="fill-muted" style={{ fontSize: 7, fontFamily: "monospace" }}>Q̄</text>

      {/* CLK triangle */}
      <polygon points={`8,${FF_H} 16,${FF_H} 12,${FF_H - 8}`} className="fill-warn" />

      {/* CLR stub */}
      <line x1={FF_W / 2} y1={FF_H} x2={FF_W / 2} y2={FF_H - 8} className="stroke-danger" strokeWidth={1.5} />

      {/* Q chamber (large) */}
      <rect
        x={16}
        y={30}
        width={42}
        height={26}
        rx={6}
        className={clsx(
          "transition-colors duration-[90ms]",
          value === 1 ? "fill-hi2/15 stroke-hi2" : "fill-lo/10 stroke-lo",
        )}
        strokeWidth={1.25}
      />
      <text
        x={37}
        y={47}
        textAnchor="middle"
        dominantBaseline="middle"
        className={clsx("font-bold transition-colors duration-[90ms]", value === 1 ? "fill-hi2" : "fill-muted")}
        style={{ fontSize: 13, fontFamily: "monospace" }}
      >
        {value}
      </text>

      {/* Q̄ chamber (small) */}
      <rect x={64} y={48} width={20} height={14} rx={4} className="fill-panel stroke-line" strokeWidth={1} />
      <text
        x={74}
        y={58}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted"
        style={{ fontSize: 8, fontFamily: "monospace" }}
      >
        {qBar}
      </text>

      <text x={FF_W / 2} y={FF_H - 4} textAnchor="middle" className="fill-muted/70" style={{ fontSize: 6, fontFamily: "monospace" }}>
        Q{index}
      </text>
    </g>
  );
}

export function FlipFlopChain() {
  const [cycle, reg, data] = useRegisterStore(useShallow((s) => [s.cycle, s.reg, s.data]));

  const chipCount = 4;
  const chainRight = ffX(7) + FF_W + 40;
  const svgWidth = chainRight;
  const svgHeight = BUS_CLR_Y + 24;

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ minWidth: svgWidth }}
        role="img"
        aria-label={`Cadena de flip-flops D, 4 chips 74LS74. Q0..Q7 = ${reg.join("")}`}
      >
        {/* CLK bus */}
        <line x1={16} y1={BUS_CLK_Y} x2={chainRight - 20} y2={BUS_CLK_Y} className="stroke-line" strokeWidth={1} />
        <motion.line
          key={`clk-${cycle}`}
          x1={16}
          y1={BUS_CLK_Y}
          x2={chainRight - 20}
          y2={BUS_CLK_Y}
          className="stroke-warn"
          strokeWidth={1.5}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.6] }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        <text x={4} y={BUS_CLK_Y + 3} className="fill-warn" style={{ fontSize: 8, fontFamily: "monospace" }}>CLK</text>

        {/* CLR bus */}
        <line x1={16} y1={BUS_CLR_Y} x2={chainRight - 20} y2={BUS_CLR_Y} className="stroke-line" strokeWidth={1} />
        <text x={4} y={BUS_CLR_Y + 3} className="fill-danger" style={{ fontSize: 8, fontFamily: "monospace" }}>CLR</text>

        {/* stubs from busses up to each FF */}
        {Array.from({ length: 8 }, (_, i) => {
          const x = ffX(i);
          return (
            <g key={i}>
              <line x1={x + 12} y1={BUS_CLK_Y} x2={x + 12} y2={CHAIN_Y + FF_H} className="stroke-line" strokeWidth={1} />
              <line x1={x + FF_W / 2} y1={BUS_CLR_Y} x2={x + FF_W / 2} y2={CHAIN_Y + FF_H} className="stroke-line" strokeWidth={1} />
            </g>
          );
        })}

        {/* D_in wire */}
        <text x={D_IN_X - 44} y={CHAIN_Y + 24} className="fill-data" style={{ fontSize: 8, fontFamily: "monospace" }}>DATA</text>
        <Wire x1={D_IN_X} y1={CHAIN_Y + 20} x2={dAnchor(0).x} y2={dAnchor(0).y} active={data === 1} />

        {/* inter-FF wires */}
        {Array.from({ length: 7 }, (_, i) => (
          <Wire
            key={i}
            x1={qAnchor(i).x}
            y1={qAnchor(i).y}
            x2={dAnchor(i + 1).x}
            y2={dAnchor(i + 1).y}
            active={reg[i] === 1}
          />
        ))}

        {/* output stub after Q7 */}
        <Wire x1={qAnchor(7).x} y1={qAnchor(7).y} x2={qAnchor(7).x + 24} y2={qAnchor(7).y} active={reg[7] === 1} />

        {/* chip package outlines */}
        {Array.from({ length: chipCount }, (_, c) => (
          <ChipPackage key={c} x={CHAIN_START_X + c * (CHIP_W + CHIP_GAP)} />
        ))}

        {/* flip-flops, drawn on top of the chip outlines */}
        {Array.from({ length: 8 }, (_, i) => (
          <FlipFlop key={i} index={i} value={reg[i]} />
        ))}

        {/* propagation particles */}
        {cycle > 0 && (
          <g key={`particles-${cycle}`}>
            {Array.from({ length: 8 }, (_, k) => {
              const from = k === 0 ? { x: D_IN_X, y: CHAIN_Y + 20 } : qAnchor(k - 1);
              const to = dAnchor(k);
              const lit = reg[k] === 1;
              return (
                <motion.circle
                  key={k}
                  r={4}
                  className={lit ? "fill-hi" : "fill-muted"}
                  initial={{ cx: from.x, cy: from.y, opacity: 1 }}
                  animate={{ cx: [from.x, to.x], cy: [from.y, to.y], opacity: [1, 1, 0] }}
                  transition={{ duration: 0.22, delay: k * 0.025, ease: OUT_EASE, times: [0, 0.8, 1] }}
                />
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
