# SIPO 8-bit Simulator

Simulador web interactivo de un registro de corrimiento **SIPO** (Serial In · Parallel Out) de 8 bits, basado en la práctica de laboratorio con Arduino UNO. Cuatro vistas sincronizadas del mismo estado: circuito (Arduino + LEDs), cadena de flip-flops D, carta de tiempos estilo WaveDrom, y tabla de verdad/secuencia.

TODO: screenshot / GIF del simulador en acción.

## Uso

```bash
npm i
npm run dev
```

- **DATA (D12)** — interruptor DIP: bit a inyectar en el siguiente flanco.
- **CLK (D10)** — dispara un pulso de reloj (corrimiento a la derecha).
- **CLR (D11)** — limpia el registro de forma instantánea.
- **Auto-run** — reproduce pulsos automáticamente a la velocidad (BPM) elegida.
- **Secuencia** — carga una cadena de bits (`010110xx`) y la reproduce sola.
- Atajos de teclado: `Espacio` pulso, `C` limpiar, `0`/`1` fijar DATA, `P` play/pause.

## Arquitectura

Todo el estado del registro vive en **un solo store de Zustand** (`src/store/registerStore.ts`): el arreglo de 8 bits, el contador de ciclos, el historial de flancos y los controles de auto-run. Ninguna vista calcula estado derivado del registro por su cuenta — las cuatro vistas (`CircuitBoard`, `FlipFlopChain`, `TimingDiagram`, `TruthTable`) son funciones puras de ese mismo estado, así que siempre están sincronizadas entre sí y son deterministas: mismo estado inicial + misma secuencia de pulsos = mismo resultado, siempre.

```
src/
  store/registerStore.ts   fuente única de verdad (reg, cycle, history, auto-run)
  components/              las 4 vistas + Controls + Tabs
  lib/                     clock loop, sonido (Tone.js), atajos, geometría del waveform
```

## Créditos

Basado en la práctica de laboratorio "Registro de Corrimiento SIPO 8 bits" (Arduino UNO) — ver [`registro_sipo_8bits.ino`](registro_sipo_8bits.ino) para el pinout y la lógica original.
