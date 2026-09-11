export type Bit = 0 | 1;
export type Mode = "SIPO" | "PISO" | "PIPO";
export type Op = "SHIFT" | "LOAD" | "SHIFT_OUT" | "PARALLEL";
export type Reg = [Bit, Bit, Bit, Bit]; // reg[0]=Q0 ... reg[3]=Q3
export type Dip = [Bit, Bit, Bit, Bit]; // D0..D3

export interface HistoryEntry {
  cycle: number;         // pulso de CLK (1-indexed)
  mode: Mode;            // modo activo en este flanco
  op: Op;                // operación realizada
  dip: Dip;              // snapshot del DIP en este flanco
  dIn: Bit;              // bit de entrada serie que entró a Q0
  reg: Reg;              // snapshot DESPUÉS del flanco
  serialOut: Bit | null; // bit expulsado por Q3 (PISO SHIFT_OUT); null si no aplica
  t: number;             // performance.now()
}
