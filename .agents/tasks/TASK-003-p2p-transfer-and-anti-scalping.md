# TASK-003: Protocolo P2P de Transferencia Criptográfica y Gobernanza Anti-Revendedores

**Estado:** COMPLETED  
**Prioridad:** ALTA  
**Componente:** `src/core/transfer-service.ts`, `src/types/index.ts`  

---

## 🎯 Objetivo
Implementar el protocolo seguro de transferencia entre pares (Peer-to-Peer) con re-claveado criptográfico atómico (invalidación inmediata de la semilla del emisor y provisión de nueva semilla al receptor), garantizando la total eliminación de capturas de pantalla compartidas y aplicando reglas estrictas anti-reventa.

## 📋 Criterios de Aceptación
1. **Re-claveado Criptográfico Atómico:** La transferencia debe invalidar la semilla `qr_seed` del titular original en el acto y generar un nuevo secreto criptográfico vinculado al ID del nuevo propietario.
2. **Políticas Anti-Revendedores:**
   - Límite máximo de transferencias por boleto (configurable, defecto: 2).
   - Bloqueo de transferencia por proximidad al evento (*Transfer Lock Window*, e.g., 2 horas antes de apertura).
   - Verificación de precio tope (tope al valor facial / no reventa inflada).
3. **Pistas de Auditoría Inmutables:** Registro de cada transferencia con emisor, receptor, timestamp, hash anterior e id de transacción.
4. **Rechazo de Transferencias Inválidas:** Validar y rechazar boletos ya utilizados (`USED`), boletos bloqueados (`LOCKED`), o solicitudes que violen la ventana de transferencias.
5. **Tests Automatizados:** Pruebas unitarias de flujo feliz de transferencia, re-claveado, rechazo por boleto usado, y violación de límite máximo.

---

## 🔗 Trazabilidad AI-SDLC
- **Requisito / Caso de Uso:** `UC-003` (Transferencia P2P Segura y Anti-Reventa)
- **Diagrama de Secuencia:** `SEQ-003`
- **Evaluación Automatizada:** `evals/tasks/task-003.json`
