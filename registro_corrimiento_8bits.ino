/*
 * ============================================================
 *  Registro de Corrimiento 8 bits - 3 modos
 *  SIPO / PISO / PIPO simulados con Arduino UNO
 * ============================================================
 *  Pinout (19 pines utilizados en Arduino UNO):
 *   - LEDs Q0..Q7 -> D2, D3, D4, D5, D6, D7, D8, D9 (OUTPUT con resistencias 220-330 ohm a GND)
 *   - DIP D0..D7  -> A0, A1, A2, A3, A4, A5, D10, D11 (INPUT_PULLUP, switch a GND al cerrar)
 *   - Boton CLK   -> D12 (INPUT_PULLUP, pulsador a GND)
 *   - Boton CLR   -> D13 (INPUT_PULLUP, pulsador a GND)
 *   - Boton MODE  -> D0  (INPUT_PULLUP, pulsador a GND)
 *   - Serial TX   -> D1  (Salida serie a 115200 baudios para depuracion)
 *
 *  IMPORTANTE CONEXION DE BOTONES (INPUT_PULLUP):
 *   Cada pulsador debe ir conectado entre su PIN y GND (NO a 5V).
 *   - Pulsador suelto  = HIGH (1)
 *   - Pulsador apretado = LOW (0)
 * ============================================================
 */

// ---------- Pines ----------
const uint8_t LED_PINS[8] = {2, 3, 4, 5, 6, 7, 8, 9};       // Q0..Q7 (izq -> der)
const uint8_t DIP_PINS[8] = {A0, A1, A2, A3, A4, A5, 10, 11}; // D0..D7
const uint8_t PIN_CLK  = 12;
const uint8_t PIN_CLR  = 13;
const uint8_t PIN_MODE = 0; // Pin D0 (RX)

// ---------- Tipos ----------
enum Modo : uint8_t { SIPO = 0, PISO = 1, PIPO = 2 };

// Ventana de bloqueo para antirrebote
const unsigned long DEBOUNCE_MS = 50;

struct Boton {
  uint8_t pin;
  bool estadoAnterior;         // Ultimo estado leido (HIGH = suelto)
  unsigned long tUltimoCambio; // Timestamp del ultimo cambio
};

// ---------- Estado global ----------
Modo modo = SIPO;

bool reg[8] = {0, 0, 0, 0, 0, 0, 0, 0};   // reg[0]=Q0 ... reg[7]=Q7
unsigned int ciclo = 0;
bool pisoCargado = false;     // PISO: false = proximo CLK carga, true = desplaza
uint8_t pisoDesplazamientos = 0; // Contador de desplazamientos en PISO (hasta 8)

Boton btnClk  = {PIN_CLK,  HIGH, 0};
Boton btnClr  = {PIN_CLR,  HIGH, 0};
Boton btnMode = {PIN_MODE, HIGH, 0};

// ---------- Utilidades ----------
const char* nombreModo(Modo m) {
  switch (m) {
    case SIPO: return "SIPO (Serial In - Parallel Out 8b)";
    case PISO: return "PISO (Parallel In - Serial Out 8b)";
    case PIPO: return "PIPO (Parallel In - Parallel Out 8b)";
    default:   return "DESCONOCIDO";
  }
}

/*
 * Antirrebote por flanco instantaneo (Lockout Debounce):
 * - Dispara en el instante EXACTO en que se presiona (HIGH -> LOW).
 * - Cero latencia (detecta pulsaciones cortas/rapidas de inmediato).
 * - Bloquea cualquier rebote o ruido durante DEBOUNCE_MS.
 */
bool flancoPresion(Boton &b) {
  bool lectura = digitalRead(b.pin);
  unsigned long ahora = millis();
  bool evento = false;

  // Detecta transicion de suelto (HIGH) a presionado (LOW)
  if (lectura == LOW && b.estadoAnterior == HIGH) {
    if (ahora - b.tUltimoCambio > DEBOUNCE_MS) {
      evento = true;
      b.tUltimoCambio = ahora;
    }
  } else if (lectura == HIGH && b.estadoAnterior == LOW) {
    b.tUltimoCambio = ahora; // Registra cuando se suelta
  }

  b.estadoAnterior = lectura;
  return evento;
}

// DIP en INPUT_PULLUP: switch cerrado a GND = LOW = bit 1
bool leerBitDip(uint8_t i) {
  return (digitalRead(DIP_PINS[i]) == LOW) ? 1 : 0;
}

void leerDipParalelo(bool destino[8]) {
  for (int i = 0; i < 8; i++) destino[i] = leerBitDip(i);
}

// ---------- Operaciones del Registro ----------
void actualizarLeds() {
  for (int i = 0; i < 8; i++) digitalWrite(LED_PINS[i], reg[i] ? HIGH : LOW);
}

void limpiar() {
  for (int i = 0; i < 8; i++) reg[i] = 0;
  ciclo = 0;
  pisoCargado = false;
  pisoDesplazamientos = 0;
  actualizarLeds();
}

void desplazarDerecha(bool bitEntrada) {
  for (int i = 7; i > 0; i--) reg[i] = reg[i - 1];
  reg[0] = bitEntrada;
}

void cargarParalelo() {
  leerDipParalelo(reg);
}

// Destello fisico en los LEDs para confirmar el cambio de modo en la protoboard
void animarCambioModo() {
  for (int i = 0; i < 8; i++) digitalWrite(LED_PINS[i], LOW);
  delay(80);
  // Parpadea el LED del modo: Q0 para SIPO, Q1 para PISO, Q2 para PIPO
  digitalWrite(LED_PINS[modo], HIGH);
  delay(160);
  digitalWrite(LED_PINS[modo], LOW);
  delay(80);
  digitalWrite(LED_PINS[modo], HIGH);
  delay(160);
  digitalWrite(LED_PINS[modo], LOW);
}

// ---------- Impresion Serial ----------
void imprimirRegistro() {
  Serial.print(F("Q0..Q7="));
  for (int i = 0; i < 8; i++) Serial.print(reg[i]);
}

void imprimirDip() {
  Serial.print(F("DIP(D0..D7)="));
  for (int i = 0; i < 8; i++) Serial.print(leerBitDip(i));
}

void imprimirCabecera() {
  Serial.println();
  Serial.println(F("================================================"));
  Serial.print(F(">> CAMBIO DE MODO: "));
  Serial.println(nombreModo(modo));
  Serial.println(F("================================================"));
  switch (modo) {
    case SIPO:
      Serial.println(F(" Operacion: Cada CLK lee D0 (DIP[0]) y desplaza a la derecha (Q7<-Q6..Q0<-D0)."));
      break;
    case PISO:
      Serial.println(F(" Operacion:"));
      Serial.println(F("   - 1er CLK: LOAD (carga el DIP completo D0..D7 a Q0..Q7)."));
      Serial.println(F("   - Siguientes CLK: SHIFT (sale Q7 por Serial y entra 0 por Q0)."));
      Serial.println(F("   - Tras 8 desplazamientos, el siguiente CLK recarga automaticamente."));
      break;
    case PIPO:
      Serial.println(F(" Operacion: Cada CLK carga instantaneamente el DIP completo (D0..D7) a Q0..Q7."));
      break;
  }
  Serial.println(F("================================================"));
  Serial.println();
}

// ---------- Setup ----------
void setup() {
  Serial.begin(115200);

  for (int i = 0; i < 8; i++) pinMode(LED_PINS[i], OUTPUT);
  for (int i = 0; i < 8; i++) pinMode(DIP_PINS[i], INPUT_PULLUP);
  pinMode(PIN_CLK,  INPUT_PULLUP);
  pinMode(PIN_CLR,  INPUT_PULLUP);
  pinMode(PIN_MODE, INPUT_PULLUP);

  limpiar();

  Serial.println();
  Serial.println(F("################################################"));
  Serial.println(F("#  Registro 8 bits SIPO / PISO / PIPO - Arduino #"));
  Serial.println(F("################################################"));
  Serial.println(F("Pinout Arduino UNO:"));
  Serial.println(F(" - LEDs Q0..Q7    : D2, D3, D4, D5, D6, D7, D8, D9"));
  Serial.println(F(" - DIP D0..D7     : A0, A1, A2, A3, A4, A5, D10, D11"));
  Serial.println(F(" - Boton CLK (D12): Pulso de reloj"));
  Serial.println(F(" - Boton CLR (D13): Limpiar registro (00000000)"));
  Serial.println(F(" - Boton MODE(D0) : Cicla entre SIPO -> PISO -> PIPO"));
  imprimirCabecera();
}

// ---------- Loop ----------
void loop() {
  // 1. Boton MODE: Cambia de modo ciclicamente
  if (flancoPresion(btnMode)) {
    modo = (Modo)((modo + 1) % 3);
    limpiar();
    animarCambioModo();
    imprimirCabecera();
  }

  // 2. Boton CLK: Ejecuta la operacion del modo activo
  if (flancoPresion(btnClk)) {
    ciclo++;
    switch (modo) {
      case SIPO: {
        bool d0 = leerBitDip(0);
        desplazarDerecha(d0);
        actualizarLeds();
        Serial.print(F("CLK #")); Serial.print(ciclo);
        Serial.print(F(" | SIPO SHIFT | In(D0)=")); Serial.print(d0);
        Serial.print(F(" | ")); imprimirRegistro();
        Serial.println();
        break;
      }
      case PISO: {
        // Si no esta cargado, o si ya salieron los 8 bits, recarga automaticamente
        if (!pisoCargado || pisoDesplazamientos >= 8) {
          cargarParalelo();
          pisoCargado = true;
          pisoDesplazamientos = 0;
          actualizarLeds();
          Serial.print(F("CLK #")); Serial.print(ciclo);
          Serial.print(F(" | PISO LOAD | ")); imprimirDip();
          Serial.print(F(" -> ")); imprimirRegistro();
          Serial.println();
        } else {
          bool bitSalida = reg[7]; // Bit que sale por el extremo Q7
          desplazarDerecha(0);     // Entra 0 por la izquierda
          pisoDesplazamientos++;
          actualizarLeds();
          Serial.print(F("CLK #")); Serial.print(ciclo);
          Serial.print(F(" | PISO SHIFT (")); Serial.print(pisoDesplazamientos); Serial.print(F("/8)"));
          Serial.print(F(" | Salida Serie (SO)=")); Serial.print(bitSalida);
          Serial.print(F(" | ")); imprimirRegistro();
          Serial.println();
        }
        break;
      }
      case PIPO: {
        cargarParalelo();
        actualizarLeds();
        Serial.print(F("CLK #")); Serial.print(ciclo);
        Serial.print(F(" | PIPO LOAD | ")); imprimirDip();
        Serial.print(F(" -> ")); imprimirRegistro();
        Serial.println();
        break;
      }
    }
  }

  // 3. Boton CLR: Limpieza asincrona
  if (flancoPresion(btnClr)) {
    limpiar();
    Serial.println(F(">> [CLR]: Registro reseteado a 00000000 | Ciclo = 0"));
  }
}
