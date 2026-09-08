# UC-001: Generación de QR Dinámico y Validación Perimetral Offline

- **ID:** `UC-001`
- **Dominio:** Smart Ticketing / Control de Accesos
- **Actores:** Asistente (Usuario Móvil), Operador de Acceso / Torniquete Automático, Bóveda de Tickets
- **Precondición:** El usuario tiene la entrada aprovisionada en su billetera local con su semilla secreta (`qr_seed`).

---

## 1. Flujo Principal (Happy Path)

1. El Asistente abre su aplicación Smart Ticketing Wallet.
2. La billetera detecta la hora actual del sistema y el paso de 15 segundos.
3. El motor `TotpEngine` calcula el token HMAC-SHA256 con la semilla local del boleto sin realizar ninguna conexión de red (100% offline).
4. La billetera renderiza el código QR y una barra de progreso circular descendente que indica los segundos restantes (15s a 0s).
5. El Asistente presenta el QR frente a la cámara óptica del torniquete del estadio.
6. El escáner lee el payload `STK:<ticketId>:<counter>:<mac>` en menos de 30ms.
7. El motor `TurnstileValidator` busca el ticket en su réplica local en memoria / SQLite:
   - Verifica que el estado sea `ACTIVE`.
   - Calcula el MAC esperado para la ventana $C \pm 1$.
   - Confirma coincidencia criptográfica.
8. El validador marca el ticket como `USED` de manera atómica con timestamp local.
9. El torniquete abre la compuerta física e ilumina luz verde en pantalla en menos de 80ms en total.
10. El validador emite un broadcast UDP Mesh a los demás torniquetes del estadio para replicar el uso.

---

## 2. Flujos Alternativos y Excepciones

### 2.1 Replay Attack / Captura de Pantalla Clonada
- **Condición:** Un usuario intenta ingresar con una captura de pantalla enviada por WhatsApp que ya expiró (>15s) o que ya fue escaneada por el titular real.
- **Resultado:**
  - Si el token expiró: El validador responde `EXPIRED_CODE` en <20ms y enciende luz roja.
  - Si el token era de la ventana pero ya fue usado: El validador detecta `USED` y responde `ALREADY_USED` con alerta de seguridad.

### 2.2 Desfase de Reloj de Smartphone ($\pm 10$s)
- **Condición:** El reloj del smartphone del asistente tiene un desfase de 10 segundos respecto a la hora oficial de los torniquetes.
- **Resultado:** El validador evalúa la ventana adyacente $C - 1$ o $C + 1$, valida el hash satisfactoriamente y concede el acceso.
