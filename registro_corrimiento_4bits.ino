/*
 * ============================================================
 *  Registro de Corrimiento de 4 bits — 3 modos de operacion
 *  SIPO / PISO / PIPO, simulado con Arduino UNO
 * ============================================================
 *
 *  Modos (boton MODE cicla SIPO -> PISO -> PIPO -> SIPO):
 *
 *   SIPO (Serial In, Parallel Out):
 *     Cada CLK desplaza el registro a la derecha metiendo el
 *     bit del DIP D0 por Q0:  Q3<-Q2, Q2<-Q1, Q1<-Q0, Q0<-D0.
 *     Solo importa D0; D1..D3 se ignoran en este modo.
 *
 *   PISO (Parallel In, Serial Out):
 *     El PRIMER CLK tras entrar al modo (o tras CLR) carga todo
 *     el DIP en paralelo: Q0=D0, Q1=D1, Q2=D2, Q3=D3 (LOAD).
 *     Los SIGUIENTES CLK desplazan a la derecha: el bit que
 *     estaba en Q3 sale por la salida serie (impreso por Serial
 *     como SO=x) y se mete un 0 por Q0 (SHIFT_OUT).
 *
 *   PIPO (Parallel In, Parallel Out):
 *     Cada CLK copia el DIP completo a Q0..Q3 al instante, sin
 *     corrimiento: Q0=D0, Q1=D1, Q2=D2, Q3=D3.
 *
 *  Layout fisico de los LEDs (izquierda -> derecha):
 *     Q0  Q1  Q2  Q3
 *     ^entra el bit nuevo (SIPO)   ^extremo final / sale (PISO)
 *
 *  Pinout:
 *     LED Q0..Q3   -> D2, D3, D4, D5   (OUTPUT, con resistencia 220-330 ohm a GND)
 *     DIP D0..D3   -> D8, D9, D10, D11 (INPUT_PULLUP, ON/cerrado = 1)
 *     Boton CLK    -> D12 (INPUT_PULLUP, pulso de reloj)
 *     Boton CLR    -> D7  (INPUT_PULLUP, limpia registro y estado)
 *     Boton MODE   -> A0  (INPUT_PULLUP, cicla de modo)
 *
 *  Botones y DIP usan PULL-UP interno: presionado/ON = LOW = 1,
 *  suelto/OFF = HIGH = 0. No necesitan resistencia externa.
 *  Los LEDs SI necesitan su resistencia (220-330 ohm).
 * ============================================================
 */

// ---------- Pines ----------
const uint8_t LED_PINS[4] = {2, 3, 4, 5};   // Q0..Q3 (izq -> der)
const uint8_t DIP_PINS[4] = {8, 9, 10, 11}; // D0..D3
const uint8_t PIN_CLK  = 12;
const uint8_t PIN_CLR  = 7;
const uint8_t PIN_MODE = A0;

// ---------- Modos ----------
enum Modo : uint8_t { SIPO = 0, PISO = 1, PIPO = 2 };
const char *NOMBRE_MODO[3] = {"SIPO", "PISO", "PIPO"};

// ---------- Estado del registro ----------
bool reg[4] = {0, 0, 0, 0}; // reg[0]=Q0 (entrada) ... reg[3]=Q3 (final)
unsigned int ciclo = 0;     // contador de pulsos de reloj
Modo modo = SIPO;
bool pisoCargado = false;   // true tras el LOAD inicial de PISO

// ---------- Antirrebote (debounce) ----------
const unsigned long DEBOUNCE_MS = 40;

struct Boton {
  uint8_t pin;
  bool    estadoEstable;   // ultimo estado estable (HIGH = suelto)
  bool    ultimaLectura;   // ultima lectura cruda
  unsigned long tCambio;   // instante del ultimo cambio de lectura
};

Boton btnClk  = {PIN_CLK,  HIGH, HIGH, 0};
Boton btnClr  = {PIN_CLR,  HIGH, HIGH, 0};
Boton btnMode = {PIN_MODE, HIGH, HIGH, 0};

// Devuelve true UNA sola vez cuando el boton pasa de suelto a presionado
bool flancoPresion(Boton &b) {
  bool lectura = digitalRead(b.pin);

  if (lectura != b.ultimaLectura) {
    b.tCambio = millis();
    b.ultimaLectura = lectura;
  }

  bool evento = false;
  if ((millis() - b.tCambio) > DEBOUNCE_MS && lectura != b.estadoEstable) {
    b.estadoEstable = lectura;
    if (b.estadoEstable == LOW) evento = true;  // acaba de presionarse
  }
  return evento;
}

// Lee un bit del DIP switch (PULL-UP: ON/cerrado = LOW = 1)
bool leerDip(uint8_t indice) {
  return (digitalRead(DIP_PINS[indice]) == LOW) ? 1 : 0;
}

void imprimirEstado(const char *op, bool dIn, int serialOut); // prototipo (usado antes de su definicion)

// ---------- Logica del registro (coincide con step() de la simulacion) ----------
void limpiar() {
  for (int i = 0; i < 4; i++) reg[i] = 0;
  ciclo = 0;
  pisoCargado = false;
}

// Ejecuta un flanco de reloj segun el modo activo. Imprime el resultado.
void pulsoClk() {
  bool d0 = leerDip(0);

  switch (modo) {
    case SIPO: {
      // Corrimiento a la derecha metiendo D0 por Q0
      reg[3] = reg[2];
      reg[2] = reg[1];
      reg[1] = reg[0];
      reg[0] = d0;
      ciclo++;
      imprimirEstado("SHIFT", d0, -1);
      break;
    }
    case PISO: {
      if (!pisoCargado) {
        // Primer CLK = LOAD: copia el DIP completo, sin salida serie
        for (int i = 0; i < 4; i++) reg[i] = leerDip(i);
        pisoCargado = true;
        ciclo++;
        imprimirEstado("LOAD", 0, -1);
      } else {
        // CLK siguientes = SHIFT_OUT: sale reg[3], luego desplaza metiendo 0
        int salida = reg[3];
        reg[3] = reg[2];
        reg[2] = reg[1];
        reg[1] = reg[0];
        reg[0] = 0;
        ciclo++;
        imprimirEstado("SHIFT_OUT", 0, salida);
      }
      break;
    }
    case PIPO: {
      // Carga instantanea del DIP, sin corrimiento
      for (int i = 0; i < 4; i++) reg[i] = leerDip(i);
      ciclo++;
      imprimirEstado("PARALLEL", 0, -1);
      break;
    }
  }
}

void cambiarModo() {
  modo = static_cast<Modo>((modo + 1) % 3);
  limpiar();
  Serial.print(F(">> MODE: ahora en "));
  Serial.println(NOMBRE_MODO[modo]);
}

void actualizarLeds() {
  for (int i = 0; i < 4; i++) {
    digitalWrite(LED_PINS[i], reg[i] ? HIGH : LOW);
  }
}

void imprimirEstado(const char *op, bool dIn, int serialOut) {
  Serial.print(NOMBRE_MODO[modo]);
  Serial.print(F(" | ciclo "));
  if (ciclo < 10) Serial.print(' ');
  Serial.print(ciclo);
  Serial.print(F(" | "));
  Serial.print(op);
  Serial.print(F(" | DIP="));
  for (int i = 0; i < 4; i++) Serial.print(leerDip(i));
  Serial.print(F(" | dIn="));
  Serial.print(dIn);
  Serial.print(F(" | Q0Q1Q2Q3="));
  for (int i = 0; i < 4; i++) Serial.print(reg[i]);
  if (serialOut >= 0) {
    Serial.print(F(" | SO="));
    Serial.print(serialOut);
  }
  Serial.println();
}

// ---------- Setup ----------
void setup() {
  Serial.begin(9600);

  for (int i = 0; i < 4; i++) pinMode(LED_PINS[i], OUTPUT);
  for (int i = 0; i < 4; i++) pinMode(DIP_PINS[i], INPUT_PULLUP);
  pinMode(PIN_CLK,  INPUT_PULLUP);
  pinMode(PIN_CLR,  INPUT_PULLUP);
  pinMode(PIN_MODE, INPUT_PULLUP);

  actualizarLeds();
  Serial.println(F("=== Registro de Corrimiento 4 bits — SIPO/PISO/PIPO ==="));
  Serial.println(F("DIP D0..D3 = dato (ON=1, OFF=0) | CLK = pulso | CLR = limpiar | MODE = cambia de modo"));
  Serial.print(F("Modo inicial: "));
  Serial.println(NOMBRE_MODO[modo]);
  Serial.println();
}

// ---------- Loop ----------
void loop() {
  if (flancoPresion(btnClk)) {
    pulsoClk();
    actualizarLeds();
  }

  if (flancoPresion(btnClr)) {
    limpiar();
    actualizarLeds();
    Serial.println(F(">> CLR: registro limpio -> 0000"));
    Serial.println();
  }

  if (flancoPresion(btnMode)) {
    cambiarModo();
    actualizarLeds();
    Serial.println();
  }
}
