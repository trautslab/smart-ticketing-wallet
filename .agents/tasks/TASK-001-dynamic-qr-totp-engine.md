# TASK-001: Motor Criptográfico de QR Dinámico (TOTP RFC 6238 - 15 Segundos)

**Estado:** COMPLETED  
**Prioridad:** CRÍTICA  
**Componente:** `src/core/totp-engine.ts`, `src/core/qr-payload.ts`, `src/core/ticket-vault.ts`  

---

## 🎯 Objetivo
Implementar el motor central de Smart Tickets para generar códigos QR dinámicos que roten automáticamente cada 15 segundos ($\Delta t = 15s$) en el dispositivo cliente, funcionando 100% fuera de línea sin requerir conexión celular ni Wi-Fi.

## 📋 Criterios de Aceptación
1. **Algoritmo TOTP Estándar:** Implementar RFC 6238 con HMAC-SHA256 y paso de tiempo parametrizable a 15 segundos.
2. **Generación Local Autónoma:** El cálculo debe ejecutarse utilizando únicamente la semilla criptográfica local (`qr_seed`) y el reloj interno del dispositivo.
3. **Payload Compacto:** Formatear el payload del QR en formato comprimido `<ticketId>.<counterHex>.<truncatedHash>` para garantizar lectura óptica instantánea (<50ms).
4. **Bóveda de Semillas Seguras:** Clase `TicketVault` para aprovisionar, persistir y recuperar tickets y semillas criptográficas.
5. **Tests Automatizados:** Cobertura unitaria validando rotación precisa cada 15s, unicidad de hashes y detección de expiración.

---

## 🔗 Trazabilidad AI-SDLC
- **Requisito / Caso de Uso:** `UC-001` (Generación de QR Dinámico Local)
- **Diagrama de Secuencia:** `SEQ-001`
- **Evaluación Automatizada:** `evals/tasks/task-001.json`
