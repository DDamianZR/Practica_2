import { create } from "zustand";
import type { Bit, Dip, HistoryEntry, Mode, Reg } from "../types/register";
import { step } from "../lib/simulation";

const HISTORY_CAP = 32;
const SERIAL_CAP = 16;
const EMPTY_REG: Reg = [0, 0, 0, 0, 0, 0, 0, 0];
const EMPTY_DIP: Dip = [0, 0, 0, 0, 0, 0, 0, 0];

const MODE_ORDER: Mode[] = ["SIPO", "PISO", "PIPO"];

function nextMode(mode: Mode): Mode {
  return MODE_ORDER[(MODE_ORDER.indexOf(mode) + 1) % MODE_ORDER.length];
}

interface State {
  mode: Mode;
  reg: Reg;
  dip: Dip;
  cycle: number;
  pisoLoaded: boolean;
  serialHistory: Bit[];
  history: HistoryEntry[];
  running: boolean;
  speedBpm: number;
  soundOn: boolean;

  setDip(index: number, value: Bit): void;
  pulseClock(): void;
  clear(): void;
  cycleMode(): void;
  setMode(mode: Mode): void;
  clearTiming(): void;
  play(): void;
  pause(): void;
  setSpeed(bpm: number): void;
  toggleSound(): void;
}

export const useRegisterStore = create<State>((set, get) => ({
  mode: "SIPO",
  reg: [...EMPTY_REG] as Reg,
  dip: [...EMPTY_DIP] as Dip,
  cycle: 0,
  pisoLoaded: false,
  serialHistory: [],
  history: [],
  running: false,
  speedBpm: 90,
  soundOn: true,

  setDip: (index, value) => {
    const s = get();
    const d = [...s.dip] as Dip;
    d[index] = value;
    set({ dip: d });
  },

  pulseClock: () => {
    const s = get();
    const result = step(s.mode, s.reg, s.dip, s.pisoLoaded);
    const nextCycle = s.cycle + 1;
    const entry: HistoryEntry = {
      cycle: nextCycle,
      mode: s.mode,
      op: result.op,
      dip: [...s.dip] as Dip,
      dIn: result.dIn,
      reg: result.reg,
      serialOut: result.serialOut,
      t: performance.now(),
    };
    const nextHistory = s.history.length >= HISTORY_CAP
      ? [...s.history.slice(1), entry]
      : [...s.history, entry];
    const nextSerialHistory = result.serialOut !== null
      ? (s.serialHistory.length >= SERIAL_CAP
        ? [...s.serialHistory.slice(1), result.serialOut]
        : [...s.serialHistory, result.serialOut])
      : s.serialHistory;

    set({
      reg: result.reg,
      cycle: nextCycle,
      pisoLoaded: result.pisoLoaded,
      history: nextHistory,
      serialHistory: nextSerialHistory,
    });
  },

  clear: () => set({
    reg: [...EMPTY_REG] as Reg,
    cycle: 0,
    pisoLoaded: false,
    history: [],
    serialHistory: [],
    running: false,
  }),

  cycleMode: () => set((s) => ({
    mode: nextMode(s.mode),
    reg: [...EMPTY_REG] as Reg,
    cycle: 0,
    pisoLoaded: false,
    history: [],
    serialHistory: [],
    running: false,
  })),

  setMode: (mode) => set((s) => {
    if (mode === s.mode) return s;
    return {
      mode,
      reg: [...EMPTY_REG] as Reg,
      cycle: 0,
      pisoLoaded: false,
      history: [],
      serialHistory: [],
      running: false,
    };
  }),

  clearTiming: () => set({ history: [], serialHistory: [] }),

  play: () => set({ running: true }),
  pause: () => set({ running: false }),
  setSpeed: (bpm) => set({ speedBpm: Math.max(30, Math.min(300, Math.round(bpm))) }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
}));
