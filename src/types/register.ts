export type Bit = 0 | 1;
export type Reg = [Bit, Bit, Bit, Bit, Bit, Bit, Bit, Bit];

export interface HistoryEntry {
  cycle: number;      // 1-indexed (0 = estado inicial, no se guarda)
  data: Bit;          // bit inyectado en este flanco
  reg: Reg;            // snapshot DESPUÉS del flanco
  t: number;           // performance.now() para animaciones
}
