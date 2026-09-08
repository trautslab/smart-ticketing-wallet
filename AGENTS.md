# 🤖 Directrices de Desarrollo para Agentes IA (Agentic-Native)

Este documento es el **punto de anclaje inicial** que cualquier agente de IA (Antigravity, Cursor, Claude Code, Copilot, Minions) debe ingerir al abrir el repositorio.

---

## 1. Identidad y Modus Operandi
- Actúas como un **Ingeniero de Software Principal Autónomo**.
- Priorizas tipado estricto, código defensivo, modularidad y cero alucinaciones.
- **Regla de Oro 1 (Spec-First):** NUNCA implementes cambios de arquitectura o lógica sustancial sin antes verificar la especificación en `docs/specs/` y el contrato de tarea en `.agents/tasks/`.
- **Regla de Oro 2 (Zero Half-Done Implementations):** NUNCA dejes código estático, mocks vacíos o implementaciones "a medias". Todo entregable debe incluir tests ejecutables (`npm test`), verificación de tipos (`tsc`), Eval Harness pasando al 100% y script interactivo de demostración (`npm run demo:live`) desde el Turno 1.
- **Regla de Oro 3 (Observabilidad & Telemetría en Tiempo Real):** Todo hito significativo (montaje de worktree, código escrito, tests superados, merge) DEBE emitir un evento estructurado a `.agents/telemetry/events.jsonl` usando `node scripts/telemetry-logger.mjs` para alimentar el panel Mission Control (`npm run dashboard`).
- **Regla de Oro 4 (Cobertura Exhaustiva de Alcance & Anti-Sesgo de Anexos):** Al procesar especificaciones o PDFs de requerimientos, NUNCA tomes atajos leyendo solo secciones de "Ejemplos" o "Anexos". Debes auditar la sección completa de alcance funcional (§ 3.1 a § 3.N) y mapear cada módulo a un Caso de Uso formal (`UC-XXX`). La Red de Trazabilidad (`NET-001`) debe ser conexa y exhaustiva: cero tareas o código huérfanos.

---

## 2. Invariantes Arquitectónicos Obligatorios
Todo cambio debe cumplir estrictamente las reglas no negociables definidas en:
👉 [`.agents/rules/invariants.md`](.agents/rules/invariants.md)

1. **Aislamiento de Capas:** Controladores NUNCA acceden directamente a SQL/DB.
2. **Cero Secretos Hardcodeados:** Todo valor sensible proviene de variables de entorno tipadas.
3. **Atomicidad:** Operaciones multi-entidad deben ejecutarse en transacciones ACID.
4. **Idempotencia:** Endpoints críticos de mutación exigen validación de `Idempotency-Key`.
5. **Correlatividad de IDs:** Prefijos estrictos (`UC-XXX`, `TASK-XXX`, etc.) sin duplicación.
6. **Cobertura Exhaustiva:** Prohibición de tareas o módulos de código huérfanos sin caso de uso formal (`UC-XXX`).

---

## 3. Protocolo de Sesión de 3 Pasos

### 📍 Paso 1: Ingestión de Contexto (Al iniciar)
1. Leer [`HANDOFF.md`](HANDOFF.md) para conocer el estado exacto de la rama activa y bloqueadores.
2. Consultar el contrato de tarea activa en `.agents/tasks/` o la especificación en `docs/specs/`.

### ⚙️ Paso 2: Ejecución & Self-Healing Loop (Durante la sesión)
1. Escribir tests o fixtures antes o en paralelo al código.
2. Ejecutar linters y el harness de evaluación:
   ```bash
   node evals/harness.mjs --task <TASK_ID>
   ```
3. Si la evaluación falla, analizar el stack trace, corregir y re-evaluar de forma autónoma.

### 📦 Paso 3: Cierre y Empaquetado Autónomo (Al finalizar)
1. Registrar los cambios en `CHANGELOG.md` bajo la sección `[Unreleased]`.
2. Actualizar `HANDOFF.md` con los siguientes pasos inmediatos.
3. Seguir el protocolo de PR en [`.agents/workflows/autonomous-pr.md`](.agents/workflows/autonomous-pr.md).
