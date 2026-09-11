/*
 * ============================================================
 *  Registro de Corrimiento SIPO (Serial In - Parallel Out)
 *  8 bits, simulado con Arduino UNO
 * ============================================================
 *
 *  Diferencia con el SISO:
 *   - En SISO solo importaba el bit que salia por el ultimo
 *     flip-flop (salida serie, un bit por pulso).
 *   - En SIPO la salida son los 8 flip-flops leidos AL MISMO
 *     tiempo (salida paralela). Por eso vemos los 8 LEDs juntos
 *     como el "resultado".
 *
 *  Entradas:
 *   - DATO  -> viene de UNA posicion de un DIP switch.
 *              ON (cerrado)  = 1
 *              OFF (abierto) = 0
 *   - CLK   -> boton. Cada pulsacion = un flanco de reloj:
 *              lee el DATO del DIP y desplaza el registro.
 *   - CLR   -> boton. Pone todo el registro en 0 (limpieza).
 *
 *  Corrimiento a la derecha en cada pulso de CLK:
 *     Q7<-Q6, Q6<-Q5, ... , Q1<-Q0, Q0<-DATO
 *
 *  Layout fisico de los LEDs (izquierda -> derecha):
 *     Q0  Q1  Q2  Q3  Q4  Q5  Q6  Q7
 *     ^entra el bit nuevo         ^extremo final de la cadena
 *
 *  Botones y DIP usan PULL-UP interno: no necesitan resistencia
 *  externa. presionado/ON = LOW, suelto/OFF = HIGH.
 *  Los LEDs SI necesitan su resistencia (220-330 ohm).
 * ============================================================
 */

// ---------- Pines ----------
const uint8_t LED_PINS[8] = {2, 3, 4, 5, 6, 7, 8, 9}; // Q0..Q7 (izq -> der)
const uint8_t PIN_DATO = 12;   // DIP switch: bit a inyectar
const uint8_t PIN_CLK  = 10;   // boton: pulso de reloj
const uint8_t PIN_CLR  = 11;   // boton: limpiar registro

// ---------- Estado del registro ----------
bool reg[8] = {0, 0, 0, 0, 0, 0, 0, 0}; // reg[0]=Q0 (entrada) ... reg[7]=Q7 (final)
unsigned int ciclo = 0;                 // contador de pulsos de reloj

// ---------- Antirrebote (debounce) ----------
const unsigned long DEBOUNCE_MS = 40;

struct Boton {
  uint8_t pin;
  bool    estadoEstable;   // ultimo estado estable (HIGH = suelto)
  bool    ultimaLectura;   // ultima lectura cruda
  unsigned long tCambio;   // instante del ultimo cambio de lectura
};

Boton btnClk = {PIN_CLK, HIGH, HIGH, 0};
Boton btnClr = {PIN_CLR, HIGH, HIGH, 0};

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

// Lee el bit del DIP switch (PULL-UP: ON/cerrado = LOW = 1)
bool leerDato() {
  return (digitalRead(PIN_DATO) == LOW) ? 1 : 0;
}

// ---------- Logica del registro ----------
void desplazar(bool bitEntrada) {
  // Corrimiento a la derecha: Q7<-Q6, ... , Q1<-Q0, Q0<-bitEntrada
  for (int i = 7; i > 0; i--) {
    reg[i] = reg[i - 1];
  }
  reg[0] = bitEntrada;
}

void limpiar() {
  for (int i = 0; i < 8; i++) reg[i] = 0;
  ciclo = 0;
}

void actualizarLeds() {
  for (int i = 0; i < 8; i++) {
    digitalWrite(LED_PINS[i], reg[i] ? HIGH : LOW);
  }
}

void imprimirEstado(char bitEntrada) {
  Serial.print("CLK ");
  if (ciclo < 10) Serial.print(' ');
  Serial.print(ciclo);
  Serial.print(" | in=");
  Serial.print(bitEntrada);
  Serial.print(" | ");
  for (int i = 0; i < 8; i++) {
    Serial.print('Q');
    Serial.print(i);
    Serial.print('=');
    Serial.print(reg[i]);
    Serial.print(' ');
  }
  Serial.print("| paralelo(Q0..Q7)=");
  for (int i = 0; i < 8; i++) Serial.print(reg[i]);
  Serial.println();
}

// ---------- Setup ----------
void setup() {
  Serial.begin(9600);

  for (int i = 0; i < 8; i++) pinMode(LED_PINS[i], OUTPUT);
  pinMode(PIN_DATO, INPUT_PULLUP);
  pinMode(PIN_CLK,  INPUT_PULLUP);
  pinMode(PIN_CLR,  INPUT_PULLUP);

  actualizarLeds();
  Serial.println(F("=== Registro SIPO 8 bits listo ==="));
  Serial.println(F("DIP = dato (ON=1, OFF=0) | CLK = pulso | CLR = limpiar"));
  Serial.println(F("Estado inicial: Q0..Q7 = 0000 0000"));
  Serial.println();
}

// ---------- Loop ----------
void loop() {
  if (flancoPresion(btnClk)) {
    bool d = leerDato();
    desplazar(d);
    ciclo++;
    actualizarLeds();
    imprimirEstado(d ? '1' : '0');
  }

  if (flancoPresion(btnClr)) {
    limpiar();
    actualizarLeds();
    Serial.println(F(">> CLR: registro limpio -> 0000 0000"));
    Serial.println();
  }
}
