# 🕸️ [NET-XXXX] Red de Trazabilidad y Dependencias de Casos de Uso

| Campo | Valor / Descripción |
| :--- | :--- |
| **Identificador:** | `NET-XXXX` (Formato `NET-XXXX`, inmutable y secuencial) |
| **Objetivo del Documento:** | Mapeo de trazabilidad end-to-end desde Requerimientos de Negocio hasta Commits de Subagentes |
| **Audiencia:** | Tech Leads, Product Owners, Arquitectos y Subagentes IA |
| **Última Actualización:** | Septiembre 2026 |

---

## 1. Propósito de la Red de Trazabilidad

Este artefacto ofrece al **Tech Lead** y a los **Stakeholders de Negocio** una vista panorámica inmediata de:
1. Cómo se fragmentaron los requerimientos de alto nivel en **Casos de Uso Funcionales (`UC-XXXX`)**.
2. Qué **Contrato de Tarea (`TASK-XXXX`)** y **Subagente IA** implementó cada funcionalidad.
3. Qué **Git Worktree**, **Suite de Tests** y **Commit Atómico** respalda el entregable.

---

## 2. Grafo de Red de Trazabilidad (Mermaid)

```mermaid
graph LR
    %% 1. Requerimientos de Negocio
    subgraph BUSINESS_LAYER["🏢 Capa de Negocio / Alcance"]
        REQ_CAT["REQ-001\nCatálogo Jerárquico\n(2,500 productos)"]
        REQ_CART["REQ-002\nCarrito Persistente\ny Envío Gratis ($50k)"]
        REQ_ORDER["REQ-003\nCheckout Transaccional\ncon Stripe Elements"]
    end

    %% 2. Casos de Uso Funcionales
    subgraph FUNCTIONAL_LAYER["🎯 Capa Funcional (Casos de Uso)"]
        UC_001["UC-001\nBúsqueda y Filtros\nde Catálogo"]
        UC_002["UC-002\nGestión de Carrito\ny Cálculo de Envío"]
        UC_003["UC-003\nProcesamiento de Pago\ny Bloqueo ACID"]
    end

    %% 3. Contratos de Tareas Agénticas
    subgraph AGENT_TASKS["🤖 Contratos de Tareas (.agents/tasks/)"]
        TASK_001["TASK-001\n(CatalogService.ts)\nAsignado: subagent-1"]
        TASK_002["TASK-002\n(CartService.ts)\nAsignado: subagent-2"]
        TASK_003["TASK-003\n(OrderService.ts)\nAsignado: subagent-3"]
    end

    %% 4. Aislamiento y Git Worktrees
    subgraph WORKTREES["🌿 Git Worktrees & Calidad"]
        WT_1[".worktrees/subagent-1\n(feat/task-001)"]
        WT_2[".worktrees/subagent-2\n(feat/task-002)"]
        WT_3[".worktrees/subagent-3\n(feat/task-003)"]
    end

    %% 5. Verificación Determinista y Entrega
    subgraph PRODUCTION_GATES["🛡️ Riel Duro & Entrega"]
        EVAL_1["catalog.test.mjs\n(100% PASSED)"]
        EVAL_2["cart.test.mjs\n(100% PASSED)"]
        EVAL_3["order.test.mjs\n(100% PASSED)"]
        MERGE["Fast-Forward Merge\nRama: main\nCommit Atómico"]
    end

    %% Relaciones de Trazabilidad
    REQ_CAT --> UC_001
    REQ_CART --> UC_002
    REQ_ORDER --> UC_003

    UC_001 --> TASK_001
    UC_002 --> TASK_002
    UC_003 --> TASK_003

    TASK_001 --> WT_1
    TASK_002 --> WT_2
    TASK_003 --> WT_3

    WT_1 --> EVAL_1
    WT_2 --> EVAL_2
    WT_3 --> EVAL_3

    EVAL_1 --> MERGE
    EVAL_2 --> MERGE
    EVAL_3 --> MERGE
```

---

## 3. Matriz de Auditoría y Estado de Trazabilidad

| ID Requerimiento | ID Caso de Uso | ID Tarea Agente | Subagente Dueño | Componente Afectado | Quality Gate Determinista | Estado Final |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **REQ-001** | [`UC-XXXX`](../../use-cases/UC-TEMPLATE.md) | `TASK-001` | `subagent-1` | `src/modules/catalog/` | `node --test catalog.test.mjs` | 🟢 VERIFIED |
| **REQ-002** | [`UC-002`](../../use-cases/UC-TEMPLATE.md) | `TASK-002` | `subagent-2` | `src/modules/cart/` | `node --test cart.test.mjs` | 🟢 VERIFIED |
| **REQ-003** | [`UC-003`](../../use-cases/UC-TEMPLATE.md) | `TASK-003` | `subagent-3` | `src/modules/orders/` | `node --test order.test.mjs` | 🟢 VERIFIED |

---

## 4. Guía para el Tech Lead: ¿Cómo auditar el avance?

1. **Revisión del Grafo:** Abre este diagrama para verificar si algún caso de uso tiene dependencias bloqueantes o circulares.
2. **Auditoría de Subagentes:** Consulta la tabla para saber con precisión qué subagente desarrolló cada módulo.
3. **Consistencia de Commits:** Cada commit atómico en `main` debe contener en su mensaje el formato:
   ```text
   feat(cart): [UC-002] [TASK-002] implement persistent cart and free shipping logic
   ```
