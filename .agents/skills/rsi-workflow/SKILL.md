---
name: rsi-workflow
description: Protocolo general de ejecución autónoma agéntica en bucle cerrado (Ingestión -> Git Worktree -> Riel Duro -> Fast-Forward Merge).
---

# 🤖 Protocolo Maestro de Ejecución Autónoma (RSI Workflow Skill)

Este skill define el procedimiento estándar para cualquier agente o subagente que ejecute tareas de desarrollo dentro del marco **AI-SDLC**.

---

## 📋 Pasos del Flujo de Ejecución

### 1. Ingestión de Tarea y Lectura de Invariantes
- Lee el contrato de tarea asignado en `.agents/tasks/TASK-XXX.md`.
- Revisa las reglas inviolables en `.agents/rules/invariants.md`.
- Emite evento de telemetría:
  ```bash
  node scripts/telemetry-logger.mjs --agent $AGENT_ID --task $TASK_ID --phase INGESTION --event TASK_INGESTED --msg "Iniciando tarea $TASK_ID"
  ```

### 2. Aislamiento Físico en Git Worktree
- Si operas como subagente paralelo, crea y trabaja exclusivamente en tu Git Worktree aislado:
  ```bash
  git worktree add -b feat/$TASK_ID .worktrees/$AGENT_ID main
  ```
- No modifiques archivos de otros módulos o fuera de tu árbol asignado en `CMP-001`.

### 3. Implementación de Código y Tests BDD
- Escribe el código en `src/` aplicando Inyección de Dependencias.
- Escribe las pruebas unitarias y de integración en `tests/` o `src/**/*.test.mjs`.

### 4. Verificación del Riel Duro Determinista
- Antes de solicitar cualquier merge o emitir PR, ejecuta los Quality Gates:
  ```bash
  npm run precommit:audit
  ```
- Si algún gate falla (TypeScript, linter de arquitectura, o tests), entra en **Bucle de Reflexion**: analiza la salida de la terminal y auto-corrige el código hasta obtener `exit code 0`.

### 5. Fast-Forward Merge y Liberación de Worktree
- Fusiona tu rama a `main` sin conflictos.
- Limpia el worktree:
  ```bash
  git worktree remove --force .worktrees/$AGENT_ID
  ```
- Emite evento de telemetría de finalización (`TASK_COMPLETED`).
