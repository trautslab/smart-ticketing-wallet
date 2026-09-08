# RFC-001: Motor Criptográfico de Smart Ticketing y Validación Perimetral Offline

- **Estado:** ACEPTADO / EN IMPLEMENTACIÓN
- **Fecha:** 2026-09-07
- **Inspiración:** Arquitectura de Quentro (`https://www.quentro.com/`) y Mitigación de Brechas de Reventa / Capturas de Pantalla
- **Autores:** TrautsLab / Equipo Core Smart Ticketing

---

## 1. Resumen Ejecutivo (Executive Summary)

El sistema de ticketing tradicional basado en códigos QR o de barras estáticos es intrínsecamente vulnerable al fraude, la clonación por capturas de pantalla (*screenshots*) y la reventa descontrolada en el mercado negro.

Este RFC especifica la arquitectura técnica de un **Motor de Smart Ticketing y Billetera Digital** que opera con:
1. **QR Dinámico Rotativo cada 15 Segundos (TOTP RFC 6238 con HMAC-SHA256):** Generado de forma 100% autónoma en el dispositivo móvil del asistente, sin requerir conexión celular ni Wi-Fi en el momento del acceso.
2. **Validación Perimetral Fuera de Línea (<80ms):** Los molinetes y escáneres del estadio verifican el hash criptográfico contra una réplica local pre-cargada con tolerancia de $\pm 1$ ventana ($\pm 15$s) ante desfases de reloj (*clock drift*).
3. **Protocolo P2P con Re-claveado Criptográfico Atómico:** La transferencia de un boleto revoca de inmediato la clave secreta (`qr_seed`) del emisor y emite una nueva semilla criptográfica para el receptor, imposibilitando el uso de capturas o secretos clonados.
4. **Malla de Sincronización Local (Mesh Sync):** Notificación de boletos utilizados (`USED`) entre puertas adyacentes mediante UDP broadcast/multicast en la red privada de área local del recinto, evitando que un mismo boleto se use en dos torniquetes al mismo segundo sin conexión a Internet.

---

## 2. Arquitectura Criptográfica y Algoritmos

### 2.1 Algoritmo TOTP (RFC 6238 Adaptado a 15 Segundos)

Dado un tiempo actual $T$ en milisegundos UTC y un paso de tiempo $\Delta t = 15$ segundos (15,000 ms):
$$C = \lfloor \frac{T}{15000} \rfloor$$

Donde $C$ es el contador de pasos de 64 bits representado en big-endian (8 bytes).

La función de autenticación utiliza HMAC-SHA256:
$$\text{HMAC} = \text{HMAC-SHA256}(K, C)$$

Donde $K$ es la semilla secreta (`qr_seed`) de 32 bytes (256 bits) en codificación Base32 o Hex, provisionada de forma segura al autorizar el boleto.

Para obtener un código compacto de alta densidad que garantice una lectura óptica sub-50ms en pantallas de smartphone:
1. Extraer los últimos 4 bits del último byte del HMAC como offset: $\text{offset} = \text{HMAC}[31] \ \& \ 0x0F$.
2. Extraer 4 bytes a partir del offset:
   $$\text{binary} = ((\text{HMAC}[\text{offset}] \ \& \ 0x7F) \ll 24) \ | \ ((\text{HMAC}[\text{offset}+1]) \ll 16) \ | \ ((\text{HMAC}[\text{offset}+2]) \ll 8) \ | \ (\text{HMAC}[\text{offset}+3])$$
3. Generar el token truncado decimal de 6 a 8 dígitos:
   $$\text{Code} = \text{binary} \pmod{10^8}$$
4. Adicionalmente, se incluye un MAC corto de 12 caracteres hexadecimales para verificación perimetral estricta.

### 2.2 Estructura del Payload del Código QR

Para minimizar la densidad de módulos en el código QR y optimizar el tiempo de escaneo por cámara de torniquete, el payload se estructura como:
```
STK:<ticket_id>:<counter_hex>:<auth_mac>
```
Ejemplo:
```
STK:TKT-98234-A:00000000032b4f10:9f8a3c2e1b4d
```

### 2.3 Ventana de Tolerancia y Prevención de Desfase de Reloj

El validador de torniquete calcula el hash para tres ventanas:
- $C - 1$ (Ventana anterior: $t - 15s$)
- $C$ (Ventana actual)
- $C + 1$ (Ventana posterior: $t + 15s$)

Si el hash recibido coincide con cualquiera de las tres ventanas y el boleto no ha sido marcado como `USED`, el acceso es concedido (`ACCESS_GRANTED`).

---

## 3. Protocolo P2P de Transferencia Criptográfica

```
[Usuario A - Emisor]       [Servidor / Bóveda]        [Usuario B - Receptor]
       |                            |                           |
       |--- Solicitar Transfer ---->|                           |
       |    (ticketId, emailB)      |                           |
       |                            |--- Validar Reglas ------->|
       |                            |    (Límite transfer,      |
       |                            |     Lock window, etc)     |
       |                            |                           |
       |<-- Invalidar Semilla ------|                           |
       |    Status: REVOKED         |                           |
       |                            |--- Provisionar Semilla -->|
       |                            |    Nueva Seed B           |
       |                            |    Status: ACTIVE         |
```

---

## 4. Gobernanza Anti-Revendedores (Anti-Scalping Rules)

1. **MaxTransfersPerTicket:** Límite máximo de 2 traspasos por boleto.
2. **TransferLockWindowSeconds:** Bloqueo de transferencias 2 horas (7,200 segundos) antes de la apertura de puertas del evento.
3. **FaceValueCapping:** Prohibición de traspasos con sobreprecio dentro de la plataforma.
4. **AuditLedger:** Registro inmutable de cada cambio de titular con hash criptográfico del titular anterior y nuevo.
