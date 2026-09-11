# Registro de Corrimiento 8 bits · SIPO / PISO / PIPO

Simulador web interactivo de un registro de corrimiento de **8 bits** con **tres modos de operación** conmutables en vivo — **SIPO** (Serial In · Parallel Out), **PISO** (Parallel In · Serial Out) y **PIPO** (Parallel In · Parallel Out) — basado en una práctica de laboratorio con Arduino UNO. Cuatro vistas sincronizadas del mismo estado: circuito (Arduino + LEDs + DIP + botones), cadena de 8 flip-flops D con animación de propagación, carta de tiempos estilo WaveDrom (con export PNG/SVG) y tabla de verdad dependiente del modo.

## Uso

```bash
npm i
npm run dev
```

## Controles

- **DIP D0..D7** — ocho interruptores. En **SIPO** solo importa D0 (entrada serie); en **PISO**/**PIPO** los ocho forman la palabra de 8 bits a cargar.
- **CLK** — dispara un pulso de reloj: ejecuta la operación del modo activo.
- **CLR** — limpia el registro (`00000000`), el ciclo y el estado interno, en cualquier modo. No mueve el DIP.
- **MODE** — cicla `SIPO → PISO → PIPO → SIPO`. Cambiar de modo limpia el registro y el estado interno (igual que CLR).
- **Auto-run** — reproduce pulsos automáticamente a la velocidad (BPM) elegida.
- Atajos de teclado: `Espacio` pulso de CLK, `C` limpiar, `M` cambiar de modo, `P` play/pause, `1`–`8` alternan D0–D7.

## Los tres modos

- **SIPO** — cada CLK desplaza el registro a la derecha metiendo el bit de D0 por Q0: `Q7←Q6 ... Q1←Q0, Q0←D0`.
  Ejemplo canónico: con `D0=1`, ocho pulsos producen `00000000 → 10000000 → 11000000 → ... → 11111111`.
- **PISO** — el **primer** CLK tras entrar al modo (o tras CLR) carga el DIP completo en paralelo (`LOAD`, sin salida serie). Los **siguientes** CLK desplazan el registro a la derecha: el bit que estaba en Q7 sale por la **salida serie (SO)** y se mete un 0 por Q0 (`SHIFT_OUT`).
  Ejemplo canónico: DIP `10110011` → LOAD muestra `10110011`; los 8 pulsos siguientes producen SO = `1, 1, 0, 0, 1, 1, 0, 1` y el registro termina en `00000000`.
- **PIPO** — cada CLK copia el DIP completo (D0..D7) a Q0..Q7 al instante, sin corrimiento.
  Ejemplo canónico: DIP `10101010` → cada CLK deja el registro en `10101010`.

## Pinout (Arduino UNO - 19 pines)

| Señal | Pin | Señal | Pin |
|---|---|---|---|
| LED Q0 | D2 | DIP D0 | A0 |
| LED Q1 | D3 | DIP D1 | A1 |
| LED Q2 | D4 | DIP D2 | A2 |
| LED Q3 | D5 | DIP D3 | A3 |
| LED Q4 | D6 | DIP D4 | A4 |
| LED Q5 | D7 | DIP D5 | A5 |
| LED Q6 | D8 | DIP D6 | D10 |
| LED Q7 | D9 | DIP D7 | D11 |
| Botón CLK | D12 | Botón CLR | D13 |
| Botón MODE | D0 (RX) | Serial Monitor | D1 (TX) a 115200 bps |

DIP y botones usan `INPUT_PULLUP` (ON/presionado = LOW = 1). Cada LED necesita su resistencia (220–330 Ω) a GND. Ver [`registro_corrimiento_8bits.ino`](registro_corrimiento_8bits.ino) para el firmware completo, que replica bit por bit la lógica de la simulación.

## Arquitectura

Toda la máquina de estados vive en una función pura, `step()` (`src/lib/simulation.ts`), que recibe `(modo, registro, dip, pisoCargado)` y devuelve el siguiente estado — sin efectos secundarios, sin acceso a React ni al store. El store de Zustand (`src/store/registerStore.ts`) es la **única fuente de verdad** del estado en vivo (modo, registro, DIP, ciclo, historial, auto-run): invoca `step()` en cada pulso de CLK y expone el resultado. Ninguna vista recalcula el registro por su cuenta — las cuatro vistas (`CircuitBoard`, `FlipFlopChain`, `TimingDiagram`, `TruthTable`) y los indicadores (`ModeBadge`, `SerialOutput`) son funciones puras de ese mismo estado, así que siempre están sincronizadas entre sí.

```
src/
  lib/simulation.ts        step() puro: máquina de estados de 8 bits
  lib/pinmap.ts            fuente única de etiquetas de pines
  store/registerStore.ts   estado global Zustand (modo, reg, dip, ciclo, historial, auto-run)
  components/              4 vistas + ModeBadge + SerialOutput + Controls
  lib/                     clock loop, sonido (Tone.js), atajos, geometría de waveforms, export SVG/PNG
```

## Firmware Arduino
El sketch está disponible en dos ubicaciones del repositorio:
- [`registro_corrimiento_8bits.ino`](registro_corrimiento_8bits.ino) (en la raíz)
- [`Practica2/Practica2.ino`](Practica2/Practica2.ino) (carpeta del proyecto de Arduino IDE)
