# 📋 Registro Central de Tareas (Task Correlative Registry)

Este archivo es la **fuente única de verdad** para la asignación de identificadores correlativos `TASK-XXX`.

> ⚠️ **INVARIANTE DE CORRELATIVOS:** Ningún agente de IA puede crear un archivo en `.agents/tasks/` sin consultar este índice, verificar el último correlativo usado y registrar aquí la nueva tarea antes de iniciar.

---

## 📊 Matriz de Asignación de Tareas

| ID Correlativo | Título de la Tarea | Módulo Afectado | Prioridad | Estado | Rama Git |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `TASK-001` | Motor Criptográfico de QR Dinámico (TOTP RFC 6238 - 15s) | `src/core/totp-engine.ts`, `src/core/qr-payload.ts`, `src/core/ticket-vault.ts` | CRITICAL | `COMPLETED` | `feat/task-001-totp-engine` |
| `TASK-002` | Motor de Validación 100% Offline para Torniquetes y Accesos | `src/core/turnstile-validator.ts`, `src/core/mesh-sync.ts` | CRITICAL | `COMPLETED` | `feat/task-002-turnstile-validator` |
| `TASK-003` | Protocolo P2P de Transferencia Criptográfica y Anti-Revendedores | `src/core/transfer-service.ts`, `src/types/index.ts` | HIGH | `COMPLETED` | `feat/task-003-p2p-transfer` |
| `TASK-004` | Consola de Simulación CLI en Vivo y Dashboard de Observabilidad Web | `scripts/demo-live.ts`, `observability/index.html`, `scripts/serve-dashboard.ts` | MEDIUM | `COMPLETED` | `feat/task-004-simulation-dashboard` |

---

## 🔒 Próximo Correlativo Disponible: `TASK-005`
Cualquier nuevo requerimiento debe reclamar estrictamente el siguiente correlativo secuencial disponible.
