import type { Bit, Reg, HistoryEntry } from "../types/register";

export const COL = 44;
export const ROW = 34;
export const PAD = 12;
export const LABEL_W = 48;
export const ROW_LABELS = ["CLK", "D", "Q0", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7"] as const;
export const ROW_COUNT = ROW_LABELS.length;

const HIGH_OFF = 6;
const LOW_OFF = ROW - 6;

export interface WaveColumn {
  index: number;
  isPulse: boolean;
  clkLow: string;
  clkHigh: string | null;
  rowPaths: string[]; // [D, Q0..Q7], local coords (0..COL)
  levels: Bit[]; // [D, Q0..Q7]
}

export function rowY(rowIndex: number): number {
  return PAD + rowIndex * ROW;
}

export function highY(rowIndex: number): number {
  return rowY(rowIndex) + HIGH_OFF;
}

export function lowY(rowIndex: number): number {
  return rowY(rowIndex) + LOW_OFF;
}

function levelSegment(prev: Bit | null, level: Bit, rowIndex: number): string {
  const y = level === 1 ? highY(rowIndex) : lowY(rowIndex);
  if (prev === null || prev === level) {
    return `M 0 ${y} L ${COL} ${y}`;
  }
  const yPrev = prev === 1 ? highY(rowIndex) : lowY(rowIndex);
  return `M 0 ${yPrev} L 0 ${y} L ${COL} ${y}`;
}

function clkSegments(isPulse: boolean): { low: string; high: string | null } {
  const low = lowY(0);
  const high = highY(0);
  if (!isPulse) {
    return { low: `M 0 ${low} L ${COL} ${low}`, high: null };
  }
  const mid = COL / 2;
  return {
    low: `M 0 ${low} L ${mid} ${low}`,
    high: `M ${mid} ${low} L ${mid} ${high} L ${COL} ${high} L ${COL} ${low}`,
  };
}

const ZERO_REG: Reg = [0, 0, 0, 0, 0, 0, 0, 0];

export function buildColumns(history: HistoryEntry[]): WaveColumn[] {
  const columns: WaveColumn[] = [];
  let prevD: Bit = 0;
  let prevQ: Reg = ZERO_REG;

  for (let i = 0; i <= history.length; i++) {
    const isPulse = i > 0;
    const d: Bit = isPulse ? history[i - 1].data : 0;
    const q: Reg = isPulse ? history[i - 1].reg : ZERO_REG;

    const dPath = levelSegment(i === 0 ? null : prevD, d, 1);
    const qPaths = q.map((bit, k) => levelSegment(i === 0 ? null : prevQ[k], bit, 2 + k));
    const clk = clkSegments(isPulse);

    columns.push({
      index: i,
      isPulse,
      clkLow: clk.low,
      clkHigh: clk.high,
      rowPaths: [dPath, ...qPaths],
      levels: [d, ...q],
    });

    prevD = d;
    prevQ = q;
  }

  return columns;
}
