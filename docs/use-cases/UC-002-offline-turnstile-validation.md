# UC-002: Validación Perimetral Fuera de Línea en Torniquetes y Accesos

- **ID:** `UC-002`
- **Dominio:** Control de Accesos Perimetrales / Operación de Estadio
- **Actores:** Asistente, Escáner de Torniquete / Personal de Puerta, Bóveda Local en Memoria/SQLite
- **Precondición:** El torniquete tiene pre-cargada la base de datos de boletos del evento y opera sin conexión a Internet.

---

## 1. Flujo Principal (Happy Path)

1. El Asistente presenta su smartphone con el QR dinámico rotativo en la cámara óptica del torniquete.
2. El lector óptico captura la cadena `STK:<ticketId>:<counterHex>:<authMac>` en <30ms.
3. El motor `TurnstileValidator` busca el `ticketId` en la base de datos local.
4. El validador comprueba que el estado del boleto sea `ACTIVE`.
5. Se calcula la función HMAC-SHA256 con la semilla local `seedHex` para la ventana de tiempo actual ($\pm 1$ paso de 15 segundos).
6. El hash coincide con la ventana $0$.
7. El torniquete marca de forma atómica el boleto como `USED`, registrando `usedAt` y `usedGateId`.
8. El sistema físico desbloquea la compuerta de acceso y enciende luz verde (`ACCESS_GRANTED`).
9. Latencia total del proceso: inferior a 80 milisegundos (típicamente 1 a 3 ms).
10. El nodo de torniquete emite un broadcast UDP Mesh por la red LAN del estadio hacia los demás torniquetes.

---

## 2. Flujos Alternativos y Excepciones

### 2.1 Replay Attack / Captura Duplicada
- **Condición:** Se presenta un código QR de un boleto que ya fue registrado como `USED`.
- **Acción:** El validador deniega el paso con código `ALREADY_USED`, mantiene bloqueado el torniquete, enciende luz roja y activa alarma perimetral.

### 2.2 Desfase de Reloj de Smartphone ($\pm 15$s)
- **Condición:** El reloj del smartphone del usuario tiene una diferencia de hasta 15 segundos con respecto al torniquete.
- **Acción:** El validador evalúa la ventana adyacente (offset $-1$ o $+1$). Si coincide, autoriza el acceso normalmente.
