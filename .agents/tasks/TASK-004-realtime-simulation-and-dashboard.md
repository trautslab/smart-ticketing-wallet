# TASK-004: Consola de Simulación CLI en Tiempo Real y Dashboard de Observabilidad Web

**Estado:** COMPLETED  
**Prioridad:** MEDIA  
**Componente:** `scripts/demo-live.ts`, `observability/index.html`, `scripts/serve-dashboard.ts`  

---

## 🎯 Objetivo
Proveer una experiencia interactiva completa tanto en terminal (CLI con cuenta regresiva dinámica de 15s y benchmarks de latencia de escaneo) como en interfaz web (Dashboard visual con emulación de Smartphone de usuario, escáner de torniquete de estadio y panel de auditoría de red).

## 📋 Criterios de Aceptación
1. **CLI Live Demo (`scripts/demo-live.ts`):**
   - Ejecutable con `npm run demo:live`.
   - Generación en vivo con visualización de cuenta regresiva en segundos (15s a 0s).
   - Generación de QR Payload dinámico en cada paso de tiempo.
   - Simulación de escaneo con medición de latencia exacta (<80ms).
   - Simulación de ataque de replay (segundo escaneo inmediato) mostrando el rechazo.
2. **Dashboard de Observabilidad Web:**
   - Servidor HTTP ligero nativo en TypeScript/Node (`scripts/serve-dashboard.ts`) corriendo en el puerto 3300.
   - Vista móvil con billetera de tickets, QR dinámico con animación circular SVG de cuenta regresiva de 15s.
   - Vista de estación de control de accesos con escáner interactivo instantáneo y telemetría de eventos.
   - Panel de control para transferencias P2P y monitor de estado de tickets.
3. **Tests / Evals:** Verificación de ejecución del servidor y consistencia de datos en el dashboard.

---

## 🔗 Trazabilidad AI-SDLC
- **Requisito / Caso de Uso:** `UC-004` (Observabilidad y Simulación en Vivo)
- **Evaluación Automatizada:** `evals/tasks/task-004.json`
