import type { Bit, Dip, Mode, Op, Reg } from "../types/register";

export interface StepResult {
  reg: Reg;               // registro DESPUÉS del flanco
  op: Op;                 // operación realizada en este flanco
  dIn: Bit;                // bit de entrada serie que entró a Q0 (para la carta de tiempos)
  serialOut: Bit | null;  // bit expulsado por Q3 (solo PISO SHIFT_OUT); null en el resto
  pisoLoaded: boolean;    // nuevo valor del flag interno de PISO
}

export function step(mode: Mode, reg: Reg, dip: Dip, pisoLoaded: boolean): StepResult {
  switch (mode) {
    case "SIPO":
      // Corrimiento a la derecha metiendo D0 por Q0: Q3<-Q2, Q2<-Q1, Q1<-Q0, Q0<-D0
      return { reg: [dip[0], reg[0], reg[1], reg[2]], op: "SHIFT", dIn: dip[0], serialOut: null, pisoLoaded };
    case "PISO":
      if (!pisoLoaded) {
        // Primer CLK = LOAD: copia el DIP completo. Sin salida serie.
        return { reg: [dip[0], dip[1], dip[2], dip[3]], op: "LOAD", dIn: 0, serialOut: null, pisoLoaded: true };
      }
      // CLK siguientes = SHIFT_OUT: salida_serie = reg[3] (ANTES de desplazar), luego mete 0 por Q0.
      return { reg: [0, reg[0], reg[1], reg[2]], op: "SHIFT_OUT", dIn: 0, serialOut: reg[3], pisoLoaded: true };
    case "PIPO":
      // Carga instantánea del DIP. Sin corrimiento.
      return { reg: [dip[0], dip[1], dip[2], dip[3]], op: "PARALLEL", dIn: 0, serialOut: null, pisoLoaded };
  }
}
