import { create } from "zustand";
import type { Bit, Reg, HistoryEntry } from "../types/register";

const EMPTY_REG: Reg = [0, 0, 0, 0, 0, 0, 0, 0];
const HISTORY_CAP = 32;

interface State {
  reg: Reg;
  data: Bit;
  cycle: number;
  history: HistoryEntry[];
  running: boolean;
  speedBpm: number; // 30..300, default 90
  soundOn: boolean;
  queue: Bit[]; // bits pendientes de loadSequence; si vacío se usa `data`

  setData(v: Bit): void;
  pulseClock(): void;
  clear(): void;
  loadSequence(bits: string): void;
  play(): void;
  pause(): void;
  setSpeed(bpm: number): void;
  toggleSound(): void;
}

export const useRegisterStore = create<State>((set, get) => ({
  reg: [...EMPTY_REG] as Reg,
  data: 0,
  cycle: 0,
  history: [],
  running: false,
  speedBpm: 90,
  soundOn: true,
  queue: [],

  setData: (v) => set({ data: v }),

  pulseClock: () => {
    const s = get();
    const nextData: Bit = s.queue.length > 0 ? s.queue[0] : s.data;
    const nextReg: Reg = [nextData, s.reg[0], s.reg[1], s.reg[2], s.reg[3], s.reg[4], s.reg[5], s.reg[6]];
    const nextCycle = s.cycle + 1;
    const entry: HistoryEntry = { cycle: nextCycle, data: nextData, reg: nextReg, t: performance.now() };
    const nextHistory = s.history.length >= HISTORY_CAP
      ? [...s.history.slice(1), entry]
      : [...s.history, entry];
    const nextQueue = s.queue.length > 0 ? s.queue.slice(1) : s.queue;
    set({
      reg: nextReg,
      cycle: nextCycle,
      history: nextHistory,
      queue: nextQueue,
      data: s.queue.length > 0 ? nextData : s.data, // refleja el bit inyectado en el DIP
      running: nextQueue.length === 0 && s.queue.length > 0 ? false : s.running, // pausa al terminar la secuencia
    });
  },

  clear: () => set({
    reg: [...EMPTY_REG] as Reg,
    cycle: 0,
    history: [],
    queue: [],
    running: false,
  }),

  loadSequence: (bits) => {
    if (!/^[01]+$/.test(bits)) return;
    const q: Bit[] = bits.split("").map((c) => (c === "1" ? 1 : 0));
    set({ queue: q, running: true });
  },

  play: () => set({ running: true }),
  pause: () => set({ running: false }),
  setSpeed: (bpm) => set({ speedBpm: Math.max(30, Math.min(300, Math.round(bpm))) }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
}));
