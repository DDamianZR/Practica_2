# Registro de Corrimiento · SIPO / PISO / PIPO

Simulador web interactivo de un registro de corrimiento de **4 bits** con **tres modos de operación** conmutables en vivo — **SIPO** (Serial In · Parallel Out), **PISO** (Parallel In · Serial Out) y **PIPO** (Parallel In · Parallel Out) — basado en una práctica de laboratorio con Arduino UNO. Cuatro vistas sincronizadas del mismo estado: circuito (Arduino + LEDs + DIP + botones), cadena de flip-flops D con animación de propagación, carta de tiempos estilo WaveDrom (con export PNG/SVG) y tabla de verdad dependiente del modo.

TODO: screenshot / GIF del simulador en acción.

## Uso

```bash
npm i
npm run dev
```

## Controles

- **DIP D0..D3** — cuatro interruptores. En **SIPO** solo importa D0 (entrada serie); en **PISO**/**PIPO** los cuatro forman la palabra a cargar.
- **CLK** — dispara un pulso de reloj: ejecuta la operación del modo activo.
- **CLR** — limpia el registro (`0000`), el ciclo y el estado interno, en cualquier modo. No mueve el DIP.
- **MODE** — cicla `SIPO → PISO → PIPO → SIPO`. Cambiar de modo limpia el registro y el estado interno (igual que CLR).
- **Auto-run** — reproduce pulsos automáticamente a la velocidad (BPM) elegida.
- Atajos de teclado: `Espacio` pulso de CLK, `C` limpiar, `M` cambiar de modo, `P` play/pause, `1`–`4` alternan D0–D3.

## Los tres modos

- **SIPO** — cada CLK desplaza el registro a la derecha metiendo el bit de D0 por Q0: `Q3←Q2, Q2←Q1, Q1←Q0, Q0←D0`.
  Ejemplo canónico: con `D0=1`, cuatro pulsos producen `0000 → 1000 → 1100 → 1110 → 1111`.
- **PISO** — el **primer** CLK tras entrar al modo (o tras CLR) carga el DIP completo en paralelo (`LOAD`, sin salida serie). Los **siguientes** CLK desplazan el registro a la derecha: el bit que estaba en Q3 sale por la **salida serie (SO)** y se mete un 0 por Q0 (`SHIFT_OUT`).
  Ejemplo canónico: DIP `1011` → LOAD muestra `1011`; los 4 pulsos siguientes producen SO = `1, 1, 0, 1` y el registro termina en `0000`.
- **PIPO** — cada CLK copia el DIP completo a Q0..Q3 al instante, sin corrimiento.
  Ejemplo canónico: DIP `1010` → cada CLK deja el registro en `1010`.

## Pinout (Arduino UNO)

| Señal | Pin | Señal | Pin |
|---|---|---|---|
| LED Q0 | D2 | DIP D0 | D8 |
| LED Q1 | D3 | DIP D1 | D9 |
| LED Q2 | D4 | DIP D2 | D10 |
| LED Q3 | D5 | DIP D3 | D11 |
| CLK | D12 | CLR | D7 |
| MODE | A0 | | |

DIP y botones usan `INPUT_PULLUP` (ON/presionado = LOW = 1). Cada LED necesita su resistencia (220–330 Ω) a GND. Ver [`registro_corrimiento_4bits.ino`](registro_corrimiento_4bits.ino) para el firmware completo, que replica bit por bit la lógica de la simulación.

## Arquitectura

Toda la máquina de estados vive en una función pura, `step()` (`src/lib/simulation.ts`), que recibe `(modo, registro, dip, pisoCargado)` y devuelve el siguiente estado — sin efectos secundarios, sin acceso a React ni al store. El store de Zustand (`src/store/registerStore.ts`) es la **única fuente de verdad** del estado en vivo (modo, registro, DIP, ciclo, historial, auto-run): invoca `step()` en cada pulso de CLK y expone el resultado. Ninguna vista recalcula el registro por su cuenta — las cuatro vistas (`CircuitBoard`, `FlipFlopChain`, `TimingDiagram`, `TruthTable`) y los indicadores (`ModeBadge`, `SerialOutput`) son funciones puras de ese mismo estado, así que siempre están sincronizadas entre sí y son deterministas: mismo estado inicial + misma secuencia de pulsos = mismo resultado, siempre.

```
src/
  lib/simulation.ts        step() puro: la máquina de estados de los 3 modos
  lib/pinmap.ts             fuente única de las etiquetas de pines
  store/registerStore.ts   fuente única de verdad del estado en vivo (modo, reg, dip, ciclo, historial, auto-run)
  components/              4 vistas + ModeBadge + SerialOutput + Controls
  lib/                     clock loop, sonido (Tone.js), atajos, geometría del waveform, export SVG/PNG
```

## Créditos

Basado en una práctica de laboratorio de registros de corrimiento (Arduino UNO) — ver [`registro_corrimiento_4bits.ino`](registro_corrimiento_4bits.ino) para el pinout y la lógica de firmware.
