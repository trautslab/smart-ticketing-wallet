# ⏱️ [GANTT-XXXX] Cronograma Dinámico de Ejecución Humano-IA & Protocolo de Rollback

| Campo | Valor / Descripción |
| :--- | :--- |
| **Identificador:** | `GANTT-XXXX` (Formato `GANTT-XXXX`, inmutable y secuencial) |
| **Objetivo:** | Mapeo temporal de responsabilidades (Agente IA vs. Tech Lead vs. Product Owner) y auditoría de checkpoints |
| **Audiencia:** | Tech Leads, Project Managers, Product Owners y Subagentes IA |
| **Fuente de Eventos:** | Telemetría en tiempo real (`.agents/telemetry/events.jsonl`) |
| **Red de Trazabilidad:** | [`NET-XXXX`](../use-case-network/NET-TEMPLATE.md) |

---

## 1. Propósito del Cronograma Humano-IA

En un ciclo **AI-SDLC**, el trabajo se distribuye entre la **cognición estocástica del LLM** y la **gobernanza humana / determinista**:
1. **El Agente IA** acelera las tareas intensivas en código (scaffolding, tests BDD, implementación de endpoints, optimizaciones de rendimiento y fuzzing).
2. **El Tech Lead** define los invariantes duros, audita el código generado y resuelve bifurcaciones o alucinaciones.
3. **El Product Owner** valida la aceptación funcional en `UAT` y autoriza el despliegue a `PROD`.

---

## 2. Diagrama de Gantt de Ejecución (Mermaid)

```mermaid
gantt
    title Cronograma de Ejecución AI-SDLC: ShopFast E-Commerce (Sprints 1 & 2)
    dateFormat YYYY-MM-DD
    axisFormat %d/%m

    section 🏢 1. Alcance & Especificación
    Ingestión de PDF de Requerimientos (IA)         :done, des1, 2026-08-20, 2d
    Definición de Casos de Uso BDD (Humano + IA)    :done, des2, 2026-08-21, 3d
    Aprobación de Invariantes & C4 Model (TL)       :done, des3, after des2, 1d

    section 🤖 2. Ejecución Agéntica Aislada
    Montaje de Git Worktrees (IA subagent-1..3)     :done, dev1, 2026-08-24, 1d
    Implementación CatalogService (subagent-1)       :done, dev2, after dev1, 3d
    Implementación CartService & Shipping (subagent-2):done, dev3, after dev1, 3d
    Implementación OrderService & Stripe (subagent-3):done, dev4, after dev1, 4d

    section 🛡️ 3. Quality Gates & RSI
    Arnés SWE-bench Red -> Green (IA)              :done, qg1, after dev4, 2d
    Auditoría Fuzzing Adversarial (IA Red Team)     :done, qg2, after qg1, 1d
    Auto-Perf Loop (Δp95 >= 15%) (IA)               :done, qg3, after qg2, 1d
    Revisión Pre-Commit 7 Quality Gates (TL)        :done, qg4, after qg3, 1d

    section 🚀 4. Promoción & Despliegue
    Despliegue a QA Automatizado (IA Deployer)      :done, dep1, after qg4, 1d
    Validación en UAT / Staging (PO + Clientes)     :active, dep2, after dep1, 3d
    Sign-off de Negocio & Canary Deploy PROD (TL+PO):crit, dep3, after dep2, 2d
```

---

## 3. Matriz de Responsabilidades (RACI Humano-IA)

| Fase del SDLC | Agente IA | Desarrollador | Tech Lead | Product Owner |
| :--- | :---: | :---: | :---: | :---: |
| **Ingestión de Requerimientos** | **R** (Responsable) | **C** (Consultado) | **A** (Aprobador) | **I** (Informado) |
| **Diseño Arquitectónico (C4 / BCE)** | **R** (Genera borradores) | **C** (Revisa) | **A** (Valida fronteras) | **I** |
| **Codificación en Git Worktrees** | **R** (Autónomo) | **C** (Pair review) | **I** | **I** |
| **Verificación Determinista (Quality Gates)**| **R** (Ejecuta) | **I** | **A** (Supervisa) | **I** |
| **Aceptación Funcional (UAT)** | **I** | **C** | **C** | **A** (Sign-off final) |
| **Despliegue a Producción** | **R** (Pipeline `/deploy`) | **I** | **A** (Autoriza) | **I** |

*R = Responsible, A = Accountable, C = Consulted, I = Informed.*

---

## 4. Protocolo de Auditoría Post-Mortem y Rollback ante Alucinaciones

Si durante la ejecución un subagente alucina, rompe la arquitectura o introduce regresiones, el **Tech Lead** sigue este protocolo determinista:

```mermaid
flowchart TD
    FAIL["🚨 Alucinación o Fallo Detectado en Telemetría"] --> AUDIT["1. Abrir Mission Control (http://localhost:3333)\nIdentificar Evento Exacto y Timestamp"]
    AUDIT --> LOCATE["2. Localizar Checkpoint Git\n(Commit o Git Worktree del Subagente)"]
    LOCATE --> DECIDE{¿Afectó a Main o solo a Worktree?}
    DECIDE -- "Solo Worktree" --> KILL_WT["3a. git worktree remove --force .worktrees/subagent-X\nRama efímera descartada sin afectar main"]
    DECIDE -- "Commit en Main" --> ROLLBACK["3b. git revert $COMMIT_HASH\nRollback atómico determinista"]
    KILL_WT --> REFLEXION["4. Emitir Reflexion Prompt con Stacktrace al Agente"]
    ROLLBACK --> REFLEXION
    REFLEXION --> RETRY["5. Re-ejecución con Restricción Endurecida"]
```

### Comandos de Recuperación Rápida para el Tech Lead:
```bash
# 1. Inspeccionar el log de eventos estructurados
grep "ERROR" .agents/telemetry/events.jsonl | tail -n 5

# 2. Descartar un worktree corrupto de un subagente sin tocar el resto
git worktree remove --force .worktrees/subagent-2
git branch -D feat/task-002-cart

# 3. Forzar auto-curación arquitectónica
npm run rsi:drift
```
