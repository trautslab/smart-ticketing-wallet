# TASK-002: Motor de Validación 100% Offline para Torniquetes y Accesos

**Estado:** COMPLETED  
**Prioridad:** CRÍTICA  
**Componente:** `src/core/turnstile-validator.ts`, `src/core/mesh-sync.ts`  

---

## 🎯 Objetivo
Implementar el motor de escaneo y validación perimetral fuera de línea para escáneres de staff y torniquetes de estadios, permitiendo validar entradas en menos de 80 milisegundos sin conectividad a Internet.

## 📋 Criterios de Aceptación
1. **Validación Matemática Local:** Verificar el hash TOTP contra la base de datos pre-sincronizada de tickets sin emitir peticiones a la nube.
2. **Tolerancia a la Deriva de Reloj (Time Drift):** Algoritmo con ventana de tolerancia de $\pm 1$ paso ($\pm 15$ segundos) para absorber discrepancias de reloj en smartphones.
3. **Prevención de Doble Uso (Replay Attack):** Marcar de inmediato el ticket como `USED` en la memoria local y rechazar escaneos subsiguientes con código `ALREADY_USED`.
4. **Sincronización Local Mesh (Simulada):** Emisión y recepción de eventos broadcast por red local privada (LAN) para sincronizar estado entre múltiples puertas sin salir a Internet.
5. **Tests Automatizados:** Pruebas unitarias de validación exitosa, códigos expirados, tickets desconocidos y prevención de doble ingreso.

---

## 🔗 Trazabilidad AI-SDLC
- **Requisito / Caso de Uso:** `UC-002` (Validación Offline en Puerta)
- **Diagrama de Secuencia:** `SEQ-002`
- **Evaluación Automatizada:** `evals/tasks/task-002.json`
