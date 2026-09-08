---
name: traceability-sync
description: Sincroniza la trazabilidad de 3 capas entre Requerimientos de Negocio, Casos de Uso, Tareas y Commits.
---

# 🕸️ Skill: Sincronizador de Trazabilidad 3-Capas (`/traceability-sync`)

Garantiza la consistencia bidireccional entre la **Capa de Negocio (3ra Capa)**, la **Capa de Desarrolladores (2da Capa)** y la **Capa Agéntica (1ra Capa)**.

---

## 🚀 Invocación por Slash Command
```text
/traceability-sync
```

## 🛠️ Procedimiento de Ejecución del Agente
1. Escanea todos los casos de uso en `docs/use-cases/UC-*.md`.
2. Escanea todos los contratos de tareas en `.agents/tasks/TASK-*.md`.
3. Actualiza el grafo de red en `docs/diagrams/use-case-network/NET-001-template.md`.
4. Verifica que no existan tareas huérfanas (sin caso de uso asociado) ni casos de uso aprobados sin asignación de subagente.
5. Comprueba la correlatividad de identificadores con:
   ```bash
   node scripts/validate-task-ids.mjs
   ```
