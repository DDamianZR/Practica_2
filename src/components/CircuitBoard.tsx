import { useState } from "react";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import clsx from "clsx";
import { useRegisterStore } from "../store/registerStore";

const LED_X = (i: number) => 92 + i * 62;
const LED_Y = 40;
const RAIL_Y = 94;
const ARDUINO_X = 30;
const ARDUINO_Y = 168;
const ARDUINO_W = 780;
const ARDUINO_H = 168;
const PIN_Y = ARDUINO_Y;

const DIP_X = 618;
const DIP_Y = 24;
const CLK_X = 700;
const CLK_Y = 34;
const CLR_X = 748;
const CLR_Y = 34;
const GND_PIN_X = 758;

function bow(x1: number, y1: number, x2: number, y2: number, lean: number): string {
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1 + lean} ${midY}, ${x2 + lean} ${midY}, ${x2} ${y2}`;
}

function SignalWire({
  d,
  active,
  colorClass,
  flashKey,
}: {
  d: string;
  active: boolean;
  colorClass: string;
  flashKey?: number;
}) {
  return (
    <g>
      <path d={d} fill="none" className="stroke-line" strokeWidth={2} strokeLinecap="round" />
      {active && (
        <motion.path
          key={flashKey ?? "steady"}
          d={d}
          fill="none"
          className={clsx(colorClass, "wire-flow")}
          strokeWidth={2}
          strokeLinecap="round"
          initial={flashKey !== undefined ? { opacity: 0.4 } : false}
          animate={{ opacity: flashKey !== undefined ? [0.4, 1, 0.75] : 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      )}
    </g>
  );
}

function PinLabel({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={2.5} className="fill-text" />
      <text x={x} y={y + 16} textAnchor="middle" className="fill-muted" style={{ fontSize: 8, fontFamily: "monospace" }}>
        {label}
      </text>
    </g>
  );
}

export function CircuitBoard() {
  const [reg, data, cycle, pulseClock, clear, setData] = useRegisterStore(
    useShallow((s) => [s.reg, s.data, s.cycle, s.pulseClock, s.clear, s.setData]),
  );
  const [hovered, setHovered] = useState<string | null>(null);

  const svgWidth = 830;
  const svgHeight = ARDUINO_Y + ARDUINO_H + 20;

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ minWidth: svgWidth }}
        role="img"
        aria-label={`Vista de circuito. Arduino UNO con DIP DATA=${data}, LEDs Q0..Q7 = ${reg.join("")}`}
      >
        <defs>
          <filter id="ledGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* GND rail */}
        <line x1={70} y1={RAIL_Y} x2={LED_X(7) + 20} y2={RAIL_Y} className="stroke-line" strokeWidth={1.5} />
        <text x={40} y={RAIL_Y + 3} className="fill-muted" style={{ fontSize: 8, fontFamily: "monospace" }}>GND</text>
        <SignalWire d={bow(LED_X(7) + 20, RAIL_Y, GND_PIN_X, PIN_Y, 40)} active={false} colorClass="stroke-line" />

        {/* LEDs + resistors + signal wires */}
        {Array.from({ length: 8 }, (_, i) => {
          const x = LED_X(i);
          const lit = reg[i] === 1;
          const pinX = x;
          return (
            <g
              key={i}
              onMouseEnter={() => setHovered(`Q${i} · D${i + 2}`)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{`LED Q${i} · Arduino D${i + 2} · estado ${reg[i]}`}</title>

              <SignalWire d={bow(pinX, PIN_Y, x, LED_Y + 12, -14)} active={lit} colorClass="stroke-hi2" />

              {/* resistor zigzag from LED cathode down to GND rail */}
              <path
                d={`M ${x} ${LED_Y + 11} L ${x - 4} ${LED_Y + 17} L ${x + 4} ${LED_Y + 23} L ${x - 4} ${LED_Y + 29} L ${x + 4} ${LED_Y + 35} L ${x} ${RAIL_Y}`}
                fill="none"
                className="stroke-muted"
                strokeWidth={1.5}
              />

              <circle
                cx={x}
                cy={LED_Y}
                r={11}
                className={lit ? "fill-hi2" : "fill-lo"}
                filter={lit ? "url(#ledGlow)" : undefined}
                style={{ transition: "fill 120ms" }}
              />
              <circle cx={x} cy={LED_Y} r={11} className="fill-none stroke-line" strokeWidth={1} />

              <text x={x} y={LED_Y + 52} textAnchor="middle" className="fill-text" style={{ fontSize: 9, fontFamily: "monospace" }}>
                Q{i}
              </text>

              <PinLabel x={pinX} y={PIN_Y} label={`D${i + 2}`} />
            </g>
          );
        })}

        {/* DIP switch (DATA · D12) */}
        <g
          onMouseEnter={() => setHovered(`DATA · D12`)}
          onMouseLeave={() => setHovered(null)}
        >
          <title>{`DIP DATA · Arduino D12 · estado ${data}`}</title>
          <SignalWire d={bow(DIP_X + 8, DIP_Y + 26, DIP_X + 8, PIN_Y, 6)} active={data === 1} colorClass="stroke-data" />
          <rect x={DIP_X} y={DIP_Y} width={68} height={26} rx={3} className="fill-panel2 stroke-line" strokeWidth={1} />
          <g
            role="switch"
            aria-checked={data === 1}
            aria-label={`Interruptor DIP DATA, posición 1. Estado ${data === 1 ? "encendido" : "apagado"}.`}
            tabIndex={0}
            onClick={() => setData(data === 1 ? 0 : 1)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setData(data === 1 ? 0 : 1);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <rect x={DIP_X + 3} y={DIP_Y + 3} width={8} height={20} rx={1.5} className="fill-bg stroke-line" strokeWidth={0.75} />
            <motion.rect
              x={DIP_X + 4}
              width={6}
              height={9}
              rx={1}
              className={data === 1 ? "fill-hi2" : "fill-lo"}
              animate={{ y: data === 1 ? DIP_Y + 4 : DIP_Y + 13 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
          </g>
          {Array.from({ length: 7 }, (_, k) => (
            <rect
              key={k}
              x={DIP_X + 13 + (k + 1) * 8}
              y={DIP_Y + 13}
              width={6}
              height={9}
              rx={1}
              className="fill-lo/70"
            />
          ))}
          <text x={DIP_X + 34} y={DIP_Y - 4} textAnchor="middle" className="fill-data" style={{ fontSize: 8, fontFamily: "monospace" }}>
            DATA
          </text>
          <PinLabel x={DIP_X + 8} y={PIN_Y} label="D12" />
        </g>

        {/* CLK button */}
        <g
          role="button"
          tabIndex={0}
          aria-label="Disparar pulso de reloj (CLK), Arduino D10"
          onClick={() => pulseClock()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              pulseClock();
            }
          }}
          onMouseEnter={() => setHovered("CLK · D10")}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: "pointer" }}
        >
          <title>{`Botón CLK · Arduino D10 · ciclo ${cycle}`}</title>
          <SignalWire d={bow(CLK_X, CLK_Y + 22, CLK_X, PIN_Y, 6)} active flashKey={cycle} colorClass="stroke-[#3b82f6]" />
          <motion.rect
            x={CLK_X - 11}
            y={CLK_Y}
            width={22}
            height={22}
            rx={3}
            className="fill-panel2 stroke-[#3b82f6]"
            strokeWidth={1.25}
            whileTap={{ scale: 0.9 }}
          />
          <line x1={CLK_X - 6} y1={CLK_Y + 11} x2={CLK_X + 6} y2={CLK_Y + 11} className="stroke-muted" strokeWidth={1.5} />
          <line x1={CLK_X} y1={CLK_Y + 5} x2={CLK_X} y2={CLK_Y + 17} className="stroke-muted" strokeWidth={1.5} />
          <text x={CLK_X} y={CLK_Y - 4} textAnchor="middle" className="fill-[#3b82f6]" style={{ fontSize: 8, fontFamily: "monospace" }}>
            CLK
          </text>
        </g>

        {/* CLR button */}
        <g
          role="button"
          tabIndex={0}
          aria-label="Limpiar registro (CLR), Arduino D11"
          onClick={() => clear()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              clear();
            }
          }}
          onMouseEnter={() => setHovered("CLR · D11")}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: "pointer" }}
        >
          <title>{`Botón CLR · Arduino D11 · limpia el registro`}</title>
          <SignalWire d={bow(CLR_X, CLR_Y + 22, CLR_X, PIN_Y, 6)} active={false} colorClass="stroke-[#f97316]" />
          <motion.rect
            x={CLR_X - 11}
            y={CLR_Y}
            width={22}
            height={22}
            rx={3}
            className="fill-panel2 stroke-[#f97316]"
            strokeWidth={1.25}
            whileTap={{ scale: 0.9 }}
          />
          <line x1={CLR_X - 6} y1={CLR_Y + 11} x2={CLR_X + 6} y2={CLR_Y + 11} className="stroke-muted" strokeWidth={1.5} />
          <line x1={CLR_X} y1={CLR_Y + 5} x2={CLR_X} y2={CLR_Y + 17} className="stroke-muted" strokeWidth={1.5} />
          <text x={CLR_X} y={CLR_Y - 4} textAnchor="middle" className="fill-[#f97316]" style={{ fontSize: 8, fontFamily: "monospace" }}>
            CLR
          </text>
        </g>

        <PinLabel x={CLK_X} y={PIN_Y} label="D10" />
        <PinLabel x={CLR_X} y={PIN_Y} label="D11" />
        <PinLabel x={GND_PIN_X} y={PIN_Y} label="GND" />

        {/* Arduino UNO board */}
        <g>
          <title>Arduino UNO</title>
          <rect
            x={ARDUINO_X}
            y={ARDUINO_Y}
            width={ARDUINO_W}
            height={ARDUINO_H}
            rx={12}
            className="fill-[#0f766e] stroke-line"
            strokeWidth={1.5}
          />

          {/* header strips */}
          <rect x={ARDUINO_X + 20} y={ARDUINO_Y + 6} width={ARDUINO_W - 40} height={10} rx={2} className="fill-[#111]" />
          <rect
            x={ARDUINO_X + 20}
            y={ARDUINO_Y + ARDUINO_H - 16}
            width={ARDUINO_W - 40}
            height={10}
            rx={2}
            className="fill-[#111]"
          />

          {/* USB port */}
          <rect x={ARDUINO_X + 10} y={ARDUINO_Y + 30} width={34} height={26} rx={2} className="fill-slate-300" />
          <rect x={ARDUINO_X + 15} y={ARDUINO_Y + 35} width={24} height={16} rx={1} className="fill-slate-500" />

          {/* ATmega chip */}
          <rect
            x={ARDUINO_X + ARDUINO_W / 2 - 60}
            y={ARDUINO_Y + ARDUINO_H / 2 - 24}
            width={120}
            height={48}
            rx={3}
            className="fill-[#111] stroke-line"
            strokeWidth={1}
          />
          <text
            x={ARDUINO_X + ARDUINO_W / 2}
            y={ARDUINO_Y + ARDUINO_H / 2 + 4}
            textAnchor="middle"
            className="fill-white/40"
            style={{ fontSize: 8, fontFamily: "monospace" }}
          >
            ATmega328P
          </text>

          <text
            x={ARDUINO_X + ARDUINO_W - 30}
            y={ARDUINO_Y + ARDUINO_H - 28}
            textAnchor="end"
            className="fill-white/60"
            style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }}
          >
            ARDUINO UNO
          </text>
        </g>

        {hovered && (
          <g transform={`translate(${svgWidth - 150}, 10)`}>
            <rect width={140} height={20} rx={4} className="fill-panel2 stroke-line" strokeWidth={1} />
            <text x={70} y={14} textAnchor="middle" className="fill-text" style={{ fontSize: 9, fontFamily: "monospace" }}>
              {hovered}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
