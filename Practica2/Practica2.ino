/*
 * ============================================================
 *  Registro de Corrimiento 4 bits - 3 modos
 *  SIPO / PISO / PIPO simulados con Arduino UNO
 * ============================================================
 *  FIX: todos los tipos (enum, struct) declarados ANTES de la
 *  primera funcion, para que el auto-prototipado de Arduino no
 *  falle. CLR movido de pin 13 -> pin 7 (evita choque con el
 *  LED integrado del pin 13).
 * ============================================================
 */

// ---------- Pines ----------
const uint8_t LED_PINS[4] = {2, 3, 4, 5};      // Q0..Q3 (izq -> der)
const uint8_t DIP_PINS[4] = {8, 9, 10, 11};    // D0..D3
const uint8_t PIN_CLK  = 12;
const uint8_t PIN_CLR  = 7;                     // <-- movido de 13 a 7
const uint8_t PIN_MODE = A0;

// ---------- Tipos (SIEMPRE antes de cualquier funcion) ----------
enum Modo : uint8_t { SIPO = 0, PISO = 1, PIPO = 2 };

const unsigned long DEBOUNCE_MS = 40;

struct Boton {
  uint8_t pin;
  bool    estadoEstable;
  bool    ultimaLectura;
  unsigned long tCambio;
};

// ---------- Estado global ----------
Modo modo = SIPO;

bool reg[4] = {0, 0, 0, 0};   // reg[0]=Q0 ... reg[3]=Q3
unsigned int ciclo = 0;
bool pisoCargado = false;     // PISO: false=proximo CLK carga, true=desplaza

Boton btnClk  = {PIN_CLK,  HIGH, HIGH, 0};
Boton btnClr  = {PIN_CLR,  HIGH, HIGH, 0};
Boton btnMode = {PIN_MODE, HIGH, HIGH, 0};

// ---------- Utilidades ----------
const char* nombreModo(Modo m) {
  switch (m) { case SIPO: return "SIPO"; case PISO: return "PISO"; default: return "PIPO"; }
}

bool flancoPresion(Boton &b) {
  bool lectura = digitalRead(b.pin);
  if (lectura != b.ultimaLectura) {
    b.tCambio = millis();
    b.ultimaLectura = lectura;
  }
  bool evento = false;
  if ((millis() - b.tCambio) > DEBOUNCE_MS && lectura != b.estadoEstable) {
    b.estadoEstable = lectura;
    if (b.estadoEstable == LOW) evento = true;
  }
  return evento;
}

bool leerBitDip(uint8_t i) {
  return (digitalRead(DIP_PINS[i]) == LOW) ? 1 : 0;
}

void leerDipParalelo(bool destino[4]) {
  for (int i = 0; i < 4; i++) destino[i] = leerBitDip(i);
}

// ---------- Operaciones ----------
void limpiar() {
  for (int i = 0; i < 4; i++) reg[i] = 0;
  ciclo = 0;
  pisoCargado = false;
}

void desplazarDerecha(bool bitEntrada) {
  for (int i = 3; i > 0; i--) reg[i] = reg[i - 1];
  reg[0] = bitEntrada;
}

void cargarParalelo() {
  leerDipParalelo(reg);
}

void actualizarLeds() {
  for (int i = 0; i < 4; i++) digitalWrite(LED_PINS[i], reg[i] ? HIGH : LOW);
}

// ---------- Impresion ----------
void imprimirRegistro() {
  Serial.print("Q0..Q3=");
  for (int i = 0; i < 4; i++) Serial.print(reg[i]);
}

void imprimirDip() {
  Serial.print("DIP(D0..D3)=");
  for (int i = 0; i < 4; i++) Serial.print(leerBitDip(i));
}

void imprimirCabecera() {
  Serial.println();
  Serial.print(F("=== MODO: "));
  Serial.print(nombreModo(modo));
  Serial.println(F(" ==="));
  switch (modo) {
    case SIPO:
      Serial.println(F("CLK: mete D0 del DIP en Q0 y desplaza a la derecha."));
      break;
    case PISO:
      Serial.println(F("1er CLK: LOAD (DIP -> registro)."));
      Serial.println(F("Siguientes CLK: desplaza der; sale bit por Q3 (Serial)."));
      break;
    case PIPO:
      Serial.println(F("CLK: LOAD paralelo (DIP -> registro). Los 4 LEDs = DIP."));
      break;
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
  Serial.println(F("=== Registro 4 bits SIPO/PISO/PIPO listo ==="));
  Serial.println(F("MODE=cambia modo | CLK=pulso reloj | CLR=limpia"));
  imprimirCabecera();
}

// ---------- Loop ----------
void loop() {
  if (flancoPresion(btnMode)) {
    modo = (Modo)((modo + 1) % 3);
    limpiar();
    actualizarLeds();
    imprimirCabecera();
  }

  if (flancoPresion(btnClk)) {
    ciclo++;
    switch (modo) {
      case SIPO: {
        bool d = leerBitDip(0);
        desplazarDerecha(d);
        actualizarLeds();
        Serial.print("CLK "); Serial.print(ciclo);
        Serial.print(" | in="); Serial.print(d);
        Serial.print(" | "); imprimirRegistro();
        Serial.println();
        break;
      }
      case PISO: {
        if (!pisoCargado) {
          cargarParalelo();
          pisoCargado = true;
          actualizarLeds();
          Serial.print("CLK "); Serial.print(ciclo);
          Serial.print(" | LOAD | "); imprimirDip();
          Serial.print(" -> "); imprimirRegistro();
          Serial.println();
        } else {
          bool salida = reg[3];
          desplazarDerecha(0);
          actualizarLeds();
          Serial.print("CLK "); Serial.print(ciclo);
          Serial.print(" | SHIFT | salida_serie=");
          Serial.print(salida);
          Serial.print(" | "); imprimirRegistro();
          Serial.println();
        }
        break;
      }
      case PIPO: {
        cargarParalelo();
        actualizarLeds();
        Serial.print("CLK "); Serial.print(ciclo);
        Serial.print(" | LOAD | "); imprimirDip();
        Serial.print(" -> "); imprimirRegistro();
        Serial.println();
        break;
      }
    }
  }

  if (flancoPresion(btnClr)) {
    limpiar();
    actualizarLeds();
    Serial.println(F(">> CLR: registro limpio (0000)"));
  }
}